"use client";
import { useState } from "react";
import { vehicles, vehicleLabel, type VehicleId } from "@/lib/parts";
import { wa } from "@/lib/site";
import { WhatsAppIcon } from "./WhatsAppIcon";

export function Towing() {
  const [v, setV] = useState<VehicleId>("carro");
  const [model, setModel] = useState("");
  const [loc, setLoc] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");

  function locate() {
    if (!navigator.geolocation) return setStatus("err");
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLoc(`https://maps.google.com/?q=${p.coords.latitude.toFixed(6)},${p.coords.longitude.toFixed(6)}`);
        setStatus("ok");
      },
      () => setStatus("err"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const msg =
    `Olá! Preciso de guincho.\n\nVeículo: ${vehicleLabel(v)}${model ? ` (${model})` : ""}\n` +
    (loc ? `Minha localização: ${loc}\n` : "Vou informar minha localização aqui na conversa.\n") +
    "\nPode me informar o prazo e o valor?";

  return (
    <section id="guincho" className="bg-asphalt px-4 py-14 text-white lg:py-20">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12">
        <div>
          <h2 className="font-display text-4xl font-extrabold leading-none sm:text-6xl">
            Quebrou no caminho? A gente busca.
          </h2>
          <p className="mt-4 max-w-xl text-lg text-white/80">
            Guincho para carro, moto, SUV e caminhão. Envie sua localização pelo WhatsApp e confirmamos o atendimento, o prazo e o valor.
          </p>
          <div className="mt-6 max-w-xl rounded-lg border border-white/15 p-4">
            <h3 className="font-display text-2xl font-bold">Enquanto espera, com segurança</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-white/75">
              <li>Ligue o pisca-alerta e, se puder, saia do veículo com cuidado.</li>
              <li>Posicione o triângulo de sinalização a uma distância segura.</li>
              <li>Fique longe da pista, atrás do guard-rail ou no acostamento.</li>
            </ul>
          </div>
        </div>

        <div className="rounded-xl border-t-[6px] border-signal bg-white p-5 text-ink shadow-xl sm:p-6">
          <h3 className="font-display text-3xl font-bold leading-none">Pedir guincho agora</h3>
          <p className="mt-2 text-sm text-mute">Informe o veículo e, se quiser, compartilhe sua localização.</p>

          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Tipo de veículo">
            {vehicles.map((x) => (
              <button key={x.id} type="button" aria-pressed={v === x.id} onClick={() => setV(x.id)}
                className={`min-h-11 rounded-full border-2 px-4 text-[15px] font-semibold ${v === x.id ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-ink"}`}>
                {x.label}
              </button>
            ))}
          </div>

          <label htmlFor="g-modelo" className="mb-1 mt-4 block text-sm font-semibold">Modelo do veículo (opcional)</label>
          <input id="g-modelo" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Ex.: Hilux 2018"
            className="w-full rounded-lg border-2 border-line bg-white px-4 py-3 text-base outline-none focus:border-brand" />

          <button type="button" onClick={locate} disabled={status === "loading"}
            className="mt-3 flex min-h-12 w-full items-center justify-center rounded-lg border-2 border-brand px-4 font-bold text-brand hover:bg-brand hover:text-white disabled:opacity-60">
            {status === "loading" ? "Buscando localização..." : status === "ok" ? "Localização incluída ✓" : "Incluir minha localização"}
          </button>
          {status === "err" && (
            <p className="mt-2 text-sm text-red-700">Não foi possível obter a localização. Você pode informá-la na conversa do WhatsApp.</p>
          )}

          <a href={wa(msg)} target="_blank" rel="noopener"
            className="mt-3 flex min-h-13 w-full items-center justify-center gap-2 rounded-lg bg-wa px-6 py-3.5 text-lg font-bold text-white hover:brightness-110">
            <WhatsAppIcon /> Pedir guincho no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
