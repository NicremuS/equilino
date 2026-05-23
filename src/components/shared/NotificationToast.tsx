'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCircle2, Wrench, CreditCard, FileText, AlertTriangle,
  Sparkles, X, ReceiptText, ShieldAlert, Clock,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useApi';
import { useAppStore } from '@/store/useAppStore';
import type { Notification, NotificationType } from '@/types';

const DURATION = 5000;

interface IconCfg { icon: React.ElementType; color: string; bg: string }

function resolveIcon(type: NotificationType, title: string): IconCfg {
  const t = title.toLowerCase();
  if (t.includes('comprovante') || t.includes('recibo'))
    return { icon: ReceiptText,  color: 'text-teal-400',    bg: 'bg-teal-500/15'    };
  if (t.includes('recebido') || t.includes('pago'))
    return { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/15' };
  if (t.includes('atraso') || t.includes('vencido') || t.includes('inadimpl'))
    return { icon: ShieldAlert,  color: 'text-red-400',     bg: 'bg-red-500/15'     };
  if (t.includes('chamado') && (t.includes('novo') || t.includes('manutenção')))
    return { icon: Wrench,       color: 'text-orange-400',  bg: 'bg-orange-500/15'  };
  if (t.includes('vencimento') || t.includes('expira'))
    return { icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-500/15'   };

  const fallback: Record<NotificationType, IconCfg> = {
    payment:     { icon: CreditCard,    color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    contract:    { icon: FileText,      color: 'text-blue-400',    bg: 'bg-blue-500/15'   },
    maintenance: { icon: Wrench,        color: 'text-orange-400',  bg: 'bg-orange-500/15' },
    system:      { icon: Sparkles,      color: 'text-violet-400',  bg: 'bg-violet-500/15' },
    alert:       { icon: AlertTriangle, color: 'text-red-400',     bg: 'bg-red-500/15'    },
  };
  return fallback[type];
}

interface ToastItem extends Notification { key: string }

export function NotificationToast() {
  const { data: notifications } = useNotifications();
  const setActiveTab = useAppStore(s => s.setActiveTab);
  const seenIds      = useRef<Set<string>>(new Set());
  const initialized  = useRef(false);
  const [toasts, setToasts]   = useState<ToastItem[]>([]);

  useEffect(() => {
    if (!notifications) return;
    if (!initialized.current) {
      notifications.forEach(n => seenIds.current.add(n.id));
      initialized.current = true;
      return;
    }
    const fresh = notifications.filter(n => !n.read && !seenIds.current.has(n.id));
    fresh.forEach(n => seenIds.current.add(n.id));
    if (fresh.length === 0) return;
    const items: ToastItem[] = fresh.map(n => ({ ...n, key: `${n.id}-${Date.now()}` }));
    setToasts(prev => [...prev, ...items].slice(-3));
  }, [notifications]);

  function dismiss(key: string) {
    setToasts(prev => prev.filter(t => t.key !== key));
  }

  return (
    <div
      className="fixed bottom-6 right-4 md:right-6 z-[200] flex flex-col gap-2.5 pointer-events-none"
      aria-live="polite"
      aria-label="Notificações em tempo real"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <ToastCard
            key={toast.key}
            toast={toast}
            onDismiss={() => dismiss(toast.key)}
            onNavigate={() => { dismiss(toast.key); setActiveTab('notifications'); }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
  onNavigate,
}: {
  toast: ToastItem;
  onDismiss: () => void;
  onNavigate: () => void;
}) {
  const cfg = resolveIcon(toast.type, toast.title);
  const Icon = cfg.icon;
  const [progress, setProgress] = useState(100);
  const startRef = useRef(Date.now());
  const rafRef   = useRef<number>(0);

  useEffect(() => {
    function tick() {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(pct);
      if (pct > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onDismiss();
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className="pointer-events-auto w-[320px] md:w-[360px] relative rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/25 overflow-hidden cursor-pointer"
      onClick={onNavigate}
      role="alert"
    >
      {/* Progress bar */}
      <div
        className="absolute top-0 left-0 h-[2px] bg-violet-500/70 transition-none"
        style={{ width: `${progress}%` }}
      />

      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
          <Icon size={16} className={cfg.color} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Bell size={10} className="text-violet-400 flex-shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Nova notificação</p>
          </div>
          <p className="text-foreground text-sm font-semibold leading-snug">{toast.title}</p>
          <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2 leading-relaxed">{toast.message}</p>
        </div>

        {/* Close */}
        <button
          onClick={e => { e.stopPropagation(); onDismiss(); }}
          aria-label="Fechar notificação"
          className="w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/60 transition-colors flex-shrink-0"
        >
          <X size={12} />
        </button>
      </div>
    </motion.div>
  );
}
