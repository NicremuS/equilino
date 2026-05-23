'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellOff, CheckCheck, X,
  CreditCard, AlertCircle, AlertTriangle, Clock, CheckCircle2,
} from 'lucide-react';
import {
  useTenantNotifications, useTenantUnreadCount,
  useMarkTenantNotificationRead, useMarkAllTenantNotificationsRead,
  useDeleteTenantNotification,
} from '@/hooks/useTenantApi';
import { useAppStore } from '@/store/useAppStore';
import type { Notification } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

function iconCfg(notif: Notification) {
  if (notif.priority === 'urgent') return { Icon: AlertCircle,   bg: 'bg-red-500/15',    color: 'text-red-400'    };
  if (notif.priority === 'high')   return { Icon: AlertTriangle, bg: 'bg-orange-500/15', color: 'text-orange-400' };
  if (notif.priority === 'medium') return { Icon: Clock,         bg: 'bg-amber-500/15',  color: 'text-amber-400'  };
  if (notif.type === 'payment')    return { Icon: CreditCard,    bg: 'bg-emerald-500/15', color: 'text-emerald-400' };
  return { Icon: Bell, bg: 'bg-blue-500/15', color: 'text-blue-400' };
}

// ── Notification card ─────────────────────────────────────────────────────────

function NotifCard({ notif, onRead, onDelete }: {
  notif: Notification;
  onRead: () => void;
  onDelete: () => void;
}) {
  const { setActiveTab } = useAppStore();
  const { Icon, bg, color } = iconCfg(notif);

  function handleClick() {
    onRead();
    if (notif.type === 'payment' || notif.type === 'alert') setActiveTab('payments');
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 12, transition: { duration: 0.15 } }}
      className={`group relative flex items-start gap-3 px-4 py-3.5 border-b border-border/40 hover:bg-muted/30 transition-colors cursor-pointer ${
        !notif.read ? 'bg-emerald-500/3' : ''
      }`}
      onClick={handleClick}
    >
      {/* Unread dot */}
      {!notif.read && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
      )}

      {/* Icon */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${bg} mt-0.5`}>
        <Icon size={14} className={color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-6">
        <p className={`text-xs font-semibold leading-tight ${notif.read ? 'text-foreground/80' : 'text-foreground'}`}>
          {notif.title}
        </p>
        <p className="text-muted-foreground text-[11px] mt-0.5 line-clamp-2 leading-relaxed">
          {notif.message}
        </p>
        <p className="text-muted-foreground/50 text-[10px] mt-1">{timeAgo(notif.createdAt)}</p>
      </div>

      {/* Delete */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full bg-muted hover:bg-red-500/15 flex items-center justify-center transition-all"
        aria-label="Dispensar"
      >
        <X size={10} className="text-muted-foreground hover:text-red-400" />
      </button>
    </motion.div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
      <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">{label}</p>
      {count != null && (
        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
}

// ── Main bell component ───────────────────────────────────────────────────────

export function TenantNotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useTenantNotifications();
  const unread = useTenantUnreadCount();
  const markRead    = useMarkTenantNotificationRead();
  const markAllRead = useMarkAllTenantNotificationsRead();
  const remove      = useDeleteTenantNotification();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  // Mark all read when panel opens
  function handleOpen() {
    setOpen(o => !o);
  }

  const unreadItems  = notifications.filter(n => !n.read);
  const todayRead    = notifications.filter(n => n.read && isToday(n.createdAt));
  const olderRead    = notifications.filter(n => n.read && !isToday(n.createdAt));

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label={`Notificações${unread > 0 ? ` (${unread} não lidas)` : ''}`}
      >
        <Bell size={18} />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center leading-none"
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute right-0 top-full mt-2 w-80 z-50 rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-xl shadow-black/10 overflow-hidden"
            style={{ transformOrigin: 'top right' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-emerald-400" />
                <p className="text-foreground text-sm font-bold">Notificações</p>
                {unread > 0 && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-full">
                    {unread}
                  </span>
                )}
              </div>
              {unread > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <CheckCheck size={12} /> Marcar tudo
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[420px] overflow-y-auto">
              <AnimatePresence initial={false}>
                {notifications.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3 py-12 px-4"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                        <BellOff size={20} className="text-muted-foreground/40" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center">
                        <CheckCircle2 size={11} className="text-emerald-400" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-foreground text-sm font-semibold">Tudo em dia!</p>
                      <p className="text-muted-foreground text-xs mt-0.5">Nenhuma notificação pendente.</p>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {unreadItems.length > 0 && (
                      <>
                        <SectionLabel label="Não lidas" count={unreadItems.length} />
                        {unreadItems.map(n => (
                          <NotifCard
                            key={n.id}
                            notif={n}
                            onRead={() => markRead.mutate(n.id)}
                            onDelete={() => remove.mutate(n.id)}
                          />
                        ))}
                      </>
                    )}
                    {todayRead.length > 0 && (
                      <>
                        <SectionLabel label="Hoje" />
                        {todayRead.map(n => (
                          <NotifCard
                            key={n.id}
                            notif={n}
                            onRead={() => markRead.mutate(n.id)}
                            onDelete={() => remove.mutate(n.id)}
                          />
                        ))}
                      </>
                    )}
                    {olderRead.length > 0 && (
                      <>
                        <SectionLabel label="Anteriores" />
                        {olderRead.map(n => (
                          <NotifCard
                            key={n.id}
                            notif={n}
                            onRead={() => markRead.mutate(n.id)}
                            onDelete={() => remove.mutate(n.id)}
                          />
                        ))}
                      </>
                    )}
                  </>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
