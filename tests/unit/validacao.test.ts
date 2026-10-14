import { describe, expect, it } from "vitest";
import { agendaSchema, garantiaSchema, itemSchema, novaOSSchema, pagamentoSchema, pecaSchema, placaSchema, primeiroErro, statusSchema } from "@/lib/validacao";

const uuid = () => crypto.randomUUID();

describe("placa", () => {
  it("aceita as duas formas", () => { expect(placaSchema.parse("abc-1d23")).toBe("ABC1D23"); expect(placaSchema.parse("ABC1234")).toBe("ABC1234"); });
  it("exige 7 caracteres", () => { const r = placaSchema.safeParse("ab1"); expect(r.success).toBe(false); expect(primeiroErro(r.error!)).toBe("Digite a placa completa, com 7 caracteres."); });
});

describe("nova OS", () => {
  const base = { placa: "abc-1d23", nome: " João ", telefone: "(77) 99964-2878", tipo: "x", modelo: "", ano: "2015", km: "85.500", defeito: "" };
  it("normaliza tudo", () => {
    expect(novaOSSchema.parse(base)).toMatchObject({ placa: "ABC1D23", nome: "João", telefone: "77999642878", tipo: "carro", ano: 2015, km: 85500 });
  });
  it("telefone incompleto", () => expect(novaOSSchema.safeParse({ ...base, telefone: "123" }).success).toBe(false));
  it("telefone vazio é permitido", () => expect(novaOSSchema.safeParse({ ...base, telefone: "" }).success).toBe(true));
  it("ano fora da faixa vira nulo", () => expect(novaOSSchema.parse({ ...base, ano: "1800" }).ano).toBeNull());
  it("tipo inválido cai em carro", () => expect(novaOSSchema.parse({ ...base, tipo: "nave" }).tipo).toBe("carro"));
});

describe("item da OS", () => {
  const base = { osId: uuid(), pecaId: "", tipo: "peca", descricao: "Pastilha", qtd: "2", valor: "1.500,50" };
  it("converte números", () => expect(itemSchema.parse(base)).toMatchObject({ qtd: 2, valor: 1500.5, pecaId: null }));
  it("quantidade vazia vira 1", () => expect(itemSchema.parse({ ...base, qtd: "" }).qtd).toBe(1));
  it("descrição obrigatória", () => expect(primeiroErro(itemSchema.safeParse({ ...base, descricao: "  " }).error!)).toBe("Descreva o serviço ou a peça."));
  it("tipo inválido", () => expect(itemSchema.safeParse({ ...base, tipo: "x" }).success).toBe(false));
  it("peça do estoque precisa ser uuid", () => expect(itemSchema.safeParse({ ...base, pecaId: "123" }).success).toBe(false));
});

describe("peça do estoque", () => {
  it("lê preços em pt-BR", () => expect(pecaSchema.parse({ id: "", nome: "Pastilha", codigo: "", qtd: "10", minimo: "2", custo: "45,90", preco: "89,90" })).toMatchObject({ id: null, custo: 45.9, preco: 89.9, qtd: 10 }));
  it("nome obrigatório", () => expect(primeiroErro(pecaSchema.safeParse({ id: "", nome: "", codigo: "", qtd: "1", minimo: "0", custo: "0", preco: "0" }).error!)).toBe("Informe o nome da peça."));
});

describe("agenda (horário da Bahia, UTC-3)", () => {
  const base = { inicio: "2026-10-12T09:30", descricao: "Freios", nome: "", telefone: "", placa: "abc-1d23", mecanicoId: "" };
  it("09:30 na Bahia é 12:30 UTC", () => expect(agendaSchema.parse(base).inicio.toISOString()).toBe("2026-10-12T12:30:00.000Z"));
  it("data vazia", () => expect(primeiroErro(agendaSchema.safeParse({ ...base, inicio: "" }).error!)).toBe("Informe data e hora."));
  it("data inexistente", () => expect(agendaSchema.safeParse({ ...base, inicio: "2026-13-45T25:61" }).success).toBe(false));
});

describe("pagamento e garantia", () => {
  it("valor em pt-BR", () => expect(pagamentoSchema.parse({ osId: uuid(), valor: "1.250,50", forma: "pix", obs: " ok " })).toMatchObject({ valor: 1250.5, obs: "ok" }));
  it("valor zero", () => expect(primeiroErro(pagamentoSchema.safeParse({ osId: uuid(), valor: "0", forma: "pix", obs: "" }).error!)).toBe("Informe o valor recebido."));
  it("forma 'fiado' não existe", () => expect(pagamentoSchema.safeParse({ osId: uuid(), valor: "10", forma: "fiado", obs: "" }).success).toBe(false));
  it("garantia só com os dígitos", () => expect(garantiaSchema.parse({ osId: uuid(), mecanicoId: "", garantia: "90 dias" }).garantia).toBe(90));
  it("garantia absurda", () => expect(garantiaSchema.safeParse({ osId: uuid(), mecanicoId: "", garantia: "99999" }).success).toBe(false));
});

describe("situações", () => {
  it("aceita as 7 e recusa o resto", () => {
    for (const s of ["aguardando", "diagnostico", "aprovacao", "em_servico", "pronto", "entregue", "cancelada"]) expect(statusSchema.safeParse(s).success).toBe(true);
    expect(statusSchema.safeParse("voando").success).toBe(false);
  });
});
