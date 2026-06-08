import { Clock, MapPin, MessageSquare, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { colorMateria } from '../../utils/format';

type EstadoCursadaLocal =
  | 'EN_CURSO'
  | 'REGULAR'
  | 'APROBADA'
  | 'REPROBADA'
  | 'LIBRE';

const ESTADO_CHIP: Record<
  EstadoCursadaLocal,
  { label: string; cls: string }
> = {
  EN_CURSO:  { label: 'En curso',  cls: 'bg-amber-100 text-amber-700' },
  REGULAR:   { label: 'Regular',   cls: 'bg-blue-100 text-blue-700' },
  APROBADA:  { label: 'Aprobada',  cls: 'bg-emerald-100 text-emerald-700' },
  REPROBADA: { label: 'Reprobada', cls: 'bg-red-100 text-red-700' },
  LIBRE:     { label: 'Libre',     cls: 'bg-red-100 text-red-600' },
};

interface Props {
  codigo: string;
  nombre: string;
  comision?: string;
  docente?: string;
  horario?: string;
  aula?: string;
  estadoCursada?: string;
  /** Si se pasa, la card es clickeable y navega a esa ruta (el foro de la materia). */
  to?: string;
}

/**
 * Card de materia en grilla. Toma el color a partir del código (consistente
 * a través de toda la app). Si recibe `to`, se vuelve un enlace al foro.
 */
export function MateriaCard({ codigo, nombre, comision, docente, horario, aula, estadoCursada, to }: Props) {
  const color = colorMateria(codigo);
  const chipInfo = estadoCursada ? ESTADO_CHIP[estadoCursada as EstadoCursadaLocal] : null;

  const content = (
    <>
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0"
          style={{ backgroundColor: color.bg, color: color.text }}
        >
          {codigo.slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-slate-900 truncate">{nombre}</h4>
            {chipInfo && (
              <span
                className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${chipInfo.cls}`}
              >
                {chipInfo.label}
              </span>
            )}
          </div>
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
