-- CS Quest database schema (Neon Postgres).
-- The question bank itself lives in the database; this file recreates the structure.

CREATE TABLE worlds (
  world_id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  unlock_order INT NOT NULL,
  is_november_priority BOOLEAN DEFAULT FALSE
);

CREATE TABLE levels (
  level_id SERIAL PRIMARY KEY,
  world_id INT NOT NULL REFERENCES worlds(world_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  level_order INT NOT NULL,
  is_boss BOOLEAN DEFAULT FALSE,
  time_limit_seconds INT,
  UNIQUE (world_id, level_order)
);

CREATE TABLE questions (
  question_id SERIAL PRIMARY KEY,
  level_id INT NOT NULL REFERENCES levels(level_id) ON DELETE CASCADE,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'fill_blank', 'find_bug')),
  prompt TEXT NOT NULL,
  code_snippet TEXT,
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty INT DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  xp_reward INT DEFAULT 10
);

CREATE TABLE players (
  player_id SERIAL PRIMARY KEY,
  display_name TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,  -- SHA-256 of the token stored on the phone
  total_xp INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_played_date DATE,
  lives INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE attempts (
  attempt_id SERIAL PRIMARY KEY,
  player_id INT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
  question_id INT NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
  given_answer TEXT,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE level_progress (
  player_id INT REFERENCES players(player_id) ON DELETE CASCADE,
  level_id INT REFERENCES levels(level_id) ON DELETE CASCADE,
  best_score INT DEFAULT 0,
  stars INT DEFAULT 0 CHECK (stars BETWEEN 0 AND 3),
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (player_id, level_id)
);

-- Every question a player has ever got wrong, for the review mode.
CREATE VIEW weak_spots AS
SELECT attempts.player_id,
       questions.question_id,
       questions.prompt,
       levels.title AS level_title,
       COUNT(*) FILTER (WHERE NOT attempts.is_correct) AS wrong_count,
       COUNT(*) AS total_attempts
  FROM attempts
  JOIN questions ON questions.question_id = attempts.question_id
  JOIN levels ON levels.level_id = questions.level_id
 GROUP BY attempts.player_id, questions.question_id, questions.prompt, levels.title
HAVING COUNT(*) FILTER (WHERE NOT attempts.is_correct) > 0;
