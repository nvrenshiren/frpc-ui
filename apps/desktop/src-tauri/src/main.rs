#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    if let Err(error) = frpc_ui_desktop_lib::run() {
        eprintln!("Unable to initialize frpc-ui: {error}");
        std::process::exit(1);
    }
}
