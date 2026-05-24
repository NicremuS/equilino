'use client';
import { useState, useCallback } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, CheckCircle2, Clock, AlertCircle, Receipt,
  Upload, Eye, X, Loader2, ImageIcon, Download, ZapIcon, XCircle,
} from 'lucide-react';
import { useTenantPayments, useTenantProperty, useUploadPaymentReceipt } from '@/hooks/useTenantApi';
import { formatCurrency, formatDate, compressImage, formatBytes } from '@/lib/utils';
import { ListItemSkeleton, ApiErrorState } from '@/components/shared/LoadingSkeleton';
import type { Payment, PaymentStatus } from '@/types';

const MAX_FILE_BYTES = 20 * 1024 * 1024;

const STATUS: Record<PaymentStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  paid:              { label: 'Pago',               color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2 },
  pending:           { label: 'Pendente',            color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: Clock        },
  overdue:           { label: 'Atrasado',            color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     icon: AlertCircle  },
  partial:           { label: 'Parcial',             color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    icon: Clock        },
  awaiting_approval: { label: 'Aguardando revisão',  color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  icon: Clock        },
  rejected:          { label: 'Rejeitado',           color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     icon: XCircle      },
};

const METHODS = [
  { value: 'pix',      label: 'Pix'      },
  { value: 'transfer', label: 'TED'      },
  { value: 'boleto',   label: 'Boleto'   },
  { value: 'cash',     label: 'Dinheiro' },
  { value: 'other',    label: 'Outro'    },
] as const;

type UploadStep = 'idle' | 'compressing' | 'ready' | 'uploading' | 'done' | 'error';

function ReceiptModal({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  const uploadReceipt = useUploadPaymentReceipt();

  const [preview,       setPreview]       = useState<string | null>(null);
  const [rawSize,       setRawSize]       = useState(0);
  const [finalSize,     setFinalSize]     = useState(0);
  const [step,          setStep]          = useState<UploadStep>('idle');
  const [error,         setError]         = useState('');
  const [lightbox,      setLightbox]      = useState(false);
  const [notes,         setNotes]         = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDate,   setPaymentDate]   = useState('');

  const existing  = payment.receiptUrl;
  const canUpload = ['pending', 'overdue', 'partial', 'rejected'].includes(payment.status);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Selecione apenas arquivos de imagem (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(`Arquivo muito grande (${formatBytes(file.size)}). Máximo: 20 MB.`);
      return;
    }

    setRawSize(file.size);
    setStep('compressing');

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const compressed = await compressImage(dataUrl, 1400, 0.82);
    const compressedBytes = Math.round((compressed.length * 3) / 4);
    setFinalSize(compressedBytes);
    setPreview(compressed);
    setStep('ready');
  }, []);

  async function handleSend() {
    if (!preview) return;
    setError('');
    setStep('uploading');
    try {
      await uploadReceipt.mutateAsync({
        id: payment.id,
        receiptData: preview,
        notes: notes.trim() || undefined,
        paymentMethod: paymentMethod || undefined,
        paymentDate: paymentDate || undefined,
      });
      setStep('done');
    } catch (err) {
      setStep('error');
      setError(err instanceof Error ? err.message : 'Erro ao enviar. Tente novamente.');
    }
  }

  function downloadReceipt(src: string) {
    const a = document.createElement('a');
    a.href     = src;
    a.download = `comprovante-${payment.month}.jpg`;
    a.click();
  }

  const isBusy = step === 'compressing' || step === 'uploading';

  if (step === 'done') {
    return (
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full md:max-w-sm premium-surface rounded-t-3xl md:rounded-3xl p-8 flex flex-col items-center gap-4 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
            className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center"
          >
            <CheckCircle2 size={32} className="text-emerald-400" />
          </motion.div>
          <div>
            <p className="text-foreground font-bold text-lg">Comprovante enviado!</p>
            <p className="text-muted-foreground text-sm mt-1">O locador foi notificado automaticamente.</p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors"
          >
            Concluído
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          className="w-full md:max-w-sm premium-surface rounded-t-3xl md:rounded-3xl p-6 space-y-4 max-h-[90dvh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-foreground font-bold text-base">
                {canUpload ? 'Enviar comprovante' : 'Comprovante'}
              </h2>
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
              <div className="flex items-center justify-between">
                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> Comprovante enviado
                </p>
                <button
                  onClick={() => downloadReceipt(existing)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Baixar"
                >
                  <Download size={14} />
                </button>
              </div>
              <button
                onClick={() => setLightbox(true)}
                className="relative w-full rounded-2xl overflow-hidden border border-emerald-500/20 bg-emerald-500/5 group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={existing} alt="Comprovante" className="w-full max-h-56 object-contain" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                  <Eye size={22} className="text-white" />
                </div>
              </button>
              {canUpload && (
                <p className="text-xs text-muted-foreground text-center">Você pode substituir enviando um novo arquivo abaixo.</p>
              )}
            </div>
          )}

          {/* Compressing */}
          {step === 'compressing' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                <ZapIcon size={22} className="text-violet-400 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-foreground font-medium text-sm">Otimizando imagem…</p>
                <p className="text-muted-foreground text-xs mt-0.5">Comprimindo {formatBytes(rawSize)}</p>
              </div>
            </div>
          )}

          {/* Preview */}
          {preview && step !== 'compressing' && (
            <div className="space-y-2">
              <div className="relative rounded-2xl overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Preview" className="w-full max-h-56 object-contain bg-black/10 dark:bg-black/30" />
                {step === 'ready' && (
                  <button
                    onClick={() => { setPreview(null); setStep('idle'); }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center transition-colors"
                  >
                    <X size={13} className="text-white" />
                  </button>
                )}
              </div>
              {rawSize > 0 && finalSize > 0 && rawSize !== finalSize && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                  <ZapIcon size={10} />
                  Comprimido: {formatBytes(rawSize)} → {formatBytes(finalSize)}
                </div>
              )}
            </div>
          )}

          {/* Upload area */}
          {canUpload && !preview && step !== 'compressing' && (
            <label className="flex items-center gap-3 px-4 py-3.5 bg-muted/70 dark:bg-[#111827] border border-dashed border-border hover:border-emerald-500/50 rounded-2xl cursor-pointer transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                <ImageIcon size={16} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground leading-tight">Selecionar comprovante</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">JPG, PNG, WEBP — máx. 20 MB</p>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={isBusy} />
            </label>
          )}

          {/* Extra fields (method / date / notes) */}
          {canUpload && step !== 'compressing' && step !== 'uploading' && (
            <div className="space-y-3">
              {/* Payment method */}
              <div>
                <p className="text-muted-foreground text-xs mb-2">Forma de pagamento</p>
                <div className="flex flex-wrap gap-1.5">
                  {METHODS.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(prev => prev === m.value ? '' : m.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        paymentMethod === m.value
                          ? 'bg-violet-500 border-violet-500 text-white'
                          : 'border-border text-muted-foreground hover:border-violet-500/30 hover:text-foreground'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment date */}
              <div>
                <p className="text-muted-foreground text-xs mb-1.5">Data do pagamento</p>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/50 dark:bg-white/3 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>

              {/* Notes */}
              <div>
                <p className="text-muted-foreground text-xs mb-1.5">Observação (opcional)</p>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ex: Pagamento referente ao mês de maio…"
                  maxLength={500}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-muted/50 dark:bg-white/3 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-violet-500/50 resize-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Upload progress */}
          {step === 'uploading' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Enviando…</span>
                <Loader2 size={12} className="animate-spin text-emerald-400" />
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500 rounded-full"
                  initial={{ width: '15%' }}
                  animate={{ width: '85%' }}
                  transition={{ duration: 1.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-xs flex items-center gap-1.5">
              <AlertCircle size={12} /> {error}
            </p>
          )}

          {/* Send button */}
          {canUpload && preview && step === 'ready' && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSend}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Upload size={15} /> Enviar comprovante
            </motion.button>
          )}

          {!canUpload && !existing && (
            <p className="text-center text-muted-foreground text-sm py-2">
              Comprovante disponível apenas para pagamentos pendentes ou atrasados.
            </p>
          )}
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && existing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/92 p-4"
            onClick={() => setLightbox(false)}
          >
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                onClick={e => { e.stopPropagation(); downloadReceipt(existing); }}
                className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <Download size={16} className="text-white" />
              </button>
              <button
                onClick={() => setLightbox(false)}
                className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={18} className="text-white" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={existing}
              alt="Comprovante"
              className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function TenantPaymentsScreen() {
  const { data: payments, isLoading, isError, refetch } = useTenantPayments();
  const { data: property } = useTenantProperty();
  const [selected, setSelected] = useState<Payment | null>(null);

  if (isLoading) return <ListItemSkeleton count={4} />;
  if (isError)   return <ApiErrorState onRetry={refetch} />;

  const totalPaid = payments?.reduce((s, p) => s + (p.status === 'paid' ? p.amount : 0), 0) ?? 0;
  const due       = payments?.find(p => p.status === 'pending' || p.status === 'overdue');

  return (
    <div className="space-y-5 pb-4">
      <motion.h1
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-foreground"
      >
        Pagamentos
      </motion.h1>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="premium-surface rounded-2xl p-4">
          <p className="text-muted-foreground text-xs mb-1">Total pago</p>
          <p className="text-foreground font-bold text-lg">{formatCurrency(totalPaid)}</p>
        </div>
        <div className={`rounded-2xl p-4 border ${due ? 'bg-red-500/8 border-red-500/20' : 'premium-surface'}`}>
          <p className="text-muted-foreground text-xs mb-1">Próximo</p>
          {due ? (
            <>
              <p className="text-red-400 font-bold text-lg">{formatCurrency(due.amount)}</p>
              <p className="text-red-400/70 text-xs mt-0.5">Vence {formatDate(due.dueDate)}</p>
            </>
          ) : (
            <p className="text-emerald-400 font-bold text-sm mt-1 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Em dia
            </p>
          )}
        </div>
      </motion.div>

      {/* List */}
      <div className="space-y-2">
        {(payments ?? []).map((payment, i) => {
          const s        = STATUS[payment.status];
          const Icon     = s.icon;
          const hasReceipt = !!payment.receiptUrl;

          return (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}
              className={`rounded-2xl border p-4 transition-colors ${s.border} ${s.bg}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg} border ${s.border}`}>
                  <Icon size={16} className={s.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-semibold text-sm">{payment.month}</p>
                  {property && <p className="text-muted-foreground text-xs truncate">{property.name}</p>}
                  <p className="text-muted-foreground text-xs">Vence {formatDate(payment.dueDate)}</p>
                  {payment.paidDate && (
                    <p className="text-muted-foreground text-xs">Pago {formatDate(payment.paidDate)}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
                  <p className="text-foreground font-bold">{formatCurrency(payment.amount)}</p>
                  <span className={`text-xs font-semibold ${s.color}`}>{s.label}</span>
                </div>
              </div>

              {/* Status-specific footer */}
              {payment.status === 'awaiting_approval' && (
                <div className="mt-3 pt-3 border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="relative flex-shrink-0">
                      <span className="flex w-2 h-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-60" />
                        <span className="relative inline-flex rounded-full w-2 h-2 bg-violet-400" />
                      </span>
                    </span>
                    <p className="text-violet-400 text-xs font-medium">Aguardando revisão do locador</p>
                  </div>
                  {payment.submittedAt && (
                    <p className="text-muted-foreground text-[10px] mt-1 ml-4">
                      Enviado {formatDate(payment.submittedAt)}
                    </p>
                  )}
                </div>
              )}

              {payment.status === 'rejected' && (
                <div className="mt-3 pt-3 border-t border-border/40 space-y-2">
                  {payment.rejectionReason && (
                    <p className="text-red-400/80 text-xs leading-relaxed">{payment.rejectionReason}</p>
                  )}
                  <button
                    onClick={() => setSelected(payment)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors"
                  >
                    <Upload size={11} /> Reenviar comprovante
                  </button>
                </div>
              )}

              {['pending', 'overdue', 'partial'].includes(payment.status) && (
                <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
                  {hasReceipt ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <CheckCircle2 size={12} /> Comprovante enviado
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/70">Nenhum comprovante</span>
                  )}
                  <button
                    onClick={() => setSelected(payment)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      hasReceipt
                        ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                    }`}
                  >
                    {hasReceipt ? <><Eye size={11} /> Ver</> : <><Upload size={11} /> Enviar</>}
                  </button>
                </div>
              )}

              {payment.status === 'paid' && hasReceipt && (
                <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 size={12} /> Pagamento confirmado
                  </span>
                  <button
                    onClick={() => setSelected(payment)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                  >
                    <Eye size={11} /> Ver comprovante
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}

        {payments?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhum pagamento encontrado</p>
            <p className="text-xs mt-1 opacity-70">Tudo em dia por aqui!</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <ReceiptModal key={selected.id} payment={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
