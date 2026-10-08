#[doc(hidden)]
pub mod commands;
#[doc(hidden)]
pub mod service;

use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};

use frpc_core::RunAction;
use service::Service;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

fn show_main(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

pub fn run() {
    // Exercise the packaged WebView and complete IPC dispatcher without reading
    // user configuration or changing system autostart registration.
    let smoke_directory = std::env::args()
        .any(|argument| argument == "--smoke-test")
        .then(|| {
            tempfile::Builder::new()
                .prefix("frpc-ui-smoke-")
                .tempdir()
                .expect("Unable to create smoke-test directory")
        });
    let smoke_data_dir = smoke_directory
        .as_ref()
        .map(|directory| directory.path().to_path_buf());
    let smoke = smoke_data_dir.is_some();
    let shutdown_done = Arc::new(AtomicBool::new(false));
    let mut builder = tauri::Builder::default();
    if !smoke {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _, _| {
            show_main(app)
        }));
    }
    let app = builder
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
        .setup(move |app| {
            let mut data_dir = smoke_data_dir.clone().unwrap_or(app.path().app_data_dir()?);
            if !smoke && cfg!(debug_assertions) {
                if let Some(override_dir) = std::env::var_os("FRPC_UI_DATA_DIR") {
                    data_dir = std::path::PathBuf::from(override_dir);
                }
            }
            let service = Arc::new(Service::new(data_dir).map_err(std::io::Error::other)?);
            let mut settings = service.settings();
            if !smoke {
                if let Ok(registered) =
                    tauri_plugin_autostart::ManagerExt::autolaunch(app.handle()).is_enabled()
                {
                    if settings.auto_start != registered {
                        settings.auto_start = registered;
                        service.core.set_settings(settings.clone())?;
                    }
                }
            }
            app.manage(service.clone());
            let show = MenuItem::with_id(app, "show", "显示工作台 / Show", true, None::<&str>)?;
            let stop =
                MenuItem::with_id(app, "stop", "停止所有连接 / Stop all", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "退出 / Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &stop, &quit])?;
            let icon = app
                .default_window_icon()
                .cloned()
                .ok_or_else(|| std::io::Error::other("App icon is missing"))?;
            TrayIconBuilder::with_id("main-tray")
                .icon(icon)
                .tooltip("frpc-ui · 连接工作台")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => show_main(app),
                    "stop" => {
                        let service = app.state::<Arc<Service>>().inner().clone();
                        tauri::async_runtime::spawn(async move {
                            let ids = service
                                .core
                                .snapshot()
                                .profiles
                                .into_iter()
                                .map(|profile| profile.id)
                                .collect();
                            service.run(ids, RunAction::Stop).await;
                        });
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if matches!(
                        event,
                        TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } | TrayIconEvent::DoubleClick {
                            button: MouseButton::Left,
                            ..
                        }
                    ) {
                        show_main(tray.app_handle());
                    }
                })
                .build(app)?;
            if smoke
                || (settings.silent_start
                    && std::env::args().any(|argument| argument == "--autostart"))
            {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            }
            if smoke {
                let app_handle = app.handle().clone();
                let smoke_service = service.clone();
                tauri::async_runtime::spawn(async move {
                    let deadline = std::time::Instant::now() + std::time::Duration::from_secs(20);
                    while !smoke_service.ipc_ready.load(Ordering::SeqCst)
                        && std::time::Instant::now() < deadline
                    {
                        tokio::time::sleep(std::time::Duration::from_millis(50)).await;
                    }
                    if smoke_service.ipc_ready.load(Ordering::SeqCst) {
                        eprintln!("FRPC_UI_SMOKE_READY");
                        tokio::time::sleep(std::time::Duration::from_secs(3)).await;
                    } else {
                        eprintln!("FRPC_UI_SMOKE_FAILED: snapshot IPC timed out");
                    }
                    app_handle.exit(0);
                });
            }
            tauri::async_runtime::spawn(async move {
                let ids = service
                    .core
                    .snapshot()
                    .profiles
                    .into_iter()
                    .filter(|profile| profile.auto_connect)
                    .map(|profile| profile.id)
                    .collect();
                service.run(ids, RunAction::Start).await;
            });
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                if window.state::<Arc<Service>>().settings().close_to_tray {
                    let _ = window.hide();
                } else {
                    window.app_handle().exit(0);
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_snapshot,
            commands::save_profile,
            commands::delete_profile,
            commands::save_tunnel,
            commands::delete_tunnels,
            commands::toggle_tunnels,
            commands::import_configuration,
            commands::run_profiles,
            commands::set_settings,
            commands::refresh_versions,
            commands::install_version,
            commands::remove_version,
            commands::import_version,
            commands::preview_legacy,
            commands::import_legacy
        ])
        .build(tauri::generate_context!())
        .expect("Unable to initialize frpc-ui");
    let handle_event = move |app: &tauri::AppHandle, event: tauri::RunEvent| {
        if let tauri::RunEvent::ExitRequested { api, .. } = event {
            if !shutdown_done.load(Ordering::SeqCst) {
                api.prevent_exit();
                let service = app.state::<Arc<Service>>().inner().clone();
                if service.closing.swap(true, Ordering::SeqCst) {
                    return;
                }
                let app = app.clone();
                let shutdown_done = shutdown_done.clone();
                tauri::async_runtime::spawn(async move {
                    let _guard = service.mutation.lock().await;
                    service.core.shutdown().await;
                    shutdown_done.store(true, Ordering::SeqCst);
                    app.exit(0);
                });
            }
        }
    };
    if smoke {
        let exit_code = app.run_return(handle_event);
        drop(smoke_directory);
        std::process::exit(exit_code);
    } else {
        app.run(handle_event);
    }
}
