'use client';
import { motion } from 'framer-motion';
import { BarChart2, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { useChartData } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { ChartSkeleton, ApiErrorState } from '@/components/shared/LoadingSkeleton';

export function ReportsScreen() {
  const { data: chartData, isLoading, isError, refetch } = useChartData();

  const totalRevenue = chartData?.reduce((s, d) => s + d.revenue, 0) ?? 0;
  const totalExpenses = chartData?.reduce((s, d) => s + d.expenses, 0) ?? 0;
  const profit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-5 pb-2">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-foreground text-xl font-bold">Relatórios</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Últimos 6 meses</p>
        </div>
        <button className="flex items-center gap-1.5 text-xs text-violet-400 border border-violet-500/25 px-3 py-2 rounded-xl hover:bg-violet-500/10 transition-colors">
          <Download size={13} /> Exportar
        </button>
      </motion.div>

      {/* KPI row */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-2"
      >
        {[
          { label: 'Receita', value: totalRevenue, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
          { label: 'Despesas', value: totalExpenses, icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          { label: 'Lucro', value: profit, icon: BarChart2, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`rounded-2xl border p-3 ${item.bg}`}>
              <Icon size={14} className={`${item.color} mb-1.5`} />
              <p className={`text-sm font-bold ${item.color} leading-tight`}>{formatCurrency(item.value)}</p>
              <p className="text-muted-foreground text-[10px] mt-0.5">{item.label}</p>
            </div>
          );
        })}
      </motion.div>

      {isError ? (
        <ApiErrorState onRetry={refetch} />
      ) : isLoading ? (
        <div className="space-y-3">
          <ChartSkeleton className="h-56" />
          <ChartSkeleton className="h-48" />
        </div>
      ) : (
        <>
          {/* Area chart */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="premium-surface rounded-2xl p-4"
          >
            <h3 className="text-white font-semibold text-sm mb-1">Evolução Financeira</h3>
            <p className="text-muted-foreground text-xs mb-4">Receita mensal</p>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Receita']}
                  contentStyle={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2.5} fill="url(#grad1)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Bar chart */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="premium-surface rounded-2xl p-4"
          >
            <h3 className="text-white font-semibold text-sm mb-1">Receita vs Despesas</h3>
            <p className="text-muted-foreground text-xs mb-4">Comparativo mensal</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v, n) => [formatCurrency(Number(v)), n === 'revenue' ? 'Receita' : 'Despesas']}
                  contentStyle={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={20} opacity={0.85} />
                <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={20} opacity={0.75} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </>
      )}
    </div>
  );
}
