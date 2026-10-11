// Conteúdo das páginas de serviço (SEO local). Texto informativo e genérico de propósito:
// não promete preço, prazo, marca nem garantia. REVISE com a oficina antes de publicar e ajuste ao que ela realmente faz.
export type Servico = {
  slug: string;
  /** id do serviço em `services` (site.ts) usado nos cartões da home; guincho não tem */
  id?: string;
  nome: string;
  h1: string;
  metaTitle: string;
  metaDesc: string;
  intro: string;
  sinaisTitulo: string;
  sinais: string[];
  fazemos: string[];
  dica?: { titulo: string; texto: string };
  faq: { p: string; r: string }[];
  msg: string;
  relacionados: string[];
};

export const CIDADE = "Formosa do Rio Preto";

export const servicosDetalhe: Servico[] = [
  {
    slug: "freios",
    id: "freios",
    nome: "Freios",
    h1: "Revisão e conserto de freios em Formosa do Rio Preto",
    metaTitle: "Freios em Formosa do Rio Preto - BA | AM Auto Center",
    metaDesc: "Pedal mole, barulho ao frear ou carro puxando? Revisão de freios na BR-135, em Formosa do Rio Preto (BA). Peça seu orçamento pelo WhatsApp.",
    intro:
      "O freio é o item de segurança que você mais usa. Na AM Auto Center, na BR-135, avaliamos pastilhas, discos e fluido para você saber o que realmente precisa ser trocado, antes de gastar com peça.",
    sinaisTitulo: "Quando procurar a oficina",
    sinais: [
      "Pedal do freio mais baixo, \"mole\" ou que afunda ao pisar.",
      "Chiado, rangido ou barulho metálico ao frear.",
      "Carro puxando para um lado durante a frenagem.",
      "Vibração no pedal ou no volante quando você freia.",
      "Luz de freio ou de ABS acesa no painel.",
      "Nível do fluido de freio abaixo do mínimo no reservatório.",
    ],
    fazemos: [
      "Inspeção do desgaste de pastilhas, lonas e discos.",
      "Verificação do nível e da condição do fluido de freio.",
      "Conferência de mangueiras e conexões em busca de vazamentos.",
      "Teste de frenagem depois do serviço.",
    ],
    dica: {
      titulo: "Barulho no freio não some sozinho",
      texto: "O ruído costuma indicar desgaste. Deixar para depois pode danificar o disco e encarecer o reparo, além de comprometer a sua segurança.",
    },
    faq: [
      { p: "Com que frequência devo revisar os freios?", r: "Depende do uso e do veículo. De forma geral, vale verificar a cada revisão e sempre que aparecer barulho, vibração ou um pedal diferente do normal. O manual do fabricante traz os intervalos corretos." },
      { p: "Posso continuar rodando com barulho no freio?", r: "Não é recomendado. O barulho costuma ser sinal de desgaste, e continuar rodando pode estragar o disco e reduzir a eficiência da frenagem. O ideal é fazer a avaliação o quanto antes." },
      { p: "Quanto custa trocar as pastilhas?", r: "O valor varia conforme o veículo e a peça escolhida. Mande o modelo e o ano pelo WhatsApp e passamos o orçamento antes de você sair de casa." },
      { p: "Vocês trocam o fluido de freio?", r: "Sim, o fluido faz parte da revisão de freios. Ele absorve umidade com o tempo, por isso o fabricante define um prazo de troca no manual do veículo." },
    ],
    msg: "Olá! Preciso revisar os freios do meu carro.",
    relacionados: ["suspensao-e-direcao", "pneus", "diagnostico-de-motor"],
  },
  {
    slug: "suspensao-e-direcao",
    id: "susp",
    nome: "Suspensão e direção",
    h1: "Suspensão e direção em Formosa do Rio Preto",
    metaTitle: "Suspensão e direção em Formosa do Rio Preto | AM Auto Center",
    metaDesc: "Batidas na estrada, volante repuxando ou vibração? Avaliamos amortecedores, buchas e direção na BR-135, em Formosa do Rio Preto (BA).",
    intro:
      "Estrada de chão, buraco e lombada castigam a suspensão. Quando algo está solto ou gasto, o carro perde estabilidade, os pneus se desgastam mais rápido e o conforto cai. Descreva o que você sente ao dirigir e nós procuramos a causa.",
    sinaisTitulo: "Sintomas mais comuns",
    sinais: [
      "Batidas ou estalos ao passar em buracos e lombadas.",
      "Volante puxando para um lado ou torto com o carro em linha reta.",
      "Vibração no volante em determinada velocidade.",
      "Desgaste irregular ou acelerado dos pneus.",
      "Carro balançando demais em curvas ou \"afundando\" ao frear.",
      "Folga ou barulho ao esterçar o volante.",
    ],
    fazemos: [
      "Inspeção de amortecedores, molas, buchas, pivôs, terminais e barras.",
      "Verificação do sistema de direção e de folgas nas articulações.",
      "Avaliação do desgaste dos pneus, que ajuda a revelar o problema.",
      "Aviso, no diagnóstico, se for preciso alinhamento ou balanceamento.",
    ],
    faq: [
      { p: "Como saber se o amortecedor está ruim?", r: "Sinais comuns são o carro balançando depois de uma lombada, a frente \"mergulhando\" ao frear, vazamento de óleo no corpo do amortecedor e desgaste irregular dos pneus. Só a inspeção confirma." },
      { p: "Suspensão e alinhamento são a mesma coisa?", r: "Não. A suspensão é o conjunto de peças que sustenta o carro e absorve impactos. O alinhamento ajusta os ângulos das rodas. Peças gastas na suspensão podem tirar o carro do alinhamento." },
      { p: "É perigoso dirigir com a suspensão batendo?", r: "Pode ser. Peças soltas ou gastas afetam a estabilidade e a frenagem, principalmente em velocidade e em pista molhada. Vale avaliar logo." },
      { p: "Quanto tempo leva o conserto?", r: "Depende do que for encontrado. Depois de ver o carro, informamos o que precisa ser feito e o prazo." },
    ],
    msg: "Olá! Meu carro precisa de reparo de suspensão e direção.",
    relacionados: ["pneus", "freios", "diagnostico-de-motor"],
  },
  {
    slug: "pneus",
    id: "pneus",
    nome: "Pneus",
    h1: "Pneus em Formosa do Rio Preto: troca, calibragem e avaliação",
    metaTitle: "Pneus em Formosa do Rio Preto - BA | AM Auto Center",
    metaDesc: "Troca, calibragem e avaliação do desgaste dos pneus na BR-135, em Formosa do Rio Preto (BA). Informe a medida e peça orçamento pelo WhatsApp.",
    intro:
      "O pneu é o único ponto de contato do carro com o chão. Pneu calibrado e em bom estado dá mais segurança, melhor frenagem e economia. Fazemos a troca, a calibragem e a avaliação do desgaste.",
    sinaisTitulo: "Hora de olhar os pneus",
    sinais: [
      "Desgaste maior em um dos lados ou só no centro da banda.",
      "Bolhas, cortes ou rachaduras na lateral.",
      "Sulcos rasos, próximos do indicador de desgaste (TWI) da banda de rodagem.",
      "Vibração no volante ou no carro em velocidade.",
      "Pneu que perde pressão com frequência.",
      "Pneus antigos: a data de fabricação aparece no código DOT, na lateral.",
    ],
    fazemos: [
      "Troca de pneus e conferência da medida correta para o seu veículo.",
      "Calibragem conforme a pressão indicada pelo fabricante do veículo.",
      "Avaliação do desgaste e da idade do pneu.",
      "Orientação sobre alinhamento e balanceamento quando o desgaste indicar.",
    ],
    dica: {
      titulo: "Onde achar a medida e a pressão",
      texto: "A medida (por exemplo, 175/70 R14) está na lateral do pneu. A pressão recomendada fica na etiqueta da porta ou da tampa do tanque e no manual. Calibre com os pneus frios.",
    },
    faq: [
      { p: "Quando devo trocar os pneus?", r: "Quando o sulco chegar ao indicador de desgaste (mínimo legal de 1,6 mm), houver bolhas ou cortes, ou o pneu estiver muito envelhecido. Muitos fabricantes recomendam avaliar pneus a partir de cerca de 5 anos de fabricação." },
      { p: "Qual é a pressão correta?", r: "A que o fabricante do veículo indica na etiqueta da porta ou no manual, e não a que está escrita no pneu. Confira com os pneus frios, pelo menos uma vez por mês." },
      { p: "Preciso trocar os quatro pneus de uma vez?", r: "Nem sempre. O mais comum é trocar em par no mesmo eixo. Depois de avaliar o desgaste, orientamos o que faz mais sentido para o seu caso." },
      { p: "Vocês atendem moto e caminhão?", r: "Mande a medida do pneu e o tipo de veículo pelo WhatsApp e confirmamos a disponibilidade e o orçamento." },
    ],
    msg: "Olá! Quero orçamento de pneus.",
    relacionados: ["suspensao-e-direcao", "freios", "troca-de-oleo"],
  },
  {
    slug: "troca-de-oleo",
    id: "oleo",
    nome: "Troca de óleo",
    h1: "Troca de óleo em Formosa do Rio Preto",
    metaTitle: "Troca de óleo em Formosa do Rio Preto | AM Auto Center",
    metaDesc: "Troca de óleo e filtro para proteger o motor, na BR-135, em Formosa do Rio Preto (BA). Consulte pelo WhatsApp.",
    intro:
      "O óleo lubrifica e protege o motor. Trocar no prazo certo evita desgaste e problemas maiores. É um serviço rápido, e podemos anotar a data para você não esquecer a próxima troca.",
    sinaisTitulo: "Quando trocar",
    sinais: [
      "Chegou o prazo ou a quilometragem indicados no manual do veículo.",
      "O óleo na vareta está muito escuro, grosso ou com resíduos.",
      "O motor ficou mais barulhento do que de costume.",
      "O nível baixa com frequência entre uma troca e outra.",
      "Uso severo: trânsito pesado, estrada de terra, muita poeira ou reboque.",
    ],
    fazemos: [
      "Troca do óleo e do filtro conforme a especificação do veículo.",
      "Conferência dos níveis dos demais fluidos.",
      "Verificação visual de vazamentos.",
      "Registro da troca e aviso para a próxima, se você quiser.",
    ],
    dica: {
      titulo: "Luz de óleo acesa: pare",
      texto: "Se a luz de pressão do óleo acender com o carro em movimento, encoste em local seguro e desligue o motor. Rodar assim pode causar danos graves. Chame o guincho se precisar.",
    },
    faq: [
      { p: "Qual óleo devo usar?", r: "O especificado no manual do seu veículo: viscosidade (como 5W30) e norma de qualidade. Se tiver dúvida, informe o modelo e o ano e indicamos o correto." },
      { p: "De quanto em quanto tempo trocar?", r: "Varia com o motor e o tipo de óleo. Muitos veículos pedem a troca entre 5 mil e 10 mil km ou a cada 6 a 12 meses, o que vier primeiro. O manual manda, e uso severo costuma exigir prazos menores." },
      { p: "Preciso trocar o filtro junto?", r: "É o recomendado. Um filtro velho contamina o óleo novo e reduz a proteção do motor." },
      { p: "Posso misturar óleos diferentes?", r: "Em emergência, completar o nível é melhor do que rodar com pouco óleo, mas o ideal é manter o mesmo tipo e especificação. Na próxima troca, regularize." },
    ],
    msg: "Olá! Quero fazer troca de óleo.",
    relacionados: ["diagnostico-de-motor", "bateria", "pneus"],
  },
  {
    slug: "bateria",
    id: "bateria",
    nome: "Bateria",
    h1: "Bateria automotiva em Formosa do Rio Preto: teste e troca",
    metaTitle: "Bateria de carro em Formosa do Rio Preto | AM Auto Center",
    metaDesc: "Carro não pega de manhã? Testamos e trocamos a bateria na BR-135, em Formosa do Rio Preto (BA). Fale com a oficina pelo WhatsApp.",
    intro:
      "Calor, poeira de estrada e muitos acessórios ligados cansam a bateria. Antes de comprar uma nova, testamos para saber se o problema é mesmo a bateria ou o sistema de carga.",
    sinaisTitulo: "Sinais de bateria no fim",
    sinais: [
      "Partida lenta, ou o motor demora a pegar, principalmente de manhã.",
      "Faróis e painel fracos com o motor desligado.",
      "Luz da bateria acesa no painel.",
      "Terminais com pó esbranquiçado ou esverdeado (oxidação).",
      "Carcaça estufada ou com vazamento.",
      "Bateria com vários anos de uso. Costumam durar de 2 a 5 anos, conforme uso e clima.",
    ],
    fazemos: [
      "Teste da bateria e do sistema de carga (alternador).",
      "Limpeza e reaperto dos terminais.",
      "Troca da bateria quando necessário.",
      "Verificação de consumo anormal quando a bateria descarrega sozinha.",
    ],
    faq: [
      { p: "Por que a bateria descarrega?", r: "As causas mais comuns são o fim da vida útil, o alternador não carregando, itens que ficam ligados (como som e luzes) e consumo elétrico anormal. O teste mostra o que está acontecendo." },
      { p: "Posso dar \"chupeta\" no carro?", r: "É possível, mas siga o manual do veículo: ligação errada pode danificar a parte eletrônica. Se a bateria descarrega com frequência, o problema precisa ser investigado." },
      { p: "Como saber se é a bateria ou o alternador?", r: "Só com teste. Uma bateria nova que descarrega logo pode indicar problema no sistema de carga." },
      { p: "Quanto custa uma bateria nova?", r: "Depende do modelo do veículo e da capacidade necessária. Informe o carro e o ano pelo WhatsApp e passamos o valor." },
    ],
    msg: "Olá! Preciso testar ou trocar a bateria.",
    relacionados: ["diagnostico-de-motor", "troca-de-oleo", "guincho"],
  },
  {
    slug: "diagnostico-de-motor",
    id: "diag",
    nome: "Diagnóstico de motor",
    h1: "Diagnóstico de motor em Formosa do Rio Preto",
    metaTitle: "Diagnóstico de motor em Formosa do Rio Preto | AM Auto Center",
    metaDesc: "Luz de injeção acesa, motor falhando ou consumo alto? Achamos a causa antes de trocar peça. Oficina na BR-135, Formosa do Rio Preto (BA).",
    intro:
      "Trocar peça no escuro sai caro. O diagnóstico serve para descobrir a causa real do problema antes de gastar. Conte os sintomas e quando eles aparecem: essas informações valem tanto quanto o teste.",
    sinaisTitulo: "O que costuma levar ao diagnóstico",
    sinais: [
      "Luz de injeção (check engine) acesa ou piscando.",
      "Motor falhando, engasgando ou trepidando.",
      "Consumo de combustível mais alto que o normal.",
      "Perda de força em subidas e ultrapassagens.",
      "Dificuldade para pegar, principalmente a frio ou a quente.",
      "Temperatura do motor subindo, fumaça no escapamento ou cheiro forte.",
    ],
    fazemos: [
      "Conversa sobre os sintomas e o histórico do veículo.",
      "Análise dos códigos de falha e dos sistemas envolvidos.",
      "Testes para confirmar a causa antes de indicar a troca de peças.",
      "Orçamento detalhado do que realmente precisa ser feito.",
    ],
    dica: {
      titulo: "Luz de injeção piscando",
      texto: "Luz piscando costuma indicar falha mais séria. Reduza a velocidade, evite acelerar forte e procure a oficina o quanto antes. Se o motor aquecer demais, pare em local seguro e desligue.",
    },
    faq: [
      { p: "O que significa a luz de injeção acesa?", r: "O módulo do motor detectou alguma falha em sensores, ignição, mistura ou emissões. A luz avisa que há um problema, mas não diz sozinha qual peça trocar. Por isso o diagnóstico." },
      { p: "Posso rodar com a luz acesa?", r: "Acesa e fixa, geralmente dá para chegar à oficina com cuidado. Piscando, ou com perda de força e temperatura alta, é melhor parar. Na dúvida, ligue para nós." },
      { p: "Diagnóstico é só ler o código de falha?", r: "Não. O código aponta a área do problema, não a peça defeituosa. É preciso testar e analisar para não trocar o que está bom." },
      { p: "A cor da fumaça diz alguma coisa?", r: "Ajuda, mas não conclui. Em geral, fumaça escura pode indicar excesso de combustível, branca persistente pode indicar problema de arrefecimento e azulada pode indicar queima de óleo. Só a avaliação confirma." },
    ],
    msg: "Olá! Preciso de diagnóstico de motor.",
    relacionados: ["troca-de-oleo", "bateria", "freios"],
  },
  {
    slug: "guincho",
    nome: "Guincho",
    h1: "Guincho na BR-135 e em Formosa do Rio Preto",
    metaTitle: "Guincho na BR-135, Formosa do Rio Preto | AM Auto Center",
    metaDesc: "Quebrou no caminho? Guincho para carro, moto, SUV e caminhão. Envie sua localização pelo WhatsApp e confirmamos prazo e valor.",
    intro:
      "Quebrou na estrada? Guincho para carro, moto, SUV e caminhão. Envie o veículo e a sua localização pelo WhatsApp que confirmamos o atendimento, o prazo e o valor.",
    sinaisTitulo: "Quando chamar o guincho",
    sinais: [
      "O veículo não liga ou desligou e não pega mais.",
      "Pane mecânica ou elétrica que impede de seguir viagem.",
      "Pneu danificado sem estepe ou sem condição de troca.",
      "Superaquecimento do motor ou vazamento sério.",
      "Problema de freio, direção ou suspensão que tornam perigoso continuar.",
      "Acidente leve em que o veículo não pode rodar.",
    ],
    fazemos: [
      "Recebemos o pedido pelo WhatsApp, com veículo e localização.",
      "Confirmamos se o atendimento é possível, o prazo e o valor.",
      "Levamos o veículo até a oficina, na BR-135, para o diagnóstico.",
    ],
    dica: {
      titulo: "Enquanto espera, com segurança",
      texto: "Ligue o pisca-alerta, posicione o triângulo a uma distância segura e fique longe da pista, atrás do guard-rail ou no acostamento. Se puder, saia do veículo com cuidado.",
    },
    faq: [
      { p: "Como peço o guincho?", r: "Pelo WhatsApp: informe o tipo e o modelo do veículo e envie a sua localização. Na página inicial há um botão que já monta a mensagem e inclui a localização." },
      { p: "Quanto custa e quanto demora?", r: "Depende da distância e do tipo de veículo. Confirmamos o prazo e o valor assim que recebemos a localização." },
      { p: "O guincho atende moto e caminhão?", r: "Atendemos carro, moto, SUV e caminhão. Informe o veículo na mensagem para confirmarmos o equipamento adequado." },
      { p: "Para onde o veículo é levado?", r: "Para a nossa oficina, na BR-135, onde fazemos o diagnóstico. Se você preferir outro destino, combine na conversa." },
    ],
    msg: "Olá! Preciso de guincho.",
    relacionados: ["diagnostico-de-motor", "bateria", "pneus"],
  },
];

export const servicoPorSlug = (slug: string) => servicosDetalhe.find((s) => s.slug === slug);
export const servicoPorId = (id: string) => servicosDetalhe.find((s) => s.id === id);
