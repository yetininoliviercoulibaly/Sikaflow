use crate::memory::Memory;
use crate::tools::traits::{Tool, ToolResult};
use async_trait::async_trait;
use serde_json::{json, Value};
use std::sync::Arc;

pub struct GetDebtsTool {
    api_url: String,
    api_key: String,
    #[allow(dead_code)]
    memory: Arc<dyn Memory>,
}

impl GetDebtsTool {
    pub fn new(api_url: String, api_key: String, memory: Arc<dyn Memory>) -> Self {
        Self {
            api_url,
            api_key,
            memory,
        }
    }
}

#[async_trait]
impl Tool for GetDebtsTool {
    fn name(&self) -> &str {
        "get_debts"
    }

    fn description(&self) -> &str {
        "Retourne la liste de toutes les créances en attente (personnes qui doivent de l'argent à l'utilisateur)."
    }

    fn parameters_schema(&self) -> Value {
        json!({
            "type": "object",
            "properties": {
                "phone_number": {
                    "type": "string",
                    "description": "Numéro de téléphone de l'utilisateur au format E.164"
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

        let encoded_phone = phone_number.replace("+", "%2B");
        let url = format!("{}/debts?phoneNumber={}", self.api_url, encoded_phone);

        let client = reqwest::Client::new();
        let res = client
            .get(&url)
            .header("X-API-Key", &self.api_key)
            .send()
            .await;

        match res {
            Ok(response) => {
                if response.status().is_success() {
                    Ok(ToolResult {
                        success: true,
                        output: response.text().await.unwrap_or_default(),
                        error: None,
                    })
                } else {
                    Ok(ToolResult {
                        success: false,
                        output: String::new(),
                        error: Some(format!("API Error {}", response.status())),
                    })
                }
            }
            Err(e) => Ok(ToolResult {
                success: false,
                output: String::new(),
                error: Some(e.to_string()),
            }),
        }
    }
}
