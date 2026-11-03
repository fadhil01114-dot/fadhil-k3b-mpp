import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, testConnection } from './firebase/config';
import {
  AdminUser,
  Employee,
  Department,
  Product,
  Client,
  SalesInvoice,
  Expense,
  Payroll,
  CompanyProfile,
  ActiveTab,
} from './types';
import {
  subscribeToCollection,
  seedInitialEnterpriseData,
} from './services/firestoreService';
import { doc, onSnapshot } from 'firebase/firestore';

// Layout & Auth
import { LoginForm } from './components/auth/LoginForm';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { EmployeesView } from './components/master/EmployeesView';
import { DepartmentsView } from './components/master/DepartmentsView';
import { ProductsView } from './components/master/ProductsView';
import { ClientsView } from './components/master/ClientsView';
import { SalesInvoicesView } from './components/transactions/SalesInvoicesView';
import { ExpensesView } from './components/transactions/ExpensesView';
import { PayrollView } from './components/transactions/PayrollView';
import { ReportsView } from './components/reports/ReportsView';
import { CompanyProfileView } from './components/profile/CompanyProfileView';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Firestore Real-Time State (Single Source of Truth)
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);

  // 1. Initial boot: verify Firestore connection and seed initial enterprise data
  useEffect(() => {
    testConnection();
    seedInitialEnterpriseData();

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Real-time subscriptions attached when administrator is logged in
  const isAuthenticated = !!adminUser || !!user;

  useEffect(() => {
    if (!isAuthenticated) return;

    // Subscribe to Master Data
    const unsubEmployees = subscribeToCollection<Employee>('employees', (data) =>
      setEmployees(data)
    );
    const unsubDepartments = subscribeToCollection<Department>('departments', (data) =>
      setDepartments(data)
    );
    const unsubProducts = subscribeToCollection<Product>('products', (data) =>
      setProducts(data)
    );
    const unsubClients = subscribeToCollection<Client>('clients', (data) =>
      setClients(data)
    );

    // Subscribe to Transactional Data
    const unsubInvoices = subscribeToCollection<SalesInvoice>('sales_invoices', (data) =>
      setInvoices(data)
    );
    const unsubExpenses = subscribeToCollection<Expense>('expenses', (data) =>
      setExpenses(data)
    );
    const unsubPayroll = subscribeToCollection<Payroll>('payrolls', (data) =>
      setPayroll(data)
    );

    // Subscribe to Company Profile
    const unsubProfile = onSnapshot(doc(db, 'company_profile', 'main'), (snap) => {
      if (snap.exists()) {
        setCompanyProfile({ ...(snap.data() as CompanyProfile), id: snap.id });
      }
    });

    return () => {
      unsubEmployees();
      unsubDepartments();
      unsubProducts();
      unsubClients();
      unsubInvoices();
      unsubExpenses();
      unsubPayroll();
      unsubProfile();
    };
  }, [isAuthenticated]);

  // Loading screen while evaluating initial auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-700">Memuat Sistem Nusantara ERP...</p>
        <p className="text-xs text-slate-400 mt-1">Menghubungkan ke Firebase Cloud Firestore</p>
      </div>
    );
  }

  // DEFAULT VIEW: Login Form (Requirement 3: "Harus ada form login sebagai tampilan default")
  if (!isAuthenticated) {
    return (
      <LoginForm
        onSuccess={(admin) => {
          setAdminUser(admin);
          setActiveTab('dashboard');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header Navigation */}
      <Navbar
        user={user}
        adminUser={adminUser}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onLogout={() => {
          setAdminUser(null);
          setUser(null);
          setActiveTab('dashboard');
        }}
      />

      {/* Main Workspace with Sidebar & Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          counts={{
            employees: employees.length,
            departments: departments.length,
            products: products.length,
            clients: clients.length,
            invoices: invoices.length,
            expenses: expenses.length,
            payroll: payroll.length,
          }}
        />

        {/* Dynamic View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/70">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                employees={employees}
                departments={departments}
                products={products}
                clients={clients}
                invoices={invoices}
                expenses={expenses}
                payroll={payroll}
                onNavigate={setActiveTab}
              />
            )}

            {activeTab === 'employees' && (
              <EmployeesView employees={employees} departments={departments} />
            )}

            {activeTab === 'departments' && (
              <DepartmentsView departments={departments} employees={employees} />
            )}

            {activeTab === 'products' && <ProductsView products={products} />}

            {activeTab === 'clients' && <ClientsView clients={clients} />}

            {activeTab === 'invoices' && (
              <SalesInvoicesView
                invoices={invoices}
                clients={clients}
                products={products}
                companyProfile={companyProfile}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpensesView expenses={expenses} departments={departments} />
            )}

            {activeTab === 'payroll' && (
              <PayrollView
                payroll={payroll}
                employees={employees}
                companyProfile={companyProfile}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                employees={employees}
                departments={departments}
                products={products}
                clients={clients}
                invoices={invoices}
                expenses={expenses}
                payroll={payroll}
                companyProfile={companyProfile}
              />
            )}

            {activeTab === 'profile' && (
              <CompanyProfileView companyProfile={companyProfile} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
