import { createClient } from "@/lib/supabase/server";
import { gerarOrcamento } from "@/app/painel/actions";
import { site } from "@/lib/site";
import { brl, dataBR, waTo } from "@/lib/painel";
import { SubmitButton } from "./ui/SubmitButton";
import { btnPrimary, btnWa, card } from "./ui";

const ROTULO: Record<string, [string, string]> = {
  pendente: ["Aguardando o cliente", "bg-amber-100 text-amber-900"],
  aprovado: ["Aprovado", "bg-wa text-white"],
  recusado: ["Recusado", "bg-red-700 text-white"],
  substituido: ["Substituído", "bg-line"],
};

export async function OrcamentoOS({ osId, nome, telefone, veiculo, qtdItens, totalAtual }: {
  osId: string; nome: string; telefone: string | null; veiculo: string; qtdItens: number; totalAtual: number;
}) {
  const supabase = await createClient();
  const { data } = await supabase.from("orcamentos")
    .select("token,status,total,aceite_nome,respondido_em,criado_em").eq("os_id", osId)
    .order("criado_em", { ascending: false }).limit(1);
  const q = data?.[0];
  const link = q ? `${site.url}/o/${q.token}` : null;
  const msg = q && link
    ? `Olá, ${nome.split(" ")[0]}! Preparei o orçamento do seu ${veiculo} na AM Auto Center (${brl(Number(q.total))}). ` +
      `Veja os detalhes e aprove por aqui, sem precisar ligar: ${link}`
    : "";
  // Itens mudaram depois do orçamento: o cliente aprovou (ou vai ver) outro valor.
  const mudou = !!q && (q.status === "aprovado" || q.status === "pendente") && Math.abs(Number(q.total) - totalAtual) > 0.005;

  return (
    <section className={card}>
      <h2 className="font-display text-3xl font-bold">Orçamento digital</h2>
      <p className="text-sm text-mute">O cliente vê os itens no celular e aprova com um toque. O aceite fica registrado.</p>

      {q && (
        <div className="mt-3 rounded-md bg-paper p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-mute">{dataBR(q.criado_em)} · {brl(Number(q.total))}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${ROTULO[q.status][1]}`}>{ROTULO[q.status][0]}</span>
          </div>
          {q.aceite_nome && q.respondido_em && <p className="mt-1 text-sm">Por {q.aceite_nome} em {dataBR(q.respondido_em)}.</p>}
          {q.status === "pendente" && link && <p className="mt-2 break-all text-sm text-mute">{link}</p>}
        </div>
      )}

      {mudou && q && (
        <div role="alert" className="mt-3 rounded-md border-l-[6px] border-l-amber-500 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-bold">
            {q.status === "aprovado" ? "O total mudou depois da aprovação" : "Os itens mudaram depois que o link foi gerado"}
          </p>
          <p>
            {q.status === "aprovado" ? "O cliente aprovou" : "O link mostra"} {brl(Number(q.total))}; agora a ordem soma {brl(totalAtual)}.
            {" "}Gere um novo orçamento e envie para o cliente aprovar antes de cobrar a diferença.
          </p>
        </div>
      )}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {q?.status === "pendente" && link && (
          <a href={waTo(telefone, msg)} target="_blank" rel="noopener" className={btnWa}>Enviar link no WhatsApp</a>
        )}
        <form action={gerarOrcamento} className={q?.status === "pendente" ? "" : "sm:col-span-2"}>
          <input type="hidden" name="osId" value={osId} />
          <SubmitButton pendente="Gerando..." className={`${btnPrimary} w-full`}>
            {q ? "Gerar novo orçamento com os itens atuais" : "Gerar link de orçamento"}
          </SubmitButton>
        </form>
      </div>
      {qtdItens === 0 && <p className="mt-2 text-sm text-mute">Lance os serviços e peças acima antes de gerar o link.</p>}
    </section>
  );
}
