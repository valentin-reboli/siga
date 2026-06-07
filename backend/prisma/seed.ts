/**
 * Seed de SIGA — datos completos y reales:
 *   · Materias correctas de la Tecnicatura en Enfermería (34 materias, plan vigente)
 *   · Materias de Laboratorio de Análisis Clínicos (26 materias)
 *   · Correlatividades pedagógicamente coherentes para ambas carreras
 *   · 20 docentes para ENF y 14 para LAB (al menos 1 por materia)
 *   · 30 alumnos por carrera (10 por año de ingreso: 2024, 2025, 2026)
 *   · Inscripciones realistas para alumnos de 2.° y 3.° año
 */
import {
  PrismaClient, RolUsuario,
  TipoInscripcion, EstadoCursada, EstadoInscripcion,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ── Helpers ───────────────────────────────────────────────────────────────────

async function hash(p: string) { return bcrypt.hash(p, 10); }

/** Normaliza texto para email: minúsculas, sin tildes, solo a-z. */
function norm(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '');
}

async function upsertUsuario(data: {
  email: string; password: string; nombre: string; apellido: string; rol: RolUsuario;
}) {
  const passwordHash = await hash(data.password);
  return prisma.usuario.upsert({
    where:  { email: data.email },
    update: {},
    create: { email: data.email, passwordHash, nombre: data.nombre, apellido: data.apellido, rol: data.rol },
  });
}

type MateriaInput = {
  codigo: string; nombre: string; anio: number; cuatrimestre: number;
  cargaHoraria: number; carrera: string; cupoMaximo?: number;
};
async function upsertMateria(d: MateriaInput) {
  return prisma.materia.upsert({
    where:  { codigo: d.codigo },
    update: { nombre: d.nombre, anio: d.anio, cuatrimestre: d.cuatrimestre, cargaHoraria: d.cargaHoraria, carrera: d.carrera },
    create: { ...d, cupoMaximo: d.cupoMaximo ?? 35, activa: true },
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Iniciando seed...\n');

  // ── Limpieza ────────────────────────────────────────────────────────────────
  // Al borrar usuarios ALUMNO/DOCENTE las cascadas eliminan automáticamente:
  //   alumnos → inscripciones, constancias
  //   docenteMateria, publicaciones, comentarios
  console.log('⚙  Limpiando datos anteriores...');
  await prisma.correlatividad.deleteMany({});
  await prisma.usuario.deleteMany({ where: { rol: { in: [RolUsuario.ALUMNO, RolUsuario.DOCENTE] } } });
  console.log('   ✓ Listo\n');

  // ── Usuarios institucionales fijos ──────────────────────────────────────────
  const admin = await upsertUsuario({
    email: 'admin@iscr.edu.ar', password: 'admin1234',
    nombre: 'Admin', apellido: 'SIGA', rol: RolUsuario.SUPERADMIN,
  });
  const secretaria = await upsertUsuario({
    email: 'secretaria@iscr.edu.ar', password: 'secretaria1234',
    nombre: 'María', apellido: 'González', rol: RolUsuario.ADMINISTRACION,
  });
  console.log(`✓ ${admin.email}      / admin1234`);
  console.log(`✓ ${secretaria.email} / secretaria1234\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // MATERIAS — Tecnicatura Superior en Enfermería (34 materias)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('Cargando materias de Enfermería...');
  const ENF = 'Tecnicatura Superior en Enfermería';

  // 1.° Año — Cuatrimestre 1
  const enf101 = await upsertMateria({ codigo: 'ENF-101', nombre: 'Introducción y Fundamentos de los Cuidados de Enfermería', anio: 1, cuatrimestre: 1, cargaHoraria: 96,  carrera: ENF });
  const enf102 = await upsertMateria({ codigo: 'ENF-102', nombre: 'Anatomía y Fisiología',                                       anio: 1, cuatrimestre: 1, cargaHoraria: 80,  carrera: ENF });
  const enf103 = await upsertMateria({ codigo: 'ENF-103', nombre: 'Bioquímica',                                                   anio: 1, cuatrimestre: 1, cargaHoraria: 64,  carrera: ENF });
  const enf104 = await upsertMateria({ codigo: 'ENF-104', nombre: 'Biofísica',                                                    anio: 1, cuatrimestre: 1, cargaHoraria: 64,  carrera: ENF });
  const enf105 = await upsertMateria({ codigo: 'ENF-105', nombre: 'Bioética y Deontología',                                      anio: 1, cuatrimestre: 1, cargaHoraria: 48,  carrera: ENF });
  const enf109 = await upsertMateria({ codigo: 'ENF-109', nombre: 'Conocimiento de la Realidad Social en el Contexto Global',    anio: 1, cuatrimestre: 1, cargaHoraria: 48,  carrera: ENF });

  // 1.° Año — Cuatrimestre 2
  const enf106 = await upsertMateria({ codigo: 'ENF-106', nombre: 'Metodología de la Investigación I',  anio: 1, cuatrimestre: 2, cargaHoraria: 48,  carrera: ENF });
  const enf107 = await upsertMateria({ codigo: 'ENF-107', nombre: 'Salud Pública',                      anio: 1, cuatrimestre: 2, cargaHoraria: 64,  carrera: ENF });
  const enf108 = await upsertMateria({ codigo: 'ENF-108', nombre: 'Farmacología I',                     anio: 1, cuatrimestre: 2, cargaHoraria: 64,  carrera: ENF });
  const enf110 = await upsertMateria({ codigo: 'ENF-110', nombre: 'Microbiología y Parasitología',      anio: 1, cuatrimestre: 2, cargaHoraria: 64,  carrera: ENF });
  const enf111 = await upsertMateria({ codigo: 'ENF-111', nombre: 'Primeros Auxilios',                  anio: 1, cuatrimestre: 2, cargaHoraria: 64,  carrera: ENF });
  const enf112 = await upsertMateria({ codigo: 'ENF-112', nombre: 'Prácticas Profesionalizantes I',     anio: 1, cuatrimestre: 2, cargaHoraria: 128, carrera: ENF });

  // 2.° Año — Cuatrimestre 1
  const enf201 = await upsertMateria({ codigo: 'ENF-201', nombre: 'Cuidados de Enfermería del Adulto y Anciano',         anio: 2, cuatrimestre: 1, cargaHoraria: 96, carrera: ENF });
  const enf202 = await upsertMateria({ codigo: 'ENF-202', nombre: 'Enfermería en Salud Mental y Psiquiatría',            anio: 2, cuatrimestre: 1, cargaHoraria: 64, carrera: ENF });
  const enf203 = await upsertMateria({ codigo: 'ENF-203', nombre: 'Aspectos Psicosociales y Culturales del Desarrollo', anio: 2, cuatrimestre: 1, cargaHoraria: 48, carrera: ENF });
  const enf204 = await upsertMateria({ codigo: 'ENF-204', nombre: 'Proceso Social Aplicado en el Contexto de Salud',    anio: 2, cuatrimestre: 1, cargaHoraria: 48, carrera: ENF });
  const enf205 = await upsertMateria({ codigo: 'ENF-205', nombre: 'Metodología de la Investigación II',                 anio: 2, cuatrimestre: 1, cargaHoraria: 48, carrera: ENF });
  const enf206 = await upsertMateria({ codigo: 'ENF-206', nombre: 'Alimentación, Nutrición y Dietoterapia',             anio: 2, cuatrimestre: 1, cargaHoraria: 64, carrera: ENF });

  // 2.° Año — Cuatrimestre 2
  const enf207 = await upsertMateria({ codigo: 'ENF-207', nombre: 'Enfermería en Salud Comunitaria',                    anio: 2, cuatrimestre: 2, cargaHoraria: 64,  carrera: ENF });
  const enf208 = await upsertMateria({ codigo: 'ENF-208', nombre: 'Farmacología II',                                    anio: 2, cuatrimestre: 2, cargaHoraria: 64,  carrera: ENF });
  const enf209 = await upsertMateria({ codigo: 'ENF-209', nombre: 'Cuidados Integrados Basados en la Evidencia I',     anio: 2, cuatrimestre: 2, cargaHoraria: 64,  carrera: ENF });
  const enf210 = await upsertMateria({ codigo: 'ENF-210', nombre: 'Idioma Extranjero: Inglés Técnico',                 anio: 2, cuatrimestre: 2, cargaHoraria: 48,  carrera: ENF });
  const enf211 = await upsertMateria({ codigo: 'ENF-211', nombre: 'Prácticas Profesionalizantes II',                   anio: 2, cuatrimestre: 2, cargaHoraria: 160, carrera: ENF });

  // 3.° Año — Cuatrimestre 1
  const enf301 = await upsertMateria({ codigo: 'ENF-301', nombre: 'Enfermería de la Madre, Niño y Adolescentes',               anio: 3, cuatrimestre: 1, cargaHoraria: 96, carrera: ENF });
  const enf302 = await upsertMateria({ codigo: 'ENF-302', nombre: 'Administración y Gestión de los Recursos en Enfermería',   anio: 3, cuatrimestre: 1, cargaHoraria: 64, carrera: ENF });
  const enf303 = await upsertMateria({ codigo: 'ENF-303', nombre: 'Comunicación y Educación',                                  anio: 3, cuatrimestre: 1, cargaHoraria: 48, carrera: ENF });
  const enf304 = await upsertMateria({ codigo: 'ENF-304', nombre: 'Marcos Legales',                                            anio: 3, cuatrimestre: 1, cargaHoraria: 48, carrera: ENF });
  const enf305 = await upsertMateria({ codigo: 'ENF-305', nombre: 'Urgencia y Emergencia',                                    anio: 3, cuatrimestre: 1, cargaHoraria: 80, carrera: ENF });
  const enf306 = await upsertMateria({ codigo: 'ENF-306', nombre: 'Informática',                                               anio: 3, cuatrimestre: 1, cargaHoraria: 48, carrera: ENF });

  // 3.° Año — Cuatrimestre 2
  const enf307 = await upsertMateria({ codigo: 'ENF-307', nombre: 'Cuidados Integrados Basados en la Evidencia II',           anio: 3, cuatrimestre: 2, cargaHoraria: 64,  carrera: ENF });
  const enf308 = await upsertMateria({ codigo: 'ENF-308', nombre: 'Idioma Extranjero: Portugués',                              anio: 3, cuatrimestre: 2, cargaHoraria: 48,  carrera: ENF });
  const enf309 = await upsertMateria({ codigo: 'ENF-309', nombre: 'Derechos Humanos',                                         anio: 3, cuatrimestre: 2, cargaHoraria: 48,  carrera: ENF });
  const enf310 = await upsertMateria({ codigo: 'ENF-310', nombre: 'Seminario de Investigación',                               anio: 3, cuatrimestre: 2, cargaHoraria: 64,  carrera: ENF });
  const enf311 = await upsertMateria({ codigo: 'ENF-311', nombre: 'Prácticas Profesionalizantes III',                         anio: 3, cuatrimestre: 2, cargaHoraria: 192, carrera: ENF });

  console.log('   ✓ 34 materias ENF');

  // ═══════════════════════════════════════════════════════════════════════════
  // MATERIAS — Tecnicatura Superior en Laboratorio de Análisis Clínicos (26)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('Cargando materias de Laboratorio...');
  const LAB = 'Tecnicatura Superior en Laboratorio de Análisis Clínicos';

  const lab101 = await upsertMateria({ codigo: 'LAB-101', nombre: 'Prácticas Profesionalizantes I',                      anio: 1, cuatrimestre: 1, cargaHoraria: 96, carrera: LAB });
  const lab102 = await upsertMateria({ codigo: 'LAB-102', nombre: 'Biología General',                                    anio: 1, cuatrimestre: 1, cargaHoraria: 64, carrera: LAB });
  const lab103 = await upsertMateria({ codigo: 'LAB-103', nombre: 'Fundamentos Básicos de Química',                      anio: 1, cuatrimestre: 1, cargaHoraria: 64, carrera: LAB });
  const lab104 = await upsertMateria({ codigo: 'LAB-104', nombre: 'Matemática',                                          anio: 1, cuatrimestre: 1, cargaHoraria: 64, carrera: LAB });
  const lab105 = await upsertMateria({ codigo: 'LAB-105', nombre: 'Informática',                                         anio: 1, cuatrimestre: 1, cargaHoraria: 48, carrera: LAB });
  const lab106 = await upsertMateria({ codigo: 'LAB-106', nombre: 'Fundamentos Básicos de las Ciencias de la Salud',    anio: 1, cuatrimestre: 2, cargaHoraria: 64, carrera: LAB });
  const lab107 = await upsertMateria({ codigo: 'LAB-107', nombre: 'Inglés',                                              anio: 1, cuatrimestre: 2, cargaHoraria: 48, carrera: LAB });
  const lab108 = await upsertMateria({ codigo: 'LAB-108', nombre: 'Comunicación',                                        anio: 1, cuatrimestre: 2, cargaHoraria: 48, carrera: LAB });
  const lab109 = await upsertMateria({ codigo: 'LAB-109', nombre: 'Estructura y Función del Organismo Humano',           anio: 1, cuatrimestre: 2, cargaHoraria: 96, carrera: LAB });

  const lab201 = await upsertMateria({ codigo: 'LAB-201', nombre: 'Prácticas Profesionalizantes II',     anio: 2, cuatrimestre: 1, cargaHoraria: 96, carrera: LAB });
  const lab202 = await upsertMateria({ codigo: 'LAB-202', nombre: 'Química Biológica',                   anio: 2, cuatrimestre: 1, cargaHoraria: 96, carrera: LAB });
  const lab203 = await upsertMateria({ codigo: 'LAB-203', nombre: 'Procedimientos Técnicos',             anio: 2, cuatrimestre: 1, cargaHoraria: 96, carrera: LAB });
  const lab204 = await upsertMateria({ codigo: 'LAB-204', nombre: 'Salud Pública',                       anio: 2, cuatrimestre: 1, cargaHoraria: 48, carrera: LAB });
  const lab205 = await upsertMateria({ codigo: 'LAB-205', nombre: 'Admisión del Paciente',               anio: 2, cuatrimestre: 1, cargaHoraria: 48, carrera: LAB });
  const lab206 = await upsertMateria({ codigo: 'LAB-206', nombre: 'Farmacología',                        anio: 2, cuatrimestre: 2, cargaHoraria: 64, carrera: LAB });
  const lab207 = await upsertMateria({ codigo: 'LAB-207', nombre: 'Epidemiología y Estadística en Salud',anio: 2, cuatrimestre: 2, cargaHoraria: 64, carrera: LAB });
  const lab208 = await upsertMateria({ codigo: 'LAB-208', nombre: 'Psicología',                          anio: 2, cuatrimestre: 2, cargaHoraria: 48, carrera: LAB });
  const lab209 = await upsertMateria({ codigo: 'LAB-209', nombre: 'Inmunohematología y Hemostasia',      anio: 2, cuatrimestre: 2, cargaHoraria: 96, carrera: LAB });

  const lab301 = await upsertMateria({ codigo: 'LAB-301', nombre: 'Prácticas Profesionalizantes III',              anio: 3, cuatrimestre: 1, cargaHoraria: 96, carrera: LAB });
  const lab302 = await upsertMateria({ codigo: 'LAB-302', nombre: 'Microbiología y Parasitología',                 anio: 3, cuatrimestre: 1, cargaHoraria: 96, carrera: LAB });
  const lab303 = await upsertMateria({ codigo: 'LAB-303', nombre: 'Control de Calidad',                           anio: 3, cuatrimestre: 1, cargaHoraria: 64, carrera: LAB });
  const lab304 = await upsertMateria({ codigo: 'LAB-304', nombre: 'Gestión del Laboratorio',                      anio: 3, cuatrimestre: 1, cargaHoraria: 64, carrera: LAB });
  const lab305 = await upsertMateria({ codigo: 'LAB-305', nombre: 'Organización y Seguridad en el Laboratorio',  anio: 3, cuatrimestre: 2, cargaHoraria: 64, carrera: LAB });
  const lab306 = await upsertMateria({ codigo: 'LAB-306', nombre: 'Práctica Profesional Integradora',             anio: 3, cuatrimestre: 2, cargaHoraria: 96, carrera: LAB });
  const lab307 = await upsertMateria({ codigo: 'LAB-307', nombre: 'Primeros Auxilios',                            anio: 3, cuatrimestre: 2, cargaHoraria: 48, carrera: LAB });
  const lab308 = await upsertMateria({ codigo: 'LAB-308', nombre: 'Bioética',                                     anio: 3, cuatrimestre: 2, cargaHoraria: 48, carrera: LAB });

  console.log('   ✓ 26 materias LAB\n');

  // ═══════════════════════════════════════════════════════════════════════════
  // CORRELATIVIDADES — Enfermería
  //
  // Criterio general:
  //   · REGULAR  = tener la cursada aprobada (asistencia + parciales)
  //   · APROBADA = haber rendido y aprobado el examen final
  //
  // Las materias de 1.° año no tienen correlativas de ingreso.
  // Las PP escalonadas se exigen APROBADA (práctica completa anterior).
  // Asignaturas teóricas que amplían un área exigen REGULAR de la base.
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('Cargando correlatividades ENF...');

  // — 2.° Año —
  // Cuidados Adulto/Anciano: base clínica + soporte anatómico
  await prisma.correlatividad.create({ data: { materiaId: enf201.id, requiereId: enf101.id, tipo: 'REGULAR'  } });
  await prisma.correlatividad.create({ data: { materiaId: enf201.id, requiereId: enf102.id, tipo: 'REGULAR'  } });
  // Salud Mental: requiere fundamentos de cuidados
  await prisma.correlatividad.create({ data: { materiaId: enf202.id, requiereId: enf101.id, tipo: 'REGULAR'  } });
  // Aspectos Psicosociales: amplía Realidad Social
  await prisma.correlatividad.create({ data: { materiaId: enf203.id, requiereId: enf109.id, tipo: 'REGULAR'  } });
  // Proceso Social en Salud: amplía Salud Pública
  await prisma.correlatividad.create({ data: { materiaId: enf204.id, requiereId: enf107.id, tipo: 'REGULAR'  } });
  // Met. Investigación II: continuación directa → exige aprobada
  await prisma.correlatividad.create({ data: { materiaId: enf205.id, requiereId: enf106.id, tipo: 'APROBADA' } });
  // Alimentación/Nutrición: requiere base bioquímica
  await prisma.correlatividad.create({ data: { materiaId: enf206.id, requiereId: enf103.id, tipo: 'REGULAR'  } });
  // Enfermería Comunitaria: requiere Salud Pública + Fundamentos
  await prisma.correlatividad.create({ data: { materiaId: enf207.id, requiereId: enf107.id, tipo: 'REGULAR'  } });
  await prisma.correlatividad.create({ data: { materiaId: enf207.id, requiereId: enf101.id, tipo: 'REGULAR'  } });
  // Farmacología II: continuación directa → exige aprobada; también bioquímica
  await prisma.correlatividad.create({ data: { materiaId: enf208.id, requiereId: enf108.id, tipo: 'APROBADA' } });
  await prisma.correlatividad.create({ data: { materiaId: enf208.id, requiereId: enf103.id, tipo: 'REGULAR'  } });
  // Cuidados Integrados I: requiere fundamentos y PP I regular (integración clínica)
  await prisma.correlatividad.create({ data: { materiaId: enf209.id, requiereId: enf101.id, tipo: 'REGULAR'  } });
  await prisma.correlatividad.create({ data: { materiaId: enf209.id, requiereId: enf112.id, tipo: 'REGULAR'  } });
  // PP II: práctica escalonada → exige PP I aprobada
  await prisma.correlatividad.create({ data: { materiaId: enf211.id, requiereId: enf112.id, tipo: 'APROBADA' } });

  // — 3.° Año —
  // Madre/Niño/Adolescente: base en Adulto/Anciano + anatomía
  await prisma.correlatividad.create({ data: { materiaId: enf301.id, requiereId: enf201.id, tipo: 'REGULAR'  } });
  await prisma.correlatividad.create({ data: { materiaId: enf301.id, requiereId: enf102.id, tipo: 'REGULAR'  } });
  // Administración/Gestión: requiere núcleo clínico + PP II
  await prisma.correlatividad.create({ data: { materiaId: enf302.id, requiereId: enf201.id, tipo: 'REGULAR'  } });
  await prisma.correlatividad.create({ data: { materiaId: enf302.id, requiereId: enf211.id, tipo: 'REGULAR'  } });
  // Comunicación y Educación: amplía proceso social
  await prisma.correlatividad.create({ data: { materiaId: enf303.id, requiereId: enf204.id, tipo: 'REGULAR'  } });
  // Marcos Legales: requiere Bioética aprobada (fundamento ético previo)
  await prisma.correlatividad.create({ data: { materiaId: enf304.id, requiereId: enf105.id, tipo: 'APROBADA' } });
  // Urgencia y Emergencia: requiere Adulto/Anciano + Primeros Auxilios aprobados
  await prisma.correlatividad.create({ data: { materiaId: enf305.id, requiereId: enf201.id, tipo: 'REGULAR'  } });
  await prisma.correlatividad.create({ data: { materiaId: enf305.id, requiereId: enf111.id, tipo: 'APROBADA' } });
  // Cuidados Integrados II: continuación directa → exige CI I aprobada
  await prisma.correlatividad.create({ data: { materiaId: enf307.id, requiereId: enf209.id, tipo: 'APROBADA' } });
  // Derechos Humanos: amplía Bioética (solo regular)
  await prisma.correlatividad.create({ data: { materiaId: enf309.id, requiereId: enf105.id, tipo: 'REGULAR'  } });
  // Seminario de Investigación: requiere Met. II aprobada
  await prisma.correlatividad.create({ data: { materiaId: enf310.id, requiereId: enf205.id, tipo: 'APROBADA' } });
  // PP III: práctica escalonada → exige PP II aprobada
  await prisma.correlatividad.create({ data: { materiaId: enf311.id, requiereId: enf211.id, tipo: 'APROBADA' } });

  console.log('   ✓ 25 correlatividades ENF');

  // ═══════════════════════════════════════════════════════════════════════════
  // CORRELATIVIDADES — Laboratorio
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('Cargando correlatividades LAB...');

  // PP escalonadas
  await prisma.correlatividad.create({ data: { materiaId: lab201.id, requiereId: lab101.id, tipo: 'APROBADA' } });
  await prisma.correlatividad.create({ data: { materiaId: lab301.id, requiereId: lab201.id, tipo: 'APROBADA' } });
  await prisma.correlatividad.create({ data: { materiaId: lab306.id, requiereId: lab301.id, tipo: 'REGULAR'  } });
  // 2.° año
  await prisma.correlatividad.create({ data: { materiaId: lab202.id, requiereId: lab103.id, tipo: 'REGULAR'  } }); // Química Bio → Fund. Química
  await prisma.correlatividad.create({ data: { materiaId: lab203.id, requiereId: lab106.id, tipo: 'REGULAR'  } }); // Procedimientos → Fund. Ciencias Salud
  await prisma.correlatividad.create({ data: { materiaId: lab207.id, requiereId: lab104.id, tipo: 'REGULAR'  } }); // Epidemiología → Matemática
  await prisma.correlatividad.create({ data: { materiaId: lab209.id, requiereId: lab202.id, tipo: 'REGULAR'  } }); // Inmunohematología → Química Bio
  await prisma.correlatividad.create({ data: { materiaId: lab209.id, requiereId: lab109.id, tipo: 'REGULAR'  } }); // Inmunohematología → Estructura y Función
  // 3.° año
  await prisma.correlatividad.create({ data: { materiaId: lab302.id, requiereId: lab102.id, tipo: 'REGULAR'  } }); // Microbiología → Biología General
  await prisma.correlatividad.create({ data: { materiaId: lab302.id, requiereId: lab106.id, tipo: 'REGULAR'  } }); // Microbiología → Fund. Ciencias Salud
  await prisma.correlatividad.create({ data: { materiaId: lab303.id, requiereId: lab203.id, tipo: 'REGULAR'  } }); // Control Calidad → Procedimientos
  await prisma.correlatividad.create({ data: { materiaId: lab304.id, requiereId: lab204.id, tipo: 'REGULAR'  } }); // Gestión Lab → Salud Pública
  await prisma.correlatividad.create({ data: { materiaId: lab305.id, requiereId: lab203.id, tipo: 'REGULAR'  } }); // Organización → Procedimientos
  await prisma.correlatividad.create({ data: { materiaId: lab308.id, requiereId: lab201.id, tipo: 'REGULAR'  } }); // Bioética → PP II

  console.log('   ✓ 14 correlatividades LAB\n');

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCENTES — Enfermería (20 docentes, 34 materias cubiertas)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('Creando docentes...');

  // Helper: crea el usuario docente y lo asigna a las materias indicadas
  async function docente(nombre: string, apellido: string, materias: { id: string }[]) {
    const email = `${norm(nombre)}.${norm(apellido)}@iscr.edu.ar`;
    const u = await prisma.usuario.create({
      data: {
        email, nombre, apellido,
        passwordHash: await hash('docente1234'),
        rol: RolUsuario.DOCENTE,
      },
    });
    for (const m of materias) {
      await prisma.docenteMateria.create({
        data: { usuarioId: u.id, materiaId: m.id, cicloLectivo: 0 },
      });
    }
    return u;
  }

  // ENF — asignaciones agrupadas por afinidad pedagógica
  await docente('Lidia',       'Sosa',       [enf101, enf112]);          // Fundamentos + PP I
  await docente('Roberto',     'Ibáñez',     [enf102]);                  // Anatomía y Fisiología
  await docente('Patricia',    'Villanueva', [enf103, enf104]);          // Bioquímica + Biofísica
  await docente('Silvia',      'Correa',     [enf105, enf309]);          // Bioética + Derechos Humanos
  await docente('Hugo',        'Medina',     [enf106, enf205, enf310]);  // Met. Investigación I, II + Seminario
  await docente('Graciela',    'Vega',       [enf107, enf204, enf207]);  // Salud Pública + Proceso Social + Comunitaria
  await docente('Jorge',       'Castillo',   [enf108, enf208]);          // Farmacología I + II
  await docente('Natalia',     'Bravo',      [enf109, enf203]);          // Realidad Social + Aspectos Psicosociales
  await docente('Fernando',    'Ríos',       [enf110]);                  // Microbiología y Parasitología
  await docente('Claudia',     'Benítez',    [enf111, enf305]);          // Primeros Auxilios + Urgencia y Emergencia
  await docente('Susana',      'Herrera',    [enf201, enf301]);          // Adulto/Anciano + Madre/Niño/Adolescente
  await docente('Alejandra',   'Giménez',    [enf202]);                  // Salud Mental y Psiquiatría
  await docente('Pablo',       'Acosta',     [enf206]);                  // Alimentación, Nutrición y Dietoterapia
  await docente('María Elena', 'Fuentes',    [enf209, enf307]);          // Cuidados Integrados I + II
  await docente('Daniel',      'Quiroga',    [enf210, enf308]);          // Inglés Técnico + Portugués
  await docente('Andrea',      'Molina',     [enf211, enf311]);          // PP II + PP III
  await docente('Ricardo',     'Ojeda',      [enf302]);                  // Administración y Gestión
  await docente('Verónica',    'Luna',       [enf303]);                  // Comunicación y Educación
  await docente('Gustavo',     'Peralta',    [enf304]);                  // Marcos Legales
  await docente('Inés',        'Cabrera',    [enf306]);                  // Informática

  console.log('   ✓ 20 docentes ENF');

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCENTES — Laboratorio (14 docentes, 26 materias cubiertas)
  // ═══════════════════════════════════════════════════════════════════════════

  await docente('Ana Belén',  'Torres',    [lab101, lab201, lab301, lab306]); // todas las PP
  await docente('Carlos',     'Fernández', [lab109, lab202]);                 // Estructura/Función + Química Bio
  await docente('Eduardo',    'Suárez',    [lab102, lab302]);                 // Biología General + Microbiología
  await docente('Marcela',    'Rojas',     [lab103, lab203, lab303]);         // Química + Procedimientos + Control Calidad
  await docente('Adrián',     'Paz',       [lab104, lab207]);                 // Matemática + Epidemiología
  await docente('Graciela',   'Montes',    [lab105]);                         // Informática
  await docente('Beatriz',    'Oviedo',    [lab106, lab204]);                 // Fund. Ciencias Salud + Salud Pública
  await docente('Horacio',    'Delgado',   [lab107]);                         // Inglés
  await docente('Isabel',     'Ponce',     [lab108, lab205]);                 // Comunicación + Admisión Paciente
  await docente('Roberto',    'Quispe',    [lab206, lab307]);                 // Farmacología + Primeros Auxilios
  await docente('Claudia',    'Vera',      [lab208]);                         // Psicología
  await docente('Fernando',   'Espinoza',  [lab209]);                         // Inmunohematología y Hemostasia
  await docente('Ricardo',    'Zamora',    [lab304, lab305]);                 // Gestión + Organización del Laboratorio
  await docente('Pedro',      'García',    [lab308]);                         // Bioética

  console.log('   ✓ 14 docentes LAB\n');

  // ═══════════════════════════════════════════════════════════════════════════
  // ALUMNOS — 30 por carrera (10 por año de ingreso)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('Creando alumnos...');

  // Tablas de alumnos: [nombre, apellido, dni, fechaNacimiento, anioIngreso, legajo]
  const alumnosENF: [string, string, string, string, number, string][] = [
    // — Ingreso 2024 (3.° año actual) —
    ['Valentina', 'García',     '35001001', '2004-03-15', 2024, 'ENF-2024-001'],
    ['Lucía',     'Martínez',   '35001002', '2004-07-22', 2024, 'ENF-2024-002'],
    ['Florencia', 'López',      '35001003', '2003-11-05', 2024, 'ENF-2024-003'],
    ['Camila',    'Rodríguez',  '35001004', '2004-01-28', 2024, 'ENF-2024-004'],
    ['Natalia',   'Fernández',  '35001005', '2003-09-14', 2024, 'ENF-2024-005'],
    ['Paola',     'Sánchez',    '35001006', '2004-05-30', 2024, 'ENF-2024-006'],
    ['Carla',     'González',   '35001007', '2003-12-08', 2024, 'ENF-2024-007'],
    ['Marcos',    'Álvarez',    '35001008', '2004-02-19', 2024, 'ENF-2024-008'],
    ['Diego',     'Torres',     '35001009', '2003-06-25', 2024, 'ENF-2024-009'],
    ['Martín',    'Ruiz',       '35001010', '2004-08-11', 2024, 'ENF-2024-010'],
    // — Ingreso 2025 (2.° año actual) —
    ['Sofía',      'Ramírez',   '36001001', '2005-04-17', 2025, 'ENF-2025-001'],
    ['Daniela',    'Moreno',    '36001002', '2005-09-03', 2025, 'ENF-2025-002'],
    ['Carolina',   'Díaz',      '36001003', '2005-01-22', 2025, 'ENF-2025-003'],
    ['Valeria',    'Castro',    '36001004', '2005-06-14', 2025, 'ENF-2025-004'],
    ['Mariana',    'Herrera',   '36001005', '2005-11-29', 2025, 'ENF-2025-005'],
    ['Constanza',  'Medina',    '36001006', '2005-03-07', 2025, 'ENF-2025-006'],
    ['Agustina',   'Cruz',      '36001007', '2005-08-21', 2025, 'ENF-2025-007'],
    ['Fernanda',   'Vargas',    '36001008', '2005-05-12', 2025, 'ENF-2025-008'],
    ['Sebastián',  'Flores',    '36001009', '2005-10-04', 2025, 'ENF-2025-009'],
    ['Rodrigo',    'Navarro',   '36001010', '2005-02-16', 2025, 'ENF-2025-010'],
    // — Ingreso 2026 (1.° año actual) —
    ['Micaela',  'Suárez',      '37001001', '2006-07-08', 2026, 'ENF-2026-001'],
    ['Brenda',   'Ortiz',       '37001002', '2006-01-25', 2026, 'ENF-2026-002'],
    ['Melina',   'Reyes',       '37001003', '2006-09-17', 2026, 'ENF-2026-003'],
    ['Cecilia',  'Molina',      '37001004', '2006-04-03', 2026, 'ENF-2026-004'],
    ['Vanesa',   'Domínguez',   '37001005', '2006-11-12', 2026, 'ENF-2026-005'],
    ['Julia',    'Acosta',      '37001006', '2006-06-28', 2026, 'ENF-2026-006'],
    ['Tomás',    'Vega',        '37001007', '2006-03-19', 2026, 'ENF-2026-007'],
    ['Federico', 'Muñoz',       '37001008', '2006-08-05', 2026, 'ENF-2026-008'],
    ['Ignacio',  'Cabrera',     '37001009', '2006-12-21', 2026, 'ENF-2026-009'],
    ['Facundo',  'Jiménez',     '37001010', '2006-02-09', 2026, 'ENF-2026-010'],
  ];

  const alumnosLAB: [string, string, string, string, number, string][] = [
    // — Ingreso 2024 (3.° año actual) —
    ['Sebastián', 'García',    '35002001', '2004-04-06', 2024, 'LAB-2024-001'],
    ['Federico',  'Rodríguez', '35002002', '2003-10-30', 2024, 'LAB-2024-002'],
    ['Nicolás',   'González',  '35002003', '2004-07-15', 2024, 'LAB-2024-003'],
    ['Gastón',    'Martínez',  '35002004', '2003-12-22', 2024, 'LAB-2024-004'],
    ['Ezequiel',  'Sánchez',   '35002005', '2004-02-08', 2024, 'LAB-2024-005'],
    ['Matías',    'Romero',    '35002006', '2003-08-17', 2024, 'LAB-2024-006'],
    ['Lorena',    'Díaz',      '35002007', '2004-05-25', 2024, 'LAB-2024-007'],
    ['Adriana',   'Ruiz',      '35002008', '2003-11-14', 2024, 'LAB-2024-008'],
    ['Silvina',   'Moreno',    '35002009', '2004-09-01', 2024, 'LAB-2024-009'],
    ['Paola',     'Herrera',   '35002010', '2003-06-20', 2024, 'LAB-2024-010'],
    // — Ingreso 2025 (2.° año actual) —
    ['Juan',    'Ramírez',  '36002001', '2005-03-12', 2025, 'LAB-2025-001'],
    ['Carlos',  'Medina',   '36002002', '2005-07-28', 2025, 'LAB-2025-002'],
    ['Pablo',   'Vargas',   '36002003', '2005-01-05', 2025, 'LAB-2025-003'],
    ['Andrés',  'Cruz',     '36002004', '2005-09-19', 2025, 'LAB-2025-004'],
    ['Leandro', 'Flores',   '36002005', '2005-04-30', 2025, 'LAB-2025-005'],
    ['Ramiro',  'Navarro',  '36002006', '2005-11-07', 2025, 'LAB-2025-006'],
    ['Sofía',   'Castro',   '36002007', '2005-06-16', 2025, 'LAB-2025-007'],
    ['Romina',  'Acosta',   '36002008', '2005-02-23', 2025, 'LAB-2025-008'],
    ['Claudia', 'Ortiz',    '36002009', '2005-08-11', 2025, 'LAB-2025-009'],
    ['Mónica',  'Reyes',    '36002010', '2005-12-04', 2025, 'LAB-2025-010'],
    // — Ingreso 2026 (1.° año actual) —
    ['Lucas',     'López',      '37002001', '2006-05-27', 2026, 'LAB-2026-001'],
    ['Santiago',  'García',     '37002002', '2006-10-13', 2026, 'LAB-2026-002'],
    ['Damián',    'Fernández',  '37002003', '2006-03-02', 2026, 'LAB-2026-003'],
    ['Eduardo',   'Rodríguez',  '37002004', '2006-07-19', 2026, 'LAB-2026-004'],
    ['Roberto',   'González',   '37002005', '2006-01-31', 2026, 'LAB-2026-005'],
    ['Claudio',   'Martínez',   '37002006', '2006-09-08', 2026, 'LAB-2026-006'],
    ['Hernán',    'Sánchez',    '37002007', '2006-04-14', 2026, 'LAB-2026-007'],
    ['Gustavo',   'Romero',     '37002008', '2006-11-26', 2026, 'LAB-2026-008'],
    ['Alejandro', 'Álvarez',    '37002009', '2006-06-03', 2026, 'LAB-2026-009'],
    ['Miguel',    'Torres',     '37002010', '2006-02-17', 2026, 'LAB-2026-010'],
  ];

  // Crea usuario + registro alumno, devuelve { alumno, anioIngreso }
  async function crearAlumno(
    nombre: string, apellido: string, dni: string,
    fechaNac: string, anioIngreso: number, legajo: string,
    carrera: string, idx: number,
  ) {
    const email = `${norm(nombre)}.${norm(apellido)}${String(idx).padStart(3, '0')}@iscr.edu.ar`;
    const u = await prisma.usuario.create({
      data: {
        email, nombre, apellido,
        passwordHash: await hash('alumno1234'),
        rol: RolUsuario.ALUMNO,
      },
    });
    const alumno = await prisma.alumno.create({
      data: {
        legajo, dni, nombre, apellido,
        fechaNacimiento: new Date(fechaNac),
        carrera, anioIngreso,
        usuarioId: u.id,
      },
    });
    return { alumno, anioIngreso };
  }

  // ── Inscripciones por nivel ──────────────────────────────────────────────────
  // Notas deterministas: rota entre 6, 7, 8 y 9 según índice
  const nota = (i: number) => 6 + (i % 4);

  async function inscribir(
    alumnoId: string,
    materias: { id: string }[],
    ciclo: number,
    estadoCursada: EstadoCursada,
    withNota = false,
    offset = 0,
  ) {
    for (let i = 0; i < materias.length; i++) {
      await prisma.inscripcion.create({
        data: {
          alumnoId,
          materiaId: materias[i].id,
          tipo: TipoInscripcion.CURSADA,
          cicloLectivo: ciclo,
          estado: EstadoInscripcion.CONFIRMADA,
          estadoCursada,
          nota: withNota ? nota(i + offset) : null,
        },
      });
    }
  }

  // Materias agrupadas para reutilizar en inscripciones
  const enf1C1 = [enf101, enf102, enf103, enf104, enf105, enf109];
  const enf1C2 = [enf106, enf107, enf108, enf110, enf111, enf112];
  const enf2C1 = [enf201, enf202, enf203, enf204, enf205, enf206];
  const enf2C2 = [enf207, enf208, enf209, enf210, enf211];
  const enf3C1 = [enf301, enf302, enf303, enf304, enf305, enf306];

  const lab1C1 = [lab101, lab102, lab103, lab104, lab105];
  const lab1C2 = [lab106, lab107, lab108, lab109];
  const lab2C1 = [lab201, lab202, lab203, lab204, lab205];
  const lab2C2 = [lab206, lab207, lab208, lab209];
  const lab3C1 = [lab301, lab302, lab303, lab304];

  // ── ENF alumnos ─────────────────────────────────────────────────────────────
  for (let i = 0; i < alumnosENF.length; i++) {
    const [nombre, apellido, dni, fechaNac, anioIngreso, legajo] = alumnosENF[i];
    const { alumno } = await crearAlumno(nombre, apellido, dni, fechaNac, anioIngreso, legajo, ENF, i + 1);
    const id = alumno.id;

    if (anioIngreso === 2024) {
      // 3.° año: 1.° año completo (2024) + 2.° año completo (2025) + cursando 3.° (2026)
      await inscribir(id, enf1C1, 2024, EstadoCursada.APROBADA, true, 0);
      await inscribir(id, enf1C2, 2024, EstadoCursada.APROBADA, true, 6);
      await inscribir(id, enf2C1, 2025, EstadoCursada.APROBADA, true, 0);
      // últimas 2 de 2.° año: regulares (sin nota final)
      await inscribir(id, enf2C2.slice(0, 3), 2025, EstadoCursada.APROBADA, true, 6);
      await inscribir(id, enf2C2.slice(3),    2025, EstadoCursada.REGULAR,  false);
      // 3.° año c1: en curso
      await inscribir(id, enf3C1, 2026, EstadoCursada.EN_CURSO, false);

    } else if (anioIngreso === 2025) {
      // 2.° año: 1.° año completo (2025) + cursando 2.° c1 (2026)
      await inscribir(id, enf1C1, 2025, EstadoCursada.APROBADA, true, 0);
      await inscribir(id, enf1C2, 2025, EstadoCursada.APROBADA, true, 6);
      await inscribir(id, enf2C1, 2026, EstadoCursada.EN_CURSO, false);

    } else {
      // 1.° año: cursando 1.° c1 (2026)
      await inscribir(id, enf1C1, 2026, EstadoCursada.EN_CURSO, false);
    }
  }
  console.log('   ✓ 30 alumnos ENF + inscripciones');

  // ── LAB alumnos ─────────────────────────────────────────────────────────────
  for (let i = 0; i < alumnosLAB.length; i++) {
    const [nombre, apellido, dni, fechaNac, anioIngreso, legajo] = alumnosLAB[i];
    const { alumno } = await crearAlumno(nombre, apellido, dni, fechaNac, anioIngreso, legajo, LAB, i + 31);
    const id = alumno.id;

    if (anioIngreso === 2024) {
      await inscribir(id, lab1C1, 2024, EstadoCursada.APROBADA, true, 0);
      await inscribir(id, lab1C2, 2024, EstadoCursada.APROBADA, true, 5);
      await inscribir(id, lab2C1, 2025, EstadoCursada.APROBADA, true, 0);
      await inscribir(id, lab2C2.slice(0, 2), 2025, EstadoCursada.APROBADA, true, 5);
      await inscribir(id, lab2C2.slice(2),    2025, EstadoCursada.REGULAR,  false);
      await inscribir(id, lab3C1, 2026, EstadoCursada.EN_CURSO, false);

    } else if (anioIngreso === 2025) {
      await inscribir(id, lab1C1, 2025, EstadoCursada.APROBADA, true, 0);
      await inscribir(id, lab1C2, 2025, EstadoCursada.APROBADA, true, 5);
      await inscribir(id, lab2C1, 2026, EstadoCursada.EN_CURSO, false);

    } else {
      await inscribir(id, lab1C1, 2026, EstadoCursada.EN_CURSO, false);
    }
  }
  console.log('   ✓ 30 alumnos LAB + inscripciones\n');

  // ── Resumen ──────────────────────────────────────────────────────────────────
  console.log('✅ Seed completado.\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Accesos:');
  console.log('  admin@iscr.edu.ar          / admin1234        (SUPERADMIN)');
  console.log('  secretaria@iscr.edu.ar     / secretaria1234   (ADMINISTRACION)');
  console.log('  <nombre>.<apellido>@iscr.edu.ar / docente1234 (DOCENTE, 34 usuarios)');
  console.log('  <nombre>.<apellido>NNN@iscr.edu.ar / alumno1234 (ALUMNO, 60 usuarios)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  ENF: 34 materias · 25 correlatividades · 20 docentes · 30 alumnos`);
  console.log(`  LAB: 26 materias · 14 correlatividades · 14 docentes · 30 alumnos`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
