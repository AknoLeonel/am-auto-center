export const CHECKLIST = {
  entrada: {
    titulo: "Checklist de entrada",
    itens: [
      "Combustível e quilometragem anotados",
      "Riscos e amassados registrados",
      "Pneus e estepe conferidos",
      "Documentos do veículo",
      "Pertences retirados do interior",
      "Luzes acesas no painel anotadas",
    ],
  },
  saida: {
    titulo: "Checklist de saída",
    itens: [
      "Serviço conferido com o relato do cliente",
      "Teste de rodagem feito",
      "Peças trocadas mostradas ao cliente",
      "Níveis conferidos (óleo e água)",
      "Veículo limpo",
      "Cliente informado sobre a garantia",
    ],
  },
} as const;

export type Momento = keyof typeof CHECKLIST;
