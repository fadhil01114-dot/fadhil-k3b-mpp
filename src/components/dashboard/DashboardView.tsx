import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Receipt,
  Layers,
  ArrowUpRight,
  PlusCircle,
  Clock,
  CheckCircle,
} from 'lucide-react';
import {
  Employee,
  Department,
  Product,
  Client,
  SalesInvoice,
  Expense,
  Payroll,
  ActiveTab,
} from '../../types';
import { formatRupiah, formatDate } from '../../utils/formatters';

interface DashboardViewProps {
  employees: Employee[];
  departments: Department[];
  products: Product[];
  clients: Client[];
  invoices: SalesInvoice[];
  expenses: Expense[];
  payroll: Payroll[];
  onNavigate: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  employees,
  departments,
  products,
  clients,
  invoices,
  expenses,
  payroll,
  onNavigate,
}) => {
  // Financial calculations
  const totalRevenue = invoices
    .filter((inv) => inv.status === 'Lunas')
    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  const pendingRevenue = invoices
    .filter((inv) => inv.status === 'Terkirim' || inv.status === 'Jatuh Tempo')
    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  const totalExpenses = expenses
    .filter((exp) => exp.status === 'Disetujui')
    .reduce((sum, exp) => sum + (exp.amount || 0), 0);

  const totalPayrollPaid = payroll
    .filter((p) => p.status === 'Dibayar')
    .reduce((sum, p) => sum + (p.netSalary || 0), 0);

  const totalAllExpenses = totalExpenses + totalPayrollPaid;
  const netProfit = totalRevenue - totalAllExpenses;
  const activeEmployeesCount = employees.filter((e) => e.status === 'Aktif').length;

  return (
    <div className="space-y-6 pb-8">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg shadow-blue-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs mb-2">
            <span>✨ Sistem Terpadu Real-Time</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Ringkasan Manajemen Eksekutif
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
            Semua data master, transaksi penjualan, arus kas operasional, dan laporan perusahaan tersinkronisasi langsung ke Firebase Firestore.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('invoices')}
            className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition"
          >
            <PlusCircle className="w-4 h-4" />
            + Buat Faktur Baru
          </button>
          <button
            type="button"
            onClick={() => onNavigate('expenses')}
            className="px-4 py-2.5 bg-blue-600/60 hover:bg-blue-600 border border-white/30 text-white text-xs font-bold rounded-xl backdrop-blur-xs flex items-center gap-1.5 transition"
          >
            <PlusCircle className="w-4 h-4" />
            + Catat Pengeluaran
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pendapatan Lunas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pendapatan (Lunas)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-slate-800">
              {formatRupiah(totalRevenue)}
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Dari {invoices.filter((i) => i.status === 'Lunas').length} faktur lunas
            </p>
          </div>
        </div>

        {/* Card 2: Total Pengeluaran */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Beban & Kas Operasional
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-slate-800">
              {formatRupiah(totalAllExpenses)}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Kas: {formatRupiah(totalExpenses)} | Gaji: {formatRupiah(totalPayrollPaid)}
            </p>
          </div>
        </div>

        {/* Card 3: Laba Bersih */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Estimasi Laba Bersih
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                netProfit >= 0
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-amber-100 text-amber-600'
              }`}
            >
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3
              className={`text-xl font-extrabold ${
                netProfit >= 0 ? 'text-blue-700' : 'text-amber-700'
              }`}
            >
              {formatRupiah(netProfit)}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Margin Operasional:{' '}
              {totalRevenue > 0
                ? `${Math.round((netProfit / totalRevenue) * 100)}%`
                : '0%'}
            </p>
          </div>
        </div>

        {/* Card 4: Karyawan Aktif & Piutang */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              SDM & Piutang Berjalan
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-slate-800">
              {activeEmployeesCount} Pegawai Aktif
            </h3>
            <p className="text-[11px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Piutang: {formatRupiah(pendingRevenue)}
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Master Data Quick Counters & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Master Data Stats */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-800">Status Master Data</h4>
              <span className="text-xs text-blue-600 font-semibold">Tersimpan di Cloud</span>
            </div>

            <div className="space-y-3">
              <div
                onClick={() => onNavigate('employees')}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Master Pegawai</p>
                    <p className="text-[11px] text-slate-500">
                      {employees.length} personil terdaftar
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => onNavigate('departments')}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Master Departemen</p>
                    <p className="text-[11px] text-slate-500">
                      {departments.length} divisi organisasi
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => onNavigate('products')}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Produk & Layanan</p>
                    <p className="text-[11px] text-slate-500">
                      {products.length} SKU katalog
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => onNavigate('clients')}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Klien & Vendor</p>
                    <p className="text-[11px] text-slate-500">
                      {clients.length} rekanan bisnis
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Lihat Laporan Lengkap & Cetak
            </button>
          </div>
        </div>

        {/* Right 2 Columns: Transaksi Faktur Terbaru */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Faktur & Penjualan Terbaru
              </h4>
              <p className="text-xs text-slate-500">
                Data real-time tagihan klien dari Firestore
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('invoices')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Semua Faktur &rarr;
            </button>
          </div>

          {invoices.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">Belum ada data faktur penjualan</p>
              <button
                type="button"
                onClick={() => onNavigate('invoices')}
                className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
              >
                + Buat Faktur Pertama
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-600 uppercase font-semibold">
                    <th className="pb-3 pl-1">No Faktur</th>
                    <th className="pb-3">Klien</th>
                    <th className="pb-3">Tanggal</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3 text-right pr-1">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.slice(0, 5).map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 pl-1 font-bold text-blue-700">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 font-medium text-slate-800">
                        {inv.clientName}
                      </td>
                      <td className="py-3 text-slate-500">{formatDate(inv.date)}</td>
                      <td className="py-3 font-bold text-slate-900">
                        {formatRupiah(inv.totalAmount)}
                      </td>
                      <td className="py-3 text-right pr-1">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'Lunas'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : inv.status === 'Terkirim'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : inv.status === 'Jatuh Tempo'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
