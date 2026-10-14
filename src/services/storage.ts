/**
 * storage.ts
 * Quản lý lưu trữ dữ liệu cục bộ (localStorage) & Hệ thống Tài khoản cho Web App:
 * "TRỢ LÝ QUẢN TRỊ HỌC TẬP – THẦY DƯƠNG THÀNH TÍN"
 * 
 * TÍNH NĂNG:
 * - Đăng nhập / Đăng ký tài khoản bằng username & password
 * - Tách biệt không gian dữ liệu học tập cho từng tài khoản giáo viên
 * - Tự động di chuyển dữ liệu cũ của Thầy Dương Thành Tín vào tài khoản mặc định
 * - Hỗ trợ đăng xuất, đổi mật khẩu, chỉnh sửa hồ sơ giáo viên
 */

import { AppData, UserAccount } from '../types';
import { initialAppData } from '../data/sampleData';

const LEGACY_STORAGE_KEY = 'tro_ly_giao_vien_duong_thanh_tin_v1';
const USERS_STORAGE_KEY = 'tro_ly_giao_vien_users_v1';
const ACTIVE_USER_KEY = 'tro_ly_giao_vien_active_user_v1';

export const DEFAULT_USER: UserAccount = {
  id: 'user_duong_thanh_tin',
  username: 'thaytin',
  password: 'password123',
  fullName: 'Thầy Dương Thành Tín',
  school: 'THCS Phan Bội Châu',
  subject: 'Ngữ văn THCS',
  avatarColor: 'blue',
  createdAt: '2025-01-01T00:00:00.000Z',
  lastLogin: new Date().toISOString(),
};

/**
 * Lấy danh sách tất cả tài khoản đã đăng ký trên thiết bị này.
 * Nếu chưa có, tự động tạo tài khoản mặc định cho Thầy Dương Thành Tín.
 */
export function getUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      const defaultList: UserAccount[] = [DEFAULT_USER];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultList));
      return defaultList;
    }
    const list = JSON.parse(raw) as UserAccount[];
    if (!Array.isArray(list) || list.length === 0) {
      const defaultList: UserAccount[] = [DEFAULT_USER];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultList));
      return defaultList;
    }
    return list;
  } catch (error) {
    console.error('Lỗi khi đọc danh sách tài khoản:', error);
    return [DEFAULT_USER];
  }
}

/**
 * Lưu danh sách người dùng vào localStorage
 */
function saveUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Lỗi khi lưu danh sách tài khoản:', error);
  }
}

/**
 * Lấy tài khoản đang đăng nhập hiện tại
 */
export function getActiveUser(): UserAccount | null {
  try {
    const rawUsername = localStorage.getItem(ACTIVE_USER_KEY);
    if (!rawUsername) {
      return null;
    }
    const users = getUsers();
    const found = users.find(
      (u) => u.username.toLowerCase() === rawUsername.toLowerCase().trim()
    );
    return found || null;
  } catch (error) {
    console.error('Lỗi khi lấy tài khoản hiện tại:', error);
    return null;
  }
}

/**
 * Đặt tài khoản đang đăng nhập
 */
export function setActiveUser(user: UserAccount | null): void {
  try {
    if (user) {
      localStorage.setItem(ACTIVE_USER_KEY, user.username);
    } else {
      localStorage.removeItem(ACTIVE_USER_KEY);
    }
  } catch (error) {
    console.error('Lỗi khi lưu phiên đăng nhập:', error);
  }
}

/**
 * Đăng nhập bằng username và mật khẩu
 */
export function loginUser(
  username: string,
  password: string
): { success: boolean; error?: string; user?: UserAccount } {
  const cleanUsername = username.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanUsername) {
    return { success: false, error: 'Vui lòng nhập Tên đăng nhập (username)!' };
  }
  if (!cleanPassword) {
    return { success: false, error: 'Vui lòng nhập Mật khẩu!' };
  }

  const users = getUsers();
  const foundUser = users.find((u) => u.username.toLowerCase() === cleanUsername);

  if (!foundUser) {
    return {
      success: false,
      error: `Tên đăng nhập "${username}" không tồn tại. Thầy/Cô vui lòng kiểm tra lại hoặc chuyển sang tab Đăng ký!`,
    };
  }

  if (foundUser.password !== cleanPassword) {
    return { success: false, error: 'Mật khẩu không chính xác! Vui lòng thử lại.' };
  }

  // Cập nhật thời điểm đăng nhập gần nhất
  const updatedUser: UserAccount = {
    ...foundUser,
    lastLogin: new Date().toISOString(),
  };

  const updatedUsers = users.map((u) => (u.id === foundUser.id ? updatedUser : u));
  saveUsers(updatedUsers);
  setActiveUser(updatedUser);

  return { success: true, user: updatedUser };
}

/**
 * Đăng ký tài khoản mới bằng username
 */
export function registerUser(params: {
  username: string;
  password: string;
  fullName: string;
  school?: string;
  subject?: string;
  cloneSample?: boolean;
}): { success: boolean; error?: string; user?: UserAccount } {
  const cleanUsername = params.username.trim().toLowerCase();
  const cleanPassword = params.password.trim();
  const cleanFullName = params.fullName.trim();
  const cleanSchool = (params.school || 'THCS Phan Bội Châu').trim();
  const cleanSubject = (params.subject || 'Ngữ văn THCS').trim();

  // Kiểm tra tên đăng nhập hợp lệ
  if (!cleanUsername) {
    return { success: false, error: 'Vui lòng nhập Tên đăng nhập (username)!' };
  }
  if (cleanUsername.length < 3) {
    return { success: false, error: 'Tên đăng nhập phải có ít nhất 3 ký tự!' };
  }
  const usernameRegex = /^[a-zA-Z0-9_.]+$/;
  if (!usernameRegex.test(cleanUsername)) {
    return {
      success: false,
      error: 'Tên đăng nhập chỉ được gồm chữ cái, chữ số, dấu gạch dưới (_) hoặc dấu chấm (.), không có dấu cách hay ký tự đặc biệt!',
    };
  }

  // Kiểm tra họ tên
  if (!cleanFullName) {
    return { success: false, error: 'Vui lòng nhập Họ và tên Thầy/Cô!' };
  }

  // Kiểm tra mật khẩu
  if (!cleanPassword) {
    return { success: false, error: 'Vui lòng đặt Mật khẩu!' };
  }
  if (cleanPassword.length < 4) {
    return { success: false, error: 'Mật khẩu phải có tối thiểu 4 ký tự!' };
  }

  const users = getUsers();
  const isDuplicate = users.some((u) => u.username.toLowerCase() === cleanUsername);
  if (isDuplicate) {
    return {
      success: false,
      error: `Tên đăng nhập "${cleanUsername}" đã được sử dụng. Vui lòng chọn một tên đăng nhập khác!`,
    };
  }

  // Chọn màu avatar ngẫu nhiên
  const colors = ['blue', 'indigo', 'emerald', 'violet', 'amber', 'rose', 'teal', 'cyan'];
  const avatarColor = colors[Math.floor(Math.random() * colors.length)];

  const newUser: UserAccount = {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    username: cleanUsername,
    password: cleanPassword,
    fullName: cleanFullName,
    school: cleanSchool,
    subject: cleanSubject,
    avatarColor,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  const updatedUsers = [...users, newUser];
  saveUsers(updatedUsers);
  setActiveUser(newUser);

  // Khởi tạo dữ liệu học tập ban đầu cho user mới
  if (params.cloneSample !== false) {
    // Clone dữ liệu mẫu môn Ngữ văn
    saveUserData(cleanUsername, initialAppData);
  } else {
    // Khởi tạo trống
    const emptyData: AppData = {
      classes: [],
      students: [],
      lessons: [],
      tasks: [],
      grades: [],
      comments: [],
      activityLogs: [
        {
          id: 'log_' + Date.now(),
          type: 'class',
          action: `Tài khoản ${newUser.fullName} (${newUser.username}) được kích hoạt`,
          timestamp: new Date().toISOString(),
        },
      ],
      soundEnabled: false,
    };
    saveUserData(cleanUsername, emptyData);
  }

  return { success: true, user: newUser };
}

/**
 * Đổi mật khẩu tài khoản
 */
export function changePassword(
  userId: string,
  oldPass: string,
  newPass: string
): { success: boolean; error?: string } {
  const users = getUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return { success: false, error: 'Không tìm thấy thông tin tài khoản!' };
  }
  if (user.password !== oldPass.trim()) {
    return { success: false, error: 'Mật khẩu hiện tại không đúng!' };
  }
  if (!newPass.trim() || newPass.trim().length < 4) {
    return { success: false, error: 'Mật khẩu mới phải có tối thiểu 4 ký tự!' };
  }

  const updatedUsers = users.map((u) =>
    u.id === userId ? { ...u, password: newPass.trim() } : u
  );
  saveUsers(updatedUsers);
  return { success: true };
}

/**
 * Cập nhật thông tin hồ sơ giáo viên
 */
export function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserAccount, 'fullName' | 'school' | 'subject' | 'email' | 'phone' | 'avatarColor'>>
): { success: boolean; error?: string; user?: UserAccount } {
  const users = getUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return { success: false, error: 'Không tìm thấy người dùng!' };
  }

  const updatedUser: UserAccount = {
    ...user,
    ...updates,
    fullName: updates.fullName?.trim() || user.fullName,
    school: updates.school?.trim() || user.school,
    subject: updates.subject?.trim() || user.subject,
  };

  const updatedUsers = users.map((u) => (u.id === userId ? updatedUser : u));
  saveUsers(updatedUsers);

  // Nếu user đang active, đồng bộ lại
  const activeUser = getActiveUser();
  if (activeUser && activeUser.id === userId) {
    setActiveUser(updatedUser);
  }

  return { success: true, user: updatedUser };
}

/**
 * Đăng xuất
 */
export function logoutUser(): void {
  setActiveUser(null);
}

// ====================================================
// QUẢN LÝ DỮ LIỆU HỌC TẬP (AppData) THEO TÀI KHOẢN
// ====================================================

function getUserDataStorageKey(username?: string): string {
  const user = username ? username.trim().toLowerCase() : (getActiveUser()?.username.toLowerCase() || 'thaytin');
  return `tro_ly_data_user_${user}`;
}

/**
 * Tải dữ liệu học tập của tài khoản hiện tại hoặc username chỉ định
 */
export function loadAppData(username?: string): AppData {
  try {
    const key = getUserDataStorageKey(username);
    const raw = localStorage.getItem(key);

    if (!raw) {
      // Kiểm tra xem có dữ liệu legacy trước đây của Thầy Dương Thành Tín không
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        try {
          const legacyData = JSON.parse(legacyRaw) as Partial<AppData>;
          const migrated: AppData = {
            classes: legacyData.classes || initialAppData.classes,
            students: legacyData.students || initialAppData.students,
            lessons: legacyData.lessons || initialAppData.lessons,
            tasks: legacyData.tasks || initialAppData.tasks,
            grades: legacyData.grades || initialAppData.grades,
            comments: legacyData.comments || initialAppData.comments,
            activityLogs: legacyData.activityLogs || initialAppData.activityLogs,
            soundEnabled: typeof legacyData.soundEnabled === 'boolean' ? legacyData.soundEnabled : false,
          };
          saveAppData(migrated, username);
          return migrated;
        } catch {
          // ignore
        }
      }

      // Khởi tạo mặc định
      saveAppData(initialAppData, username);
      return initialAppData;
    }

    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      classes: parsed.classes || initialAppData.classes,
      students: parsed.students || initialAppData.students,
      lessons: parsed.lessons || initialAppData.lessons,
      tasks: parsed.tasks || initialAppData.tasks,
      grades: parsed.grades || initialAppData.grades,
      comments: parsed.comments || initialAppData.comments,
      activityLogs: parsed.activityLogs || initialAppData.activityLogs,
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : false,
    };
  } catch (error) {
    console.error('Lỗi khi đọc dữ liệu từ localStorage:', error);
    return initialAppData;
  }
}

/**
 * Lưu dữ liệu học tập cho tài khoản hiện tại hoặc username chỉ định
 */
export function saveAppData(data: AppData, username?: string): void {
  try {
    const key = getUserDataStorageKey(username);
    localStorage.setItem(key, JSON.stringify(data));
    // Giữ bản sao legacy dự phòng cho thaytin
    if (!username || username.toLowerCase() === 'thaytin') {
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(data));
    }
  } catch (error) {
    console.error('Lỗi khi lưu dữ liệu vào localStorage:', error);
  }
}

export function saveUserData(username: string, data: AppData): void {
  saveAppData(data, username);
}

export function resetAppData(username?: string): AppData {
  saveAppData(initialAppData, username);
  return initialAppData;
}

export function clearAppData(username?: string): AppData {
  const emptyData: AppData = {
    classes: [],
    students: [],
    lessons: [],
    tasks: [],
    grades: [],
    comments: [],
    activityLogs: [
      {
        id: 'log_' + Date.now(),
        type: 'class',
        action: 'Đã xóa toàn bộ dữ liệu, làm mới không gian làm việc',
        timestamp: new Date().toISOString(),
      },
    ],
    soundEnabled: false,
  };
  saveAppData(emptyData, username);
  return emptyData;
}

export function exportAppDataToFile(data: AppData, teacherName?: string): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const safeName = (teacherName || 'ThayDuongThanhTin').replace(/\s+/g, '_');
  link.href = url;
  link.download = `DuLieu_TroLy_${safeName}_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importAppDataFromFile(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as AppData;
        if (!parsed.classes || !parsed.students || !parsed.lessons) {
          throw new Error('Tệp JSON không đúng định dạng dữ liệu của ứng dụng!');
        }
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Không thể đọc tệp sao lưu!'));
    reader.readAsText(file);
  });
}

/**
 * Hiệu ứng âm thanh thông báo nhẹ (Web Audio API)
 */
export function playChime(type: 'success' | 'delete' | 'warning' = 'success', enabled: boolean = false): void {
  if (!enabled) return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.26);
    } else if (type === 'warning') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(330, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.23);
    } else {
      // delete
      osc.type = 'sine';
      osc.frequency.setValueAtTime(370, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.18);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.21);
    }
  } catch {
    // Silent fallback if audio context blocked
  }
}
