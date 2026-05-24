'use client';
import { useState } from 'react';
import { m as motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { tenantApi } from '@/services/tenantApi';
import { useAppStore } from '@/store/useAppStore';

export function ChangePasswordModal() {
  const setMustChangePassword = useAppStore(s => s.setMustChangePassword);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const mismatch = confirm.length > 0 && password !== confirm;
  const valid = password.length >= 6 && password === confirm;

  async function handleSubmit() {
    if (!valid) return;
    setLoading(true);
    setError('');
    try {
      await tenantApi.changePassword(password);
      setMustChangePassword(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="w-full max-w-sm premium-surface rounded-3xl p-6 space-y-5"
      >
        {/* Icon + header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
            <ShieldCheck size={28} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-foreground font-bold text-lg">Defina sua senha</h2>
            <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
              Sua senha padrão precisa ser alterada antes de continuar.
            </p>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Nova senha</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-9 pr-10 py-3 bg-muted/70 dark:bg-[#111827] border border-border rounded-2xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/60 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Confirmar senha</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(''); }}
                placeholder="Repita a nova senha"
                className={`w-full pl-9 pr-10 py-3 bg-muted/70 dark:bg-[#111827] border rounded-2xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none transition-all ${
                  mismatch ? 'border-red-500/60 focus:border-red-500/60' : 'border-border focus:border-emerald-500/60'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {mismatch && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={11} /> As senhas não coincidem
              </p>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-xs flex items-center gap-1.5">
              <AlertCircle size={12} /> {error}
            </p>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={!valid || loading}
          className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Salvar senha e continuar'}
        </motion.button>
      </motion.div>
    </div>
  );
}
