# CanchasPlay — Frontend

Frontend de una plataforma web de **reservas de canchas de fútbol** (5, 7 y 11).
Proyecto construido por etapas. Puede funcionar en **modo demo** sin backend o
conectarse a la API FastAPI cuando se configura `NEXT_PUBLIC_API_URL`.

## Stack tecnológico

- [Next.js](https://nextjs.org/) (App Router, `cacheComponents`) + React
- TypeScript estricto
- SCSS Modules + Sass
- [Lucide React](https://lucide.dev/) (iconos)
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) (formularios y validación)
- [Sonner](https://sonner.emilkowal.ski/) (notificaciones)
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) (pruebas)
- pnpm como gestor de paquetes

## Requisitos

- Node.js 20.9+ (probado con Node 24)
- pnpm 12+

## Instalación y uso

```bash
pnpm install       # instalar dependencias
pnpm dev           # servidor de desarrollo (http://localhost:3000)
pnpm build         # build de producción
pnpm start         # servir el build de producción
```

### Modos de datos

Copiá `.env.example` a `.env.local` y descomentá/configurá la URL para activar
la API (por ejemplo `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`). Sin esa
variable o si queda vacía, se conserva el modo demo. Reiniciá el servidor de
Next.js después de cambiarla. Al ser `NEXT_PUBLIC_*`, Next.js incorpora su
valor al bundle durante `next build`: debe configurarse antes de compilar cada
entorno y no debe contener secretos.

En modo API se conectan autenticación (`/auth/register`, `/auth/login`,
`/auth/me`), catálogo (`/courts`, `/courts/{id}`), disponibilidad
(`/courts/{id}/availability`) y reservas (`POST /reservations`,
`GET /reservations/me`, `GET /reservations/{id}`,
`POST /reservations/{id}/cancel`). El navegador manda JWT como
`Authorization: Bearer`; hoy se guarda bajo `canchasplay:token` en
`localStorage`. Esto es vulnerable a robo ante XSS; para producción conviene
migrar a cookies `httpOnly`, `Secure`, `SameSite` y ajustar CORS/CSRF en el
backend.

La disponibilidad se consulta en la API y no se reemplaza por ocupación demo
si falla. Los datos del panel administrativo continúan en demo y la pantalla
lo advierte. En modo API, “Mis reservas” permite pagar con Mercado Pago
Checkout Pro: el frontend pide la preferencia al backend y redirige al
checkout. El webhook del backend confirma la reserva. En modo demo el pago
sigue simulado. La cancelación está conectada a
`POST /reservations/{id}/cancel` con confirmación y refresco de la lista.

Los tipos de `lib/api/schema.d.ts` se generan desde el OpenAPI real con
`pnpm generate:api`; no se editan a mano.

### Backend requerido

El backend FastAPI debe estar levantado en la URL configurada y permitir el
origen exacto del frontend (`FRONTEND_ORIGINS`). Para el entorno local:

```powershell
cd api
.\.venv\Scripts\Activate.ps1
docker compose up -d
alembic upgrade head
python -m scripts.seed
python -m uvicorn app.main:app --reload
```

El seed crea canchas de ejemplo y, si `SEED_ADMIN_*` está configurado, un
administrador.

Para pagos reales, el backend necesita `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`,
`MP_ENVIRONMENT`, `MP_WEBHOOK_URL` y `FRONTEND_URL`. El frontend no guarda
credenciales de Mercado Pago. El paso a paso está en el `README.md` raíz y en
`informes/2026-11-05-ceo-mercado-pago.md`.

## Scripts disponibles

| Script              | Descripción                                  |
| ------------------- | -------------------------------------------- |
| `pnpm dev`          | Servidor de desarrollo                       |
| `pnpm build`        | Build de producción                          |
| `pnpm start`        | Sirve el build de producción                 |
| `pnpm lint`         | Lint con ESLint (config Next.js)             |
| `pnpm typecheck`    | Chequeo de tipos sin emitir (`tsc --noEmit`) |
| `pnpm test`         | Pruebas unitarias y de componentes (Vitest)  |
| `pnpm test:watch`   | Vitest en modo watch                         |
| `pnpm generate:api` | Regenera tipos desde el OpenAPI del backend  |
| `pnpm format`       | Formatea el código con Prettier              |
| `pnpm format:check` | Verifica el formato sin modificar archivos   |

## Rutas

| Ruta                   | Contenido                                             | Acceso          |
| ---------------------- | ----------------------------------------------------- | --------------- |
| `/`                    | Landing (hero, cómo funciona, destacadas, beneficios) | Público         |
| `/canchas`             | Catálogo: filtros, selector de fecha y disponibilidad | Público         |
| `/login`               | Inicio de sesión demo o API                           | Público         |
| `/registro`            | Registro demo o API                                   | Público         |
| `/mis-reservas`        | Reservas demo/API; pago demo o Mercado Pago           | Cliente / Admin |
| `/admin`               | Dashboard con métricas de la demo                     | Admin           |
| `/admin/canchas`       | Gestión de canchas y horarios                         | Admin           |
| `/admin/reservas`      | Tabla de reservas con filtros y búsqueda              | Admin           |
| `/admin/configuracion` | Parámetros de la demo y escenarios predefinidos       | Admin           |

> La navegación por roles del frontend no es una frontera de seguridad. Los
> endpoints protegidos deben verificar autenticación y autorización en backend.

## Uso de mocks y datos de demostración

En modo demo, la data inicial vive en `lib/mocks/` y se persiste en
`localStorage` para mantener consistencia entre pantallas. Con API configurada,
autenticación, catálogo, disponibilidad y reservas consultan FastAPI; el panel
admin continúa en demo. Claves:

| Clave `localStorage`                | Contenido                                                                   |
| ----------------------------------- | --------------------------------------------------------------------------- |
| `canchasplay:sesion-demo`           | Sesión simulada (cliente/admin)                                             |
| `canchasplay:reservas-demo`         | Reservas creadas en la demo                                                 |
| `canchasplay:horarios-reservados`   | Horarios ocupados                                                           |
| `canchasplay:canchas-demo`          | Canchas creadas desde el panel admin                                        |
| `canchasplay:horarios-canchas-demo` | Grilla horaria por cancha                                                   |
| `canchasplay:config-demo`           | Parámetros de simulación (latencia, etc.)                                   |
| `canchasplay:token`                 | JWT de API (solo modo API; no usar en producción sin revisar el riesgo XSS) |

En demo, las respuestas de servicios (201/409/410/422/503 en reservas;
200/402/409/410/500 en pagos) se simulan en `lib/services/`. El botón
**Reiniciar datos** en `/admin/configuracion` borra las claves demo y repuebla
las semillas; no elimina el JWT.

## Arquitectura

Arquitectura modular orientada a funcionalidades. Cada módulo funcional vive en
`features/`, consumiendo `lib/services` y los componentes de `components/ui`.

```
app/                  Páginas y layouts (App Router)
components/
  ui/                 Componentes reutilizables (Button, Input, Card, Modal, Switch, …)
  layout/             Componentes estructurales (Header, Footer, Container, UserMenu)
features/             Módulos funcionales (auth, canchas, reservas, landing, admin)
lib/
  services/           Abstracción de datos (demo/API)
  api/                Configuración, HTTP, contratos y mappers FastAPI
  mocks/              Datos de demostración (canchas, usuarios, reservas, auth)
  utils/              Utilidades compartidas (cn, fecha, formato)
contexts/             SessionContext (sesión simulada y navegación por roles)
hooks/                useScrolled, useFechaActual, useCuentaRegresiva
types/                Interfaces y tipos del dominio
styles/               Design tokens (_tokens.scss), mixins y estilos globales
tests/                Helpers compartidos de pruebas
*.test.ts(x)          Pruebas junto a su módulo (Vitest + Testing Library)
vitest.config.ts      Configuración de pruebas (jsdom, alias @/)
```

## Design system

Los tokens viven en `styles/_tokens.scss` (colores, espaciados, tipografía,
sombras, radios, breakpoints y estados). Los mixins están en `styles/_mixins.scss`.
Los componentes consumen los tokens vía `@use` — nunca valores hardcodeados.

- **Paleta:** verde deportivo `#16A34A`, verde oscuro `#166534`, fondo `#F8FAFC`,
  texto `#0F172A`, superficies blancas.
- **Estados semánticos:** success, error, warning e info (con variantes suaves
  para badges y alertas).

### Componentes UI base

`Button`, `Input`, `Card`, `Badge`, `Modal`, `Spinner`, `Alert`, `EmptyState`,
`Skeleton`, `Switch` — todos con props tipadas, variantes y estados accesibles.
Se importan desde `@/components/ui`.

## Convenciones

- Server Components por defecto; Client Components solo cuando el componente
  necesita hooks o interactividad (ej.: `Input`, `Modal`, `Switch`).
- SCSS Modules por componente; sin CSS duplicado ni estilos inline arbitrarios.
- Sin `any`; TypeScript estricto.
- HTML semántico, accesibilidad (roles, aria-*, foco visible, skip link,
  contraste AA, `prefers-reduced-motion`) y diseño mobile-first.
- Alias de importación: `@/` (raíz del proyecto).

## Pruebas

Se usan **Vitest** con **Testing Library** en entorno jsdom. Las pruebas viven
junto a su módulo como `*.test.ts` / `*.test.tsx`; los helpers compartidos están
en `tests/helpers.ts` y la configuración en `vitest.config.ts`.

```bash
  pnpm test        # corre toda la suite (23 archivos,122 pruebas)
pnpm test:watch  # modo watch
```

Cobertura actual:

- **Validaciones** — esquemas Zod de login, registro, canchas, horarios y
  configuración de demo.
- **Componentes** — `Button` (variant/href/isLoading), `Input` (label/error/hint),
  `Switch` (role switch + cambios), `Alert` (roles alert/status), `Badge`,
  `EmptyState`, `Modal` (Escape, foco, botón cerrar).
- **Formularios** — `LoginForm` (validación, error de servicio, redirect),
  `CourtForm` (validación, éxito, duplicado, estado inactivo).
- **Navegación** — `Header` por roles (visitante/cliente/admin), menú hamburguesa
  con `aria-expanded`, cierre de sesión; flujo `iniciarSesion`/`cerrarSesion`.
- **Estados de carga** — skeleton en `ReservasSection` y `AdminReservationsTable`.
- **Errores simulados** — switch de error (503) en reservas, error de servicio en
  formularios y `ConfirmDeleteModal`.
- **Modales** — `ReservationModal` (201 y409), `ConfirmDeleteModal`
  (confirmar, error, cancelar).
- **Filtros** — por estado, fecha, cancha, búsqueda y limpieza en `ReservasSection`.
- **Consistencia de mocks** — IDs únicos, relaciones cancha/usuario válidas,
  grilla horaria coherente y servicios (reserva, pago, canchas, horarios, config).

La verificación end-to-end de servicios también puede correrse con:

```bash
pnpm dlx tsx scripts/verify-etapa6.ts
```

## Estado de las etapas

- [x] **Etapa 1** — Proyecto, arquitectura, design system, UI base, layout, tipos y mocks
- [x] **Etapa 2** — Landing page (hero, cómo funciona, canchas destacadas, beneficios)
- [x] **Etapa 3** — Login, registro y sesión demo con navegación por roles
- [x] **Etapa 4** — Catálogo de canchas, selector de fecha y disponibilidad de horarios
- [x] **Etapa 5** — Flujo de reserva con respuestas simuladas (201/409/410/422/503)
- [x] **Etapa 6** — Mis reservas, estados, vencimientos y pago simulado
- [x] **Etapa 7** — Panel de administración (`/admin`) con dashboard, secciones y reset de demo
- [x] **Etapa 8** — Administración de canchas y horarios (`/admin/canchas`) con altas y gestión de grillas
- [x] **Etapa 9** — Reservas admin con filtros (`/admin/reservas`) y configuración visual de demo con escenarios (`/admin/configuracion`)
- [x] **Etapa 10** — Auditoría final: arquitectura, accesibilidad, responsive, suite de pruebas (Vitest), optimización y documentación

> Las canchas y horarios creados desde el panel se guardan en el
> almacenamiento local del navegador y se reflejan en el catálogo
> público; la edición/eliminación completa de canchas queda pendiente.
> La configuración de demo (semáforos, latencia, retención y
> escenarios) solo administra la simulación del frontend: no hay
> concurrencia, cobros ni seguridad real.

## Usuarios de demostración

En modo demo, la sesión es solo estado simulado del navegador, sin contraseñas
reales. La contraseña compartida para las cuentas de prueba es `demo1234`.
Estas cuentas no se crean ni son válidas automáticamente en el backend.

| Perfil  | Email                         |
| ------- | ----------------------------- |
| Cliente | `martin.gomez@example.com`    |
| Cliente | `lucia.fernandez@example.com` |
| Admin   | `ana.admin@example.com`       |
