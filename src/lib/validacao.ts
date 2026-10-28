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
  pecaId: z.string().transform((s) => s || null).pipe(z.uuid().nullable()),
  tipo: z.enum(["servico", "peca"]),
  descricao: texto(200).min(1, "Descreva o serviço ou a peça."),
  qtd: z.string().transform((s) => num(s) || 1).pipe(z.number().positive().max(9999)),
  valor: z.string().transform(num).pipe(z.number().min(0, "Valor inválido.").max(10_000_000)),
});

export const statusSchema = z.enum(STATUS.map(([k]) => k) as [string, ...string[]]);
export const pedidoStatusSchema = z.enum(["novo", "em_atendimento", "concluido", "descartado"]);

// Primeira mensagem de erro de um parse, pronta para mostrar ao usuário.
export const primeiroErro = (e: z.ZodError) => e.issues[0]?.message ?? "Dados inválidos.";

const dinheiro = z.string().transform(num).pipe(z.number().min(0, "Valor inválido.").max(10_000_000));
const quantidade = z.string().transform(num).pipe(z.number().min(0, "Quantidade inválida.").max(1_000_000));

export const pecaSchema = z.object({
  id: z.string().transform((s) => s || null).pipe(z.uuid().nullable()),
  nome: texto(120).min(1, "Informe o nome da peça."),
  codigo: texto(60),
  qtd: quantidade,
  minimo: quantidade,
  custo: dinheiro,
  preco: dinheiro,
});

// "AAAA-MM-DDTHH:mm" digitado no horário da Bahia (UTC-3, sem horário de verão) vira instante UTC.
const dataHoraBahia = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Informe data e hora.")
  .transform((s) => new Date(`${s}:00-03:00`))
  .refine((d) => !Number.isNaN(d.getTime()), "Data inválida.");

export const agendaSchema = z.object({
  inicio: dataHoraBahia,
  descricao: texto(300).min(1, "Descreva o serviço."),
  nome: texto(120),
  telefone,
  placa: z.string().transform(normPlaca).pipe(z.string().max(7)),
  mecanicoId: z.string().transform((s) => s || null).pipe(z.uuid().nullable()),
});

export const garantiaSchema = z.object({
  osId: z.uuid(),
  mecanicoId: z.string().transform((s) => s || null).pipe(z.uuid().nullable()),
  garantia: z.string().transform((s) => inteiro(s) ?? 0).pipe(z.number().int().min(0).max(3650)),
});

export const pagamentoSchema = z.object({
  osId: z.uuid(),
  valor: z.string().transform(num).pipe(z.number().positive("Informe o valor recebido.").max(10_000_000)),
  forma: z.enum(["pix", "dinheiro", "debito", "credito", "transferencia"]),
  obs: texto(200),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.").optional().or(z.literal("")),
  confirmo: z.string().optional(),
});
