import type { Migration } from '../migrate.js'

/**
 * Version 1.1 (corrections détaillées).
 *
 * - quest_items.explanation : la correction détaillée d'une question, rédigée par
 *   l'admin ou venue d'un exercice de la bibliothèque. Comme les réponses
 *   attendues, elle ne quitte le serveur qu'une fois la quête validée. Les
 *   questions déjà créées n'en ont pas : la colonne vaut alors une chaîne vide.
 */
export const migration0007: Migration = {
  id: '0007_add_item_explanations',
  sql: `
    ALTER TABLE quest_items ADD COLUMN explanation TEXT NOT NULL DEFAULT '';
  `,
}
