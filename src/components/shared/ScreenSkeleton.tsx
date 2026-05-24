'use client';
// Pure CSS skeleton — zero JS animation overhead, shown while lazy screen chunks load
export function ScreenSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Carregando...">
      {/* Hero card */}
      <div className="h-40 rounded-2xl bg-muted" />
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-2xl bg-muted" />
        <div className="h-24 rounded-2xl bg-muted" />
      </div>
      {/* Main card */}
      <div className="h-52 rounded-2xl bg-muted" />
      {/* List items */}
      <div className="space-y-2.5">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
