import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { materiasApi } from '../api/materias.api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { colorMateria } from '../utils/format';
import { Search } from 'lucide-react';

/**
 * Catálogo de materias visibles para cualquier usuario autenticado.
 * Permite filtrar por código/nombre/carrera/año.
 */
export function MateriasPage() {
  const [q, setQ] = useState('');
  const [anio, setAnio] = useState<number | ''>('');

  const materias = useApi(
    () =>
      materiasApi.list({
        q: q || undefined,
        anio: typeof anio === 'number' ? anio : undefined,
        activa: true,
        pageSize: 100,
      }),
    [q, anio],
  );

  return (
    <div className="max-w-screen-xl mx-auto">
      <Breadcrumb items={[{ label: 'SIGA', to: '/' }, { label: 'Catálogo de materias' }]} />

      <h1 className="font-serif text-2xl font-semibold text-navy-900 mb-1">
        Catálogo de materias
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Materias activas con sus correlatividades
      </p>

      <Card>
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por código o nombre…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
          <select
            value={anio}
            onChange={(e) => setAnio(e.target.value ? Number(e.target.value) : '')}
            className="form-input max-w-[10rem]"
          >
            <option value="">Todos los años</option>
            <option value="1">1° año</option>
            <option value="2">2° año</option>
            <option value="3">3° año</option>
            <option value="4">4° año</option>
          </select>
        </div>

        {materias.loading ? (
          <Spinner />
        ) : materias.error ? (
          <ErrorAlert message={materias.error} />
        ) : !materias.data?.items.length ? (
          <p className="text-sm text-slate-500 italic py-6 text-center">No se encontraron materias.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {materias.data.items.map((m) => {
              const color = colorMateria(m.codigo);
              return (
                <li key={m.id} className="py-4 flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0"
                    style={{ backgroundColor: color.bg, color: color.text }}
                  >
                    {m.codigo.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-slate-900">{m.nombre}</h4>
                      <Badge tone="neutral">{m.codigo}</Badge>
                      <span className="text-xs text-slate-500">
                        {m.anio}° año · {m.cuatrimestre === 0 ? 'Anual' : `${m.cuatrimestre}° cuatr.`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {m.carrera} · {m.cargaHoraria} hs · cupo {m.cupoMaximo}
                    </p>
                    {m.correlativasRequeridas && m.correlativasRequeridas.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-slate-400">Requiere:</span>
                        {m.correlativasRequeridas.map((c) => (
                          <Badge
                            key={c.id}
                            tone={c.tipo === 'APROBADA' ? 'success' : 'info'}
                          >
                            {c.requiere?.codigo} ({c.tipo.toLowerCase()})
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
