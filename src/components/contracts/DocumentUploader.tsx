'use client';
import { useRef, useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle, Image, AlertCircle } from 'lucide-react';
import type { ContractDocument } from '@/types';

const DOC_TYPE_LABELS: Record<ContractDocument['docType'], string> = {
  rg:               'RG',
  cpf:              'CPF',
  income_proof:     'Comprovante de Renda',
  residence_proof:  'Comprovante de Residência',
  selfie:           'Selfie Verificação',
  property_photo:   'Foto do Imóvel',
  signed_contract:  'Contrato Assinado',
  other:            'Outro Documento',
};

interface UploadItem {
  id: string;
  name: string;
  docType: ContractDocument['docType'];
  fileData: string;
  mimeType: string;
  sizeBytes: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

interface Props {
  existingDocuments?: ContractDocument[];
  onUpload: (doc: Omit<ContractDocument, 'id' | 'contractId' | 'uploadedBy' | 'uploadedByRole' | 'uploadedAt'>) => Promise<void>;
  onDelete?: (docId: string) => Promise<void>;
  allowedTypes?: ContractDocument['docType'][];
  multiple?: boolean;
  uploading?: boolean;
}

export function DocumentUploader({
  existingDocuments = [],
  onUpload,
  onDelete,
  allowedTypes,
  multiple = true,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [selectedType, setSelectedType] = useState<ContractDocument['docType']>('other');

  const readFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const processFiles = async (files: File[]) => {
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} excede 10MB`);
        continue;
      }

      const id = crypto.randomUUID();
      const item: UploadItem = {
        id, name: file.name, docType: selectedType,
        fileData: '', mimeType: file.type, sizeBytes: file.size, status: 'uploading',
      };
      setItems(prev => [...prev, item]);

      try {
        const fileData = await readFile(file);
        await onUpload({ name: file.name, docType: selectedType, fileData, mimeType: file.type, sizeBytes: file.size });
        setItems(prev => prev.map(i => i.id === id ? { ...i, fileData, status: 'done' } : i));
      } catch (err) {
        setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'error', error: 'Falha no envio' } : i));
      }
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    processFiles(Array.from(files));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const typeOptions = allowedTypes
    ? allowedTypes.map(t => ({ value: t, label: DOC_TYPE_LABELS[t] }))
    : Object.entries(DOC_TYPE_LABELS).map(([value, label]) => ({ value: value as ContractDocument['docType'], label }));

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Tipo do documento</label>
        <select
          value={selectedType}
          onChange={e => setSelectedType(e.target.value as ContractDocument['docType'])}
          className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-violet-500/50"
        >
          {typeOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Drop zone */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
          dragging ? 'border-violet-500/60 bg-violet-500/5' : 'border-border hover:border-violet-500/30 hover:bg-violet-500/3'
        }`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          accept="image/*,application/pdf"
          onChange={e => handleFiles(e.target.files)}
        />
        <Upload size={24} className="mx-auto mb-2 text-muted-foreground/60" />
        <p className="text-sm font-medium text-foreground">Arraste ou clique para enviar</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG — máx 10MB</p>
      </div>

      {/* Upload queue */}
      <AnimatePresence>
        {items.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-3 p-3 premium-surface rounded-xl"
          >
            {item.mimeType.startsWith('image/') ? (
              <Image size={18} className="text-blue-400 flex-shrink-0" />
            ) : (
              <FileText size={18} className="text-violet-400 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(item.sizeBytes)}</p>
            </div>
            {item.status === 'uploading' && (
              <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
            {item.status === 'done' && <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />}
            {item.status === 'error' && <AlertCircle size={16} className="text-red-400 flex-shrink-0" />}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Existing documents */}
      {existingDocuments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Documentos enviados</h4>
          {existingDocuments.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 p-3 premium-surface rounded-xl">
              <FileText size={16} className="text-violet-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{doc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {DOC_TYPE_LABELS[doc.docType]} · {formatSize(doc.sizeBytes)}
                </p>
              </div>
              <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(doc.id)}
                  className="p-1 rounded text-muted-foreground hover:text-red-400 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
