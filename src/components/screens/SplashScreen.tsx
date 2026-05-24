'use client';
import { useEffect, useRef } from 'react';
import { Building2 } from 'lucide-react';

interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    // Timer fires quickly once JS loads — the actual "loading" time IS the splash.
    // In dev mode the browser downloads ~11MB of unminified JS first, so we keep
    // this short and let the user tap to skip if they're on a slow connection.
    const t = window.setTimeout(() => onDoneRef.current(), 800);
    return () => window.clearTimeout(t);
  }, []);

  return (
    // Tap anywhere to skip — useful on slow connections (e.g. mobile dev mode)
    <div
      className="fixed inset-0 bg-[#0B0F1A] flex flex-col items-center justify-center z-50 overflow-hidden cursor-pointer select-none"
      onClick={() => onDoneRef.current()}
    >
      {/* Background orbs — pure CSS, no JS needed */}
      <div className="absolute w-96 h-96 rounded-full bg-violet-600/15 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-64 h-64 rounded-full bg-violet-400/8 blur-[80px] pointer-events-none" />

      {/* Logo — CSS animation, visible regardless of framer-motion */}
      <div className="splash-enter flex flex-col items-center gap-5 relative z-10">
        <div className="w-24 h-24 rounded-3xl gradient-accent flex items-center justify-center glow-accent">
          <Building2 size={44} className="text-white" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Equi<span className="text-gradient">lino</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2 font-medium tracking-wide">
            Gestão Imobiliária Premium
          </p>
        </div>
      </div>

      {/* Loading dots — pure CSS animation */}
      <div className="absolute bottom-16 flex gap-2">
        <div className="splash-dot w-2 h-2 rounded-full bg-violet-400" />
        <div className="splash-dot w-2 h-2 rounded-full bg-violet-400" />
        <div className="splash-dot w-2 h-2 rounded-full bg-violet-400" />
      </div>
    </div>
  );
}
