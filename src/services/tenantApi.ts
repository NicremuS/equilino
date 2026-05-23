import type { Property, Contract, Payment, MaintenanceTicket, Notification, Notice } from '@/types';
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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let token = useAppStore.getState().accessToken;

  const run = (t: string | null) =>
    fetch(`${BASE}${path}`, { ...init, headers: { ...init.headers, ...authHeaders(t) } });

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

  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path} failed: ${res.status}`);
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
  getProperty: () => get<Property>('/property'),
  getContract: () => get<Contract>('/contract'),
  getPayments: () => get<Payment[]>('/payments'),
  getTickets: () => get<MaintenanceTicket[]>('/tickets'),
  createTicket: (data: Omit<MaintenanceTicket, 'id' | 'tenantId' | 'status' | 'createdAt' | 'updatedAt'>) =>
    post<MaintenanceTicket>('/tickets', data),
  getNotifications: () => get<Notification[]>('/notifications'),

  getNotices: () => get<Notice[]>('/notices'),
  markNoticeRead: (id: string) =>
    request<Notice>(`/notices/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' }),
};
