'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '@/services/tenantApi';
import type { MaintenanceTicket, Payment } from '@/types';

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
  return useQuery({ queryKey: ['tenant', 'notifications'], queryFn: tenantApi.getNotifications });
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
