// =====================================================
// Tipos compartidos con el backend.
// Espejan los modelos de Prisma del backend.
// =====================================================

export type RolUsuario =
  | 'SUPERADMIN'
  | 'ADMINISTRACION'
  | 'DOCENTE'
  | 'ALUMNO';

export type EstadoAlumno = 'ACTIVO' | 'INACTIVO' | 'EGRESADO' | 'SUSPENDIDO';

export type TipoInscripcion = 'CURSADA' | 'MESA_EXAMEN';

export type EstadoInscripcion =
  | 'PENDIENTE'
  | 'CONFIRMADA'
  | 'RECHAZADA'
  | 'CANCELADA';

export type EstadoCursada =
  | 'REGULAR'
  | 'LIBRE'
  | 'APROBADA'
  | 'REPROBADA'
  | 'EN_CURSO';

export type TipoConstancia =
  | 'ALUMNO_REGULAR'
  | 'ANALITICO_PARCIAL'
  | 'ANALITICO_FINAL'
  | 'EXAMEN_FINAL'
  | 'TITULO_EN_TRAMITE'
  | 'PROGRAMA_MATERIA';

export type EstadoConstancia =
  | 'SOLICITADA'
  | 'EN_PROCESO'
  | 'EMITIDA'
  | 'RECHAZADA';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: RolUsuario;
  activo?: boolean;
  ultimoLogin?: string | null;
  avatarUrl?: string | null;
  alumno?: { id: string; legajo: string; carrera: string; estado: EstadoAlumno } | null;
}

export interface Alumno {
  id: string;
  legajo: string;
  dni: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  telefono?: string | null;
  direccion?: string | null;
  carrera: string;
  anioIngreso: number;
  estado: EstadoAlumno;
  usuario?: Usuario;
}

export interface Materia {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  anio: number;
  cuatrimestre: number;
  cargaHoraria: number;
  cupoMaximo: number;
  carrera: string;
  activa: boolean;
  correlativasRequeridas?: Correlatividad[];
}

export interface Correlatividad {
  id: string;
  materiaId: string;
  requiereId: string;
  tipo: 'REGULAR' | 'APROBADA';
  requiere?: { id: string; codigo: string; nombre: string };
}

export type TipoParcial = 'PARCIAL' | 'RECUPERATORIO' | 'INTEGRACION';

export interface NotaParcial {
  id: string;
  inscripcionId: string;
  numero: number;
  tipo: TipoParcial;
  nota: number;
  fecha: string;
  observaciones?: string | null;
  creadoEn: string;
}

export interface Inscripcion {
  id: string;
  alumnoId: string;
  materiaId: string;
  tipo: TipoInscripcion;
  estado: EstadoInscripcion;
  estadoCursada: EstadoCursada | null;
  nota: number | null;
  fechaInscripcion: string;
  fechaExamen: string | null;
  cicloLectivo: number;
  observaciones?: string | null;
  materia?: Pick<Materia, 'id' | 'codigo' | 'nombre' | 'cupoMaximo'>;
  alumno?: Pick<Alumno, 'id' | 'legajo' | 'nombre' | 'apellido'>;
  notasParciales?: NotaParcial[];
}

export interface Constancia {
  id: string;
  alumnoId: string;
  tipo: TipoConstancia;
  estado: EstadoConstancia;
  motivo?: string | null;
  codigoVerificacion: string;
  archivoUrl?: string | null;
  fechaSolicitud: string;
  fechaEmision: string | null;
  observaciones?: string | null;
  alumno?: Pick<Alumno, 'id' | 'legajo' | 'dni' | 'nombre' | 'apellido' | 'carrera' | 'anioIngreso'>;
}

export interface Legajo {
  alumno: {
    id: string;
    legajo: string;
    dni: string;
    nombre: string;
    apellido: string;
    carrera: string;
    anioIngreso: number;
    estado: EstadoAlumno;
  };
  estadisticas: { totalMaterias: number; aprobadas: number; regulares: number };
  historial: Inscripcion[];
}

export interface Paginated<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

export interface LoginResponse {
  token: string;
  usuario: Pick<Usuario, 'id' | 'email' | 'nombre' | 'apellido' | 'rol'>;
}

// =====================================================
// Foro / aula virtual por materia
// =====================================================

export type TipoPublicacion = 'ANUNCIO' | 'MATERIAL' | 'HILO' | 'EXAMEN';

export interface AutorMini {
  id: string;
  nombre: string;
  apellido: string;
  rol: RolUsuario;
}

export interface Adjunto {
  id: string;
  nombreOriginal: string;
  mimeType: string;
  tamano: number;
  creadoEn: string;
}

export interface Comentario {
  id: string;
  contenido: string;
  creadoEn: string;
  autor: AutorMini;
}

export interface Publicacion {
  id: string;
  materiaId: string;
  tipo: TipoPublicacion;
  titulo: string;
  contenido: string;
  fijado: boolean;
  fechaExamen?: string | null;
  creadoEn: string;
  actualizadoEn: string;
  autor: AutorMini;
  adjuntos: Adjunto[];
  _count?: { comentarios: number };
}

export interface PublicacionDetalle extends Publicacion {
  comentarios: Comentario[];
  materia: { id: string; codigo: string; nombre: string };
  puedePublicar: boolean;
}

export interface ForoFeed {
  materia: {
    id: string;
    codigo: string;
    nombre: string;
    carrera: string;
    anio: number;
    cuatrimestre: number;
  };
  puedePublicar: boolean;
  total: number;
  page: number;
  pageSize: number;
  items: Publicacion[];
}

export interface MateriaMini {
  id: string;
  codigo: string;
  nombre: string;
}

export interface AgendaExamen {
  id: string;
  titulo: string;
  fechaExamen: string;
  materia: MateriaMini;
}

export interface AgendaNovedad {
  id: string;
  tipo: TipoPublicacion;
  titulo: string;
  creadoEn: string;
  materia: MateriaMini;
  autor: AutorMini;
}

export interface ForoAgenda {
  examenes: AgendaExamen[];
  novedades: AgendaNovedad[];
}

// =====================================================
// Calendario académico
// =====================================================

export type TipoEvento = 'EXAMEN' | 'MESA';

export interface EventoCalendario {
  id: string;
  tipo: TipoEvento;
  titulo: string;
  fecha: string; // ISO
  materia: MateriaMini | null;
  detalle?: string;
}

// =====================================================
// Auditoría
// =====================================================

export interface AuditLog {
  id: string;
  accion: string;
  actorId: string | null;
  actorEmail: string | null;
  targetId: string | null;
  targetNombre: string | null;
  descripcion: string;
  ip: string | null;
  creadoEn: string;
}
