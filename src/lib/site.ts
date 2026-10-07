export const site = {
  name: "AM Auto Center",
  phone: "557799642878",
  phoneDisplay: "(77) 9964-2878",
  street: "BR-135, 16 - Vila Projeto",
  city: "Formosa do Rio Preto",
  state: "BA",
  zip: "47990-000",
  hours: "Abre às 08:00 e fecha às 18:00. Confirme o dia no WhatsApp.",
  instagram: "https://www.instagram.com/centeramauto/",
  maps: "https://maps.google.com/maps?ftid=0x9334b8bf912a8d29:0x14dd12bfb4d114c2&gl=br",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};
 
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
  { id: "bateria", title: "Bateria", text: "Carro não pega de manhã? Testamos e trocamos a bateria.", msg: "Olá! Preciso testar ou trocar a bateria." },
] as const;
