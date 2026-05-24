'use client';
import { useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck, Plus, ChevronRight, ChevronLeft, Calendar,
  User, Camera, CheckCircle2, AlertCircle, XCircle, MinusCircle,
  Star, Home, MapPin, FileSignature, Shield,
} from 'lucide-react';
import { useInspections, useProperties, useTenants } from '@/hooks/useApi';
import { formatDate, formatRelativeTime, getInitials } from '@/lib/utils';
import { ListItemSkeleton, ApiErrorState } from '@/components/shared/LoadingSkeleton';
import { NewInspectionScreen } from './NewInspectionScreen';
import type { Inspection, InspectionRoom, InspectionStatus, InspectionType, RoomCondition } from '@/types';

type View = 'list' | 'detail' | 'new';

// ─── Config ──────────────────────────────────────────────────────────────────

const statusConfig: Record<InspectionStatus, { label: string; icon: React.ElementType; iconClass: string; bg: string; border: string }> = {
  agendada:     { label: 'Agendada',     icon: Calendar,      iconClass: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  em_andamento: { label: 'Em andamento', icon: ClipboardCheck, iconClass: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  concluida:    { label: 'Concluída',    icon: CheckCircle2,   iconClass: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  cancelada:    { label: 'Cancelada',    icon: XCircle,        iconClass: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
};

const typeConfig: Record<InspectionType, { label: string; color: string; bg: string }> = {
  entrada:  { label: 'Entrada',  color: 'text-violet-400', bg: 'bg-violet-500/15 border-violet-500/25' },
  saida:    { label: 'Saída',    color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/25' },
  periodica: { label: 'Periódica', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/25' },
};

const conditionConfig: Record<RoomCondition, { label: string; icon: React.ElementType; color: string; bg: string; score: number }> = {
  otimo:   { label: 'Ótimo',   icon: CheckCircle2, color: 'text-green-400',  bg: 'bg-green-500/10',  score: 100 },
  bom:     { label: 'Bom',     icon: CheckCircle2, color: 'text-blue-400',   bg: 'bg-blue-500/10',   score: 75 },
  regular: { label: 'Regular', icon: MinusCircle,  color: 'text-yellow-400', bg: 'bg-yellow-500/10', score: 50 },
  ruim:    { label: 'Ruim',    icon: AlertCircle,  color: 'text-orange-400', bg: 'bg-orange-500/10', score: 25 },
  pessimo: { label: 'Péssimo', icon: XCircle,      color: 'text-red-400',    bg: 'bg-red-500/10',    score: 0 },
};

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 80 ? '#22C55E' : score >= 55 ? '#F59E0B' : '#EF4444';
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={4} className="text-muted/70" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={4} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - fill }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold leading-none" style={{ fontSize: size * 0.22, color }}>{score}</span>
        <span className="text-gray-500 leading-none" style={{ fontSize: size * 0.13 }}>pts</span>
      </div>
    </div>
  );
}

// ─── Condition badge ──────────────────────────────────────────────────────────

function ConditionBadge({ condition }: { condition: RoomCondition }) {
  const cfg = conditionConfig[condition];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

// ─── Room card (inside detail view) ──────────────────────────────────────────

function RoomCard({ room, index }: { room: InspectionRoom; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = conditionConfig[room.condition];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.06 }}
      className="premium-surface rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/60 dark:bg-white/3 transition-colors"
      >
        <div className={`p-2 rounded-xl ${cfg.bg} flex-shrink-0`}>
          <Home size={14} className={cfg.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold">{room.name}</p>
          {room.observations && (
            <p className="text-muted-foreground text-xs mt-0.5 truncate">{room.observations}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ConditionBadge condition={room.condition} />
          {room.photos.length > 0 && (
            <span className="flex items-center gap-0.5 text-muted-foreground text-xs">
              <Camera size={11} /> {room.photos.length}
            </span>
          )}
          <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight size={14} className="text-gray-600" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Photos */}
              {room.photos.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Fotos</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {room.photos.map((url, pi) => (
                      <div key={pi} className="flex-shrink-0 w-24 h-18 rounded-xl overflow-hidden border border-premium">
                        <img src={url} alt="" className="w-full h-full object-cover" style={{ height: 72 }} />
                      </div>
                    ))}
                    <button className="flex-shrink-0 w-24 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-1 text-gray-600 hover:border-violet-500/40 hover:text-violet-400 transition-colors" style={{ height: 72 }}>
                      <Camera size={14} />
                      <span className="text-[10px]">Adicionar</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Checklist items */}
              {room.items.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Itens vistoriados</p>
                  <div className="space-y-2">
                    {room.items.map((item) => {
                      const icfg = conditionConfig[item.condition];
                      const IIcon = icfg.icon;
                      return (
                        <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/60 dark:bg-white/3">
                          <IIcon size={14} className={icfg.color} />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-medium">{item.name}</p>
                            {item.observation && (
                              <p className="text-muted-foreground text-[10px] mt-0.5">{item.observation}</p>
                            )}
                          </div>
                          <ConditionBadge condition={item.condition} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Observations */}
              {room.observations && (
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1.5">Observações</p>
                  <p className="text-gray-300 text-sm leading-relaxed bg-muted/60 dark:bg-white/3 rounded-xl p-3">{room.observations}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Detail view ──────────────────────────────────────────────────────────────

function InspectionDetail({ inspection, onBack, onStartNew, properties, tenants }: { inspection: Inspection; onBack: () => void; onStartNew: () => void; properties: { id: string; name?: string; city?: string; image?: string }[]; tenants: { id: string; name: string; phone: string }[] }) {
  const property = properties.find(p => p.id === inspection.propertyId);
  const tenant = inspection.tenantId ? tenants.find(t => t.id === inspection.tenantId) : null;
  const typeCfg = typeConfig[inspection.type];
  const statusCfg = statusConfig[inspection.status];
  const StatusIcon = statusCfg.icon;

  const conditionCounts = inspection.rooms.reduce<Record<RoomCondition, number>>(
    (acc, room) => { acc[room.condition] = (acc[room.condition] || 0) + 1; return acc; },
    { otimo: 0, bom: 0, regular: 0, ruim: 0, pessimo: 0 }
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.25 }}
      className="space-y-5 pb-2"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-muted/70 dark:bg-white/5 flex items-center justify-center hover:bg-muted dark:hover:bg-white/10 transition-colors">
          <ChevronLeft size={18} className="text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-foreground text-base font-bold truncate">
            Vistoria de {typeCfg.label}
          </h2>
          <p className="text-muted-foreground text-xs">{property?.name}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${typeCfg.bg} ${typeCfg.color}`}>
          {typeCfg.label}
        </span>
      </div>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="premium-surface rounded-3xl p-5"
      >
        <div className="flex items-start gap-4">
          {inspection.status === 'concluida' && inspection.generalScore > 0 ? (
            <ScoreRing score={inspection.generalScore} size={64} />
          ) : (
            <div className={`p-3 rounded-2xl ${statusCfg.bg} ${statusCfg.border} border flex-shrink-0`}>
              <StatusIcon size={22} className={statusCfg.iconClass} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.border} ${statusCfg.iconClass}`}>
                {statusCfg.label}
              </span>
            </div>
            {inspection.status === 'concluida' && inspection.generalScore > 0 && (
              <p className="text-white text-sm font-semibold">
                {inspection.generalScore >= 80 ? 'Excelente estado' : inspection.generalScore >= 60 ? 'Bom estado geral' : 'Requer atenção'}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-1 text-muted-foreground text-xs">
              <Calendar size={11} />
              <span>{inspection.completedDate ? formatDate(inspection.completedDate) : formatDate(inspection.scheduledDate)}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground text-xs">
              <User size={11} />
              <span>{inspection.inspector}</span>
            </div>
          </div>
        </div>

        {inspection.generalObservations && (
          <div className="mt-4 p-3 rounded-2xl bg-muted/60 dark:bg-white/3 border border-premium">
            <p className="text-muted-foreground text-xs leading-relaxed">{inspection.generalObservations}</p>
          </div>
        )}

        {/* Signatures */}
        {inspection.status === 'concluida' && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className={`flex items-center gap-2 p-2.5 rounded-xl ${inspection.signedByTenant ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/60 dark:bg-white/3 border border-premium'}`}>
              <FileSignature size={13} className={inspection.signedByTenant ? 'text-green-400' : 'text-gray-600'} />
              <div>
                <p className={`text-xs font-medium ${inspection.signedByTenant ? 'text-green-400' : 'text-gray-500'}`}>Inquilino</p>
                <p className="text-[10px] text-gray-600">{inspection.signedByTenant ? 'Assinou' : 'Pendente'}</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 p-2.5 rounded-xl ${inspection.signedByOwner ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/60 dark:bg-white/3 border border-premium'}`}>
              <Shield size={13} className={inspection.signedByOwner ? 'text-green-400' : 'text-gray-600'} />
              <div>
                <p className={`text-xs font-medium ${inspection.signedByOwner ? 'text-green-400' : 'text-gray-500'}`}>Proprietário</p>
                <p className="text-[10px] text-gray-600">{inspection.signedByOwner ? 'Assinou' : 'Pendente'}</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Property + tenant row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="premium-surface rounded-2xl p-3">
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-2">Imóvel</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
              {property?.image && <img src={property.image} alt="" className="w-full h-full object-cover opacity-70" />}
            </div>
            <div className="min-w-0">
              <p className="text-foreground text-xs font-semibold truncate">{property?.name}</p>
              <p className="text-muted-foreground text-[10px] flex items-center gap-0.5"><MapPin size={9} />{property?.city}</p>
            </div>
          </div>
        </div>
        <div className="premium-surface rounded-2xl p-3">
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-2">
            {tenant ? 'Inquilino' : 'Inspetor'}
          </p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {tenant ? getInitials(tenant.name) : getInitials(inspection.inspector)}
            </div>
            <div className="min-w-0">
              <p className="text-foreground text-xs font-semibold truncate">
                {tenant ? tenant.name.split(' ')[0] : inspection.inspector.split(' ')[0]}
              </p>
              <p className="text-muted-foreground text-[10px]">
                {tenant ? tenant.phone : 'Vistoriador'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Condition summary bar */}
      {inspection.rooms.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="premium-surface rounded-2xl p-4"
        >
          <p className="text-foreground text-sm font-semibold mb-3">Resumo por condição</p>
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(conditionCounts) as [RoomCondition, number][])
              .filter(([, count]) => count > 0)
              .map(([cond, count]) => {
                const cfg = conditionConfig[cond];
                const Icon = cfg.icon;
                return (
                  <div key={cond} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${cfg.bg}`}>
                    <Icon size={12} className={cfg.color} />
                    <span className={`text-xs font-semibold ${cfg.color}`}>{count}× {cfg.label}</span>
                  </div>
                );
              })}
          </div>

          {/* Visual bar */}
          <div className="mt-3 h-2 rounded-full overflow-hidden flex gap-0.5">
            {(Object.entries(conditionCounts) as [RoomCondition, number][]).map(([cond, count]) => {
              if (!count) return null;
              const pct = (count / inspection.rooms.length) * 100;
              return (
                <motion.div
                  key={cond}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{ background: cond === 'otimo' ? '#22C55E' : cond === 'bom' ? '#3B82F6' : cond === 'regular' ? '#F59E0B' : cond === 'ruim' ? '#F97316' : '#EF4444' }}
                />
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Room list */}
      {inspection.rooms.length > 0 ? (
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">
            Cômodos ({inspection.rooms.length})
          </p>
          <div className="space-y-2">
            {inspection.rooms.map((room, i) => (
              <RoomCard key={room.id} room={room} index={i} />
            ))}
          </div>
        </div>
      ) : inspection.status === 'agendada' ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
          <ClipboardCheck size={28} className="mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 text-sm font-medium">Vistoria ainda não iniciada</p>
          <p className="text-muted-foreground text-xs mt-1">Agendada para {formatDate(inspection.scheduledDate)}</p>
          <button onClick={onStartNew} className="mt-4 px-5 py-2.5 gradient-accent rounded-xl text-white text-xs font-semibold hover:opacity-90 transition-opacity">
            Iniciar vistoria
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-yellow-500/20 bg-yellow-500/5 p-6 text-center">
          <ClipboardCheck size={28} className="mx-auto mb-3 text-yellow-500" />
          <p className="text-yellow-400 text-sm font-medium">Vistoria em andamento</p>
          <p className="text-muted-foreground text-xs mt-1">Adicione cômodos para continuar</p>
          <button onClick={onStartNew} className="mt-4 px-5 py-2.5 bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-yellow-400 text-xs font-semibold hover:bg-yellow-500/30 transition-colors">
            + Adicionar cômodo
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── List card ────────────────────────────────────────────────────────────────

function InspectionCard({ inspection, index, onClick, properties }: { inspection: Inspection; index: number; onClick: () => void; properties: { id: string; name?: string; city?: string; image?: string }[] }) {
  const property = properties.find(p => p.id === inspection.propertyId);
  const typeCfg = typeConfig[inspection.type];
  const statusCfg = statusConfig[inspection.status];
  const StatusIcon = statusCfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="premium-surface rounded-2xl p-4 cursor-pointer hover:border-violet-500/25 transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Score or status icon */}
        {inspection.status === 'concluida' && inspection.generalScore > 0 ? (
          <ScoreRing score={inspection.generalScore} size={48} />
        ) : (
          <div className={`p-2.5 rounded-2xl ${statusCfg.bg} border ${statusCfg.border} flex-shrink-0`}>
            <StatusIcon size={16} className={statusCfg.iconClass} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-foreground text-sm font-semibold truncate">{property?.name ?? 'Imóvel'}</p>
              <p className="text-muted-foreground text-xs mt-0.5 flex items-center gap-1">
                <MapPin size={10} /> {property?.city}
              </p>
            </div>
            <ChevronRight size={14} className="text-gray-600 flex-shrink-0 mt-0.5" />
          </div>

          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeCfg.bg} ${typeCfg.color}`}>
              {typeCfg.label}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.iconClass}`}>
              {statusCfg.label}
            </span>
            {inspection.rooms.length > 0 && (
              <span className="text-[10px] text-gray-500">
                {inspection.rooms.length} cômodos
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-2">
            <p className="text-muted-foreground text-[10px] flex items-center gap-1">
              <User size={9} /> {inspection.inspector}
            </p>
            <p className="text-muted-foreground text-[10px] flex items-center gap-1">
              <Calendar size={9} />
              {formatDate(inspection.completedDate ?? inspection.scheduledDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Signature status strip */}
      {inspection.status === 'concluida' && (
        <div className="mt-3 pt-3 border-t border-premium flex items-center gap-3">
          <div className={`flex items-center gap-1 text-[10px] font-medium ${inspection.signedByTenant ? 'text-green-400' : 'text-gray-500'}`}>
            <FileSignature size={10} /> Inquilino {inspection.signedByTenant ? '✓' : '...'}
          </div>
          <div className={`flex items-center gap-1 text-[10px] font-medium ${inspection.signedByOwner ? 'text-green-400' : 'text-gray-500'}`}>
            <Shield size={10} /> Proprietário {inspection.signedByOwner ? '✓' : '...'}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

const statusFilters: { label: string; value: InspectionStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Agendadas', value: 'agendada' },
  { label: 'Andamento', value: 'em_andamento' },
  { label: 'Concluídas', value: 'concluida' },
];

export function InspectionScreen() {
  const { data: inspections, isLoading, isError, refetch } = useInspections();
  const { data: properties = [] } = useProperties();
  const { data: tenants = [] } = useTenants();
  const [activeFilter, setActiveFilter] = useState<InspectionStatus | 'all'>('all');
  const [selected, setSelected] = useState<Inspection | null>(null);
  const [view, setView] = useState<View>('list');
  const [showSuccess, setShowSuccess] = useState(false);

  const filtered = (inspections ?? []).filter(i => activeFilter === 'all' || i.status === activeFilter);

  const counts = {
    concluida: (inspections ?? []).filter(i => i.status === 'concluida').length,
    agendada: (inspections ?? []).filter(i => i.status === 'agendada').length,
    em_andamento: (inspections ?? []).filter(i => i.status === 'em_andamento').length,
  };

  function handleSave() {
    setView('list');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3500);
  }

  return (
    <div className="relative">
      {/* Success toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-green-500/15 border border-green-500/30 backdrop-blur-xl shadow-lg"
          >
            <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
            <span className="text-green-300 text-sm font-semibold">Vistoria criada com sucesso!</span>
          </motion.div>
        )}
      </AnimatePresence>

    <AnimatePresence mode="wait">
      {view === 'new' ? (
        <NewInspectionScreen
          key="new"
          onBack={() => setView('list')}
          onSave={handleSave}
        />
      ) : selected ? (
        <InspectionDetail key="detail" inspection={selected} onBack={() => setSelected(null)} onStartNew={() => { setSelected(null); setView('new'); }} properties={properties} tenants={tenants} />
      ) : (
        <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5 pb-2">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h2 className="text-foreground text-xl font-bold">Vistorias</h2>
              <p className="text-muted-foreground text-sm mt-0.5">
                {isLoading ? '…' : `${inspections?.length ?? 0} registros`}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setView('new')}
              className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center glow-accent">
              <Plus size={18} className="text-white" />
            </motion.button>
          </motion.div>

          {/* Summary row */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="grid grid-cols-3 gap-2"
          >
            {[
              { label: 'Concluídas', count: counts.concluida, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
              { label: 'Agendadas', count: counts.agendada, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
              { label: 'Andamento', count: counts.em_andamento, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
            ].map(item => (
              <div key={item.label} className={`rounded-2xl border p-3 ${item.bg}`}>
                <p className={`text-2xl font-bold ${item.color}`}>{isLoading ? '–' : item.count}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{item.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {statusFilters.map(f => (
              <button key={f.value} onClick={() => setActiveFilter(f.value)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                  activeFilter === f.value
                    ? 'bg-violet-500 border-violet-500 text-white'
                    : 'border-border text-muted-foreground hover:border-violet-500/30 hover:bg-muted/60 hover:text-foreground'
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* List */}
          {isError ? (
            <ApiErrorState onRetry={refetch} />
          ) : isLoading ? (
            <ListItemSkeleton count={4} />
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-3">
                {filtered.map((insp, i) => (
                  <InspectionCard
                    key={insp.id}
                    inspection={insp}
                    index={i}
                    onClick={() => setSelected(insp)}
                    properties={properties}
                  />
                ))}
                {filtered.length === 0 && (
                  <div className="text-center py-16 text-gray-500">
                    <ClipboardCheck size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Nenhuma vistoria encontrada</p>
                  </div>
                )}
              </div>
            </AnimatePresence>
          )}
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
}
