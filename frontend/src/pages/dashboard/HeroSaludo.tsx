import { saludoHorario } from '../../utils/format';
import { MapPin, Clock } from 'lucide-react';

interface ProximaClase {
  materia: string;
  horario: string;
  aula: string;
  docente: string;
  enHoras?: string;
}

interface Props {
  nombre: string;
  carrera: string;
  anio?: number;
  comision?: string;
  proximaClase?: ProximaClase;
}

/**
 * Banner azul de bienvenida que aparece arriba del dashboard.
 * Incluye saludo y card lateral con la próxima clase.
 */
export function HeroSaludo({ nombre, carrera, anio, comision, proximaClase }: Props) {
  const hoy = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <section className="bg-navy-900 text-white rounded-2xl p-8 mb-6 relative overflow-hidden">
      {/* Patrón sutil de fondo */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0, transparent 50%)',
        }}
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-navy-200 font-medium">
            {hoy}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold mt-1.5">
            {saludoHorario()}, {nombre}.
          </h1>
          <p className="text-navy-100 mt-2 text-sm">
            {carrera}
            {anio !== undefined && ` · ${anio}° año`}
            {comision && ` · Comisión ${comision}`}
          </p>
        </div>

        {proximaClase && (
          <div className="bg-navy-800/70 border border-navy-700 backdrop-blur rounded-xl p-5 min-w-[18rem]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] uppercase tracking-widest text-navy-200 font-medium">
                Tu próxima clase
              </p>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Hoy
              </span>
            </div>
            <p className="font-serif text-xl font-semibold">{proximaClase.materia}</p>
            <div className="text-sm text-navy-100 mt-2 space-y-1">
              <p className="flex items-center gap-2">
                <Clock size={14} /> {proximaClase.horario}
                <span className="text-navy-300 mx-1">·</span>
                <MapPin size={14} /> {proximaClase.aula}
              </p>
              <p className="text-xs">
                {proximaClase.docente}
                {proximaClase.enHoras && ` · Comienza en ${proximaClase.enHoras}`}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
