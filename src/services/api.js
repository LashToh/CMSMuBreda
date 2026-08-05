const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, code, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(auth && localStorage.getItem('mubreda_token')
          ? { Authorization: `Bearer ${localStorage.getItem('mubreda_token')}` }
          : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      'Unable to reach the server. Check that the API is running and VITE_API_URL is correct.',
      'NETWORK_ERROR',
      0,
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.message || 'Request failed. Please try again.',
      data.code || 'SERVER_ERROR',
      response.status,
    );
  }

  return data;
}

export async function registerAccount(payload) {
  return request('/api/auth/register', { method: 'POST', body: payload });
}

export async function loginAccount(payload) {
  const data = await request('/api/auth/login', { method: 'POST', body: payload });
  if (data?.data?.token) {
    localStorage.setItem('mubreda_token', data.data.token);
  }
  return data;
}

export async function logoutAccount() {
  try {
    await request('/api/auth/logout', { method: 'POST' });
  } finally {
    localStorage.removeItem('mubreda_token');
  }
}

export async function fetchMe() {
  return request('/api/auth/me', { auth: true });
}

export async function changePassword(payload) {
  return request('/api/auth/change-password', { method: 'POST', body: payload, auth: true });
}

export async function fetchAccount() {
  return request('/api/account', { auth: true });
}

export async function fetchCharacters() {
  return request('/api/account/characters', { auth: true });
}

export async function fetchServerInfo() {
  return request('/api/server');
}

export async function fetchRankings(type = 'level', { page = 1, pageSize = 20 } = {}) {
  return request(`/api/rankings/${type}?page=${page}&pageSize=${pageSize}`);
}

export async function fetchNews() {
  return request('/api/news');
}

export async function fetchDownloads() {
  return request('/api/downloads');
}

export async function fetchShopCategories() {
  return request('/api/shop/categories');
}

export async function fetchShopItems({ categoryId, q } = {}) {
  const params = new URLSearchParams();
  if (categoryId) params.set('categoryId', categoryId);
  if (q) params.set('q', q);
  const qs = params.toString();
  return request(`/api/shop/items${qs ? `?${qs}` : ''}`);
}

export async function purchaseShopItem(itemId) {
  return request('/api/shop/purchase', { method: 'POST', body: { itemId }, auth: true });
}

export async function fetchDonationPackages() {
  return request('/api/donations/packages');
}

export async function startDonationCheckout({ packageId, provider }) {
  return request('/api/donations/checkout', {
    method: 'POST',
    body: { packageId, provider },
    auth: true,
  });
}

export async function completeMockDonation(transactionId) {
  return request('/api/donations/mock/complete', {
    method: 'POST',
    body: { transactionId },
    auth: true,
  });
}

export async function fetchDonationHistory() {
  return request('/api/donations/history', { auth: true });
}

export async function redeemGiftCode(code) {
  return request('/api/giftcodes/redeem', { method: 'POST', body: { code }, auth: true });
}

export async function fetchAdminDashboard() {
  return request('/api/admin/dashboard', { auth: true });
}

export async function createGiftCodeAdmin(payload) {
  return request('/api/admin/giftcodes', { method: 'POST', body: payload, auth: true });
}

export async function createNewsAdmin(payload) {
  return request('/api/admin/news', { method: 'POST', body: payload, auth: true });
}

export async function checkApiHealth() {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}
