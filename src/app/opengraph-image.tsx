import { ImageResponse } from "next/og";

export const alt = "AM Auto Center | Mecânica, guincho e peças em Formosa do Rio Preto";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#0b1d36", color: "#fff", borderBottom: "24px solid #4aa3ff" }}>
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#4aa3ff" }}>BR-135 · Formosa do Rio Preto - BA</div>
        <div style={{ display: "flex", fontSize: 128, fontWeight: 800, lineHeight: 1, marginTop: 24 }}>AM AUTO CENTER</div>
        <div style={{ display: "flex", fontSize: 52, marginTop: 28, color: "#d6dadd" }}>Mecânica, guincho e peças. Peça seu orçamento pelo WhatsApp.</div>
      </div>
    ),
    size
  );
}
