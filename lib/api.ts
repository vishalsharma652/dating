export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `${window.location.origin}/api`;
    }
  }
  return 'http://localhost:5000/api';
}

export const API_BASE_URL = getApiBaseUrl();

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

export class RateLimitError extends Error {
  retryAfter: number;
  constructor(message: string, retryAfter = 60) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const baseUrl = getApiBaseUrl();
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers = new Headers(options.headers);

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${baseUrl}${path}`, {

    ...options,
    headers,
    cache: 'no-store',
  });

  const payload = (await response.json().catch(() => ({
    success: false,
    message: 'Unable to read server response',
    data: null,
  }))) as ApiResponse<T>;

  if (response.status === 401) {
    clearAuthSession();
    if (
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/login') &&
      !window.location.pathname.startsWith('/register') &&
      !window.location.pathname.startsWith('/forgot-password')
    ) {
      window.location.href = '/login';
    }
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('Retry-After') || 60);
    const msg = payload.message || 'Too many requests, please try again later.';
    // Broadcast globally so a toast component can pick it up
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:rate-limited', { detail: { message: msg, retryAfter } }));
    }
    throw new RateLimitError(msg, retryAfter);
  }

  if (!response.ok || !payload.success) {
    const err = new Error(payload.message || 'Request failed') as any;
    if ((payload as any).errors) {
      err.errors = (payload as any).errors;
    }
    throw err;
  }

  return payload.data;
}

export function apiAssetUrl(path: string | null | undefined) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path, new URL(API_BASE_URL).origin).toString();
}

export type BrandData = {
  name: string;
  logoUrl: string | null;
};

export const brandApi = {
  get: () => apiRequest<{ brand: BrandData }>('/brand').then((data) => data.brand),
};

export const authApi = {
  login: (body: { email?: string; phone?: string; password: string }) =>
    apiRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  register: (body: { name: string; phone: string; email: string; password: string; gender: string }) =>
    apiRequest<{ email: string; otp?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  verifyOtp: (body: { email: string; otp: string }) =>
    apiRequest<{ token: string; user: any; emailVerified: boolean }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  resendOtp: (body: { email: string }) =>
    apiRequest<{ email: string; otp?: string }>('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  me: () => apiRequest<{ user: any }>('/auth/me'),
  logout: () =>
    apiRequest<null>('/auth/logout', {
      method: 'POST',
    }),
  heartbeat: () =>
    apiRequest<{ user: any }>('/auth/heartbeat', {
      method: 'POST',
    }),
  forgotPassword: (email: string) =>
    apiRequest<{ resetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  verifyResetOtp: (email: string, otp: string) =>
    apiRequest<{ resetToken: string; email: string }>('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),
  resetPassword: (payload: { token?: string; otp?: string; email?: string; password: string } | string, password?: string) => {
    const body = typeof payload === 'object' ? payload : { token: payload, password };
    return apiRequest<null>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};

export const userApi = {
  dashboard: () => apiRequest<{
    user: any;
    profile: any;
    matches: any[];
    activeUsers: any[];
    assignedUser: any | null;
    activeLabel: string;
    activeGirls?: any[];
    assignedGirl?: any | null;
  }>('/user/dashboard'),
  profile: () => apiRequest<{ user: any; profile: any }>('/user/profile'),
  updateProfile: (body: Record<string, unknown>) =>
    apiRequest<{ user: any; profile: any }>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  uploadPhoto: (formData: FormData) =>
    apiRequest<{ url: string }>('/user/profile/photo', {
      method: 'POST',
      body: formData,
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
  searchUsers: (query: string) => apiRequest<{ users: any[] }>(`/user/search?q=${encodeURIComponent(query)}`),
  reactToProfile: (id: number | string, action: 'like' | 'pass' | 'super_like') =>
    apiRequest<null>(`/user/discover/${id}/action`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),
  matches: () => apiRequest<{ matches: any[] }>('/user/matches'),
  chats: () => apiRequest<{ chats: any[] }>('/user/chat'),
  messages: (userId: number | string) =>
    apiRequest<{ chat: any; messages: any[] }>(`/user/chat/${userId}/messages`),
  sendMessage: (userId: number | string, text: string, type: string = 'text') =>
    apiRequest<{ message: any }>(`/user/chat/${userId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, type }),
    }),
  deleteMessage: (messageId: number | string, type: 'me' | 'everyone' = 'me') =>
    apiRequest<{ success: boolean; messageId: number; deleteType: string }>(`/user/chat/messages/${messageId}/delete`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),
  wallet: () => apiRequest<{ coins: number; earnings: number }>('/user/wallet'),
  transactions: () => apiRequest<{ transactions: any[] }>('/user/wallet/history'),
  coinPackages: () => apiRequest<{ packages: any[] }>('/user/wallet/coins'),
  createStripeIntent: (packageId: number | string) =>
    apiRequest<{ clientSecret: string; paymentIntentId: string; amount: number; currency: string }>(
      '/user/wallet/coins/stripe-intent',
      {
        method: 'POST',
        body: JSON.stringify({ packageId: Number(packageId) }),
      }
    ),
  verifyUpiId: (upiId: string) =>
    apiRequest<{ valid: boolean; customerName?: string; bankHandle?: string; message?: string }>(
      '/user/wallet/coins/verify-upi',
      {
        method: 'POST',
        body: JSON.stringify({ upiId }),
      }
    ),
  purchaseCoins: (
    packageId: number | string,
    payment?: {
      gateway?: 'razorpay' | 'cashfree' | 'phonepe' | 'netbanking' | 'wallet' | 'upi_qr' | 'stripe';
      paymentReference?: string;
      upiId?: string;
      cardNumber?: string;
      expiry?: string;
      cvv?: string;
      cardName?: string;
      bankCode?: string;
      walletProvider?: string;
    }
  ) =>
    apiRequest<{ package: any; coinsAdded: number }>('/user/wallet/coins/purchase', {
      method: 'POST',
      body: JSON.stringify({ packageId: Number(packageId), ...payment }),
    }),
  chatRequests: () => apiRequest<{ requests: any[] }>('/user/chat/requests'),
  requestChat: (userId: number | string) =>
    apiRequest<{ request: any }>(`/user/chat/${userId}/request`, { method: 'POST' }),
  respondToChatRequest: (requestId: number | string, status: 'accepted' | 'rejected') =>
    apiRequest<{ request: any }>(`/user/chat/requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  startChatSession: (userId: number | string) =>
    apiRequest<{ session: any }>(`/user/chat/${userId}/session`, { method: 'POST' }),
  chargeChatMinute: (sessionId: number | string) =>
    apiRequest<{ charge: any }>(`/user/chat/sessions/${sessionId}/charge-minute`, { method: 'POST' }),
  endChatSession: (sessionId: number | string) =>
    apiRequest<{ session: any }>(`/user/chat/sessions/${sessionId}/end`, { method: 'PATCH' }),
  bankAccounts: () => apiRequest<{ bankAccounts: any[] }>('/user/wallet/bank-accounts'),
  saveBankAccount: (body: Record<string, unknown>) =>
    apiRequest<{ bankAccount: any }>('/user/wallet/bank-accounts', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  withdrawals: () => apiRequest<{ withdrawals: any[] }>('/user/withdraw/history'),
  createWithdrawal: (body: Record<string, unknown>) =>
    apiRequest<{ withdrawal: any }>('/user/withdraw', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  notifications: () => apiRequest<{ notifications: any[]; unread: number }>('/user/notifications'),
  notificationCount: () => apiRequest<{ unread: number }>('/user/notifications/count'),
  markNotificationRead: (id: number | string) =>
    apiRequest<{ unread: number }>(`/user/notifications/${id}/read`, { method: 'PATCH' }),
  markNotificationsRead: () =>
    apiRequest<{ unread: number }>('/user/notifications/read-all', { method: 'PATCH' }),
  deleteAccount: () =>
    apiRequest<null>('/user/account', { method: 'DELETE' }),
};
