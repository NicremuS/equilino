'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';
import { DashboardScreen } from '@/components/screens/DashboardScreen';
import { PaymentsScreen } from '@/components/screens/PaymentsScreen';
import { PropertiesScreen } from '@/components/screens/PropertiesScreen';
import { ContractsScreen } from '@/components/screens/ContractsScreen';
import { MaintenanceScreen } from '@/components/screens/MaintenanceScreen';
import { TenantsScreen } from '@/components/screens/TenantsScreen';
import { NotificationsScreen } from '@/components/screens/NotificationsScreen';
import { SettingsScreen } from '@/components/screens/SettingsScreen';
import { ReportsScreen } from '@/components/screens/ReportsScreen';
import { InspectionScreen } from '@/components/screens/InspectionScreen';
import { NoticesScreen } from '@/components/screens/NoticesScreen';
import { OwnerProfileScreen } from '@/components/screens/OwnerProfileScreen';

type ScreenComponent = React.ComponentType;

const screenMap: Record<string, ScreenComponent> = {
  dashboard: DashboardScreen,
  payments: PaymentsScreen,
  properties: PropertiesScreen,
  contracts: ContractsScreen,
  tenants: TenantsScreen,
  maintenance: MaintenanceScreen,
  reports: ReportsScreen,
  notifications: NotificationsScreen,
  settings: SettingsScreen,
  inspections: InspectionScreen,
  notices: NoticesScreen,
  profile: OwnerProfileScreen,
};

export function AppShell() {
  const { activeTab } = useAppStore();
  const ActiveScreen = screenMap[activeTab] ?? DashboardScreen;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <TopBar />

        <main className="flex-1 px-4 py-5 md:px-6 pb-24 md:pb-6 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="max-w-2xl mx-auto md:max-w-4xl"
            >
              <ActiveScreen />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
