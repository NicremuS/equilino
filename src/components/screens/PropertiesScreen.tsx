'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Grid3X3, List, MapPin, Bed, Bath, Maximize } from 'lucide-react';
import { useProperties } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ListItemSkeleton, ApiErrorState } from '@/components/shared/LoadingSkeleton';
import { PropertyProfileScreen } from './PropertyProfileScreen';
import type { Property, PropertyStatus } from '@/types';

const filters: { label: string; value: PropertyStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Ocupado', value: 'occupied' },
  { label: 'Vago', value: 'vacant' },
  { label: 'Manutenção', value: 'maintenance' },
];

export function PropertiesScreen() {
  const { data: properties, isLoading, isError, refetch } = useProperties();
  const [active, setActive] = useState<PropertyStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [isGrid, setIsGrid] = useState(true);
  const [selected, setSelected] = useState<Property | null>(null);

  const filtered = (properties ?? []).filter(p => {
    const matchStatus = active === 'all' || p.status === active;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <AnimatePresence mode="wait">
    {selected ? (
      <PropertyProfileScreen key="profile" property={selected} onBack={() => setSelected(null)} />
    ) : (
    <div className="space-y-5 pb-2">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-foreground text-xl font-bold">Imóveis</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{isLoading ? '…' : `${properties?.length ?? 0} propriedades`}</p>
        </div>
        <div className="premium-surface flex gap-1 rounded-xl p-1">
          <button onClick={() => setIsGrid(true)}
            className={`p-2 rounded-lg transition-colors ${isGrid ? 'bg-violet-500/20 text-violet-400' : 'text-muted-foreground hover:text-foreground'}`}>
            <Grid3X3 size={15} />
          </button>
          <button onClick={() => setIsGrid(false)}
            className={`p-2 rounded-lg transition-colors ${!isGrid ? 'bg-violet-500/20 text-violet-400' : 'text-muted-foreground hover:text-foreground'}`}>
            <List size={15} />
          </button>
        </div>
      </motion.div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou cidade..."
          className="w-full pl-9 pr-4 py-3 premium-surface rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50 transition-colors" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map(f => (
          <button key={f.value} onClick={() => setActive(f.value)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
              active === f.value ? 'bg-violet-500 border-violet-500 text-white' : 'border-border text-muted-foreground hover:border-violet-500/30 hover:bg-muted/60 hover:text-foreground'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {isError ? (
        <ApiErrorState onRetry={refetch} />
      ) : isLoading ? (
        <ListItemSkeleton count={4} />
      ) : (
        <AnimatePresence mode="popLayout">
          <div className={isGrid ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-2'}>
            {filtered.map((prop, i) => (
              <motion.div
                key={prop.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                onClick={() => setSelected(prop)}
                className="premium-surface rounded-2xl overflow-hidden cursor-pointer hover:border-violet-500/25 transition-colors"
              >
                {isGrid ? (
                  <>
                    <div className="relative h-36 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900">
                      {prop.image && (
                        <img src={prop.image} alt={prop.name} className="w-full h-full object-cover opacity-80" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute top-2 right-2">
                        <StatusBadge type="property" status={prop.status} />
                      </div>
                      <div className="absolute bottom-2 left-3">
                        <p className="text-white font-semibold text-sm leading-tight">{prop.name}</p>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
                        <MapPin size={11} />
                        <span className="truncate">{prop.city}</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground text-xs mb-3">
                        {prop.bedrooms && <span className="flex items-center gap-1"><Bed size={11} /> {prop.bedrooms}</span>}
                        {prop.bathrooms && <span className="flex items-center gap-1"><Bath size={11} /> {prop.bathrooms}</span>}
                        <span className="flex items-center gap-1"><Maximize size={11} /> {prop.area}m²</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-violet-400 font-bold text-sm">{formatCurrency(prop.rentAmount)}<span className="text-gray-500 font-normal text-xs">/mês</span></span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 overflow-hidden flex-shrink-0">
                      {prop.image && <img src={prop.image} alt={prop.name} className="w-full h-full object-cover opacity-80" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-sm font-medium truncate">{prop.name}</p>
                      <p className="text-muted-foreground text-xs flex items-center gap-1"><MapPin size={10} /> {prop.city}</p>
                      <p className="text-violet-400 text-xs font-semibold mt-0.5">{formatCurrency(prop.rentAmount)}/mês</p>
                    </div>
                    <StatusBadge type="property" status={prop.status} />
                  </div>
                )}
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-2 text-center py-16 text-gray-500">
                <MapPin size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum imóvel encontrado</p>
              </div>
            )}
          </div>
        </AnimatePresence>
      )}
    </div>
    )}
    </AnimatePresence>
  );
}
