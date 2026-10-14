export interface CustomerItem {
  customerId: number;
  firstName: string;
  lastName: string;
  email: string;
  function: string | null;
  isAdmin: boolean;
}

export interface CompanyListItem {
  companyId: number;
  name: string;
  shortName: string;
  userNumber: number;
  contractCount: number;
  nextEndDate: string | null;
  customers: CustomerItem[];
}

export interface ContractLine {
  contractId: number;
  productId: number;
  productName: string;
  startDate: string;
  endDate: string;
}

export interface CompanyDetail {
  companyId: number;
  name: string;
  shortName: string;
  userNumber: number;
  contracts: ContractLine[];
  customers: CustomerItem[];
}

export interface ContractInput {
  productId: number;
  startDate: string;
  endDate: string;
}

export interface AdminCustomerInput {
  firstName: string;
  lastName: string;
  email: string;
  function: string | null;
}

export interface SaveCompanyPayload {
  name?: string;
  shortName: string;
  userNumber: number;
  contracts: ContractInput[];
  admin: AdminCustomerInput | null;
}

export interface CompanySaved {
  companyId: number;
  adminEmail: string | null;
  adminPassword: string | null;
}

export interface SaveContractPayload {
  productId: number;
  startDate: string;
  endDate: string;
}

export interface SaveCustomerPayload {
  firstName: string;
  lastName: string;
  email: string;
  function: string | null;
  isAdmin: boolean;
  resetPassword: boolean;
  sendCredentials: boolean;
}

export interface CustomerSaved {
  customerId: number;
  password: string | null;
}

export type ContractHistoryType = 'Creation' | 'Modification' | 'Suppression' | 'Renouvellement';

export interface ContractHistoryItem {
  historyId: number;
  companyName: string;
  type: ContractHistoryType;
  productName: string | null;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface ContractHistoryQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string | null;
}

export type ContractState = 'active' | 'expiring' | 'expired' | 'future';

export function contractState(startDate: string, endDate: string, today = new Date()): ContractState {
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (end < day) {
    return 'expired';
  }
  if (start > day) {
    return 'future';
  }
  return end - day <= 90 * 86_400_000 ? 'expiring' : 'active';
}

export function toDateInput(value: string | null | undefined): string {
  return value ? value.substring(0, 10) : '';
}
