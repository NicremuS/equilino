'use client';
import { useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, PenLine, FileText, Eye, CheckCircle, Clock,
  AlertCircle, ChevronDown, ChevronUp, Paperclip, History,
  Download
} from 'lucide-react';
import { useTenantDigitalContract, useSignTenantDigitalContract, useUploadTenantContractDocument } from '@/hooks/useTenantApi';
import { ContractStatusBadge } from '@/components/contracts/ContractStatusBadge';
import { ContractTimeline } from '@/components/contracts/ContractTimeline';
import { SignatureCanvas } from '@/components/contracts/SignatureCanvas';
import { DocumentUploader } from '@/components/contracts/DocumentUploader';
import { ContractPDFView } from '@/components/contracts/ContractPDFView';
import { useAppStore } from '@/store/useAppStore';
import type { ContractClause } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (d: string) => {
  try { return format(new Date(d), 'dd/MM/yyyy', { locale: ptBR }); }
  catch { return d; }
};

interface Props {
  contractId: string;
  onBack: () => void;
}

export function TenantContractViewerScreen({ contractId, onBack }: Props) {
  const { data: contract, isLoading } = useTenantDigitalContract(contractId);
  const { user } = useAppStore();
  const sign = useSignTenantDigitalContract();
  const uploadDoc = useUploadTenantContractDocument();

  const [tab, setTab] = useState<'overview' | 'clauses' | 'documents' | 'history'>('overview');
  const [signatureData, setSignatureData] = useState('');
  const [showSign, setShowSign] = useState(false);
  const [showPDF, setShowPDF] = useState(false);
  const [signSuccess, setSignSuccess] = useState(false);
  const [signError, setSignError] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-muted">
            <ArrowLeft size={18} />
          </button>
          <div className="h-6 bg-muted rounded w-48 animate-pulse" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="premium-surface rounded-2xl p-4 animate-pulse h-20" />
        ))}
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={40} className="mx-auto mb-3 text-red-400" />
        <p className="text-muted-foreground">Contrato não encontrado</p>
        <button onClick={onBack} className="mt-4 text-emerald-400 text-sm hover:underline">Voltar</button>
      </div>
    );
  }

  const tenantSigned = contract.signatures.some(s => s.signerRole === 'tenant');
  const landlordSigned = contract.signatures.some(s => s.signerRole === 'landlord');
  const canSign = !tenantSigned && ['sent', 'viewed', 'awaiting_signature'].includes(contract.status);

  const handleSign = async () => {
    if (!signatureData) { setSignError('Desenhe sua assinatura antes de confirmar.'); return; }
    setSignError('');
    await sign.mutateAsync({ id: contract.id, signatureData });
    setShowSign(false);
    setSignatureData('');
    setSignSuccess(true);
    setTimeout(() => setSignSuccess(false), 5000);
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-muted transition-colors mt-0.5"
        >
          <ArrowLeft size={18} className="text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground leading-tight line-clamp-2">
            {contract.title}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <ContractStatusBadge status={contract.status} size="md" />
            <span className="text-xs text-muted-foreground">v{contract.version}</span>
          </div>
        </div>
      </div>

      {/* Sign success banner */}
      <AnimatePresence>
        {signSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl"
          >
            <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-400">Contrato assinado com sucesso!</p>
              <p className="text-xs text-emerald-400/70 mt-0.5">O locador foi notificado sobre sua assinatura.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action bar */}
      <div className="flex gap-2 flex-wrap">
        {canSign && !showSign && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowSign(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-2xl text-sm font-semibold"
          >
            <PenLine size={14} />
            Assinar contrato
          </motion.button>
        )}
        <button
          onClick={() => setShowPDF(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-muted/60 hover:bg-muted text-foreground rounded-2xl text-sm font-medium transition-colors"
        >
          <Eye size={14} />
          Visualizar PDF
        </button>
      </div>

      {/* Pending signature alert */}
      {canSign && !showSign && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 bg-amber-500/8 border border-amber-500/20 rounded-2xl"
        >
          <AlertCircle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-400">Assinatura necessária</p>
            <p className="text-xs text-amber-400/70 mt-0.5">
              Este contrato aguarda sua assinatura digital. Leia com atenção antes de assinar.
            </p>
          </div>
        </motion.div>
      )}

      {/* Signature canvas */}
      {showSign && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-surface rounded-2xl p-4 space-y-3 border border-emerald-500/20"
        >
          <h3 className="text-sm font-semibold text-foreground">Sua assinatura digital (Locatário)</h3>
          <p className="text-xs text-muted-foreground">
            Ao assinar, você concorda com todos os termos e cláusulas do contrato acima.
          </p>
          <SignatureCanvas onSignature={(data) => { setSignatureData(data); if (data) setSignError(''); }} />
          {signError && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle size={12} />
              {signError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => { setShowSign(false); setSignatureData(''); }}
              className="flex-1 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSign}
              disabled={!signatureData || sign.isPending}
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors"
            >
              {sign.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Assinando...
                </span>
              ) : 'Confirmar assinatura'}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Signature status */}
      <div className="premium-surface rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Status das assinaturas</h3>
        <div className="space-y-2">
          {[
            { role: 'landlord' as const, name: contract.landlordName ?? 'Locador', signed: landlordSigned, at: contract.signedByLandlordAt },
            { role: 'tenant' as const, name: contract.tenantName ?? 'Locatário', signed: tenantSigned, at: contract.signedByTenantAt },
          ].map(party => {
            const sig = contract.signatures.find(s => s.signerRole === party.role);
            const isMe = party.role === 'tenant';
            return (
              <div key={party.role} className={`flex items-center gap-3 p-3 rounded-xl ${
                isMe ? 'bg-emerald-500/8 border border-emerald-500/10' : 'bg-muted/30'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  party.signed ? 'bg-emerald-500/15' : 'bg-muted'
                }`}>
                  {party.signed
                    ? <CheckCircle size={16} className="text-emerald-400" />
                    : <Clock size={16} className="text-muted-foreground" />
                  }
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {party.name} {isMe && <span className="text-xs text-emerald-400/70">(você)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {party.signed ? `Assinado em ${fmtDate(party.at!)}` : 'Aguardando assinatura'}
                  </p>
                </div>
                {sig?.signatureData && sig.signatureData.startsWith('data:') && (
                  <img src={sig.signatureData} alt="assinatura" className="h-8 w-16 object-contain" />
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
          { id: 'clauses',    label: 'Cláusulas',  icon: FileText },
          { id: 'documents',  label: 'Documentos', icon: Paperclip },
          { id: 'history',    label: 'Histórico',  icon: History },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all ${
                tab === t.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-muted/50 text-muted-foreground'
              }`}
            >
              <Icon size={12} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="premium-surface rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Partes</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-muted-foreground">Locador</span>
                <span className="text-sm font-medium text-foreground">{contract.landlordName ?? '—'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-border/50">
                <span className="text-xs text-muted-foreground">Imóvel</span>
                <span className="text-sm font-medium text-foreground truncate max-w-48">{contract.propertyName ?? '—'}</span>
              </div>
              {contract.propertyAddress && (
                <div className="flex justify-between items-start py-1 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">Endereço</span>
                  <span className="text-sm font-medium text-foreground text-right max-w-48 leading-snug">{contract.propertyAddress}</span>
                </div>
              )}
            </div>
          </div>

          <div className="premium-surface rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Dados financeiros</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Aluguel', fmt(contract.rentAmount)],
                ['Vencimento', `Dia ${contract.dueDay}`],
                ['Caução', fmt(contract.depositAmount)],
                ['Reajuste', contract.adjustmentIndex],
                ['Multa atraso', `${contract.lateFeePercent}%`],
                ['Juros mora', `${contract.lateInterestPercent}%/mês`],
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
            <h3 className="text-sm font-semibold text-foreground">Regras do imóvel</h3>
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
          {contract.clauses.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhuma cláusula adicionada</p>
          ) : (
            contract.clauses.map((clause, i) => (
              <ClauseAccordion key={clause.id} clause={clause} index={i + 1} />
            ))
          )}
        </div>
      )}

      {tab === 'documents' && (
        <DocumentUploader
          existingDocuments={contract.documents}
          onUpload={async (data) => {
            await uploadDoc.mutateAsync({ id: contract.id, data });
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

function ClauseAccordion({ clause, index }: { clause: ContractClause; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="premium-surface rounded-2xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
          {index}
        </span>
        <span className="flex-1 text-sm font-medium text-foreground">{clause.title}</span>
        {open
          ? <ChevronUp size={14} className="text-muted-foreground" />
          : <ChevronDown size={14} className="text-muted-foreground" />
        }
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
          {clause.content}
        </div>
      )}
    </div>
  );
}
