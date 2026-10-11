import type { NextRequest } from "next/server";
import { atualizarSessao } from "@/lib/supabase/proxy";

export function proxy(request: NextRequest) {
  return atualizarSessao(request);
}

export const config = {
  matcher: ["/painel/:path*", "/login"],
};
