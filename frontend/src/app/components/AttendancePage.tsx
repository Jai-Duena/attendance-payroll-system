import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Clock,
  RefreshCw,
  Upload,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Filter,
  Eye,
  Paperclip,
  Trash2,
  Flag,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  CheckSquare,
  Square,
  LogIn,
  LogOut,
  Download,
  History,
} from 'lucide-react';
import {
  attendanceApi,
  attendanceOptions,
  departmentsApi,
  type AttendanceTable,
  type PayrollPeriodOption,
  AttendanceRecord,
  AttendanceSummaryRow,
  AttendancePunch,
  type AttendanceFlag,
  type PunchOption,
  type ShiftPreset,
  type AttendanceAuditEntry,
} from '@/lib/api';
import { UserRole } from '../App';
import { TableSkeleton } from './Skeleton';
import TimeSelect from './TimeSelect';
import ExportModal from './ExportModal';

interface AttendancePageProps {
  userRole: UserRole;
  userId?: number;
  userDept?: string;
  isReadOnly?: boolean;
}

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) ?? '';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

function fmt(val: string | null | undefined, type: 'datetime' | 'date' | 'time' = 'datetime') {
  if (!val) return '--';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  if (type === 'date') return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
  if (type === 'time') return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true });
}

function Pill({ label, color }: { label: string; color: 'green' | 'yellow' | 'gray' }) {
  const cls = {
    green:  'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    gray:   'bg-gray-100 text-gray-600',
  }[color];
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
}

const AUDIT_FIELD_LABELS: Record<string, string> = {
  date:                  'Date',
  time_in:               'Time In',
  time_out:              'Time Out',
  shift_time_in:         'Shift Time In',
  shift_time_out:        'Shift Time Out',
  adj_date:              'Adjusted Date',
  adj_time_in:           'Adjusted Time In',
  adj_time_out:          'Adjusted Time Out',
  adj_shift_time_in:     'Adjusted Shift Time In',
  adj_shift_time_out:    'Adjusted Shift Time Out',
  total_hrs:             'Total Hours',
  late_mins:             'Late (Minutes)',
  ot_hrs:                'Overtime Hours',
  nd_hrs:                'Night Diff Hours',
  leave_days:            'Leave Days',
  emp_dept:              'Department',
  emp_fullname:          'Employee Name',
  reg_hrs:               'Regular Hours',
  payroll_start:         'Payroll Start',
  payroll_end:           'Payroll End',
};

function auditFieldLabel(field: string | null | undefined): string {
  if (!field) return 'None';
  return AUDIT_FIELD_LABELS[field] ?? field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AttendancePage({ userRole, userId, userDept, isReadOnly = false }: AttendancePageProps) {
  const isEmployee = userRole === 'employee';
  const isSupervisorRole = userRole === 'supervisor';
  const isAdmin = !isEmployee && !isSupervisorRole;
  const canWrite = isAdmin && !isReadOnly;
  const canDeleteAttendance = userRole === 'admin' && !isReadOnly;

  const [activeTab, setActiveTab] = useState<AttendanceTable>('attendance');
  const [rows, setRows]           = useState<any[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit]         = useState<25 | 50 | 100>(25);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // Departments for dropdown
  const [departments, setDepartments] = useState<string[]>([]);
  // Summary dropdown options
  const [batchIdOptions,      setBatchIdOptions]      = useState<number[]>([]);
  const [payrollPeriodOptions, setPayrollPeriodOptions] = useState<PayrollPeriodOption[]>([]);

  // ── Live filter inputs (do NOT trigger fetch directly) ──
  const [filterName,          setFilterName]          = useState('');
  const [filterDept,          setFilterDept]          = useState('');
  const [filterDate,          setFilterDate]          = useState('');
  const [filterMonth,         setFilterMonth]         = useState('');
  const [filterYear,          setFilterYear]          = useState(String(CURRENT_YEAR));
  const [filterBatchId,       setFilterBatchId]       = useState('');
  const [filterPayrollPeriod, setFilterPayrollPeriod] = useState('');

  // ── Applied filters (only updated on Apply / Clear / tab change) ──
  const [applied, setApplied] = useState({
    name: '', dept: '', date: '', month: '', year: String(CURRENT_YEAR),
    batchId: '', payrollPeriod: '',
  });

  // Load departments once
  useEffect(() => {
    departmentsApi.list().then(setDepartments).catch(() => {});
  }, []);

  // Load summary dropdown options whenever summary tab is active
  useEffect(() => {
    if (activeTab !== 'summary') return;
    attendanceOptions.batchIds().then(setBatchIdOptions).catch(() => {});
    attendanceOptions.payrollPeriods().then(setPayrollPeriodOptions).catch(() => {});
  }, [activeTab]);

  // Sync state
  const [syncing,      setSyncing]      = useState(false);
  const [syncResult,   setSyncResult]   = useState<{ ok: boolean; msg: string } | null>(null);

  // Upload state
  const [uploadOpen,   setUploadOpen]   = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [uploadResult, setUploadResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [uploadFile,   setUploadFile]   = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flags state (admin/supervisor)
  const [pendingFlagsCount, setPendingFlagsCount] = useState(0);
  const [showFlagsReview,   setShowFlagsReview]   = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false); // kept for legacy compat
  const [showExportModal, setShowExportModal] = useState(false);

  // Audit log state
  const [showAuditLog,    setShowAuditLog]    = useState(false);
  const [auditRows,       setAuditRows]       = useState<AttendanceAuditEntry[]>([]);
  const [auditTotal,      setAuditTotal]      = useState(0);
  const [auditPage,       setAuditPage]       = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditLoading,    setAuditLoading]    = useState(false);
  const [auditEmpFilter,  setAuditEmpFilter]  = useState('');
  const [auditDateFrom,   setAuditDateFrom]   = useState('');
  const [auditDateTo,     setAuditDateTo]     = useState('');
  const [auditAction,     setAuditAction]     = useState<'' | 'edit' | 'delete'>('');

  useEffect(() => {
    if (isEmployee) return;
    attendanceApi.pendingFlagsCount()
      .then((r) => setPendingFlagsCount(r.count))
      .catch(() => {});
  }, [isEmployee]);

  const refreshFlagsCount = () => {
    if (!isEmployee) {
      attendanceApi.pendingFlagsCount()
        .then((r) => setPendingFlagsCount(r.count))
        .catch(() => {});
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    const filters = {
      table: activeTab,
      page,
      limit,
      // When in employee mode (including supervisor toggled to employee view), scope to own user
      ...(isEmployee && userId ? { employee_id: String(userId) } : {
        ...(applied.name && { name: applied.name }),
        ...(applied.dept && { dept: applied.dept }),
      }),
      ...(applied.date          && { date:           applied.date }),
      ...(applied.month         && { month:          applied.month }),
      ...(applied.year          && { year:           applied.year }),
      ...(applied.batchId       && { batch_id:       applied.batchId }),
      ...(applied.payrollPeriod && { payroll_period: applied.payrollPeriod }),
    };

    try {
      const res = await attendanceApi.list(filters);
      setRows(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, limit, applied]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset to page 1 when tab or filters change (except pagination)
  const changeTab = (tab: AttendanceTable) => {
    setActiveTab(tab);
    setPage(1);
    setRows([]);
    setFilterDate(''); setFilterMonth(''); setFilterYear(String(CURRENT_YEAR));
    setFilterBatchId(''); setFilterPayrollPeriod('');
    setApplied((prev) => ({
      ...prev,
      date: '', month: '', year: String(CURRENT_YEAR),
      batchId: '', payrollPeriod: '',
    }));
  };

  const applyFilters = () => {
    setPage(1);
    setApplied({
      name: filterName, dept: filterDept, date: filterDate,
      month: filterMonth, year: filterYear,
      batchId: filterBatchId, payrollPeriod: filterPayrollPeriod,
    });
  };

  const clearFilters = () => {
    const blank = { name: '', dept: '', date: '', month: '', year: String(CURRENT_YEAR), batchId: '', payrollPeriod: '' };
    setFilterName(''); setFilterDept(''); setFilterDate('');
    setFilterMonth(''); setFilterYear(String(CURRENT_YEAR));
    setFilterBatchId(''); setFilterPayrollPeriod('');
    setPage(1);
    setApplied(blank);
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await attendanceApi.sync();
      setSyncResult({ ok: true, msg: res.message });
      fetchData();
      // Fire-and-forget tardiness check after a successful sync
      attendanceApi.checkTardiness().catch(() => {});
    } catch (e: any) {
      setSyncResult({ ok: false, msg: e.message ?? 'Sync failed' });
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: Parameters<typeof attendanceApi.exportCsv>[0] = {
        type: activeTab === 'summary' ? 'summary' : 'attendance',
        ...(applied.dept           && { dept:      applied.dept }),
        ...(applied.month          && { month:     applied.month }),
        ...(applied.year           && activeTab !== 'summary' && { date_from: `${applied.year}-01-01`, date_to: `${applied.year}-12-31` }),
        ...(applied.date           && { date_from: applied.date, date_to: applied.date }),
        ...(applied.payrollPeriod  && (() => {
          const parts = applied.payrollPeriod.split('|');
          return parts.length === 2 ? { date_from: parts[0], date_to: parts[1] } : {};
        })()),
      };
      if (applied.year && activeTab === 'summary') params.year = Number(applied.year);
      await attendanceApi.exportCsv(params);
    } catch (e: any) {
      alert(e.message ?? 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const fetchAuditLog = useCallback(async (pg = auditPage) => {
    setAuditLoading(true);
    try {
      const params: Parameters<typeof attendanceApi.getAuditLog>[0] = {
        page: pg,
        limit: 20,
        // employee view → force own data; supervisor view → dept; admin → all
        ...(isEmployee && userId ? { employee_id: userId } : {}),
        ...(isSupervisorRole && userDept ? { dept: userDept } : {}),
        ...(isAdmin && auditEmpFilter && !isNaN(Number(auditEmpFilter)) ? { employee_id: Number(auditEmpFilter) } : {}),
        ...(auditDateFrom  && { date_from: auditDateFrom }),
        ...(auditDateTo    && { date_to:   auditDateTo }),
        ...(auditAction    && { action:    auditAction }),
      };
      const res = await attendanceApi.getAuditLog(params);
      setAuditRows(res.data);
      setAuditTotal(res.total);
      setAuditTotalPages(res.totalPages);
      setAuditPage(pg);
    } catch (e: any) {
      // silent -- audit is non-critical
    } finally {
      setAuditLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditEmpFilter, auditDateFrom, auditDateTo, auditAction, isEmployee, isSupervisorRole, isAdmin, userId, userDept]);

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const res = await attendanceApi.upload(uploadFile);
      setUploadResult({ ok: true, msg: res.message });
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e: any) {
      setUploadResult({ ok: false, msg: e.message ?? 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const tabs: { key: AttendanceTable; label: string }[] = [
    { key: 'attendance', label: 'Employee Attendance' },
    { key: 'summary',    label: 'Attendance Summary'  },
    { key: 'punches',    label: 'Raw Punches'         },
  ];

  return (
    <div className="space-y-4 md:space-y-6">

      {/* ── Page Header ── */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 text-white p-3 rounded-xl">
              <Clock size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">Attendance</h1>
              <p className="text-sm text-gray-500">
                {isAdmin ? 'View and manage employee time records' : 'Your attendance records'}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
              {canWrite && (
                <>
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    {syncing ? 'Syncing...' : 'Sync Attendance'}
                  </button>
                  <button
                    onClick={() => { setUploadOpen(true); setUploadResult(null); }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Upload size={16} />
                    Upload DTR
                  </button>
                </>
              )}
              {canWrite && (
              <div className="relative">
                <button
                  onClick={() => setShowFlagsReview(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Flag size={16} />
                  Corrections
                </button>
                {pendingFlagsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingFlagsCount > 9 ? '9+' : pendingFlagsCount}
                  </span>
                )}
              </div>
              )}
              {!isEmployee && (
                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Download size={16} />
                  Export CSV
                </button>
              )}
              <button
                onClick={() => { setShowAuditLog(true); fetchAuditLog(1); }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <History size={16} />
                Audit Log
              </button>
            </div>
        </div>

        {/* Sync result banner */}
        {syncResult && (
          <div className={`mt-3 flex items-center gap-2 p-3 rounded-lg text-sm ${
            syncResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {syncResult.ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {syncResult.msg}
            <button onClick={() => setSyncResult(null)} className="ml-auto"><X size={14} /></button>
          </div>
        )}
      </div>

      {/* ── Tab Switcher ── */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => changeTab(t.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === t.key
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-3 mb-5 items-end">
          {isAdmin && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">Employee Name</label>
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  placeholder="Search name..."
                  className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-44"
                />
              </div>
            </div>
          )}

          {isAdmin && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">Department</label>
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-44"
              >
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          {(activeTab === 'attendance' || activeTab === 'punches') && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">Specific Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => { setFilterDate(e.target.value); setFilterMonth(''); setFilterYear(''); }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              {filterDate && <p className="mt-1 text-xs text-blue-600">{fmt(filterDate, 'date')}</p>}
            </div>
          )}

          {/* Summary-only: Batch ID + Payroll Period dropdowns */}
          {activeTab === 'summary' && (
            <>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Batch ID</label>
                <select
                  value={filterBatchId}
                  onChange={(e) => setFilterBatchId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-36"
                >
                  <option value="">All batches</option>
                  {batchIdOptions.map((b) => (
                    <option key={b} value={String(b)}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Payroll Period</label>
                <select
                  value={filterPayrollPeriod}
                  onChange={(e) => setFilterPayrollPeriod(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-52"
                >
                  <option value="">All periods</option>
                  {payrollPeriodOptions.map((p) => {
                    const val = `${p.payroll_start}|${p.payroll_end}`;
                    return (
                      <option key={val} value={val}>
                        {fmt(p.payroll_start, 'date')} - {fmt(p.payroll_end, 'date')}
                      </option>
                    );
                  })}
                </select>
              </div>
            </>
          )}

          {!filterDate && (
            <>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Month</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="">All months</option>
                  {MONTHS.map((m, i) => (
                    <option key={m} value={String(i + 1)}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Year</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="">All years</option>
                  {YEARS.map((y) => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="flex gap-2">
            <button
              onClick={applyFilters}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              <Filter size={14} /> Apply
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-medium"
            >
              Clear
            </button>
          </div>

          {/* Rows per page */}
          <div className="ml-auto flex items-end gap-2">
            <label className="text-xs text-gray-500 block mb-1">Rows</label>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value) as 25 | 50 | 100); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* ── Table ── */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm mb-4">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          {loading ? (
            <TableSkeleton
              rows={Math.min(limit, 8)}
              cols={activeTab === 'attendance' ? (isAdmin ? 9 : 7) : activeTab === 'summary' ? 8 : 6}
            />
          ) : rows.length === 0 ? (
            <div className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-3">
                <Clock size={26} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No records found</p>
              <p className="text-sm text-gray-400 mt-1">
                {activeTab === 'attendance' && 'No attendance records match the current filters.'}
                {activeTab === 'summary' && 'No attendance summary records are available yet.'}
                {activeTab === 'punches' && 'No raw punch records match the current filters.'}
              </p>
            </div>
          ) : activeTab === 'attendance' ? (
              <AttendanceRecordsTable rows={rows as AttendanceRecord[]} isAdmin={isAdmin} canDelete={canDeleteAttendance} userId={userId} onRefresh={() => { fetchData(); refreshFlagsCount(); }} />
          ) : activeTab === 'summary' ? (
            <SummaryTable rows={rows as AttendanceSummaryRow[]} isAdmin={isAdmin} />
          ) : (
            <PunchesTable rows={rows as AttendancePunch[]} isAdmin={isAdmin} userRole={userRole} onRefresh={fetchData} />
          )}
        </div>

        {/* ── Pagination ── */}
        {!loading && rows.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
            <p className="text-sm text-gray-500">
              Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} of {total.toLocaleString()} records
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft size={16} />
              </button>
              {/* Page number pills */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = page;
                if (totalPages <= 5) p = 1;
                else if (page <= 3) p = 1;
                else if (page >= totalPages - 2) p = totalPages - 4;
                else p = page - 2;
                const pg = p + i;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium ${
                      pg === page
                        ? 'bg-blue-500 text-white'
                        : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Upload DTR Modal ── */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { if (!uploading) setUploadOpen(false); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-bold text-lg text-gray-800">Upload DTR File</h3>
              {!uploading && (
                <button onClick={() => setUploadOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                  <X size={18} />
                </button>
              )}
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600">
                Upload a <strong>.txt</strong> or <strong>.dat</strong> file. Each line must follow the format:
              </p>
              <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 font-mono">employee_id&nbsp;&nbsp;&nbsp;&nbsp;YYYY-MM-DD HH:MM:SS</pre>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select file</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.dat"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-gray-600
                    file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                    file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              {uploadResult && (
                <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                  uploadResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {uploadResult.ok ? <CheckCircle size={16} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />}
                  <span>{uploadResult.msg}</span>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile || uploading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  onClick={() => { setUploadOpen(false); setUploadResult(null); setUploadFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  disabled={uploading}
                  className="px-4 py-2.5 border border-gray-300 hover:bg-gray-50 disabled:opacity-40 text-gray-600 rounded-lg text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Flags Review Modal ── */}
      {showFlagsReview && (
        <FlagsReviewModal
          onClose={() => { setShowFlagsReview(false); refreshFlagsCount(); }}
          onUpdate={() => { refreshFlagsCount(); fetchData(); }}
          userRole={userRole}
        />
      )}

      {/* ── Export Modal ── */}
      {showExportModal && (
        <ExportModal
          initialTab={activeTab === 'punches' ? 'punches' : activeTab === 'summary' ? 'summary' : 'attendance'}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* ── Attendance Audit Log Modal ── */}
      {showAuditLog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <History size={20} className="text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-800">Attendance Audit Log</h2>
                <span className="text-sm text-gray-500">({auditTotal} record{auditTotal !== 1 ? 's' : ''})</span>
              </div>
              <button onClick={() => setShowAuditLog(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Filters -- employee view only sees date/action filters (no emp filter) */}
            <div className="px-6 py-3 border-b bg-gray-50 flex flex-wrap gap-3 items-end">
              {isAdmin && (
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Employee ID</label>
                  <input type="number" value={auditEmpFilter} onChange={e => setAuditEmpFilter(e.target.value)}
                    placeholder="Any" className="border rounded-lg px-3 py-1.5 text-sm w-28" />
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Date From</label>
                <input type="date" value={auditDateFrom} onChange={e => setAuditDateFrom(e.target.value)}
                  className="border rounded-lg px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Date To</label>
                <input type="date" value={auditDateTo} onChange={e => setAuditDateTo(e.target.value)}
                  className="border rounded-lg px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Action</label>
                <select value={auditAction} onChange={e => setAuditAction(e.target.value as '' | 'edit' | 'delete')}
                  className="border rounded-lg px-3 py-1.5 text-sm">
                  <option value="">All</option>
                  <option value="edit">Edit</option>
                  <option value="delete">Delete</option>
                </select>
              </div>
              <button
                onClick={() => fetchAuditLog(1)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
              >
                <Search size={14} />
                Search
              </button>
              <button
                onClick={() => {
                  setAuditDateFrom(''); setAuditDateTo(''); setAuditAction(''); setAuditEmpFilter('');
                  setTimeout(() => fetchAuditLog(1), 0);
                }}
                className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Clear
              </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              {auditLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <Loader2 size={24} className="animate-spin mr-2" />
                  Loading...
                </div>
              ) : auditRows.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No audit records found.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Employee</th>
                      <th className="px-4 py-3 text-left">Action</th>
                      <th className="px-4 py-3 text-left">Field</th>
                      <th className="px-4 py-3 text-left">Old Value</th>
                      <th className="px-4 py-3 text-left">New Value</th>
                      <th className="px-4 py-3 text-left">Changed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {auditRows.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 whitespace-nowrap text-gray-600">{fmt(r.changed_at)}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap font-medium">{r.emp_fullname}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            r.action === 'delete'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {r.action}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">{auditFieldLabel(r.field_changed)}</td>
                        <td className="px-4 py-2.5 text-gray-500">{r.old_value ?? 'None'}</td>
                        <td className="px-4 py-2.5 text-gray-700">{r.new_value ?? 'None'}</td>
                        <td className="px-4 py-2.5 text-gray-500">{r.changed_by_name ?? 'None'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {auditTotalPages > 1 && (
              <div className="px-6 py-3 border-t flex items-center justify-between text-sm text-gray-600">
                <span>{auditTotal} total</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={auditPage <= 1 || auditLoading}
                    onClick={() => fetchAuditLog(auditPage - 1)}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span>Page {auditPage} of {auditTotalPages}</span>
                  <button
                    disabled={auditPage >= auditTotalPages || auditLoading}
                    onClick={() => fetchAuditLog(auditPage + 1)}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-tables ───────────────────────────────────────────────

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">
      {children}
    </th>
  );
}

function Td({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <td className={`px-4 py-3 text-sm text-gray-700 whitespace-nowrap ${center ? 'text-center' : ''}`}>
      {children}
    </td>
  );
}

function AttendanceRecordsTable({
  rows,
  isAdmin,
  canDelete = false,
  userId,
  onRefresh,
}: {
  rows: AttendanceRecord[];
  isAdmin: boolean;
  canDelete?: boolean;
  userId?: number;
  onRefresh: () => void;
}) {
  // ── Delete confirm state ──────────────────────────────────────────────────
  const [delConfirm, setDelConfirm]   = useState<AttendanceRecord | null>(null);
  const [deleting, setDeleting]       = useState(false);

  const handleDelete = async () => {
    if (!delConfirm) return;
    setDeleting(true);
    try {
      await attendanceApi.deleteRecord(delConfirm.uniq_id);
      setDelConfirm(null);
      onRefresh();
    } catch (e: any) {
      alert(e.message ?? 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  // Effective display value (adj overrides base)
  const effDate   = (r: AttendanceRecord) => r.adj_date           ?? r.date;
  const effTimeIn = (r: AttendanceRecord) => r.adj_time_in        ?? r.time_in;
  const effTmOut  = (r: AttendanceRecord) => r.adj_time_out       ?? r.time_out;
  const effSftIn  = (r: AttendanceRecord) => r.adj_shift_time_in  ?? r.shift_time_in;
  const effSftOut = (r: AttendanceRecord) => r.adj_shift_time_out ?? r.shift_time_out;

  return (
    <>
      {/* ── Mobile card list (< md) ── */}
      <div className="md:hidden divide-y divide-gray-100">
        {rows.map((r) => (
          <div key={r.uniq_id} className="px-4 py-3 hover:bg-blue-50/40 transition-colors">
            {isAdmin && (
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-800">{r.emp_fullname}</span>
                <span className="text-xs text-gray-500">{r.emp_dept ?? '--'}</span>
              </div>
            )}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-700">{fmt(effDate(r), 'date')}</span>
              {r.adj_date && <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1">ADJ</span>}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-600">
              <div><span className="text-gray-400">In: </span>{effTimeIn(r) ? fmt(effTimeIn(r), 'time') : <span className="text-red-400">No punch</span>}</div>
              <div><span className="text-gray-400">Out: </span>{effTmOut(r) ? fmt(effTmOut(r), 'time') : <span className="text-red-400">No punch</span>}</div>
              <div><span className="text-gray-400">Shift In: </span>{fmt(effSftIn(r), 'time')}</div>
              <div><span className="text-gray-400">Shift Out: </span>{fmt(effSftOut(r), 'time')}</div>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className={`text-xs font-semibold ${Number(r.total_hrs) > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                {Number(r.total_hrs).toFixed(2)} hrs
              </span>
              {isAdmin && canDelete && (
                <button onClick={() => setDelConfirm(r)} title="Delete"
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop table (≥ md) ── */}
      <table className="hidden md:table min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            {isAdmin && <><Th>Employee</Th><Th>Department</Th></>}
            <Th>Date</Th>
            <Th>Time In</Th>
            <Th>Time Out</Th>
            <Th>Shift In</Th>
            <Th>Shift Out</Th>
            <Th>Total Hrs</Th>
            {isAdmin && <Th>Action</Th>}          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((r) => (
            <tr key={r.uniq_id} className="hover:bg-blue-50/40 transition-colors">
              {isAdmin && (
                <>
                  <Td><span className="font-medium text-gray-800">{r.emp_fullname}</span></Td>
                  <Td>{r.emp_dept ?? '--'}</Td>
                </>
              )}
              <Td><AdjCell isAdj={!!r.adj_date}>{fmt(effDate(r), 'date')}</AdjCell></Td>
              <Td>
                <AdjCell isAdj={!!r.adj_time_in}>
                  {effTimeIn(r) ? fmt(effTimeIn(r), 'time') : <span className="text-red-400">No punch</span>}
                </AdjCell>
              </Td>
              <Td>
                <AdjCell isAdj={!!r.adj_time_out}>
                  {effTmOut(r) ? fmt(effTmOut(r), 'time') : <span className="text-red-400">No punch</span>}
                </AdjCell>
              </Td>
              <Td><AdjCell isAdj={!!r.adj_shift_time_in}>{fmt(effSftIn(r), 'time')}</AdjCell></Td>
              <Td><AdjCell isAdj={!!r.adj_shift_time_out}>{fmt(effSftOut(r), 'time')}</AdjCell></Td>
              <Td center>
                <span className={`font-semibold ${Number(r.total_hrs) > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                  {Number(r.total_hrs).toFixed(2)}
                </span>
              </Td>
              {isAdmin && (
                <Td center>
                  <div className="flex items-center justify-center gap-1.5">
                    {canDelete && (
                      <button
                        onClick={() => setDelConfirm(r)}
                        title="Delete"
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </Td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Delete Confirm Modal ───────────────────────────────────────────── */}      {delConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { if (!deleting) setDelConfirm(null); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2.5 rounded-full">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Delete Record</h3>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Delete attendance record for <strong>{delConfirm.emp_fullname}</strong> on{' '}
              <strong>{fmt(delConfirm.date, 'date')}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg text-sm font-medium"
              >
                {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setDelConfirm(null)}
                disabled={deleting}
                className="px-4 py-2.5 border border-gray-300 hover:bg-gray-50 disabled:opacity-40 text-gray-600 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Visual indicator for adjusted values
function AdjCell({ children, isAdj }: { children: React.ReactNode; isAdj: boolean }) {
  if (!isAdj) return <>{children}</>;
  return (
    <span className="flex items-center gap-1">
      {children}
      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1 leading-tight">ADJ</span>
    </span>
  );
}

// Extract "HH:MM" from a datetime string for <input type="time">
function toTimeStr(val: string | null | undefined): string {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function ThHide({ children, hide }: { children: React.ReactNode; hide?: boolean }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50 ${hide ? 'hidden md:table-cell' : ''}`}>
      {children}
    </th>
  );
}

function TdHide({ children, center, hide }: { children: React.ReactNode; center?: boolean; hide?: boolean }) {
  return (
    <td className={`px-4 py-3 text-sm text-gray-700 whitespace-nowrap ${center ? 'text-center' : ''} ${hide ? 'hidden md:table-cell' : ''}`}>
      {children}
    </td>
  );
}

function SummaryTable({ rows, isAdmin }: { rows: AttendanceSummaryRow[]; isAdmin: boolean }) {
  const [detailRow, setDetailRow] = useState<AttendanceSummaryRow | null>(null);

  return (
    <>
    {/* ── Mobile card list (< md) ── */}
    <div className="md:hidden divide-y divide-gray-100">
      {rows.map((r) => {
        const regHrs     = r.adj_reg_hrs   != null ? Number(r.adj_reg_hrs)   : Number(r.reg_hrs);
        const otHrs      = r.adj_ot_hrs    != null ? Number(r.adj_ot_hrs)    : Number(r.ot_hrs);
        const ndHrs      = r.adj_nd_hrs    != null ? Number(r.adj_nd_hrs)    : Number(r.nd_hrs);
        const regHolHrs  = r.adj_reg_holiday_hrs  != null ? Number(r.adj_reg_holiday_hrs)  : Number(r.reg_holiday_hrs);
        const specHolHrs = r.adj_spec_holiday_hrs != null ? Number(r.adj_spec_holiday_hrs) : Number(r.spec_holiday_hrs);
        const rdHrs      = r.adj_rd_hrs    != null ? Number(r.adj_rd_hrs)    : Number(r.rd_hrs);
        const lateMins   = r.adj_late_mins != null ? Number(r.adj_late_mins) : Number(r.late_mins);
        const leaveDays  = r.adj_leave_days != null ? Number(r.adj_leave_days) : Number(r.leave_days);
        const hasAdj = r.adj_reg_hrs != null || r.adj_ot_hrs != null || r.adj_nd_hrs != null;
        return (
          <div key={r.id} className={`px-4 py-3 ${hasAdj ? 'bg-amber-50/30' : 'hover:bg-blue-50/40'} transition-colors`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                  Batch {r.batch_id ?? '--'}
                </span>
                {hasAdj && <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1">ADJ</span>}
              </div>
              <button
                onClick={() => setDetailRow(r)}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Eye size={12} /> See More
              </button>
            </div>
            {isAdmin && (
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-800">{r.emp_fullname}</span>
                <span className="text-xs text-gray-500">{r.emp_dept ?? '--'}</span>
              </div>
            )}
            <p className="text-xs text-gray-500 mb-2">
              {fmt(r.payroll_start, 'date')} – {fmt(r.payroll_end, 'date')}
            </p>
            <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-xs">
              <div><span className="text-gray-400">Reg: </span><span className={r.adj_reg_hrs != null ? 'text-amber-700 font-medium' : 'text-gray-700'}>{regHrs.toFixed(2)}</span></div>
              <div><span className="text-gray-400">OT: </span><span className={`${otHrs > 0 ? 'text-orange-600 font-medium' : 'text-gray-700'}`}>{otHrs.toFixed(2)}</span></div>
              <div><span className="text-gray-400">ND: </span><span className={r.adj_nd_hrs != null ? 'text-amber-700 font-medium' : 'text-gray-700'}>{ndHrs.toFixed(2)}</span></div>
              <div><span className="text-gray-400">Reg Hol: </span><span className="text-gray-700">{regHolHrs.toFixed(2)}</span></div>
              <div><span className="text-gray-400">Spec Hol: </span><span className="text-gray-700">{specHolHrs.toFixed(2)}</span></div>
              <div><span className="text-gray-400">RD: </span><span className="text-gray-700">{rdHrs.toFixed(2)}</span></div>
              <div><span className="text-gray-400">Late: </span>
                {lateMins > 0
                  ? <span className={`font-medium ${r.adj_late_mins != null ? 'text-amber-700' : 'text-red-600'}`}>{lateMins} min</span>
                  : <span className="text-gray-700">0</span>}
              </div>
              <div><span className="text-gray-400">Leave: </span><span className="text-gray-700">{leaveDays.toFixed(1)} days</span></div>
            </div>
          </div>
        );
      })}
    </div>

    {/* ── Desktop table (≥ md) ── */}
    <table className="hidden md:table min-w-full divide-y divide-gray-200">
      <thead>
        <tr>
          <Th>Batch</Th>
          {isAdmin && <><Th>Employee</Th><ThHide hide>Department</ThHide></>}
          <Th>Payroll Period</Th>
          <Th>Reg Hrs</Th>
          <ThHide hide>OT Hrs</ThHide>
          <ThHide hide>ND Hrs</ThHide>
          <ThHide hide>Reg Holiday</ThHide>
          <ThHide hide>Spec Holiday</ThHide>
          <ThHide hide>RD Hrs</ThHide>
          <Th>Late (min)</Th>
          <ThHide hide>Leave Days</ThHide>
          <Th>Action</Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 bg-white">
        {rows.map((r) => {
          // Use adjusted values when available, fall back to original
          const regHrs       = r.adj_reg_hrs   != null ? Number(r.adj_reg_hrs)   : Number(r.reg_hrs);
          const otHrs        = r.adj_ot_hrs    != null ? Number(r.adj_ot_hrs)    : Number(r.ot_hrs);
          const ndHrs        = r.adj_nd_hrs    != null ? Number(r.adj_nd_hrs)    : Number(r.nd_hrs);
          const regHolHrs    = r.adj_reg_holiday_hrs  != null ? Number(r.adj_reg_holiday_hrs)  : Number(r.reg_holiday_hrs);
          const specHolHrs   = r.adj_spec_holiday_hrs != null ? Number(r.adj_spec_holiday_hrs) : Number(r.spec_holiday_hrs);
          const rdHrs        = r.adj_rd_hrs    != null ? Number(r.adj_rd_hrs)    : Number(r.rd_hrs);
          const lateMins     = r.adj_late_mins != null ? Number(r.adj_late_mins) : Number(r.late_mins);
          const leaveDays    = r.adj_leave_days != null ? Number(r.adj_leave_days) : Number(r.leave_days);
          const hasAdj = r.adj_reg_hrs != null || r.adj_ot_hrs != null || r.adj_nd_hrs != null;
          return (
          <tr key={r.id} className={`hover:bg-blue-50/40 transition-colors ${hasAdj ? 'bg-amber-50/30' : ''}`}>
            <Td center>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                {r.batch_id ?? '--'}
              </span>
            </Td>
            {isAdmin && (
              <>
                <Td><span className="font-medium text-gray-800">{r.emp_fullname}</span></Td>
                <TdHide hide>{r.emp_dept ?? '--'}</TdHide>
              </>
            )}
            <Td>
              <span className="text-xs">
                {fmt(r.payroll_start, 'date')} - {fmt(r.payroll_end, 'date')}
              </span>
            </Td>
            <Td center><span className={r.adj_reg_hrs != null ? 'text-amber-700 font-medium' : ''}>{regHrs.toFixed(2)}</span></Td>
            <TdHide center hide><span className={`${otHrs > 0 ? 'text-orange-600 font-medium' : ''} ${r.adj_ot_hrs != null ? 'text-amber-700' : ''}`}>{otHrs.toFixed(2)}</span></TdHide>
            <TdHide center hide><span className={r.adj_nd_hrs != null ? 'text-amber-700 font-medium' : ''}>{ndHrs.toFixed(2)}</span></TdHide>
            <TdHide center hide>{regHolHrs.toFixed(2)}</TdHide>
            <TdHide center hide>{specHolHrs.toFixed(2)}</TdHide>
            <TdHide center hide>{rdHrs.toFixed(2)}</TdHide>
            <Td center>
              {lateMins > 0 ? (
                <span className={`font-medium ${r.adj_late_mins != null ? 'text-amber-700' : 'text-red-600'}`}>{lateMins}</span>
              ) : lateMins}
            </Td>
            <TdHide center hide>{leaveDays.toFixed(1)}</TdHide>
            <Td center>
              <button
                onClick={() => setDetailRow(r)}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Eye size={12} /> See More
              </button>
            </Td>
          </tr>
          );
        })}
      </tbody>
    </table>

    {detailRow && (
      <AttendanceDetailModal
        row={detailRow}
        onClose={() => setDetailRow(null)}
      />
    )}
    </>
  );
}

// ─── Attendance Detail Modal (see more in summary) ───────────────────────────
function AttendanceDetailModal({
  row,
  onClose,
}: {
  row: AttendanceSummaryRow;
  onClose: () => void;
}) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    attendanceApi.list({
      table: 'attendance',
      page: 1,
      limit: 100,
      employee_id: String(row.employee_id),
    }).then((res) => {
      // Filter to the payroll period
      const start = row.payroll_start?.split('T')[0];
      const end   = row.payroll_end?.split('T')[0];
      const filtered = (res.data as AttendanceRecord[]).filter((r) => {
        const d = (r.date ?? '').split('T')[0];
        return (!start || d >= start) && (!end || d <= end);
      });
      setRecords(filtered);
    }).catch(() => setRecords([])).finally(() => setLoading(false));
  }, [row.employee_id, row.payroll_start, row.payroll_end]);

  const effDate   = (r: AttendanceRecord) => r.adj_date        ?? r.date;
  const effTimeIn = (r: AttendanceRecord) => r.adj_time_in     ?? r.time_in;
  const effTmOut  = (r: AttendanceRecord) => r.adj_time_out    ?? r.time_out;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
          <div>
            <h3 className="font-bold text-lg text-gray-800">
              {row.emp_fullname}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {row.emp_dept ?? ''} &bull; Payroll Period: {fmt(row.payroll_start, 'date')} - {fmt(row.payroll_end, 'date')}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={18} />
          </button>
        </div>

        {/* Summary row -- show all fch_attendance_summary fields */}
        <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex-shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1.5 text-xs">
            {[
              { label: 'Reg Hrs',       val: row.adj_reg_hrs    ?? row.reg_hrs,       adj: row.adj_reg_hrs    != null },
              { label: 'OT Hrs',        val: row.adj_ot_hrs     ?? row.ot_hrs,        adj: row.adj_ot_hrs     != null },
              { label: 'ND Hrs',        val: row.adj_nd_hrs     ?? row.nd_hrs,        adj: row.adj_nd_hrs     != null },
              { label: 'OT ND Hrs',     val: row.adj_ot_nd_hrs  ?? row.ot_nd_hrs,     adj: row.adj_ot_nd_hrs  != null },
              { label: 'RD Hrs',        val: row.adj_rd_hrs     ?? row.rd_hrs,        adj: row.adj_rd_hrs     != null },
              { label: 'Reg Hol Hrs',   val: row.adj_reg_holiday_hrs  ?? row.reg_holiday_hrs,  adj: row.adj_reg_holiday_hrs  != null },
              { label: 'Spec Hol Hrs',  val: row.adj_spec_holiday_hrs ?? row.spec_holiday_hrs, adj: row.adj_spec_holiday_hrs != null },
              { label: 'Reg Hol Days',  val: row.reg_holiday_days,  adj: false },
              { label: 'Leave Days',    val: row.adj_leave_days ?? row.leave_days,    adj: row.adj_leave_days != null },
              { label: 'Late (min)',    val: row.adj_late_mins  ?? row.late_mins,     adj: row.adj_late_mins  != null },
            ].map(({ label, val, adj }) => (
              <span key={label}>
                <span className="text-gray-500">{label}:</span>{' '}
                <strong className={adj ? 'text-amber-700' : ''}>
                  {Number(val ?? 0).toFixed(label.includes('Days') || label.includes('min') ? 0 : 2)}
                  {adj && <span className="text-[10px] ml-0.5 text-amber-500">*</span>}
                </strong>
              </span>
            ))}
          </div>
          {(row.adj_reg_hrs != null || row.adj_ot_hrs != null || row.adj_nd_hrs != null || row.adj_late_mins != null) && (
            <p className="text-[10px] text-amber-600 mt-1">* Adjusted values</p>
          )}
        </div>

        {/* Daily records */}
        <div className="overflow-y-auto flex-1 p-5">
          {loading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-500">
              <Loader2 size={18} className="animate-spin" /> Loading attendance records...
            </div>
          ) : records.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              <Clock size={28} className="mx-auto mb-2 opacity-30" />
              <p>No daily records found for this period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Time In</Th>
                    <Th>Time Out</Th>
                    <Th>Shift In</Th>
                    <Th>Shift Out</Th>
                    <Th>Total Hrs</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {records.map((r) => (
                    <tr key={r.uniq_id} className="hover:bg-blue-50/30">
                      <Td><AdjCell isAdj={!!r.adj_date}>{fmt(effDate(r), 'date')}</AdjCell></Td>
                      <Td>
                        <AdjCell isAdj={!!r.adj_time_in}>
                          {effTimeIn(r) ? fmt(effTimeIn(r), 'time') : <span className="text-red-400 text-xs">No punch</span>}
                        </AdjCell>
                      </Td>
                      <Td>
                        <AdjCell isAdj={!!r.adj_time_out}>
                          {effTmOut(r) ? fmt(effTmOut(r), 'time') : <span className="text-red-400 text-xs">No punch</span>}
                        </AdjCell>
                      </Td>
                      <Td>{fmt(r.adj_shift_time_in ?? r.shift_time_in, 'time')}</Td>
                      <Td>{fmt(r.adj_shift_time_out ?? r.shift_time_out, 'time')}</Td>
                      <Td center>
                        <span className={`font-semibold ${Number(r.total_hrs) > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                          {Number(r.total_hrs).toFixed(2)}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-5 pt-3 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="w-full px-4 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Flag Form Modal (employee submits a flag) ──────────────────────────

const FLAG_COLUMN_LABELS: Record<string, string> = {
  time_in:        'Time In',
  time_out:       'Time Out',
  shift_time_in:  'Shift Time In',
  shift_time_out: 'Shift Time Out',
};

const SHIFT_COLUMNS = new Set(['shift_time_in', 'shift_time_out']);

function FlagFormModal({
  row,
  userId,
  onClose,
  onSubmitted,
}: {
  row: AttendanceRecord;
  userId: number;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [flagColumn,      setFlagColumn]      = useState('');
  // Punch-mode state (time_in / time_out)
  const [punches,         setPunches]         = useState<PunchOption[]>([]);
  const [loadingPunches,  setLoadingPunches]  = useState(false);
  const [selectedPunchId, setSelectedPunchId] = useState<number | null>(null);
  // Shift-mode state (shift_time_in / shift_time_out)
  const [shiftPresets,    setShiftPresets]    = useState<ShiftPreset[]>([]);
  const [loadingShifts,   setLoadingShifts]   = useState(false);
  const [selectedShift,   setSelectedShift]   = useState<'custom' | string>(''); // 'HH:MM-HH:MM' key or 'custom'
  const [customTime,      setCustomTime]      = useState('');  // HH:MM
  // Common
  const [reason,    setReason]    = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const attachmentRef = useRef<HTMLInputElement>(null);
  const [submitting,setSubmitting]= useState(false);
  const [result,    setResult]    = useState<{ ok: boolean; msg: string } | null>(null);

  const dateStr = row.date ? row.date.split('T')[0].split(' ')[0] : '';
  const isShiftCol = SHIFT_COLUMNS.has(flagColumn);

  const handleColumnChange = async (col: string) => {
    setFlagColumn(col);
    setSelectedPunchId(null);
    setPunches([]);
    setSelectedShift('');
    setCustomTime('');
    setResult(null);
    if (!col) return;

    if (SHIFT_COLUMNS.has(col)) {
      setLoadingShifts(true);
      try {
        const res = await attendanceApi.getShiftPresets();
        setShiftPresets(res.data);
      } catch {
        setShiftPresets([]);
      } finally {
        setLoadingShifts(false);
      }
    } else {
      setLoadingPunches(true);
      try {
        const res = await attendanceApi.getPunchesForDate(userId, dateStr);
        setPunches(res.data);
      } catch {
        setPunches([]);
      } finally {
        setLoadingPunches(false);
      }
    }
  };

  // Derive the final suggested HH:MM value for shift columns
  const shiftSuggestedTime = (): string => {
    if (selectedShift === 'custom') return customTime;
    if (!selectedShift) return '';
    // selectedShift key is "start-end", value comes from preset label; we stored key as start|end
    const preset = shiftPresets.find((p) => `${p.shift_start}|${p.shift_end}` === selectedShift);
    if (!preset) return '';
    // For shift_time_IN we want shift_start; for shift_time_OUT we want shift_end
    return flagColumn === 'shift_time_in' ? preset.shift_start : preset.shift_end;
  };

  const canSubmit = () => {
    if (!flagColumn || !reason.trim()) return false;
    if (isShiftCol) {
      const t = shiftSuggestedTime();
      return t.length >= 4; // "HH:MM"
    }
    return !!selectedPunchId;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;
    setSubmitting(true);
    setResult(null);
    try {
      let suggestedValue: string;
      let suggestedPunchId: number | undefined;

      if (isShiftCol) {
        suggestedValue = shiftSuggestedTime();
      } else {
        const punch = punches.find((p) => p.id === selectedPunchId);
        if (!punch) return;
        suggestedPunchId = selectedPunchId!;
        suggestedValue = punch.punch_time;
      }

      if (attachmentFile) {
        const fd = new FormData();
        fd.append('action', 'submit');
        fd.append('attendance_id', String(row.uniq_id));
        fd.append('flag_column', flagColumn);
        fd.append('suggested_value', suggestedValue);
        if (suggestedPunchId != null) fd.append('suggested_punch_id', String(suggestedPunchId));
        fd.append('reason', reason.trim());
        fd.append('attachment', attachmentFile);
        await attendanceApi.submitFlagFormData(fd);
      } else {
        await attendanceApi.submitFlag({
          attendance_id:      row.uniq_id,
          flag_column:        flagColumn,
          suggested_value:    suggestedValue,
          reason:             reason.trim(),
          ...(suggestedPunchId != null ? { suggested_punch_id: suggestedPunchId } : {}),
        });
      }
      setResult({ ok: true, msg: 'Correction request submitted successfully' });
      setTimeout(onSubmitted, 1000);
    } catch (e: any) {
      setResult({ ok: false, msg: e.message ?? 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const effVal = (col: string) => {
    type Key = keyof AttendanceRecord;
    const adjKey = `adj_${col}` as Key;
    const baseKey = col as Key;
    return (row[adjKey] as string | null) ?? (row[baseKey] as string | null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => { if (!submitting) onClose(); }} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 flex flex-col max-h-[85vh]">

        {/* ── Fixed header ── */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Flag size={18} className="text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">Request Attendance Correction</h3>
              <p className="text-xs text-gray-400 mt-0.5">{fmt(row.date, 'date')}</p>
            </div>
          </div>
          {!submitting && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <X size={18} />
            </button>
          )}
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <p className="text-xs text-gray-500 bg-orange-50 rounded-lg px-3 py-2 flex items-start gap-2">
            <AlertTriangle size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
            {isShiftCol
              ? 'Select a shift preset or enter a custom time for the correction.'
              : 'The suggested correction must be chosen from your recorded raw punches for that day.'}
          </p>

          {/* Column selector */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Which field to flag?</label>
            <select
              value={flagColumn}
              onChange={(e) => handleColumnChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <option value="">-- Select field --</option>
              {Object.entries(FLAG_COLUMN_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Current value */}
          {flagColumn && (
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
              <span className="text-gray-500 text-xs">Current value: </span>
              <span className="font-medium text-gray-800">
                {effVal(flagColumn) ? fmt(effVal(flagColumn), 'time') : <span className="text-red-400">No punch</span>}
              </span>
            </div>
          )}

          {/* ── Punch picker (time_in / time_out) ── */}
          {flagColumn && !isShiftCol && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Choose suggested correction from raw punches</label>
              {loadingPunches ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                  <Loader2 size={14} className="animate-spin" /> Loading punches...
                </div>
              ) : punches.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">No raw punches found for this date range.</p>
              ) : (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {punches.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPunchId(p.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors text-sm ${
                        selectedPunchId === p.id
                          ? 'border-orange-400 bg-orange-50 text-orange-800'
                          : 'border-gray-200 hover:border-orange-200 hover:bg-orange-50/40 text-gray-700'
                      }`}
                    >
                      <span className="font-mono font-medium">{fmt(p.punch_time, 'time')}</span>
                      <span className="text-xs text-gray-400">{fmt(p.punch_time, 'date')}</span>
                      {p.punch_type && <span className="ml-auto text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{p.punch_type}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Shift picker (shift_time_in / shift_time_out) ── */}
          {flagColumn && isShiftCol && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-gray-600 block">Choose suggested shift time</label>

              {loadingShifts ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 size={14} className="animate-spin" /> Loading shifts...
                </div>
              ) : (
                <div className="space-y-1.5">
                  {shiftPresets.map((p) => {
                    const key = `${p.shift_start}|${p.shift_end}`;
                    return (
                      <button
                        key={key}
                        onClick={() => { setSelectedShift(key); setCustomTime(''); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors text-sm ${
                          selectedShift === key
                            ? 'border-orange-400 bg-orange-50 text-orange-800'
                            : 'border-gray-200 hover:border-orange-200 hover:bg-orange-50/40 text-gray-700'
                        }`}
                      >
                        <span className="font-mono font-medium">
                          {flagColumn === 'shift_time_in' ? p.shift_start : p.shift_end}
                        </span>
                        <span className="text-xs text-gray-400">{p.label}</span>
                      </button>
                    );
                  })}

                  {/* Custom shift option */}
                  <button
                    onClick={() => setSelectedShift('custom')}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-colors text-sm ${
                      selectedShift === 'custom'
                        ? 'border-orange-400 bg-orange-50 text-orange-800'
                        : 'border-dashed border-gray-300 hover:border-orange-300 hover:bg-orange-50/30 text-gray-500'
                    }`}
                  >
                    <span className="text-base leading-none">+</span>
                    <span>Enter custom time</span>
                  </button>
                </div>
              )}

              {selectedShift === 'custom' && (
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Custom time</label>
                  <TimeSelect
                    value={customTime}
                    onChange={setCustomTime}
                    className="border-orange-300 focus:ring-orange-300"
                  />
                </div>
              )}
            </div>
          )}

          {/* Attachment (optional) */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Attachment <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              ref={attachmentRef}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-600
                file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0
                file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700
                hover:file:bg-orange-100 cursor-pointer"
            />
            {attachmentFile && (
              <p className="mt-1 text-xs text-orange-600 flex items-center gap-1">
                <Paperclip size={11} /> {attachmentFile.name}
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Reason / explanation</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Briefly describe why you think this value is incorrect..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
            />
          </div>

          {result && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              result.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {result.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              {result.msg}
            </div>
          )}
        </div>

        {/* ── Fixed footer with action buttons ── */}
        <div className="flex gap-3 p-5 pt-3 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit() || submitting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Flag size={15} />}
            {submitting ? 'Submitting...' : 'Submit Correction'}
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 border border-gray-300 hover:bg-gray-50 disabled:opacity-40 text-gray-600 rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Flags Review Modal (admin reviews submitted flags) ─────────────────

function FlagsReviewModal({ onClose, onUpdate, userRole }: { onClose: () => void; onUpdate: () => void; userRole: UserRole }) {
  const isSupervisor = userRole === 'supervisor';
  // Supervisor cannot review time_in / time_out corrections
  const canReview = (flag: AttendanceFlag) =>
    !isSupervisor || !['time_in', 'time_out'].includes(flag.flag_column);
  const [flags,        setFlags]        = useState<AttendanceFlag[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('Pending');
  const [rejectTarget, setRejectTarget] = useState<AttendanceFlag | null>(null);
  const [approveTarget, setApproveTarget] = useState<AttendanceFlag | null>(null);
  const [adminNotes,   setAdminNotes]   = useState('');
  const [actioning,    setActioning]    = useState(false);
  const [reviewDetail, setReviewDetail] = useState<AttendanceFlag | null>(null);

  // Bulk selection
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const load = async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const res = await attendanceApi.listFlags({ status: statusFilter || undefined });
      setFlags(res.data);
    } catch {
      setFlags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const pendingFlags = flags.filter((f) => f.status === 'Pending');

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allPendingSelected = pendingFlags.length > 0 && pendingFlags.filter(canReview).every((f) => selected.has(f.id));
  const toggleSelectAll = () => {
    if (allPendingSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingFlags.filter(canReview).map((f) => f.id)));
    }
  };

  const doReview = async (flagId: number, status: 'Approved' | 'Rejected', notes?: string) => {
    setActioning(true);
    try {
      await attendanceApi.reviewFlag({ flag_id: flagId, status, admin_notes: notes });
      onUpdate();
      setRejectTarget(null);
      await load();
    } catch {
      // silently ignore
    } finally {
      setActioning(false);
    }
  };

  const doBulkReview = async (status: 'Approved' | 'Rejected') => {
    if (selected.size === 0) return;
    setActioning(true);
    try {
      await attendanceApi.bulkReviewFlags({ flag_ids: Array.from(selected), status });
      onUpdate();
      await load();
    } catch {
      // silently ignore
    } finally {
      setActioning(false);
    }
  };

  const statusBadge = (s: AttendanceFlag['status']) => {
    const cls = s === 'Approved' ? 'bg-green-100 text-green-700' : s === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{s}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Flag size={18} className="text-orange-600" />
            </div>
            <h3 className="font-bold text-lg text-gray-800">Attendance Corrections</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={18} />
          </button>
        </div>

        {/* Status filter tabs + bulk actions */}
        <div className="flex flex-wrap items-center gap-2 px-5 pt-4 pb-2 flex-shrink-0">
          <div className="flex gap-1">
            {(['Pending', 'history'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                {s === 'Pending' ? 'In Progress' : 'History'}
              </button>
            ))}
          </div>

          {/* Bulk action buttons -- only shown when Pending filter is active and items selected */}
          {statusFilter === 'Pending' && selected.size > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-gray-500 font-medium">{selected.size} selected</span>
              <button
                onClick={() => { if (window.confirm(`Approve ${selected.size} selected correction(s)? This cannot be undone.`)) doBulkReview('Approved'); }}
                disabled={actioning}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white"
              >
                <ThumbsUp size={13} /> Approve All
              </button>
              <button
                onClick={() => { if (window.confirm(`Reject ${selected.size} selected correction(s)? This cannot be undone.`)) doBulkReview('Rejected'); }}
                disabled={actioning}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white"
              >
                <ThumbsDown size={13} /> Reject All
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 px-5 pb-5">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
              <Loader2 size={18} className="animate-spin" /> Loading flags...
            </div>
          ) : flags.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Flag size={32} className="mx-auto mb-2 opacity-30" />
              <p>No correction requests found.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 mt-2">
              <thead>
                <tr>
                  {statusFilter === 'Pending' && (
                    <th className="px-3 py-3 bg-gray-50">
                      <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-700">
                        {allPendingSelected
                          ? <CheckSquare size={15} className="text-orange-500" />
                          : <Square size={15} />}
                      </button>
                    </th>
                  )}
                  <Th>Employee</Th>
                  <Th>Date</Th>
                  <Th>Field</Th>
                  <Th>Current</Th>
                  <Th>Suggested</Th>
                  <Th>Reason</Th>
                  <Th>Status</Th>
                  {statusFilter !== 'Pending' && <Th>Reviewed By</Th>}
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {flags.map((f) => (
                  <tr key={f.id} className={`transition-colors ${selected.has(f.id) ? 'bg-orange-50' : 'hover:bg-orange-50/30'}`}>
                    {statusFilter === 'Pending' && (
                      <td className="px-3 py-2">
                        {f.status === 'Pending' && canReview(f) && (
                          <button onClick={() => toggleSelect(f.id)} className="text-gray-400 hover:text-orange-500">
                            {selected.has(f.id)
                              ? <CheckSquare size={15} className="text-orange-500" />
                              : <Square size={15} />}
                          </button>
                        )}
                      </td>
                    )}
                    <Td><span className="font-medium text-gray-800">{f.emp_fullname ?? `ID ${f.employee_id}`}</span></Td>
                    <Td>{fmt(f.date, 'date')}</Td>
                    <Td><span className="font-medium text-orange-700">{FLAG_COLUMN_LABELS[f.flag_column] ?? f.flag_column}</span></Td>
                    <Td>{f.current_value ? fmt(f.current_value, 'time') : <span className="text-red-400">No punch</span>}</Td>
                    <Td><span className="font-semibold text-green-700">{fmt(f.suggested_value, 'time')}</span></Td>
                    <Td>
                      <span className="max-w-[180px] block truncate text-gray-600" title={f.reason ?? ''}>
                        {f.reason ?? '--'}
                      </span>
                    </Td>
                    <Td center>{statusBadge(f.status)}</Td>
                    {statusFilter !== 'Pending' && (
                      <Td>
                        <span className="text-xs text-gray-500">
                          {f.reviewed_by_name ?? '--'}
                          {f.reviewed_at && <span className="block text-gray-400">{fmt(f.reviewed_at, 'date')}</span>}
                        </span>
                      </Td>
                    )}
                    <Td center>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setReviewDetail(f)}
                          title="Review Details"
                          className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                        {f.status === 'Pending' && canReview(f) ? (
                          <>
                            <button
                              onClick={() => setApproveTarget(f)}
                              disabled={actioning}
                              title="Approve"
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 disabled:opacity-40 transition-colors"
                            >
                              <ThumbsUp size={14} />
                            </button>
                            <button
                              onClick={() => { setRejectTarget(f); setAdminNotes(''); }}
                              disabled={actioning}
                              title="Reject"
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
                            >
                              <ThumbsDown size={14} />
                            </button>
                          </>
                        ) : f.status === 'Pending' ? (
                          <span className="text-xs text-gray-400 italic">Admin only</span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {f.admin_notes
                              ? <span className="block max-w-[100px] truncate" title={f.admin_notes}>{f.admin_notes}</span>
                              : '--'}
                          </span>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {approveTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setApproveTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6">
            <h4 className="font-bold text-gray-800 mb-2">Approve Correction</h4>
            <p className="text-sm text-gray-600 mb-4">
              Approving correction for <strong>{approveTarget.emp_fullname}</strong> -- <strong>{FLAG_COLUMN_LABELS[approveTarget.flag_column]}</strong> on {fmt(approveTarget.date, 'date')}.
            </p>
            <p className="text-sm bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 mb-4">
              Once approved, this decision cannot be changed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { doReview(approveTarget.id, 'Approved'); setApproveTarget(null); }}
                disabled={actioning}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg text-sm font-medium"
              >
                {actioning ? <Loader2 size={14} className="animate-spin" /> : <ThumbsUp size={14} />}
                Confirm Approve
              </button>
              <button
                onClick={() => setApproveTarget(null)}
                className="px-4 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setRejectTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6">
            <h4 className="font-bold text-gray-800 mb-2">Reject Flag</h4>
            <p className="text-sm text-gray-600 mb-3">
              Rejecting flag for <strong>{rejectTarget.emp_fullname}</strong> -- <strong>{FLAG_COLUMN_LABELS[rejectTarget.flag_column]}</strong> on {fmt(rejectTarget.date, 'date')}.
            </p>
            <label className="text-xs font-medium text-gray-600 block mb-1">Admin notes (optional)</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Explain why this flag is being rejected..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => doReview(rejectTarget.id, 'Rejected', adminNotes)}
                disabled={actioning}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg text-sm font-medium"
              >
                {actioning ? <Loader2 size={14} className="animate-spin" /> : <ThumbsDown size={14} />}
                Confirm Reject
              </button>
              <button
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewDetail && (
        <FlagDetailModal
          flag={reviewDetail}
          onClose={() => setReviewDetail(null)}
        />
      )}
    </div>
  );
}
// ─── Flag Detail Modal (admin reviews a single flag with full context) ──────

function FlagDetailModal({ flag, onClose }: { flag: AttendanceFlag; onClose: () => void }) {
  const [punches, setPunches] = useState<PunchOption[]>([]);
  const [loadingPunches, setLoadingPunches] = useState(true);

  useEffect(() => {
    const dateStr = (flag.date ?? '').split('T')[0].split(' ')[0];
    if (!dateStr) { setLoadingPunches(false); return; }
    setLoadingPunches(true);
    attendanceApi.getPunchesForDate(flag.employee_id, dateStr)
      .then((r) => setPunches(r.data))
      .catch(() => setPunches([]))
      .finally(() => setLoadingPunches(false));
  }, [flag]);

  const isImage = (p: string) => /\.(jpe?g|png|gif|webp)$/i.test(p);
  const statusCls = flag.status === 'Approved'
    ? 'bg-green-100 text-green-700'
    : flag.status === 'Rejected'
    ? 'bg-red-100 text-red-700'
    : 'bg-yellow-100 text-yellow-700';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Eye size={18} className="text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-800">Correction Review</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {flag.emp_fullname ?? `ID ${flag.employee_id}`}
                {flag.emp_dept ? ` . ${flag.emp_dept}` : ''} -- {fmt(flag.date, 'date')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Flag details */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Flag Details</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400">Field</p>
                <p className="font-semibold text-orange-700">{FLAG_COLUMN_LABELS[flag.flag_column] ?? flag.flag_column}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Status</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCls}`}>{flag.status}</span>
              </div>
              <div>
                <p className="text-xs text-gray-400">Current Value</p>
                <p className="font-medium text-gray-700">
                  {flag.current_value ? fmt(flag.current_value, 'time') : <span className="text-red-400">No punch</span>}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Suggested Value</p>
                <p className="font-semibold text-green-700">{fmt(flag.suggested_value, 'time')}</p>
              </div>
            </div>
            {flag.reason && (
              <div>
                <p className="text-xs text-gray-400">Reason</p>
                <p className="text-sm text-gray-700 mt-0.5">{flag.reason}</p>
              </div>
            )}
            {flag.admin_notes && (
              <div>
                <p className="text-xs text-gray-400">Admin Notes</p>
                <p className="text-sm text-gray-700 mt-0.5 italic">{flag.admin_notes}</p>
              </div>
            )}
            {flag.attachment && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Attachment</p>
                {isImage(flag.attachment) ? (
                  <div className="space-y-1">
                    <img
                      src={`${BACKEND}/backend/${flag.attachment}`}
                      alt="Attachment"
                      className="max-h-44 rounded-lg border border-gray-200 object-contain"
                    />
                    <a
                      href={`${BACKEND}/backend/${flag.attachment}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >Open full image</a>
                  </div>
                ) : (
                  <a
                    href={`${BACKEND}/backend/${flag.attachment}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2"
                  >
                    <Paperclip size={12} /> View Attachment
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Attendance record for that day (shift + hours) */}
          {(flag.att_time_in || flag.att_time_out || flag.shift_time_in || flag.shift_time_out || flag.att_total_hrs != null) && (
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Attendance Record -- {fmt(flag.date, 'date')}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Time In</p>
                  <p className="font-medium text-gray-800">
                    {flag.att_time_in ? fmt(flag.att_time_in, 'time') : <span className="text-red-400">No punch</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Time Out</p>
                  <p className="font-medium text-gray-800">
                    {flag.att_time_out ? fmt(flag.att_time_out, 'time') : <span className="text-red-400">No punch</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Shift In</p>
                  <p className="font-medium text-gray-800">{flag.eff_shift_time_in ? fmt(flag.eff_shift_time_in, 'time') : '--'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Shift Out</p>
                  <p className="font-medium text-gray-800">{flag.eff_shift_time_out ? fmt(flag.eff_shift_time_out, 'time') : '--'}</p>
                </div>
                {flag.att_total_hrs != null && (
                  <div className="col-span-2 bg-blue-100 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-blue-500">Hours Worked</p>
                    <p className="text-xl font-bold text-blue-700">{Number(flag.att_total_hrs).toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Raw punches */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              All Raw Punches -- {fmt(flag.date, 'date')}
            </p>
            {loadingPunches ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
                <Loader2 size={14} className="animate-spin" /> Loading punches...
              </div>
            ) : punches.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No raw punches found for this date range.</p>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {punches.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm">
                    <span className="font-mono font-semibold text-gray-800">{fmt(p.punch_time, 'time')}</span>
                    <span className="text-xs text-gray-400">{fmt(p.punch_time, 'date')}</span>
                    {p.punch_type && (
                      <span className="ml-auto text-xs bg-gray-200 text-gray-600 rounded px-1.5 py-0.5">{p.punch_type}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 pt-3 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Punch Correction Request Modal ─────────────────────────────────────────
function PunchCorrectionModal({
  punch,
  role,
  onClose,
  onSubmitted,
}: {
  punch: AttendancePunch;
  role: 'time_in' | 'time_out';
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [reason,       setReason]       = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [loadingAtt,   setLoadingAtt]   = useState(true);
  const [attendanceId, setAttendanceId] = useState<number | null>(null);
  const [currentValue, setCurrentValue] = useState<string | null>(null);

  const dateStr = punch.punch_time.split(' ')[0];

  useEffect(() => {
    attendanceApi.recordForDate(dateStr, punch.employee_id)
      .then((r) => {
        setAttendanceId(r.data?.uniq_id ?? null);
        setCurrentValue(role === 'time_in' ? (r.data?.adj_time_in ?? r.data?.time_in ?? null) : (r.data?.adj_time_out ?? r.data?.time_out ?? null));
      })
      .catch(() => setAttendanceId(null))
      .finally(() => setLoadingAtt(false));
  }, [dateStr, punch.employee_id, role]);

  const handleSubmit = async () => {
    if (!reason.trim()) { setError('Please enter a reason.'); return; }
    if (!attendanceId)  { setError('No attendance record found for this date. Sync attendance first.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await attendanceApi.submitFlag({
        attendance_id:    attendanceId,
        flag_column:      role,
        suggested_value:  punch.punch_time,
        suggested_punch_id: punch.id,
        reason:           reason.trim(),
      });
      onSubmitted();
    } catch (e: any) {
      setError(e.message ?? 'Submission failed');
      setSubmitting(false);
    }
  };

  const roleLabel = role === 'time_in' ? 'Time In' : 'Time Out';
  const roleCls   = role === 'time_in' ? 'text-green-700 bg-green-50 border-green-200' : 'text-orange-700 bg-orange-50 border-orange-200';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => { if (!submitting) onClose(); }} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${roleCls}`}>
              {role === 'time_in' ? <LogIn size={16} /> : <LogOut size={16} />}
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-sm">Request {roleLabel} Correction</h4>
              <p className="text-xs text-gray-400 mt-0.5">This will be sent to admin for approval</p>
            </div>
          </div>
          <button onClick={onClose} disabled={submitting} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Punch info */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400 text-xs">Employee</span>
              <span className="font-medium text-gray-800">{punch.emp_fullname ?? `ID: ${punch.employee_id}`}</span>
            </div>
            {punch.emp_dept && (
              <div className="flex justify-between">
                <span className="text-gray-400 text-xs">Department</span>
                <span className="text-gray-700">{punch.emp_dept}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400 text-xs">Punch Time</span>
              <span className="font-mono font-semibold text-gray-800">{fmt(punch.punch_time)}</span>
            </div>
            {punch.punch_type && (
              <div className="flex justify-between">
                <span className="text-gray-400 text-xs">Punch Type</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  punch.punch_type === 'Time In'  ? 'bg-green-100 text-green-700' :
                  punch.punch_type === 'Time Out' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-500'
                }`}>{punch.punch_type}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs">Requesting to set as</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${roleCls}`}>{roleLabel}</span>
            </div>
            <div className="flex justify-between items-center border-t border-gray-200 pt-2">
              <span className="text-gray-400 text-xs">Current {roleLabel}</span>
              {loadingAtt
                ? <span className="text-xs text-gray-400">Loading...</span>
                : currentValue
                  ? <span className="font-mono text-sm text-gray-700">{fmt(currentValue)}</span>
                  : <span className="text-xs text-red-400">No punch recorded</span>
              }
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Reason <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              disabled={submitting}
              placeholder="Explain why this punch should be used as the Time In/Out..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none disabled:opacity-60"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 text-xs rounded-lg px-3 py-2 border border-red-200">
              <AlertCircle size={13} className="shrink-0" /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={handleSubmit}
            disabled={submitting || loadingAtt || !reason.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Punches Table ───────────────────────────────────────────────────────────
function PunchesTable({
  rows,
  isAdmin,
  userRole,
  onRefresh,
}: {
  rows: AttendancePunch[];
  isAdmin: boolean;
  userRole: UserRole;
  onRefresh?: () => void;
}) {
  const [toast,          setToast]          = useState<{ msg: string; ok: boolean } | null>(null);
  const [correctionTarget, setCorrectionTarget] = useState<{ punch: AttendancePunch; role: 'time_in' | 'time_out' } | null>(null);

  function verifycodeLabel(code: string | null): string {
    if (code === null || code === undefined) return 'Manual Upload';
    const n = Number(code);
    if (n === 3)  return 'Password';
    if (n === 15) return 'Face ID';
    if (n === 1)  return 'Fingerprint';
    return code;
  }

  function verifycodeColor(code: string | null): string {
    if (code === null || code === undefined) return 'bg-gray-100 text-gray-500';
    const n = Number(code);
    if (n === 15) return 'bg-purple-100 text-purple-700';
    if (n === 1)  return 'bg-green-100 text-green-700';
    if (n === 3)  return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-600';
  }

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCorrectionSubmitted = () => {
    setCorrectionTarget(null);
    showToast('Correction request submitted. Awaiting admin approval.', true);
    onRefresh?.();
  };

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className={`absolute top-0 right-0 z-10 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium shadow-lg border ${
          toast.ok
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {toast.ok
            ? <CheckCircle size={13} className="shrink-0" />
            : <AlertCircle size={13} className="shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* ── Mobile card list (< md) ── */}
      <div className="md:hidden divide-y divide-gray-100">
        {rows.map((r) => (
          <div key={r.id} className="px-4 py-3 hover:bg-blue-50/40 transition-colors">
            {isAdmin && (
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-800">{r.emp_fullname ?? `ID: ${r.employee_id}`}</span>
                <span className="text-xs text-gray-500">{r.emp_dept ?? '--'}</span>
              </div>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{fmt(r.punch_time)}</span>
              <span className="text-xs text-gray-400">#{r.id}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {r.punch_type ? (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  r.punch_type === 'Time In'  ? 'bg-green-100 text-green-700' :
                  r.punch_type === 'Time Out' ? 'bg-orange-100 text-orange-700' :
                  r.punch_type === 'OT In'    ? 'bg-blue-100 text-blue-700' :
                  r.punch_type === 'OT Out'   ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-500'
                }`}>{r.punch_type}</span>
              ) : <span className="text-gray-300 text-xs">--</span>}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${verifycodeColor(r.verifycode)}`}>
                {verifycodeLabel(r.verifycode)}
              </span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {r.punch_type !== 'Time In' && (
                <button
                  onClick={() => setCorrectionTarget({ punch: r, role: 'time_in' })}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                >
                  <LogIn size={11} /> Time In
                </button>
              )}
              {r.punch_type !== 'Time Out' && (
                <button
                  onClick={() => setCorrectionTarget({ punch: r, role: 'time_out' })}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors"
                >
                  <LogOut size={11} /> Time Out
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop table (≥ md) ── */}
      <table className="hidden md:table min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <Th>#</Th>
            {isAdmin && <><Th>Employee</Th><Th>Department</Th></>}
            <Th>Punch Time</Th>
            <Th>Punch Type</Th>
            <Th>Verify Method</Th>
            <Th>{isAdmin ? 'Assign As' : 'Request Correction'}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-blue-50/40 transition-colors">
              <Td><span className="text-gray-400 text-xs">{r.id}</span></Td>
              {isAdmin && (
                <>
                  <Td><span className="font-medium text-gray-800">{r.emp_fullname ?? `ID: ${r.employee_id}`}</span></Td>
                  <Td>{r.emp_dept ?? '--'}</Td>
                </>
              )}
              <Td>{fmt(r.punch_time)}</Td>
              <Td center>
                {r.punch_type ? (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.punch_type === 'Time In'  ? 'bg-green-100 text-green-700' :
                    r.punch_type === 'Time Out' ? 'bg-orange-100 text-orange-700' :
                    r.punch_type === 'OT In'    ? 'bg-blue-100 text-blue-700' :
                    r.punch_type === 'OT Out'   ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>{r.punch_type}</span>
                ) : <span className="text-gray-300 text-xs">--</span>}
              </Td>
              <Td center>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${verifycodeColor(r.verifycode)}`}>
                  {verifycodeLabel(r.verifycode)}
                </span>
              </Td>
              <Td>
                <div className="flex gap-1.5 flex-wrap">
                  {r.punch_type !== 'Time In' && (
                    <button
                      onClick={() => setCorrectionTarget({ punch: r, role: 'time_in' })}
                      title="Request this punch as Time In"
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                    >
                      <LogIn size={11} />
                      Time In
                    </button>
                  )}
                  {r.punch_type !== 'Time Out' && (
                    <button
                      onClick={() => setCorrectionTarget({ punch: r, role: 'time_out' })}
                      title="Request this punch as Time Out"
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors"
                    >
                      <LogOut size={11} />
                      Time Out
                    </button>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>

      {correctionTarget && (
        <PunchCorrectionModal
          punch={correctionTarget.punch}
          role={correctionTarget.role}
          onClose={() => setCorrectionTarget(null)}
          onSubmitted={handleCorrectionSubmitted}
        />
      )}
    </div>
  );
}
