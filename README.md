# TaskFlow-Cliente (UI + API real)

Front‑end en Next.js 16 (App Router) + TypeScript. El proyecto inició como “mock UI”, pero ahora incluye persistencia real con MongoDB/Mongoose para módulos clave (auth, admin/users, projects, tasks, sprints, goals). Se mantienen algunos módulos de demostración (p. ej. Kanban/Calendar) sin persistencia.

Tecnologías
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui (button, input, dialog, tabs, form, sonner)
- Estado local y servicios cliente (fetch nativo)
- Mongoose (MongoDB) para persistencia de usuarios, proyectos, tareas, sprints y metas
- JWT (jsonwebtoken) para autenticación
- ESLint base de Next incluida

Estado actual (resumen)
- Persistencia real:
  - Auth (credenciales + Google OAuth)
  - Admin de usuarios (listado y cambio de rol)
  - Projects (CRUD + gestión de miembros)
  - Tasks (CRUD)
  - Sprints (CRUD)
  - Goals (CRUD)
- Mock/estático (pendiente de persistencia real):
  - Kanban (drag visual)
  - Calendar (vista estática y banner de conexión)

Requisitos
- Node 18+ (recomendado 20+)
- npm 9+
- MongoDB accesible (local o remoto)

Variables de entorno (TaskFlowUI/.env)
- Server/API
  - MONGODB_URI=mongodb://localhost:27017/taskflow
  - JWT_SECRET=un_secret_largo_aleatorio
  - JWT_EXPIRES_IN=7d
  - GOOGLE_CLIENT_ID=<client_id_servidor> (para /api/auth/google)
  - GOOGLE_CLIENT_SECRET=<secret_servidor>
  - GOOGLE_REDIRECT_URI=http://localhost:3000/login
- Client
  - NEXT_PUBLIC_API_URL=http://localhost:3000/api
  - NEXT_PUBLIC_GOOGLE_CLIENT_ID=<client_id_publico>

Instalación y ejecución
1) Instalar dependencias
   npm i

2) Levantar en desarrollo
   npm run dev
   Abrir http://localhost:3000

Documentación OpenAPI/Swagger
- Especificación OpenAPI: GET /api/docs/openapi
- UI interactiva Swagger: http://localhost:3000/api-docs
- Notas:
  - Endpoints de escritura requieren Authorization: Bearer <token> (ver sección Autenticación).
  - La UI usa swagger-ui-react con carga dinámica para evitar SSR.

Nota Turbopack: si aparece un warning de “workspace root”, puedes configurar `turbopack.root` en next.config o unificar lockfiles.

Autenticación y roles
- Login/Registro por credenciales: /api/auth/login y /api/auth/register
- Google OAuth: /api/auth/google (authorization code)
- JWT devuelto en login/reg/google. Actualmente se guarda en localStorage (pendiente migrar a cookie httpOnly si se desea).
- Rutas de escritura (POST/PUT/DELETE) requieren Authorization: Bearer <token>. Las lecturas (GET) son públicas por simplicidad.

Rutas API relevantes (App Router)
- Auth
  - POST /api/auth/register
  - POST /api/auth/login
  - POST /api/auth/google
- Admin
  - GET /api/admin (lista usuarios con campos seguros, requiere rol admin)
  - PUT /api/admin (actualiza rol, requiere rol admin)
- Users públicos (para selects/etiquetas en UI)
  - GET /api/users
- Projects
  - GET/POST /api/projects
  - GET/PUT/DELETE /api/projects/[id]
- Tasks
  - GET/POST /api/tasks (query: projectId, assigneeId)
  - GET/PUT/DELETE /api/tasks/[id]
- Sprints
  - GET/POST /api/sprints (query: projectId)
  - GET/PUT/DELETE /api/sprints/[id]
- Goals
  - GET/POST /api/goals (query: projectId)
  - GET/PUT/DELETE /api/goals/[id]

Estructura principal (extracto)
- app/
  - layout.tsx (Server) envuelve con ClientProviders + Footer
  - providers.tsx (Client) ThemeProvider + AuthProvider + NavbarPublic + Toaster + GoogleOAuthProvider
  - (app)/layout.tsx (Server) aplica AppLayout + AuthGuard (segmento autenticado)
  - (app)/projects/page.tsx (Server wrapper + ProjectsPageClient)
  - (app)/projects/[id]/members/page.tsx (Client; gestión de miembros con API real)
  - (app)/projects/[id]/sprints/page.tsx (Client; lista sprints con API real)
  - (app)/goals/page.tsx (Server wrapper + GoalsPageClient, API real)
  - (app)/dashboard, (app)/my-work, (app)/calendar, (app)/profile (ver código)
- components/
  - layout/, dashboard/, tables/, forms/, kanban/, calendar/, common/, providers/
- services/api/
  - auth.service.ts (login/register/google)
  - users.service.ts (admin: lista y rol)
  - users-public.service.ts (lista pública de usuarios; select/etiquetas)
  - projects.service.ts (fetchProject(s), create/update/delete)
  - tasks.service.ts (fetchTasks, create/update/delete)
  - sprints.service.ts (fetchSprints, create/update/delete)
  - goals.service.ts (fetchGoals, create/update/delete)
- models/
  - User, Project, Task, Sprint, Goal (Mongoose)
- app/api/
  - auth/*, admin/route.ts, users/route.ts
  - projects/route.ts, projects/[id]/route.ts
  - tasks/route.ts, tasks/[id]/route.ts
  - sprints/route.ts, sprints/[id]/route.ts
  - goals/route.ts, goals/[id]/route.ts

Patrón Server/Client + metadata
- Solo Server Components pueden exportar `export const metadata` o `generateMetadata`.
- Páginas que usan hooks (useState, useEffect, useParams, toasts, etc.) deben delegar UI a un componente Client y mantener `page.tsx`/`layout.tsx` como Server cuando sea posible.
- Ver docs/metadata-pattern.md.

UI actualizada a API real
- Projects:
  - components/tables/ProjectsTable.tsx ahora usa fetchProjects + fetchUsers (no mock).
  - components/forms/ProjectForm.tsx ahora usa fetchUsers para owner/members y create/update reales.
  - app/(app)/projects/[id]/members/page.tsx usa fetchProject, updateProject y fetchUsers para agregar/remover miembros.
- Tasks:
  - components/forms/TaskForm.tsx usa fetchUsers para asignación; create/update reales.
  - components/tables/TasksList.tsx lista y elimina tareas vía API real.
- Sprints:
  - forms + page (projects/[id]/sprints) conectados a API.
- Goals:
  - forms + GoalsPageClient conectados a API; lista y elimina.

Cómo probar (UI)
1) Autenticación:
   - /login → Inicia sesión (credenciales o Google). Verifica que se navega a /dashboard.
2) Projects:
   - /projects → crea/edita/elimina. Owner/members se leen de /api/users.
   - /projects/[id]/members → agrega/remueve miembros; persiste en DB.
3) Tasks:
   - Vistas que usan TasksList → crear/editar/eliminar; asignar usuarios reales.
4) Sprints:
   - /projects/[id]/sprints → CRUD real.
5) Goals:
   - /goals → CRUD real.

Pruebas rápidas con curl (opcional)
- Registrar usuario y obtener token:
  curl -s -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"name":"Tester","email":"tester@example.com","password":"Passw0rd!"}'
  export TOKEN="PEGA_AQUI_EL_TOKEN"

- Crear proyecto:
  curl -s -X POST http://localhost:3000/api/projects \
    -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"API Project","key":"AP","ownerId":"<userId>","members":["<userId>"]}'

- Listar proyectos:
  curl -s http://localhost:3000/api/projects

- Actualizar/Borrar:
  curl -s -X PUT http://localhost:3000/api/projects/{id} \
    -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"API Project v2"}'
  curl -s -X DELETE http://localhost:3000/api/projects/{id} \
    -H "Authorization: Bearer $TOKEN"

Seguridad
- Token en localStorage por compatibilidad con UI actual. Recomendado migrar a cookie httpOnly + SameSite.
- Endpoints de escritura validan JWT (Authorization: Bearer <token>).
- Añadir rate limiting/logs estructurados si se requiere endurecer.

Limitaciones conocidas
- Kanban/Calendar siguen mock/estáticos (sin persistencia).
- La rehidratación de sesión al recargar aún no valida el token automáticamente (se sugiere implementar /api/auth/me + AuthProvider que rehidrate al montar).

Roadmap sugerido
- /api/auth/me + rehidratación en AuthProvider
- Migrar Kanban/Calendar a API real (opcional)
- Validaciones zod en POST/PUT, shape uniforme de errores
- Índices/constraints (Project.key único; índices por FK)
- Tests básicos de API y .env.example + script de seed

Sockets (Tiempo real con Socket.IO)
- Objetivo: comunicación en tiempo real autenticada con JWT, rooms por proyecto y canal global.
- Estado: Implementado server Socket.IO dedicado (lib/socket-server.ts), warm-up /api/socket, factory cliente (lib/socket-client.ts), hook (hooks/useSocket.ts) y demos UI.
- Demo incluida:
  - Dashboard: components/realtime/RealtimeActivityFeed (canal global activity:*).
  - Projects/[id]/kanban: ProjectPresence (presence:* por room project:{id}) y TaskEventsDemo (task:* mock).

Dependencias
- socket.io (server), socket.io-client (client).

Variables de entorno (opcional, valores por defecto)
- SOCKET_PORT=3001 (puerto del servidor sockets; por defecto 3001)
- NEXT_PUBLIC_SOCKET_PORT=3001 (puerto del cliente; por defecto 3001)
- NEXT_PUBLIC_SOCKET_URL=<url_completa> (opcional; si se define, tiene prioridad sobre lo anterior)
- CORS: en dev se permite http://localhost:3000; en prod usa NEXT_PUBLIC_SITE_URL si está definido.

Arquitectura
- Servidor (persistente con guardias globalThis):
  - lib/socket-server.ts
    - http.createServer() único en puerto SOCKET_PORT.
    - CORS configurado.
    - Middleware de autenticación: toma token de handshake (auth.token o query.token) y valida con lib/jwt.verifyUserToken.
    - Rooms: 'join-room' y 'leave-room'.
    - Eventos:
      - activity:post → emite activity:new (global).
      - task:create|update|move → emite a room project:{projectId}.
      - presence:ping → emite presence:users (lista mock de conectados por room).
    - Presencia: mapa en memoria por room (mock).
  - app/api/socket/route.ts: inicializa perezosamente el servidor (GET /api/socket) con no-store.
- Cliente:
  - lib/socket-client.ts: createSocket(token) resuelve URL de sockets (NEXT_PUBLIC_SOCKET_URL o derivada).
  - hooks/useSocket.ts: crea/destruye socket, helpers emit/on/off/joinRoom/leaveRoom, warm-up automático a /api/socket.

Componentes de demostración
- components/realtime/RealtimeActivityFeed: feed global; botón para activity:post.
- components/realtime/ProjectPresence: unirse a project:{id}, muestra usuarios conectados (mock).
- components/realtime/TaskEventsDemo: emitir/escuchar task:create|update|move (mock) en project:{id}.

Integración de ejemplo en páginas
- app/(app)/dashboard/DashboardPageClient.tsx → RealtimeActivityFeed.
- app/(app)/projects/[id]/kanban/KanbanPageClient.tsx → ProjectPresence + TaskEventsDemo.

Cómo probar (local)
1) Levantar la app: npm run dev (http://localhost:3000).
2) Autenticarte (login/register) para obtener JWT (guardado en localStorage).
3) Dashboard:
   - Abrir /dashboard. Click en “Publicar mensaje”. Ver el item en “Actividad en tiempo real”.
4) Presencia y tareas:
   - Abrir dos ventanas en /projects/{id}/kanban (mismo {id}).
   - Ver “Presencia en proyecto” actualizarse al abrir ambas.
   - Usar controles de “Task Events (mock)” para emitir task:create/update/move y verlos llegar en ambas ventanas.
5) No debe registrarse “Multiple socket servers initialized” en consola (guardia global).

Notas de seguridad
- Handshake exige JWT válido; conexiones sin token reciben Unauthorized.
- No se persiste información de sockets en DB (mock). Payloads mínimos sin datos sensibles.
- Para producción, considerar rate limiting, logs y revisar CORS/orígenes.

Licencia
Uso educativo/demostrativo.
