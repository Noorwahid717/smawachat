import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const chatAPI = {
  // Session management
  getSessions: async () => {
    const response = await api.get('/sessions');
    return response.data;
  },

  createSession: async (title = 'Percakapan Baru') => {
    const response = await api.post('/sessions', { title });
    return response.data;
  },

  deleteSession: async (sessionId) => {
    const response = await api.delete(`/sessions/${sessionId}`);
    return response.data;
  },

  // Message management
  getMessages: async (sessionId) => {
    const response = await api.get(`/sessions/${sessionId}/messages`);
    return response.data;
  },

  sendMessage: async (sessionId, content, messageType) => {
    const response = await api.post(`/sessions/${sessionId}/messages`, {
      content,
      message_type: messageType
    });
    return response.data;
  },

  // Download functionality
  downloadMessage: async (messageId, filename) => {
    const response = await api.get(`/download/${messageId}`, {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  }
};

export default api;