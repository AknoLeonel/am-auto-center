import { ImageResponse } from "next/og";

const SIZES = [180, 192, 512];

export async function GET(_req: Request, ctx: { params: Promise<{ size: string }> }) {
  const { size } = await ctx.params;
  const s = Number(size);
  if (!SIZES.includes(s)) return new Response("Not found", { status: 404 });

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0b1d36" }}>
        <div style={{ display: "flex", color: "#ffffff", fontSize: s * 0.42, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>AM</div>
        <div style={{ display: "flex", width: s * 0.36, height: s * 0.045, background: "#4aa3ff", marginTop: s * 0.05 }} />
      </div>
    ),
    { width: s, height: s }
  );
}
