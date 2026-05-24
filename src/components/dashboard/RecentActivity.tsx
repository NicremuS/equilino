'use client';
import { useMemo } from 'react';
import { CheckCircle2, AlertCircle, Clock, Wrench, ArrowRight, Sparkles, CreditCard, FileText } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { useNotifications } from '@/hooks/useApi';
import type { NotificationType } from '@/types';

const typeConfig: Record<NotificationType, { icon: React.ElementType; iconColor: string; iconBg: string; dot: string }> = {
  payment:     { icon: CreditCard,   iconColor: 'text-green-400',  iconBg: 'bg-green-500/10',  dot: 'bg-green-500'  },
  contract:    { icon: FileText,     iconColor: 'text-blue-400',   iconBg: 'bg-blue-500/10',   dot: 'bg-blue-500'   },
  maintenance: { icon: Wrench,       iconColor: 'text-orange-400', iconBg: 'bg-orange-500/10', dot: 'bg-orange-500' },
  system:      { icon: Sparkles,     iconColor: 'text-violet-400', iconBg: 'bg-violet-500/10', dot: 'bg-violet-500' },
  alert:       { icon: AlertCircle,  iconColor: 'text-red-400',    iconBg: 'bg-red-500/10',    dot: 'bg-red-500'    },
};

function getIconFromTitle(title: string, type: NotificationType) {
  const t = title.toLowerCase();
  if (t.includes('pago') || t.includes('recebido')) return { ...typeConfig.payment, icon: CheckCircle2 };
  if (t.includes('atraso') || t.includes('vencido')) return { ...typeConfig.alert };
  if (t.includes('vencendo') || t.includes('prazo')) return { ...typeConfig[type], icon: Clock, iconColor: 'text-yellow-400', iconBg: 'bg-yellow-500/10', dot: 'bg-yellow-500' };
  return typeConfig[type] ?? typeConfig.system;
}

export function RecentActivity() {
  const { data: notifications = [], isLoading } = useNotifications();

  const recent = useMemo(
    () =>
      [...notifications]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [notifications]
  );

  return (
    <div
      className="premium-surface rounded-2xl overflow-hidden animate-card-enter"
      style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
      role="region"
      aria-label="Atividade recente"
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-premium">
        <h3 className="text-foreground font-semibold text-sm">Atividade Recente</h3>
        <button
          className="flex items-center gap-1 text-violet-400 text-xs font-medium hover:text-violet-300 transition-colors"
          aria-label="Ver toda a atividade"
        >
          Ver tudo <ArrowRight size={11} aria-hidden="true" />
        </button>
      </div>

      {isLoading ? (
        <div className="px-4 py-3 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-muted/70 dark:bg-white/5 flex-shrink-0" />
              <div className="flex-1 space-y-1.5 pt-1">
                <div className="h-3 bg-muted/70 dark:bg-white/5 rounded w-3/4" />
                <div className="h-2.5 bg-muted/70 dark:bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground text-xs">Sem atividade recente</div>
      ) : (
        <div className="px-4 py-3 space-y-0">
          {recent.map((notif, i) => {
            const cfg = getIconFromTitle(notif.title, notif.type);
            const Icon = cfg.icon;
            const isLast = i === recent.length - 1;
            return (
              <div key={notif.id} className="flex gap-3 relative">
                {!isLast && (
                  <div className="absolute left-[15px] top-[32px] bottom-0 w-px bg-border" aria-hidden="true" />
                )}
                <div className={`w-8 h-8 rounded-xl ${cfg.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5 border border-premium z-10`}>
                  <Icon size={13} className={cfg.iconColor} aria-hidden="true" />
                </div>
                <div className={`flex-1 min-w-0 flex items-start justify-between gap-2 ${!isLast ? 'pb-3.5' : 'pb-1'}`}>
                  <div className="min-w-0">
                    <p className="text-foreground text-xs font-semibold leading-tight">{notif.title}</p>
                    <p className="text-muted-foreground text-[10px] mt-0.5 truncate">{notif.message}</p>
                  </div>
                  <span className="text-muted-foreground text-[10px] whitespace-nowrap flex-shrink-0 mt-0.5">
                    {formatRelativeTime(notif.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
