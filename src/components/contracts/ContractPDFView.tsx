'use client';
import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Printer, QrCode } from 'lucide-react';
import type { DigitalContract } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (d: string) => {
  try { return format(new Date(d), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }); }
  catch { return d; }
};

interface Props {
  contract: DigitalContract;
  onClose: () => void;
}

export function ContractPDFView({ contract, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${contract.title}</title>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Times New Roman', serif; color: #1a1a2e; background: white; }
          .page { max-width: 800px; margin: 0 auto; padding: 48px 56px; }
          .header { text-align: center; border-bottom: 3px solid #7c3aed; padding-bottom: 24px; margin-bottom: 32px; }
          .brand { font-size: 28px; font-weight: 800; color: #7c3aed; letter-spacing: -0.5px; }
          .doc-title { font-size: 18px; font-weight: 700; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px; }
          .contract-id { font-size: 11px; color: #666; margin-top: 4px; }
          .section { margin-bottom: 28px; }
          .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #7c3aed; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 16px; }
          .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
          .party-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
          .party-role { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #7c3aed; margin-bottom: 4px; }
          .party-name { font-size: 16px; font-weight: 700; }
          .party-detail { font-size: 12px; color: #555; margin-top: 2px; }
          .terms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .term { padding: 10px 14px; background: #f9fafb; border-radius: 6px; }
          .term-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; }
          .term-value { font-size: 14px; font-weight: 600; margin-top: 2px; }
          .clause { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0; }
          .clause:last-child { border-bottom: none; }
          .clause-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
          .clause-number { color: #7c3aed; }
          .clause-text { font-size: 12px; line-height: 1.8; text-align: justify; }
          .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 40px; }
          .sig-block { text-align: center; }
          .sig-line { border-top: 2px solid #1a1a2e; padding-top: 8px; margin-top: 48px; }
          .sig-name { font-size: 12px; font-weight: 700; }
          .sig-role { font-size: 11px; color: #666; margin-top: 2px; }
          .sig-date { font-size: 10px; color: #888; margin-top: 2px; }
          .sig-img { max-height: 60px; max-width: 200px; }
          .footer { margin-top: 48px; border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; font-size: 10px; color: #999; }
          .utils-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
          .util-item { font-size: 11px; padding: 6px 10px; background: #f9fafb; border-radius: 4px; }
          .util-key { color: #666; }
          .util-val { font-weight: 600; }
          @page { margin: 2cm; }
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        ${el.innerHTML}
      </body>
      </html>
    `);
    w.document.close();
    w.onload = () => { w.print(); w.close(); };
  };

  const landlordSig = contract.signatures.find(s => s.signerRole === 'landlord');
  const tenantSig = contract.signatures.find(s => s.signerRole === 'tenant');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center overflow-y-auto p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl overflow-hidden w-full max-w-3xl my-4 shadow-2xl"
        >
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 bg-violet-600 text-white">
            <div>
              <p className="text-xs font-medium opacity-80">Visualizar Contrato</p>
              <h2 className="font-bold text-lg leading-tight">{contract.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handlePrint} title="Imprimir / Salvar PDF"
                className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors">
                <Printer size={15} />
                <span className="hidden sm:inline">Imprimir</span>
              </button>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Contract body (print target) */}
          <div ref={printRef} className="page" style={{ fontFamily: "'Times New Roman', serif", color: '#1a1a2e', background: 'white', padding: '48px 56px' }}>
            {/* Header */}
            <div className="header" style={{ textAlign: 'center', borderBottom: '3px solid #7c3aed', paddingBottom: '24px', marginBottom: '32px' }}>
              <div className="brand" style={{ fontSize: 28, fontWeight: 800, color: '#7c3aed' }}>Equilino</div>
              <div className="doc-title" style={{ fontSize: 18, fontWeight: 700, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                Contrato de Locação Residencial
              </div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                ID: {contract.id.slice(0, 8).toUpperCase()} · Versão {contract.version}
                {contract.completedAt && ` · Concluído em ${formatDate(contract.completedAt)}`}
              </div>
            </div>

            {/* Parties */}
            <div className="section" style={{ marginBottom: 28 }}>
              <div className="section-title" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#7c3aed', borderBottom: '1px solid #e5e7eb', paddingBottom: 8, marginBottom: 16 }}>
                1. Partes Contratantes
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#7c3aed', marginBottom: 4 }}>LOCADOR</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{contract.landlordName ?? 'Proprietário'}</div>
                  <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{contract.landlordEmail}</div>
                </div>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#7c3aed', marginBottom: 4 }}>LOCATÁRIO</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{contract.tenantName ?? 'Inquilino'}</div>
                  <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{contract.tenantEmail}</div>
                </div>
              </div>
            </div>

            {/* Property */}
            <div className="section" style={{ marginBottom: 28 }}>
              <div className="section-title" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#7c3aed', borderBottom: '1px solid #e5e7eb', paddingBottom: 8, marginBottom: 16 }}>
                2. Imóvel
              </div>
              <div style={{ padding: '12px 16px', background: '#f9fafb', borderRadius: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{contract.propertyName}</div>
                <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>{contract.propertyAddress}</div>
              </div>
            </div>

            {/* Financial terms */}
            <div className="section" style={{ marginBottom: 28 }}>
              <div className="section-title" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#7c3aed', borderBottom: '1px solid #e5e7eb', paddingBottom: 8, marginBottom: 16 }}>
                3. Condições Financeiras
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  ['Aluguel Mensal', formatCurrency(contract.rentAmount)],
                  ['Vencimento', `Dia ${contract.dueDay}`],
                  ['Caução', formatCurrency(contract.depositAmount)],
                  ['Multa Atraso', `${contract.lateFeePercent}%`],
                  ['Juros Mora', `${contract.lateInterestPercent}% a.m.`],
                  ['Índice Reajuste', contract.adjustmentIndex],
                  ['Vigência', `${contract.duration} meses`],
                  ['Início', formatDate(contract.startDate)],
                  ['Término', formatDate(contract.endDate)],
                ].map(([label, value]) => (
                  <div key={label} style={{ padding: '8px 12px', background: '#f9fafb', borderRadius: 6 }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: '#888' }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clauses */}
            <div className="section" style={{ marginBottom: 28 }}>
              <div className="section-title" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#7c3aed', borderBottom: '1px solid #e5e7eb', paddingBottom: 8, marginBottom: 16 }}>
                4. Cláusulas e Condições
              </div>
              {contract.clauses.map((clause, i) => (
                <div key={clause.id} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: i < contract.clauses.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                    <span style={{ color: '#7c3aed' }}>{i + 1}.</span> {clause.title}
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.8, textAlign: 'justify' }}>{clause.content}</div>
                </div>
              ))}
            </div>

            {/* Signatures */}
            <div className="section" style={{ marginBottom: 28 }}>
              <div className="section-title" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#7c3aed', borderBottom: '1px solid #e5e7eb', paddingBottom: 8, marginBottom: 16 }}>
                5. Assinaturas
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 16 }}>
                {[
                  { label: 'LOCADOR', sig: landlordSig, name: contract.landlordName },
                  { label: 'LOCATÁRIO', sig: tenantSig, name: contract.tenantName },
                ].map(({ label, sig, name }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ minHeight: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 8 }}>
                      {sig?.signatureData && sig.signatureData.startsWith('data:') && (
                        <img src={sig.signatureData} alt="assinatura" style={{ maxHeight: 60, maxWidth: 200 }} />
                      )}
                    </div>
                    <div style={{ borderTop: '2px solid #1a1a2e', paddingTop: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{name}</div>
                      <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{label}</div>
                      {sig?.signedAt && (
                        <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                          {formatDate(sig.signedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 48, borderTop: '1px solid #e5e7eb', paddingTop: 16, textAlign: 'center', fontSize: 10, color: '#999' }}>
              <p>Documento gerado digitalmente pela plataforma Equilino · {new Date().toLocaleDateString('pt-BR')}</p>
              <p style={{ marginTop: 4 }}>ID do Contrato: {contract.id} · Este documento tem validade jurídica conforme a Lei 9.514/97 e MP 2.200-2/01</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
