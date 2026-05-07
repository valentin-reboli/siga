# Sistema Integral de Gestión Académica (SIGA)

Sistema Integral de Gestión Académica (SIGA) orientado a la digitalización y centralización de procesos académicos institucionales, incluyendo gestión de alumnos, inscripciones, legajos digitales y emisión de constancias.

## Integrantes

- Valentín Réboli
- Alfonso Fasana
---

## Descripción del Proyecto

El presente proyecto consiste en el desarrollo de un sistema integral de gestión académica orientado al Instituto Superior Cruz Roja Concordia. La institución actualmente utiliza múltiples plataformas separadas para administrar asistencia, aulas virtuales, inscripciones y documentación académica, generando duplicación de tareas y dificultades en el seguimiento institucional.

El sistema SIGA busca centralizar todos estos procesos en una única plataforma web, permitiendo digitalizar la gestión académica y administrativa mediante módulos integrados y acceso unificado para alumnos, docentes, preceptores y administración.

---

## Objetivos del Proyecto

El objetivo principal es implementar una solución web que permita optimizar la administración académica institucional y reemplazar procesos manuales por herramientas digitales automatizadas.

El sistema permitirá:

- Centralizar la gestión académica en una única plataforma.
- Digitalizar procesos de inscripciones y emisión de constancias.
- Automatizar validaciones académicas y administrativas.
- Garantizar la seguridad y consistencia de la información institucional.
- Facilitar el seguimiento de la trayectoria académica de los alumnos.

---

## Alcance Funcional

El sistema se encuentra organizado en distintos módulos funcionales orientados a la gestión académica del instituto.

### Inicio de Sesión y Gestión de Usuarios

Sistema de autenticación mediante usuario y contraseña con control de acceso según roles institucionales. El alumno podrá acceder a funcionalidades relacionadas con su legajo académico, inscripciones y descarga de documentación digital.

### Gestión Académica y Legajo Digital

Módulo encargado de registrar y almacenar información académica del alumno, incluyendo regularidades, calificaciones, historial académico y progreso dentro del plan de estudios.

### Inscripciones Académicas

Sistema de inscripción a materias y mesas de examen con validación automática de correlatividades, regularidad y disponibilidad de cupos antes de confirmar la operación.

### Solicitud y Emisión de Constancias

Generación automática de constancias académicas en formato PDF, incluyendo validación institucional y códigos de autenticidad para su descarga desde la plataforma.

---

## Stack Tecnológico

Para el desarrollo del sistema se utilizará una arquitectura Full-Stack moderna orientada a escalabilidad y mantenibilidad:

- **Backend:** Node.js con Express y TypeScript.
- **Base de Datos:** PostgreSQL administrado mediante Prisma ORM.
- **Frontend:** React con TypeScript y diseño responsive.
- **Autenticación:** JWT para control seguro de sesiones y permisos de usuario.

---

## Estructura de Base de Datos

El sistema se apoyará en una estructura relacional orientada a la gestión académica institucional:

- **Usuarios:** gestión de credenciales y roles de acceso.
- **Alumnos:** información académica y legajos digitales.
- **Materias:** registro de materias y correlatividades.
- **Inscripciones:** registro de inscripciones a materias y mesas de examen.
- **Constancias:** solicitudes y emisión de documentación académica digital.

---

## Despliegue en la Nube

La plataforma será desplegada en servicios cloud para garantizar disponibilidad y acceso remoto:

- **Infraestructura:** Render / Vercel.
- **Persistencia:** Neon.tech (PostgreSQL Serverless).

---

## Conclusión

SIGA proporcionará al Instituto Superior Cruz Roja Concordia una plataforma centralizada para la gestión académica y administrativa institucional. La digitalización de procesos permitirá optimizar tiempos operativos, reducir errores derivados de tareas manuales y mejorar el acceso a la información académica.

La arquitectura propuesta garantiza escalabilidad, seguridad y compatibilidad con futuros módulos o ampliaciones del sistema.

---
