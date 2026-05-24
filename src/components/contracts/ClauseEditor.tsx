'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Trash2, Plus, GripVertical, Sparkles, Lock } from 'lucide-react';
import type { ContractClause, ClauseCategory } from '@/types';
import { cn } from '@/lib/utils';

const CATEGORY_LABELS: Record<ClauseCategory, { label: string; color: string }> = {
  general:     { label: 'Geral',          color: 'bg-violet-500/15 text-violet-400' },
  payment:     { label: 'Pagamento',      color: 'bg-emerald-500/15 text-emerald-400' },
  rules:       { label: 'Regras',         color: 'bg-amber-500/15 text-amber-400' },
  maintenance: { label: 'Manutenção',     color: 'bg-blue-500/15 text-blue-400' },
  termination: { label: 'Rescisão',       color: 'bg-red-500/15 text-red-400' },
  custom:      { label: 'Personalizado',  color: 'bg-zinc-500/15 text-zinc-400' },
};

const AI_SUGGESTIONS: ContractClause[] = [
  {
    id: 'ai-1', title: 'Limpeza e Conservação',
    content: 'O LOCATÁRIO se compromete a manter o imóvel em perfeitas condições de higiene e conservação, responsabilizando-se pelos danos causados por uso indevido ou negligência.',
    category: 'rules', order: 99, required: false,
  },
  {
    id: 'ai-2', title: 'Seguro Incêndio',
    content: 'O LOCATÁRIO deverá contratar seguro contra incêndio do imóvel no prazo de 30 dias a contar da assinatura deste contrato, mantendo-o vigente durante toda a locação.',
    category: 'general', order: 99, required: false,
  },
  {
    id: 'ai-3', title: 'Benfeitorias e Reformas',
    content: 'O LOCATÁRIO não poderá realizar obras, reformas ou benfeitorias no imóvel sem prévia autorização escrita do LOCADOR. As benfeitorias úteis ou necessárias serão indenizadas somente se previamente autorizadas.',
    category: 'maintenance', order: 99, required: false,
  },
  {
    id: 'ai-4', title: 'Multa por Rescisão Antecipada',
    content: 'Em caso de rescisão antecipada deste contrato, a parte infratora pagará à parte inocente multa equivalente a 3 (três) meses de aluguel vigente à época da infração, calculada proporcionalmente ao período remanescente.',
    category: 'termination', order: 99, required: false,
  },
  {
    id: 'ai-5', title: 'Vistoria de Entrega',
    content: 'Na desocupação do imóvel, será realizada vistoria de saída, devendo o imóvel ser entregue nas mesmas condições da vistoria de entrada, salvo o desgaste natural do uso regular.',
    category: 'general', order: 99, required: false,
  },
];

interface Props {
  clauses: ContractClause[];
  onChange: (clauses: ContractClause[]) => void;
}

export function ClauseEditor({ clauses, onChange }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const updateClause = (id: string, patch: Partial<ContractClause>) => {
    onChange(clauses.map(c => c.id === id ? { ...c, ...patch } : c));
  };

  const removeClause = (id: string) => {
    onChange(clauses.filter(c => c.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const moveClause = (id: string, direction: 'up' | 'down') => {
    const idx = clauses.findIndex(c => c.id === id);
    if (idx === -1) return;
    const newClauses = [...clauses];
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= newClauses.length) return;
    [newClauses[idx], newClauses[target]] = [newClauses[target], newClauses[idx]];
    onChange(newClauses.map((c, i) => ({ ...c, order: i })));
  };

  const addBlankClause = () => {
    const newClause: ContractClause = {
      id: crypto.randomUUID(),
      title: 'Nova Cláusula',
      content: '',
      category: 'custom',
      order: clauses.length,
      required: false,
    };
    onChange([...clauses, newClause]);
    setExpandedId(newClause.id);
  };

  const addSuggestion = (s: ContractClause) => {
    if (clauses.some(c => c.title === s.title)) return;
    onChange([...clauses, { ...s, id: crypto.randomUUID(), order: clauses.length }]);
  };

  return (
    <div className="space-y-3">
      {/* Clause list */}
      <div className="space-y-2">
        {clauses.map((clause, idx) => {
          const catCfg = CATEGORY_LABELS[clause.category];
          const isExpanded = expandedId === clause.id;

          return (
            <motion.div
              key={clause.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="premium-surface rounded-2xl overflow-hidden"
            >
              {/* Header */}
              <div
                className="flex items-center gap-2 px-4 py-3 cursor-pointer group"
                onClick={() => setExpandedId(isExpanded ? null : clause.id)}
              >
                <GripVertical size={14} className="text-muted-foreground/40 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground truncate">{clause.title || 'Sem título'}</span>
                    {clause.required && <Lock size={11} className="text-amber-400 flex-shrink-0" />}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${catCfg.color}`}>
                      {catCfg.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button type="button" onClick={e => { e.stopPropagation(); moveClause(clause.id, 'up'); }}
                    disabled={idx === 0} className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                    <ChevronUp size={14} />
                  </button>
                  <button type="button" onClick={e => { e.stopPropagation(); moveClause(clause.id, 'down'); }}
                    disabled={idx === clauses.length - 1} className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                    <ChevronDown size={14} />
                  </button>
                  {!clause.required && (
                    <button type="button" onClick={e => { e.stopPropagation(); removeClause(clause.id); }}
                      className="p-1 rounded text-muted-foreground hover:text-red-400 transition-colors ml-1">
                      <Trash2 size={14} />
                    </button>
                  )}
                  <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Expanded editor */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/50">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Título</label>
                        <input
                          type="text"
                          value={clause.title}
                          onChange={e => updateClause(clause.id, { title: e.target.value })}
                          className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-violet-500/50 transition-colors"
                          placeholder="Título da cláusula"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Conteúdo</label>
                        <textarea
                          value={clause.content}
                          onChange={e => updateClause(clause.id, { content: e.target.value })}
                          rows={5}
                          className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-violet-500/50 transition-colors resize-none leading-relaxed"
                          placeholder="Texto da cláusula..."
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground mb-1.5 block">Categoria</label>
                          <select
                            value={clause.category}
                            onChange={e => updateClause(clause.id, { category: e.target.value as ClauseCategory })}
                            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none"
                          >
                            {Object.entries(CATEGORY_LABELS).map(([key, val]) => (
                              <option key={key} value={key}>{val.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={addBlankClause}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/20 rounded-xl text-sm font-medium transition-colors">
          <Plus size={15} />
          Nova cláusula
        </button>
        <button type="button" onClick={() => setShowSuggestions(!showSuggestions)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl text-sm font-medium transition-colors">
          <Sparkles size={15} />
          Sugestões IA
        </button>
      </div>

      {/* AI Suggestions panel */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="premium-surface rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-amber-400" />
                <h4 className="text-sm font-semibold text-foreground">Sugestões de cláusulas</h4>
              </div>
              {AI_SUGGESTIONS.map(s => {
                const alreadyAdded = clauses.some(c => c.title === s.title);
                return (
                  <div key={s.id} className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border transition-all',
                    alreadyAdded
                      ? 'border-emerald-500/20 bg-emerald-500/5 opacity-60'
                      : 'border-border hover:border-amber-500/30 cursor-pointer hover:bg-amber-500/5',
                  )}
                    onClick={() => !alreadyAdded && addSuggestion(s)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.content}</p>
                    </div>
                    {alreadyAdded ? (
                      <span className="text-xs text-emerald-400 flex-shrink-0">Adicionado</span>
                    ) : (
                      <Plus size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
