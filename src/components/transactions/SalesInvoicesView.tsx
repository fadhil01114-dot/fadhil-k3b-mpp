import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Edit2,
  Trash2,
  Printer,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
} from 'lucide-react';
import { SalesInvoice, Client, Product, InvoiceItem, CompanyProfile } from '../../types';
import { createDocument, updateDocument, deleteDocument } from '../../services/firestoreService';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';

interface SalesInvoicesViewProps {
  invoices: SalesInvoice[];
  clients: Client[];
  products: Product[];
  companyProfile: CompanyProfile | null;
}

export const SalesInvoicesView: React.FC<SalesInvoicesViewProps> = ({
  invoices,
  clients,
  products,
  companyProfile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<SalesInvoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Print Preview Modal
  const [printInvoice, setPrintInvoice] = useState<SalesInvoice | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    clientId: '',
    clientName: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [
      {
        description: 'Layanan Konsultasi & Implementasi',
        quantity: 1,
        unitPrice: 15000000,
        amount: 15000000,
      },
    ] as InvoiceItem[],
    subtotal: 15000000,
    taxRate: 11,
    taxAmount: 1650000,
    discount: 0,
    totalAmount: 16650000,
    status: 'Terkirim' as 'Draft' | 'Terkirim' | 'Lunas' | 'Jatuh Tempo',
    notes: 'Pembayaran ditransfer ke rekening operasional perusahaan.',
  });

  const [deleteTarget, setDeleteTarget] = useState<SalesInvoice | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Auto calculate totals whenever items, taxRate, or discount changes
  const calculateTotals = (
    items: InvoiceItem[],
    taxRate: number,
    discount: number
  ) => {
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = Math.max(0, subtotal + taxAmount - discount);
    return { subtotal, taxAmount, totalAmount };
  };

  const handleOpenAdd = () => {
    setEditingInvoice(null);
    const defaultClient = clients[0];
    const initialItems: InvoiceItem[] = [
      {
        description: products[0]?.name || 'Layanan Solusi Enterprise',
        quantity: 1,
        unitPrice: products[0]?.price || 20000000,
        amount: products[0]?.price || 20000000,
      },
    ];
    const { subtotal, taxAmount, totalAmount } = calculateTotals(initialItems, 11, 0);

    setFormData({
      invoiceNumber: `INV/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(invoices.length + 1).padStart(4, '0')}`,
      clientId: defaultClient?.id || '',
      clientName: defaultClient?.name || '',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: initialItems,
      subtotal,
      taxRate: 11,
      taxAmount,
      discount: 0,
      totalAmount,
      status: 'Terkirim',
      notes: 'Pembayaran mohon disertakan nomor invoice pada berita transfer.',
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inv: SalesInvoice) => {
    setEditingInvoice(inv);
    setFormData({
      invoiceNumber: inv.invoiceNumber,
      clientId: inv.clientId,
      clientName: inv.clientName,
      date: inv.date,
      dueDate: inv.dueDate,
      items: inv.items && inv.items.length > 0 ? inv.items : [],
      subtotal: inv.subtotal,
      taxRate: inv.taxRate || 0,
      taxAmount: inv.taxAmount || 0,
      discount: inv.discount || 0,
      totalAmount: inv.totalAmount,
      status: inv.status,
      notes: inv.notes || '',
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleClientChange = (clientId: string) => {
    const cli = clients.find((c) => c.id === clientId);
    setFormData((prev) => ({
      ...prev,
      clientId,
      clientName: cli ? cli.name : '',
    }));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...formData.items];
    const item = { ...updatedItems[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(value) : item.quantity;
      const p = field === 'unitPrice' ? Number(value) : item.unitPrice;
      item.amount = q * p;
    }
    updatedItems[index] = item as InvoiceItem;

    const { subtotal, taxAmount, totalAmount } = calculateTotals(
      updatedItems,
      formData.taxRate,
      formData.discount
    );

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
      subtotal,
      taxAmount,
      totalAmount,
    }));
  };

  const handleAddProductItem = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const newItem: InvoiceItem = {
      productId: prod.id,
      description: prod.name,
      quantity: 1,
      unitPrice: prod.price,
      amount: prod.price,
    };
    const updatedItems = [...formData.items, newItem];
    const { subtotal, taxAmount, totalAmount } = calculateTotals(
      updatedItems,
      formData.taxRate,
      formData.discount
    );
    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
      subtotal,
      taxAmount,
      totalAmount,
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) return;
    const updatedItems = formData.items.filter((_, i) => i !== index);
    const { subtotal, taxAmount, totalAmount } = calculateTotals(
      updatedItems,
      formData.taxRate,
      formData.discount
    );
    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
      subtotal,
      taxAmount,
      totalAmount,
    }));
  };

  const handleTaxOrDiscountChange = (taxRate: number, discount: number) => {
    const { subtotal, taxAmount, totalAmount } = calculateTotals(
      formData.items,
      taxRate,
      discount
    );
    setFormData((prev) => ({
      ...prev,
      taxRate,
      discount,
      subtotal,
      taxAmount,
      totalAmount,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (editingInvoice && editingInvoice.id) {
        await updateDocument('sales_invoices', editingInvoice.id, formData);
      } else {
        await createDocument('sales_invoices', formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan faktur penjualan.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !deleteTarget.id) return;
    setDeleteLoading(true);
    try {
      await deleteDocument('sales_invoices', deleteTarget.id);
      setDeleteTarget(null);
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = selectedStatus === 'ALL' || inv.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">
              Transaksi Faktur & Penjualan (Invoicing)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
              {invoices.length} Faktur
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Penerbitan tagihan klien, rincian produk, pajak PPN, status pelunasan, dan cetak invoice resmi
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          Buat Faktur Baru
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
            placeholder="Cari nomor invoice atau nama klien..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="w-full md:w-56">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
          >
            <option value="ALL">Semua Status Faktur</option>
            <option value="Draft">Draft</option>
            <option value="Terkirim">Terkirim</option>
            <option value="Lunas">Lunas</option>
            <option value="Jatuh Tempo">Jatuh Tempo</option>
          </select>
        </div>
      </div>

      {/* Table (READ) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Nomor Faktur</th>
                <th className="py-3.5 px-4">Klien / Pelanggan</th>
                <th className="py-3.5 px-4">Tanggal & Jatuh Tempo</th>
                <th className="py-3.5 px-4">Total Tagihan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Tidak ada transaksi faktur ditemukan</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{inv.clientName}</div>
                      <div className="text-[11px] text-slate-500">
                        {inv.items?.length || 0} item layanan
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700">{formatDate(inv.date)}</div>
                      <div className="text-[11px] text-slate-400">
                        Tempo: {formatDate(inv.dueDate)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      {formatRupiah(inv.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Print Invoice */}
                        <button
                          type="button"
                          onClick={() => setPrintInvoice(inv)}
                          title="Cetak Faktur Resmi"
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {/* Edit Invoice */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(inv)}
                          title="Ubah Faktur"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200/70 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {/* Delete Invoice */}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(inv)}
                          title="Hapus Faktur"
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

      {/* CREATE / EDIT Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingInvoice ? 'Ubah Faktur Penjualan' : 'Buat Faktur Penjualan Baru'}
        subtitle="Rincian transaksi akan tersimpan secara persisten ke Firebase Firestore"
        maxWidth="3xl"
      >
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Faktur / Invoice *
              </label>
              <input
                type="text"
                required
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Klien / Pelanggan *
              </label>
              <select
                required
                value={formData.clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Pilih Klien</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Pembayaran *
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-semibold"
              >
                <option value="Draft">Draft (Konsep)</option>
                <option value="Terkirim">Terkirim (Menunggu Bayar)</option>
                <option value="Lunas">Lunas (Paid)</option>
                <option value="Jatuh Tempo">Jatuh Tempo (Overdue)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Terbit Faktur
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Batas Akhir (Jatuh Tempo)
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Invoice Items Table */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Rincian Item Produk / Jasa
              </label>

              {/* Quick Add Product Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Sisipkan dari Katalog:</span>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddProductItem(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="py-1 px-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold"
                >
                  <option value="" disabled>
                    + Pilih Produk / Jasa
                  </option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {formatRupiah(p.price)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Deskripsi Produk / Jasa</th>
                    <th className="py-2.5 px-3 w-20">Qty</th>
                    <th className="py-2.5 px-3 w-36">Harga Satuan (Rp)</th>
                    <th className="py-2.5 px-3 w-36">Jumlah (Rp)</th>
                    <th className="py-2.5 px-3 w-12 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.items.map((item, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="p-2">
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                          placeholder="Deskripsi pekerjaan atau produk"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          required
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          required
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                        />
                      </td>
                      <td className="p-2 font-bold text-slate-800">
                        {formatRupiah(item.amount)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={formData.items.length <= 1}
                          className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => {
                const newItems = [
                  ...formData.items,
                  { description: '', quantity: 1, unitPrice: 0, amount: 0 },
                ];
                setFormData({ ...formData, items: newItems });
              }}
              className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              + Tambah Baris Manual
            </button>
          </div>

          {/* Financial Summary Calculation */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Subtotal Item:</span>
              <span className="font-semibold text-slate-800">
                {formatRupiah(formData.subtotal)}
              </span>
            </div>

            <div className="flex justify-between items-center gap-4">
              <span className="text-slate-600">Tarif Pajak PPN (%):</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.taxRate}
                  onChange={(e) =>
                    handleTaxOrDiscountChange(Number(e.target.value), formData.discount)
                  }
                  className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center"
                />
                <span className="font-semibold text-slate-800 w-28 text-right">
                  +{formatRupiah(formData.taxAmount)}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center gap-4">
              <span className="text-slate-600">Potongan Diskon (Rp):</span>
              <input
                type="number"
                min={0}
                value={formData.discount}
                onChange={(e) =>
                  handleTaxOrDiscountChange(formData.taxRate, Number(e.target.value))
                }
                className="w-36 px-2 py-1 bg-white border border-slate-300 rounded-lg text-right font-medium"
              />
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
              <span>Total Akhir Faktur:</span>
              <span className="text-base text-blue-700">
                {formatRupiah(formData.totalAmount)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan / Instruksi Pembayaran
            </label>
            <textarea
              rows={2}
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
                'Simpan Faktur'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* PRINT OFFICIAL INVOICE MODAL */}
      {printInvoice && (
        <Modal
          isOpen={!!printInvoice}
          onClose={() => setPrintInvoice(null)}
          title="Pratinjau Cetak Faktur Penjualan"
          subtitle="Format cetak dokumen resmi untuk klien"
          maxWidth="3xl"
        >
          <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-6 printable-document">
            {/* Kop Surat / Header */}
            <div className="flex items-start justify-between border-b pb-6 border-slate-200">
              <div>
                <h3 className="text-lg font-extrabold text-blue-700">
                  {companyProfile?.companyName || 'PT Nusantara Mega Prima Mandiri'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  {companyProfile?.address ||
                    'Gedung Menara Mandiri Lt. 18, Jl. Jend. Sudirman Kav. 54-55, Jakarta Selatan'}
                </p>
                <p className="text-xs text-slate-500">
                  Telp: {companyProfile?.phone || '+62 21 5289 8000'} | Email:{' '}
                  {companyProfile?.email || 'corporate@nusantaraprima.co.id'}
                </p>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  NPWP: {companyProfile?.npwp || '01.345.678.9-021.000'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-slate-900 tracking-wider">
                  FAKTUR PENJUALAN
                </span>
                <p className="font-mono text-xs font-bold text-blue-700 mt-1">
                  NO: {printInvoice.invoiceNumber}
                </p>
                <div className="mt-2">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      printInvoice.status === 'Lunas'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    STATUS: {printInvoice.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Bill To & Date info */}
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <p className="text-slate-400 uppercase font-bold tracking-wider text-[10px]">
                  Ditujukan Kepada Klien:
                </p>
                <p className="font-bold text-sm text-slate-800 mt-1">
                  {printInvoice.clientName}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-slate-600">
                  <span className="text-slate-400">Tanggal Faktur:</span>{' '}
                  <span className="font-semibold">{formatDate(printInvoice.date)}</span>
                </p>
                <p className="text-slate-600">
                  <span className="text-slate-400">Jatuh Tempo:</span>{' '}
                  <span className="font-semibold">{formatDate(printInvoice.dueDate)}</span>
                </p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-2 px-3">No</th>
                  <th className="py-2 px-3">Deskripsi Produk / Jasa</th>
                  <th className="py-2 px-3 text-center">Kuantitas</th>
                  <th className="py-2 px-3 text-right">Harga Satuan</th>
                  <th className="py-2 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {printInvoice.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {item.description}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-700 font-semibold">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700">
                      {formatRupiah(item.unitPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatRupiah(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculation Summary */}
            <div className="flex justify-end">
              <div className="w-72 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">
                    {formatRupiah(printInvoice.subtotal)}
                  </span>
                </div>
                {printInvoice.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>PPN ({printInvoice.taxRate}%):</span>
                    <span className="font-semibold text-slate-800">
                      +{formatRupiah(printInvoice.taxAmount)}
                    </span>
                  </div>
                )}
                {printInvoice.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Diskon:</span>
                    <span className="font-semibold">
                      -{formatRupiah(printInvoice.discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-blue-800 pt-2 border-t border-slate-200">
                  <span>TOTAL PEMBAYARAN:</span>
                  <span>{formatRupiah(printInvoice.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Notes & Signatures */}
            <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 grid grid-cols-2 gap-4">
              <div>
                <p className="font-bold text-slate-700">Catatan:</p>
                <p className="mt-0.5">{printInvoice.notes || 'Terima kasih atas kerja sama Anda.'}</p>
              </div>
              <div className="text-center ml-auto">
                <p className="text-slate-400">Hormat Kami,</p>
                <div className="h-14" />
                <p className="font-bold text-slate-800 underline">Direktur Keuangan</p>
                <p className="text-[10px] text-slate-400">
                  {companyProfile?.companyName || 'PT Nusantara Mega Prima Mandiri'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-4 no-print">
            <button
              type="button"
              onClick={() => setPrintInvoice(null)}
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
              Cetak Dokumen Faktur
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
        title="Hapus Faktur Penjualan"
        message={`Apakah Anda yakin ingin menghapus faktur "${deleteTarget?.invoiceNumber}" untuk klien "${deleteTarget?.clientName}"? Data transaksi penjualan ini akan dihapus dari Firestore.`}
      />
    </div>
  );
};
