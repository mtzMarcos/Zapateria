import type { Metadata } from "next";
import { tienda } from "@/config/tienda";

export const metadata: Metadata = {
  title: `Panel · ${tienda.nombre}`,
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex flex-1 flex-col bg-neutral-50 text-neutral-900">{children}</div>;
}
