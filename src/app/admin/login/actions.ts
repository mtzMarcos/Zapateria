"use server";

import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase/server";
import { texto, type EstadoForm } from "@/lib/admin/form";

export async function iniciarSesion(
  _estado: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const email = texto(formData, "email");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Completá el email y la contraseña." };

  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email o contraseña incorrectos." };

  const { data: esAdmin } = await supabase.rpc("is_admin");
  if (!esAdmin) {
    await supabase.auth.signOut();
    return { error: "Esta cuenta no tiene permisos de administrador." };
  }

  redirect("/admin/productos");
}

export async function cerrarSesion() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
