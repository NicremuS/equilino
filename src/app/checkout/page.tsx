'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, CreditCard, Smartphone, Lock, Shield, ArrowLeft,
  Check, AlertCircle, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStoredSession, setStoredSession } from '@/lib/session';
import type { Plan, User } from '@/types';

function formatCardNumber(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0,2)}/${d.slice(2)}`;
}

function CheckoutInner() {
  const router = useRouter();
  const params = useSearchParams();
  const planId = (params.get('plan') ?? 'pro') as 'basic' | 'pro' | 'enterprise';
  const cycle = (params.get('cycle') ?? 'monthly') as 'monthly' | 'yearly';

  const [plan, setPlan] = useState<Plan | null>(null);
  const [method, setMethod] = useState<'pix' | 'card'>('card');
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [pixPaid, setPixPaid] = useState(false);

  useEffect(() => {
    const session = getStoredSession();
    if (!session) { router.replace('/'); return; }

    fetch('/api/plans')
      .then(r => r.json())
      .then((plans: Plan[]) => {
        const found = plans.find(p => p.id === planId);
        if (found) setPlan(found);
      });
  }, [planId, router]);

  const price = plan
    ? (cycle === 'yearly' ? plan.yearlyPrice * 12 : plan.monthlyPrice)
    : 0;

  const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  async function handlePay() {
    setError('');
    const session = getStoredSession();
    if (!session || !plan) return;

    if (method === 'card') {
      const rawNum = card.number.replace(/\s/g, '');
      if (rawNum.length < 16) { setError('Número do cartão inválido'); return; }
      if (!card.name.trim()) { setError('Nome no cartão obrigatório'); return; }
      if (card.expiry.length < 5) { setError('Validade inválida'); return; }
      if (card.cvv.length < 3) { setError('CVV inválido'); return; }
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          planId,
          billingCycle: cycle,
          paymentMethod: method,
          cardNumber: method === 'card' ? card.number : undefined,
          cardName: method === 'card' ? card.name : undefined,
          cardExpiry: method === 'card' ? card.expiry : undefined,
          cardCvv: method === 'card' ? card.cvv : undefined,
        }),
      });

      const data = await res.json() as { ok: boolean; error?: string; user?: User };
      if (!data.ok) {
        setError(data.error ?? 'Pagamento não processado');
        router.push(`/payment-failed?plan=${planId}&error=${encodeURIComponent(data.error ?? '')}`);
        return;
      }

      // Update stored session with activated subscription
      if (data.user) {
        setStoredSession(data.user, session.accessToken);
      }

      router.push(`/payment-success?plan=${planId}&cycle=${cycle}`);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  }

  // Simulate PIX payment (auto-confirm after 3s)
  function handlePixPay() {
    setPixPaid(true);
    setTimeout(() => handlePay(), 2500);
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/8 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-4 px-6 py-5 border-b border-white/5 max-w-4xl mx-auto w-full">
        <Link href={`/plans`} className="text-white/40 hover:text-white/70 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center">
            <Building2 size={14} className="text-white" />
          </div>
          <span className="text-white font-bold">Equi<span className="text-gradient">lino</span></span>
        </div>
        <div className="flex items-center gap-1.5 text-white/30 text-xs">
          <Lock size={11} />
          Checkout seguro
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col lg:flex-row gap-6 px-6 py-8 max-w-4xl mx-auto w-full">
        {/* Order summary */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="bg-white/3 border border-white/8 rounded-3xl p-6">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">Resumo do pedido</p>

            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/8">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                <Shield size={18} className="text-violet-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Plano {plan.name}</p>
                <p className="text-white/40 text-xs capitalize">{cycle === 'yearly' ? 'Cobrança anual' : 'Cobrança mensal'}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4 pb-4 border-b border-white/8 text-sm">
              {plan.features.filter(f => f.included).slice(0, 5).map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check size={12} className="text-violet-400 flex-shrink-0" />
                  <span className="text-white/50">{f.label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-sm">
              {cycle === 'yearly' && (
                <div className="flex justify-between">
                  <span className="text-white/40">Desconto anual (20%)</span>
                  <span className="text-green-400 font-medium">
                    -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((plan.monthlyPrice - plan.yearlyPrice) * 12)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-1">
                <span className="text-white font-semibold">Total</span>
                <span className="text-white font-bold text-base">{formatted}</span>
              </div>
              <p className="text-white/25 text-[11px]">
                {cycle === 'yearly' ? 'Cobrado uma vez por ano' : 'Cobrado mensalmente'}
              </p>
            </div>

            {/* Security */}
            <div className="mt-4 pt-4 border-t border-white/8 flex items-center gap-2 text-white/25 text-[11px]">
              <Shield size={12} />
              Pagamento 100% seguro e criptografado
            </div>
          </div>

          {/* Trial notice */}
          <div className="mt-3 p-3 bg-green-500/8 border border-green-500/15 rounded-2xl text-center">
            <p className="text-green-400 text-xs font-medium">🎉 7 dias grátis incluídos</p>
            <p className="text-green-400/60 text-[11px] mt-0.5">Nenhum valor cobrado hoje</p>
          </div>
        </div>

        {/* Payment form */}
        <div className="flex-1">
          {/* Method tabs */}
          <div className="flex gap-3 mb-5">
            {([
              { id: 'card', label: 'Cartão de Crédito', icon: CreditCard },
              { id: 'pix', label: 'PIX', icon: Smartphone },
            ] as const).map(m => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => { setMethod(m.id); setError(''); }}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border text-sm font-medium transition-all',
                    method === m.id
                      ? 'bg-violet-500/15 border-violet-500/40 text-white'
                      : 'bg-white/3 border-white/8 text-white/40 hover:border-white/15'
                  )}
                >
                  <Icon size={16} />
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Card form */}
          {method === 'card' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 font-medium mb-1.5 block">Número do cartão</label>
                <div className="relative">
                  <CreditCard size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={card.number}
                    onChange={e => setCard(c => ({ ...c, number: formatCardNumber(e.target.value) }))}
                    placeholder="0000 0000 0000 0000"
                    className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all tracking-widest"
                    maxLength={19}
                  />
                </div>
                <p className="text-white/20 text-[11px] mt-1">Para testar recusa: use número terminando em 0002</p>
              </div>

              <div>
                <label className="text-xs text-white/40 font-medium mb-1.5 block">Nome no cartão</label>
                <input
                  type="text"
                  value={card.name}
                  onChange={e => setCard(c => ({ ...c, name: e.target.value.toUpperCase() }))}
                  placeholder="NOME COMO NO CARTÃO"
                  className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all uppercase tracking-wide"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 font-medium mb-1.5 block">Validade</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={card.expiry}
                    onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                    placeholder="MM/AA"
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 font-medium mb-1.5 block">CVV</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={card.cvv}
                    onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    placeholder="•••"
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all"
                    maxLength={4}
                  />
                </div>
              </div>

              {/* Card visual */}
              <div className="relative h-36 rounded-2xl bg-gradient-to-br from-violet-900/80 to-indigo-900/60 border border-violet-500/20 p-5 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-violet-400/30 blur-2xl" />
                  <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-indigo-400/30 blur-2xl" />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-8 h-5 rounded bg-amber-400/70" />
                    <Building2 size={18} className="text-white/40" />
                  </div>
                  <p className="text-white/80 text-base font-mono tracking-widest mb-1">
                    {card.number || '•••• •••• •••• ••••'}
                  </p>
                  <div className="flex justify-between items-end">
                    <p className="text-white/50 text-xs uppercase tracking-wide">{card.name || 'NOME NO CARTÃO'}</p>
                    <p className="text-white/50 text-xs">{card.expiry || 'MM/AA'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PIX form */}
          {method === 'pix' && (
            <div className="text-center">
              <div className="inline-block p-6 bg-white rounded-2xl mb-4">
                {/* Mock QR code */}
                <div
                  className="w-48 h-48 bg-[#070B14]"
                  style={{
                    backgroundImage: `
                      repeating-linear-gradient(0deg, transparent, transparent 8px, #070B14 8px, #070B14 9px),
                      repeating-linear-gradient(90deg, transparent, transparent 8px, #070B14 8px, #070B14 9px)
                    `,
                    backgroundSize: '9px 9px',
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="grid grid-cols-4 gap-1 p-3">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div key={i} className={cn('w-4 h-4 rounded-sm', Math.random() > 0.4 ? 'bg-[#070B14]' : 'bg-white')} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-white/60 text-sm mb-2">Escaneie o QR code no seu app bancário</p>
              <p className="text-white font-bold text-xl mb-4">{formatted}</p>

              <button
                onClick={() => navigator.clipboard.writeText('00020126580014BR.GOV.BCB.PIX0136equilino-pix-key5204000053039865802BR5910Equilino6009SAO PAULO62070503***6304ABCD').catch(() => {})}
                className="px-4 py-2 rounded-xl bg-white/8 border border-white/10 text-white/60 text-xs hover:bg-white/12 transition-all mb-6"
              >
                Copiar código PIX
              </button>

              {!pixPaid ? (
                <button
                  onClick={handlePixPay}
                  disabled={processing}
                  className="w-full py-4 gradient-accent rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 glow-accent disabled:opacity-70"
                >
                  Confirmar pagamento PIX
                  <ChevronRight size={15} />
                </button>
              ) : (
                <div className="flex items-center justify-center gap-2 text-green-400 text-sm animate-fade-up">
                  <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                  Confirmando pagamento…
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 mt-4">
              <AlertCircle size={13} />
              {error}
            </div>
          )}

          {/* Pay button (card only) */}
          {method === 'card' && (
            <button
              onClick={handlePay}
              disabled={processing}
              className="w-full mt-5 py-4 gradient-accent rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 glow-accent disabled:opacity-70 active:scale-[0.98] transition-all duration-150"
            >
              {processing ? (
                <div className="flex gap-1.5">
                  {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-white dot-pulse" style={{ animationDelay: `${i*0.15}s` }} />)}
                </div>
              ) : (
                <>
                  <Lock size={14} />
                  Pagar {formatted}
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          )}

          <p className="text-center text-white/20 text-[11px] mt-4">
            Ao continuar você confirma os{' '}
            <a href="#" className="text-violet-400 hover:underline">Termos de Uso</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckoutInner />
    </Suspense>
  );
}
