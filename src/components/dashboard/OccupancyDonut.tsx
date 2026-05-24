'use client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartSkeleton } from '@/components/shared/LoadingSkeleton';

interface OccupancyDonutProps {
  data?: Array<{ name: string; value: number; color: string }>;
  isLoading?: boolean;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="premium-tooltip rounded-xl px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: item.payload.color }} />
        <span className="text-foreground text-xs font-semibold">{item.name}</span>
        <span className="text-muted-foreground text-xs">{item.value} imóv.</span>
      </div>
    </div>
  );
}

const statusColors: Record<string, string> = {
  'Ocupado':    'bg-violet-500',
  'Vago':       'bg-gray-600',
  'Manutenção': 'bg-amber-500',
  'Reservado':  'bg-blue-500',
};

export function OccupancyDonut({ data, isLoading }: OccupancyDonutProps) {
  if (isLoading || !data) return <ChartSkeleton />;

  const total    = data.reduce((s, d) => s + d.value, 0);
  const occupied = data.find(d => d.name === 'Ocupado')?.value ?? 0;
  const pct      = total > 0 ? Math.round((occupied / total) * 100) : 0;

  return (
    <div
      className="premium-surface rounded-2xl overflow-hidden animate-card-enter"
      style={{ animationDelay: '0.18s', animationFillMode: 'both' }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-premium">
        <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-1">Ocupação</p>
        <div className="flex items-end justify-between">
          <p className="text-foreground text-xl font-bold leading-none">{pct}%</p>
          <p className="text-muted-foreground text-xs">{total} imóveis</p>
        </div>
      </div>

      <div className="flex items-center gap-4 p-4">
        {/* Donut */}
        <div className="relative flex-shrink-0" style={{ width: 120, height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={54}
                paddingAngle={3}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-foreground text-lg font-bold leading-none">{pct}%</span>
            <span className="text-muted-foreground text-[9px] font-medium mt-0.5">ocup.</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {data.map((entry) => {
            const entryPct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
            const barCls = statusColors[entry.name] ?? 'bg-gray-500';
            return (
              <div key={entry.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                    <span className="text-muted-foreground text-xs font-medium">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-foreground text-xs font-bold">{entry.value}</span>
                    <span className="text-muted-foreground text-[10px]">{entryPct}%</span>
                  </div>
                </div>
                {/* Mini progress bar — CSS transition on width */}
                <div className="h-1 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barCls} transition-[width] duration-700 ease-out`}
                    style={{ width: `${entryPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
