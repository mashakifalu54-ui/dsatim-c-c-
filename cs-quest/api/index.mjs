// CS Quest API — runs as a Neon Function next to the database.
// The app (APK) only ever talks to this API, so the database password
// never leaves the server. Zero dependencies: it talks to Postgres over
// Neon's SQL-over-HTTP endpoint using the built-in fetch.

import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';

const NAIROBI_TODAY = "(now() AT TIME ZONE 'Africa/Nairobi')::date";
const REPEAT_CORRECT_XP = 2;

// Ranks are earned by completing levels (a level counts once you have at least 1 star).
const RANKS = [
  { title: 'Rookie', icon: '🌱', minLevels: 0 },
  { title: 'Apprentice', icon: '🔧', minLevels: 3 },
  { title: 'Coder', icon: '💻', minLevels: 8 },
  { title: 'Debugger', icon: '🐞', minLevels: 15 },
  { title: 'Developer', icon: '🚀', minLevels: 25 },
  { title: 'Engineer', icon: '⚙️', minLevels: 38 },
  { title: 'Architect', icon: '🏛️', minLevels: 52 },
  { title: 'Grandmaster', icon: '👑', minLevels: 68 },
];

export function rankForLevels(levelsCompleted) {
  let currentRank = RANKS[0];
  for (const rank of RANKS) if (levelsCompleted >= rank.minLevels) currentRank = rank;
  const nextRank = RANKS[RANKS.indexOf(currentRank) + 1] ?? null;
  return {
    title: currentRank.title,
    icon: currentRank.icon,
    minLevels: currentRank.minLevels,
    next: nextRank ? { title: nextRank.title, icon: nextRank.icon, minLevels: nextRank.minLevels } : null,
  };
}

const COMMENT_MAX_LENGTH = 300;
const COMMENT_COOLDOWN_SECONDS = 10;
const COMMENTS_PER_DAY = 30;
const REPORTS_TO_HIDE = 3;

// ---------- database helper ----------

const INTEGER_TYPE_IDS = new Set([20, 21, 23, 26]);
const DECIMAL_TYPE_IDS = new Set([700, 701, 1700]);
const JSON_TYPE_IDS = new Set([114, 3802]);
const BOOLEAN_TYPE_ID = 16;

function parseColumnValue(rawValue, dataTypeId) {
  if (rawValue === null) return null;
  if (dataTypeId === BOOLEAN_TYPE_ID) return rawValue === 't' || rawValue === 'true';
  if (INTEGER_TYPE_IDS.has(dataTypeId)) return parseInt(rawValue, 10);
  if (DECIMAL_TYPE_IDS.has(dataTypeId)) return parseFloat(rawValue);
  if (JSON_TYPE_IDS.has(dataTypeId)) return JSON.parse(rawValue);
  return rawValue;
}

async function runQuery(queryText, queryParams = []) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');

  const databaseHost = new URL(connectionString).hostname;
  const sqlEndpoint = 'https://' + databaseHost.replace(/^[^.]+\./, 'api.') + '/sql';

  const databaseResponse = await fetch(sqlEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Neon-Connection-String': connectionString,
      'Neon-Raw-Text-Output': 'true',
      'Neon-Array-Mode': 'true',
    },
    // Parameters travel as text; Postgres converts them to the right column type.
    body: JSON.stringify({
      query: queryText,
      params: queryParams.map((paramValue) =>
        paramValue === null || paramValue === undefined ? null : String(paramValue),
      ),
    }),
  });

  if (!databaseResponse.ok) {
    const errorBody = await databaseResponse.text();
    throw new Error(`Database error ${databaseResponse.status}: ${errorBody}`);
  }

  const resultBody = await databaseResponse.json();
  return resultBody.rows.map((rowValues) => {
    const rowObject = {};
    resultBody.fields.forEach((field, columnIndex) => {
      rowObject[field.name] = parseColumnValue(rowValues[columnIndex], field.dataTypeID);
    });
    return rowObject;
  });
}

// ---------- small helpers ----------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-player-token',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

function jsonResponse(responseBody, statusCode = 200) {
  return new Response(JSON.stringify(responseBody), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function hashToken(playerToken) {
  return createHash('sha256').update(playerToken).digest('hex');
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

function passwordMatches(password, storedHash) {
  const [salt, expectedHex] = String(storedHash ?? '').split(':');
  if (!salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(actual, expected);
}

export function validateCredentials(requestBody) {
  const username = String(requestBody.username ?? '').trim();
  const password = String(requestBody.password ?? '');
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    throw new ApiError(400, 'Username must be 3-20 letters, numbers or underscores');
  }
  if (password.length < 6 || password.length > 100) {
    throw new ApiError(400, 'Password must be at least 6 characters');
  }
  return { username, password };
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, 'Request body must be JSON');
  }
}

async function requirePlayer(request) {
  const playerToken = request.headers.get('x-player-token');
  if (!playerToken) throw new ApiError(401, 'Missing player token');

  const playerRows = await runQuery(
    `SELECT player_id, display_name, total_xp, current_streak, longest_streak, lives,
            (last_played_date = ${NAIROBI_TODAY}) AS played_today,
            (last_played_date >= ${NAIROBI_TODAY} - 1) AS streak_alive,
            username, password_hash,
            (SELECT COUNT(*) FROM level_progress
              WHERE level_progress.player_id = players.player_id AND level_progress.stars >= 1)::int AS levels_completed
       FROM players
      WHERE token_hash = $1
         OR player_id IN (SELECT player_id FROM sessions WHERE token_hash = $1)`,
    [hashToken(playerToken)],
  );
  if (playerRows.length === 0) throw new ApiError(401, 'Unknown player token');
  return playerRows[0];
}

function toPlayerJson(playerRow) {
  const levelsCompleted = playerRow.levels_completed ?? 0;
  return {
    displayName: playerRow.display_name,
    username: playerRow.username ?? null,
    hasAccount: Boolean(playerRow.username),
    levelsCompleted,
    rank: rankForLevels(levelsCompleted),
    totalXp: playerRow.total_xp,
    // A streak only counts if the player played today or yesterday.
    currentStreak: playerRow.streak_alive ? playerRow.current_streak : 0,
    longestStreak: playerRow.longest_streak,
    lives: playerRow.lives,
    playedToday: playerRow.played_today === true,
  };
}

export function normalizeAnswer(answerText) {
  return String(answerText ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/;$/, '');
}

export function starsForScore(correctCount, totalCount) {
  if (totalCount === 0) return 0;
  const scoreRatio = correctCount / totalCount;
  if (scoreRatio >= 0.9) return 3;
  if (scoreRatio >= 0.7) return 2;
  if (scoreRatio >= 0.5) return 1;
  return 0;
}

// ---------- route handlers ----------

async function startSession(playerId) {
  const sessionToken = randomUUID() + randomUUID();
  await runQuery('INSERT INTO sessions (token_hash, player_id) VALUES ($1, $2)', [hashToken(sessionToken), playerId]);
  return sessionToken;
}

async function loadPlayerById(playerId) {
  const playerRows = await runQuery(
    `SELECT player_id, display_name, total_xp, current_streak, longest_streak, lives, username,
            (last_played_date = ${NAIROBI_TODAY}) AS played_today,
            (last_played_date >= ${NAIROBI_TODAY} - 1) AS streak_alive,
            (SELECT COUNT(*) FROM level_progress
              WHERE level_progress.player_id = players.player_id AND level_progress.stars >= 1)::int AS levels_completed
       FROM players WHERE player_id = $1`,
    [playerId],
  );
  return playerRows[0];
}

function rethrowIfUsernameTaken(error) {
  if (String(error.message).includes('players_username_unique')) throw new ApiError(409, 'That username is taken');
  throw error;
}

async function signUp(request) {
  const { username, password } = validateCredentials(await readJsonBody(request));
  let newPlayerRows;
  try {
    newPlayerRows = await runQuery(
      `INSERT INTO players (display_name, username, password_hash, token_hash)
       VALUES ($1, $1, $2, $3) RETURNING player_id`,
      [username, hashPassword(password), hashToken(randomUUID())],
    );
  } catch (error) {
    rethrowIfUsernameTaken(error);
  }
  const playerId = newPlayerRows[0].player_id;
  const sessionToken = await startSession(playerId);
  return jsonResponse({ token: sessionToken, player: toPlayerJson(await loadPlayerById(playerId)) }, 201);
}

async function logIn(request) {
  const requestBody = await readJsonBody(request);
  const username = String(requestBody.username ?? '').trim();
  const password = String(requestBody.password ?? '');
  const playerRows = await runQuery('SELECT player_id, password_hash FROM players WHERE lower(username) = lower($1)', [username]);
  // Same message for "no such user" and "wrong password", so usernames can't be probed.
  if (playerRows.length === 0 || !passwordMatches(password, playerRows[0].password_hash)) {
    throw new ApiError(401, 'Wrong username or password');
  }
  const playerId = playerRows[0].player_id;
  const sessionToken = await startSession(playerId);
  return jsonResponse({ token: sessionToken, player: toPlayerJson(await loadPlayerById(playerId)) });
}

// An older player who started before accounts existed adds a username and password,
// and keeps all their XP and stars.
async function claimAccount(player, request) {
  if (player.username) throw new ApiError(409, 'This player already has an account');
  const { username, password } = validateCredentials(await readJsonBody(request));
  try {
    await runQuery(
      'UPDATE players SET username = $2, display_name = $2, password_hash = $3 WHERE player_id = $1 AND username IS NULL',
      [player.player_id, username, hashPassword(password)],
    );
  } catch (error) {
    rethrowIfUsernameTaken(error);
  }
  return jsonResponse({ player: toPlayerJson(await loadPlayerById(player.player_id)) });
}

async function logOut(request) {
  const sessionToken = request.headers.get('x-player-token');
  await runQuery('DELETE FROM sessions WHERE token_hash = $1', [hashToken(sessionToken)]);
  return jsonResponse({ ok: true });
}

async function leaderboard(player) {
  const boardRows = await runQuery(
    `WITH board AS (
       SELECT players.player_id, players.username, players.total_xp,
              COUNT(level_progress.level_id) FILTER (WHERE level_progress.stars >= 1)::int AS levels_completed,
              COALESCE(SUM(level_progress.stars), 0)::int AS total_stars
         FROM players
         LEFT JOIN level_progress ON level_progress.player_id = players.player_id
        WHERE players.username IS NOT NULL
        GROUP BY players.player_id
     ), ranked AS (
       SELECT board.*, ROW_NUMBER() OVER (ORDER BY levels_completed DESC, total_stars DESC, total_xp DESC, player_id) AS position
         FROM board
     )
     SELECT * FROM ranked WHERE position <= 50 OR player_id = $1 ORDER BY position`,
    [player.player_id],
  );
  const toEntry = (boardRow) => ({
    position: boardRow.position,
    username: boardRow.username,
    levelsCompleted: boardRow.levels_completed,
    totalStars: boardRow.total_stars,
    totalXp: boardRow.total_xp,
    rank: rankForLevels(boardRow.levels_completed),
    isMe: boardRow.player_id === player.player_id,
  });
  return jsonResponse({ entries: boardRows.map(toEntry) });
}

async function listWorlds(player) {
  const worldRows = await runQuery(
    `SELECT worlds.slug, worlds.title, worlds.description, worlds.is_november_priority,
            COUNT(levels.level_id)::int AS level_count,
            COUNT(level_progress.level_id) FILTER (WHERE level_progress.stars >= 1)::int AS completed_levels,
            COALESCE(SUM(level_progress.stars), 0)::int AS total_stars
       FROM worlds
       JOIN levels ON levels.world_id = worlds.world_id
       LEFT JOIN level_progress
              ON level_progress.level_id = levels.level_id AND level_progress.player_id = $1
      GROUP BY worlds.world_id
      ORDER BY worlds.unlock_order`,
    [player.player_id],
  );
  return jsonResponse({
    worlds: worldRows.map((worldRow) => ({
      slug: worldRow.slug,
      title: worldRow.title,
      description: worldRow.description,
      isNovemberPriority: worldRow.is_november_priority,
      levelCount: worldRow.level_count,
      completedLevels: worldRow.completed_levels,
      totalStars: worldRow.total_stars,
    })),
  });
}

async function listLevels(player, worldSlug) {
  const levelRows = await runQuery(
    `SELECT levels.level_id, levels.title, levels.level_order, levels.is_boss,
            levels.time_limit_seconds, levels.notes,
            (SELECT COUNT(*) FROM questions WHERE questions.level_id = levels.level_id)::int AS question_count,
            COALESCE(level_progress.best_score, 0) AS best_score,
            COALESCE(level_progress.stars, 0) AS stars
       FROM levels
       JOIN worlds ON worlds.world_id = levels.world_id
       LEFT JOIN level_progress
              ON level_progress.level_id = levels.level_id AND level_progress.player_id = $1
      WHERE worlds.slug = $2
      ORDER BY levels.level_order`,
    [player.player_id, worldSlug],
  );
  if (levelRows.length === 0) throw new ApiError(404, 'World not found');

  // A level unlocks once the level before it has at least one star.
  let previousLevelPassed = true;
  const levels = levelRows.map((levelRow) => {
    const levelJson = {
      levelId: levelRow.level_id,
      title: levelRow.title,
      levelOrder: levelRow.level_order,
      isBoss: levelRow.is_boss,
      timeLimitSeconds: levelRow.time_limit_seconds,
      notes: levelRow.notes,
      questionCount: levelRow.question_count,
      bestScore: levelRow.best_score,
      stars: levelRow.stars,
      isUnlocked: previousLevelPassed,
    };
    previousLevelPassed = levelRow.stars >= 1;
    return levelJson;
  });
  return jsonResponse({ levels });
}

async function listQuestions(levelId) {
  // correct_answer is deliberately NOT selected: answers are checked on the server.
  const questionRows = await runQuery(
    `SELECT question_id, question_type, prompt, code_snippet, options, difficulty, xp_reward
       FROM questions WHERE level_id = $1 ORDER BY difficulty, question_id`,
    [levelId],
  );
  return jsonResponse({
    questions: questionRows.map((questionRow) => ({
      questionId: questionRow.question_id,
      questionType: questionRow.question_type,
      prompt: questionRow.prompt,
      codeSnippet: questionRow.code_snippet,
      options: questionRow.options,
      difficulty: questionRow.difficulty,
      xpReward: questionRow.xp_reward,
    })),
  });
}

async function revealAnswer(questionId) {
  // Only "find the bug" questions can be revealed: the player compares
  // their own explanation with the model answer and grades themselves.
  const questionRows = await runQuery(
    `SELECT correct_answer, explanation FROM questions
      WHERE question_id = $1 AND question_type = 'find_bug'`,
    [questionId],
  );
  if (questionRows.length === 0) throw new ApiError(404, 'Question cannot be revealed');
  return jsonResponse({
    correctAnswer: questionRows[0].correct_answer,
    explanation: questionRows[0].explanation,
  });
}

async function submitAnswer(player, request) {
  const requestBody = await readJsonBody(request);
  const questionId = parseInt(requestBody.questionId, 10);
  if (!Number.isInteger(questionId)) throw new ApiError(400, 'questionId is required');

  const questionRows = await runQuery(
    `SELECT question_type, correct_answer, explanation, xp_reward,
            EXISTS (SELECT 1 FROM attempts
                     WHERE player_id = $1 AND question_id = $2 AND is_correct) AS already_correct
       FROM questions WHERE question_id = $2`,
    [player.player_id, questionId],
  );
  if (questionRows.length === 0) throw new ApiError(404, 'Question not found');
  const question = questionRows[0];

  const givenAnswer = String(requestBody.givenAnswer ?? '').slice(0, 500);
  const isCorrect =
    question.question_type === 'find_bug'
      ? requestBody.selfGradedCorrect === true
      : normalizeAnswer(givenAnswer) === normalizeAnswer(question.correct_answer);

  let xpEarned = 0;
  if (isCorrect) xpEarned = question.already_correct ? REPEAT_CORRECT_XP : question.xp_reward;

  const updatedRows = await runQuery(
    `WITH recorded_attempt AS (
       INSERT INTO attempts (player_id, question_id, given_answer, is_correct)
       VALUES ($1, $2, $3, $4)
     )
     UPDATE players SET total_xp = total_xp + $5 WHERE player_id = $1
     RETURNING total_xp`,
    [player.player_id, questionId, givenAnswer, isCorrect, xpEarned],
  );

  return jsonResponse({
    isCorrect,
    correctAnswer: question.correct_answer,
    explanation: question.explanation,
    xpEarned,
    totalXp: updatedRows[0].total_xp,
  });
}

async function completeLevel(player, levelId, request) {
  const requestBody = await readJsonBody(request);
  const questionCountRows = await runQuery(
    'SELECT COUNT(*)::int AS question_count FROM questions WHERE level_id = $1',
    [levelId],
  );
  const totalCount = questionCountRows[0].question_count;
  if (totalCount === 0) throw new ApiError(404, 'Level not found');

  const reportedCorrect = parseInt(requestBody.correctCount, 10);
  const correctCount = Math.max(0, Math.min(totalCount, Number.isInteger(reportedCorrect) ? reportedCorrect : 0));
  const stars = starsForScore(correctCount, totalCount);

  const resultRows = await runQuery(
    `WITH saved_progress AS (
       INSERT INTO level_progress (player_id, level_id, best_score, stars, completed_at)
       VALUES ($1, $2, $3, $4, CASE WHEN $4 >= 1 THEN now() END)
       ON CONFLICT (player_id, level_id) DO UPDATE SET
         best_score = GREATEST(level_progress.best_score, EXCLUDED.best_score),
         stars = GREATEST(level_progress.stars, EXCLUDED.stars),
         completed_at = COALESCE(level_progress.completed_at, EXCLUDED.completed_at)
       RETURNING best_score, stars
     ),
     new_streak AS (
       SELECT CASE
                WHEN last_played_date = ${NAIROBI_TODAY} THEN current_streak
                WHEN last_played_date = ${NAIROBI_TODAY} - 1 THEN current_streak + 1
                ELSE 1
              END AS streak_value
         FROM players WHERE player_id = $1
     ),
     updated_player AS (
       UPDATE players SET
         current_streak = new_streak.streak_value,
         longest_streak = GREATEST(longest_streak, new_streak.streak_value),
         last_played_date = ${NAIROBI_TODAY}
       FROM new_streak WHERE player_id = $1
       RETURNING current_streak, longest_streak, total_xp
     )
     SELECT saved_progress.best_score, saved_progress.stars AS best_stars,
            updated_player.current_streak, updated_player.longest_streak, updated_player.total_xp
       FROM saved_progress, updated_player`,
    [player.player_id, levelId, correctCount, stars],
  );
  const result = resultRows[0];

  const completedRows = await runQuery(
    'SELECT COUNT(*)::int AS levels_completed FROM level_progress WHERE player_id = $1 AND stars >= 1',
    [player.player_id],
  );
  const levelsCompleted = completedRows[0].levels_completed;
  const newRank = rankForLevels(levelsCompleted);

  return jsonResponse({
    levelsCompleted,
    rank: newRank,
    rankedUp: newRank.title !== rankForLevels(player.levels_completed).title,
    correctCount,
    totalCount,
    stars,
    bestStars: result.best_stars,
    bestScore: result.best_score,
    currentStreak: result.current_streak,
    longestStreak: result.longest_streak,
    totalXp: result.total_xp,
  });
}

// ---------- community ----------

// Comments are only visible to (and writable by) players who have played that level,
// so nobody gets answers spoiled before they try it.
async function requirePlayedLevel(player, levelId) {
  const playedRows = await runQuery(
    'SELECT 1 FROM level_progress WHERE player_id = $1 AND level_id = $2',
    [player.player_id, levelId],
  );
  if (playedRows.length === 0) throw new ApiError(403, 'Finish this level to see and post comments');
}

function toCommentJson(commentRow, player) {
  return {
    commentId: commentRow.comment_id,
    username: commentRow.username,
    rank: rankForLevels(commentRow.levels_completed),
    body: commentRow.body,
    createdAt: commentRow.created_at,
    isMine: commentRow.player_id === player.player_id,
    levelTitle: commentRow.level_title ?? undefined,
    worldTitle: commentRow.world_title ?? undefined,
    levelId: commentRow.level_id,
  };
}

const COMMENT_COLUMNS = `comments.comment_id, comments.player_id, comments.level_id, comments.body,
       to_char(comments.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
       players.username,
       (SELECT COUNT(*) FROM level_progress
         WHERE level_progress.player_id = comments.player_id AND level_progress.stars >= 1)::int AS levels_completed`;

async function listComments(player, levelId) {
  await requirePlayedLevel(player, levelId);
  const commentRows = await runQuery(
    `SELECT ${COMMENT_COLUMNS}
       FROM comments JOIN players ON players.player_id = comments.player_id
      WHERE comments.level_id = $1 AND NOT comments.is_hidden
      ORDER BY comments.created_at DESC LIMIT 50`,
    [levelId],
  );
  return jsonResponse({ comments: commentRows.map((commentRow) => toCommentJson(commentRow, player)) });
}

async function postComment(player, levelId, request) {
  if (!player.username) throw new ApiError(403, 'Create an account to post comments');
  await requirePlayedLevel(player, levelId);
  const requestBody = await readJsonBody(request);
  const body = String(requestBody.body ?? '').trim().replace(/\s+\n/g, '\n');
  if (body.length === 0) throw new ApiError(400, 'Write something first');
  if (body.length > COMMENT_MAX_LENGTH) throw new ApiError(400, `Comments can be up to ${COMMENT_MAX_LENGTH} characters`);

  const recentRows = await runQuery(
    `SELECT COUNT(*) FILTER (WHERE created_at > now() - interval '${COMMENT_COOLDOWN_SECONDS} seconds')::int AS just_now,
            COUNT(*) FILTER (WHERE created_at > now() - interval '1 day')::int AS today
       FROM comments WHERE player_id = $1`,
    [player.player_id],
  );
  if (recentRows[0].just_now > 0) throw new ApiError(429, 'Slow down a little, then try again');
  if (recentRows[0].today >= COMMENTS_PER_DAY) throw new ApiError(429, 'Daily comment limit reached');

  await runQuery('INSERT INTO comments (level_id, player_id, body) VALUES ($1, $2, $3)', [levelId, player.player_id, body]);
  return listComments(player, levelId);
}

async function deleteComment(player, commentId) {
  const deletedRows = await runQuery(
    'DELETE FROM comments WHERE comment_id = $1 AND player_id = $2 RETURNING comment_id',
    [commentId, player.player_id],
  );
  if (deletedRows.length === 0) throw new ApiError(404, 'Comment not found');
  return jsonResponse({ ok: true });
}

async function reportComment(player, commentId) {
  const commentRows = await runQuery('SELECT player_id FROM comments WHERE comment_id = $1', [commentId]);
  if (commentRows.length === 0) throw new ApiError(404, 'Comment not found');
  if (commentRows[0].player_id === player.player_id) throw new ApiError(400, 'You cannot report your own comment');
  await runQuery(
    'INSERT INTO comment_reports (comment_id, reporter_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [commentId, player.player_id],
  );
  // Enough different players reporting a comment hides it until someone reviews it.
  await runQuery(
    `UPDATE comments SET is_hidden = TRUE
      WHERE comment_id = $1 AND (SELECT COUNT(*) FROM comment_reports WHERE comment_id = $1) >= ${REPORTS_TO_HIDE}`,
    [commentId],
  );
  return jsonResponse({ ok: true });
}

async function communityFeed(player) {
  const commentRows = await runQuery(
    `SELECT ${COMMENT_COLUMNS}, levels.title AS level_title, worlds.title AS world_title
       FROM comments
       JOIN players ON players.player_id = comments.player_id
       JOIN levels ON levels.level_id = comments.level_id
       JOIN worlds ON worlds.world_id = levels.world_id
      WHERE NOT comments.is_hidden
        AND EXISTS (SELECT 1 FROM level_progress
                     WHERE level_progress.player_id = $1 AND level_progress.level_id = comments.level_id)
      ORDER BY comments.created_at DESC LIMIT 40`,
    [player.player_id],
  );
  return jsonResponse({ comments: commentRows.map((commentRow) => toCommentJson(commentRow, player)) });
}

// ---------- router ----------

async function routeRequest(request) {
  const requestUrl = new URL(request.url);
  const pathSegments = requestUrl.pathname.split('/').filter(Boolean);
  const routeKey = `${request.method} /${pathSegments.join('/')}`;

  if (routeKey === 'GET /' || routeKey === 'GET /health') {
    return jsonResponse({ service: 'cs-quest-api', status: 'ok' });
  }
  if (routeKey === 'GET /health/db') {
    const countRows = await runQuery('SELECT COUNT(*)::int AS question_count FROM questions');
    return jsonResponse({ status: 'ok', questionCount: countRows[0].question_count });
  }
  if (routeKey === 'POST /auth/signup') return signUp(request);
  if (routeKey === 'POST /auth/login') return logIn(request);

  const player = await requirePlayer(request);

  if (routeKey === 'GET /me') return jsonResponse({ player: toPlayerJson(player) });
  if (routeKey === 'POST /auth/claim') return claimAccount(player, request);
  if (routeKey === 'POST /auth/logout') return logOut(request);
  if (routeKey === 'GET /leaderboard') return leaderboard(player);
  if (routeKey === 'GET /community/feed') return communityFeed(player);
  if (routeKey === 'GET /worlds') return listWorlds(player);
  if (routeKey === 'POST /answers') return submitAnswer(player, request);

  const [resourceName, resourceId, actionName] = pathSegments;

  if (request.method === 'GET' && resourceName === 'worlds' && actionName === 'levels') {
    return listLevels(player, resourceId);
  }

  const numericId = parseInt(resourceId, 10);
  if (Number.isInteger(numericId)) {
    if (request.method === 'GET' && resourceName === 'levels' && actionName === 'questions') {
      return listQuestions(numericId);
    }
    if (request.method === 'POST' && resourceName === 'levels' && actionName === 'complete') {
      return completeLevel(player, numericId, request);
    }
    if (request.method === 'GET' && resourceName === 'questions' && actionName === 'reveal') {
      return revealAnswer(numericId);
    }
    if (resourceName === 'levels' && actionName === 'comments') {
      if (request.method === 'GET') return listComments(player, numericId);
      if (request.method === 'POST') return postComment(player, numericId, request);
    }
    if (resourceName === 'comments' && request.method === 'DELETE' && !actionName) {
      return deleteComment(player, numericId);
    }
    if (resourceName === 'comments' && request.method === 'POST' && actionName === 'report') {
      return reportComment(player, numericId);
    }
  }

  throw new ApiError(404, 'Route not found');
}

// Development-only helper: lets a plain GET link simulate any request, e.g.
//   /__test/1?method=POST&path=/answers&token=...&body={...}
// It only works while the TEST_MODE environment variable is "1" (off in production).
function unwrapTestRequest(request) {
  const requestUrl = new URL(request.url);
  if (process.env.TEST_MODE !== '1' || !requestUrl.pathname.startsWith('/__test')) return request;

  const simulatedMethod = requestUrl.searchParams.get('method') ?? 'GET';
  const simulatedHeaders = { 'content-type': 'application/json' };
  const simulatedToken = requestUrl.searchParams.get('token');
  if (simulatedToken) simulatedHeaders['x-player-token'] = simulatedToken;

  return new Request(new URL(requestUrl.searchParams.get('path') ?? '/', requestUrl.origin), {
    method: simulatedMethod,
    headers: simulatedHeaders,
    body: simulatedMethod === 'GET' ? undefined : requestUrl.searchParams.get('body') ?? '{}',
  });
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
    try {
      return await routeRequest(unwrapTestRequest(request));
    } catch (error) {
      if (error instanceof ApiError) return jsonResponse({ error: error.message }, error.statusCode);
      console.error(error);
      return jsonResponse({ error: 'Something went wrong on the server' }, 500);
    }
  },
};
