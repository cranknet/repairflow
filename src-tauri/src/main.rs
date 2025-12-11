//! RepairFlow Tauri Application
//!
//! Desktop wrapper for the RepairFlow repair shop management system.
//! Provides native functionality for:
//! - Serial port SMS via GSM modems
//! - httpSMS gateway integration
//! - Custom database location
//! - Native file system access

#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;

use commands::{filesystem, httpsms, serial};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            // Serial port commands
            serial::list_serial_ports,
            serial::send_sms_serial,
            // httpSMS commands
            httpsms::send_sms_http,
            httpsms::check_httpsms_connection,
            // Filesystem commands
            filesystem::get_default_database_path,
            filesystem::validate_database_path,
            filesystem::get_log_directory,
            filesystem::read_config_file,
            filesystem::write_config_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
