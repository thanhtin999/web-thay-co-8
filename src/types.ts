/**
 * Định nghĩa kiểu dữ liệu cho Web App
 * "TRỢ LÝ QUẢN TRỊ HỌC TẬP – THẦY DƯƠNG THÀNH TÍN"
 * Môn: Ngữ văn - THCS Phan Bội Châu
 */

export interface ClassItem {
  id: string;
  name: string; // e.g., '6A1', '7A1', '8A1', '9A1'
  gradeLevel: number; // 6, 7, 8, 9
  room?: string; // Phòng học, e.g., 'Phòng 204'
  academicYear: string; // e.g., '2025-2026'
  note?: string; // Ghi chú đặc điểm lớp
}

export interface Student {
  id: string;
  studentCode: string; // Mã học sinh, e.g., 'HS0601'
  fullName: string; // Họ và tên
  classId: string; // ID lớp học
  gender: 'Nam' | 'Nữ';
  status: 'Đang học' | 'Nghỉ học' | 'Chuyển lớp';
  note?: string; // Ghi chú riêng của giáo viên
  needAttention?: boolean; // Đánh dấu cần chú ý
}

export type LessonStatus = 'Chưa dạy' | 'Đang dạy' | 'Đã hoàn thành';

export interface Lesson {
  id: string;
  title: string; // Tên bài học, e.g., 'Thực hành Tiếng Việt: Nghĩa của từ ngữ'
  classId: string; // Lớp áp dụng
  topic: string; // Chủ đề / Bài học lớn, e.g., 'Bài 1: Lắng nghe lịch sử nước mình'
  objectives: string; // Mục tiêu học tập
  summary: string; // Nội dung tóm tắt
  teachDate: string; // Ngày dạy dự kiến (YYYY-MM-DD)
  status: LessonStatus;
}

export type TaskStatus = 'Chưa giao' | 'Đã giao' | 'Đang thực hiện' | 'Đã hoàn thành';
export type TaskPriority = 'Bình thường' | 'Quan trọng' | 'Khẩn cấp';

export interface LearningTask {
  id: string;
  title: string; // Tên nhiệm vụ
  classId: string; // Lớp được giao
  lessonId?: string; // Bài học liên quan
  description: string; // Mô tả nhiệm vụ
  dueDate: string; // Hạn nộp (YYYY-MM-DD)
  priority: TaskPriority;
  status: TaskStatus;
  completedStudentIds: string[]; // Danh sách mã học sinh đã nộp/hoàn thành
}

export interface GradeEntry {
  id: string;
  studentId: string; // ID học sinh
  classId: string; // ID lớp
  activityTitle: string; // Tên bài kiểm tra / hoạt động (e.g., 'Viết đoạn văn ngắn', 'Kiểm tra đọc hiểu')
  lessonId?: string; // Bài học liên kết (nếu có)
  score: number; // Điểm số (0.0 đến 10.0)
  date: string; // Ngày chấm điểm (YYYY-MM-DD)
  note?: string; // Lời phê / nhận xét điểm
}

export interface StudentComment {
  id: string;
  studentId: string; // ID học sinh
  classId: string; // ID lớp
  date: string; // Ngày nhận xét
  content: string; // Nội dung nhận xét
  skillCategory: 'Đọc hiểu' | 'Viết bài' | 'Nói & Nghe' | 'Thái độ & Chuyên cần' | 'Khác';
  note?: string; // Ghi chú thêm
}

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO string
  type: 'student' | 'lesson' | 'task' | 'grade' | 'comment' | 'class';
  action: string; // Mô tả ngắn gọn: e.g. "Đã thêm học sinh Nguyễn Văn An"
}

export type DocumentCategory = 'Giáo án' | 'Đề kiểm tra' | 'Tài liệu đọc thêm' | 'Phiếu học tập' | 'Khác';

export interface TeacherDocument {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  storagePath: string;
  uploadedAt: string;
  category: DocumentCategory;
  classId?: string;
  lessonId?: string;
  note?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}

export interface AppData {
  classes: ClassItem[];
  students: Student[];
  lessons: Lesson[];
  tasks: LearningTask[];
  grades: GradeEntry[];
  comments: StudentComment[];
  activityLogs: ActivityLog[];
  documents?: TeacherDocument[];
  soundEnabled: boolean;
}

export interface UserAccount {
  id: string;
  username: string; // Tên đăng nhập (e.g. 'thaytin', 'thanhtin')
  password: string; // Mật khẩu
  fullName: string; // Họ và tên giáo viên (e.g. 'Thầy Dương Thành Tín')
  school: string; // Đơn vị trường học (e.g. 'THCS Phan Bội Châu')
  subject: string; // Môn giảng dạy (e.g. 'Ngữ văn THCS')
  email?: string;
  phone?: string;
  avatarColor?: string; // Mã màu hoặc tên màu avatar
  createdAt: string;
  lastLogin?: string;
}

export type NavTab = 
  | 'overview' 
  | 'classes' 
  | 'students' 
  | 'lessons' 
  | 'tasks' 
  | 'grades' 
  | 'progress' 
  | 'comments' 
  | 'stats'
  | 'documents';


