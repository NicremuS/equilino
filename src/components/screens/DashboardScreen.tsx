'use client';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useDashboardStats, useChartData, useOccupancyData } from '@/hooks/useApi';
import { ApiErrorState } from '@/components/shared/LoadingSkeleton';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { OccupancyDonut } from '@/components/dashboard/OccupancyDonut';
import { OccupancyBar } from '@/components/dashboard/OccupancyBar';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { UpcomingPayments } from '@/components/dashboard/UpcomingPayments';
import { formatCurrency } from '@/lib/utils';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function DashboardScreen() {
  const { user } = useAppStore();
  const { data: stats, isLoading: loadingStats, isError: errorStats, refetch: refetchStats } = useDashboardStats();
  const { data: chartData, isLoading: loadingChart } = useChartData();
  const { data: occupancyData, isLoading: loadingOccupancy } = useOccupancyData();
  const firstName = user?.name.split(' ')[0] ?? 'usuário';

  return (
    <div className="space-y-5 pb-2">
      {/* Hero greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[1.75rem] border border-white/20 shadow-[0_24px_70px_rgba(49,32,111,0.28)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
      >
        {/* Background layers */}
        <div className="absolute inset-0 hero-premium" />

        {/* Depth and color panels */}
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.18)_0%,transparent_28%,rgba(20,184,166,0.22)_100%)] pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/34 via-black/10 to-transparent pointer-events-none" />
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 bottom-2 h-48 w-48 rounded-full bg-teal-300/18 blur-3xl pointer-events-none" />

        {/* Dot grid texture */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />

        <div className="relative z-10 p-5 sm:p-6">
          {/* Greeting row */}
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-white/62 text-xs font-semibold tracking-wide">{getGreeting()}</p>
              <h2 className="mt-1 text-2xl font-bold leading-tight text-white">{firstName}</h2>
            </div>
            <span className="rounded-full border border-white/18 bg-white/12 px-3 py-1 text-[10px] font-bold tracking-wide text-white shadow-sm backdrop-blur-xl">
              PRO ACTIVE
            </span>
          </div>

          {/* Main value */}
          <div className="mb-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/52">Receita total acumulada</p>
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-[2.45rem] font-bold leading-[0.95] tracking-normal text-white tabular-nums sm:text-5xl"
            >
              {stats ? formatCurrency(stats.totalRevenue) : '--'}
            </motion.p>
          </div>

          {/* Growth badge */}
          <div className="mb-5 flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-300/12 px-2.5 py-1 text-xs font-bold text-emerald-200 shadow-sm backdrop-blur-xl">
              <TrendingUp size={12} strokeWidth={2.5} /> +8.2% este mês
            </span>
            <span className="text-[11px] font-medium text-white/45">crescimento líquido</span>
          </div>

        </div>
      </motion.div>

      {errorStats && <ApiErrorState onRetry={refetchStats} />}

      {/* Quick actions */}
      <QuickActions />

      {/* Stats grid */}
      <StatsCards stats={stats} isLoading={loadingStats} />

      {/* Revenue chart full width */}
      <RevenueChart data={chartData} isLoading={loadingChart} />

      {/* Donut + Bar side by side on tablet+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <OccupancyDonut data={occupancyData} isLoading={loadingOccupancy} />
        <OccupancyBar data={chartData} isLoading={loadingChart} />
      </div>

      {/* Upcoming + Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <UpcomingPayments />
        <RecentActivity />
      </div>
    </div>
  );
}
