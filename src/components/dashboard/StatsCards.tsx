'use client';
import { TrendingUp, AlertTriangle, FileText, Building2, Wrench, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { StatsCardSkeleton } from '@/components/shared/LoadingSkeleton';
import type { DashboardStats } from '@/types';

const cards = (stats: DashboardStats) => [
  {
    label: 'Receita Mensal',
    value: formatCurrency(stats.monthlyRevenue),
    change: '+8.2%',
    positive: true,
    icon: TrendingUp,
    gradient: 'from-violet-500/25 via-violet-600/10 to-transparent',
    accent: 'bg-violet-500',
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-500/15',
    valueColor: 'text-violet-700 dark:text-violet-300',
  },
  {
    label: 'Inadimplência',
    value: formatCurrency(stats.overdueAmount),
    change: '1 imóvel',
    positive: false,
    icon: AlertTriangle,
    gradient: 'from-red-500/25 via-red-600/10 to-transparent',
    accent: 'bg-red-500',
    iconColor: 'text-red-400',
    iconBg: 'bg-red-500/15',
    valueColor: 'text-red-700 dark:text-red-300',
  },
  {
    label: 'Contratos Ativos',
    value: String(stats.activeContracts),
    change: `${stats.totalProperties} imóveis`,
    positive: true,
    icon: FileText,
    gradient: 'from-blue-500/25 via-blue-600/10 to-transparent',
    accent: 'bg-blue-500',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/15',
    valueColor: 'text-blue-700 dark:text-blue-300',
  },
  {
    label: 'Taxa de Ocupação',
    value: `${stats.occupancyRate}%`,
    change: `${stats.totalProperties} total`,
    positive: stats.occupancyRate >= 80,
    icon: Building2,
    gradient: 'from-green-500/25 via-green-600/10 to-transparent',
    accent: 'bg-green-500',
    iconColor: 'text-green-400',
    iconBg: 'bg-green-500/15',
    valueColor: 'text-teal-700 dark:text-green-300',
  },
  {
    label: 'Chamados Abertos',
    value: String(stats.openTickets),
    change: '1 urgente',
    positive: false,
    icon: Wrench,
    gradient: 'from-orange-500/25 via-orange-600/10 to-transparent',
    accent: 'bg-orange-500',
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/15',
    valueColor: 'text-orange-700 dark:text-orange-300',
  },
  {
    label: 'Pgtos Pendentes',
    value: String(stats.pendingPayments),
    change: 'Este mês',
    positive: true,
    icon: Clock,
    gradient: 'from-yellow-500/25 via-yellow-600/10 to-transparent',
    accent: 'bg-yellow-500',
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-500/15',
    valueColor: 'text-amber-700 dark:text-yellow-300',
  },
];

interface StatsCardsProps {
  stats?: DashboardStats;
  isLoading?: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <StatsCardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {cards(stats).map((card, i) => {
        const Icon = card.icon;
        const TrendIcon = card.positive ? ArrowUpRight : ArrowDownRight;
        return (
          <div
            key={card.label}
            className="premium-surface rounded-2xl p-4 relative overflow-hidden animate-card-enter"
            style={{ animationDelay: `${i * 0.07}s`, animationFillMode: 'both' }}
          >
            {/* Gradient wash */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} />

            {/* Top accent line */}
            <div className={`absolute top-0 left-4 right-4 h-[2px] rounded-b-full ${card.accent} opacity-80`} />

            {/* Ghost icon */}
            <div className={`absolute -right-3 -bottom-3 ${card.iconColor} opacity-[0.08] pointer-events-none`}>
              <Icon size={76} />
            </div>

            <div className="relative z-10 flex flex-col gap-3">
              {/* Top row: icon + trend */}
              <div className="flex items-start justify-between">
                <div className={`${card.iconBg} p-2 rounded-xl border border-premium`}>
                  <Icon size={15} className={card.iconColor} />
                </div>
                <span className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  card.positive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  <TrendIcon size={10} strokeWidth={2.5} />
                  {card.change}
                </span>
              </div>

              {/* Value + label */}
              <div>
                <p className={`text-xl font-bold leading-none mb-1.5 ${card.valueColor}`}>{card.value}</p>
                <p className="text-[11px] text-muted-foreground font-medium leading-tight">{card.label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
