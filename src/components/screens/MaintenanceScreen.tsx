'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Zap, Droplets, Package, ChevronRight, Plus, X, CheckCircle2, AlertCircle, Clock, XCircle, Calendar, User, ImageIcon } from 'lucide-react';
import { useTickets, useProperties, useTenants, useCreateTicket } from '@/hooks/useApi';
import { formatRelativeTime, formatCurrency, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ListItemSkeleton, ApiErrorState } from '@/components/shared/LoadingSkeleton';
import type { MaintenanceTicket, TicketStatus, TicketPriority } from '@/types';

const filters: { label: string; value: TicketStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Abertos', value: 'open' },
  { label: 'Em andamento', value: 'in_progress' },
  { label: 'Resolvidos', value: 'resolved' },
];

const categoryIcons: Record<string, React.ElementType> = {
  plumbing: Droplets,
  electrical: Zap,
  structural: Package,
  appliance: Package,
  other: Wrench,
};

const categoryColors: Record<string, string> = {
  plumbing: 'text-blue-400 bg-blue-500/10',
  electrical: 'text-yellow-400 bg-yellow-500/10',
  structural: 'text-orange-400 bg-orange-500/10',
  appliance: 'text-purple-400 bg-purple-500/10',
  other: 'text-gray-400 bg-gray-500/10',
};

const categoryLabel: Record<string, string> = {
  plumbing: 'Hidráulico', electrical: 'Elétrico', structural: 'Estrutural',
  appliance: 'Eletrodoméstico', other: 'Outro',
};

const priorityLabel: Record<TicketPriority, string> = {
  low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente',
};

const statusConfig: Record<TicketStatus, { icon: React.ElementType; color: string; label: string }> = {
  open:        { icon: AlertCircle,  color: 'text-yellow-400', label: 'Aberto'       },
  in_progress: { icon: Clock,        color: 'text-blue-400',   label: 'Em andamento' },
  resolved:    { icon: CheckCircle2, color: 'text-green-400',  label: 'Resolvido'    },
  closed:      { icon: XCircle,      color: 'text-gray-400',   label: 'Encerrado'    },
};

type NewTicketDraft = {
  title: string;
  description: string;
  category: MaintenanceTicket['category'];
  priority: TicketPriority;
  propertyId: string;
};

export function MaintenanceScreen() {
  const { data: tickets, isLoading, isError, refetch } = useTickets();
  const { data: properties = [] } = useProperties();
  const { data: tenants = [] } = useTenants();
  const createTicket = useCreateTicket();
  const [active, setActive] = useState<TicketStatus | 'all'>('all');
  const [selected, setSelected] = useState<MaintenanceTicket | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState<NewTicketDraft>({
    title: '', description: '', category: 'other', priority: 'medium',
    propertyId: '',
  });

  const filtered = (tickets ?? []).filter(t => active === 'all' || t.status === active);
  const urgent = (tickets ?? []).filter(t => t.priority === 'urgent' && t.status !== 'resolved').length;

  const resetDraft = () => setDraft({ title: '', description: '', category: 'other', priority: 'medium', propertyId: '' });

  function submitTicket() {
    if (!draft.title.trim() || !draft.propertyId) return;
    createTicket.mutate(
      {
        title: draft.title,
        description: draft.description,
        category: draft.category,
        priority: draft.priority,
        propertyId: draft.propertyId,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          setIsCreating(false);
          resetDraft();
        },
      }
    );
  }

  if (selected) {
    const Icon = categoryIcons[selected.category] ?? Wrench;
    const iconClass = categoryColors[selected.category] ?? 'text-gray-400 bg-gray-500/10';
    const sta = statusConfig[selected.status];
    const StaIcon = sta.icon;
    const property = properties.find(p => p.id === selected.propertyId);
    const tenant = selected.tenantId ? tenants.find(t => t.id === selected.tenantId) : null;

    return (
      <motion.div
        initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.22 }}
        className="space-y-5 pb-2"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelected(null)}
            className="w-9 h-9 rounded-xl bg-muted/70 dark:bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <ChevronRight size={18} className="text-foreground rotate-180" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-base font-bold truncate">{selected.title}</p>
            <p className="text-muted-foreground text-xs">{categoryLabel[selected.category]}</p>
          </div>
        </div>

        <div className="premium-surface rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl flex-shrink-0 ${iconClass}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-foreground font-bold text-sm">{selected.title}</p>
              <div className={`flex items-center gap-1.5 mt-1 text-xs font-semibold ${sta.color}`}>
                <StaIcon size={11} /> {sta.label}
              </div>
            </div>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed">{selected.description}</p>

          {selected.images && selected.images.length > 0 && (
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-2 flex items-center gap-1">
                <ImageIcon size={9} /> Fotos do chamado ({selected.images.length})
              </p>
              <div className="flex gap-2 flex-wrap">
                {selected.images.map((src, i) => (
                  <a
                    key={i}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-20 h-20 rounded-xl overflow-hidden border border-border flex-shrink-0 hover:opacity-80 transition-opacity"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Prioridade', value: priorityLabel[selected.priority] },
              { label: 'Categoria', value: categoryLabel[selected.category] },
              { label: 'Imóvel', value: property?.name ?? '—' },
              { label: 'Responsável', value: selected.assignedTo ?? 'Não atribuído' },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl bg-muted/60 dark:bg-white/3 border border-border">
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-0.5">{item.label}</p>
                <p className="text-foreground text-xs font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          {tenant && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/60 dark:bg-white/3 border border-border">
              <User size={13} className="text-muted-foreground" />
              <p className="text-foreground text-xs font-medium">{tenant.name}</p>
              <p className="text-muted-foreground text-xs">{tenant.phone}</p>
            </div>
          )}

          <div className="flex gap-3 border-t border-border pt-3">
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-0.5 flex items-center gap-1"><Calendar size={9} /> Aberto em</p>
              <p className="text-foreground text-xs font-semibold">{formatDate(selected.createdAt)}</p>
            </div>
            {selected.cost && (
              <div className="ml-auto">
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-0.5">Custo</p>
                <p className="text-violet-400 text-sm font-bold">{formatCurrency(selected.cost)}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5 pb-2">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-foreground text-xl font-bold">Manutenção</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{isLoading ? '…' : `${tickets?.length ?? 0} chamados`}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreating(true)}
          className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center glow-accent"
          aria-label="Novo chamado"
        >
          <Plus size={18} className="text-white" />
        </motion.button>
      </motion.div>

      {/* New ticket modal */}
      <AnimatePresence>
        {isCreating && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55]"
              onClick={() => setIsCreating(false)}
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="fixed bottom-0 left-0 right-0 z-[60] premium-surface rounded-t-3xl flex flex-col"
              style={{ maxHeight: '92dvh', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
            >
              <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              <div className="overflow-y-auto flex-1 min-h-0 px-6 space-y-4 pt-1 pb-4">
                <div className="flex items-center justify-between">
                  <p className="text-foreground font-bold text-base">Novo chamado</p>
                  <button onClick={() => { setIsCreating(false); resetDraft(); }} className="w-8 h-8 rounded-full bg-muted/70 dark:bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground">
                    <X size={14} />
                  </button>
                </div>

                <label className="space-y-1.5 block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Título</span>
                  <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                    placeholder="Ex: Vazamento na cozinha"
                    className="premium-field w-full rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25" />
                </label>

                <label className="space-y-1.5 block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Descrição</span>
                  <textarea value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                    placeholder="Descreva o problema com detalhes..."
                    rows={3}
                    className="premium-field w-full rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25 resize-none" />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1.5 block">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Categoria</span>
                    <select value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value as NewTicketDraft['category'] }))}
                      className="premium-field w-full rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25">
                      {Object.entries(categoryLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </label>

                  <label className="space-y-1.5 block">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Prioridade</span>
                    <select value={draft.priority} onChange={e => setDraft(d => ({ ...d, priority: e.target.value as TicketPriority }))}
                      className="premium-field w-full rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25">
                      {Object.entries(priorityLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </label>
                </div>

                <label className="space-y-1.5 block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Imóvel</span>
                  <select
                    value={draft.propertyId}
                    onChange={e => setDraft(d => ({ ...d, propertyId: e.target.value }))}
                    className="premium-field w-full rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25"
                  >
                    <option value="">Selecione o imóvel</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
              </div>

              <div className="flex gap-3 px-6 pt-4 flex-shrink-0 border-t border-border/40">
                <button onClick={() => { setIsCreating(false); resetDraft(); }}
                  className="flex-1 py-3.5 rounded-2xl bg-muted/70 dark:bg-white/5 border border-border text-muted-foreground text-sm font-semibold hover:text-foreground transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={submitTicket}
                  disabled={!draft.title.trim() || !draft.propertyId || createTicket.isPending}
                  className="flex-1 py-3.5 rounded-2xl gradient-accent text-white text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  {createTicket.isPending ? 'Salvando…' : 'Abrir chamado'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {urgent > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 flex items-center gap-3"
        >
          <div className="p-2 rounded-xl bg-red-500/20">
            <Zap size={16} className="text-red-400" />
          </div>
          <div>
            <p className="text-red-400 font-semibold text-sm">{urgent} chamado(s) urgente(s)</p>
            <p className="text-red-400/60 text-xs">Requer atenção imediata</p>
          </div>
        </motion.div>
      )}

      {/* Status summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="grid grid-cols-3 gap-2"
      >
        {[
          { label: 'Abertos', count: (tickets ?? []).filter(t => t.status === 'open').length, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Andamento', count: (tickets ?? []).filter(t => t.status === 'in_progress').length, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
          { label: 'Resolvidos', count: (tickets ?? []).filter(t => t.status === 'resolved').length, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
        ].map(item => (
          <div key={item.label} className={`rounded-2xl border p-3 ${item.bg}`}>
            <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
            <p className="text-muted-foreground text-xs mt-0.5">{item.label}</p>
          </div>
        ))}
      </motion.div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map(f => (
          <button key={f.value} onClick={() => setActive(f.value)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
              active === f.value ? 'bg-violet-500 border-violet-500 text-white' : 'border-border text-muted-foreground hover:border-violet-500/30 hover:bg-muted/60 hover:text-foreground'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {isError ? <ApiErrorState onRetry={refetch} /> : isLoading ? <ListItemSkeleton count={4} /> : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {filtered.map((ticket, i) => {
              const property = properties.find(p => p.id === ticket.propertyId);
              const Icon = categoryIcons[ticket.category] ?? Wrench;
              const iconClass = categoryColors[ticket.category] ?? 'text-gray-400 bg-gray-500/10';

              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => setSelected(ticket)}
                  className="premium-surface rounded-2xl p-4 cursor-pointer hover:border-violet-500/25 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${iconClass}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-foreground text-sm font-semibold leading-snug">{ticket.title}</p>
                        <ChevronRight size={14} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                      </div>
                      <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{ticket.description}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <StatusBadge type="ticket" status={ticket.status} />
                        <StatusBadge type="priority" status={ticket.priority} />
                        {ticket.images && ticket.images.length > 0 && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <ImageIcon size={11} /> {ticket.images.length}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <p className="text-muted-foreground text-xs">{property?.name}</p>
                          {ticket.assignedTo && (
                            <p className="text-muted-foreground text-xs">→ {ticket.assignedTo}</p>
                          )}
                        </div>
                        <div className="text-right">
                          {ticket.cost && (
                            <p className="text-violet-400 text-xs font-semibold">{formatCurrency(ticket.cost)}</p>
                          )}
                          <p className="text-muted-foreground text-[10px]">{formatRelativeTime(ticket.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Wrench size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum chamado encontrado</p>
              </div>
            )}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
