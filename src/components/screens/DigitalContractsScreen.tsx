'use client';
import { useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Plus, Search, Filter, ChevronRight, CheckCircle,
  Clock, AlertCircle, FileEdit, Send, Eye, Users, TrendingUp, X
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import {
  useDigitalContracts, useDeleteDigitalContract, useSendDigitalContract,
  useUpdateDigitalContractStatus
} from '@/hooks/useApi';
import { ContractStatusBadge } from '@/components/contracts/ContractStatusBadge';
import { ContractBuilderScreen } from './ContractBuilderScreen';
import { ContractDetailsScreen } from './ContractDetailsScreen';
import type { DigitalContract, DigitalContractStatus } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';

const FILTER_TABS = [
  { id: 'all',       label: 'Todos' },
  { id: 'draft',     label: 'Rascunho' },
  { id: 'sent',      label: 'Enviados' },
  { id: 'signed_tenant', label: 'Assinados' },
  { id: 'completed', label: 'Concluídos' },
] as const;

type FilterId = typeof FILTER_TABS[number]['id'];

export function DigitalContractsScreen() {
  const { data: contracts = [], isLoading } = useDigitalContracts();
  const deleteContract = useDeleteDigitalContract();
  const sendContract = useSendDigitalContract();
  const updateStatus = useUpdateDigitalContractStatus();

  const [filter, setFilter] = useState<FilterId>('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'builder' | 'details'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const filtered = contracts.filter(c => {
    const matchFilter = filter === 'all' || c.status === filter ||
      (filter === 'sent' && ['sent', 'viewed', 'awaiting_signature'].includes(c.status)) ||
      (filter === 'signed_tenant' && ['signed_tenant', 'signed_landlord'].includes(c.status));
    const matchSearch = !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.tenantName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.propertyName ?? '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  // Stats
  const total = contracts.length;
  const active = contracts.filter(c => ['sent', 'viewed', 'awaiting_signature', 'signed_tenant', 'signed_landlord'].includes(c.status)).length;
  const pendingSig = contracts.filter(c => c.status === 'signed_tenant').length;
  const completed = contracts.filter(c => c.status === 'completed').length;

  if (view === 'builder') {
    return <ContractBuilderScreen editId={editId ?? undefined} onBack={() => { setView('list'); setEditId(null); }} />;
  }
  if (view === 'details' && selectedId) {
    return <ContractDetailsScreen
      contractId={selectedId}
      onBack={() => { setView('list'); setSelectedId(null); }}
      onEdit={() => { setEditId(selectedId); setView('builder'); setSelectedId(null); }}
    />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contratos Digitais</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} contratos</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => { setEditId(null); setView('builder'); }}
          className="flex items-center gap-2 px-4 py-2.5 gradient-accent text-white rounded-2xl text-sm font-semibold glow-accent"
        >
          <Plus size={16} />
          Novo contrato
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total', value: total, icon: FileText, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Ativos', value: active, icon: Send, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Aguard. assinatura', value: pendingSig, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Concluídos', value: completed, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="premium-surface rounded-2xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={stat.color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por título, inquilino ou imóvel..."
          className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50 transition-colors"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === tab.id
                ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                : 'bg-muted/50 text-muted-foreground border border-transparent hover:border-border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contract list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="premium-surface rounded-2xl p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={40} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            {search ? 'Nenhum contrato encontrado' : 'Nenhum contrato ainda'}
          </p>
          {!search && (
            <button
              onClick={() => setView('builder')}
              className="mt-4 text-sm text-violet-400 hover:underline"
            >
              Criar primeiro contrato
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((contract, i) => (
              <ContractListCard
                key={contract.id}
                contract={contract}
                delay={i * 0.04}
                onOpen={() => { setSelectedId(contract.id); setView('details'); }}
                onSend={() => sendContract.mutate(contract.id)}
                onDelete={() => deleteContract.mutate(contract.id)}
                isSending={sendContract.isPending && sendContract.variables === contract.id}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function ContractListCard({
  contract,
  delay,
  onOpen,
  onSend,
  onDelete,
  isSending,
}: {
  contract: DigitalContract;
  delay: number;
  onOpen: () => void;
  onSend: () => void;
  onDelete: () => void;
  isSending: boolean;
}) {
  const sigCount = contract.signatures.length;
  const sigsNeeded = contract.guaranteeType === 'guarantor' ? 3 : 2;
  const daysLeft = contract.expiresAt
    ? Math.ceil((new Date(contract.expiresAt).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay }}
      className="premium-surface rounded-2xl p-4 cursor-pointer hover:border-violet-500/20 border border-transparent transition-all"
      onClick={onOpen}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <FileText size={18} className="text-violet-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-1">{contract.title}</h3>
            <ContractStatusBadge status={contract.status} />
          </div>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users size={11} />
              <span>{contract.tenantName ?? 'Inquilino'}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp size={11} />
              <span>{formatCurrency(contract.rentAmount)}/mês</span>
            </div>
            {daysLeft !== null && daysLeft > 0 && daysLeft <= 7 && (
              <div className="flex items-center gap-1 text-xs text-amber-400">
                <Clock size={11} />
                <span>{daysLeft}d para expirar</span>
              </div>
            )}
          </div>

          {/* Signature progress */}
          {['signed_tenant', 'awaiting_signature', 'sent', 'viewed'].includes(contract.status) && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full transition-all"
                  style={{ width: `${(sigCount / sigsNeeded) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{sigCount}/{sigsNeeded} assinaturas</span>
            </div>
          )}
        </div>

        <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 mt-1" />
      </div>

      {/* Quick actions for draft */}
      {contract.status === 'draft' && (
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onSend(); }}
            disabled={isSending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/20 rounded-xl text-xs font-medium transition-colors disabled:opacity-60"
          >
            {isSending ? (
              <div className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={12} />
            )}
            Enviar para assinar
          </button>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 border border-transparent hover:border-red-500/20 rounded-xl text-xs font-medium transition-colors"
          >
            <X size={12} />
            Excluir
          </button>
        </div>
      )}
    </motion.div>
  );
}
