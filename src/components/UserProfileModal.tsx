import React, { useState } from 'react';
import {
  X,
  User,
  School,
  BookOpen,
  Lock,
  KeyRound,
  LogOut,
  Users,
  Check,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { UserAccount } from '../types';
import {
  updateUserProfile,
  changePassword,
  getUsers,
  loginUser,
} from '../services/storage';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onUserUpdated: (updatedUser: UserAccount) => void;
  onLogout: () => void;
  onSwitchUser: (newUser: UserAccount) => void;
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, desc?: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
  onLogout,
  onSwitchUser,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'password' | 'switch'>('info');

  // Edit Info Form
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [school, setSchool] = useState(currentUser.school);
  const [subject, setSubject] = useState(currentUser.subject);

  // Change Password Form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  if (!isOpen) return null;

  const registeredUsers = getUsers();

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateUserProfile(currentUser.id, {
      fullName,
      school,
      subject,
    });
    if (res.success && res.user) {
      onUserUpdated(res.user);
      onNotify('success', 'Cập nhật thành công', 'Thông tin tài khoản đã được lưu lại.');
      onClose();
    } else {
      onNotify('error', 'Lỗi', res.error || 'Không thể cập nhật hồ sơ');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);

    if (newPassword !== confirmPassword) {
      setPassError('Mật khẩu mới và mật khẩu xác nhận không trùng khớp!');
      return;
    }

    const res = changePassword(currentUser.id, oldPassword, newPassword);
    if (res.success) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onNotify('success', 'Đổi mật khẩu thành công', 'Mật khẩu mới đã được cập nhật an toàn.');
      setActiveTab('info');
    } else {
      setPassError(res.error || 'Đổi mật khẩu không thành công!');
    }
  };

  const handleSelectSwitchUser = (targetUser: UserAccount) => {
    if (targetUser.id === currentUser.id) return;
    const res = loginUser(targetUser.username, targetUser.password);
    if (res.success && res.user) {
      onSwitchUser(res.user);
      onNotify('info', 'Đã chuyển tài khoản', `Đang làm việc với tài khoản ${res.user.fullName}`);
      onClose();
    } else {
      onNotify('error', 'Lỗi', 'Không thể chuyển sang tài khoản này');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs text-white font-extrabold text-base flex items-center justify-center border border-white/20">
              {currentUser.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold leading-snug">{currentUser.fullName}</h2>
              <p className="text-xs text-blue-100 flex items-center gap-1.5 mt-0.5">
                <span className="font-mono bg-blue-900/60 px-1.5 py-0.5 rounded text-[11px]">
                  @{currentUser.username}
                </span>
                <span>• {currentUser.subject}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Thông tin cá nhân</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'password'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Đổi mật khẩu</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('switch')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'switch'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Chuyển tài khoản ({registeredUsers.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: Edit Profile */}
          {activeTab === 'info' && (
            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Tên đăng nhập (Username)
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 rounded-xl border border-slate-200 text-slate-600 text-sm font-mono">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{currentUser.username}</span>
                  <span className="ml-auto text-[11px] font-sans text-slate-400 font-semibold">
                    (Không thay đổi)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Họ và tên Thầy / Cô
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Trường / Đơn vị
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <School className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Môn giảng dạy
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Change Password */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 4 ký tự"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
                  />
                </div>
              </div>

              {passError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{passError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Cập nhật mật khẩu
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Switch Account */}
          {activeTab === 'switch' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Chọn tài khoản bên dưới để chuyển đổi không gian làm việc ngay lập tức:
              </p>
              <div className="space-y-2">
                {registeredUsers.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <div
                      key={u.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-blue-50/80 border-blue-200'
                          : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                            isCurrent
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {u.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{u.fullName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            @{u.username} • {u.school}
                          </p>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-white px-2.5 py-1 rounded-full border border-blue-200">
                          <Check className="w-3.5 h-3.5" /> Đang dùng
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectSwitchUser(u)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          Chuyển sang
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất khỏi hệ thống</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
