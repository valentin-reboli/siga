import { Dot } from '../ui/Badge';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-3 text-xs text-slate-500 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span>© {new Date().getFullYear()} ISCR Concordia</span>
        <a href="#" className="hover:text-navy-700">Términos</a>
        <a href="#" className="hover:text-navy-700">Soporte</a>
      </div>
      <div className="flex items-center gap-2">
        <Dot color="#16a34a" />
        <span>Servicios operativos</span>
        <span className="text-slate-400">·</span>
        <span>SIGA v4.2.1</span>
      </div>
    </footer>
  );
}
