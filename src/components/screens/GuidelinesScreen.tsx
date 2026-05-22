'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tip {
  id: string;
  emoji: string;
  text: string;
  category: string;
}

const sections: { label: string; tips: Tip[] }[] = [
  {
    label: 'Limpeza',
    tips: [
      { id: 'l1', emoji: '🍳', text: 'Limpe o fogão após cozinhar', category: 'limpeza' },
      { id: 'l2', emoji: '🍽️', text: 'Não deixe louça acumulada na pia', category: 'limpeza' },
      { id: 'l3', emoji: '🚿', text: 'Seque o box após o banho para evitar mofo', category: 'limpeza' },
      { id: 'l4', emoji: '🌬️', text: 'Ventile os ambientes abrindo janelas diariamente', category: 'limpeza' },
      { id: 'l5', emoji: '🧹', text: 'Varre e passe pano no chão pelo menos uma vez por semana', category: 'limpeza' },
    ],
  },
  {
    label: 'Descarte',
    tips: [
      { id: 'd1', emoji: '🛢️', text: 'Não jogue óleo de cozinha na pia — guarde em garrafa PET', category: 'descarte' },
      { id: 'd2', emoji: '🚽', text: 'Não jogue papel nem absorvente no vaso sanitário', category: 'descarte' },
      { id: 'd3', emoji: '♻️', text: 'Separe o lixo reciclável do orgânico', category: 'descarte' },
      { id: 'd4', emoji: '🗑️', text: 'Coloque o lixo na calçada somente no dia e horário da coleta', category: 'descarte' },
    ],
  },
  {
    label: 'Conservação',
    tips: [
      { id: 'c1', emoji: '💧', text: 'Comunique vazamentos assim que notar — não espere piorar', category: 'conservacao' },
      { id: 'c2', emoji: '🪟', text: 'Não pregue pregos nem faça furos sem autorização', category: 'conservacao' },
      { id: 'c3', emoji: '🐜', text: 'Mantenha alimentos bem vedados para evitar insetos', category: 'conservacao' },
      { id: 'c4', emoji: '🌿', text: 'Esvazie os pratos dos vasos após chuva — evita dengue', category: 'conservacao' },
    ],
  },
  {
    label: 'Convivência',
    tips: [
      { id: 'v1', emoji: '🔇', text: 'Evite barulho excessivo após as 22h', category: 'convivencia' },
      { id: 'v2', emoji: '🐕', text: 'Recolha os dejetos do pet imediatamente', category: 'convivencia' },
      { id: 'v3', emoji: '🚗', text: 'Respeite as vagas e áreas comuns do condomínio', category: 'convivencia' },
      { id: 'v4', emoji: '🧺', text: 'Não estenda roupas em janelas ou sacadas voltadas para a rua', category: 'convivencia' },
    ],
  },
];

const allTips = sections.flatMap(s => s.tips);

export function GuidelinesScreen() {
  const [done, setDone] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setDone(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const total = allTips.length;
  const doneCount = done.size;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="space-y-5 pb-2">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-foreground text-xl font-bold">Boas Práticas</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Dicas para manter o imóvel em dia</p>
        </div>
        <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center glow-accent">
          <Sparkles size={18} className="text-white" />
        </div>
      </motion.div>

      {/* Progress */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        className="premium-surface rounded-2xl p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-white text-sm font-semibold">{doneCount} de {total} marcados</p>
          <span className="text-violet-400 text-sm font-bold">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted/70 dark:bg-white/5 overflow-hidden">
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full rounded-full gradient-accent"
          />
        </div>
      </motion.div>

      {/* Sections */}
      {sections.map((section, si) => (
        <motion.div
          key={section.label}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + si * 0.05 }}
          className="space-y-2"
        >
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider px-1">
            {section.label}
          </p>
          {section.tips.map((tip, i) => {
            const isDone = done.has(tip.id);
            return (
              <motion.button
                key={tip.id}
                layout
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: isDone ? 0.5 : 1, x: 0 }}
                transition={{ delay: si * 0.05 + i * 0.04, layout: { duration: 0.2 } }}
                onClick={() => toggle(tip.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-colors',
                  isDone
                    ? 'border-green-500/20 bg-green-500/5'
                    : 'border-premium bg-card hover:border-violet-500/25'
                )}
              >
                <span className="text-xl flex-shrink-0 leading-none">{tip.emoji}</span>
                <p className={cn(
                  'flex-1 text-sm leading-snug',
                  isDone ? 'text-green-300 line-through' : 'text-white'
                )}>
                  {tip.text}
                </p>
                {isDone
                  ? <CheckCircle2 size={18} className="text-green-400 flex-shrink-0" />
                  : <Circle size={18} className="text-gray-700 flex-shrink-0" />
                }
              </motion.button>
            );
          })}
        </motion.div>
      ))}
    </div>
  );
}
