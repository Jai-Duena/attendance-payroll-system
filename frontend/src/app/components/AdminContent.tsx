import React, { useState, useEffect, useCallback } from 'react';
import { useCompany } from '../context/CompanyContext';
import { 
  Shield, 
  Building2, 
  Users,
  ChevronLeft,
  ChevronRight,
  FileEdit,
  ClockIcon,
  Repeat,
  HandIcon,
  UserPlus,
  ClipboardCheck,
  FileCheck,
  UserCog,
  DollarSign,
  Calendar,
  Filter,
  Loader2,
  Eye,
  X,
  ChevronUp,
  CheckCircle,
  XCircle,
  Printer,
  KeyRound,
  Copy,
  Unlock,
  AlertTriangle
} from 'lucide-react';
import {
  requestsApi,
  departmentsApi,
  resetRequestsApi,
  type LeaveRequest,
  type DeptSummary,
  type EmployeeSummary,
  type PasswordResetRequest,
} from '@/lib/api';
import { type UserRole } from '../App';

const BACKEND       = (import.meta.env.VITE_BACKEND_URL as string) ?? '';
const REQUESTS_PAGE = 5;
const SUMMARY_PAGE  = 4;

const fmtD = (v: string | null | undefined): string => {
  if (!v) return '--';
  const d = new Date(v.includes('T') ? v : v + 'T00:00:00');
  return isNaN(d.getTime()) ? v : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
};
const fmtDT = (v: string | null | undefined): string => {
  if (!v) return '--';
  const d = new Date(v.includes('T') ? v : v.replace(' ', 'T'));
  return isNaN(d.getTime()) ? v : d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true });
};

export default function AdminContent({ userRole = 'admin', isReadOnly = false }: { userRole?: UserRole; isReadOnly?: boolean }) {
  const { profile } = useCompany();
  const [activeView, setActiveView]       = useState<'requests' | 'summary'>('requests');
  const [viewRequest, setViewRequest]     = useState<LeaveRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError]     = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);

  // ── All Requests ─────────────────────────────────────────
  const [requests, setRequests]           = useState<LeaveRequest[]>([]);
  const [reqLoading, setReqLoading]       = useState(false);
  const [requestsVisible, setRequestsVisible] = useState(REQUESTS_PAGE);
  const [departments, setDepartments]     = useState<string[]>([]);
  const [filterDept, setFilterDept]       = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [draftDept, setDraftDept]         = useState('');
  const [draftEmployee, setDraftEmployee] = useState('');

  // ── Summary ───────────────────────────────────────────────
  const [deptSummary, setDeptSummary]     = useState<DeptSummary[]>([]);
  const [empSummary, setEmpSummary]       = useState<EmployeeSummary[]>([]);
  const [sumLoading, setSumLoading]       = useState(false);
  const [deptVisible, setDeptVisible]     = useState(SUMMARY_PAGE);
  const [empVisible, setEmpVisible]       = useState(SUMMARY_PAGE);

  // ── Drill-down (summary click-through) ─────────────────────────────────────
  const [drillDown, setDrillDown]         = useState<{ label: string; dept?: string; employeeId?: number; status?: string } | null>(null);
  const [drillRequests, setDrillRequests] = useState<LeaveRequest[]>([]);
  const [drillLoading, setDrillLoading]   = useState(false);
  const [drillVisible, setDrillVisible]   = useState(REQUESTS_PAGE);

  // ── Password Reset Requests ─────────────────────────────────────────────────
  const [resetRequests, setResetRequests]         = useState<PasswordResetRequest[]>([]);
  const [resetLoading, setResetLoading]           = useState(false);
  const [revealPassword, setRevealPassword]       = useState<{ password: string; name: string } | null>(null);
  const [resetActionLoading, setResetActionLoading] = useState<number | null>(null);
  const [copiedPw, setCopiedPw]                   = useState(false);

  const loadResetRequests = useCallback(() => {
    setResetLoading(true);
    resetRequestsApi.list('pending').then(setResetRequests).catch(() => {}).finally(() => setResetLoading(false));
  }, []);

  useEffect(() => { loadResetRequests(); }, [loadResetRequests]);

  const handleApproveReset = async (req: PasswordResetRequest) => {
    setResetActionLoading(req.id);
    try {
      const res = await resetRequestsApi.approve(req.id);
      setRevealPassword({ password: res.temp_password, name: req.emp_fullname ?? req.identifier });
      loadResetRequests();
    } catch {
      // swallow silently -- UI won't block
    } finally {
      setResetActionLoading(null);
    }
  };

  const handleRejectReset = async (req: PasswordResetRequest) => {
    setResetActionLoading(req.id);
    await resetRequestsApi.reject(req.id).catch(() => {});
    setResetActionLoading(null);
    loadResetRequests();
  };

  // ── Fetch departments for filter dropdown ─────────────────
  useEffect(() => {
    departmentsApi.list().then(setDepartments).catch(() => {});
  }, []);

  // ── Fetch requests (re-runs when filters change) ──────────
  const fetchRequests = useCallback(() => {
    setReqLoading(true);
    requestsApi
      .list({ dept: filterDept || undefined, employee: filterEmployee || undefined })
      .then((data) => {
        setRequests(data);
        setRequestsVisible(REQUESTS_PAGE);
      })
      .catch(() => setRequests([]))
      .finally(() => setReqLoading(false));
  }, [filterDept, filterEmployee]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // ── Fetch summary ─────────────────────────────────────────
  useEffect(() => {
    setSumLoading(true);
    requestsApi
      .summary()
      .then((data) => {
        setDeptSummary(data.departments);
        setEmpSummary(data.employees);
      })
      .catch(() => {})
      .finally(() => setSumLoading(false));
  }, []);

  const openDrillDown = useCallback(
    (label: string, filters: { dept?: string; employeeId?: number; status?: string }) => {
      setDrillDown({ label, ...filters });
      setDrillVisible(REQUESTS_PAGE);
      setDrillLoading(true);
      requestsApi
        .list({ dept: filters.dept, employee_id: filters.employeeId, status: filters.status })
        .then((data) => setDrillRequests(data))
        .catch(() => setDrillRequests([]))
        .finally(() => setDrillLoading(false));
    },
    [],
  );

  const refreshDrill = useCallback(() => {
    if (!drillDown) return;
    requestsApi
      .list({ dept: drillDown.dept, employee_id: drillDown.employeeId, status: drillDown.status })
      .then((data) => setDrillRequests(data))
      .catch(() => {});
  }, [drillDown]);

  const applyFilter = () => {
    setFilterDept(draftDept);
    setFilterEmployee(draftEmployee);
  };

  const clearFilter = () => {
    setDraftDept('');
    setDraftEmployee('');
    setFilterDept('');
    setFilterEmployee('');
  };

  const handleConfirm = () => {
    setViewRequest(null);
    setActionError(null);
  };

  const handleApprove = async () => {
    if (!viewRequest) return;
    const id = (viewRequest as any).id ?? (viewRequest as any).uniq_id;
    if (!id) return;
    setConfirmAction(null);
    setActionLoading(true); setActionError(null);
    try {
      await requestsApi.approve(id);
      setViewRequest(null);
      fetchRequests();
      refreshDrill();
    } catch (e: any) {
      setActionError(e.message ?? 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!viewRequest) return;
    const id = (viewRequest as any).id ?? (viewRequest as any).uniq_id;
    if (!id) return;
    setConfirmAction(null);
    setActionLoading(true); setActionError(null);
    try {
      await requestsApi.reject(id);
      setViewRequest(null);
      fetchRequests();
      refreshDrill();
    } catch (e: any) {
      setActionError(e.message ?? 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    if (!viewRequest) return;
    const req     = viewRequest as any;
    const name    = req.emp_fullname ?? viewRequest.employee_name ?? '--';
    const dept    = req.emp_dept     ?? viewRequest.department    ?? '--';
    const type    = req.rqst_type   ?? viewRequest.type          ?? '--';
    const overall = viewRequest.status ?? 'Pending';
    const supSt   = req.sup_status   ?? 'Pending';
    const adminSt = req.admin_status ?? 'Pending';
    const subDate = fmtDT(req.encode_date ?? viewRequest.created_at);

    const bc = (s: string) => {
      const l = s.toLowerCase();
      return l === 'approved' ? 'badge-green' : (l === 'rejected' || l === 'denied') ? 'badge-red' : 'badge-gray';
    };
    const sigImg = (p: string | null | undefined) =>
      p ? `<img src="${BACKEND}/${p}" onerror="this.style.display='none'" alt="" />`
        : '<div style="width:160px;border-bottom:1.5px solid #9ca3af;display:inline-block;">&nbsp;</div>';

    const rows: string[] = [];
    if (type === 'Leave') {
      if (req.leave_type)  rows.push(`<tr><th>Leave Type</th><td>${req.leave_type}</td></tr>`);
      if (req.leave_from)  rows.push(`<tr><th>From</th><td>${fmtD(req.leave_from)}</td></tr>`);
      if (req.leave_to)    rows.push(`<tr><th>To</th><td>${fmtD(req.leave_to)}</td></tr>`);
      if (req.leave_total != null) rows.push(`<tr><th>Total Days</th><td>${req.leave_total}</td></tr>`);
    } else if (type === 'Overtime') {
      if (req.ot_date)      rows.push(`<tr><th>Date</th><td>${fmtD(req.ot_date)}</td></tr>`);
      if (req.ot_from)      rows.push(`<tr><th>From</th><td>${req.ot_from}</td></tr>`);
      if (req.ot_to)        rows.push(`<tr><th>To</th><td>${req.ot_to}</td></tr>`);
      if (req.ot_total != null) rows.push(`<tr><th>Total Hours</th><td>${req.ot_total}</td></tr>`);
      if (req.ot_work_done) rows.push(`<tr><th>Work Done</th><td>${req.ot_work_done}</td></tr>`);
    } else if (type === 'Change Shift') {
      if (req.cs_date)      rows.push(`<tr><th>Date</th><td>${fmtD(req.cs_date)}</td></tr>`);
      if (req.cs_old_shift) rows.push(`<tr><th>Old Shift</th><td>${req.cs_old_shift}</td></tr>`);
      if (req.cs_new_shift) rows.push(`<tr><th>New Shift</th><td>${req.cs_new_shift}</td></tr>`);
    } else if (type === 'Manual Punch') {
      if (req.mp_date)   rows.push(`<tr><th>Date</th><td>${fmtD(req.mp_date)}</td></tr>`);
      if (req.mp_time)   rows.push(`<tr><th>Time</th><td>${req.mp_time}</td></tr>`);
      if (req.mp_type)   rows.push(`<tr><th>Punch Type</th><td>${req.mp_type}</td></tr>`);
      if (req.mp_reason) rows.push(`<tr><th>Reason</th><td>${req.mp_reason}</td></tr>`);
    } else if (type === 'WFH') {
      if (req.wfh_date)     rows.push(`<tr><th>Date</th><td>${fmtD(req.wfh_date)}</td></tr>`);
      if (req.wfh_start)    rows.push(`<tr><th>Start</th><td>${req.wfh_start}</td></tr>`);
      if (req.wfh_end)      rows.push(`<tr><th>End</th><td>${req.wfh_end}</td></tr>`);
      if (req.wfh_activity) rows.push(`<tr><th>Activity</th><td>${req.wfh_activity}</td></tr>`);
      if (req.wfh_output)   rows.push(`<tr><th>Output</th><td>${req.wfh_output}</td></tr>`);
    } else if (type === 'Other') {
      if (req.other_type)       rows.push(`<tr><th>Type</th><td>${req.other_type}</td></tr>`);
      if (req.other_from_date)  rows.push(`<tr><th>From Date</th><td>${fmtD(req.other_from_date)}</td></tr>`);
      if (req.other_to_date)    rows.push(`<tr><th>To Date</th><td>${fmtD(req.other_to_date)}</td></tr>`);
      if (req.other_total_date != null) rows.push(`<tr><th>Total Days</th><td>${req.other_total_date}</td></tr>`);
      if (req.other_from_time)  rows.push(`<tr><th>From Time</th><td>${req.other_from_time}</td></tr>`);
      if (req.other_to_time)    rows.push(`<tr><th>To Time</th><td>${req.other_to_time}</td></tr>`);
      if (req.other_total_time != null) rows.push(`<tr><th>Total Time</th><td>${req.other_total_time}</td></tr>`);
    }

    const supFullName  = req.sup_fullname   || req.sup_name   || '';
    const admFullName  = req.admin_fullname || req.admin_name || '';

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${type} Request \u2013 ${name}</title>
<style>
  @page { size: auto; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 10pt; color: #222; padding: 15mm 15mm 20mm; }
  .header { text-align: center; border-bottom: 2px solid #1d4ed8; padding-bottom: 10px; margin-bottom: 12px; }
  .logo { max-height: 90px; max-width: 200px; width: auto; object-fit: contain; display: block; margin: 0 auto 4px; }
  .co { font-size: 15pt; font-weight: 700; color: #1d4ed8; }
  .addr { font-size: 9pt; color: #6b7280; margin-top: 3px; }
  .title { font-size: 11pt; font-weight: 600; color: #374151; margin-top: 6px; }
  .sec { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #374151; border-bottom: 1px solid #d1d5db; padding-bottom: 3px; margin: 10px 0 6px; }
  .info { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 8px 12px; margin-bottom: 12px; font-size: 9pt; }
  .info .k { color: #6b7280; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 8px; }
  th { background: #f3f4f6; padding: 4px 8px; border: 1px solid #e5e7eb; font-weight: 600; color: #374151; text-align: left; width: 40%; }
  td { padding: 3px 8px; border: 1px solid #e5e7eb; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 9pt; font-weight: 700; }
  .badge-green { background: #dcfce7; color: #16a34a; }
  .badge-red   { background: #fee2e2; color: #dc2626; }
  .badge-gray  { background: #f3f4f6; color: #6b7280; }
  .approver { color: #4b5563; font-size: 8pt; margin-left: 8px; }
  .sigs { display: flex; margin-top: 28px; border-top: 1px solid #e5e7eb; padding-top: 16px; }
  .sig-box { flex: 1; min-width: 0; text-align: center; padding: 0 20px; }
  .sig-box + .sig-box { border-left: 1px solid #e5e7eb; }
  .sig-space { height: 60px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 6px; }
  .sig-space img { max-height: 56px; max-width: 160px; object-fit: contain; display: block; }
  .sig-line { border-top: 1.5px solid #374151; padding-top: 5px; }
  .sig-name { font-weight: 700; font-size: 9pt; min-height: 1.2em; }
  .sig-pos  { font-size: 8pt; color: #6b7280; margin-top: 2px; min-height: 1em; }
  .sig-role { font-size: 8pt; color: #9ca3af; margin-top: 1px; }
  @media print { .no-print { display: none; } }
</style></head><body>
<div class="header">
  ${profile.logo_url ? `<img class="logo" src="${profile.logo_url}" onerror="this.style.display='none'" alt="" />` : ''}
  <div class="co">${profile.company_name}</div>
  ${profile.address ? `<div class="addr">${profile.address}</div>` : ''}
  <div class="title">${type} Request Form</div>
</div>
<div class="sec">Employee Information</div>
<div class="info">
  <div><span class="k">Name: </span>${name}</div>
  <div><span class="k">Department: </span>${dept}</div>
  <div><span class="k">Request Type: </span>${type}</div>
  <div><span class="k">Submitted: </span>${subDate}</div>
</div>
<div class="sec">Approval Status</div>
<table><tbody>
  <tr><th>Final Status</th><td><span class="badge ${bc(overall)}">${overall}</span></td></tr>
  <tr><th>Supervisor</th><td><span class="badge ${bc(supSt)}">${supSt}</span>${supFullName ? `<span class="approver">&#8212; ${supFullName}</span>` : ''}</td></tr>
  <tr><th>Admin</th><td><span class="badge ${bc(adminSt)}">${adminSt}</span>${admFullName ? `<span class="approver">&#8212; ${admFullName}</span>` : ''}</td></tr>
</tbody></table>
${rows.length > 0 ? `<div class="sec">${type} Details</div><table><tbody>${rows.join('')}</tbody></table>` : ''}
${req.reason ? `<div class="sec">Reason / Notes</div><p style="font-size:9pt;padding:6px 8px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;margin-bottom:8px">${req.reason}</p>` : ''}
<div class="sigs">
  <div class="sig-box">
    <div class="sig-space">${sigImg(req.emp_sign)}</div>
    <div class="sig-line">
      <div class="sig-name">${name}</div>
      <div class="sig-pos">${req.emp_position ?? ''}</div>
      <div class="sig-role">Employee Requestor</div>
    </div>
  </div>
  <div class="sig-box">
    <div class="sig-space">${sigImg(req.sup_sign)}</div>
    <div class="sig-line">
      <div class="sig-name">${supFullName || '&nbsp;'}</div>
      <div class="sig-pos">${req.sup_position ?? '&nbsp;'}</div>
      <div class="sig-role">Supervisor</div>
    </div>
  </div>
  <div class="sig-box">
    <div class="sig-space">${sigImg(req.admin_sign)}</div>
    <div class="sig-line">
      <div class="sig-name">${admFullName || '&nbsp;'}</div>
      <div class="sig-pos">${req.admin_position ?? '&nbsp;'}</div>
      <div class="sig-role">Administrator</div>
    </div>
  </div>
</div>
</body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.onafterprint = () => win.close();
  };

  // ── Helpers ───────────────────────────────────────────────
  const getDisplayStatus = (req: LeaveRequest) => {
    if (userRole === 'admin')      return (req as any).admin_status || req.status || 'Pending';
    if (userRole === 'supervisor') return (req as any).sup_status   || req.status || 'Pending';
    return req.status || 'Pending';
  };

  const statusBadge = (s: string) => {
    const l = s.toLowerCase();
    if (l === 'approved') return 'bg-green-100 text-green-700';
    if (l === 'rejected' || l === 'denied') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-500';
  };

  const isUrgent = (req: LeaveRequest) => {
    if (getDisplayStatus(req).toLowerCase() !== 'pending') return false;
    const d = req.effective_date;
    if (!d) return false;
    const today = new Date(); today.setHours(0,0,0,0);
    const days = Math.floor((new Date(d).getTime() - today.getTime()) / 86400000);
    return days >= 0 && days <= 3;
  };

  return (
    <>
      <div className="space-y-4 md:space-y-6">

        {/* Main Panel with Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`${activeView === 'requests' ? 'bg-blue-500' : 'bg-red-500'} text-white rounded-lg p-2`}>
                {activeView === 'requests' ? <Shield size={24} /> : <Building2 size={24} />}
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                {activeView === 'requests' ? 'All Requests' : 'Reports Summary'}
              </h2>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveView('requests')}
                disabled={activeView === 'requests'}
                className={`p-2 rounded-lg transition-all ${
                  activeView === 'requests'
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setActiveView('summary')}
                disabled={activeView === 'summary'}
                className={`p-2 rounded-lg transition-all ${
                  activeView === 'summary'
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* ── Requests View ── */}
          {activeView === 'requests' && (
            <>
              {/* Filter form */}
              <div className="flex flex-wrap gap-3 mb-5 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <select
                  value={draftDept}
                  onChange={(e) => setDraftDept(e.target.value)}
                  className="flex-1 min-w-[140px] text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Filter by employee name"
                  value={draftEmployee}
                  onChange={(e) => setDraftEmployee(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                  className="flex-1 min-w-[180px] text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />

                <button
                  onClick={applyFilter}
                  className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 flex items-center gap-1.5 transition-colors"
                >
                  <Filter size={14} /> Filter
                </button>

                {(filterDept || filterEmployee) && (
                  <button
                    onClick={clearFilter}
                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {reqLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <Loader2 size={28} className="animate-spin mr-2" />
                  <span>Loading...</span>
                </div>
              ) : requests.length === 0 ? (
                <p className="text-center py-12 text-gray-400">No requests found.</p>
              ) : (
                <>
                  {/* Requests Table */}
                  <div className={requestsVisible > REQUESTS_PAGE ? 'overflow-y-auto max-h-[420px] rounded-lg border border-gray-100' : ''}>
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-white z-10 shadow-sm">
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-2 px-3 text-gray-600 font-semibold">Employee</th>
                          <th className="text-left py-2 px-3 text-gray-600 font-semibold hidden sm:table-cell">Dept</th>
                          <th className="text-left py-2 px-3 text-gray-600 font-semibold hidden md:table-cell">Submitted</th>
                          <th className="text-left py-2 px-3 text-gray-600 font-semibold hidden md:table-cell">Req. Date</th>
                          <th className="text-left py-2 px-3 text-gray-600 font-semibold">Type</th>
                          <th className="text-left py-2 px-3 text-gray-600 font-semibold">Status</th>
                          <th className="text-center py-2 px-3 text-gray-600 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests.slice(0, requestsVisible).map((req) => (
                          <tr
                            key={(req as any).uniq_id ?? req.id}
                            className={`border-b border-gray-100 transition-colors ${
                              isUrgent(req) ? 'bg-red-200 hover:bg-red-300 border-l-4 border-red-600' : 'hover:bg-blue-50'
                            }`}
                          >
                            <td className="py-2 px-3 font-medium text-gray-800">{(req as any).emp_fullname ?? req.employee_name}</td>
                            <td className="py-2 px-3 hidden sm:table-cell">
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{(req as any).emp_dept ?? req.department}</span>
                            </td>
                            <td className="py-2 px-3 text-gray-500 hidden md:table-cell">{fmtDT((req as any).encode_date ?? req.created_at)}</td>
                            <td className="py-2 px-3 text-gray-500 hidden md:table-cell">{fmtD((req as any).effective_date)}</td>
                            <td className="py-2 px-3 text-gray-700">{(req as any).rqst_type ?? req.type}</td>
                            <td className="py-2 px-3">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-semibold capitalize ${statusBadge(getDisplayStatus(req))}`}>
                                {getDisplayStatus(req)}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => setViewRequest(req)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors"
                              >
                                <Eye size={12} /> View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex gap-3 mt-3 justify-center flex-wrap">
                    {requests.length > requestsVisible && (
                      <>
                        <button
                          onClick={() => setRequestsVisible((v) => v + REQUESTS_PAGE)}
                          className="px-4 py-1.5 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                        >
                          See More (+{Math.min(REQUESTS_PAGE, requests.length - requestsVisible)})
                        </button>
                        <button
                          onClick={() => setRequestsVisible(requests.length)}
                          className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                        >
                          See All ({requests.length})
                        </button>
                      </>
                    )}
                    {requestsVisible > REQUESTS_PAGE && (
                      <button
                        onClick={() => setRequestsVisible(REQUESTS_PAGE)}
                        className="px-4 py-1.5 text-sm bg-gray-100 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-1"
                      >
                        <ChevronUp size={14} /> Collapse
                      </button>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── Summary View ── */}
          {activeView === 'summary' && (
            <div className="space-y-8">
              {/* Department Summary */}
              <div>
                <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center space-x-2">
                  <Building2 className="text-red-500" size={20} />
                  <span>Department Summary</span>
                </h3>

                {sumLoading ? (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <Loader2 size={24} className="animate-spin mr-2" /><span>Loading...</span>
                  </div>
                ) : deptSummary.length === 0 ? (
                  <p className="text-center py-6 text-gray-400">No data available.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {deptSummary.slice(0, deptVisible).map((dept, i) => (
                        <div key={i} className="p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-gray-800">{dept.department}</h4>
                            {Number(dept.pending) > 0 && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                                {dept.pending} pending
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-5 gap-2 text-sm">
                            <div className="text-center">
                              <p className="text-gray-500 mb-1 text-xs">Total</p>
                              <button onClick={() => openDrillDown(`${dept.department} -- All`, { dept: dept.department })} className="text-xl font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer">
                                {dept.total_requests}
                              </button>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-500 mb-1 text-xs">Pending</p>
                              <button onClick={() => openDrillDown(`${dept.department} -- Pending`, { dept: dept.department, status: 'Pending' })} className="text-xl font-bold text-yellow-600 hover:text-yellow-800 hover:underline cursor-pointer">
                                {dept.pending}
                              </button>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-500 mb-1 text-xs">Approved</p>
                              <button onClick={() => openDrillDown(`${dept.department} -- Approved`, { dept: dept.department, status: 'Approved' })} className="text-xl font-bold text-green-600 hover:text-green-800 hover:underline cursor-pointer">
                                {dept.approved}
                              </button>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-500 mb-1 text-xs">Rejected</p>
                              <button onClick={() => openDrillDown(`${dept.department} -- Rejected`, { dept: dept.department, status: 'Rejected' })} className="text-xl font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer">
                                {dept.rejected}
                              </button>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-500 mb-1 text-xs">Cancelled</p>
                              <button onClick={() => openDrillDown(`${dept.department} -- Cancelled`, { dept: dept.department, status: 'Cancelled' })} className="text-xl font-bold text-gray-500 hover:text-gray-700 hover:underline cursor-pointer">
                                {dept.cancelled}
                              </button>
                            </div>
                          </div>
                          {dept.nearest_pending_date && (
                            <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                              <Calendar size={12} /> Nearest pending: {dept.nearest_pending_date.slice(0, 10)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {deptSummary.length > deptVisible && (
                      <div className="flex gap-3 mt-4 justify-center">
                        <button
                          onClick={() => setDeptVisible((v) => v + SUMMARY_PAGE)}
                          className="px-5 py-2 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                        >
                          See More (+{Math.min(SUMMARY_PAGE, deptSummary.length - deptVisible)})
                        </button>
                        <button
                          onClick={() => setDeptVisible(deptSummary.length)}
                          className="px-5 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                        >
                          See All ({deptSummary.length})
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Employee Summary */}
              <div>
                <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center space-x-2">
                  <Users className="text-blue-500" size={20} />
                  <span>Employee Summary</span>
                </h3>

                {sumLoading ? (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <Loader2 size={24} className="animate-spin mr-2" /><span>Loading...</span>
                  </div>
                ) : empSummary.length === 0 ? (
                  <p className="text-center py-6 text-gray-400">No data available.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {empSummary.slice(0, empVisible).map((emp, i) => (
                        <div key={i} className="p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-gray-800">{emp.employee_name}</h4>
                            <span className="text-xs px-2 py-1 bg-white rounded text-gray-600">{emp.department}</span>
                          </div>
                          <div className="grid grid-cols-5 gap-2 text-sm mb-2">
                            <div className="text-center">
                              <p className="text-gray-500 mb-1 text-xs">Total</p>
                              <button onClick={() => openDrillDown(`${emp.employee_name} -- All`, { employeeId: emp.employee_id })} className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer">
                                {emp.total_requests}
                              </button>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-500 mb-1 text-xs">Pending</p>
                              <button onClick={() => openDrillDown(`${emp.employee_name} -- Pending`, { employeeId: emp.employee_id, status: 'Pending' })} className="font-bold text-yellow-600 hover:text-yellow-800 hover:underline cursor-pointer">
                                {emp.pending}
                              </button>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-500 mb-1 text-xs">Approved</p>
                              <button onClick={() => openDrillDown(`${emp.employee_name} -- Approved`, { employeeId: emp.employee_id, status: 'Approved' })} className="font-bold text-green-600 hover:text-green-800 hover:underline cursor-pointer">
                                {emp.approved}
                              </button>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-500 mb-1 text-xs">Rejected</p>
                              <button onClick={() => openDrillDown(`${emp.employee_name} -- Rejected`, { employeeId: emp.employee_id, status: 'Rejected' })} className="font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer">
                                {emp.rejected}
                              </button>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-500 mb-1 text-xs">Cancelled</p>
                              <button onClick={() => openDrillDown(`${emp.employee_name} -- Cancelled`, { employeeId: emp.employee_id, status: 'Cancelled' })} className="font-bold text-gray-500 hover:text-gray-700 hover:underline cursor-pointer">
                                {emp.cancelled}
                              </button>
                            </div>
                          </div>
                          {emp.nearest_pending_date && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar size={12} /> Nearest pending: {emp.nearest_pending_date.slice(0, 10)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {empSummary.length > empVisible && (
                      <div className="flex gap-3 mt-4 justify-center">
                        <button
                          onClick={() => setEmpVisible((v) => v + SUMMARY_PAGE)}
                          className="px-5 py-2 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                        >
                          See More (+{Math.min(SUMMARY_PAGE, empSummary.length - empVisible)})
                        </button>
                        <button
                          onClick={() => setEmpVisible(empSummary.length)}
                          className="px-5 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                        >
                          See All ({empSummary.length})
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Password Reset Requests Panel (admin only) ─────────── */}
        {userRole === 'admin' && (
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-purple-500 text-white rounded-lg p-2"><KeyRound size={18} /></div>
                <div>
                  <h3 className="font-bold text-gray-800">Password Reset Requests</h3>
                  <p className="text-xs text-gray-500">Pending account recovery tickets</p>
                </div>
              </div>
              <button onClick={loadResetRequests} className="text-gray-400 hover:text-gray-600 p-1 rounded">
                {resetLoading ? <Loader2 size={16} className="animate-spin" /> : <span className="text-xs text-blue-500 font-medium">Refresh</span>}
              </button>
            </div>

            {resetLoading ? (
              <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-gray-400" /></div>
            ) : resetRequests.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No pending password reset requests.</p>
            ) : (
              <div className="space-y-2">
                {resetRequests.map((req) => (
                  <div key={req.id} className="border border-purple-100 bg-purple-50 rounded-lg p-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800">{req.emp_fullname ?? req.identifier}</p>
                        {req.emp_dept && <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-px">{req.emp_dept}</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Identifier: {req.identifier}</p>
                      {req.message && <p className="text-xs text-gray-600 mt-1 italic">"{req.message}"</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(req.requested_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {isReadOnly ? (
                        <span className="text-xs text-yellow-600 font-medium px-2 py-1 bg-yellow-50 rounded-lg">Read-only</span>
                      ) : (
                      <>
                      <button
                        onClick={() => handleApproveReset(req)}
                        disabled={resetActionLoading === req.id}
                        title="Approve -- generates a new temp password"
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        {resetActionLoading === req.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectReset(req)}
                        disabled={resetActionLoading === req.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-lg transition-colors"
                      >
                        <XCircle size={12} />
                        Reject
                      </button>
                      </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
      
      {drillDown && (
        <div className="fixed inset-0 z-[45] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrillDown(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col z-10">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{drillDown.label}</h3>
                {drillDown.status && (
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${
                    drillDown.status === 'Approved' ? 'bg-green-100 text-green-700' :
                    drillDown.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{drillDown.status} requests</span>
                )}
              </div>
              <button onClick={() => setDrillDown(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {drillLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <Loader2 size={28} className="animate-spin mr-2" /><span>Loading...</span>
                </div>
              ) : drillRequests.length === 0 ? (
                <p className="text-center py-12 text-gray-400">No requests found.</p>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-white z-10 shadow-sm">
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-2 px-3 text-gray-600 font-semibold">Employee</th>
                          <th className="text-left py-2 px-3 text-gray-600 font-semibold">Dept</th>
                          <th className="text-left py-2 px-3 text-gray-600 font-semibold">Submitted</th>
                          <th className="text-left py-2 px-3 text-gray-600 font-semibold">Req. Date</th>
                          <th className="text-left py-2 px-3 text-gray-600 font-semibold">Type</th>
                          <th className="text-left py-2 px-3 text-gray-600 font-semibold">Status</th>
                          <th className="text-center py-2 px-3 text-gray-600 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {drillRequests.slice(0, drillVisible).map((req) => (
                          <tr
                            key={(req as any).uniq_id ?? req.id}
                            className={`border-b border-gray-100 transition-colors ${
                              isUrgent(req) ? 'bg-red-200 hover:bg-red-300 border-l-4 border-red-600' : 'hover:bg-blue-50'
                            }`}
                          >
                            <td className="py-2 px-3 font-medium text-gray-800">{(req as any).emp_fullname ?? req.employee_name}</td>
                            <td className="py-2 px-3"><span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{(req as any).emp_dept ?? req.department}</span></td>
                            <td className="py-2 px-3 text-gray-500">{fmtDT((req as any).encode_date ?? req.created_at)}</td>
                            <td className="py-2 px-3 text-gray-500">{fmtD((req as any).effective_date)}</td>
                            <td className="py-2 px-3 text-gray-700">{(req as any).rqst_type ?? req.type}</td>
                            <td className="py-2 px-3">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-semibold capitalize ${statusBadge(getDisplayStatus(req))}`}>
                                {getDisplayStatus(req)}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => setViewRequest(req)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors"
                              >
                                <Eye size={12} /> View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-3 mt-3 justify-center flex-wrap">
                    {drillRequests.length > drillVisible && (
                      <>
                        <button onClick={() => setDrillVisible((v) => v + REQUESTS_PAGE)} className="px-4 py-1.5 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                          See More (+{Math.min(REQUESTS_PAGE, drillRequests.length - drillVisible)})
                        </button>
                        <button onClick={() => setDrillVisible(drillRequests.length)} className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
                          See All ({drillRequests.length})
                        </button>
                      </>
                    )}
                    {drillVisible > REQUESTS_PAGE && (
                      <button onClick={() => setDrillVisible(REQUESTS_PAGE)} className="px-4 py-1.5 text-sm bg-gray-100 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-1">
                        <ChevronUp size={14} /> Collapse
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {viewRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setViewRequest(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-lg text-gray-800">Request Details</h3>
              <button onClick={() => setViewRequest(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-500 mb-0.5">Employee</p><p className="font-semibold text-gray-800">{(viewRequest as any).emp_fullname ?? viewRequest.employee_name ?? '--'}</p></div>
                <div><p className="text-xs text-gray-500 mb-0.5">Department</p><p className="font-semibold text-gray-800">{(viewRequest as any).emp_dept ?? viewRequest.department ?? '--'}</p></div>
                <div><p className="text-xs text-gray-500 mb-0.5">Request Type</p><p className="font-semibold text-gray-800">{(viewRequest as any).rqst_type ?? viewRequest.type ?? '--'}</p></div>
                <div><p className="text-xs text-gray-500 mb-0.5">Submitted</p><p className="font-semibold text-gray-800">{fmtDT((viewRequest as any).encode_date ?? viewRequest.created_at)}</p></div>
              </div>
              {/* Status info */}
              <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-500 mb-0.5">Final Status</p><span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${statusBadge(viewRequest.status ?? 'Pending')}`}>{viewRequest.status ?? 'Pending'}</span></div>
                <div><p className="text-xs text-gray-500 mb-0.5">Admin Status</p><span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${statusBadge((viewRequest as any).admin_status ?? 'Pending')}`}>{(viewRequest as any).admin_status ?? 'Pending'}</span></div>
                <div><p className="text-xs text-gray-500 mb-0.5">Supervisor Status</p><span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${statusBadge((viewRequest as any).sup_status ?? 'Pending')}`}>{(viewRequest as any).sup_status ?? 'Pending'}</span></div>
                {(viewRequest as any).admin_name && <div><p className="text-xs text-gray-500 mb-0.5">Admin</p><p className="font-medium text-gray-700">{(viewRequest as any).admin_name}</p></div>}
                {(viewRequest as any).sup_name && <div><p className="text-xs text-gray-500 mb-0.5">Supervisor</p><p className="font-medium text-gray-700">{(viewRequest as any).sup_name}</p></div>}
              </div>

              {/* Leave */}
              {((viewRequest as any).rqst_type === 'Leave' || viewRequest.type === 'Leave') && (
                <div className="border border-blue-100 rounded-lg p-3 bg-blue-50">
                  <p className="text-xs font-semibold text-blue-600 uppercase mb-2">Leave Details</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(viewRequest as any).leave_type && <div><p className="text-xs text-gray-500">Leave Type</p><p className="font-medium">{(viewRequest as any).leave_type}</p></div>}
                    {(viewRequest as any).leave_from && <div><p className="text-xs text-gray-500">From</p><p className="font-medium">{fmtD((viewRequest as any).leave_from)}</p></div>}
                    {(viewRequest as any).leave_to && <div><p className="text-xs text-gray-500">To</p><p className="font-medium">{fmtD((viewRequest as any).leave_to)}</p></div>}
                    {(viewRequest as any).leave_total && <div><p className="text-xs text-gray-500">Total Days</p><p className="font-medium">{(viewRequest as any).leave_total}</p></div>}
                  </div>
                </div>
              )}

              {/* Overtime */}
              {((viewRequest as any).rqst_type === 'Overtime' || viewRequest.type === 'Overtime') && (
                <div className="border border-yellow-100 rounded-lg p-3 bg-yellow-50">
                  <p className="text-xs font-semibold text-yellow-600 uppercase mb-2">Overtime Details</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(viewRequest as any).ot_date && <div><p className="text-xs text-gray-500">Date</p><p className="font-medium">{fmtD((viewRequest as any).ot_date)}</p></div>}
                    {(viewRequest as any).ot_from && <div><p className="text-xs text-gray-500">From</p><p className="font-medium">{(viewRequest as any).ot_from}</p></div>}
                    {(viewRequest as any).ot_to && <div><p className="text-xs text-gray-500">To</p><p className="font-medium">{(viewRequest as any).ot_to}</p></div>}
                    {(viewRequest as any).ot_total && <div><p className="text-xs text-gray-500">Total Hours</p><p className="font-medium">{(viewRequest as any).ot_total}</p></div>}
                    {(viewRequest as any).ot_work_done && <div className="col-span-2"><p className="text-xs text-gray-500">Work Done</p><p className="font-medium">{(viewRequest as any).ot_work_done}</p></div>}
                  </div>
                </div>
              )}

              {/* Change Shift */}
              {((viewRequest as any).rqst_type === 'Change Shift' || viewRequest.type === 'Change Shift') && (
                <div className="border border-purple-100 rounded-lg p-3 bg-purple-50">
                  <p className="text-xs font-semibold text-purple-600 uppercase mb-2">Change Shift Details</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(viewRequest as any).cs_date && <div><p className="text-xs text-gray-500">Date</p><p className="font-medium">{fmtD((viewRequest as any).cs_date)}</p></div>}
                    {(viewRequest as any).cs_old_shift && <div><p className="text-xs text-gray-500">Old Shift</p><p className="font-medium">{(viewRequest as any).cs_old_shift}</p></div>}
                    {(viewRequest as any).cs_new_shift && <div><p className="text-xs text-gray-500">New Shift</p><p className="font-medium">{(viewRequest as any).cs_new_shift}</p></div>}
                  </div>
                </div>
              )}

              {/* Manual Punch */}
              {((viewRequest as any).rqst_type === 'Manual Punch' || viewRequest.type === 'Manual Punch') && (
                <div className="border border-orange-100 rounded-lg p-3 bg-orange-50">
                  <p className="text-xs font-semibold text-orange-600 uppercase mb-2">Manual Punch Details</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(viewRequest as any).mp_date && <div><p className="text-xs text-gray-500">Date</p><p className="font-medium">{fmtD((viewRequest as any).mp_date)}</p></div>}
                    {(viewRequest as any).mp_time && <div><p className="text-xs text-gray-500">Time</p><p className="font-medium">{(viewRequest as any).mp_time}</p></div>}
                    {(viewRequest as any).mp_type && <div><p className="text-xs text-gray-500">Punch Type</p><p className="font-medium">{(viewRequest as any).mp_type}</p></div>}
                    {(viewRequest as any).mp_reason && <div className="col-span-2"><p className="text-xs text-gray-500">Reason</p><p className="font-medium">{(viewRequest as any).mp_reason}</p></div>}
                    {(viewRequest as any).mp_proof && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 mb-1.5">Proof / Document</p>
                        {/\.(jpe?g|png|gif|webp)$/i.test((viewRequest as any).mp_proof) ? (
                          <div className="space-y-1.5">
                            <img
                              src={`${BACKEND}/backend/${(viewRequest as any).mp_proof}`}
                              alt="Proof"
                              className="max-w-full rounded-lg border border-gray-200 shadow-sm max-h-48 object-contain"
                            />
                            <a
                              href={`${BACKEND}/backend/${(viewRequest as any).mp_proof}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                              Open full image
                            </a>
                          </div>
                        ) : (
                          <a
                            href={`${BACKEND}/backend/${(viewRequest as any).mp_proof}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2"
                          >
                            View Proof
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* WFH */}
              {((viewRequest as any).rqst_type === 'WFH' || viewRequest.type === 'WFH') && (
                <div className="border border-green-100 rounded-lg p-3 bg-green-50">
                  <p className="text-xs font-semibold text-green-600 uppercase mb-2">WFH Details</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(viewRequest as any).wfh_date && <div><p className="text-xs text-gray-500">Date</p><p className="font-medium">{(viewRequest as any).wfh_date}</p></div>}
                    {(viewRequest as any).wfh_start && <div><p className="text-xs text-gray-500">Start</p><p className="font-medium">{(viewRequest as any).wfh_start}</p></div>}
                    {(viewRequest as any).wfh_end && <div><p className="text-xs text-gray-500">End</p><p className="font-medium">{(viewRequest as any).wfh_end}</p></div>}
                    {(viewRequest as any).wfh_activity && <div className="col-span-2"><p className="text-xs text-gray-500">Activity</p><p className="font-medium">{(viewRequest as any).wfh_activity}</p></div>}
                    {(viewRequest as any).wfh_output && <div className="col-span-2"><p className="text-xs text-gray-500">Output</p><p className="font-medium">{(viewRequest as any).wfh_output}</p></div>}
                  </div>
                </div>
              )}

              {/* Other */}
              {((viewRequest as any).rqst_type === 'Other' || viewRequest.type === 'Other') && (
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Other Details</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(viewRequest as any).other_type && <div><p className="text-xs text-gray-500">Type</p><p className="font-medium">{(viewRequest as any).other_type}</p></div>}
                    {(viewRequest as any).other_from_date && <div><p className="text-xs text-gray-500">From Date</p><p className="font-medium">{(viewRequest as any).other_from_date}</p></div>}
                    {(viewRequest as any).other_to_date && <div><p className="text-xs text-gray-500">To Date</p><p className="font-medium">{(viewRequest as any).other_to_date}</p></div>}
                    {(viewRequest as any).other_total_date && <div><p className="text-xs text-gray-500">Total Days</p><p className="font-medium">{(viewRequest as any).other_total_date}</p></div>}
                    {(viewRequest as any).other_from_time && <div><p className="text-xs text-gray-500">From Time</p><p className="font-medium">{(viewRequest as any).other_from_time}</p></div>}
                    {(viewRequest as any).other_to_time && <div><p className="text-xs text-gray-500">To Time</p><p className="font-medium">{(viewRequest as any).other_to_time}</p></div>}
                    {(viewRequest as any).other_total_time && <div><p className="text-xs text-gray-500">Total Time</p><p className="font-medium">{(viewRequest as any).other_total_time}</p></div>}
                  </div>
                </div>
              )}

              {/* Reason */}
              {viewRequest.reason && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Reason / Notes</p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{viewRequest.reason}</p>
                </div>
              )}
            </div>

            {/* Action footer */}
            {(() => {
              const req = viewRequest as any;
              const myStatus = userRole === 'admin' ? (req.admin_status ?? 'Pending') : (req.sup_status ?? 'Pending');
              const isLocked = myStatus === 'Approved' || myStatus === 'Rejected';
              return (
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-5 py-4 flex items-center gap-3 flex-wrap">
                {actionError && (
                  <p className="w-full text-xs text-red-600">{actionError}</p>
                )}
                {isLocked ? (
                  <div className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold ${myStatus === 'Approved' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {myStatus === 'Approved' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    This request has already been {myStatus}. No further changes are allowed.
                  </div>
                ) : isReadOnly ? (
                  <div className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
                    <AlertTriangle size={16} className="flex-shrink-0" />
                    Read-only access — approval actions are not available for this account.
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setConfirmAction('approve')}
                      disabled={actionLoading}
                      className="flex-1 min-w-[90px] inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                      Approve
                    </button>
                    <button
                      onClick={() => setConfirmAction('reject')}
                      disabled={actionLoading}
                      className="flex-1 min-w-[90px] inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
                >
                  <Printer size={14} /> Print
                </button>
              </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Confirm Approve/Reject Modal ─────────────────────────────── */}
      {confirmAction && viewRequest && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmAction(null)} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${confirmAction === 'approve' ? 'bg-green-100' : 'bg-red-100'}`}>
              {confirmAction === 'approve' ? <CheckCircle size={24} className="text-green-600" /> : <XCircle size={24} className="text-red-600" />}
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {confirmAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              <strong>{(viewRequest as any).emp_fullname ?? viewRequest.employee_name ?? '--'}</strong> -- {(viewRequest as any).rqst_type ?? viewRequest.type ?? '--'}
            </p>
            <p className={`text-sm mb-5 p-3 rounded-lg ${confirmAction === 'approve' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {confirmAction === 'approve'
                ? 'Once approved, this decision cannot be changed.'
                : 'Once rejected, this decision cannot be changed.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 text-sm">
                Cancel
              </button>
              <button
                onClick={confirmAction === 'approve' ? handleApprove : handleReject}
                disabled={actionLoading}
                className={`flex-1 px-4 py-2.5 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 ${confirmAction === 'approve' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                {confirmAction === 'approve' ? 'Yes, Approve' : 'Yes, Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Temp Password Reveal Modal ─────────────────────────────── */}
      {revealPassword && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="bg-green-500 rounded-t-2xl p-5 text-white text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-2">
                <KeyRound size={22} />
              </div>
              <h3 className="text-lg font-bold">Password Reset Approved</h3>
              <p className="text-sm text-white/80 mt-0.5">Temporary password for {revealPassword.name}</p>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                <AlertTriangle size={16} className="flex-shrink-0" />
                <span><strong>This password is shown once only.</strong> Copy it now -- it will not be visible again after you close this dialog.</span>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1 font-medium">Temporary Password</p>
                <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2.5">
                  <code className="flex-1 font-mono text-sm font-bold text-gray-800 tracking-widest select-all">
                    {revealPassword.password}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(revealPassword.password);
                      setCopiedPw(true);
                      setTimeout(() => setCopiedPw(false), 2500);
                    }}
                    className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0 ${
                      copiedPw ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {copiedPw ? <><CheckCircle size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                The user will be required to change this password upon their next login.
              </p>

              <button
                onClick={() => { setRevealPassword(null); setCopiedPw(false); }}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                I have copied the password -- Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
