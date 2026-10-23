// Íconos simples (trazos de 24×24 que toman el color del texto). Son
// decorativos: el texto o el aria-label del elemento que los contiene dice
// qué hacen.

type Props = { className?: string };

function Icono({ className = "size-5", children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}

export const IconoMenu = (p: Props) => (
  <Icono {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Icono>
);

export const IconoCerrar = (p: Props) => (
  <Icono {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icono>
);

export const IconoBolsa = (p: Props) => (
  <Icono {...p}>
    <path d="M6 7h12l1 13H5L6 7z" />
    <path d="M9 7a3 3 0 0 1 6 0" />
  </Icono>
);

export const IconoFiltros = (p: Props) => (
  <Icono {...p}>
    <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="18" cy="18" r="2" />
  </Icono>
);

export const IconoCamion = (p: Props) => (
  <Icono {...p}>
    <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" />
    <circle cx="7" cy="17.5" r="1.5" />
    <circle cx="17" cy="17.5" r="1.5" />
  </Icono>
);

export const IconoCambio = (p: Props) => (
  <Icono {...p}>
    <path d="M4 9h13l-3-3M20 15H7l3 3" />
  </Icono>
);

export const IconoCandado = (p: Props) => (
  <Icono {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Icono>
);

export const IconoLocal = (p: Props) => (
  <Icono {...p}>
    <path d="M4 10l1.5-5h13L20 10M4 10v10h16V10M4 10h16M9 20v-5h6v5" />
  </Icono>
);

export const IconoRegla = (p: Props) => (
  <Icono {...p}>
    <path d="M3 15l12-12 6 6-12 12z" />
    <path d="M7 11l2 2M10 8l2 2M13 5l2 2" />
  </Icono>
);

export const IconoCheck = (p: Props) => (
  <Icono {...p}>
    <path d="M5 12l5 5L20 7" />
  </Icono>
);

export const IconoLupa = (p: Props) => (
  <Icono {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Icono>
);

export const IconoFlecha = ({ direccion = "derecha", ...p }: Props & { direccion?: "izquierda" | "derecha" }) => (
  <Icono {...p}>
    <path d={direccion === "derecha" ? "M9 5l7 7-7 7" : "M15 5l-7 7 7 7"} />
  </Icono>
);

export const IconoPausa = (p: Props) => (
  <Icono {...p}>
    <path d="M9 6v12M15 6v12" />
  </Icono>
);

export const IconoPlay = (p: Props) => (
  <Icono {...p}>
    <path d="M8 5.5v13l10-6.5z" />
  </Icono>
);
