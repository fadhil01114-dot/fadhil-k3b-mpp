import React, { useState } from 'react';
import {
  Coins,
  Plus,
  Search,
  Edit2,
  Trash2,
  Printer,
  Calendar,
  CheckCircle,
  Clock,
  User,
  Layers,
} from 'lucide-react';
import { Payroll, Employee, CompanyProfile } from '../../types';
import { createDocument, updateDocument, deleteDocument } from '../../services/firestoreService';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';

interface PayrollViewProps {
  payroll: Payroll[];
  employees: Employee[];
  companyProfile: CompanyProfile | null;
}

export const PayrollView: React.FC<PayrollViewProps> = ({
  payroll,
  employees,
  companyProfile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Payslip Print Preview
  const [printSlip, setPrintSlip] = useState<Payroll | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    period: '2026-11',
    employeeId: '',
    employeeName: '',
    nip: '',
    department: '',
    basicSalary: 10000000,
    allowance: 1500000,
    deduction: 300000,
    netSalary: 11200000,
    paymentDate: new Date().toISOString().split('T')[0],
    status: 'Dibayar' as 'Pending' | 'Dibayar',
    notes: 'Transfer Gaji Bulanan Mandiri Corporate',
  });

  const [deleteTarget, setDeleteTarget] = useState<Payroll | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const periods = Array.from(new Set(payroll.map((p) => p.period).filter(Boolean)));

  const handleOpenAdd = () => {
    setEditingPayroll(null);
    const defaultEmp = employees[0];
    const basic = defaultEmp?.salary || 10000000;
    const allowance = 1500000;
    const deduction = 250000;
    const net = basic + allowance - deduction;

    setFormData({
      period: '2026-11',
      employeeId: defaultEmp?.id || '',
      employeeName: defaultEmp?.name || '',
      nip: defaultEmp?.nip || '',
      department: defaultEmp?.departmentName || '',
      basicSalary: basic,
      allowance,
      deduction,
      netSalary: net,
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'Dibayar',
      notes: 'Transfer Payroll Rekening Bank Karyawan',
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Payroll) => {
    setEditingPayroll(p);
    setFormData({
      period: p.period,
      employeeId: p.employeeId,
      employeeName: p.employeeName,
      nip: p.nip,
      department: p.department,
      basicSalary: p.basicSalary,
      allowance: p.allowance,
      deduction: p.deduction,
      netSalary: p.netSalary,
      paymentDate: p.paymentDate,
      status: p.status,
      notes: p.notes || '',
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleEmployeeSelect = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;
    const basic = emp.salary || 0;
    const net = basic + formData.allowance - formData.deduction;
    setFormData((prev) => ({
      ...prev,
      employeeId: emp.id || '',
      employeeName: emp.name,
      nip: emp.nip,
      department: emp.departmentName,
      basicSalary: basic,
      netSalary: Math.max(0, net),
    }));
  };

  const handleSalaryNumbersChange = (
    basic: number,
    allowance: number,
    deduction: number
  ) => {
    const net = Math.max(0, basic + allowance - deduction);
    setFormData((prev) => ({
      ...prev,
      basicSalary: basic,
      allowance,
      deduction,
      netSalary: net,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (editingPayroll && editingPayroll.id) {
        await updateDocument('payrolls', editingPayroll.id, formData);
      } else {
        await createDocument('payrolls', formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan transaksi gaji.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !deleteTarget.id) return;
    setDeleteLoading(true);
    try {
      await deleteDocument('payrolls', deleteTarget.id);
      setDeleteTarget(null);
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredPayroll = payroll.filter((p) => {
    const matchSearch =
      p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPeriod = selectedPeriod === 'ALL' || p.period === selectedPeriod;
    const matchStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
    return matchSearch && matchPeriod && matchStatus;
  });

  const totalNetSalary = filteredPayroll.reduce((sum, p) => sum + (p.netSalary || 0), 0);

  return (
    <div className="space-y-5">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">
              Transaksi Penggajian Pegawai (Payroll)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
              {payroll.length} Catatan Gaji
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Perhitungan gaji pokok, tunjangan prestasi, potongan pajak/BPJS, dan cetak slip gaji karyawan
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          Proses Penggajian Baru
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama pegawai, NIP, atau divisi..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full md:w-44 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
          >
            <option value="ALL">Semua Periode</option>
            {periods.map((per) => (
              <option key={per} value={per}>
                Periode {per}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full md:w-36 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
          >
            <option value="ALL">Semua Status</option>
            <option value="Dibayar">Dibayar</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Table (READ) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Pegawai / NIP</th>
                <th className="py-3.5 px-4">Periode & Departemen</th>
                <th className="py-3.5 px-4">Gaji Pokok</th>
                <th className="py-3.5 px-4">Tunjangan / Potongan</th>
                <th className="py-3.5 px-4">Total Gaji Bersih (Take Home Pay)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayroll.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Coins className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Tidak ada catatan transaksi payroll</p>
                  </td>
                </tr>
              ) : (
                filteredPayroll.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{p.employeeName}</div>
                      <div className="text-[11px] text-blue-600 font-mono mt-0.5">{p.nip}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {p.period}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-1">{p.department}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {formatRupiah(p.basicSalary)}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="text-emerald-700 font-medium">
                        +{formatRupiah(p.allowance)}
                      </div>
                      <div className="text-rose-600 font-medium">
                        -{formatRupiah(p.deduction)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-blue-700 text-sm">
                      {formatRupiah(p.netSalary)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'Dibayar'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {p.status === 'Dibayar' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Print Payslip */}
                        <button
                          type="button"
                          onClick={() => setPrintSlip(p)}
                          title="Cetak Slip Gaji Karyawan"
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200/70 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200/70 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredPayroll.length > 0 && (
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-xs text-slate-800">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-right">
                    Total Gaji Bersih Dibayarkan:
                  </td>
                  <td className="py-3 px-4 font-extrabold text-blue-700 text-sm">
                    {formatRupiah(totalNetSalary)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal CREATE / EDIT */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPayroll ? 'Ubah Catatan Penggajian' : 'Proses Penggajian Karyawan'}
        subtitle="Data penggajian tersimpan ke Firebase Firestore secara real-time"
        maxWidth="2xl"
      >
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Pegawai *
              </label>
              <select
                required
                value={formData.employeeId}
                onChange={(e) => handleEmployeeSelect(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Pilih Karyawan</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.nip}) - {emp.departmentName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Periode Gaji (YYYY-MM) *
              </label>
              <input
                type="month"
                required
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gaji Pokok (Rp) *
              </label>
              <input
                type="number"
                required
                min={0}
                value={formData.basicSalary}
                onChange={(e) =>
                  handleSalaryNumbersChange(
                    Number(e.target.value),
                    formData.allowance,
                    formData.deduction
                  )
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tunjangan / Bonus (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={formData.allowance}
                onChange={(e) =>
                  handleSalaryNumbersChange(
                    formData.basicSalary,
                    Number(e.target.value),
                    formData.deduction
                  )
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Potongan BPJS/Pajak (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={formData.deduction}
                onChange={(e) =>
                  handleSalaryNumbersChange(
                    formData.basicSalary,
                    formData.allowance,
                    Number(e.target.value)
                  )
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Net Salary Highlight */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900">
              Total Gaji Bersih Diterima (Take Home Pay):
            </span>
            <span className="text-lg font-black text-blue-700">
              {formatRupiah(formData.netSalary)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Pembayaran / Transfer
              </label>
              <input
                type="date"
                required
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Pembayaran
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'Pending' | 'Dibayar',
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Dibayar">Dibayar (Selesai)</option>
                <option value="Pending">Pending (Menunggu Tanggal Payroll)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Penggajian
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={loading}
              className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Simpan Data Gaji'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* PRINT PAYSLIP MODAL */}
      {printSlip && (
        <Modal
          isOpen={!!printSlip}
          onClose={() => setPrintSlip(null)}
          title="Slip Gaji Karyawan Resmi"
          subtitle="Dokumen resmi rincian penghasilan bulanan karyawan"
          maxWidth="2xl"
        >
          <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-6 printable-document">
            {/* Header */}
            <div className="flex items-start justify-between border-b pb-4 border-slate-200">
              <div>
                <h3 className="text-base font-extrabold text-blue-700">
                  {companyProfile?.companyName || 'PT Nusantara Mega Prima Mandiri'}
                </h3>
                <p className="text-xs text-slate-500">
                  {companyProfile?.address ||
                    'Gedung Menara Mandiri Lt. 18, Jl. Jend. Sudirman Kav. 54-55, Jakarta'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-slate-900 tracking-wider">
                  SLIP GAJI KARYAWAN
                </span>
                <p className="font-mono text-xs font-bold text-blue-700 mt-0.5">
                  PERIODE: {printSlip.period}
                </p>
              </div>
            </div>

            {/* Employee Info */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400">Nama Pegawai:</span>
                <p className="font-bold text-slate-800 text-sm">{printSlip.employeeName}</p>
                <span className="text-slate-400 mt-1 block">NIP:</span>
                <p className="font-mono text-slate-700 font-semibold">{printSlip.nip}</p>
              </div>
              <div>
                <span className="text-slate-400">Departemen / Divisi:</span>
                <p className="font-semibold text-slate-800">{printSlip.department}</p>
                <span className="text-slate-400 mt-1 block">Tanggal Pembayaran:</span>
                <p className="font-medium text-slate-700">{formatDate(printSlip.paymentDate)}</p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Rincian Pendapatan & Potongan
              </h4>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                <div className="p-3 flex justify-between">
                  <span className="text-slate-600">Gaji Pokok:</span>
                  <span className="font-bold text-slate-900">
                    {formatRupiah(printSlip.basicSalary)}
                  </span>
                </div>
                <div className="p-3 flex justify-between text-emerald-700">
                  <span>Tunjangan & Fasilitas:</span>
                  <span className="font-bold">+{formatRupiah(printSlip.allowance)}</span>
                </div>
                <div className="p-3 flex justify-between text-rose-600">
                  <span>Potongan Pajak / Iuran BPJS:</span>
                  <span className="font-bold">-{formatRupiah(printSlip.deduction)}</span>
                </div>
                <div className="p-3.5 bg-blue-50/70 flex justify-between items-center text-sm font-extrabold text-blue-800">
                  <span>GAJI BERSIH (TAKE HOME PAY):</span>
                  <span className="text-base">{formatRupiah(printSlip.netSalary)}</span>
                </div>
              </div>
            </div>

            {/* Signature */}
            <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 grid grid-cols-2 gap-4">
              <div>
                <p className="font-bold text-slate-700">Catatan:</p>
                <p className="mt-0.5">{printSlip.notes || 'Slip ini digenerate secara komputerisasi.'}</p>
              </div>
              <div className="text-center ml-auto">
                <p className="text-slate-400">Bagian Payroll HRD & Keuangan,</p>
                <div className="h-12" />
                <p className="font-bold text-slate-800 underline">Dept. Keuangan & SDM</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-4 no-print">
            <button
              type="button"
              onClick={() => setPrintSlip(null)}
              className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Cetak Slip Gaji
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Hapus Transaksi Gaji"
        message={`Apakah Anda yakin ingin menghapus data penggajian "${deleteTarget?.employeeName}" periode ${deleteTarget?.period}?`}
      />
    </div>
  );
};
