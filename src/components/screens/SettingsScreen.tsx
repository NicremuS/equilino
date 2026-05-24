'use client';
import { useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
  User, Bell, Shield, CreditCard, HelpCircle, LogOut,
  ChevronRight, Moon, Sun, Smartphone, Globe, Star, X,
  CheckCircle2, Lock, Download, ExternalLink, Loader2, AlertCircle,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getInitials } from '@/lib/utils';

type ModalKey = 'perfil' | 'segurança' | 'plano' | 'ajuda' | 'pwa' | null;

export function SettingsScreen() {
  const { user, theme, toggleTheme, setActiveTab, logout, setUser, accessToken } = useAppStore();
  const [modal, setModal] = useState<ModalKey>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    logout();
  }

  function openModal(key: ModalKey) {
    if (key === 'perfil') {
      setEditName(user?.name ?? '');
      setEditEmail(user?.email ?? '');
      setProfileError('');
    }
    setModal(key);
  }

  async function saveProfile() {
    if (!user || !editName.trim()) return;
    setProfileSaving(true);
    setProfileError('');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ name: editName.trim(), email: editEmail.trim() || user.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.error ?? 'Erro ao salvar perfil');
        return;
      }
      setUser({ ...user, name: data.user.name, email: data.user.email });
      setModal(null);
    } catch {
      setProfileError('Falha de conexão. Tente novamente.');
    } finally {
      setProfileSaving(false);
    }
  }

  const sections = [
    {
      title: 'Conta',
      items: [
        {
          icon: User, label: 'Perfil', desc: `${user?.name ?? '—'} · ${user?.email ?? '—'}`,
          color: 'text-violet-400 bg-violet-500/10', action: () => openModal('perfil'),
        },
        {
          icon: Bell, label: 'Notificações', desc: 'Push, email, SMS',
          color: 'text-blue-400 bg-blue-500/10', action: () => setActiveTab('notifications'),
        },
        {
          icon: Shield, label: 'Segurança', desc: 'Senha, 2FA, sessões',
          color: 'text-green-400 bg-green-500/10', action: () => setModal('segurança'),
        },
      ],
    },
    {
      title: 'App',
      items: [
        {
          icon: theme === 'dark' ? Sun : Moon,
          label: 'Aparência',
          desc: theme === 'dark' ? 'Modo escuro ativo' : 'Modo claro ativo',
          color: 'text-purple-400 bg-purple-500/10',
          action: toggleTheme,
        },
        {
          icon: Globe, label: 'Idioma e região', desc: 'Português (BR)',
          color: 'text-cyan-400 bg-cyan-500/10', action: () => setModal('ajuda'),
        },
        {
          icon: Smartphone, label: 'App móvel', desc: 'Instalar no celular',
          color: 'text-orange-400 bg-orange-500/10', action: () => setModal('pwa'),
        },
      ],
    },
    {
      title: 'Plano',
      items: [
        {
          icon: CreditCard, label: 'Assinatura', desc: 'Plano Pro · Ativo',
          color: 'text-yellow-400 bg-yellow-500/10', action: () => setModal('plano'),
        },
        {
          icon: Star, label: 'Upgrade', desc: 'Conheça o Enterprise',
          color: 'text-amber-400 bg-amber-500/10', action: () => setModal('plano'),
        },
      ],
    },
    {
      title: 'Suporte',
      items: [
        {
          icon: HelpCircle, label: 'Ajuda e suporte', desc: 'Central de ajuda, FAQ',
          color: 'text-gray-400 bg-gray-500/10', action: () => setModal('ajuda'),
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 pb-2">
      {/* Profile hero */}
      <motion.button
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        onClick={() => setModal('perfil')}
        className="w-full premium-surface rounded-3xl p-5 flex items-center gap-4 text-left hover:border-violet-500/25 transition-colors"
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center text-xl font-bold text-white glow-accent">
            {user ? getInitials(user.name) : 'U'}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-card flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-bold text-base">{user?.name}</p>
          <p className="text-muted-foreground text-xs mt-0.5">{user?.email}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-500/20">
            <Star size={10} className="text-violet-400" fill="currentColor" />
            <span className="text-violet-400 text-xs font-semibold">Plano Pro</span>
          </div>
        </div>
        <ChevronRight size={16} className="text-muted-foreground" />
      </motion.button>

      {sections.map((section, si) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + si * 0.07 }}
        >
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">{section.title}</p>
          <div className="premium-surface rounded-2xl overflow-hidden divide-y divide-border">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted/60 dark:hover:bg-white/[0.03] transition-colors text-left"
                >
                  <div className={`p-2 rounded-xl flex-shrink-0 ${item.color}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm font-medium">{item.label}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{item.desc}</p>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* Logout */}
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-colors"
      >
        <LogOut size={16} />
        Sair da conta
      </motion.button>

      <p className="text-center text-muted-foreground text-xs pb-2">Equilino v1.0.0 · Feito com ❤️</p>

      {/* ── Modais ── */}
      <AnimatePresence>
        {modal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55]"
              onClick={() => setModal(null)}
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="fixed bottom-0 left-0 right-0 z-[60] premium-surface rounded-t-3xl"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {modal === 'perfil' && (
                <div className="px-6 pb-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-foreground font-bold text-base">Perfil</p>
                    <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-muted/70 dark:bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <label className="space-y-1.5 block" htmlFor="settings-name">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome</span>
                      <input
                        id="settings-name"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="premium-field w-full rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25"
                      />
                    </label>
                    <label className="space-y-1.5 block" htmlFor="settings-email">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email</span>
                      <input
                        id="settings-email"
                        type="email"
                        value={editEmail}
                        onChange={e => setEditEmail(e.target.value)}
                        className="premium-field w-full rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25"
                      />
                    </label>
                    {profileError && (
                      <p className="text-red-400 text-xs flex items-center gap-1.5">
                        <AlertCircle size={12} /> {profileError}
                      </p>
                    )}
                    <button
                      onClick={saveProfile}
                      disabled={!editName.trim() || profileSaving}
                      className="w-full gradient-accent text-white font-semibold text-sm py-3.5 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {profileSaving ? <><Loader2 size={15} className="animate-spin" /> Salvando…</> : 'Salvar alterações'}
                    </button>
                  </div>
                </div>
              )}

              {modal === 'segurança' && (
                <div className="px-6 pb-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-foreground font-bold text-base">Segurança</p>
                    <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-muted/70 dark:bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground">
                      <X size={14} />
                    </button>
                  </div>
                  {[
                    { icon: Lock, label: 'Alterar senha', desc: 'Última alteração há 30 dias' },
                    { icon: Shield, label: 'Autenticação em 2 fatores', desc: 'Não configurado' },
                    { icon: ExternalLink, label: 'Sessões ativas', desc: '1 dispositivo' },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <button key={item.label} className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-border hover:border-violet-500/25 transition-colors text-left">
                        <div className="p-2 rounded-xl bg-muted/70 dark:bg-white/5 flex-shrink-0">
                          <Icon size={15} className="text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-foreground text-sm font-medium">{item.label}</p>
                          <p className="text-muted-foreground text-xs mt-0.5">{item.desc}</p>
                        </div>
                        <ChevronRight size={14} className="text-muted-foreground ml-auto" />
                      </button>
                    );
                  })}
                </div>
              )}

              {modal === 'plano' && (
                <div className="px-6 pb-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-foreground font-bold text-base">Plano atual</p>
                    <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-muted/70 dark:bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="rounded-2xl border border-violet-500/25 bg-violet-500/8 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star size={16} className="text-violet-400" fill="currentColor" />
                      <p className="text-violet-400 font-bold">Plano Pro</p>
                    </div>
                    <div className="space-y-1.5">
                      {['Imóveis ilimitados', 'Inquilinos ilimitados', 'Relatórios avançados', 'Suporte prioritário'].map(f => (
                        <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 size={11} className="text-violet-400" />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button className="w-full gradient-accent text-white font-semibold text-sm py-3.5 rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    <Star size={14} /> Ver Enterprise
                  </button>
                </div>
              )}

              {modal === 'ajuda' && (
                <div className="px-6 pb-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-foreground font-bold text-base">Ajuda & Suporte</p>
                    <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-muted/70 dark:bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground">
                      <X size={14} />
                    </button>
                  </div>
                  {[
                    { label: 'Central de ajuda', desc: 'Artigos e tutoriais', icon: HelpCircle },
                    { label: 'Falar com suporte', desc: 'Chat ou email', icon: Bell },
                    { label: 'Reportar problema', desc: 'Envie um bug report', icon: Shield },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <button key={item.label} className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-border hover:border-violet-500/25 transition-colors text-left">
                        <div className="p-2 rounded-xl bg-muted/70 dark:bg-white/5 flex-shrink-0">
                          <Icon size={15} className="text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-foreground text-sm font-medium">{item.label}</p>
                          <p className="text-muted-foreground text-xs mt-0.5">{item.desc}</p>
                        </div>
                        <ExternalLink size={13} className="text-muted-foreground ml-auto" />
                      </button>
                    );
                  })}
                </div>
              )}

              {modal === 'pwa' && (
                <div className="px-6 pb-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-foreground font-bold text-base">Instalar app</p>
                    <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-muted/70 dark:bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="rounded-2xl border border-border p-4 space-y-2">
                      <p className="text-foreground font-semibold text-sm">iPhone / iPad (Safari)</p>
                      <ol className="space-y-1 text-xs">
                        <li>1. Toque no ícone de compartilhar <span className="font-mono bg-muted/70 dark:bg-white/5 px-1 rounded">⬆</span></li>
                        <li>2. Role e toque em &ldquo;Adicionar à Tela de Início&rdquo;</li>
                        <li>3. Confirme tocando em &ldquo;Adicionar&rdquo;</li>
                      </ol>
                    </div>
                    <div className="rounded-2xl border border-border p-4 space-y-2">
                      <p className="text-foreground font-semibold text-sm">Android (Chrome)</p>
                      <ol className="space-y-1 text-xs">
                        <li>1. Toque no menu <span className="font-mono bg-muted/70 dark:bg-white/5 px-1 rounded">⋮</span> do Chrome</li>
                        <li>2. Toque em &ldquo;Adicionar à tela inicial&rdquo;</li>
                        <li>3. Confirme tocando em &ldquo;Adicionar&rdquo;</li>
                      </ol>
                    </div>
                  </div>
                  <button
                    onClick={() => setModal(null)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-muted/70 dark:bg-white/5 border border-border text-muted-foreground text-sm font-semibold hover:text-foreground transition-colors"
                  >
                    <Download size={14} /> Entendido
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
