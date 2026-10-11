import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export type Mensagem = { titulo: string; corpo: string; url: string; tag?: string };

function configurar() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:contato@example.com", pub, priv);
  return true;
}

// Envia para os aparelhos de dono e atendente. Melhor esforço: nunca lança erro,
// e fica desligado (silencioso) enquanto as chaves não estiverem configuradas.
export async function enviarPush(msg: Mensagem, papeis: string[] = ["dono", "atendente"]) {
  try {
    const admin = createAdminClient();
    if (!admin || !configurar()) return;

    const { data: perfis } = await admin.from("perfis").select("user_id").eq("ativo", true).in("papel", papeis);
    const ids = (perfis ?? []).map((p) => p.user_id);
    if (ids.length === 0) return;
    const { data: subs } = await admin.from("push_subs").select("user_id,endpoint,p256dh,auth").in("user_id", ids);

    const payload = JSON.stringify(msg);
    await Promise.allSettled((subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600 });
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        // 404/410: o aparelho cancelou a inscrição; limpa para não tentar de novo.
        if (code === 404 || code === 410) await admin.from("push_subs").delete().eq("user_id", s.user_id).eq("endpoint", s.endpoint);
      }
    }));
  } catch {
    // push nunca pode quebrar a ação que o disparou
  }
}
