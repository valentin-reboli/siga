import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Logo } from '../components/ui/Logo';
import { Spinner } from '../components/ui/Spinner';

export function LoginPage() {
  const { usuario, login, error, loading } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Si ya está logueado, redirigir
  if (usuario) return <Navigate to={from} replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    try {
      await login(email, password);
    } catch {
      // El AuthContext ya cargó el error.
    } finally {
      setSubmitting(false);
    }
  }

  const isLoading = submitting || loading;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header simple */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Logo size={26} />
          <div>
            <span className="font-serif text-base font-semibold text-navy-900 leading-none">
              ISCR
            </span>
            <p className="text-[11px] text-slate-500 leading-tight">
              Instituto Superior Cruz Roja Concordia
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-6 text-sm text-slate-600">
          <a href="#" className="hover:text-navy-700">Ayuda</a>
          <a href="#" className="hover:text-navy-700">Contacto</a>
        </nav>
      </header>

      {/* Contenido centrado */}
      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white border border-slate-200 shadow-card rounded-2xl px-10 py-10">
            <div className="flex flex-col items-center mb-8">
              <Logo size={52} />
              <h1 className="font-serif text-2xl font-semibold text-navy-900 mt-4 tracking-wide">
                ISCR
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Instituto Superior Cruz Roja Concordia
              </p>
            </div>

            {error && (
              <div className="mb-4">
                <ErrorAlert message={error} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Correo electrónico"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail size={16} />}
                required
              />

              <Input
                label="Contraseña"
                type={showPass ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    aria-label="Mostrar / ocultar contraseña"
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                required
              />

              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded border-slate-300 text-navy-700 focus:ring-navy-500"
                  />
                  Recordarme
                </label>
                <a href="#" className="text-navy-700 hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <Button type="submit" fullWidth disabled={isLoading}>
                {isLoading ? <Spinner size={18} className="text-white" /> : 'Iniciar sesión'}
              </Button>
            </form>

            <p className="text-xs text-center text-slate-500 mt-8">
              ¿Sos alumno nuevo? Solicitá tus credenciales a la administración.
            </p>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm font-semibold text-slate-900">
              Sistema Integral de Gestión Académica
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Plataforma institucional · Acceso para alumnos, docentes y personal administrativo
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-3 text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>© {new Date().getFullYear()} ISCR Concordia</span>
          <a href="#" className="hover:text-navy-700">Términos de uso</a>
          <a href="#" className="hover:text-navy-700">Privacidad</a>
          <a href="#" className="hover:text-navy-700">Soporte técnico</a>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Servicios operativos · v4.2.1</span>
        </div>
      </footer>
    </div>
  );
}
