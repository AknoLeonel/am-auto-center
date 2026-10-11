import { ImageResponse } from "next/og";
import { servicoPorSlug, servicosDetalhe, CIDADE } from "@/lib/servicos";

export const alt = "Serviço da AM Auto Center";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const generateStaticParams = () => servicosDetalhe.map((s) => ({ slug: s.slug }));

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const s = servicoPorSlug((await params).slug);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#0b1d36", color: "#fff", borderBottom: "24px solid #4aa3ff" }}>
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#4aa3ff" }}>AM AUTO CENTER · BR-135</div>
        <div style={{ display: "flex", fontSize: 108, fontWeight: 800, lineHeight: 1.02, marginTop: 24 }}>{s?.nome ?? "Serviços"}</div>
        <div style={{ display: "flex", fontSize: 48, marginTop: 28, color: "#d6dadd" }}>{CIDADE} - BA · Orçamento pelo WhatsApp</div>
      </div>
    ),
    size
  );
}
