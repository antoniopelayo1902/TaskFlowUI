# TaskFlow-Cliente (Mock UI)

Front-end en Next.js 14 (App Router) + TypeScript orientado a “vistas estáticas” con datos mock (sin backend). Incluye layouts público y autenticado, guardias de rol simulados, navegación completa, formularios con validaciones mínimas, tablas con filtros/paginación dummy, toasts y modales de confirmación.

Tecnologías
- Next.js 14 (App Router) + TypeScript
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

Estructura principal (extracto)
- app/
  - layout.tsx            Layout público (NavbarPublic + Footer + Toaster + AuthProvider)
  - page.tsx              Landing
  - login/page.tsx        Login mock
  - register/page.tsx     Registro mock
  - (app)/layout.tsx      Layout autenticado (Sidebar + Topbar + guard)
  - (app)/dashboard/page.tsx
  - (app)/projects/page.tsx
  - (app)/projects/[id]/layout.tsx    Header + tabs de proyecto
  - (app)/projects/[id]/kanban/page.tsx
  - (app)/projects/[id]/list/page.tsx
  - (app)/projects/[id]/sprints/page.tsx
  - (app)/projects/[id]/tags/page.tsx
  - (app)/projects/[id]/members/page.tsx
  - (app)/my-work/page.tsx
  - (app)/goals/page.tsx
  - (app)/calendar/page.tsx
  - (app)/profile/page.tsx
  - (app)/admin/layout.tsx            Guard admin
  - (app)/admin/users/page.tsx        Administración/Usuarios (solo admin)
- components/
  - layout/ (NavbarPublic, Footer, AppLayout, Sidebar, Topbar)
  - dashboard/ (SummaryCards, MySuggestionsPanel, PointsStreakWidget, RecentActivity)
  - tables/ (ProjectsTable, UsersTable, TasksList)
  - forms/ (AuthCard, ProjectForm, TaskForm, SprintForm, TagForm, GoalForm, UserForm)
  - kanban/ (KanbanBoard, Column, TaskCard)
  - calendar/ (CalendarToolbar, CalendarView, ConnectProviderBanner)
  - common/ (Breadcrumbs, EmptyState, ConfirmDialog)
  - providers/ (ThemeProvider, AuthProvider)
- lib/
  - roles.ts, toast.ts, authGuard.tsx
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
- (app)/layout.tsx aplica Theme + Toaster + AuthProvider.
- (app)/layout.tsx público, (app)/layout.tsx autenticado + guard. /admin tiene su propio layout con requireRole: "admin".

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
- Toaster (sonner) en layout público
- Helper toast en lib/toast.ts
- ConfirmDialog en components/common/ConfirmDialog.tsx

Responsive / UX
- Sidebar colapsable (oculto en móvil), layout fluido y componentes responsivos básicos
- Loaders/skeletons simples simulados en guardias y tablas/estados vacíos

Criterios de aceptación (cumplidos)
- Todas las páginas accesibles; navegación sin backend
- Datos hardcodeados visibles (services/mock), sin fetch/axios
- Guardias: pública vs protegida vs admin
- Formularios con validación mínima y toasts
- Confirmación de eliminación con modal
- Estados vacíos y loaders visuales
- Estilos consistentes en Tailwind + shadcn/ui

Cómo probar roles
1) Ir a /login
2) Usar uno de los correos demo (p. ej. ana@demo.io) y seleccionar rol en el formulario para simular permisos
3) Intentar acceder a /admin/users con rol no admin → se redirige a /dashboard

Checklist de capturas sugeridas
- Landing pública (/)
- Login (/login) y Registro (/register)
- Dashboard (/dashboard) con tarjetas y widgets
- Proyectos (/projects): listado + modal Crear/Editar + confirmación de eliminar
- Detalle de proyecto (/projects/p1/*): tabs Kanban, Lista, Sprints, Etiquetas, Miembros
- Mi trabajo (/my-work) con filtro por usuario actual
- Metas (/goals): listado + crear/editar + barra de progreso
- Calendario (/calendar): toolbar y vistas Month/Week/Day + banner conectar
- Perfil (/profile) con formulario mock
- Administración/Usuarios (/admin/users) (solo admin)

Notas
- Este proyecto es 100% mock/estático: no existen llamadas reales a API ni integraciones de backend.
- Se priorizan diseño y navegación; la “persistencia” es en memoria/localStorage para currentUser únicamente.
- Puedes ampliar los mocks en services/mock para ajustar demo o mostrar más datos.

Scripts útiles
- npm run dev       Inicia el servidor de desarrollo
- npm run build     Build de producción
- npm start         Ejecuta el build

Licencia
Uso educativo/demostrativo.
