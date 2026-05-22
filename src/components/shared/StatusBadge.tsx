'use client';
import { cn } from '@/lib/utils';
import type { PaymentStatus, PropertyStatus, ContractStatus, TicketStatus, TicketPriority } from '@/types';

const paymentConfig: Record<PaymentStatus, { label: string; class: string }> = {
  paid: { label: 'Pago', class: 'bg-green-500/15 text-green-400 border-green-500/20' },
  pending: { label: 'Pendente', class: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  overdue: { label: 'Atrasado', class: 'bg-red-500/15 text-red-400 border-red-500/20' },
  partial: { label: 'Parcial', class: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
};

const propertyConfig: Record<PropertyStatus, { label: string; class: string }> = {
  occupied: { label: 'Ocupado', class: 'bg-green-500/15 text-green-400 border-green-500/20' },
  vacant: { label: 'Vago', class: 'bg-gray-500/15 text-gray-400 border-gray-500/20' },
  maintenance: { label: 'Manutenção', class: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  reserved: { label: 'Reservado', class: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
};

const contractConfig: Record<ContractStatus, { label: string; class: string }> = {
  active: { label: 'Ativo', class: 'bg-green-500/15 text-green-400 border-green-500/20' },
  expiring: { label: 'Vencendo', class: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  expired: { label: 'Vencido', class: 'bg-red-500/15 text-red-400 border-red-500/20' },
  terminated: { label: 'Rescindido', class: 'bg-gray-500/15 text-gray-400 border-gray-500/20' },
};

const ticketStatusConfig: Record<TicketStatus, { label: string; class: string }> = {
  open: { label: 'Aberto', class: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  in_progress: { label: 'Em andamento', class: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  resolved: { label: 'Resolvido', class: 'bg-green-500/15 text-green-400 border-green-500/20' },
  closed: { label: 'Fechado', class: 'bg-gray-500/15 text-gray-400 border-gray-500/20' },
};

const priorityConfig: Record<TicketPriority, { label: string; class: string }> = {
  low: { label: 'Baixa', class: 'bg-gray-500/15 text-gray-400 border-gray-500/20' },
  medium: { label: 'Média', class: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  high: { label: 'Alta', class: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
  urgent: { label: 'Urgente', class: 'bg-red-500/15 text-red-400 border-red-500/20' },
};

interface StatusBadgeProps {
  type: 'payment' | 'property' | 'contract' | 'ticket' | 'priority';
  status: string;
  className?: string;
}

export function StatusBadge({ type, status, className }: StatusBadgeProps) {
  const configs = {
    payment: paymentConfig,
    property: propertyConfig,
    contract: contractConfig,
    ticket: ticketStatusConfig,
    priority: priorityConfig,
  };

  const config = (configs[type] as Record<string, { label: string; class: string }>)[status];
  if (!config) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        config.class,
        className
      )}
    >
      {config.label}
    </span>
  );
}
