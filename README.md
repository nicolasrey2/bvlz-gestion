# BVLZ — Gestión de Destacamento

Web app **mobile-first** para la gestión operativa del **Destacamento N°3 de Llavallol**
(Asociación de Bomberos Voluntarios de Lomas de Zamora). MVP preparado para escalar a
multi-destacamento.

> Documentación de producto y técnica en [`docs/`](./docs):
> [PRD](./docs/PRD.md) · [Documento técnico](./docs/TECH.md) · [Parte oficial de ejemplo](./docs/parte-intervencion-DTO3.pdf)

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS 4**
- **Prisma 7** (driver adapter `pg`) sobre **PostgreSQL**
- **Supabase**: Auth + Storage + Postgres
- Generación de PDF: **@react-pdf/renderer**
- Hosting objetivo: **Vercel** (free) + **Supabase** (free)

## Estructura

```
app/            Rutas y UI (App Router)
components/     Componentes React (ui/ para shadcn/primitivos)
lib/            Clientes y utilidades (prisma, supabase)
server/         Server Actions / lógica de dominio
prisma/         schema.prisma, migraciones y seed
pdf/            Plantilla y generación del parte de intervención
generated/      Cliente Prisma generado (git-ignored)
docs/           PRD, documento técnico y parte oficial de ejemplo
```

## Puesta en marcha

1. **Crear proyecto en Supabase** (https://supabase.com) — gratis.
2. **Variables de entorno:** copiar `.env.example` a `.env` y completar con los datos
   de Supabase (Project Settings → API y → Database).
   ```bash
   cp .env.example .env
   ```
3. **Instalar dependencias:**
   ```bash
   pnpm install
   ```
4. **Aplicar el esquema y sembrar datos** (destacamento Llavallol + sus 5 áreas):
   ```bash
   pnpm db:migrate    # crea las tablas
   pnpm db:seed       # carga datos iniciales
   ```
5. **Desarrollo:**
   ```bash
   pnpm dev
   ```

## Scripts

| Script | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | `prisma generate` + build de producción |
| `pnpm db:migrate` | Crear/aplicar migraciones (dev) |
| `pnpm db:deploy` | Aplicar migraciones (producción/CI) |
| `pnpm db:seed` | Sembrar datos iniciales |
| `pnpm db:studio` | Prisma Studio (explorar la DB) |
| `pnpm lint` | ESLint |

## Deploy (Vercel)

1. Subir el repo a GitHub y conectarlo en Vercel.
2. Cargar las mismas variables de entorno del `.env` en el proyecto de Vercel.
3. Vercel corre `pnpm build` (que incluye `prisma generate`). Las migraciones se
   aplican con `pnpm db:deploy` (localmente o como paso de CI).

## Estado

**Fase 0 completada:** scaffold, stack, esquema fundacional (Destacamento, Usuario,
Área, AsignaciónRol) y seed. Próximo: Fase 1 — login y gestión de personal/roles.
Ver el roadmap en [`docs/TECH.md`](./docs/TECH.md) §8.
