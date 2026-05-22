'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, CheckCircle2, AlertCircle, AlertTriangle,
  Wrench, Clock, FileText, CreditCard, BarChart2,
  CheckCheck, Sparkles, X,
} from 'lucide-react';
import { useNotifications, useUpdateNotification, useMarkAllNotificationsRead } from '@/hooks/useApi';
import { ApiErrorState } from '@/components/shared/LoadingSkeleton';
import { formatRelativeTime } from '@/lib/utils';
import type { NotificationType } from '@/types';

interface IconCfg {
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  glow: string;
}

function resolveIcon(type: NotificationType, title: string): IconCfg {
  const t = title.toLowerCase();

  if (t.includes('recebido') || t.includes('pago'))
    return { icon: CheckCircle2, color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-500/12',  border: 'border-green-500/25',  glow: 'shadow-green-500/20'  };
  if (t.includes('atraso') || t.includes('vencido') || t.includes('inadimpl'))
    return { icon: AlertCircle,  color: 'text-red-600 dark:text-red-400',    bg: 'bg-red-500/12',    border: 'border-red-500/25',    glow: 'shadow-red-500/20'    };
  if (t.includes('resolvido') || t.includes('concluíd'))
    return { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/12', border: 'border-emerald-500/25', glow: 'shadow-emerald-500/20' };
  if (t.includes('vencimento') || t.includes('expira') || t.includes('prazo'))
    return { icon: Clock,        color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/12', border: 'border-yellow-500/25', glow: 'shadow-yellow-500/20' };
  if (t.includes('relatório') || t.includes('relatorio'))
    return { icon: BarChart2,    color: 'text-slate-600 dark:text-gray-400',   bg: 'bg-gray-500/12',   border: 'border-gray-500/25',   glow: 'shadow-gray-500/20'   };
  if (t.includes('chamado') && (t.includes('aberto') || t.includes('novo')))
    return { icon: Wrench,       color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/12', border: 'border-orange-500/25', glow: 'shadow-orange-500/20' };

  const fallback: Record<NotificationType, IconCfg> = {
    payment:     { icon: CreditCard,   color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-500/12',  border: 'border-green-500/25',  glow: 'shadow-green-500/20'  },
    contract:    { icon: FileText,     color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-500/12',   border: 'border-blue-500/25',   glow: 'shadow-blue-500/20'   },
    maintenance: { icon: Wrench,       color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/12', border: 'border-orange-500/25', glow: 'shadow-orange-500/20' },
    system:      { icon: Sparkles,     color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/12', border: 'border-violet-500/25', glow: 'shadow-violet-500/20' },
    alert:       { icon: AlertTriangle, color: 'text-red-600 dark:text-red-400',    bg: 'bg-red-500/12',    border: 'border-red-500/25',    glow: 'shadow-red-500/20'    },
  };
  return fallback[type];
}

export function NotificationsScreen() {
  const { data: notifications = [], isError, refetch } = useNotifications();
  const updateNotification = useUpdateNotification();
  const markAllRead = useMarkAllNotificationsRead();
  const [selectedNotification, setSelectedNotification] = useState<null | {
    id: string; title: string; message: string; createdAt: string;
  }>(null);

  const unread = notifications.filter(n => !n.read);
  const read   = notifications.filter(n =>  n.read);
  const unreadCount = unread.length;

  function openNotification(notif: { id: string; title: string; message: string; createdAt: string; read?: boolean }) {
    if (!notif.read) {
      updateNotification.mutate({ id: notif.id, data: { read: true } });
    }
    setSelectedNotification(notif);
  }

  return (
    <div className="space-y-5 pb-2 relative">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-foreground text-xl font-bold">Notificações</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 font-semibold bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full hover:bg-violet-500/20 transition-colors disabled:opacity-50"
          >
            <CheckCheck size={13} />
            Marcar todas
          </button>
        )}
      </motion.div>

      {isError && <ApiErrorState onRetry={refetch} />}

      {/* Unread */}
      {!isError && unread.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Não lidas</p>
            <span className="text-[10px] font-bold bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/25 px-1.5 py-0.5 rounded-full">
              {unread.length}
            </span>
          </div>
          <div className="space-y-2">
            {unread.map((notif, i) => {
              const cfg = resolveIcon(notif.type, notif.title);
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => openNotification(notif)}
                  className="rounded-2xl border border-violet-300/60 dark:border-violet-500/20 bg-violet-50/80 dark:bg-violet-500/5 p-4 flex items-center gap-3 cursor-pointer hover:border-violet-400/70 dark:hover:border-violet-500/30 hover:bg-violet-100/70 dark:hover:bg-violet-500/8 transition-all"
                >
                  <div className={`p-2.5 rounded-xl border ${cfg.bg} ${cfg.border} shadow-lg ${cfg.glow} flex-shrink-0`}>
                    <Icon size={18} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-foreground text-sm font-semibold leading-tight">{notif.title}</p>
                      <div className="flex-shrink-0 mt-1 relative">
                        <div className="w-2 h-2 rounded-full bg-violet-400" />
                        <div className="absolute inset-0 w-2 h-2 rounded-full bg-violet-400 animate-ping opacity-60" />
                      </div>
                    </div>
                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{notif.message}</p>
                    <p className="text-slate-500 dark:text-muted-foreground text-[10px] mt-2 font-medium">{formatRelativeTime(notif.createdAt)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Read */}
      {!isError && read.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">Anteriores</p>
          <div className="space-y-2">
            {read.map((notif, i) => {
              const cfg = resolveIcon(notif.type, notif.title);
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (unread.length + i) * 0.04 }}
                  onClick={() => openNotification(notif)}
                  className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3 cursor-pointer hover:border-violet-300/60 transition-all"
                >
                  <div className={`p-2.5 rounded-xl border ${cfg.bg} ${cfg.border} flex-shrink-0 opacity-50`}>
                    <Icon size={18} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground/80 text-sm font-medium leading-tight">{notif.title}</p>
                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{notif.message}</p>
                    <p className="text-muted-foreground/70 text-[10px] mt-2 font-medium">{formatRelativeTime(notif.createdAt)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {notifications.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mx-auto mb-4">
            <Bell size={28} className="opacity-30" />
          </div>
          <p className="text-sm font-medium">Nenhuma notificação</p>
          <p className="text-xs text-muted-foreground mt-1">Você está em dia com tudo</p>
        </div>
      )}

      {selectedNotification && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className="w-full max-w-xl rounded-3xl border border-white/10 bg-card p-6 shadow-2xl shadow-black/20"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-foreground text-lg font-bold">{selectedNotification.title}</p>
                <p className="text-muted-foreground text-xs mt-1">{formatRelativeTime(selectedNotification.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/70 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Fechar notificação"
              >
                <X size={18} />
              </button>
            </div>
            <div className="rounded-3xl border border-border bg-muted/70 p-4 text-sm text-muted-foreground leading-6">
              {selectedNotification.message}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
