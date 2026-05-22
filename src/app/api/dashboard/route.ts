import { NextResponse } from 'next/server';
import { getCollection, readDb } from '@/lib/db.server';
import type { Payment, Property, Contract, MaintenanceTicket, DashboardStats } from '@/types';

export async function GET() {
  const db = readDb();
  const payments = db.payments as Payment[];
  const properties = db.properties as Property[];
  const contracts = db.contracts as Contract[];
  const tickets = db.tickets as MaintenanceTicket[];

  const currentYear = new Date().getFullYear().toString();
  const paidThisMonth = payments.filter((p) => p.status === 'paid' && p.month?.includes(currentYear));
  const monthlyRevenue = paidThisMonth.reduce((sum, p) => sum + p.amount, 0);
  const totalRevenue = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const overdueAmount = payments.filter((p) => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);
  const occupied = properties.filter((p) => p.status === 'occupied').length;
  const occupancyRate = properties.length ? Math.round((occupied / properties.length) * 100) : 0;

  const stats: DashboardStats = {
    totalRevenue,
    monthlyRevenue,
    overdueAmount,
    activeContracts: contracts.filter((c) => c.status === 'active').length,
    totalProperties: properties.length,
    occupancyRate,
    openTickets: tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length,
    pendingPayments: payments.filter((p) => p.status === 'pending').length,
  };

  return NextResponse.json(stats);
}
