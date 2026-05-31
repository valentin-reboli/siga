import { Card } from '../components/ui/Card';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Calendar } from 'lucide-react';

/**
 * Página placeholder para el calendario académico.
 * El backend aún no expone endpoints de calendario; cuando se agreguen,
 * se puede integrar con un componente tipo react-big-calendar.
 */
export function CalendarioPage() {
  return (
    <div className="max-w-screen-xl mx-auto">
      <Breadcrumb items={[{ label: 'SIGA', to: '/' }, { label: 'Calendario académico' }]} />

      <h1 className="font-serif text-2xl font-semibold text-navy-900 mb-1">
        Calendario académico
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Fechas relevantes del cuatrimestre
      </p>

      <Card>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-navy-50 text-navy-700 w-14 h-14 rounded-full flex items-center justify-center mb-4">
            <Calendar size={26} />
          </div>
          <h3 className="font-semibold text-slate-900">Próximamente</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            Este módulo mostrará el cronograma de clases, mesas de examen y plazos
            administrativos del ciclo lectivo.
          </p>
        </div>
      </Card>
    </div>
  );
}
