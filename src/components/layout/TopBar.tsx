'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Bell, Search, Sun, Moon, X, Building2, Users, CreditCard, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useUnreadCount, useProperties, useTenants, usePayments, useContracts } from '@/hooks/useApi';
import { getInitials } from '@/lib/utils';
import type { Property, Tenant, Payment, Contract } from '@/types';

type SearchResult = { id: string; label: string; sub: string; tab: string; icon: React.ElementType; color: string };

function buildResults(
  q: string,
  tenants: Tenant[],
  properties: Property[],
  payments: Payment[],
  contracts: Contract[],
): SearchResult[] {
  if (!q.trim()) return [];
  const lq = q.toLowerCase();
  const results: SearchResult[] = [];

  tenants.filter(t => t.name.toLowerCase().includes(lq) || t.email.toLowerCase().includes(lq)).slice(0, 3).forEach(t => {
    results.push({ id: `t-${t.id}`, label: t.name, sub: t.email, tab: 'tenants', icon: Users, color: 'text-violet-400' });
  });

  properties.filter(p => p.name.toLowerCase().includes(lq) || p.city.toLowerCase().includes(lq)).slice(0, 3).forEach(p => {
    results.push({ id: `p-${p.id}`, label: p.name, sub: p.city, tab: 'properties', icon: Building2, color: 'text-blue-400' });
  });

  payments.filter(pay => pay.description.toLowerCase().includes(lq)).slice(0, 2).forEach(pay => {
    results.push({ id: `pay-${pay.id}`, label: pay.description, sub: pay.month, tab: 'payments', icon: CreditCard, color: 'text-green-400' });
  });

  contracts.filter(c => c.id.toLowerCase().includes(lq)).slice(0, 2).forEach(c => {
    results.push({ id: `c-${c.id}`, label: `Contrato ${c.id}`, sub: `Vence ${c.endDate.slice(0, 10)}`, tab: 'contracts', icon: FileText, color: 'text-orange-400' });
  });

  return results.slice(0, 6);
}

export function TopBar() {
  const { user, setActiveTab, theme, toggleTheme } = useAppStore();
  const unreadCount = useUnreadCount();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: tenants = [] } = useTenants();
  const { data: properties = [] } = useProperties();
  const { data: payments = [] } = usePayments();
  const { data: contracts = [] } = useContracts();

  useEffect(() => {
    if (!searchOpen) return;
    const id = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(id);
  }, [searchOpen]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(id);
  }, [query]);

  const results = useMemo(
    () => buildResults(debouncedQuery, tenants, properties, payments, contracts),
    [debouncedQuery, tenants, properties, payments, contracts]
  );

  function close() {
    setSearchOpen(false);
    setQuery('');
    setDebouncedQuery('');
  }

  function pick(tab: string) {
    setActiveTab(tab);
    close();
  }

  return (
    <>
      <header className="sticky top-0 z-30 glass border-b border-border px-4 py-3 md:px-6 flex items-center gap-3 shadow-sm shadow-slate-950/5">
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center">
            <span className="text-white font-bold text-xs">E</span>
          </div>
          <span className="text-foreground font-bold text-base">Equilino</span>
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setSearchOpen(true)}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Buscar"
        >
          <Search size={18} />
        </button>

        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className="relative w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={`Notificações${unreadCount > 0 ? `, ${unreadCount} não lidas` : ''}`}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 gradient-danger rounded-full text-[9px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-xs font-bold text-white"
          aria-label="Meu perfil"
        >
          {user ? getInitials(user.name) : 'U'}
        </button>
      </header>

      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
              onClick={close}
              aria-hidden="true"
            />
            <motion.div
              role="dialog"
              aria-label="Busca global"
              aria-modal="true"
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[520px] z-[71] premium-surface rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search size={16} className="text-muted-foreground flex-shrink-0" aria-hidden="true" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && close()}
                  placeholder="Buscar inquilinos, imóveis, contratos..."
                  className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground focus:outline-none"
                  aria-label="Campo de busca"
                  autoComplete="off"
                />
                <button
                  onClick={close}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Fechar busca"
                >
                  <X size={16} />
                </button>
              </div>

              {results.length > 0 ? (
                <div className="py-2 max-h-72 overflow-y-auto" role="listbox" aria-label="Resultados da busca">
                  {results.map(r => {
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.id}
                        onClick={() => pick(r.tab)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 dark:hover:bg-white/5 transition-colors text-left"
                        role="option"
                        aria-selected="false"
                      >
                        <div className="w-8 h-8 rounded-lg bg-muted/70 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                          <Icon size={14} className={r.color} aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground text-sm font-medium truncate">{r.label}</p>
                          <p className="text-muted-foreground text-xs truncate">{r.sub}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : query.length > 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Nenhum resultado para &ldquo;{query}&rdquo;
                </div>
              ) : (
                <div className="py-4 px-4">
                  <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-2">Ir para</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Inquilinos', tab: 'tenants',    icon: Users,     color: 'text-violet-400' },
                      { label: 'Imóveis',    tab: 'properties', icon: Building2, color: 'text-blue-400'   },
                      { label: 'Pagamentos', tab: 'payments',   icon: CreditCard, color: 'text-green-400' },
                    ].map(item => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.tab}
                          onClick={() => pick(item.tab)}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/60 dark:bg-white/5 hover:bg-muted dark:hover:bg-white/10 transition-colors"
                        >
                          <Icon size={18} className={item.color} aria-hidden="true" />
                          <span className="text-foreground text-xs font-medium">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
