use crate::memory::Memory;
use crate::tools::traits::{Tool, ToolResult};
use async_trait::async_trait;
use serde_json::{json, Value};
use std::sync::Arc;

pub struct SettleDebtTool {
    api_url: String,
    api_key: String,
    #[allow(dead_code)]
    memory: Arc<dyn Memory>,
}

impl SettleDebtTool {
    pub fn new(api_url: String, api_key: String, memory: Arc<dyn Memory>) -> Self {
        Self {
            api_url,
            api_key,
            memory,
        }
    }
}

#[async_trait]
impl Tool for SettleDebtTool {
    fn name(&self) -> &str {
        "settle_debt"
    }

    fn description(&self) -> &str {
        "Enregistre le remboursement total ou partiel d'une créance."
    }

    fn parameters_schema(&self) -> Value {
        json!({
            "type": "object",
            "properties": {
                "phone_number": { "type": "string" },
                "short_id": { "type": "string" },
                "amount": { "type": "number", "description": "Montant remboursé en FCFA" }
            },
            "required": ["phone_number", "short_id"]
        })
    }

    async fn execute(&self, args: Value) -> anyhow::Result<ToolResult> {
        let phone_number = args["phone_number"].as_str().unwrap_or("");
        let short_id = args["short_id"].as_str().unwrap_or("");

        if phone_number.is_empty() || short_id.is_empty() {
            return Ok(ToolResult {
                success: false,
                output: String::new(),
                error: Some("phone_number and short_id required".into()),
            });
        }

        let mut body = json!({ "phoneNumber": phone_number });
        if let Some(amt) = args.get("amount") {
            body["amount"] = amt.clone();
        }

        let url = format!("{}/debts/{}/settle", self.api_url, short_id);

        let client = reqwest::Client::new();
        let res = client
            .patch(&url)
            .header("X-API-Key", &self.api_key)
            .header("Content-Type", "application/json")
            .json(&body)
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
