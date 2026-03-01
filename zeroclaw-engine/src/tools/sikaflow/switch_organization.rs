use async_trait::async_trait;
use serde_json::{json, Value};
use crate::tools::traits::{Tool, ToolResult};
use crate::memory::{Memory, MemoryCategory};
use std::sync::Arc;

pub struct SwitchOrganizationTool {
    api_url: String,
    api_key: String,
    memory: Arc<dyn Memory>,
}

impl SwitchOrganizationTool {
    pub fn new(api_url: String, api_key: String, memory: Arc<dyn Memory>) -> Self {
        Self { api_url, api_key, memory }
    }
}

#[async_trait]
impl Tool for SwitchOrganizationTool {
    fn name(&self) -> &str {
        "switch_organization"
    }

    fn description(&self) -> &str {
        "Change l'organisation active de l'utilisateur. À utiliser quand l'utilisateur veut basculer \
        sur une autre organisation. Met à jour le contexte serveur ET la mémoire de session."
    }

    fn parameters_schema(&self) -> Value {
        json!({
            "type": "object",
            "properties": {
                "phone_number": {
                    "type": "string",
                    "description": "Numéro de téléphone ou identifiant Telegram de l'utilisateur"
                },
                "organization_name": {
                    "type": "string",
                    "description": "Nom de l'organisation cible (recherche approximative)"
                },
                "organization_id": {
                    "type": "string",
                    "description": "ID de l'organisation cible (si connu, prioritaire sur le nom)"
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

        let mut body = json!({
            "phoneNumber": phone_number,
        });

        if let Some(name) = args.get("organization_name").and_then(|v| v.as_str()) {
            if !name.is_empty() {
                body["organizationName"] = json!(name);
            }
        }

        if let Some(id) = args.get("organization_id").and_then(|v| v.as_str()) {
            if !id.is_empty() {
                body["organizationId"] = json!(id);
            }
        }

        let client = reqwest::Client::new();
        let url = format!("{}/organizations/switch", self.api_url);

        let res = client
            .patch(&url)
            .header("X-API-Key", &self.api_key)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await;

        match res {
            Ok(response) => {
                let status = response.status();
                if status.is_success() {
                    let text = response.text().await.unwrap_or_default();

                    // Update session memory with new active org
                    if let Ok(parsed) = serde_json::from_str::<Value>(&text) {
                        if let Some(org) = parsed.get("organization") {
                            if let Some(id) = org["id"].as_str() {
                                let _ = self.memory.store("session.activeOrgId", id, MemoryCategory::Core, None).await;
                            }
                            if let Some(name) = org["name"].as_str() {
                                let _ = self.memory.store("session.activeOrgName", name, MemoryCategory::Core, None).await;
                            }
                        }
                    }

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
            Err(e) => {
                Ok(ToolResult {
                    success: false,
                    output: String::new(),
                    error: Some(format!("Request failed: {}", e)),
                })
            }
        }
    }
}
