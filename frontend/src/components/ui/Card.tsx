import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Color hex para el borde superior (acento). */
  accentColor?: string;
  /** Padding interior. Por defecto 5 (1.25rem). */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ children, className = '', accentColor, padding = 'md' }: CardProps) {
  return (
    <div
      className={`siga-card ${paddingMap[padding]} ${className} overflow-hidden`.trim()}
      style={
        accentColor
          ? { borderTopColor: accentColor, borderTopWidth: 3 }
          : undefined
      }
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
