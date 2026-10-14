import React, { useRef, useState } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Volume2,
  VolumeX,
  X,
  Database,
  ShieldCheck,
  Cloud,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Code2
} from 'lucide-react';
import { AppData } from '../types';
import { exportAppDataToFile, importAppDataFromFile } from '../services/storage';
import {
  SUPABASE_URL,
  SUPABASE_SQL_SETUP,
  saveAppDataToSupabase,
  loadAppDataFromSupabase,
  checkSupabaseConnection,
} from '../services/supabase';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AppData;
  onUpdateData: (newData: AppData) => void;
  onResetSample: () => void;
  onClearData: () => void;
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, desc?: string) => void;
  currentUsername?: string;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  data,
  onUpdateData,
  onResetSample,
  onClearData,
  onNotify,
  currentUsername = 'thaytin',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'supabase' | 'local'>('supabase');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [showSqlScript, setShowSqlScript] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ success?: boolean; time?: string; msg?: string } | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    exportAppDataToFile(data);
    onNotify('success', 'Đã xuất dữ liệu thành công', 'Tệp tin JSON đã được tải về thiết bị của thầy.');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importAppDataFromFile(file);
      onUpdateData(imported);
      onNotify('success', 'Nhập dữ liệu thành công', `Đã khôi phục ${imported.students.length} học sinh và ${imported.lessons.length} bài học.`);
      onClose();
    } catch (err) {
      onNotify('error', 'Không thể nhập dữ liệu', err instanceof Error ? err.message : 'Tệp tải lên không hợp lệ.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleSound = () => {
    const next = !data.soundEnabled;
    onUpdateData({ ...data, soundEnabled: next });
    onNotify('info', next ? 'Đã bật hiệu ứng âm thanh' : 'Đã tắt hiệu ứng âm thanh', 'Âm thanh thông báo nhẹ khi hoàn thành tác vụ.');
  };

  const handlePushToSupabase = async () => {
    setIsSyncing(true);
    try {
      const res = await saveAppDataToSupabase(data, currentUsername);
      if (res.success) {
        const timeStr = new Date().toLocaleTimeString('vi-VN');
        setLastSyncResult({ success: true, time: timeStr, msg: 'Đã lưu thành công lên Supabase Cloud' });
        onNotify('success', 'Đồng bộ Supabase thành công!', `Dữ liệu ${data.classes.length} lớp và ${data.students.length} học sinh đã được lưu an toàn trên Cloud.`);
      } else {
        setLastSyncResult({ success: false, msg: res.error });
        onNotify('warning', 'Lưu ý kết nối Supabase', res.error || 'Vui lòng kiểm tra đã chạy mã SQL tạo bảng trên Supabase chưa.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối';
      setLastSyncResult({ success: false, msg });
      onNotify('error', 'Lỗi đồng bộ Supabase', msg);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromSupabase = async () => {
    setIsPulling(true);
    try {
      const res = await loadAppDataFromSupabase(currentUsername);
      if (res.error) {
        onNotify('error', 'Không thể tải từ Supabase', res.error);
      } else if (!res.data) {
        onNotify('info', 'Chưa có dữ liệu trên Cloud', 'Tài khoản chưa có dữ liệu lưu trên Supabase. Thầy hãy bấm "Đồng bộ lên Cloud" để tải lên nhé.');
      } else {
        onUpdateData(res.data);
        onNotify('success', 'Đã tải dữ liệu từ Supabase về máy!', `Đã khôi phục ${res.data.classes.length} lớp, ${res.data.students.length} học sinh và ${res.data.lessons.length} bài học.`);
        onClose();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối';
      onNotify('error', 'Lỗi tải từ Supabase', msg);
    } finally {
      setIsPulling(false);
    }
  };

  const handleCheckConnection = async () => {
    setIsChecking(true);
    try {
      const status = await checkSupabaseConnection();
      if (status.connected && status.tableReady) {
        onNotify('success', 'Kết nối Supabase hoàn hảo!', 'Bảng dữ liệu đã sẵn sàng tiếp nhận và đồng bộ trực tiếp.');
      } else if (status.connected && !status.tableReady) {
        setShowSqlScript(true);
        onNotify('warning', 'Đã kết nối Supabase, cần tạo bảng', 'Bảng "teacher_app_data" chưa có. Thầy hãy copy mã SQL bên dưới dán vào Supabase SQL Editor và bấm Run.');
      } else {
        onNotify('error', 'Không thể kết nối Supabase', status.error || 'Vui lòng kiểm tra lại URL hoặc Key.');
      }
    } catch (err) {
      onNotify('error', 'Lỗi kiểm tra', 'Không thể kết nối');
    } finally {
      setIsChecking(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    onNotify('success', 'Đã sao chép mã SQL!', 'Thầy hãy vào trang Supabase -> SQL Editor -> dán vào và bấm Run nhé.');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div
      id="data-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="data-modal-card"
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-slate-50 to-blue-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">Trung Tâm Lưu Trữ & Supabase Cloud</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500">Đồng bộ đám mây PostgreSQL thời gian thực</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-200 bg-slate-50/60 px-6 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('supabase')}
            className={`flex items-center gap-2 pb-2.5 px-3 font-semibold text-xs border-b-2 transition-all ${
              activeTab === 'supabase'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cloud className="w-4 h-4" />
            Lưu trữ Đám mây Supabase
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('local')}
            className={`flex items-center gap-2 pb-2.5 px-3 font-semibold text-xs border-b-2 transition-all ${
              activeTab === 'local'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            Sao lưu Tệp (.JSON) & Cài đặt
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {activeTab === 'supabase' && (
            <div className="space-y-4">
              {/* Supabase info card */}
              <div className="p-4 bg-linear-to-br from-emerald-50/90 to-teal-50/50 border border-emerald-200/80 rounded-2xl shadow-2xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-emerald-950">Supabase Project Kết Nối</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-800 font-semibold">
                        PostgreSQL
                      </span>
                    </div>
                    <p className="text-xs font-mono text-emerald-800 break-all select-all">
                      {SUPABASE_URL}
                    </p>
                    <p className="text-[11px] text-emerald-700/80">
                      Tài khoản đồng bộ: <strong className="text-emerald-900 font-semibold">{currentUsername}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckConnection}
                    disabled={isChecking}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold shadow-2xs transition-all shrink-0 active:scale-95"
                    title="Kiểm tra kết nối và bảng"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-emerald-600' : ''}`} />
                    <span>{isChecking ? 'Kiểm tra...' : 'Kiểm tra'}</span>
                  </button>
                </div>

                {lastSyncResult && (
                  <div className={`mt-3 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                    lastSyncResult.success ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-300' : 'bg-amber-100/90 text-amber-900 border border-amber-300'
                  }`}>
                    {lastSyncResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />}
                    <span className="truncate">{lastSyncResult.msg} {lastSyncResult.time ? `(${lastSyncResult.time})` : ''}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons for Supabase */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Push to cloud */}
                <button
                  type="button"
                  onClick={handlePushToSupabase}
                  disabled={isSyncing}
                  className="flex flex-col items-start p-4 rounded-xl border border-emerald-300 bg-linear-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md shadow-emerald-500/20 text-left transition-all group disabled:opacity-70 active:scale-98"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <CloudUpload className="w-5 h-5 text-white" />
                    <span className="text-[11px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                      {isSyncing ? 'Đang đẩy...' : 'Đẩy lên'}
                    </span>
                  </div>
                  <span className="font-bold text-sm">Đồng bộ LÊN Supabase</span>
                  <p className="text-xs text-emerald-100 mt-1 leading-snug">
                    Lưu toàn bộ {data.classes.length} lớp, {data.students.length} học sinh & điểm số lên Cloud
                  </p>
                </button>

                {/* Pull from cloud */}
                <button
                  type="button"
                  onClick={handlePullFromSupabase}
                  disabled={isPulling}
                  className="flex flex-col items-start p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-2xs text-left transition-all group disabled:opacity-70 active:scale-98"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <CloudDownload className="w-5 h-5 text-blue-600" />
                    <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {isPulling ? 'Đang tải...' : 'Tải về'}
                    </span>
                  </div>
                  <span className="font-bold text-sm text-slate-900">Tải VỀ từ Supabase</span>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">
                    Khôi phục bản dữ liệu đám mây mới nhất vào ứng dụng này
                  </p>
                </button>
              </div>

              {/* SQL Setup Helper Accordion */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowSqlScript(!showSqlScript)}
                  className="w-full flex items-center justify-between p-3.5 text-left font-semibold text-xs text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-indigo-600" />
                    <span>Mã SQL khởi tạo bảng Supabase (Nếu bảng chưa tạo)</span>
                  </div>
                  <span className="text-blue-600 font-bold">{showSqlScript ? 'Thu gọn ▲' : 'Xem mã SQL ▼'}</span>
                </button>

                {showSqlScript && (
                  <div className="p-4 border-t border-slate-200 bg-white space-y-3 animate-in fade-in">
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-950 space-y-1">
                      <p className="font-bold">Hướng dẫn 3 bước nhanh trên Supabase:</p>
                      <ol className="list-decimal list-inside space-y-0.5 text-indigo-900">
                        <li>Truy cập <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="underline font-semibold inline-flex items-center gap-0.5">Supabase Dashboard <ExternalLink className="w-3 h-3" /></a></li>
                        <li>Nhấp vào biểu tượng <strong>SQL Editor</strong> ở thanh menu bên trái $\rightarrow$ chọn <strong>New query</strong></li>
                        <li>Dán đoạn mã bên dưới vào và bấm nút <strong>RUN</strong> màu xanh lá cây</li>
                      </ol>
                    </div>

                    <div className="relative">
                      <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48 leading-relaxed">
                        {SUPABASE_SQL_SETUP}
                      </pre>
                      <button
                        type="button"
                        onClick={handleCopySql}
                        className="absolute top-2 right-2 flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md transition-all active:scale-95"
                      >
                        {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSql ? 'Đã chép!' : 'Sao chép mã SQL'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'local' && (
            <div className="space-y-4">
              {/* Info Banner */}
              <div className="flex items-start gap-3 p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 leading-relaxed">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Thầy có thể sao lưu thủ công ra tệp tin <code>.json</code> để lưu trữ thêm trên Google Drive hoặc chuyển sang máy tính khác mà không cần kết nối mạng.
                </p>
              </div>

              {/* Sound Setting */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${data.soundEnabled ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                    {data.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-slate-800">Hiệu ứng âm thanh thao tác</span>
                    <p className="text-xs text-slate-500">Chuông nhẹ khi lưu hoặc xóa thành công</p>
                  </div>
                </div>
                <button
                  id="toggle-sound-btn"
                  type="button"
                  onClick={toggleSound}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    data.soundEnabled
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {data.soundEnabled ? 'Đang Bật' : 'Đang Tắt'}
                </button>
              </div>

              {/* Actions Grid */}
              <div className="space-y-2.5">
                {/* Export */}
                <button
                  id="export-data-btn"
                  type="button"
                  onClick={handleExport}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 group-hover:scale-105 transition-transform">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-800">Xuất dữ liệu ra tệp (.JSON)</span>
                      <p className="text-xs text-slate-500">Tải xuống bản sao lưu toàn bộ thông tin về máy</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">Xuất ngay →</span>
                </button>

                {/* Import */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  id="import-data-btn"
                  type="button"
                  onClick={handleImportClick}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-700 group-hover:scale-105 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-800">Nhập dữ liệu từ tệp (.JSON)</span>
                      <p className="text-xs text-slate-500">Khôi phục từ tệp sao lưu đã tải về trước đó</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">Chọn tệp →</span>
                </button>

                {/* Reset Sample */}
                <button
                  id="reset-sample-btn"
                  type="button"
                  onClick={onResetSample}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-700 group-hover:scale-105 transition-transform">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-800">Khôi phục dữ liệu mẫu ban đầu</span>
                      <p className="text-xs text-slate-500">Tải lại danh sách 4 lớp (6A1, 7A1, 8A1, 9A1) và bài học mẫu</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-amber-700 group-hover:translate-x-0.5 transition-transform">Khôi phục →</span>
                </button>

                {/* Clear All */}
                <button
                  id="clear-all-data-btn"
                  type="button"
                  onClick={onClearData}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-rose-200/80 hover:bg-rose-50 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-100 text-rose-700 group-hover:scale-105 transition-transform">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-rose-900">Xóa trắng toàn bộ dữ liệu</span>
                      <p className="text-xs text-rose-600/90">Xóa trắng tất cả để thầy tự nhập danh sách lớp từ đầu</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-rose-600 group-hover:translate-x-0.5 transition-transform">Xóa trắng →</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Dữ liệu được mã hóa an toàn trên Supabase PostgreSQL
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
