use crate::memory::Memory;
use crate::tools::traits::{Tool, ToolResult};
use async_trait::async_trait;
use serde_json::{json, Value};
use std::sync::Arc;

pub struct CheckUserExistsTool {
    api_url: String,
    api_key: String,
    #[allow(dead_code)]
    memory: Arc<dyn Memory>,
}

impl CheckUserExistsTool {
    pub fn new(api_url: String, api_key: String, memory: Arc<dyn Memory>) -> Self {
        Self {
            api_url,
            api_key,
            memory,
        }
    }
}

#[async_trait]
impl Tool for CheckUserExistsTool {
    fn name(&self) -> &str {
        "check_user_exists"
    }

    fn description(&self) -> &str {
        "Vérifie si un utilisateur est déjà enregistré dans SikaFlow en cherchant \
        ses organisations par numéro de téléphone. Retourne une liste vide si \
        l'utilisateur est nouveau, ou la liste de ses organisations avec son rôle \
        dans chacune."
    }

    fn parameters_schema(&self) -> Value {
        json!({
            "type": "object",
            "properties": {
                "phone_number": {
                    "type": "string",
                    "description": "Numéro de téléphone de l'utilisateur au format E.164 (ex: +22507000000)"
                }
            },
            "required": ["phone_number"]
        })
    }

    async fn execute(&self, args: Value) -> anyhow::Result<ToolResult> {
        let phone_number = args["phone_number"].as_str().unwrap_or("");
        if phone_number.is_empty() {
            return Ok(ToolResult {
                success: false,
                output: String::new(),
                error: Some("phone_number is required".into()),
            });
        }

        // Fast replacement for E.164 URLs
        let encoded_phone = phone_number.replace("+", "%2B");
        let client = reqwest::Client::new();
        let url = format!(
            "{}/organizations?phoneNumber={}",
            self.api_url, encoded_phone
        );

        let res = client
            .get(&url)
            .header("X-API-Key", &self.api_key)
            .header("Content-Type", "application/json")
            .send()
            .await;

        match res {
            Ok(response) => {
                let status = response.status();
                if status.is_success() {
                    let text = response.text().await.unwrap_or_default();
                    Ok(ToolResult {
                        success: true,
                        output: text,
                        error: None,
                    })
                } else {
                    let text = response.text().await.unwrap_or_default();
                    Ok(ToolResult {
                        success: false,
                        output: String::new(),
                        error: Some(format!("API Error {}: {}", status, text)),
                    })
                }
            }
            Err(e) => Ok(ToolResult {
                success: false,
                output: String::new(),
                error: Some(format!("Request failed: {}", e)),
            }),
        }
    }
}
