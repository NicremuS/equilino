'use client';
import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCircle2, AlertCircle, AlertTriangle, Wrench, Clock,
  FileText, CreditCard, Sparkles, CheckCheck, X, ReceiptText, ShieldAlert,
} from 'lucide-react';
import {
  useNotifications, useUpdateNotification,
  useDeleteNotification, useMarkAllNotificationsRead,
} from '@/hooks/useApi';
import { useAppStore } from '@/store/useAppStore';
import { ApiErrorState } from '@/components/shared/LoadingSkeleton';
import { formatRelativeTime } from '@/lib/utils';
import type { Notification, NotificationType } from '@/types';

// ── Icon resolution ──────────────────────────────────────────────────────────

interface IconCfg {
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}

function resolveIcon(type: NotificationType, title: string): IconCfg {
  const t = title.toLowerCase();
  if (t.includes('comprovante') || t.includes('recibo'))
    return { icon: ReceiptText,   color: 'text-teal-400',    bg: 'bg-teal-500/12',    border: 'border-teal-500/20'   };
  if (t.includes('recebido') || t.includes('pago') || t.includes('pagamento'))
    return { icon: CheckCircle2,  color: 'text-emerald-400', bg: 'bg-emerald-500/12', border: 'border-emerald-500/20' };
  if (t.includes('atraso') || t.includes('vencido') || t.includes('inadimpl'))
    return { icon: ShieldAlert,   color: 'text-red-400',     bg: 'bg-red-500/12',     border: 'border-red-500/20'    };
  if (t.includes('resolvido') || t.includes('concluíd'))
    return { icon: CheckCircle2,  color: 'text-emerald-400', bg: 'bg-emerald-500/12', border: 'border-emerald-500/20' };
  if (t.includes('vencimento') || t.includes('expira') || t.includes('prazo'))
    return { icon: Clock,         color: 'text-amber-400',   bg: 'bg-amber-500/12',   border: 'border-amber-500/20'  };
  if (t.includes('chamado') && (t.includes('aberto') || t.includes('novo') || t.includes('manutenção')))
    return { icon: Wrench,        color: 'text-orange-400',  bg: 'bg-orange-500/12',  border: 'border-orange-500/20' };
  if (t.includes('alerta') || t.includes('urgente'))
    return { icon: AlertTriangle, color: 'text-red-400',     bg: 'bg-red-500/12',     border: 'border-red-500/20'    };

  const fallback: Record<NotificationType, IconCfg> = {
    payment:     { icon: CreditCard,    color: 'text-emerald-400', bg: 'bg-emerald-500/12', border: 'border-emerald-500/20' },
    contract:    { icon: FileText,      color: 'text-blue-400',    bg: 'bg-blue-500/12',    border: 'border-blue-500/20'   },
    maintenance: { icon: Wrench,        color: 'text-orange-400',  bg: 'bg-orange-500/12',  border: 'border-orange-500/20' },
    system:      { icon: Sparkles,      color: 'text-violet-400',  bg: 'bg-violet-500/12',  border: 'border-violet-500/20' },
    alert:       { icon: AlertCircle,   color: 'text-red-400',     bg: 'bg-red-500/12',     border: 'border-red-500/20'    },
  };
  return fallback[type];
}

function tabForType(type: NotificationType): string | null {
  const map: Partial<Record<NotificationType, string>> = {
    payment: 'payments',
    contract: 'contracts',
    maintenance: 'maintenance',
  };
  return map[type] ?? null;
}

// ── Date grouping ─────────────────────────────────────────────────────────────

function startOf(daysAgo: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

function groupNotifications(all: Notification[]) {
  const todayStart     = startOf(0);
  const yesterdayStart = startOf(1);

  const unread    = all.filter(n => !n.read).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const readSorted = all.filter(n => n.read).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return {
    unread,
    today:    readSorted.filter(n => new Date(n.createdAt) >= todayStart),
    yesterday:readSorted.filter(n => new Date(n.createdAt) >= yesterdayStart && new Date(n.createdAt) < todayStart),
    older:    readSorted.filter(n => new Date(n.createdAt) < yesterdayStart),
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children, count }: { children: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{children}</p>
      {count != null && count > 0 && (
        <span className="text-[10px] font-bold bg-violet-500/15 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded-full tabular-nums">
          {count}
        </span>
      )}
    </div>
  );
}

interface CardProps {
  notif: Notification;
  unread?: boolean;
  onMarkRead: () => void;
  onDelete: () => void;
  onNavigate: () => void;
  deleting: boolean;
}

function NotifCard({ notif, unread, onMarkRead, onDelete, onNavigate, deleting }: CardProps) {
  const cfg = resolveIcon(notif.type, notif.title);
  const Icon = cfg.icon;
  const hoverRef = useRef<HTMLDivElement>(null);

  function handleClick() {
    if (unread) onMarkRead();
    onNavigate();
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: deleting ? 0 : 1, x: deleting ? 40 : 0, y: 0 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.18 } }}
      transition={{ duration: 0.22 }}
      ref={hoverRef}
      onClick={handleClick}
      className={[
        'group relative rounded-2xl border p-4 cursor-pointer transition-all duration-200',
        unread
          ? 'bg-gradient-to-r from-violet-500/5 to-transparent border-violet-500/20 hover:border-violet-500/35 hover:from-violet-500/8'
          : 'bg-card border-border hover:border-violet-500/20 hover:bg-muted/40',
      ].join(' ')}
    >
      <div className="flex items-start gap-3.5">
        {/* Icon */}
        <div className={`p-2.5 rounded-xl border flex-shrink-0 ${cfg.bg} ${cfg.border} ${!unread ? 'opacity-50' : ''}`}>
          <Icon size={16} className={cfg.color} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-start gap-2">
            <p className={`text-sm leading-snug flex-1 min-w-0 ${unread ? 'text-foreground font-semibold' : 'text-foreground/75 font-medium'}`}>
              {notif.title}
            </p>
            {unread && (
              <span className="flex-shrink-0 mt-1.5">
                <span className="relative flex w-2 h-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-60" />
                  <span className="relative inline-flex rounded-full w-2 h-2 bg-violet-400" />
                </span>
              </span>
            )}
          </div>
          <p className={`text-xs mt-1 leading-relaxed line-clamp-2 ${unread ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
            {notif.message}
          </p>
          <p className="text-[10px] mt-2 text-muted-foreground/50 font-medium tabular-nums">
            {formatRelativeTime(notif.createdAt)}
          </p>
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        aria-label="Remover notificação"
        className="absolute top-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted/60 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
      >
        <X size={12} />
      </button>
    </motion.div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function NotificationsScreen() {
  const { data: notifications = [], isLoading, isError, refetch } = useNotifications();
  const updateNotification  = useUpdateNotification();
  const deleteNotification  = useDeleteNotification();
  const markAllRead         = useMarkAllNotificationsRead();
  const setActiveTab        = useAppStore(s => s.setActiveTab);

  const deletingIds = useRef<Set<string>>(new Set());

  const groups = groupNotifications(notifications);
  const unreadCount = groups.unread.length;
  const hasAny = notifications.length > 0;

  function markRead(id: string) {
    updateNotification.mutate({ id, data: { read: true } });
  }

  function removeNotif(id: string) {
    deletingIds.current.add(id);
    deleteNotification.mutate(id);
  }

  function navigate(notif: Notification) {
    const tab = tabForType(notif.type);
    if (tab) setActiveTab(tab);
  }

  if (isLoading) {
    return (
      <div className="space-y-5 pb-2">
        <div className="h-8 w-40 rounded-xl bg-muted/60 animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-muted/40 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    );
  }

  if (isError) return <ApiErrorState onRetry={refetch} />;

  const sections: { label: string; items: Notification[]; showCount?: boolean }[] = [
    { label: 'Não lidas', items: groups.unread, showCount: true },
    { label: 'Hoje',      items: groups.today },
    { label: 'Ontem',     items: groups.yesterday },
    { label: 'Anteriores',items: groups.older },
  ];

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-foreground text-xl font-bold">Notificações</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`
              : hasAny ? 'Tudo em dia' : 'Nenhuma notificação'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-1.5 text-xs text-violet-400 font-semibold bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full hover:bg-violet-500/18 transition-colors disabled:opacity-50"
          >
            <CheckCheck size={13} />
            Marcar todas
          </button>
        )}
      </motion.div>

      {/* Sections */}
      <AnimatePresence mode="popLayout">
        {sections.map(({ label, items, showCount }) =>
          items.length > 0 ? (
            <motion.section
              key={label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              layout
            >
              <SectionLabel count={showCount ? items.length : undefined}>{label}</SectionLabel>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {items.map(notif => (
                    <NotifCard
                      key={notif.id}
                      notif={notif}
                      unread={label === 'Não lidas'}
                      onMarkRead={() => markRead(notif.id)}
                      onDelete={() => removeNotif(notif.id)}
                      onNavigate={() => navigate(notif)}
                      deleting={deletingIds.current.has(notif.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          ) : null
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!hasAny && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="relative mb-5">
            <div className="w-20 h-20 rounded-3xl bg-muted/60 border border-border flex items-center justify-center">
              <Bell size={32} className="text-muted-foreground/40" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 size={12} className="text-emerald-400" />
            </div>
          </div>
          <p className="text-foreground font-semibold text-base">Tudo em dia</p>
          <p className="text-muted-foreground text-sm mt-1.5 max-w-[220px] leading-relaxed">
            Quando o inquilino realizar ações, você será notificado aqui.
          </p>
        </motion.div>
      )}
    </div>
  );
}
