'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '@/services/tenantApi';
import type { MaintenanceTicket, Notification, Payment, DigitalContract } from '@/types';

export function useTenantProfile() {
  return useQuery({ queryKey: ['tenant', 'profile'], queryFn: tenantApi.getProfile });
}

export function useTenantProperty() {
  return useQuery({ queryKey: ['tenant', 'property'], queryFn: tenantApi.getProperty });
}

export function useTenantContract() {
  return useQuery({ queryKey: ['tenant', 'contract'], queryFn: tenantApi.getContract });
}

export function useTenantPayments() {
  return useQuery({ queryKey: ['tenant', 'payments'], queryFn: tenantApi.getPayments });
}

export function useTenantTickets() {
  return useQuery({ queryKey: ['tenant', 'tickets'], queryFn: tenantApi.getTickets });
}

export function useCreateTenantTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<MaintenanceTicket, 'id' | 'tenantId' | 'status' | 'createdAt' | 'updatedAt'>) =>
      tenantApi.createTicket(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', 'tickets'] }),
  });
}

export function useTenantNotifications() {
  return useQuery({
    queryKey: ['tenant', 'notifications'],
    queryFn: tenantApi.getNotifications,
    refetchInterval: 8000,
    refetchIntervalInBackground: false,
  });
}

export function useTenantUnreadCount() {
  const { data } = useTenantNotifications();
  return data?.filter(n => !n.read).length ?? 0;
}

export function useMarkTenantNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantApi.markNotificationRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['tenant', 'notifications'] });
      const prev = qc.getQueryData<Notification[]>(['tenant', 'notifications']);
      qc.setQueryData<Notification[]>(['tenant', 'notifications'],
        old => old?.map(n => n.id === id ? { ...n, read: true } : n) ?? []
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tenant', 'notifications'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tenant', 'notifications'] }),
  });
}

export function useMarkAllTenantNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => tenantApi.markAllNotificationsRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['tenant', 'notifications'] });
      const prev = qc.getQueryData<Notification[]>(['tenant', 'notifications']);
      qc.setQueryData<Notification[]>(['tenant', 'notifications'],
        old => old?.map(n => ({ ...n, read: true })) ?? []
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tenant', 'notifications'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tenant', 'notifications'] }),
  });
}

export function useDeleteTenantNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantApi.deleteNotification(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['tenant', 'notifications'] });
      const prev = qc.getQueryData<Notification[]>(['tenant', 'notifications']);
      qc.setQueryData<Notification[]>(['tenant', 'notifications'],
        old => old?.filter(n => n.id !== id) ?? []
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tenant', 'notifications'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tenant', 'notifications'] }),
  });
}

type UploadReceiptArgs = { id: string; receiptData: string; notes?: string; paymentMethod?: string; paymentDate?: string };

export function useUploadPaymentReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, receiptData, notes, paymentMethod, paymentDate }: UploadReceiptArgs) =>
      tenantApi.uploadReceipt(id, { receiptData, notes, paymentMethod, paymentDate }),
    onMutate: async ({ id, receiptData }) => {
      await qc.cancelQueries({ queryKey: ['tenant', 'payments'] });
      const prev = qc.getQueryData<Payment[]>(['tenant', 'payments']);
      qc.setQueryData<Payment[]>(['tenant', 'payments'], old =>
        old?.map(p => p.id === id
          ? { ...p, receiptUrl: receiptData, status: 'awaiting_approval' as const, submittedAt: new Date().toISOString() }
          : p
        ) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tenant', 'payments'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tenant', 'payments'] }),
  });
}

export function useTenantNotices() {
  return useQuery({ queryKey: ['tenant', 'notices'], queryFn: tenantApi.getNotices });
}

export function useMarkTenantNoticeRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantApi.markNoticeRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', 'notices'] }),
  });
}

// ─── Tenant Digital Contracts ─────────────────────────────────────────────────

export function useTenantDigitalContracts() {
  return useQuery({
    queryKey: ['tenant', 'digital-contracts'],
    queryFn: tenantApi.getDigitalContracts,
  });
}

export function useTenantDigitalContract(id: string) {
  return useQuery({
    queryKey: ['tenant', 'digital-contract', id],
    queryFn: () => tenantApi.getDigitalContract(id),
    enabled: !!id,
  });
}

export function useSignTenantDigitalContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signatureData }: { id: string; signatureData: string }) =>
      tenantApi.signDigitalContract(id, signatureData),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['tenant', 'digital-contracts'] });
      qc.invalidateQueries({ queryKey: ['tenant', 'digital-contract', id] });
      qc.invalidateQueries({ queryKey: ['tenant', 'notifications'] });
    },
  });
}

export function useUploadTenantContractDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof tenantApi.uploadContractDocument>[1] }) =>
      tenantApi.uploadContractDocument(id, data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['tenant', 'digital-contract', id] });
    },
  });
}

export function useTenantPendingContractsCount() {
  const { data } = useTenantDigitalContracts();
  return data?.filter(c => ['sent', 'viewed', 'awaiting_signature'].includes(c.status)).length ?? 0;
}
