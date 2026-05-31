import type { ReactNode } from 'react';

type Tone = 'navy' | 'success' | 'warn' | 'danger' | 'neutral' | 'info';

const tones: Record<Tone, string> = {
  navy: 'bg-navy-100 text-navy-900',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warn: 'bg-amber-50 text-amber-700 border border-amber-200',
  danger: 'bg-red-50 text-red-700 border border-red-200',
  neutral: 'bg-slate-100 text-slate-700',
  info: 'bg-sky-50 text-sky-700 border border-sky-200',
};

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

export function Badge({ children, tone = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${tones[tone]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}

/** Punto coloreado (dot indicator). */
export function Dot({ color = '#16a34a' }: { color?: string }) {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}
