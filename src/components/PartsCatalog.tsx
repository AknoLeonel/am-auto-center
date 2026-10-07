"use client";
import { useEffect, useMemo, useState } from "react";
import { parts, vehicles, vehicleLabel, type VehicleId } from "@/lib/parts";
import { wa } from "@/lib/site";
import { registrarPedido } from "@/lib/pedidos";
import { WhatsAppIcon } from "./WhatsAppIcon";

type Line = { key: string; name: string; vehicle: VehicleId; qty: number };
const STORAGE = "am-pedido-v1";
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function PartsCatalog() {
  const [vehicle, setVehicle] = useState<VehicleId>("carro");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todas");
  const [cart, setCart] = useState<Line[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", modelo: "", obs: "" });

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE);
      if (s) setCart(JSON.parse(s));
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE, JSON.stringify(cart)); } catch {}
  }, [cart, ready]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", esc); };
  }, [open]);

  const forVehicle = useMemo(() => parts.filter((p) => p.vehicles.includes(vehicle)), [vehicle]);
  const cats = useMemo(() => ["Todas", ...Array.from(new Set(forVehicle.map((p) => p.category)))], [forVehicle]);
  const list = useMemo(() => {
    const nq = norm(q);
    return forVehicle.filter(
      (p) => (cat === "Todas" || p.category === cat) && (!nq || norm(`${p.name} ${p.category} ${p.detail ?? ""}`).includes(nq))
    );
  }, [forVehicle, cat, q]);

  const total = cart.reduce((n, l) => n + l.qty, 0);
  const qtyOf = (id: string) => cart.find((l) => l.key === `${id}:${vehicle}`)?.qty ?? 0;

  const change = (key: string, name: string, v: VehicleId, delta: number) =>
    setCart((c) => {
      const found = c.find((l) => l.key === key);
      if (!found) return delta > 0 ? [...c, { key, name, vehicle: v, qty: 1 }] : c;
      return c.map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l)).filter((l) => l.qty > 0);
    });

  useEffect(() => { if (open && cart.length === 0) setOpen(false); }, [open, cart.length]);

  const orderMsg =
    "Olá! Gostaria de fazer o pedido das seguintes peças:\n\n" +
    cart.map((l) => `• ${l.qty}x ${l.name} (${vehicleLabel(l.vehicle)})`).join("\n") +
    "\n\n" +
    (form.modelo ? `Veículo: ${form.modelo}\n` : "") +
    (form.nome ? `Nome: ${form.nome}\n` : "") +
    (form.obs ? `Observações: ${form.obs}\n` : "") +
    "\nPode me informar valores e disponibilidade?";

  const searchMsg = `Olá! Procuro ${q ? `a peça "${q}"` : "uma peça"} para ${vehicleLabel(vehicle).toLowerCase()}. Vocês têm?`;

  const input = "w-full rounded-lg border-2 border-line bg-white px-4 py-3 text-base text-ink outline-none focus:border-brand";

  return (
    <section id="pecas" className="px-4 py-14 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-4xl font-bold sm:text-5xl">Peças para o seu veículo</h2>
        <p className="mt-2 max-w-xl text-mute">
          Escolha o tipo de veículo, monte sua lista e envie o pedido pelo WhatsApp. Respondemos com disponibilidade e valores.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Tipo de veículo">
          {vehicles.map((v) => {
            const on = vehicle === v.id;
            return (
              <button key={v.id} type="button" aria-pressed={on}
                onClick={() => { setVehicle(v.id); setCat("Todas"); }}
                className={`rounded-lg border-2 px-4 py-3 text-left transition-colors ${on ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand"}`}>
                <span className="block font-display text-2xl font-bold leading-none">{v.label}</span>
                <span className={`mt-1 block text-xs ${on ? "text-white/80" : "text-mute"}`}>{v.hint}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <label htmlFor="busca" className="sr-only">Buscar peça</label>
          <input id="busca" type="search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar peça (ex.: pastilha, filtro de óleo)" className={input} />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Categorias">
          {cats.map((c) => (
            <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}
              className={`shrink-0 rounded-full border-2 px-4 py-2 text-sm font-semibold ${cat === c ? "border-asphalt bg-asphalt text-white" : "border-line bg-white hover:border-asphalt"}`}>
              {c}
            </button>
          ))}
        </div>

        <p className="mt-5 text-sm text-mute" aria-live="polite">
          {list.length} {list.length === 1 ? "peça" : "peças"} para {vehicleLabel(vehicle).toLowerCase()}
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => {
            const n = qtyOf(p.id);
            const key = `${p.id}:${vehicle}`;
            return (
              <article key={p.id} className="flex flex-col rounded-md border border-line bg-white p-4">
                <p className="text-xs font-semibold text-brand">{p.category}</p>
                <h3 className="mt-0.5 font-display text-2xl font-bold leading-tight">{p.name}</h3>
                {p.detail && <p className="mt-1 text-sm text-mute">{p.detail}</p>}
                <div className="mt-auto pt-4">
                  {n === 0 ? (
                    <button type="button" onClick={() => change(key, p.name, vehicle, 1)}
                      className="min-h-11 w-full rounded-lg bg-brand px-4 font-bold text-white hover:brightness-110">
                      Adicionar ao pedido
                    </button>
                  ) : (
                    <div className="flex min-h-11 items-center justify-between rounded-lg border-2 border-brand">
                      <button type="button" aria-label={`Diminuir ${p.name}`} onClick={() => change(key, p.name, vehicle, -1)} className="h-11 w-12 text-xl font-bold text-brand">−</button>
                      <span className="font-bold" aria-live="polite">{n} no pedido</span>
                      <button type="button" aria-label={`Aumentar ${p.name}`} onClick={() => change(key, p.name, vehicle, 1)} className="h-11 w-12 text-xl font-bold text-brand">+</button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-md border border-dashed border-brand bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-2xl font-bold">Não encontrou a peça?</h3>
            <p className="text-mute">Mande o nome ou uma foto pelo WhatsApp e procuramos para você.</p>
          </div>
          <a href={wa(searchMsg)} target="_blank" rel="noopener"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-wa px-5 font-bold text-white hover:brightness-110">
            <WhatsAppIcon /> Perguntar no WhatsApp
          </a>
        </div>
      </div>

      {total > 0 && !open && (
        <button type="button" onClick={() => setOpen(true)}
          style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          className="fixed left-4 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-brand px-5 font-bold text-white shadow-xl hover:brightness-110">
          Meu pedido <span className="rounded-full bg-white px-2 py-0.5 text-sm text-brand">{total}</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-stretch md:justify-end" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Meu pedido" onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-white text-ink md:max-h-none md:max-w-md md:rounded-none">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h3 className="font-display text-3xl font-bold">Meu pedido</h3>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="h-10 w-10 text-2xl">×</button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="divide-y divide-line">
                {cart.map((l) => (
                  <li key={l.key} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-semibold">{l.name}</p>
                      <p className="text-sm text-mute">{vehicleLabel(l.vehicle)}</p>
                    </div>
                    <div className="flex items-center rounded-lg border-2 border-line">
                      <button type="button" aria-label={`Diminuir ${l.name}`} onClick={() => change(l.key, l.name, l.vehicle, -1)} className="h-10 w-10 text-lg font-bold">−</button>
                      <span className="w-6 text-center font-bold">{l.qty}</span>
                      <button type="button" aria-label={`Aumentar ${l.name}`} onClick={() => change(l.key, l.name, l.vehicle, 1)} className="h-10 w-10 text-lg font-bold">+</button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-4 space-y-3">
                <div>
                  <label htmlFor="f-modelo" className="mb-1 block text-sm font-semibold">Modelo e ano do veículo</label>
                  <input id="f-modelo" className={input} placeholder="Ex.: Gol 2015" value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="f-nome" className="mb-1 block text-sm font-semibold">Seu nome</label>
                  <input id="f-nome" className={input} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="f-obs" className="mb-1 block text-sm font-semibold">Observações</label>
                  <textarea id="f-obs" rows={2} className={input} placeholder="Medida do pneu, lado, marca preferida..." value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="border-t border-line px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
              <a href={wa(orderMsg)} target="_blank" rel="noopener" onClick={() => registrarPedido({ tipo: "pecas", nome: form.nome, veiculo: form.modelo, mensagem: orderMsg })}
                className="flex min-h-13 w-full items-center justify-center gap-2 rounded-lg bg-wa px-6 py-3.5 text-lg font-bold text-white hover:brightness-110">
                <WhatsAppIcon /> Enviar pedido no WhatsApp
              </a>
              <button type="button" onClick={() => { setCart([]); setOpen(false); }} className="mt-2 w-full py-2 text-sm font-semibold text-mute underline">
                Limpar pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
