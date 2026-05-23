'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Building2, ArrowRight, AlertCircle, UserCheck, Home } from 'lucide-react';
import type { User } from '@/types';

interface LoginScreenProps {
  onLogin: (user: User, accessToken: string) => void;
}

const DEMO_ACCOUNTS = [
  {
    label: 'Locador',
    sublabel: 'Proprietário',
    email: 'demo@equilino.app',
    password: 'demo1234',
    icon: Building2,
    color: 'text-violet-400',
    bg: 'from-violet-500/10 to-violet-600/5',
    border: 'border-violet-500/20',
  },
  {
    label: 'Locatário',
    sublabel: 'Inquilino',
    email: 'ana@equilino.app',
    password: 'demo1234',
    icon: Home,
    color: 'text-emerald-400',
    bg: 'from-emerald-500/10 to-emerald-600/5',
    border: 'border-emerald-500/20',
  },
] as const;

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function doLogin(e: string, p: string, demoKey?: string) {
    if (demoKey) setDemoLoading(demoKey);
    else setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e, password: p }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? 'Email ou senha incorretos.');
        return;
      }

      const { user, accessToken } = await res.json() as { user: User; accessToken: string };
      onLogin(user, accessToken);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
      setDemoLoading(null);
    }
  }

  function handleLogin() {
    if (!email || !password) {
      setError('Preencha o email e a senha.');
      return;
    }
    doLogin(email, password);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-violet-600/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-800/10 rounded-full blur-[80px]" />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
          style={{ backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, delay: 0.05 }}
            className="w-16 h-16 rounded-2xl gradient-accent mx-auto mb-4 flex items-center justify-center glow-accent"
          >
            <Building2 size={32} className="text-white" strokeWidth={1.5} />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground">
            Equi<span className="text-gradient">lino</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Bem-vindo de volta</p>
        </div>

        {/* Demo quick access */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-4"
        >
          <p className="text-xs text-muted-foreground text-center mb-2.5 font-medium">Acesso demo</p>
          <div className="grid grid-cols-2 gap-2.5">
            {DEMO_ACCOUNTS.map(account => {
              const Icon = account.icon;
              const isLoading = demoLoading === account.email;
              return (
                <motion.button
                  key={account.email}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => doLogin(account.email, account.password, account.email)}
                  disabled={loading || demoLoading !== null}
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border bg-gradient-to-br ${account.bg} ${account.border} hover:opacity-90 transition-opacity disabled:opacity-60 text-left`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${account.bg} border ${account.border}`}>
                    {isLoading ? (
                      <div className="flex gap-0.5">
                        {[0, 1, 2].map(i => (
                          <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                            className={`w-1 h-1 rounded-full ${account.color.replace('text-', 'bg-')}`}
                          />
                        ))}
                      </div>
                    ) : (
                      <Icon size={16} className={account.color} />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${account.color}`}>{account.label}</p>
                    <p className="text-muted-foreground text-xs">{account.sublabel}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground text-xs">ou entre com seu email</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Form card */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.35 }}
          className="premium-surface rounded-3xl p-6 space-y-4"
        >
          {/* Email */}
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-2 block">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="seu@email.com"
                className="w-full pl-10 pr-4 py-3.5 bg-muted/70 dark:bg-white/5 border border-border rounded-2xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/60 focus:bg-violet-500/5 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-2 block">Senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3.5 bg-muted/70 dark:bg-white/5 border border-border rounded-2xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/60 focus:bg-violet-500/5 transition-all"
              />
              <button
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2"
            >
              <AlertCircle size={13} className="flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <div className="flex items-center justify-end">
            <button className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              Esqueci a senha
            </button>
          </div>

          <motion.button
            onClick={handleLogin}
            disabled={loading || demoLoading !== null}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 gradient-accent rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 glow-accent disabled:opacity-70 transition-opacity"
          >
            {loading ? (
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    className="w-1.5 h-1.5 rounded-full bg-white" />
                ))}
              </div>
            ) : (
              <>
                <UserCheck size={16} />
                Entrar
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
