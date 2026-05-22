import type {
  Property, Tenant, Payment, Contract, MaintenanceTicket,
  Inspection, Notification, DashboardStats, ChartDataPoint,
} from '@/types';

const BASE = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error(`DELETE ${path} failed: ${res.status}`);
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
