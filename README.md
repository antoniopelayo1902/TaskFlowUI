# TaskFlow-Cliente (Mock UI)

Front-end en Next.js 16 (App Router) + TypeScript orientado a “vistas estáticas” con datos mock (sin backend). Incluye layouts público y autenticado, guardias de rol simulados, navegación completa, formularios con validaciones mínimas, tablas con filtros/paginación dummy, toasts y modales de confirmación.

Tecnologías
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui (button, input, dialog, tabs, form, sonner)
- Estado local y servicios mock (sin llamadas a API)
- ESLint base de Next incluida

Requisitos
- Node 18+ (recomendado 20+)
- npm 9+

Instalación y ejecución
1) Instalar dependencias
   npm i

2) Levantar en desarrollo
   npm run dev
   Abrir http://localhost:3000

Cuentas demo de acceso (no hay password, el login es simulado por correo y rol)
- ana@demo.io (admin)
- bruno@demo.io (manager)
- carla@demo.io (developer)
- diego@demo.io (developer)

Durante Login/Registro puedes elegir el rol para simular permisos.

Patrón Server/Client + metadata
- Solo Server Components pueden exportar `export const metadata` o `generateMetadata`.
- Las páginas que usan hooks/efectos o módulos cliente (toasts, Zustand, `useParams`, `usePathname`, etc.) deben mover la UI a un componente Client y dejar el `page.tsx`/`layout.tsx` como Server.
- Documentación del patrón aplicado: ver docs/metadata-pattern.md

Providers cliente globales
- `app/providers.tsx` (Client) centraliza ThemeProvider, AuthProvider, NavbarPublic y Toaster.
- `app/layout.tsx` (Server) envuelve todo con `ClientProviders` y agrega el `Footer`.
- Esto evita que páginas deban ser Client solo por el toaster o navbar.

Estructura principal (extracto)
- app/
  - layout.tsx            Layout público (Server) que envuelve con ClientProviders + Footer
  - page.tsx              Landing
  - login/page.tsx        Login mock (Server; renderiza componente cliente AuthCard)
  - register/page.tsx     Registro mock (Server; renderiza componente cliente AuthCard)
  - providers.tsx         ClientProviders (Theme + Auth + NavbarPublic + Toaster)
  - (app)/layout.tsx      Layout autenticado (AppLayout + AuthGuard)
  - (app)/dashboard/page.tsx               Server wrapper + DashboardPageClient
  - (app)/projects/page.tsx                Server wrapper + ProjectsPageClient
  - (app)/projects/[id]/layout.tsx         Header + tabs de proyecto (Client)
  - (app)/projects/[id]/kanban/page.tsx    Server wrapper + KanbanPageClient (usa useParams)
  - (app)/projects/[id]/list/page.tsx      Client (usa useParams)
  - (app)/projects/[id]/sprints/page.tsx   Client (si usa hooks/params)
  - (app)/projects/[id]/tags/page.tsx      Client (si usa hooks/params)
  - (app)/projects/[id]/members/page.tsx   Client (si usa hooks/params)
  - (app)/my-work/page.tsx                 Server wrapper + MyWorkPageClient
  - (app)/goals/page.tsx                   Server wrapper + GoalsPageClient
  - (app)/calendar/page.tsx                Client (usa estado/acciones cliente)
  - (app)/profile/page.tsx                 Server wrapper + ProfilePageClient
  - (app)/admin/users/page.tsx             Server wrapper + AdminUsersPageClient
- components/
  - layout/ (NavbarPublic [Client], Footer [Server], AppLayout, Sidebar, Topbar)
  - dashboard/ (SummaryCards, MySuggestionsPanel, PointsStreakWidget, RecentActivity)
  - tables/ (ProjectsTable, UsersTable, TasksList)
  - forms/ (AuthCard [Client], ProjectForm, TaskForm, SprintForm, TagForm, GoalForm, UserForm)
  - kanban/ (KanbanBoard, Column, TaskCard)
  - calendar/ (CalendarToolbar, CalendarView, ConnectProviderBanner)
  - common/ (Breadcrumbs [Client], EmptyState, ConfirmDialog)
  - providers/ (ThemeProvider [Client], AuthProvider [Client])
- lib/
  - roles.ts, toast.ts, authGuard.tsx [Client]
- services/mock/
  - auth.service.ts, users.service.ts, projects.service.ts, tasks.service.ts, sprints.service.ts, goals.service.ts

Navegación y pantallas
- Público: / (Landing), /login, /register
- Protegidas: /dashboard, /projects, /projects/[id]/(kanban|list|sprints|tags|members), /my-work, /goals, /calendar, /profile
- Admin: /admin/users (requiere rol admin)
- Elementos de UI: Sidebar con estados activos, tabs en detalle de proyecto, breadcrumbs simples

Guardias y roles (mock)
- services/mock/auth.service.ts expone currentUser simulado (localStorage) y login/logout mock.
- lib/authGuard.tsx protege rutas. Si no hay usuario → /login. Si se requiere admin y el usuario no lo es → /dashboard.
- app/layout.tsx (Server) aplica ClientProviders (Theme + Auth + Navbar + Toaster).
- (app)/layout.tsx aplica AppLayout + AuthGuard (segmento autenticado). /admin puede tener su propio layout con requireRole.

Datos mock (ejemplos principales)
- Users: [{ id:"u1", name:"Ana", email:"ana@demo.io", role:"admin" }, …]
- Projects: [{ id:"p1", name:"TaskFlow", key:"TF", ownerId:"u1", members:["u1","u2"] }, …]
- Tasks: [{ id:"t1", projectId:"p1", title:"Setup", status:"Todo", priority:"High", assigneeId:"u2", dueDate:"2025-07-31", points:5 }, …]
- Sprints: [{ id:"s1", projectId:"p1", name:"Sprint 1", startDate:"2025-07-01", endDate:"2025-07-15" }]
- Goals: [{ id:"g1", title:"Mejorar throughput", progress:40, projectId:"p1" }]

Componentes clave
- Formularios (react-hook-form + zod)
  - Validaciones mínimas: requeridos, email válido, rango de fechas de Sprint, etc.
  - Acciones mock con toasts: toast.success, toast.info, toast.destructive
- Tablas: filtros/paginación dummy, estados vacíos, confirmaciones de eliminación
- Kanban: columnas Todo/Doing/Done con tarjetas; drag & drop “visual” (no funcional)
- Calendario: toolbar (Mes/Semana/Día) + vista estática (grilla) y banner “Conectar proveedor” simulado

Notificaciones y confirmación
- Toaster (sonner) y NavbarPublic se inyectan globalmente desde ClientProviders.
- Helper de toasts en lib/toast.ts
- ConfirmDialog en components/common/ConfirmDialog.tsx

Responsive / UX
- Sidebar colapsable (oculto en móvil), layout fluido y componentes responsivos básicos
- Loaders/skeletons simples simulados en guardias y tablas/estados vacíos

Criterios de aceptación (mock)
- Todas las páginas accesibles; navegación sin backend
- Datos hardcodeados visibles (services/mock), sin fetch/axios
- Guardias: pública vs protegida vs admin
- Formularios con validación mínima y toasts
- Confirmación de eliminación con modal
- Estados vacíos y loaders visuales
- Estilos consistentes en Tailwind + shadcn/ui
- Cumplimiento del patrón metadata Server-only

Cómo probar roles
1) Ir a /login
2) Usar uno de los correos demo (p. ej. ana@demo.io) y seleccionar rol en el formulario para simular permisos
3) Intentar acceder a /admin/users con rol no admin → se redirige a /dashboard

Scripts útiles
- npm run dev           Inicia el servidor de desarrollo
- npm run build         Build de producción
- npm start             Ejecuta el build
- npm run check:metadata  Verifica que no existan archivos `.tsx` con `"use client"` que además exporten `metadata` o `generateMetadata`

Notas
- Este proyecto es 100% mock/estático: no existen llamadas reales a API ni integraciones de backend.
- Se priorizan diseño y navegación; la “persistencia” es en memoria/localStorage para currentUser únicamente.
- Puedes ampliar los mocks en services/mock para ajustar demo o mostrar más datos.
- Si aparece un warning de “workspace root” por múltiples lockfiles, es inofensivo; opcionalmente puedes ajustar `turbopack.root` u `outputFileTracingRoot` en `next.config.ts`.

Licencia
Uso educativo/demostrativo.
