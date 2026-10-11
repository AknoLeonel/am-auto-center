import { createClient } from "@/lib/supabase/server";
import { placaSchema } from "@/lib/validacao";
import { NovaOSForm, type VeiculoEncontrado } from "@/components/NovaOSForm";
import { input, btnPrimary } from "@/components/ui";

export default async function NovaOS({ searchParams }: { searchParams: Promise<{ placa?: string }> }) {
  const { placa: bruta = "" } = await searchParams;
  const parsed = bruta ? placaSchema.safeParse(bruta) : null;
  const placa = parsed?.success ? parsed.data : null;

  let found: VeiculoEncontrado | null = null;
  if (placa) {
    const supabase = await createClient();
    const { data } = await supabase.from("veiculos")
      .select("modelo,ano,km,clientes(nome,telefone)").eq("placa", placa).maybeSingle();
    found = (data as unknown as VeiculoEncontrado) ?? null;
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-4xl font-bold">Novo atendimento</h1>

      <form action="/painel/nova" className="mt-4" role="search">
        <label htmlFor="placa" className="mb-1 block text-sm font-semibold">Placa do veículo</label>
        <div className="flex gap-2">
          <input id="placa" name="placa" defaultValue={placa ?? bruta} maxLength={8} autoCapitalize="characters" autoComplete="off"
            placeholder="ABC1D23" className={`${input} font-display text-2xl uppercase tracking-widest`} />
          <button className={btnPrimary}>Buscar</button>
        </div>
      </form>

      {parsed && !parsed.success && <p role="alert" className="mt-3 text-sm text-red-700">{parsed.error.issues[0].message}</p>}

      {placa && <NovaOSForm key={placa} placa={placa} found={found} />}
    </div>
  );
}
