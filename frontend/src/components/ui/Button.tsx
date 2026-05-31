import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger:
    'inline-flex items-center justify-center gap-2 bg-danger hover:bg-red-700 text-white font-semibold rounded-lg px-4 py-2.5 transition-colors',
};

export function Button({
  variant = 'primary',
  leftIcon,
  rightIcon,
  fullWidth,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={`${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`.trim()}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
