'use client';
import { useState } from 'react';
import { m as motion } from 'framer-motion';
import {
  ArrowLeft, Send, PenLine, FileText, Users, DollarSign,
  Clock, CheckCircle, XCircle, Download, Printer, AlertCircle,
  ChevronDown, ChevronUp, Settings, History, Paperclip, Eye, FileEdit
} from 'lucide-react';
import { useDigitalContract, useSendDigitalContract, useSignDigitalContract,
  useUpdateDigitalContractStatus, useUploadContractDocument, useDeleteContractDocument } from '@/hooks/useApi';
import { ContractStatusBadge } from '@/components/contracts/ContractStatusBadge';
import { ContractTimeline } from '@/components/contracts/ContractTimeline';
import { SignatureCanvas } from '@/components/contracts/SignatureCanvas';
import { DocumentUploader } from '@/components/contracts/DocumentUploader';
import { ContractPDFView } from '@/components/contracts/ContractPDFView';
import { useAppStore } from '@/store/useAppStore';
import type { DigitalContract } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (d: string) => {
  try { return format(new Date(d), "dd/MM/yyyy", { locale: ptBR }); }
  catch { return d; }
};

interface Props {
  contractId: string;
  onBack: () => void;
  onEdit: () => void;
}

export function ContractDetailsScreen({ contractId, onBack, onEdit }: Props) {
  const { data: contract, isLoading } = useDigitalContract(contractId);
  const { user } = useAppStore();
  const send = useSendDigitalContract();
  const sign = useSignDigitalContract();
  const updateStatus = useUpdateDigitalContractStatus();
  const uploadDoc = useUploadContractDocument();
  const deleteDoc = useDeleteContractDocument();

  const [tab, setTab] = useState<'overview' | 'clauses' | 'signatures' | 'documents' | 'history'>('overview');
  const [signatureData, setSignatureData] = useState('');
  const [showSign, setShowSign] = useState(false);
  const [showPDF, setShowPDF] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-muted"><ArrowLeft size={18} /></button>
          <div className="h-6 bg-muted rounded w-48 animate-pulse" />
        </div>
        {[1, 2, 3].map(i => <div key={i} className="premium-surface rounded-2xl p-4 animate-pulse h-20" />)}
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={40} className="mx-auto mb-3 text-red-400" />
        <p className="text-muted-foreground">Contrato não encontrado</p>
        <button onClick={onBack} className="mt-4 text-violet-400 text-sm hover:underline">Voltar</button>
      </div>
    );
  }

  const landlordSigned = contract.signatures.some(s => s.signerRole === 'landlord');
  const tenantSigned = contract.signatures.some(s => s.signerRole === 'tenant');
  const canLandlordSign = user && contract.landlordId === user.id && !landlordSigned &&
    ['sent', 'viewed', 'signed_tenant'].includes(contract.status);
  const canSend = ['draft', 'pending_review'].includes(contract.status);
  const canEdit = ['draft', 'pending_review'].includes(contract.status);

  const handleSign = async () => {
    if (!signatureData) { alert('Desenhe sua assinatura primeiro'); return; }
    await sign.mutateAsync({ id: contract.id, signatureData, signerRole: 'landlord' });
    setShowSign(false);
    setSignatureData('');
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    await updateStatus.mutateAsync({ id: contract.id, status: 'rejected', reason: rejectReason });
    setShowReject(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-muted transition-colors mt-0.5">
          <ArrowLeft size={18} className="text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground leading-tight line-clamp-2">{contract.title}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <ContractStatusBadge status={contract.status} size="md" />
            <span className="text-xs text-muted-foreground">v{contract.version}</span>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex gap-2 flex-wrap">
        {canSend && (
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => send.mutate(contract.id)}
            disabled={send.isPending}
            className="flex items-center gap-2 px-4 py-2.5 gradient-accent text-white rounded-2xl text-sm font-semibold disabled:opacity-60">
            {send.isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
            Enviar para assinatura
          </motion.button>
        )}
        {canEdit && (
          <button onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2.5 bg-muted/60 hover:bg-muted text-foreground rounded-2xl text-sm font-medium transition-colors">
            <Settings size={14} />
            Editar
          </button>
        )}
        {canLandlordSign && !showSign && (
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => setShowSign(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-2xl text-sm font-semibold">
            <PenLine size={14} />
            Assinar
          </motion.button>
        )}
        <button onClick={() => setShowPDF(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-muted/60 hover:bg-muted text-foreground rounded-2xl text-sm font-medium transition-colors">
          <Eye size={14} />
          Visualizar PDF
        </button>
        {['sent', 'viewed', 'awaiting_signature'].includes(contract.status) && (
          <button onClick={() => setShowReject(!showReject)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl text-sm font-medium transition-colors">
            <XCircle size={14} />
            Cancelar
          </button>
        )}
      </div>

      {/* Sign canvas */}
      {showSign && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="premium-surface rounded-2xl p-4 space-y-3 border border-emerald-500/20">
          <h3 className="text-sm font-semibold text-foreground">Sua assinatura (Locador)</h3>
          <SignatureCanvas onSignature={setSignatureData} />
          <div className="flex gap-2">
            <button onClick={() => { setShowSign(false); setSignatureData(''); }}
              className="flex-1 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancelar
            </button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSign}
              disabled={!signatureData || sign.isPending}
              className="flex-1 py-2.5 gradient-accent text-white rounded-xl text-sm font-semibold disabled:opacity-60">
              {sign.isPending ? 'Assinando...' : 'Confirmar assinatura'}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Reject modal */}
      {showReject && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="premium-surface rounded-2xl p-4 space-y-3 border border-red-500/20">
          <h3 className="text-sm font-semibold text-foreground">Motivo do cancelamento</h3>
          <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
            rows={3} placeholder="Explique o motivo..."
            className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none resize-none" />
          <div className="flex gap-2">
            <button onClick={() => setShowReject(false)}
              className="flex-1 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
            <button onClick={handleReject} disabled={!rejectReason.trim() || updateStatus.isPending}
              className="flex-1 py-2.5 bg-red-500/15 text-red-400 border border-red-500/20 rounded-xl text-sm font-semibold disabled:opacity-60">
              {updateStatus.isPending ? 'Cancelando...' : 'Confirmar cancelamento'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Signature progress */}
      <div className="premium-surface rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Assinaturas</h3>
        <div className="space-y-2">
          {[
            { role: 'landlord' as const, name: contract.landlordName ?? 'Locador', signed: landlordSigned, at: contract.signedByLandlordAt },
            { role: 'tenant' as const, name: contract.tenantName ?? 'Inquilino', signed: tenantSigned, at: contract.signedByTenantAt },
          ].map(party => {
            const sig = contract.signatures.find(s => s.signerRole === party.role);
            return (
              <div key={party.role} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  party.signed ? 'bg-emerald-500/15' : 'bg-muted'
                }`}>
                  {party.signed ? <CheckCircle size={16} className="text-emerald-400" /> : <Clock size={16} className="text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{party.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {party.signed ? `Assinado em ${fmtDate(party.at!)}` : 'Aguardando assinatura'}
                  </p>
                </div>
                {sig?.signatureData && sig.signatureData.startsWith('data:') && (
                  <img src={sig.signatureData} alt="sig" className="h-8 w-16 object-contain" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'overview',   label: 'Resumo',     icon: FileText },
          { id: 'clauses',    label: 'Cláusulas',  icon: FileEdit },
          { id: 'documents',  label: 'Documentos', icon: Paperclip },
          { id: 'history',    label: 'Histórico',  icon: History },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all ${
                tab === t.id ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-muted/50 text-muted-foreground'
              }`}>
              <Icon size={12} />{t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="premium-surface rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Dados financeiros</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Aluguel', fmt(contract.rentAmount)],
                ['Vencimento', `Dia ${contract.dueDay}`],
                ['Caução', fmt(contract.depositAmount)],
                ['Reajuste', contract.adjustmentIndex],
                ['Multa', `${contract.lateFeePercent}%`],
                ['Juros', `${contract.lateInterestPercent}%/mês`],
                ['Início', fmtDate(contract.startDate)],
                ['Término', fmtDate(contract.endDate)],
                ['Duração', `${contract.duration} meses`],
                ['Pagamento', contract.paymentMethod],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">{k}</span>
                  <span className="text-sm font-medium text-foreground">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-surface rounded-2xl p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Regras</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ['Animais', contract.petPolicy === 'allowed' ? '✓ Permitido' : contract.petPolicy === 'case_by_case' ? 'A consultar' : '✗ Proibido'],
                ['Fumar', contract.smokingPolicy === 'allowed' ? '✓ Permitido' : '✗ Proibido'],
                ['Sublocação', contract.sublettingAllowed ? '✓ Permitida' : '✗ Proibida'],
                ['Máx. ocupantes', String(contract.maxOccupants ?? '—')],
              ].map(([k, v]) => (
                <div key={k}>
                  <span className="text-xs text-muted-foreground">{k}</span>
                  <p className="text-sm font-medium text-foreground">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'clauses' && (
        <div className="space-y-2">
          {contract.clauses.map((clause, i) => (
            <ClauseAccordion key={clause.id} clause={clause} index={i + 1} />
          ))}
        </div>
      )}

      {tab === 'documents' && (
        <DocumentUploader
          existingDocuments={contract.documents}
          onUpload={async (data) => {
            await uploadDoc.mutateAsync({ id: contract.id, data });
          }}
          onDelete={async (docId) => {
            await deleteDoc.mutateAsync({ id: contract.id, docId });
          }}
        />
      )}

      {tab === 'history' && (
        <div className="premium-surface rounded-2xl p-4">
          <ContractTimeline events={contract.history} />
        </div>
      )}

      {showPDF && <ContractPDFView contract={contract} onClose={() => setShowPDF(false)} />}
    </div>
  );
}

function ClauseAccordion({ clause, index }: { clause: import('@/types').ContractClause; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="premium-surface rounded-2xl overflow-hidden">
      <button className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setOpen(!open)}>
        <span className="w-6 h-6 rounded-lg bg-violet-500/15 text-violet-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
          {index}
        </span>
        <span className="flex-1 text-sm font-medium text-foreground">{clause.title}</span>
        {open ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
          {clause.content}
        </div>
      )}
    </div>
  );
}
