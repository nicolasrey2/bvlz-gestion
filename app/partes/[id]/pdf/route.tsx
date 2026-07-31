import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import {
  limpiarFormulario,
  llenarFormularioParte,
  type ParteParaFormulario,
} from "@/lib/parteAcroForm";
import { leerPersonal } from "@/lib/partePersonal";

/// Plantilla oficial del DTO 3. Se lee del repo en cada request (es un archivo
/// de ~370 KB y hay que partir siempre de una copia limpia: `PDFDocument.load`
/// devuelve un documento mutable que se completa y se descarta).
/// El archivo se incluye en el deploy vía `outputFileTracingIncludes`
/// (`next.config.ts`) — Next no puede inferir esta lectura por sí solo.
const RUTA_PLANTILLA = path.join(
  process.cwd(),
  "docs",
  "parte-intervencion-DTO3.pdf",
);

/// Exporta el parte rellenando el formulario oficial (P8). Requiere sesión y
/// que el parte pertenezca al destacamento del usuario (misma regla que la
/// página de detalle — un parte nunca cruza destacamentos).
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await getContextoAuth();
  if (!auth) return new Response("No autorizado", { status: 401 });

  const { id } = await ctx.params;
  const parte = await prisma.parteIntervencion.findFirst({
    where: { id, destacamentoId: auth.destacamentoId },
  });
  if (!parte) return new Response("No encontrado", { status: 404 });

  // Los campos escalares del parte coinciden en nombre con los que espera el
  // formulario, así que se pasan tal cual; sólo `personal` necesita parseo (es
  // una columna Json).
  const datos: ParteParaFormulario = {
    ...parte,
    personal: leerPersonal(parte.personal),
  };

  const documento = await PDFDocument.load(await readFile(RUTA_PLANTILLA));
  const formulario = documento.getForm();

  // La plantilla viene con un parte de ejemplo cargado: sin esto quedarían
  // datos ajenos en los campos que no completamos.
  limpiarFormulario(formulario);

  const { camposFaltantes } = llenarFormularioParte(formulario, datos);
  if (camposFaltantes.length > 0) {
    // No es motivo para no entregar el PDF, pero sí para enterarse: significa
    // que el DTO 3 cambió la plantilla y el mapeo quedó desactualizado.
    console.warn(
      `[parte ${parte.id}] campos ausentes en la plantilla oficial:`,
      camposFaltantes.join(", "),
    );
  }

  // Un parte cerrado se archiva: se aplana para que el PDF no sea editable.
  // El abierto se deja con los campos vivos: es el borrador que se lleva al
  // cuartel para corregir a mano antes de volcar los cambios en la app
  // (`/partes/[id]/editar`) y cerrarlo.
  if (parte.estado === "CERRADO") formulario.flatten();

  const bytes = await documento.save();
  const nombre = `parte-${parte.servicioNro ?? parte.id}.pdf`;

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nombre}"`,
    },
  });
}
