'use client';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ChartSkeleton } from '@/components/shared/LoadingSkeleton';
import { formatCurrency } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import type { ChartDataPoint } from '@/types';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const revenue  = payload.find(p => p.name === 'revenue')?.value ?? 0;
  const expenses = payload.find(p => p.name === 'expenses')?.value ?? 0;
  const net = revenue - expenses;
  return (
    <div className="premium-tooltip rounded-2xl p-3 min-w-[140px]">
      <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider mb-2">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" /> Receita
          </span>
          <span className="text-violet-700 dark:text-violet-300 text-[11px] font-bold">R$ {(revenue / 1000).toFixed(1)}k</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" /> Despesas
          </span>
          <span className="text-red-700 dark:text-red-300 text-[11px] font-bold">R$ {(expenses / 1000).toFixed(1)}k</span>
        </div>
        <div className="border-t border-border pt-1.5 flex items-center justify-between gap-4">
          <span className="text-[11px] text-muted-foreground">Líquido</span>
          <span className={`text-[11px] font-bold ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            R$ {(net / 1000).toFixed(1)}k
          </span>
        </div>
      </div>
    </div>
  );
}

interface RevenueChartProps {
  data?: ChartDataPoint[];
  isLoading?: boolean;
}

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  const gridColor   = isDark ? '#ffffff06'  : '#00000008';
  const axisColor   = isDark ? '#6B7280'    : '#9CA3AF';
  const dotStroke   = isDark ? '#0f172a'    : '#ffffff';
  const cursorColor = isDark ? '#ffffff10'  : '#00000010';

  if (isLoading || !data) return <ChartSkeleton className="h-64" />;

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const prevMonthRevenue = data[data.length - 2]?.revenue ?? 0;
  const lastRevenue = data[data.length - 1]?.revenue ?? 0;
  const growthPct = prevMonthRevenue > 0
    ? (((lastRevenue - prevMonthRevenue) / prevMonthRevenue) * 100).toFixed(1)
    : '0';
  const isPositive = parseFloat(growthPct) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="premium-surface rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-premium">
        <div>
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-1">Receita vs Despesas</p>
          <p className="text-foreground text-xl font-bold leading-none">{formatCurrency(totalRevenue)}</p>
          <p className="text-muted-foreground text-xs mt-1">Acumulado · últimos 6 meses</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
            isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {isPositive
              ? <TrendingUp size={11} />
              : <TrendingDown size={11} />
            }
            {isPositive ? '+' : ''}{growthPct}%
          </span>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-violet-400" /> Receita
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-red-400" /> Despesas
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 pt-3 pb-2">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#7C3AED" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 6" stroke={gridColor} horizontal={true} vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: axisColor, fontSize: 11, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              tick={{ fill: axisColor, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: cursorColor, strokeWidth: 1 }} />
            <Area
              type="natural"
              dataKey="revenue"
              stroke="#8B5CF6"
              strokeWidth={2.5}
              fill="url(#revenueGrad)"
              dot={false}
              activeDot={{ r: 5, fill: '#8B5CF6', stroke: dotStroke, strokeWidth: 2 }}
            />
            <Area
              type="natural"
              dataKey="expenses"
              stroke="#F87171"
              strokeWidth={2}
              fill="url(#expensesGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#F87171', stroke: dotStroke, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
