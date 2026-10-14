import { afterEach, describe, expect, it, vi } from "vitest";
import { brl, diaBR, hojeISO, inteiro, mesesDepois, normPlaca, num, statusLabel, waTo } from "@/lib/painel";

afterEach(() => vi.useRealTimers());

describe("num: valores digitados em pt-BR", () => {
  it.each([["1.500,00", 1500], ["12,5", 12.5], ["12.5", 12.5], ["1.500", 1500], ["1.500.000", 1500000], ["0,99", 0.99], ["  80 ", 80], ["", 0], ["abc", 0]])(
    "%j vira %j", (entrada, esperado) => expect(num(entrada)).toBe(esperado),
  );
});

describe("inteiro", () => {
  it("tira pontos e símbolos", () => { expect(inteiro("85.500")).toBe(85500); expect(inteiro("85500 km")).toBe(85500); });
  it("vazio vira nulo", () => { expect(inteiro("")).toBeNull(); expect(inteiro("km")).toBeNull(); });
});

describe("placa", () => {
  it("normaliza antiga e Mercosul", () => {
    expect(normPlaca("abc-1d23")).toBe("ABC1D23");
    expect(normPlaca(" ABC 1234 ")).toBe("ABC1234");
  });
});

describe("dinheiro e situação", () => {
  it("formata em reais", () => expect(brl(1234.5).replace(/\s/g, " ")).toBe("R$ 1.234,50"));
  it("rótulo da situação, com plano B", () => { expect(statusLabel("em_servico")).toBe("Em serviço"); expect(statusLabel("x")).toBe("x"); });
  it("dia no formato brasileiro", () => expect(diaBR("2026-10-11")).toBe("11/10/2026"));
});

describe("WhatsApp", () => {
  it("coloca o 55 e codifica o texto", () => {
    expect(waTo("(77) 99964-2878", "Olá & tchau")).toBe("https://api.whatsapp.com/send?phone=5577999642878&text=Ol%C3%A1%20%26%20tchau");
  });
  it("não repete o 55", () => expect(waTo("5577999642878", "x")).toContain("phone=5577999642878&"));
  it("sem telefone abre sem destinatário", () => expect(waTo(null, "x")).toBe("https://api.whatsapp.com/send?text=x"));
});

describe("datas no horário da Bahia (o servidor roda em UTC)", () => {
  it("às 21h30 da Bahia ainda é o mesmo dia (regressão: virava 'amanhã')", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-12T00:30:00Z")); // 21:30 do dia 11 na Bahia
    expect(hojeISO()).toBe("2026-10-11");
  });
  it("de manhã também", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-11T11:00:00Z"));
    expect(hojeISO()).toBe("2026-10-11");
  });
  it("meses depois, sem estourar o fim do mês", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-01-31T15:00:00Z"));
    expect(mesesDepois(1)).toBe("2026-02-28");
    expect(mesesDepois(5)).toBe("2026-06-30");
    expect(mesesDepois(12)).toBe("2027-01-31");
  });
});
