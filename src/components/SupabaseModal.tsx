import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Cloud,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  Key,
  Globe,
  Database,
  FileText,
  Copy,
  ExternalLink,
  Trash2,
  Plus,
  FileCheck,
  FolderOpen,
  Info,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { AppData, SupabaseConfig, TeacherDocument, DocumentCategory, UserAccount } from '../types';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  syncAllToSupabase,
  loadFromSupabase,
  uploadDocumentToSupabase,
  deleteDocumentFromSupabase,
  SUPABASE_SQL_SETUP_SCRIPT,
  SUPABASE_STORAGE_BUCKET
} from '../services/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AppData;
  onUpdateData: (newData: AppData) => void;
  currentUser: UserAccount;
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, desc?: string) => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  data,
  onUpdateData,
  currentUser,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'storage' | 'sql'>('config');

  // Config form states
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [autoSync, setAutoSync] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | undefined>();

  // Connection testing
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Sync operations
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  // Document upload states
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<DocumentCategory>('Giáo án');
  const [docClassId, setDocClassId] = useState('');
  const [docLessonId, setDocLessonId] = useState('');
  const [docNote, setDocNote] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter documents in storage tab
  const [filterCategory, setFilterCategory] = useState<'ALL' | DocumentCategory>('ALL');
  const [filterClass, setFilterClass] = useState<'ALL' | string>('ALL');

  // Copy SQL state
  const [isCopied, setIsCopied] = useState(false);

  // Load config on open
  useEffect(() => {
    if (isOpen) {
      const cfg = getSupabaseConfig();
      setUrl(cfg.url);
      setAnonKey(cfg.anonKey);
      setAutoSync(cfg.autoSync);
      setLastSynced(cfg.lastSyncedAt);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (cleanUrl && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('http://')) {
      onNotify('warning', 'Đường dẫn không hợp lệ', 'Project URL thường có dạng: https://abcdef.supabase.co');
      return;
    }

    const newCfg: SupabaseConfig = {
      url: cleanUrl,
      anonKey: cleanKey,
      autoSync,
      lastSyncedAt: lastSynced,
    };

    saveSupabaseConfig(newCfg);
    onNotify('success', 'Đã lưu cấu hình Supabase', 'Thông tin kết nối đã được lưu an toàn.');
  };

  const handleTestConnection = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        success: false,
        message: 'Thầy vui lòng nhập đủ cả Project URL và Anon API Key trước khi kiểm tra!',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    // Lưu trước khi test
    handleSaveConfig();

    const res = await testSupabaseConnection(url.trim(), anonKey.trim());
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      onNotify('success', 'Kết nối Supabase thành công', res.message);
    } else {
      onNotify('error', 'Không thể kết nối Supabase', res.message);
    }
  };

  const handlePushToSupabase = async () => {
    if (!url.trim() || !anonKey.trim()) {
      onNotify('warning', 'Chưa cấu hình Supabase', 'Vui lòng nhập Project URL và Anon Key trước!');
      return;
    }

    setIsSyncing(true);
    const res = await syncAllToSupabase(data, currentUser.username, currentUser.fullName);
    setIsSyncing(false);

    if (res.success) {
      const nowIso = new Date().toISOString();
      setLastSynced(nowIso);
      onNotify(
        'success',
        'Đã lưu toàn bộ dữ liệu lên Supabase',
        `Toàn bộ ${data.classes.length} lớp, ${data.students.length} học sinh, ${data.lessons.length} bài học và điểm số đã được đồng bộ lên Cloud.`
      );
    } else {
      onNotify('error', 'Đồng bộ thất bại', res.error);
    }
  };

  const handlePullFromSupabase = async () => {
    if (!url.trim() || !anonKey.trim()) {
      onNotify('warning', 'Chưa cấu hình Supabase', 'Vui lòng nhập Project URL và Anon Key trước!');
      return;
    }

    if (!confirm('Dữ liệu từ Supabase sẽ ghi đè lên dữ liệu hiện tại trên trình duyệt này. Thầy có chắc chắn muốn tải về không?')) {
      return;
    }

    setIsPulling(true);
    const res = await loadFromSupabase(currentUser.username);
    setIsPulling(false);

    if (res.success && res.data) {
      onUpdateData(res.data);
      const nowIso = new Date().toISOString();
      setLastSynced(nowIso);
      onNotify(
        'success',
        'Đã tải dữ liệu từ Supabase về máy',
        `Khôi phục thành công ${res.data.classes.length} lớp và ${res.data.students.length} học sinh từ Cloud Supabase!`
      );
    } else {
      onNotify('error', 'Không thể tải dữ liệu từ Supabase', res.error);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Vui lòng chọn tệp tài liệu cần tải lên!');
      return;
    }
    if (!docTitle.trim()) {
      setUploadError('Vui lòng nhập tiêu đề tài liệu!');
      return;
    }

    setIsUploadingDoc(true);
    setUploadError('');

    const res = await uploadDocumentToSupabase(selectedFile, {
      title: docTitle.trim(),
      category: docCategory,
      username: currentUser.username,
      classId: docClassId || undefined,
      lessonId: docLessonId || undefined,
      note: docNote.trim() || undefined,
    });

    setIsUploadingDoc(false);

    if (res.success && res.document) {
      const existingDocs = data.documents || [];
      const updatedDocs = [res.document, ...existingDocs];
      const updatedData: AppData = {
        ...data,
        documents: updatedDocs,
        activityLogs: [
          {
            id: 'log_' + Date.now(),
            type: 'lesson',
            action: `Đã tải tài liệu "${res.document.title}" lên Supabase Storage`,
            timestamp: new Date().toISOString(),
          },
          ...data.activityLogs,
        ],
      };

      onUpdateData(updatedData);

      // Reset form
      setDocTitle('');
      setDocNote('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      onNotify('success', 'Tải tài liệu lên Supabase thành công', `Đã lưu tệp ${res.document.fileName} vào bucket "${SUPABASE_STORAGE_BUCKET}".`);

      // Nếu autoSync, đẩy app data lên luôn
      if (autoSync) {
        syncAllToSupabase(updatedData, currentUser.username, currentUser.fullName);
      }
    } else {
      setUploadError(res.error || 'Tải tệp lên thất bại');
      onNotify('error', 'Lỗi tải tệp lên Supabase', res.error);
    }
  };

  const handleDeleteDoc = async (doc: TeacherDocument) => {
    if (!confirm(`Thầy có chắc muốn xóa tài liệu "${doc.title}" khỏi Supabase Storage không?`)) {
      return;
    }

    const res = await deleteDocumentFromSupabase(doc.storagePath);
    if (res.success) {
      const filtered = (data.documents || []).filter((d) => d.id !== doc.id);
      onUpdateData({ ...data, documents: filtered });
      onNotify('success', 'Đã xóa tài liệu', `Đã gỡ tệp ${doc.fileName} khỏi Supabase.`);
    } else {
      onNotify('error', 'Lỗi xóa tài liệu', res.error);
    }
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP_SCRIPT);
    setIsCopied(true);
    onNotify('success', 'Đã sao chép mã SQL', 'Thầy hãy dán mã vào tab SQL Editor trên trang Supabase và bấm Run nhé!');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const documentsList = (data.documents || []).filter((d) => {
    if (filterCategory !== 'ALL' && d.category !== filterCategory) return false;
    if (filterClass !== 'ALL' && d.classId !== filterClass) return false;
    return true;
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div
      id="supabase-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="supabase-modal-card"
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base sm:text-lg tracking-tight">
                  Lưu trữ Đám mây Supabase
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Cloud Database & Storage
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Đồng bộ tự động & Lưu trữ giáo án, tài liệu học tập vĩnh viễn trên Supabase
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/80 px-6 shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'config'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>1. Kết nối & Đồng bộ dữ liệu</span>
            {url && anonKey && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1 inline-block" title="Đã có cấu hình" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            className={`flex items-center gap-2 py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'storage'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-teal-600" />
            <span>2. Kho Tài liệu & Giáo án ({data.documents?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-2 py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>3. Mã SQL Supabase (1-Click)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: CẤU HÌNH KẾT NỐI & ĐỒNG BỘ */}
          {activeTab === 'config' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Step by step guide banner */}
              <div className="p-4 bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200/90 rounded-2xl">
                <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Hướng dẫn 4 bước kết nối Supabase (Miễn phí & Cực nhanh)
                </h4>
                <ol className="text-xs text-emerald-900/90 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>
                    Truy cập trang web <a href="https://supabase.com" target="_blank" rel="noreferrer" className="font-bold underline text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-3 h-3" /></a> và đăng nhập bằng tài khoản Google hoặc GitHub.
                  </li>
                  <li>
                    Bấm <strong>New Project</strong> (Đặt tên ví dụ: <code>tro-ly-ngu-van</code>, chọn Region <strong>Southeast Asia (Singapore)</strong>).
                  </li>
                  <li>
                    Vào <strong>Project Settings</strong> (biểu tượng bánh răng) → chọn <strong>API</strong> → sao chép <strong>Project URL</strong> và <strong>anon public key</strong>.
                  </li>
                  <li>
                    Dán vào 2 ô bên dưới và bấm <strong>Kiểm tra kết nối</strong>.
                  </li>
                </ol>
              </div>

              {/* Form Input URL & Anon Key */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Thông tin kết nối Supabase của Thầy
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    Supabase Project URL:
                  </label>
                  <input
                    id="supabase-project-url-input"
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://your-project-id.supabase.co"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tìm trong: Supabase Dashboard → Project Settings → API → Project URL
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-600" />
                    Supabase Anon Key (Public Key):
                  </label>
                  <div className="relative">
                    <input
                      id="supabase-anon-key-input"
                      type={showKey ? 'text' : 'password'}
                      value={anonKey}
                      onChange={(e) => setAnonKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full pr-10 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
                      title={showKey ? 'Ẩn khóa' : 'Hiện khóa'}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tìm trong: Supabase Dashboard → Project Settings → API → Project API keys → anon (public)
                  </p>
                </div>

                {/* Test Connection Button & Result */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    id="supabase-test-connection-btn"
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xs disabled:opacity-50"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang kiểm tra kết nối...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Kiểm tra kết nối Supabase</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-all"
                  >
                    Lưu thông tin kết nối
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                      testResult.success
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{testResult.message}</span>
                  </div>
                )}
              </div>

              {/* Data Sync Actions Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Đồng bộ Dữ liệu Học tập</h4>
                    <p className="text-xs text-slate-500">
                      Tài khoản: <strong className="text-blue-700">@{currentUser.username}</strong> ({currentUser.fullName})
                    </p>
                  </div>
                  {lastSynced && (
                    <span className="text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                      Lần cuối: {new Date(lastSynced).toLocaleTimeString('vi-VN')} {new Date(lastSynced).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Push Button */}
                  <button
                    id="supabase-push-btn"
                    type="button"
                    onClick={handlePushToSupabase}
                    disabled={isSyncing}
                    className="flex items-center justify-center gap-2.5 p-3.5 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs hover:from-emerald-700 hover:to-teal-700 transition-all shadow-sm shadow-emerald-500/20 active:scale-98 disabled:opacity-50"
                  >
                    <UploadCloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                    <span>{isSyncing ? 'Đang đẩy dữ liệu lên...' : 'Đẩy toàn bộ dữ liệu lên Supabase'}</span>
                  </button>

                  {/* Pull Button */}
                  <button
                    id="supabase-pull-btn"
                    type="button"
                    onClick={handlePullFromSupabase}
                    disabled={isPulling}
                    className="flex items-center justify-center gap-2.5 p-3.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all active:scale-98 disabled:opacity-50 shadow-2xs"
                  >
                    <DownloadCloud className={`w-4 h-4 text-emerald-600 ${isPulling ? 'animate-bounce' : ''}`} />
                    <span>{isPulling ? 'Đang tải về...' : 'Tải dữ liệu từ Supabase về máy'}</span>
                  </button>
                </div>

                {/* Auto Sync Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-xs font-semibold text-slate-800">Tự động đồng bộ mỗi khi thay đổi</span>
                    <p className="text-[11px] text-slate-500">Mỗi khi thầy thêm học sinh, chấm điểm hay đổi bài học sẽ tự lưu lên Supabase</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !autoSync;
                      setAutoSync(next);
                      saveSupabaseConfig({
                        url: url.trim(),
                        anonKey: anonKey.trim(),
                        autoSync: next,
                        lastSyncedAt: lastSynced,
                      });
                      onNotify('info', next ? 'Đã bật tự động đồng bộ' : 'Đã tắt tự động đồng bộ');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      autoSync ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {autoSync ? 'Bật' : 'Tắt'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KHO TÀI LIỆU & GIÁO ÁN (STORAGE) */}
          {activeTab === 'storage' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Form Upload Document to Supabase Storage */}
              <form onSubmit={handleUploadDocument} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-emerald-600" />
                    Tải tài liệu mới lên Supabase Storage
                  </h4>
                  <span className="text-[11px] text-emerald-700 bg-emerald-100 font-semibold px-2 py-0.5 rounded-md">
                    Bucket: {SUPABASE_STORAGE_BUCKET}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tiêu đề tài liệu / Tên bài giảng: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="Ví dụ: Giáo án Tiếng Việt Tuần 1 - Nghĩa của từ ngữ"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* File input */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Chọn tệp đính kèm (Word .docx, PDF, PowerPoint, Excel, Hình ảnh...): <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setSelectedFile(f);
                            if (!docTitle) setDocTitle(f.name.replace(/\.[^/.]+$/, ''));
                          }
                        }}
                        className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                      />
                      {selectedFile && (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                          {formatFileSize(selectedFile.size)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Danh mục tài liệu:</label>
                    <select
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value as DocumentCategory)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800"
                    >
                      <option value="Giáo án">Giáo án giảng dạy</option>
                      <option value="Đề kiểm tra">Đề kiểm tra / Đề thi</option>
                      <option value="Phiếu học tập">Phiếu học tập / Bài tập</option>
                      <option value="Tài liệu đọc thêm">Tài liệu đọc thêm / Tham khảo</option>
                      <option value="Khác">Tài liệu khác</option>
                    </select>
                  </div>

                  {/* Class Link */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Gán cho Lớp học (tùy chọn):</label>
                    <select
                      value={docClassId}
                      onChange={(e) => setDocClassId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800"
                    >
                      <option value="">-- Dành cho tất cả các lớp --</option>
                      {data.classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          Lớp {c.name} ({c.academicYear})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Lesson Link */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Gán cho Bài học (tùy chọn):</label>
                    <select
                      value={docLessonId}
                      onChange={(e) => setDocLessonId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800"
                    >
                      <option value="">-- Không gán bài học cụ thể --</option>
                      {data.lessons.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú thêm:</label>
                    <input
                      type="text"
                      value={docNote}
                      onChange={(e) => setDocNote(e.target.value)}
                      placeholder="Ghi chú về tài liệu..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800"
                    />
                  </div>
                </div>

                {uploadError && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                    {uploadError}
                  </p>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isUploadingDoc}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50"
                  >
                    {isUploadingDoc ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang tải lên Supabase Storage...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Tải tệp lên Supabase ngay</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Documents List & Filters */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="text-sm font-bold text-slate-900">
                    Danh sách tài liệu đã lưu trên Supabase ({documentsList.length})
                  </h4>

                  {/* Filters */}
                  <div className="flex items-center gap-2">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value as any)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-semibold"
                    >
                      <option value="ALL">Tất cả danh mục</option>
                      <option value="Giáo án">Giáo án</option>
                      <option value="Đề kiểm tra">Đề kiểm tra</option>
                      <option value="Phiếu học tập">Phiếu học tập</option>
                      <option value="Tài liệu đọc thêm">Tài liệu đọc thêm</option>
                    </select>

                    <select
                      value={filterClass}
                      onChange={(e) => setFilterClass(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-semibold"
                    >
                      <option value="ALL">Tất cả các lớp</option>
                      {data.classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          Lớp {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {documentsList.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6">
                    <FolderOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">Chưa có tài liệu nào trong danh mục này</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Thầy có thể tải lên tệp giáo án hoặc đề thi ở khung phía trên để lưu trữ trực tuyến.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {documentsList.map((doc) => {
                      const relatedClass = data.classes.find((c) => c.id === doc.classId);
                      const relatedLesson = data.lessons.find((l) => l.id === doc.lessonId);

                      return (
                        <div
                          key={doc.id}
                          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-all shadow-2xs flex flex-col justify-between gap-3"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                {doc.category}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {formatFileSize(doc.fileSize)}
                              </span>
                            </div>

                            <h5 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                              {doc.title}
                            </h5>

                            <p className="text-xs text-slate-500 font-mono truncate" title={doc.fileName}>
                              📁 {doc.fileName}
                            </p>

                            {(relatedClass || relatedLesson) && (
                              <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                                {relatedClass && (
                                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold">
                                    Lớp {relatedClass.name}
                                  </span>
                                )}
                                {relatedLesson && (
                                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md truncate max-w-[200px]" title={relatedLesson.title}>
                                    📖 {relatedLesson.title}
                                  </span>
                                )}
                              </div>
                            )}

                            {doc.note && (
                              <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg italic">
                                {doc.note}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <span className="text-[10px] text-slate-400">
                              {new Date(doc.uploadedAt).toLocaleDateString('vi-VN')}
                            </span>

                            <div className="flex items-center gap-2">
                              {doc.fileUrl && doc.fileUrl !== '#' && (
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                >
                                  <span>Xem / Tải về</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteDoc(doc)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Xóa tài liệu khỏi Supabase"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MÃ SQL SUPABASE */}
          {activeTab === 'sql' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between p-4 bg-slate-100 rounded-2xl border border-slate-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Mã SQL cấu hình cơ sở dữ liệu Supabase</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Tạo bảng <code>teacher_app_data</code>, <code>teacher_documents</code> và Bucket lưu trữ <code>tai-lieu-giao-an</code>.
                  </p>
                </div>
                <button
                  id="copy-supabase-sql-btn"
                  type="button"
                  onClick={handleCopySQL}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shadow-sm active:scale-95"
                >
                  {isCopied ? <FileCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? 'Đã sao chép!' : 'Sao chép mã SQL (1-Click)'}</span>
                </button>
              </div>

              <div className="relative rounded-2xl bg-slate-950 p-4 border border-slate-800 shadow-inner">
                <pre className="text-xs font-mono text-emerald-400 leading-relaxed overflow-x-auto max-h-[350px]">
                  {SUPABASE_SQL_SETUP_SCRIPT}
                </pre>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  Cách thực hiện trên giao diện Supabase:
                </p>
                <p>1. Bấm nút <strong>"Sao chép mã SQL"</strong> ở góc trên.</p>
                <p>2. Mở dự án trên <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="underline font-bold text-blue-700">Supabase Dashboard</a>.</p>
                <p>3. Chọn biểu tượng <strong>SQL Editor</strong> ở thanh menu bên trái.</p>
                <p>4. Bấm <strong>New query</strong>, dán toàn bộ mã vừa sao chép vào rồi bấm nút <strong>RUN</strong> màu xanh lá.</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Dữ liệu được mã hóa an toàn trên hạ tầng đám mây Supabase PostgreSQL.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors shadow-2xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
