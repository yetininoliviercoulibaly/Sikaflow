use crate::memory::Memory;
use crate::tools::traits::{Tool, ToolResult};
use async_trait::async_trait;
use serde_json::{json, Value};
use std::sync::Arc;

pub struct RecordExpenseTool {
    api_url: String,
    api_key: String,
    #[allow(dead_code)]
    memory: Arc<dyn Memory>,
}

impl RecordExpenseTool {
    pub fn new(api_url: String, api_key: String, memory: Arc<dyn Memory>) -> Self {
        Self {
            api_url,
            api_key,
            memory,
        }
    }
}

#[async_trait]
impl Tool for RecordExpenseTool {
    fn name(&self) -> &str {
        "record_expense"
    }

    fn description(&self) -> &str {
        "Enregistre une dépense dans la caisse de l'organisation active."
    }

    fn parameters_schema(&self) -> Value {
        json!({
            "type": "object",
            "properties": {
                "phone_number": { "type": "string" },
                "amount": { "type": "number" },
                "category": { "type": "string" },
                "description": { "type": "string" }
            },
            "required": ["phone_number", "amount", "category"]
        })
    }

    async fn execute(&self, args: Value) -> anyhow::Result<ToolResult> {
        let mut body = json!({
            "phoneNumber": args["phone_number"],
            "amount": args["amount"],
            "type": "EXPENSE",
            "category": args["category"],
        });
        if let Some(v) = args.get("description") {
            body["description"] = v.clone();
        }

        let client = reqwest::Client::new();
        let url = format!("{}/transactions", self.api_url);

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
