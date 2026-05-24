'use client';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Building2, FileText, Users, Wrench,
  CreditCard, Bell, Settings, LogOut, TrendingUp, ClipboardCheck,
  Megaphone, FileSignature,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { useUnreadCount } from '@/hooks/useApi';
import { getInitials } from '@/lib/utils';

const navItems = [
  { id: 'dashboard',          label: 'Dashboard',          icon: LayoutDashboard },
  { id: 'payments',           label: 'Pagamentos',          icon: CreditCard },
  { id: 'properties',         label: 'Imóveis',             icon: Building2 },
  { id: 'contracts',          label: 'Contratos',           icon: FileText },
  { id: 'digital-contracts',  label: 'Contratos Digitais',  icon: FileSignature },
  { id: 'tenants',            label: 'Inquilinos',          icon: Users },
  { id: 'maintenance',        label: 'Manutenção',          icon: Wrench },
  { id: 'inspections',        label: 'Vistorias',           icon: ClipboardCheck },
  { id: 'notices',            label: 'Avisos & Deveres',    icon: Megaphone },
  { id: 'reports',            label: 'Relatórios',          icon: TrendingUp },
];

const bottomItems = [
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  const { activeTab, setActiveTab, user, logout } = useAppStore();
  const unreadCount = useUnreadCount();

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-card border-r border-border fixed left-0 top-0 bottom-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center glow-accent">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <div>
            <h1 className="text-foreground font-bold text-lg leading-none">Equilino</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Pro Plan</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Navegação principal">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative',
                isActive
                  ? 'bg-violet-500/15 text-violet-400'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebarIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-violet-400"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="p-3 border-t border-border space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const hasNotif = item.id === 'notifications' && unreadCount > 0;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={hasNotif ? `${item.label} (${unreadCount} não lidas)` : item.label}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-violet-500/15 text-violet-400'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <div className="relative">
                <Icon size={18} aria-hidden="true" />
                {hasNotif && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 gradient-danger rounded-full text-[9px] font-bold text-white flex items-center justify-center" aria-hidden="true">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              {item.label}
            </button>
          );
        })}

        {/* User */}
        <button
          onClick={() => setActiveTab('profile')}
          className="mt-2 pt-2 border-t border-border flex items-center gap-3 px-3 py-2 w-full hover:bg-muted/60 rounded-xl transition-colors group"
          aria-label="Meu perfil"
        >
          <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {user ? getInitials(user.name) : 'U'}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <LogOut
            size={16}
            aria-hidden="true"
            className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0"
          />
        </button>
      </div>
    </aside>
  );
}
