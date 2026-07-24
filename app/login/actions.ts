"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EstadoLogin = { error: string } | null;

const esquemaLogin = z.object({
  email: z.string().min(3),
  password: z.string().min(1),
});

/// Inicia sesión. Firma compatible con useActionState (prevState, formData).
/// En éxito redirige a "/" (redirect() lanza NEXT_REDIRECT, por eso va fuera
/// de cualquier try/catch).
export async function login(
  _prev: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const parsed = esquemaLogin.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Ingresá un email y una contraseña válidos." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "Email o contraseña incorrectos." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/// Cierra sesión y vuelve al login.
export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
