import React, { useState } from 'react';
import {
  Building,
  Plus,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  MapPin,
  User,
} from 'lucide-react';
import { Client } from '../../types';
import { createDocument, updateDocument, deleteDocument } from '../../services/firestoreService';
import { Modal } from '../common/Modal';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';

interface ClientsViewProps {
  clients: Client[];
}

export const ClientsView: React.FC<ClientsViewProps> = ({ clients }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    pic: '',
    type: 'Pelanggan' as 'Pelanggan' | 'Vendor' | 'Partner',
    email: '',
    phone: '',
    address: '',
  });

  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleOpenAdd = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      pic: '',
      type: 'Pelanggan',
      email: '',
      phone: '',
      address: '',
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cli: Client) => {
    setEditingClient(cli);
    setFormData({
      name: cli.name,
      pic: cli.pic,
      type: cli.type,
      email: cli.email,
      phone: cli.phone,
      address: cli.address,
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (editingClient && editingClient.id) {
        await updateDocument('clients', editingClient.id, formData);
      } else {
        await createDocument('clients', formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan klien.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !deleteTarget.id) return;
    setDeleteLoading(true);
    try {
      await deleteDocument('clients', deleteTarget.id);
      setDeleteTarget(null);
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredClients = clients.filter((cli) => {
    const matchSearch =
      cli.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cli.pic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cli.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = selectedType === 'ALL' || cli.type === selectedType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-5">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">Master Klien & Vendor</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {clients.length} Rekanan
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar entitas mitra bisnis, pelanggan korporat, dan pemasok pihak ketiga
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Rekanan Baru
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
            placeholder="Cari nama perusahaan, PIC, atau email kontak..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="w-full md:w-56">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
          >
            <option value="ALL">Semua Jenis Hubungan</option>
            <option value="Pelanggan">Pelanggan (Client)</option>
            <option value="Vendor">Vendor / Pemasok</option>
            <option value="Partner">Mitra Strategis</option>
          </select>
        </div>
      </div>

      {/* Table (READ) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Nama Perusahaan / Entitas</th>
                <th className="py-3.5 px-4">Jenis Hubungan</th>
                <th className="py-3.5 px-4">Person in Charge (PIC)</th>
                <th className="py-3.5 px-4">Kontak (Email / Telepon)</th>
                <th className="py-3.5 px-4">Alamat Domisili</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Building className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Tidak ada rekanan ditemukan</p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((cli) => (
                  <tr key={cli.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {cli.name}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          cli.type === 'Pelanggan'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : cli.type === 'Vendor'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {cli.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cli.pic || '-'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cli.email || '-'}</span>
                      </div>
                      {cli.phone && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cli.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{cli.address || '-'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cli)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200/70 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(cli)}
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
          </table>
        </div>
      </div>

      {/* Modal CREATE / EDIT */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? 'Ubah Data Rekanan' : 'Tambah Rekanan Baru'}
        subtitle="Data tersimpan ke Firebase Firestore secara real-time"
        maxWidth="lg"
      >
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Perusahaan / Organisasi *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="PT Solusi Digital Bersama"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jenis Hubungan *
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as 'Pelanggan' | 'Vendor' | 'Partner',
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Pelanggan">Pelanggan (Client)</option>
                <option value="Vendor">Vendor (Pemasok)</option>
                <option value="Partner">Partner (Mitra)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Kontak PIC
              </label>
              <input
                type="text"
                value={formData.pic}
                onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                placeholder="Ibu Amanda / Bpk. Irwan"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Telepon Kantor / WA
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="021-xxxx-xxxx"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alamat Email Resmi
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@perusahaanmitra.com"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alamat Kantor / Domisili Lengkap
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Gedung, Jalan, Kawasan Industri, Kota"
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
                'Simpan Rekanan'
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
        title="Hapus Rekanan"
        message={`Apakah Anda yakin ingin menghapus data rekanan "${deleteTarget?.name}" dari Firestore?`}
      />
    </div>
  );
};
