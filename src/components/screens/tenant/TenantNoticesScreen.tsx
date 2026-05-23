'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, AlertCircle, Lightbulb, ShieldAlert, ChevronDown, ChevronUp, Bell } from 'lucide-react';
import { useTenantNotices, useMarkTenantNoticeRead } from '@/hooks/useTenantApi';
import { ListItemSkeleton, ApiErrorState } from '@/components/shared/LoadingSkeleton';
import { formatDate } from '@/lib/utils';
import type { NoticeCategory } from '@/types';

const CATEGORY_CONFIG: Record<NoticeCategory, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}> = {
  aviso: {
    label: 'Aviso',
    icon: AlertCircle,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  recomendacao: {
    label: 'Recomendação',
    icon: Lightbulb,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  obrigacao: {
    label: 'Obrigação',
    icon: ShieldAlert,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
};

type FilterTab = 'todos' | NoticeCategory;

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'todos',       label: 'Todos' },
  { id: 'aviso',       label: 'Avisos' },
  { id: 'recomendacao', label: 'Recomendações' },
  { id: 'obrigacao',   label: 'Obrigações' },
];

export function TenantNoticesScreen() {
  const { data: notices, isLoading, isError, refetch } = useTenantNotices();
  const markRead = useMarkTenantNoticeRead();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>('todos');

  if (isLoading) return <ListItemSkeleton count={3} />;
  if (isError) return <ApiErrorState onRetry={refetch} />;

  const filtered = (notices ?? []).filter(n => filter === 'todos' || n.category === filter);
  const unreadCount = (notices ?? []).filter(n => !n.read).length;

  function toggle(id: string, isRead: boolean) {
    setExpanded(prev => (prev === id ? null : id));
    if (!isRead) markRead.mutate(id);
  }

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Avisos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Mensagens do seu proprietário</p>
        </div>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-semibold"
          >
            <Bell size={11} />
            {unreadCount} {unreadCount === 1 ? 'novo' : 'novos'}
          </motion.span>
        )}
      </motion.div>

      {/* Category legend */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
        className="grid grid-cols-3 gap-2"
      >
        {(Object.entries(CATEGORY_CONFIG) as [NoticeCategory, typeof CATEGORY_CONFIG[NoticeCategory]][]).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={key} className={`rounded-2xl p-3 ${cfg.bg} border ${cfg.border} flex flex-col items-center gap-1`}>
              <Icon size={18} className={cfg.color} />
              <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
              <span className="text-muted-foreground text-[10px] text-center leading-tight">
                {key === 'aviso' ? 'Informativo' : key === 'recomendacao' ? 'Sugestão' : 'Obrigatório'}
              </span>
            </div>
          );
        })}
      </motion.div>

      {/* Filter tabs */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}
        className="flex gap-2 overflow-x-auto pb-1"
      >
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filter === tab.id
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-border text-muted-foreground hover:border-emerald-500/30'
            }`}
          >
            {tab.label}
            {tab.id !== 'todos' && (
              <span className="ml-1.5 opacity-70">
                {(notices ?? []).filter(n => n.category === tab.id).length}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Notices list */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((notice, i) => {
            const cfg = CATEGORY_CONFIG[notice.category];
            const Icon = cfg.icon;
            const isExpanded = expanded === notice.id;

            return (
              <motion.div
                key={notice.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`rounded-2xl border overflow-hidden transition-colors ${
                  notice.read
                    ? 'premium-surface border-border'
                    : `${cfg.bg} ${cfg.border}`
                }`}
              >
                <button
                  onClick={() => toggle(notice.id, notice.read)}
                  className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/5 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                    <Icon size={17} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {!notice.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className={`text-sm font-semibold ${notice.read ? 'text-foreground' : 'text-foreground'}`}>
                      {notice.title}
                    </p>
                    {!isExpanded && (
                      <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">
                        {notice.message}
                      </p>
                    )}
                    <p className="text-muted-foreground text-[10px] mt-1">{formatDate(notice.createdAt)}</p>
                  </div>
                  <div className="text-muted-foreground flex-shrink-0 mt-1">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4">
                        <div className={`rounded-xl p-3.5 ${cfg.bg} border ${cfg.border}`}>
                          <p className="text-foreground text-sm leading-relaxed">{notice.message}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Megaphone size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium text-sm">Nenhum aviso encontrado</p>
            <p className="text-xs mt-1">
              {filter === 'todos' ? 'Seu proprietário ainda não enviou avisos.' : `Sem ${CATEGORY_CONFIG[filter as NoticeCategory]?.label.toLowerCase()}s no momento.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
