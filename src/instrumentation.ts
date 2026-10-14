import type { Instrumentation } from "next";

// Chamado pelo Next sempre que o servidor captura um erro (render, rota ou server action).
// No navegador o erro aparece como "React error #441" (mensagem escondida por segurança);
// aqui ele chega inteiro. Vai para o log da Vercel e, se a chave de serviço existir, para a tabela erros_app,
// que o dono vê em /painel/diagnostico. Nunca lança erro: monitorar não pode derrubar o app.
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  try {
    const e = err as { message?: unknown; digest?: unknown };
    const registro = {
      digest: typeof e?.digest === "string" ? e.digest : null,
      mensagem: String(e?.message ?? err).slice(0, 500),
      rota: context.routePath?.slice(0, 200) ?? null,
      tipo: context.routeType ?? null,
      metodo: request.method?.slice(0, 10) ?? null,
      // sem querystring: ela pode ter dados da pessoa (busca por nome, telefone etc.)
      caminho: request.path?.split("?")[0].slice(0, 200) ?? null,
    };
    console.error(JSON.stringify({ nivel: "erro", ...registro }));

    if (process.env.NEXT_RUNTIME !== "nodejs") return;
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    if (admin) await admin.from("erros_app").insert(registro);
  } catch {
    // melhor esforço
  }
};
