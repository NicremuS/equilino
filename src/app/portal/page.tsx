'use client';
import { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, Home, ArrowRight, AlertCircle, KeyRound, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { TenantShell } from '@/components/layout/TenantShell';
import { useAppStore } from '@/store/useAppStore';
import type { User } from '@/types';

type PortalState = 'login' | 'app';

export default function TenantPortalPage() {
  const [portalState, setPortalState] = useState<PortalState>('login');
  const { user, setUser, setAccessToken, setMustChangePassword } = useAppStore();

  // If Zustand loses user while in app (e.g. logout), go back to login
  useEffect(() => {
    if (!user && portalState === 'app') setPortalState('login');
  }, [user, portalState]);

  function handleLogin(u: User, token: string, mustChange = false) {
    setUser(u);
    setAccessToken(token);
    setMustChangePassword(mustChange);
    setPortalState('app');
  }

  if (portalState === 'app') {
    return <TenantShell />;
  }

  return <TenantLoginForm onLogin={handleLogin} />;
}

// ─── Login form ───────────────────────────────────────────────────────────────

interface LoginFormProps {
  onLogin: (u: User, token: string, mustChange?: boolean) => void;
}

function TenantLoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError]       = useState('');

  async function doLogin(e: string, p: string, isDemo = false) {
    if (isDemo) setDemoLoading(true);
    else setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e, password: p }),
      });

      const data = await res.json().catch(() => ({})) as {
        user?: User; accessToken?: string; mustChangePassword?: boolean; error?: string;
      };

      if (!res.ok) {
        setError(data.error ?? 'Email ou senha incorretos.');
        return;
      }

      if (data.user?.role !== 'tenant') {
        setError('Este portal é exclusivo para inquilinos.');
        return;
      }

      onLogin(data.user, data.accessToken!, data.mustChangePassword);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
      setDemoLoading(false);
    }
  }

  function handleSubmit() {
    if (!email || !password) { setError('Preencha o email e a senha.'); return; }
    doLogin(email, password);
  }

  const busy = loading || demoLoading;

  return (
    <div className="min-h-screen bg-[#060d0e] flex flex-col items-center justify-center p-5 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-600/12 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-800/10 rounded-full blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="w-full max-w-sm relative z-10">

        {/* Back to landlord login */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-white/30 hover:text-white/60 text-xs mb-8 transition-colors"
        >
          <ChevronLeft size={13} />
          Área do locador
        </Link>

        {/* Logo */}
        <div className="text-center mb-8 animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 mx-auto mb-4 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <KeyRound size={28} className="text-emerald-400" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Portal do <span className="text-emerald-400">Inquilino</span>
          </h1>
          <p className="text-white/40 text-sm mt-1">Pagamentos, contratos e muito mais</p>
        </div>

        {/* Demo quick access */}
        <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.08s', animationFillMode: 'both' }}>
          <p className="text-xs text-white/30 text-center mb-2.5 font-medium">Acesso demo</p>
          <button
            onClick={() => doLogin('ana@equilino.app', 'demo1234', true)}
            disabled={busy}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl border bg-gradient-to-br from-emerald-500/10 to-teal-600/5 border-emerald-500/20 hover:opacity-90 active:scale-[0.97] transition-[opacity,transform] disabled:opacity-60"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/15 border border-emerald-500/20 flex-shrink-0">
              {demoLoading ? (
                <div className="flex gap-0.5">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1 h-1 rounded-full bg-emerald-400 dot-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              ) : (
                <Home size={16} className="text-emerald-400" />
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-emerald-400">Inquilino Demo</p>
              <p className="text-white/30 text-xs">ana@equilino.app</p>
            </div>
            <ArrowRight size={14} className="text-emerald-400/50 ml-auto" />
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-white/25 text-xs">ou entre com seu email</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        {/* Form */}
        <div
          className="bg-white/3 border border-white/8 rounded-3xl p-6 space-y-4 animate-fade-up"
          style={{ animationDelay: '0.12s', animationFillMode: 'both' }}
        >
          {/* Email */}
          <div>
            <label className="text-xs text-white/40 font-medium mb-2 block">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="seu@email.com"
                className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs text-white/40 font-medium mb-2 block">Senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all"
              />
              <button
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 animate-fade-up">
              <AlertCircle size={13} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_28px_rgba(16,185,129,0.45)] disabled:opacity-60 active:scale-[0.98] transition-all mt-1"
          >
            {loading ? (
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-white dot-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            ) : (
              <>
                <KeyRound size={15} />
                Entrar no portal
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-white/20 text-xs mt-6 animate-fade-up" style={{ animationDelay: '0.18s', animationFillMode: 'both' }}>
          Não tem acesso? Contate seu locador.
        </p>
      </div>
    </div>
  );
}
