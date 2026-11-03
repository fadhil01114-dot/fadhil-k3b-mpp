export interface AdminUser {
  id?: string;
  username: string;
  email: string;
  name: string;
  role: string;
  password?: string;
  createdAt?: string;
}

export interface Employee {
  id?: string;
  nip: string;
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  departmentName: string;
  position: string;
  salary: number;
  status: 'Aktif' | 'Cuti' | 'Resign';
  joinDate: string;
  createdAt?: string;
}

export interface Department {
  id?: string;
  code: string;
  name: string;
  head: string;
  budget: number;
  location: string;
  createdAt?: string;
}

export interface Product {
  id?: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  costPrice: number;
  stock: number;
  createdAt?: string;
}

export interface Client {
  id?: string;
  name: string;
  pic: string;
  type: 'Pelanggan' | 'Vendor' | 'Partner';
  email: string;
  phone: string;
  address: string;
  createdAt?: string;
}

export interface InvoiceItem {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface SalesInvoice {
  id?: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  status: 'Draft' | 'Terkirim' | 'Lunas' | 'Jatuh Tempo';
  notes?: string;
  createdAt?: string;
}

export interface Expense {
  id?: string;
  referenceNo: string;
  date: string;
  category: 'Operasional' | 'Utilitas' | 'Pemasaran' | 'Sewa' | 'Logistik' | 'Peralatan' | 'Lainnya';
  departmentId: string;
  departmentName: string;
  amount: number;
  recipient: string;
  description: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  createdAt?: string;
}

export interface Payroll {
  id?: string;
  period: string; // e.g., '2026-11'
  employeeId: string;
  employeeName: string;
  nip: string;
  department: string;
  basicSalary: number;
  allowance: number;
  deduction: number;
  netSalary: number;
  paymentDate: string;
  status: 'Pending' | 'Dibayar';
  notes?: string;
  createdAt?: string;
}

export interface CompanyProfile {
  id?: string;
  companyName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  npwp: string;
  currency: string;
  updatedAt?: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'employees'
  | 'departments'
  | 'products'
  | 'clients'
  | 'invoices'
  | 'expenses'
  | 'payroll'
  | 'reports'
  | 'profile';
