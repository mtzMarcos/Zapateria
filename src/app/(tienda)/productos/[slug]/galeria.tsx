"use client";

import Image from "next/image";
import { useState } from "react";

export function Galeria({ fotos, nombre }: { fotos: string[]; nombre: string }) {
  const [actual, setActual] = useState(0);

  if (fotos.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-neutral-100 text-neutral-400">
        Sin foto
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
        <Image
          src={fotos[actual]}
          alt={nombre}
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      {fotos.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2">
          {fotos.map((foto, i) => (
            <li key={foto}>
              <button
                type="button"
                onClick={() => setActual(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === actual ? "true" : undefined}
                className={`relative block aspect-square w-full overflow-hidden rounded-md border-2 ${
                  i === actual ? "border-neutral-900" : "border-transparent hover:border-neutral-300"
                }`}
              >
                <Image src={foto} alt="" fill sizes="20vw" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
