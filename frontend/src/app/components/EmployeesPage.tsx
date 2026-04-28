import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users, Plus, Pencil, Search, ChevronLeft, ChevronRight,
  X, CheckCircle, AlertCircle, Loader2, Filter, Camera, Upload, Trash2, Calendar,
} from 'lucide-react';
import { employeesApi, departmentsApi, type Employee } from '@/lib/api';
import { UserRole } from '../App';
import ShiftScheduleTab from './ShiftScheduleTab';

interface Props { userRole: UserRole; userDept?: string; isReadOnly?: boolean; }

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) ?? '';

const SHIFTS = [
  'Shift 1: 6 AM to 2 PM',
  'Shift 2: 2 PM to 10 PM',
  'Shift 3: 10 PM to 6 AM',
  'Shift 4: 6 AM to 6 PM',
  'Shift 5: 6 PM to 6 AM',
];
const EMP_TYPES = ['Regular', 'Probationary', 'Trainee', 'Part-Time', 'Contractual', 'Project-based', 'Resigned', 'Terminated'];
const ACC_TYPES = ['Employee', 'Supervisor', 'Admin', 'Management'];

// ─── Government ID formatters ────────────────────────────────
function fmtSSS(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 2) return d;
  if (d.length <= 9) return d.slice(0, 2) + '-' + d.slice(2);
  return d.slice(0, 2) + '-' + d.slice(2, 9) + '-' + d.slice(9);
}
function fmtPagibig(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 12);
  const p: string[] = [];
  if (d.length > 0) p.push(d.slice(0, 4));
  if (d.length > 4) p.push(d.slice(4, 8));
  if (d.length > 8) p.push(d.slice(8, 12));
  return p.join('-');
}
function fmtPhilHealth(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 12);
  if (d.length <= 2) return d;
  if (d.length <= 11) return d.slice(0, 2) + '-' + d.slice(2);
  return d.slice(0, 2) + '-' + d.slice(2, 11) + '-' + d.slice(11);
}
function fmtTIN(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 9);
  const p: string[] = [];
  if (d.length > 0) p.push(d.slice(0, 3));
  if (d.length > 3) p.push(d.slice(3, 6));
  if (d.length > 6) p.push(d.slice(6, 9));
  return p.join('-');
}

// Only letters and spaces
function lettersOnly(v: string) { return v.replace(/[^a-zA-Z\s]/g, ''); }
// Only digits
function digitsOnly(v: string) { return v.replace(/\D/g, ''); }

// Auto-generate middle initial
function toInitial(mname: string) {
  if (!mname.trim()) return '';
  return mname.trim().split(/\s+/).map((w) => (w[0] ?? '').toUpperCase() + '.').join('');
}

type FormState = Partial<Employee> & {
  emp_pass?: string;
  _customDept?: string;
  _customShift?: string;
  _shiftStart?: string;
  _shiftEnd?: string;
  _empTypeChanged?: boolean;
  _empTypeApplyDate?: string;
  _empTypeApplyImmediate?: boolean;
};

const EMPTY_FORM: FormState = {
  employee_id: undefined,
  emp_fname: '', emp_mname: '', emp_minit: '', emp_lname: '',
  emp_gender: '',
  emp_dept: '', emp_position: '',
  emp_emptype: '', emp_acc_type: 'Employee',
  emp_shift: '', emp_datehire: '',
  emp_dailyrate: 0,
  emp_sss: '', emp_pagibig: '', emp_philhealth: '', emp_tin: '',
  emp_username: '', emp_pass: '',
  _customDept: '', _customShift: '',
  _shiftStart: '', _shiftEnd: '',
  _empTypeChanged: false, _empTypeApplyDate: '', _empTypeApplyImmediate: true,
};

type ActiveTab = 'directory' | 'schedule';

export default function EmployeesPage({ userRole, userDept, isReadOnly = false }: Props) {
  const isAdmin = userRole === 'admin' || userRole === 'management' || userRole === 'superadmin';
  const isSupervisor = userRole === 'supervisor';
  const [activeTab, setActiveTab] = useState<ActiveTab>('directory');

  // ── List state ───────────────────────────────────────────
  const [rows, setRows]         = useState<Employee[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit                   = 20;
  const [loading, setLoading]   = useState(false);
  const [listError, setListError] = useState('');
  const [departments, setDepts] = useState<string[]>([]);

  // Applied filters (separate from live inputs to prevent blink)
  const [filterName, setFilterName] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [applied, setApplied]       = useState({ name: '', dept: '' });

  // ── Modal state ──────────────────────────────────────────
  const [modalMode,    setModalMode]    = useState<'add' | 'edit' | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [deleteError, setDeleteError]   = useState('');
  const [hardDeleteTarget, setHardDeleteTarget] = useState<Employee | null>(null);
  const [hardDeleting, setHardDeleting] = useState(false);
  const [hardDeleteError, setHardDeleteError] = useState('');
  const [form,         setForm]         = useState<FormState>({ ...EMPTY_FORM });
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState('');
  const [saveSuccess,  setSaveSuccess]  = useState('');
  const [manualId,     setManualId]     = useState(false);
  const [hireDateToday, setHireDateToday] = useState(false);
  const [origEmpType,  setOrigEmpType]  = useState('');

  // Photo
  const [photoFile,    setPhotoFile]    = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Signature
  const [signFile, setSignFile]     = useState<File | null>(null);
  const signFileRef   = useRef<HTMLInputElement>(null);


  // ── Departments ───────────────────────────────────────────
  useEffect(() => {
    departmentsApi.list().then(setDepts).catch(() => {});
  }, []);

  // ── Fetch list ────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    setLoading(true); setListError('');
    try {
      const res = await employeesApi.list({
        page, limit,
        ...(applied.name && { name: applied.name }),
        // Supervisors are always scoped to their own department
        dept: (isSupervisor && userDept) ? userDept : (applied.dept || undefined),
      });
      setRows(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (e: any) {
      setListError(e.message ?? 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [page, limit, applied, isSupervisor, userDept]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const applyFilters = () => { setPage(1); setApplied({ name: filterName, dept: filterDept }); };
  const clearFilters = () => { setFilterName(''); setFilterDept(''); setPage(1); setApplied({ name: '', dept: '' }); };


  // ── Open modal ────────────────────────────────────────────
  const resetFiles = () => {
    setPhotoFile(null); setPhotoPreview('');
    setSignFile(null);
    setManualId(false);
    setHireDateToday(false);
  };

  const openAdd = async () => {
    setSaveError(''); setSaveSuccess('');
    const baseForm = { ...EMPTY_FORM };
    try {
      const res = await employeesApi.nextId();
      (baseForm as any).employee_id = String(res.next_id);
    } catch {}
    setForm(baseForm);
    resetFiles();
    setModalMode('add');
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await employeesApi.delete(deleteConfirmId);
      setDeleteConfirmId(null);
      fetchList();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  const handleHardDelete = async () => {
    if (!hardDeleteTarget) return;
    setHardDeleting(true);
    setHardDeleteError('');
    try {
      await employeesApi.hardDelete(hardDeleteTarget.uniq_id!);
      setHardDeleteTarget(null);
      fetchList();
    } catch (err: unknown) {
      setHardDeleteError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setHardDeleting(false);
    }
  };

  const openEdit = (emp: Employee) => {
    setSaveError(''); setSaveSuccess('');
    const isCustomShift = emp.emp_shift && !SHIFTS.includes(emp.emp_shift);
    // Parse custom shift HH:MM to _shiftStart/_shiftEnd
    let shiftStart = '', shiftEnd = '';
    if (isCustomShift && emp.emp_shift) {
      const m = emp.emp_shift.match(/(\d{2}:\d{2})\s+to\s+(\d{2}:\d{2})/i);
      if (m) { shiftStart = m[1]; shiftEnd = m[2]; }
    }
    setOrigEmpType(emp.emp_emptype ?? '');
    setForm({
      ...emp,
      emp_pass: '',
      _customDept:  '',
      _customShift: isCustomShift ? emp.emp_shift : '',
      emp_shift:    isCustomShift ? '__custom__' : (emp.emp_shift ?? ''),
      _shiftStart: shiftStart,
      _shiftEnd: shiftEnd,
      _empTypeChanged: false,
      _empTypeApplyDate: '',
      _empTypeApplyImmediate: true,
    });
    // Show current photo & signature
    setPhotoPreview(emp.emp_photo ? `${BACKEND}/${emp.emp_photo}` : '');
    setPhotoFile(null);
    setSignFile(null);
    setManualId(false);
    setModalMode('edit');
  };

  const closeModal = () => { if (!saving) setModalMode(null); };

  // ── Save ──────────────────────────────────────────────────
  const handleSave = async () => {
    setSaveError(''); setSaveSuccess('');

    const payload = { ...form };
    if (payload.emp_dept === '__custom__')  payload.emp_dept  = payload._customDept  ?? '';
    if (payload.emp_shift === '__custom__') {
      // Build shift string from time pickers
      if (payload._shiftStart && payload._shiftEnd) {
        payload.emp_shift = payload._shiftStart + ' to ' + payload._shiftEnd;
      } else {
        payload.emp_shift = payload._customShift ?? '';
      }
    }

    // Validation for add mode
    if (modalMode === 'add') {
      if (!payload.employee_id)  return setSaveError('Employee ID is required.');
      if (!payload.emp_fname || !payload.emp_lname) return setSaveError('First and Last name are required.');
      if (!payload.emp_gender)   return setSaveError('Sex is required.');
      if (!payload.emp_dept)     return setSaveError('Department is required.');
      if (!payload.emp_position) return setSaveError('Position is required.');
      if (!payload.emp_emptype)  return setSaveError('Employment type is required.');
      if (!payload.emp_datehire) return setSaveError('Date hired is required.');
      if (!payload.emp_acc_type) return setSaveError('Account type is required.');
      if (!payload.emp_dailyrate && (payload.emp_dailyrate as number) <= 0) return setSaveError('Daily rate is required.');
      if (!payload.emp_username) return setSaveError('Username is required.');
    }

    // Validate employment type change has a date if not immediate
    if (modalMode === 'edit' && payload._empTypeChanged && !payload._empTypeApplyImmediate && !payload._empTypeApplyDate) {
      return setSaveError('Please specify an effective date for the employment type change, or check "Apply Immediately".');
    }

    const fd = new FormData();

    // Text fields
    const textFields: (keyof FormState)[] = [
      'uniq_id', 'employee_id', 'emp_fname', 'emp_mname', 'emp_minit', 'emp_lname', 'emp_gender',
      'emp_dept', 'emp_position', 'emp_emptype', 'emp_acc_type',
      'emp_shift', 'emp_datehire', 'emp_dailyrate',
      'emp_sss', 'emp_pagibig', 'emp_philhealth', 'emp_tin',
      'emp_username',
    ];
    textFields.forEach((k) => {
      const v = payload[k];
      if (v !== undefined && v !== null) fd.append(k, String(v));
    });

    // Password: always send in add mode; only if non-empty in edit
    if (modalMode === 'add') {
      fd.append('emp_pass', payload.emp_pass ?? 'Family Care');
    } else if (payload.emp_pass) {
      fd.append('emp_pass', payload.emp_pass);
    }

    // Employment type effective date
    if (modalMode === 'edit' && payload._empTypeChanged) {
      if (payload._empTypeApplyImmediate) {
        fd.append('emptype_effective_date', 'immediate');
      } else if (payload._empTypeApplyDate) {
        fd.append('emptype_effective_date', payload._empTypeApplyDate);
      }
    }

    // Files
    if (photoFile) fd.append('emp_photo', photoFile);
    if (signFile) fd.append('signature_file', signFile);

    setSaving(true);
    try {
      if (modalMode === 'add') {
        await employeesApi.create(fd);
        setSaveSuccess('Employee created successfully!');
      } else {
        await employeesApi.update(fd);
        setSaveSuccess('Employee updated successfully!');
      }
      fetchList();
      setTimeout(() => setModalMode(null), 1400);
    } catch (e: any) {
      setSaveError(e.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ── Styling helpers ───────────────────────────────────────
  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300';
  const roInputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed';
  const labelCls = 'text-xs text-gray-500 block mb-1 font-medium';

  return (
    <div className="space-y-4 md:space-y-6">

      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 text-white p-3 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">Employees</h1>
              <p className="text-sm text-gray-500">
                {total > 0 ? `${total} active employee${total !== 1 ? 's' : ''}` : 'Employee directory'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {/* Tab switcher */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setActiveTab('directory')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                  ${activeTab === 'directory' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                <Users size={14} /> Directory
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                  ${activeTab === 'schedule' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                <Calendar size={14} /> Shift Schedule
              </button>
            </div>
            {/* Add Employee — only in Directory tab */}
            {activeTab === 'directory' && isAdmin && !isReadOnly && (
              <button onClick={openAdd}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                <Plus size={16} /> Add Employee
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Shift Schedule Tab ───────────────────────────────── */}
      {activeTab === 'schedule' && (
        <ShiftScheduleTab userRole={userRole} userDept={userDept} isReadOnly={isReadOnly} />
      )}

      {/* ── Directory Tab: Filters + Table ───────────────────── */}
      {activeTab === 'directory' && (
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <div className="flex flex-wrap gap-3 mb-5 items-end">
          <div>
            <label className={labelCls}>Search Name</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input type="text" value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                placeholder="Search..."
                className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-44" />
            </div>
          </div>
          {!isSupervisor && (
            <div>
              <label className={labelCls}>Department</label>
              <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-44">
                <option value="">All departments</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={applyFilters}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
              <Filter size={14} /> Apply
            </button>
            <button onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-medium">
              Clear
            </button>
          </div>
        </div>

        {listError && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm mb-4">
            <AlertCircle size={16} /> {listError}
          </div>
        )}

        {/* ── Loading / empty ── */}
        {loading && (
          <div className="rounded-xl border border-gray-200 flex items-center justify-center py-16 text-gray-400 gap-3">
            <Loader2 size={22} className="animate-spin" /><span>Loading...</span>
          </div>
        )}
        {!loading && rows.length === 0 && (
          <div className="rounded-xl border border-gray-200 py-16 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-3">
              <Users size={26} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No employees found</p>
          </div>
        )}

        {!loading && rows.length > 0 && (
          <>
            {/* ── Mobile card list (< md) ── */}
            <div className="md:hidden space-y-2">
              {rows.map((r, idx) => {
                const isSeparated = ['Resigned', 'Terminated'].includes(r.emp_emptype ?? '');
                const prevIsSeparated = idx > 0 && ['Resigned', 'Terminated'].includes(rows[idx - 1]?.emp_emptype ?? '');
                return (
                  <React.Fragment key={r.employee_id}>
                    {isSeparated && !prevIsSeparated && (
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 pt-2">
                        Resigned / Terminated
                      </p>
                    )}
                    <div className={`rounded-xl border p-3 ${isSeparated ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {r.emp_photo
                          ? <img src={`${BACKEND}/${r.emp_photo}`} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-200" />
                          : <div className="w-9 h-9 rounded-full bg-blue-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {(r.emp_fullname ?? 'U')[0].toUpperCase()}
                            </div>
                        }
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-semibold truncate ${isSeparated ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{r.emp_fullname}</p>
                          <p className="text-xs text-gray-500 truncate">{r.emp_position || '-'} · {r.emp_dept || '-'}</p>
                        </div>
                        {isAdmin && !isReadOnly && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button onClick={() => openEdit(r)} title="Edit"
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors">
                              <Pencil size={14} />
                            </button>
                            {isSeparated && (
                              <button onClick={() => { setHardDeleteTarget(r); setHardDeleteError(''); }} title="Delete"
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <EmpTypeBadge type={r.emp_emptype} />
                        <AccTypeBadge type={r.emp_acc_type} />
                        {r.emp_shift && (
                          <span className="text-[11px] text-gray-500 bg-gray-100 rounded px-1.5 py-0.5 truncate max-w-[160px]">{r.emp_shift}</span>
                        )}
                        <span className="text-[11px] text-gray-400 ml-auto">#{r.employee_id}</span>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* ── Desktop table (≥ md) ── */}
            <div className="hidden md:block rounded-xl border border-gray-200 overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 table-fixed">
                <thead>
                  <tr>
                    <th className="w-12 px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">ID</th>
                    <th className="w-40 px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">Name</th>
                    <th className="w-28 px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">Dept</th>
                    <th className="w-28 px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">Position</th>
                    <th className="w-24 px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">Type</th>
                    <th className="w-24 px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">Account</th>
                    <th className="w-32 px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">Shift</th>
                    {isAdmin && <th className="w-16 px-2 py-2 bg-gray-50"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {rows.map((r, idx) => {
                    const isSeparated = ['Resigned', 'Terminated'].includes(r.emp_emptype ?? '');
                    const prevIsSeparated = idx > 0 && ['Resigned', 'Terminated'].includes(rows[idx - 1]?.emp_emptype ?? '');
                    return (
                      <React.Fragment key={r.employee_id}>
                        {isSeparated && !prevIsSeparated && (
                          <tr key={`sep-${r.employee_id}`}>
                            <td colSpan={isAdmin ? 8 : 7} className="px-3 py-1.5 bg-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide border-t-2 border-gray-300">
                              Resigned / Terminated
                            </td>
                          </tr>
                        )}
                        <tr className={`transition-colors ${isSeparated ? 'bg-gray-50 opacity-70 hover:opacity-100 hover:bg-red-50/30' : 'hover:bg-blue-50/40'}`}>
                          <td className="px-2 py-2 text-xs text-gray-500 truncate">{r.employee_id}</td>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {r.emp_photo
                                ? <img src={`${BACKEND}/${r.emp_photo}`} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-gray-200"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty('display', 'flex'); }} />
                                : null
                              }
                              <div className="w-6 h-6 rounded-full bg-blue-400 items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                                style={{ display: r.emp_photo ? 'none' : 'flex' }}>
                                {(r.emp_fullname ?? 'U')[0].toUpperCase()}
                              </div>
                              <span className={`text-xs font-medium truncate ${isSeparated ? 'text-gray-500 line-through decoration-gray-400' : 'text-gray-800'}`}>{r.emp_fullname}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-xs text-gray-700 truncate">{r.emp_dept || '-'}</td>
                          <td className="px-2 py-2 text-xs text-gray-700 truncate">{r.emp_position || '-'}</td>
                          <td className="px-2 py-2"><EmpTypeBadge type={r.emp_emptype} /></td>
                          <td className="px-2 py-2"><AccTypeBadge type={r.emp_acc_type} /></td>
                          <td className="px-2 py-2 text-xs text-gray-600 truncate">{r.emp_shift || '-'}</td>
                          {isAdmin && (
                            <td className="px-2 py-2">
                              {!isReadOnly && (
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => openEdit(r)} title="Edit"
                                  className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors">
                                  <Pencil size={13} />
                                </button>
                                {isSeparated && (
                                  <button onClick={() => { setHardDeleteTarget(r); setHardDeleteError(''); }} title="Permanently delete"
                                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors">
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                              )}
                            </td>
                          )}
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && rows.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
            <p className="text-sm text-gray-500">
              Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} of {total.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let s = 1;
                if (totalPages > 5) {
                  if (page <= 3) s = 1;
                  else if (page >= totalPages - 2) s = totalPages - 4;
                  else s = page - 2;
                }
                const pg = s + i;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium ${pg === page ? 'bg-blue-500 text-white' : 'border border-gray-300 hover:bg-gray-50 text-gray-700'}`}>
                    {pg}
                  </button>
                );
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
      )} {/* end directory tab */}

      {/* Hard-delete confirmation modal */}
      {hardDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !hardDeleting && setHardDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full"><Trash2 size={20} className="text-red-600" /></div>
              <h3 className="font-bold text-lg text-gray-800">Permanently Delete Employee</h3>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-red-700">⚠ This action cannot be undone.</p>
              <p className="text-sm text-red-600">
                Deleting <strong>{hardDeleteTarget.emp_fullname}</strong> will permanently remove:
              </p>
              <ul className="text-xs text-red-600 list-disc list-inside space-y-0.5 ml-1">
                <li>Employee profile and all personal data</li>
                <li>All attendance records</li>
                <li>All leave and request history</li>
                <li>All payroll records</li>
              </ul>
            </div>
            {hardDeleteError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{hardDeleteError}</p>
            )}
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleHardDelete}
                disabled={hardDeleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {hardDeleting ? <><Loader2 size={14} className="animate-spin" /> Deleting...</> : 'Yes, Delete Everything'}
              </button>
              <button
                onClick={() => setHardDeleteTarget(null)}
                disabled={hardDeleting}
                className="flex-1 py-2.5 border-2 border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col z-10">

            <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 text-white p-2 rounded-lg">
                  {modalMode === 'add' ? <Plus size={18} /> : <Pencil size={18} />}
                </div>
                <h3 className="font-bold text-lg text-gray-800">
                  {modalMode === 'add' ? 'Add New Employee' : `Edit: ${form.emp_fullname || 'Employee'}`}
                </h3>
              </div>
              {!saving && (
                <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="overflow-y-auto p-5 space-y-5 flex-1">
              {saveError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  <AlertCircle size={16} /> {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                  <CheckCircle size={16} /> {saveSuccess}
                </div>
              )}

              {/* Profile Photo */}
              <Section title="Profile Photo">
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    {photoPreview
                      ? <img src={photoPreview} alt="Photo" className="w-20 h-20 rounded-full object-cover border-2 border-blue-200"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty('display', 'flex'); }} />
                      : null
                    }
                    <div className="w-20 h-20 rounded-full bg-blue-400 items-center justify-center text-white text-2xl font-bold border-2 border-blue-200"
                      style={{ display: photoPreview ? 'none' : 'flex' }}>
                      {((form.emp_fname ?? 'E')[0] ?? 'E').toUpperCase()}
                    </div>
                    <button type="button" onClick={() => photoInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1.5 shadow hover:bg-blue-700 transition-colors">
                      <Camera size={12} />
                    </button>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Upload Profile Picture</p>
                    <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, JPEG, or JFIF. Max 5 MB.</p>
                    <button type="button" onClick={() => photoInputRef.current?.click()}
                      className="mt-2 text-xs px-3 py-1.5 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                      Choose File
                    </button>
                    {photoFile && (
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                        <CheckCircle size={12} className="text-green-500" />
                        {photoFile.name}
                        <button onClick={() => { setPhotoFile(null); setPhotoPreview(form.emp_photo ? `${BACKEND}/${form.emp_photo}` : ''); }}
                          className="ml-1 text-red-400 hover:text-red-600"><X size={12} /></button>
                      </div>
                    )}
                  </div>
                  <input ref={photoInputRef} type="file"
                    accept="image/png,image/jpeg,image/jpg,image/jfif,.jfif"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); }
                    }} />
                </div>
              </Section>

              {/* Personal Information */}
              <Section title="Personal Information">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>First Name *</label>
                    <input className={inputCls} value={form.emp_fname ?? ''} placeholder="First name"
                      onChange={(e) => setField('emp_fname', lettersOnly(e.target.value))} />
                  </div>
                  <div>
                    <label className={labelCls}>Middle Name</label>
                    <input className={inputCls} value={form.emp_mname ?? ''} placeholder="Middle name"
                      onChange={(e) => {
                        const v = lettersOnly(e.target.value);
                        setForm((f) => ({ ...f, emp_mname: v, emp_minit: toInitial(v) }));
                      }} />
                  </div>
                  <div>
                    <label className={labelCls}>Last Name *</label>
                    <input className={inputCls} value={form.emp_lname ?? ''} placeholder="Last name"
                      onChange={(e) => setField('emp_lname', lettersOnly(e.target.value))} />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="max-w-[160px]">
                    <label className={labelCls}>Middle Initial <span className="text-gray-400">(auto)</span></label>
                    <input className={roInputCls} readOnly value={form.emp_minit ?? ''} placeholder="Auto from middle name" />
                  </div>
                  <div>
                    <label className={labelCls}>Sex{modalMode === 'add' && <span className="text-red-500"> *</span>}</label>
                    <select className={inputCls} value={form.emp_gender ?? ''}
                      onChange={(e) => setField('emp_gender' as any, e.target.value)}>
                      <option value="">- Select -</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
              </Section>

              {/* Employment Details */}
              <Section title="Employment Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {modalMode === 'add' ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={labelCls + ' mb-0'}>Employee ID *</label>
                        <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                          <input type="checkbox" checked={manualId}
                            onChange={(e) => setManualId(e.target.checked)} className="rounded" />
                          Manual entry
                        </label>
                      </div>
                      <input
                        className={manualId ? inputCls : roInputCls}
                        readOnly={!manualId}
                        value={String(form.employee_id ?? '')}
                        placeholder="Auto-assigned"
                        onChange={(e) => setField('employee_id' as any, digitsOnly(e.target.value) as any)}
                      />
                      {!manualId && <p className="text-xs text-gray-400 mt-0.5">Auto-assigned. Check "Manual entry" to override.</p>}
                    </div>
                  ) : (
                    <div>
                      <label className={labelCls}>Employee ID</label>
                      {isAdmin ? (
                        <>
                          <input
                            className={inputCls}
                            value={String(form.employee_id ?? '')}
                            onChange={(e) => setField('employee_id' as any, digitsOnly(e.target.value) as any)}
                            placeholder="Employee ID"
                          />
                          <p className="text-xs text-orange-500 mt-0.5">⚠ Changing this ID updates the employee record.</p>
                        </>
                      ) : (
                        <input className={roInputCls} readOnly value={String(form.employee_id ?? '')} />
                      )}
                    </div>
                  )}
                  <div>
                    <label className={labelCls}>Department{modalMode === 'add' && <span className="text-red-500"> *</span>}</label>
                    <select className={inputCls}
                      value={departments.includes(form.emp_dept ?? '') ? (form.emp_dept ?? '') : (form.emp_dept ? '__custom__' : '')}
                      onChange={(e) => setField('emp_dept', e.target.value)}>
                      <option value="">- Select -</option>
                      {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                      <option value="__custom__">Other (type below)</option>
                    </select>
                    {(form.emp_dept === '__custom__' || (!departments.includes(form.emp_dept ?? '') && form.emp_dept && form.emp_dept !== '__custom__')) && (
                      <input className={`${inputCls} mt-1`}
                        value={form.emp_dept === '__custom__' ? (form._customDept ?? '') : (form.emp_dept ?? '')}
                        onChange={(e) => {
                          if (form.emp_dept === '__custom__') setField('_customDept', e.target.value);
                          else setField('emp_dept', e.target.value);
                        }}
                        placeholder="Enter department name" />
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Position{modalMode === 'add' && <span className="text-red-500"> *</span>}</label>
                    <input className={inputCls} value={form.emp_position ?? ''} placeholder="e.g. Nurse"
                      onChange={(e) => setField('emp_position', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Employment Type{modalMode === 'add' && <span className="text-red-500"> *</span>}</label>
                    <select className={inputCls} value={form.emp_emptype ?? ''} onChange={(e) => {
                      const newType = e.target.value;
                      const changed = modalMode === 'edit' && newType !== origEmpType;
                      setForm((f) => ({ ...f, emp_emptype: newType, _empTypeChanged: changed, _empTypeApplyImmediate: true, _empTypeApplyDate: '' }));
                    }}>
                      {modalMode === 'add' && <option value="">- Select -</option>}
                      {EMP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {modalMode === 'edit' && form._empTypeChanged && (
                      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                        <p className="text-xs font-semibold text-amber-800">Employment type changed -- choose when to apply:</p>
                        <label className="flex items-center gap-2 text-xs text-amber-800 cursor-pointer">
                          <input type="checkbox" checked={form._empTypeApplyImmediate ?? true}
                            onChange={(e) => setField('_empTypeApplyImmediate', e.target.checked)}
                            className="rounded" />
                          Apply Immediately
                        </label>
                        {!form._empTypeApplyImmediate && (
                          <div>
                            <label className="text-xs text-gray-600 block mb-0.5">Effective Date</label>
                            <input type="date" className={inputCls} value={form._empTypeApplyDate ?? ''}
                              onChange={(e) => setField('_empTypeApplyDate', e.target.value)}
                              min={new Date().toISOString().split('T')[0]} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Account Type</label>
                    <select className={inputCls} value={form.emp_acc_type ?? ''} onChange={(e) => setField('emp_acc_type', e.target.value)}>
                      {[...ACC_TYPES, ...(userRole === 'superadmin' ? ['Superadmin'] : [])].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={labelCls + ' mb-0'}>Date Hired{modalMode === 'add' && <span className="text-red-500"> *</span>}</label>
                      {modalMode === 'add' && (
                        <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                          <input type="checkbox" checked={hireDateToday}
                            onChange={(e) => {
                              setHireDateToday(e.target.checked);
                              if (e.target.checked) setField('emp_datehire', new Date().toISOString().split('T')[0]);
                            }}
                            className="rounded" />
                          Today
                        </label>
                      )}
                    </div>
                    <input type="date"
                      className={hireDateToday ? roInputCls : inputCls}
                      readOnly={hireDateToday}
                      value={form.emp_datehire ?? ''}
                      onChange={(e) => setField('emp_datehire', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Daily Rate{modalMode === 'add' && <span className="text-red-500"> *</span>}</label>
                    <input type="number" min={0} className={inputCls}
                      value={form.emp_dailyrate === 0 ? '' : (form.emp_dailyrate ?? '')}
                      placeholder="0"
                      onChange={(e) => setField('emp_dailyrate', e.target.value === '' ? 0 : Number(e.target.value))} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Shift</label>
                    <select className={inputCls}
                      value={SHIFTS.includes(form.emp_shift ?? '') ? (form.emp_shift ?? '') : (form.emp_shift ? '__custom__' : '')}
                      onChange={(e) => setForm((f) => ({ ...f, emp_shift: e.target.value, _customShift: '', _shiftStart: '', _shiftEnd: '' }))}>
                      <option value="">- Select shift -</option>
                      {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
                      <option value="__custom__">Other (custom time)</option>
                    </select>
                    {form.emp_shift === '__custom__' && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 block mb-0.5">From</label>
                          <input type="time" className={inputCls} value={form._shiftStart ?? ''}
                            onChange={(e) => setField('_shiftStart', e.target.value)} />
                        </div>
                        <span className="text-gray-400 mt-4">to</span>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 block mb-0.5">To</label>
                          <input type="time" className={inputCls} value={form._shiftEnd ?? ''}
                            onChange={(e) => setField('_shiftEnd', e.target.value)} />
                        </div>
                      </div>
                    )}
                    {(form.emp_shift && !SHIFTS.includes(form.emp_shift) && form.emp_shift !== '__custom__') && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 block mb-0.5">From</label>
                          <input type="time" className={inputCls} value={form._shiftStart ?? ''}
                            onChange={(e) => setField('_shiftStart', e.target.value)} />
                        </div>
                        <span className="text-gray-400 mt-4">to</span>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 block mb-0.5">To</label>
                          <input type="time" className={inputCls} value={form._shiftEnd ?? ''}
                            onChange={(e) => setField('_shiftEnd', e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Section>

              {/* Government IDs */}
              <Section title="Government IDs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>SSS Number (##-#######-#)</label>
                    <input className={inputCls} value={form.emp_sss ?? ''} placeholder="00-0000000-0"
                      onChange={(e) => setField('emp_sss', fmtSSS(e.target.value))} />
                  </div>
                  <div>
                    <label className={labelCls}>Pag-IBIG Number (####-####-####)</label>
                    <input className={inputCls} value={form.emp_pagibig ?? ''} placeholder="0000-0000-0000"
                      onChange={(e) => setField('emp_pagibig', fmtPagibig(e.target.value))} />
                  </div>
                  <div>
                    <label className={labelCls}>PhilHealth Number (##-#########-#)</label>
                    <input className={inputCls} value={form.emp_philhealth ?? ''} placeholder="00-000000000-0"
                      onChange={(e) => setField('emp_philhealth', fmtPhilHealth(e.target.value))} />
                  </div>
                  <div>
                    <label className={labelCls}>TIN (###-###-###)</label>
                    <input className={inputCls} value={form.emp_tin ?? ''} placeholder="000-000-000"
                      onChange={(e) => setField('emp_tin', fmtTIN(e.target.value))} />
                  </div>
                </div>
              </Section>

              {/* Login Credentials - Add mode only */}
              {modalMode === 'add' && (
                <Section title="Login Credentials">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Username *</label>
                      <input className={inputCls} value={form.emp_username ?? ''} placeholder="Username"
                        onChange={(e) => setField('emp_username', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>Password</label>
                      <input type="text" className={roInputCls} readOnly value="Family Care" />
                      <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        Default password is <strong>Family Care</strong>. Employee must change it on first login.
                      </p>
                    </div>
                  </div>
                </Section>
              )}

              {/* Signature - Upload only */}
              <Section title="Signature">
                <p className="text-xs text-gray-400 mb-2">Upload a PNG or JPEG image of your signature.</p>
                <button type="button" onClick={() => signFileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-xs hover:bg-gray-50">
                  <Upload size={13} /> Choose signature image
                </button>
                <input ref={signFileRef} type="file" accept="image/png,image/jpeg,image/jpg" className="hidden"
                  onChange={(e) => { setSignFile(e.target.files?.[0] ?? null); }} />
                {signFile && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <CheckCircle size={12} className="text-green-500" /> {signFile.name}
                    <button onClick={() => setSignFile(null)} className="text-red-400 hover:text-red-600"><X size={12} /></button>
                  </div>
                )}
                {!signFile && (form as any).emp_sign && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-400 mb-1">Current signature:</p>
                    <img src={`${BACKEND}/${(form as any).emp_sign}`} alt="Signature" className="h-12 border border-gray-200 rounded p-1 bg-white" />
                  </div>
                )}
              </Section>
            </div>

            <div className="p-5 border-t border-gray-200 flex gap-3 justify-end flex-shrink-0">
              <button onClick={closeModal} disabled={saving}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-40 text-gray-700 rounded-lg text-sm font-medium">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                {saving ? <Loader2 size={16} className="animate-spin" /> : (modalMode === 'add' ? <Plus size={16} /> : <CheckCircle size={16} />)}
                {saving ? 'Saving...' : (modalMode === 'add' ? 'Create Employee' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-3 pb-1 border-b border-gray-100">{title}</h4>
      {children}
    </div>
  );
}

function EmpTypeBadge({ type }: { type: string }) {
  const cfg: Record<string, string> = {
    Regular:      'bg-green-100 text-green-700',
    Probationary: 'bg-yellow-100 text-yellow-700',
    'Part-Time':  'bg-blue-100 text-blue-700',
    Contractual:  'bg-purple-100 text-purple-700',
    Resigned:     'bg-gray-100 text-gray-500',
    Terminated:   'bg-red-100 text-red-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg[type] ?? 'bg-gray-100 text-gray-600'}`}>{type}</span>;
}

function AccTypeBadge({ type }: { type: string }) {
  const cfg: Record<string, string> = {
    Employee:   'bg-gray-100 text-gray-600',
    Supervisor: 'bg-blue-100 text-blue-700',
    Admin:      'bg-red-100 text-red-700',
    Management: 'bg-purple-100 text-purple-700',
    Superadmin: 'bg-amber-100 text-amber-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg[type] ?? 'bg-gray-100 text-gray-600'}`}>{type}</span>;
}