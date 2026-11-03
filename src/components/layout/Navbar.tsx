import React from 'react';
import { signOut, User } from 'firebase/auth';
import { auth } from '../../firebase/config';
import {
  Building2,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Menu,
} from 'lucide-react';

import { AdminUser } from '../../types';

interface NavbarProps {
  user: User | null;
  adminUser: AdminUser | null;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  adminUser,
  onToggleSidebar,
  onLogout,
}) => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
    onLogout();
  };

  const currentDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] no-print">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Left Side: Mobile Menu & Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-800">
                  Nusantara ERP
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  ENTERPRISE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden md:block">
                PT Nusantara Mega Prima Mandiri
              </p>
            </div>
          </div>
        </div>

        {/* Center: Live Date & DB Status */}
        <div className="hidden md:flex items-center gap-4">
          <div className="text-xs text-slate-500 font-medium bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            🗓️ {currentDate}
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Firebase Firestore Terhubung</span>
          </div>
        </div>

        {/* Right Side: Admin Badge & Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 pl-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[150px]">
                  {adminUser?.name || user?.displayName || adminUser?.username || user?.email?.split('@')[0] || 'Administrator'}
                </p>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                {adminUser?.role || 'Admin Utama'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Keluar dari sistem"
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/80 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
