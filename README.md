<div align="center">

# 🎓 SIGA — Sistema Integral de Gestión Académica

**Plataforma web para la gestión académica del Instituto Superior Cruz Roja Concordia.**

Centraliza y digitaliza los procesos de la institución: alumnos, legajos, inscripciones,
constancias, un aula virtual por materia y un panel de control adaptado a cada rol.

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)](https://neon.tech/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?logo=railway&logoColor=white)](https://railway.app/)

**🌐 Demo en producción → [siga-sistema.up.railway.app](https://siga-sistema.up.railway.app)**

</div>

---

## 📑 Tabla de contenidos

- [Descripción general](#-descripción-general)
- [Funcionalidades](#-funcionalidades)
- [Roles y permisos](#-roles-y-permisos)
- [Stack tecnológico](#-stack-tecnológico)
- [Arquitectura del proyecto](#-arquitectura-del-proyecto)
- [Puesta en marcha](#-puesta-en-marcha)
- [Variables de entorno](#-variables-de-entorno)
- [Usuarios de prueba](#-usuarios-de-prueba)
- [Despliegue](#-despliegue)
- [Objetivo académico](#-objetivo-académico)
- [Autor](#-autor)
- [Licencia](#-licencia)

---

## 📋 Descripción general

SIGA es una aplicación web full-stack orientada a instituciones educativas. Su objetivo es
optimizar la administración académica mediante la automatización y centralización de los
procesos operativos, ofreciendo a cada tipo de usuario (dirección, administración, docentes y
alumnos) una experiencia adaptada a sus tareas.

La solución se compone de:

- Una **API REST** tipada (Node.js + Express + TypeScript) con **Prisma ORM** sobre PostgreSQL.
- Una **SPA** (React + Vite + Tailwind CSS) con enrutado por roles.
- **Autenticación y autorización** mediante JWT y un sistema de permisos (RBAC) centralizado.
- **Despliegue en la nube** sobre Railway, con base de datos PostgreSQL (Neon) y almacenamiento
  persistente de archivos en un volumen.

---

## ✨ Funcionalidades

### 🏛️ Campus y panel por rol
- **Dashboard tipo campus** que se adapta al rol del usuario, con accesos rápidos a todas
  las secciones disponibles.
- **Agenda integrada:** próximos exámenes y novedades del foro de las materias del usuario.
- **Buscador global de materias** en la barra superior para saltar al aula virtual desde
  cualquier pantalla.

### 📚 Materias y aula virtual (foro)
- Catálogo de materias con **correlatividades** y **cupos**.
- Cada materia cuenta con un **foro / aula virtual privado**, accesible solo por los alumnos
  **inscriptos** en ella (y por el docente asignado / staff).
- Tipos de publicación: **anuncios**, **material de cátedra con archivos adjuntos**,
  **hilos de discusión** y **fechas de examen**, que quedan fijadas y destacadas arriba del foro.
- Los docentes (y el staff) publican contenido y suben archivos; los alumnos leen y descargan.

### 📝 Vida académica
- **Inscripciones** a cursadas y mesas de examen, con validación automática de
  **correlatividades** y **cupos**.
- **Clave de inscripción por materia**: el alumno debe ingresar la clave que entrega el docente
  al inicio del cursado, protegiendo la privacidad de cada materia.
- **Legajo digital** con historial de cursadas y calificaciones; el **número de legajo se genera
  automáticamente** siguiendo la convención `AAAA-NNNN`.
- **Constancias** académicas con generación de **PDF**.

### 🛠️ Administración
- **Gestión de usuarios** y alta de alumnos / staff con contraseña temporal.
- **Asignación de docentes a materias**.
- Control de acceso por **roles y permisos**.

---

## 👥 Roles y permisos

El control de acceso se resuelve con un sistema de permisos centralizado (RBAC). Existen
cuatro roles:

| Rol              | Descripción |
| ---------------- | ----------- |
| **SUPERADMIN**     | Dirección / IT. Control total del sistema. |
| **ADMINISTRACIÓN** | Gestión académica y preceptoría: alumnos, inscripciones, constancias, usuarios. |
| **DOCENTE**        | Acceso acotado a sus materias asignadas: foro, material y carga de notas. |
| **ALUMNO**         | Su información académica, inscripciones y los foros de las materias que cursa. |

---

## 🧰 Stack tecnológico

### Backend
- **Node.js** + **Express** + **TypeScript**
- **Prisma ORM** sobre **PostgreSQL**
- **JWT** (`jsonwebtoken`) + **bcryptjs** para autenticación y hashing
- **Zod** para validación de entrada
- **Multer** para subida de archivos (material del foro)
- **PDFKit** para generación de constancias
- **Helmet**, **CORS**, **morgan** y **rate limiting** para seguridad y trazabilidad

### Frontend
- **React 18** + **Vite** + **TypeScript**
- **Tailwind CSS** + **lucide-react** (íconos)
- **React Router** para el enrutado por roles
- **Axios** para el consumo de la API

### Infraestructura
- **Railway** (despliegue de backend y frontend)
- **Neon** (PostgreSQL administrado)
- **Railway Volume** (almacenamiento persistente de archivos subidos)

---

## 🗂️ Arquitectura del proyecto

```text
SIGA/
├── backend/                 # API REST (Node.js + Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma     # Modelo de datos
│   │   └── seed.ts           # Datos iniciales
│   └── src/
│       ├── modules/          # auth, usuarios, alumnos, materias,
│       │                     #   inscripciones, constancias, foro
│       ├── auth/             # Permisos (RBAC)
│       ├── middleware/       # Auth, validación, errores, rate limit
│       ├── config/           # Entorno y cliente Prisma
│       └── utils/            # JWT, password, legajo, clave de materia…
└── frontend/                # SPA (React + Vite + Tailwind)
    └── src/
        ├── pages/            # Vistas (dashboard, materias, foro, …)
        ├── components/       # UI y layout
        ├── api/              # Clientes HTTP por módulo
        ├── config/           # Módulos por rol
        ├── context/ hooks/   # Auth y utilidades
        └── types/            # Tipos compartidos con el backend
```

Cada módulo del backend sigue el patrón `routes → controller → service → schema`.

---

## 🚀 Puesta en marcha

### Requisitos previos
- **Node.js 20** o superior
- **PostgreSQL** (local o una base en [Neon](https://neon.tech/))
- **Git**

### 1. Clonar el repositorio

```bash
git clone https://github.com/valentin-reboli/siga.git
cd siga
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env          # completar las variables (ver más abajo)

npx prisma generate           # genera el cliente Prisma
npx prisma db push            # sincroniza el esquema con la base
npm run seed                  # carga datos iniciales (usuarios, materias…)
npm run dev                   # API en http://localhost:3000
```

### 3. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev                   # SPA en http://localhost:5173
```

---

## 🔐 Variables de entorno

### Backend — `backend/.env`

| Variable             | Descripción                                              | Valor por defecto        |
| -------------------- | -------------------------------------------------------- | ------------------------ |
| `DATABASE_URL`       | Cadena de conexión a PostgreSQL                          | —                        |
| `JWT_SECRET`         | Secreto para firmar los tokens (mínimo 16 caracteres)    | —                        |
| `JWT_EXPIRES_IN`     | Expiración del token                                     | `8h`                     |
| `CORS_ORIGIN`        | Origen permitido para el frontend                        | `http://localhost:5173`  |
| `PORT`               | Puerto de la API                                         | `3000`                   |
| `BCRYPT_SALT_ROUNDS` | Rondas de hashing de contraseñas                         | `10`                     |
| `UPLOAD_DIR`         | Carpeta de archivos subidos (volumen en producción)      | `./uploads`              |
| `MAX_UPLOAD_MB`      | Tamaño máximo por archivo (MB)                           | `20`                     |

### Frontend — `frontend/.env`

| Variable             | Descripción                          | Valor por defecto |
| -------------------- | ------------------------------------ | ----------------- |
| `VITE_API_BASE_URL`  | URL base de la API                   | `/api`            |

---

## 🔑 Usuarios de prueba

Disponibles luego de ejecutar `npm run seed`:

| Rol             | Email                          | Contraseña       |
| --------------- | ------------------------------ | ---------------- |
| Superadmin      | `admin@iscr.edu.ar`            | `admin1234`      |
| Administración  | `secretaria@iscr.edu.ar`       | `secretaria1234` |
| Docente         | `prof.enfermeria@iscr.edu.ar`  | `docente1234`    |
| Alumno          | `aperez@iscr.edu.ar`           | `alumno1234`     |

> 💡 La **clave de inscripción** de cada materia es, por defecto, el nombre de la materia
> en minúsculas y sin espacios seguido de `123` (por ejemplo, *Práctica Profesional II* →
> `practicaprofesionalii123`).

---

## ☁️ Despliegue

El proyecto está desplegado en **Railway** como dos servicios (backend y frontend) con una
base de datos PostgreSQL administrada por **Neon**.

Consideraciones de producción:

- Configurar las variables de entorno en cada servicio.
- Montar un **Volume** en el servicio del backend y apuntar `UPLOAD_DIR` a esa ruta
  (p. ej. `/data/uploads`) para que los archivos subidos al foro **persistan entre deploys**.
- Sincronizar el esquema contra la base de producción con `npx prisma db push` antes (o como
  parte) del despliegue.

Cada push a la rama `main` dispara un nuevo deploy automáticamente.

---

## 🎓 Objetivo académico

Este proyecto fue desarrollado como **Trabajo Final de Programación** de la Tecnicatura,
aplicando conceptos de desarrollo full-stack: diseño de APIs REST, modelado de bases de datos
relacionales, autenticación y autorización, control de acceso por roles (RBAC) y arquitectura
cliente-servidor.

---

## ✍️ Autor

| Nombre          |
| --------------- |
| Valentín Réboli |

---

## 📄 Licencia

Proyecto desarrollado con fines académicos y educativos.
