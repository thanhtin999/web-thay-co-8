import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Search,
  Database,
  Volume2,
  VolumeX,
  Menu,
  BookMarked,
  User,
  LogOut,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { AppData, UserAccount } from '../types';

interface HeaderProps {
  data: AppData;
  onOpenSearch: () => void;
  onOpenDataModal: () => void;
  onToggleSound: () => void;
  onToggleMobileSidebar: () => void;
  isSidebarOpen: boolean;
  currentUser: UserAccount;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  data,
  onOpenSearch,
  onOpenDataModal,
  onToggleSound,
  onToggleMobileSidebar,
  currentUser,
  onOpenProfile,
  onLogout,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Format Vietnamese date: e.g. "Thứ Tư, 14/10/2026"
  const now = new Date();
  const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = dayNames[now.getDay()];
  const formattedDate = `${dayName}, ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  const initials = currentUser.username.slice(0, 2).toUpperCase();

  return (
    <header
      id="main-app-header"
      className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3">
          {/* Left: Branding & Teacher Info */}
          <div className="flex items-center gap-3">
            <button
              id="toggle-sidebar-mobile-btn"
              type="button"
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Mở bảng điều hướng"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <BookMarked className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-slate-900 leading-tight truncate">
                  TRỢ LÝ QUẢN TRỊ HỌC TẬP
                </h1>
                <p className="text-xs sm:text-sm font-medium text-blue-700 leading-tight mt-0.5 truncate">
                  {currentUser.fullName} <span className="text-slate-300 font-normal">|</span> {currentUser.subject}{' '}
                  <span className="text-slate-300 font-normal">|</span> {currentUser.school}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Quick Search + Date + Tool Actions + User Account */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Quick Search Bar trigger */}
            <button
              id="quick-search-trigger"
              type="button"
              onClick={onOpenSearch}
              className="hidden lg:flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 text-sm border border-slate-200/80 transition-all w-48 xl:w-60"
              title="Tìm kiếm nhanh (Ctrl + K)"
            >
              <Search className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="flex-1 text-left text-xs truncate">Tìm nhanh...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 bg-white rounded-md border border-slate-300 shadow-2xs">
                Ctrl K
              </kbd>
            </button>

            <button
              type="button"
              onClick={onOpenSearch}
              className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors"
              title="Tìm kiếm nhanh"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Date Display Pill */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{formattedDate}</span>
            </div>

            {/* Sound Toggle */}
            <button
              id="header-sound-toggle-btn"
              type="button"
              onClick={onToggleSound}
              className={`p-2.5 rounded-xl border transition-all ${
                data.soundEnabled
                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm shadow-blue-500/20'
                  : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800 hover:bg-slate-50'
              }`}
              title={data.soundEnabled ? 'Âm thanh: Đang Bật (Bấm để tắt)' : 'Âm thanh: Đang Tắt (Bấm để bật)'}
            >
              {data.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Backup / Restore Data Button */}
            <button
              id="header-data-manager-btn"
              type="button"
              onClick={onOpenDataModal}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-all hover:border-slate-300 active:scale-95"
              title="Quản lý sao lưu dữ liệu"
            >
              <Database className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="hidden md:inline">Sao lưu</span>
            </button>

            {/* User Account Dropdown Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                id="header-user-menu-btn"
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 transition-all cursor-pointer"
                title={`Tài khoản: ${currentUser.fullName} (@${currentUser.username})`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight max-w-[110px] truncate">
                    {currentUser.fullName}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono leading-tight truncate">
                    @{currentUser.username}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
              </button>

              {/* Dropdown Popover */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{currentUser.fullName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">Tên đăng nhập: @{currentUser.username}</p>
                    <p className="text-[11px] text-blue-600 font-medium mt-0.5">{currentUser.school}</p>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition-colors text-left"
                    >
                      <User className="w-4 h-4 text-blue-600" />
                      <span>Thông tin tài khoản</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition-colors text-left"
                    >
                      <Lock className="w-4 h-4 text-slate-500" />
                      <span>Đổi mật khẩu</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenDataModal();
                      }}
                      className="sm:hidden w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition-colors text-left"
                    >
                      <Database className="w-4 h-4 text-slate-500" />
                      <span>Sao lưu dữ liệu</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      id="header-logout-btn"
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
