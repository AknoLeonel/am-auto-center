"use client";
import { useEffect, useState } from "react";
import { vehicles, vehicleLabel, type VehicleId } from "@/lib/parts";
import { services, wa } from "@/lib/site";
import { hojeISO } from "@/lib/painel";
import { registrarPedido } from "@/lib/pedidos";
import { WhatsAppIcon } from "./WhatsAppIcon";

export type Modo = "guincho" | "orcamento" | "agendar";
const MODOS: [Modo, string][] = [["guincho", "Guincho"], ["orcamento", "Orçamento"], ["agendar", "Agendar"]];
const PROBLEMAS = ["Não liga", "Pneu", "Batida", "Pane elétrica", "Esquentou", "Outro"];
const PERIODOS = ["Manhã", "Tarde"];

const chip = (on: boolean) =>
  `min-h-11 rounded-full border-2 px-4 text-[15px] font-semibold ${on ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-ink"}`;
const campo = "w-full rounded-lg border-2 border-line bg-white px-4 py-3 text-base outline-none focus:border-brand";
const rotulo = "mb-1 mt-4 block text-sm font-semibold";

const diaBR = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
};
const linhas = (l: (string | false | null | undefined)[]) => l.filter(Boolean).join("\n");

// Pedido rápido do site: guincho, orçamento ou agendamento, sempre terminando no WhatsApp com a mensagem pronta.
// A aba pode ser aberta por link: /#pedido-guincho, /#pedido-orcamento ou /#pedido-agendar.
export function PedidoRapido({ inicial = "guincho", servico }: { inicial?: Modo; servico?: string }) {
  const [modo, setModo] = useState<Modo>(inicial);
  const [nome, setNome] = useState("");
  const [modelo, setModelo] = useState("");
  // guincho
  const [veiculo, setVeiculo] = useState<VehicleId>("carro");
  const [problema, setProblema] = useState<string | null>(null);
  const [referencia, setReferencia] = useState("");
  const [loc, setLoc] = useState<string | null>(null);
  const [gps, setGps] = useState<"idle" | "loading" | "ok" | "err">("idle");
  // orçamento e agenda
  const [escolhidos, setEscolhidos] = useState<string[]>(servico ? [servico] : []);
  const [detalhe, setDetalhe] = useState("");
  const [dia, setDia] = useState("");
  const [periodo, setPeriodo] = useState("Manhã");

  useEffect(() => {
    const ler = () => {
      const m = location.hash.match(/^#pedido-(guincho|orcamento|agendar)$/);
      if (m) setModo(m[1] as Modo);
    };
    ler();
    window.addEventListener("hashchange", ler);
    return () => window.removeEventListener("hashchange", ler);
  }, []);

  function localizar() {
    if (!navigator.geolocation) return setGps("err");
    setGps("loading");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLoc(`https://maps.google.com/?q=${p.coords.latitude.toFixed(6)},${p.coords.longitude.toFixed(6)}`);
        setGps("ok");
      },
      () => setGps("err"),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  const alternar = (t: string) => setEscolhidos((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
  const veic = modo === "guincho" ? `${vehicleLabel(veiculo)}${modelo ? ` (${modelo})` : ""}` : modelo;

  const msg =
    modo === "guincho"
      ? linhas([
          "PEDIDO DE GUINCHO (pelo site)",
          "",
          `Veículo: ${veic}`,
          problema && `Problema: ${problema}`,
          loc ? `Onde estou: ${loc}` : "Vou mandar minha localização aqui na conversa.",
          referencia && `Referência: ${referencia}`,
          nome && `Nome: ${nome}`,
          "",
          "Pode me informar o prazo e o valor?",
        ])
      : modo === "orcamento"
        ? linhas([
            "Olá! Quero um orçamento (pelo site).",
            "",
            escolhidos.length > 0 && `Serviço: ${escolhidos.join(", ")}`,
            modelo && `Veículo: ${modelo}`,
            detalhe && `O que está acontecendo: ${detalhe}`,
            nome && `Nome: ${nome}`,
          ])
        : linhas([
            "Olá! Quero agendar um serviço (pelo site).",
            "",
            `Serviço: ${escolhidos[0] ?? "Revisão / avaliação"}`,
            `Dia: ${dia ? `${diaBR(dia)}, de ${periodo.toLowerCase()}` : "a combinar"}`,
            modelo && `Veículo: ${modelo}`,
            nome && `Nome: ${nome}`,
            "",
            "Podem confirmar o horário?",
          ]);

  const enviar = () =>
    registrarPedido({
      tipo: modo === "guincho" ? "guincho" : "orcamento",
      nome: nome || undefined,
      veiculo: veic || undefined,
      mensagem: msg,
    });

  return (
    <div className="rounded-xl border-t-[6px] border-signal bg-white p-5 text-ink shadow-xl sm:p-6">
      <div role="group" aria-label="Tipo de pedido" className="grid grid-cols-3 gap-1 rounded-lg bg-paper p-1">
        {MODOS.map(([k, l]) => (
          <button key={k} type="button" aria-pressed={modo === k} onClick={() => setModo(k)}
            className={`min-h-11 rounded-md text-[15px] font-bold ${
              modo === k ? (k === "guincho" ? "bg-alerta text-white" : "bg-brand text-white") : "text-ink hover:bg-white"
            }`}>
            {l}
          </button>
        ))}
      </div>

      {modo === "guincho" && (
        <div>
          <h3 className="mt-4 font-display text-3xl font-bold leading-none">Pedir guincho agora</h3>
          <p className="mt-1 text-sm text-mute">Inclua sua localização: chegamos mais rápido.</p>
          <button type="button" onClick={localizar} disabled={gps === "loading"}
            className={`mt-4 flex min-h-13 w-full items-center justify-center gap-2 rounded-lg px-4 text-lg font-bold disabled:opacity-60 ${
              gps === "ok" ? "border-2 border-wa bg-green-50 text-wa" : "bg-alerta text-white hover:brightness-110"
            }`}>
            <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" /></svg>
            {gps === "loading" ? "Buscando localização..." : gps === "ok" ? "Localização incluída ✓" : "Usar minha localização"}
          </button>
          {gps === "err" && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              Não foi possível pegar a localização. Escreva uma referência abaixo ou mande a localização pelo WhatsApp.
            </p>
          )}
          <p className={rotulo}>Veículo</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de veículo">
            {vehicles.map((x) => (
              <button key={x.id} type="button" aria-pressed={veiculo === x.id} onClick={() => setVeiculo(x.id)} className={chip(veiculo === x.id)}>
                {x.label}
              </button>
            ))}
          </div>
          <p className={rotulo}>O que aconteceu?</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Problema">
            {PROBLEMAS.map((x) => (
              <button key={x} type="button" aria-pressed={problema === x} onClick={() => setProblema(problema === x ? null : x)} className={chip(problema === x)}>
                {x}
              </button>
            ))}
          </div>
          <label htmlFor="p-ref" className={rotulo}>Ponto de referência (opcional)</label>
          <input id="p-ref" value={referencia} onChange={(e) => setReferencia(e.target.value)} maxLength={120}
            placeholder="Ex.: BR-135, perto do posto" className={campo} />
        </div>
      )}

      {modo === "orcamento" && (
        <div>
          <h3 className="mt-4 font-display text-3xl font-bold leading-none">Pedir orçamento</h3>
          <p className="mt-1 text-sm text-mute">Escolha o serviço e conte o que está acontecendo. Sem compromisso.</p>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Serviços">
            {services.map((s) => (
              <button key={s.id} type="button" aria-pressed={escolhidos.includes(s.title)} onClick={() => alternar(s.title)} className={chip(escolhidos.includes(s.title))}>
                {s.title}
              </button>
            ))}
          </div>
          <label htmlFor="p-det" className={rotulo}>O que está acontecendo? (opcional)</label>
          <textarea id="p-det" value={detalhe} onChange={(e) => setDetalhe(e.target.value)} maxLength={500} rows={2}
            placeholder="Ex.: barulho ao frear" className={campo} />
        </div>
      )}

      {modo === "agendar" && (
        <div>
          <h3 className="mt-4 font-display text-3xl font-bold leading-none">Agendar serviço</h3>
          <p className="mt-1 text-sm text-mute">Escolha o dia e o período. Confirmamos o horário pelo WhatsApp.</p>
          <label htmlFor="p-serv" className={rotulo}>Serviço</label>
          <select id="p-serv" value={escolhidos[0] ?? ""} onChange={(e) => setEscolhidos(e.target.value ? [e.target.value] : [])} className={campo}>
            <option value="">Revisão / avaliação</option>
            {services.map((s) => <option key={s.id} value={s.title}>{s.title}</option>)}
          </select>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <label htmlFor="p-dia" className={rotulo}>Dia</label>
              <input id="p-dia" type="date" value={dia} min={hojeISO()} onChange={(e) => setDia(e.target.value)} className={campo} suppressHydrationWarning />
            </div>
            <div>
              <p className={rotulo}>Período</p>
              <div className="flex gap-2" role="group" aria-label="Período">
                {PERIODOS.map((x) => (
                  <button key={x} type="button" aria-pressed={periodo === x} onClick={() => setPeriodo(x)} className={chip(periodo === x)}>{x}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="p-mod" className={rotulo}>{modo === "guincho" ? "Modelo" : "Veículo"} (opcional)</label>
          <input id="p-mod" value={modelo} onChange={(e) => setModelo(e.target.value)} maxLength={80} placeholder="Ex.: Hilux 2018" className={campo} />
        </div>
        <div>
          <label htmlFor="p-nome" className={rotulo}>Seu nome (opcional)</label>
          <input id="p-nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} autoComplete="given-name" className={campo} />
        </div>
      </div>

      <a href={wa(msg)} target="_blank" rel="noopener" onClick={enviar} data-origem={`pedido:${modo}`}
        className="mt-5 flex min-h-13 w-full items-center justify-center gap-2 rounded-lg bg-wa px-6 py-3.5 text-lg font-bold text-white hover:brightness-110">
        <WhatsAppIcon />
        {modo === "guincho" ? "Pedir guincho no WhatsApp" : modo === "orcamento" ? "Receber orçamento no WhatsApp" : "Agendar pelo WhatsApp"}
      </a>
      <p className="mt-3 text-center text-xs text-mute">A mensagem vai pronta. Resposta direto da oficina, sem robô.</p>
    </div>
  );
}
