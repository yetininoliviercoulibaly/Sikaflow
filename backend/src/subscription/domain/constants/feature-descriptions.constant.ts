import { FeatureFlag } from '../feature-flag.enum';

export const FEATURE_DESCRIPTIONS: Record<FeatureFlag, string> = {
    [FeatureFlag.TRANSACTIONS]: "Gestion des Dépenses & Recettes",
    [FeatureFlag.BASIC_REPORTS]: "Rapports de base",
    [FeatureFlag.ONBOARDING_AGENT]: "Assistant d'intégration",
    [FeatureFlag.ADVANCED_ANALYTICS]: "Analyses Financières Avancées (Bilan Hebdo)",
    [FeatureFlag.INCIDENT_COMPLIANCE]: "Signalement d'Incidents & Sécurité",
    [FeatureFlag.STOCK_MANAGEMENT]: "Gestion Événements & Billetterie",
    [FeatureFlag.FINANCIAL_RECONCILIATION]: "Gestion des Dettes & Recouvrement",
    [FeatureFlag.MULTI_ORGANIZATION]: "Gestion Multi-Club",
};
