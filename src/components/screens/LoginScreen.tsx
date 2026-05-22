'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Building2, ArrowRight, Globe } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('lucas@equilino.com.br');
  const [password, setPassword] = useState('••••••••');

  const handleLogin = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    onLogin();
  };

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
        {/* Logo — visible immediately */}
        <div className="text-center mb-10">
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
          <p className="text-muted-foreground text-sm mt-1">
            Bem-vindo de volta
          </p>
        </div>

        {/* Card — visible immediately */}
        <motion.div
          initial={{ y: 16 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
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
                onChange={e => setEmail(e.target.value)}
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
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3.5 bg-muted/70 dark:bg-white/5 border border-border rounded-2xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/60 focus:bg-violet-500/5 transition-all"
              />
              <button
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              Esqueci a senha
            </button>
          </div>

          {/* Login button */}
          <motion.button
            onClick={handleLogin}
            disabled={loading}
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
              <>Entrar <ArrowRight size={16} /></>
            )}
          </motion.button>
        </motion.div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-5">
          <div className="flex-1 h-px bg-muted/70 dark:bg-white/5" />
          <span className="text-muted-foreground text-xs">ou continue com</span>
          <div className="flex-1 h-px bg-muted/70 dark:bg-white/5" />
        </div>

        {/* Social */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Google', bg: 'from-red-500/10 to-red-600/5', border: 'border-red-500/15', text: 'text-red-400' },
            { label: 'Microsoft', bg: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-500/15', text: 'text-blue-400' },
          ].map(s => (
            <button key={s.label}
              className={`flex items-center justify-center gap-2 py-3 rounded-2xl border bg-gradient-to-br ${s.bg} ${s.border} text-sm font-medium ${s.text} hover:opacity-90 transition-opacity`}
            >
              <Globe size={15} />
              {s.label}
            </button>
          ))}
        </div>

        <p className="text-center text-muted-foreground text-xs mt-6">
          Não tem conta?{' '}
          <button className="text-violet-400 font-medium hover:text-violet-300 transition-colors">
            Criar conta grátis
          </button>
        </p>
      </div>
    </div>
  );
}
