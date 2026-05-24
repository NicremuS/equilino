import { readDb, writeDb } from './db.server';
import type { Payment, Tenant, Property, Notification, RentReminder, RentReminderType } from '@/types';

// ── Cooldown (in-memory, per-tenant, avoids redundant DB reads on every poll) ─
const cooldowns = new Map<string, number>();
const COOLDOWN_MS = 90_000; // 90 seconds

export function shouldRunCheck(tenantId: string): boolean {
  const last = cooldowns.get(tenantId) ?? 0;
  const now  = Date.now();
  if (now - last < COOLDOWN_MS) return false;
  cooldowns.set(tenantId, now);
  return true;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function todayDateStr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // YYYY-MM-DD
}

function getDaysUntilDue(dueDateStr: string): number {
  const today = new Date(todayDateStr() + 'T00:00:00');
  const due   = new Date(dueDateStr.split('T')[0] + 'T00:00:00');
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

// ── Reminder windows ──────────────────────────────────────────────────────────

interface Window {
  days: number;
  type: RentReminderType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: (amount: string, month: string) => string;
  message: (amount: string, month: string, property: string) => string;
}

const WINDOWS: Window[] = [
  {
    days: 3, type: 'due_3d', priority: 'low',
    title:   (a) => `Aluguel vence em 3 dias`,
    message: (a, m, p) => `Seu aluguel de ${a} (${m}) em ${p} vence em 3 dias. Organize-se para realizar o pagamento em tempo.`,
  },
  {
    days: 2, type: 'due_2d', priority: 'medium',
    title:   (a) => `Aluguel vence em 2 dias`,
    message: (a, m, p) => `Seu aluguel de ${a} (${m}) em ${p} vence em 2 dias. Realize o pagamento para evitar multas.`,
  },
  {
    days: 1, type: 'due_1d', priority: 'high',
    title:   (a) => `Aluguel vence amanhã!`,
    message: (a, m, p) => `Seu aluguel de ${a} (${m}) em ${p} vence amanhã. Não esqueça de enviar o comprovante pelo app.`,
  },
  {
    days: 0, type: 'due_today', priority: 'urgent',
    title:   (a) => `Aluguel vence HOJE!`,
    message: (a, m, p) => `Seu aluguel de ${a} (${m}) em ${p} vence hoje. Acesse os pagamentos para registrar o comprovante.`,
  },
  {
    days: -1, type: 'overdue_1d', priority: 'urgent',
    title:   (a) => `Aluguel em atraso`,
    message: (a, m, p) => `Seu aluguel de ${a} (${m}) em ${p} está vencido há 1 dia. Entre em contato com o locador.`,
  },
  {
    days: -3, type: 'overdue_3d', priority: 'urgent',
    title:   (a) => `Aluguel em atraso — 3 dias`,
    message: (a, m, p) => `Seu aluguel de ${a} (${m}) em ${p} está vencido há 3 dias. Regularize sua situação para evitar penalidades.`,
  },
  {
    days: -7, type: 'overdue_7d', priority: 'urgent',
    title:   (a) => `Aluguel em atraso — 7 dias`,
    message: (a, m, p) => `Seu aluguel de ${a} (${m}) em ${p} está vencido há 7 dias. Entre em contato com o locador imediatamente.`,
  },
  {
    days: -14, type: 'overdue_14d', priority: 'urgent',
    title:   (a) => `Aluguel em atraso — 14 dias`,
    message: (a, m, p) => `Seu aluguel de ${a} (${m}) em ${p} está vencido há 14 dias. É necessário regularizar urgentemente.`,
  },
];

// ── Core check function ───────────────────────────────────────────────────────

export function checkAndCreateRentReminders(forTenantId?: string): number {
  const db       = readDb();
  const payments = (db.payments  as Payment[])  ?? [];
  const tenants  = (db.tenants   as Tenant[])   ?? [];
  const props    = (db.properties as Property[]) ?? [];
  const reminders = (db.rent_reminders as RentReminder[]) ?? [];
  const sentKeys = new Set(reminders.map(r => `${r.paymentId}:${r.reminderType}`));

  const newReminders: RentReminder[] = [];
  const newNotifications: Notification[] = [];
  const now = new Date().toISOString();

  // Filter payments: skip already-done ones
  const relevant = payments.filter(p => {
    if (forTenantId && p.tenantId !== forTenantId) return false;
    return p.status === 'pending' || p.status === 'overdue';
  });

  for (const payment of relevant) {
    const days    = getDaysUntilDue(payment.dueDate);
    const window  = WINDOWS.find(w => w.days === days);
    if (!window) continue;

    const key = `${payment.id}:${window.type}`;
    if (sentKeys.has(key)) continue; // already sent

    const tenant   = tenants.find(t => t.id === payment.tenantId);
    const property = props.find(p => p.id === payment.propertyId);
    if (!tenant) continue;

    const amountFmt  = fmt(payment.amount);
    const propName   = property?.name ?? 'imóvel';

    const reminder: RentReminder = {
      id:           crypto.randomUUID(),
      tenantId:     payment.tenantId,
      paymentId:    payment.id,
      reminderType: window.type,
      sentAt:       now,
    };

    const notification: Notification = {
      id:             crypto.randomUUID(),
      type:           'payment',
      title:          window.title(amountFmt, payment.month),
      message:        window.message(amountFmt, payment.month, propName),
      read:           false,
      createdAt:      now,
      relatedId:      payment.id,
      priority:       window.priority,
      targetTenantId: payment.tenantId,
    };

    newReminders.push(reminder);
    newNotifications.push(notification);
    sentKeys.add(key);
  }

  if (newReminders.length === 0) return 0;

  // Batch-write to avoid multiple file writes
  (db.rent_reminders as RentReminder[]).push(...newReminders);
  (db.notifications  as Notification[]).push(...newNotifications);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  writeDb(db as any);

  return newReminders.length;
}
