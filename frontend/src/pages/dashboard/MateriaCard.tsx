import { Clock, MapPin, MessageSquare, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { colorMateria } from '../../utils/format';

interface Props {
  codigo: string;
  nombre: string;
  comision?: string;
  docente?: string;
  horario?: string;
  aula?: string;
  /** Si se pasa, la card es clickeable y navega a esa ruta (el foro de la materia). */
  to?: string;
}

/**
 * Card de materia en grilla. Toma el color a partir del código (consistente
 * a través de toda la app). Si recibe `to`, se vuelve un enlace al foro.
 */
export function MateriaCard({ codigo, nombre, comision, docente, horario, aula, to }: Props) {
  const color = colorMateria(codigo);

  const content = (
    <>
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0"
          style={{ backgroundColor: color.bg, color: color.text }}
        >
          {codigo.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <h4 className="font-semibold text-slate-900 truncate">{nombre}</h4>
          <p className="text-xs text-slate-500 truncate">
            {codigo}
            {comision && ` · Com. ${comision}`}
            {docente && ` · ${docente}`}
          </p>
        </div>
      </div>

      {(horario || aula) && (
        <div className="flex items-center text-xs text-slate-500 gap-3">
          {horario && (
            <span className="flex items-center gap-1.5">
              <Clock size={12} /> {horario}
            </span>
          )}
          {aula && (
            <span className="flex items-center gap-1.5">
              <MapPin size={12} /> {aula}
            </span>
          )}
        </div>
      )}

      {to && (
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-navy-700">
            <MessageSquare size={13} /> Ir al foro
          </span>
          <ArrowRight
            size={14}
            className="text-slate-300 transition-colors group-hover:text-navy-700"
          />
        </div>
      )}
    </>
  );

  const baseClass =
    'relative block bg-white border border-slate-200 rounded-xl p-4 transition-all';

  if (to) {
    return (
      <Link
        to={to}
        className={`group ${baseClass} hover:-translate-y-0.5 hover:shadow-card`}
        style={{ borderTopWidth: 3, borderTopColor: color.bg }}
      >
        {content}
      </Link>
    );
  }

  return (
    <article
      className={`${baseClass} hover:shadow-card`}
      style={{ borderTopWidth: 3, borderTopColor: color.bg }}
    >
      {content}
    </article>
  );
}
