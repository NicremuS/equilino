'use client';
import { useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2,
  Loader2, LogOut, Sun, Moon, Shield, Star, Building2, Users,
  CreditCard, Wrench,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useProperties, useTenants, usePayments, useTickets } from '@/hooks/useApi';
import { getInitials, formatCurrency } from '@/lib/utils';
import { api } from '@/services/api';

const PLAN_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  starter:    { label: 'Starter',    color: 'text-slate-400',  bg: 'bg-slate-500/10'  },
  pro:        { label: 'Pro',        color: 'text-violet-400', bg: 'bg-violet-500/10' },
  enterprise: { label: 'Enterprise', color: 'text-amber-400',  bg: 'bg-amber-500/10'  },
};

export function OwnerProfileScreen() {
  const { user, theme, toggleTheme, logout } = useAppStore();

  const { data: properties = [] } = useProperties();
  const { data: tenants = [] } = useTenants();
  const { data: payments = [] } = usePayments();
  const { data: tickets = [] } = useTickets();

  const [pwOpen, setPwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const mismatch = confirmPw.length > 0 && newPw !== confirmPw;
  const pwValid = currentPw.length >= 1 && newPw.length >= 6 && newPw === confirmPw;

  const plan = PLAN_LABELS[user?.plan ?? 'starter'] ?? PLAN_LABELS.starter;
  const initials = getInitials(user?.name ?? '');

  const occupiedProps = properties.filter(p => p.status === 'occupied').length;
  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

  async function handleChangePassword() {
    if (!pwValid) return;
    setPwLoading(true);
    setPwError('');
    try {
      const token = useAppStore.getState().accessToken;
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Erro ao alterar senha');
      setPwSuccess(true);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => { setPwSuccess(false); setPwOpen(false); }, 2200);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Erro ao alterar senha.');
    } finally {
      setPwLoading(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    logout();
  }

  return (
    <div className="space-y-5 pb-6 max-w-lg">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-foreground text-xl font-bold">Meu perfil</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Gerencie sua conta</p>
      </motion.div>

      {/* Avatar card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="premium-surface rounded-3xl p-6 flex items-center gap-4"
      >
        <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center text-xl font-bold text-white flex-shrink-0 shadow-lg glow-accent">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-bold text-lg leading-tight truncate">{user?.name}</p>
          <p className="text-muted-foreground text-sm truncate">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${plan.color} ${plan.bg}`}>
              <Star size={10} /> {plan.label}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-full">
              <Shield size={10} /> Locador
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        {[
          { icon: Building2, color: 'text-blue-400',   bg: 'bg-blue-500/10',   label: 'Imóveis ocupados', value: `${occupiedProps} / ${properties.length}` },
          { icon: Users,     color: 'text-violet-400', bg: 'bg-violet-500/10', label: 'Inquilinos ativos', value: String(tenants.filter(t => t.status === 'active').length) },
          { icon: CreditCard,color: 'text-emerald-400',bg: 'bg-emerald-500/10',label: 'Total recebido',    value: formatCurrency(totalRevenue) },
          { icon: Wrench,    color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Chamados abertos',  value: String(openTickets) },
        ].map(({ icon: Icon, color, bg, label, value }) => (
          <div key={label} className="premium-surface rounded-2xl p-4">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
              <Icon size={15} className={color} />
            </div>
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="text-foreground font-bold text-base mt-0.5">{value}</p>
          </div>
        ))}
      </motion.div>

      {/* Account info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="premium-surface rounded-2xl divide-y divide-border overflow-hidden"
      >
        {[
          { icon: User, color: 'text-violet-400', label: 'Nome',  value: user?.name ?? '—' },
          { icon: Mail, color: 'text-blue-400',   label: 'E-mail', value: user?.email ?? '—' },
        ].map(({ icon: Icon, color, label, value }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
              <Icon size={15} className={color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-muted-foreground text-xs">{label}</p>
              <p className="text-foreground font-medium text-sm truncate">{value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Change password */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="premium-surface rounded-2xl overflow-hidden"
      >
        <button
          onClick={() => { setPwOpen(v => !v); setPwError(''); setPwSuccess(false); }}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
            <Lock size={15} className="text-violet-400" />
          </div>
          <span className="flex-1 text-left text-foreground font-medium text-sm">Alterar senha</span>
          <motion.div animate={{ rotate: pwOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <Lock size={14} className="text-muted-foreground" />
          </motion.div>
        </button>

        <AnimatePresence>
          {pwOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                {pwSuccess ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-emerald-400">
                    <CheckCircle2 size={18} />
                    <span className="text-sm font-semibold">Senha alterada com sucesso!</span>
                  </div>
                ) : (
                  <>
                    {[
                      { placeholder: 'Senha atual', value: currentPw, onChange: setCurrentPw, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
                      { placeholder: 'Nova senha (mín. 6 caracteres)', value: newPw, onChange: setNewPw, show: showNew, toggle: () => setShowNew(v => !v) },
                      { placeholder: 'Confirmar nova senha', value: confirmPw, onChange: setConfirmPw, show: showConfirm, toggle: () => setShowConfirm(v => !v), error: mismatch },
                    ].map(({ placeholder, value, onChange, show, toggle, error }) => (
                      <div key={placeholder} className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <input
                          type={show ? 'text' : 'password'}
                          value={value}
                          onChange={e => { onChange(e.target.value); setPwError(''); }}
                          placeholder={placeholder}
                          className={`w-full pl-9 pr-10 py-2.5 bg-muted/70 dark:bg-[#111827] border rounded-xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none transition-colors ${
                            error ? 'border-red-500/60' : 'border-border focus:border-violet-500/50'
                          }`}
                        />
                        <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {show ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    ))}

                    {mismatch && (
                      <p className="text-red-400 text-xs flex items-center gap-1">
                        <AlertCircle size={11} /> As senhas não coincidem
                      </p>
                    )}
                    {pwError && (
                      <p className="text-red-400 text-xs flex items-center gap-1">
                        <AlertCircle size={11} /> {pwError}
                      </p>
                    )}

                    <button
                      onClick={handleChangePassword}
                      disabled={!pwValid || pwLoading}
                      className="w-full py-2.5 gradient-accent disabled:opacity-50 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                    >
                      {pwLoading ? <Loader2 size={15} className="animate-spin" /> : 'Salvar nova senha'}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Theme */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="premium-surface rounded-2xl overflow-hidden"
      >
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
            {theme === 'dark' ? <Sun size={15} className="text-yellow-400" /> : <Moon size={15} className="text-slate-400" />}
          </div>
          <span className="flex-1 text-left text-foreground font-medium text-sm">
            {theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          </span>
          <span className="text-xs text-muted-foreground capitalize">{theme === 'dark' ? 'Dark' : 'Light'}</span>
        </button>
      </motion.div>

      {/* Logout */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-500/25 bg-red-500/8 hover:bg-red-500/15 text-red-400 text-sm font-semibold transition-colors"
        >
          <LogOut size={16} /> Sair da conta
        </button>
      </motion.div>
    </div>
  );
}
