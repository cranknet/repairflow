//! httpSMS Gateway Commands
//!
//! Provides HTTP-based SMS sending via the httpSMS.com API.
//! This is an alternative to hardware GSM modems.
//!
//! API Documentation: https://docs.httpsms.com

use serde::{Deserialize, Serialize};

/// Request payload for httpSMS API
#[derive(Serialize)]
struct HttpSmsRequest {
    content: String,
    from: String,
    to: String,
}

/// Response from httpSMS API
#[derive(Deserialize)]
#[allow(dead_code)]
struct HttpSmsResponse {
    status: String,
    message: Option<String>,
    data: Option<HttpSmsData>,
}

#[derive(Deserialize)]
#[allow(dead_code)]
struct HttpSmsData {
    id: Option<String>,
}

/// Send an SMS via httpSMS.com API
///
/// # Arguments
/// * `api_key` - Your httpSMS API key
/// * `from_phone` - Sender phone number (registered with httpSMS)
/// * `to_phone` - Recipient phone number
/// * `message` - SMS message content
#[tauri::command]
pub async fn send_sms_http(
    api_key: String,
    from_phone: String,
    to_phone: String,
    message: String,
) -> Result<bool, String> {
    let client = reqwest::Client::new();

    let request = HttpSmsRequest {
        content: message,
        from: from_phone,
        to: to_phone,
    };

    let response = client
        .post("https://api.httpsms.com/v1/messages/send")
        .header("x-api-key", &api_key)
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    let status = response.status();
    
    if status.is_success() {
        let result: HttpSmsResponse = response
            .json()
            .await
            .unwrap_or(HttpSmsResponse {
                status: "success".into(),
                message: None,
                data: None,
            });
        
        if result.status == "success" || result.status == "pending" {
            Ok(true)
        } else {
            Err(format!(
                "httpSMS error: {}",
                result.message.unwrap_or_else(|| "Unknown error".into())
            ))
        }
    } else {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".into());
        Err(format!("httpSMS API error ({}): {}", status, error_text))
    }
}

/// Check httpSMS API connectivity and key validity
#[tauri::command]
pub async fn check_httpsms_connection(api_key: String) -> Result<bool, String> {
    let client = reqwest::Client::new();

    let response = client
        .get("https://api.httpsms.com/v1/users/me")
        .header("x-api-key", &api_key)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if response.status().is_success() {
        Ok(true)
    } else if response.status() == 401 {
        Err("Invalid API key".into())
    } else {
        Err(format!("API error: {}", response.status()))
    }
}
