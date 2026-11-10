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

export function createPlayer(displayName) {
  return sendRequest('/players', { method: 'POST', body: { displayName } });
}

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
