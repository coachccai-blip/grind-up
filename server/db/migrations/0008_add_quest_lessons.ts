import type { Migration } from '../migrate.js'

/**
 * Version 1.1 (rappel du cours et exemple expliqué).
 *
 * - quests.lesson : un bref rappel du cours, montré à l'élève avant la consigne.
 * - quests.example : un exemple expliqué de la méthode, montré après le rappel.
 *
 * Les deux sont facultatifs et mis en forme comme une consigne. Ils ne
 * contiennent aucune réponse attendue : l'élève les lit dès qu'il ouvre la
 * quête. Les quêtes déjà créées n'en ont pas.
 */
export const migration0008: Migration = {
  id: '0008_add_quest_lessons',
  sql: `
    ALTER TABLE quests ADD COLUMN lesson TEXT NOT NULL DEFAULT '';
    ALTER TABLE quests ADD COLUMN example TEXT NOT NULL DEFAULT '';
  `,
}
