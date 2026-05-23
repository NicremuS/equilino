'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, CheckCircle2, Clock, AlertCircle, Calendar,
  FileText, Receipt, Phone, Mail, MapPin,
  TrendingUp, CreditCard, Eye, ThumbsUp, Loader2, X, Download,
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
  const due  = new Date(dueDate).getTime();
  const paid = paidDate ? new Date(paidDate).getTime() : Date.now();
  return Math.max(0, Math.ceil((paid - due) / 86400000));
}

function daysEarly(dueDate: string, paidDate: string): number {
  const due  = new Date(dueDate).getTime();
  const paid = new Date(paidDate).getTime();
  return Math.max(0, Math.ceil((due - paid) / 86400000));
}

const statusConfig = {
  paid:    { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Pago'      },
  pending: { icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   label: 'Pendente'  },
  overdue: { icon: AlertCircle,  color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     label: 'Atrasado'  },
  partial: { icon: Clock,        color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  label: 'Parcial'   },
};

const histCfg = (s: string) => {
  if (s === 'paid')    return 'bg-emerald-500';
  if (s === 'overdue') return 'bg-red-500';
  if (s === 'partial') return 'bg-orange-500';
  return 'bg-amber-500';
};

export function PaymentProfileScreen({ payment, onBack }: PaymentProfileScreenProps) {
  const { data: tenants    = [] } = useTenants();
  const { data: properties = [] } = useProperties();
  const { data: contracts  = [] } = useContracts();
  const { data: payments   = [] } = usePayments();
  const updatePayment = useUpdatePayment();
  const [lightbox,   setLightbox]   = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed,  setConfirmed]  = useState(false);

  const isAlreadyPaid = payment.status === 'paid';
  const canConfirm    = !isAlreadyPaid && !!payment.receiptUrl && !confirmed;

  async function handleConfirm() {
    setConfirming(true);
    try {
      await updatePayment.mutateAsync({
        id: payment.id,
        data: { status: 'paid', paidDate: new Date().toISOString() },
      });
      setConfirmed(true);
    } finally {
      setConfirming(false);
    }
  }

  function downloadReceipt() {
    if (!payment.receiptUrl) return;
    const a = document.createElement('a');
    a.href     = payment.receiptUrl;
    a.download = `comprovante-${payment.month}.jpg`;
    a.click();
  }

  const tenant   = tenants.find(t => t.id === payment.tenantId);
  const property = properties.find(p => p.id === payment.propertyId);
  const contract = contracts.find(c => c.id === payment.contractId);

  const cfg        = statusConfig[payment.status];
  const StatusIcon = cfg.icon;

  const late      = payment.status === 'overdue' ? daysLate(payment.dueDate) : 0;
  const early     = payment.status === 'paid' && payment.paidDate ? daysEarly(payment.dueDate, payment.paidDate) : 0;
  const lateOnPaid = payment.status === 'paid' && payment.paidDate ? daysLate(payment.dueDate, payment.paidDate) : 0;

  const history = payments
    .filter(p => p.tenantId === payment.tenantId && p.id !== payment.id)
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    .slice(0, 6);

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
            <p className="text-muted-foreground text-xs font-mono mt-0.5 truncate max-w-[140px]"># {payment.id.slice(0, 8)}</p>
          </div>
        </div>

        <p className={`text-3xl font-bold ${cfg.color}`}>{formatCurrency(payment.amount)}</p>
        <p className="text-foreground font-semibold mt-1">{payment.month}</p>
        <p className="text-muted-foreground text-sm mt-0.5">{payment.description}</p>

        {payment.status === 'paid' && payment.paidDate && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {early > 0 ? (
              <span className="text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Pago {early}d antes do vencimento
              </span>
            ) : lateOnPaid > 0 ? (
              <span className="text-orange-400 text-xs font-semibold bg-orange-500/10 px-2 py-0.5 rounded-full">
                Pago com {lateOnPaid}d de atraso
              </span>
            ) : (
              <span className="text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
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
            <Calendar size={14} className="text-muted-foreground" />
            <p className="text-muted-foreground text-xs">Vencimento</p>
          </div>
          <p className="text-foreground font-semibold text-sm">{formatDate(payment.dueDate)}</p>
        </div>
        <div className="premium-surface rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={14} className={payment.paidDate ? 'text-emerald-400' : 'text-muted-foreground/40'} />
            <p className="text-muted-foreground text-xs">Pagamento</p>
          </div>
          <p className={`font-semibold text-sm ${payment.paidDate ? 'text-foreground' : 'text-muted-foreground/40'}`}>
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
              <p className="text-foreground font-semibold text-sm">{tenant.name}</p>
              <p className="text-muted-foreground text-xs truncate">{tenant.email}</p>
            </div>
            <div className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 px-2 py-1 rounded-full">
              <TrendingUp size={11} className="text-violet-400" />
              <span className="text-violet-400 text-xs font-bold">{tenant.score}</span>
            </div>
          </div>

          {history.length > 0 && (
            <div className="mb-3">
              <p className="text-muted-foreground text-xs mb-2">Histórico de pagamentos</p>
              <div className="flex gap-1.5 items-center">
                <div
                  className={`w-7 h-2 rounded-full ring-2 ring-violet-500/40 ${histCfg(payment.status)}`}
                  title={payment.month}
                />
                {history.map(h => (
                  <div key={h.id} className={`w-7 h-2 rounded-full opacity-50 ${histCfg(h.status)}`} title={h.month} />
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <a href={`tel:${tenant.phone}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors">
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={property.image} alt={property.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <p className="absolute bottom-2 left-3 text-white font-semibold text-sm">{property.name}</p>
            </div>
          )}
          <div className="px-4 pb-4 space-y-2">
            {!property.image && (
              <p className="text-foreground font-semibold text-sm">{property.name}</p>
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

      {/* Contract */}
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
                <p className="text-foreground text-sm font-semibold">#{contract.id}</p>
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
              <p className="text-foreground text-sm font-semibold">{contract.adjustmentIndex}</p>
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
              <p className="text-foreground text-sm font-semibold">Comprovante</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadReceipt}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Baixar comprovante"
              >
                <Download size={13} />
              </button>
              <button
                onClick={() => setLightbox(true)}
                className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                <Eye size={13} /> Ver completo
              </button>
            </div>
          </div>

          <button onClick={() => setLightbox(true)} className="w-full px-4 pb-4">
            <div className="relative rounded-xl overflow-hidden border border-border group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={payment.receiptUrl}
                alt="Comprovante"
                className="w-full max-h-52 object-contain bg-black/10 dark:bg-black/30"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity rounded-xl">
                <Eye size={24} className="text-white" />
              </div>
            </div>
          </button>

          <AnimatePresence mode="wait">
            {canConfirm && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pb-4"
              >
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-60 text-white text-sm font-semibold transition-all"
                >
                  {confirming
                    ? <Loader2 size={15} className="animate-spin" />
                    : <><ThumbsUp size={15} /> Confirmar recebimento</>
                  }
                </button>
              </motion.div>
            )}
            {(confirmed || isAlreadyPaid) && (
              <motion.div
                key="confirmed"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-4 pb-4"
              >
                <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold">
                  <CheckCircle2 size={15} /> Pagamento confirmado
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && payment.receiptUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-4"
            onClick={() => setLightbox(false)}
          >
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                onClick={e => { e.stopPropagation(); downloadReceipt(); }}
                className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                aria-label="Baixar"
              >
                <Download size={16} className="text-white" />
              </button>
              <button
                onClick={() => setLightbox(false)}
                className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                aria-label="Fechar"
              >
                <X size={18} className="text-white" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={payment.receiptUrl}
              alt="Comprovante"
              className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
