import axios from 'axios';

const API_BASE = '/api';
let authToken = null;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

// Auth
export function setToken(token) { authToken = token; }
export function clearToken() { authToken = null; }

export async function signup(username, email, password) {
  const response = await api.post('/auth/signup', { username, email, password });
  return response.data;
}

export async function login(username, password) {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get('/auth/me');
  return response.data;
}

export async function updateProfile(profile) {
  const response = await api.put('/auth/profile', { profile });
  return response.data;
}

// Chat sessions
const SESSION_KEY = 'gg_nexus_session_id';

let currentSessionId = sessionStorage.getItem(SESSION_KEY) ||
  'session-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);

sessionStorage.setItem(SESSION_KEY, currentSessionId);

export function getSessionId() { return currentSessionId; }

export function setSessionId(id) {
  currentSessionId = id;
  sessionStorage.setItem(SESSION_KEY, id);
}

export function newSession() {
  currentSessionId = 'session-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
  sessionStorage.setItem(SESSION_KEY, currentSessionId);
  return currentSessionId;
}

export async function sendMessage(message) {
  const response = await api.post('/chat', { message, session_id: currentSessionId });
  return response.data;
}

export async function getChatSessions() {
  const response = await api.get('/chat/sessions');
  return response.data;
}

export async function getSessionHistory(sessionId) {
  const response = await api.get(`/chat/history/${sessionId}`);
  return response.data;
}

export async function healthCheck() {
  const response = await api.get('/health');
  return response.data;
}