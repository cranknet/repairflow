//! Serial Port SMS Commands
//!
//! Provides native serial port access for GSM modems to send SMS messages.
//! Uses AT commands to communicate with the modem.

use serialport::{available_ports, SerialPortType};
use std::io::{Read, Write};
use std::time::Duration;

/// Represents a COM port with metadata
#[derive(serde::Serialize, Clone)]
pub struct COMPort {
    pub path: String,
    pub manufacturer: Option<String>,
    pub serial_number: Option<String>,
    pub pnp_id: Option<String>,
    pub port_type: String,
}

/// List all available serial ports on the system
#[tauri::command]
pub fn list_serial_ports() -> Result<Vec<COMPort>, String> {
    let ports = available_ports().map_err(|e| format!("Failed to list ports: {}", e))?;

    Ok(ports
        .iter()
        .map(|p| {
            let (manufacturer, serial_number, pnp_id, port_type) = match &p.port_type {
                SerialPortType::UsbPort(info) => (
                    info.manufacturer.clone(),
                    info.serial_number.clone(),
                    info.product.clone(),
                    "USB".to_string(),
                ),
                SerialPortType::PciPort => (None, None, None, "PCI".to_string()),
                SerialPortType::BluetoothPort => (None, None, None, "Bluetooth".to_string()),
                _ => (None, None, None, "Unknown".to_string()),
            };

            COMPort {
                path: p.port_name.clone(),
                manufacturer,
                serial_number,
                pnp_id,
                port_type,
            }
        })
        .collect())
}

/// Send an SMS message via a GSM modem connected to a serial port
///
/// # Arguments
/// * `port_path` - The COM port path (e.g., "COM3" on Windows)
/// * `phone_number` - Recipient phone number
/// * `message` - SMS message content
/// * `baud_rate` - Serial port baud rate (default: 9600)
#[tauri::command]
pub async fn send_sms_serial(
    port_path: String,
    phone_number: String,
    message: String,
    baud_rate: Option<u32>,
) -> Result<bool, String> {
    let baud = baud_rate.unwrap_or(9600);

    // Run serial operations in a blocking task
    tokio::task::spawn_blocking(move || {
        // Open serial port
        let mut port = serialport::new(&port_path, baud)
            .timeout(Duration::from_secs(30))
            .open()
            .map_err(|e| format!("Failed to open port {}: {}", port_path, e))?;

        // Helper to send command and wait
        let send_cmd = |port: &mut Box<dyn serialport::SerialPort>, cmd: &str, delay_ms: u64| -> Result<(), String> {
            port.write_all(cmd.as_bytes())
                .map_err(|e| format!("Write error: {}", e))?;
            std::thread::sleep(Duration::from_millis(delay_ms));
            Ok(())
        };

        // Initialize GSM modem with AT commands
        send_cmd(&mut port, "AT\r\n", 500)?; // Test connection
        send_cmd(&mut port, "AT+CMGF=1\r\n", 500)?; // Set SMS text mode
        send_cmd(&mut port, "AT+CNMI=2,2,0,0,0\r\n", 500)?; // Set notification mode

        // Set recipient
        let recipient_cmd = format!("AT+CMGS=\"{}\"\r\n", phone_number);
        send_cmd(&mut port, &recipient_cmd, 1000)?;

        // Send message with Ctrl+Z (0x1A) terminator
        let msg_with_term = format!("{}\x1A", message);
        port.write_all(msg_with_term.as_bytes())
            .map_err(|e| format!("Failed to send message: {}", e))?;

        // Wait for response
        std::thread::sleep(Duration::from_secs(5));

        // Read response
        let mut buf = [0u8; 256];
        let n = port.read(&mut buf).unwrap_or(0);
        let response = String::from_utf8_lossy(&buf[..n]);

        if response.contains("OK") || response.contains("+CMGS:") {
            Ok(true)
        } else if response.contains("ERROR") {
            Err(format!("SMS failed: {}", response.trim()))
        } else {
            // Assume success if no explicit error
            Ok(true)
        }
    })
    .await
    .map_err(|e| format!("Task error: {}", e))?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_list_ports() {
        // This test just ensures the function doesn't panic
        let result = list_serial_ports();
        assert!(result.is_ok());
    }
}
