import { afterEach, describe, expect, it, vi } from "vitest";
import { dataValida, periodo } from "@/lib/periodo";

afterEach(() => vi.useRealTimers());

describe("períodos do financeiro", () => {
  it("7 dias = hoje e os 6 anteriores; 'mês' começa no dia 1; desconhecido vira 30", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-11T15:00:00Z"));
    expect(periodo("7")).toEqual({ chave: "7", ini: "2026-10-05", fim: "2026-10-11" });
    expect(periodo("mes")).toEqual({ chave: "mes", ini: "2026-10-01", fim: "2026-10-11" });
    expect(periodo("xx").chave).toBe("30");
    expect(periodo(undefined).ini).toBe("2026-09-12");
  });
  it("à noite na Bahia o dia ainda é o de lá", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-12T01:00:00Z")); // 22h do dia 11 na Bahia
    expect(periodo("7").fim).toBe("2026-10-11");
  });
  it("virada de ano", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2027-01-03T15:00:00Z"));
    expect(periodo("7").ini).toBe("2026-12-28");
  });
  it("validação de data", () => { expect(dataValida("2026-10-11")).toBe(true); expect(dataValida("2026-13-45")).toBe(false); expect(dataValida("abc")).toBe(false); expect(dataValida(undefined)).toBe(false); });
});
