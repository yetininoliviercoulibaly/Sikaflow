use crate::memory::{Memory, MemoryCategory};
use crate::tools::traits::{Tool, ToolResult};
use async_trait::async_trait;
use serde_json::{json, Value};
use std::sync::Arc;

pub struct RecordDebtTool {
    api_url: String,
    api_key: String,
    memory: Arc<dyn Memory>,
}

impl RecordDebtTool {
    pub fn new(api_url: String, api_key: String, memory: Arc<dyn Memory>) -> Self {
        Self {
            api_url,
            api_key,
            memory,
        }
    }
}

#[async_trait]
impl Tool for RecordDebtTool {
    fn name(&self) -> &str {
        "record_debt"
    }

    fn description(&self) -> &str {
        "Enregistre une créance (argent que quelqu'un DOIT à l'utilisateur)."
    }

    fn parameters_schema(&self) -> Value {
        json!({
            "type": "object",
            "properties": {
                "phone_number": { "type": "string" },
                "amount": { "type": "number", "description": "Montant de la dette" },
                "contact_name": { "type": "string" },
                "contact_phone": { "type": "string" },
                "description": { "type": "string" }
            },
            "required": ["phone_number", "amount", "contact_name"]
        })
    }

    async fn execute(&self, args: Value) -> anyhow::Result<ToolResult> {
        let phone_number = args["phone_number"].as_str().unwrap_or("");
        if phone_number.is_empty() {
            return Ok(ToolResult {
                success: false,
                output: String::new(),
                error: Some("phone_number required".into()),
            });
        }

        let mut body = json!({
            "phoneNumber": phone_number,
            "amount": args["amount"],
            "contactName": args["contact_name"],
        });

        if let Some(v) = args.get("contact_phone").and_then(|v| v.as_str()) {
            body["contactPhone"] = json!(v);
        }
        if let Some(v) = args.get("description").and_then(|v| v.as_str()) {
            body["description"] = json!(v);
        }

        let client = reqwest::Client::new();
        let url = format!("{}/debts", self.api_url);

        let res = client
            .post(&url)
            .header("X-API-Key", &self.api_key)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await;

        match res {
            Ok(response) => {
                if response.status().is_success() {
                    let text = response.text().await.unwrap_or_default();
                    if let Ok(parsed) = serde_json::from_str::<Value>(&text) {
                        if let Some(dn) = parsed["displayName"].as_str() {
                            let _ = self
                                .memory
                                .store(
                                    "session.lastDebtContactName",
                                    dn,
                                    MemoryCategory::Daily,
                                    None,
                                )
                                .await;
                        }
                        if let Some(si) = parsed["shortId"].as_str() {
                            let _ = self
                                .memory
                                .store(
                                    "session.lastDebtContactShortId",
                                    si,
                                    MemoryCategory::Daily,
                                    None,
                                )
                                .await;
                        }
                        let amt = args["amount"].to_string();
                        let _ = self
                            .memory
                            .store("session.lastDebtAmount", &amt, MemoryCategory::Daily, None)
                            .await;
                    }
                    Ok(ToolResult {
                        success: true,
                        output: text,
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
