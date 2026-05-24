import { z } from 'zod';

export const PropertySchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  type: z.enum(['apartment', 'house', 'commercial', 'studio']),
  status: z.enum(['occupied', 'vacant', 'maintenance', 'reserved']),
  rentAmount: z.number().positive(),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  area: z.number().positive(),
  image: z.string().url().optional().or(z.literal('')),
  tenantId: z.string().optional(),
  contractId: z.string().optional(),
  floor: z.number().int().optional(),
  amenities: z.array(z.string()),
  occupancyRate: z.number().min(0).max(100),
});

export const TenantSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().or(z.literal('')),
  phone: z.string().min(1).max(30),
  avatar: z.string().url().optional().or(z.literal('')),
  cpf: z.string().min(1).max(20),
  score: z.number().int().min(0).max(1000),
  propertyId: z.string().optional(),
  contractId: z.string().optional(),
  joinedAt: z.string().min(1),
  paymentHistory: z.array(z.enum(['paid', 'pending', 'overdue', 'partial'])),
  status: z.enum(['active', 'inactive']),
});

export const ALL_PAYMENT_STATUSES = ['paid', 'pending', 'overdue', 'partial', 'awaiting_approval', 'rejected'] as const;
export const ALL_PAYMENT_METHODS  = ['pix', 'transfer', 'boleto', 'cash', 'other'] as const;

export const PaymentSchema = z.object({
  tenantId:    z.string().min(1),
  propertyId:  z.string().min(1),
  contractId:  z.string().min(1),
  amount:      z.number().positive(),
  dueDate:     z.string().min(1),
  paidDate:    z.string().optional(),
  status:      z.enum(ALL_PAYMENT_STATUSES),
  month:       z.string().regex(/^\d{4}-\d{2}$/, 'Formato YYYY-MM esperado'),
  description: z.string().min(1).max(500),
  receiptUrl:  z.string().optional(),
});

export const ReceiptSubmissionSchema = z.object({
  receiptData:   z.string().min(1, 'Comprovante obrigatório'),
  notes:         z.string().max(500).optional(),
  paymentMethod: z.enum(ALL_PAYMENT_METHODS).optional(),
  paymentDate:   z.string().optional(),
});

export const RejectPaymentSchema = z.object({
  reason: z.string().min(5, 'Informe o motivo com pelo menos 5 caracteres').max(500),
});

export const ContractSchema = z.object({
  tenantId: z.string().min(1),
  propertyId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  rentAmount: z.number().positive(),
  adjustmentIndex: z.enum(['IGPM', 'IPCA', 'INPC']),
  status: z.enum(['active', 'expiring', 'expired', 'terminated']),
  depositAmount: z.number().nonnegative(),
  guaranteeType: z.enum(['deposit', 'guarantor', 'insurance']),
  clauses: z.array(z.string()),
  signedAt: z.string().optional(),
});

export const TicketSchema = z.object({
  propertyId: z.string().min(1),
  tenantId: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  resolvedAt: z.string().datetime().optional(),
  images: z.array(z.string().min(1)).max(5).optional(),
  category: z.enum(['plumbing', 'electrical', 'structural', 'appliance', 'other']),
  assignedTo: z.string().optional(),
  cost: z.number().nonnegative().optional(),
});

export const CreateTicketSchema = z.object({
  propertyId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  category: z.enum(['plumbing', 'electrical', 'structural', 'appliance', 'other']),
  images: z.array(z.string().min(1)).max(5).optional(),
});

export const NotificationSchema = z.object({
  type: z.enum(['payment', 'contract', 'maintenance', 'system', 'alert']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  read: z.boolean(),
  createdAt: z.string().datetime(),
  actionUrl: z.string().url().optional(),
  relatedId: z.string().optional(),
});

export const InspectionItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  condition: z.enum(['otimo', 'bom', 'regular', 'ruim', 'pessimo']),
  observation: z.string().optional(),
});

export const InspectionRoomSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  condition: z.enum(['otimo', 'bom', 'regular', 'ruim', 'pessimo']),
  observations: z.string(),
  photos: z.array(z.string()),
  items: z.array(InspectionItemSchema),
});

export const InspectionSchema = z.object({
  propertyId: z.string().min(1),
  tenantId: z.string().optional(),
  type: z.enum(['entrada', 'saida', 'periodica']),
  status: z.enum(['agendada', 'em_andamento', 'concluida', 'cancelada']),
  scheduledDate: z.string().min(1),
  completedDate: z.string().optional(),
  inspector: z.string().min(1),
  rooms: z.array(InspectionRoomSchema),
  generalScore: z.number().min(0).max(10),
  generalObservations: z.string().optional(),
  createdAt: z.string().min(1),
  signedByTenant: z.boolean().optional(),
  signedByOwner: z.boolean().optional(),
});

export const NoticeSchema = z.object({
  tenantId: z.string().min(1),
  propertyId: z.string().min(1),
  category: z.enum(['aviso', 'recomendacao', 'obrigacao']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(200),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido').max(20),
  cpf: z.string().min(11, 'CPF/CNPJ inválido').max(20),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').max(128),
  confirmPassword: z.string().min(8).max(128),
  terms: z.literal(true, 'Aceite os termos para continuar'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

// ─── Digital Contract schemas ─────────────────────────────────────────────────

export const ContractClauseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  category: z.enum(['general', 'payment', 'rules', 'maintenance', 'termination', 'custom']),
  order: z.number().int().nonnegative(),
  required: z.boolean(),
});

export const ContractUtilitiesSchema = z.object({
  water: z.enum(['landlord', 'tenant']),
  electricity: z.enum(['landlord', 'tenant']),
  gas: z.enum(['landlord', 'tenant']),
  internet: z.enum(['landlord', 'tenant']),
  condominiumFee: z.enum(['landlord', 'tenant']),
  iptu: z.enum(['landlord', 'tenant']),
});

export const CreateDigitalContractSchema = z.object({
  title: z.string().min(1).max(300),
  tenantId: z.string().min(1),
  propertyId: z.string().min(1),
  rentAmount: z.number().positive(),
  dueDay: z.number().int().min(1).max(28),
  depositAmount: z.number().nonnegative(),
  depositInstallments: z.number().int().positive().optional(),
  lateFeePercent: z.number().min(0).max(100),
  lateInterestPercent: z.number().min(0).max(100),
  adjustmentIndex: z.enum(['IGPM', 'IPCA', 'INPC']),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  duration: z.number().int().positive(),
  moveInDate: z.string().min(1),
  paymentMethod: z.string().min(1),
  pixKey: z.string().optional(),
  bankInfo: z.string().optional(),
  clauses: z.array(ContractClauseSchema),
  petPolicy: z.enum(['allowed', 'not_allowed', 'case_by_case']),
  smokingPolicy: z.enum(['allowed', 'not_allowed']),
  sublettingAllowed: z.boolean(),
  maxOccupants: z.number().int().positive().optional(),
  utilities: ContractUtilitiesSchema,
  guaranteeType: z.enum(['deposit', 'guarantor', 'insurance', 'none']),
  guarantorName: z.string().optional(),
  guarantorCpf: z.string().optional(),
  guarantorEmail: z.string().email().optional().or(z.literal('')),
  guarantorPhone: z.string().optional(),
  templateId: z.string().optional(),
  internalNotes: z.string().max(2000).optional(),
});

export const UpdateDigitalContractSchema = CreateDigitalContractSchema.partial().extend({
  title: z.string().min(1).max(300).optional(),
});

export const SignContractSchema = z.object({
  signatureData: z.string().min(1, 'Assinatura obrigatória'),
  signerRole: z.enum(['landlord', 'tenant', 'guarantor']),
});

export const RejectContractSchema = z.object({
  reason: z.string().min(5).max(1000),
});

export const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  category: z.enum(['residential', 'commercial', 'seasonal']),
  clauses: z.array(ContractClauseSchema),
});

export type CreateDigitalContractInput = z.infer<typeof CreateDigitalContractSchema>;
export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;
