import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { PecaForm } from "@/components/PecaForm";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { arquivarPeca } from "../actions";
import { btnGhost } from "@/components/ui";

export default async function EditarPeca({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("pecas_estoque").select("id,nome,codigo,qtd,minimo,custo,preco,ativo").eq("id", id).maybeSingle();
  if (!data) notFound();
  const peca = { ...data, qtd: Number(data.qtd), minimo: Number(data.minimo), custo: Number(data.custo), preco: Number(data.preco) };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-4xl font-bold">Editar peça</h1>
      <PecaForm peca={peca} />
      <form action={arquivarPeca} className="mt-4">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="ativo" value={data.ativo ? "0" : "1"} />
        <SubmitButton pendente="..." className={`${btnGhost} w-full`}>{data.ativo ? "Arquivar peça (some das listas)" : "Reativar peça"}</SubmitButton>
      </form>
    </div>
  );
}
