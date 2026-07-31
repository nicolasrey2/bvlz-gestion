# Backlog — BVLZ Gestión de Destacamento

Estado: MVP (Fases 0–3) implementado y deployado en Vercel. Este documento
recoge lo pendiente, mejoras, pulido y deuda técnica. Prioridad: **Alta** (hacer
pronto), **Media** (siguiente iteración), **Baja** (cuando se pueda).

> **Batch multi-agente completado** (orquestado, revisado e integrado; 84 tests
> verdes + build + smoke de rutas OK):
> - Tareas: editar / eliminar / reasignar responsables / resaltar vencidas.
> - Guardias: editar guardia + confirmación al eliminar.
> - Novedades: editar/eliminar propia + paginación + eventos automáticos (alta de
>   guardia, cierre de parte).
> - Personal: editar contacto, mensaje de email duplicado, reseteo de contraseña
>   (por link de activación).
> - Fichado: evita doble fichada consecutiva (con feedback).
> - UX: toggle de tema global en todas las pantallas; confirmación en borrados.
> - Calidad: tests de `partesDetalle` y `activacion`; `pnpm build` sumado al CI.
>
> **2º batch (UX + calidad):** feedback al interactuar (BotonAccion con spinner +
> `loading.tsx` en todas las secciones), PWA instalable (manifest), sección
> "concurrentes" + logo en el PDF del parte, auth de la home más liviana, y 47
> tests de Server Actions (→ **127 tests**). Smoke de rutas + manifest OK.
>
> **Pendiente = ops (tu mano) + futuro:** Paso 6 Supabase, DB de prod separada,
> región/latencia, RLS y rate-limiting (dashboard/infra); notificaciones, fichado
> por PIN/QR, cuarteleros como usuarios, service worker offline (PWA); y menores:
> wizard del parte, adjuntar fotos al parte, calendario en grilla, reabrir parte
> cerrado, unificar el doble getUser (proxy+página), padding cosmético de hora.

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

- [x] **Zona horaria (Alta).** ~~Las fechas/horas se formateaban sin
      `timeZone`~~ → Resuelto: helper único `lib/fechas.ts` (con
      `America/Argentina/Buenos_Aires`, 24 h) usado en todas las páginas.
- [x] **Límites de día en UTC (Alta).** ~~El "hoy" del fichado y el agrupado de
      guardias se calculaban en UTC~~ → Resuelto: `hoyArgentina()` +
      `rangoDiaAR` (instantes) / `rangoDiaUTC`/`rangoMesUTC` (fechas "día"); las
      guardias se guardan como medianoche UTC (date-only consistente).
- [ ] Fichado: no valida duplicados ni coherencia (se puede fichar "entrada"
      dos veces seguidas). Definir reglas mínimas. **(Media)**
- [ ] Cosmético: `fmtFechaHora` (día+mes sin año) no rellena con cero en algunas
      versiones de ICU (muestra `23/7` en vez de `23/07`). Forzar padding si
      molesta. **(Baja)**

---

## 2. Funcionalidad incompleta (por módulo)

### Partes de intervención
- [x] **v2: secciones condicionales** del formulario oficial según tipo de
      siniestro (vehículos, inmueble, análisis de incendio, víctimas, víctimas
      fatales, rescate de animal, ferroviario) → Resuelto en `lib/partesDetalle.ts`
      + formulario/detalle/PDF. Falta aún la sección "concurrentes". **(parcial)**
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

- [x] **Helper único de formato de fecha/hora** → `lib/fechas.ts` (reemplaza los
      `fecha()`/`hora()` locales de cada página).
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

- [x] ~~No hay tests~~ → `lib/permisos.test.ts` + `lib/fechas.test.ts` (60 tests,
      Vitest). Cubren la matriz de permisos y el formateo/rangos de fechas.
- [ ] Tests de las Server Actions clave (transiciones de tareas, cierre de parte,
      ceder guardia, fichado). **(Media)**
- [x] ~~CI~~ → `.github/workflows/ci.yml`: `tsc --noEmit` + `pnpm test` en cada
      push/PR a main. (Sumar `pnpm build` al CI queda pendiente. **Media**)

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

---
---

# Análisis 2026-07-24 — Catálogo con IDs estables

Relevamiento completo de la app (typecheck limpio + 152 tests verdes al momento
del análisis). Estos ítems tienen **ID estable** para referenciarlos en ramas,
commits y PRs (ej. `feat/S1-baja-logica`). No reusar un ID aunque se cierre.

Severidad: 🔴 alta · 🟡 media · 🟢 baja. Estado: `pendiente` · `en curso` · `hecho`.

> Los 7 primeros ítems a atacar y su **plan de paralelización** están en
> [`PLAN-ARRANQUE.md`](./PLAN-ARRANQUE.md).

## A. Pendientes vs. PRD

### P1 — Delegación de mando ("encargado en funciones") 🔴 · pendiente
PRD §3.5, §4.6, TECH §4. No existe modelo, acción ni auditoría. `esConduccion()`
(`lib/permisos.ts:22`) le da al sub-encargado **permanentemente** los permisos del
encargado; falta el flag temporal con vigencia registrado en el cuaderno.
- **Archivos:** `prisma/schema.prisma` (modelo `Delegacion`), `lib/permisos.ts`,
  `lib/auth.ts`, `server/`, UI de conducción.
- **Aceptación:** activar/desactivar "encargado en funciones" con vigencia; queda en
  la timeline; el contexto de permisos lo refleja mientras esté vigente.

### P2 — Recuperación de contraseña self-service 🔴 · pendiente
PRD §4.1. El login no tiene "olvidé mi contraseña"; solo hay `resetearPassword`
(`server/activacion.ts:114`) que dispara la conducción. Supabase Auth trae reset por
email.
- **Archivos:** `app/login/*`, `lib/supabase/*`, plantilla de email en Supabase.
- **Aceptación:** un usuario pide reset por email y define clave nueva sin la conducción.

### P3 — Fotos en Novedades y Partes 🟡 · pendiente
PRD §4.6 y §4.7. Solo existe `TareaAdjunto`; `Novedad` y `ParteIntervencion` no tienen
adjuntos.
- **Archivos:** `prisma/schema.prisma` (`NovedadAdjunto`, `ParteAdjunto`), migración,
  `server/novedades.ts`, `server/partes.ts`, `app/novedades/page.tsx`,
  `app/partes/[id]/page.tsx`, componentes de subida, `scripts/setup-storage.ts`.
- **Aceptación:** adjuntar/ver fotos (URL firmada, bucket privado) en novedades y en
  partes abiertos; el cerrado no admite subir.

### P4 — Filtro de novedades por tipo 🟡 · pendiente
PRD §4.6 ("filtros por fecha **y tipo**"). Hoy solo filtra por ventana de días.
- **Archivos:** `app/novedades/page.tsx`.
- **Aceptación:** filtrar la timeline por tipo (incluye orígenes automáticos); combina
  con el filtro de días; mobile-first.

### P5 — Catálogo de cuarteleros 🟢 · pendiente
PRD §4.4 / §6. Hoy el nombre del cuartelero se tipea a mano en cada guardia
(`server/guardias.ts`).
- **Archivos:** `prisma/schema.prisma` (`CuarteleroExterno` + FK opcional en `Guardia`),
  migración, `server/guardias.ts`, `app/guardias/nueva` y `editar`, ABM del catálogo.
- **Aceptación:** al armar guardia de cuartelero se elige de un catálogo (con alta
  rápida); las guardias viejas con nombre libre siguen funcionando.

### P6 — Completar el parte oficial (v2) 🟡 · hecho *(2026-07-30)*
> **Resuelto.** Las dos simplificaciones de la v1 quedaron estructuradas:
> - **Personal** (`lib/partePersonal.ts`, nuevo): `PersonaParte` con nombre, `movil`
>   (columna Ch.), `guardia` (G) y `bp` (BP), separado en las dos tablas del
>   formulario — `concurrio` y `enCuartel`. Se llenan las 36 + 21 casillas.
> - **Concurrentes**: cada organismo pasó de un texto libre a una fila con las 4
>   columnas del formulario (N°, a cargo, matrícula/legajo/DNI, observaciones).
>
> **Sin migración.** Ambos campos viven en columnas `Json`, así que los partes ya
> cargados se traducen **al leer** (`leerPersonal`, `leerDetalle`): el array de
> strings viejo pasa a `concurrio`, y el texto suelto de cada organismo pasa a
> `observaciones`, que es la columna donde iba a parar igual. Hay tests de los dos
> caminos.
>
> **Snapshot, no referencia:** de cada persona se guarda el texto resuelto
> ("Sargento Herrero") además del `usuarioId` opcional. El parte se archiva; si la
> persona asciende el mes que viene, el parte de hoy tiene que seguir mostrando el
> rango que tenía hoy.
>
> **Selección de personal con dualidad** (`components/SelectorPersonal.tsx`): un
> único input con `<datalist>` que sugiere al personal activo del destacamento pero
> acepta cualquier texto. No hay que elegir "modo": los cuarteleros —que todavía no
> son usuarios— se cargan a mano, y cuando se registren van a aparecer solos en las
> sugerencias sin tocar el código. Mismo criterio que el par
> `Guardia.cuarteleroNombre` / `cuarteleroId`.
> La lista viaja al servidor como **un solo campo oculto con JSON** (no arrays
> paralelos, que se desalinean cuando un casillero queda vacío o un checkbox no se
> envía) y se valida con zod: no se confía en la forma que mande el cliente.
> Si se carga más gente que casilleros, la UI lo avisa en vez de recortar callada.

### P7 — Cambiar el email de un usuario 🟡 · hecho *(2026-07-30)*
> Resuelto: acción `cambiarEmail` en `server/personal.ts` + `components/CambiarEmail.tsx`,
> montado en la ficha del usuario como sección "Email de acceso". Actualiza **Supabase
> Auth y la tabla**, en ese orden, y revierte Auth si falla el guardado para no dejar
> los dos lados desincronizados. **La contraseña no se toca** y la cuenta no vuelve a
> "pendiente". Pendiente menor: no se registra en el cuaderno de novedades — ninguna
> acción de conducción lo hace hoy (`cambiarRango`, `cambiarEstadoUsuario` tampoco) y
> `TipoNovedad` no tiene un valor adecuado; si se quiere, va como ítem propio.

Texto original del relevamiento:
Hoy la conducción puede cambiar rango, rol, estado y contacto, y resetear la
contraseña (`server/personal.ts`, `server/activacion.ts:114`), pero **el email no
se puede editar**. Los usuarios se dieron de alta con emails random de relleno y
hay que reemplazarlos por los reales. El email es a la vez identificador de login
(Supabase Auth) y campo `@unique` en `Usuario`, así que el cambio es en **dos
lados**: Prisma y Supabase Auth (`admin.updateUserById`).
- **Archivos:** `server/personal.ts` (acción `cambiarEmail`), `lib/supabase/admin.ts`,
  `app/personal/[id]/**`, componente análogo al de reseteo de contraseña.
- **Aceptación:** la conducción cambia el email de un usuario; queda normalizado
  (minúsculas + `.email()`, ver **S4**); si ya existe da error claro; el usuario
  puede loguearse con el email nuevo; el viejo deja de servir; queda registrado en
  el cuaderno de novedades. Con test.
- **Depende de:** S4 (normalización) — conviene hacerlos juntos, tocan el mismo archivo.
- **Ojo:** decidir si el cambio re-dispara el link de activación o si la contraseña
  actual se mantiene (recomendado: mantener contraseña, no invalidar la sesión).

### P8 — Exportar el parte rellenando el PDF oficial 🟡 · hecho *(2026-07-30)*
> **Resuelto.** `lib/parteAcroForm.ts` mapea el dominio a los campos del AcroForm y
> `app/partes/[id]/pdf/route.tsx` abre la plantilla, la limpia, la completa y la
> devuelve. Se eliminó `pdf/parte.tsx` (el PDF dibujado a mano con
> `@react-pdf/renderer`) y la dependencia, que quedaron sin uso.
>
> Decisiones que conviene recordar:
> - **La plantilla oficial viene con un parte de ejemplo cargado** (servicio 0424,
>   "Sargento Herrero"). `limpiarFormulario()` la vacía antes de completar; sin eso
>   cada PDF saldría con datos ajenos en los campos que no llenamos. Hay un test que
>   falla si esto se rompe.
> - **Sólo se aplana (`flatten`) el parte CERRADO.** El abierto sale con los campos
>   vivos, así en el cuartel pueden completar a mano lo que el sistema todavía no
>   carga (ver lista abajo) antes de cerrarlo.
> - **Listas desplegables:** se matchea contra la opción oficial ignorando
>   mayúsculas/acentos; si el texto libre no está en la lista, se agrega y se
>   selecciona igual — preferimos mostrar lo cargado antes que perderlo en silencio.
> - **Los nombres de campo se toman literales, con erratas** (`Conuctor/a`,
>   `Descriprción de las tareas`, `Dotac`): son el identificador real del PDF.
> - `llenarFormularioParte()` devuelve `camposFaltantes`, y un test contra la
>   plantilla real falla si el DTO 3 le cambia un nombre. La ruta además lo loguea.
> - La plantilla se incluye en el deploy vía `outputFileTracingIncludes`
>   (`next.config.ts`): Next no puede inferir la lectura por filesystem.
> - Herramientas: `pnpm pdf:campos` (vuelca los nombres de la plantilla) y
>   `pnpm pdf:muestra` (genera un PDF de prueba para revisar a ojo).
>
> **Qué NO se llena todavía** — el formulario tiene campos que el dominio no modela.
> Es la especificación concreta de **P6**:
> - Encabezado: `RUBA nº`, `Certific.`, `Informe nº`, `Jurisdicc. polic.`,
>   `P. efectuado`, `Ubicación` (link a Google Maps), `Panorama`.
> - Tiempos: `Hora circunscripto`, `dominado`, `extinguido`, `finalización`
>   (el dominio sólo tiene aviso / llegada / regreso).
> - Concurrentes: sólo se llena la columna **Observaciones**; faltan `Nº`,
>   `A cargo` y `Matr./Leg./DNI` (el dominio guarda un texto libre por organismo).
> - Vehículos: `Nº y origen del registro`, `Otros datos`, `Rodado tipo` (lista).
> - Inmueble: `Nº de piso`. Datos complementarios: `Arrendatario/a` y su DNI.
> - Personal: sólo la columna **Jerarquía y apellido**. Faltan `Ch.` (nº de móvil),
>   `G` y `BP`, y toda la tabla **PERSONAL EN EL CUARTEL** (21 casilleros).
>   `marcarPersonal()` ya está escrito y probado esperando a P6.
> - Firma `Dpto. Técnico`.

Texto original del relevamiento:
Hoy `/partes/[id]/pdf` **dibuja un PDF propio** con `@react-pdf/renderer`
(`pdf/parte.tsx`, 395 líneas) que imita el formulario. El objetivo es **rellenar el
PDF oficial** `docs/parte-intervencion-DTO3.pdf` para que la salida sea idéntica al
formulario en papel del DTO 3.
- **Viabilidad: alta.** El PDF oficial es un **AcroForm real** (2 páginas, 612×1008 pt)
  con **424 campos**: 227 texto (`/Tx`), 114 botones (`/Btn`, checks/radios) y
  10 listas (`/Ch`). Los nombres son legibles y mapean casi 1:1 al dominio ya
  modelado en `lib/partesDetalle.ts` (`Servicio nº`, `Hora recepción`, `Hora
  llegada`, `Hora regreso`, `Oficial actuante`, `Dirección`, `Localidad`, `Objeto`,
  `Panorama`, `Origen`, `Causa`, `Propagación`, `Condiciones climáticas`,
  `Paredes de`, `Techos de`, `Cantidad de pisos`, `Nombre víctima 1`,
  `Chapa vehículo 1`, `Nº de tren`, `Datos tomados por`, `Firma Jefe del Cuerpo`…).
  No hay que maquetar nada: se abre el PDF, se setean los campos y se serializa.
- **Cómo:** `pdf-lib` (`getForm().getTextField(nombre).setText(...)`,
  `getCheckBox(...).check()`) sobre el PDF plantilla. **No sirve `@react-pdf/renderer`**
  para esto: genera documentos nuevos, no rellena existentes. Conviven sin problema:
  se puede dejar la ruta actual y sumar la nueva.
- **Archivos:** nueva dependencia `pdf-lib`; plantilla movida a `public/` o leída del
  filesystem del server; `app/partes/[id]/pdf/route.tsx`, `lib/partesDetalle.ts`
  (mapa dominio → nombre de campo del AcroForm).
- **Trabajo real:** el grueso es el **mapa de nombres**, no la mecánica. Los campos de
  las tablas repetidas (personal, vehículos, víctimas, concurrentes) usan nombres
  numéricos (`0`…`11`, `1`…`5`) dentro de árboles jerárquicos → hay que volcar los
  **nombres completamente calificados** una vez (script de un solo uso con
  `form.getFields().map(f => f.getName())`) y fijarlos en una constante.
- **Aceptación:** descargar el parte devuelve el PDF oficial relleno, con las
  secciones del tipo de siniestro completas; los campos que no aplican quedan vacíos;
  el PDF se puede aplanar (`form.flatten()`) para que no sea editable.
- **Riesgos / decisiones:**
  - El PDF trae **JavaScript embebido** (cálculos del Excel original). Si molesta al
    rellenar, aplanar resuelve.
  - Firmas y logo: hoy el PDF propio embebe el logo institucional; en el oficial los
    campos `Firma …` son de texto → va el nombre, no una imagen.
  - Los campos con nombre raro (`Dotac` / `/as`, `Descriprción de las tareas` con la
    errata) hay que tomarlos **literales**, no "corregidos".
  - Si el DTO 3 cambia el formulario, hay que revisar el mapa. Vale un test que falle
    si un nombre esperado ya no existe en la plantilla.
- **Relación:** cierra el módulo Partes junto con **P6** (concurrentes/personal
  estructurados) y **P3** (fotos). P6 conviene **antes**: el PDF oficial pide
  jerarquía/chapa/G/BP por separado, que es justo lo que P6 estructura.

### P9 — Campos del formulario oficial que el dominio no tiene 🟢 · pendiente *(alta 2026-07-30)*
Lo último que queda para que el PDF oficial salga completo. Con **P8** y **P6** hechos,
estos son los casilleros que siguen en blanco porque el dato no existe en el modelo.
Es trabajo mecánico: agregar el campo, el input y una línea en `lib/parteAcroForm.ts`.
- **Encabezado** (columnas nuevas en `ParteIntervencion`, 1 migración): `RUBA nº`,
  `Certific.`, `Informe nº`, `Jurisdicc. polic.` (lista de 11 opciones),
  `P. efectuado`, `Ubicación` (link a Google Maps), `Panorama` (lista N/A|1..4).
- **Tiempos:** `Hora circunscripto`, `dominado`, `extinguido`, `finalización` — hoy
  sólo hay aviso / llegada / regreso.
- **Vehículos** (en `detalle`): `Nº y origen del registro`, `Otros datos`,
  `Rodado tipo` (lista de 22 opciones).
- **Inmueble:** `Nº de piso`. **Datos complementarios:** `Arrendatario/a` y su DNI.
- **Firmas:** `Dpto. Técnico`.
- La tabla de concurrentes tiene una **sexta fila "Otros"** que el dominio no usa
  (`ORGANISMOS_CONCURRENTES` define 5); queda libre para completar a mano.
- **Aceptación:** un parte completo llena el formulario oficial sin casilleros
  vacíos por falta de campo.

## B. Smells / mejoras técnicas

### S1 — La baja lógica no corta el acceso 🔴 · hecho *(2026-07-30)*
~~`getUsuarioActual()` y el proxy no filtran `activo`.~~ → Resuelto en `lib/auth.ts`:
`getUsuarioActual()` devuelve `null` si `activo = false`, así que no se arma
`ContextoAuth` y quedan cubiertas todas las páginas y Server Actions de una sola vez.
Se sumó `getUsuarioVinculado()` (sin filtrar) solo para que la home distinga
"no vinculado" de "dado de baja" y muestre el mensaje correcto.
- **No se tocó el proxy**: no tiene acceso a Prisma. El corte en la capa de auth
  alcanza; el usuario desactivado que entra por otra ruta cae en `/login` y, al
  reingresar, la home le explica que su cuenta está desactivada.

### S2 — Acciones que fallan en silencio 🟡 · pendiente
`eliminarTarea`, `aprobarTarea`, `rechazarTarea`, `reasignarTarea`, `cederGuardia`,
`editarParte`, `cerrarParte`, `eliminarNovedad` hacen `return;` mudo. Inconsistente
con las acciones que usan `useActionState`.
- **Archivos:** transversal — `server/*.ts` + componentes de acción.
- **Aceptación:** toda acción de escritura da feedback (error/éxito) con convención
  única (ver `PLAN-ARRANQUE.md` §Fase 0).

### S3 — Validación de `activo` no re-chequeada en el servidor 🟡 · pendiente
`crearTarea` (`server/tareas.ts:80`), `crearGuardia`/`editarGuardia` validan
destacamento pero no `activo`.
- **Archivos:** `server/tareas.ts`, `server/guardias.ts`.
- **Aceptación:** asignados/participantes deben ser `activo=true`; con test.

### S4 — Email sin normalizar ni validar como email 🟡 · hecho *(2026-07-30)*
~~`esquema.email` era `z.string().trim().min(3)`: sin formato ni minúsculas.~~ →
Resuelto con `lib/email.ts` (`normalizarEmail` + `campoEmail`, que normaliza y recién
después valida con `z.email()`). Lo usan `crearUsuario`, `cambiarEmail` (**P7**) y el
login. Se sumó `emailOcupado()` con `mode: "insensitive"` porque la unicidad de
Postgres distingue mayúsculas y quedan registros viejos sin normalizar; cambiar el
email de uno de esos lo deja normalizado de paso.

### S5 — Carreras sin constraint de respaldo 🟢 · pendiente
Doble fichada (`server/fichado.ts:41`) y roles singleton (`server/personal.ts:237`) se
controlan en app-level sin constraint DB.

### S6 — Listados sin paginación 🟢 · pendiente
`tareas`, `partes`, `guardias` traen todo (solo `novedades` limita).

### S8 — `editarParte` existe pero no hay UI que lo llame 🟡 · pendiente *(alta 2026-07-30)*
`server/partes.ts:153` define `editarParte` con permisos y todo, pero **ningún
componente la usa** (verificado con grep en todo el repo). En la práctica **un parte
no se puede editar**: se crea y se cierra. No hay página `/partes/[id]/editar` ni
`FormEditarParte`, a diferencia de tareas y guardias, que sí tienen su form de edición.
- **Impacto real:** el PRD plantea el parte como algo que se completa en varias
  pasadas; hoy hay que hacerlo de una. Se nota más desde **P6**, que agregó campos.
- **Opciones:** construir el form de edición (reutilizando `FormNuevoParte` con
  valores iniciales, que ya está preparado — `SelectorPersonal` acepta `inicial`), o
  borrar la acción muerta. Lo primero es lo que pide el PRD.

### S7 — Ruido de "alta de guardia" en el cuaderno 🟢 · pendiente
Cargar el cronograma mensual inunda la timeline con "Alta de guardia"
(`app/novedades/page.tsx:55`).

## C. Features nuevas

| ID | Feature | Esfuerzo |
|----|---------|----------|
| F1 | PWA instalable + push (nueva tarea, guardia próxima, aprobación) | Medio |
| F2 | Widget en home: próxima guardia, pendientes propios, en servicio | Bajo |
| F3 | Recordatorio de guardia (día antes) — depende de F1 | Bajo-Medio |
| F4 | Tareas recurrentes (PRD §4.3) | Medio |
| F5 | Export de novedades / reporte mensual a PDF | Bajo |
| F6 | Vencimientos y alertas (matafuegos, VTV de móviles, equipos) | Medio |
| F7 | Historial de rotaciones visible (dato ya en `AsignacionRol`) | Bajo |
| F8 | Firma del parte según rango (PRD §3.5) | Medio |
| F9 | Inventario de materiales por área ligado a novedades | Medio |
| F10 | Modo offline para fichar/cargar novedad sin señal | Alto |
| F11 | **Alerta de intervención** (push + sonido/vibración + respuesta "voy / no voy") | Alto |

### F11 — Alerta de intervención 🔴 · pendiente *(alta 2026-07-30)*
Al entrar una intervención, disparar una **alerta a todos los bomberos del
destacamento**: el celular **suena y vibra** aunque la app esté cerrada, y cada uno
responde **"voy" / "no voy"**. La conducción ve en vivo quién viene.
- **Por qué es Alto:** es el ítem más ambicioso del backlog. No alcanza con la PWA
  instalable que ya existe (**F1** parcial: hay manifest, **no hay service worker**).
  Requiere **Web Push** end-to-end.
- **Piezas:**
  1. **Service worker** con handler `push` + `notificationclick` (hoy no existe).
  2. **Suscripción push** por dispositivo: claves **VAPID**, `PushManager.subscribe`,
     modelo nuevo `SuscripcionPush` (endpoint, keys, usuarioId, userAgent) — un
     usuario puede tener varios dispositivos.
  3. **Modelo `AlertaIntervencion`** + `RespuestaAlerta` (usuarioId, `VOY`/`NO_VOY`,
     timestamp). Ligable a `ParteIntervencion` cuando después se cargue el parte.
  4. **Envío** con `web-push` desde una Server Action / Route Handler, en paralelo a
     todos los suscriptos activos del destacamento; limpiar suscripciones caídas
     (410/404).
  5. **Acciones en la notificación** (`actions: [voy, no_voy]`) para responder **sin
     abrir la app**; más pantalla de alerta con el conteo en vivo.
  6. **Permisos:** quién puede disparar una alerta (conducción + guardia del día).
- **Aceptación:** la conducción dispara la alerta; los celulares suscriptos suenan y
  vibran; responder desde la notificación registra "voy/no voy"; hay una vista con
  quién viene; la alerta queda en el cuaderno de novedades.
- **Limitaciones reales a decidir antes de empezar (importante):**
  - **iOS/Safari:** Web Push **solo funciona si la PWA está instalada** en la pantalla
    de inicio (iOS 16.4+). En el navegador normal **no llega**. Hay que instruir a la
    gente a instalarla.
  - **Sonido:** la web **no puede elegir el tono** ni saltear el modo silencioso.
    Suena el tono de notificación del sistema. Un "sonido de cuartel" fuerte y
    garantizado **exige app nativa** — anotarlo como límite conocido.
  - `requireInteraction` y `vibrate` andan en Android/Chrome; en iOS son ignorados.
  - Los navegadores desuscriben solos si la app no se usa por mucho tiempo → hace
    falta **re-suscribir al abrir** y un chequeo de salud de suscripciones.
- **Sugerencia de encare:** partirlo en dos. **F11a** = service worker + suscripción +
  push simple ("hay una intervención", abre la app) — ya es útil y desbloquea **F1/F3**.
  **F11b** = respuesta voy/no voy desde la notificación + tablero en vivo.
- **Archivos:** `prisma/schema.prisma` (3 modelos), `public/sw.js`, `lib/push.ts`,
  `server/alertas.ts`, `app/alertas/**`, registro del SW en el layout, env vars VAPID.
