import axios from 'axios';

const API_BASE = '/api';

const SESSION_ID = 'session-' + Math.random().toString(36).substring(2, 9);

export async function sendMessage(message) {
  try {
    const response = await axios.post(`${API_BASE}/chat`, {
      message: message,
      session_id: SESSION_ID
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export async function healthCheck() {
  const response = await axios.get(`${API_BASE}/health`);
  return response.data;
}