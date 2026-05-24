'use client';
import { useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, CreditCard, Calendar, Home,
  Lock, Eye, EyeOff, ChevronRight, AlertCircle, CheckCircle2,
  Loader2, LogOut, Sun, Moon, Shield,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useTenantProfile, useTenantProperty, useTenantContract } from '@/hooks/useTenantApi';
import { tenantApi } from '@/services/tenantApi';
import { formatDate, formatCurrency, getInitials } from '@/lib/utils';

export function TenantUserProfileScreen({ onClose }: { onClose: () => void }) {
  const { user, theme, toggleTheme, logout } = useAppStore();
  const { data: profile } = useTenantProfile();
  const { data: property } = useTenantProperty();
  const { data: contract } = useTenantContract();

  const [pwOpen, setPwOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const mismatch = confirm.length > 0 && password !== confirm;
  const pwValid = password.length >= 6 && password === confirm;

  async function handleChangePassword() {
    if (!pwValid) return;
    setPwLoading(true);
    setPwError('');
    try {
      await tenantApi.changePassword(password);
      setPwSuccess(true);
      setPassword('');
      setConfirm('');
      setTimeout(() => { setPwSuccess(false); setPwOpen(false); }, 2000);
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

  const initials = getInitials(user?.name ?? '');

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-5 pb-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-muted/70 dark:bg-white/5 flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
        >
          <ChevronRight size={18} className="text-foreground rotate-180" />
        </button>
        <h2 className="text-foreground text-lg font-bold">Meu perfil</h2>
      </div>

      {/* Avatar + name */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="premium-surface rounded-3xl p-6 flex flex-col items-center text-center gap-3"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
          {initials}
        </div>
        <div>
          <p className="text-foreground font-bold text-lg leading-tight">{user?.name}</p>
          <p className="text-muted-foreground text-sm mt-0.5">{user?.email}</p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
            <Shield size={10} /> Locatário
          </span>
        </div>
      </motion.div>

      {/* Tenant data */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="premium-surface rounded-2xl divide-y divide-border overflow-hidden"
        >
          {[
            { icon: User,     color: 'text-violet-400', label: 'Nome completo', value: profile.name },
            { icon: Mail,     color: 'text-blue-400',   label: 'E-mail',        value: profile.email },
            { icon: Phone,    color: 'text-emerald-400',label: 'Telefone',      value: profile.phone },
            { icon: CreditCard, color: 'text-orange-400', label: 'CPF',         value: profile.cpf },
            { icon: Calendar, color: 'text-slate-400',  label: 'Locatário desde', value: formatDate(profile.joinedAt) },
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
      )}

      {/* Property + contract summary */}
      {(property || contract) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="premium-surface rounded-2xl divide-y divide-border overflow-hidden"
        >
          {property && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
                <Home size={15} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-xs">Imóvel</p>
                <p className="text-foreground font-medium text-sm truncate">{property.name}</p>
                <p className="text-muted-foreground text-xs truncate">{property.address}</p>
              </div>
            </div>
          )}
          {contract && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
                <CreditCard size={15} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-xs">Aluguel mensal</p>
                <p className="text-foreground font-medium text-sm">{formatCurrency(contract.rentAmount)}</p>
              </div>
            </div>
          )}
        </motion.div>
      )}

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
          <ChevronRight
            size={16}
            className={`text-muted-foreground transition-transform duration-200 ${pwOpen ? 'rotate-90' : ''}`}
          />
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
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setPwError(''); }}
                        placeholder="Nova senha (mín. 6 caracteres)"
                        className="w-full pl-9 pr-10 py-2.5 bg-muted/70 dark:bg-[#111827] border border-border rounded-xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50 transition-colors"
                      />
                      <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirm}
                        onChange={e => { setConfirm(e.target.value); setPwError(''); }}
                        placeholder="Confirmar nova senha"
                        className={`w-full pl-9 pr-10 py-2.5 bg-muted/70 dark:bg-[#111827] border rounded-xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none transition-colors ${
                          mismatch ? 'border-red-500/60' : 'border-border focus:border-violet-500/50'
                        }`}
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

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
                      className="w-full py-2.5 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
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

      {/* Theme toggle */}
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
            {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          </span>
          <span className="text-xs text-muted-foreground">{theme === 'dark' ? 'Dark' : 'Light'}</span>
        </button>
      </motion.div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      >
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-500/25 bg-red-500/8 hover:bg-red-500/15 text-red-400 text-sm font-semibold transition-colors"
        >
          <LogOut size={16} /> Sair da conta
        </button>
      </motion.div>
    </motion.div>
  );
}
