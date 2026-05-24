'use client';
import { Plus, CreditCard, FileText, Wrench, Megaphone } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const actions = [
  { label: 'Novo Imóvel',    icon: Plus,      gradient: 'from-violet-500 to-violet-700', glow: 'shadow-violet-500/30',  tab: 'properties'  },
  { label: 'Registrar Pgto', icon: CreditCard, gradient: 'from-green-500 to-green-700',  glow: 'shadow-green-500/30',   tab: 'payments'    },
  { label: 'Novo Contrato',  icon: FileText,   gradient: 'from-blue-500 to-blue-700',    glow: 'shadow-blue-500/30',    tab: 'contracts'   },
  { label: 'Abrir Chamado',  icon: Wrench,     gradient: 'from-orange-500 to-orange-700', glow: 'shadow-orange-500/30', tab: 'maintenance' },
  { label: 'Avisos',         icon: Megaphone,  gradient: 'from-pink-500 to-pink-700',    glow: 'shadow-pink-500/30',    tab: 'notices'     },
];

export function QuickActions() {
  const { setActiveTab } = useAppStore();

  return (
    <div className="animate-fade-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
      <h3 className="text-foreground font-semibold text-sm mb-3">Ações Rápidas</h3>
      <div className="grid grid-cols-5 gap-2">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => setActiveTab(action.tab)}
              aria-label={action.label}
              className="flex flex-col items-center gap-2 animate-card-enter active:scale-95 transition-transform duration-150"
              style={{ animationDelay: `${0.12 + i * 0.055}s`, animationFillMode: 'both' }}
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.gradient} shadow-lg ${action.glow} flex items-center justify-center ring-1 ring-white/20 hover:scale-105 transition-transform duration-150`}>
                <Icon size={20} className="text-white" />
              </div>
              <span className="text-[10px] text-muted-foreground text-center leading-tight">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
