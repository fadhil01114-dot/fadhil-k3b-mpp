import React, { useState } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../../firebase/config';
import {
  authenticateAdminFromFirestore,
  registerAdminToFirestore,
} from '../../services/firestoreService';
import { AdminUser } from '../../types';
import {
  Building2,
  Lock,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  UserPlus,
  LogIn,
  AlertCircle,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';

interface LoginFormProps {
  onSuccess?: (admin: AdminUser) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('admin@nusantaraprima.co.id');
  const [password, setPassword] = useState('Admin123456');
  const [adminName, setAdminName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick fill demo administrator account
  const handleUseDemoAdmin = () => {
    setEmail('admin@nusantaraprima.co.id');
    setPassword('Admin123456');
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const inputUser = email.trim();
    if (!inputUser || !password) {
      setErrorMsg('Harap masukkan email/username dan kata sandi.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        // Register new admin account in Firestore database
        const newAdmin = await registerAdminToFirestore(
          adminName || 'Administrator',
          inputUser,
          password
        );
        setSuccessMsg('Akun Administrator baru berhasil didaftarkan ke Firestore! Membuka dashboard...');
        setTimeout(() => {
          if (onSuccess) onSuccess(newAdmin);
        }, 600);
      } else {
        // Authenticate admin in Firestore database
        const authenticatedAdmin = await authenticateAdminFromFirestore(inputUser, password);
        setSuccessMsg(`Selamat datang kembali, ${authenticatedAdmin.name}! Mengalihkan...`);
        setTimeout(() => {
          if (onSuccess) onSuccess(authenticatedAdmin);
        }, 400);
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setErrorMsg(err.message || 'Gagal masuk. Periksa kembali username/email dan kata sandi Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const googleUser: AdminUser = {
        username: res.user.email?.split('@')[0] || 'google_admin',
        email: res.user.email || 'admin@perusahaan.com',
        name: res.user.displayName || 'Administrator Google',
        role: 'Super Administrator',
        createdAt: new Date().toISOString(),
      };
      if (onSuccess) onSuccess(googleUser);
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg('Gagal masuk dengan Google: ' + (err.message || 'Coba lagi atau gunakan form email/username di atas.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/10 blur-lg pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-14 h-14 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center shadow-inner mb-3">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Nusantara ERP</h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 font-medium">
              Sistem Informasi Manajemen Perusahaan
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs text-blue-100 font-semibold border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              Firebase Cloud Firestore SSoT
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              !isRegister
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Masuk Administrator
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              isRegister
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Registrasi Admin
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs sm:text-sm flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="leading-snug">{successMsg}</div>
            </div>
          )}

          {/* Quick Demo Hint Card */}
          {!isRegister && (
            <div className="mb-5 p-3 bg-blue-50/90 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
              <KeyRound className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Akun Administrator Siap Pakai:</p>
                <p className="mt-0.5 text-blue-700">
                  Email/Username: <span className="font-mono font-bold">admin@nusantaraprima.co.id</span> atau <span className="font-mono font-bold">admin</span>
                  <br />
                  Password: <span className="font-mono font-bold">Admin123456</span>
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Administrator / Penanggung Jawab
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Contoh: Bpk. Muhammad Fadhil"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email / Username Admin
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin atau admin@nusantaraprima.co.id"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition placeholder:text-slate-400 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Fill Button */}
            {!isRegister && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleUseDemoAdmin}
                  className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 text-blue-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Isi Otomatis Kredensial Demo Admin
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isRegister ? 'Daftar Akun Administrator' : 'Masuk ke Dashboard ERP'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium">atau masuk via</span>
            </div>
          </div>

          {/* Google Login Option */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 flex items-center justify-center gap-2.5 transition shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Masuk dengan Akun Google
          </button>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            PT Nusantara Mega Prima Mandiri &bull; Keamanan Tingkat Enterprise
          </p>
        </div>
      </div>
    </div>
  );
};
