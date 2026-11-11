// Every network call the app makes lives here.
// The app never touches the database directly: it only calls the CS Quest API.

const API_BASE_URL = 'https://br-weathered-snow-b9nu99e4-csquest.compute.c-7.eu-central-1.aws.neon.tech';

let currentPlayerToken = null;

export function setPlayerToken(playerToken) {
  currentPlayerToken = playerToken;
}

async function sendRequest(path, { method = 'GET', body } = {}) {
  const requestHeaders = { 'Content-Type': 'application/json' };
  if (currentPlayerToken) requestHeaders['x-player-token'] = currentPlayerToken;

  let serverResponse;
  try {
    serverResponse = await fetch(API_BASE_URL + path, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('No connection. Check your internet and try again.');
  }

  const responseBody = await serverResponse.json().catch(() => ({}));
  if (!serverResponse.ok) {
    const requestError = new Error(responseBody.error ?? 'Something went wrong.');
    requestError.statusCode = serverResponse.status;
    throw requestError;
  }
  return responseBody;
}

// ---------- accounts ----------

export function signUp(username, password) {
  return sendRequest('/auth/signup', { method: 'POST', body: { username, password } });
}

export function logIn(username, password) {
  return sendRequest('/auth/login', { method: 'POST', body: { username, password } });
}

// For players who started before accounts existed: keeps their XP and stars.
export async function claimAccount(username, password) {
  return (await sendRequest('/auth/claim', { method: 'POST', body: { username, password } })).player;
}

export function logOut() {
  return sendRequest('/auth/logout', { method: 'POST' });
}

// ---------- game ----------

export async function fetchPlayer() {
  return (await sendRequest('/me')).player;
}

export async function fetchWorlds() {
  return (await sendRequest('/worlds')).worlds;
}

export async function fetchLevels(worldSlug) {
  return (await sendRequest(`/worlds/${worldSlug}/levels`)).levels;
}

export async function fetchQuestions(levelId) {
  return (await sendRequest(`/levels/${levelId}/questions`)).questions;
}

export function revealAnswer(questionId) {
  return sendRequest(`/questions/${questionId}/reveal`);
}

export function submitAnswer({ questionId, givenAnswer, selfGradedCorrect }) {
  return sendRequest('/answers', {
    method: 'POST',
    body: { questionId, givenAnswer, selfGradedCorrect },
  });
}

export function completeLevel(levelId, correctCount) {
  return sendRequest(`/levels/${levelId}/complete`, { method: 'POST', body: { correctCount } });
}

// ---------- community ----------

export async function fetchLeaderboard() {
  return (await sendRequest('/leaderboard')).entries;
}

export async function fetchCommunityFeed() {
  return (await sendRequest('/community/feed')).comments;
}

export async function fetchComments(levelId) {
  return (await sendRequest(`/levels/${levelId}/comments`)).comments;
}

export async function postComment(levelId, body) {
  return (await sendRequest(`/levels/${levelId}/comments`, { method: 'POST', body: { body } })).comments;
}

export function deleteComment(commentId) {
  return sendRequest(`/comments/${commentId}`, { method: 'DELETE' });
}

export function reportComment(commentId) {
  return sendRequest(`/comments/${commentId}/report`, { method: 'POST' });
}
