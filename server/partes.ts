"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { puedeCrearParte, puedeEditarParte } from "@/lib/permisos";
import { TIPOS_SINIESTRO } from "@/lib/dominio";
import { parsearDetalleFormData } from "@/lib/partesDetalle";
import { leerPersonalDeFormulario } from "@/lib/partePersonal";
import type { TipoSiniestro, Prisma } from "@/generated/prisma/client";

export type EstadoForm = { error: string } | null;

// Tipos de siniestro válidos (derivados del catálogo de dominio, no del enum
// directamente, para no duplicar la lista en dos lugares).
const TIPOS_VALIDOS = new Set(TIPOS_SINIESTRO.map((t) => t.value));

// Los campos del formulario son todos opcionales salvo el tipo de siniestro:
// un parte se puede abrir con datos incompletos y completarse después.
/// Campos de texto del formulario, todos opcionales. Se listan una sola vez:
/// el esquema y la lectura del `FormData` se derivan de acá, así agregar un
/// campo del formulario oficial es una línea y no tres.
const CAMPOS_TEXTO = [
  // Encabezado
  "servicioNro",
  "rubaNro",
  "certificadoNro",
  "informeNro",
  "cuartel",
  "fecha",
  "objeto",
  "direccion",
  "localidad",
  "jurisdiccionPolicial",
  "pedidoEfectuado",
  "ubicacion",
  "panorama",
  // Tiempos
  "horaAviso",
  "horaLlegada",
  "horaCircunscripto",
  "horaDominado",
  "horaExtinguido",
  "horaFinalizacion",
  "horaRegreso",
  // Recursos y descripción
  "unidades",
  "descripcion",
  // Firmas
  "datosTomadosPor",
  "oficialActuante",
  "dptoTecnico",
  "jefeCuerpo",
] as const;

type CampoTexto = (typeof CAMPOS_TEXTO)[number];

const esquemaParte = z.object({
  tipoSiniestro: z.string().min(1, "Seleccioná el tipo de siniestro."),
  ...(Object.fromEntries(
    CAMPOS_TEXTO.map((campo) => [campo, z.string().trim().optional()]),
  ) as Record<CampoTexto, z.ZodOptional<z.ZodString>>),
  dotaciones: z.string().optional(),
  bomberos: z.string().optional(),
  personal: z.string().optional(),
});

type DatosParte = z.infer<typeof esquemaParte>;

/// Lee y valida los campos comunes del formulario (alta y edición). Un campo
/// vacío se manda como `undefined` para que quede `null` en la DB en vez de "".
function leerFormulario(formData: FormData) {
  const texto = (nombre: string) => formData.get(nombre) || undefined;
  return esquemaParte.safeParse({
    tipoSiniestro: formData.get("tipoSiniestro"),
    ...Object.fromEntries(CAMPOS_TEXTO.map((campo) => [campo, texto(campo)])),
    dotaciones: texto("dotaciones"),
    bomberos: texto("bomberos"),
    personal: texto("personal"),
  });
}

/// Convierte un string de formulario a entero, o null si está vacío/es inválido.
function aEntero(valor: string | undefined): number | null {
  if (!valor) return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

/// Traduce los datos validados del formulario a los campos escalares del
/// modelo. Todos los campos de texto van a columnas homónimas, así que se
/// mapean en bloque; sólo `fecha`, los numéricos y el personal necesitan
/// conversión.
function datosParaGuardar(d: DatosParte) {
  // Un campo que llegó vacío (o con sólo espacios: zod ya recortó) se guarda
  // como null, no como "": la ficha y el PDF preguntan por "sin cargar", y ""
  // no es eso.
  const textos = Object.fromEntries(
    CAMPOS_TEXTO.filter((campo) => campo !== "fecha").map((campo) => [
      campo,
      d[campo] || null,
    ]),
  ) as Record<Exclude<CampoTexto, "fecha">, string | null>;

  return {
    ...textos,
    tipoSiniestro: d.tipoSiniestro as TipoSiniestro,
    fecha: d.fecha ? new Date(d.fecha) : null,
    dotaciones: aEntero(d.dotaciones),
    bomberos: aEntero(d.bomberos),
    // El personal llega como JSON desde SelectorPersonal (P6) y se valida con
    // zod antes de guardarse: nunca se confía en la forma que mande el cliente.
    personal: leerPersonalDeFormulario(d.personal),
  };
}

/// Carga un parte del destacamento del usuario (o null).
async function cargarParte(id: string, destacamentoId: string) {
  return prisma.parteIntervencion.findFirst({ where: { id, destacamentoId } });
}

/// Alta de un parte de intervención. Cualquiera del destacamento puede crear
/// uno (PRD §4.7); queda ABIERTO hasta que lo cierre el creador o conducción.
export async function crearParte(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const ctx = await getContextoAuth();
  if (!ctx) return { error: "Sesión no válida." };
  if (!puedeCrearParte(ctx)) {
    return { error: "No tenés permisos para crear partes." };
  }

  const parsed = leerFormulario(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const d = parsed.data;
  if (!TIPOS_VALIDOS.has(d.tipoSiniestro as TipoSiniestro)) {
    return { error: "Tipo de siniestro inválido." };
  }

  // El detalle condicional (vehículos, incendio, víctimas, etc.) se parsea
  // según las secciones que habilita el tipo de siniestro elegido — así no
  // se puede colar, por ejemplo, un dato de "rescate de animal" en un parte
  // de incendio.
  const detalle = parsearDetalleFormData(formData, d.tipoSiniestro as TipoSiniestro);

  const parte = await prisma.parteIntervencion.create({
    data: {
      ...datosParaGuardar(d),
      detalle: detalle as Prisma.InputJsonValue,
      estado: "ABIERTO",
      destacamentoId: ctx.destacamentoId,
      creadorId: ctx.usuarioId,
    },
  });

  revalidatePath("/partes");
  redirect(`/partes/${parte.id}`);
}

/// Edición de un parte ya abierto. Solo el creador o conducción, y solo
/// mientras esté ABIERTO — un parte cerrado es un registro formal cerrado.
///
/// Tiene la misma firma que `crearParte` para que `components/FormParte.tsx`
/// pueda usar una u otra sin saber cuál es cuál, y devuelve el error en vez de
/// fallar en silencio: la persona acaba de escribir un parte entero y tiene que
/// enterarse si no se guardó.
export async function editarParte(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const ctx = await getContextoAuth();
  if (!ctx) return { error: "Sesión no válida." };
  const parteId = String(formData.get("parteId") ?? "");

  const parte = await cargarParte(parteId, ctx.destacamentoId);
  if (!parte) return { error: "El parte no existe o no es de tu destacamento." };
  if (!puedeEditarParte(ctx, parte)) {
    return parte.estado === "CERRADO"
      ? { error: "El parte está cerrado: no se puede editar." }
      : { error: "No tenés permisos para editar este parte." };
  }

  const parsed = leerFormulario(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const d = parsed.data;
  if (!TIPOS_VALIDOS.has(d.tipoSiniestro as TipoSiniestro)) {
    return { error: "Tipo de siniestro inválido." };
  }

  const detalle = parsearDetalleFormData(formData, d.tipoSiniestro as TipoSiniestro);

  await prisma.parteIntervencion.update({
    where: { id: parte.id },
    data: { ...datosParaGuardar(d), detalle: detalle as Prisma.InputJsonValue },
  });

  revalidatePath(`/partes/${parte.id}`);
  revalidatePath("/partes");
  redirect(`/partes/${parte.id}`);
}

/// Cierra el parte: a partir de acá no se puede volver a editar. Solo el
/// creador o conducción.
export async function cerrarParte(formData: FormData) {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");
  const parteId = String(formData.get("parteId") ?? "");

  const parte = await cargarParte(parteId, ctx.destacamentoId);
  // Misma regla que la edición: creador o conducción, y sólo si está ABIERTO.
  if (!parte || !puedeEditarParte(ctx, parte)) return;

  await prisma.parteIntervencion.update({
    where: { id: parte.id },
    data: {
      estado: "CERRADO",
      cerradoPorId: ctx.usuarioId,
      cerradoEn: new Date(),
    },
  });

  revalidatePath(`/partes/${parte.id}`);
  revalidatePath("/partes");
}
