'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, CheckCircle2, Clock, AlertCircle, Receipt, Upload, Eye, X, Loader2, ImageIcon } from 'lucide-react';
import { useTenantPayments, useUploadPaymentReceipt } from '@/hooks/useTenantApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ListItemSkeleton, ApiErrorState } from '@/components/shared/LoadingSkeleton';
import type { Payment, PaymentStatus } from '@/types';

const STATUS = {
  paid:    { label: 'Pago',     color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  pending: { label: 'Pendente', color: 'text-amber-400',   bg: 'bg-amber-500/10',   icon: Clock },
  overdue: { label: 'Atrasado', color: 'text-red-400',     bg: 'bg-red-500/10',     icon: AlertCircle },
  partial: { label: 'Parcial',  color: 'text-blue-400',    bg: 'bg-blue-500/10',    icon: Clock },
} satisfies Record<PaymentStatus, { label: string; color: string; bg: string; icon: React.ElementType }>;

function ReceiptModal({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  const uploadReceipt = useUploadPaymentReceipt();
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function handleSend() {
    if (!preview) return;
    setError('');
    try {
      await uploadReceipt.mutateAsync({ id: payment.id, receiptData: preview });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar. Tente novamente.');
    }
  }

  const existing = payment.receiptUrl;
  const canUpload = payment.status === 'pending' || payment.status === 'overdue' || payment.status === 'partial';

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        className="w-full md:max-w-sm premium-surface rounded-t-3xl md:rounded-3xl p-6 space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-foreground font-bold text-base">Comprovante</h2>
            <p className="text-muted-foreground text-xs mt-0.5">
              {payment.month} · {formatCurrency(payment.amount)}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Existing receipt */}
        {existing && !preview && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Comprovante enviado</p>
            <div className="relative rounded-2xl overflow-hidden border border-emerald-500/20 bg-emerald-500/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={existing} alt="Comprovante" className="w-full max-h-64 object-contain" />
              <a
                href={existing}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/80 rounded-xl text-white text-xs font-medium transition-colors"
              >
                <Eye size={12} /> Ver completo
              </a>
            </div>
            {canUpload && (
              <p className="text-xs text-muted-foreground text-center">
                Você pode substituir enviando um novo arquivo abaixo.
              </p>
            )}
          </div>
        )}

        {/* New image preview */}
        {preview && (
          <div className="relative rounded-2xl overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="w-full max-h-60 object-contain bg-black/30" />
            <button
              onClick={() => setPreview(null)}
              className="absolute top-2 right-2 w-7 h-7 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={13} className="text-white" />
            </button>
          </div>
        )}

        {/* Upload area (shown when can upload and no preview yet) */}
        {canUpload && !preview && (
          <label className="flex items-center gap-3 px-4 py-3.5 bg-muted/70 dark:bg-[#111827] border border-dashed border-border hover:border-emerald-500/50 rounded-2xl cursor-pointer transition-colors group">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
              <ImageIcon size={16} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground leading-tight">Selecionar comprovante</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Imagem ou PDF convertido em imagem</p>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
        )}

        {error && (
          <p className="text-red-400 text-xs flex items-center gap-1.5">
            <AlertCircle size={12} /> {error}
          </p>
        )}

        {/* Actions */}
        {canUpload && preview && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSend}
            disabled={uploadReceipt.isPending}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {uploadReceipt.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <><Upload size={15} /> Enviar comprovante</>
            )}
          </motion.button>
        )}

        {!canUpload && !existing && (
          <p className="text-center text-muted-foreground text-sm py-2">
            Este pagamento não aceita comprovante.
          </p>
        )}
      </motion.div>
    </div>
  );
}

export function TenantPaymentsScreen() {
  const { data: payments, isLoading, isError, refetch } = useTenantPayments();
  const [selected, setSelected] = useState<Payment | null>(null);

  if (isLoading) return <ListItemSkeleton count={4} />;
  if (isError) return <ApiErrorState onRetry={refetch} />;

  const total = payments?.reduce((s, p) => s + (p.status === 'paid' ? p.amount : 0), 0) ?? 0;
  const pending = payments?.find(p => p.status === 'pending' || p.status === 'overdue');

  return (
    <div className="space-y-5 pb-4">
      <motion.h1
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-foreground"
      >
        Pagamentos
      </motion.h1>

      {/* Summary cards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="premium-surface rounded-2xl p-4">
          <p className="text-muted-foreground text-xs mb-1">Total pago</p>
          <p className="text-foreground font-bold text-lg">{formatCurrency(total)}</p>
        </div>
        <div className={`rounded-2xl p-4 ${pending ? 'bg-red-500/10 border border-red-500/20' : 'premium-surface'}`}>
          <p className="text-muted-foreground text-xs mb-1">Próximo</p>
          {pending ? (
            <>
              <p className="text-red-400 font-bold text-lg">{formatCurrency(pending.amount)}</p>
              <p className="text-red-400/70 text-xs">{pending.month}</p>
            </>
          ) : (
            <p className="text-emerald-400 font-bold text-sm mt-1">Em dia ✓</p>
          )}
        </div>
      </motion.div>

      {/* Payment list */}
      <div className="space-y-2">
        {(payments ?? []).map((payment, i) => {
          const s = STATUS[payment.status];
          const Icon = s.icon;
          const hasReceipt = !!payment.receiptUrl;
          const canAct = payment.status === 'pending' || payment.status === 'overdue' || payment.status === 'partial' || hasReceipt;

          return (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}
              className="premium-surface rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                  <Icon size={17} className={s.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-semibold text-sm">{payment.month}</p>
                  <p className="text-muted-foreground text-xs">
                    Vence {formatDate(payment.dueDate)}
                    {payment.paidDate && ` · Pago ${formatDate(payment.paidDate)}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
                  <p className="text-foreground font-bold">{formatCurrency(payment.amount)}</p>
                  <span className={`text-xs font-medium ${s.color}`}>{s.label}</span>
                </div>
              </div>

              {canAct && (
                <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                  {hasReceipt ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <CheckCircle2 size={13} /> Comprovante enviado
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Nenhum comprovante</span>
                  )}
                  <button
                    onClick={() => setSelected(payment)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      hasReceipt
                        ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                    }`}
                  >
                    {hasReceipt ? (
                      <><Eye size={12} /> Ver</>
                    ) : (
                      <><Upload size={12} /> Enviar</>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}

        {payments?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhum pagamento encontrado.</p>
          </div>
        )}
      </div>

      {/* Receipt modal */}
      <AnimatePresence>
        {selected && (
          <ReceiptModal payment={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
