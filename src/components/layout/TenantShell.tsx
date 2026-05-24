'use client';
import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
// m.div requires LazyMotion context — we wrap the whole shell once at the root.
import { Home, CreditCard, Wrench, FileText, Megaphone, Sun, Moon, FileSignature } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getInitials } from '@/lib/utils';
import { ScreenSkeleton } from '@/components/shared/ScreenSkeleton';
import { useTenantNotices, useTenantPendingContractsCount } from '@/hooks/useTenantApi';
import { TenantNotificationBell } from '@/components/shared/TenantNotificationBell';
import { TenantNotificationToast } from '@/components/shared/TenantNotificationToast';
import type React from 'react';

// ── Lazy-loaded tenant screens ────────────────────────────────────────────────
const TenantHomeScreen = dynamic(
  () => import('@/components/screens/tenant/TenantHomeScreen').then(m => ({ default: m.TenantHomeScreen })),
  { ssr: false }
);
const TenantPaymentsScreen = dynamic(
  () => import('@/components/screens/tenant/TenantPaymentsScreen').then(m => ({ default: m.TenantPaymentsScreen })),
  { ssr: false }
);
const TenantMaintenanceScreen = dynamic(
  () => import('@/components/screens/tenant/TenantMaintenanceScreen').then(m => ({ default: m.TenantMaintenanceScreen })),
  { ssr: false }
);
const TenantContractScreen = dynamic(
  () => import('@/components/screens/tenant/TenantContractScreen').then(m => ({ default: m.TenantContractScreen })),
  { ssr: false }
);
const TenantNoticesScreen = dynamic(
  () => import('@/components/screens/tenant/TenantNoticesScreen').then(m => ({ default: m.TenantNoticesScreen })),
  { ssr: false }
);
const TenantDigitalContractsScreen = dynamic(
  () => import('@/components/screens/tenant/TenantDigitalContractsScreen').then(m => ({ default: m.TenantDigitalContractsScreen })),
  { ssr: false }
);
const TenantUserProfileScreen = dynamic(
  () => import('@/components/screens/tenant/TenantUserProfileScreen').then(m => ({ default: m.TenantUserProfileScreen })),
  { ssr: false }
);
const ChangePasswordModal = dynamic(
  () => import('@/components/screens/tenant/ChangePasswordModal').then(m => ({ default: m.ChangePasswordModal })),
  { ssr: false }
);

type TenantTab = 'home' | 'payments' | 'maintenance' | 'contract' | 'notices' | 'digital-contracts';
type ScreenComponent = React.ComponentType;

const SCREENS: Record<TenantTab, ScreenComponent> = {
  home:                TenantHomeScreen,
  payments:            TenantPaymentsScreen,
  maintenance:         TenantMaintenanceScreen,
  contract:            TenantContractScreen,
  notices:             TenantNoticesScreen,
  'digital-contracts': TenantDigitalContractsScreen,
};

const NAV_ITEMS: { tab: TenantTab; icon: React.ElementType; label: string }[] = [
  { tab: 'home',                icon: Home,            label: 'Início' },
  { tab: 'payments',            icon: CreditCard,      label: 'Pagamentos' },
  { tab: 'maintenance',         icon: Wrench,          label: 'Manutenção' },
  { tab: 'digital-contracts',   icon: FileSignature,   label: 'Contratos' },
  { tab: 'notices',             icon: Megaphone,       label: 'Avisos' },
];

export function TenantShell() {
  const { user, activeTab, setActiveTab, theme, toggleTheme, mustChangePassword } = useAppStore();
  const { data: notices } = useTenantNotices();
  const unreadNotices = notices?.filter(n => !n.read).length ?? 0;
  const pendingContracts = useTenantPendingContractsCount();
  const [profileOpen, setProfileOpen] = useState(false);

  const currentTab = (SCREENS[activeTab as TenantTab] ? activeTab : 'home') as TenantTab;
  const ActiveScreen = SCREENS[currentTab];

  return (
    // Single LazyMotion root: screen transitions + nav indicator share one feature-set load.
    <LazyMotion features={domAnimation} strict>
    <div className="min-h-screen bg-background flex flex-col">
      {mustChangePassword && (
        <Suspense fallback={null}>
          <ChangePasswordModal />
        </Suspense>
      )}

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

        <TenantNotificationBell />

        <button
          onClick={() => setProfileOpen(true)}
          className="w-8 h-8 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400 transition-colors"
          aria-label="Meu perfil"
          title="Meu perfil"
        >
          {user ? getInitials(user.name) : 'U'}
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-5 pb-28 overflow-x-hidden max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          {profileOpen ? (
            <Suspense key="profile" fallback={<ScreenSkeleton />}>
              <TenantUserProfileScreen onClose={() => setProfileOpen(false)} />
            </Suspense>
          ) : (
            <m.div
              key={currentTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Suspense fallback={<ScreenSkeleton />}>
                <ActiveScreen />
              </Suspense>
            </m.div>
          )}
        </AnimatePresence>
      </main>

      <TenantNotificationToast />

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border px-2 pb-safe">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {NAV_ITEMS.map(({ tab, icon: Icon, label }) => {
              const active = currentTab === tab;
              const hasBadge = (tab === 'notices' && unreadNotices > 0) ||
                (tab === 'digital-contracts' && pendingContracts > 0);
              const badgeCount = tab === 'notices' ? unreadNotices : pendingContracts;
              return (
                <button
                  key={tab}
                  onClick={() => { setProfileOpen(false); setActiveTab(tab); }}
                  className="flex flex-col items-center gap-1 py-3 px-4 relative"
                >
                  {active && (
                    <m.div
                      layoutId="tenant-nav-indicator"
                      className="absolute inset-x-2 top-0 h-0.5 bg-emerald-500 rounded-full"
                    />
                  )}
                  <div className="relative">
                    <Icon
                      size={22}
                      className={active ? 'text-emerald-400' : 'text-muted-foreground'}
                      strokeWidth={active ? 2.2 : 1.8}
                    />
                    {hasBadge && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium ${active ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                </button>
              );
            })}
        </div>
      </nav>
    </div>
    </LazyMotion>
  );
}
