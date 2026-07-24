"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { esConduccion, puedeCrearParte } from "@/lib/permisos";
import { TIPOS_SINIESTRO } from "@/lib/dominio";
import type { TipoSiniestro } from "@/generated/prisma/client";

export type EstadoForm = { error: string } | null;

// Tipos de siniestro válidos (derivados del catálogo de dominio, no del enum
// directamente, para no duplicar la lista en dos lugares).
const TIPOS_VALIDOS = new Set(TIPOS_SINIESTRO.map((t) => t.value));

// Los campos del formulario son todos opcionales salvo el tipo de siniestro:
// un parte se puede abrir con datos incompletos y completarse después.
const esquemaParte = z.object({
  tipoSiniestro: z.string().min(1, "Seleccioná el tipo de siniestro."),
  servicioNro: z.string().trim().optional(),
  cuartel: z.string().trim().optional(),
  fecha: z.string().optional(),
  objeto: z.string().trim().optional(),
  direccion: z.string().trim().optional(),
  localidad: z.string().trim().optional(),
  horaAviso: z.string().trim().optional(),
  horaLlegada: z.string().trim().optional(),
  horaRegreso: z.string().trim().optional(),
  dotaciones: z.string().optional(),
  bomberos: z.string().optional(),
  unidades: z.string().trim().optional(),
  descripcion: z.string().trim().optional(),
  personal: z.string().optional(),
  datosTomadosPor: z.string().trim().optional(),
  oficialActuante: z.string().trim().optional(),
  jefeCuerpo: z.string().trim().optional(),
});

type DatosParte = z.infer<typeof esquemaParte>;

/// Lee y valida los campos comunes del formulario (alta y edición).
function leerFormulario(formData: FormData) {
  return esquemaParte.safeParse({
    tipoSiniestro: formData.get("tipoSiniestro"),
    servicioNro: formData.get("servicioNro") || undefined,
    cuartel: formData.get("cuartel") || undefined,
    fecha: formData.get("fecha") || undefined,
    objeto: formData.get("objeto") || undefined,
    direccion: formData.get("direccion") || undefined,
    localidad: formData.get("localidad") || undefined,
    horaAviso: formData.get("horaAviso") || undefined,
    horaLlegada: formData.get("horaLlegada") || undefined,
    horaRegreso: formData.get("horaRegreso") || undefined,
    dotaciones: formData.get("dotaciones") || undefined,
    bomberos: formData.get("bomberos") || undefined,
    unidades: formData.get("unidades") || undefined,
    descripcion: formData.get("descripcion") || undefined,
    personal: formData.get("personal") || undefined,
    datosTomadosPor: formData.get("datosTomadosPor") || undefined,
    oficialActuante: formData.get("oficialActuante") || undefined,
    jefeCuerpo: formData.get("jefeCuerpo") || undefined,
  });
}

/// Convierte un string de formulario a entero, o null si está vacío/es inválido.
function aEntero(valor: string | undefined): number | null {
  if (!valor) return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

/// Traduce los datos validados del formulario a los campos escalares del
/// modelo (personal: textarea → array de strings, una persona por línea).
function datosParaGuardar(d: DatosParte) {
  return {
    tipoSiniestro: d.tipoSiniestro as TipoSiniestro,
    servicioNro: d.servicioNro ?? null,
    cuartel: d.cuartel ?? null,
    fecha: d.fecha ? new Date(d.fecha) : null,
    objeto: d.objeto ?? null,
    direccion: d.direccion ?? null,
    localidad: d.localidad ?? null,
    horaAviso: d.horaAviso ?? null,
    horaLlegada: d.horaLlegada ?? null,
    horaRegreso: d.horaRegreso ?? null,
    dotaciones: aEntero(d.dotaciones),
    bomberos: aEntero(d.bomberos),
    unidades: d.unidades ?? null,
    descripcion: d.descripcion ?? null,
    personal: d.personal
      ? d.personal
          .split("\n")
          .map((linea) => linea.trim())
          .filter(Boolean)
      : [],
    datosTomadosPor: d.datosTomadosPor ?? null,
    oficialActuante: d.oficialActuante ?? null,
    jefeCuerpo: d.jefeCuerpo ?? null,
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

  const parte = await prisma.parteIntervencion.create({
    data: {
      ...datosParaGuardar(d),
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
export async function editarParte(formData: FormData) {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");
  const parteId = String(formData.get("parteId") ?? "");

  const parte = await cargarParte(parteId, ctx.destacamentoId);
  if (!parte || parte.estado !== "ABIERTO") return;
  if (parte.creadorId !== ctx.usuarioId && !esConduccion(ctx)) return;

  const parsed = leerFormulario(formData);
  if (!parsed.success) return;
  const d = parsed.data;
  if (!TIPOS_VALIDOS.has(d.tipoSiniestro as TipoSiniestro)) return;

  await prisma.parteIntervencion.update({
    where: { id: parte.id },
    data: datosParaGuardar(d),
  });

  revalidatePath(`/partes/${parte.id}`);
  revalidatePath("/partes");
}

/// Cierra el parte: a partir de acá no se puede volver a editar. Solo el
/// creador o conducción.
export async function cerrarParte(formData: FormData) {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");
  const parteId = String(formData.get("parteId") ?? "");

  const parte = await cargarParte(parteId, ctx.destacamentoId);
  if (!parte || parte.estado !== "ABIERTO") return;
  if (parte.creadorId !== ctx.usuarioId && !esConduccion(ctx)) return;

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
