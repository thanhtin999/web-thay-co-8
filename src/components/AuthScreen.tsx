import React, { useState } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  BookMarked,
  School,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Award,
  KeyRound,
  HelpCircle,
} from 'lucide-react';
import { UserAccount } from '../types';
import { loginUser, registerUser, getUsers } from '../services/storage';
import {
  fetchAccountsFromSupabase,
  findAccountInSupabase,
  saveAccountToSupabase,
} from '../services/supabase';

interface AuthScreenProps {
  onLoginSuccess: (user: UserAccount, message?: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login Form States
  const [loginUsername, setLoginUsername] = useState('thaytin');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register Form States
  const [regUsername, setRegUsername] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regSchool, setRegSchool] = useState('THCS Phan Bội Châu');
  const [regSubject, setRegSubject] = useState('Ngữ văn THCS');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regCloneSample, setRegCloneSample] = useState(true);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Help modal/accordion state
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Quick accounts list for easy selection
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>(() => getUsers());

  // Tự động đồng bộ danh sách tài khoản từ Supabase khi mở màn hình
  React.useEffect(() => {
    let isMounted = true;
    async function syncAccounts() {
      try {
        const remote = await fetchAccountsFromSupabase();
        if (!isMounted) return;
        if (remote && remote.length > 0) {
          const local = getUsers();
          const mergedMap = new Map<string, UserAccount>();
          local.forEach((u) => mergedMap.set(u.username.toLowerCase(), u));
          remote.forEach((u) => mergedMap.set(u.username.toLowerCase(), u));
          const mergedList = Array.from(mergedMap.values());
          localStorage.setItem('tro_ly_giao_vien_users_v1', JSON.stringify(mergedList));
          setRegisteredUsers(mergedList);
        }
      } catch (err) {
        console.warn('Lỗi đồng bộ tài khoản từ Supabase:', err);
      }
    }
    syncAccounts();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      let res = loginUser(loginUsername, loginPassword);
      if (!res.success) {
        // Kiểm tra trên Supabase Cloud nếu tài khoản đăng ký ở thiết bị khác
        const remoteUser = await findAccountInSupabase(loginUsername);
        if (remoteUser) {
          if (remoteUser.password === loginPassword.trim()) {
            const local = getUsers();
            if (!local.some((u) => u.id === remoteUser.id)) {
              const updated = [...local, remoteUser];
              localStorage.setItem('tro_ly_giao_vien_users_v1', JSON.stringify(updated));
              setRegisteredUsers(updated);
            }
            res = loginUser(loginUsername, loginPassword);
          } else {
            setIsLoggingIn(false);
            setLoginError('Mật khẩu không chính xác! Vui lòng thử lại.');
            return;
          }
        }
      }

      setIsLoggingIn(false);

      if (!res.success || !res.user) {
        setLoginError(res.error || 'Đăng nhập không thành công, vui lòng thử lại!');
        return;
      }

      onLoginSuccess(res.user, `Kính chào ${res.user.fullName}, chúc Thầy/Cô một ngày làm việc hiệu quả!`);
    } catch {
      setIsLoggingIn(false);
      setLoginError('Đã có lỗi xảy ra trong quá trình xác thực.');
    }
  };

  const handleQuickLogin = (user: UserAccount) => {
    setLoginUsername(user.username);
    setLoginPassword(user.password);
    setLoginError(null);

    const res = loginUser(user.username, user.password);
    if (res.success && res.user) {
      onLoginSuccess(res.user, `Kính chào ${res.user.fullName}!`);
    } else {
      setLoginError(res.error || 'Không thể đăng nhập bằng tài khoản này');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (regPassword !== regConfirmPassword) {
      setRegError('Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.');
      return;
    }

    setIsRegistering(true);

    try {
      const res = registerUser({
        username: regUsername,
        password: regPassword,
        fullName: regFullName,
        school: regSchool,
        subject: regSubject,
        cloneSample: regCloneSample,
      });

      if (!res.success || !res.user) {
        setIsRegistering(false);
        setRegError(res.error || 'Đăng ký tài khoản thất bại!');
        return;
      }

      // Lưu tài khoản đăng ký lên Supabase Cloud
      await saveAccountToSupabase(res.user);

      setIsRegistering(false);
      onLoginSuccess(
        res.user,
        `Chúc mừng ${res.user.fullName} đã đăng ký tài khoản thành công và lưu trữ trên Supabase Cloud!`
      );
    } catch {
      setIsRegistering(false);
      setRegError('Đã xảy ra lỗi khi tạo tài khoản.');
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col justify-center items-center px-4 py-8 sm:py-12 selection:bg-blue-600 selection:text-white">
      {/* Background ambient decorative shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md md:max-w-xl z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 mb-3 border border-blue-400/30">
            <BookMarked className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            TRỢ LÝ QUẢN TRỊ HỌC TẬP
          </h1>
          <p className="text-sm sm:text-base text-blue-200/90 font-medium mt-1">
            Môn Ngữ văn THCS • THCS Phan Bội Châu
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-blue-300/80">
            <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
              <GraduationCap className="w-3.5 h-3.5 text-blue-300" /> Quản lý lớp & học sinh
            </span>
            <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
              <Award className="w-3.5 h-3.5 text-amber-300" /> Sổ điểm & Nhận xét
            </span>
          </div>
        </div>

        {/* Auth Box Container */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/40 border border-slate-100/90 overflow-hidden backdrop-blur-xl">
          {/* Tabs Switcher */}
          <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50/70 p-1.5">
            <button
              id="tab-login-btn"
              type="button"
              onClick={() => {
                setActiveTab('login');
                setLoginError(null);
              }}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'login'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập</span>
            </button>
            <button
              id="tab-register-btn"
              type="button"
              onClick={() => {
                setActiveTab('register');
                setRegError(null);
              }}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'register'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Đăng ký mới</span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {/* ----------------- TAB ĐĂNG NHẬP ----------------- */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-username"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                    >
                      Tên đăng nhập (Username)
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      id="login-username"
                      type="text"
                      required
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="Nhập username (ví dụ: thaytin)"
                      autoCapitalize="none"
                      autoCorrect="off"
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                    >
                      Mật khẩu
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowHelpModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Nhập mật khẩu"
                      className="w-full pl-11 pr-11 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Login Error Notification */}
                {loginError && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  id="submit-login-btn"
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all hover:shadow-lg disabled:opacity-60 cursor-pointer"
                >
                  {isLoggingIn ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang xác thực...
                    </span>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Đăng nhập vào Hệ thống</span>
                    </>
                  )}
                </button>

                {/* Fast One-Click Demo Account Picker */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Tài khoản trên máy:
                    </span>
                    <span className="text-[11px] text-slate-400">Bấm để đăng nhập nhanh</span>
                  </div>

                  <div className="space-y-1.5">
                    {registeredUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleQuickLogin(u)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-blue-50 hover:border-blue-200 transition-all text-left group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {u.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                              {u.fullName}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              Username: <span className="font-semibold text-slate-700">{u.username}</span> • {u.subject}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2">
                          Vào ngay →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            )}

            {/* ----------------- TAB ĐĂNG KÝ ----------------- */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label
                    htmlFor="reg-username"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
                  >
                    Tên đăng nhập (Username) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      id="reg-username"
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.toLowerCase().trim())}
                      placeholder="ví dụ: thay_hoang, cothao, tin_nv"
                      className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Viết thường không dấu, không dấu cách (chữ cái, chữ số, _ hoặc .)
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="reg-fullname"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
                  >
                    Họ và tên Thầy / Cô <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <input
                      id="reg-fullname"
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Ví dụ: Thầy Dương Thành Tín, Cô Nguyễn Thu Trang"
                      className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="reg-school"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
                    >
                      Trường / Đơn vị
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <School className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-school"
                        type="text"
                        value={regSchool}
                        onChange={(e) => setRegSchool(e.target.value)}
                        placeholder="THCS Phan Bội Châu"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-subject"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
                    >
                      Môn giảng dạy
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-subject"
                        type="text"
                        value={regSubject}
                        onChange={(e) => setRegSubject(e.target.value)}
                        placeholder="Ngữ văn THCS"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="reg-password"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
                    >
                      Mật khẩu <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-password"
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Tối thiểu 4 ký tự"
                        className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-confirm-password"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
                    >
                      Xác nhận mật khẩu <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-confirm-password"
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Pre-fill template data option */}
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regCloneSample}
                    onChange={(e) => setRegCloneSample(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>
                    <strong>Khởi tạo kèm dữ liệu mẫu môn Ngữ văn:</strong> Tự động có sẵn danh sách 4 lớp (6A1, 7A1, 8A1, 9A1), bài học và sổ điểm để dễ dàng trải nghiệm ngay.
                  </span>
                </label>

                {/* Register Error Notification */}
                {regError && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{regError}</span>
                  </div>
                )}

                {/* Supabase Cloud Notice */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>Tài khoản mới sẽ được tự động lưu trữ trên <strong>Supabase Cloud</strong>.</span>
                </div>

                {/* Submit Register Button */}
                <button
                  id="submit-register-btn"
                  type="submit"
                  disabled={isRegistering}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all hover:shadow-lg disabled:opacity-60 cursor-pointer"
                >
                  {isRegistering ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang đăng ký...
                    </span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Đăng ký Tài khoản & Đăng nhập</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Bottom Footer Information */}
          <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Lưu trữ cục bộ an toàn trên trình duyệt
            </span>
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="hover:text-blue-600 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Hướng dẫn
            </button>
          </div>
        </div>
      </div>

      {/* Help & Account Recovery Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Hướng dẫn đăng nhập & Mật khẩu</h3>
                <p className="text-xs text-slate-500">Hệ thống trợ lý học tập Thầy Dương Thành Tín</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="font-bold text-blue-900 mb-1">Tài khoản mặc định:</p>
                <p>• Tên đăng nhập (username): <span className="font-mono font-bold text-blue-700">thaytin</span></p>
                <p>• Mật khẩu: <span className="font-mono font-bold text-blue-700">password123</span></p>
              </div>
              <p>
                • <strong>Tài khoản độc lập:</strong> Mỗi tài khoản đăng ký bằng username sẽ có dữ liệu các lớp, học sinh, điểm số và bài học riêng biệt.
              </p>
              <p>
                • <strong>Bảo mật & Ngoại tuyến:</strong> Dữ liệu và tài khoản được lưu trữ an toàn trong trình duyệt của Thầy/Cô, không gửi ra ngoài internet.
              </p>
              <p>
                • Thầy/Cô có thể tạo thêm nhiều tài khoản cho các đồng nghiệp khác để cùng trải nghiệm trên cùng một máy tính hoặc máy tính bảng.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 cursor-pointer"
              >
                Đã hiểu, quay lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
