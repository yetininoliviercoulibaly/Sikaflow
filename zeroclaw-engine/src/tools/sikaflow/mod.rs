pub mod check_user_exists;
pub mod create_organization;
pub mod get_balance;
pub mod get_debts;
pub mod record_debt;
pub mod record_expense;
pub mod record_income;
pub mod remind_debt;
pub mod settle_debt;
pub mod switch_organization;
pub mod update_transaction_category;

use crate::memory::Memory;
use crate::tools::traits::Tool;
use std::sync::Arc;

pub fn sikaflow_tools(memory: Arc<dyn Memory>) -> Vec<Arc<dyn Tool>> {
    let api_url =
        std::env::var("SIKAFLOW_API_URL").unwrap_or_else(|_| "http://backend:3000".to_string());
    let api_key = std::env::var("SIKAFLOW_API_KEY").unwrap_or_else(|_| "".to_string());

    if api_key.is_empty() {
        tracing::warn!("SIKAFLOW_API_KEY is missing, SikaFlow tools may fail auth.");
    }

    vec![
        Arc::new(check_user_exists::CheckUserExistsTool::new(
            api_url.clone(),
            api_key.clone(),
            memory.clone(),
        )),
        Arc::new(create_organization::CreateOrganizationTool::new(
            api_url.clone(),
            api_key.clone(),
            memory.clone(),
        )),
        Arc::new(get_balance::GetBalanceTool::new(
            api_url.clone(),
            api_key.clone(),
            memory.clone(),
        )),
        Arc::new(get_debts::GetDebtsTool::new(
            api_url.clone(),
            api_key.clone(),
            memory.clone(),
        )),
        Arc::new(record_debt::RecordDebtTool::new(
            api_url.clone(),
            api_key.clone(),
            memory.clone(),
        )),
        Arc::new(record_expense::RecordExpenseTool::new(
            api_url.clone(),
            api_key.clone(),
            memory.clone(),
        )),
        Arc::new(record_income::RecordIncomeTool::new(
            api_url.clone(),
            api_key.clone(),
            memory.clone(),
        )),
        Arc::new(remind_debt::RemindDebtTool::new(
            api_url.clone(),
            api_key.clone(),
            memory.clone(),
        )),
        Arc::new(settle_debt::SettleDebtTool::new(
            api_url.clone(),
            api_key.clone(),
            memory.clone(),
        )),
        Arc::new(switch_organization::SwitchOrganizationTool::new(
            api_url.clone(),
            api_key.clone(),
            memory.clone(),
        )),
        Arc::new(
            update_transaction_category::UpdateTransactionCategoryTool::new(
                api_url, api_key, memory,
            ),
        ),
    ]
}
