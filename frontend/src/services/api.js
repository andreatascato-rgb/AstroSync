const API_URL = '/api';

// Funzione helper per chiamate API
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const fullUrl = `${window.location.origin}${API_URL}${endpoint}`;
    console.log(`API Call: ${API_URL}${endpoint}`);
    console.log(`Full URL: ${fullUrl}`);
    console.log('Options:', { method: options.method || 'GET', body: options.body ? 'present' : 'none' });
    
    // Aggiungi timeout di 10 secondi
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error('Request timeout after 10 seconds');
      controller.abort();
    }, 10000);
    
    console.log('Starting fetch...');
    const fetchPromise = fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    console.log('Fetch promise created, waiting for response...');
    
    const response = await fetchPromise;
    
    clearTimeout(timeoutId);
    
    console.log(`Response received! Status: ${response.status}`);
    
    // Leggi il testo della risposta prima di parsare JSON
    const text = await response.text();
    console.log('Response text:', text);
    
    let data;
    try {
      data = JSON.parse(text);
      console.log('Response data:', data);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      console.error('Response text was:', text);
      throw new Error(`Risposta non valida dal server: ${text.substring(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Errore nella richiesta');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    
    if (error.name === 'AbortError') {
      throw new Error('Timeout: il server non risponde. Verifica che il backend sia in esecuzione.');
    }
    
    // Se è già un Error con message, rilancialo
    if (error instanceof Error) {
      throw error;
    }
    // Altrimenti crea un nuovo Error
    throw new Error('Errore di connessione al server');
  }
}

// Auth API
export const authAPI = {
  register: async (email, password, name) => {
    const response = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  login: async (email, password) => {
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    return await apiCall('/auth/me');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  getStoredUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

// Admin API
export const adminAPI = {
  getUsers: async () => {
    return await apiCall('/admin/users');
  },

  getStats: async () => {
    return await apiCall('/admin/stats');
  },

  updateUserRole: async (userId, role) => {
    return await apiCall(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  deleteUser: async (userId) => {
    return await apiCall(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    return await apiCall('/health');
  },
};

