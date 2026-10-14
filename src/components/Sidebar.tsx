import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CheckSquare,
  Award,
  TrendingUp,
  MessageSquareQuote,
  BarChart3,
  X,
  Cloud,
} from 'lucide-react';
import { NavTab, AppData, UserAccount } from '../types';
import { LogOut, User } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabase';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  data: AppData;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  currentUser: UserAccount;
  onOpenProfile: () => void;
  onLogout: () => void;
  onOpenSupabaseModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  data,
  isOpenMobile,
  onCloseMobile,
  currentUser,
  onOpenProfile,
  onLogout,
  onOpenSupabaseModal,
}) => {
  // Quick dynamic counts for badges
  const pendingTasksCount = data.tasks.filter((t) => t.status !== 'Đã hoàn thành').length;
  const needAttentionCount = data.students.filter((s) => s.needAttention).length;
  const docsCount = data.documents?.length || 0;

  const navItems: { id: NavTab; label: string; icon: React.ElementType; badge?: string | number; badgeColor?: string }[] = [
    { id: 'overview', label: '1. Tổng quan', icon: LayoutDashboard },
    { id: 'classes', label: '2. Lớp học', icon: Users, badge: data.classes.length },
    { id: 'students', label: '3. Học sinh', icon: GraduationCap, badge: data.students.length },
    { id: 'lessons', label: '4. Bài học', icon: BookOpen, badge: data.lessons.length },
    {
      id: 'tasks',
      label: '5. Nhiệm vụ',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? `${pendingTasksCount} chờ` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    { id: 'grades', label: '6. Điểm số', icon: Award },
    {
      id: 'progress',
      label: '7. Tiến độ học tập',
      icon: TrendingUp,
      badge: needAttentionCount > 0 ? `${needAttentionCount} lưu ý` : undefined,
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    { id: 'comments', label: '8. Nhận xét', icon: MessageSquareQuote, badge: data.comments.length },
    { id: 'stats', label: '9. Thống kê', icon: BarChart3 },
    {
      id: 'documents',
      label: '10. Tài liệu & Cloud',
      icon: Cloud,
      badge: docsCount > 0 ? docsCount : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
  ];

  const handleItemClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          id="sidebar-mobile-backdrop"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed lg:static top-0 left-0 bottom-0 z-40 w-72 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden">
          <span className="font-bold text-slate-800 text-sm">Danh mục chức năng</span>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Hệ thống quản trị
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                type="button"
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all min-h-[48px] ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-bold'
                    : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeColor || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Supabase Cloud Quick Card */}
        <div className="px-3.5 pb-2">
          <div
            onClick={onOpenSupabaseModal}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              isSupabaseConfigured()
                ? 'bg-emerald-50/70 border-emerald-200/80 hover:bg-emerald-100/70'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className={`w-4 h-4 ${isSupabaseConfigured() ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold text-slate-800">Supabase Cloud</span>
              </div>
              <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              {isSupabaseConfigured()
                ? 'Đã đồng bộ cơ sở dữ liệu & Storage'
                : 'Chưa kết nối Cloud. Bấm để cấu hình.'}
            </p>
          </div>
        </div>

        {/* Bottom Profile Info Box */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/80">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-85 transition-opacity flex-1 cursor-pointer"
              title="Xem & chỉnh sửa hồ sơ giáo viên"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                {currentUser.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">{currentUser.fullName}</p>
                <p className="text-[11px] text-slate-500 font-mono truncate">@{currentUser.username}</p>
              </div>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
