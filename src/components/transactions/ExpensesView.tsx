import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Edit2,
  Trash2,
  Tag,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { Expense, Department } from '../../types';
import { createDocument, updateDocument, deleteDocument } from '../../services/firestoreService';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';

interface ExpensesViewProps {
  expenses: Expense[];
  departments: Department[];
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ expenses, departments }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    referenceNo: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Operasional' as any,
    departmentId: '',
    departmentName: '',
    amount: 1500000,
    recipient: '',
    description: '',
    status: 'Disetujui' as 'Menunggu' | 'Disetujui' | 'Ditolak',
  });

  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const categories = [
    'Operasional',
    'Utilitas',
    'Pemasaran',
    'Sewa',
    'Logistik',
    'Peralatan',
    'Lainnya',
  ];

  const handleOpenAdd = () => {
    setEditingExpense(null);
    const defaultDept = departments[0];
    setFormData({
      referenceNo: `EXP/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(expenses.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      category: 'Operasional',
      departmentId: defaultDept?.id || '',
      departmentName: defaultDept?.name || '',
      amount: 2500000,
      recipient: '',
      description: '',
      status: 'Disetujui',
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setFormData({
      referenceNo: exp.referenceNo,
      date: exp.date,
      category: exp.category,
      departmentId: exp.departmentId,
      departmentName: exp.departmentName,
      amount: exp.amount,
      recipient: exp.recipient,
      description: exp.description,
      status: exp.status,
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleDepartmentChange = (deptId: string) => {
    const dept = departments.find((d) => d.id === deptId);
    setFormData((prev) => ({
      ...prev,
      departmentId: deptId,
      departmentName: dept ? dept.name : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (editingExpense && editingExpense.id) {
        await updateDocument('expenses', editingExpense.id, formData);
      } else {
        await createDocument('expenses', formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan transaksi pengeluaran.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !deleteTarget.id) return;
    setDeleteLoading(true);
    try {
      await deleteDocument('expenses', deleteTarget.id);
      setDeleteTarget(null);
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredExpenses = expenses.filter((exp) => {
    const matchSearch =
      exp.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = selectedDept === 'ALL' || exp.departmentId === selectedDept;
    const matchStatus = selectedStatus === 'ALL' || exp.status === selectedStatus;
    return matchSearch && matchDept && matchStatus;
  });

  const totalFilteredAmount = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">
              Transaksi Kas & Pengeluaran Operasional
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
              {expenses.length} Transaksi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan beban anggaran departemen, pembayaran vendor, dan verifikasi persetujuan kas
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          Catat Pengeluaran Baru
        </button>
      </div>

      {/* Filters & Total Summary */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nomor referensi, penerima, atau keterangan..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full md:w-48 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
          >
            <option value="ALL">Semua Departemen</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full md:w-36 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
          >
            <option value="ALL">Semua Status</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Menunggu">Menunggu</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Table (READ) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">No. Ref & Tanggal</th>
                <th className="py-3.5 px-4">Kategori & Departemen</th>
                <th className="py-3.5 px-4">Penerima & Keterangan</th>
                <th className="py-3.5 px-4">Nominal Beban</th>
                <th className="py-3.5 px-4">Persetujuan</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Wallet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Tidak ada data transaksi pengeluaran</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-800">{exp.referenceNo}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatDate(exp.date)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {exp.category}
                      </span>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1">
                        <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                        {exp.departmentName || 'Umum'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{exp.recipient || '-'}</div>
                      <div className="text-xs text-slate-500 max-w-sm truncate mt-0.5">
                        {exp.description}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-rose-700">
                      {formatRupiah(exp.amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          exp.status === 'Disetujui'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : exp.status === 'Menunggu'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {exp.status === 'Disetujui' && <CheckCircle className="w-3 h-3" />}
                        {exp.status === 'Menunggu' && <Clock className="w-3 h-3" />}
                        {exp.status === 'Ditolak' && <XCircle className="w-3 h-3" />}
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200/70 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(exp)}
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
            {filteredExpenses.length > 0 && (
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-xs text-slate-800">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right">
                    Total Pengeluaran Ditampilkan:
                  </td>
                  <td className="py-3 px-4 font-extrabold text-rose-700 text-sm">
                    {formatRupiah(totalFilteredAmount)}
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
        title={editingExpense ? 'Ubah Pengeluaran Kas' : 'Catat Pengeluaran Baru'}
        subtitle="Data akan tercatat ke Firebase Firestore secara real-time"
        maxWidth="xl"
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
                Nomor Referensi Kas / Transaksi *
              </label>
              <input
                type="text"
                required
                value={formData.referenceNo}
                onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Pengeluaran *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Beban Biaya *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Beban Departemen *
              </label>
              <select
                required
                value={formData.departmentId}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Pilih Departemen</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nominal Biaya (Rp) *
              </label>
              <input
                type="number"
                required
                min={0}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Penerima Dana / Vendor
              </label>
              <input
                type="text"
                value={formData.recipient}
                onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                placeholder="Contoh: PT Telkom / Penyedia Jasa"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi Pengeluaran *
            </label>
            <textarea
              rows={2}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Keperluan operasional, no faktur terkait, atau rincian kegiatan"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status Verifikasi & Persetujuan Kas
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as 'Menunggu' | 'Disetujui' | 'Ditolak',
                })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Disetujui">Disetujui (Disahkan)</option>
              <option value="Menunggu">Menunggu Persetujuan Manajer</option>
              <option value="Ditolak">Ditolak</option>
            </select>
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
                'Simpan Pengeluaran'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Hapus Transaksi Pengeluaran"
        message={`Apakah Anda yakin ingin menghapus data pengeluaran "${deleteTarget?.referenceNo}" senilai ${formatRupiah(deleteTarget?.amount)}?`}
      />
    </div>
  );
};
