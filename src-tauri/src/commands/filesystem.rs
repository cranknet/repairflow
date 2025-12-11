//! Filesystem Commands
//!
//! Provides native filesystem access for:
//! - Custom database location selection
//! - Log file access
//! - Backup/restore operations

use std::path::PathBuf;
use tauri::Manager;

/// Get the default database path in app data directory
#[tauri::command]
pub fn get_default_database_path(app: tauri::AppHandle) -> Result<String, String> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    let db_path = app_data.join("repairflow.db");
    Ok(db_path.to_string_lossy().to_string())
}

/// Set a custom database path (validates the path exists or can be created)
#[tauri::command]
pub async fn validate_database_path(path: String) -> Result<bool, String> {
    let path_buf = PathBuf::from(&path);

    // Check if parent directory exists or can be created
    if let Some(parent) = path_buf.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Cannot create directory: {}", e))?;
        }
    }

    // Try to create/open the file to verify write access
    let test_file = if path_buf.exists() {
        std::fs::OpenOptions::new()
            .write(true)
            .open(&path_buf)
    } else {
        std::fs::File::create(&path_buf)
    };

    match test_file {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Cannot write to path: {}", e)),
    }
}

/// Open a file dialog to select database location
/// Note: Requires tauri-plugin-dialog, currently returns None
#[tauri::command]
pub async fn select_database_path(_app: tauri::AppHandle) -> Result<Option<String>, String> {
    // Dialog plugin not installed yet - return None
    // TODO: Install tauri-plugin-dialog for file picker
    Ok(None)
}

/// Get the app's log directory
#[tauri::command]
pub fn get_log_directory(app: tauri::AppHandle) -> Result<String, String> {
    let log_dir = app
        .path()
        .app_log_dir()
        .map_err(|e| format!("Failed to get log dir: {}", e))?;

    Ok(log_dir.to_string_lossy().to_string())
}

/// Read environment configuration from a local config file
#[tauri::command]
pub fn read_config_file(app: tauri::AppHandle) -> Result<String, String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config dir: {}", e))?;

    let config_file = config_dir.join("config.json");

    if config_file.exists() {
        std::fs::read_to_string(&config_file)
            .map_err(|e| format!("Failed to read config: {}", e))
    } else {
        // Return empty config if file doesn't exist
        Ok("{}".to_string())
    }
}

/// Write environment configuration to a local config file
#[tauri::command]
pub fn write_config_file(app: tauri::AppHandle, config: String) -> Result<(), String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config dir: {}", e))?;

    // Ensure config directory exists
    std::fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config dir: {}", e))?;

    let config_file = config_dir.join("config.json");

    std::fs::write(&config_file, config)
        .map_err(|e| format!("Failed to write config: {}", e))
}
