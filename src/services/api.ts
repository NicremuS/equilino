import type {
  Property, Tenant, Payment, Contract, MaintenanceTicket,
  Inspection, Notification, DashboardStats, ChartDataPoint,
} from '@/types';
import { useAppStore } from '@/store/useAppStore';

const BASE = '/api';

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

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let token = useAppStore.getState().accessToken;

  const run = (t: string | null) =>
    fetch(`${BASE}${path}`, {
      ...init,
      headers: { ...init.headers, ...authHeaders(t) },
    });

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
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

function get<T>(path: string) {
  return request<T>(path, { cache: 'no-store' });
}

function post<T>(path: string, body: unknown) {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function put<T>(path: string, body: unknown) {
  return request<T>(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function del(path: string) {
  return request<void>(path, { method: 'DELETE' });
}

export const api = {
  // Dashboard
  getDashboardStats: () => get<DashboardStats>('/dashboard'),

  // Properties
  getProperties: () => get<Property[]>('/properties'),
  getProperty: (id: string) => get<Property>(`/properties/${id}`),
  createProperty: (data: Omit<Property, 'id'>) => post<Property>('/properties', data),
  updateProperty: (id: string, data: Partial<Property>) => put<Property>(`/properties/${id}`, data),
  deleteProperty: (id: string) => del(`/properties/${id}`),

  // Tenants
  getTenants: () => get<Tenant[]>('/tenants'),
  getTenant: (id: string) => get<Tenant>(`/tenants/${id}`),
  createTenant: (data: Omit<Tenant, 'id'>) => post<Tenant>('/tenants', data),
  updateTenant: (id: string, data: Partial<Tenant>) => put<Tenant>(`/tenants/${id}`, data),
  deleteTenant: (id: string) => del(`/tenants/${id}`),

  // Payments
  getPayments: () => get<Payment[]>('/payments'),
  createPayment: (data: Omit<Payment, 'id'>) => post<Payment>('/payments', data),
  updatePayment: (id: string, data: Partial<Payment>) => put<Payment>(`/payments/${id}`, data),
  deletePayment: (id: string) => del(`/payments/${id}`),

  // Contracts
  getContracts: () => get<Contract[]>('/contracts'),
  getContract: (id: string) => get<Contract>(`/contracts/${id}`),
  createContract: (data: Omit<Contract, 'id'>) => post<Contract>('/contracts', data),
  updateContract: (id: string, data: Partial<Contract>) => put<Contract>(`/contracts/${id}`, data),
  deleteContract: (id: string) => del(`/contracts/${id}`),

  // Tickets
  getTickets: () => get<MaintenanceTicket[]>('/tickets'),
  getTicket: (id: string) => get<MaintenanceTicket>(`/tickets/${id}`),
  createTicket: (data: Omit<MaintenanceTicket, 'id'>) => post<MaintenanceTicket>('/tickets', data),
  updateTicket: (id: string, data: Partial<MaintenanceTicket>) => put<MaintenanceTicket>(`/tickets/${id}`, data),
  deleteTicket: (id: string) => del(`/tickets/${id}`),

  // Inspections
  getInspections: () => get<Inspection[]>('/inspections'),
  getInspection: (id: string) => get<Inspection>(`/inspections/${id}`),
  createInspection: (data: Omit<Inspection, 'id'>) => post<Inspection>('/inspections', data),
  updateInspection: (id: string, data: Partial<Inspection>) => put<Inspection>(`/inspections/${id}`, data),
  deleteInspection: (id: string) => del(`/inspections/${id}`),

  // Notifications
  getNotifications: () => get<Notification[]>('/notifications'),
  createNotification: (data: Omit<Notification, 'id' | 'createdAt' | 'read'>) => post<Notification>('/notifications', data),
  updateNotification: (id: string, data: Partial<Notification>) => put<Notification>(`/notifications/${id}`, data),
  deleteNotification: (id: string) => del(`/notifications/${id}`),

  // Charts — single request, all data returned together
  getCharts: () =>
    get<{
      chartData: ChartDataPoint[];
      occupancyData: { name: string; value: number; color: string }[];
      paymentStatusData: { name: string; value: number; color: string }[];
    }>('/charts'),
};
