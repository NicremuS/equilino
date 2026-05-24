'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, User, Home, Warehouse, Store, ShieldCheck,
  MapPin, CheckCircle2, ArrowRight, ArrowLeft, Target,
  CreditCard, Smartphone, FileText,
} from 'lucide-react';
import { getStoredSession, setStoredSession } from '@/lib/session';
import { cn } from '@/lib/utils';

const TOTAL_STEPS = 5;

const PROFILE_TYPES = [
  { id: 'individual', label: 'Proprietário Individual', desc: 'Gerencio meus próprios imóveis', icon: User },
  { id: 'imobiliaria', label: 'Imobiliária', desc: 'Gerencio imóveis de terceiros', icon: Building2 },
  { id: 'incorporadora', label: 'Incorporadora', desc: 'Desenvolvo e vendo imóveis', icon: Warehouse },
  { id: 'sindico', label: 'Síndico / Administrador', desc: 'Administro condomínios', icon: ShieldCheck },
];

const PROPERTY_COUNTS = ['1–3', '4–10', '11–30', '31–100', '100+'];

const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Apartamentos', icon: Building2 },
  { id: 'house', label: 'Casas', icon: Home },
  { id: 'commercial', label: 'Comercial', icon: Store },
  { id: 'studio', label: 'Studios / Kitnets', icon: Warehouse },
];

const BR_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
];

const PAYMENT_METHODS = [
  { id: 'pix', label: 'PIX', icon: Smartphone },
  { id: 'boleto', label: 'Boleto', icon: FileText },
  { id: 'card', label: 'Cartão de Crédito', icon: CreditCard },
  { id: 'transfer', label: 'Transferência', icon: Building2 },
];

const GOALS = [
  'Automatizar cobranças', 'Controlar inadimplência', 'Digitalizar contratos',
  'Gestão de manutenção', 'Relatórios financeiros', 'Comunicação com inquilinos',
  'Reduzir trabalho manual', 'Escalar portfólio',
];

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${((step) / TOTAL_STEPS) * 100}%` }}
      />
    </div>
  );
}

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-full transition-all duration-300',
            i + 1 < current ? 'w-1.5 h-1.5 bg-violet-500' :
            i + 1 === current ? 'w-4 h-1.5 bg-violet-400' :
            'w-1.5 h-1.5 bg-white/15'
          )}
        />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    companyName: '',
    profileType: '',
    propertiesCount: '',
    propertyTypes: [] as string[],
    city: '',
    state: 'SP',
    paymentMethods: [] as string[],
    goals: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const session = getStoredSession();
    if (!session) { router.replace('/'); return; }
    setAuthChecked(true);
  }, [router]);

  function toggle<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
  }

  function setField<K extends keyof typeof data>(key: K, value: typeof data[K]) {
    setData(d => ({ ...d, [key]: value }));
  }

  async function saveStep(complete = false) {
    const session = getStoredSession();
    if (!session) return;
    await fetch('/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ ...data, complete }),
    });
    if (complete) {
      // Update stored session user
      setStoredSession({ ...session.user, onboardingCompleted: true }, session.accessToken);
    }
  }

  async function next() {
    if (step < TOTAL_STEPS) {
      await saveStep(false);
      setStep(s => s + 1);
    } else {
      setSaving(true);
      await saveStep(true);
      setSaving(false);
      router.push('/plans');
    }
  }

  function prev() { if (step > 1) setStep(s => s - 1); }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const canProceed = (
    (step === 1 && data.profileType) ||
    (step === 2 && data.propertiesCount && data.propertyTypes.length > 0) ||
    (step === 3 && data.city && data.state) ||
    (step === 4) ||
    step === 5
  );

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center">
              <Building2 size={14} className="text-white" />
            </div>
            <span className="text-white/80 text-sm font-semibold">Equilino</span>
          </div>
          <StepDots current={step} />
        </div>
        <ProgressBar step={step} />
        <p className="text-white/30 text-xs mt-2">Etapa {step} de {TOTAL_STEPS}</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 max-w-lg mx-auto w-full py-8">

        {/* Step 1 — Profile */}
        {step === 1 && (
          <div className="animate-fade-up">
            <h2 className="text-2xl font-bold text-white mb-1">Como você usa o Equilino?</h2>
            <p className="text-white/40 text-sm mb-6">Isso nos ajuda a personalizar a experiência para você.</p>
            <div className="grid grid-cols-2 gap-3">
              {PROFILE_TYPES.map(t => {
                const Icon = t.icon;
                const active = data.profileType === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setField('profileType', t.id)}
                    className={cn(
                      'p-4 rounded-2xl border text-left transition-all duration-200 active:scale-[0.97]',
                      active
                        ? 'bg-violet-500/15 border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                        : 'bg-white/3 border-white/8 hover:border-white/15'
                    )}
                  >
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', active ? 'bg-violet-500/20' : 'bg-white/8')}>
                      <Icon size={18} className={active ? 'text-violet-400' : 'text-white/40'} />
                    </div>
                    <p className={cn('text-sm font-semibold leading-tight mb-0.5', active ? 'text-white' : 'text-white/70')}>{t.label}</p>
                    <p className="text-white/30 text-[11px] leading-snug">{t.desc}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-5">
              <label className="text-xs text-white/40 font-medium mb-1.5 block">Nome da empresa / imobiliária (opcional)</label>
              <input
                type="text"
                value={data.companyName}
                onChange={e => setField('companyName', e.target.value)}
                placeholder="Ex: Imobiliária Silva, João Imóveis…"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all"
              />
            </div>
          </div>
        )}

        {/* Step 2 — Portfolio */}
        {step === 2 && (
          <div className="animate-fade-up">
            <h2 className="text-2xl font-bold text-white mb-1">Seu portfólio de imóveis</h2>
            <p className="text-white/40 text-sm mb-6">Quantos imóveis você gerencia atualmente?</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {PROPERTY_COUNTS.map(c => (
                <button
                  key={c}
                  onClick={() => setField('propertiesCount', c)}
                  className={cn(
                    'px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                    data.propertiesCount === c
                      ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                      : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>

            <p className="text-white/40 text-sm mb-3">Tipos de imóvel que você gerencia:</p>
            <div className="grid grid-cols-2 gap-3">
              {PROPERTY_TYPES.map(t => {
                const Icon = t.icon;
                const active = data.propertyTypes.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => setField('propertyTypes', toggle(data.propertyTypes, t.id))}
                    className={cn(
                      'p-3.5 rounded-2xl border flex items-center gap-3 transition-all',
                      active
                        ? 'bg-violet-500/15 border-violet-500/40 text-white'
                        : 'bg-white/3 border-white/8 text-white/50 hover:border-white/15'
                    )}
                  >
                    <Icon size={16} className={active ? 'text-violet-400' : 'text-white/30'} />
                    <span className="text-sm font-medium">{t.label}</span>
                    {active && <CheckCircle2 size={14} className="text-violet-400 ml-auto flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3 — Location */}
        {step === 3 && (
          <div className="animate-fade-up">
            <h2 className="text-2xl font-bold text-white mb-1">Onde estão seus imóveis?</h2>
            <p className="text-white/40 text-sm mb-6">Principal localização da sua carteira.</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 font-medium mb-1.5 block">
                  <MapPin size={12} className="inline mr-1" />Cidade principal
                </label>
                <input
                  type="text"
                  value={data.city}
                  onChange={e => setField('city', e.target.value)}
                  placeholder="Ex: São Paulo, Rio de Janeiro…"
                  className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 font-medium mb-1.5 block">Estado</label>
                <select
                  value={data.state}
                  onChange={e => setField('state', e.target.value)}
                  className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:border-violet-500/50 transition-all appearance-none"
                >
                  {BR_STATES.map(s => <option key={s} value={s} className="bg-[#0F1628]">{s}</option>)}
                </select>
              </div>
            </div>

            {/* Map visual */}
            <div className="mt-6 p-4 rounded-2xl bg-white/3 border border-white/8 text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-white/40 text-xs">
                {data.city ? `${data.city}, ${data.state}` : 'Selecione sua cidade'}
              </p>
            </div>
          </div>
        )}

        {/* Step 4 — Preferences */}
        {step === 4 && (
          <div className="animate-fade-up">
            <h2 className="text-2xl font-bold text-white mb-1">Preferências de pagamento</h2>
            <p className="text-white/40 text-sm mb-6">Quais métodos seus inquilinos usam para pagar?</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {PAYMENT_METHODS.map(m => {
                const Icon = m.icon;
                const active = data.paymentMethods.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => setField('paymentMethods', toggle(data.paymentMethods, m.id))}
                    className={cn(
                      'p-3.5 rounded-2xl border flex items-center gap-3 transition-all',
                      active
                        ? 'bg-violet-500/15 border-violet-500/40 text-white'
                        : 'bg-white/3 border-white/8 text-white/50 hover:border-white/15'
                    )}
                  >
                    <Icon size={16} className={active ? 'text-violet-400' : 'text-white/30'} />
                    <span className="text-sm font-medium">{m.label}</span>
                    {active && <CheckCircle2 size={14} className="text-violet-400 ml-auto" />}
                  </button>
                );
              })}
            </div>

            <p className="text-white/40 text-sm mb-3">Quais são seus objetivos com o Equilino?</p>
            <div className="flex flex-wrap gap-2">
              {GOALS.map(g => {
                const active = data.goals.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() => setField('goals', toggle(data.goals, g))}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                      active
                        ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                        : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                    )}
                  >
                    {active && '✓ '}{g}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5 — Done */}
        {step === 5 && (
          <div className="animate-scale-in text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-[0_0_40px_rgba(139,92,246,0.4)]">
              <Target size={36} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Tudo certo! 🎉</h2>
            <p className="text-white/40 text-sm mb-6">
              Seu perfil está configurado. Agora escolha o plano ideal para o seu negócio.
            </p>

            {/* Summary */}
            <div className="text-left space-y-2 bg-white/3 border border-white/8 rounded-2xl p-4 mb-6">
              {data.profileType && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Perfil</span>
                  <span className="text-white/80 capitalize">{PROFILE_TYPES.find(t => t.id === data.profileType)?.label}</span>
                </div>
              )}
              {data.propertiesCount && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Imóveis</span>
                  <span className="text-white/80">{data.propertiesCount}</span>
                </div>
              )}
              {data.city && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Localização</span>
                  <span className="text-white/80">{data.city}, {data.state}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-white/30">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              7 dias grátis incluídos
            </div>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="px-6 pb-8 pt-4 max-w-lg mx-auto w-full">
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={prev}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl border border-white/10 text-white/50 text-sm font-medium hover:border-white/20 transition-all"
            >
              <ArrowLeft size={15} />
              Voltar
            </button>
          )}
          <button
            onClick={next}
            disabled={!canProceed || saving}
            className="flex-1 py-3.5 gradient-accent rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 glow-accent disabled:opacity-40 active:scale-[0.98] transition-all duration-150"
          >
            {saving ? (
              <div className="flex gap-1.5">
                {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-white dot-pulse" style={{ animationDelay: `${i*0.15}s` }} />)}
              </div>
            ) : step === TOTAL_STEPS ? (
              <>Escolher plano <ArrowRight size={15} /></>
            ) : (
              <>Continuar <ArrowRight size={15} /></>
            )}
          </button>
        </div>

        {step < TOTAL_STEPS && (
          <button
            onClick={() => { setStep(TOTAL_STEPS); }}
            className="w-full text-center text-white/25 text-xs mt-3 hover:text-white/40 transition-colors"
          >
            Pular configuração
          </button>
        )}
      </div>
    </div>
  );
}
