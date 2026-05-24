'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle, ArrowLeft, RefreshCw, MessageCircle } from 'lucide-react';

function FailedInner() {
  const params = useSearchParams();
  const plan = params.get('plan') ?? 'pro';
  const errMsg = params.get('error') ? decodeURIComponent(params.get('error')!) : 'Pagamento não processado';

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-sm mx-auto text-center">
        {/* Error icon */}
        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.3)] animate-scale-in">
            <XCircle size={36} className="text-white" />
          </div>
        </div>

        <div className="mb-4 animate-fade-up" style={{ animationFillMode: 'both' }}>
          <h1 className="text-2xl font-bold text-white mb-2">Pagamento recusado</h1>
          <p className="text-white/50 text-sm mb-3">{errMsg}</p>
          <div className="inline-block px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
            Nenhum valor foi cobrado
          </div>
        </div>

        {/* Tips */}
        <div className="animate-fade-up mb-8 text-left space-y-2.5" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">O que verificar:</p>
          {[
            'Número do cartão está correto',
            'Data de validade não expirou',
            'Saldo ou limite disponível',
            'Cartão habilitado para compras online',
          ].map((tip, i) => (
            <div key={i} className="flex items-center gap-2.5 text-white/50 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-white/20 flex-shrink-0" />
              {tip}
            </div>
          ))}
        </div>

        <div className="animate-fade-up space-y-3" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <Link
            href={`/checkout?plan=${plan}`}
            className="w-full py-4 gradient-accent rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 glow-accent"
          >
            <RefreshCw size={14} />
            Tentar novamente
          </Link>
          <Link
            href="/plans"
            className="w-full py-3.5 rounded-2xl border border-white/10 text-white/50 text-sm flex items-center justify-center gap-2 hover:border-white/20 transition-all"
          >
            <ArrowLeft size={14} />
            Voltar aos planos
          </Link>
          <a
            href="mailto:suporte@equilino.app"
            className="flex items-center justify-center gap-1.5 text-white/30 text-xs hover:text-white/50 transition-colors"
          >
            <MessageCircle size={12} />
            Falar com suporte
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <FailedInner />
    </Suspense>
  );
}
