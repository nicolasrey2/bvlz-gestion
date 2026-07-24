<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Proyecto BVLZ — Gestión de Destacamento

App de gestión para el Destacamento N°3 de Llavallol (Bomberos Vol. de Lomas de Zamora).
Antes de trabajar, leer `docs/PRD.md` (producto) y `docs/TECH.md` (decisiones técnicas).

## Convenciones

- **Idioma:** todo en español (Argentina): UI, mensajes y nombres de dominio.
- **Mobile-first:** priorizar la experiencia en celular en cada pantalla.
- **Permisos en el servidor:** validar rol/área/destacamento en Server Actions/Route
  Handlers, nunca solo en la UI. Matriz de permisos en `docs/PRD.md` §3.5.
- **Multi-destacamento:** toda entidad operativa lleva `destacamentoId`; filtrar siempre
  por el destacamento del usuario.
- **DB:** Prisma 7 con driver adapter (`lib/prisma.ts`). La URL va en `prisma.config.ts`
  (CLI) y en el adapter (runtime), NO en `schema.prisma`.
- **Roles con historial:** los roles rotan; usar `AsignacionRol` con vigencia, no un campo
  fijo en `Usuario`.

## Dominio (resumen)

- **Rango:** enum `Rango` (Aspirante → Jefe del Cuerpo), atributo de la persona.
- **Roles funcionales:** Encargado Interno, Sub-encargado, Encargado de Área, Miembro.
- **Áreas:** Automotores, Materiales de Incendio y Salvamento, Oficina, Edilicio, Suministros.
- **Módulos (por fase):** tareas, guardias (internas + cuarteleros), fichado, cuaderno de
  novedades, partes de intervención (formulario oficial, exportable a PDF).

## Comandos

`pnpm dev` · `pnpm db:migrate` · `pnpm db:seed` · `pnpm exec tsc --noEmit` (typecheck)
