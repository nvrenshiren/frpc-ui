use frpc_ui_desktop_lib::{commands, service::Service};
use serde_json::{json, Value};
use std::sync::Arc;

#[test]
fn ipc_preserves_empty_boot_save_errors_and_atomic_import() {
    let directory = tempfile::tempdir().unwrap();
    let service = Arc::new(Service::new(directory.path().to_path_buf()).unwrap());
    let app = tauri::test::mock_builder()
        .manage(service.clone())
        .invoke_handler(tauri::generate_handler![
            commands::get_snapshot,
            commands::save_profile,
            commands::import_configuration
        ])
        .build(tauri::test::mock_context(tauri::test::noop_assets()))
        .unwrap();
    let webview = tauri::WebviewWindowBuilder::new(&app, "main", Default::default())
        .build()
        .unwrap();
    let invoke = |cmd: &str, body: Value| {
        tauri::test::get_ipc_response(
            &webview,
            tauri::webview::InvokeRequest {
                cmd: cmd.into(),
                callback: tauri::ipc::CallbackFn(0),
                error: tauri::ipc::CallbackFn(1),
                url: "http://tauri.localhost".parse().unwrap(),
                body: tauri::ipc::InvokeBody::Json(body),
                headers: Default::default(),
                invoke_key: tauri::test::INVOKE_KEY.to_string(),
            },
        )
        .map(|response| response.deserialize::<Value>().unwrap())
    };
    let empty = invoke("get_snapshot", json!({})).unwrap();
    assert_eq!(empty["profiles"], json!([]));
    assert_eq!(empty["versions"], json!([]));
    assert!(empty.get("core").is_none());
    let (profile, tunnels) = frpc_core::config::parse_toml("serverAddr = '127.0.0.1'\nserverPort = 7000\n[[proxies]]\nname = 'ssh'\ntype = 'tcp'\nlocalPort = 22\nremotePort = 22022", "0.71.0", "IPC connection").unwrap();
    let saved = invoke("save_profile", json!({"profile": profile})).unwrap();
    assert_eq!(saved["profiles"].as_array().unwrap().len(), 1);
    let mut invalid = profile.clone();
    invalid.server_port = 0;
    assert!(invoke("save_profile", json!({"profile": invalid})).is_err());
    assert_eq!(service.core.snapshot().profiles[0].server_port, 7000);
    let imported = invoke(
        "import_configuration",
        json!({"profile": profile, "tunnels": tunnels}),
    )
    .unwrap();
    let profiles = imported["profiles"].as_array().unwrap();
    assert_eq!(profiles.len(), 2);
    assert_ne!(profiles[0]["id"], profiles[1]["id"]);
    assert_eq!(imported["tunnels"][0]["profileId"], profiles[1]["id"]);
    assert_eq!(profiles[1]["process"], "stopped");
}
