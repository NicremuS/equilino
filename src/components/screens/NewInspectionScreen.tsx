'use client';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Check, Plus, Trash2, Camera,
  Home, Calendar, User, ClipboardList, Star, MapPin,
  CheckCircle2, MinusCircle, AlertCircle, XCircle, X,
  Building2, FileSignature, Shield, Pencil,
} from 'lucide-react';
import { useProperties, useTenants } from '@/hooks/useApi';
import { formatCurrency, getInitials } from '@/lib/utils';
import type { InspectionType, RoomCondition, InspectionRoom, InspectionItem, Property } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormRoom extends Omit<InspectionRoom, 'photos'> {
  photos: { id: string; preview: string }[];
}

interface FormState {
  propertyId: string;
  type: InspectionType | '';
  scheduledDate: string;
  inspector: string;
  tenantId: string;
  rooms: FormRoom[];
  generalObservations: string;
  signedByTenant: boolean;
  signedByOwner: boolean;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const conditionOptions: { value: RoomCondition; label: string; icon: React.ElementType; color: string; bg: string; score: number }[] = [
  { value: 'otimo',   label: 'Ótimo',   icon: CheckCircle2, color: 'text-green-400',  bg: 'bg-green-500/15 border-green-500/30',  score: 100 },
  { value: 'bom',     label: 'Bom',     icon: CheckCircle2, color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/30',    score: 75 },
  { value: 'regular', label: 'Regular', icon: MinusCircle,  color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30', score: 50 },
  { value: 'ruim',    label: 'Ruim',    icon: AlertCircle,  color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30', score: 25 },
  { value: 'pessimo', label: 'Péssimo', icon: XCircle,      color: 'text-red-400',    bg: 'bg-red-500/15 border-red-500/30',      score: 0 },
];

const typeOptions: { value: InspectionType; label: string; desc: string; color: string; bg: string }[] = [
  { value: 'entrada',  label: 'Entrada',   desc: 'Início do contrato', color: 'text-violet-400', bg: 'bg-violet-500/15 border-violet-500/30' },
  { value: 'saida',    label: 'Saída',     desc: 'Encerramento',       color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30' },
  { value: 'periodica',label: 'Periódica', desc: 'Rotina / revisão',   color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/30' },
];

const commonRooms = ['Sala de Estar', 'Cozinha', 'Quarto Principal', 'Quarto 2', 'Banheiro', 'Área de Serviço', 'Varanda', 'Garagem'];

const commonItems: Record<string, string[]> = {
  'Sala de Estar':    ['Piso', 'Paredes', 'Teto', 'Janelas', 'Tomadas', 'Interruptores'],
  'Cozinha':         ['Armários', 'Bancada', 'Pia e torneira', 'Azulejos', 'Rodapé', 'Tomadas'],
  'Quarto Principal':['Piso', 'Paredes', 'Teto', 'Janela', 'Porta', 'Armário embutido'],
  'Quarto 2':        ['Piso', 'Paredes', 'Teto', 'Janela', 'Porta'],
  'Banheiro':        ['Piso', 'Azulejos', 'Vaso sanitário', 'Chuveiro', 'Pia', 'Espelho', 'Torneira'],
  'Área de Serviço': ['Piso', 'Paredes', 'Tanque', 'Torneira'],
  'Varanda':         ['Piso', 'Gradil/Guarda-corpo', 'Pintura'],
  'Garagem':         ['Piso', 'Portão', 'Paredes'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcScore(rooms: FormRoom[]): number {
  if (!rooms.length) return 0;
  const all = rooms.flatMap(r => r.items.length ? r.items.map(i => i.condition) : [r.condition]);
  const total = all.reduce((s, c) => s + (conditionOptions.find(o => o.value === c)?.score ?? 75), 0);
  return Math.round(total / all.length);
}

function newRoom(name = ''): FormRoom {
  return {
    id: `r-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name,
    condition: 'bom',
    observations: '',
    photos: [],
    items: (commonItems[name] ?? ['Piso', 'Paredes', 'Teto']).map((n, i) => ({
      id: `item-${i}`,
      name: n,
      condition: 'bom' as RoomCondition,
    })),
  };
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ width: i === step ? 28 : 8 }}
          transition={{ duration: 0.3 }}
          className={`h-1.5 rounded-full transition-colors duration-300 ${
            i < step ? 'bg-violet-500' : i === step ? 'bg-violet-400' : 'bg-white/10'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Condition selector ───────────────────────────────────────────────────────

function ConditionSelector({ value, onChange }: { value: RoomCondition; onChange: (v: RoomCondition) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {conditionOptions.map(opt => {
        const Icon = opt.icon;
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-150 ${
              active ? `${opt.bg} ${opt.color}` : 'border-white/8 text-gray-500 hover:border-white/15 hover:text-gray-300'
            }`}
          >
            <Icon size={12} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── STEP 1 — Dados gerais ────────────────────────────────────────────────────

function Step1({ form, setForm, properties, tenants }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>>; properties: Property[]; tenants: { id: string; propertyId?: string }[] }) {
  return (
    <div className="space-y-6">
      {/* Type */}
      <div>
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Tipo de vistoria</p>
        <div className="grid grid-cols-3 gap-2">
          {typeOptions.map(opt => {
            const active = form.type === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 text-center ${
                  active ? `${opt.bg} ${opt.color}` : 'border-white/8 text-gray-500 hover:border-white/15'
                }`}
              >
                <ClipboardList size={20} className={active ? opt.color : 'text-gray-600'} />
                <div>
                  <p className="text-xs font-bold leading-none">{opt.label}</p>
                  <p className={`text-[10px] mt-1 leading-tight ${active ? 'opacity-80' : 'text-gray-600'}`}>{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Property */}
      <div>
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Imóvel</p>
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {properties.map(prop => {
            const active = form.propertyId === prop.id;
            return (
              <button
                key={prop.id}
                type="button"
                onClick={() => {
                  const tenant = tenants.find(t => t.propertyId === prop.id);
                  setForm(f => ({ ...f, propertyId: prop.id, tenantId: tenant?.id ?? '' }));
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all duration-150 text-left ${
                  active
                    ? 'border-violet-500/40 bg-violet-500/10'
                    : 'border-white/8 hover:border-white/15 bg-white/2'
                }`}
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gray-800">
                  {prop.image && <img src={prop.image} alt="" className="w-full h-full object-cover opacity-80" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${active ? 'text-white' : 'text-gray-300'}`}>{prop.name}</p>
                  <p className="text-muted-foreground text-xs flex items-center gap-1"><MapPin size={9} />{prop.city}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  active ? 'border-violet-400 bg-violet-400' : 'border-gray-600'
                }`}>
                  {active && <Check size={11} className="text-white" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date + Inspector */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">Data</label>
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="date"
              value={form.scheduledDate}
              onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))}
              className="w-full pl-9 pr-3 py-3 bg-muted/70 dark:bg-white/5 border border-white/8 rounded-2xl text-foreground text-sm focus:outline-none focus:border-violet-500/60 transition-colors dark:[color-scheme:dark]"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">Inspetor</label>
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Nome do inspetor"
              value={form.inspector}
              onChange={e => setForm(f => ({ ...f, inspector: e.target.value }))}
              className="w-full pl-9 pr-3 py-3 bg-muted/70 dark:bg-white/5 border border-white/8 rounded-2xl text-white text-sm placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/60 transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STEP 2 — Cômodos ─────────────────────────────────────────────────────────

function RoomEditor({ room, index, onChange, onRemove }: {
  room: FormRoom;
  index: number;
  onChange: (r: FormRoom) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const updateItem = (id: string, patch: Partial<InspectionItem>) =>
    onChange({ ...room, items: room.items.map(it => it.id === id ? { ...it, ...patch } : it) });

  const addItem = () => {
    if (!newItemName.trim()) return;
    onChange({
      ...room,
      items: [...room.items, { id: `item-${Date.now()}`, name: newItemName.trim(), condition: 'bom' }],
    });
    setNewItemName('');
  };

  const removeItem = (id: string) =>
    onChange({ ...room, items: room.items.filter(it => it.id !== id) });

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const previews = files.map(f => ({ id: `ph-${Date.now()}-${Math.random()}`, preview: URL.createObjectURL(f) }));
    onChange({ ...room, photos: [...room.photos, ...previews] });
    e.target.value = '';
  };

  const removePhoto = (id: string) =>
    onChange({ ...room, photos: room.photos.filter(p => p.id !== id) });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25 }}
      className="premium-surface rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center flex-shrink-0">
          <span className="text-violet-400 text-xs font-bold">{index + 1}</span>
        </div>

        {editingName ? (
          <input
            autoFocus
            value={room.name}
            onChange={e => onChange({ ...room, name: e.target.value })}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
            className="flex-1 bg-transparent text-white text-sm font-semibold focus:outline-none border-b border-violet-400 pb-0.5"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="flex-1 text-left flex items-center gap-2 group min-w-0"
          >
            <span className="text-white text-sm font-semibold truncate">{room.name || 'Sem nome'}</span>
            <Pencil size={11} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </button>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-7 h-7 rounded-lg bg-muted/70 dark:bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight size={14} className="text-gray-400" />
            </motion.div>
          </button>
          <button
            onClick={onRemove}
            className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
          >
            <Trash2 size={12} className="text-red-400" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-5 border-t border-premium pt-4">

              {/* Overall condition */}
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Condição geral</p>
                <ConditionSelector value={room.condition} onChange={v => onChange({ ...room, condition: v })} />
              </div>

              {/* Items checklist */}
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">
                  Itens ({room.items.length})
                </p>
                <div className="space-y-1.5">
                  <AnimatePresence>
                    {room.items.map(item => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6, height: 0 }}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/60 dark:bg-white/3"
                      >
                        <span className="text-white text-xs font-medium flex-1 min-w-0 truncate">{item.name}</span>
                        <div className="flex gap-1">
                          {conditionOptions.map(opt => {
                            const Icon = opt.icon;
                            const active = item.condition === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => updateItem(item.id, { condition: opt.value })}
                                title={opt.label}
                                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                                  active ? `${opt.bg} ${opt.color}` : 'text-gray-700 hover:text-gray-400'
                                }`}
                              >
                                <Icon size={12} />
                              </button>
                            );
                          })}
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-gray-700 hover:text-red-400 transition-colors ml-1">
                          <X size={12} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Add item */}
                  <div className="flex gap-2 mt-2">
                    <input
                      value={newItemName}
                      onChange={e => setNewItemName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addItem()}
                      placeholder="+ Adicionar item..."
                      className="flex-1 px-3 py-2 bg-muted/60 dark:bg-white/3 border border-dashed border-white/10 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/40 transition-colors"
                    />
                    {newItemName && (
                      <button onClick={addItem} className="px-3 py-2 gradient-accent rounded-xl text-white text-xs font-semibold">
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">
                  Fotos ({room.photos.length})
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {room.photos.map(ph => (
                    <div key={ph.id} className="relative flex-shrink-0 w-20 rounded-xl overflow-hidden border border-white/10" style={{ height: 64 }}>
                      <img src={ph.preview} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(ph.id)}
                        className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center"
                      >
                        <X size={9} className="text-white" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex-shrink-0 w-20 rounded-xl border border-dashed border-white/15 flex flex-col items-center justify-center gap-1 text-gray-600 hover:border-violet-500/40 hover:text-violet-400 transition-colors"
                    style={{ height: 64 }}
                  >
                    <Camera size={14} />
                    <span className="text-[9px]">Foto</span>
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoAdd} />
                </div>
              </div>

              {/* Observations */}
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Observações</p>
                <textarea
                  value={room.observations}
                  onChange={e => onChange({ ...room, observations: e.target.value })}
                  placeholder="Descreva o estado do cômodo, avarias, etc..."
                  rows={2}
                  className="w-full px-3 py-2.5 bg-muted/60 dark:bg-white/3 border border-white/8 rounded-2xl text-white text-xs placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Step2({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [customRoomName, setCustomRoomName] = useState('');

  const addRoom = (name: string) => {
    setForm(f => ({ ...f, rooms: [...f.rooms, newRoom(name)] }));
    setShowRoomPicker(false);
    setCustomRoomName('');
  };

  const updateRoom = (idx: number, r: FormRoom) =>
    setForm(f => { const rooms = [...f.rooms]; rooms[idx] = r; return { ...f, rooms }; });

  const removeRoom = (idx: number) =>
    setForm(f => ({ ...f, rooms: f.rooms.filter((_, i) => i !== idx) }));

  const existing = new Set(form.rooms.map(r => r.name));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
          Cômodos ({form.rooms.length})
        </p>
        <button
          onClick={() => setShowRoomPicker(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 gradient-accent rounded-xl text-white text-xs font-semibold"
        >
          <Plus size={13} /> Adicionar
        </button>
      </div>

      {/* Room picker */}
      <AnimatePresence>
        {showRoomPicker && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-3"
          >
            <p className="text-xs text-violet-400 font-semibold">Escolha ou crie um cômodo</p>
            <div className="flex flex-wrap gap-2">
              {commonRooms.filter(r => !existing.has(r)).map(r => (
                <button
                  key={r}
                  onClick={() => addRoom(r)}
                  className="px-3 py-1.5 rounded-xl border border-white/10 text-xs text-gray-300 hover:border-violet-500/40 hover:text-violet-300 hover:bg-violet-500/10 transition-all"
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={customRoomName}
                onChange={e => setCustomRoomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && customRoomName.trim() && addRoom(customRoomName.trim())}
                placeholder="Nome personalizado..."
                className="flex-1 px-3 py-2 bg-muted/70 dark:bg-white/5 border border-white/10 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50 transition-colors"
              />
              {customRoomName.trim() && (
                <button onClick={() => addRoom(customRoomName.trim())}
                  className="px-3 py-2 gradient-accent rounded-xl text-white text-xs font-semibold">
                  Criar
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rooms */}
      <AnimatePresence>
        {form.rooms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl border border-dashed border-white/10 p-10 text-center"
          >
            <Home size={28} className="mx-auto mb-3 text-gray-600" />
            <p className="text-muted-foreground text-sm">Nenhum cômodo adicionado</p>
            <p className="text-muted-foreground text-xs mt-1">Clique em &quot;Adicionar&quot; para começar</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {form.rooms.map((room, i) => (
              <RoomEditor
                key={room.id}
                room={room}
                index={i}
                onChange={r => updateRoom(i, r)}
                onRemove={() => removeRoom(i)}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── STEP 3 — Revisão ─────────────────────────────────────────────────────────

function ScoreRingLarge({ score }: { score: number }) {
  const size = 88;
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 80 ? '#22C55E' : score >= 55 ? '#F59E0B' : '#EF4444';
  const label = score >= 80 ? 'Excelente' : score >= 55 ? 'Satisfatório' : 'Atenção';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1F2937" strokeWidth={5} />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth={5} strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - fill }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white leading-none">{score}</span>
          <span className="text-[10px] text-gray-500 leading-none mt-0.5">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

function Step3({ form, setForm, properties, tenants }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>>; properties: Property[]; tenants: { id: string; name: string }[] }) {
  const property = properties.find(p => p.id === form.propertyId);
  const tenant = form.tenantId ? tenants.find(t => t.id === form.tenantId) : null;
  const score = calcScore(form.rooms);
  const typeCfg = typeOptions.find(t => t.value === form.type);

  const conditionCounts = form.rooms.reduce<Record<RoomCondition, number>>(
    (acc, room) => {
      const conds = room.items.length ? room.items.map(i => i.condition) : [room.condition];
      conds.forEach(c => { acc[c] = (acc[c] || 0) + 1; });
      return acc;
    },
    { otimo: 0, bom: 0, regular: 0, ruim: 0, pessimo: 0 }
  );

  return (
    <div className="space-y-5">
      {/* Score hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="premium-surface rounded-3xl p-5 flex items-center gap-5"
      >
        <ScoreRingLarge score={score} />
        <div className="flex-1 min-w-0">
          <p className="text-muted-foreground text-xs mb-1">Pontuação calculada</p>
          <p className="text-white font-bold text-lg leading-tight">
            {property?.name}
          </p>
          {typeCfg && (
            <span className={`mt-2 inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full border ${typeCfg.bg} ${typeCfg.color}`}>
              Vistoria de {typeCfg.label}
            </span>
          )}
        </div>
      </motion.div>

      {/* Summary grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="premium-surface rounded-2xl p-3">
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-2">Imóvel</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
              {property?.image && <img src={property.image} alt="" className="w-full h-full object-cover opacity-80" />}
            </div>
            <p className="text-white text-xs font-semibold leading-tight truncate">{property?.name ?? '—'}</p>
          </div>
        </div>
        <div className="premium-surface rounded-2xl p-3">
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-2">{tenant ? 'Inquilino' : 'Inspetor'}</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {getInitials((tenant?.name ?? form.inspector) || 'IN')}
            </div>
            <p className="text-white text-xs font-semibold truncate">{(tenant?.name ?? form.inspector) || '—'}</p>
          </div>
        </div>
      </div>

      {/* Condition breakdown */}
      {form.rooms.length > 0 && (
        <div className="premium-surface rounded-2xl p-4">
          <p className="text-white text-sm font-semibold mb-3">Distribuição de condições</p>
          <div className="flex gap-2 flex-wrap mb-3">
            {(Object.entries(conditionCounts) as [RoomCondition, number][])
              .filter(([, n]) => n > 0)
              .map(([cond, n]) => {
                const cfg = conditionOptions.find(o => o.value === cond)!;
                const Icon = cfg.icon;
                return (
                  <div key={cond} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                    <Icon size={11} /> {n}× {cfg.label}
                  </div>
                );
              })}
          </div>
          <div className="h-2 rounded-full overflow-hidden flex gap-0.5">
            {(['otimo','bom','regular','ruim','pessimo'] as RoomCondition[]).map(cond => {
              const total = Object.values(conditionCounts).reduce((a, b) => a + b, 0);
              const n = conditionCounts[cond];
              if (!n || !total) return null;
              const colors: Record<RoomCondition, string> = {
                otimo: '#22C55E', bom: '#3B82F6', regular: '#F59E0B', ruim: '#F97316', pessimo: '#EF4444'
              };
              return (
                <motion.div key={cond}
                  initial={{ width: 0 }}
                  animate={{ width: `${(n / total) * 100}%` }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{ background: colors[cond] }}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-muted-foreground text-[10px]">{form.rooms.length} cômodos</span>
            <span className="text-muted-foreground text-[10px]">{form.rooms.reduce((s, r) => s + r.items.length, 0)} itens</span>
          </div>
        </div>
      )}

      {/* General observations */}
      <div>
        <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">
          Observações gerais
        </label>
        <textarea
          value={form.generalObservations}
          onChange={e => setForm(f => ({ ...f, generalObservations: e.target.value }))}
          placeholder="Resumo geral da vistoria, pontos de atenção, etc..."
          rows={3}
          className="w-full px-4 py-3 bg-muted/70 dark:bg-white/5 border border-white/8 rounded-2xl text-white text-sm placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
        />
      </div>

      {/* Signatures */}
      <div>
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Assinaturas</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'signedByTenant' as const, label: 'Inquilino', icon: FileSignature },
            { key: 'signedByOwner' as const, label: 'Proprietário', icon: Shield },
          ].map(s => {
            const Icon = s.icon;
            const signed = form[s.key];
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setForm(f => ({ ...f, [s.key]: !f[s.key] }))}
                className={`flex items-center gap-2 p-3.5 rounded-2xl border transition-all duration-200 ${
                  signed
                    ? 'border-green-500/30 bg-green-500/10'
                    : 'border-white/8 hover:border-white/15'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  signed ? 'border-green-400 bg-green-400' : 'border-gray-600'
                }`}>
                  {signed && <Check size={11} className="text-white" strokeWidth={3} />}
                </div>
                <Icon size={14} className={signed ? 'text-green-400' : 'text-gray-500'} />
                <div className="text-left">
                  <p className={`text-xs font-semibold ${signed ? 'text-green-400' : 'text-gray-400'}`}>{s.label}</p>
                  <p className="text-[10px] text-gray-600">{signed ? 'Assinou' : 'Pendente'}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const STEPS = ['Dados gerais', 'Cômodos', 'Revisão'];

function canAdvance(form: FormState, step: number): boolean {
  if (step === 0) return !!form.propertyId && !!form.type && !!form.scheduledDate && !!form.inspector;
  if (step === 1) return form.rooms.length > 0;
  return true;
}

interface NewInspectionScreenProps {
  onBack: () => void;
  onSave: () => void;
}

export function NewInspectionScreen({ onBack, onSave }: NewInspectionScreenProps) {
  const { data: properties = [] } = useProperties();
  const { data: tenants = [] } = useTenants();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    propertyId: '',
    type: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    inspector: 'Carlos Vistoriador',
    tenantId: '',
    rooms: [],
    generalObservations: '',
    signedByTenant: false,
    signedByOwner: false,
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    setSaving(false);
    onSave();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col min-h-[calc(100vh-130px)] pb-2"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-muted/70 dark:bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0"
        >
          <ChevronLeft size={18} className="text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-foreground text-base font-bold leading-none">Nova Vistoria</h2>
          <p className="text-muted-foreground text-xs mt-1">{STEPS[step]}</p>
        </div>
        <StepBar step={step} total={STEPS.length} />
      </div>

      {/* Step labels */}
      <div className="flex items-center gap-1 mb-6">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
              i === step
                ? 'bg-violet-500/20 text-violet-400'
                : i < step
                ? 'text-green-400'
                : 'text-gray-600'
            }`}>
              {i < step ? <Check size={11} strokeWidth={3} /> : <span className="w-3 text-center">{i + 1}</span>}
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-4 transition-colors duration-300 ${i < step ? 'bg-green-500/40' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && <Step1 form={form} setForm={setForm} properties={properties} tenants={tenants} />}
            {step === 1 && <Step2 form={form} setForm={setForm} />}
            {step === 2 && <Step3 form={form} setForm={setForm} properties={properties} tenants={tenants} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 pt-4 mt-6 z-30" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 8px)' }}>
        <div className="flex gap-3 px-4">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl border border-white/10 text-gray-300 text-sm font-semibold hover:border-white/20 hover:text-white transition-colors"
            >
              <ChevronLeft size={16} /> Voltar
            </button>
          )}

          {step < STEPS.length - 1 ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => canAdvance(form, step) && setStep(s => s + 1)}
              disabled={!canAdvance(form, step)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                canAdvance(form, step)
                  ? 'gradient-accent text-white glow-accent'
                  : 'bg-muted/70 dark:bg-white/5 text-gray-600 cursor-not-allowed'
              }`}
            >
              Próximo <ChevronRight size={16} />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl gradient-accent text-white text-sm font-semibold glow-accent disabled:opacity-70"
            >
              {saving ? (
                <div className="flex gap-1.5">
                  {[0,1,2].map(i => (
                    <motion.div key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                      className="w-1.5 h-1.5 rounded-full bg-white"
                    />
                  ))}
                </div>
              ) : (
                <><Check size={16} strokeWidth={3} /> Salvar vistoria</>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
