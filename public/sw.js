// Service worker da AM Auto Center.
// - Arquivos estáticos (hash no nome): cache primeiro.
// - Páginas do painel: rede primeiro; se não houver sinal, mostra a última versão vista.
// - Sem sinal e sem cópia: página /offline.
// - Nunca guarda páginas com link-segredo (/o, /acompanhar), a API nem os relatórios.
// - Push: mostra a notificação e abre a tela certa ao tocar.
const VERSAO = "am-v4";
const ESTATICO = `${VERSAO}-estatico`;
const PAGINAS = `${VERSAO}-paginas`;
const OFFLINE = "/offline";
const MAX_PAGINAS = 60;

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(ESTATICO);
    const r = await fetch(OFFLINE, { cache: "reload" });
    const html = await r.clone().text();
    await cache.put(OFFLINE, r);
    // A página offline precisa do CSS/JS dela, senão abre sem estilo quando estiver sem sinal.
    const arquivos = [...new Set(html.match(/\/_next\/static\/[^"'\\\s)]+/g) ?? [])];
    await Promise.all(arquivos.map((u) => cache.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (!k.startsWith(VERSAO)) await caches.delete(k);
    await self.clients.claim();
  })());
});

const cacheavel = (p) => p === "/" || (p.startsWith("/painel") && !p.startsWith("/painel/relatorios/exportar"));

async function cacheFirst(req) {
  const cache = await caches.open(ESTATICO);
  const hit = await cache.match(req);
  if (hit) return hit;
  const r = await fetch(req);
  if (r.ok) cache.put(req, r.clone());
  return r;
}

async function limitar(cache) {
  const chaves = await cache.keys();
  for (let i = 0; i < chaves.length - MAX_PAGINAS; i++) await cache.delete(chaves[i]);
}

async function paginaRedePrimeiro(req) {
  const cache = await caches.open(PAGINAS);
  try {
    const r = await Promise.race([
      fetch(req),
      new Promise((_, no) => setTimeout(() => no(new Error("timeout")), 6000)),
    ]);
    // Redirecionamentos (ex.: para /login) e erros não entram no cache.
    if (r.ok && !r.redirected) { await cache.put(req, r.clone()); await limitar(cache); }
    return r;
  } catch {
    return (await cache.match(req)) ?? (await caches.match(OFFLINE)) ?? Response.error();
  }
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/pwa-icon/")) {
    e.respondWith(cacheFirst(req));
  } else if (req.mode === "navigate") {
    e.respondWith(cacheavel(url.pathname)
      ? paginaRedePrimeiro(req)
      : fetch(req).catch(() => caches.match(OFFLINE)));
  }
});

// Ao sair da conta, apaga as páginas guardadas (dados da oficina).
self.addEventListener("message", (e) => {
  if (e.data === "limpar") e.waitUntil(caches.delete(PAGINAS));
});

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data.json(); } catch {}
  e.waitUntil(self.registration.showNotification(d.titulo || "AM Auto Center", {
    body: d.corpo || "", icon: "/pwa-icon/192", badge: "/pwa-icon/192", tag: d.tag, data: { url: d.url || "/painel" },
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const alvo = String(e.notification.data?.url || "/painel");
  const url = alvo.startsWith("/") && !alvo.startsWith("//") ? alvo : "/painel"; // só rotas do próprio site
  e.waitUntil((async () => {
    const abas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const aba of abas) {
      if ("focus" in aba) { await aba.focus(); if ("navigate" in aba) await aba.navigate(url).catch(() => {}); return; }
    }
    await self.clients.openWindow(url);
  })());
});
