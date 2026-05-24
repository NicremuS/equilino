'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';
import { ScreenSkeleton } from '@/components/shared/ScreenSkeleton';
import { NotificationToast } from '@/components/shared/NotificationToast';
import { TrialBanner } from '@/components/shared/TrialBanner';

// ── Lazy-loaded screens ───────────────────────────────────────────────────────
// Each becomes its own JS chunk that loads only when first visited.
// This cuts the initial JS payload from ~10 MB (dev) / ~3 MB (prod) to the
// minimal shell + React + Next.js runtime (~1 MB gzipped in production).
const DashboardScreen = dynamic(
  () => import('@/components/screens/DashboardScreen').then(m => ({ default: m.DashboardScreen })),
  { ssr: false }
);
const PaymentsScreen = dynamic(
  () => import('@/components/screens/PaymentsScreen').then(m => ({ default: m.PaymentsScreen })),
  { ssr: false }
);
const PropertiesScreen = dynamic(
  () => import('@/components/screens/PropertiesScreen').then(m => ({ default: m.PropertiesScreen })),
  { ssr: false }
);
const ContractsScreen = dynamic(
  () => import('@/components/screens/ContractsScreen').then(m => ({ default: m.ContractsScreen })),
  { ssr: false }
);
const TenantsScreen = dynamic(
  () => import('@/components/screens/TenantsScreen').then(m => ({ default: m.TenantsScreen })),
  { ssr: false }
);
const MaintenanceScreen = dynamic(
  () => import('@/components/screens/MaintenanceScreen').then(m => ({ default: m.MaintenanceScreen })),
  { ssr: false }
);
const ReportsScreen = dynamic(
  () => import('@/components/screens/ReportsScreen').then(m => ({ default: m.ReportsScreen })),
  { ssr: false }
);
const NotificationsScreen = dynamic(
  () => import('@/components/screens/NotificationsScreen').then(m => ({ default: m.NotificationsScreen })),
  { ssr: false }
);
const SettingsScreen = dynamic(
  () => import('@/components/screens/SettingsScreen').then(m => ({ default: m.SettingsScreen })),
  { ssr: false }
);
const InspectionScreen = dynamic(
  () => import('@/components/screens/InspectionScreen').then(m => ({ default: m.InspectionScreen })),
  { ssr: false }
);
const NoticesScreen = dynamic(
  () => import('@/components/screens/NoticesScreen').then(m => ({ default: m.NoticesScreen })),
  { ssr: false }
);
const OwnerProfileScreen = dynamic(
  () => import('@/components/screens/OwnerProfileScreen').then(m => ({ default: m.OwnerProfileScreen })),
  { ssr: false }
);
const DigitalContractsScreen = dynamic(
  () => import('@/components/screens/DigitalContractsScreen').then(m => ({ default: m.DigitalContractsScreen })),
  { ssr: false }
);

type ScreenComponent = React.ComponentType;

const screenMap: Record<string, ScreenComponent> = {
  dashboard:          DashboardScreen,
  payments:           PaymentsScreen,
  properties:         PropertiesScreen,
  contracts:          ContractsScreen,
  tenants:            TenantsScreen,
  maintenance:        MaintenanceScreen,
  reports:            ReportsScreen,
  notifications:      NotificationsScreen,
  settings:           SettingsScreen,
  inspections:        InspectionScreen,
  notices:            NoticesScreen,
  profile:            OwnerProfileScreen,
  'digital-contracts': DigitalContractsScreen,
};

export function AppShell() {
  const { activeTab } = useAppStore();
  const ActiveScreen = screenMap[activeTab] ?? DashboardScreen;

  return (
    // Single LazyMotion wrapper covers Sidebar (layoutId indicator),
    // BottomNav (layoutId pill), and the screen transition — one feature-set load.
    <LazyMotion features={domAnimation} strict>
      <div className="min-h-screen bg-background flex">
        <Sidebar />

        <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
          <TopBar />

          <TrialBanner />
          <main className="flex-1 px-4 py-5 md:px-6 pb-24 md:pb-6 overflow-x-hidden">
            <AnimatePresence mode="wait">
              <m.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="max-w-2xl mx-auto md:max-w-4xl"
              >
                {/* Suspense shows a skeleton while the lazy screen chunk loads */}
                <Suspense fallback={<ScreenSkeleton />}>
                  <ActiveScreen />
                </Suspense>
              </m.div>
            </AnimatePresence>
          </main>
        </div>

        <BottomNav />
        <NotificationToast />
      </div>
    </LazyMotion>
  );
}
