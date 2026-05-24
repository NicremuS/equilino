'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, Check, X, Zap, Shield, Crown, ArrowRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStoredSession } from '@/lib/session';
import type { Plan } from '@/types';

const PLAN_ICONS = {
  basic: Zap,
  pro: Shield,
  enterprise: Crown,
};

const PLAN_COLORS = {
  basic: {
    border: 'border-white/10',
    iconBg: 'bg-white/10',
    iconColor: 'text-white/60',
    btn: 'bg-white/10 text-white hover:bg-white/15',
    badge: '',
  },
  pro: {
    border: 'border-violet-500/40',
    iconBg: 'bg-violet-500/20',
    iconColor: 'text-violet-400',
    btn: 'gradient-accent text-white glow-accent',
    badge: 'bg-violet-500 text-white',
  },
  enterprise: {
    border: 'border-amber-500/30',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    btn: 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25',
    badge: 'bg-amber-500 text-white',
  },
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(price);
}

function PlansInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const reason = params.get('reason');

  useEffect(() => {
    fetch('/api/plans')
      .then(r => r.json())
      .then((data: Plan[]) => { setPlans(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleSelect(planId: string) {
    const session = getStoredSession();
    if (!session) { router.push('/'); return; }
    router.push(`/checkout?plan=${planId}&cycle=${billing}`);
  }

  const reasonMsg: Record<string, string> = {
    trial_expired: 'Seu período de teste gratuito encerrou. Escolha um plano para continuar.',
    expired: 'Sua assinatura expirou. Renove para continuar acessando.',
    cancelled: 'Sua assinatura foi cancelada. Assine novamente para reativar o acesso.',
  };

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-800/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6 pb-4 max-w-5xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl gradient-accent flex items-center justify-center">
            <Building2 size={16} className="text-white" />
          </div>
          <span className="text-white font-bold">Equi<span className="text-gradient">lino</span></span>
        </Link>
        <div className="flex items-center gap-2 text-white/40 text-xs">
          <Clock size={13} />
          7 dias grátis em qualquer plano
        </div>
      </div>

      {/* Reason banner */}
      {reason && reasonMsg[reason] && (
        <div className="relative z-10 mx-6 mb-2 max-w-5xl self-center w-full">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 text-amber-300 text-sm text-center">
            {reasonMsg[reason]}
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="relative z-10 text-center px-6 pt-8 pb-10 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-4">
          <Zap size={11} />
          7 dias grátis, sem cartão de crédito
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Planos para todo<br />
          <span className="text-gradient">tamanho de portfólio</span>
        </h1>
        <p className="text-white/40 text-base">
          Escolha o plano ideal e comece a transformar sua gestão imobiliária hoje.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center mt-6 p-1 bg-white/5 rounded-2xl border border-white/8">
          {(['monthly', 'yearly'] as const).map(b => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={cn(
                'px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                billing === b
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/40 hover:text-white/60'
              )}
            >
              {b === 'monthly' ? 'Mensal' : 'Anual'}
              {b === 'yearly' && (
                <span className="ml-1.5 text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold">-20%</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div className="relative z-10 px-4 pb-16 max-w-5xl mx-auto w-full">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-[500px] rounded-3xl bg-white/3 border border-white/8 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {plans.map((plan) => {
              const PlanIcon = PLAN_ICONS[plan.id as keyof typeof PLAN_ICONS] ?? Zap;
              const colors = PLAN_COLORS[plan.id as keyof typeof PLAN_COLORS] ?? PLAN_COLORS.basic;
              const price = billing === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
              const yearlyTotal = plan.yearlyPrice * 12;

              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative rounded-3xl border p-6 flex flex-col transition-all duration-200',
                    colors.border,
                    plan.recommended
                      ? 'bg-gradient-to-b from-violet-950/80 to-[#0a0e1a] shadow-[0_0_40px_rgba(139,92,246,0.15)] md:scale-[1.03] md:-mt-2'
                      : 'bg-white/3 hover:bg-white/5'
                  )}
                >
                  {/* Recommended badge */}
                  {plan.recommended && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-[0_4px_12px_rgba(139,92,246,0.4)]">
                        Recomendado
                      </span>
                    </div>
                  )}

                  {/* Plan header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.iconBg)}>
                      <PlanIcon size={18} className={colors.iconColor} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-base">{plan.name}</p>
                      <p className="text-white/30 text-[11px]">{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-5">
                    <div className="flex items-end gap-1.5">
                      <span className="text-white/40 text-sm self-start mt-1.5">R$</span>
                      <span className="text-4xl font-bold text-white">{Math.floor(price)}</span>
                      <span className="text-white/40 text-lg">,{String(Math.round((price % 1) * 100)).padStart(2, '0')}</span>
                      <span className="text-white/30 text-sm pb-0.5">/mês</span>
                    </div>
                    {billing === 'yearly' && (
                      <p className="text-green-400 text-xs mt-1">
                        Cobrado {formatPrice(yearlyTotal)}/ano — economize {formatPrice((plan.monthlyPrice - plan.yearlyPrice) * 12)}/ano
                      </p>
                    )}
                    {billing === 'monthly' && (
                      <p className="text-white/25 text-xs mt-1">
                        ou {formatPrice(plan.yearlyPrice)}/mês no plano anual
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => handleSelect(plan.id)}
                    className={cn(
                      'w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.97] mb-5',
                      colors.btn
                    )}
                  >
                    Começar grátis por 7 dias
                    <ArrowRight size={14} />
                  </button>

                  {/* Limits */}
                  <div className="mb-4 pb-4 border-b border-white/8">
                    <p className="text-white/20 text-[10px] uppercase tracking-wider font-semibold mb-2">Limites</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">Imóveis</span>
                        <span className="text-white/70 font-medium">
                          {plan.propertyLimit === null ? 'Ilimitado' : `Até ${plan.propertyLimit}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">Contratos</span>
                        <span className="text-white/70 font-medium">
                          {plan.contractLimit === null ? 'Ilimitado' : `Até ${plan.contractLimit}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2.5 flex-1">
                    <p className="text-white/20 text-[10px] uppercase tracking-wider font-semibold">Recursos</p>
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        {f.included
                          ? <Check size={13} className={plan.recommended ? 'text-violet-400' : 'text-white/50'} />
                          : <X size={13} className="text-white/15" />}
                        <span className={cn('text-xs', f.included ? 'text-white/70' : 'text-white/20')}>{f.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer notes */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-white/25 text-xs">
            Todos os planos incluem 7 dias grátis · Cancele a qualquer momento · Sem multas
          </p>
          <p className="text-white/20 text-xs">
            Dúvidas?{' '}
            <a href="mailto:suporte@equilino.app" className="text-violet-400 hover:underline">
              suporte@equilino.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PlansPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PlansInner />
    </Suspense>
  );
}
