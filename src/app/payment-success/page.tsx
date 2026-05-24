'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Building2, Sparkles, Shield, Zap, Crown } from 'lucide-react';

const PLAN_LABELS = { basic: 'Básico', pro: 'Profissional', enterprise: 'Enterprise' };
const PLAN_ICONS = { basic: Zap, pro: Shield, enterprise: Crown };

function SuccessInner() {
  const router = useRouter();
  const params = useSearchParams();
  const planId = params.get('plan') ?? 'pro';
  const cycle = params.get('cycle') ?? 'monthly';
  const [countdown, setCountdown] = useState(5);

  const PlanIcon = PLAN_ICONS[planId as keyof typeof PLAN_ICONS] ?? Shield;
  const planLabel = PLAN_LABELS[planId as keyof typeof PLAN_LABELS] ?? planId;

  useEffect(() => {
    if (countdown <= 0) { router.push('/'); }
  }, [countdown, router]);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(c => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-600/8 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-sm mx-auto text-center">
        {/* Success icon with rings */}
        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="absolute w-36 h-36 rounded-full bg-green-500/5 border border-green-500/10 animate-ping" />
          <div className="absolute w-28 h-28 rounded-full bg-green-500/8 border border-green-500/15" />
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.4)] animate-scale-in">
            <CheckCircle2 size={36} className="text-white" />
          </div>
        </div>

        <div className="mb-6 animate-fade-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <h1 className="text-2xl font-bold text-white mb-2">
            Assinatura ativada! 🎉
          </h1>
          <p className="text-white/50 text-sm">
            Bem-vindo ao Equilino. Sua conta está pronta para uso.
          </p>
        </div>

        {/* Plan card */}
        <div className="animate-fade-up mb-6" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <div className="bg-white/3 border border-white/10 rounded-2xl p-4 text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <PlanIcon size={16} className="text-violet-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Plano {planLabel}</p>
                <p className="text-white/40 text-xs capitalize">{cycle === 'yearly' ? 'Cobrança anual' : 'Cobrança mensal'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-medium">Ativo agora</span>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="animate-fade-up mb-8 text-left space-y-2" style={{ animationDelay: '0.25s', animationFillMode: 'both' }}>
          {[
            'Dashboard financeiro disponível',
            'Gestão de imóveis e contratos',
            'Notificações automáticas ativadas',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 text-white/60 text-sm">
              <Sparkles size={13} className="text-violet-400 flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>

        <div className="animate-fade-up space-y-3" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
          <Link
            href="/"
            className="w-full py-4 gradient-accent rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 glow-accent active:scale-[0.98] transition-all"
          >
            <Building2 size={15} />
            Acessar plataforma
            <ArrowRight size={15} />
          </Link>
          <p className="text-white/25 text-xs">
            Redirecionando automaticamente em {countdown}s…
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessInner />
    </Suspense>
  );
}
