# Backlog — BVLZ Gestión de Destacamento

Estado: MVP (Fases 0–3) implementado y deployado en Vercel. Este documento
recoge lo pendiente, mejoras, pulido y deuda técnica. Prioridad: **Alta** (hacer
pronto), **Media** (siguiente iteración), **Baja** (cuando se pueda).

---

## 0. Deploy / operación (pendientes concretos)

- [ ] **(Paso 6 del deploy) Configurar Supabase → Authentication → URL Configuration:**
      poner el dominio de Vercel en **Site URL** (y en Redirect URLs). No es
      crítico con login por email/contraseña, pero deja todo prolijo para
      recuperación de contraseña / futuros magic links / OAuth. **(Alta)**
- [ ] **Base de datos separada para producción.** Hoy dev y prod comparten el
      mismo proyecto Supabase: tocar datos en local afecta la web. Crear un
      Supabase de producción y dejar el actual para desarrollo. **(Media)**
- [ ] Definir cómo se aplican migraciones a prod (`pnpm db:deploy`) como paso
      explícito del flujo de release. **(Media)**
- [ ] Latencia: la DB está en `ca-central-1` (Canadá) y los usuarios en
      Argentina. Evaluar región `sa-east-1` (São Paulo) al crear el Supabase de
      prod. **(Media)**

---

## 1. Bugs / correctitud

- [ ] **Zona horaria (Alta).** Las fechas/horas se formatean con
      `toLocale*("es-AR", …)` **sin** `timeZone`, así que en Vercel (servidor en
      UTC) se muestran corridas ~3 h. Afecta: `app/fichado/page.tsx`,
      `app/novedades/page.tsx`, `app/tareas/[id]/page.tsx`,
      `app/partes/[id]/page.tsx`, `app/personal/[id]/page.tsx`,
      `app/guardias/page.tsx`, `app/partes/page.tsx`.
      → Fijar `timeZone: "America/Argentina/Buenos_Aires"` en todas (idealmente
      un helper único en `lib/dominio.ts`, ej. `fmtFecha`/`fmtFechaHora`).
- [ ] **Límites de día en UTC (Alta).** El "hoy" del fichado y el agrupado por
      día/mes de guardias se calculan con `new Date()`/`getDate()` en el
      servidor (UTC). Una fichada a las 22:00 (AR) cae "mañana" en UTC.
      → Calcular los rangos de día/mes en horario de Argentina.
- [ ] Fichado: no valida duplicados ni coherencia (se puede fichar "entrada"
      dos veces seguidas). Definir reglas mínimas. **(Media)**

---

## 2. Funcionalidad incompleta (por módulo)

### Partes de intervención
- [ ] **v2: secciones condicionales** del formulario oficial según tipo de
      siniestro (vehículos, inmueble, análisis de incendio, víctimas, víctimas
      fatales, rescate de animal, ferroviario, concurrentes). El modelo ya tiene
      el campo `detalle` (JSON) reservado. **(Alta — es el diferencial del módulo)**
- [ ] Wizard por pasos en móvil (hoy es un formulario largo). **(Media)**
- [ ] Logo del cuartel embebido en el PDF y layout más fiel al oficial. **(Media)**
- [ ] Adjuntar fotos al parte. **(Media)**
- [ ] Reabrir un parte cerrado (con permiso y registro) — el PRD dice que la
      regla de "no editable" podría flexibilizarse. **(Baja)**

### Tareas
- [ ] Editar / eliminar una tarea. **(Media)**
- [ ] Reasignar responsables después de creada (hoy solo se asignan al crear). **(Media)**
- [ ] Tareas recurrentes (planteadas en el PRD como mejora). **(Baja)**
- [ ] Resaltar vencidas / ordenar por fecha límite. **(Baja)**

### Guardias
- [ ] Vista de calendario en grilla (hoy es lista por día). **(Baja)**
- [ ] Validación del descanso de 48 h de cuarteleros (PRD lo dejaba como aviso). **(Baja)**
- [ ] Editar una guardia (hoy solo crear/eliminar). **(Media)**
- [ ] Confirmación antes de eliminar una guardia. **(Media)**

### Cuaderno de novedades
- [ ] La timeline muestra fichadas e intercambios (solo lectura), pero **faltan
      eventos automáticos**: alta de guardia, cierre de partes/salidas, cambios
      de rol/delegación. Definir qué eventos entran. **(Media)**
- [ ] Paginación / "cargar más" (hoy corta a ~80 entradas y últimos 30 días). **(Media)**
- [ ] Editar/eliminar una novedad propia. **(Baja)**

### Personal
- [ ] Flujo de reseteo de contraseña para usuarios. **(Media)**
- [ ] Mensaje claro cuando el email ya existe (hoy error genérico). **(Media)**
- [ ] Editar datos de contacto/legajo/DNI (hoy solo rango/rol/estado). **(Media)**

---

## 3. UX / pulido

- [ ] **Toggle de tema en todas las pantallas** (hoy solo en home y login). Un
      layout/nav compartido lo resolvería. **(Media)**
- [ ] Nav/encabezado compartido (breadcrumb + acceso a home/tema) para no repetir
      el "← Inicio" en cada página. **(Media)**
- [ ] Estados de carga (Suspense/loading.tsx) — las páginas son dinámicas y
      pegan a la DB en cada navegación; hoy se siente lento sin feedback. **(Media)**
- [ ] Confirmaciones en acciones destructivas (eliminar guardia, cerrar parte). **(Media)**
- [ ] Feedback visible cuando una Server Action "silenciosa" no hace nada por
      permisos (hoy varias devuelven sin avisar). **(Baja)**
- [ ] Vaciar el textarea de comentarios/novedades tras enviar (confirmar UX). **(Baja)**
- [ ] Alinear color de acción: hoy botones en rojo junto al logo verde/dorado.
      Decidir si se unifica al verde institucional. **(Baja)**

---

## 4. Deuda técnica / arquitectura

- [ ] **Helper único de formato de fecha/hora** en `lib/dominio.ts` (hoy cada
      página redefine `fecha()`/`hora()`). Resuelve además el bug de TZ. **(Alta)**
- [ ] `app/page.tsx` hace 3 llamadas (`getAuthUser` + `getUsuarioActual` +
      `getContextoAuth`) que consultan el usuario más de una vez. Unificar. **(Media)**
- [ ] `getUser()` de Supabase se llama en el `proxy` y otra vez en cada página:
      doble round-trip por request. Evaluar. **(Media)**
- [ ] Clases de inputs duplicadas entre formularios → extraer a componentes
      `Input`/`Select`/`Textarea` o constantes compartidas. **(Baja)**
- [ ] Recordatorio ya documentado: reiniciar `pnpm dev` tras migrar (singleton
      Prisma). Se podría mitigar, pero es menor. **(Baja)**

---

## 5. Seguridad

- [ ] **RLS (Row Level Security) en Supabase como defensa en profundidad.** Hoy
      toda la autorización vive en el código de servidor (Server Actions con
      `getContextoAuth` + `lib/permisos`) y Prisma usa el rol `postgres`. Está
      bien, pero activar RLS agrega una segunda barrera. **(Media)**
- [ ] Rate limiting en login y en creación de recursos. **(Baja)**
- [ ] Revisar tamaño/tipo de imágenes subidas (evidencia) y compresión. **(Baja)**
- [ ] Rotar/expirar contraseñas iniciales creadas por el encargado. **(Baja)**

---

## 6. Calidad / testing

- [ ] **No hay tests.** Priorizar tests unitarios de `lib/permisos.ts` (la matriz
      de permisos es lógica pura y crítica). **(Alta)**
- [ ] Tests de las Server Actions clave (transiciones de tareas, cierre de parte,
      ceder guardia, fichado). **(Media)**
- [ ] CI (GitHub Actions): `tsc --noEmit` + `pnpm build` + tests en cada PR. **(Media)**

---

## 7. Mobile / futuro

- [ ] **PWA** (manifest + service worker) para "instalar" la web en el celular —
      alineado con el objetivo de una eventual app. **(Media)**
- [ ] Notificaciones (nueva tarea, guardia próxima, aprobación pendiente):
      empezar por email; push más adelante. **(Media)**
- [ ] Fichado con PIN/QR en dispositivo fijo del cuartel y/o geolocalización
      (estaba planteado para la app). **(Baja)**
- [ ] Cuarteleros como usuarios al extender a todo Lomas (multi-destacamento). **(Baja)**

---

## Sugerencia de orden

1. **Bug de zona horaria + helper de fechas** (Alta, rápido, ya es visible en prod).
2. **Tests de `lib/permisos.ts`** (Alta, blinda la lógica crítica).
3. **Parte v2 — secciones condicionales** (Alta, es el módulo estrella).
4. Layout/nav compartido + toggle de tema global (Media, mejora todo de una).
5. El resto según necesidad real de uso en Llavallol.
