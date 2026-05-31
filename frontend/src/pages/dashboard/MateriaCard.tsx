import { Clock, MapPin } from 'lucide-react';
import { colorMateria } from '../../utils/format';

interface Props {
  codigo: string;
  nombre: string;
  comision?: string;
  docente?: string;
  horario?: string;
  aula?: string;
}

/**
 * Card de materia en grilla. Toma el color a partir del código (consistente
 * a través de toda la app).
 */
export function MateriaCard({ codigo, nombre, comision, docente, horario, aula }: Props) {
  const color = colorMateria(codigo);

  return (
    <article
      className="relative bg-white border border-slate-200 rounded-xl p-4 hover:shadow-card transition-shadow"
      style={{ borderTopWidth: 3, borderTopColor: color.bg }}
    >
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
            {comision && `Com. ${comision}`} {docente && `· ${docente}`}
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
    </article>
  );
}
