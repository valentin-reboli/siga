import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

interface Props {
  asistencia: number; // 0-100
  clasesAsistidas: number;
  clasesTotales: number;
  asistenciaMinima: number; // %
  presentes: number;
  justificadas: number;
  sinJustificar: number;
  promedio: number;
  esRegular: boolean;
}

/**
 * Panel lateral con asistencia, faltas y promedio.
 * Replica el bloque "Mi cuatrimestre" del mockup.
 */
export function PanelCuatrimestre({
  asistencia,
  clasesAsistidas,
  clasesTotales,
  asistenciaMinima,
  presentes,
  justificadas,
  sinJustificar,
  promedio,
  esRegular,
}: Props) {
  return (
    <Card>
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <span className="inline-block w-1 h-4 bg-emerald-500 rounded-full" />
        Mi cuatrimestre
      </h3>

      {/* Donut + estado */}
      <div className="flex items-center gap-4 mb-4">
        <DonutAsistencia valor={asistencia} />
        <div>
          <Badge tone="success">REGULAR</Badge>
          <p className="text-sm text-slate-600 mt-2">
            {clasesAsistidas} de {clasesTotales} clases
          </p>
          <p className="text-xs text-slate-400">mín. {asistenciaMinima}%</p>
        </div>
      </div>

      {/* Asistencia detallada */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <CeldaResumen tono="success" titulo="Presentes" valor={presentes} />
        <CeldaResumen tono="warn" titulo="Justificadas" valor={justificadas} />
        <CeldaResumen tono="danger" titulo="Sin justif." valor={sinJustificar} />
      </div>

      {/* Promedio */}
      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Promedio general</p>
          <p className="font-serif text-2xl font-semibold text-slate-900 mt-1">
            {promedio.toFixed(1)}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Regularidad</p>
          <Badge tone={esRegular ? 'success' : 'danger'} className="mt-1">
            {esRegular ? 'Alumno regular' : 'No regular'}
          </Badge>
        </div>
      </div>
    </Card>
  );
}

function CeldaResumen({
  tono,
  titulo,
  valor,
}: {
  tono: 'success' | 'warn' | 'danger';
  titulo: string;
  valor: number;
}) {
  const colores = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warn: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
  } as const;
  return (
    <div className={`rounded-lg border px-3 py-2 ${colores[tono]}`}>
      <p className="text-[10px] uppercase tracking-wider opacity-70">{titulo}</p>
      <p className="text-lg font-semibold">{valor}</p>
    </div>
  );
}

/**
 * Donut SVG simple con el porcentaje de asistencia.
 */
function DonutAsistencia({ valor }: { valor: number }) {
  const tamaño = 80;
  const grosor = 9;
  const radio = (tamaño - grosor) / 2;
  const circ = 2 * Math.PI * radio;
  const dash = (Math.min(100, Math.max(0, valor)) / 100) * circ;
  return (
    <div className="relative" style={{ width: tamaño, height: tamaño }}>
      <svg width={tamaño} height={tamaño}>
        <circle
          cx={tamaño / 2}
          cy={tamaño / 2}
          r={radio}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={grosor}
        />
        <circle
          cx={tamaño / 2}
          cy={tamaño / 2}
          r={radio}
          fill="none"
          stroke="#16a34a"
          strokeWidth={grosor}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          transform={`rotate(-90 ${tamaño / 2} ${tamaño / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-base font-semibold text-slate-900">{valor}%</span>
        <span className="text-[9px] uppercase tracking-widest text-slate-400">Asist.</span>
      </div>
    </div>
  );
}
