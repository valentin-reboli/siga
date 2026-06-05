import { saludoHorario } from '../../utils/format';

interface Stat {
  label: string;
  value: string | number;
}

interface Props {
  nombre: string;
  rolLabel: string;
  subtitle?: string;
  stats?: Stat[];
}

/**
 * Banner de bienvenida del campus, compartido por todos los roles.
 * Muestra saludo, fecha, rol y (opcionalmente) métricas reales del usuario.
 */
export function CampusHero({ nombre, rolLabel, subtitle, stats = [] }: Props) {
  const hoy = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl bg-navy-900 p-7 text-white md:p-8">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 25%, rgba(255,255,255,0.5) 0, transparent 45%), radial-gradient(circle at 85% 80%, rgba(255,255,255,0.25) 0, transparent 40%)',
        }}
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase capitalize tracking-widest text-navy-200">
            {hoy}
          </p>
          <h1 className="mt-1.5 font-serif text-3xl font-semibold md:text-4xl">
            {saludoHorario()}, {nombre}.
          </h1>
          <p className="mt-2.5 flex flex-wrap items-center gap-2 text-sm text-navy-100">
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium">
              {rolLabel}
            </span>
            {subtitle && <span>{subtitle}</span>}
          </p>
        </div>

        {stats.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="min-w-[7rem] rounded-xl bg-white/10 px-4 py-3 backdrop-blur"
              >
                <p className="text-2xl font-semibold leading-none">{s.value}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-navy-200">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
