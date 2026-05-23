'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '@/services/tenantApi';
import type { MaintenanceTicket } from '@/types';

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
