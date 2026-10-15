import { tienda } from "@/config/tienda";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-20">
      <h1 className="text-2xl font-bold">{tienda.nombre}</h1>
      <p className="mt-1 mb-8 text-neutral-500">Panel de administración</p>
      <LoginForm />
    </main>
  );
}
