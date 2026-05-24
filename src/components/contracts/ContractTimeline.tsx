'use client';
import { FileText, Send, Eye, PenLine, CheckCircle, XCircle, Upload, MessageSquare, Bell, Edit3 } from 'lucide-react';
import type { ContractHistoryEvent, ContractHistoryEventType } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EVENT_CONFIG: Record<ContractHistoryEventType, { icon: React.ElementType; color: string; bg: string }> = {
  created:           { icon: FileText,      color: 'text-violet-400', bg: 'bg-violet-500/15' },
  edited:            { icon: Edit3,         color: 'text-amber-400',  bg: 'bg-amber-500/15' },
  sent:              { icon: Send,          color: 'text-blue-400',   bg: 'bg-blue-500/15' },
  viewed:            { icon: Eye,           color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
  signed:            { icon: PenLine,       color: 'text-emerald-400',bg: 'bg-emerald-500/15' },
  signed_landlord:   { icon: PenLine,       color: 'text-violet-400', bg: 'bg-violet-500/15' },
  signed_tenant:     { icon: PenLine,       color: 'text-emerald-400',bg: 'bg-emerald-500/15' },
  rejected:          { icon: XCircle,       color: 'text-red-400',    bg: 'bg-red-500/15' },
  completed:         { icon: CheckCircle,   color: 'text-emerald-400',bg: 'bg-emerald-500/15' },
  cancelled:         { icon: XCircle,       color: 'text-zinc-400',   bg: 'bg-zinc-500/15' },
  document_uploaded: { icon: Upload,        color: 'text-teal-400',   bg: 'bg-teal-500/15' },
  status_changed:    { icon: Edit3,         color: 'text-amber-400',  bg: 'bg-amber-500/15' },
  comment_added:     { icon: MessageSquare, color: 'text-blue-400',   bg: 'bg-blue-500/15' },
  reminder_sent:     { icon: Bell,          color: 'text-violet-400', bg: 'bg-violet-500/15' },
};

interface Props {
  events: ContractHistoryEvent[];
}

export function ContractTimeline({ events }: Props) {
  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <div className="space-y-0">
      {sorted.map((event, i) => {
        const cfg = EVENT_CONFIG[event.type] ?? EVENT_CONFIG.status_changed;
        const Icon = cfg.icon;
        const isLast = i === sorted.length - 1;

        return (
          <div key={event.id} className="flex gap-3">
            {/* Line + dot */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                <Icon size={14} className={cfg.color} />
              </div>
              {!isLast && <div className="w-px flex-1 bg-border mt-1 mb-1 min-h-[16px]" />}
            </div>

            {/* Content */}
            <div className={`flex-1 pb-4 ${isLast ? '' : ''}`}>
              <p className="text-sm text-foreground font-medium leading-tight">{event.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">{event.userName}</span>
                <span className="text-xs text-muted-foreground/50">·</span>
                <time className="text-xs text-muted-foreground">
                  {format(new Date(event.timestamp), "dd MMM 'às' HH:mm", { locale: ptBR })}
                </time>
              </div>
              {event.metadata?.reason != null && (
                <p className="text-xs text-red-400/80 mt-1 bg-red-500/5 rounded-lg px-2.5 py-1.5 border border-red-500/10">
                  {String(event.metadata.reason)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
