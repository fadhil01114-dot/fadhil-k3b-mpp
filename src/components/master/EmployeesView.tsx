import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  Layers,
  Calendar,
} from 'lucide-react';
import { Employee, Department } from '../../types';
import { createDocument, updateDocument, deleteDocument } from '../../services/firestoreService';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';

interface EmployeesViewProps {
  employees: Employee[];
  departments: Department[];
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({ employees, departments }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    nip: '',
    name: '',
    email: '',
    phone: '',
    departmentId: '',
    departmentName: '',
    position: '',
    salary: 0,
    status: 'Aktif' as 'Aktif' | 'Cuti' | 'Resign',
    joinDate: new Date().toISOString().split('T')[0],
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormData({
      nip: `EMP-${new Date().getFullYear()}-${String(employees.length + 1).padStart(3, '0')}`,
      name: '',
      email: '',
      phone: '',
      departmentId: departments[0]?.id || '',
      departmentName: departments[0]?.name || '',
      position: '',
      salary: 10000000,
      status: 'Aktif',
      joinDate: new Date().toISOString().split('T')[0],
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      nip: emp.nip,
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      departmentId: emp.departmentId,
      departmentName: emp.departmentName,
      position: emp.position,
      salary: emp.salary,
      status: emp.status,
      joinDate: emp.joinDate,
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
      if (editingEmployee && editingEmployee.id) {
        // UPDATE
        await updateDocument('employees', editingEmployee.id, formData);
      } else {
        // CREATE
        await createDocument('employees', formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan data ke Firestore.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !deleteTarget.id) return;
    setDeleteLoading(true);
    try {
      await deleteDocument('employees', deleteTarget.id);
      setDeleteTarget(null);
    } catch (err: any) {
      alert('Gagal menghapus data: ' + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filtered employees list
  const filteredEmployees = employees.filter((emp) => {
    const matchSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = selectedDept === 'ALL' || emp.departmentId === selectedDept;
    const matchStatus = selectedStatus === 'ALL' || emp.status === selectedStatus;
    return matchSearch && matchDept && matchStatus;
  });

  return (
    <div className="space-y-5">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">Master Data Pegawai</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
              {employees.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data sumber daya manusia, jabatan, status kepegawaian, dan penggajian
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Pegawai Baru
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama pegawai, NIP, atau jabatan..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        {/* Department Filter */}
        <div className="w-full md:w-56">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
          >
            <option value="ALL">Semua Departemen</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-36">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
          >
            <option value="ALL">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Cuti">Cuti</option>
            <option value="Resign">Resign</option>
          </select>
        </div>
      </div>

      {/* Employees Table (READ) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Pegawai / NIP</th>
                <th className="py-3.5 px-4">Departemen & Jabatan</th>
                <th className="py-3.5 px-4">Kontak</th>
                <th className="py-3.5 px-4">Gaji Pokok</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi (CRUD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Tidak ada data pegawai ditemukan</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Silakan sesuaikan filter atau tambahkan pegawai baru.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{emp.name}</div>
                      <div className="text-[11px] text-blue-600 font-mono mt-0.5">{emp.nip}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {emp.position}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {emp.departmentName || 'Umum'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{emp.email}</span>
                      </div>
                      {emp.phone && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{emp.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {formatRupiah(emp.salary)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          emp.status === 'Aktif'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : emp.status === 'Cuti'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        {/* UPDATE Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(emp)}
                          title="Ubah data pegawai"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200/80 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {/* DELETE Button */}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(emp)}
                          title="Hapus data pegawai"
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200/80 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE & UPDATE Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? 'Ubah Data Pegawai' : 'Tambah Pegawai Baru'}
        subtitle="Data akan langsung disimpan secara persisten ke Firebase Firestore"
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
                Nomor Induk Pegawai (NIP) *
              </label>
              <input
                type="text"
                required
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap Pegawai *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Budi Santoso"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Kantor / Pribadi *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="budi@nusantaraprima.co.id"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0812-xxxx-xxxx"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Departemen / Divisi *
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
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jabatan / Posisi Pekerjaan *
              </label>
              <input
                type="text"
                required
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Contoh: Senior Business Analyst"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gaji Pokok Bulanan (Rp) *
              </label>
              <input
                type="number"
                required
                min={0}
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Kepegawaian *
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as 'Aktif' | 'Cuti' | 'Resign' })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Aktif">Aktif</option>
                <option value="Cuti">Cuti</option>
                <option value="Resign">Resign</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Masuk Kerja *
              </label>
              <input
                type="date"
                required
                value={formData.joinDate}
                onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={loading}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Simpan Data Pegawai'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Hapus Data Pegawai"
        message={`Apakah Anda yakin ingin menghapus data pegawai "${deleteTarget?.name}" (${deleteTarget?.nip}) dari Firestore? Tindakan ini tidak dapat dibatalkan.`}
      />
    </div>
  );
};
