use async_trait::async_trait;
use serde_json::{json, Value};
use crate::tools::traits::{Tool, ToolResult};
use crate::memory::{Memory, MemoryCategory};
use std::sync::Arc;

pub struct CreateOrganizationTool {
    api_url: String,
    api_key: String,
    memory: Arc<dyn Memory>,
}

impl CreateOrganizationTool {
    pub fn new(api_url: String, api_key: String, memory: Arc<dyn Memory>) -> Self {
        Self { api_url, api_key, memory }
    }
}

#[async_trait]
impl Tool for CreateOrganizationTool {
    fn name(&self) -> &str {
        "create_organization"
    }

    fn description(&self) -> &str {
        "Crée l'espace business de l'utilisateur après la collecte des informations d'onboarding. \
        À appeler uniquement quand onboarding.infoComplete = true. \
        Après succès, met à jour la mémoire session.* et confirme à l'utilisateur."
    }

    fn parameters_schema(&self) -> Value {
        json!({
            "type": "object",
            "properties": {
                "business_name": {
                    "type": "string",
                    "description": "Nom du business (depuis onboarding.businessName en mémoire)"
                },
                "business_type": {
                    "type": "string",
                    "description": "Type d'activité normalisé (depuis onboarding.businessType en mémoire)"
                },
                "phone_number": {
                    "type": "string",
                    "description": "Numéro de téléphone de l'utilisateur au format E.164"
                },
                "telegram_user_id": {
                    "type": "string",
                    "description": "Identifiant unique Telegram de l'utilisateur (numérique). Permet de lier le compte Telegram au compte SikaFlow."
                }
            },
            "required": ["business_name", "phone_number"]
        })
    }

    async fn execute(&self, args: Value) -> anyhow::Result<ToolResult> {
        let business_name = args["business_name"].as_str().unwrap_or("");
        let phone_number = args["phone_number"].as_str().unwrap_or("");
        
        if business_name.is_empty() || phone_number.is_empty() {
            return Ok(ToolResult {
                success: false,
                output: String::new(),
                error: Some("business_name and phone_number are required".into()),
            });
        }

        let mut body = json!({
            "name": business_name,
            "userPhoneNumber": phone_number,
        });

        if let Some(bt) = args.get("business_type").and_then(|v| v.as_str()) {
            body["businessType"] = json!(bt);
        }

        if let Some(tg_id) = args.get("telegram_user_id").and_then(|v| v.as_str()) {
            let cleaned: String = tg_id.chars().filter(|c| c.is_ascii_digit()).collect();
            if !cleaned.is_empty() {
                body["telegramUserId"] = json!(cleaned);
            }
        }

        let client = reqwest::Client::new();
        let url = format!("{}/organizations", self.api_url);
        
        let res = client.post(&url)
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
                    
                    if let Ok(parsed) = serde_json::from_str::<Value>(&text) {
                        if let Some(id) = parsed["id"].as_str() {
                            let _ = self.memory.store("session.activeOrgId", id, MemoryCategory::Core, None).await;
                        }
                        if let Some(name) = parsed["name"].as_str() {
                            let _ = self.memory.store("session.activeOrgName", name, MemoryCategory::Core, None).await;
                        }
                        let _ = self.memory.store("session.activeOrgRole", "OWNER", MemoryCategory::Core, None).await;
                    }

                    // Cache phone number for Telegram sessions to avoid re-identification
                    if !phone_number.is_empty() {
                        let _ = self.memory.store("session.userPhoneNumber", phone_number, MemoryCategory::Core, None).await;
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
