import React from 'react';
import {
  LayoutDashboard,
  Users,
  Layers,
  Package,
  Building,
  Receipt,
  Wallet,
  Coins,
  FileBarChart,
  Settings,
  Sparkles,
} from 'lucide-react';
import { ActiveTab } from '../../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onClose: () => void;
  counts: {
    employees: number;
    departments: number;
    products: number;
    clients: number;
    invoices: number;
    expenses: number;
    payroll: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
  counts,
}) => {
  const navSections = [
    {
      title: 'UTAMA',
      items: [
        {
          id: 'dashboard' as ActiveTab,
          label: 'Dashboard Ikhtisar',
          icon: LayoutDashboard,
          badge: null,
        },
      ],
    },
    {
      title: 'MASTER DATA (CRUD)',
      items: [
        {
          id: 'employees' as ActiveTab,
          label: 'Master Pegawai',
          icon: Users,
          badge: counts.employees,
        },
        {
          id: 'departments' as ActiveTab,
          label: 'Master Departemen',
          icon: Layers,
          badge: counts.departments,
        },
        {
          id: 'products' as ActiveTab,
          label: 'Master Produk & Layanan',
          icon: Package,
          badge: counts.products,
        },
        {
          id: 'clients' as ActiveTab,
          label: 'Master Klien & Vendor',
          icon: Building,
          badge: counts.clients,
        },
      ],
    },
    {
      title: 'TRANSAKSI DATA (CRUD)',
      items: [
        {
          id: 'invoices' as ActiveTab,
          label: 'Faktur & Penjualan',
          icon: Receipt,
          badge: counts.invoices,
        },
        {
          id: 'expenses' as ActiveTab,
          label: 'Kas & Pengeluaran',
          icon: Wallet,
          badge: counts.expenses,
        },
        {
          id: 'payroll' as ActiveTab,
          label: 'Penggajian / Payroll',
          icon: Coins,
          badge: counts.payroll,
        },
      ],
    },
    {
      title: 'LAPORAN & ANALITIK',
      items: [
        {
          id: 'reports' as ActiveTab,
          label: 'Laporan Perusahaan',
          icon: FileBarChart,
          badge: null,
        },
      ],
    },
    {
      title: 'PENGATURAN',
      items: [
        {
          id: 'profile' as ActiveTab,
          label: 'Profil Perusahaan',
          icon: Settings,
          badge: null,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden no-print"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static no-print ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden">
          <span className="font-bold text-slate-800 text-sm">Menu Navigasi ERP</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            &times;
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <h4 className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                {section.title}
              </h4>
              <div className="space-y-0.5 pt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectTab(item.id);
                        if (isOpen) onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 transition ${
                            isActive
                              ? 'text-white'
                              : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== null && item.badge !== undefined && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom card: SSoT notification */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/70 m-3 rounded-2xl border">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-800 leading-tight">
                Firebase Realtime DB
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                Data tersinkron otomatis dan persisten ke cloud. Tanpa localStorage.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
