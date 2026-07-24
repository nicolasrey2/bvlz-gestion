---
name: clean-code
description: >
  Reglas de código limpio para BVLZ (TypeScript + React 19 + Next.js 16).
  Aplicar SIEMPRE al crear o modificar código, incluidos snippets y fixes.
  Adaptación al stack de este repo de las reglas de clean-code / SOLID /
  design-patterns que usa el equipo en su proyecto Java. Los principios son
  los mismos; los idioms son los de TS/React. Todo el código lleva comentarios
  que explican la intención (en español).
---

# Clean Code — TypeScript + React 19 + Next.js 16 (BVLZ)

## Principios base

| Principio | Regla | Señal de alarma |
|---|---|---|
| **DRY** | Una única fuente de verdad para cada lógica | Bloques copiados y pegados |
| **KISS** | La solución más simple que funcione | Abstracciones sobre-diseñadas |
| **YAGNI** | Construir solo lo que se necesita hoy | Código "por las dudas" |

- **Idioma:** todo en español (UI, mensajes, dominio). Comentarios que expliquen el *por qué*, no el *qué*.
- **Match del entorno:** el código nuevo se parece al que lo rodea (naming, densidad de comentarios, idioms).

## Naming

- Funciones = verbos (`crearTarea`, `asignarGuardia`); booleanos con `es/tiene/puede` (`puedeAprobar`).
- Nada de abreviaturas oscuras. Nombres de dominio en español; APIs técnicas en su idioma original.
- Componentes React en `PascalCase`; hooks `useAlgo`; Server Actions con verbo claro.

## Funciones y componentes

- Una función hace una cosa. Si necesita comentario para separar "secciones", partila.
- Preferir **funciones puras** y early-return sobre anidamiento profundo.
- Componentes chicos y composables. Lógica de datos en Server Components / Server Actions; el cliente solo para interacción.
- Validar entrada con **zod** en el borde (Server Actions / route handlers).

## SOLID (adaptado a TS/React)

- **SRP:** un módulo, una razón para cambiar. Separar acceso a datos (Prisma), lógica de dominio (`server/`) y UI (`components/`).
- **OCP:** evitar cadenas `if/switch` que crecen por cada variante nueva → usar mapas de estrategias / objetos de configuración / polimorfismo.
- **LSP/ISP:** tipos e interfaces chicos y específicos; no forzar props/campos que no se usan.
- **DIP:** depender de abstracciones (funciones/tipos), inyectar clientes (`prisma`, supabase) en vez de instanciarlos ad-hoc en cada módulo.

## Patrones útiles (equivalentes en TS)

| Problema | Enfoque en este repo |
|---|---|
| Construcción con muchos campos opcionales | Objeto de opciones tipado, no listas largas de parámetros |
| Elegir comportamiento en runtime | Mapa `Record<Tipo, handler>` (Strategy) en vez de `switch` |
| Reaccionar a cambios de estado | Eventos/callbacks; en UI, estado derivado — sin acoplar |
| Reutilizar lógica de UI | Custom hooks; para lógica de servidor, funciones en `server/` |

> No hay "Singleton manual": el cliente Prisma ya es singleton (`lib/prisma.ts`).

## Seguridad y dominio (no negociable en BVLZ)

- **Permisos en el servidor**, nunca solo en la UI. Ver `docs/PRD.md` §3.5.
- Toda query operativa filtra por `destacamentoId` del usuario.
- La `service_role` de Supabase solo en servidor; jamás en el cliente.
