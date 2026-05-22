'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone, Trash2, Leaf, Droplets, Scissors,
  AlertTriangle, CheckCircle2, Volume2, Building2,
  Calendar, Clock, Users, Info, ChevronDown,
  Phone, Shield, Flame, Recycle, Bug, Dumbbell,
  Bell, Send, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateNotification } from '@/hooks/useApi';

type Section = 'coletas' | 'saude' | 'convivencia' | 'areas';

// ─── Data ─────────────────────────────────────────────────────────────────────

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const collections = [
  {
    id: 'lixo',
    title: 'Lixo Comum',
    subtitle: 'Orgânicos e rejeitos não recicláveis',
    icon: Trash2,
    color: 'text-slate-400',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/20',
    activeDays: [1, 3, 5],
    time: '06:00 – 08:00',
    tip: 'Coloque os sacos na calçada somente após as 18h do dia anterior para evitar multa.',
    rules: [
      'Use sacos bem amarrados e resistentes',
      'Não coloque antes das 18h do dia anterior',
      'Não misture com materiais recicláveis',
      'Caixas de papelão devem ir para a coleta seletiva',
    ],
  },
  {
    id: 'seletiva',
    title: 'Coleta Seletiva',
    subtitle: 'Papel, plástico, metal e vidro',
    icon: Recycle,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    activeDays: [2, 4],
    time: '06:00 – 08:00',
    tip: 'Enxugue embalagens antes de descartar. Vidros devem estar embrulhados em papel para segurança dos coletores.',
    rules: [
      'Enxugue embalagens de alimentos antes de descartar',
      'Vidros: embrulhe em jornal ou papel',
      'Caixas de papelão: desdobre e amarre em feixes',
      'Não inclua resíduos orgânicos ou rejeitos',
    ],
  },
  {
    id: 'oleo',
    title: 'Óleo de Cozinha Usado',
    subtitle: 'Descarte especial — não despeje na pia!',
    icon: Droplets,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    activeDays: [5],
    time: '08:00 – 17:00',
    tip: '1 litro de óleo vegetal contamina até 1 milhão de litros de água. O descarte na pia entope a rede de esgoto e prejudica o meio ambiente.',
    rules: [
      'Armazene em garrafas PET bem fechadas quando frio',
      'Leve ao ponto de coleta na portaria toda sexta-feira',
      'São aceitos todos os tipos de óleo vegetal usado',
      'Nunca despeje pela pia, vaso ou lixo comum',
    ],
  },
  {
    id: 'entulho',
    title: 'Poda & Entulho',
    subtitle: 'Agendamento obrigatório pela prefeitura',
    icon: Scissors,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    activeDays: [],
    time: 'Sob agendamento',
    tip: 'Ligue 156 ou acesse o portal da prefeitura para agendar. Descarte de entulho em vias públicas sem agendamento gera multa.',
    rules: [
      'Máximo 1m³ por coleta agendada',
      'Galhos devem estar amarrados em feixes de 1,5m',
      'Não misturar com lixo doméstico ou reciclável',
      'Entulho de obra deve ser descartado em caçambas',
    ],
  },
];

const dengueTips = [
  { id: 'd1', title: 'Pratos de vasos de plantas', description: 'Esvazie pratos após chuvas — são o foco nº 1 em residências. Apenas 5ml de água são suficientes para reprodução.', icon: Leaf },
  { id: 'd2', title: 'Caixas d\'água e cisternas', description: 'Mantenha tampadas e vedadas. Verifique mensalmente a integridade das tampas e telas.', icon: Droplets },
  { id: 'd3', title: 'Calhas, ralos e bueiros', description: 'Limpe periodicamente. Folhas acumuladas formam poças ideais para larvas mesmo sem chuva.', icon: AlertTriangle },
  { id: 'd4', title: 'Garrafas, pneus e recipientes', description: 'Descarte ou guarde emborcados (de cabeça para baixo). Elimine qualquer recipiente que possa acumular água.', icon: Trash2 },
  { id: 'd5', title: 'Repelente e telas de proteção', description: 'Use repelente em atividades externas ao entardecer. Mantenha telas em janelas e portas bem vedadas.', icon: Shield },
];

const noiseSchedule = [
  { period: 'Dias úteis',      days: 'Segunda a Sexta', allowed: '07:00 – 22:00', restricted: '22:00 – 07:00' },
  { period: 'Finais de semana', days: 'Sábado e Domingo', allowed: '09:00 – 22:00', restricted: '22:00 – 09:00' },
  { period: 'Feriados',        days: 'Todos os feriados', allowed: '09:00 – 22:00', restricted: '22:00 – 09:00' },
];

const noiseRules = [
  'Festas e eventos devem ser comunicados à administração com mínimo de 48h de antecedência.',
  'Obras e reformas são permitidas apenas em dias úteis, das 08:00 às 17:00.',
  'TVs, caixas de som e instrumentos musicais não devem ser audíveis no corredor ou em outros apartamentos.',
  'Mudanças: apenas em dias úteis das 08:00 às 18:00, com autorização prévia da portaria.',
  'Em caso de perturbação persistente, contate a administração (11) 9999-0000 ou a Guarda Municipal: 153.',
];

const commonAreas = [
  {
    id: 'salao',
    name: 'Salão de Festas',
    icon: Building2,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    capacity: 60,
    hours: '08:00 – 00:00',
    requiresReservation: true,
    deposit: 'R$ 200,00',
    rules: [
      'Reserva com mínimo 7 dias de antecedência',
      'Limpeza pós-evento é responsabilidade do morador',
      'Depósito devolvido em até 3 dias úteis após vistoria',
      'Proibido uso de fogos de artifício e sinalizadores',
    ],
  },
  {
    id: 'churrasqueira',
    name: 'Churrasqueira',
    icon: Flame,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    capacity: 25,
    hours: '10:00 – 23:00',
    requiresReservation: true,
    deposit: 'R$ 100,00',
    rules: [
      'Reserva com mínimo 48h de antecedência',
      'Limpeza pós-uso obrigatória (grelha, carveira e arredores)',
      'Respeitar horário de silêncio a partir das 22:00',
      'Carvão deve ser descartado completamente resfriado',
    ],
  },
  {
    id: 'piscina',
    name: 'Piscina',
    icon: Droplets,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    capacity: 30,
    hours: '07:00 – 22:00',
    requiresReservation: false,
    deposit: null,
    rules: [
      'Uso de touca obrigatório dentro da piscina',
      'Proibido alimentos e bebidas na área molhada',
      'Crianças até 10 anos: somente com adulto responsável',
      'Ducha obrigatória antes de entrar na piscina',
    ],
  },
  {
    id: 'quadra',
    name: 'Quadra Poliesportiva',
    icon: Users,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    capacity: 20,
    hours: '07:00 – 22:00',
    requiresReservation: false,
    deposit: null,
    rules: [
      'Calçado esportivo fechado obrigatório',
      'Máximo 2h por turno quando houver fila',
      'Reserva antecipada disponível via administração',
      'Respeitar o horário de encerramento às 22:00',
    ],
  },
  {
    id: 'academia',
    name: 'Academia',
    icon: Dumbbell,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    capacity: 10,
    hours: '05:00 – 23:00',
    requiresReservation: false,
    deposit: null,
    rules: [
      'Toalha pessoal obrigatória nos equipamentos',
      'Limpe os aparelhos após o uso com o borrifador disponível',
      'Proibido guardar pertences pessoais nos aparelhos',
      'Uso de cinto e equipamentos de segurança recomendado',
    ],
  },
];

// ─── Collection section ───────────────────────────────────────────────────────

function CollectionSection() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3.5 flex items-start gap-2.5"
      >
        <Info size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-blue-600 dark:text-blue-300 text-xs leading-relaxed">
          Coloque o lixo na calçada <span className="font-semibold">somente após as 18h</span> do dia anterior à coleta. Descarte fora do horário gera multa municipal.
        </p>
      </motion.div>

      {collections.map((col, i) => {
        const Icon = col.icon;
        const isExpanded = expanded === col.id;

        return (
          <motion.div
            key={col.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-2xl border overflow-hidden ${col.border} ${col.bg}`}
          >
            <button
              onClick={() => setExpanded(isExpanded ? null : col.id)}
              className="w-full flex items-start gap-3 p-4 text-left"
            >
              <div className={`p-2.5 rounded-xl ${col.bg} border ${col.border} flex-shrink-0`}>
                <Icon size={16} className={col.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm font-semibold">{col.title}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{col.subtitle}</p>
                <div className="flex gap-1 mt-2.5 flex-wrap">
                  {DAYS.map((day, idx) => (
                    <span
                      key={day}
                      className={cn(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded-md',
                        col.activeDays.includes(idx)
                          ? `${col.bg} ${col.color} border ${col.border}`
                          : 'text-gray-700 bg-muted/60 dark:bg-white/3'
                      )}
                    >
                      {day}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 mt-1.5 text-muted-foreground text-[10px]">
                  <Clock size={9} />
                  <span>{col.time}</span>
                </div>
              </div>
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={14} className="text-gray-500 flex-shrink-0 mt-1" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3">
                    <div className={`p-3 rounded-xl ${col.bg} border ${col.border}`}>
                      <p className={`text-xs font-semibold ${col.color} mb-1`}>Atenção</p>
                      <p className="text-muted-foreground text-xs leading-relaxed">{col.tip}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-2">Regras</p>
                      <div className="space-y-1.5">
                        {col.rules.map((rule, ri) => (
                          <div key={ri} className="flex items-start gap-2">
                            <CheckCircle2 size={11} className={`${col.color} flex-shrink-0 mt-0.5`} />
                            <p className="text-muted-foreground text-xs leading-relaxed">{rule}</p>
                          </div>
                        ))}
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
  );
}

// ─── Dengue/health section ────────────────────────────────────────────────────

function HealthSection() {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setChecked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const allChecked = checked.size === dengueTips.length;

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <Bug size={16} className="text-red-400" />
          <p className="text-red-400 font-bold text-sm">Alerta Dengue</p>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          O Brasil registra os maiores índices de dengue no verão. A prevenção começa em casa — focos d&apos;água em recipientes pequenos são suficientes para a reprodução do <span className="text-red-400 font-semibold">Aedes aegypti</span>.
        </p>
      </motion.div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { value: '7 dias', label: 'Ciclo larval do mosquito', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          { value: '80%', label: 'Dos focos estão em residências', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
          { value: '5 ml', label: 'De água já forma um foco', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
        ].map((stat, i) => (
          <motion.div
            key={stat.value}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
            className={`rounded-2xl border p-3 ${stat.bg}`}
          >
            <p className={`text-lg font-bold leading-none ${stat.color}`}>{stat.value}</p>
            <p className="text-muted-foreground text-[10px] mt-1 leading-tight">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-foreground text-sm font-semibold">Checklist semanal de prevenção</p>
          <AnimatePresence>
            {allChecked && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="text-xs text-green-400 font-semibold flex items-center gap-1"
              >
                <CheckCircle2 size={12} /> Tudo verificado!
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          {dengueTips.map((tip, i) => {
            const isChecked = checked.has(tip.id);
            const Icon = tip.icon;
            return (
              <motion.button
                key={tip.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => toggle(tip.id)}
                className={cn(
                  'w-full flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-colors',
                  isChecked
                    ? 'border-green-500/20 bg-green-500/5'
                    : 'border-premium bg-card hover:border-violet-500/25'
                )}
              >
                <div className={cn('p-1.5 rounded-lg flex-shrink-0 mt-0.5', isChecked ? 'bg-green-500/15' : 'bg-muted/70 dark:bg-white/5')}>
                  <Icon size={12} className={isChecked ? 'text-green-400' : 'text-gray-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-xs font-semibold', isChecked ? 'text-green-400 line-through' : 'text-foreground')}>
                    {tip.title}
                  </p>
                  <p className="text-muted-foreground text-[10px] mt-0.5 leading-relaxed">{tip.description}</p>
                </div>
                {isChecked
                  ? <CheckCircle2 size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                  : <div className="w-4 h-4 rounded-full border-2 border-gray-600 flex-shrink-0 mt-0.5" />
                }
              </motion.button>
            );
          })}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="premium-surface rounded-2xl p-4"
      >
        <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-2">Suspeita de dengue?</p>
        <p className="text-muted-foreground text-xs leading-relaxed mb-3">
          Febre acima de 38°C, dor de cabeça intensa, dores musculares e manchas vermelhas na pele. Procure a UBS mais próxima e <span className="text-red-400 font-semibold">não tome aspirina ou ibuprofeno</span>.
        </p>
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/60 dark:bg-white/3">
          <Phone size={12} className="text-green-400" />
          <p className="text-muted-foreground text-xs"><span className="font-semibold text-foreground">Disque Saúde:</span> 136 · Funciona 24h, gratuito</p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Noise section ────────────────────────────────────────────────────────────

function NoiseSection() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {noiseSchedule.map((item, i) => (
          <motion.div
            key={item.period}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="premium-surface rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-foreground text-sm font-semibold">{item.period}</p>
                <p className="text-muted-foreground text-xs">{item.days}</p>
              </div>
              <Volume2 size={16} className="text-gray-600" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-[10px] text-green-400 font-semibold uppercase tracking-wider mb-1">Permitido</p>
                <p className="text-green-300 text-sm font-bold">{item.allowed}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wider mb-1">Silêncio</p>
                <p className="text-red-300 text-sm font-bold">{item.restricted}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="premium-surface rounded-2xl p-4"
      >
        <p className="text-foreground text-sm font-semibold mb-3">Regras de convivência</p>
        <div className="space-y-3">
          {noiseRules.map((rule, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-violet-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-violet-400 text-[9px] font-bold">{i + 1}</span>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">{rule}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 flex items-center gap-3"
      >
        <div className="p-2.5 rounded-xl bg-orange-500/15 flex-shrink-0">
          <Phone size={14} className="text-orange-400" />
        </div>
        <div>
          <p className="text-orange-400 text-sm font-semibold">Perturbação do sossego?</p>
          <p className="text-muted-foreground text-xs mt-0.5">Administração: (11) 9999-0000 · Guarda Municipal: 153</p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Common areas section ─────────────────────────────────────────────────────

function AreasSection() {
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [reservingArea, setReservingArea] = useState<string | null>(null);
  const [reservationDate, setReservationDate] = useState('');
  const [reservationTime, setReservationTime] = useState('');
  const [confirmed, setConfirmed] = useState<string | null>(null);

  function handleReserve(areaId: string) {
    if (!reservationDate || !reservationTime) return;
    setConfirmed(areaId);
    setReservingArea(null);
    setReservationDate('');
    setReservationTime('');
    setTimeout(() => setConfirmed(null), 3500);
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {confirmed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-green-500/30 bg-green-500/10 p-3.5 flex items-center gap-2.5"
          >
            <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
            <p className="text-green-300 text-xs font-semibold">
              Reserva solicitada! A administração confirmará em breve via e-mail.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {commonAreas.map((area, i) => {
        const Icon = area.icon;
        const isExpanded = expandedArea === area.id;
        const isReserving = reservingArea === area.id;

        return (
          <motion.div
            key={area.id}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="premium-surface rounded-2xl overflow-hidden"
          >
            <button
              onClick={() => setExpandedArea(isExpanded ? null : area.id)}
              className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted/60 dark:bg-white/3 transition-colors"
            >
              <div className={`p-2.5 rounded-xl ${area.bg} flex-shrink-0`}>
                <Icon size={16} className={area.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm font-semibold">{area.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-muted-foreground text-[10px]">
                    <Users size={9} /> {area.capacity} pessoas
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground text-[10px]">
                    <Clock size={9} /> {area.hours}
                  </span>
                </div>
                {area.requiresReservation && (
                  <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
                    <Calendar size={9} /> Reserva obrigatória
                  </span>
                )}
              </div>
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={14} className="text-gray-600 mt-1 flex-shrink-0" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3">
                    <div>
                      <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-2">Regras de uso</p>
                      <div className="space-y-1.5">
                        {area.rules.map((rule, ri) => (
                          <div key={ri} className="flex items-start gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${area.bg}`} style={{ outline: '1px solid currentColor' }} />
                            <p className="text-muted-foreground text-xs leading-relaxed">{rule}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {area.deposit && (
                      <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                        <p className="text-yellow-400 text-xs font-semibold">Depósito caução: {area.deposit}</p>
                        <p className="text-muted-foreground text-[10px] mt-0.5">Devolvido em até 3 dias úteis após vistoria do espaço.</p>
                      </div>
                    )}

                    {area.requiresReservation && !isReserving && (
                      <button
                        onClick={() => setReservingArea(area.id)}
                        className="w-full py-2.5 rounded-xl gradient-accent text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        Solicitar Reserva
                      </button>
                    )}

                    <AnimatePresence>
                      {isReserving && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden space-y-3"
                        >
                          <p className="text-foreground text-xs font-semibold pt-1">Solicitar reserva</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-1.5 block">Data</label>
                              <input
                                type="date"
                                value={reservationDate}
                                onChange={e => setReservationDate(e.target.value)}
                                className="w-full bg-muted/70 dark:bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-foreground text-xs focus:outline-none focus:border-violet-500/50 transition-colors"
                              />
                            </div>
                            <div>
                              <label className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-1.5 block">Horário</label>
                              <input
                                type="time"
                                value={reservationTime}
                                onChange={e => setReservationTime(e.target.value)}
                                className="w-full bg-muted/70 dark:bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-foreground text-xs focus:outline-none focus:border-violet-500/50 transition-colors"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setReservingArea(null)}
                              className="flex-1 py-2.5 rounded-xl bg-muted/70 dark:bg-white/5 border border-white/10 text-muted-foreground text-xs font-semibold hover:bg-white/10 transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleReserve(area.id)}
                              disabled={!reservationDate || !reservationTime}
                              className="flex-1 py-2.5 rounded-xl gradient-accent text-white text-xs font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
                            >
                              Confirmar
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

const sections: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'coletas',     label: 'Coletas',       icon: Trash2    },
  { id: 'saude',       label: 'Saúde',         icon: Bug       },
  { id: 'convivencia', label: 'Convivência',   icon: Volume2   },
  { id: 'areas',       label: 'Áreas Comuns',  icon: Building2 },
];

const NOTIFY_TOPICS = [
  { id: 'coletas',     label: 'Coletas',       icon: Trash2,    title: 'Lembrete de Coletas',      message: 'Verifique os horários e dias de coleta de lixo comum, seletiva e óleo de cozinha.' },
  { id: 'saude',       label: 'Saúde',         icon: Bug,       title: 'Alerta de Saúde',           message: 'Complete o checklist de prevenção à dengue e confira os cuidados com a saúde no condomínio.' },
  { id: 'convivencia', label: 'Convivência',   icon: Volume2,   title: 'Regras de Convivência',     message: 'Respeite os horários de silêncio e as regras de boa convivência do condomínio.' },
  { id: 'areas',       label: 'Áreas Comuns',  icon: Building2, title: 'Áreas Comuns do Condomínio', message: 'Confira as regras de uso e a disponibilidade das áreas comuns do condomínio.' },
];

export function NoticesScreen() {
  const [activeSection, setActiveSection] = useState<Section>('coletas');
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(NOTIFY_TOPICS.map(t => t.id)));
  const [sent, setSent] = useState(false);
  const createNotification = useCreateNotification();

  function toggleTopic(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function handleSend() {
    NOTIFY_TOPICS.filter(t => selected.has(t.id)).forEach(t => {
      createNotification.mutate({ type: 'system', title: t.title, message: t.message });
    });
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setNotifyOpen(false);
      setSelected(new Set(NOTIFY_TOPICS.map(t => t.id)));
    }, 1800);
  }

  return (
    <div className="space-y-5 pb-2">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-foreground text-xl font-bold">Avisos & Deveres</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Regras e informações do condomínio</p>
        </div>
        <button
          onClick={() => setNotifyOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl gradient-accent text-white text-xs font-semibold glow-accent hover:opacity-90 transition-opacity"
        >
          <Bell size={13} />
          Notificar
        </button>
      </motion.div>

      {/* Notify modal */}
      <AnimatePresence>
        {notifyOpen && (
          <>
            {/* Backdrop — z-[55] sits above the bottom nav (z-50) */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[55] backdrop-blur-sm"
              onClick={() => !sent && setNotifyOpen(false)}
            />

            {/* Sheet — z-[60] renders above backdrop and bottom nav */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="fixed bottom-0 left-0 right-0 z-[60] premium-surface rounded-t-3xl flex flex-col"
              style={{ maxHeight: '90dvh' }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {sent ? (
                /* ── Success state ── */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3 px-6 py-8"
                  style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)' }}
                >
                  <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center">
                    <CheckCircle2 size={28} className="text-green-400" />
                  </div>
                  <p className="text-foreground font-bold text-base">Notificações enviadas!</p>
                  <p className="text-muted-foreground text-sm text-center">
                    {selected.size} {selected.size === 1 ? 'tópico notificado' : 'tópicos notificados'} com sucesso.
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* ── Scrollable content area ── */}
                  <div className="overflow-y-auto flex-1 min-h-0 px-6 pt-1 space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center glow-accent">
                          <Megaphone size={16} className="text-white" />
                        </div>
                        <div>
                          <p className="text-foreground font-bold text-sm">Notificar Inquilinos</p>
                          <p className="text-muted-foreground text-xs">Selecione os tópicos</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setNotifyOpen(false)}
                        className="w-8 h-8 rounded-full bg-muted/70 dark:bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Topic toggles */}
                    <div className="space-y-2 pb-2">
                      {NOTIFY_TOPICS.map(topic => {
                        const Icon = topic.icon;
                        const isOn = selected.has(topic.id);
                        return (
                          <button
                            key={topic.id}
                            onClick={() => toggleTopic(topic.id)}
                            className={cn(
                              'w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all',
                              isOn
                                ? 'border-violet-500/30 bg-violet-500/8'
                                : 'border-border bg-card hover:border-violet-500/20'
                            )}
                          >
                            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors', isOn ? 'bg-violet-500/20' : 'bg-muted/70 dark:bg-white/5')}>
                              <Icon size={15} className={isOn ? 'text-violet-400' : 'text-muted-foreground'} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-sm font-semibold transition-colors', isOn ? 'text-foreground' : 'text-muted-foreground')}>{topic.label}</p>
                              <p className="text-muted-foreground text-xs mt-0.5 truncate">{topic.title}</p>
                            </div>
                            <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all', isOn ? 'border-violet-500 bg-violet-500' : 'border-border')}>
                              {isOn && <CheckCircle2 size={10} className="text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Sticky action buttons — always visible above safe area ── */}
                  <div
                    className="flex gap-3 px-6 pt-4 flex-shrink-0 border-t border-border/40"
                    style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
                  >
                    <button
                      onClick={() => setNotifyOpen(false)}
                      className="flex-1 py-3.5 rounded-2xl bg-muted/70 dark:bg-white/5 border border-border text-muted-foreground text-sm font-semibold hover:text-foreground transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={selected.size === 0 || createNotification.isPending}
                      className="flex-1 py-3.5 rounded-2xl gradient-accent text-white text-sm font-semibold flex items-center justify-center gap-2 glow-accent disabled:opacity-40 hover:opacity-90 transition-opacity"
                    >
                      <Send size={14} />
                      {createNotification.isPending ? 'Enviando…' : 'Enviar'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Section filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sections.map(sec => {
          const Icon = sec.icon;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200',
                activeSection === sec.id
                  ? 'bg-violet-500 border-violet-500 text-white'
                  : 'border-border text-muted-foreground hover:border-violet-500/30 hover:bg-muted/60 hover:text-foreground'
              )}
            >
              <Icon size={12} />
              {sec.label}
            </button>
          );
        })}
      </div>

      {/* Section content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeSection === 'coletas'     && <CollectionSection />}
          {activeSection === 'saude'       && <HealthSection />}
          {activeSection === 'convivencia' && <NoiseSection />}
          {activeSection === 'areas'       && <AreasSection />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
