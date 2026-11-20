export const landingFeatures = [
  { label: 'Reativação', title: 'Retome a conversa no momento definido.', text: 'Configure o tempo sem compra e a ação de relacionamento.', rows: [['Regra', 'Cliente sem compra há 90 dias'], ['Ação', 'Entrar na automação'], ['Canal', 'WhatsApp']] },
  { label: 'Campanhas', title: 'Uma mensagem para o público certo.', text: 'Prepare campanhas com as informações da sua base.', rows: [['Campanha', 'Novidades da coleção'], ['Público', 'Interesse: Novidades'], ['Condição', 'Cliente ativo'], ['Canal', 'WhatsApp']] },
  { label: 'Aniversários', title: 'Datas importantes viram relacionamento.', text: 'Uma comunicação a partir da data cadastrada.', rows: [['Agenda', 'Aniversário do cliente'], ['Regra', 'Data cadastrada'], ['Ação', 'Preparar comunicação']] },
  { label: 'QR Code / Link', title: 'O cadastro começa onde seu cliente está.', text: 'No caixa, balcão, Instagram, WhatsApp ou material impresso.', rows: [['Acesso', 'QR Code ou link'], ['Cadastro', 'Dados e preferências'], ['Destino', 'Base da empresa']] },
  { label: 'Interesses', title: 'Menos mensagem genérica. Mais contexto.', text: 'A empresa define as opções. O cliente informa suas preferências.', rows: [['Cliente', 'Ana'], ['Interesses', 'Novidades · Promoções · Categoria A · Lançamentos']] },
  { label: 'Histórico', title: 'Acompanhe o caminho de cada ação.', text: 'Registros para reduzir controles paralelos.', rows: [['09:42', 'Cliente identificado'], ['09:42', 'Regra acionada'], ['09:42', 'Comunicação preparada']] },
] as const
export const landingScenarios = [
  { label: 'Cliente não compra há algum tempo', rows: [['Situação', 'Cliente sem compra'], ['Regra', '90 dias'], ['Ação', 'Entrar na automação de reativação'], ['Canal', 'WhatsApp']] },
  { label: 'Aniversário chegando', rows: [['Situação', 'Aniversário do cliente'], ['Regra', 'Data cadastrada'], ['Ação', 'Preparar comunicação'], ['Canal', 'WhatsApp']] },
  { label: 'Campanha para um interesse específico', rows: [['Situação', 'Nova campanha'], ['Público', 'Clientes interessados em “Novidades”'], ['Ação', 'Campanha segmentada']] },
] as const
export function scenarioAt(index: number) { return landingScenarios[index] ?? landingScenarios[0] }
