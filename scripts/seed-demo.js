/**
 * Seed script — injects realistic demo payments (awaiting_approval + rejected)
 * and matching notifications into data/db.json. Safe to re-run: removes items
 * whose id starts with "demo-" before inserting fresh ones.
 *
 * Usage:  node scripts/seed-demo.js
 */
const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/db.json');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

// ─── Receipt SVG helpers ──────────────────────────────────────────────────────

function makePixReceipt({ amount, date, time, txId, fromName, fromBank, toName, toKey, description, color }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="380" height="464" viewBox="0 0 380 464">
  <rect width="380" height="464" fill="#ffffff"/>
  <rect x="0" y="0" width="380" height="64" fill="${color}"/>
  <text x="190" y="36" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">COMPROVANTE PIX</text>
  <text x="190" y="54" text-anchor="middle" fill="rgba(255,255,255,0.75)" font-family="Arial" font-size="11">Transferencia concluida com sucesso</text>
  <text x="190" y="100" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="11">VALOR PAGO</text>
  <text x="190" y="132" text-anchor="middle" fill="#111827" font-family="Arial" font-size="30" font-weight="bold">${amount}</text>
  <line x1="24" y1="152" x2="356" y2="152" stroke="#e5e7eb" stroke-width="1"/>
  <text x="24" y="174" fill="#9ca3af" font-family="Arial" font-size="10">DATA E HORA</text>
  <text x="356" y="174" text-anchor="end" fill="#374151" font-family="Arial" font-size="12">${date}  ${time}</text>
  <text x="24" y="198" fill="#9ca3af" font-family="Arial" font-size="10">ID DA TRANSACAO</text>
  <text x="356" y="198" text-anchor="end" fill="#374151" font-family="Arial" font-size="11">${txId}</text>
  <line x1="24" y1="216" x2="356" y2="216" stroke="#e5e7eb" stroke-width="1"/>
  <text x="24" y="240" fill="#9ca3af" font-family="Arial" font-size="10">ORIGEM</text>
  <text x="24" y="262" fill="#111827" font-family="Arial" font-size="14" font-weight="bold">${fromName}</text>
  <text x="24" y="280" fill="#6b7280" font-family="Arial" font-size="11">CPF: ***.456.789-**</text>
  <text x="24" y="296" fill="#6b7280" font-family="Arial" font-size="11">${fromBank}</text>
  <line x1="24" y1="313" x2="356" y2="313" stroke="#e5e7eb" stroke-width="1"/>
  <text x="24" y="337" fill="#9ca3af" font-family="Arial" font-size="10">DESTINO</text>
  <text x="24" y="359" fill="#111827" font-family="Arial" font-size="14" font-weight="bold">${toName}</text>
  <text x="24" y="377" fill="#6b7280" font-family="Arial" font-size="11">Chave Pix: ${toKey}</text>
  <text x="24" y="393" fill="#6b7280" font-family="Arial" font-size="11">Itau Unibanco S.A.</text>
  <line x1="24" y1="410" x2="356" y2="410" stroke="#e5e7eb" stroke-width="1"/>
  <text x="24" y="432" fill="#9ca3af" font-family="Arial" font-size="10">DESCRICAO</text>
  <text x="24" y="450" fill="#374151" font-family="Arial" font-size="11">${description}</text>
</svg>`;
}

function makeTedReceipt({ amount, date, time, txId, fromName, fromBank, toName, toBranch, description }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="380" height="480" viewBox="0 0 380 480">
  <rect width="380" height="480" fill="#f9fafb"/>
  <rect x="0" y="0" width="380" height="64" fill="#1d4ed8"/>
  <text x="190" y="36" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">COMPROVANTE DE TRANSFERENCIA</text>
  <text x="190" y="54" text-anchor="middle" fill="rgba(255,255,255,0.75)" font-family="Arial" font-size="11">TED - Transferencia Eletronico Disponivel</text>
  <text x="190" y="100" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="11">VALOR TRANSFERIDO</text>
  <text x="190" y="134" text-anchor="middle" fill="#111827" font-family="Arial" font-size="30" font-weight="bold">${amount}</text>
  <line x1="24" y1="154" x2="356" y2="154" stroke="#d1d5db" stroke-width="1"/>
  <text x="24" y="176" fill="#9ca3af" font-family="Arial" font-size="10">DATA DE PROCESSAMENTO</text>
  <text x="356" y="176" text-anchor="end" fill="#374151" font-family="Arial" font-size="12">${date}</text>
  <text x="24" y="198" fill="#9ca3af" font-family="Arial" font-size="10">HORARIO</text>
  <text x="356" y="198" text-anchor="end" fill="#374151" font-family="Arial" font-size="12">${time}</text>
  <text x="24" y="220" fill="#9ca3af" font-family="Arial" font-size="10">AUTENTICACAO</text>
  <text x="356" y="220" text-anchor="end" fill="#374151" font-family="Arial" font-size="11">${txId}</text>
  <line x1="24" y1="236" x2="356" y2="236" stroke="#d1d5db" stroke-width="1"/>
  <text x="24" y="258" fill="#9ca3af" font-family="Arial" font-size="10">CONTA DEBITADA (PAGADOR)</text>
  <text x="24" y="278" fill="#111827" font-family="Arial" font-size="13" font-weight="bold">${fromName}</text>
  <text x="24" y="296" fill="#6b7280" font-family="Arial" font-size="11">${fromBank}</text>
  <line x1="24" y1="313" x2="356" y2="313" stroke="#d1d5db" stroke-width="1"/>
  <text x="24" y="335" fill="#9ca3af" font-family="Arial" font-size="10">CONTA CREDITADA (FAVORECIDO)</text>
  <text x="24" y="355" fill="#111827" font-family="Arial" font-size="13" font-weight="bold">${toName}</text>
  <text x="24" y="373" fill="#6b7280" font-family="Arial" font-size="11">${toBranch}</text>
  <text x="24" y="391" fill="#6b7280" font-family="Arial" font-size="11">Bradesco · CPF: ***.654.321-**</text>
  <line x1="24" y1="408" x2="356" y2="408" stroke="#d1d5db" stroke-width="1"/>
  <text x="24" y="430" fill="#9ca3af" font-family="Arial" font-size="10">HISTORICO / DESCRICAO</text>
  <text x="24" y="450" fill="#374151" font-family="Arial" font-size="11">${description}</text>
  <text x="190" y="472" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="9">COMPROVANTE GERADO AUTOMATICAMENTE</text>
</svg>`;
}

function toDataUrl(svg) {
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

// ─── Generate receipts ────────────────────────────────────────────────────────

const pixReceiptUrl = toDataUrl(makePixReceipt({
  amount:      'R$ 3.800,00',
  date:        '10/06/2026',
  time:        '09:42:18',
  txId:        'E07656500202606100942180A3',
  fromName:    'Ana Carolina Silva',
  fromBank:    'Nubank S.A.  Ag. 0001  Cc. ****-1234',
  toName:      'Lucas Oliveira',
  toKey:       'lucas@equilino.com.br',
  description: 'Aluguel Junho 2026 - Apto 301 Vila Madalena',
  color:       '#4f46e5',
}));

const tedReceiptUrl = toDataUrl(makeTedReceipt({
  amount:      'R$ 3.800,00',
  date:        '09/07/2026',
  time:        '14:22:07',
  txId:        'BD2026070914220700000012345',
  fromName:    'Ana Carolina Silva',
  fromBank:    'Bradesco  Ag. 1234-5  Cc. 98765-4',
  toName:      'Lucas Oliveira',
  toBranch:    'Itau Unibanco  Ag. 0078  Cc. ****-9801',
  description: 'Aluguel Julho 2026 - Apto 301 Vila Madalena',
}));

// ─── Purge old demo data ──────────────────────────────────────────────────────

db.payments      = (db.payments      || []).filter(p => !p.id.startsWith('demo-'));
db.notifications = (db.notifications || []).filter(n => !n.id.startsWith('demo-'));

// ─── Inject demo payments ─────────────────────────────────────────────────────

db.payments.push(
  {
    id:            'demo-pay-await',
    tenantId:      'tenant-001',
    propertyId:    'prop-001',
    contractId:    'contract-001',
    amount:        3800,
    dueDate:       '2026-06-10',
    status:        'awaiting_approval',
    month:         'Junho 2026',
    description:   'Aluguel - Apto 301 Vila Madalena',
    receiptUrl:    pixReceiptUrl,
    paymentMethod: 'pix',
    paymentDate:   '2026-06-10',
    submittedAt:   '2026-06-10T09:45:00.000Z',
    receiptNotes:  'Pagamento referente ao mes de junho 2026. Comprovante Pix Nubank.',
  },
  {
    id:              'demo-pay-reject',
    tenantId:        'tenant-001',
    propertyId:      'prop-001',
    contractId:      'contract-001',
    amount:          3800,
    dueDate:         '2026-07-10',
    status:          'rejected',
    month:           'Julho 2026',
    description:     'Aluguel - Apto 301 Vila Madalena',
    receiptUrl:      tedReceiptUrl,
    paymentMethod:   'transfer',
    paymentDate:     '2026-07-09',
    submittedAt:     '2026-07-09T14:25:00.000Z',
    receiptNotes:    'TED referente ao aluguel de julho 2026.',
    rejectionReason: 'Comprovante ilegivel. Por favor, envie uma imagem mais nitida do comprovante Pix ou transferencia bancaria com o valor e data visiveis.',
    approvedAt:      '2026-07-10T10:00:00.000Z',
    approvedBy:      'demo-user-001',
  },
);

// ─── Inject demo notifications ────────────────────────────────────────────────

db.notifications.push(
  // Landlord: new receipt awaiting review
  {
    id:        'demo-notif-landlord-001',
    type:      'payment',
    title:     'Comprovante aguardando aprovacao',
    message:   'Ana Carolina Silva enviou comprovante de R$ 3.800,00 via Pix referente a Junho 2026 em Apto 301 - Vila Madalena. Acesse para aprovar ou rejeitar.',
    read:      false,
    createdAt: '2026-06-10T09:45:00.000Z',
    relatedId: 'demo-pay-await',
    priority:  'high',
  },
  // Tenant (Ana): rejection notice for July
  {
    id:             'demo-notif-tenant-001',
    type:           'alert',
    title:          'Comprovante rejeitado',
    message:        'Seu comprovante de R$ 3.800,00 (Julho 2026) foi rejeitado. Motivo: Comprovante ilegivel. Por favor, envie uma imagem mais nitida do comprovante. Envie um novo comprovante.',
    read:           false,
    createdAt:      '2026-07-10T10:00:00.000Z',
    relatedId:      'demo-pay-reject',
    priority:       'high',
    targetTenantId: 'tenant-001',
  },
);

// ─── Persist ──────────────────────────────────────────────────────────────────

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
console.log('Demo data seeded:');
console.log('  demo-pay-await   — Ana, Junho 2026, awaiting_approval (Pix R$3.800)');
console.log('  demo-pay-reject  — Ana, Julho 2026, rejected (TED R$3.800)');
console.log('  demo-notif-landlord-001  — locador notification (unread)');
console.log('  demo-notif-tenant-001    — tenant notification for Ana (unread)');
