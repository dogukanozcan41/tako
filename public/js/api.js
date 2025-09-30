const BASE_URL = '/api';

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = 'İşlem sırasında beklenmeyen bir hata oluştu.';
    try {
      const data = await response.json();
      if (data && typeof data.message === 'string') {
        message = data.message;
      }
    } catch (error) {
      // yoksay - fallback mesaj kullanılacak
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

export async function login(credentials) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function logout() {
  return request('/auth/logout', { method: 'POST' });
}

export async function getSession() {
  return request('/auth/session');
}

export async function fetchOverview() {
  return request('/dashboard/overview');
}

export async function fetchDamages() {
  return request('/dashboard/damages');
}

export async function fetchActivity() {
  return request('/dashboard/activity');
}
