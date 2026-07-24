import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { NOMBRE_TIPO_SINIESTRO } from "@/lib/dominio";
import { ParteDocumento, type ParteParaPdf } from "@/pdf/parte";

/// Logo institucional embebido como data URI para el encabezado del PDF. Se
/// lee una sola vez al cargar el módulo (archivo estático de `public/`); si
/// falta o falla la lectura, el PDF se genera igual sin logo.
function leerLogoDataUri(): string | undefined {
  try {
    const ruta = path.join(process.cwd(), "public", "logo-bomberos.jpeg");
    const buffer = readFileSync(ruta);
    return `data:image/jpeg;base64,${buffer.toString("base64")}`;
  } catch {
    return undefined;
  }
}

const logoDataUri = leerLogoDataUri();

/// Exporta el parte de intervención a PDF. Requiere sesión y que el parte
/// pertenezca al destacamento del usuario (misma regla que la página de
/// detalle — un parte nunca cruza destacamentos).
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await getContextoAuth();
  if (!auth) return new Response("No autorizado", { status: 401 });

  const { id } = await ctx.params;
  const parte = await prisma.parteIntervencion.findFirst({
    where: { id, destacamentoId: auth.destacamentoId },
    include: { creador: true, cerradoPor: true },
  });
  if (!parte) return new Response("No encontrado", { status: 404 });

  const personal = Array.isArray(parte.personal)
    ? (parte.personal as unknown[]).map(String)
    : [];

  const datos: ParteParaPdf = {
    id: parte.id,
    estado: parte.estado,
    tipoSiniestro: NOMBRE_TIPO_SINIESTRO[parte.tipoSiniestro],
    servicioNro: parte.servicioNro,
    cuartel: parte.cuartel,
    fecha: parte.fecha,
    objeto: parte.objeto,
    direccion: parte.direccion,
    localidad: parte.localidad,
    horaAviso: parte.horaAviso,
    horaLlegada: parte.horaLlegada,
    horaRegreso: parte.horaRegreso,
    dotaciones: parte.dotaciones,
    bomberos: parte.bomberos,
    unidades: parte.unidades,
    descripcion: parte.descripcion,
    personal,
    datosTomadosPor: parte.datosTomadosPor,
    oficialActuante: parte.oficialActuante,
    jefeCuerpo: parte.jefeCuerpo,
    creadorNombre: `${parte.creador.apellido}, ${parte.creador.nombre}`,
    cerradoPorNombre: parte.cerradoPor
      ? `${parte.cerradoPor.apellido}, ${parte.cerradoPor.nombre}`
      : null,
    cerradoEn: parte.cerradoEn,
    detalle: parte.detalle,
  };

  const buffer = await renderToBuffer(
    <ParteDocumento parte={datos} logoDataUri={logoDataUri} />,
  );

  // Response no acepta Buffer<ArrayBufferLike> directo en los tipos de DOM;
  // se copia a un Uint8Array respaldado por un ArrayBuffer "puro".
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="parte.pdf"',
    },
  });
}
