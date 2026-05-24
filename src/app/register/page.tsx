'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, User, Mail, Phone, CreditCard, Lock, Eye, EyeOff,
  ArrowRight, AlertCircle, CheckCircle2, Check,
} from 'lucide-react';
import { setStoredSession } from '@/lib/session';
import type { User as UserType } from '@/types';

const BENEFITS = [
  'Gestão completa de imóveis e contratos',
  'Assinaturas digitais seguras',
  'Dashboard financeiro em tempo real',
  'Notificações automáticas para inquilinos',
  'Relatórios e análises avançadas',
  '7 dias grátis — sem cartão de crédito',
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', cpf: '',
    password: '', confirmPassword: '', terms: false,
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }));
    setError('');
  }

  function formatPhone(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  }

  function formatCpf(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 14);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
    if (d.length <= 11) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
    // CNPJ
    if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
    return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.terms) { setError('Aceite os termos para continuar'); return; }
    if (form.password !== form.confirmPassword) { setError('As senhas não coincidem'); return; }
    if (form.password.length < 8) { setError('Senha deve ter pelo menos 8 caracteres'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, terms: form.terms }),
      });
      const data = await res.json() as { user?: UserType; accessToken?: string; error?: string };
      if (!res.ok) { setError(data.error ?? 'Erro ao criar conta'); return; }
      if (data.user && data.accessToken) {
        setStoredSession(data.user, data.accessToken);
        router.push('/onboarding');
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const inputCls = 'w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500/60 focus:bg-violet-500/5 transition-all';

  return (
    <div className="min-h-screen bg-[#070B14] flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-600/15 rounded-full blur-[100px] translate-x-1/4 translate-y-1/4" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <span className="text-white text-xl font-bold">Equi<span className="text-gradient">lino</span></span>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Gerencie seus<br />
            imóveis com<br />
            <span className="text-gradient">inteligência.</span>
          </h2>
          <p className="text-white/50 text-base mb-8">
            A plataforma mais completa para proprietários e imobiliárias do Brasil.
          </p>
          <ul className="space-y-3">
            {BENEFITS.map(b => (
              <li key={b} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-violet-400" />
                </div>
                <span className="text-white/70 text-sm">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="flex -space-x-2">
            {['seed=Maria', 'seed=Joao', 'seed=Pedro', 'seed=Lucia'].map(s => (
              <img
                key={s}
                src={`https://api.dicebear.com/7.x/avataaars/svg?${s}`}
                alt=""
                className="w-8 h-8 rounded-full border-2 border-[#070B14] bg-violet-900"
              />
            ))}
          </div>
          <div>
            <p className="text-white/80 text-xs font-semibold">+2.400 proprietários confiam</p>
            <p className="text-white/40 text-xs">no Equilino para gerir seus imóveis</p>
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center mx-auto mb-3">
            <Building2 size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Equi<span className="text-gradient">lino</span></h1>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">Criar conta grátis</h2>
            <p className="text-white/50 text-sm">7 dias de teste grátis. Sem cartão de crédito.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs text-white/50 font-medium mb-1.5 block">Nome completo</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Seu nome completo"
                  className={inputCls}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs text-white/50 font-medium mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="seu@email.com"
                  className={inputCls}
                  required
                />
              </div>
            </div>

            {/* Phone + CPF */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/50 font-medium mb-1.5 block">Telefone</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => set('phone', formatPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    className={inputCls}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-white/50 font-medium mb-1.5 block">CPF / CNPJ</label>
                <div className="relative">
                  <CreditCard size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={form.cpf}
                    onChange={e => set('cpf', formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    className={inputCls}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs text-white/50 font-medium mb-1.5 block">Senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className={`${inputCls} pr-12`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.password.length > 0 && (
                <div className="mt-1.5 flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                        form.password.length >= i * 2
                          ? i <= 2 ? 'bg-red-500' : i === 3 ? 'bg-amber-500' : 'bg-green-500'
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-xs text-white/50 font-medium mb-1.5 block">Confirmar senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={e => set('confirmPassword', e.target.value)}
                  placeholder="Repita a senha"
                  className={`${inputCls} pr-12`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                {form.confirmPassword.length > 0 && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    {form.password === form.confirmPassword
                      ? <CheckCircle2 size={14} className="text-green-400" />
                      : <AlertCircle size={14} className="text-red-400" />}
                  </div>
                )}
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <button
                type="button"
                role="checkbox"
                aria-checked={form.terms}
                onClick={() => set('terms', !form.terms)}
                className={`w-5 h-5 rounded-md border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                  form.terms
                    ? 'bg-violet-500 border-violet-500'
                    : 'border-white/20 bg-white/5 group-hover:border-violet-500/40'
                }`}
              >
                {form.terms && <Check size={11} className="text-white" />}
              </button>
              <span className="text-white/50 text-xs leading-relaxed">
                Li e aceito os{' '}
                <a href="#" className="text-violet-400 hover:underline">Termos de Uso</a>
                {' '}e a{' '}
                <a href="#" className="text-violet-400 hover:underline">Política de Privacidade</a>
              </span>
            </label>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                <AlertCircle size={13} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 gradient-accent rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 glow-accent disabled:opacity-70 active:scale-[0.98] transition-[opacity,transform] duration-150 mt-2"
            >
              {loading ? (
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-white dot-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              ) : (
                <>
                  Criar conta grátis
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <p className="text-center text-white/40 text-xs">
              Já tem uma conta?{' '}
              <Link href="/" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                Entrar
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
