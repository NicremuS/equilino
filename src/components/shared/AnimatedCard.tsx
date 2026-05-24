'use client';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
  hover?: boolean;
}

/**
 * Card with enter animation and optional hover/tap effects.
 * Uses pure CSS — no framer-motion, zero JS animation overhead.
 */
export function AnimatedCard({ children, className, delay = 0, onClick, hover = true }: AnimatedCardProps) {
  return (
    <div
      style={delay > 0 ? { animationDelay: `${delay}s`, animationFillMode: 'both' } : undefined}
      onClick={onClick}
      className={cn(
        'premium-surface rounded-2xl p-4 animate-card-enter',
        hover && 'transition-[transform,box-shadow] duration-200 will-change-transform hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(109,93,246,0.14)]',
        onClick && 'cursor-pointer active:scale-[0.98]',
        className
      )}
    >
      {children}
    </div>
  );
}
