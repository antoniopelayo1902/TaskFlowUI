# TaskFlow UI — Auth con JWT, MongoDB y Google OAuth (App Router)

Aplicación en Next.js (App Router) + TypeScript con:
- Autenticación real por credenciales (email/contraseña) y proveedor Google (Authorization Code Flow)
- Persistencia de usuarios en MongoDB (Mongoose)
- Sesión con JWT firmados y cookies HTTP-only
- Guardias de ruta por autenticación/rol y directivas condicionales de UI
- UI con Tailwind CSS + shadcn/ui

Además, conserva datos mock para módulos como Projects/Tasks/Goals mientras se migra a DB.

Tecnologías
- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui (button, input, dialog, tabs, form, sonner)
- Mongoose (MongoDB), jsonwebtoken, bcryptjs
- Google OAuth (react-oauth/google)

Requisitos
- Node 18+ (recomendado 20+)
- npm 9+
- MongoDB (Atlas o local)
- Credenciales de Google OAuth 2.0 (Client ID y Client Secret)

Instalación y ejecución
1) Instalar dependencias
   npm i

2) Variables de entorno
   - Copiar .env.example a .env.local y completar valores:
     - MONGODB_URI (y opcional MONGODB_DB_NAME)
     - ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET (cadenas aleatorias largas)
     - NEXT_PUBLIC_GOOGLE_CLIENT_ID
     - NEXT_PUBLIC_GOOGLE_REDIRECT_URI (ej: http://localhost:3000)
     - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
     - GOOGLE_REDIRECT_URI (debe ser idéntico a NEXT_PUBLIC_GOOGLE_REDIRECT_URI y al configurado en Google Console)
     - (Opcional) NEXT_PUBLIC_API_URL=http://localhost:3000/api

   Importante: Los redirect_uri del cliente y servidor deben coincidir EXACTAMENTE y estar dados de alta en Google Cloud Console.

3) Levantar en desarrollo
   npm run dev
   Abrir http://localhost:3000

Notas de autenticación (cómo funciona)
- Registro (/api/auth/register): crea usuario en DB (password hash con bcrypt), firma JWT y setea cookies HTTP-only.
- Login (/api/auth/login): verifica hash, firma JWT y setea cookies HTTP-only.
- Google Login (/api/auth/google): intercambia authorization code por tokens con Google, vincula/crea usuario en DB y emite cookies propias (no se usa id_token de Google como sesión).
- Sesión persistente: al montar, el AuthProvider llama /api/auth/me para restaurar el usuario desde el access token en cookies.
- Logout (/api/auth/logout): limpia cookies.

Cookies y seguridad
- Cookies HTTP-only con sameSite=lax; secure=true en producción.
- Si no configuras REFRESH_TOKEN_SECRET, funciona solo con access token (sin refresh flow). Para esta entrega es suficiente. Puedes ampliar con rotación de refresh tokens y lista blanca en DB.

Guardias y directivas de UI
- lib/authGuard.tsx: protege rutas del segmento (app) y redirige a /login si no hay sesión. Respeta returnTo para volver al destino original después de iniciar sesión.
- components/auth/If.tsx: IfAuthenticated, IfAnonymous, IfRole para mostrar/ocultar UI según estado/rol.
- NavbarPublic: muestra Ingresar/Registro si no hay sesión y Dashboard/Administración/Cerrar sesión cuando sí.

Estructura principal (extracto)
- app/
  - layout.tsx               Layout público (Server) que envuelve ClientProviders + Footer
  - providers.tsx            ClientProviders (Theme + Auth + NavbarPublic + Toaster)
  - page.tsx                 Landing
  - login/page.tsx           Server: renderiza AuthCard (Client) + GoogleButton
  - register/page.tsx        Server: renderiza AuthCard (modo registro)
  - (app)/layout.tsx         AppLayout + AuthGuard (segmento protegido)
  - (app)/dashboard/page.tsx Dashboard protegido
  - api/auth/
    - login/route.ts         Verifica credenciales, setea cookies
    - register/route.ts      Crea usuario, setea cookies
    - me/route.ts            Retorna usuario si el access token es válido
    - logout/route.ts        Limpia cookies
    - google/route.ts        Intercambia code con Google y crea/vincula usuario
- components/
  - providers/AuthProvider.tsx  Restaura sesión y expone login/loginWithGoogle/logout
  - auth/GoogleButton.tsx       Google OAuth con auth-code flow (redirect_uri por env)
  - forms/AuthCard.tsx          Login/Registro (zod + react-hook-form)
  - layout/NavbarPublic.tsx     Navegación según sesión/rol
- lib/
  - db.ts     Conexión Mongoose
  - jwt.ts    Firma/verificación JWT y manejo de cookies
  - roles.ts  Tipos y helpers de rol
  - authGuard.tsx Guardia para rutas protegidas
- models/
  - User.ts   Esquema Mongoose (name/email/role/passwordHash/providerIds.google)
- services/
  - api/auth.service.ts  Servicios de auth reales (login/register/google/me/logout)
  - mock/*               Datos mock para módulos aún no migrados a DB (tasks, projects, etc.)

Flujos soportados
- Registro con email/contraseña
- Login con email/contraseña
- Login con Google (authorization code flow)
- Restauración de sesión tras refresh
- Redirección a returnTo post-login
- Guardias/Directivas de UI basadas en sesión/rol

Cómo probar
- Crear .env.local con tus credenciales (ver .env.example)
- Arrancar npm run dev
- Ir a /register para crear usuario; luego /login para iniciar sesión
- Probar “Continuar con Google” (revisa que los redirect_uri coincidan)
- Intentar acceder a /dashboard sin sesión debe redirigir a /login; tras iniciar sesión, te envía a returnTo

Datos mock (módulos no migrados)
- Projects/Tasks/Goals/Sprints/Users (mock) siguen viviendo en services/mock/* con persistencia en memoria.
- Esto significa que crear/eliminar tareas no persiste entre reinicios/hot reload.
- Migración a DB: se puede implementar CRUD real con MongoDB en endpoints bajo app/api/* y actualizar los servicios del front para usar fetch a esos endpoints.

Scripts útiles
- npm run dev     Inicia desarrollo
- npm run build   Build de producción
- npm start       Arranca el build
- npm run check:metadata  Verifica patrón metadata Server-only (si aplica)

Troubleshooting
- 401 en /api/auth/me:
  - Cookies no seteadas → revisa secrets, dominio, sameSite/secure y que la ruta de login esté respondiendo 200.
  - ACCESS_TOKEN_SECRET/REFRESH_TOKEN_SECRET faltantes → completar .env.local y reiniciar.
- Google login falla:
  - redirect_uri del cliente y servidor deben ser idénticos y registrados en Google Cloud.
  - Ver logs en consola del navegador y en /api/auth/google.
- Conexión MongoDB:
  - Atlas: IP allowlist y cadena MONGODB_URI correcta.
  - Local: mongod corriendo y URI válida (mongodb://localhost:27017).

Notas
- Esta autenticación está pensada para entrega académica con buenas prácticas (cookies HTTP-only, hash de contraseñas, provider Google). Para producción, considera refresh tokens con rotación, revocación, rate limiting y CSRF según arquitectura.
- Si front y API se hospedan en dominios distintos, configura CORS y credentials: "include".

Licencia
Uso educativo/demostrativo.
