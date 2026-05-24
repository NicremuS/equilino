'use client';
import { useState, useEffect } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Check, FileText, Building2, DollarSign,
  FileEdit, Settings, Eye, Home, Users, Sparkles, ChevronRight
} from 'lucide-react';
import { useProperties, useTenants, useContractTemplates, useCreateDigitalContract, useUpdateDigitalContract, useDigitalContract } from '@/hooks/useApi';
import { ClauseEditor } from '@/components/contracts/ClauseEditor';
import type { ContractClause, ContractTemplate } from '@/types';
import type { CreateDigitalContractInput } from '@/lib/schemas';

const DEFAULT_UTILITIES = {
  water: 'tenant', electricity: 'tenant', gas: 'tenant',
  internet: 'tenant', condominiumFee: 'tenant', iptu: 'landlord',
} as const;

const DEFAULT_CLAUSES: ContractClause[] = [
  {
    id: 'c1', title: 'Objeto do Contrato', required: true, order: 0, category: 'general',
    content: 'O presente instrumento tem por objeto a locação do imóvel situado no endereço descrito na cláusula de identificação das partes, doravante denominado simplesmente IMÓVEL.',
  },
  {
    id: 'c2', title: 'Prazo da Locação', required: true, order: 1, category: 'general',
    content: 'A locação é firmada pelo prazo determinado, conforme as datas estabelecidas neste contrato, ficando vedada a sublocação, cessão ou empréstimo do imóvel a terceiros, salvo prévia autorização escrita do LOCADOR.',
  },
  {
    id: 'c3', title: 'Valor e Forma de Pagamento', required: true, order: 2, category: 'payment',
    content: 'O aluguel mensal deverá ser pago até o dia do vencimento estipulado neste contrato, por meio do método de pagamento acordado entre as partes, conforme indicado neste instrumento.',
  },
  {
    id: 'c4', title: 'Reajuste Anual', required: true, order: 3, category: 'payment',
    content: 'O valor do aluguel será reajustado anualmente, na data do aniversário do contrato, pelo índice contratado, ou pelo índice legalmente permitido se inferior.',
  },
  {
    id: 'c5', title: 'Encargos e Multas', required: true, order: 4, category: 'payment',
    content: 'O não pagamento do aluguel no prazo estipulado acarretará a incidência de multa e juros de mora sobre o valor em atraso, conforme percentuais definidos neste contrato.',
  },
  {
    id: 'c6', title: 'Conservação do Imóvel', required: true, order: 5, category: 'maintenance',
    content: 'O LOCATÁRIO obriga-se a conservar o imóvel em perfeitas condições de higiene e habitabilidade, respondendo pelos danos causados ao imóvel ou suas instalações por negligência, dolo ou mau uso.',
  },
  {
    id: 'c7', title: 'Foro', required: true, order: 6, category: 'termination',
    content: 'As partes elegem o foro da comarca onde está situado o imóvel como competente para dirimir quaisquer dúvidas ou litígios oriundos deste contrato, com renúncia a qualquer outro.',
  },
];

type Step = 'template' | 'parties' | 'financial' | 'clauses' | 'rules' | 'preview';
const STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'template',  label: 'Template',    icon: FileText },
  { id: 'parties',   label: 'Partes',      icon: Users },
  { id: 'financial', label: 'Financeiro',  icon: DollarSign },
  { id: 'clauses',   label: 'Cláusulas',   icon: FileEdit },
  { id: 'rules',     label: 'Regras',      icon: Settings },
  { id: 'preview',   label: 'Revisão',     icon: Eye },
];

interface BuilderState {
  title: string;
  propertyId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  moveInDate: string;
  duration: number;
  rentAmount: number;
  dueDay: number;
  depositAmount: number;
  depositInstallments: number;
  lateFeePercent: number;
  lateInterestPercent: number;
  adjustmentIndex: 'IGPM' | 'IPCA' | 'INPC';
  paymentMethod: string;
  pixKey: string;
  bankInfo: string;
  clauses: ContractClause[];
  petPolicy: 'allowed' | 'not_allowed' | 'case_by_case';
  smokingPolicy: 'allowed' | 'not_allowed';
  sublettingAllowed: boolean;
  maxOccupants: number;
  utilities: typeof DEFAULT_UTILITIES;
  guaranteeType: 'deposit' | 'guarantor' | 'insurance' | 'none';
  guarantorName: string;
  guarantorCpf: string;
  guarantorEmail: string;
  guarantorPhone: string;
  internalNotes: string;
  templateId: string;
}

const INITIAL_STATE: BuilderState = {
  title: '',
  propertyId: '',
  tenantId: '',
  startDate: '',
  endDate: '',
  moveInDate: '',
  duration: 12,
  rentAmount: 0,
  dueDay: 10,
  depositAmount: 0,
  depositInstallments: 1,
  lateFeePercent: 2,
  lateInterestPercent: 1,
  adjustmentIndex: 'IGPM',
  paymentMethod: 'pix',
  pixKey: '',
  bankInfo: '',
  clauses: DEFAULT_CLAUSES,
  petPolicy: 'not_allowed',
  smokingPolicy: 'not_allowed',
  sublettingAllowed: false,
  maxOccupants: 2,
  utilities: DEFAULT_UTILITIES,
  guaranteeType: 'deposit',
  guarantorName: '',
  guarantorCpf: '',
  guarantorEmail: '',
  guarantorPhone: '',
  internalNotes: '',
  templateId: '',
};

interface Props {
  editId?: string;
  onBack: () => void;
}

export function ContractBuilderScreen({ editId, onBack }: Props) {
  const [step, setStep] = useState<Step>(editId ? 'parties' : 'template');
  const [state, setState] = useState<BuilderState>(INITIAL_STATE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: properties = [] } = useProperties();
  const { data: tenants = [] } = useTenants();
  const { data: templates = [] } = useContractTemplates();
  const { data: existingContract } = useDigitalContract(editId ?? '');
  const createContract = useCreateDigitalContract();
  const updateContract = useUpdateDigitalContract();

  useEffect(() => {
    if (existingContract) {
      setState({
        title: existingContract.title,
        propertyId: existingContract.propertyId,
        tenantId: existingContract.tenantId,
        startDate: existingContract.startDate,
        endDate: existingContract.endDate,
        moveInDate: existingContract.moveInDate,
        duration: existingContract.duration,
        rentAmount: existingContract.rentAmount,
        dueDay: existingContract.dueDay,
        depositAmount: existingContract.depositAmount,
        depositInstallments: existingContract.depositInstallments ?? 1,
        lateFeePercent: existingContract.lateFeePercent,
        lateInterestPercent: existingContract.lateInterestPercent,
        adjustmentIndex: existingContract.adjustmentIndex,
        paymentMethod: existingContract.paymentMethod,
        pixKey: existingContract.pixKey ?? '',
        bankInfo: existingContract.bankInfo ?? '',
        clauses: existingContract.clauses,
        petPolicy: existingContract.petPolicy,
        smokingPolicy: existingContract.smokingPolicy,
        sublettingAllowed: existingContract.sublettingAllowed,
        maxOccupants: existingContract.maxOccupants ?? 2,
        utilities: existingContract.utilities as typeof DEFAULT_UTILITIES,
        guaranteeType: existingContract.guaranteeType,
        guarantorName: existingContract.guarantorName ?? '',
        guarantorCpf: existingContract.guarantorCpf ?? '',
        guarantorEmail: existingContract.guarantorEmail ?? '',
        guarantorPhone: existingContract.guarantorPhone ?? '',
        internalNotes: existingContract.internalNotes ?? '',
        templateId: existingContract.templateId ?? '',
      });
    }
  }, [existingContract]);

  const update = (patch: Partial<BuilderState>) => setState(prev => ({ ...prev, ...patch }));

  const applyTemplate = (template: ContractTemplate) => {
    setState(prev => ({
      ...prev,
      clauses: template.clauses.length > 0 ? template.clauses : DEFAULT_CLAUSES,
      templateId: template.id,
    }));
    setStep('parties');
  };

  const calcEndDate = (start: string, months: number) => {
    if (!start) return '';
    const d = new Date(start);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  };

  const handleSave = async () => {
    if (!state.propertyId || !state.tenantId || !state.startDate || !state.rentAmount) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: CreateDigitalContractInput = {
        title: state.title || `Contrato de Locação — ${properties.find(p => p.id === state.propertyId)?.name ?? 'Imóvel'}`,
        propertyId: state.propertyId,
        tenantId: state.tenantId,
        startDate: state.startDate,
        endDate: state.endDate || calcEndDate(state.startDate, state.duration),
        moveInDate: state.moveInDate || state.startDate,
        duration: state.duration,
        rentAmount: state.rentAmount,
        dueDay: state.dueDay,
        depositAmount: state.depositAmount,
        depositInstallments: state.depositInstallments,
        lateFeePercent: state.lateFeePercent,
        lateInterestPercent: state.lateInterestPercent,
        adjustmentIndex: state.adjustmentIndex,
        paymentMethod: state.paymentMethod,
        pixKey: state.pixKey,
        bankInfo: state.bankInfo,
        clauses: state.clauses,
        petPolicy: state.petPolicy,
        smokingPolicy: state.smokingPolicy,
        sublettingAllowed: state.sublettingAllowed,
        maxOccupants: state.maxOccupants,
        utilities: state.utilities,
        guaranteeType: state.guaranteeType,
        guarantorName: state.guarantorName,
        guarantorCpf: state.guarantorCpf,
        guarantorEmail: state.guarantorEmail,
        guarantorPhone: state.guarantorPhone,
        templateId: state.templateId,
        internalNotes: state.internalNotes,
      };

      if (editId) {
        await updateContract.mutateAsync({ id: editId, data: payload });
      } else {
        await createContract.mutateAsync(payload);
      }
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const stepIndex = STEPS.findIndex(s => s.id === step);

  const goNext = () => {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next.id);
  };
  const goPrev = () => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev.id);
  };

  const selectedProperty = properties.find(p => p.id === state.propertyId);
  const selectedTenant = tenants.find(t => t.id === state.tenantId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft size={18} className="text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{editId ? 'Editar Contrato' : 'Novo Contrato'}</h1>
          <p className="text-xs text-muted-foreground">
            {STEPS[stepIndex]?.label} — Passo {stepIndex + 1} de {STEPS.length}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < stepIndex;
          const active = s.id === step;
          return (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium flex-shrink-0 transition-all ${
                active ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                : done ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-muted/40 text-muted-foreground'
              }`}
            >
              {done ? <Check size={12} /> : <Icon size={12} />}
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
        >
          {step === 'template' && (
            <TemplateStep templates={templates} onSelect={applyTemplate} onSkip={() => setStep('parties')} />
          )}
          {step === 'parties' && (
            <PartiesStep
              state={state} update={update}
              properties={properties} tenants={tenants}
              calcEndDate={calcEndDate}
            />
          )}
          {step === 'financial' && (
            <FinancialStep state={state} update={update} />
          )}
          {step === 'clauses' && (
            <ClauseEditor clauses={state.clauses} onChange={clauses => update({ clauses })} />
          )}
          {step === 'rules' && (
            <RulesStep state={state} update={update} />
          )}
          {step === 'preview' && (
            <PreviewStep
              state={state}
              property={selectedProperty}
              tenant={selectedTenant}
              error={error}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nav buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <button
          onClick={stepIndex === 0 ? onBack : goPrev}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={15} />
          {stepIndex === 0 ? 'Cancelar' : 'Anterior'}
        </button>

        {step === 'preview' ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 gradient-accent text-white rounded-2xl text-sm font-semibold glow-accent disabled:opacity-60"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check size={15} />
            )}
            {editId ? 'Salvar alterações' : 'Criar contrato'}
          </motion.button>
        ) : (
          <button
            onClick={goNext}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-500/15 text-violet-400 border border-violet-500/20 rounded-2xl text-sm font-medium hover:bg-violet-500/25 transition-colors"
          >
            Próximo
            <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Sub-step components ────────────────────────────────────────────────────

function TemplateStep({ templates, onSelect, onSkip }: {
  templates: ContractTemplate[];
  onSelect: (t: ContractTemplate) => void;
  onSkip: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">Escolha um template</h2>
        <p className="text-sm text-muted-foreground mt-1">Comece com um modelo pré-definido ou em branco</p>
      </div>
      <div className="space-y-3">
        {templates.map(t => (
          <motion.button
            key={t.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(t)}
            className="w-full flex items-center gap-4 p-4 premium-surface rounded-2xl hover:border-violet-500/30 border border-transparent transition-all text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
              <FileText size={22} className="text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{t.name}</p>
                {t.isBuiltIn && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">
                    Padrão
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">{t.clauses.length} cláusulas · Usado {t.usageCount}x</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
          </motion.button>
        ))}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onSkip}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-border hover:border-violet-500/30 transition-all text-left"
        >
          <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center flex-shrink-0">
            <FileEdit size={22} className="text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Contrato em branco</p>
            <p className="text-xs text-muted-foreground mt-0.5">Crie do zero com cláusulas básicas incluídas</p>
          </div>
        </motion.button>
      </div>
    </div>
  );
}

function PartiesStep({ state, update, properties, tenants, calcEndDate }: {
  state: BuilderState;
  update: (p: Partial<BuilderState>) => void;
  properties: import('@/types').Property[];
  tenants: import('@/types').Tenant[];
  calcEndDate: (s: string, m: number) => string;
}) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-foreground">Partes e datas</h2>

      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Título do contrato</label>
        <input type="text" value={state.title}
          onChange={e => update({ title: e.target.value })}
          placeholder="Ex: Contrato de Locação — Apto 301"
          className="w-full px-3 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-violet-500/50 transition-colors" />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Imóvel <span className="text-red-400">*</span></label>
        <select value={state.propertyId}
          onChange={e => {
            const prop = properties.find(p => p.id === e.target.value);
            update({ propertyId: e.target.value, rentAmount: prop?.rentAmount ?? state.rentAmount });
          }}
          className="w-full px-3 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none">
          <option value="">Selecione o imóvel</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name} — {p.city}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Inquilino <span className="text-red-400">*</span></label>
        <select value={state.tenantId}
          onChange={e => update({ tenantId: e.target.value })}
          className="w-full px-3 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none">
          <option value="">Selecione o inquilino</option>
          {tenants.map(t => <option key={t.id} value={t.id}>{t.name} — {t.email}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Início <span className="text-red-400">*</span></label>
          <input type="date" value={state.startDate}
            onChange={e => update({ startDate: e.target.value, endDate: calcEndDate(e.target.value, state.duration), moveInDate: state.moveInDate || e.target.value })}
            className="w-full px-3 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Duração (meses)</label>
          <input type="number" value={state.duration} min={1}
            onChange={e => update({ duration: Number(e.target.value), endDate: calcEndDate(state.startDate, Number(e.target.value)) })}
            className="w-full px-3 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Término</label>
          <input type="date" value={state.endDate} readOnly
            className="w-full px-3 py-3 bg-muted/30 border border-border/50 rounded-2xl text-sm text-muted-foreground" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Mudança</label>
          <input type="date" value={state.moveInDate}
            onChange={e => update({ moveInDate: e.target.value })}
            className="w-full px-3 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none" />
        </div>
      </div>
    </div>
  );
}

function FinancialStep({ state, update }: { state: BuilderState; update: (p: Partial<BuilderState>) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Condições financeiras</h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Aluguel mensal (R$) <span className="text-red-400">*</span></label>
          <input type="number" value={state.rentAmount || ''}
            onChange={e => update({ rentAmount: Number(e.target.value) })}
            placeholder="0,00" min={0}
            className="w-full px-3 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-violet-500/50" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Dia do vencimento</label>
          <input type="number" value={state.dueDay} min={1} max={28}
            onChange={e => update({ dueDay: Number(e.target.value) })}
            className="w-full px-3 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Caução (R$)</label>
          <input type="number" value={state.depositAmount || ''}
            onChange={e => update({ depositAmount: Number(e.target.value) })}
            placeholder="0,00" min={0}
            className="w-full px-3 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Parcelas caução</label>
          <input type="number" value={state.depositInstallments} min={1} max={3}
            onChange={e => update({ depositInstallments: Number(e.target.value) })}
            className="w-full px-3 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Multa atraso (%)</label>
          <input type="number" value={state.lateFeePercent} min={0} max={10} step={0.5}
            onChange={e => update({ lateFeePercent: Number(e.target.value) })}
            className="w-full px-3 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Juros mora (% a.m.)</label>
          <input type="number" value={state.lateInterestPercent} min={0} max={5} step={0.1}
            onChange={e => update({ lateInterestPercent: Number(e.target.value) })}
            className="w-full px-3 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none" />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Índice de reajuste</label>
        <div className="flex gap-2">
          {(['IGPM', 'IPCA', 'INPC'] as const).map(idx => (
            <button key={idx} type="button" onClick={() => update({ adjustmentIndex: idx })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                state.adjustmentIndex === idx
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'bg-muted/50 text-muted-foreground border border-transparent hover:border-border'
              }`}>
              {idx}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Forma de pagamento</label>
        <div className="flex gap-2 flex-wrap">
          {[['pix', 'Pix'], ['transfer', 'Transferência'], ['boleto', 'Boleto']].map(([val, label]) => (
            <button key={val} type="button" onClick={() => update({ paymentMethod: val })}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                state.paymentMethod === val
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'bg-muted/50 text-muted-foreground border border-transparent hover:border-border'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {state.paymentMethod === 'pix' && (
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Chave Pix</label>
          <input type="text" value={state.pixKey}
            onChange={e => update({ pixKey: e.target.value })}
            placeholder="Email, CPF, telefone ou chave aleatória"
            className="w-full px-3 py-3 bg-muted/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-violet-500/50" />
        </div>
      )}
    </div>
  );
}

function RulesStep({ state, update }: { state: BuilderState; update: (p: Partial<BuilderState>) => void }) {
  const utilityLabels: Record<string, string> = {
    water: 'Água', electricity: 'Luz', gas: 'Gás',
    internet: 'Internet', condominiumFee: 'Condomínio', iptu: 'IPTU',
  };

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-foreground">Regras e responsabilidades</h2>

      {/* Pet / smoking */}
      <div className="premium-surface rounded-2xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Regras do imóvel</h3>
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Animais de estimação</label>
          <div className="flex gap-2">
            {(['allowed', 'not_allowed', 'case_by_case'] as const).map((val) => {
              const label = val === 'allowed' ? 'Permitido' : val === 'not_allowed' ? 'Proibido' : 'A consultar';
              return (
                <button key={val} type="button" onClick={() => update({ petPolicy: val })}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                    state.petPolicy === val
                      ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                      : 'bg-muted/50 text-muted-foreground border border-transparent hover:border-border'
                  }`}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-foreground">Fumar no imóvel</label>
          <button type="button" onClick={() => update({ smokingPolicy: state.smokingPolicy === 'allowed' ? 'not_allowed' : 'allowed' })}
            className={`w-11 h-6 rounded-full transition-colors ${state.smokingPolicy === 'allowed' ? 'bg-violet-500' : 'bg-muted'}`}>
            <div className={`w-4 h-4 rounded-full bg-white mx-1 transition-transform ${state.smokingPolicy === 'allowed' ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-foreground">Sublocação permitida</label>
          <button type="button" onClick={() => update({ sublettingAllowed: !state.sublettingAllowed })}
            className={`w-11 h-6 rounded-full transition-colors ${state.sublettingAllowed ? 'bg-violet-500' : 'bg-muted'}`}>
            <div className={`w-4 h-4 rounded-full bg-white mx-1 transition-transform ${state.sublettingAllowed ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Máximo de ocupantes</label>
          <input type="number" value={state.maxOccupants} min={1} max={20}
            onChange={e => update({ maxOccupants: Number(e.target.value) })}
            className="w-24 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none" />
        </div>
      </div>

      {/* Utilities */}
      <div className="premium-surface rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Responsabilidades</h3>
        {Object.entries(utilityLabels).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between">
            <label className="text-sm text-foreground">{label}</label>
            <div className="flex gap-2">
              {[['tenant', 'Inquilino'], ['landlord', 'Locador']].map(([val, lbl]) => (
                <button key={val} type="button"
                  onClick={() => update({ utilities: { ...state.utilities, [key]: val } })}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    state.utilities[key as keyof typeof state.utilities] === val
                      ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                      : 'bg-muted/50 text-muted-foreground border border-transparent'
                  }`}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Guarantee */}
      <div className="premium-surface rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Garantia</h3>
        <div className="flex gap-2 flex-wrap">
          {[['deposit', 'Caução'], ['guarantor', 'Fiador'], ['insurance', 'Seguro'], ['none', 'Nenhuma']].map(([val, lbl]) => (
            <button key={val} type="button" onClick={() => update({ guaranteeType: val as BuilderState['guaranteeType'] })}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                state.guaranteeType === val
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'bg-muted/50 text-muted-foreground border border-transparent hover:border-border'
              }`}>
              {lbl}
            </button>
          ))}
        </div>
        {state.guaranteeType === 'guarantor' && (
          <div className="space-y-3 pt-2 border-t border-border/50">
            <h4 className="text-xs font-medium text-muted-foreground">Dados do fiador</h4>
            {[
              ['text', 'guarantorName', 'Nome completo'],
              ['text', 'guarantorCpf', 'CPF'],
              ['email', 'guarantorEmail', 'Email'],
              ['tel', 'guarantorPhone', 'Telefone'],
            ].map(([type, field, placeholder]) => (
              <input key={field} type={type} value={state[field as keyof BuilderState] as string}
                onChange={e => update({ [field]: e.target.value })}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-violet-500/50" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewStep({ state, property, tenant, error }: {
  state: BuilderState;
  property?: import('@/types').Property;
  tenant?: import('@/types').Tenant;
  error: string;
}) {
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Revisão final</h2>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {/* Summary cards */}
      <div className="premium-surface rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">Partes</h3>
        <div className="flex gap-2">
          <div className="flex-1 p-3 bg-muted/40 rounded-xl">
            <p className="text-xs text-muted-foreground">Imóvel</p>
            <p className="text-sm font-medium text-foreground mt-1">{property?.name ?? 'Não selecionado'}</p>
          </div>
          <div className="flex-1 p-3 bg-muted/40 rounded-xl">
            <p className="text-xs text-muted-foreground">Inquilino</p>
            <p className="text-sm font-medium text-foreground mt-1">{tenant?.name ?? 'Não selecionado'}</p>
          </div>
        </div>
      </div>

      <div className="premium-surface rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2 mb-3">Financeiro</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            ['Aluguel', fmt(state.rentAmount)],
            ['Vencimento', `Dia ${state.dueDay}`],
            ['Caução', fmt(state.depositAmount)],
            ['Duração', `${state.duration} meses`],
            ['Multa', `${state.lateFeePercent}%`],
            ['Índice', state.adjustmentIndex],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-medium text-foreground">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="premium-surface rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2 mb-2">Cláusulas</h3>
        <p className="text-sm text-muted-foreground">{state.clauses.length} cláusulas definidas</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {state.clauses.slice(0, 5).map(c => (
            <span key={c.id} className="text-xs px-2 py-0.5 bg-muted/50 rounded-full text-muted-foreground">{c.title}</span>
          ))}
          {state.clauses.length > 5 && (
            <span className="text-xs px-2 py-0.5 bg-muted/50 rounded-full text-muted-foreground">+{state.clauses.length - 5} mais</span>
          )}
        </div>
      </div>
    </div>
  );
}
