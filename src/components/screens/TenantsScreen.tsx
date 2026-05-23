'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, Star, Phone, Mail, ChevronRight, Plus, X, AlertCircle } from 'lucide-react';
import { useTenants, useProperties, useCreateTenant, useCreateContract } from '@/hooks/useApi';
import { ApiErrorState } from '@/components/shared/LoadingSkeleton';
import { formatDate, getInitials } from '@/lib/utils';
import { TenantProfileScreen } from './TenantProfileScreen';
import type { Tenant } from '@/types';

function ScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? '#22C55E' : score >= 65 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted/70 dark:bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-xs font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

type ContractDraft = {
  tenantName: string;
  email: string;
  cpf: string;
  birthDate: string;
  phone: string;
  propertyId: string;
  startDate: string;
  durationValue: number;
  durationUnit: 'months' | 'years';
  rentAmount: number;
};

const todayInput = () => new Date().toISOString().slice(0, 10);

function addContractDuration(startDate: string, value: number, unit: ContractDraft['durationUnit']) {
  const date = new Date(`${startDate}T00:00:00`);
  const months = unit === 'years' ? value * 12 : value;
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

export function TenantsScreen() {
  const { data: tenants, isLoading, isError, refetch } = useTenants();
  const { data: properties = [] } = useProperties();
  const createTenant = useCreateTenant();
  const createContract = useCreateContract();
  const [search, setSearch] = useState('');
  const [showActive, setShowActive] = useState(true);
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [isCreatingContract, setIsCreatingContract] = useState(false);
  const [createError, setCreateError] = useState('');
  const [draft, setDraft] = useState<ContractDraft>({
    tenantName: '',
    email: '',
    cpf: '',
    birthDate: '',
    phone: '',
    propertyId: '',
    startDate: todayInput(),
    durationValue: 12,
    durationUnit: 'months',
    rentAmount: 0,
  });

  const filtered = (tenants ?? []).filter(t => {
    const matchActive = showActive ? t.status === 'active' : true;
    const matchSearch = !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase());
    return matchActive && matchSearch;
  });

  function updateDraft(patch: Partial<ContractDraft>) {
    setDraft(prev => {
      const updated = { ...prev, ...patch };
      if (patch.propertyId) {
        const prop = properties.find(p => p.id === patch.propertyId);
        if (prop) updated.rentAmount = prop.rentAmount;
      }
      return updated;
    });
  }

  async function handleCreate() {
    if (!draft.tenantName || !draft.cpf || !draft.phone || !draft.propertyId) return;
    const endDate = addContractDuration(draft.startDate, draft.durationValue, draft.durationUnit);
    try {
    const newTenant = await createTenant.mutateAsync({
      name: draft.tenantName,
      email: draft.email,
      cpf: draft.cpf,
      phone: draft.phone,
      score: 50,
      status: 'active',
      propertyId: draft.propertyId,
      joinedAt: new Date().toISOString(),
      paymentHistory: [],
    });

    await createContract.mutateAsync({
      tenantId: newTenant.id,
      propertyId: draft.propertyId,
      startDate: draft.startDate,
      endDate,
      rentAmount: draft.rentAmount,
      adjustmentIndex: 'IGPM',
      status: 'active',
      depositAmount: draft.rentAmount * 2,
      guaranteeType: 'deposit',
      clauses: [],
      signedAt: new Date().toISOString(),
    });

    setIsCreatingContract(false);
    setDraft({
      tenantName: '', email: '', cpf: '', birthDate: '', phone: '',
      propertyId: '', startDate: todayInput(),
      durationValue: 12, durationUnit: 'months', rentAmount: 0,
    });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Erro ao criar inquilino. Tente novamente.');
    }
  }

  const selectedProperty = properties.find(p => p.id === draft.propertyId);
  const endDate = draft.startDate ? addContractDuration(draft.startDate, draft.durationValue, draft.durationUnit) : '';
  const isPending = createTenant.isPending || createContract.isPending;

  return (
    <AnimatePresence mode="wait">
    {selected ? (
      <TenantProfileScreen key="profile" tenant={selected} onBack={() => setSelected(null)} />
    ) : (
    <div className="space-y-5 pb-2">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3"
      >
        <div>
          <h2 className="text-foreground text-xl font-bold">Inquilinos</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{isLoading ? '…' : `${filtered.length} inquilinos`}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsCreatingContract(true)}
          className="gradient-accent flex h-10 items-center gap-2 rounded-2xl px-3 text-xs font-bold text-white shadow-lg shadow-violet-500/20"
        >
          <Plus size={15} />
          Novo inquilino
        </motion.button>
      </motion.div>

      {isCreatingContract && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="premium-surface rounded-3xl p-4"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-foreground text-sm font-bold">Novo inquilino e contrato</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Preencha os dados do inquilino e defina o imóvel e prazo.
              </p>
            </div>
            <button
              onClick={() => { setIsCreatingContract(false); setCreateError(''); }}
              className="rounded-xl bg-muted/70 p-2 text-muted-foreground transition-colors hover:text-foreground dark:bg-white/5"
              aria-label="Fechar"
            >
              <X size={15} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome do inquilino</span>
              <input
                value={draft.tenantName}
                onChange={e => updateDraft({ tenantName: e.target.value })}
                placeholder="Nome completo"
                className="premium-field w-full rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">E-mail</span>
              <input
                type="email"
                value={draft.email}
                onChange={e => updateDraft({ email: e.target.value })}
                placeholder="email@exemplo.com"
                className="premium-field w-full rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">CPF</span>
              <input
                value={draft.cpf}
                onChange={e => updateDraft({ cpf: e.target.value })}
                placeholder="000.000.000-00"
                className="premium-field w-full rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Telefone</span>
              <input
                value={draft.phone}
                onChange={e => updateDraft({ phone: e.target.value })}
                placeholder="(00) 00000-0000"
                className="premium-field w-full rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25"
              />
            </label>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Imóvel</span>
              <select
                value={draft.propertyId}
                onChange={e => updateDraft({ propertyId: e.target.value })}
                className="premium-field w-full rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25"
              >
                <option value="">Selecione...</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>{property.name}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Início do contrato</span>
              <input
                type="date"
                value={draft.startDate}
                onChange={e => updateDraft({ startDate: e.target.value })}
                className="premium-field w-full rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25"
              />
            </label>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
            <label className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Duração</span>
              <input
                type="number"
                min={1}
                value={draft.durationValue}
                onChange={e => updateDraft({ durationValue: Number(e.target.value) })}
                className="premium-field w-full rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Prazo em</span>
              <select
                value={draft.durationUnit}
                onChange={e => updateDraft({ durationUnit: e.target.value as ContractDraft['durationUnit'] })}
                className="premium-field w-full rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25"
              >
                <option value="months">Meses</option>
                <option value="years">Anos</option>
              </select>
            </label>

            <label className="space-y-1.5 md:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Valor do aluguel</span>
              <input
                type="number"
                min={0}
                value={draft.rentAmount}
                onChange={e => updateDraft({ rentAmount: Number(e.target.value) })}
                className="premium-field w-full rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25"
              />
            </label>
          </div>

          {createError && (
            <div className="mt-3 flex items-start gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-red-400 text-xs">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{createError}</span>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-violet-500 dark:text-violet-300 text-xs font-bold">
                Contrato até {endDate ? formatDate(endDate) : '—'}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Imóvel: {selectedProperty?.name ?? '—'} · CPF: {draft.cpf || '—'} · Tel: {draft.phone || '—'}
              </p>
            </div>
            <button
              onClick={() => { setCreateError(''); handleCreate(); }}
              disabled={isPending || !draft.tenantName || !draft.cpf || !draft.phone || !draft.propertyId}
              className="gradient-accent rounded-2xl px-4 py-3 text-xs font-bold text-white shadow-lg shadow-violet-500/20 disabled:opacity-50"
            >
              {isPending ? 'Salvando…' : 'Criar inquilino e contrato'}
            </button>
          </div>
        </motion.div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou email..."
          className="w-full pl-9 pr-4 py-3 premium-surface rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50 transition-colors" />
      </div>

      <div className="flex gap-2">
        <button onClick={() => setShowActive(true)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${showActive ? 'bg-violet-500 border-violet-500 text-white' : 'border-border text-muted-foreground hover:text-foreground'}`}>
          Ativos
        </button>
        <button onClick={() => setShowActive(false)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${!showActive ? 'bg-violet-500 border-violet-500 text-white' : 'border-border text-muted-foreground hover:text-foreground'}`}>
          Todos
        </button>
      </div>

      {isError ? (
        <ApiErrorState onRetry={refetch} />
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="premium-surface rounded-2xl p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-muted/70 dark:bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted/70 dark:bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-muted/70 dark:bg-white/5 rounded w-1/2" />
                </div>
              </div>
              <div className="h-2 bg-muted/70 dark:bg-white/5 rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {filtered.map((tenant, i) => {
              const property = properties.find(p => p.id === tenant.propertyId);
              return (
                <motion.div
                  key={tenant.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => setSelected(tenant)}
                  className="premium-surface rounded-2xl p-4 cursor-pointer hover:border-violet-500/25 transition-colors"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {getInitials(tenant.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className="text-white font-semibold text-sm">{tenant.name}</p>
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star size={11} fill="currentColor" />
                          <span className="text-xs font-bold">{tenant.score}</span>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5">
                        <Mail size={10} /> {tenant.email}
                      </p>
                      <p className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5">
                        <Phone size={10} /> {tenant.phone}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-muted-foreground text-[10px]">Score de pagamento</p>
                    </div>
                    <ScoreBar score={tenant.score} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {tenant.paymentHistory.slice(-6).map((status, idx) => (
                        <div
                          key={idx}
                          title={status}
                          className={`w-5 h-5 rounded-full text-[8px] flex items-center justify-center font-bold ${
                            status === 'paid' ? 'bg-green-500/20 text-green-400' :
                            status === 'overdue' ? 'bg-red-500/20 text-red-400' :
                            status === 'partial' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {status === 'paid' ? '✓' : status === 'overdue' ? '!' : '~'}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      {property && <span className="text-xs">{property.name}</span>}
                      <ChevronRight size={12} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <Users size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum inquilino encontrado</p>
              </div>
            )}
          </div>
        </AnimatePresence>
      )}
    </div>
    )}
    </AnimatePresence>
  );
}
