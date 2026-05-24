'use client';
import { useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { FileText, Calendar, ChevronRight, Plus, X, UserRound, Home } from 'lucide-react';
import { useContracts, useTenants, useProperties, useCreateContract } from '@/hooks/useApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ListItemSkeleton, ApiErrorState } from '@/components/shared/LoadingSkeleton';
import { ContractProfileScreen } from './ContractProfileScreen';
import type { Contract, ContractStatus } from '@/types';

const filters: { label: string; value: ContractStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Ativos', value: 'active' },
  { label: 'Vencendo', value: 'expiring' },
  { label: 'Vencidos', value: 'expired' },
];

type ContractDraft = {
  tenantId: string;
  propertyId: string;
  startDate: string;
  durationValue: number;
  durationUnit: 'months' | 'years';
  rentAmount: number;
  adjustmentIndex: Contract['adjustmentIndex'];
  guaranteeType: Contract['guaranteeType'];
  depositAmount: number;
};

const todayInput = () => new Date().toISOString().slice(0, 10);

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

function addContractDuration(startDate: string, value: number, unit: ContractDraft['durationUnit']) {
  const date = new Date(`${startDate}T00:00:00`);
  const months = unit === 'years' ? value * 12 : value;
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

function durationLabel(value: number, unit: ContractDraft['durationUnit']) {
  const label = unit === 'years'
    ? value === 1 ? 'ano' : 'anos'
    : value === 1 ? 'mês' : 'meses';
  return `${value} ${label}`;
}

export function ContractsScreen() {
  const { data: contracts, isLoading, isError, refetch } = useContracts();
  const { data: tenants = [] } = useTenants();
  const { data: properties = [] } = useProperties();
  const createContractMutation = useCreateContract();
  const [active, setActive] = useState<ContractStatus | 'all'>('all');
  const [selected, setSelected] = useState<Contract | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState<ContractDraft>(() => ({
    tenantId: '',
    propertyId: '',
    startDate: todayInput(),
    durationValue: 12,
    durationUnit: 'months',
    rentAmount: 0,
    adjustmentIndex: 'IPCA',
    guaranteeType: 'deposit',
    depositAmount: 0,
  }));

  const allContracts = contracts ?? [];
  const selectedTenant = tenants.find(t => t.id === draft.tenantId);
  const selectedProperty = properties.find(p => p.id === draft.propertyId);
  const endDate = draft.startDate ? addContractDuration(draft.startDate, draft.durationValue, draft.durationUnit) : '';
  const filtered = allContracts.filter(c => active === 'all' || c.status === active);

  function updateDraft(patch: Partial<ContractDraft>) {
    setDraft(prev => ({ ...prev, ...patch }));
  }

  function handlePropertyChange(propertyId: string) {
    const property = properties.find(p => p.id === propertyId);
    updateDraft({
      propertyId,
      rentAmount: property?.rentAmount ?? draft.rentAmount,
      depositAmount: (property?.rentAmount ?? draft.rentAmount) * 2,
    });
  }

  function createContract() {
    if (!draft.tenantId || !draft.propertyId || !draft.startDate || draft.durationValue <= 0 || draft.rentAmount <= 0) return;

    createContractMutation.mutate({
      tenantId: draft.tenantId,
      propertyId: draft.propertyId,
      startDate: draft.startDate,
      endDate,
      rentAmount: draft.rentAmount,
      adjustmentIndex: draft.adjustmentIndex,
      status: 'active',
      depositAmount: draft.depositAmount,
      guaranteeType: draft.guaranteeType,
      clauses: [
        `Prazo residencial de ${durationLabel(draft.durationValue, draft.durationUnit)}`,
        'Dados do inquilino importados do cadastro Equilino',
      ],
      signedAt: `${draft.startDate}T12:00:00Z`,
    }, {
      onSuccess: () => {
        setActive('all');
        setIsCreating(false);
      },
    });
  }

  return (
    <AnimatePresence mode="wait">
      {selected ? (
        <ContractProfileScreen key="profile" contract={selected} onBack={() => setSelected(null)} />
      ) : (
        <div className="space-y-5 pb-2">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-3"
          >
            <div>
              <h2 className="text-foreground text-xl font-bold">Contratos</h2>
              <p className="text-muted-foreground text-sm mt-0.5">
                {isLoading ? '…' : `${allContracts.length} contratos`}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsCreating(true)}
              className="gradient-accent flex h-10 items-center gap-2 rounded-2xl px-3 text-xs font-bold text-white shadow-lg shadow-violet-500/20"
            >
              <Plus size={15} />
              Novo
            </motion.button>
          </motion.div>

          <AnimatePresence>
            {isCreating && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="premium-surface rounded-3xl p-4"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-foreground text-sm font-bold">Novo contrato residencial</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Use os dados cadastrados no Equilino e defina o prazo de moradia.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="rounded-xl bg-muted/70 p-2 text-muted-foreground transition-colors hover:text-foreground dark:bg-white/5"
                    aria-label="Fechar novo contrato"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Inquilino</span>
                    <select
                      value={draft.tenantId}
                      onChange={e => updateDraft({ tenantId: e.target.value })}
                      className="premium-field w-full rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25"
                    >
                      <option value="">Selecione...</option>
                      {tenants.map(tenant => (
                        <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Imóvel</span>
                    <select
                      value={draft.propertyId}
                      onChange={e => handlePropertyChange(e.target.value)}
                      className="premium-field w-full rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25"
                    >
                      <option value="">Selecione...</option>
                      {properties.map(property => (
                        <option key={property.id} value={property.id}>{property.name}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-muted/50 p-3 dark:border-white/10 dark:bg-white/5">
                    <div className="mb-2 flex items-center gap-2">
                      <UserRound size={14} className="text-violet-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dados do inquilino</span>
                    </div>
                    <p className="text-foreground text-sm font-semibold">{selectedTenant?.name ?? 'Selecione um inquilino'}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      CPF/CNPJ: <span className="font-mono text-foreground">{selectedTenant?.cpf ?? '—'}</span>
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">{selectedTenant?.email}</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/50 p-3 dark:border-white/10 dark:bg-white/5">
                    <div className="mb-2 flex items-center gap-2">
                      <Home size={14} className="text-teal-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Residência</span>
                    </div>
                    <p className="text-foreground text-sm font-semibold">{selectedProperty?.name ?? 'Selecione um imóvel'}</p>
                    <p className="text-muted-foreground mt-1 text-xs">{selectedProperty?.address}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">{selectedProperty?.city}</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <label className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Início</span>
                    <input
                      type="date"
                      value={draft.startDate}
                      onChange={e => updateDraft({ startDate: e.target.value })}
                      className="premium-field w-full rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25"
                    />
                  </label>

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

                  <label className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Aluguel</span>
                    <input
                      type="number"
                      min={0}
                      value={draft.rentAmount}
                      onChange={e => updateDraft({ rentAmount: Number(e.target.value) })}
                      className="premium-field w-full rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25"
                    />
                  </label>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <label className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Reajuste</span>
                    <select
                      value={draft.adjustmentIndex}
                      onChange={e => updateDraft({ adjustmentIndex: e.target.value as Contract['adjustmentIndex'] })}
                      className="premium-field w-full rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25"
                    >
                      <option value="IPCA">IPCA</option>
                      <option value="IGPM">IGP-M</option>
                      <option value="INPC">INPC</option>
                    </select>
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Garantia</span>
                    <select
                      value={draft.guaranteeType}
                      onChange={e => updateDraft({ guaranteeType: e.target.value as Contract['guaranteeType'] })}
                      className="premium-field w-full rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25"
                    >
                      <option value="deposit">Depósito</option>
                      <option value="guarantor">Fiador</option>
                      <option value="insurance">Seguro fiança</option>
                    </select>
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Valor da garantia</span>
                    <input
                      type="number"
                      min={0}
                      value={draft.depositAmount}
                      onChange={e => updateDraft({ depositAmount: Number(e.target.value) })}
                      className="premium-field w-full rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-violet-500 dark:text-violet-300 text-xs font-bold">
                      Contrato por {durationLabel(draft.durationValue, draft.durationUnit)}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Fim previsto: {endDate ? formatDate(endDate) : '—'} · CPF/CNPJ: {selectedTenant?.cpf ?? '—'}
                    </p>
                  </div>
                  <button
                    onClick={createContract}
                    disabled={createContractMutation.isPending || !draft.tenantId || !draft.propertyId}
                    className="gradient-accent rounded-2xl px-4 py-3 text-xs font-bold text-white shadow-lg shadow-violet-500/20 disabled:opacity-50"
                  >
                    {createContractMutation.isPending ? 'Salvando…' : 'Criar contrato'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-2"
          >
            {[
              { label: 'Ativos', count: allContracts.filter(c => c.status === 'active').length, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
              { label: 'Vencendo', count: allContracts.filter(c => c.status === 'expiring').length, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
              { label: 'Vencidos', count: allContracts.filter(c => c.status === 'expired').length, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
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
                {filtered.map((contract, i) => {
                  const tenant = tenants.find(t => t.id === contract.tenantId);
                  const property = properties.find(p => p.id === contract.propertyId);
                  const days = daysUntil(contract.endDate);
                  return (
                    <motion.div
                      key={contract.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }}
                      onClick={() => setSelected(contract)}
                      className="premium-surface rounded-2xl p-4 cursor-pointer hover:border-violet-500/25 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-violet-500/10">
                            <FileText size={14} className="text-violet-400" />
                          </div>
                          <div>
                            <p className="text-foreground text-sm font-semibold">{tenant?.name ?? 'Inquilino'}</p>
                            <p className="text-muted-foreground text-xs">{property?.name ?? 'Imóvel'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge type="contract" status={contract.status} />
                          <ChevronRight size={14} className="text-muted-foreground" />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-xl bg-muted/60 dark:bg-white/3 p-2">
                          <p className="text-violet-400 text-sm font-bold">{formatCurrency(contract.rentAmount)}</p>
                          <p className="text-muted-foreground text-[10px] mt-0.5">Aluguel</p>
                        </div>
                        <div className="rounded-xl bg-muted/60 dark:bg-white/3 p-2">
                          <p className="text-foreground text-sm font-semibold">{formatDate(contract.startDate)}</p>
                          <p className="text-muted-foreground text-[10px] mt-0.5">Início</p>
                        </div>
                        <div className="rounded-xl bg-muted/60 dark:bg-white/3 p-2">
                          <p className={`text-sm font-semibold ${days < 60 ? 'text-yellow-400' : 'text-foreground'}`}>
                            {days > 0 ? `${days}d` : 'Vencido'}
                          </p>
                          <p className="text-muted-foreground text-[10px] mt-0.5">Restam</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <Calendar size={12} className="text-muted-foreground" />
                        <p className="text-muted-foreground text-xs">
                          Vence em {formatDate(contract.endDate)} · Índice: {contract.adjustmentIndex}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <FileText size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Nenhum contrato encontrado</p>
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
