# TaskFlow UI + API (Next.js 16, TypeScript, Mongo, Socket.IO)

Aplicación full‑stack basada en Next.js (App Router) con UI en React y API integrada. Persistencia real con MongoDB/Mongoose, autenticación JWT (credenciales y Google OAuth), control de acceso por propietario (owner‑scoped), documentación OpenAPI/Swagger y tiempo real con Socket.IO. La UI expone flujos reales (Proyectos/Metas/Tareas/Sprints, Calendario, Mi trabajo, Dashboard, Archivos S3) con énfasis en seguridad y DX.

Tabla de contenidos
- Introducción
- Novedades/Resumen de cambios recientes
- Características principales
- Arquitectura y estructura
- Modelado de datos (Mongoose)
- Autenticación y autorización
- Reglas de visibilidad (owner‑scoped)
- Endpoints (resumen)
- Cliente (servicios y UI)
- Calendario (Mes/Semana, dueDate)
- Tiempo real (Socket.IO)
- Variables de entorno
- Instalación, ejecución y scripts
- Pruebas (unitarias y E2E)
- Seguridad y buenas prácticas
- Roadmap y limitaciones
- Licencia

Introducción
- Frontend en Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4 + shadcn/ui.
- Backend API en route handlers de Next (app/api/**).
- Persistencia con MongoDB/Mongoose.
- Autenticación con JWT (credenciales) y Google OAuth (authorization code).
- Documentación REST con Swagger UI en /api-docs.
- Socket.IO para tiempo real (servidor dedicado).
- Almacenamiento de archivos en S3 (por proyecto).

Novedades/Resumen de cambios recientes
- Owner‑scope fortalecido:
  - Proyectos: GET/POST/PUT/DELETE restringidos al owner (ya estaba, reforzado).
  - Sprints: GET/POST sólo de proyectos del owner. GET ahora requiere token y filtra por proyectos del owner. 
  - Tareas: POST fuerza assigneeId = user.sub; GET requiere token y filtra por assigneeId = user.sub (y projectId opcional).
- Asignación automática de tareas: TaskForm ya no permite escoger asignatario; se asigna al usuario actual.
- Finalizar/Reabrir:
  - Proyectos: campo completed (modelo/API/tabla + estilo en calendario).
  - Sprints: campo completed (modelo/API/tabla + estilo en calendario).
  - Metas: toggle progress 0/100.
  - Tareas: toggle Done/Todo.
- Calendario:
  - Vista Semana funcional (lunes..domingo). Vista Día removida.
  - Eventos: Proyectos/Metas/Tareas/Sprints (Inicio/Fin), con estilo especial al estar finalizados (verde + tachado + ✓).
  - Eventos de tarea incluyen “Proyecto” y el “Sprint” asociado (si etiqueta sprint-<id>).
  - Botón “Refrescar” y evento window “calendar:refresh” (desde acciones que cambian estado).
  - Carga resiliente con Promise.allSettled.
- Dashboard:
  - Indicadores y paneles para Tareas y Sprints (además de Proyectos/Metas).
  - Secciones: Tareas próximas (7 días) y Sprints activos.
- Mi trabajo:
  - Además de “Mis proyectos”, muestra “Mis tareas asignadas” y “Sprints de mis proyectos”.
- Landing page (/):
  - Contenido actualizado reflejando UI+API (en lugar de “demo estática”).
  - Accesos rápidos a Dashboard y API Docs.
- Sesión persistente:
  - AuthProvider rehidrata token y user desde localStorage al refrescar (getAuthToken/getAuthUser).
- Servicios cliente:
  - fetchSprints y fetchTasks ahora envían Authorization (Bearer) para endpoints protegidos.

Características principales
- Autenticación por credenciales y Google OAuth (authorization code).
- Proyectos, Metas, Tareas y Sprints:
  - CRUD real con control por propietario (owner) y normalización de fechas.
  - Tareas: asignación automática al creador; estados y prioridades; etiquetas (incluye uso para sprint-<id>).
- UI:
  - Dashboard con métricas, próximas entregas y sprints activos.
  - Mi trabajo: mis proyectos, mis tareas asignadas, sprints de mis proyectos.
  - Calendario: Mes y Semana (sin Día), con eventos de Proyectos/Metas/Tareas/Sprints.
  - Kanban por proyecto (Todo/Doing/Done) con datos reales (sin drag persistente).
  - Perfil (solo lectura), Admin/Users (solo admin), carga de archivos S3 por proyecto.
- Documentación OpenAPI en /api/docs/openapi (UI en /api-docs).
- Pruebas unitarias (Vitest) y E2E (Cypress).

Arquitectura y estructura
Raíz
- app/ App Router (páginas Server/Client + API)
- components/ Componentes UI (shadcn/ui, layout, tablas, formularios, realtime)
- lib/ Utilidades (db, jwt, roles, socket server/cliente, s3, utils, toast)
- models/ Modelos Mongoose
- services/ Servicios de cliente (fetch)
- hooks/ Hooks (useSocket, etc.)
- cypress/, test/ Pruebas E2E y unitarias
- docs/ Documentación adicional

Rutas UI (extracto)
- / (Landing) con enlaces a /login, /register, /dashboard y /api-docs.
- /login, /register
- /(app)/dashboard
- /(app)/projects, /(app)/projects/[id]/*
- /(app)/goals
- /(app)/my-work (proyectos, tareas, sprints)
- /(app)/calendar (Mes, Semana)
- /(app)/profile
- /(app)/admin/users (solo admin)
- /api-docs (UI Swagger)

API (App Router)
- /api/auth/*: register, login, google
- /api/projects, /api/projects/[id]
- /api/goals, /api/goals/[id]
- /api/tasks, /api/tasks/[id]
- /api/sprints, /api/sprints/[id]
- /api/users (público mínimo: nombre/email/rol)
- /api/admin (requiere admin)
- /api/docs/openapi (JSON)
- /api/socket (warm‑up Socket.IO)

Modelado de datos (Mongoose)
User (models/User.ts)
- name, email (único, lowercase), password?, role, provider, googleId?, avatarUrl?, timestamps

Project (models/Project.ts)
- name, key (uppercase 2..6), ownerId, members[], dueDate?, completed?: boolean, timestamps

Goal (models/Goal.ts)
- title, progress (0..100), projectId?, ownerId?, dueDate?, timestamps

Task (models/Task.ts)
- projectId, title, status (“Todo”|“Doing”|“Done”), priority (“High”|“Medium”|“Low”),
  assigneeId?, dueDate?, points?, tags?, description?, timestamps

Sprint (models/Sprint.ts)
- projectId, name, startDate, endDate, goal?, completed?: boolean, timestamps

Autenticación y autorización
- JWT firmado con JWT_SECRET; expiración configurable (JWT_EXPIRES_IN).
- Authorization: Bearer <token> en endpoints protegidos.
- AuthProvider:
  - Persiste token y user en localStorage (get/setAuthToken, get/setAuthUser).
  - Rehidratación automática en refresco para evitar perder sesión.

Reglas de visibilidad (owner‑scoped)
- Proyectos:
  - GET /api/projects: retorna solo Proyectos del owner (ownerId = user.sub).
  - POST /api/projects: fuerza ownerId = user.sub.
  - [id] GET/PUT/DELETE: restringido al owner.
- Metas:
  - GET /api/goals: owner‑scoped por ownerId, con projectId opcional.
  - POST /api/goals: valida que projectId (si se envía) sea del owner.
- Tareas:
  - POST /api/tasks: fuerza assigneeId = user.sub (asignación automática al creador).
  - GET /api/tasks: requiere JWT; filtra por assigneeId = user.sub (y projectId opcional).
- Sprints:
  - GET /api/sprints: requiere JWT; retorna sólo sprints cuyos projectId pertenezcan a proyectos del owner (y si se envía ?projectId verifica pertenencia).
  - POST /api/sprints: valida que projectId pertenezca al owner.

Endpoints (resumen)
Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/google

Projects (owner‑scoped)
- GET /api/projects (token): lista del owner. Devuelve dueDate, createdAt, completed.
- POST /api/projects (token): crea proyecto; dueDate opcional.
- GET/PUT/DELETE /api/projects/[id] (token, owner). PUT admite completed.

Goals (owner‑scoped)
- GET /api/goals (token): opcional projectId; lista solo del owner.
- POST /api/goals (token): title requerido; dueDate opcional; valida projectId del owner.
- GET/PUT/DELETE /api/goals/[id] (token, owner).

Tasks (asignación automática al creador)
- GET /api/tasks?projectId= (token): lista solo tareas con assigneeId = user.sub (y projectId opcional).
- POST /api/tasks (token): crea tarea, fuerza assigneeId = user.sub.
- GET/PUT/DELETE /api/tasks/[id] (token).

Sprints (owner‑scoped por proyectos)
- GET /api/sprints?projectId= (token): lista sprints de proyectos del owner; si projectId y no pertenece al owner, retorna [].
- POST /api/sprints (token): valida que el projectId pertenezca al owner.
- GET/PUT/DELETE /api/sprints/[id] (token).

Cliente (servicios y UI)
Servicios (services/api/**)
- auth.service.ts: login/register/google, persistencia de token y user (set/get).
- projects/goals/tasks/sprints/users*.service.ts:
  - GET protegidos envían Authorization (Bearer token).
  - fetchTasks y fetchSprints actualizados para enviar token.
- Capa UI (extracto):
  - Dashboard: incorpora Tareas próximas y Sprints activos.
  - My Work: además de “Mis proyectos”, muestra “Mis tareas asignadas” y “Sprints de mis proyectos”.
  - Proyectos: tabla + formulario (name, key, dueDate); toggle Finalizar.
  - Tareas: TaskForm sin selector de asignado; toggle Finalizar (Done/Todo).
  - Sprints: listar/crear/editar/borrar; toggle Finalizar; “Administrar tareas” (marca tag sprint-<id>).

Calendario (Mes/Semana)
- Vista Mes y Semana (Día removido).
- Eventos:
  - Proyectos (dueDate) con estilo especial si completed=true.
  - Metas (dueDate) finales si progress≥100.
  - Tareas (dueDate) finales si status=Done; título incluye Proyecto y Sprint (si etiqueta sprint-<id>).
  - Sprints (Inicio/Fin) con estilo de finalizado si completed=true.
- Normalizaciones de fechas:
  - Cliente: “YYYY‑MM‑DD” se trata como fecha local.
  - Servidor: “YYYY‑MM‑DD” se guarda como Date.UTC(..., 12:00) para evitar desfases.
- Botón “Refrescar” y escucha de “calendar:refresh” para recargar tras acciones (Finalizar).

Tiempo real (Socket.IO)
- Servidor dedicado (lib/socket-server.ts) con warm‑up GET /api/socket.
- Autenticación en handshake con JWT (socket.data.user = { id, role }).
- Rooms: project:{id}; eventos activity:* y task:*; presencia mock en memoria.
- Vista “/socket-demo”: logs y actividad RT.

Variables de entorno (.env)
Server/API
- MONGODB_URI=mongodb://localhost:27017/taskflow
- JWT_SECRET=un_secret_largo_aleatorio
- JWT_EXPIRES_IN=7d
- ALLOWLIST_MANAGER_DOMAINS=empresa.com,otra.com  (opcional: dominios que auto‑asignan rol manager al registrarse/Google)
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI

Client
- NEXT_PUBLIC_API_URL=http://localhost:3000/api
- NEXT_PUBLIC_GOOGLE_CLIENT_ID=<client_id_publico>

Sockets (opcional)
- SOCKET_PORT=3001
- NEXT_PUBLIC_SOCKET_PORT=3001
- NEXT_PUBLIC_SOCKET_URL=<url socket> (prioritaria)
- NEXT_PUBLIC_SITE_URL (CORS prod)

S3 (opcional)
- AWS_S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

Instalación, ejecución y scripts
Instalación
- npm i

Desarrollo
- npm run dev
- Abrir http://localhost:3000

Build/Start
- npm run build
- npm start

Docs/OpenAPI
- http://localhost:3000/api-docs

Lint/Tests/E2E
- Lint: npm run lint
- Unit tests:
  - npm run test / npm run test:watch / npm run test:ui / npm run coverage
- Cypress:
  - GUI: npm run cy:open
  - Headless: npm run e2e

Pruebas
Unitarias (Vitest + Testing Library)
- Entorno happy-dom (config en test/setup.ts).
- Mocks de next/navigation, toast, etc.

E2E (Cypress)
- BaseUrl http://localhost:3000
- Flujos de autenticación y navegación a Proyectos.

Seguridad y buenas prácticas
- Token y user en localStorage (por compatibilidad). Recomendado a futuro: cookie httpOnly + SameSite y endpoint /api/auth/me para rehidratación segura.
- Owner‑scope:
  - Proyectos: ownerId = user.sub.
  - Sprints: solo de proyectos del owner.
  - Tareas: solo tareas del creador (assigneeId = user.sub). 
- Sockets: validar JWT en handshake; limitar CORS; considerar rate limiting y logs.
- S3: validar size/content-type/keys; evitar datos sensibles en payloads.

Roadmap y limitaciones
- PUT /api/tasks/[id]: opcionalmente impedir cambios de assigneeId (forzar a user.sub o ignorar patch).
- Kanban sigue siendo visual (sin persistencia de drag).
- Presencia RT en memoria (no apto multi‑instancia; requeriría store como Redis).
- Endpoint /api/auth/me y cookies httpOnly para producción.
- Validaciones Zod en handlers API para estandarizar errores.
- Más pruebas de contrato y E2E de flujos completos.

Licencia
Uso educativo/demostrativo.
