# Plan de arranque — primer batch (paralelo)

Objetivo: atacar en paralelo los 7 ítems priorizados, con **tracks que no pisan
los mismos archivos** para poder trabajar sin bloquearse. Referencia de cada ítem:
[`BACKLOG.md` §Análisis 2026-07-24](./BACKLOG.md#análisis-2026-07-24--catálogo-con-ids-estables).

> **Fase 0 — CERRADA el 2026-07-30.** Quedó varada unos días en
> `feat/batch-1-hardening` (commit `dd87375`) con el código listo pero sin aplicar.
> Ya está todo hecho:
> - Migración `20260725022138_batch1_adjuntos_cuarteleros` **aplicada** con
>   `pnpm db:deploy`. Se usó `migrate deploy` y **no** `migrate dev` a propósito:
>   dev y prod comparten el Supabase (ver `BACKLOG.md §0`) y `migrate dev` puede
>   ofrecer resetear la base ante drift. La migración es puramente aditiva.
> - Buckets `novedades` y `partes` **creados** (privados) con `pnpm setup:storage`.
> - Verificado: typecheck limpio, 152 tests verdes, `pnpm build` OK.
>
> **Los tracks A–E ya se pueden abrir en paralelo.** Ninguno arrancó todavía.

Ítems del batch:

| ID | Título | Severidad |
|----|--------|-----------|
| S1 | La baja lógica no corta el acceso | 🔴 |
| S2 | Acciones que fallan en silencio | 🟡 |
| S3 | Validación de `activo` no re-chequeada en el servidor | 🟡 |
| S4 | Email sin normalizar ni validar | 🟡 |
| P3 | Fotos en Novedades y Partes | 🟡 |
| P4 | Filtro de novedades por tipo | 🟡 |
| P5 | Catálogo de cuarteleros | 🟢 |

---

## Estrategia de paralelización

**S2 (feedback) NO es un track propio:** tocaría casi todos los `server/*.ts` y
chocaría con todos. En su lugar, **cada track arregla el feedback de las acciones
de su propio módulo**, usando una convención única acordada en la Fase 0.

Cada track = una rama (`feat/<ID>-<slug>`) o worktree, dueña exclusiva de un set de
archivos. La tabla de "archivos que posee" es el contrato para no colisionar.

### Fase 0 — Base compartida (bloqueante, corta, va directo a `main`)

Antes de fanear. Son cambios que todos los tracks consumen. **Una sola persona** los
hace y mergea a `main`:

1. **Infra de feedback mixto (contrato de S2).** *(decisión tomada: errores inline
   + toast de éxito)*
   - Errores: las acciones `<form action={fn}>` mudas pasan al patrón `useActionState`
     ya usado en el repo (`{ error: string } | { ok: true } | null`), mostrando el
     error **inline** al lado del botón (extender `BotonAccion` o un `<FormAccion>`).
   - Éxitos: montar un **toast global** (provider en `app/layout.tsx` + hook
     `useToast` / helper) para confirmaciones efímeras ("Tarea aprobada", "Guardia
     eliminada"). Se documenta el patrón acá y **todos los tracks lo usan igual**.
2. **Migración combinada de los 3 modelos nuevos.** *(decisión tomada: up-front)*
   Agregar al `schema.prisma`, en una sola pasada, los modelos:
   - `CuarteleroExterno` (nombre, destacamentoId) + FK opcional `cuarteleroId` en `Guardia`.
   - `ParteAdjunto` (path, subidoPorId, parteId).
   - `NovedadAdjunto` (path, subidoPorId, novedadId).
   Generar **una** migración (`pnpm db:migrate`) y mergear. Tras esto, los tracks
   C/D/E **no tocan el schema ni generan migraciones** — solo escriben código contra
   modelos que ya existen. Elimina el riesgo de migraciones en paralelo.
3. **Buckets de storage:** agregar `novedades` y `partes` (privados) en
   `scripts/setup-storage.ts` y correr `pnpm setup:storage` una vez.

### Tracks paralelos

Con Fase 0 hecha, **ningún track toca `schema.prisma` ni `scripts/setup-storage.ts`**.

| Track | Ítems | Archivos que **posee** (edita) | No toca |
|-------|-------|-------------------------------|---------|
| **A — Acceso & Personal** | S1, S4, S2(personal) | `lib/auth.ts`, `lib/supabase/middleware.ts`, `server/personal.ts`, `app/personal/**`, `components/Form*Usuario/Contacto`, `components/*Password/*Rol/*Activacion` | `server/{tareas,guardias,partes,novedades}.ts` |
| **B — Tareas** | S3(tareas), S2(tareas) | `server/tareas.ts`, `app/tareas/**`, `components/*Tarea*`, `components/ReasignarTarea.tsx`, `components/FormEvidencia.tsx` | otros `server/*` |
| **C — Guardias & Cuarteleros** | P5, S3(guardias), S2(guardias) | `server/guardias.ts`, `app/guardias/**`, `components/*Guardia*`, `components/CederGuardia.tsx` (usa `CuarteleroExterno` ya migrado) | schema, otros `server/*` |
| **D — Partes (fotos)** | P3(partes), S2(partes) | `server/partes.ts`, `app/partes/**`, `components/FormNuevoParte.tsx` (usa `ParteAdjunto` ya migrado) | schema, otros `server/*` |
| **E — Novedades (fotos + filtro)** | P3(novedades), P4, S2(novedades) | `server/novedades.ts`, `app/novedades/page.tsx`, `components/FormNuevaNovedad.tsx`, `components/AccionesNovedad.tsx` (usa `NovedadAdjunto` ya migrado) | schema, otros `server/*` |

---

## Puntos de coordinación (leer antes de arrancar)

- **Migraciones:** resueltas en Fase 0 (migración combinada). Ningún track paralelo
  corre `prisma migrate` → sin riesgo de pisar la DB compartida dev/prod
  (ver `BACKLOG.md §0`).
- **Infra de toast:** vive en Fase 0. Los tracks solo la consumen (`useToast`), no la
  modifican.
- **`lib/dominio.ts`** puede recibir labels nuevos (filtro de novedades en E, catálogo
  de cuartelero en C). Agregar al final de la sección correspondiente; son adiciones,
  bajo riesgo de conflicto.

---

## Orden y asignación sugeridos

1. **Fase 0** → `main` (rápido).
2. En paralelo, priorizando por severidad:
   - **A** primero/rápido: S1 es el único 🔴 del batch (agujero de acceso real).
   - **B, C, D, E** en paralelo.
3. Merge a `main` en cualquier orden; C/D/E coordinan solo el momento de generar la
   migración (o usan DB de dev separada — ver decisión).

- **2 personas:** persona 1 → A + B (backend puro, sin schema); persona 2 → C + D + E
  (los de schema/storage, así una sola cabeza ordena las migraciones).
- **Solo + agentes:** un worktree por track; A/B pueden ir juntos.

---

## Checklist por track

### Track A — Acceso & Personal (`feat/S1-S4-acceso`)
- [ ] **S1:** `getUsuarioActual()` devuelve null si `activo=false`; la home/proxy
      redirige a `/login` (mensaje "cuenta desactivada").
- [ ] **S4:** email con `.email()` + `.toLowerCase()` en `crearUsuario` (y login por
      consistencia); manejar unicidad case-insensitive.
- [ ] **S2:** feedback en `cambiarRango`, `cambiarEstadoUsuario`, `finalizarRol`,
      `asignarRol`.
- [ ] Tests: acceso con usuario inactivo; normalización de email.

### Track B — Tareas (`feat/S3-S2-tareas`)
- [ ] **S3:** `crearTarea` y `reasignarTarea` solo aceptan asignados `activo=true`.
- [ ] **S2:** feedback en `eliminarTarea`, `aprobarTarea`, `rechazarTarea`,
      `reasignarTarea`, `enviarARevision`, `subirEvidencia`, `comentar`.
- [ ] Tests: asignar a inactivo falla; transiciones sin permiso avisan.

### Track C — Guardias & Cuarteleros (`feat/P5-guardias`)
- [ ] **P5:** ABM simple del catálogo `CuarteleroExterno` (conducción); selector con
      alta rápida en el form de guardia. Guardias viejas con `cuarteleroNombre` libre
      siguen andando. *(El modelo ya está migrado — Fase 0.)*
- [ ] **S3:** participantes de guardia interna deben ser `activo=true`.
- [ ] **S2:** feedback en `cederGuardia`, `eliminarGuardia`.
- [ ] Tests: crear guardia con cuartelero del catálogo; participante inactivo falla.

### Track D — Partes (fotos) (`feat/P3-partes`)
- [ ] **P3:** subir fotos a un parte **abierto** (URL firmada al mostrar); el cerrado
      no admite subir. *(El modelo `ParteAdjunto` ya está migrado — Fase 0.)*
- [ ] **S2:** feedback en `editarParte`, `cerrarParte`.
- [ ] Tests: subir a parte cerrado falla; adjunto se lista.

### Track E — Novedades (fotos + filtro) (`feat/P3-P4-novedades`)
- [ ] **P3:** subir/ver fotos en una novedad manual. *(El modelo `NovedadAdjunto` ya
      está migrado — Fase 0.)*
- [ ] **P4:** filtro por tipo en la timeline (incluye orígenes automáticos), combina
      con el filtro de días.
- [ ] **S2:** feedback en `eliminarNovedad`.
- [ ] Tests: filtro por tipo; adjunto en novedad.

---

## Decisiones tomadas (2026-07-24)

1. **Patrón de feedback (S2): mixto** — errores inline (`useActionState`) +
   toast global para confirmaciones de éxito. Infra en Fase 0.
2. **Migraciones: combinada up-front** — los 3 modelos nuevos se agregan y migran
   en Fase 0, en una sola migración. Los tracks C/D/E no tocan el schema.
