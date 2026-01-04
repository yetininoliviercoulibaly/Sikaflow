import { OnboardingStepId } from './onboarding-progress.entity';

/**
 * Value Object describing an onboarding step with its metadata.
 * Immutable configuration for each tutorial step.
 */
export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  description: string;
  requiredRoles: string[]; // Roles that must complete this step
  order: number;
  tipMessage: string; // WhatsApp message to send
  completionMessage: string; // Message sent when step is completed
}

/**
 * Default onboarding steps configuration.
 * Steps are filtered based on user role during onboarding.
 */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: OnboardingStepId.WELCOME,
    title: 'Bienvenue',
    description: 'Découvrez Event-Pilot',
    requiredRoles: ['OWNER', 'MANAGER', 'STAFF'],
    order: 1,
    tipMessage: `🎉 *Bienvenue sur Event-Pilot !*\n\nJe suis votre assistant intelligent pour gérer votre établissement.\n\n📝 *Étape 1/5* : Commençons par enregistrer une première dépense.\n\n👉 Essayez d'envoyer : "Achat de 10 sacs de glace pour 5000"`,
    completionMessage: `✅ Parfait ! Vous avez compris le principe !`,
  },
  {
    id: OnboardingStepId.CREATE_FIRST_TRANSACTION,
    title: 'Première Transaction',
    description: 'Enregistrer une dépense ou une recette',
    requiredRoles: ['OWNER', 'MANAGER', 'STAFF'],
    order: 2,
    tipMessage: `💰 *Étape 2/5* : Transactions\n\nVous pouvez enregistrer des dépenses et recettes de plusieurs façons :\n- En texte : "Dépense 50€ DJ"\n- En vocal 🎙️ : Maintenez le micro et parlez\n- En photo 📸 : Envoyez une photo de facture\n\n👉 Essayez maintenant !`,
    completionMessage: `✅ Transaction enregistrée avec succès !`,
  },
  {
    id: OnboardingStepId.ADD_TEAM_MEMBER,
    title: 'Ajouter un Membre',
    description: 'Inviter un collaborateur',
    requiredRoles: ['OWNER', 'MANAGER'],
    order: 3,
    tipMessage: `👥 *Étape 3/5* : Gestion d'Équipe\n\nDéléguez la saisie à vos collaborateurs.\n\n👉 Envoyez : "Ajoute le +33612345678 comme Staff"\n\nRôles disponibles :\n- *Manager* : Accès rapports + gestion équipe\n- *Staff* : Saisie uniquement`,
    completionMessage: `✅ Membre ajouté ! Il recevra une notification WhatsApp.`,
  },
  {
    id: OnboardingStepId.GENERATE_REPORT,
    title: 'Générer un Rapport',
    description: 'Obtenir un bilan PDF',
    requiredRoles: ['OWNER', 'MANAGER'],
    order: 4,
    tipMessage: `📊 *Étape 4/5* : Rapports\n\nObtenez un bilan instantané de votre activité.\n\n👉 Envoyez : "Rapport Flash"\n\nVous recevrez un PDF avec le résumé des transactions.`,
    completionMessage: `✅ Votre rapport est en cours de génération !`,
  },
  {
    id: OnboardingStepId.SUBSCRIBE,
    title: 'Activer l\'Abonnement',
    description: 'Débloquer toutes les fonctionnalités',
    requiredRoles: ['OWNER'],
    order: 5,
    tipMessage: `💎 *Étape 5/5* : Abonnement\n\nPour profiter de toutes les fonctionnalités premium :\n\n👉 Envoyez : "Abonnement"\n\nVous recevrez un lien de paiement sécurisé.`,
    completionMessage: `🎊 *Félicitations !* Vous avez terminé le tutoriel !\n\nVous êtes maintenant prêt à utiliser Event-Pilot comme un pro.\n\nEnvoyez "Aide" à tout moment pour voir les commandes disponibles.`,
  },
];

/**
 * Get onboarding steps filtered by user role.
 */
export function getStepsForRole(role: string): OnboardingStep[] {
  return ONBOARDING_STEPS
    .filter(step => step.requiredRoles.includes(role))
    .sort((a, b) => a.order - b.order);
}

/**
 * Get a specific step by its ID.
 */
export function getStepById(stepId: OnboardingStepId): OnboardingStep | undefined {
  return ONBOARDING_STEPS.find(step => step.id === stepId);
}
