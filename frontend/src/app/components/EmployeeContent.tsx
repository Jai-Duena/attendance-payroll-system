import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Briefcase,
  ChevronLeft,
  ChevronRight,
  FileEdit,
  ClockIcon,
  Repeat,
  HandIcon,
  Plus,
  X,
  Eye,
  Loader2,
  ChevronUp,
  Printer
} from 'lucide-react';
import { useCompany } from '../context/CompanyContext';
import { requestsApi, employeesApi, attendanceApi, type LeaveRequest, type EmployeeMe, type ShiftPreset, type AttendanceRecord } from '@/lib/api';
import TimeSelect from './TimeSelect';

const REQ_TYPES  = ['Leave', 'Overtime', 'Change Shift', 'Manual Punch'] as const;
const LEAVE_TYPES = [
  'Vacation Leave', 'Sick Leave', 'Emergency Leave',
  'Maternity Leave', 'Paternity Leave',
  'Solo Parent Leave', 'VAWC Leave', 'Gynecological Leave',
  'Leave Without Pay', 'Change Rest Day',
];
// Leaves restricted by gender (null = all genders)
const FEMALE_ONLY_LEAVES = ['Maternity Leave', 'VAWC Leave', 'Gynecological Leave'];
const MALE_ONLY_LEAVES   = ['Paternity Leave'];
// Leaves that always span a date range — one-day toggle not applicable
const NO_ONE_DAY_LEAVES  = ['Maternity Leave', 'Paternity Leave', 'Gynecological Leave'];
// Leaves that support halfday/undertime (full-day only leaves excluded)
const LEAVE_TYPES_WITH_PERIOD = LEAVE_TYPES.filter(
  (t) => !['Maternity Leave', 'Paternity Leave', 'VAWC Leave', 'Gynecological Leave'].includes(t)
);
const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) ?? '';
const PAGE = 5;

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
const fmtTime = (v: string | null | undefined): string => {
  if (!v) return '--';
  const d = new Date(v.includes('T') ? v : v.replace(' ', 'T'));
  return isNaN(d.getTime()) ? (v as string) : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// Converts a decimal-day leave balance to "X day(s) Y hr(s)" using an 8-hour workday
const fmtLeaveBalance = (days: number): string => {
  const wholeDays = Math.floor(days);
  const remHours  = Math.round((days - wholeDays) * 8);
  if (wholeDays === 0 && remHours === 0) return '0 days';
  if (wholeDays === 0) return `${remHours} hr${remHours !== 1 ? 's' : ''}`;
  if (remHours === 0)  return `${wholeDays} day${wholeDays !== 1 ? 's' : ''}`;
  return `${wholeDays} day${wholeDays !== 1 ? 's' : ''} ${remHours} hr${remHours !== 1 ? 's' : ''}`;
};

export default function EmployeeContent() {
  const { profile } = useCompany();
  const [activeView, setActiveView] = useState<'requests' | 'summary'>('requests');

  // Data
  const [requests, setRequests]     = useState<LeaveRequest[]>([]);
  const [loading, setLoading]       = useState(false);
  const [empInfo, setEmpInfo]       = useState<EmployeeMe | null>(null);
  const [visible, setVisible]       = useState(PAGE);

  // Modal
  const [modalOpen, setModalOpen]   = useState(false);
  const [formType, setFormType]     = useState<string>('Leave');
  const [form, setForm]             = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mpProofFile,    setMpProofFile]    = useState<File | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [leaveOneDay,    setLeaveOneDay]    = useState(false);
  const [mpAttRecord,  setMpAttRecord]  = useState<AttendanceRecord | null>(null);
  const [mpAttLoading, setMpAttLoading] = useState(false);
  const [mpAddSecond,  setMpAddSecond]  = useState(false);

  // Shift presets (for Change Shift form)
  const [shiftPresets, setShiftPresets] = useState<ShiftPreset[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(false);

  // View modal (read-only)
  const [viewRequest, setViewRequest] = useState<LeaveRequest | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Summary drill-down (filter from local data)
  const [summaryDrill, setSummaryDrill] = useState<{ label: string; items: LeaveRequest[] } | null>(null);

  const handlePrint = () => {
    if (!viewRequest) return;
    const req     = viewRequest as any;
    const name    = req.emp_fullname ?? empInfo?.employee_name ?? '--';
    const dept    = req.emp_dept     ?? empInfo?.emp_dept      ?? '--';
    const type    = req.rqst_type   ?? viewRequest.type        ?? '--';
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
      if (req.emergency_type) rows.push(`<tr><th>Emergency Type</th><td>${req.emergency_type}</td></tr>`);
      if (req.lwop_type)   rows.push(`<tr><th>Duration Type</th><td>${req.lwop_type}${req.leave_period ? ` (${req.leave_period})` : ''}</td></tr>`);
      if (req.lwop_time_from && req.lwop_time_to) rows.push(`<tr><th>Undertime</th><td>${req.lwop_time_from} – ${req.lwop_time_to}</td></tr>`);
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

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      requestsApi.myRequests().catch(() => []),
      employeesApi.me().catch(() => null),
    ]).then(([reqs, emp]) => {
      setRequests(reqs as LeaveRequest[]);
      if (emp) setEmpInfo(emp as EmployeeMe);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch existing attendance record when date changes in Manual Punch mode
  useEffect(() => {
    if (formType !== 'Manual Punch' || !form.mp_date) { setMpAttRecord(null); setMpAttLoading(false); return; }
    let cancelled = false;
    setMpAttLoading(true);
    attendanceApi.recordForDate(form.mp_date, empInfo?.employee_id)
      .then(res => { if (!cancelled) setMpAttRecord(res.data); })
      .catch(() => { if (!cancelled) setMpAttRecord(null); })
      .finally(() => { if (!cancelled) setMpAttLoading(false); });
    return () => { cancelled = true; };
  }, [formType, form.mp_date, empInfo?.employee_id]);

  // Auto-calc leave days (8-hour workday basis)
  const leaveDays = (() => {
    if (formType !== 'Leave' || !form.leave_from) return 0;
    // AM Only or PM Only = 0.5
    if (LEAVE_TYPES_WITH_PERIOD.includes(form.leave_type) && (form.lwop_type === 'AM' || form.lwop_type === 'PM')) return 0.5;
    const toDate = leaveOneDay ? form.leave_from : form.leave_to;
    if (!toDate) return 0;
    const from = new Date(form.leave_from);
    const to   = new Date(toDate);
    if (to < from) return 0;
    return Math.floor((to.getTime() - from.getTime()) / 86400000) + 1;
  })();

  // Maternity entitlement hint (RA 11210 — 105 days for all outcomes)
  const maternityEntitlement = (() => {
    if (form.leave_type !== 'Maternity Leave') return null;
    const base  = 105; // All instances (childbirth, miscarriage, emergency termination) = 105 days under RA 11210
    const solo  = form.leave_solo_parent === '1' ? 15 : 0;
    const paid  = base + solo;
    const total = form.leave_unpaid_extension === '1' ? paid + 30 : paid;
    return { paid, unpaid: form.leave_unpaid_extension === '1' ? 30 : 0, total };
  })();

  const openModal = (type = 'Leave') => {
    setForm({});
    setFormType(type);
    setMpProofFile(null);
    setAttachmentFile(null);
    setLeaveOneDay(false);
    setMpAddSecond(false);
    setSubmitError(null);
    setModalOpen(true);
    if (type === 'Change Shift') {
      setShiftPresets([]);
      setLoadingShifts(true);
      attendanceApi.getShiftPresets()
        .then((r) => setShiftPresets(r.data))
        .catch(() => setShiftPresets([]))
        .finally(() => setLoadingShifts(false));
    }
  };

  const closeModal = () => { setModalOpen(false); setSubmitError(null); setMpProofFile(null); setAttachmentFile(null); setLeaveOneDay(false); setMpAttRecord(null); setMpAddSecond(false); };

  const handleCancelRequest = async () => {
    if (!viewRequest) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await requestsApi.cancelRequest((viewRequest as any).id ?? (viewRequest as any).uniq_id ?? '');
      setCancelConfirm(false);
      setViewRequest(null);
      fetchData();
    } catch (err: any) {
      setCancelError(err.message ?? 'Failed to cancel request.');
    } finally {
      setCancelling(false);
    }
  };

  // Returns true if the request's effective date is in the past (cancel disabled)
  const isRequestDatePassed = (req: LeaveRequest): boolean => {
    const effectiveDate = (req as any).effective_date ?? (req as any).leave_from ?? (req as any).ot_date ?? (req as any).cs_date ?? (req as any).mp_date ?? (req as any).wfh_date ?? (req as any).other_from_date;
    if (!effectiveDate) return false;
    const d = new Date(effectiveDate.includes('T') ? effectiveDate : effectiveDate + 'T00:00:00');
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

  const setField = (key: string, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    // Extra validation for leave types with period selection
    if (formType === 'Leave' && LEAVE_TYPES_WITH_PERIOD.includes(form.leave_type)) {

    }
    // Emergency type required for Emergency Leave
    if (formType === 'Leave' && form.leave_type === 'Emergency Leave' && !form.emergency_type) {
      setSubmitError('Please select an emergency type.');
      setSubmitting(false);
      return;
    }

    if (formType === 'Leave' && form.leave_type === 'Emergency Leave' && form.emergency_type === 'Others' && !form.emergency_type_other) {
      setSubmitError('Please specify the emergency type.');
      setSubmitting(false);
      return;
    }
    // Chronological validation for Manual Punch
    if (formType === 'Manual Punch' && form.mp_date && form.mp_time && form.mp_type) {
      const effIn  = mpAttRecord ? (mpAttRecord.adj_time_in  ?? mpAttRecord.time_in)  : null;
      const effOut = mpAttRecord ? (mpAttRecord.adj_time_out ?? mpAttRecord.time_out) : null;
      const mpDT   = new Date(`${form.mp_date}T${form.mp_time}`);
      if (form.mp_type === 'Time In' && effOut) {
        const outDT = new Date(effOut.includes('T') ? effOut : effOut.replace(' ', 'T'));
        if (!isNaN(outDT.getTime()) && mpDT >= outDT) {
          setSubmitError(`Time In cannot be at or after the existing Time Out (${fmtTime(effOut)}).`);
          setSubmitting(false);
          return;
        }
      }
      if (form.mp_type === 'Time Out' && effIn) {
        const inDT = new Date(effIn.includes('T') ? effIn : effIn.replace(' ', 'T'));
        if (!isNaN(inDT.getTime()) && mpDT <= inDT) {
          setSubmitError(`Time Out cannot be at or before the existing Time In (${fmtTime(effIn)}).`);
          setSubmitting(false);
          return;
        }
      }
      if (mpAddSecond && form.mp_time2) {
        const mp2DT = new Date(`${form.mp_date}T${form.mp_time2}`);
        if (form.mp_type === 'Time In' && mp2DT <= mpDT) {
          setSubmitError('The added Time Out must be after Time In.');
          setSubmitting(false);
          return;
        }
        if (form.mp_type === 'Time Out' && mp2DT >= mpDT) {
          setSubmitError('The added Time In must be before Time Out.');
          setSubmitting(false);
          return;
        }
      }
    }
    try {
      const fd = new FormData();
      fd.append('rqst_type', formType);
      if (formType === 'Leave') {
        fd.append('leave_type',   form.leave_type   ?? '');
        fd.append('leave_from',   form.leave_from   ?? '');
        fd.append('leave_to',     leaveOneDay ? (form.leave_from ?? '') : (form.leave_to ?? ''));
        fd.append('leave_total',  String(leaveDays));
        fd.append('lwop_type',    form.lwop_type    ?? '');
        if (form.lwop_type === 'AM' || form.lwop_type === 'PM') fd.append('leave_period', form.lwop_type);
        if (form.leave_sub_type)  fd.append('leave_sub_type',    form.leave_sub_type);
        if (form.leave_solo_parent === '1')       fd.append('leave_solo_parent',        '1');
        if (form.leave_unpaid_extension === '1')  fd.append('leave_unpaid_extension',   '1');
        if (form.leave_days_allocated && form.leave_days_allocated !== '0') fd.append('leave_days_allocated', form.leave_days_allocated);
        if (form.leave_type === 'Emergency Leave') {
          const emergType = form.emergency_type === 'Others' ? `Others: ${form.emergency_type_other ?? ''}` : (form.emergency_type ?? '');
          fd.append('emergency_type', emergType);
        }
        fd.append('reason',       form.reason       ?? '');
        if (attachmentFile) fd.append('attachment', attachmentFile);
      } else if (formType === 'Overtime') {
        fd.append('ot_date',      form.ot_date      ?? '');
        fd.append('ot_from',      form.ot_from      ?? '');
        fd.append('ot_to',        form.ot_to        ?? '');
        fd.append('ot_work_done', form.ot_work_done ?? '');
        if (attachmentFile) fd.append('attachment', attachmentFile);
      } else if (formType === 'Change Shift') {
        const csShift = form.cs_new_shift === '__other__'
          ? (form.cs_new_shift_custom ?? '')
          : (form.cs_new_shift ?? '');
        fd.append('cs_date',      form.cs_date ?? '');
        fd.append('cs_new_shift', csShift);
        fd.append('reason',       form.reason  ?? '');
        if (attachmentFile) fd.append('attachment', attachmentFile);
      } else if (formType === 'Manual Punch') {
        fd.append('mp_date', form.mp_date ?? '');
        fd.append('mp_type', form.mp_type ?? '');
        fd.append('mp_time', form.mp_time ?? '');
        fd.append('reason',  form.reason  ?? '');
        if (mpAddSecond && form.mp_time2) {
          fd.append('mp_type2', form.mp_type === 'Time In' ? 'Time Out' : 'Time In');
          fd.append('mp_time2', form.mp_time2);
        }
        if (mpProofFile) fd.append('mp_proof', mpProofFile);
      }
      await requestsApi.submitFormData(fd);
      closeModal();
      fetchData();
    } catch (err: any) {
      setSubmitError(err.message ?? 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (s: string) => {
    const l = s?.toLowerCase() ?? '';
    if (l === 'approved') return 'bg-green-100 text-green-700';
    if (l === 'rejected' || l === 'denied') return 'bg-red-100 text-red-700';
    if (l === 'cancelled') return 'bg-gray-200 text-gray-500';
    return 'bg-yellow-100 text-yellow-600';
  };

  // Summary computation
  const allTypes = [...REQ_TYPES, 'WFH', 'Other'];
  const typeSummary = allTypes.map((t) => {
    const reqs = requests.filter((r) => ((r as any).rqst_type ?? r.type) === t);
    return {
      type: t,
      total:     reqs.length,
      pending:   reqs.filter((r) => r.status === 'Pending').length,
      approved:  reqs.filter((r) => r.status === 'Approved').length,
      rejected:  reqs.filter((r) => r.status === 'Rejected').length,
      cancelled: reqs.filter((r) => r.status === 'Cancelled').length,
    };
  }).filter((s) => s.total > 0);

  const totalAll       = requests.length;
  const totalPending   = requests.filter((r) => r.status === 'Pending').length;
  const totalApproved  = requests.filter((r) => r.status === 'Approved').length;
  const totalRejected  = requests.filter((r) => r.status === 'Rejected').length;
  const totalCancelled = requests.filter((r) => r.status === 'Cancelled').length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* ─── Main Panel ─── */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`${activeView === 'requests' ? 'bg-blue-500' : 'bg-red-500'} text-white rounded-lg p-2`}>
              {activeView === 'requests' ? <FileText size={24} /> : <Briefcase size={24} />}
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">
              {activeView === 'requests' ? 'My Requests' : 'Requests Summary'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openModal('Leave')}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              <Plus size={16} /> Add Request
            </button>
            <button
              onClick={() => setActiveView('requests')}
              disabled={activeView === 'requests'}
              className={`p-2 rounded-lg transition-all ${
                activeView === 'requests' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setActiveView('summary')}
              disabled={activeView === 'summary'}
              className={`p-2 rounded-lg transition-all ${
                activeView === 'summary' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* ─── Requests View ─── */}
        {activeView === 'requests' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 size={26} className="animate-spin mr-2" /><span>Loading...</span>
              </div>
            ) : requests.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-400 mb-3">No requests yet.</p>
                <button
                  onClick={() => openModal('Leave')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus size={16} /> Submit Your First Request
                </button>
              </div>
            ) : (
              <>
                <div className={visible > PAGE ? 'overflow-y-auto max-h-[400px] rounded-lg border border-gray-100' : ''}>
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-white z-10 shadow-sm">
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-2 px-3 text-gray-600 font-semibold">Submitted</th>
                        <th className="text-left py-2 px-3 text-gray-600 font-semibold">Type</th>
                        <th className="text-left py-2 px-3 text-gray-600 font-semibold hidden sm:table-cell">Req. Date</th>
                        <th className="text-left py-2 px-3 text-gray-600 font-semibold">Status</th>
                        <th className="text-center py-2 px-3 text-gray-600 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.slice(0, visible).map((req, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="py-2 px-3 text-gray-500">
                            {fmtDT((req as any).encode_date ?? req.created_at)}
                          </td>
                          <td className="py-2 px-3 font-medium text-gray-800">
                            {(req as any).rqst_type ?? req.type}
                          </td>
                          <td className="py-2 px-3 text-gray-500 hidden sm:table-cell">
                            {fmtD((req as any).effective_date)}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${statusBadge(req.status ?? '')}`}>
                              {req.status ?? 'Pending'}
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
                  {requests.length > visible && (
                    <>
                      <button
                        onClick={() => setVisible((v) => v + PAGE)}
                        className="px-4 py-1.5 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                      >
                        See More (+{Math.min(PAGE, requests.length - visible)})
                      </button>
                      <button
                        onClick={() => setVisible(requests.length)}
                        className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                      >
                        See All ({requests.length})
                      </button>
                    </>
                  )}
                  {visible > PAGE && (
                    <button
                      onClick={() => setVisible(PAGE)}
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

        {/* ─── Summary View ─── */}
        {activeView === 'summary' && (
          <div className="space-y-5">
            {/* Overall totals -- clickable */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <button
                onClick={() => setSummaryDrill({ label: 'All Requests', items: requests })}
                className="p-3 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <p className="text-xs text-gray-500 mb-1">Total Requests</p>
                <p className="text-2xl font-bold text-blue-600">{totalAll}</p>
              </button>
              <button
                onClick={() => setSummaryDrill({ label: 'Pending Requests', items: requests.filter(r => r.status === 'Pending') })}
                className="p-3 bg-yellow-50 rounded-lg text-center hover:bg-yellow-100 transition-colors cursor-pointer"
              >
                <p className="text-xs text-gray-500 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{totalPending}</p>
              </button>
              <button
                onClick={() => setSummaryDrill({ label: 'Approved Requests', items: requests.filter(r => r.status === 'Approved') })}
                className="p-3 bg-green-50 rounded-lg text-center hover:bg-green-100 transition-colors cursor-pointer"
              >
                <p className="text-xs text-gray-500 mb-1">Approved</p>
                <p className="text-2xl font-bold text-green-600">{totalApproved}</p>
              </button>
              <button
                onClick={() => setSummaryDrill({ label: 'Rejected Requests', items: requests.filter(r => r.status === 'Rejected') })}
                className="p-3 bg-red-50 rounded-lg text-center hover:bg-red-100 transition-colors cursor-pointer"
              >
                <p className="text-xs text-gray-500 mb-1">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{totalRejected}</p>
              </button>
              <button
                onClick={() => setSummaryDrill({ label: 'Cancelled Requests', items: requests.filter(r => r.status === 'Cancelled') })}
                className="p-3 bg-gray-100 rounded-lg text-center hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <p className="text-xs text-gray-500 mb-1">Cancelled</p>
                <p className="text-2xl font-bold text-gray-500">{totalCancelled}</p>
              </button>
            </div>

            {/* Leave balance */}
            {empInfo && (empInfo.vacation_leave_remaining !== undefined) && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="text-sm font-bold text-blue-700 mb-3">Leave Balance</h4>
                <div className="grid grid-cols-2 gap-3">
                  {/* Vacation Leave */}
                  <button
                    onClick={empInfo.vl_sl_eligible !== false ? () => setSummaryDrill({
                      label: 'Vacation Leave Used',
                      items: requests.filter(r =>
                        ((r as any).rqst_type ?? r.type) === 'Leave' &&
                        (r as any).leave_type === 'Vacation Leave' &&
                        r.status === 'Approved'
                      ),
                    }) : undefined}
                    className={`bg-white rounded-lg p-3 text-center shadow-sm border border-transparent ${empInfo.vl_sl_eligible !== false ? 'hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer' : 'opacity-60 cursor-default'}`}
                  >
                    <p className="text-xs text-gray-500 mb-1">Vacation Leave</p>
                    {empInfo.vl_sl_eligible !== false ? (
                      <>
                        <p className="text-xl font-bold text-blue-600">{fmtLeaveBalance(empInfo.vacation_leave_remaining)}</p>
                        <p className="text-xs text-gray-400">of {empInfo.vacation_leave_total} days remaining</p>
                        <p className="text-xs text-blue-400 mt-1">{fmtLeaveBalance(empInfo.vacation_leave_used)} used — tap to view</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-gray-400 mt-1">{empInfo.is_trainee ? 'Not applicable' : 'Not yet eligible'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{empInfo.is_trainee ? 'Trainee employment' : (empInfo.vl_eligible_date ? `from ${fmtD(empInfo.vl_eligible_date)}` : 'Date hired not on record')}</p>
                      </>
                    )}
                  </button>
                  {/* Sick Leave */}
                  <button
                    onClick={empInfo.vl_sl_eligible !== false ? () => setSummaryDrill({
                      label: 'Sick Leave Used',
                      items: requests.filter(r =>
                        ((r as any).rqst_type ?? r.type) === 'Leave' &&
                        (r as any).leave_type === 'Sick Leave' &&
                        r.status === 'Approved'
                      ),
                    }) : undefined}
                    className={`bg-white rounded-lg p-3 text-center shadow-sm border border-transparent ${empInfo.vl_sl_eligible !== false ? 'hover:bg-green-50 hover:border-green-200 transition-colors cursor-pointer' : 'opacity-60 cursor-default'}`}
                  >
                    <p className="text-xs text-gray-500 mb-1">Sick Leave</p>
                    {empInfo.vl_sl_eligible !== false ? (
                      <>
                        <p className="text-xl font-bold text-green-600">{fmtLeaveBalance(empInfo.sick_leave_remaining)}</p>
                        <p className="text-xs text-gray-400">of {empInfo.sick_leave_total} days remaining</p>
                        <p className="text-xs text-green-400 mt-1">{fmtLeaveBalance(empInfo.sick_leave_used)} used — tap to view</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-gray-400 mt-1">{empInfo.is_trainee ? 'Not applicable' : 'Not yet eligible'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{empInfo.is_trainee ? 'Trainee employment' : (empInfo.vl_eligible_date ? `from ${fmtD(empInfo.vl_eligible_date)}` : 'Date hired not on record')}</p>
                      </>
                    )}
                  </button>
                  {/* Maternity Leave — female or unknown gender */}
                  {(empInfo.emp_gender !== 'Male') && (
                    <button
                      onClick={() => setSummaryDrill({ label: 'Maternity Leave Used', items: requests.filter(r => ((r as any).rqst_type ?? r.type) === 'Leave' && (r as any).leave_type === 'Maternity Leave' && r.status === 'Approved') })}
                      className="bg-white rounded-lg p-3 text-center shadow-sm hover:bg-pink-50 transition-colors cursor-pointer border border-transparent hover:border-pink-200"
                    >
                      <p className="text-xs text-gray-500 mb-1">Maternity Leave</p>
                      <p className="text-xl font-bold text-pink-600">{fmtLeaveBalance(empInfo.maternity_leave_remaining ?? 105)}</p>
                      <p className="text-xs text-gray-400">of {empInfo.maternity_leave_total ?? 105} days remaining</p>
                      <p className="text-xs text-pink-400 mt-1">{fmtLeaveBalance(empInfo.maternity_leave_used ?? 0)} used — tap to view</p>
                    </button>
                  )}
                  {/* Paternity Leave — male or unknown gender */}
                  {(empInfo.emp_gender !== 'Female') && (
                    <button
                      onClick={() => setSummaryDrill({ label: 'Paternity Leave Used', items: requests.filter(r => ((r as any).rqst_type ?? r.type) === 'Leave' && (r as any).leave_type === 'Paternity Leave' && r.status === 'Approved') })}
                      className="bg-white rounded-lg p-3 text-center shadow-sm hover:bg-sky-50 transition-colors cursor-pointer border border-transparent hover:border-sky-200"
                    >
                      <p className="text-xs text-gray-500 mb-1">Paternity Leave</p>
                      <p className="text-xl font-bold text-sky-600">{fmtLeaveBalance(empInfo.paternity_leave_remaining ?? 7)}</p>
                      <p className="text-xs text-gray-400">of {empInfo.paternity_leave_total ?? 7} days remaining</p>
                      <p className="text-xs text-sky-400 mt-1">{fmtLeaveBalance(empInfo.paternity_leave_used ?? 0)} used — tap to view</p>
                    </button>
                  )}
                  {/* Solo Parent Leave — all genders */}
                  <button
                    onClick={() => setSummaryDrill({ label: 'Solo Parent Leave Used', items: requests.filter(r => ((r as any).rqst_type ?? r.type) === 'Leave' && (r as any).leave_type === 'Solo Parent Leave' && r.status === 'Approved') })}
                    className="bg-white rounded-lg p-3 text-center shadow-sm hover:bg-orange-50 transition-colors cursor-pointer border border-transparent hover:border-orange-200"
                  >
                    <p className="text-xs text-gray-500 mb-1">Solo Parent Leave</p>
                    <p className="text-xl font-bold text-orange-500">{fmtLeaveBalance(empInfo.solo_parent_leave_remaining ?? 7)}</p>
                    <p className="text-xs text-gray-400">of {empInfo.solo_parent_leave_total ?? 7} days remaining</p>
                    <p className="text-xs text-orange-400 mt-1">{fmtLeaveBalance(empInfo.solo_parent_leave_used ?? 0)} used — tap to view</p>
                  </button>
                  {/* VAWC Leave — female or unknown */}
                  {(empInfo.emp_gender !== 'Male') && (
                    <button
                      onClick={() => setSummaryDrill({ label: 'VAWC Leave Used', items: requests.filter(r => ((r as any).rqst_type ?? r.type) === 'Leave' && (r as any).leave_type === 'VAWC Leave' && r.status === 'Approved') })}
                      className="bg-white rounded-lg p-3 text-center shadow-sm hover:bg-purple-50 transition-colors cursor-pointer border border-transparent hover:border-purple-200"
                    >
                      <p className="text-xs text-gray-500 mb-1">VAWC Leave</p>
                      <p className="text-xl font-bold text-purple-600">{fmtLeaveBalance(empInfo.vawc_leave_remaining ?? 10)}</p>
                      <p className="text-xs text-gray-400">of {empInfo.vawc_leave_total ?? 10} days remaining</p>
                      <p className="text-xs text-purple-400 mt-1">{fmtLeaveBalance(empInfo.vawc_leave_used ?? 0)} used — tap to view</p>
                    </button>
                  )}
                  {/* Gynecological Leave — female or unknown */}
                  {(empInfo.emp_gender !== 'Male') && (
                    <button
                      onClick={empInfo.gyno_eligible !== false ? () => setSummaryDrill({ label: 'Gynecological Leave Used', items: requests.filter(r => ((r as any).rqst_type ?? r.type) === 'Leave' && (r as any).leave_type === 'Gynecological Leave' && r.status === 'Approved') }) : undefined}
                      className={`bg-white rounded-lg p-3 text-center shadow-sm border border-transparent ${empInfo.gyno_eligible !== false ? 'hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer' : 'opacity-60 cursor-default'}`}
                    >
                      <p className="text-xs text-gray-500 mb-1">Gynecological Leave</p>
                      {empInfo.gyno_eligible !== false ? (
                        <>
                          <p className="text-xl font-bold text-rose-600">{fmtLeaveBalance(empInfo.gynecological_leave_remaining ?? 60)}</p>
                          <p className="text-xs text-gray-400">of {empInfo.gynecological_leave_total ?? 60} days remaining</p>
                          <p className="text-xs text-rose-400 mt-1">{fmtLeaveBalance(empInfo.gynecological_leave_used ?? 0)} used — tap to view</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-gray-400 mt-1">{empInfo.is_trainee ? 'Not applicable' : 'Not yet eligible'}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{empInfo.is_trainee ? 'Trainee employment' : (empInfo.gyno_eligible_date ? `from ${fmtD(empInfo.gyno_eligible_date)}` : 'Date hired not on record')}</p>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Per-type breakdown */}
            {typeSummary.length > 0 ? (
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">By Request Type</h4>
                <div className="space-y-2">
                  {typeSummary.map((s) => (
                    <div key={s.type} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-800">{s.type}</span>
                        <button
                          onClick={() => setSummaryDrill({ label: `${s.type} -- All`, items: requests.filter(r => ((r as any).rqst_type ?? r.type) === s.type) })}
                          className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium hover:bg-blue-200 transition-colors"
                        >{s.total} total</button>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs text-center">
                        <button
                          onClick={() => setSummaryDrill({ label: `${s.type} -- Pending`, items: requests.filter(r => ((r as any).rqst_type ?? r.type) === s.type && r.status === 'Pending') })}
                          className="bg-yellow-50 rounded p-1.5 hover:bg-yellow-100 transition-colors cursor-pointer"
                        >
                          <span className="block font-bold text-yellow-600">{s.pending}</span>
                          <span className="text-gray-500">Pending</span>
                        </button>
                        <button
                          onClick={() => setSummaryDrill({ label: `${s.type} -- Approved`, items: requests.filter(r => ((r as any).rqst_type ?? r.type) === s.type && r.status === 'Approved') })}
                          className="bg-green-50 rounded p-1.5 hover:bg-green-100 transition-colors cursor-pointer"
                        >
                          <span className="block font-bold text-green-600">{s.approved}</span>
                          <span className="text-gray-500">Approved</span>
                        </button>
                        <button
                          onClick={() => setSummaryDrill({ label: `${s.type} -- Rejected`, items: requests.filter(r => ((r as any).rqst_type ?? r.type) === s.type && r.status === 'Rejected') })}
                          className="bg-red-50 rounded p-1.5 hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          <span className="block font-bold text-red-600">{s.rejected}</span>
                          <span className="text-gray-500">Rejected</span>
                        </button>
                        <button
                          onClick={() => setSummaryDrill({ label: `${s.type} -- Cancelled`, items: requests.filter(r => ((r as any).rqst_type ?? r.type) === s.type && r.status === 'Cancelled') })}
                          className="bg-gray-100 rounded p-1.5 hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                          <span className="block font-bold text-gray-500">{s.cancelled}</span>
                          <span className="text-gray-500">Cancelled</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center py-6 text-gray-400 text-sm">No requests yet.</p>
            )}
          </div>
        )}
      </div>

      {/* ─── Summary Drill-Down Modal ─── */}
      {summaryDrill && (
        <div className="fixed inset-0 z-[45] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSummaryDrill(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col z-10">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-bold text-lg text-gray-800">{summaryDrill.label}</h3>
              <button onClick={() => setSummaryDrill(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {summaryDrill.items.length === 0 ? (
                <p className="text-center py-12 text-gray-400">No requests found.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-white z-10 shadow-sm">
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-2 px-3 text-gray-600 font-semibold">Submitted</th>
                        <th className="text-left py-2 px-3 text-gray-600 font-semibold">Type</th>
                        <th className="text-left py-2 px-3 text-gray-600 font-semibold hidden sm:table-cell">Req. Date</th>
                        <th className="text-left py-2 px-3 text-gray-600 font-semibold hidden sm:table-cell">Duration</th>
                        <th className="text-left py-2 px-3 text-gray-600 font-semibold">Status</th>
                        <th className="text-center py-2 px-3 text-gray-600 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryDrill.items.map((req, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="py-2 px-3 text-gray-500">{fmtDT((req as any).encode_date ?? req.created_at)}</td>
                          <td className="py-2 px-3 font-medium text-gray-800">{(req as any).rqst_type ?? req.type}</td>
                          <td className="py-2 px-3 text-gray-500 hidden sm:table-cell">{fmtD((req as any).effective_date)}</td>
                          <td className="py-2 px-3 hidden sm:table-cell">
                            {(() => {
                              const type = (req as any).rqst_type ?? req.type;
                              if (type === 'Leave' && (req as any).leave_total != null)
                                return <span className="text-blue-700 font-medium">{(req as any).leave_total} day{(req as any).leave_total !== 1 ? 's' : ''}</span>;
                              if (type === 'Overtime' && (req as any).ot_total != null)
                                return <span className="text-yellow-700 font-medium">{(req as any).ot_total} hr{parseFloat((req as any).ot_total) !== 1 ? 's' : ''}</span>;
                              return <span className="text-gray-400">--</span>;
                            })()}
                          </td>
                          <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${statusBadge(req.status ?? '')}`}>{req.status ?? 'Pending'}</span></td>
                          <td className="py-2 px-3 text-center">
                            <button onClick={() => setViewRequest(req)} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors">
                              <Eye size={12} /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── View Request Modal (read-only) ─── */}
      {viewRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setViewRequest(null); setCancelConfirm(false); setCancelError(null); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-lg text-gray-800">Request Details</h3>
              <button onClick={() => { setViewRequest(null); setCancelConfirm(false); setCancelError(null); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-500 mb-0.5">Request Type</p><p className="font-semibold text-gray-800">{(viewRequest as any).rqst_type ?? viewRequest.type ?? '--'}</p></div>
                <div><p className="text-xs text-gray-500 mb-0.5">Submitted</p><p className="font-semibold text-gray-800">{fmtDT((viewRequest as any).encode_date ?? viewRequest.created_at)}</p></div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-500 mb-0.5">Overall Status</p><span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${statusBadge(viewRequest.status ?? 'Pending')}`}>{viewRequest.status ?? 'Pending'}</span></div>
                <div><p className="text-xs text-gray-500 mb-0.5">Supervisor Status</p><span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${statusBadge((viewRequest as any).sup_status ?? 'Pending')}`}>{(viewRequest as any).sup_status ?? 'Pending'}</span></div>
                <div><p className="text-xs text-gray-500 mb-0.5">Admin Status</p><span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${statusBadge((viewRequest as any).admin_status ?? 'Pending')}`}>{(viewRequest as any).admin_status ?? 'Pending'}</span></div>
                {(viewRequest as any).sup_name && <div><p className="text-xs text-gray-500 mb-0.5">Supervisor</p><p className="font-medium text-gray-700">{(viewRequest as any).sup_name}</p></div>}
                {(viewRequest as any).admin_name && <div><p className="text-xs text-gray-500 mb-0.5">Admin</p><p className="font-medium text-gray-700">{(viewRequest as any).admin_name}</p></div>}
              </div>
              {((viewRequest as any).rqst_type === 'Leave' || viewRequest.type === 'Leave') && (
                <div className="border border-blue-100 rounded-lg p-3 bg-blue-50">
                  <p className="text-xs font-semibold text-blue-600 uppercase mb-2">Leave Details</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(viewRequest as any).leave_type && <div><p className="text-xs text-gray-500">Leave Type</p><p className="font-medium">{(viewRequest as any).leave_type}</p></div>}
                    {(viewRequest as any).emergency_type && <div><p className="text-xs text-gray-500">Emergency Type</p><p className="font-medium">{(viewRequest as any).emergency_type}</p></div>}
                    {(viewRequest as any).lwop_type && <div><p className="text-xs text-gray-500">Duration Type</p><p className="font-medium">{(viewRequest as any).lwop_type}{(viewRequest as any).leave_period ? ` (${(viewRequest as any).leave_period})` : ''}</p></div>}
                    {(viewRequest as any).lwop_time_from && (viewRequest as any).lwop_time_to && (
                      <div><p className="text-xs text-gray-500">Undertime</p><p className="font-medium">{(viewRequest as any).lwop_time_from} – {(viewRequest as any).lwop_time_to}</p></div>
                    )}
                    {(viewRequest as any).leave_from && <div><p className="text-xs text-gray-500">From</p><p className="font-medium">{fmtD((viewRequest as any).leave_from)}</p></div>}
                    {(viewRequest as any).leave_to && <div><p className="text-xs text-gray-500">To</p><p className="font-medium">{fmtD((viewRequest as any).leave_to)}</p></div>}
                    <div className="col-span-2 bg-blue-100 rounded-lg p-2 text-center">
                      <p className="text-xs text-blue-500 mb-0.5">Total Days</p>
                      <p className="text-lg font-bold text-blue-700">{(viewRequest as any).leave_total ?? '--'}</p>
                    </div>
                  </div>
                </div>
              )}
              {((viewRequest as any).rqst_type === 'Overtime' || viewRequest.type === 'Overtime') && (
                <div className="border border-yellow-100 rounded-lg p-3 bg-yellow-50">
                  <p className="text-xs font-semibold text-yellow-600 uppercase mb-2">Overtime Details</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(viewRequest as any).ot_date && <div><p className="text-xs text-gray-500">Date</p><p className="font-medium">{fmtD((viewRequest as any).ot_date)}</p></div>}
                    {(viewRequest as any).ot_from && <div><p className="text-xs text-gray-500">From</p><p className="font-medium">{(viewRequest as any).ot_from}</p></div>}
                    {(viewRequest as any).ot_to && <div><p className="text-xs text-gray-500">To</p><p className="font-medium">{(viewRequest as any).ot_to}</p></div>}
                    <div className="col-span-2 bg-yellow-100 rounded-lg p-2 text-center">
                      <p className="text-xs text-yellow-600 mb-0.5">Total Hours</p>
                      <p className="text-lg font-bold text-yellow-700">{(viewRequest as any).ot_total ?? '--'}</p>
                    </div>
                    {(viewRequest as any).ot_work_done && <div className="col-span-2"><p className="text-xs text-gray-500">Work Done</p><p className="font-medium">{(viewRequest as any).ot_work_done}</p></div>}
                  </div>
                </div>
              )}
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
                            <img src={`${BACKEND}/backend/${(viewRequest as any).mp_proof}`} alt="Proof" className="max-w-full rounded-lg border border-gray-200 shadow-sm max-h-48 object-contain" />
                            <a href={`${BACKEND}/backend/${(viewRequest as any).mp_proof}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">Open full image</a>
                          </div>
                        ) : (
                          <a href={`${BACKEND}/backend/${(viewRequest as any).mp_proof}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2">View Proof</a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {viewRequest.reason && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Reason / Notes</p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{viewRequest.reason}</p>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-5 py-4 space-y-3">
              {/* Cancel Request Confirmation UI */}
              {cancelConfirm ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-red-700">Are you sure you want to cancel this request? This cannot be undone.</p>
                  {cancelError && <p className="text-xs text-red-600">{cancelError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelRequest}
                      disabled={cancelling}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {cancelling ? <><Loader2 size={12} className="animate-spin" /> Cancelling...</> : 'Yes, Cancel Request'}
                    </button>
                    <button
                      onClick={() => { setCancelConfirm(false); setCancelError(null); }}
                      disabled={cancelling}
                      className="flex-1 py-2 border-2 border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
                  >
                    <Printer size={14} /> Print
                  </button>
                  {(() => {
                    const isCancelled = viewRequest.status === 'Cancelled';
                    const datePassed  = isRequestDatePassed(viewRequest);
                    if (isCancelled) {
                      return (
                        <span className="px-3 py-2 bg-gray-100 text-gray-400 text-xs font-semibold rounded-lg">
                          Cancelled
                        </span>
                      );
                    }
                    return (
                      <button
                        onClick={() => { setCancelConfirm(true); setCancelError(null); }}
                        disabled={datePassed}
                        title={datePassed ? 'Cannot cancel — request date has already passed' : 'Cancel this request'}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg border border-red-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Cancel Request
                      </button>
                    );
                  })()}
                  <button
                    onClick={() => { setViewRequest(null); setCancelConfirm(false); setCancelError(null); }}
                    className="flex-1 py-2 border-2 border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Add Request Modal ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto z-10">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-lg text-gray-800">Add Request</h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-sm">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Request Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(REQ_TYPES as readonly string[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                          setFormType(t);
                          setForm({});
                          if (t === 'Change Shift') {
                            setShiftPresets([]);
                            setLoadingShifts(true);
                            attendanceApi.getShiftPresets()
                              .then((r) => setShiftPresets(r.data))
                              .catch(() => setShiftPresets([]))
                              .finally(() => setLoadingShifts(false));
                          }
                        }}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border-2 transition-colors ${
                        formType === t
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Leave fields ── */}
              {formType === 'Leave' && (
                <>
                  {/* Leave Type */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Leave Type</label>
                    <select
                      required
                      value={form.leave_type ?? ''}
                      onChange={(e) => {
                        const t = e.target.value;
                        setForm((f) => ({ ...f, leave_type: t, lwop_type: '', leave_period: '', emergency_type: '', emergency_type_other: '', leave_sub_type: '', leave_solo_parent: '', leave_unpaid_extension: '', leave_days_allocated: '0' }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    >
                      <option value="">Select...</option>
                      {LEAVE_TYPES.filter((t) => {
                        const g = empInfo?.emp_gender ?? '';
                        if (FEMALE_ONLY_LEAVES.includes(t) && g === 'Male')   return false;
                        if (MALE_ONLY_LEAVES.includes(t)   && g === 'Female') return false;
                        if ((t === 'Vacation Leave' || t === 'Sick Leave') && empInfo?.vl_sl_eligible === false) return false;
                        if (t === 'Gynecological Leave' && empInfo?.gyno_eligible === false) return false;
                        return true;
                      }).map((t) => {
                        const balMap: Record<string, number | undefined> = {
                          'Vacation Leave':      empInfo?.vacation_leave_remaining,
                          'Sick Leave':          empInfo?.sick_leave_remaining,
                          'Maternity Leave':     empInfo?.maternity_leave_remaining,
                          'Paternity Leave':     empInfo?.paternity_leave_remaining,
                          'Solo Parent Leave':   empInfo?.solo_parent_leave_remaining,
                          'VAWC Leave':          empInfo?.vawc_leave_remaining,
                          'Gynecological Leave': empInfo?.gynecological_leave_remaining,
                        };
                        const bal = balMap[t];
                        const exhausted = bal !== undefined && bal <= 0;
                        return (
                          <option key={t} value={t} disabled={exhausted}>
                            {t}{bal !== undefined && empInfo ? ` (${fmtLeaveBalance(bal)} left)` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Emergency Type — only for Emergency Leave */}
                  {form.leave_type === 'Emergency Leave' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Emergency Type</label>
                        <select
                          required
                          value={form.emergency_type ?? ''}
                          onChange={(e) => setForm((f) => ({ ...f, emergency_type: e.target.value, emergency_type_other: '' }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                        >
                          <option value="">Select...</option>
                          <option value="Illness">Illness</option>
                          <option value="Bereavement">Bereavement</option>
                          <option value="Calamity">Calamity</option>
                          <option value="Others">Others (Specify)</option>
                        </select>
                      </div>
                      {form.emergency_type === 'Others' && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Please Specify</label>
                          <input
                            type="text" required
                            value={form.emergency_type_other ?? ''}
                            onChange={(e) => setField('emergency_type_other', e.target.value)}
                            placeholder="Describe the emergency..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Maternity Leave — RA 11210 */}
                  {form.leave_type === 'Maternity Leave' && (
                    <>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={form.leave_solo_parent === '1'}
                          onChange={(e) => setField('leave_solo_parent', e.target.checked ? '1' : '')}
                          className="rounded border-gray-300 text-blue-500 focus:ring-blue-400"
                        />
                        <span className="text-xs text-gray-600">
                          I am a Solo Parent — claim additional <strong>+15 days paid</strong> <span className="text-gray-400">(RA 8972)</span>
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={form.leave_unpaid_extension === '1'}
                          onChange={(e) => setField('leave_unpaid_extension', e.target.checked ? '1' : '')}
                          className="rounded border-gray-300 text-blue-500 focus:ring-blue-400"
                        />
                        <span className="text-xs text-gray-600">
                          Extend by <strong>+30 days (unpaid)</strong> optional extension <span className="text-gray-400">(RA 11210 §4)</span>
                        </span>
                      </label>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Days to allocate to father/alternate caregiver <span className="text-gray-400 font-normal">(0–7, optional)</span>
                        </label>
                        <input
                          type="number" min="0" max="7"
                          value={form.leave_days_allocated ?? '0'}
                          onChange={(e) => {
                            const v = Math.min(7, Math.max(0, parseInt(e.target.value) || 0));
                            setField('leave_days_allocated', String(v));
                          }}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <p className="text-xs text-gray-400 mt-1">HR will process the transfer to the designated caregiver. <span className="text-gray-400">(RA 11210 §6)</span></p>
                      </div>
                      {maternityEntitlement !== null && (
                        <div className="text-xs font-medium text-blue-600 bg-blue-50 rounded-lg px-3 py-2 space-y-0.5">
                          <p>Paid entitlement: <strong>{maternityEntitlement.paid} calendar days</strong></p>
                          {maternityEntitlement.unpaid > 0 && (
                            <p className="text-gray-500">+ {maternityEntitlement.unpaid} days unpaid extension</p>
                          )}
                          <p className="text-gray-400">Total leave period: {maternityEntitlement.total} days — RA 11210</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Paternity Leave — info note */}
                  {form.leave_type === 'Paternity Leave' && (
                    <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                      Legal entitlement: <strong>7 calendar days with full pay</strong> (RA 8187 — Paternity Leave Act of 1996).<br />
                      Applicable to <strong>legally married</strong> male employees for the <strong>first 4 deliveries</strong> only.
                      Must be availed within 60 days from delivery/miscarriage.
                    </p>
                  )}

                  {/* Solo Parent Leave — Solo Parent ID */}
                  {form.leave_type === 'Solo Parent Leave' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Solo Parent ID No.</label>
                        <input
                          type="text"
                          value={form.leave_sub_type ?? ''}
                          onChange={(e) => setField('leave_sub_type', e.target.value)}
                          placeholder="e.g. SP-2024-001234"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                        Legal entitlement: <strong>7 working days</strong> per year (RA 8972). Solo Parent ID required.
                      </p>
                    </>
                  )}

                  {/* VAWC Leave — info only */}
                  {form.leave_type === 'VAWC Leave' && (
                    <p className="text-xs text-purple-700 bg-purple-50 rounded-lg px-3 py-2">
                      Legal entitlement: <strong>10 days</strong> (RA 9262 — Anti-Violence Against Women and Their Children Act). Barangay Protection Order or court order may be required by HR.
                    </p>
                  )}

                  {/* Gynecological Leave — info only */}
                  {form.leave_type === 'Gynecological Leave' && (
                    <p className="text-xs text-purple-700 bg-purple-50 rounded-lg px-3 py-2">
                      Legal entitlement: Up to <strong>60 days</strong> for surgery due to gynecological disorders (RA 9710 — Magna Carta of Women). Medical certificate required.
                    </p>
                  )}

                  {/* Leave Duration — for supported leave types */}
                  {form.leave_type && LEAVE_TYPES_WITH_PERIOD.includes(form.leave_type) && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        {form.leave_type === 'Leave Without Pay' ? 'LWoP Type' : 'Leave Duration'}
                      </label>
                      <select
                        value={form.lwop_type ?? ''}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, lwop_type: e.target.value, leave_period: '', lwop_time_from: '', lwop_time_to: '' }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                      >
                        <option value="">Whole Day</option>
                        <option value="AM">AM Only</option>
                        <option value="PM">PM Only</option>
                      </select>
                    </div>
                  )}

                  {/* Date field(s) with one-day checkbox */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-600">Date</label>
                      {!NO_ONE_DAY_LEAVES.includes(form.leave_type ?? '') && (
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={leaveOneDay}
                            onChange={(e) => {
                              setLeaveOneDay(e.target.checked);
                              if (e.target.checked && form.leave_from) setField('leave_to', form.leave_from);
                            }}
                            className="rounded border-gray-300 text-blue-500 focus:ring-blue-400"
                          />
                          <span className="text-xs text-gray-500">One day only</span>
                        </label>
                      )}
                    </div>
                    {leaveOneDay ? (
                      <input
                        type="date" required
                        value={form.leave_from ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, leave_from: e.target.value, leave_to: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">From</label>
                          <input
                            type="date" required
                            value={form.leave_from ?? ''}
                            onChange={(e) => setField('leave_from', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">To</label>
                          <input
                            type="date" required
                            min={form.leave_from}
                            value={form.leave_to ?? ''}
                            onChange={(e) => setField('leave_to', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {leaveDays > 0 && (
                    <p className="text-xs font-medium text-blue-600">
                      {leaveDays} {leaveDays === 0.5 ? 'half day' : `day${leaveDays !== 1 ? 's' : ''}`}
                    </p>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reason</label>
                    <textarea
                      required rows={3}
                      value={form.reason ?? ''}
                      onChange={(e) => setField('reason', e.target.value)}
                      placeholder="State your reason..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Attachment <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="file" accept="image/*,.pdf"
                      onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
                      className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer"
                    />
                    {attachmentFile && <p className="mt-1 text-xs text-green-600">✓ {attachmentFile.name}</p>}
                    <p className="mt-1 text-xs text-gray-400">Accepted: JPG, PNG, PDF (max 5 MB)</p>
                  </div>
                </>
              )}

              {/* ── Overtime fields ── */}
              {formType === 'Overtime' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">OT Date</label>
                    <input
                      type="date" required
                      value={form.ot_date ?? ''}
                      onChange={(e) => setField('ot_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">OT Start</label>
                      <TimeSelect
                        required
                        value={form.ot_from ?? ''}
                        onChange={(v) => setField('ot_from', v)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">OT End</label>
                      <TimeSelect
                        required
                        value={form.ot_to ?? ''}
                        onChange={(v) => setField('ot_to', v)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Work Done</label>
                    <textarea
                      required rows={3}
                      value={form.ot_work_done ?? ''}
                      onChange={(e) => setField('ot_work_done', e.target.value)}
                      placeholder="Describe the work performed during overtime..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Attachment <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="file" accept="image/*,.pdf"
                      onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
                      className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer"
                    />
                    {attachmentFile && <p className="mt-1 text-xs text-green-600">✓ {attachmentFile.name}</p>}
                    <p className="mt-1 text-xs text-gray-400">Accepted: JPG, PNG, PDF (max 5 MB)</p>
                  </div>
                </>
              )}

              {/* ── Change Shift fields ── */}
              {formType === 'Change Shift' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date</label>
                    <input
                      type="date" required
                      value={form.cs_date ?? ''}
                      onChange={(e) => setField('cs_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Shift</label>
                    {loadingShifts ? (
                      <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                        <Loader2 size={14} className="animate-spin" /> Loading shifts...
                      </div>
                    ) : (
                      <select
                        required
                        value={form.cs_new_shift ?? ''}
                        onChange={(e) => setField('cs_new_shift', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                      >
                        <option value="">Select shift...</option>
                        {shiftPresets
                          .map((p) => (
                            <option key={p.label} value={p.label}>
                              {p.label}
                            </option>
                          ))
                        }
                        <option value="__other__">Custom (specify below)</option>
                      </select>
                    )}
                    {form.cs_new_shift === '__other__' && (
                      <input
                        type="text" required
                        placeholder="e.g. Shift 1: 6 AM to 2 PM"
                        value={form.cs_new_shift_custom ?? ''}
                        onChange={(e) => setField('cs_new_shift_custom', e.target.value)}
                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reason</label>
                    <textarea
                      required rows={3}
                      value={form.reason ?? ''}
                      onChange={(e) => setField('reason', e.target.value)}
                      placeholder="State your reason..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Attachment <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="file" accept="image/*,.pdf"
                      onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
                      className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer"
                    />
                    {attachmentFile && <p className="mt-1 text-xs text-green-600">✓ {attachmentFile.name}</p>}
                    <p className="mt-1 text-xs text-gray-400">Accepted: JPG, PNG, PDF (max 5 MB)</p>
                  </div>
                </>
              )}

              {/* ── Manual Punch fields ── */}
              {formType === 'Manual Punch' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date</label>
                    <input
                      type="date" required
                      value={form.mp_date ?? ''}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, mp_date: e.target.value, mp_time2: '' }));
                        setMpAddSecond(false);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Punch Type</label>
                      <select
                        required
                        value={form.mp_type ?? ''}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, mp_type: e.target.value, mp_time2: '' }));
                          setMpAddSecond(false);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                      >
                        <option value="">Select...</option>
                        <option value="Time In">Time In</option>
                        <option value="Time Out">Time Out</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Time</label>
                      <TimeSelect
                        required
                        value={form.mp_time ?? ''}
                        onChange={(v) => setField('mp_time', v)}
                      />
                    </div>
                  </div>

                  {/* Existing attendance record for this date */}
                  {form.mp_date && (
                    <div className={`rounded-lg border px-3 py-2.5 text-xs ${
                      mpAttLoading ? 'border-gray-200 bg-gray-50'
                      : mpAttRecord ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                    }`}>
                      {mpAttLoading ? (
                        <span className="flex items-center gap-1.5 text-gray-400">
                          <Loader2 size={12} className="animate-spin" />Loading existing record...
                        </span>
                      ) : mpAttRecord ? (
                        <>
                          <p className="font-semibold text-blue-700 mb-1">Existing record for this date</p>
                          <div className="flex gap-5">
                            <span className="text-gray-600">
                              Time In:{' '}
                              <span className={`font-medium ${(mpAttRecord.adj_time_in ?? mpAttRecord.time_in) ? 'text-gray-800' : 'text-red-400'}`}>
                                {fmtTime(mpAttRecord.adj_time_in ?? mpAttRecord.time_in)}
                              </span>
                            </span>
                            <span className="text-gray-600">
                              Time Out:{' '}
                              <span className={`font-medium ${(mpAttRecord.adj_time_out ?? mpAttRecord.time_out) ? 'text-gray-800' : 'text-red-400'}`}>
                                {fmtTime(mpAttRecord.adj_time_out ?? mpAttRecord.time_out)}
                              </span>
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400">No attendance record found for this date.</span>
                      )}
                    </div>
                  )}

                  {/* Option to add the paired punch in the same request */}
                  {form.mp_date && form.mp_type && (
                    <div>
                      <button
                        type="button"
                        onClick={() => { setMpAddSecond((v) => !v); setField('mp_time2', ''); }}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border-2 transition-colors ${
                          mpAddSecond
                            ? 'border-blue-400 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'
                        }`}
                      >
                        {mpAddSecond
                          ? `✕ Remove ${form.mp_type === 'Time In' ? 'Time Out' : 'Time In'}`
                          : `+ Also add ${form.mp_type === 'Time In' ? 'Time Out' : 'Time In'}`}
                      </button>
                      {mpAddSecond && (
                        <div className="mt-2">
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            {form.mp_type === 'Time In' ? 'Time Out' : 'Time In'}
                          </label>
                          <TimeSelect
                            required
                            value={form.mp_time2 ?? ''}
                            onChange={(v) => setField('mp_time2', v)}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reason</label>
                    <textarea
                      required rows={3}
                      value={form.reason ?? ''}
                      onChange={(e) => setField('reason', e.target.value)}
                      placeholder="Why is a manual punch needed?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Proof / Supporting Document <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setMpProofFile(e.target.files?.[0] ?? null)}
                      className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer"
                    />
                    {mpProofFile && (
                      <p className="mt-1 text-xs text-green-600">✓ {mpProofFile.name}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">Accepted: JPG, PNG, PDF (max 5 MB)</p>
                  </div>
                </>
              )}

              {submitError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{submitError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 border-2 border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
