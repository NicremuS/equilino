export type UserRole = 'admin' | 'manager' | 'owner' | 'tenant';
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'partial';
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
