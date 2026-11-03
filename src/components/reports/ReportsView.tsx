import React, { useState } from 'react';
import {
  FileBarChart,
  Download,
  Printer,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Layers,
  Users,
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
  CompanyProfile,
} from '../../types';
import { formatRupiah, formatDate } from '../../utils/formatters';

interface ReportsViewProps {
  employees: Employee[];
  departments: Department[];
  products: Product[];
  clients: Client[];
  invoices: SalesInvoice[];
  expenses: Expense[];
  payroll: Payroll[];
  companyProfile: CompanyProfile | null;
}

type ReportType = 'income_statement' | 'sales_summary' | 'expense_dept' | 'hr_summary';

export const ReportsView: React.FC<ReportsViewProps> = ({
  employees,
  departments,
  products,
  clients,
  invoices,
  expenses,
  payroll,
  companyProfile,
}) => {
  const [reportType, setReportType] = useState<ReportType>('income_statement');
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  // Filtered transactions by date range
  const dateFilteredInvoices = invoices.filter((inv) => {
    if (!inv.date) return true;
    return inv.date >= startDate && inv.date <= endDate;
  });

  const dateFilteredExpenses = expenses.filter((exp) => {
    const matchDate = !exp.date || (exp.date >= startDate && exp.date <= endDate);
    const matchDept = selectedDept === 'ALL' || exp.departmentId === selectedDept;
    return matchDate && matchDept;
  });

  const dateFilteredPayroll = payroll.filter((p) => {
    if (!p.paymentDate) return true;
    return p.paymentDate >= startDate && p.paymentDate <= endDate;
  });

  // Financial aggregates
  const totalRevenue = dateFilteredInvoices
    .filter((i) => i.status === 'Lunas')
    .reduce((sum, i) => sum + (i.totalAmount || 0), 0);

  const totalReceivables = dateFilteredInvoices
    .filter((i) => i.status === 'Terkirim' || i.status === 'Jatuh Tempo')
    .reduce((sum, i) => sum + (i.totalAmount || 0), 0);

  const totalOperationalExpenses = dateFilteredExpenses
    .filter((e) => e.status === 'Disetujui')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalPayrollExpenses = dateFilteredPayroll
    .filter((p) => p.status === 'Dibayar')
    .reduce((sum, p) => sum + (p.netSalary || 0), 0);

  const totalExpenses = totalOperationalExpenses + totalPayrollExpenses;
  const netIncome = totalRevenue - totalExpenses;

  // CSV Export Function
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    let filename = `laporan_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;

    if (reportType === 'income_statement') {
      csvContent += 'Kategori Keuangan,Nominal (IDR),Keterangan\r\n';
      csvContent += `Pendapatan Penjualan (Lunas),${totalRevenue},Invoice Pelanggan Selesai\r\n`;
      csvContent += `Beban Operasional Kas,${totalOperationalExpenses},Beban Operasional Disetujui\r\n`;
      csvContent += `Beban Gaji Karyawan,${totalPayrollExpenses},Payroll Terbayar\r\n`;
      csvContent += `Total Beban Usaha,${totalExpenses},Total Beban\r\n`;
      csvContent += `Laba Bersih Operasional,${netIncome},Estimasi Profit\r\n`;
    } else if (reportType === 'sales_summary') {
      csvContent += 'No Invoice,Klien,Tanggal,Jatuh Tempo,Total Tagihan,Status\r\n';
      dateFilteredInvoices.forEach((inv) => {
        csvContent += `"${inv.invoiceNumber}","${inv.clientName}","${inv.date}","${inv.dueDate}",${inv.totalAmount},"${inv.status}"\r\n`;
      });
    } else if (reportType === 'expense_dept') {
      csvContent += 'No Ref,Tanggal,Departemen,Kategori,Penerima,Nominal,Status\r\n';
      dateFilteredExpenses.forEach((exp) => {
        csvContent += `"${exp.referenceNo}","${exp.date}","${exp.departmentName}","${exp.category}","${exp.recipient}",${exp.amount},"${exp.status}"\r\n`;
      });
    } else {
      csvContent += 'NIP,Nama Pegawai,Departemen,Jabatan,Gaji Pokok,Status\r\n';
      employees.forEach((emp) => {
        csvContent += `"${emp.nip}","${emp.name}","${emp.departmentName}","${emp.position}",${emp.salary},"${emp.status}"\r\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Pusat Laporan & Analitika Perusahaan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis kinerja keuangan, realisasi anggaran departemen, dan rekapitulasi data operasional
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor CSV (Excel)
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-500/20 flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Laporan Resmi
          </button>
        </div>
      </div>

      {/* Filter & Sub-Nav Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 no-print">
        {/* Report Category Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => setReportType('income_statement')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              reportType === 'income_statement'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Laporan Laba Rugi & Arus Kas
          </button>

          <button
            type="button"
            onClick={() => setReportType('sales_summary')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              reportType === 'sales_summary'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Rekapitulasi Faktur Penjualan
          </button>

          <button
            type="button"
            onClick={() => setReportType('expense_dept')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              reportType === 'expense_dept'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Pengeluaran per Departemen
          </button>

          <button
            type="button"
            onClick={() => setReportType('hr_summary')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              reportType === 'hr_summary'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Rekapitulasi SDM & Gaji
          </button>
        </div>

        {/* Date Filter & Department selector */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 font-semibold">Periode:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
            <span className="text-slate-400">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          {reportType === 'expense_dept' && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-slate-600 font-semibold">Departemen:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="ALL">Semua Departemen</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Printable Report Document Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6 printable-document">
        {/* Kop Laporan Resmi */}
        <div className="flex items-start justify-between border-b pb-6 border-slate-200">
          <div>
            <h1 className="text-xl font-black text-blue-700 tracking-tight">
              {companyProfile?.companyName || 'PT Nusantara Mega Prima Mandiri'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {companyProfile?.address ||
                'Gedung Menara Mandiri Lt. 18, Jl. Jend. Sudirman Kav. 54-55, Jakarta Selatan'}
            </p>
            <p className="text-xs text-slate-500">
              Telp: {companyProfile?.phone || '+62 21 5289 8000'} | NPWP:{' '}
              {companyProfile?.npwp || '01.345.678.9-021.000'}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-black text-slate-900 uppercase">
              {reportType === 'income_statement' && 'Laporan Laba Rugi & Arus Kas'}
              {reportType === 'sales_summary' && 'Rekapitulasi Faktur Penjualan'}
              {reportType === 'expense_dept' && 'Laporan Beban Kas Departemen'}
              {reportType === 'hr_summary' && 'Laporan Rekapitulasi SDM & Payroll'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Rentang: {formatDate(startDate)} s/d {formatDate(endDate)}
            </p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Dicetak pada: {new Date().toLocaleDateString('id-ID')}
            </p>
          </div>
        </div>

        {/* 1. LAPORAN LABA RUGI & ARUS KAS */}
        {reportType === 'income_statement' && (
          <div className="space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
                <span className="text-xs font-bold text-emerald-800 uppercase">
                  Total Pendapatan (Lunas)
                </span>
                <p className="text-xl font-extrabold text-emerald-700 mt-1">
                  {formatRupiah(totalRevenue)}
                </p>
                <p className="text-[11px] text-emerald-600 mt-0.5">
                  Piutang Berjalan: {formatRupiah(totalReceivables)}
                </p>
              </div>

              <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4">
                <span className="text-xs font-bold text-rose-800 uppercase">
                  Total Beban Operasional
                </span>
                <p className="text-xl font-extrabold text-rose-700 mt-1">
                  {formatRupiah(totalExpenses)}
                </p>
                <p className="text-[11px] text-rose-600 mt-0.5">
                  Kas: {formatRupiah(totalOperationalExpenses)} | Gaji:{' '}
                  {formatRupiah(totalPayrollExpenses)}
                </p>
              </div>

              <div
                className={`border rounded-xl p-4 ${
                  netIncome >= 0
                    ? 'bg-blue-50/70 border-blue-200'
                    : 'bg-amber-50/70 border-amber-200'
                }`}
              >
                <span
                  className={`text-xs font-bold uppercase ${
                    netIncome >= 0 ? 'text-blue-800' : 'text-amber-800'
                  }`}
                >
                  Laba Bersih Periode
                </span>
                <p
                  className={`text-xl font-extrabold mt-1 ${
                    netIncome >= 0 ? 'text-blue-700' : 'text-amber-700'
                  }`}
                >
                  {formatRupiah(netIncome)}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Margin:{' '}
                  {totalRevenue > 0
                    ? `${Math.round((netIncome / totalRevenue) * 100)}%`
                    : '0%'}
                </p>
              </div>
            </div>

            {/* Income Statement Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Komponen Laba Rugi</th>
                    <th className="py-2.5 px-4 text-right">Nominal (IDR)</th>
                    <th className="py-2.5 px-4 text-right">% dari Pendapatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="font-bold text-slate-900 bg-slate-50/40">
                    <td className="py-2.5 px-4">PENDAPATAN USAHA</td>
                    <td className="py-2.5 px-4 text-right font-extrabold text-emerald-700">
                      {formatRupiah(totalRevenue)}
                    </td>
                    <td className="py-2.5 px-4 text-right">100%</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-6 text-slate-600">
                      - Penjualan Layanan & Produk (Faktur Lunas)
                    </td>
                    <td className="py-2 px-4 text-right">{formatRupiah(totalRevenue)}</td>
                    <td className="py-2 px-4 text-right text-slate-500">100%</td>
                  </tr>

                  <tr className="font-bold text-slate-900 bg-slate-50/40">
                    <td className="py-2.5 px-4">BEBAN OPERASIONAL USAHA</td>
                    <td className="py-2.5 px-4 text-right font-extrabold text-rose-700">
                      ({formatRupiah(totalExpenses)})
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {totalRevenue > 0
                        ? `${Math.round((totalExpenses / totalRevenue) * 100)}%`
                        : '0%'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-6 text-slate-600">
                      - Kas Operasional, Utilitas & Fasilitas Kantor
                    </td>
                    <td className="py-2 px-4 text-right">
                      {formatRupiah(totalOperationalExpenses)}
                    </td>
                    <td className="py-2 px-4 text-right text-slate-500">
                      {totalRevenue > 0
                        ? `${Math.round((totalOperationalExpenses / totalRevenue) * 100)}%`
                        : '0%'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-6 text-slate-600">
                      - Beban Gaji & Tunjangan Karyawan (Payroll)
                    </td>
                    <td className="py-2 px-4 text-right">
                      {formatRupiah(totalPayrollExpenses)}
                    </td>
                    <td className="py-2 px-4 text-right text-slate-500">
                      {totalRevenue > 0
                        ? `${Math.round((totalPayrollExpenses / totalRevenue) * 100)}%`
                        : '0%'}
                    </td>
                  </tr>

                  <tr className="font-extrabold text-sm bg-blue-50/70 border-t-2 border-slate-300">
                    <td className="py-3 px-4 text-blue-900">
                      ESTIMASI LABA BERSIH OPERASIONAL
                    </td>
                    <td
                      className={`py-3 px-4 text-right text-base ${
                        netIncome >= 0 ? 'text-blue-700' : 'text-amber-700'
                      }`}
                    >
                      {formatRupiah(netIncome)}
                    </td>
                    <td className="py-3 px-4 text-right text-blue-900">
                      {totalRevenue > 0
                        ? `${Math.round((netIncome / totalRevenue) * 100)}%`
                        : '0%'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. REKAPITULASI PENJUALAN */}
        {reportType === 'sales_summary' && (
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">No. Faktur</th>
                    <th className="py-2.5 px-4">Nama Klien</th>
                    <th className="py-2.5 px-4">Tanggal Terbit</th>
                    <th className="py-2.5 px-4">Jatuh Tempo</th>
                    <th className="py-2.5 px-4 text-right">Total Tagihan</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dateFilteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-blue-700">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-800">
                        {inv.clientName}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{formatDate(inv.date)}</td>
                      <td className="py-2.5 px-4 text-slate-600">{formatDate(inv.dueDate)}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                        {formatRupiah(inv.totalAmount)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'Lunas'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'Terkirim'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
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
          </div>
        )}

        {/* 3. PENGELUARAN DEPARTEMEN */}
        {reportType === 'expense_dept' && (
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">No. Referensi</th>
                    <th className="py-2.5 px-4">Departemen</th>
                    <th className="py-2.5 px-4">Kategori Beban</th>
                    <th className="py-2.5 px-4">Penerima Dana</th>
                    <th className="py-2.5 px-4">Tanggal</th>
                    <th className="py-2.5 px-4 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dateFilteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-700">
                        {exp.referenceNo}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-800">
                        {exp.departmentName || '-'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{exp.category}</td>
                      <td className="py-2.5 px-4 text-slate-600">{exp.recipient || '-'}</td>
                      <td className="py-2.5 px-4 text-slate-500">{formatDate(exp.date)}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-rose-700">
                        {formatRupiah(exp.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. REKAPITULASI SDM & PAYROLL */}
        {reportType === 'hr_summary' && (
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">NIP</th>
                    <th className="py-2.5 px-4">Nama Pegawai</th>
                    <th className="py-2.5 px-4">Departemen</th>
                    <th className="py-2.5 px-4">Jabatan</th>
                    <th className="py-2.5 px-4 text-right">Gaji Pokok</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-blue-700">{emp.nip}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-800">{emp.name}</td>
                      <td className="py-2.5 px-4 text-slate-600">{emp.departmentName}</td>
                      <td className="py-2.5 px-4 text-slate-600">{emp.position}</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                        {formatRupiah(emp.salary)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            emp.status === 'Aktif'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Signatures & Footer */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 text-xs text-slate-600">
          <div>
            <p className="font-semibold text-slate-800">Keterangan:</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
              Laporan ini dibuat otomatis dari basis data tunggal (Single Source of Truth) Firebase Cloud
              Firestore untuk keperluan evaluasi manajemen dan audit operasional perusahaan.
            </p>
          </div>
          <div className="text-center ml-auto">
            <p className="text-slate-500">Mengetahui & Menyetujui,</p>
            <div className="h-16" />
            <p className="font-bold text-slate-900 underline">Direktur Utama & Dewan Direksi</p>
            <p className="text-[11px] text-slate-400">
              {companyProfile?.companyName || 'PT Nusantara Mega Prima Mandiri'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
