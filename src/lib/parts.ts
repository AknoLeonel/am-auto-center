export type VehicleId = "moto" | "carro" | "suv" | "caminhao";

export const vehicles: { id: VehicleId; label: string; hint: string }[] = [
  { id: "carro", label: "Carro", hint: "Hatch, sedã e utilitários" },
  { id: "moto", label: "Moto", hint: "Todas as cilindradas" },
  { id: "suv", label: "SUV", hint: "SUVs e picapes" },
  { id: "caminhao", label: "Caminhão", hint: "Leves, médios e pesados" },
];

export const vehicleLabel = (id: VehicleId) => vehicles.find((v) => v.id === id)?.label ?? id;

export type Part = {
  id: string;
  name: string;
  category: string;
  vehicles: VehicleId[];
  detail?: string;
};

const ALL: VehicleId[] = ["moto", "carro", "suv", "caminhao"];
const CS: VehicleId[] = ["carro", "suv"];
const CSC: VehicleId[] = ["carro", "suv", "caminhao"];

// Lista de exemplo. Troque, apague ou acrescente peças conforme o estoque real.
export const parts: Part[] = [
  { id: "pastilha-freio", name: "Pastilha de freio", category: "Freios", vehicles: ALL },
  { id: "disco-freio", name: "Disco de freio", category: "Freios", vehicles: ALL },
  { id: "fluido-freio", name: "Fluido de freio", category: "Freios", vehicles: ALL },
  { id: "lona-freio", name: "Lona de freio", category: "Freios", vehicles: CSC },

  { id: "oleo-motor", name: "Óleo de motor", category: "Motor e filtros", vehicles: ALL, detail: "Informe a viscosidade ou o modelo do veículo" },
  { id: "filtro-oleo", name: "Filtro de óleo", category: "Motor e filtros", vehicles: ALL },
  { id: "filtro-ar", name: "Filtro de ar", category: "Motor e filtros", vehicles: ALL },
  { id: "filtro-combustivel", name: "Filtro de combustível", category: "Motor e filtros", vehicles: CSC },
  { id: "filtro-cabine", name: "Filtro do ar-condicionado", category: "Motor e filtros", vehicles: CSC },
  { id: "vela", name: "Vela de ignição", category: "Motor e filtros", vehicles: ["moto", "carro", "suv"] },
  { id: "correia-dentada", name: "Kit de correia dentada", category: "Motor e filtros", vehicles: CS },
  { id: "aditivo", name: "Aditivo de radiador", category: "Motor e filtros", vehicles: CSC },

  { id: "amortecedor", name: "Amortecedor", category: "Suspensão e direção", vehicles: ALL },
  { id: "bieleta", name: "Bieleta", category: "Suspensão e direção", vehicles: CS },
  { id: "terminal-direcao", name: "Terminal de direção", category: "Suspensão e direção", vehicles: CSC },
  { id: "pivo", name: "Pivô de suspensão", category: "Suspensão e direção", vehicles: CS },
  { id: "bucha", name: "Buchas e coxins", category: "Suspensão e direção", vehicles: CSC },
  { id: "rolamento-roda", name: "Rolamento de roda", category: "Suspensão e direção", vehicles: ALL },
  { id: "retentor-bengala", name: "Retentor de bengala", category: "Suspensão e direção", vehicles: ["moto"] },

  { id: "bateria", name: "Bateria", category: "Elétrica", vehicles: ALL, detail: "Informe o modelo e o ano do veículo" },
  { id: "lampada-farol", name: "Lâmpada de farol", category: "Elétrica", vehicles: ALL },
  { id: "palheta", name: "Palhetas do limpador", category: "Elétrica", vehicles: CSC },

  { id: "pneu", name: "Pneu", category: "Pneus e rodas", vehicles: ALL, detail: "Informe a medida (ex.: 175/70 R14)" },
  { id: "camara", name: "Câmara de ar", category: "Pneus e rodas", vehicles: ["moto", "caminhao"] },

  { id: "kit-embreagem", name: "Kit de embreagem", category: "Transmissão", vehicles: CSC },
  { id: "oleo-cambio", name: "Óleo de câmbio", category: "Transmissão", vehicles: CSC },
  { id: "kit-relacao", name: "Kit relação (corrente e coroa)", category: "Transmissão", vehicles: ["moto"] },
  { id: "cabo-moto", name: "Cabo de acelerador ou embreagem", category: "Transmissão", vehicles: ["moto"] },
];
