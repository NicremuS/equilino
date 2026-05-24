'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, X, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export function TrialBanner() {
  const router = useRouter();
  const { user } = useAppStore();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !user || user.subscriptionStatus !== 'trial') return null;

  const daysLeft = user.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / 86_400_000))
    : 7;

  const urgency = daysLeft <= 1 ? 'red' : daysLeft <= 3 ? 'amber' : 'violet';

  const colors = {
    red:    { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400', btn: 'bg-red-500 hover:bg-red-600' },
    amber:  { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', btn: 'bg-amber-500 hover:bg-amber-600' },
    violet: { bg: 'bg-violet-500/10 border-violet-500/20', text: 'text-violet-400', btn: 'bg-violet-500 hover:bg-violet-600' },
  }[urgency];

  return (
    <div className={`${colors.bg} border rounded-2xl px-4 py-2.5 mx-4 mb-3 flex items-center gap-3`}>
      <Clock size={14} className={`${colors.text} flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold ${colors.text}`}>
          {daysLeft === 0
            ? 'Seu teste grátis expira hoje!'
            : `${daysLeft} dia${daysLeft === 1 ? '' : 's'} restante${daysLeft === 1 ? '' : 's'} no seu teste grátis`}
        </p>
        <p className="text-muted-foreground text-[10px]">Assine agora para não perder o acesso</p>
      </div>
      <button
        onClick={() => router.push('/plans')}
        className={`${colors.btn} text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1 flex-shrink-0 transition-colors`}
      >
        Assinar <ArrowRight size={11} />
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        aria-label="Fechar"
      >
        <X size={13} />
      </button>
    </div>
  );
}
