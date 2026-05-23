'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { Home, CreditCard, Wrench, FileText, LogOut, Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getInitials } from '@/lib/utils';
import { TenantHomeScreen } from '@/components/screens/tenant/TenantHomeScreen';
import { TenantPaymentsScreen } from '@/components/screens/tenant/TenantPaymentsScreen';
import { TenantMaintenanceScreen } from '@/components/screens/tenant/TenantMaintenanceScreen';
import { TenantContractScreen } from '@/components/screens/tenant/TenantContractScreen';
import type React from 'react';

type TenantTab = 'home' | 'payments' | 'maintenance' | 'contract';

type ScreenComponent = React.ComponentType;

const SCREENS: Record<TenantTab, ScreenComponent> = {
  home:        TenantHomeScreen,
  payments:    TenantPaymentsScreen,
  maintenance: TenantMaintenanceScreen,
  contract:    TenantContractScreen,
};

const NAV_ITEMS: { tab: TenantTab; icon: React.ElementType; label: string }[] = [
  { tab: 'home',        icon: Home,       label: 'Início' },
  { tab: 'payments',    icon: CreditCard, label: 'Pagamentos' },
  { tab: 'maintenance', icon: Wrench,     label: 'Manutenção' },
  { tab: 'contract',    icon: FileText,   label: 'Contrato' },
];

export function TenantShell() {
  const { user, activeTab, setActiveTab, theme, toggleTheme, logout } = useAppStore();

  const currentTab = (SCREENS[activeTab as TenantTab] ? activeTab : 'home') as TenantTab;
  const ActiveScreen = SCREENS[currentTab];

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    logout();
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 glass border-b border-border px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <span className="text-emerald-400 font-bold text-xs">E</span>
          </div>
          <span className="text-foreground font-bold text-base">Equilino</span>
          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">Locatário</span>
        </div>

        <div className="flex-1" />

        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
            {user ? getInitials(user.name) : 'U'}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Sair"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-5 pb-28 overflow-x-hidden max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <ActiveScreen />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border px-2 pb-safe">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {NAV_ITEMS.map(({ tab, icon: Icon, label }) => {
            const active = currentTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex flex-col items-center gap-1 py-3 px-5 relative"
              >
                {active && (
                  <motion.div
                    layoutId="tenant-nav-indicator"
                    className="absolute inset-x-2 top-0 h-0.5 bg-emerald-500 rounded-full"
                  />
                )}
                <Icon
                  size={22}
                  className={active ? 'text-emerald-400' : 'text-muted-foreground'}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                <span className={`text-[10px] font-medium ${active ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
