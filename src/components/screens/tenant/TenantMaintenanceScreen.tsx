'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Plus, X, AlertCircle, Clock, CheckCircle2, Loader2, ChevronDown, Camera, ImageIcon } from 'lucide-react';
import { useTenantTickets, useTenantProperty, useCreateTenantTicket } from '@/hooks/useTenantApi';
import { ListItemSkeleton, ApiErrorState } from '@/components/shared/LoadingSkeleton';
import { formatDate } from '@/lib/utils';
import type { TicketPriority, TicketStatus } from '@/types';

const PRIORITY_MAP: Record<TicketPriority, { label: string; color: string; bg: string }> = {
  low:    { label: 'Baixa',   color: 'text-slate-400',   bg: 'bg-slate-500/10' },
  medium: { label: 'Média',   color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  high:   { label: 'Alta',    color: 'text-orange-400',  bg: 'bg-orange-500/10' },
  urgent: { label: 'Urgente', color: 'text-red-400',     bg: 'bg-red-500/10' },
};

const STATUS_MAP: Record<TicketStatus, { label: string; icon: React.ElementType; color: string }> = {
  open:        { label: 'Aberto',       icon: AlertCircle,    color: 'text-amber-400' },
  in_progress: { label: 'Em andamento', icon: Clock,          color: 'text-blue-400' },
  resolved:    { label: 'Resolvido',    icon: CheckCircle2,   color: 'text-emerald-400' },
  closed:      { label: 'Encerrado',    icon: CheckCircle2,   color: 'text-muted-foreground' },
};

const CATEGORIES = [
  { value: 'plumbing',    label: 'Hidráulica' },
  { value: 'electrical',  label: 'Elétrica' },
  { value: 'structural',  label: 'Estrutural' },
  { value: 'appliance',   label: 'Eletrodoméstico' },
  { value: 'other',       label: 'Outro' },
];

export function TenantMaintenanceScreen() {
  const { data: tickets, isLoading, isError, refetch } = useTenantTickets();
  const { data: property } = useTenantProperty();
  const createTicket = useCreateTenantTicket();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [images, setImages] = useState<string[]>([]);
  const [formError, setFormError] = useState('');

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - images.length;
    const toProcess = files.slice(0, remaining);
    const encoded = await Promise.all(
      toProcess.map(
        file => new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
      )
    );
    setImages(prev => [...prev, ...encoded]);
    e.target.value = '';
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!title.trim() || !description.trim()) {
      setFormError('Preencha o título e a descrição.');
      return;
    }
    if (!property) {
      setFormError('Imóvel não encontrado.');
      return;
    }
    setFormError('');
    try {
      await createTicket.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        category: category as 'plumbing' | 'electrical' | 'structural' | 'appliance' | 'other',
        priority,
        propertyId: property.id,
        images: images.length > 0 ? images : undefined,
      });
      setTitle('');
      setDescription('');
      setCategory('other');
      setPriority('medium');
      setImages([]);
      setShowForm(false);
    } catch {
      setFormError('Erro ao abrir chamado. Tente novamente.');
    }
  }

  if (isLoading) return <ListItemSkeleton count={3} />;
  if (isError) return <ApiErrorState onRetry={refetch} />;

  const active = tickets?.filter(t => t.status === 'open' || t.status === 'in_progress') ?? [];
  const history = tickets?.filter(t => t.status === 'resolved' || t.status === 'closed') ?? [];

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center justify-between">
        <motion.h1
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-foreground"
        >
          Manutenção
        </motion.h1>
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-colors"
        >
          <Plus size={15} />
          Novo chamado
        </motion.button>
      </div>

      {/* New ticket modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md z-50 premium-surface rounded-t-3xl md:rounded-3xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-foreground font-bold text-lg">Novo chamado</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Título</label>
                  <input
                    value={title}
                    onChange={e => { setTitle(e.target.value); setFormError(''); }}
                    placeholder="Ex: Torneira vazando"
                    className="w-full px-4 py-3 bg-muted/70 dark:bg-white/5 border border-border rounded-2xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/60 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Descrição</label>
                  <textarea
                    value={description}
                    onChange={e => { setDescription(e.target.value); setFormError(''); }}
                    placeholder="Descreva o problema..."
                    rows={3}
                    className="w-full px-4 py-3 bg-muted/70 dark:bg-white/5 border border-border rounded-2xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/60 transition-all resize-none"
                  />
                </div>

                {/* Photo upload */}
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
                    Fotos
                    <span className="ml-1 opacity-50">({images.length}/5)</span>
                  </label>

                  {images.length > 0 && (
                    <div className="flex gap-2 mb-2 flex-wrap">
                      {images.map((src, i) => (
                        <div key={i} className="relative w-[72px] h-[72px] rounded-xl overflow-hidden border border-border flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center transition-colors"
                          >
                            <X size={10} className="text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {images.length < 5 && (
                    <label className="flex items-center gap-2.5 px-4 py-3 bg-muted/70 dark:bg-[#111827] border border-dashed border-border hover:border-emerald-500/50 rounded-2xl cursor-pointer transition-colors group">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                        <Camera size={15} className="text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground font-medium leading-tight">Adicionar fotos</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">JPG, PNG — até 5 imagens</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageSelect}
                      />
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Categoria</label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full appearance-none px-4 py-3 bg-muted/70 dark:bg-[#111827] border border-border rounded-2xl text-foreground text-sm focus:outline-none focus:border-emerald-500/60 transition-all pr-8"
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Prioridade</label>
                    <div className="relative">
                      <select
                        value={priority}
                        onChange={e => setPriority(e.target.value as TicketPriority)}
                        className="w-full appearance-none px-4 py-3 bg-muted/70 dark:bg-[#111827] border border-border rounded-2xl text-foreground text-sm focus:outline-none focus:border-emerald-500/60 transition-all pr-8"
                      >
                        {Object.entries(PRIORITY_MAP).map(([val, { label }]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>

                {formError && (
                  <p className="text-red-400 text-xs flex items-center gap-1.5">
                    <AlertCircle size={12} /> {formError}
                  </p>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={createTicket.isPending}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {createTicket.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>Abrir chamado</>
                )}
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Active tickets */}
      {active.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Em aberto</p>
          {active.map((ticket, i) => {
            const s = STATUS_MAP[ticket.status];
            const p = PRIORITY_MAP[ticket.priority];
            const Icon = s.icon;
            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="premium-surface rounded-2xl p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Wrench size={16} className="text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-semibold text-sm">{ticket.title}</p>
                    <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{ticket.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs font-medium flex items-center gap-1 ${s.color}`}>
                        <Icon size={11} />{s.label}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.color} ${p.bg}`}>
                        {p.label}
                      </span>
                      {ticket.images && ticket.images.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ImageIcon size={11} />
                          {ticket.images.length}
                        </span>
                      )}
                    </div>
                    {ticket.images && ticket.images.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {ticket.images.map((src, i) => (
                          <div key={i} className="w-12 h-12 rounded-lg overflow-hidden border border-border flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                    {ticket.assignedTo && (
                      <p className="text-muted-foreground text-xs mt-1">Responsável: {ticket.assignedTo}</p>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs flex-shrink-0">{formatDate(ticket.createdAt)}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Histórico</p>
          {history.map((ticket, i) => {
            const s = STATUS_MAP[ticket.status];
            const Icon = s.icon;
            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="premium-surface rounded-2xl p-4 opacity-70"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className={s.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-semibold text-sm">{ticket.title}</p>
                    <p className="text-muted-foreground text-xs">{s.label} · {formatDate(ticket.updatedAt)}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {tickets?.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Wrench size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-sm">Nenhum chamado encontrado</p>
          <p className="text-xs mt-1">Tudo tranquilo por aqui!</p>
        </div>
      )}
    </div>
  );
}
