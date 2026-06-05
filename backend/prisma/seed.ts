/**
 * Seed de SIGA — carga datos iniciales reales:
 * - Usuarios: admin, administrativo, 2 docentes de prueba, 2 alumnos de prueba
 * - Materias completas de ambas carreras con correlatividades
 */
import { PrismaClient, RolUsuario, TipoInscripcion, EstadoCursada, EstadoInscripcion } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────────────

async function hash(p: string) { return bcrypt.hash(p, 10); }

async function upsertUsuario(data: {
  email: string; password: string; nombre: string;
  apellido: string; rol: RolUsuario;
}) {
  const passwordHash = await hash(data.password);
  return prisma.usuario.upsert({
    where: { email: data.email },
    update: {},
    create: { email: data.email, passwordHash, nombre: data.nombre, apellido: data.apellido, rol: data.rol },
  });
}

async function upsertMateria(data: {
  codigo: string; nombre: string; anio: number; cuatrimestre: number;
  cargaHoraria: number; carrera: string; cupoMaximo?: number;
}) {
  return prisma.materia.upsert({
    where: { codigo: data.codigo },
    update: {},
    create: { ...data, cupoMaximo: data.cupoMaximo ?? 35, activa: true },
  });
}

async function upsertCorrelatividad(materiaId: string, requiereId: string, tipo: string) {
  return prisma.correlatividad.upsert({
    where: { materiaId_requiereId: { materiaId, requiereId } },
    update: {},
    create: { materiaId, requiereId, tipo },
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Iniciando seed...\n');

  // ── Usuarios institucionales ──────────────────────────────────────────────
  const admin = await upsertUsuario({
    email: 'admin@iscr.edu.ar', password: 'admin1234',
    nombre: 'Admin', apellido: 'SIGA', rol: RolUsuario.SUPERADMIN,
  });
  console.log(`✓ Superadmin:     ${admin.email} / admin1234`);

  const administrativo = await upsertUsuario({
    email: 'secretaria@iscr.edu.ar', password: 'secretaria1234',
    nombre: 'María', apellido: 'González', rol: RolUsuario.ADMINISTRACION,
  });
  console.log(`✓ Administración: ${administrativo.email} / secretaria1234`);

  const docenteEnf = await upsertUsuario({
    email: 'prof.enfermeria@iscr.edu.ar', password: 'docente1234',
    nombre: 'Laura', apellido: 'Ramírez', rol: RolUsuario.DOCENTE,
  });
  console.log(`✓ Docente ENF:    ${docenteEnf.email} / docente1234`);

  const docenteLab = await upsertUsuario({
    email: 'prof.laboratorio@iscr.edu.ar', password: 'docente1234',
    nombre: 'Carlos', apellido: 'Fernández', rol: RolUsuario.DOCENTE,
  });
  console.log(`✓ Docente LAB:    ${docenteLab.email} / docente1234`);

  // ── Alumnos de prueba ─────────────────────────────────────────────────────
  const alumnoUserEnf = await upsertUsuario({
    email: 'aperez@iscr.edu.ar', password: 'alumno1234',
    nombre: 'Ana', apellido: 'Pérez', rol: RolUsuario.ALUMNO,
  });
  const alumnoEnf = await prisma.alumno.upsert({
    where: { dni: '41111001' },
    update: {},
    create: {
      legajo: 'ENF-2026-001', dni: '41111001',
      nombre: 'Ana', apellido: 'Pérez',
      fechaNacimiento: new Date('2003-03-10'),
      telefono: '+54 345 4100001',
      carrera: 'Tecnicatura Superior en Enfermería',
      anioIngreso: 2026,
      usuarioId: alumnoUserEnf.id,
    },
  });
  console.log(`✓ Alumno ENF:     ${alumnoUserEnf.email} / alumno1234 (${alumnoEnf.legajo})`);

  const alumnoUserLab = await upsertUsuario({
    email: 'jrodriguez@iscr.edu.ar', password: 'alumno1234',
    nombre: 'Juan', apellido: 'Rodríguez', rol: RolUsuario.ALUMNO,
  });
  const alumnoLab = await prisma.alumno.upsert({
    where: { dni: '41111002' },
    update: {},
    create: {
      legajo: 'LAB-2026-001', dni: '41111002',
      nombre: 'Juan', apellido: 'Rodríguez',
      fechaNacimiento: new Date('2002-07-22'),
      telefono: '+54 345 4100002',
      carrera: 'Tecnicatura Superior en Laboratorio de Análisis Clínicos',
      anioIngreso: 2026,
      usuarioId: alumnoUserLab.id,
    },
  });
  console.log(`✓ Alumno LAB:     ${alumnoUserLab.email} / alumno1234 (${alumnoLab.legajo})`);

  // ── Materias: Tecnicatura en Enfermería ───────────────────────────────────
  console.log('\nCargando materias de Enfermería...');
  const ENF = 'Tecnicatura Superior en Enfermería';

  const enf101 = await upsertMateria({ codigo: 'ENF-101', nombre: 'Práctica Profesional I', anio: 1, cuatrimestre: 1, cargaHoraria: 96, carrera: ENF });
  const enf102 = await upsertMateria({ codigo: 'ENF-102', nombre: 'Salud Pública', anio: 1, cuatrimestre: 1, cargaHoraria: 64, carrera: ENF });
  const enf103 = await upsertMateria({ codigo: 'ENF-103', nombre: 'Biofísica y Bioquímica', anio: 1, cuatrimestre: 1, cargaHoraria: 64, carrera: ENF });
  const enf104 = await upsertMateria({ codigo: 'ENF-104', nombre: 'Microbiología y Parasitología', anio: 1, cuatrimestre: 1, cargaHoraria: 64, carrera: ENF });
  const enf105 = await upsertMateria({ codigo: 'ENF-105', nombre: 'Fundamentos de Nutrición', anio: 1, cuatrimestre: 1, cargaHoraria: 48, carrera: ENF });
  const enf106 = await upsertMateria({ codigo: 'ENF-106', nombre: 'Fundamentos de Enfermería', anio: 1, cuatrimestre: 2, cargaHoraria: 96, carrera: ENF });
  const enf107 = await upsertMateria({ codigo: 'ENF-107', nombre: 'Enfermería Materno Infantil I', anio: 1, cuatrimestre: 2, cargaHoraria: 64, carrera: ENF });
  const enf108 = await upsertMateria({ codigo: 'ENF-108', nombre: 'Farmacología en Enfermería', anio: 1, cuatrimestre: 2, cargaHoraria: 64, carrera: ENF });
  const enf109 = await upsertMateria({ codigo: 'ENF-109', nombre: 'Estructura y Función del Cuerpo Humano', anio: 1, cuatrimestre: 2, cargaHoraria: 96, carrera: ENF });

  const enf201 = await upsertMateria({ codigo: 'ENF-201', nombre: 'Práctica Profesional II', anio: 2, cuatrimestre: 1, cargaHoraria: 96, carrera: ENF });
  const enf202 = await upsertMateria({ codigo: 'ENF-202', nombre: 'Introducción a la Investigación en Salud', anio: 2, cuatrimestre: 1, cargaHoraria: 48, carrera: ENF });
  const enf203 = await upsertMateria({ codigo: 'ENF-203', nombre: 'Informática en Enfermería', anio: 2, cuatrimestre: 1, cargaHoraria: 48, carrera: ENF });
  const enf204 = await upsertMateria({ codigo: 'ENF-204', nombre: 'Dietética en Enfermería', anio: 2, cuatrimestre: 1, cargaHoraria: 48, carrera: ENF });
  const enf205 = await upsertMateria({ codigo: 'ENF-205', nombre: 'Enfermería del Adulto y el Anciano', anio: 2, cuatrimestre: 2, cargaHoraria: 96, carrera: ENF });
  const enf206 = await upsertMateria({ codigo: 'ENF-206', nombre: 'Enfermería en Salud Mental', anio: 2, cuatrimestre: 2, cargaHoraria: 64, carrera: ENF });
  const enf207 = await upsertMateria({ codigo: 'ENF-207', nombre: 'Inglés', anio: 2, cuatrimestre: 2, cargaHoraria: 48, carrera: ENF });
  const enf208 = await upsertMateria({ codigo: 'ENF-208', nombre: 'Epidemiología y Estadística en Salud', anio: 2, cuatrimestre: 2, cargaHoraria: 64, carrera: ENF });

  const enf301 = await upsertMateria({ codigo: 'ENF-301', nombre: 'Práctica Profesional III', anio: 3, cuatrimestre: 1, cargaHoraria: 96, carrera: ENF });
  const enf302 = await upsertMateria({ codigo: 'ENF-302', nombre: 'Educación en Salud', anio: 3, cuatrimestre: 1, cargaHoraria: 64, carrera: ENF });
  const enf303 = await upsertMateria({ codigo: 'ENF-303', nombre: 'Organización y Gestión de los Servicios en Salud', anio: 3, cuatrimestre: 1, cargaHoraria: 64, carrera: ENF });
  const enf304 = await upsertMateria({ codigo: 'ENF-304', nombre: 'Investigación y Planificación en Salud', anio: 3, cuatrimestre: 1, cargaHoraria: 64, carrera: ENF });
  const enf305 = await upsertMateria({ codigo: 'ENF-305', nombre: 'Enfermería Materno Infantil II', anio: 3, cuatrimestre: 2, cargaHoraria: 64, carrera: ENF });
  const enf306 = await upsertMateria({ codigo: 'ENF-306', nombre: 'Organización y Gestión de los Servicios en Enfermería', anio: 3, cuatrimestre: 2, cargaHoraria: 64, carrera: ENF });
  const enf307 = await upsertMateria({ codigo: 'ENF-307', nombre: 'Enfermería en Emergencias y Catástrofes', anio: 3, cuatrimestre: 2, cargaHoraria: 64, carrera: ENF });
  const enf308 = await upsertMateria({ codigo: 'ENF-308', nombre: 'Aspectos Éticos y Legales de la Práctica Profesional', anio: 3, cuatrimestre: 2, cargaHoraria: 48, carrera: ENF });

  console.log(`  ✓ 25 materias de Enfermería`);

  // ── Materias: Tecnicatura en Laboratorio ──────────────────────────────────
  console.log('Cargando materias de Laboratorio...');
  const LAB = 'Tecnicatura Superior en Laboratorio de Análisis Clínicos';

  const lab101 = await upsertMateria({ codigo: 'LAB-101', nombre: 'Práctica Profesional I', anio: 1, cuatrimestre: 1, cargaHoraria: 96, carrera: LAB });
  const lab102 = await upsertMateria({ codigo: 'LAB-102', nombre: 'Biología General', anio: 1, cuatrimestre: 1, cargaHoraria: 64, carrera: LAB });
  const lab103 = await upsertMateria({ codigo: 'LAB-103', nombre: 'Fundamentos Básicos de Química', anio: 1, cuatrimestre: 1, cargaHoraria: 64, carrera: LAB });
  const lab104 = await upsertMateria({ codigo: 'LAB-104', nombre: 'Matemática', anio: 1, cuatrimestre: 1, cargaHoraria: 64, carrera: LAB });
  const lab105 = await upsertMateria({ codigo: 'LAB-105', nombre: 'Informática', anio: 1, cuatrimestre: 1, cargaHoraria: 48, carrera: LAB });
  const lab106 = await upsertMateria({ codigo: 'LAB-106', nombre: 'Fundamentos Básicos de las Ciencias de la Salud', anio: 1, cuatrimestre: 2, cargaHoraria: 64, carrera: LAB });
  const lab107 = await upsertMateria({ codigo: 'LAB-107', nombre: 'Inglés', anio: 1, cuatrimestre: 2, cargaHoraria: 48, carrera: LAB });
  const lab108 = await upsertMateria({ codigo: 'LAB-108', nombre: 'Comunicación', anio: 1, cuatrimestre: 2, cargaHoraria: 48, carrera: LAB });
  const lab109 = await upsertMateria({ codigo: 'LAB-109', nombre: 'Estructura y Función del Organismo Humano', anio: 1, cuatrimestre: 2, cargaHoraria: 96, carrera: LAB });

  const lab201 = await upsertMateria({ codigo: 'LAB-201', nombre: 'Práctica Profesional II', anio: 2, cuatrimestre: 1, cargaHoraria: 96, carrera: LAB });
  const lab202 = await upsertMateria({ codigo: 'LAB-202', nombre: 'Química Biológica', anio: 2, cuatrimestre: 1, cargaHoraria: 96, carrera: LAB });
  const lab203 = await upsertMateria({ codigo: 'LAB-203', nombre: 'Procedimientos Técnicos', anio: 2, cuatrimestre: 1, cargaHoraria: 96, carrera: LAB });
  const lab204 = await upsertMateria({ codigo: 'LAB-204', nombre: 'Salud Pública', anio: 2, cuatrimestre: 1, cargaHoraria: 48, carrera: LAB });
  const lab205 = await upsertMateria({ codigo: 'LAB-205', nombre: 'Admisión del Paciente', anio: 2, cuatrimestre: 1, cargaHoraria: 48, carrera: LAB });
  const lab206 = await upsertMateria({ codigo: 'LAB-206', nombre: 'Farmacología', anio: 2, cuatrimestre: 2, cargaHoraria: 64, carrera: LAB });
  const lab207 = await upsertMateria({ codigo: 'LAB-207', nombre: 'Epidemiología y Estadística en Salud', anio: 2, cuatrimestre: 2, cargaHoraria: 64, carrera: LAB });
  const lab208 = await upsertMateria({ codigo: 'LAB-208', nombre: 'Psicología', anio: 2, cuatrimestre: 2, cargaHoraria: 48, carrera: LAB });
  const lab209 = await upsertMateria({ codigo: 'LAB-209', nombre: 'Inmunohematología y Hemostasia', anio: 2, cuatrimestre: 2, cargaHoraria: 96, carrera: LAB });

  const lab301 = await upsertMateria({ codigo: 'LAB-301', nombre: 'Práctica Profesional III', anio: 3, cuatrimestre: 1, cargaHoraria: 96, carrera: LAB });
  const lab302 = await upsertMateria({ codigo: 'LAB-302', nombre: 'Microbiología y Parasitología', anio: 3, cuatrimestre: 1, cargaHoraria: 96, carrera: LAB });
  const lab303 = await upsertMateria({ codigo: 'LAB-303', nombre: 'Control de Calidad', anio: 3, cuatrimestre: 1, cargaHoraria: 64, carrera: LAB });
  const lab304 = await upsertMateria({ codigo: 'LAB-304', nombre: 'Gestión del Laboratorio', anio: 3, cuatrimestre: 1, cargaHoraria: 64, carrera: LAB });
  const lab305 = await upsertMateria({ codigo: 'LAB-305', nombre: 'Organización y Seguridad en el Laboratorio', anio: 3, cuatrimestre: 2, cargaHoraria: 64, carrera: LAB });
  const lab306 = await upsertMateria({ codigo: 'LAB-306', nombre: 'Práctica Profesional Integradora', anio: 3, cuatrimestre: 2, cargaHoraria: 96, carrera: LAB });
  const lab307 = await upsertMateria({ codigo: 'LAB-307', nombre: 'Primeros Auxilios', anio: 3, cuatrimestre: 2, cargaHoraria: 48, carrera: LAB });
  const lab308 = await upsertMateria({ codigo: 'LAB-308', nombre: 'Bioética', anio: 3, cuatrimestre: 2, cargaHoraria: 48, carrera: LAB });

  console.log(`  ✓ 26 materias de Laboratorio`);

  // ── Correlatividades: Enfermería ──────────────────────────────────────────
  console.log('\nCargando correlatividades...');

  // PP escalonadas
  await upsertCorrelatividad(enf201.id, enf101.id, 'APROBADA'); // PP II → PP I aprobada
  await upsertCorrelatividad(enf301.id, enf201.id, 'APROBADA'); // PP III → PP II aprobada

  // 2° año requiere bases de 1° año
  await upsertCorrelatividad(enf204.id, enf105.id, 'REGULAR');  // Dietética → Fund. Nutrición
  await upsertCorrelatividad(enf205.id, enf106.id, 'REGULAR');  // Adulto → Fund. Enfermería
  await upsertCorrelatividad(enf205.id, enf109.id, 'REGULAR');  // Adulto → Estructura y Función
  await upsertCorrelatividad(enf206.id, enf106.id, 'REGULAR');  // Salud Mental → Fund. Enfermería
  await upsertCorrelatividad(enf208.id, enf102.id, 'REGULAR');  // Epidemiología → Salud Pública

  // 3° año requiere 2° año
  await upsertCorrelatividad(enf302.id, enf102.id, 'REGULAR');  // Educación en Salud → Salud Pública
  await upsertCorrelatividad(enf303.id, enf205.id, 'REGULAR');  // OGS Salud → Adulto y Anciano
  await upsertCorrelatividad(enf304.id, enf202.id, 'REGULAR');  // Inv. Planif. → Intro Investigación
  await upsertCorrelatividad(enf305.id, enf107.id, 'APROBADA'); // MI II → MI I aprobada
  await upsertCorrelatividad(enf306.id, enf303.id, 'REGULAR');  // OGE → OGS Salud
  await upsertCorrelatividad(enf307.id, enf205.id, 'REGULAR');  // Emergencias → Adulto y Anciano
  await upsertCorrelatividad(enf308.id, enf201.id, 'REGULAR');  // Ética → PP II

  // ── Correlatividades: Laboratorio ────────────────────────────────────────

  await upsertCorrelatividad(lab201.id, lab101.id, 'APROBADA'); // PP II → PP I aprobada
  await upsertCorrelatividad(lab301.id, lab201.id, 'APROBADA'); // PP III → PP II aprobada
  await upsertCorrelatividad(lab306.id, lab301.id, 'REGULAR');  // PPI → PP III

  await upsertCorrelatividad(lab202.id, lab103.id, 'REGULAR');  // Química Biológica → Fund. Química
  await upsertCorrelatividad(lab203.id, lab106.id, 'REGULAR');  // Procedimientos → Fund. Ciencias Salud
  await upsertCorrelatividad(lab207.id, lab104.id, 'REGULAR');  // Epidemiología → Matemática
  await upsertCorrelatividad(lab209.id, lab202.id, 'REGULAR');  // Inmunohematología → Química Biológica
  await upsertCorrelatividad(lab209.id, lab109.id, 'REGULAR');  // Inmunohematología → Estructura y Función

  await upsertCorrelatividad(lab302.id, lab102.id, 'REGULAR');  // Microbiología → Biología General
  await upsertCorrelatividad(lab302.id, lab106.id, 'REGULAR');  // Microbiología → Fund. Ciencias Salud
  await upsertCorrelatividad(lab303.id, lab203.id, 'REGULAR');  // Control Calidad → Procedimientos
  await upsertCorrelatividad(lab304.id, lab204.id, 'REGULAR');  // Gestión Lab → Salud Pública
  await upsertCorrelatividad(lab305.id, lab203.id, 'REGULAR');  // Organización → Procedimientos
  await upsertCorrelatividad(lab308.id, lab201.id, 'REGULAR');  // Bioética → PP II

  console.log('  ✓ 28 correlatividades cargadas');

  // ── Asignación de docentes a materias ─────────────────────────────────────
  console.log('\nAsignando docentes a materias...');

  const docenteMateriasEnf = [enf106.id, enf107.id, enf205.id, enf206.id, enf305.id];
  for (const materiaId of docenteMateriasEnf) {
    await prisma.docenteMateria.upsert({
      where: { usuarioId_materiaId_cicloLectivo: { usuarioId: docenteEnf.id, materiaId, cicloLectivo: 0 } },
      update: {},
      create: { usuarioId: docenteEnf.id, materiaId, cicloLectivo: 0 },
    });
  }

  const docenteMateriasLab = [lab202.id, lab203.id, lab209.id, lab302.id, lab303.id];
  for (const materiaId of docenteMateriasLab) {
    await prisma.docenteMateria.upsert({
      where: { usuarioId_materiaId_cicloLectivo: { usuarioId: docenteLab.id, materiaId, cicloLectivo: 0 } },
      update: {},
      create: { usuarioId: docenteLab.id, materiaId, cicloLectivo: 0 },
    });
  }

  console.log('  ✓ Docentes asignados a materias');

  // ── Inscripciones de prueba ────────────────────────────────────────────────
  console.log('\nCreando inscripciones de prueba...');

  await prisma.inscripcion.upsert({
    where: { alumnoId_materiaId_tipo_cicloLectivo: { alumnoId: alumnoEnf.id, materiaId: enf101.id, tipo: TipoInscripcion.CURSADA, cicloLectivo: 2026 } },
    update: {},
    create: { alumnoId: alumnoEnf.id, materiaId: enf101.id, tipo: TipoInscripcion.CURSADA, cicloLectivo: 2026, estado: EstadoInscripcion.CONFIRMADA, estadoCursada: EstadoCursada.APROBADA, nota: 8 },
  });
  await prisma.inscripcion.upsert({
    where: { alumnoId_materiaId_tipo_cicloLectivo: { alumnoId: alumnoEnf.id, materiaId: enf102.id, tipo: TipoInscripcion.CURSADA, cicloLectivo: 2026 } },
    update: {},
    create: { alumnoId: alumnoEnf.id, materiaId: enf102.id, tipo: TipoInscripcion.CURSADA, cicloLectivo: 2026, estado: EstadoInscripcion.CONFIRMADA, estadoCursada: EstadoCursada.EN_CURSO },
  });
  await prisma.inscripcion.upsert({
    where: { alumnoId_materiaId_tipo_cicloLectivo: { alumnoId: alumnoLab.id, materiaId: lab101.id, tipo: TipoInscripcion.CURSADA, cicloLectivo: 2026 } },
    update: {},
    create: { alumnoId: alumnoLab.id, materiaId: lab101.id, tipo: TipoInscripcion.CURSADA, cicloLectivo: 2026, estado: EstadoInscripcion.CONFIRMADA, estadoCursada: EstadoCursada.APROBADA, nota: 9 },
  });
  await prisma.inscripcion.upsert({
    where: { alumnoId_materiaId_tipo_cicloLectivo: { alumnoId: alumnoLab.id, materiaId: lab102.id, tipo: TipoInscripcion.CURSADA, cicloLectivo: 2026 } },
    update: {},
    create: { alumnoId: alumnoLab.id, materiaId: lab102.id, tipo: TipoInscripcion.CURSADA, cicloLectivo: 2026, estado: EstadoInscripcion.CONFIRMADA, estadoCursada: EstadoCursada.EN_CURSO },
  });

  console.log('  ✓ Inscripciones de prueba creadas');

  console.log('\n✅ Seed completado.\n');
  console.log('Accesos disponibles:');
  console.log('  admin@iscr.edu.ar          / admin1234        (SUPERADMIN)');
  console.log('  secretaria@iscr.edu.ar     / secretaria1234   (ADMINISTRACION)');
  console.log('  prof.enfermeria@iscr.edu.ar / docente1234     (DOCENTE)');
  console.log('  prof.laboratorio@iscr.edu.ar / docente1234    (DOCENTE)');
  console.log('  aperez@iscr.edu.ar         / alumno1234       (ALUMNO - Enfermería)');
  console.log('  jrodriguez@iscr.edu.ar     / alumno1234       (ALUMNO - Laboratorio)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
