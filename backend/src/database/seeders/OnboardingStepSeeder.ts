import { Seeder } from '@mikro-orm/seeder';
import { EntityManager } from '@mikro-orm/core';
import { OnboardingStepConfigSchema } from '../../onboarding/infrastructure/persistence/onboarding-step-config.schema';
import { OnboardingStepId } from '../../onboarding/domain/onboarding-progress.entity';
import { OnboardingStepConfig } from '../../onboarding/domain/onboarding-step-config.entity';
import { v4 as uuidv4 } from 'uuid';

export class OnboardingStepSeeder extends Seeder {

  async run(em: EntityManager): Promise<void> {
    const steps = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        stepId: OnboardingStepId.WELCOME,
        planId: null, // Base step
        title: 'Bienvenue sur SikaFlow',
        description: 'Découvrez comment gérer vos événements simplement.',
        tipMessage: 'Envoyez "Aide" pour voir les commandes disponibles.',
        completionMessage: 'Bienvenue à bord ! Passons à la suite.',
        requiredRoles: ['OWNER', 'MANAGER'],
        order: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        stepId: OnboardingStepId.CREATE_FIRST_TRANSACTION,
        planId: null,
        title: 'Première Transaction',
        description: 'Enregistrez votre première vente ou dépense.',
        tipMessage: 'Envoyez une photo de votre reçu ou tapez "Vente 5000 Boissons".',
        completionMessage: 'Bravo ! Votre première transaction est enregistrée.',
        requiredRoles: ['OWNER', 'MANAGER', 'STAFF'],
        order: 20,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '66666666-6666-6666-6666-666666666666',
        stepId: OnboardingStepId.TRACK_FIRST_DEBT,
        planId: null,
        title: 'Première Créance',
        description: 'Enregistrez votre première créance ou dette.',
        tipMessage: 'Envoyez "Bakary me doit 5000" pour suivre une créance.',
        completionMessage: 'Bravo ! Vous maîtrisez le recouvrement.',
        requiredRoles: ['OWNER', 'MANAGER', 'STAFF'],
        order: 25,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        stepId: OnboardingStepId.ADD_TEAM_MEMBER,
        planId: null,
        title: 'Inviter un Membre',
        description: 'Ajoutez un collaborateur à votre organisation.',
        tipMessage: 'Utilisez la commande "Ajouter membre [Numéro]".',
        completionMessage: 'Équipe agrandie ! Plus on est de fous, plus on gère.',
        requiredRoles: ['OWNER', 'MANAGER'],
        order: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        stepId: OnboardingStepId.GENERATE_REPORT,
        planId: null,
        title: 'Générer un Rapport',
        description: 'Visualisez vos performances en un clic.',
        tipMessage: 'Tapez "Rapport" pour recevoir votre bilan PDF.',
        completionMessage: 'Vous maîtrisez maintenant le reporting !',
        requiredRoles: ['OWNER', 'MANAGER'],
        order: 40,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        stepId: OnboardingStepId.SUBSCRIBE,
        planId: null,
        title: 'Activer un Abonnement',
        description: 'Passez au niveau supérieur (Illimité).',
        tipMessage: 'Tapez "Abonnement" pour voir nos offres.',
        completionMessage: 'Merci pour votre confiance ! Profitez de SikaFlow illimité.',
        requiredRoles: ['OWNER'],
        order: 50,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    for (const step of steps) {
        // Using raw SQL upsert like behavior or findOne then persist
        const existing = await em.findOne(OnboardingStepConfigSchema, { stepId: step.stepId, planId: step.planId });
        if (!existing) {
             em.create(OnboardingStepConfigSchema, step as any);
        } else {
             em.assign(existing, step);
        }
    }
  }
}
