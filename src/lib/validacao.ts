import { z } from "zod";
import { normPlaca, num, inteiro, STATUS } from "./painel";

const texto = (max: number) => z.string().trim().max(max);

export const placaSchema = z
  .string()
  .transform(normPlaca)
  .pipe(z.string().length(7, "Digite a placa completa, com 7 caracteres."));

const telefone = z
  .string()
  .transform((s) => s.replace(/\D/g, ""))
  .refine((t) => t === "" || (t.length >= 10 && t.length <= 13), "Telefone incompleto. Use DDD + número, ex.: 77 99999-9999.");

const kmOpcional = z.string().transform((s) => inteiro(s));
const anoOpcional = z.string().transform((s) => {
  const a = inteiro(s);
  return a && a >= 1950 && a <= 2100 ? a : null;
});

export const novaOSSchema = z.object({
  placa: placaSchema,
  nome: texto(120),
  telefone,
  tipo: z.enum(["carro", "moto", "suv", "caminhao"]).catch("carro"),
  modelo: texto(80),
  ano: anoOpcional,
  km: kmOpcional,
  defeito: texto(1000),
});

export const itemSchema = z.object({
  osId: z.uuid(),
  tipo: z.enum(["servico", "peca"]),
  descricao: texto(200).min(1, "Descreva o serviço ou a peça."),
  qtd: z.string().transform((s) => num(s) || 1).pipe(z.number().positive().max(9999)),
  valor: z.string().transform(num).pipe(z.number().min(0, "Valor inválido.").max(10_000_000)),
});

export const statusSchema = z.enum(STATUS.map(([k]) => k) as [string, ...string[]]);
export const pedidoStatusSchema = z.enum(["novo", "em_atendimento", "concluido", "descartado"]);

// Primeira mensagem de erro de um parse, pronta para mostrar ao usuário.
export const primeiroErro = (e: z.ZodError) => e.issues[0]?.message ?? "Dados inválidos.";
