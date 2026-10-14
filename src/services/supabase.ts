/**
 * supabase.ts
 * Quản lý kết nối & đồng bộ dữ liệu đám mây Supabase (PostgreSQL) cho Web App:
 * "TRỢ LÝ QUẢN TRỊ HỌC TẬP – THẦY DƯƠNG THÀNH TÍN"
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AppData,
  ClassItem,
  Student,
  Lesson,
  LearningTask,
  GradeEntry,
  StudentComment,
  ActivityLog,
  UserAccount,
} from '../types';

export const SUPABASE_URL = (
  import.meta.env.VITE_SUPABASE_URL || 'https://amsfctvjqpjdmvzrtcwu.supabase.co'
).trim();

export const SUPABASE_ANON_KEY = (
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Ag1yodyLpQ0JJD9S4QHpXw_d5e5ba6S'
).trim();

// Khởi tạo Supabase client
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface SupabaseSyncStatus {
  connected: boolean;
  tableReady: boolean;
  lastSyncedAt?: string;
  error?: string;
}

/**
 * Mã SQL hoàn chỉnh để tạo bảng và phân quyền trên Supabase SQL Editor
 */
export const SUPABASE_SQL_SETUP = `-- ========================================================
-- KHỞI TẠO CƠ SỞ DỮ LIỆU "TRỢ LÝ HỌC TẬP - THẦY DƯƠNG THÀNH TÍN"
-- Chạy đoạn mã này tại: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ========================================================

-- 0. BẢNG TÀI KHOẢN GIÁO VIÊN ĐĂNG NHẬP / ĐĂNG KÝ (teacher_accounts)
CREATE TABLE IF NOT EXISTS teacher_accounts (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    school TEXT,
    subject TEXT,
    email TEXT,
    phone TEXT,
    avatar_color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE teacher_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon teacher_accounts" ON teacher_accounts;
CREATE POLICY "Allow anon teacher_accounts" ON teacher_accounts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 1. BẢNG LƯU TRỮ CHÍNH ĐỒNG BỘ TOÀN BỘ ỨNG DỤNG (teacher_app_data)
CREATE TABLE IF NOT EXISTS teacher_app_data (
    user_id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Phân quyền truy cập (Row Level Security) cho teacher_app_data
ALTER TABLE teacher_app_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon on teacher_app_data" ON teacher_app_data;
CREATE POLICY "Allow all for anon on teacher_app_data"
ON teacher_app_data FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 2. CÁC BẢNG CHI TIẾT ĐỂ XEM & LỌC TRỰC TIẾP TRÊN SUPABASE TABLE EDITOR (TÙY CHỌN)
-- Bảng Lớp học
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    grade_level INT NOT NULL,
    room TEXT,
    academic_year TEXT,
    note TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon classes" ON classes;
CREATE POLICY "Allow anon classes" ON classes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Bảng Học sinh
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    student_code TEXT NOT NULL,
    full_name TEXT NOT NULL,
    class_id TEXT NOT NULL,
    gender TEXT NOT NULL,
    status TEXT NOT NULL,
    note TEXT,
    need_attention BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon students" ON students;
CREATE POLICY "Allow anon students" ON students FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Bảng Bài học
CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    class_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    objectives TEXT,
    summary TEXT,
    teach_date TEXT,
    status TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon lessons" ON lessons;
CREATE POLICY "Allow anon lessons" ON lessons FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Bảng Nhiệm vụ học tập
CREATE TABLE IF NOT EXISTS learning_tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    class_id TEXT NOT NULL,
    lesson_id TEXT,
    description TEXT,
    due_date TEXT,
    priority TEXT NOT NULL,
    status TEXT NOT NULL,
    completed_student_ids JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE learning_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon learning_tasks" ON learning_tasks;
CREATE POLICY "Allow anon learning_tasks" ON learning_tasks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Bảng Điểm số
CREATE TABLE IF NOT EXISTS grades (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    activity_title TEXT NOT NULL,
    lesson_id TEXT,
    score NUMERIC NOT NULL,
    date TEXT NOT NULL,
    note TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon grades" ON grades;
CREATE POLICY "Allow anon grades" ON grades FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Bảng Nhận xét học sinh
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    date TEXT NOT NULL,
    content TEXT NOT NULL,
    skill_category TEXT NOT NULL,
    note TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon comments" ON comments;
CREATE POLICY "Allow anon comments" ON comments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Bảng Nhật ký hoạt động
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    type TEXT NOT NULL,
    action TEXT NOT NULL
);
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon activity_logs" ON activity_logs;
CREATE POLICY "Allow anon activity_logs" ON activity_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
`;

/**
 * Kiểm tra kết nối với Supabase và kiểm tra bảng teacher_app_data đã sẵn sàng chưa
 */
export async function checkSupabaseConnection(): Promise<SupabaseSyncStatus> {
  try {
    const { data, error } = await supabase
      .from('teacher_app_data')
      .select('user_id')
      .limit(1);

    if (error) {
      // Mã lỗi PGRST204 / 42P01: Bảng chưa được tạo
      if (
        error.code === '42P01' ||
        error.message.includes('relation "teacher_app_data" does not exist') ||
        error.message.includes('does not exist')
      ) {
        return {
          connected: true,
          tableReady: false,
          error: 'Cần khởi tạo bảng trên Supabase qua SQL Editor',
        };
      }
      return {
        connected: false,
        tableReady: false,
        error: error.message,
      };
    }

    return {
      connected: true,
      tableReady: true,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Không thể kết nối đến Supabase';
    return {
      connected: false,
      tableReady: false,
      error: message,
    };
  }
}

/**
 * Lưu toàn bộ AppData lên Supabase cho tài khoản giáo viên
 */
export async function saveAppDataToSupabase(
  data: AppData,
  userId: string = 'thaytin'
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Lưu vào bảng master teacher_app_data
    const { error: masterError } = await supabase
      .from('teacher_app_data')
      .upsert(
        {
          user_id: userId,
          data: data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (masterError) {
      console.warn('Lỗi lưu vào teacher_app_data:', masterError.message);
      return { success: false, error: masterError.message };
    }

    // 2. Thử đồng bộ dữ liệu vào các bảng con nếu các bảng này đã được tạo
    // (Bọc trong try catch độc lập để không ảnh hưởng đến master sync)
    syncRelationalTablesQuietly(data, userId).catch((err) => {
      console.debug('Đồng bộ bảng quan hệ chi tiết (tuỳ chọn):', err);
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi không xác định khi lưu Supabase';
    return { success: false, error: msg };
  }
}

/**
 * Tải AppData từ Supabase cho tài khoản giáo viên
 */
export async function loadAppDataFromSupabase(
  userId: string = 'thaytin'
): Promise<{ data: AppData | null; error?: string }> {
  try {
    const { data: record, error } = await supabase
      .from('teacher_app_data')
      .select('data, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!record || !record.data) {
      return { data: null };
    }

    return { data: record.data as AppData };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu từ Supabase';
    return { data: null, error: msg };
  }
}

/**
 * Lưu hoặc cập nhật tài khoản giáo viên vào Supabase
 * Tự động ghi vào cả bảng master teacher_app_data (__system_accounts)
 * và bảng riêng teacher_accounts (nếu đã tạo trên Supabase)
 */
export async function saveAccountToSupabase(account: UserAccount): Promise<boolean> {
  try {
    // 1. Lưu vào bảng master teacher_app_data dưới key '__system_accounts'
    const { data: currentRecord } = await supabase
      .from('teacher_app_data')
      .select('data')
      .eq('user_id', '__system_accounts')
      .maybeSingle();

    let list: UserAccount[] = [];
    if (currentRecord && Array.isArray(currentRecord.data)) {
      list = currentRecord.data as UserAccount[];
    }
    const cleanUsername = account.username.toLowerCase().trim();
    const filtered = list.filter((u) => u.username.toLowerCase().trim() !== cleanUsername);
    filtered.push(account);

    await supabase.from('teacher_app_data').upsert({
      user_id: '__system_accounts',
      data: filtered,
      updated_at: new Date().toISOString(),
    });

    // 2. Đồng thời lưu vào bảng riêng teacher_accounts nếu đã tạo
    try {
      await supabase.from('teacher_accounts').upsert({
        id: account.id,
        username: account.username,
        password: account.password,
        full_name: account.fullName,
        school: account.school || '',
        subject: account.subject || '',
        email: account.email || '',
        phone: account.phone || '',
        avatar_color: account.avatarColor || 'blue',
        created_at: account.createdAt,
        last_login: account.lastLogin || new Date().toISOString(),
      }, { onConflict: 'username' });
    } catch {
      // Bỏ qua nếu bảng teacher_accounts chưa tạo
    }

    return true;
  } catch (err) {
    console.warn('Lỗi lưu tài khoản lên Supabase:', err);
    return false;
  }
}

/**
 * Tải danh sách tất cả tài khoản giáo viên đã đăng ký từ Supabase
 */
export async function fetchAccountsFromSupabase(): Promise<UserAccount[]> {
  try {
    // 1. Thử lấy từ bảng teacher_accounts
    try {
      const { data: accRows, error: accErr } = await supabase
        .from('teacher_accounts')
        .select('*');

      if (!accErr && accRows && accRows.length > 0) {
        return accRows.map((r: Record<string, unknown>) => ({
          id: String(r.id),
          username: String(r.username),
          password: String(r.password),
          fullName: String(r.full_name || ''),
          school: String(r.school || ''),
          subject: String(r.subject || ''),
          email: r.email ? String(r.email) : undefined,
          phone: r.phone ? String(r.phone) : undefined,
          avatarColor: r.avatar_color ? String(r.avatar_color) : 'blue',
          createdAt: String(r.created_at || new Date().toISOString()),
          lastLogin: r.last_login ? String(r.last_login) : undefined,
        }));
      }
    } catch {
      // fallback
    }

    // 2. Dự phòng: lấy từ bảng teacher_app_data (__system_accounts)
    const { data: masterRec } = await supabase
      .from('teacher_app_data')
      .select('data')
      .eq('user_id', '__system_accounts')
      .maybeSingle();

    if (masterRec && Array.isArray(masterRec.data)) {
      return masterRec.data as UserAccount[];
    }

    return [];
  } catch (err) {
    console.warn('Lỗi lấy tài khoản từ Supabase:', err);
    return [];
  }
}

/**
 * Tìm tài khoản theo username từ Supabase
 */
export async function findAccountInSupabase(username: string): Promise<UserAccount | null> {
  const clean = username.toLowerCase().trim();
  const all = await fetchAccountsFromSupabase();
  return all.find((u) => u.username.toLowerCase().trim() === clean) || null;
}

/**
 * Hàm hỗ trợ đồng bộ ngầm các bảng quan hệ chi tiết (nếu bảng tồn tại)
 * để Thầy Tín có thể vào mục Table Editor trên Supabase xem bảng học sinh, lớp, điểm riêng biệt
 */
async function syncRelationalTablesQuietly(data: AppData, userId: string): Promise<void> {
  // Sync classes
  if (data.classes?.length > 0) {
    try {
      const classRows = data.classes.map((c) => ({
        id: c.id,
        user_id: userId,
        name: c.name,
        grade_level: c.gradeLevel,
        room: c.room || '',
        academic_year: c.academicYear,
        note: c.note || '',
      }));
      await supabase.from('classes').upsert(classRows, { onConflict: 'id' });
    } catch {
      // Bảng chưa tạo hoặc lỗi quyền - bỏ qua an toàn
    }
  }

  // Sync students
  if (data.students?.length > 0) {
    try {
      const studentRows = data.students.map((s) => ({
        id: s.id,
        user_id: userId,
        student_code: s.studentCode,
        full_name: s.fullName,
        class_id: s.classId,
        gender: s.gender,
        status: s.status,
        note: s.note || '',
        need_attention: !!s.needAttention,
      }));
      await supabase.from('students').upsert(studentRows, { onConflict: 'id' });
    } catch {
      // Bảng chưa tạo
    }
  }

  // Sync lessons
  if (data.lessons?.length > 0) {
    try {
      const lessonRows = data.lessons.map((l) => ({
        id: l.id,
        user_id: userId,
        title: l.title,
        class_id: l.classId,
        topic: l.topic,
        objectives: l.objectives || '',
        summary: l.summary || '',
        teach_date: l.teachDate,
        status: l.status,
      }));
      await supabase.from('lessons').upsert(lessonRows, { onConflict: 'id' });
    } catch {
      // Bảng chưa tạo
    }
  }

  // Sync tasks
  if (data.tasks?.length > 0) {
    try {
      const taskRows = data.tasks.map((t) => ({
        id: t.id,
        user_id: userId,
        title: t.title,
        class_id: t.classId,
        lesson_id: t.lessonId || null,
        description: t.description || '',
        due_date: t.dueDate,
        priority: t.priority,
        status: t.status,
        completed_student_ids: t.completedStudentIds || [],
      }));
      await supabase.from('learning_tasks').upsert(taskRows, { onConflict: 'id' });
    } catch {
      // Bảng chưa tạo
    }
  }

  // Sync grades
  if (data.grades?.length > 0) {
    try {
      const gradeRows = data.grades.map((g) => ({
        id: g.id,
        user_id: userId,
        student_id: g.studentId,
        class_id: g.classId,
        activity_title: g.activityTitle,
        lesson_id: g.lessonId || null,
        score: g.score,
        date: g.date,
        note: g.note || '',
      }));
      await supabase.from('grades').upsert(gradeRows, { onConflict: 'id' });
    } catch {
      // Bảng chưa tạo
    }
  }

  // Sync comments
  if (data.comments?.length > 0) {
    try {
      const commentRows = data.comments.map((c) => ({
        id: c.id,
        user_id: userId,
        student_id: c.studentId,
        class_id: c.classId,
        date: c.date,
        content: c.content,
        skill_category: c.skillCategory,
        note: c.note || '',
      }));
      await supabase.from('comments').upsert(commentRows, { onConflict: 'id' });
    } catch {
      // Bảng chưa tạo
    }
  }

  // Sync activity logs
  if (data.activityLogs?.length > 0) {
    try {
      const logRows = data.activityLogs.map((l) => ({
        id: l.id,
        user_id: userId,
        timestamp: l.timestamp,
        type: l.type,
        action: l.action,
      }));
      await supabase.from('activity_logs').upsert(logRows, { onConflict: 'id' });
    } catch {
      // Bảng chưa tạo
    }
  }
}
