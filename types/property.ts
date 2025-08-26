export type CountryCode = 'US' | 'UK';

export interface Utility {
  id: string;
  provider: string;
  accountNumber: string;
  contactInfo?: string;
  paymentDayOfMonth?: number;
}

export interface Insurance {
  id: string;
  provider: string;
  policyNumber: string;
  renewalDate: string;
  annualCost: number;
  notificationId?: string;
}

export interface Tax {
  id: string;
  authority: string;
  dueDate: string;
  amount: number;
  notificationId?: string;
}

export interface Loan {
  id: string;
  lender: string;
  principalAmount: number;
  interestRate: number;
  loanTerm: number;
  monthlyPayment: number;
  paymentDayOfMonth?: number;
  notificationId?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  isChecked: boolean;
}

export interface Checklist {
  id: string;
  templateName: string;
  items: ChecklistItem[];
}

export interface Property {
  id: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: CountryCode;
  imageUrl: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  monthlyRent?: number;
  isOccupied?: boolean;
  utilities?: Utility[];
  insurances?: Insurance[];
  taxes?: Tax[];
  loans?: Loan[];
  checklists?: Checklist[];
  cashInvested?: number;
  purchasePrice?: number;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  leaseEndDate: string;
}

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  tenantId?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
  completedAt?: string;
}