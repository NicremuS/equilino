import type { Tenant, Property, Contract, Payment, MaintenanceTicket, Notification, Notice, DigitalContract } from '@/types';
import { useAppStore } from '@/store/useAppStore';

const BASE = '/api/tenant';

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST' });
    if (!res.ok) return null;
    const { accessToken } = await res.json() as { accessToken: string };
    useAppStore.getState().setAccessToken(accessToken);
    return accessToken;
  } catch {
    return null;
  }
}

function authHeaders(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}, baseOverride?: string): Promise<T> {
  let token = useAppStore.getState().accessToken;
  const base = baseOverride ?? BASE;

  if (!token && useAppStore.getState().user) {
    token = await refreshAccessToken();
    if (!token) {
      useAppStore.getState().logout();
      throw new Error('Sessão expirada. Faça login novamente.');
    }
  }

  const run = (t: string | null) =>
    fetch(`${base}${path}`, { ...init, headers: { ...init.headers, ...authHeaders(t) } });

  let res = await run(token);

  if (res.status === 401 && token) {
    token = await refreshAccessToken();
    if (token) {
      res = await run(token);
    } else {
      useAppStore.getState().logout();
      throw new Error('Sessão expirada. Faça login novamente.');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `${init.method ?? 'GET'} ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

const get = <T>(path: string) => request<T>(path, { cache: 'no-store' });

const post = <T>(path: string, body: unknown) =>
  request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export const tenantApi = {
  getProfile: () => get<Tenant>('/profile'),
  getProperty: () => get<Property>('/property'),
  getContract: () => get<Contract>('/contract'),
  getPayments: () => get<Payment[]>('/payments'),
  getTickets: () => get<MaintenanceTicket[]>('/tickets'),
  createTicket: (data: Omit<MaintenanceTicket, 'id' | 'tenantId' | 'status' | 'createdAt' | 'updatedAt'>) =>
    post<MaintenanceTicket>('/tickets', data),
  getNotifications: () => get<Notification[]>('/notifications'),

  uploadReceipt: (id: string, data: { receiptData: string; notes?: string; paymentMethod?: string; paymentDate?: string }) =>
    request<Payment>(`/payments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  getNotices: () => get<Notice[]>('/notices'),
  markNoticeRead: (id: string) =>
    request<Notice>(`/notices/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' }),

  markNotificationRead: (id: string) =>
    request<Notification>(`/notifications/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' }),
  markAllNotificationsRead: () =>
    request<{ ok: boolean; count: number }>('/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' }),
  deleteNotification: (id: string) =>
    request<{ ok: boolean }>(`/notifications/${id}`, { method: 'DELETE' }),

  changePassword: (newPassword: string) =>
    request<{ ok: boolean }>('/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    }, '/api/auth'),

  // Digital contracts (tenant side)
  getDigitalContracts: () => get<DigitalContract[]>('/digital-contracts'),
  getDigitalContract: (id: string) => get<DigitalContract>(`/digital-contracts/${id}`),
  signDigitalContract: (id: string, signatureData: string) =>
    post<{ ok: boolean; status: string; signedAt: string }>(`/digital-contracts/${id}/sign`, { signatureData }),
  uploadContractDocument: (id: string, data: { name: string; docType: string; fileData: string; mimeType: string; sizeBytes: number }) =>
    post<{ id: string }>(`/digital-contracts/${id}/documents`, data),
};
