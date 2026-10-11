import { site } from "./site";

// Só informações que o site já afirma. Ajuste conforme a oficina confirmar (formas de pagamento, prazos etc.).
export const faqHome = [
  { p: "Como peço um orçamento?", r: "Pelo WhatsApp: descreva o problema e, se puder, envie foto ou vídeo. Nossa equipe responde com valor e prazo. O orçamento é sem compromisso." },
  { p: "Onde fica a AM Auto Center?", r: `Na ${site.street}, em ${site.city} - ${site.state}. Fácil de achar para quem mora aqui e para quem está de passagem pela BR-135.` },
  { p: "Qual é o horário de atendimento?", r: `${site.hours}` },
  { p: "Vocês fazem guincho?", r: "Sim. Atendemos carro, moto, SUV e caminhão. Envie sua localização pelo WhatsApp e confirmamos o atendimento, o prazo e o valor." },
  { p: "Posso acompanhar o conserto do meu carro?", r: "Sim. Podemos enviar um link para você ver, pelo celular, em que etapa está o seu carro: aguardando, diagnóstico, em serviço ou pronto. Quando houver orçamento, você também aprova por esse link." },
  { p: "Vocês vendem peças?", r: "Sim. Monte a lista de peças no site e envie pelo WhatsApp; respondemos com disponibilidade e valores." },
];
