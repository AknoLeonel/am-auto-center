export const site = {
  name: "AM Auto Center",
  /** Número cadastrado no WhatsApp (sem o 9, como está no Instagram). */
  phone: "557799642878",
  /** Número para ligar: celular com o 9, como na placa da fachada. */
  phoneTel: "5577999642878",
  phoneDisplay: "(77) 99964-2878",
  /** Telefone fixo, como na fachada. */
  fixo: "557736162473",
  fixoDisplay: "(77) 3616-2473",
  street: "BR-135, Km 26",
  city: "Formosa do Rio Preto",
  state: "BA",
  zip: "47990-000",
  hours: "Abre às 08:00 e fecha às 18:00. Confirme o dia no WhatsApp.",
  instagram: "https://www.instagram.com/centeramauto/",
  maps: "https://maps.google.com/maps?ftid=0x9334b8bf912a8d29:0x14dd12bfb4d114c2&gl=br",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** Data da última revisão do conteúdo público (usada no sitemap; atualize quando mudar os textos). */
  conteudoAtualizadoEm: "2026-11-10",
};
 
/** Link para ligar (celular com o 9; o WhatsApp aceita o número antigo). */
export const tel = `tel:+${site.phoneTel}`;
export const telFixo = `tel:+${site.fixo}`;

/** Fotos reais da oficina (public/fotos). Troque pelos arquivos novos mantendo os nomes, ou ajuste aqui. */
export const fotos = {
  fachada: { src: "/fotos/fachada.webp", w: 507, h: 377, alt: "Fachada da AM Auto Center na BR-135, com carros no pátio" },
  equipe: { src: "/fotos/equipe.webp", w: 866, h: 486, alt: "Equipe da AM Auto Center, de uniforme azul, na loja de peças" },
  alinhamento: { src: "/fotos/alinhamento.webp", w: 515, h: 354, alt: "Caminhonete na rampa de alinhamento da oficina" },
  utv: { src: "/fotos/utv-elevador.webp", w: 500, h: 707, alt: "UTV Can-Am no elevador de alinhamento" },
  elevador: { src: "/fotos/mecanico-elevador.webp", w: 388, h: 478, alt: "Mecânico trabalhando em uma picape no elevador" },
  guincho: { src: "/fotos/guincho.webp", w: 500, h: 377, alt: "Guincho da AM Auto Center transportando uma van na BR-135" },
} as const;

export const wa = (text: string) =>
  `https://api.whatsapp.com/send?phone=${site.phone}&text=${encodeURIComponent(text)}`;
 
export const defaultMsg =
  "Olá! Vim pelo site da AM Auto Center e gostaria de um orçamento.";
 
export const services = [
  { id: "diag", title: "Diagnóstico de motor", text: "Luz de injeção acesa, falha ou consumo alto? Achamos a causa antes de trocar peça.", msg: "Olá! Preciso de diagnóstico de motor." },
  { id: "freios", title: "Freios", text: "Pastilhas, discos e fluido. Pedal mole ou barulho ao frear: venha agora.", msg: "Olá! Preciso revisar os freios do meu carro." },
  { id: "pneus", title: "Pneus", text: "Troca, calibragem e avaliação do desgaste para mais segurança e economia.", msg: "Olá! Quero orçamento de pneus." },
  { id: "susp", title: "Suspensão e direção", text: "Batidas na estrada, volante repuxando ou vibração? Reparamos.", msg: "Olá! Meu carro precisa de reparo de suspensão e direção." },
  { id: "oleo", title: "Troca de óleo", text: "Serviço rápido para proteger o motor e evitar problemas maiores.", msg: "Olá! Quero fazer troca de óleo." },
  { id: "alinh", title: "Alinhamento e balanceamento", text: "Volante torto, carro puxando ou vibração na estrada? Alinhamos carro, caminhonete e UTV.", msg: "Olá! Quero fazer alinhamento e balanceamento." },
  { id: "eletrica", title: "Elétrica e injeção", text: "Luz no painel, falha na partida ou pane elétrica? Testamos o sistema com equipamento.", msg: "Olá! Preciso de serviço de elétrica ou injeção eletrônica." },
  { id: "bateria", title: "Bateria", text: "Carro não pega de manhã? Testamos e trocamos a bateria.", msg: "Olá! Preciso testar ou trocar a bateria." },
] as const;
