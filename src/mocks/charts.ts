import { ChartDataPoint } from '@/types';

export const mockChartData: ChartDataPoint[] = [
  { month: 'Dez', revenue: 18200, expenses: 3200, occupancy: 78 },
  { month: 'Jan', revenue: 19400, expenses: 2800, occupancy: 80 },
  { month: 'Fev', revenue: 20100, expenses: 4100, occupancy: 82 },
  { month: 'Mar', revenue: 21500, expenses: 3500, occupancy: 85 },
  { month: 'Abr', revenue: 22900, expenses: 2900, occupancy: 83 },
  { month: 'Mai', revenue: 23400, expenses: 3800, occupancy: 87 },
];

export const mockOccupancyData = [
  { name: 'Ocupado', value: 4, color: '#7C3AED' },
  { name: 'Vago', value: 1, color: '#374151' },
  { name: 'Manutenção', value: 1, color: '#F59E0B' },
];

export const mockPaymentStatusData = [
  { name: 'Pago', value: 3, color: '#22C55E' },
  { name: 'Pendente', value: 1, color: '#F59E0B' },
  { name: 'Atrasado', value: 1, color: '#EF4444' },
];
