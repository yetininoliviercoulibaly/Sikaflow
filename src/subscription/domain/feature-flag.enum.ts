/**
 * Feature Flags for subscription-based feature activation.
 * Each flag represents a feature that can be enabled/disabled per organization.
 */
export enum FeatureFlag {
  // Core Features (always active for all plans)
  TRANSACTIONS = 'TRANSACTIONS',
  BASIC_REPORTS = 'BASIC_REPORTS',

  // Premium Features (enabled based on subscription plan)
  ONBOARDING_AGENT = 'ONBOARDING_AGENT',
  ADVANCED_ANALYTICS = 'ADVANCED_ANALYTICS',
  INCIDENT_COMPLIANCE = 'INCIDENT_COMPLIANCE',
  STOCK_MANAGEMENT = 'STOCK_MANAGEMENT',
  FINANCIAL_RECONCILIATION = 'FINANCIAL_RECONCILIATION',
  MULTI_ORGANIZATION = 'MULTI_ORGANIZATION',
}
