import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DIAS_VALIDEZ, estadoLink, hashToken } from "@/lib/activacion";
import { FormActivar } from "@/components/FormActivar";
import logoCuartel from "@/public/logo-cuartel.png";

/// Pantalla del link de activación.
///
/// Un link sirve una sola vez: al activar la cuenta se borra el hash del token
/// (`server/activacion.ts`). Pero **la gente vuelve a entrar por el mismo link
/// por costumbre**, así que esta pantalla nunca es un callejón sin salida:
/// cuando el link ya no sirve ofrece "Ir al inicio", que lleva a la app si ya
/// hay sesión y al login si no (lo resuelve el proxy).
export default async function ActivarPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Se busca sólo por hash, sin filtrar vencimiento ni activación: hace falta
  // saber en qué estado está el link para dar la salida correcta.
  const usuario = await prisma.usuario.findFirst({
    where: { activacionTokenHash: hashToken(token) },
    select: { nombre: true, cuentaActivada: true, activacionExpira: true },
  });

  const estado = estadoLink(usuario);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-100 px-6 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <Image
              src={logoCuartel}
              alt="Bomberos Voluntarios de Lomas de Zamora"
              priority
              className="h-auto w-56"
            />
          </div>
        </div>

        {estado === "vigente" && usuario ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Hola {usuario.nombre} 👋
            </h1>
            <p className="mt-1 mb-4 text-sm text-zinc-500 dark:text-zinc-400">
              Definí tu contraseña para activar tu cuenta.
            </p>
            <FormActivar token={token} />
          </div>
        ) : (
          <LinkSinUso vencido={estado === "vencido"} />
        )}
      </div>
    </main>
  );
}

/// Tarjeta para cuando el link ya no sirve, con la salida al inicio.
///
/// `vencido` distingue los dos casos, que se resuelven distinto: el token sigue
/// vivo pero pasaron los días (hay que pedir otro), o ya se consumió —lo más
/// común: la cuenta se activó— y entonces sólo hay que iniciar sesión.
function LinkSinUso({ vencido }: { vencido: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-zinc-900">
      <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
        {vencido ? "El link venció" : "Este link ya se usó"}
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {vencido
          ? `Los links de activación duran ${DIAS_VALIDEZ} días. Pedile uno nuevo al encargado para definir tu contraseña.`
          : "Si ya definiste tu contraseña, entrá con tu email y contraseña. Si todavía no la definiste, pedile un link nuevo al encargado."}
      </p>

      <Link
        href="/"
        className="mt-4 block w-full rounded-lg bg-red-700 px-4 py-2.5 text-base font-semibold text-white"
      >
        Ir al inicio
      </Link>
    </div>
  );
}
