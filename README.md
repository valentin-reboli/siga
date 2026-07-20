<div align="center">

# SIGA

Sistema Integral de Gestión Académica desarrollado para el Instituto Superior Cruz Roja Concordia.

Aplicación web para la gestión de alumnos, materias, inscripciones, legajos digitales, constancias y aulas virtuales.


### Demo

**Aplicación:**  
https://siga-sistema.up.railway.app

**Video demostración:**  
https://drive.google.com/file/d/1VJ5Ew7BT9AtulhnI34M1VlHlxBzjWB2k/view?usp=sharing

</div>

---

## Descripción

SIGA es una aplicación web orientada a la administración académica de instituciones educativas. Permite gestionar usuarios, alumnos, materias, inscripciones, legajos y constancias desde una única plataforma, con acceso diferenciado según el rol de cada usuario.

El sistema fue desarrollado como Trabajo Final de Programación para la Tecnicatura.

---

## Funcionalidades

### Gestión académica

* Administración de alumnos y usuarios.
* Gestión de materias y asignación de docentes.
* Inscripciones a cursadas y mesas de examen.
* Validación de correlatividades y cupos.
* Generación de legajos digitales.
* Emisión de constancias en PDF.

### Aula virtual

* Foro independiente para cada materia.
* Publicación de anuncios y material de estudio.
* Carga y descarga de archivos adjuntos.
* Publicación de fechas de examen.
* Acceso restringido a alumnos inscriptos y docentes asignados.

### Seguridad y acceso

* Autenticación mediante JWT.
* Control de acceso basado en roles (RBAC).
* Permisos centralizados.
* Contraseñas almacenadas mediante hashing.

---

## Roles

| Rol            | Descripción                                                 |
| -------------- | ----------------------------------------------------------- |
| SUPERADMIN     | Administración completa del sistema.                        |
| ADMINISTRACIÓN | Gestión académica, alumnos, usuarios e inscripciones.       |
| DOCENTE        | Gestión de materias asignadas y publicación de contenido.   |
| ALUMNO         | Acceso a cursadas, inscripciones, legajo y aulas virtuales. |

---

## Tecnologías

### Backend

* Node.js
* Express
* TypeScript
* Prisma ORM
* PostgreSQL
* JWT
* Zod
* Multer
* PDFKit

### Frontend

* React
* Vite
* TypeScript
* Tailwind CSS
* Axios
* React Router

### Infraestructura

* Railway
* Neon PostgreSQL

---

## Arquitectura

```text
SIGA/
├── backend/
│   ├── prisma/
│   └── src/
│       ├── modules/
│       ├── auth/
│       ├── middleware/
│       ├── config/
│       └── utils/
└── frontend/
    └── src/
        ├── pages/
        ├── components/
        ├── api/
        ├── context/
        └── types/
```

---

## Autor

Valentín Réboli

---

## Licencia

Proyecto desarrollado con fines académicos.
