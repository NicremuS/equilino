'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Property, Tenant, Payment, Contract, MaintenanceTicket, Inspection, Notification, Notice } from '@/types';

// ── Queries ──────────────────────────────────────────────────────────────────

export const useDashboardStats = () =>
  useQuery({ queryKey: ['dashboard-stats'], queryFn: api.getDashboardStats });

export const useProperties = () =>
  useQuery({ queryKey: ['properties'], queryFn: api.getProperties });

export const useProperty = (id: string) =>
  useQuery({ queryKey: ['property', id], queryFn: () => api.getProperty(id), enabled: !!id });

export const useTenants = () =>
  useQuery({ queryKey: ['tenants'], queryFn: api.getTenants });

export const useTenant = (id: string) =>
  useQuery({ queryKey: ['tenant', id], queryFn: () => api.getTenant(id), enabled: !!id });

export const usePayments = () =>
  useQuery({ queryKey: ['payments'], queryFn: api.getPayments });

export const useContracts = () =>
  useQuery({ queryKey: ['contracts'], queryFn: api.getContracts });

export const useContract = (id: string) =>
  useQuery({ queryKey: ['contract', id], queryFn: () => api.getContract(id), enabled: !!id });

export const useTickets = () =>
  useQuery({ queryKey: ['tickets'], queryFn: api.getTickets });

export const useInspections = () =>
  useQuery({ queryKey: ['inspections'], queryFn: api.getInspections });

export const useInspection = (id: string) =>
  useQuery({ queryKey: ['inspection', id], queryFn: () => api.getInspection(id), enabled: !!id });

const chartsQueryBase = { queryKey: ['charts'] as const, queryFn: api.getCharts };

export const useChartData = () =>
  useQuery({ ...chartsQueryBase, select: (d) => d.chartData });

export const useOccupancyData = () =>
  useQuery({ ...chartsQueryBase, select: (d) => d.occupancyData });

export const usePaymentStatusData = () =>
  useQuery({ ...chartsQueryBase, select: (d) => d.paymentStatusData });

export const useNotifications = () =>
  useQuery({
    queryKey: ['notifications'],
    queryFn: api.getNotifications,
    refetchInterval: 8000,
    refetchIntervalInBackground: false,
  });

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Property, 'id'>) => api.createProperty(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['properties'] }),
  });
}

export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Property> }) => api.updateProperty(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteProperty(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Tenant, 'id'>) => api.createTenant(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tenant> }) => api.updateTenant(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });
}

export function useDeleteTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTenant(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Payment, 'id'>) => api.createPayment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Payment> }) => api.updatePayment(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Contract, 'id'>) => api.createContract(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Contract> }) => api.updateContract(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDeleteContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteContract(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<MaintenanceTicket, 'id'>) => api.createTicket(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MaintenanceTicket> }) => api.updateTicket(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDeleteTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTicket(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  });
}

export function useCreateInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Inspection, 'id'>) => api.createInspection(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inspections'] }),
  });
}

export function useUpdateInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Inspection> }) => api.updateInspection(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inspections'] }),
  });
}

export function useDeleteInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteInspection(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inspections'] }),
  });
}

export function useCreateNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Notification, 'id' | 'createdAt' | 'read'>) => api.createNotification(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useUpdateNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Notification> }) => api.updateNotification(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ['notifications'] });
      const prev = qc.getQueryData<Notification[]>(['notifications']);
      qc.setQueryData<Notification[]>(['notifications'], old =>
        old?.map(n => n.id === id ? { ...n, ...data } : n) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['notifications'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteNotification(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['notifications'] });
      const prev = qc.getQueryData<Notification[]>(['notifications']);
      qc.setQueryData<Notification[]>(['notifications'], old => old?.filter(n => n.id !== id) ?? []);
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['notifications'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/notifications/mark-all-read', { method: 'PATCH' });
      if (!r.ok) throw new Error(`mark-all-read failed: ${r.status}`);
      return r.json() as Promise<{ ok: boolean }>;
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['notifications'] });
      const prev = qc.getQueryData<Notification[]>(['notifications']);
      qc.setQueryData<Notification[]>(['notifications'], old =>
        old?.map(n => ({ ...n, read: true })) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['notifications'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useNotices() {
  return useQuery({ queryKey: ['notices'], queryFn: api.getNotices });
}

export function useCreateNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Notice, 'id' | 'read' | 'createdAt'>) => api.createNotice(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notices'] }),
  });
}

export function useDeleteNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteNotice(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notices'] }),
  });
}

export function useUnreadCount() {
  const { data } = useNotifications();
  return data?.filter(n => !n.read).length ?? 0;
}
