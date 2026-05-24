export type UserRole = 'admin' | 'manager' | 'owner' | 'tenant';
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'partial' | 'awaiting_approval' | 'rejected';
export type PaymentMethod  = 'pix' | 'transfer' | 'boleto' | 'cash' | 'other';
export type PropertyStatus = 'occupied' | 'vacant' | 'maintenance' | 'reserved';
export type ContractStatus = 'active' | 'expiring' | 'expired' | 'terminated';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type NotificationType = 'payment' | 'contract' | 'maintenance' | 'system' | 'alert';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  plan: 'starter' | 'pro' | 'enterprise';
  createdAt: string;
  tenantId?: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  type: 'apartment' | 'house' | 'commercial' | 'studio';
  status: PropertyStatus;
  rentAmount: number;
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  image?: string;
  tenantId?: string;
  contractId?: string;
  floor?: number;
  amenities: string[];
  occupancyRate: number;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  cpf: string;
  score: number;
  propertyId?: string;
  contractId?: string;
  joinedAt: string;
  paymentHistory: PaymentStatus[];
  status: 'active' | 'inactive';
}

export interface Payment {
  id: string;
  tenantId: string;
  propertyId: string;
  contractId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: PaymentStatus;
  month: string;
  description: string;
  receiptUrl?: string;
  receiptNotes?: string;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface Contract {
  id: string;
  tenantId: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  adjustmentIndex: 'IGPM' | 'IPCA' | 'INPC';
  status: ContractStatus;
  depositAmount: number;
  guaranteeType: 'deposit' | 'guarantor' | 'insurance';
  clauses: string[];
  signedAt?: string;
}

export interface MaintenanceTicket {
  id: string;
  propertyId: string;
  tenantId?: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  images?: string[];
  category: 'plumbing' | 'electrical' | 'structural' | 'appliance' | 'other';
  assignedTo?: string;
  cost?: number;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  relatedId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, unknown>;
  targetTenantId?: string;
}

export type RentReminderType =
  | 'due_3d' | 'due_2d' | 'due_1d' | 'due_today'
  | 'overdue_1d' | 'overdue_3d' | 'overdue_7d' | 'overdue_14d';

export interface RentReminder {
  id: string;
  tenantId: string;
  paymentId: string;
  reminderType: RentReminderType;
  sentAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  monthlyRevenue: number;
  overdueAmount: number;
  activeContracts: number;
  totalProperties: number;
  occupancyRate: number;
  openTickets: number;
  pendingPayments: number;
}

export interface ChartDataPoint {
  month: string;
  revenue: number;
  expenses: number;
  occupancy: number;
}

export type InspectionType = 'entrada' | 'saida' | 'periodica';
export type InspectionStatus = 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';
export type RoomCondition = 'otimo' | 'bom' | 'regular' | 'ruim' | 'pessimo';

export interface InspectionItem {
  id: string;
  name: string;
  condition: RoomCondition;
  observation?: string;
}

export interface InspectionRoom {
  id: string;
  name: string;
  condition: RoomCondition;
  observations: string;
  photos: string[];
  items: InspectionItem[];
}

export type NoticeCategory = 'aviso' | 'recomendacao' | 'obrigacao';

export interface Notice {
  id: string;
  tenantId: string;
  propertyId: string;
  category: NoticeCategory;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Inspection {
  id: string;
  propertyId: string;
  tenantId?: string;
  type: InspectionType;
  status: InspectionStatus;
  scheduledDate: string;
  completedDate?: string;
  inspector: string;
  rooms: InspectionRoom[];
  generalScore: number;
  generalObservations?: string;
  createdAt: string;
  signedByTenant?: boolean;
  signedByOwner?: boolean;
}

// ─────────────────────────────────────────────
// Digital Contract System
// ─────────────────────────────────────────────

export type DigitalContractStatus =
  | 'draft'
  | 'pending_review'
  | 'sent'
  | 'viewed'
  | 'awaiting_signature'
  | 'signed_tenant'
  | 'signed_landlord'
  | 'pending_notarization'
  | 'completed'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export type ClauseCategory = 'general' | 'payment' | 'rules' | 'maintenance' | 'termination' | 'custom';

export interface ContractClause {
  id: string;
  title: string;
  content: string;
  category: ClauseCategory;
  order: number;
  required: boolean;
}

export interface ContractSignature {
  id: string;
  contractId: string;
  signerName: string;
  signerEmail: string;
  signerRole: 'landlord' | 'tenant' | 'guarantor';
  signatureData: string; // base64 PNG from canvas
  signedAt: string;
  ipAddress?: string;
}

export interface ContractDocument {
  id: string;
  contractId: string;
  name: string;
  docType: 'rg' | 'cpf' | 'income_proof' | 'residence_proof' | 'selfie' | 'property_photo' | 'signed_contract' | 'other';
  uploadedBy: string;
  uploadedByRole: 'landlord' | 'tenant';
  uploadedAt: string;
  fileData: string; // base64
  mimeType: string;
  sizeBytes: number;
}

export type ContractHistoryEventType =
  | 'created' | 'edited' | 'sent' | 'viewed' | 'signed'
  | 'signed_landlord' | 'signed_tenant'
  | 'rejected' | 'completed' | 'cancelled' | 'document_uploaded'
  | 'status_changed' | 'comment_added' | 'reminder_sent';

export interface ContractHistoryEvent {
  id: string;
  contractId: string;
  type: ContractHistoryEventType;
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ContractUtilities {
  water: 'landlord' | 'tenant';
  electricity: 'landlord' | 'tenant';
  gas: 'landlord' | 'tenant';
  internet: 'landlord' | 'tenant';
  condominiumFee: 'landlord' | 'tenant';
  iptu: 'landlord' | 'tenant';
}

export interface DigitalContract {
  id: string;
  title: string;
  status: DigitalContractStatus;

  // Parties
  landlordId: string;
  landlordName?: string;
  landlordEmail?: string;
  tenantId: string;
  tenantName?: string;
  tenantEmail?: string;

  // Property
  propertyId: string;
  propertyName?: string;
  propertyAddress?: string;

  // Financial
  rentAmount: number;
  dueDay: number;
  depositAmount: number;
  depositInstallments?: number;
  lateFeePercent: number;
  lateInterestPercent: number;
  adjustmentIndex: 'IGPM' | 'IPCA' | 'INPC';

  // Dates
  startDate: string;
  endDate: string;
  duration: number; // months
  moveInDate: string;

  // Payment
  paymentMethod: string;
  pixKey?: string;
  bankInfo?: string;

  // Clauses
  clauses: ContractClause[];

  // Rules
  petPolicy: 'allowed' | 'not_allowed' | 'case_by_case';
  smokingPolicy: 'allowed' | 'not_allowed';
  sublettingAllowed: boolean;
  maxOccupants?: number;

  // Utilities
  utilities: ContractUtilities;

  // Guarantor
  guaranteeType: 'deposit' | 'guarantor' | 'insurance' | 'none';
  guarantorName?: string;
  guarantorCpf?: string;
  guarantorEmail?: string;
  guarantorPhone?: string;

  // Signatures
  signatures: ContractSignature[];

  // Documents
  documents: ContractDocument[];

  // History / audit
  history: ContractHistoryEvent[];

  // Metadata
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  viewedAt?: string;
  signedByTenantAt?: string;
  signedByLandlordAt?: string;
  completedAt?: string;
  expiresAt?: string;
  rejectionReason?: string;

  viewCount: number;
  templateId?: string;
  version: number;
  internalNotes?: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: 'residential' | 'commercial' | 'seasonal';
  clauses: ContractClause[];
  isBuiltIn: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  icon?: string;
}
