import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { materiasApi } from '../../api/materias.api';
import { colorMateria } from '../../utils/format';
import type { Materia } from '../../types';

/**
 * Buscador global de materias del header. Permite saltar al foro de cualquier
 * materia desde cualquier pantalla.
 */
export function MateriaQuickSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Materia[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  // Búsqueda con debounce.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancel = false;
    const t = setTimeout(async () => {
      try {
        const data = await materiasApi.list({ q: term, pageSize: 6, activa: true });
        if (!cancel) setResults(data.items);
      } catch {
        if (!cancel) setResults([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    }, 250);
    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [q]);

  // Cerrar al hacer click afuera.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function go(id: string) {
    navigate(`/materias/${id}`);
    setQ('');
    setResults([]);
    setOpen(false);
  }

  const showDropdown = open && q.trim().length >= 2;

  return (
    <div ref={boxRef} className="relative flex-1 max-w-xl">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) go(results[0].id);
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder="Buscar una materia e ir a su foro…"
        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
      />

      {showDropdown && (
        <div className="absolute z-40 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
              <Loader2 size={15} className="animate-spin" /> Buscando…
            </div>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">Sin resultados para “{q.trim()}”.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((m) => {
                const c = colorMateria(m.codigo);
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => go(m.id)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold"
                        style={{ backgroundColor: c.bg, color: c.text }}
                      >
                        {m.codigo.slice(0, 2)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-800">
                          {m.nombre}
                        </span>
                        <span className="block truncate text-xs text-slate-400">
                          {m.codigo} · {m.anio}° año
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
