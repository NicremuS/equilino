'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, CheckCircle2, Clock, AlertCircle, Calendar,
  FileText, Receipt, Phone, Mail, MapPin,
  TrendingUp, CreditCard, Eye, ThumbsUp, Loader2, X,
} from 'lucide-react';
import { useTenants, useProperties, useContracts, usePayments, useUpdatePayment } from '@/hooks/useApi';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { Payment } from '@/types';

interface PaymentProfileScreenProps {
  payment: Payment;
  onBack: () => void;
}

function daysLate(dueDate: string, paidDate?: string): number {
  const due = new Date(dueDate).getTime();
  const paid = paidDate ? new Date(paidDate).getTime() : Date.now();
  return Math.max(0, Math.ceil((paid - due) / 86400000));
}

function daysEarly(dueDate: string, paidDate: string): number {
  const due = new Date(dueDate).getTime();
  const paid = new Date(paidDate).getTime();
  return Math.max(0, Math.ceil((due - paid) / 86400000));
}

const statusConfig = {
  paid:    { icon: CheckCircle2, color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20',  label: 'Pago' },
  pending: { icon: Clock,        color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'Pendente' },
  overdue: { icon: AlertCircle,  color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    label: 'Atrasado' },
  partial: { icon: Clock,        color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'Parcial' },
};

export function PaymentProfileScreen({ payment, onBack }: PaymentProfileScreenProps) {
  const { data: tenants = [] } = useTenants();
  const { data: properties = [] } = useProperties();
  const { data: contracts = [] } = useContracts();
  const { data: payments = [] } = usePayments();
  const updatePayment = useUpdatePayment();
  const [lightbox, setLightbox] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function handleConfirm() {
    await updatePayment.mutateAsync({
      id: payment.id,
      data: { status: 'paid', paidDate: new Date().toISOString() },
    });
    setConfirmed(true);
  }

  const tenant   = tenants.find(t => t.id === payment.tenantId);
  const property = properties.find(p => p.id === payment.propertyId);
  const contract = contracts.find(c => c.id === payment.contractId);

  const cfg = statusConfig[payment.status];
  const StatusIcon = cfg.icon;

  const late  = payment.status === 'overdue' ? daysLate(payment.dueDate) : 0;
  const early = payment.status === 'paid' && payment.paidDate ? daysEarly(payment.dueDate, payment.paidDate) : 0;
  const lateOnPaid = payment.status === 'paid' && payment.paidDate ? daysLate(payment.dueDate, payment.paidDate) : 0;

  // History: other payments for same tenant
  const history = payments
    .filter(p => p.tenantId === payment.tenantId && p.id !== payment.id)
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    .slice(0, 6);

  const histCfg = (s: string) => {
    if (s === 'paid')    return 'bg-green-500';
    if (s === 'overdue') return 'bg-red-500';
    if (s === 'partial') return 'bg-orange-500';
    return 'bg-yellow-500';
  };

  return (
    <motion.div
      key="payment-profile"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.22 }}
      className="space-y-4 pb-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={18} />
          <span className="text-sm">Voltar</span>
        </button>
        <StatusBadge type="payment" status={payment.status} />
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-5`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-2xl ${cfg.bg} border ${cfg.border}`}>
            <StatusIcon size={22} className={cfg.color} />
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Referência</p>
            <p className="text-gray-300 text-xs font-mono mt-0.5"># {payment.id}</p>
          </div>
        </div>

        <p className={`text-3xl font-bold ${cfg.color}`}>{formatCurrency(payment.amount)}</p>
        <p className="text-white font-semibold mt-1">{payment.month}</p>
        <p className="text-gray-400 text-sm mt-0.5">{payment.description}</p>

        {/* Status note */}
        {payment.status === 'paid' && payment.paidDate && (
          <div className="mt-3 flex items-center gap-2">
            {early > 0 ? (
              <span className="text-green-400 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full">
                Pago {early}d antes do vencimento
              </span>
            ) : lateOnPaid > 0 ? (
              <span className="text-orange-400 text-xs font-semibold bg-orange-500/10 px-2 py-0.5 rounded-full">
                Pago com {lateOnPaid}d de atraso
              </span>
            ) : (
              <span className="text-green-400 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full">
                Pago no dia do vencimento
              </span>
            )}
          </div>
        )}
        {payment.status === 'overdue' && (
          <div className="mt-3">
            <span className="text-red-400 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full">
              {late} {late === 1 ? 'dia' : 'dias'} em atraso
            </span>
          </div>
        )}
      </motion.div>

      {/* Date cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="premium-surface rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} className="text-gray-500" />
            <p className="text-muted-foreground text-xs">Vencimento</p>
          </div>
          <p className="text-white font-semibold text-sm">{formatDate(payment.dueDate)}</p>
        </div>
        <div className="premium-surface rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={14} className={payment.paidDate ? 'text-green-400' : 'text-gray-600'} />
            <p className="text-muted-foreground text-xs">Pagamento</p>
          </div>
          <p className={`font-semibold text-sm ${payment.paidDate ? 'text-white' : 'text-gray-600'}`}>
            {payment.paidDate ? formatDate(payment.paidDate) : '—'}
          </p>
        </div>
      </motion.div>

      {/* Tenant */}
      {tenant && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
          className="premium-surface rounded-2xl p-4"
        >
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-3">Inquilino</p>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {getInitials(tenant.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">{tenant.name}</p>
              <p className="text-muted-foreground text-xs">{tenant.email}</p>
            </div>
            <div className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 px-2 py-1 rounded-full">
              <TrendingUp size={11} className="text-violet-400" />
              <span className="text-violet-400 text-xs font-bold">{tenant.score}</span>
            </div>
          </div>

          {/* Payment history dots */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-muted-foreground text-xs">Histórico de pagamentos</p>
            </div>
            <div className="flex gap-1.5">
              {/* current payment */}
              <div className={`w-7 h-2 rounded-full ${histCfg(payment.status)} ring-2 ring-white/20`} title={payment.month} />
              {history.map(h => (
                <div key={h.id} className={`w-7 h-2 rounded-full ${histCfg(h.status)} opacity-60`} title={h.month} />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <a href={`tel:${tenant.phone}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold hover:bg-green-500/20 transition-colors">
              <Phone size={12} /> Ligar
            </a>
            <a href={`mailto:${tenant.email}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border bg-card text-muted-foreground text-xs font-semibold hover:border-violet-500/30 hover:text-foreground transition-colors">
              <Mail size={12} /> E-mail
            </a>
          </div>
        </motion.div>
      )}

      {/* Property */}
      {property && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="premium-surface rounded-2xl overflow-hidden"
        >
          <p className="text-muted-foreground text-xs uppercase tracking-wider px-4 pt-4 mb-3">Imóvel</p>
          {property.image && (
            <div className="relative h-28 mx-4 rounded-xl overflow-hidden mb-3">
              <img src={property.image} alt={property.name} className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <p className="absolute bottom-2 left-3 text-white font-semibold text-sm">{property.name}</p>
            </div>
          )}
          <div className="px-4 pb-4 space-y-2">
            {!property.image && (
              <p className="text-white font-semibold text-sm">{property.name}</p>
            )}
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <MapPin size={12} />
              <span>{property.address}, {property.city}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <CreditCard size={12} />
              <span>Aluguel: <span className="text-violet-400 font-semibold">{formatCurrency(property.rentAmount)}/mês</span></span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Contract reference */}
      {contract && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.19 }}
          className="premium-surface rounded-2xl p-4"
        >
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-3">Contrato</p>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-violet-500/10">
                <FileText size={14} className="text-violet-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">#{contract.id}</p>
                <p className="text-muted-foreground text-xs">{formatDate(contract.startDate)} → {formatDate(contract.endDate)}</p>
              </div>
            </div>
            <StatusBadge type="contract" status={contract.status} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="rounded-xl bg-muted/60 dark:bg-white/3 p-3 text-center">
              <p className="text-violet-400 text-sm font-bold">{formatCurrency(contract.rentAmount)}</p>
              <p className="text-muted-foreground text-[10px] mt-0.5">Valor mensal</p>
            </div>
            <div className="rounded-xl bg-muted/60 dark:bg-white/3 p-3 text-center">
              <p className="text-white text-sm font-semibold">{contract.adjustmentIndex}</p>
              <p className="text-muted-foreground text-[10px] mt-0.5">Índice de reajuste</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Receipt */}
      {payment.receiptUrl && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="premium-surface rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Receipt size={15} className="text-violet-400" />
              <p className="text-foreground text-sm font-semibold">Comprovante enviado</p>
            </div>
            <button
              onClick={() => setLightbox(true)}
              className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              <Eye size={13} /> Ver completo
            </button>
          </div>

          {/* Thumbnail */}
          <button onClick={() => setLightbox(true)} className="w-full px-4 pb-4">
            <div className="relative rounded-xl overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={payment.receiptUrl}
                alt="Comprovante"
                className="w-full max-h-52 object-contain bg-black/20"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 transition-opacity">
                <Eye size={24} className="text-white" />
              </div>
            </div>
          </button>

          {/* Confirm action */}
          {(payment.status === 'pending' || payment.status === 'overdue' || payment.status === 'partial') && !confirmed && (
            <div className="px-4 pb-4">
              <button
                onClick={handleConfirm}
                disabled={updatePayment.isPending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {updatePayment.isPending
                  ? <Loader2 size={15} className="animate-spin" />
                  : <><ThumbsUp size={15} /> Confirmar recebimento</>
                }
              </button>
            </div>
          )}
          {confirmed && (
            <div className="px-4 pb-4">
              <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold">
                <CheckCircle2 size={15} /> Pagamento confirmado
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && payment.receiptUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightbox(false)}
          >
            <button
              onClick={() => setLightbox(false)}
              className="absolute top-4 right-4 w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={18} className="text-white" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={payment.receiptUrl}
              alt="Comprovante"
              className="max-w-full max-h-full rounded-2xl object-contain"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
