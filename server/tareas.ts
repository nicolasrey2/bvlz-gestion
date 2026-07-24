"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import {
  esConduccion,
  puedeCrearTareas,
  puedeCrearTareaEnArea,
  puedeAprobarTareaEnArea,
} from "@/lib/permisos";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Prioridad } from "@/generated/prisma/client";

export type EstadoForm = { error: string } | null;

const PRIORIDADES = new Set(["ALTA", "MEDIA", "BAJA"]);

const esquema = z.object({
  titulo: z.string().trim().min(1, "Ingresá un título."),
  descripcion: z.string().trim().optional(),
  prioridad: z.string(),
  areaId: z.string().optional(),
  fechaLimite: z.string().optional(),
  asignados: z.array(z.string()),
});

/// Alta de tarea. Conducción a cualquier área/general; encargado solo en su área.
export async function crearTarea(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const ctx = await getContextoAuth();
  if (!ctx) return { error: "Sesión no válida." };
  if (!puedeCrearTareas(ctx)) {
    return { error: "No tenés permisos para crear tareas." };
  }

  const parsed = esquema.safeParse({
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion") || undefined,
    prioridad: formData.get("prioridad"),
    areaId: formData.get("areaId") || undefined,
    fechaLimite: formData.get("fechaLimite") || undefined,
    asignados: formData.getAll("asignados").map(String),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const d = parsed.data;

  if (!PRIORIDADES.has(d.prioridad)) return { error: "Prioridad inválida." };

  // Validar el área (null = tarea general) y el permiso de crear ahí.
  const areaId = d.areaId ?? null;
  if (areaId) {
    const area = await prisma.area.findFirst({
      where: { id: areaId, destacamentoId: ctx.destacamentoId },
    });
    if (!area) return { error: "El área seleccionada no es válida." };
  }
  if (!puedeCrearTareaEnArea(ctx, areaId)) {
    return { error: "No podés crear tareas en esa área." };
  }

  // Los asignados deben pertenecer al destacamento.
  const asignados = await prisma.usuario.findMany({
    where: { id: { in: d.asignados }, destacamentoId: ctx.destacamentoId },
    select: { id: true },
  });

  await prisma.tarea.create({
    data: {
      titulo: d.titulo,
      descripcion: d.descripcion,
      prioridad: d.prioridad as Prioridad,
      areaId,
      fechaLimite: d.fechaLimite ? new Date(d.fechaLimite) : null,
      destacamentoId: ctx.destacamentoId,
      creadorId: ctx.usuarioId,
      asignados: { create: asignados.map((u) => ({ usuarioId: u.id })) },
    },
  });

  revalidatePath("/tareas");
  redirect("/tareas");
}

/// Carga una tarea del destacamento del usuario (o null).
async function cargarTarea(id: string, destacamentoId: string) {
  return prisma.tarea.findFirst({
    where: { id, destacamentoId },
    include: { asignados: true },
  });
}

/// Pendiente → En revisión. La marca un asignado, la conducción o el encargado
/// del área de la tarea.
export async function enviarARevision(formData: FormData) {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");
  const tareaId = String(formData.get("tareaId") ?? "");

  const tarea = await cargarTarea(tareaId, ctx.destacamentoId);
  if (!tarea || tarea.estado !== "PENDIENTE") return;

  const esAsignado = tarea.asignados.some((a) => a.usuarioId === ctx.usuarioId);
  const puede =
    esAsignado ||
    esConduccion(ctx) ||
    puedeAprobarTareaEnArea(ctx, tarea.areaId);
  if (!puede) return;

  await prisma.tarea.update({
    where: { id: tarea.id },
    data: { estado: "EN_REVISION" },
  });
  revalidatePath(`/tareas/${tarea.id}`);
  revalidatePath("/tareas");
}

/// En revisión → Completa (visto bueno). Solo quien puede aprobar el área.
export async function aprobarTarea(formData: FormData) {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");
  const tareaId = String(formData.get("tareaId") ?? "");

  const tarea = await cargarTarea(tareaId, ctx.destacamentoId);
  if (!tarea || tarea.estado !== "EN_REVISION") return;
  if (!puedeAprobarTareaEnArea(ctx, tarea.areaId)) return;

  await prisma.tarea.update({
    where: { id: tarea.id },
    data: {
      estado: "COMPLETA",
      aprobadorId: ctx.usuarioId,
      aprobadaEn: new Date(),
    },
  });
  revalidatePath(`/tareas/${tarea.id}`);
  revalidatePath("/tareas");
}

/// Sube fotos de evidencia a una tarea (bucket privado "tareas"). Pueden hacerlo
/// los asignados, la conducción o el encargado del área (PRD §4.3).
export async function subirEvidencia(formData: FormData) {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");
  const tareaId = String(formData.get("tareaId") ?? "");

  const tarea = await cargarTarea(tareaId, ctx.destacamentoId);
  if (!tarea || tarea.estado === "COMPLETA") return;

  const esAsignado = tarea.asignados.some((a) => a.usuarioId === ctx.usuarioId);
  if (!esAsignado && !esConduccion(ctx) && !puedeAprobarTareaEnArea(ctx, tarea.areaId)) {
    return;
  }

  const archivos = formData
    .getAll("fotos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (archivos.length === 0) return;

  const admin = createSupabaseAdminClient();
  for (const [i, file] of archivos.entries()) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${tarea.id}/${Date.now()}-${i}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await admin.storage
      .from("tareas")
      .upload(path, buffer, { contentType: file.type });
    if (error) continue;
    await prisma.tareaAdjunto.create({
      data: { tareaId: tarea.id, path, subidoPorId: ctx.usuarioId },
    });
  }

  revalidatePath(`/tareas/${tarea.id}`);
}

/// En revisión → Pendiente (rechazo). Solo quien puede aprobar el área.
export async function rechazarTarea(formData: FormData) {
  const ctx = await getContextoAuth();
  if (!ctx) redirect("/login");
  const tareaId = String(formData.get("tareaId") ?? "");

  const tarea = await cargarTarea(tareaId, ctx.destacamentoId);
  if (!tarea || tarea.estado !== "EN_REVISION") return;
  if (!puedeAprobarTareaEnArea(ctx, tarea.areaId)) return;

  await prisma.tarea.update({
    where: { id: tarea.id },
    data: { estado: "PENDIENTE", aprobadorId: null, aprobadaEn: null },
  });
  revalidatePath(`/tareas/${tarea.id}`);
  revalidatePath("/tareas");
}
