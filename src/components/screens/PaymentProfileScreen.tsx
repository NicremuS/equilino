'use client';
import { useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, CheckCircle2, Clock, AlertCircle, Calendar,
  FileText, Receipt, Phone, Mail, MapPin,
  TrendingUp, CreditCard, Eye, Loader2, X, Download, XCircle,
} from 'lucide-react';
import { useTenants, useProperties, useContracts, usePayments, useApprovePayment, useRejectPayment } from '@/hooks/useApi';
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

const METHOD_PT: Record<string, string> = {
  pix: 'Pix', transfer: 'TED/Transferência', boleto: 'Boleto', cash: 'Dinheiro', other: 'Outro',
};

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  paid:              { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  pending:           { icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
  overdue:           { icon: AlertCircle,  color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20'     },
  partial:           { icon: Clock,        color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20'  },
  awaiting_approval: { icon: Clock,        color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20'  },
  rejected:          { icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20'     },
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
  const approvePayment = useApprovePayment();
  const rejectPayment  = useRejectPayment();
  const [lightbox,      setLightbox]      = useState(false);
  const [approving,     setApproving]     = useState(false);
  const [showReject,    setShowReject]    = useState(false);
  const [rejectReason,  setRejectReason]  = useState('');
  const [rejecting,     setRejecting]     = useState(false);

  const isAwaiting = payment.status === 'awaiting_approval';
  const isRejected = payment.status === 'rejected';

  async function handleApprove() {
    setApproving(true);
    try {
      await approvePayment.mutateAsync(payment.id);
      onBack();
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    if (rejectReason.trim().length < 5) return;
    setRejecting(true);
    try {
      await rejectPayment.mutateAsync({ id: payment.id, reason: rejectReason.trim() });
      onBack();
    } finally {
      setRejecting(false);
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

  const cfg        = statusConfig[payment.status] ?? statusConfig.pending;
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

      {/* Awaiting approval banner */}
      {isAwaiting && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-violet-500/30 bg-violet-500/8 p-4 flex items-center gap-3"
        >
          <span className="relative flex-shrink-0">
            <span className="flex w-2.5 h-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-60" />
              <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-violet-400" />
            </span>
          </span>
          <div>
            <p className="text-violet-400 font-semibold text-sm">Comprovante aguardando aprovação</p>
            <p className="text-violet-400/60 text-xs mt-0.5">
              Enviado {payment.submittedAt ? formatDate(payment.submittedAt) : 'recentemente'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Rejected banner */}
      {isRejected && payment.rejectionReason && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-red-500/30 bg-red-500/8 p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <XCircle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-red-400 font-semibold text-sm">Comprovante rejeitado</p>
          </div>
          <p className="text-red-400/80 text-xs mt-1 leading-relaxed">{payment.rejectionReason}</p>
          {payment.approvedAt && (
            <p className="text-muted-foreground text-[10px] mt-1.5">{formatDate(payment.approvedAt)}</p>
          )}
        </motion.div>
      )}

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

      {/* Submission details */}
      {(isAwaiting || isRejected) && (payment.receiptNotes || payment.paymentMethod || payment.paymentDate) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="premium-surface rounded-2xl p-4"
        >
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-3">Detalhes do envio</p>
          <div className="space-y-2">
            {payment.paymentMethod && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Método</span>
                <span className="text-foreground text-xs font-medium">
                  {METHOD_PT[payment.paymentMethod] ?? payment.paymentMethod}
                </span>
              </div>
            )}
            {payment.paymentDate && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Data do pagamento</span>
                <span className="text-foreground text-xs font-medium">{formatDate(payment.paymentDate)}</span>
              </div>
            )}
          </div>
          {payment.receiptNotes && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-muted-foreground text-xs mb-1">Observação do inquilino</p>
              <p className="text-foreground text-sm leading-relaxed">{payment.receiptNotes}</p>
            </div>
          )}
        </motion.div>
      )}

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
                className="text-muted-foreground hover:text-foreground transition-colors"
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

          {/* Approval / rejection panel */}
          {isAwaiting && (
            <div className="px-4 pb-4 space-y-2">
              <AnimatePresence mode="wait">
                {!showReject ? (
                  <motion.div
                    key="action-buttons"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-2"
                  >
                    <button
                      onClick={handleApprove}
                      disabled={approving || rejecting}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-60 text-white text-sm font-semibold transition-all"
                    >
                      {approving
                        ? <Loader2 size={15} className="animate-spin" />
                        : <><CheckCircle2 size={15} /> Aprovar</>
                      }
                    </button>
                    <button
                      onClick={() => setShowReject(true)}
                      disabled={approving || rejecting}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-500/30 bg-red-500/8 hover:bg-red-500/15 active:scale-[0.98] disabled:opacity-60 text-red-400 text-sm font-semibold transition-all"
                    >
                      <XCircle size={15} /> Rejeitar
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="reject-panel"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-2"
                  >
                    <p className="text-foreground text-sm font-medium">Motivo da rejeição</p>
                    <textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Explique por que o comprovante está sendo rejeitado (mín. 5 caracteres)"
                      className="w-full rounded-2xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-red-500/50 resize-none transition-colors"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowReject(false); setRejectReason(''); }}
                        disabled={rejecting}
                        className="flex-1 py-2.5 rounded-2xl border border-border text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={rejecting || rejectReason.trim().length < 5}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 active:scale-[0.98] disabled:opacity-50 text-white text-sm font-semibold transition-all"
                      >
                        {rejecting ? <Loader2 size={14} className="animate-spin" /> : 'Confirmar rejeição'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {payment.status === 'paid' && (
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
