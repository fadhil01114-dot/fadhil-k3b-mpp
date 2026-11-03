import React, { useState, useEffect } from 'react';
import { Building2, Save, CheckCircle2, Shield, Globe, Mail, Phone, MapPin } from 'lucide-react';
import { CompanyProfile } from '../../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { handleFirestoreError, OperationType } from '../../firebase/errorHandler';

interface CompanyProfileViewProps {
  companyProfile: CompanyProfile | null;
}

export const CompanyProfileView: React.FC<CompanyProfileViewProps> = ({ companyProfile }) => {
  const [formData, setFormData] = useState({
    companyName: 'PT Nusantara Mega Prima Mandiri',
    tagline: 'Solusi Terintegrasi Bisnis & Layanan Industri Nasional',
    address: 'Gedung Menara Mandiri Lt. 18, Jl. Jend. Sudirman Kav. 54-55, Jakarta Selatan 12190',
    phone: '+62 21 5289 8000',
    email: 'corporate@nusantaraprima.co.id',
    website: 'www.nusantaraprima.co.id',
    npwp: '01.345.678.9-021.000',
    currency: 'IDR (Rp)',
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (companyProfile) {
      setFormData({
        companyName: companyProfile.companyName || '',
        tagline: companyProfile.tagline || '',
        address: companyProfile.address || '',
        phone: companyProfile.phone || '',
        email: companyProfile.email || '',
        website: companyProfile.website || '',
        npwp: companyProfile.npwp || '',
        currency: companyProfile.currency || 'IDR (Rp)',
      });
    }
  }, [companyProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);

    try {
      await setDoc(doc(db, 'company_profile', 'main'), {
        ...formData,
        updatedAt: new Date().toISOString(),
      });
      setSuccessMsg('Profil dan identitas perusahaan berhasil diperbarui ke Firestore!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, 'company_profile/main');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Profil & Identitas Perusahaan</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Informasi ini digunakan secara otomatis pada kop faktur penjualan, slip gaji, dan laporan resmi
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs sm:text-sm flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Nama Resmi Perusahaan (Legal Name) *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Slogan / Tagline Perusahaan
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Nomor Pokok Wajib Pajak (NPWP)
              </label>
              <input
                type="text"
                value={formData.npwp}
                onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Mata Uang Pembukuan Utama
              </label>
              <input
                type="text"
                readOnly
                value={formData.currency}
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Telepon Kantor
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Email Korespondensi
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Website Resmi
              </label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Alamat Kantor Pusat Lengkap
            </label>
            <textarea
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Perubahan Profil
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
