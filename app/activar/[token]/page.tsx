import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/activacion";
import { FormActivar } from "@/components/FormActivar";
import logoCuartel from "@/public/logo-cuartel.png";

export default async function ActivarPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Token válido: hash coincide, cuenta sin activar y sin vencer.
  const usuario = await prisma.usuario.findFirst({
    where: {
      activacionTokenHash: hashToken(token),
      cuentaActivada: false,
      activacionExpira: { gt: new Date() },
    },
    select: { nombre: true },
  });

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

        {usuario ? (
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
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-zinc-900">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Este link de activación no es válido o venció. Pedile uno nuevo al
              encargado.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
