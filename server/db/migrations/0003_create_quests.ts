import type { Migration } from '../migrate.js'

/**
 * Étape 3 (quêtes).
 *
 * - quests : une quête et ses réglages. `draft_assignees` garde, pour un
 *   brouillon, les élèves choisis ("all" ou une liste d'identifiants, en JSON) ;
 *   ils ne reçoivent la quête qu'à sa publication.
 * - quest_items : questions, questions de QCM ou cartes. `expected_answers` (JSON)
 *   contient les réponses acceptées, ou les positions des bons choix d'un QCM ;
 *   ces réponses ne quittent le serveur qu'une fois la quête validée.
 * - assignments : une ligne par couple quête / élève. Le statut « Expirée » n'est
 *   pas enregistré : il se déduit de la deadline à chaque lecture.
 * - attempts : une ligne par essai ou par soumission.
 * - xp_entries : journal d'XP. Une ligne n'est jamais modifiée ni supprimée ; une
 *   correction est une nouvelle ligne. `mission_delta` vaut 1 pour une quête
 *   validée, -1 pour une validation annulée : le nombre de missions est sa somme.
 */
export const migration0003: Migration = {
  id: '0003_create_quests',
  sql: `
    CREATE TABLE quests (
      id                TEXT PRIMARY KEY,
      title             TEXT NOT NULL,
      instructions      TEXT NOT NULL DEFAULT '',
      image_key         TEXT,
      category          TEXT NOT NULL CHECK (category IN ('maths', 'memorization', 'sport', 'other')),
      format            TEXT NOT NULL
                        CHECK (format IN ('exact', 'qcm', 'flashcards', 'declarative', 'free_text')),
      difficulty        TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'epic')),
      reward_xp         INTEGER NOT NULL CHECK (reward_xp >= 0),
      deadline_at       TEXT,
      manual_validation INTEGER NOT NULL CHECK (manual_validation IN (0, 1)),
      pass_threshold    INTEGER NOT NULL CHECK (pass_threshold BETWEEN 1 AND 100),
      max_attempts      INTEGER NOT NULL CHECK (max_attempts >= 1),
      state             TEXT NOT NULL CHECK (state IN ('draft', 'published', 'archived')),
      draft_assignees   TEXT NOT NULL DEFAULT '[]',
      author_id         TEXT REFERENCES users (id) ON DELETE SET NULL,
      created_at        TEXT NOT NULL,
      updated_at        TEXT NOT NULL,
      published_at      TEXT
    ) STRICT;

    CREATE TABLE quest_items (
      id               TEXT PRIMARY KEY,
      quest_id         TEXT NOT NULL REFERENCES quests (id) ON DELETE CASCADE,
      position         INTEGER NOT NULL,
      kind             TEXT NOT NULL CHECK (kind IN ('question', 'choice', 'card')),
      prompt           TEXT NOT NULL,
      expected_answers TEXT NOT NULL DEFAULT '[]',
      choices          TEXT NOT NULL DEFAULT '[]',
      UNIQUE (quest_id, position)
    ) STRICT;

    CREATE TABLE assignments (
      id             TEXT PRIMARY KEY,
      quest_id       TEXT NOT NULL REFERENCES quests (id) ON DELETE CASCADE,
      student_id     TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      status         TEXT NOT NULL
                     CHECK (status IN ('todo', 'in_progress', 'submitted', 'rejected', 'validated')),
      assigned_at    TEXT NOT NULL,
      started_at     TEXT,
      submitted_at   TEXT,
      validated_at   TEXT,
      xp_awarded     INTEGER,
      admin_comment  TEXT,
      extra_attempts INTEGER NOT NULL DEFAULT 0 CHECK (extra_attempts >= 0),
      reopened_at    TEXT,
      UNIQUE (quest_id, student_id)
    ) STRICT;

    CREATE INDEX assignments_by_student ON assignments (student_id);

    CREATE TABLE attempts (
      id            TEXT PRIMARY KEY,
      assignment_id TEXT NOT NULL REFERENCES assignments (id) ON DELETE CASCADE,
      number        INTEGER NOT NULL,
      answers       TEXT NOT NULL,
      score         INTEGER,
      results       TEXT NOT NULL DEFAULT '{}',
      created_at    TEXT NOT NULL,
      UNIQUE (assignment_id, number)
    ) STRICT;

    CREATE TABLE xp_entries (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      amount        INTEGER NOT NULL,
      reason        TEXT NOT NULL CHECK (reason IN ('quest', 'bonus', 'manual', 'bot')),
      detail        TEXT,
      assignment_id TEXT REFERENCES assignments (id) ON DELETE SET NULL,
      mission_delta INTEGER NOT NULL DEFAULT 0 CHECK (mission_delta IN (-1, 0, 1)),
      created_at    TEXT NOT NULL
    ) STRICT;

    CREATE INDEX xp_entries_by_user ON xp_entries (user_id, created_at);
    CREATE INDEX xp_entries_by_assignment ON xp_entries (assignment_id);
  `,
}
