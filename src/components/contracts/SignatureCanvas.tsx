'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Eraser, PenLine } from 'lucide-react';

interface Props {
  onSignature?: (dataUrl: string) => void;
  width?: number;
  height?: number;
  className?: string;
  disabled?: boolean;
}

export function SignatureCanvas({ onSignature, width = 340, height = 140, className = '', disabled = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [hasStrokes, setHasStrokes] = useState(false);

  const getCtx = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.strokeStyle = '#c4b5fd'; // violet-300
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    return ctx;
  };

  const getPos = (e: MouseEvent | Touch, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'clientX' in e ? e.clientX : (e as Touch).clientX;
    const clientY = 'clientY' in e ? e.clientY : (e as Touch).clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDraw = useCallback((x: number, y: number) => {
    if (disabled) return;
    isDrawing.current = true;
    lastPos.current = { x, y };
    const ctx = getCtx();
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fillStyle = '#c4b5fd';
    ctx.fill();
    setHasStrokes(true);
  }, [disabled]);

  const draw = useCallback((x: number, y: number) => {
    if (!isDrawing.current || !lastPos.current || disabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPos.current = { x, y };
    setHasStrokes(true);
  }, [disabled]);

  const endDraw = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    lastPos.current = null;
    // Export signature
    const canvas = canvasRef.current;
    if (canvas && hasStrokes) {
      onSignature?.(canvas.toDataURL('image/png'));
    }
  }, [hasStrokes, onSignature]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Mouse events
    const onMouseDown = (e: MouseEvent) => {
      const pos = getPos(e, canvas);
      startDraw(pos.x, pos.y);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDrawing.current) return;
      const pos = getPos(e, canvas);
      draw(pos.x, pos.y);
    };
    const onMouseUp = () => endDraw();

    // Touch events
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const pos = getPos(e.touches[0], canvas);
      startDraw(pos.x, pos.y);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isDrawing.current) return;
      const pos = getPos(e.touches[0], canvas);
      draw(pos.x, pos.y);
    };
    const onTouchEnd = () => endDraw();

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [startDraw, draw, endDraw]);

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasStrokes(false);
      onSignature?.('');
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <PenLine size={13} />
          <span>Assine aqui</span>
        </div>
        {hasStrokes && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={clear}
            type="button"
            disabled={disabled}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Eraser size={12} />
            Limpar
          </motion.button>
        )}
      </div>

      <div className={`relative rounded-2xl border-2 overflow-hidden transition-colors ${
        disabled ? 'border-border cursor-not-allowed opacity-50' :
        hasStrokes ? 'border-violet-500/40' : 'border-dashed border-border hover:border-violet-500/30'
      }`}
        style={{ width: '100%', aspectRatio: `${width}/${height}` }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
          className={`bg-muted/30 dark:bg-white/3 ${disabled ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
        />
        {!hasStrokes && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-xs text-muted-foreground/50 select-none">
              Desenhe sua assinatura aqui
            </p>
          </div>
        )}
      </div>

      {hasStrokes && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-emerald-400 flex items-center gap-1"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          Assinatura capturada
        </motion.p>
      )}
    </div>
  );
}
