'use client';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Cell,
} from 'recharts';
import { ChartSkeleton } from '@/components/shared/LoadingSkeleton';
import { useAppStore } from '@/store/useAppStore';
import type { ChartDataPoint } from '@/types';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="premium-tooltip rounded-xl px-3 py-2">
      <p className="text-muted-foreground text-[10px] font-semibold mb-1">{label}</p>
      <p className="text-violet-700 dark:text-violet-300 text-sm font-bold">{val}% <span className="text-muted-foreground font-normal text-[10px]">ocupação</span></p>
    </div>
  );
}

interface LabelProps {
  x?: number;
  y?: number;
  width?: number;
  value?: number;
}

function TopLabel({ x = 0, y = 0, width = 0, value = 0, fill = '#9CA3AF' }: LabelProps & { fill?: string }) {
  return (
    <text
      x={x + width / 2}
      y={y - 5}
      fill={fill}
      textAnchor="middle"
      fontSize={9}
      fontWeight={600}
    >
      {value}%
    </text>
  );
}

interface OccupancyBarProps {
  data?: ChartDataPoint[];
  isLoading?: boolean;
}

export function OccupancyBar({ data, isLoading }: OccupancyBarProps) {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const gridColor  = isDark ? '#ffffff06' : '#00000008';
  const axisColor  = isDark ? '#6B7280'   : '#9CA3AF';
  const labelColor = isDark ? '#9CA3AF'   : '#6B7280';
  const cursorFill = isDark ? '#ffffff05' : '#00000005';

  if (isLoading || !data) return <ChartSkeleton />;

  const latest = data[data.length - 1]?.occupancy ?? 0;
  const prev   = data[data.length - 2]?.occupancy ?? 0;
  const delta  = latest - prev;

  return (
    <div
      className="premium-surface rounded-2xl overflow-hidden animate-card-enter"
      style={{ animationDelay: '0.19s', animationFillMode: 'both' }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-premium">
        <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-1">Taxa de Ocupação</p>
        <div className="flex items-end justify-between">
          <p className="text-foreground text-xl font-bold leading-none">{latest}%</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            delta >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {delta >= 0 ? '+' : ''}{delta}pp vs. mês ant.
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 pt-4 pb-2">
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={data} margin={{ top: 16, right: 4, left: -28, bottom: 0 }} barCategoryGap="35%">
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#8B5CF6" stopOpacity={1}   />
                <stop offset="100%" stopColor="#5B21B6" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="barGradActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#A78BFA" stopOpacity={1}   />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 6" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: axisColor, fontSize: 10, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              tick={{ fill: axisColor, fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              domain={[60, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: cursorFill, radius: 8 }} />
            <Bar
              dataKey="occupancy"
              radius={[6, 6, 2, 2]}
              maxBarSize={36}
              label={<TopLabel fill={labelColor} />}
            >
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={i === data.length - 1 ? 'url(#barGradActive)' : 'url(#barGrad)'}
                  opacity={i === data.length - 1 ? 1 : 0.65}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
