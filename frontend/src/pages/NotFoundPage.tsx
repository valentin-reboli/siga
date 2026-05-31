import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto text-center py-20">
      <p className="font-serif text-6xl font-semibold text-navy-900">404</p>
      <h1 className="text-xl font-semibold text-slate-900 mt-2">Página no encontrada</h1>
      <p className="text-sm text-slate-500 mt-2">
        La ruta que buscaste no existe o fue movida.
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button leftIcon={<Home size={16} />}>Volver al inicio</Button>
        </Link>
      </div>
    </div>
  );
}
