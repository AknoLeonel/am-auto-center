"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const Catalogo = dynamic(() => import("./PartsCatalog").then((m) => m.PartsCatalog), { ssr: false });

// O catálogo é pesado para hidratar e fica no meio da página. O servidor entrega o resumo (texto indexável) e o
// catálogo interativo só carrega quando o visitante chega perto, abre o link #pecas ou toca no botão.
export function PartsCatalogLazy({ resumo }: { resumo: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ativo, setAtivo] = useState(false);

  useEffect(() => {
    if (ativo) return;
    const ligar = () => setAtivo(true);
    if (location.hash === "#pecas") ligar();
    window.addEventListener("hashchange", () => location.hash === "#pecas" && ligar());
    const io = "IntersectionObserver" in window
      ? new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && ligar(), { rootMargin: "700px 0px" })
      : null;
    if (io && ref.current) io.observe(ref.current);
    else ligar();
    return () => io?.disconnect();
  }, [ativo]);

  if (ativo) return <Catalogo />;
  return (
    <div ref={ref}>
      {resumo}
      <div className="px-4 pb-14 lg:pb-20">
        <div className="mx-auto max-w-6xl">
          <button type="button" onClick={() => setAtivo(true)}
            className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-ink px-6 font-bold hover:bg-ink hover:text-white">
            Abrir catálogo de peças
          </button>
        </div>
      </div>
    </div>
  );
}
