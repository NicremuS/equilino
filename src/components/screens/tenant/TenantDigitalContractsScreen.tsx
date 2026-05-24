'use client';
import { useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Clock, CheckCircle, XCircle, ChevronRight,
  PenLine, Eye, AlertCircle, FileSignature
} from 'lucide-react';
import { useTenantDigitalContracts, useTenantPendingContractsCount } from '@/hooks/useTenantApi';
import { ContractStatusBadge } from '@/components/contracts/ContractStatusBadge';
import { TenantContractViewerScreen } from './TenantContractViewerScreen';
import type { DigitalContract } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';

const fmtDate = (d: string) => {
  try { return format(new Date(d), 'dd/MM/yyyy', { locale: ptBR }); }
  catch { return d; }
};

const PENDING_STATUSES = ['sent', 'viewed', 'awaiting_signature', 'signed_tenant', 'signed_landlord'];
const DONE_STATUSES = ['completed', 'rejected', 'cancelled', 'expired'];

type FilterTab = 'pending' | 'completed' | 'all';

export function TenantDigitalContractsScreen() {
  const { data: contracts = [], isLoading } = useTenantDigitalContracts();
  const pendingCount = useTenantPendingContractsCount();

  const [filter, setFilter] = useState<FilterTab>('pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (selectedId) {
    return (
      <TenantContractViewerScreen
        contractId={selectedId}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  const filtered = contracts.filter(c => {
    if (filter === 'pending') return PENDING_STATUSES.includes(c.status);
    if (filter === 'completed') return DONE_STATUSES.includes(c.status);
    return true;
  });

  return (
    <div className="space-y-5 pb-4">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contratos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {contracts.length} {contracts.length === 1 ? 'contrato' : 'contratos'}
          </p>
        </div>
        {pendingCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl"
          >
            <Clock size={14} className="text-amber-400" />
            <span className="text-xs font-semibold text-amber-400">
              {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {([
          { id: 'pending',   label: 'Pendentes',  count: contracts.filter(c => PENDING_STATUSES.includes(c.status)).length },
          { id: 'completed', label: 'Concluídos', count: contracts.filter(c => DONE_STATUSES.includes(c.status)).length },
          { id: 'all',       label: 'Todos',      count: contracts.length },
        ] as { id: FilterTab; label: string; count: number }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all ${
              filter === tab.id
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-muted/50 text-muted-foreground border border-transparent'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                filter === tab.id ? 'bg-emerald-500/30' : 'bg-muted'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="premium-surface rounded-2xl p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <FileSignature size={44} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground font-medium">
            {filter === 'pending' ? 'Nenhum contrato pendente' :
             filter === 'completed' ? 'Nenhum contrato concluído' :
             'Nenhum contrato encontrado'}
          </p>
          {filter === 'pending' && (
            <p className="text-xs text-muted-foreground/60 mt-1">
              Quando o locador enviar um contrato para assinatura, ele aparecerá aqui
            </p>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((contract, i) => (
              <TenantContractCard
                key={contract.id}
                contract={contract}
                delay={i * 0.05}
                onClick={() => setSelectedId(contract.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function TenantContractCard({
  contract,
  delay,
  onClick,
}: {
  contract: DigitalContract;
  delay: number;
  onClick: () => void;
}) {
  const needsSignature = ['sent', 'viewed', 'awaiting_signature'].includes(contract.status);
  const tenantSigned = contract.signatures.some(s => s.signerRole === 'tenant');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay }}
      onClick={onClick}
      className={`premium-surface rounded-2xl p-4 cursor-pointer transition-all border ${
        needsSignature
          ? 'border-amber-500/20 hover:border-amber-500/40'
          : 'border-transparent hover:border-emerald-500/20'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
          needsSignature ? 'bg-amber-500/15' : 'bg-emerald-500/15'
        }`}>
          {needsSignature
            ? <PenLine size={18} className="text-amber-400" />
            : <FileText size={18} className="text-emerald-400" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-1">
              {contract.title}
            </h3>
            <ContractStatusBadge status={contract.status} />
          </div>

          <div className="mt-1.5 space-y-0.5">
            {contract.propertyName && (
              <p className="text-xs text-muted-foreground truncate">{contract.propertyName}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formatCurrency(contract.rentAmount)}/mês · Vence dia {contract.dueDay}
            </p>
            {contract.sentAt && (
              <p className="text-xs text-muted-foreground/70">
                Enviado em {fmtDate(contract.sentAt)}
              </p>
            )}
          </div>

          {/* Action banner */}
          {needsSignature && !tenantSigned && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 flex items-center gap-1.5 text-xs text-amber-400 font-semibold"
            >
              <AlertCircle size={12} />
              Aguardando sua assinatura
            </motion.div>
          )}

          {tenantSigned && contract.status !== 'completed' && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <CheckCircle size={12} />
              Você já assinou · aguardando locador
            </div>
          )}

          {contract.status === 'completed' && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <CheckCircle size={12} />
              Contrato assinado por ambas as partes
            </div>
          )}
        </div>

        <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 mt-1" />
      </div>
    </motion.div>
  );
}
