'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CreditCard, AlertCircle, AlertTriangle, Clock } from 'lucide-react';
import { useTenantNotifications } from '@/hooks/useTenantApi';
import { useAppStore } from '@/store/useAppStore';
import type { Notification } from '@/types';

const TOAST_DURATION = 6000;

function iconCfg(notif: Notification) {
  if (notif.priority === 'urgent') return { Icon: AlertCircle,   color: 'text-red-400',     bg: 'bg-red-500/15'     };
  if (notif.priority === 'high')   return { Icon: AlertTriangle, color: 'text-orange-400',  bg: 'bg-orange-500/15'  };
  if (notif.priority === 'medium') return { Icon: Clock,         color: 'text-amber-400',   bg: 'bg-amber-500/15'   };
  if (notif.type === 'payment')    return { Icon: CreditCard,    color: 'text-emerald-400', bg: 'bg-emerald-500/15' };
  return { Icon: Bell, color: 'text-blue-400', bg: 'bg-blue-500/15' };
}

function ToastCard({ notif, onDismiss }: { notif: Notification; onDismiss: () => void }) {
  const { setActiveTab } = useAppStore();
  const [progress, setProgress] = useState(100);
  const startRef = useRef(Date.now());
  const rafRef   = useRef<number>(0);

  useEffect(() => {
    function tick() {
      const elapsed  = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onDismiss();
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { Icon, color, bg } = iconCfg(notif);

  function handleClick() {
    onDismiss();
    if (notif.type === 'payment' || notif.type === 'alert') setActiveTab('payments');
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      className="w-72 rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-xl shadow-black/15 overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      <div className="p-3.5 flex items-start gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
          <Icon size={15} className={color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-xs font-bold leading-tight">{notif.title}</p>
          <p className="text-muted-foreground text-[11px] mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDismiss(); }}
          className="w-5 h-5 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors flex-shrink-0"
          aria-label="Fechar"
        >
          <X size={10} className="text-muted-foreground" />
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-0.5 w-full bg-muted/40">
        <div
          className="h-full bg-emerald-500 transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}

export function TenantNotificationToast() {
  const { data: notifications } = useTenantNotifications();
  const seenIds    = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const [toasts, setToasts] = useState<Notification[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    if (!notifications) return;

    if (!initialized.current) {
      notifications.forEach(n => seenIds.current.add(n.id));
      initialized.current = true;
      return;
    }

    const fresh = notifications
      .filter(n => !n.read && !seenIds.current.has(n.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2); // max 2 stacked toasts

    if (fresh.length === 0) return;
    fresh.forEach(n => seenIds.current.add(n.id));
    setToasts(prev => [...fresh, ...prev].slice(0, 3));
  }, [notifications]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[200] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastCard notif={t} onDismiss={() => dismiss(t.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
