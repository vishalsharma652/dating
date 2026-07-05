/* eslint-disable @typescript-eslint/no-explicit-any */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'userToken';
const USER_KEY = 'user';

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthSession(token: string, user?: unknown) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser<T = any>() {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(USER_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers = new Headers(options.headers);

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const payload = (await response.json().catch(() => ({
    success: false,
    message: 'Unable to read server response',
    data: null,
  }))) as ApiResponse<T>;

  if (response.status === 401) {
    clearAuthSession();
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data;
}

export const authApi = {
  login: (body: { email?: string; phone?: string; password: string }) =>
    apiRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  register: (body: { name: string; phone: string; email?: string; password: string }) =>
    apiRequest<{ phone: string; otp: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  verifyOtp: (body: { phone: string; otp: string }) =>
    apiRequest<{ token: string; user: any; phoneVerified: boolean }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  resendOtp: (body: { phone: string }) =>
    apiRequest<{ phone: string; otp: string }>('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  me: () => apiRequest<{ user: any }>('/auth/me'),
};

export const userApi = {
  dashboard: () => apiRequest<{ user: any; profile: any; matches: any[] }>('/user/dashboard'),
  profile: () => apiRequest<{ user: any; profile: any }>('/user/profile'),
  updateProfile: (body: Record<string, unknown>) =>
    apiRequest<{ user: any; profile: any }>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  ageVerify: (dob: string) =>
    apiRequest<{ user: any; age: number }>('/user/profile/age-verify', {
      method: 'POST',
      body: JSON.stringify({ dob }),
    }),
  submitKyc: (formData: FormData) =>
    apiRequest<{ user: any; files: any[] }>('/user/profile/kyc', {
      method: 'POST',
      body: formData,
    }),
  discover: () => apiRequest<{ profiles: any[] }>('/user/discover'),
  reactToProfile: (id: number | string, action: 'like' | 'pass' | 'super_like') =>
    apiRequest<null>(`/user/discover/${id}/action`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),
  matches: () => apiRequest<{ matches: any[] }>('/user/matches'),
  chats: () => apiRequest<{ chats: any[] }>('/user/chat'),
  messages: (userId: number | string) =>
    apiRequest<{ chat: any; messages: any[] }>(`/user/chat/${userId}/messages`),
  sendMessage: (userId: number | string, text: string) =>
    apiRequest<{ message: any }>(`/user/chat/${userId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  wallet: () => apiRequest<{ coins: number; earnings: number }>('/user/wallet'),
  transactions: () => apiRequest<{ transactions: any[] }>('/user/wallet/history'),
  coinPackages: () => apiRequest<{ packages: any[] }>('/user/wallet/coins'),
  purchaseCoins: (packageId: number | string) =>
    apiRequest<{ package: any; coinsAdded: number }>('/user/wallet/coins/purchase', {
      method: 'POST',
      body: JSON.stringify({ packageId: Number(packageId) }),
    }),
  withdrawals: () => apiRequest<{ withdrawals: any[] }>('/user/withdraw/history'),
  createWithdrawal: (body: Record<string, unknown>) =>
    apiRequest<{ withdrawal: any }>('/user/withdraw', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  notifications: () => apiRequest<{ notifications: any[] }>('/user/notifications'),
};
