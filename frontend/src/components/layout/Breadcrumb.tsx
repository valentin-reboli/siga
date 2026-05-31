import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbProps {
  items: Array<{ label: string; to?: string }>;
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {item.to && !isLast ? (
              <Link to={item.to} className="hover:text-navy-700">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-slate-700 font-medium' : ''}>{item.label}</span>
            )}
            {!isLast && <ChevronRight size={12} className="text-slate-300" />}
          </span>
        );
      })}
    </nav>
  );
}
