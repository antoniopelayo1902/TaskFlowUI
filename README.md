# TaskFlow-Cliente (UI + API real)

Cliente en Next.js 16 (App Router) + TypeScript. El proyecto evolucionó a incluir persistencia real con MongoDB/Mongoose y control de acceso por propietario (owner) para módulos clave. Se han simplificado vistas para mostrar únicamente funcionalidades reales y se eliminaron elementos mock en la UI.

Tecnologías
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui (button, input, dialog, tabs, form, sonner)
- Mongoose (MongoDB) para persistencia
- JWT (jsonwebtoken) para autenticación
- Socket.IO (server y client) para tiempo real (servidor activo; demos reducidas en UI)
- Swagger UI (swagger-ui-react) para documentación interactiva de API
- Testing: Vitest + @testing-library/react + happy-dom, Cypress para E2E

Estado actual (resumen)
- Persistencia real y cambios recientes:
  - Autenticación:
    - Login/Registro por credenciales y Google OAuth (authorization code).
    - JWT devuelto en login/registro/Google; almacenado en localStorage (ver seguridad).
  - Usuarios (Admin):
    - Listado y cambio de rol (sólo rol admin).
    - La UI ya no muestra el rol del usuario en el Topbar ni en el Sidebar.
  - Proyectos:
    - CRUD real con control por propietario (owner-scoped).
    - El owner del proyecto es siempre la cuenta autenticada que crea el proyecto (forzado en el backend).
    - Due date (dueDate) soportada en modelo y API; se usa en Calendario.
    - Miembros: retirados de la UI (la API mantiene el campo internamente, por defecto []).
    - Listados y lecturas GET requieren Authorization y filtran por owner.
  - Metas (Goals):
    - CRUD real con control por propietario (owner-scoped).
    - Due date (dueDate) soportada en modelo y API; se usa en Calendario.
    - Validación al asociar projectId: sólo proyectos del mismo owner.
    - GET requiere Authorization y filtra por owner.
  - Tareas y Sprints:
    - CRUD real (como en versión previa). No se han aplicado aún reglas owner-scoped específicas.
  - Archivos en Proyectos:
    - Soporte S3 (upload/delete) permanece.

- Vistas actualizadas:
  - Dashboard:
    - Sólo elementos funcionales: accesos rápidos, estadísticas básicas y listas de próximas entregas (Proyectos y Metas con dueDate en los próximos 7 días).
    - Eliminado el feed de “actividad en tiempo real” y demás widgets mock.
  - Mi trabajo:
    - Muestra únicamente “Mis proyectos” (filtrados por owner).
    - Se elimina el bloque de “Mis tareas”.
  - Calendario:
    - Real (grid mensual), navegación por mes/año, sin banner de “conectar proveedor”.
    - Muestra eventos sólo con dueDate (Proyectos y Metas).
    - Normalización de fechas para evitar desfases por zona horaria.
  - Perfil:
    - Sólo lectura: muestra nombre y correo; sin edición.
  - Topbar/Sidebar:
    - No se muestra el rol del usuario (“Rol: …” eliminado).
  - Footer:
    - Texto fijo: “© 2025 TaskFlow.” (se eliminó la nota demo/mock).

Requisitos
- Node 18+ (recomendado 20+)
- npm 9+
- MongoDB accesible (local o remoto)

Variables de entorno (TaskFlowUI/.env)
- Server/API
  - MONGODB_URI=mongodb://localhost:27017/taskflow
  - JWT_SECRET=un_secret_largo_aleatorio
  - JWT_EXPIRES_IN=7d
  - GOOGLE_CLIENT_ID=<client_id_servidor>
  - GOOGLE_CLIENT_SECRET=<secret_servidor>
  - GOOGLE_REDIRECT_URI=http://localhost:3000/login
- Client
  - NEXT_PUBLIC_API_URL=http://localhost:3000/api
  - NEXT_PUBLIC_GOOGLE_CLIENT_ID=<client_id_publico>
- Sockets (opcional)
  - SOCKET_PORT=3001
  - NEXT_PUBLIC_SOCKET_PORT=3001
  - NEXT_PUBLIC_SOCKET_URL=<url_completa> (tiene prioridad si se define)
  - Para CORS en prod: define NEXT_PUBLIC_SITE_URL
- S3 (opcional)
  - AWS_S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

Instalación y ejecución
1) Instalar dependencias:
   npm i

2) Desarrollo:
   npm run dev
   Abrir http://localhost:3000

3) Swagger (OpenAPI UI):
   http://localhost:3000/api-docs

Autenticación y control de acceso
- JWT en Authorization: Bearer <token>.
- Rutas de escritura (POST/PUT/DELETE) requieren token.
- Proyectos y Metas:
  - GET requieren token y filtran por ownerId.
  - GET por id devuelve 404 si el recurso no pertenece al owner.
  - POST fuerza ownerId = usuario autenticado (se ignora ownerId en body).
  - PUT y DELETE sólo afectan recursos del owner.
- La UI ya no muestra el rol y fue simplificada para evitar acciones no soportadas.

Rutas API relevantes (App Router)
- Auth
  - POST /api/auth/register
  - POST /api/auth/login
  - POST /api/auth/google
- Admin
  - GET /api/admin (requiere rol admin)
  - PUT /api/admin (requiere rol admin)
- Users públicos (para selects/etiquetas en UI)
  - GET /api/users
- Projects (owner-scoped)
  - GET/POST /api/projects (GET requiere token; lista sólo los del owner)
  - GET/PUT/DELETE /api/projects/[id] (sólo si pertenece al owner)
  - DueDate soportada (POST/PUT aceptan dueDate; GET retorna dueDate)
  - Files:
    - /api/projects/[id]/files y /api/projects/[id]/files/[fileId] (S3)
- Goals (owner-scoped)
  - GET/POST /api/goals (GET requiere token; lista sólo los del owner; projectId opcional validado)
  - GET/PUT/DELETE /api/goals/[id] (sólo si pertenece al owner)
  - DueDate soportada (POST/PUT aceptan dueDate; GET retorna dueDate)
- Tasks
  - GET/POST /api/tasks (query: projectId, assigneeId)
  - GET/PUT/DELETE /api/tasks/[id]
- Sprints
  - GET/POST /api/sprints (query: projectId)
  - GET/PUT/DELETE /api/sprints/[id]
- OpenAPI
  - GET /api/docs/openapi (especificación)
  - UI en /api-docs

Modelo de datos (extracto)
- User: name, email (único), password?, role (“admin|manager|developer”), provider (“credentials|google”), googleId?, avatarUrl?, timestamps
- Project: name, key (uppercase 2-6), ownerId, members[], dueDate?, timestamps
- Goal: title, progress 0..100, projectId?, ownerId?, dueDate?, timestamps
- Task/Sprint: como en versión previa (ver models/*)

Calendario (debido a dueDate)
- La vista mensual es real (días exactos del mes, encabezados Lun..Dom).
- Botones de navegación: Hoy, Mes anterior, Mes siguiente.
- Evento = Proyecto o Meta con dueDate:
  - Cliente normaliza “YYYY-MM-DD” y ubica el evento en el día correcto.
  - Servidor normaliza “YYYY-MM-DD” a Date.UTC al mediodía para evitar desfases por zona horaria.
- Sólo se muestran eventos con dueDate (si no hay dueDate, no aparece).

UI actualizada (puntos destacados)
- Dashboard:
  - Accesos (Proyectos/Metas/Calendario/Mi trabajo) y botón Refrescar.
  - Estadísticas: conteos y próximas entregas (7 días).
  - Listas de próximas entregas para Proyectos y Metas.
  - Sin feed de actividad en tiempo real (servidor de sockets permanece disponible).
- Proyectos:
  - Form con dueDate y sin Owner/Miembros (owner se fuerza en backend; miembros retirados de UI).
  - Tabla sin columna “Miembros”.
  - Pestaña “Miembros” eliminada en proyecto (ruta redirige a Kanban).
- Metas:
  - Form con dueDate y asociación opcional de proyecto (sólo del owner).
- Mi trabajo:
  - Muestra únicamente “Mis proyectos”.
- Perfil:
  - Sólo lectura (nombre y correo).
- Topbar/Sidebar:
  - Ocultan el rol (“Rol: …”).
- Footer:
  - “© 2025 TaskFlow.”

Sockets (servidor disponible)
- Servidor dedicado (lib/socket-server.ts) y warm-up /api/socket.
- Middleware valida JWT en handshake; rooms por proyecto; eventos de tarea/presencia.
- Demos reducidas en el Dashboard, pero el soporte server-side permanece.

Pruebas automatizadas
- Unitarias: Vitest + Testing Library + happy-dom
  - Setup en test/setup.ts con jest-dom, cleanup y mocks.
  - Ejecutar:
    - npm run test
    - npm run test:watch
    - npm run test:ui
    - npm run coverage
- E2E: Cypress
  - BaseUrl http://localhost:3000
  - GUI: npm run cy:open
  - Headless: npm run e2e
  - Nota: si existen specs que dependían de “Miembros”, podrían requerir ajustes por los cambios de UI.

Seguridad
- Token en localStorage por compatibilidad con la UI actual.
- Recomendado migrar a cookie httpOnly + SameSite para mejorar la seguridad.
- Endpoints de escritura y ahora también lecturas sensibles (Proyectos/Metas) validan JWT.
- Considerar rate limiting y logs estructurados para producción.

Limitaciones y roadmap sugerido
- Tareas y Sprints no están owner-scoped aún (se puede replicar el patrón de Proyectos/Metas).
- Kanban sigue siendo mock visual (drag sin persistencia).
- Presencia vía sockets es en memoria (mock), no escalable multi-instancia sin un store compartido.
- Agregar .env.example y script de seed/fixtures.
- Migrar token a cookie httpOnly y agregar /api/auth/me para rehidratación segura al montar el cliente.
- Añadir validaciones zod en handlers de API para uniformar errores y tipado.

Comandos útiles
- Desarrollo: npm run dev
- Lint: npm run lint
- Unit tests:
  - npm run test
  - npm run test:watch
  - npm run test:ui
  - npm run coverage
- Cypress:
  - npm run cy:open
  - npm run e2e

Licencia
Uso educativo/demostrativo.
