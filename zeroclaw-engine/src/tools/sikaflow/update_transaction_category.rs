use crate::memory::{Memory, MemoryCategory};
use crate::tools::traits::{Tool, ToolResult};
use async_trait::async_trait;
use serde_json::{json, Value};
use std::sync::Arc;

pub struct UpdateTransactionCategoryTool {
    api_url: String,
    api_key: String,
    memory: Arc<dyn Memory>,
}

impl UpdateTransactionCategoryTool {
    pub fn new(api_url: String, api_key: String, memory: Arc<dyn Memory>) -> Self {
        Self {
            api_url,
            api_key,
            memory,
        }
    }
}

#[async_trait]
impl Tool for UpdateTransactionCategoryTool {
    fn name(&self) -> &str {
        "update_transaction_category"
    }

    fn description(&self) -> &str {
        "Corrige la catégorie d'une transaction déjà enregistrée."
    }

    fn parameters_schema(&self) -> Value {
        json!({
            "type": "object",
            "properties": {
                "transaction_id": { "type": "string" },
                "category": { "type": "string" }
            },
            "required": ["transaction_id", "category"]
        })
    }

    async fn execute(&self, args: Value) -> anyhow::Result<ToolResult> {
        let transaction_id = args["transaction_id"].as_str().unwrap_or("");
        let category = args["category"].as_str().unwrap_or("");

        if transaction_id.is_empty() || category.is_empty() {
            return Ok(ToolResult {
                success: false,
                output: String::new(),
                error: Some("transaction_id and category required".into()),
            });
        }

        let body = json!({ "category": category });
        let url = format!("{}/transactions/{}/category", self.api_url, transaction_id);

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
                    let text = response.text().await.unwrap_or_default();
                    if let Ok(parsed) = serde_json::from_str::<Value>(&text) {
                        if let Some(c) = parsed["category"].as_str() {
                            let _ = self
                                .memory
                                .store(
                                    "session.lastTransactionCategory",
                                    c,
                                    MemoryCategory::Daily,
                                    None,
                                )
                                .await;
                        }
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
