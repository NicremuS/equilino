'use client';
import { cn } from '@/lib/utils';
import type { DigitalContractStatus } from '@/types';

const STATUS_CONFIG: Record<DigitalContractStatus, { label: string; className: string }> = {
  draft:                 { label: 'Rascunho',           className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' },
  pending_review:        { label: 'Em revisão',         className: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  sent:                  { label: 'Enviado',            className: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  viewed:                { label: 'Visualizado',        className: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' },
  awaiting_signature:    { label: 'Aguard. assinatura', className: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
  signed_tenant:         { label: 'Assinado (inquilino)', className: 'bg-teal-500/15 text-teal-400 border-teal-500/20' },
  signed_landlord:       { label: 'Assinado (locador)', className: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20' },
  pending_notarization:  { label: 'Aguard. cartório',  className: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
  completed:             { label: 'Concluído',          className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  rejected:              { label: 'Rejeitado',          className: 'bg-red-500/15 text-red-400 border-red-500/20' },
  expired:               { label: 'Expirado',           className: 'bg-zinc-500/15 text-zinc-500 border-zinc-500/20' },
  cancelled:             { label: 'Cancelado',          className: 'bg-zinc-500/15 text-zinc-500 border-zinc-500/20' },
};

interface Props {
  status: DigitalContractStatus;
  size?: 'sm' | 'md';
}

export function ContractStatusBadge({ status, size = 'sm' }: Props) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={cn(
      'inline-flex items-center font-semibold rounded-full border',
      size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
      cfg.className,
    )}>
      {cfg.label}
    </span>
  );
}

export { STATUS_CONFIG };
