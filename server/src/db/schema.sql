-- ============================================================
-- Schéma PostgreSQL de CAMPUS LIFE
-- Relancer ce fichier ne casse rien : "IF NOT EXISTS" partout.
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending')),
  info          TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS courses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  day        TEXT NOT NULL CHECK (day IN ('Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi')),
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL,
  room       TEXT NOT NULL DEFAULT '',
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority    TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  due_date    DATE,
  done        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'Divers',
  author_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  subject     TEXT NOT NULL DEFAULT '',
  type        TEXT NOT NULL DEFAULT 'Lien',
  url         TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  author_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedbacks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  status     TEXT NOT NULL CHECK (status IN ('flou','question','compris')),
  message    TEXT NOT NULL,
  resolved   BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel    TEXT NOT NULL DEFAULT 'general',  -- 'general' ou l'id d'un cours
  author_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exams (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  exam_date  DATE NOT NULL,
  start_time TIME NOT NULL,
  room       TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Réactions et commentaires partagés par les annonces et les retours de cours.
CREATE TABLE IF NOT EXISTS reactions (
  target_type TEXT NOT NULL CHECK (target_type IN ('announcement','feedback')),
  target_id   UUID NOT NULL,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('like','love')),
  PRIMARY KEY (target_type, target_id, user_id, kind)
);

CREATE TABLE IF NOT EXISTS comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('announcement','feedback')),
  target_id   UUID NOT NULL,
  author_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_owner     ON tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_course ON feedbacks(course_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel, created_at);
CREATE INDEX IF NOT EXISTS idx_exams_date       ON exams(exam_date);
CREATE INDEX IF NOT EXISTS idx_comments_target  ON comments(target_type, target_id);

-- ============================================================
-- Filières, niveaux et civilités (ajouts : sans danger sur une base existante)
-- ============================================================
CREATE TABLE IF NOT EXISTS programs (          -- filières : Informatique, Gestion…
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS levels (            -- niveaux : L1, L2, L3, M1…
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT ''
  CHECK (title IN ('', 'Mr', 'Mme', 'Mlle', 'Dr', 'Prof'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level_id   UUID REFERENCES levels(id)   ON DELETE SET NULL;
-- Nom affiché partout dans l'application : « Dr Rakoto », « Mme Rasoa »… (calculé automatiquement)
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT GENERATED ALWAYS AS
  (CASE WHEN title <> '' THEN title || ' ' || name ELSE name END) STORED;

-- ============================================================
-- Public des contenus (campus / filière / niveau / classe) et passage d'année
-- program_id et level_id vides = « tous ».
-- ============================================================
ALTER TABLE courses       ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE RESTRICT;
ALTER TABLE courses       ADD COLUMN IF NOT EXISTS level_id   UUID REFERENCES levels(id)   ON DELETE RESTRICT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE RESTRICT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS level_id   UUID REFERENCES levels(id)   ON DELETE RESTRICT;
ALTER TABLE resources     ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE RESTRICT;
ALTER TABLE resources     ADD COLUMN IF NOT EXISTS level_id   UUID REFERENCES levels(id)   ON DELETE RESTRICT;

-- Passage d'année : chaque niveau sait vers quel niveau ses étudiants passent (ou s'ils sortent diplômés).
ALTER TABLE levels ADD COLUMN IF NOT EXISTS next_level_id UUID REFERENCES levels(id) ON DELETE SET NULL;
ALTER TABLE levels ADD COLUMN IF NOT EXISTS graduates BOOLEAN NOT NULL DEFAULT false;

-- Nouveau statut « archived » : anciens étudiants (ne peuvent plus se connecter, données conservées).
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'pending', 'archived'));

-- Les salons de cours s'appellent désormais « course:<id> » (avant : l'id seul).
UPDATE messages SET channel = 'course:' || channel WHERE channel <> 'general' AND channel NOT LIKE '%:%';

-- Fichiers envoyés (PDF, Word, images…) : stockés dans la base pour rester durables.
ALTER TABLE resources ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS file_mime TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS file_data BYTEA;