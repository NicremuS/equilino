import type {
  Property, Tenant, Payment, Contract, MaintenanceTicket,
  Inspection, Notification, Notice, DashboardStats, ChartDataPoint,
  DigitalContract, ContractTemplate, ContractDocument,
} from '@/types';
import type { CreateDigitalContractInput } from '@/lib/schemas';
import { useAppStore } from '@/store/useAppStore';

const BASE = '/api';

// Singleton refresh promise — prevents concurrent 401s from each firing their
// own refresh request. All callers await the same in-flight refresh.
let _refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST' });
      if (!res.ok) return null;
      const { accessToken } = await res.json() as { accessToken: string };
      useAppStore.getState().setAccessToken(accessToken);
      return accessToken;
    } catch {
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();
  return _refreshPromise;
}

/** Parse JWT exp claim without verifying signature (client-side only). */
function tokenExpiresInMs(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return Infinity;
    return payload.exp * 1000 - Date.now();
  } catch {
    return 0;
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

  // Proactively refresh if token is missing OR will expire within 60 seconds
  const needsRefresh = !token || tokenExpiresInMs(token) < 60_000;
  if (needsRefresh && useAppStore.getState().user) {
    token = await refreshAccessToken();
    if (!token) {
      useAppStore.getState().logout();
      throw new Error('Sessão expirada. Faça login novamente.');
    }
  }

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

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: unknown };
    let msg: string;
    if (typeof body.error === 'string') {
      msg = body.error;
    } else if (body.error && typeof body.error === 'object') {
      const fe = (body.error as { fieldErrors?: Record<string, string[]> }).fieldErrors;
      const first = fe ? Object.values(fe).flat()[0] : undefined;
      msg = first ?? 'Dados inválidos. Verifique os campos e tente novamente.';
    } else {
      msg = `${init.method ?? 'GET'} ${path} falhou: ${res.status}`;
    }
    throw new Error(msg);
  }
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

  // Payment approval
  approvePayment: (id: string) =>
    request<Payment>(`/payments/${id}/approve`, { method: 'POST' }),
  rejectPayment: (id: string, reason: string) =>
    post<Payment>(`/payments/${id}/reject`, { reason }),

  // Notifications
  getNotifications: () => get<Notification[]>('/notifications'),
  createNotification: (data: Omit<Notification, 'id' | 'createdAt' | 'read'>) => post<Notification>('/notifications', data),
  updateNotification: (id: string, data: Partial<Notification>) => put<Notification>(`/notifications/${id}`, data),
  deleteNotification: (id: string) => del(`/notifications/${id}`),

  // Notices (owner → tenant direct messages)
  getNotices: () => get<Notice[]>('/notices'),
  createNotice: (data: Omit<Notice, 'id' | 'read' | 'createdAt'>) => post<Notice>('/notices', data),
  deleteNotice: (id: string) => del(`/notices/${id}`),

  // Charts — single request, all data returned together
  getCharts: () =>
    get<{
      chartData: ChartDataPoint[];
      occupancyData: { name: string; value: number; color: string }[];
      paymentStatusData: { name: string; value: number; color: string }[];
    }>('/charts'),

  // Digital Contracts
  getDigitalContracts: (status?: string) =>
    get<DigitalContract[]>(status ? `/digital-contracts?status=${status}` : '/digital-contracts'),
  getDigitalContract: (id: string) => get<DigitalContract>(`/digital-contracts/${id}`),
  createDigitalContract: (data: CreateDigitalContractInput) => post<DigitalContract>('/digital-contracts', data),
  updateDigitalContract: (id: string, data: Partial<CreateDigitalContractInput>) =>
    put<DigitalContract>(`/digital-contracts/${id}`, data),
  deleteDigitalContract: (id: string) => del(`/digital-contracts/${id}`),
  sendDigitalContract: (id: string) =>
    request<{ ok: boolean; sentAt: string; expiresAt: string }>(`/digital-contracts/${id}/send`, { method: 'POST' }),
  signDigitalContract: (id: string, signatureData: string, signerRole: string) =>
    post<DigitalContract>(`/digital-contracts/${id}/sign`, { signatureData, signerRole }),
  updateDigitalContractStatus: (id: string, status: string, reason?: string) =>
    request<{ ok: boolean }>(`/digital-contracts/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason }),
    }),
  getContractDocuments: (id: string) => get<ContractDocument[]>(`/digital-contracts/${id}/documents`),
  uploadContractDocument: (id: string, data: Omit<ContractDocument, 'id' | 'contractId' | 'uploadedBy' | 'uploadedByRole' | 'uploadedAt'>) =>
    post<ContractDocument>(`/digital-contracts/${id}/documents`, data),
  deleteContractDocument: (id: string, docId: string) =>
    del(`/digital-contracts/${id}/documents?docId=${docId}`),

  // Contract Templates
  getContractTemplates: () => get<ContractTemplate[]>('/contract-templates'),
  getContractTemplate: (id: string) => get<ContractTemplate>(`/contract-templates/${id}`),
  createContractTemplate: (data: Omit<ContractTemplate, 'id' | 'isBuiltIn' | 'usageCount' | 'createdAt' | 'updatedAt'>) =>
    post<ContractTemplate>('/contract-templates', data),
  updateContractTemplate: (id: string, data: Partial<ContractTemplate>) =>
    put<ContractTemplate>(`/contract-templates/${id}`, data),
  deleteContractTemplate: (id: string) => del(`/contract-templates/${id}`),
};
