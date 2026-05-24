'use client';
import { m } from 'framer-motion';
import { LayoutDashboard, Building2, Users, Wrench, FileSignature, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

const tabs = [
  { id: 'dashboard',          label: 'Início',    icon: LayoutDashboard },
  { id: 'properties',         label: 'Imóveis',   icon: Building2 },
  { id: 'digital-contracts',  label: 'Contratos', icon: FileSignature },
  { id: 'tenants',            label: 'Inquilinos', icon: Users },
  { id: 'maintenance',        label: 'Chamados',  icon: Wrench },
  { id: 'notices',            label: 'Avisos',    icon: Megaphone },
];

export function BottomNav() {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-bottom" aria-label="Navegação principal">
      <div className="glass border-t border-border px-2 pt-1 pb-5 shadow-[0_-16px_40px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={tab.label}
                className="flex-1 flex flex-col items-center py-1"
              >
                <div className="relative flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl">
                  {isActive && (
                    <m.div
                      layoutId="bottomNavPill"
                      className="absolute inset-0 bg-violet-500/15 rounded-xl"
                      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    />
                  )}
                  <Icon
                    size={20}
                    className={cn(
                      'relative transition-colors duration-200',
                      isActive ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground'
                    )}
                  />
                  <span
                    className={cn(
                      'relative text-[9px] font-semibold transition-colors duration-200 leading-none',
                      isActive ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground'
                    )}
                  >
                    {tab.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
