const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const now = new Date().toISOString();
const yesterday = new Date(Date.now() - 86400000).toISOString();
const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString();
const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();
const oneMonthAgo = new Date(Date.now() - 30 * 86400000).toISOString();

const DEFAULT_CLAUSES = [
  {
    id: 'clause-001',
    title: 'OBJETO DA LOCAÇÃO',
    content: 'O LOCADOR cede ao LOCATÁRIO, para uso residencial, o imóvel descrito no preâmbulo deste contrato, em perfeito estado de conservação e uso, conforme vistoria realizada.',
    category: 'general',
    order: 1,
    required: true,
  },
  {
    id: 'clause-002',
    title: 'PRAZO DA LOCAÇÃO',
    content: 'O prazo da locação é de 12 (doze) meses, iniciando-se na data de início prevista neste instrumento, podendo ser renovado mediante acordo entre as partes com antecedência mínima de 30 dias.',
    category: 'general',
    order: 2,
    required: true,
  },
  {
    id: 'clause-003',
    title: 'VALOR DO ALUGUEL E FORMA DE PAGAMENTO',
    content: 'O aluguel mensal deverá ser pago até o dia de vencimento estipulado neste contrato. O não pagamento na data estipulada acarretará multa moratória e juros conforme previsto neste instrumento.',
    category: 'payment',
    order: 3,
    required: true,
  },
  {
    id: 'clause-004',
    title: 'REAJUSTE ANUAL',
    content: 'O valor do aluguel será reajustado anualmente pelo índice selecionado neste contrato, ou pelo índice legal vigente na data do reajuste, prevalecendo o maior. O reajuste será notificado com 30 dias de antecedência.',
    category: 'payment',
    order: 4,
    required: true,
  },
  {
    id: 'clause-005',
    title: 'CONSERVAÇÃO DO IMÓVEL',
    content: 'O LOCATÁRIO obriga-se a conservar o imóvel em perfeito estado, devolvendo-o nas mesmas condições em que o recebeu, arcando com os custos de reparos de danos causados por si ou por terceiros autorizados a acessar o imóvel.',
    category: 'maintenance',
    order: 5,
    required: true,
  },
  {
    id: 'clause-006',
    title: 'RESCISÃO ANTECIPADA',
    content: 'Caso o LOCATÁRIO queira rescindir o contrato antes do prazo estipulado, deverá notificar o LOCADOR com no mínimo 30 (trinta) dias de antecedência e pagar multa proporcional ao tempo restante do contrato.',
    category: 'termination',
    order: 6,
    required: true,
  },
  {
    id: 'clause-007',
    title: 'FORO',
    content: 'Fica eleito o foro da Comarca de São Paulo para dirimir quaisquer controvérsias oriundas do presente contrato, com renúncia a qualquer outro, por mais privilegiado que seja.',
    category: 'general',
    order: 7,
    required: true,
  },
];

// ─── Contract 1: COMPLETED ──────────────────────────────────────────────────
const contract1 = {
  id: 'dc-001',
  title: 'Contrato de Locação — Apto 301 Vila Madalena',
  status: 'completed',
  version: 1,
  landlordId: 'user-001',
  landlordName: 'Lucas Oliveira',
  landlordEmail: 'lucas@equilino.com.br',
  tenantId: 'tenant-user-001',
  tenantName: 'Ana Carolina Silva',
  tenantEmail: 'ana@equilino.app',
  propertyId: 'prop-001',
  propertyName: 'Apto 301 - Vila Madalena',
  propertyAddress: 'Rua Harmonia, 301, São Paulo, SP',
  startDate: '2026-02-01T00:00:00Z',
  endDate: '2027-01-31T00:00:00Z',
  duration: 12,
  moveInDate: '2026-02-01T00:00:00Z',
  rentAmount: 3800,
  dueDay: 10,
  depositAmount: 7600,
  depositInstallments: 1,
  adjustmentIndex: 'IGPM',
  lateFeePercent: 2,
  lateInterestPercent: 1,
  paymentMethod: 'PIX',
  pixKey: 'lucas@equilino.com.br',
  petPolicy: 'not_allowed',
  smokingPolicy: 'not_allowed',
  sublettingAllowed: false,
  maxOccupants: 3,
  guaranteeType: 'deposit',
  utilities: {
    water: 'tenant',
    electricity: 'tenant',
    gas: 'tenant',
    internet: 'tenant',
    condominiumFee: 'landlord',
    iptu: 'landlord',
  },
  clauses: DEFAULT_CLAUSES,
  signatures: [
    {
      id: 'sig-001a',
      contractId: 'dc-001',
      signerName: 'Lucas Oliveira',
      signerEmail: 'lucas@equilino.com.br',
      signerRole: 'landlord',
      signatureData: '',
      signedAt: twoWeeksAgo,
      ipAddress: '127.0.0.1',
    },
    {
      id: 'sig-001b',
      contractId: 'dc-001',
      signerName: 'Ana Carolina Silva',
      signerEmail: 'ana@equilino.app',
      signerRole: 'tenant',
      signatureData: '',
      signedAt: lastWeek,
      ipAddress: '127.0.0.1',
    },
  ],
  documents: [],
  history: [
    { id: 'h-001-1', contractId: 'dc-001', type: 'created', description: 'Contrato criado', userId: 'user-001', userName: 'Lucas Oliveira', timestamp: oneMonthAgo },
    { id: 'h-001-2', contractId: 'dc-001', type: 'sent', description: 'Contrato enviado para assinatura', userId: 'user-001', userName: 'Lucas Oliveira', timestamp: twoWeeksAgo },
    { id: 'h-001-3', contractId: 'dc-001', type: 'viewed', description: 'Contrato visualizado pelo locatário', userId: 'tenant-user-001', userName: 'Ana Carolina Silva', timestamp: twoWeeksAgo },
    { id: 'h-001-4', contractId: 'dc-001', type: 'signed_landlord', description: 'Assinado pelo locador', userId: 'user-001', userName: 'Lucas Oliveira', timestamp: twoWeeksAgo },
    { id: 'h-001-5', contractId: 'dc-001', type: 'signed_tenant', description: 'Assinado pelo locatário', userId: 'tenant-user-001', userName: 'Ana Carolina Silva', timestamp: lastWeek },
    { id: 'h-001-6', contractId: 'dc-001', type: 'completed', description: 'Contrato concluído — ambas as partes assinaram', userId: 'system', userName: 'Sistema', timestamp: lastWeek },
  ],
  signedByLandlordAt: twoWeeksAgo,
  signedByTenantAt: lastWeek,
  viewCount: 3,
  sentAt: twoWeeksAgo,
  expiresAt: new Date(Date.now() + 16 * 86400000).toISOString(),
  completedAt: lastWeek,
  createdAt: oneMonthAgo,
  updatedAt: lastWeek,
};

// ─── Contract 2: SENT — awaiting tenant signature ────────────────────────────
const contract2 = {
  id: 'dc-002',
  title: 'Contrato de Locação — Apto 301 Vila Madalena (Renovação 2026)',
  status: 'sent',
  version: 1,
  landlordId: 'user-001',
  landlordName: 'Lucas Oliveira',
  landlordEmail: 'lucas@equilino.com.br',
  tenantId: 'tenant-user-001',
  tenantName: 'Ana Carolina Silva',
  tenantEmail: 'ana@equilino.app',
  propertyId: 'prop-001',
  propertyName: 'Apto 301 - Vila Madalena',
  propertyAddress: 'Rua Harmonia, 301, São Paulo, SP',
  startDate: '2026-06-01T00:00:00Z',
  endDate: '2027-05-31T00:00:00Z',
  duration: 12,
  moveInDate: '2026-06-01T00:00:00Z',
  rentAmount: 4000,
  dueDay: 10,
  depositAmount: 8000,
  depositInstallments: 1,
  adjustmentIndex: 'IPCA',
  lateFeePercent: 2,
  lateInterestPercent: 1,
  paymentMethod: 'PIX',
  pixKey: 'lucas@equilino.com.br',
  petPolicy: 'not_allowed',
  smokingPolicy: 'not_allowed',
  sublettingAllowed: false,
  maxOccupants: 3,
  guaranteeType: 'deposit',
  utilities: {
    water: 'tenant',
    electricity: 'tenant',
    gas: 'tenant',
    internet: 'tenant',
    condominiumFee: 'landlord',
    iptu: 'landlord',
  },
  clauses: DEFAULT_CLAUSES.map((c, i) => ({ ...c, id: 'clause-r-' + (i + 1) })),
  signatures: [],
  documents: [],
  history: [
    { id: 'h-002-1', contractId: 'dc-002', type: 'created', description: 'Contrato de renovação criado', userId: 'user-001', userName: 'Lucas Oliveira', timestamp: yesterday },
    { id: 'h-002-2', contractId: 'dc-002', type: 'sent', description: 'Contrato enviado para assinatura do locatário', userId: 'user-001', userName: 'Lucas Oliveira', timestamp: yesterday },
  ],
  signedByLandlordAt: null,
  signedByTenantAt: null,
  viewCount: 0,
  sentAt: yesterday,
  expiresAt: new Date(Date.now() + 29 * 86400000).toISOString(),
  completedAt: null,
  createdAt: yesterday,
  updatedAt: yesterday,
};

// ─── Templates ───────────────────────────────────────────────────────────────
const templates = [
  {
    id: 'tpl-001',
    name: 'Residencial Padrão',
    description: 'Contrato residencial com cláusulas essenciais para locações de longa duração',
    category: 'residential',
    isBuiltIn: true,
    usageCount: 847,
    clauses: DEFAULT_CLAUSES,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tpl-002',
    name: 'Comercial Completo',
    description: 'Template para imóveis comerciais com cláusulas específicas de uso empresarial',
    category: 'commercial',
    isBuiltIn: true,
    usageCount: 312,
    clauses: [
      { id: 'tc-001', title: 'OBJETO DA LOCAÇÃO COMERCIAL', content: 'O LOCADOR cede o imóvel ao LOCATÁRIO para uso estritamente comercial, vedado o uso residencial ou diverso do pactuado neste instrumento.', category: 'general', order: 1, required: true },
      { id: 'tc-002', title: 'PRAZO E RENOVAÇÃO', content: 'O contrato vigorará pelo prazo mínimo de 24 meses. Após o término, caso o LOCATÁRIO permaneça no imóvel sem oposição, o contrato será prorrogado por prazo indeterminado.', category: 'general', order: 2, required: true },
      { id: 'tc-003', title: 'ALUGUEL E ENCARGOS', content: 'Além do aluguel mensal, o LOCATÁRIO responsabiliza-se pelo pagamento de IPTU, condomínio, água, luz, telefone e demais encargos incidentes sobre o imóvel.', category: 'payment', order: 3, required: true },
      { id: 'tc-004', title: 'BENFEITORIAS', content: 'O LOCATÁRIO não poderá realizar obras ou benfeitorias no imóvel sem prévia autorização escrita do LOCADOR. As benfeitorias necessárias serão indenizadas; as úteis e voluptuárias não.', category: 'rules', order: 4, required: true },
      { id: 'tc-005', title: 'RESCISÃO', content: 'A rescisão antecipada pelo LOCATÁRIO implicará multa de 3 aluguéis vigentes na época da rescisão, além de notificação com 60 dias de antecedência.', category: 'termination', order: 5, required: true },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tpl-003',
    name: 'Temporada',
    description: 'Contrato de curta duração para locações de temporada (até 90 dias)',
    category: 'seasonal',
    isBuiltIn: true,
    usageCount: 124,
    clauses: [
      { id: 'ts-001', title: 'OBJETO E FINALIDADE', content: 'O LOCADOR cede o imóvel ao LOCATÁRIO para uso temporário de lazer/turismo pelo prazo estipulado, vedada qualquer outra finalidade.', category: 'general', order: 1, required: true },
      { id: 'ts-002', title: 'PRAZO IMPRORROGÁVEL', content: 'O prazo de locação é improrrogável. Ao seu término, o LOCATÁRIO obriga-se a desocupar o imóvel, sob pena de multa diária equivalente a 1/30 do valor mensal do aluguel.', category: 'general', order: 2, required: true },
      { id: 'ts-003', title: 'PAGAMENTO ANTECIPADO', content: 'O valor total da locação deverá ser pago integralmente no ato da assinatura deste contrato, não havendo restituição em caso de desistência após a entrega das chaves.', category: 'payment', order: 3, required: true },
      { id: 'ts-004', title: 'OCUPANTES E REGRAS', content: 'É vedada a realização de festas ou eventos no imóvel. O número de ocupantes é limitado ao previsto neste contrato. O descumprimento autoriza rescisão imediata sem restituição de valores.', category: 'rules', order: 4, required: true },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

db.digital_contracts = [contract1, contract2];
db.contract_templates = templates;

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('Seeded successfully!');
console.log('  digital_contracts:', db.digital_contracts.length);
console.log('  contract_templates:', db.contract_templates.length);
