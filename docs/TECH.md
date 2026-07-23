# Documento Técnico — BVLZ Gestión de Destacamento (MVP)

**Complementa:** `PRD.md`
**Fecha:** 2026-07-23
**Contexto de equipo:** dev profesional + compañero (repo compartido), desarrollo asistido con IA.
**Restricción de costo:** gratis / casi gratis.

---

## 1. Stack recomendado

Todo en **TypeScript** (un solo lenguaje front + back), servicios gestionados con free tier generoso, mínima cantidad de piezas.

| Capa | Elección | Por qué |
|---|---|---|
| Framework full-stack | **Next.js (App Router) + TypeScript** | Front y back en un repo. Server Actions/Route Handlers evitan un backend aparte. Enorme corpus de docs para la IA. Deploy en 1 clic. |
| UI / estilos | **Tailwind CSS + shadcn/ui** | Mobile-first real, componentes accesibles copiables al repo, ideal con IA. Sin dependencias pesadas. |
| Base de datos | **PostgreSQL en Supabase** | Free tier con Postgres real. Preparado para multi-destacamento y relaciones (roles, guardias, partes). |
| Auth | **Supabase Auth** | Login email/contraseña, sin auto-registro (altas admin). Integrado con la DB y con RLS. |
| Almacenamiento de fotos | **Supabase Storage** | Evidencia de tareas, novedades y partes. Mismo proveedor que DB/Auth = menos piezas. |
| ORM / acceso a datos | **Prisma** | Esquema tipado, migraciones, muy documentado para IA. (Alternativa más liviana: Drizzle.) |
| PDF del parte | **HTML + CSS → PDF** (ver sección 5) | Réplica fiel del formulario oficial. |
| Hosting app | **Vercel (Hobby / free)** | Deploy automático desde Git. CI/CD gratis. |
| Repo / CI | **GitHub** | Compartido con tu compañero, Vercel se conecta solo. |

**Resultado:** solo **2 cuentas** (Vercel + Supabase), ambas free, un solo repo, un solo lenguaje.

---

## 2. Arquitectura (alto nivel)

```
[ Celular / navegador ]
        │  HTTPS
        ▼
[ Next.js en Vercel ]
  ├─ UI React (mobile-first, Tailwind + shadcn)
  ├─ Server Actions / Route Handlers  ── lógica y control de permisos por rol
  └─ Prisma Client
        │
        ▼
[ Supabase ]
  ├─ PostgreSQL  (datos)
  ├─ Auth        (sesiones, usuarios)
  └─ Storage     (fotos / adjuntos)
```

- **Control de acceso en el servidor** (Server Actions/Route Handlers), nunca solo en UI.
- Opcionalmente reforzar con **RLS (Row Level Security)** de Postgres como segunda barrera.
- `Destacamento` como entidad raíz desde el día 1 → multi-destacamento sin migración estructural.

---

## 3. Modelo multi-destacamento (clave de diseño)

Aunque el MVP use solo Llavallol, cada tabla operativa lleva `destacamento_id`. Hoy hay una sola fila en `Destacamento`; mañana se agregan más sin refactor. Los queries filtran siempre por el destacamento del usuario (y un futuro rol supra-destacamento de Lomas podría ver todos).

---

## 4. Autenticación y permisos

- **Sin registro abierto:** el encargado/sub-encargado crea usuarios (invitación por email o alta con contraseña temporal).
- **Roles** guardados en la DB (no en el token) para soportar rotaciones y delegación en caliente.
- Middleware/guardas por Server Action que verifican rol + área + destacamento antes de cada operación sensible (crear/asignar tarea, armar guardia, cerrar parte, ver fichados).
- **Delegación** (sub-encargado asume): flag temporal con vigencia, auditado en el cuaderno de novedades.

---

## 5. Generación del PDF del parte (zona de mayor riesgo)

El formulario oficial es largo y **condicional**. Recomendación:

1. **Carga en la app con un wizard por pasos** (mobile-friendly): Identificación → Tiempos/recursos → Descripción → Concurrentes → Secciones condicionales según tipo de siniestro → Personal → Firmas. Así el celular no muestra un formulario gigante de una.
2. **Render del PDF a partir de una plantilla HTML/CSS** que replique el layout oficial (tablas, grillas, tipografía). Enfoques:
   - **`@react-pdf/renderer`** (JS puro, funciona en serverless de Vercel; control fino del layout). **Recomendado** para evitar el peso de un navegador headless.
   - Alternativa: HTML → Puppeteer/`@sparticuz/chromium`. Más fiel visualmente pero pesado en serverless free; usar solo si el layout con react-pdf no alcanza.
3. **Recomendación de producto:** en la primera iteración, plantear una **v1 del parte con los campos más usados** (encabezado, tiempos, descripción, concurrentes, personal, firmas) y sumar las secciones condicionales completas en una segunda pasada. Evita bloquear el MVP en el módulo más caro.

---

## 6. Consideraciones de free tier (a tener en cuenta)

- **Supabase free** pausa el proyecto tras ~1 semana de inactividad total. Para un destacamento con uso semanal no debería pasar; si pasa, se reactiva desde el panel. Un cron/ping simple lo mantiene despierto si hace falta.
- **Vercel Hobby** es para uso **no comercial**; una asociación de bomberos voluntarios sin fines de lucro encuadra, pero conviene confirmarlo. Si crece, el salto a pago es barato.
- Límites de Storage/DB del free tier son holgados para el volumen esperado (un destacamento). Al extender a todo Lomas, recalcular y probablemente pasar a un plan pago chico.

---

## 7. Estructura de repo propuesta

```
/app            → rutas Next.js (login, dashboard, tareas, guardias, partes, novedades, fichado)
/components     → UI (shadcn + propios)
/lib            → auth, permisos, clientes (supabase, prisma)
/server         → Server Actions / lógica de dominio
/prisma         → schema.prisma + migraciones
/pdf            → plantilla y generación del parte
/public         → assets (logo bomberos, etc.)
```

- **`.env`** con claves de Supabase/DB (nunca commitear; usar Vercel/Supabase env vars).
- Convención de commits + PRs para trabajar con tu compañero.

---

## 8. Plan de implementación por fases

**Fase 0 — Cimientos (1er hito)**
- Crear repo, proyecto Next.js + Tailwind + shadcn.
- Crear proyecto Supabase (DB, Auth, Storage).
- Prisma + esquema inicial (Destacamento, Usuario, Rol/Asignación, Área).
- Deploy inicial en Vercel funcionando.

**Fase 1 — Personal y accesos**
- Login + gestión de usuarios, rangos, roles, áreas (con historial de rotación).
- Vista de destacamento / organigrama.
- Matriz de permisos aplicada en servidor.

**Fase 2 — Operación diaria**
- Tareas (flujo Pendiente→En revisión→Completa, evidencia fotográfica, aprobación).
- Guardias (calendario mensual, armado por oficina, intercambios entre pares).
- Fichado (opción A) atado a guardia.

**Fase 3 — Registros**
- Cuaderno de novedades (con eventos automáticos: fichados, cambios de guardia, delegaciones, salidas).
- Parte de intervención (wizard) + export PDF (v1 de campos, luego completo).

**Fase 4 — Validación con Llavallol**
- Pruebas con personal real desde el celular, ajustes de UX, correcciones.

---

## 9. Riesgos técnicos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| PDF del parte fiel al oficial | Alto (es el módulo más caro) | Wizard + `@react-pdf/renderer`; v1 acotada primero. |
| Pausa de Supabase free por inactividad | Medio | Uso semanal real; ping/cron si hace falta. |
| Vercel Hobby uso no comercial | Bajo/Medio | Confirmar encuadre de asociación sin fines de lucro; upgrade barato. |
| Complejidad de permisos con rotación/delegación | Medio | Roles en DB (no en token) + vigencias + auditoría. |
| Fotos y almacenamiento creciendo | Bajo (MVP) | Compresión al subir; recalcular al escalar a Lomas. |

---

*Stack elegido para maximizar productividad con IA, costo casi nulo y un solo lenguaje. Ajustable si aparecen restricciones institucionales (ej. políticas de datos de la Asociación).*
