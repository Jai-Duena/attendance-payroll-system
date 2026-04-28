import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, Users, User, Loader2, Save,
  CheckCircle, AlertCircle, Calendar, Search, Maximize2, X,
} from 'lucide-react';
import {
  employeesApi, departmentsApi, shiftScheduleApi,
  type Employee,
} from '@/lib/api';
import { UserRole } from '../App';

// ── Constants ─────────────────────────────────────────────────────────────────

const PRESET_SHIFTS: { label: string; start: string; end: string }[] = [
  { label: 'Shift 1: 6 AM to 2 PM',  start: '06:00', end: '14:00' },
  { label: 'Shift 2: 2 PM to 10 PM', start: '14:00', end: '22:00' },
  { label: 'Shift 3: 10 PM to 6 AM', start: '22:00', end: '06:00' },
  { label: 'Shift 4: 6 AM to 6 PM',  start: '06:00', end: '18:00' },
  { label: 'Shift 5: 6 PM to 6 AM',  start: '18:00', end: '06:00' },
];

const SHORT_LABELS: Record<string, string> = {
  'Shift 1: 6 AM to 2 PM':  'S1',
  'Shift 2: 2 PM to 10 PM': 'S2',
  'Shift 3: 10 PM to 6 AM': 'S3',
  'Shift 4: 6 AM to 6 PM':  'S4',
  'Shift 5: 6 PM to 6 AM':  'S5',
};

const SHORT_COLORS: Record<string, string> = {
  S1: 'bg-blue-100 text-blue-700',
  S2: 'bg-green-100 text-green-700',
  S3: 'bg-purple-100 text-purple-700',
  S4: 'bg-orange-100 text-orange-700',
  S5: 'bg-red-100 text-red-700',
};

// ── Types ─────────────────────────────────────────────────────────────────────

type CellMode   = 'weekly' | 'monthly';
type TargetMode = 'individual' | 'dept';
type ShiftEntry = { shift_start: string; shift_end: string; shift_label: string | null };
type ScheduleMap = Record<string, ShiftEntry>;
type EmpBasic = Pick<Employee, 'employee_id' | 'emp_fullname' | 'emp_dept' | 'emp_shift'>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getMondayOfWeek(d: Date): Date {
  const copy = new Date(d);
  const dow = copy.getDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function getWeekDates(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

function getMonthDates(ref: Date): Date[] {
  const year  = ref.getFullYear();
  const month = ref.getMonth();
  const days  = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
}

function cellKey(empId: number, date: string): string {
  return `${empId}_${date}`;
}

function parseCellKey(key: string): { empId: number; date: string } {
  const idx = key.indexOf('_');
  return { empId: parseInt(key.slice(0, idx), 10), date: key.slice(idx + 1) };
}

function shortLabel(entry: ShiftEntry): string {
  if (entry.shift_label && SHORT_LABELS[entry.shift_label]) return SHORT_LABELS[entry.shift_label];
  return 'C'; // custom
}

function shortColor(label: string): string {
  return SHORT_COLORS[label] ?? 'bg-gray-100 text-gray-600';
}

function entryToOption(entry: ShiftEntry | null): string {
  if (!entry) return '';
  const preset = PRESET_SHIFTS.find(
    p => p.start === entry.shift_start.slice(0, 5) && p.end === entry.shift_end.slice(0, 5)
  );
  return preset ? preset.label : '__custom__';
}

function fmtTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ── Sub-component: ShiftCell ──────────────────────────────────────────────────

interface ShiftCellProps {
  entry: ShiftEntry | null;
  canEdit: boolean;
  isDirty: boolean;
  compact: boolean; // true = monthly mode
  onChange: (entry: ShiftEntry | null) => void;
}

function ShiftCell({ entry, canEdit, isDirty, compact, onChange }: ShiftCellProps) {
  const [expanded, setExpanded]     = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState(entry?.shift_start?.slice(0, 5) ?? '');
  const [customEnd,   setCustomEnd]   = useState(entry?.shift_end?.slice(0, 5)   ?? '');
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync custom time from external entry change
  useEffect(() => {
    if (entry && entryToOption(entry) === '__custom__') {
      setCustomStart(entry.shift_start.slice(0, 5));
      setCustomEnd(entry.shift_end.slice(0, 5));
    } else {
      setCustomStart('');
      setCustomEnd('');
    }
    setShowCustom(false);
    if (!entry) setExpanded(false);
  }, [entry]);

  // Close on outside click (compact mode)
  useEffect(() => {
    if (!compact || !expanded) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
        setShowCustom(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [compact, expanded]);

  const handleSelect = (val: string) => {
    if (val === '') {
      setShowCustom(false);
      setExpanded(false);
      onChange(null);
      return;
    }
    if (val === '__custom__') {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    setExpanded(false);
    const preset = PRESET_SHIFTS.find(p => p.label === val)!;
    onChange({ shift_start: preset.start + ':00', shift_end: preset.end + ':00', shift_label: preset.label });
  };

  const applyCustom = () => {
    if (!customStart || !customEnd) return;
    onChange({ shift_start: customStart + ':00', shift_end: customEnd + ':00', shift_label: null });
    setShowCustom(false);
    setExpanded(false);
  };

  const sl   = entry ? shortLabel(entry) : null;
  const colorCls = sl ? shortColor(sl) : '';
  const ringCls  = isDirty ? 'ring-2 ring-amber-400' : '';

  // ── Read-only ──────────────────────────────────────────────
  if (!canEdit) {
    if (!entry) return <span className="text-xs text-gray-300 select-none">—</span>;
    const displayLabel = entry.shift_label ?? `${fmtTime(entry.shift_start)} – ${fmtTime(entry.shift_end)}`;
    return (
      <span className={`inline-block text-xs px-1.5 py-0.5 rounded font-medium ${colorCls}`}>
        {compact ? (sl ?? 'C') : displayLabel}
      </span>
    );
  }

  // ── Compact (monthly) edit mode ────────────────────────────
  if (compact) {
    return (
      <div ref={containerRef} className="relative inline-block">
        {!expanded ? (
          <button
            onClick={() => setExpanded(true)}
            title={entry ? (entry.shift_label ?? `${fmtTime(entry.shift_start)} – ${fmtTime(entry.shift_end)}`) : 'Assign shift'}
            className={`inline-flex items-center justify-center w-7 h-6 rounded text-xs font-semibold transition-all
              ${entry ? `${colorCls} hover:opacity-80` : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}
              ${ringCls}`}
          >
            {entry ? (sl ?? 'C') : '+'}
          </button>
        ) : (
          <div className="absolute z-30 top-0 left-0 bg-white rounded-lg shadow-xl border border-gray-200 p-2 min-w-[180px]">
            <select
              autoFocus
              value={showCustom ? '__custom__' : (entryToOption(entry))}
              onChange={e => handleSelect(e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
            >
              <option value="">— None —</option>
              {PRESET_SHIFTS.map(p => (
                <option key={p.label} value={p.label}>{p.label}</option>
              ))}
              <option value="__custom__">Custom time...</option>
            </select>
            {showCustom && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-1">
                  <input type="time" value={customStart} onChange={e => setCustomStart(e.target.value)}
                    className="flex-1 text-xs px-1.5 py-1 border border-gray-200 rounded focus:outline-none" />
                  <span className="text-gray-400 text-xs">–</span>
                  <input type="time" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                    className="flex-1 text-xs px-1.5 py-1 border border-gray-200 rounded focus:outline-none" />
                </div>
                <button onClick={applyCustom}
                  className="w-full text-xs py-1 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium">
                  Apply
                </button>
              </div>
            )}
            {!showCustom && (
              <button onClick={() => { setExpanded(false); setShowCustom(false); }}
                className="mt-1.5 w-full text-xs py-0.5 text-gray-400 hover:text-gray-600">
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Full (weekly) edit mode ────────────────────────────────
  return (
    <div className={`rounded ${ringCls}`}>
      <select
        value={showCustom ? '__custom__' : entryToOption(entry)}
        onChange={e => handleSelect(e.target.value)}
        className={`w-full text-xs px-1.5 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-blue-300
          ${isDirty ? 'border-amber-300 bg-amber-50/60' : 'border-gray-200 bg-white'}
          ${!entry && !showCustom ? 'text-gray-400' : 'text-gray-700'}`}
      >
        <option value="">— None —</option>
        {PRESET_SHIFTS.map(p => (
          <option key={p.label} value={p.label}>{p.label}</option>
        ))}
        <option value="__custom__">Custom time...</option>
      </select>
      {showCustom && (
        <div className="mt-1.5 space-y-1">
          <div className="flex items-center gap-1">
            <input type="time" value={customStart} onChange={e => setCustomStart(e.target.value)}
              className="flex-1 text-xs px-1.5 py-1 border border-gray-200 rounded focus:outline-none" />
            <span className="text-gray-400 text-[10px]">–</span>
            <input type="time" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
              className="flex-1 text-xs px-1.5 py-1 border border-gray-200 rounded focus:outline-none" />
          </div>
          <button onClick={applyCustom}
            className="w-full py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 font-medium">
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

// ── MonthlyCalendar ───────────────────────────────────────────────────────────
// One standard Mon–Sun calendar card per employee.

const CAL_DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface MonthlyCalendarProps {
  emp: EmpBasic;
  dates: Date[];
  todayStr: string;
  canEdit: boolean;
  dirty: Record<string, ShiftEntry | null>;
  getEntry: (empId: number, date: string) => ShiftEntry | null;
  setEntry: (empId: number, date: string, entry: ShiftEntry | null) => void;
  onExpand?: () => void;
  fullHeight?: boolean;
}

function MonthlyCalendar({ emp, dates, todayStr, canEdit, dirty, getEntry, setEntry, onExpand, fullHeight = false }: MonthlyCalendarProps) {
  // Build Mon-first padded grid
  const firstDow = dates[0].getDay(); // 0=Sun
  const offset   = firstDow === 0 ? 6 : firstDow - 1; // Mon=0 … Sun=6
  const cells: (Date | null)[] = [...Array(offset).fill(null), ...dates];
  while (cells.length % 7 !== 0) cells.push(null);
  const numRows = cells.length / 7;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden${fullHeight ? ' h-full flex flex-col' : ''}`}>
      {/* Employee header */}
      <div className="px-3 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{emp.emp_fullname}</p>
          <p className="text-xs text-gray-400 truncate">
            {emp.emp_dept}{emp.emp_shift ? ` · Default: ${emp.emp_shift}` : ''}
          </p>
        </div>
        {onExpand && (
          <button
            onClick={onExpand}
            title="View full screen"
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Maximize2 size={14} />
          </button>
        )}
      </div>
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50 flex-shrink-0">
        {CAL_DAY_NAMES.map(d => (
          <div key={d} className="py-1.5 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>
      {/* Calendar cells */}
      <div
        className={`grid grid-cols-7${fullHeight ? ' flex-1' : ''}`}
        style={fullHeight ? { gridTemplateRows: `repeat(${numRows}, 1fr)` } : undefined}
      >
        {cells.map((d, idx) => {
          if (!d) {
            return (
              <div key={`pad-${idx}`}
                className={`border-r border-b border-gray-50 bg-gray-50/30${fullHeight ? '' : ' min-h-[54px]'}`} />
            );
          }
          const dateStr   = toDateStr(d);
          const key       = cellKey(emp.employee_id, dateStr);
          const entry     = getEntry(emp.employee_id, dateStr);
          const isDirty   = key in dirty;
          const isToday   = dateStr === todayStr;
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          return (
            <div key={dateStr}
              className={`border-r border-b border-gray-100 p-1 flex flex-col
                ${fullHeight ? '' : 'min-h-[54px]'}
                ${isToday ? 'bg-blue-50' : isWeekend ? 'bg-gray-50/40' : ''}
                ${isDirty ? 'ring-inset ring-1 ring-amber-300' : ''}`}
            >
              <span className={`text-right leading-none text-[11px] font-semibold block mb-1
                ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                {d.getDate()}
              </span>
              <div className="flex items-center justify-center flex-1">
                <ShiftCell
                  entry={entry}
                  canEdit={canEdit}
                  isDirty={isDirty}
                  compact
                  onChange={e => setEntry(emp.employee_id, dateStr, e)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  userRole: UserRole;
  userDept?: string;
  isReadOnly?: boolean;
}

export default function ShiftScheduleTab({ userRole, userDept, isReadOnly = false }: Props) {
  const isPrivileged = ['admin', 'management', 'superadmin', 'supervisor'].includes(userRole);
  const isSupervisor = userRole === 'supervisor';
  const canEdit = isPrivileged && !isReadOnly;

  // ── Mode + navigation ──────────────────────────────────────
  const [mode, setMode]           = useState<CellMode>('weekly');
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOfWeek(new Date()));
  const [monthRef,  setMonthRef]  = useState<Date>(() => { const d = new Date(); d.setDate(1); return d; });

  // ── Target ─────────────────────────────────────────────────
  const [target,       setTarget]       = useState<TargetMode>('dept');
  const [departments,  setDepartments]  = useState<string[]>([]);
  // Default to the logged-in user's own department for all roles
  const [selectedDept, setSelectedDept] = useState<string>(userDept ?? '');
  const [employees,    setEmployees]    = useState<Employee[]>([]);
  // Individual mode: free-text search instead of a dropdown
  const [searchQuery,  setSearchQuery]  = useState('');

  // ── Employee read-only own data ────────────────────────────
  const [ownEmployeeData, setOwnEmployeeData] = useState<EmpBasic | null>(null);

  // ── Full-screen employee calendar ─────────────────────────
  const [fullscreenEmp, setFullscreenEmp] = useState<EmpBasic | null>(null);

  // ── Schedule data ──────────────────────────────────────────
  const [schedule, setSchedule] = useState<ScheduleMap>({});
  const [dirty, setDirty]       = useState<Record<string, ShiftEntry | null>>({});

  // ── UI ─────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  // ── Date range ─────────────────────────────────────────────
  const dateRange = mode === 'weekly' ? getWeekDates(weekStart) : getMonthDates(monthRef);
  const fromDate  = toDateStr(dateRange[0]);
  const toDate    = toDateStr(dateRange[dateRange.length - 1]);
  const todayStr  = toDateStr(new Date());

  // ── Load own employee data (read-only employee view) ───────
  useEffect(() => {
    if (canEdit) return;
    employeesApi.me().then(me => {
      setOwnEmployeeData({
        employee_id: me.employee_id,
        emp_fullname: me.emp_fullname,
        emp_dept:     me.emp_dept,
        emp_shift:    me.emp_shift ?? '',
      });
    }).catch(() => {});
  }, [canEdit]);

  // ── Load department list ───────────────────────────────────
  useEffect(() => {
    if (!canEdit || isSupervisor) return;
    departmentsApi.list().then(setDepartments).catch(() => {});
  }, [canEdit, isSupervisor]);

  // ── Load employees for the selected department ─────────────
  // Both 'dept' and 'individual' modes are scoped to selectedDept.
  // 'individual' just adds a search-bar filter on top.
  useEffect(() => {
    if (!canEdit) return;
    const dept = isSupervisor ? (userDept ?? '') : selectedDept;
    if (!dept) { setEmployees([]); return; }
    employeesApi.list({ limit: 200, dept }).then(r => setEmployees(r.data)).catch(() => {});
  }, [canEdit, selectedDept, isSupervisor, userDept]);

  // ── Fetch schedule ─────────────────────────────────────────
  const loadSchedule = useCallback(async () => {
    if (!canEdit && !ownEmployeeData) return;
    const dept = isSupervisor ? (userDept ?? '') : selectedDept;
    if (canEdit && !dept) return;

    setLoading(true);
    setError('');
    try {
      const params: Parameters<typeof shiftScheduleApi.get>[0] = { from: fromDate, to: toDate };
      if (!canEdit) {
        params.employee_id = ownEmployeeData!.employee_id;
      } else {
        params.dept = dept;
      }

      const res = await shiftScheduleApi.get(params);
      const map: ScheduleMap = {};
      for (const row of res.data) {
        map[cellKey(row.employee_id, row.date)] = {
          shift_start: row.shift_start,
          shift_end:   row.shift_end,
          shift_label: row.shift_label,
        };
      }
      setSchedule(map);
      setDirty({});
    } catch (e: any) {
      setError(e.message ?? 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, [canEdit, ownEmployeeData, isSupervisor, userDept, selectedDept, fromDate, toDate]);

  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  // ── Entry accessors ────────────────────────────────────────
  const getEntry = (empId: number, date: string): ShiftEntry | null => {
    const key = cellKey(empId, date);
    if (key in dirty) return dirty[key];
    return schedule[key] ?? null;
  };

  const setEntry = (empId: number, date: string, entry: ShiftEntry | null) => {
    const key = cellKey(empId, date);
    setDirty(d => ({ ...d, [key]: entry }));
    setSuccess('');
  };

  // ── Save ───────────────────────────────────────────────────
  const handleSave = async () => {
    const toAdd    = Object.entries(dirty).filter(([, v]) => v !== null);
    const toRemove = Object.entries(dirty).filter(([, v]) => v === null);

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (toAdd.length > 0) {
        const entries = toAdd.map(([key, v]) => {
          const { empId, date } = parseCellKey(key);
          return { employee_id: empId, date, ...v! };
        });
        await shiftScheduleApi.save(entries);
      }
      for (const [key] of toRemove) {
        const { empId, date } = parseCellKey(key);
        await shiftScheduleApi.remove(empId, date);
      }
      setSuccess(`Schedule saved${toAdd.length + toRemove.length > 0 ? ` (${toAdd.length + toRemove.length} change${toAdd.length + toRemove.length !== 1 ? 's' : ''})` : ''}.`);
      await loadSchedule();
    } catch (e: any) {
      setError(e.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Navigation ─────────────────────────────────────────────
  const prevPeriod = () => {
    if (mode === 'weekly') setWeekStart(d => addDays(d, -7));
    else setMonthRef(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    setDirty({});
  };
  const nextPeriod = () => {
    if (mode === 'weekly') setWeekStart(d => addDays(d, 7));
    else setMonthRef(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    setDirty({});
  };

  const periodLabel = mode === 'weekly'
    ? `${dateRange[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${dateRange[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : monthRef.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const DAY_NAMES  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dirtyCount = Object.keys(dirty).length;
  const dept       = isSupervisor ? (userDept ?? '') : selectedDept;

  // Displayed employees — individual mode filters by searchQuery
  const gridEmployees: EmpBasic[] = !canEdit
    ? (ownEmployeeData ? [ownEmployeeData] : [])
    : (target === 'individual' && searchQuery.trim()
        ? employees.filter(e =>
            e.emp_fullname.toLowerCase().includes(searchQuery.trim().toLowerCase()),
          )
        : employees);

  // Empty-state message
  const emptyMsg =
    !canEdit
      ? (!ownEmployeeData ? 'Loading your schedule…' : null)
      : !dept
        ? 'Select a department to view the schedule.'
        : gridEmployees.length === 0
          ? (target === 'individual' && searchQuery.trim()
              ? 'No employees match your search.'
              : 'No employees found in this department.')
          : null;

  const inputCls = 'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300';

  return (
    <div className="space-y-4">

      {/* ── Controls ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-lg p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center justify-between">

          {/* Mode toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            {(['weekly', 'monthly'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setDirty({}); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                  ${mode === m ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                {m === 'weekly' ? 'Per Week' : 'Per Month'}
              </button>
            ))}
          </div>

          {/* Period navigator */}
          <div className="flex items-center gap-2">
            <button onClick={prevPeriod}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-gray-700 min-w-[212px] text-center">
              {periodLabel}
            </span>
            <button onClick={nextPeriod}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Save */}
          {canEdit && (
            <button onClick={handleSave} disabled={saving || dirtyCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save{dirtyCount > 0 ? ` (${dirtyCount})` : ''}
            </button>
          )}
        </div>

        {/* Target selectors (privileged only) */}
        {canEdit && (
          <div className="flex flex-wrap gap-4 items-end pt-1 border-t border-gray-100">

            {/* Target toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              {(['dept', 'individual'] as const).map(t => (
                <button key={t}
                  onClick={() => { setTarget(t); setSearchQuery(''); setDirty({}); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                    ${target === t ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                  {t === 'dept' ? <><Users size={13} /> Department</> : <><User size={13} /> Individual</>}
                </button>
              ))}
            </div>

            {/* Department selector — shown for both target modes */}
            {!isSupervisor ? (
              <div>
                <p className="text-xs text-gray-500 mb-1 font-medium">Department</p>
                <select
                  value={selectedDept}
                  onChange={e => { setSelectedDept(e.target.value); setSearchQuery(''); setDirty({}); }}
                  className={`${inputCls} w-48`}
                >
                  <option value="">— Select dept —</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-500 mb-1 font-medium">Department</p>
                <span className="text-sm font-medium text-gray-700 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 inline-block">
                  {userDept}
                </span>
              </div>
            )}

            {/* Individual mode: search bar to filter by name */}
            {target === 'individual' && (
              <div>
                <p className="text-xs text-gray-500 mb-1 font-medium">Search Employee</p>
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Type name to filter…"
                    className={`${inputCls} pl-8 w-52`}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 text-base leading-none"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Result count */}
            {dept && (
              <p className="text-xs text-gray-400 self-end pb-2">
                {gridEmployees.length} employee{gridEmployees.length !== 1 ? 's' : ''}
                {target === 'individual' && searchQuery ? ' matched' : ''}
              </p>
            )}
          </div>
        )}

        {/* Read-only notice */}
        {!canEdit && (
          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            View-only — your shift schedule for the selected period.
          </p>
        )}

        {/* Feedback */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
            <CheckCircle size={15} /> {success}
          </div>
        )}
        {dirtyCount > 0 && !saving && (
          <p className="text-xs text-amber-600 font-medium">
            {dirtyCount} unsaved change{dirtyCount !== 1 ? 's' : ''} — press Save to apply.
          </p>
        )}
      </div>

      {/* ── Legend ──────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Legend</p>
        <div className="flex flex-wrap gap-3">
          {PRESET_SHIFTS.map(s => {
            const sl = SHORT_LABELS[s.label] ?? '';
            return (
              <div key={s.label} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className={`inline-flex items-center justify-center w-6 h-5 rounded text-[10px] font-bold ${shortColor(sl)}`}>{sl}</span>
                {s.label}
              </div>
            );
          })}
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="inline-flex items-center justify-center w-6 h-5 rounded text-[10px] font-bold bg-gray-100 text-gray-600">C</span>
            Custom time
          </div>
          {canEdit && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-auto">
              <span className="w-3 h-3 rounded ring-2 ring-amber-400 bg-amber-50 inline-block" />
              Unsaved change
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {mode === 'monthly' && canEdit ? 'Click any cell to assign or change a shift for that day. ' : ''}
          Day-specific shifts override the employee's default shift for attendance and payroll.
        </p>
      </div>

      {/* ── Grid / Calendar ─────────────────────────────────── */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-lg flex items-center justify-center py-16 gap-3 text-gray-400">
          <Loader2 size={20} className="animate-spin" /> Loading schedule…
        </div>
      ) : emptyMsg ? (
        <div className="bg-white rounded-xl shadow-lg flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
          <Calendar size={32} className="text-gray-300" />
          <p className="text-sm">{emptyMsg}</p>
        </div>
      ) : mode === 'monthly' ? (

        /* ── Monthly: one standard calendar card per employee ── */
        <>
          <div className={`grid gap-4 ${
            gridEmployees.length === 1 ? 'grid-cols-1 max-w-lg mx-auto' : 'grid-cols-1 md:grid-cols-2'
          }`}>
            {gridEmployees.map(emp => (
              <MonthlyCalendar
                key={emp.employee_id}
                emp={emp}
                dates={dateRange}
                todayStr={todayStr}
                canEdit={canEdit}
                dirty={dirty}
                getEntry={getEntry}
                setEntry={setEntry}
                onExpand={() => setFullscreenEmp(emp)}
              />
            ))}
          </div>

          {/* Expanded calendar modal */}
          {fullscreenEmp && (
            <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999, pointerEvents: 'auto' }}>
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setFullscreenEmp(null)}
              />
              {/* Modal */}
              <div className="relative bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl z-10 overflow-hidden"
                style={{ height: 'calc(100vh - 3rem)' }}>
                {/* Modal header */}
                <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
                  <div>
                    <p className="text-base font-bold text-gray-800">{fullscreenEmp.emp_fullname}</p>
                    <p className="text-xs text-gray-400">
                      {fullscreenEmp.emp_dept}{fullscreenEmp.emp_shift ? ` · Default: ${fullscreenEmp.emp_shift}` : ''}
                      {' · '}{periodLabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEdit && dirtyCount > 0 && (
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
                      >
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        Save ({dirtyCount})
                      </button>
                    )}
                    <button
                      onClick={() => setFullscreenEmp(null)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors"
                      title="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
                {/* Calendar body — no scroll, fills remaining height */}
                <div className="flex-1 overflow-hidden p-3 flex flex-col">
                  <MonthlyCalendar
                    emp={fullscreenEmp}
                    dates={dateRange}
                    todayStr={todayStr}
                    canEdit={canEdit}
                    dirty={dirty}
                    getEntry={getEntry}
                    setEntry={setEntry}
                    fullHeight
                  />
                </div>
              </div>
            </div>
          )}
        </>

      ) : (

        /* ── Weekly: card list on mobile, table on desktop ────── */
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">

          {/* ── Mobile: one card per employee (< md) ── */}
          <div className="md:hidden divide-y divide-gray-100">
            {gridEmployees.map(emp => (
              <div key={emp.employee_id} className="p-4">
                {/* Employee header */}
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-800">{emp.emp_fullname}</p>
                  {!isSupervisor && emp.emp_dept && (
                    <p className="text-xs text-gray-400">{emp.emp_dept}</p>
                  )}
                  {emp.emp_shift && (
                    <p className="text-[11px] text-gray-300">Default: {emp.emp_shift}</p>
                  )}
                </div>
                {/* Days list */}
                <div className="space-y-2">
                  {dateRange.map((d, i) => {
                    const dk      = toDateStr(d);
                    const key     = cellKey(emp.employee_id, dk);
                    const entry   = getEntry(emp.employee_id, dk);
                    const isDirty = key in dirty;
                    const isToday = dk === todayStr;
                    return (
                      <div key={dk} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        <div className="w-16 flex-shrink-0">
                          <p className={`text-xs font-semibold ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>{DAY_NAMES[i]}</p>
                          <p className="text-[11px] text-gray-400">{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        </div>
                        <div className="flex-1">
                          <ShiftCell
                            entry={entry}
                            canEdit={canEdit}
                            isDirty={isDirty}
                            compact={false}
                            onChange={e => setEntry(emp.employee_id, dk, e)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop: horizontal table (≥ md) ── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="text-sm border-collapse w-full" style={{ minWidth: '700px' }}>
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="sticky left-0 z-10 bg-gray-50 px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[160px] border-r border-gray-200">
                    Employee
                  </th>
                  {dateRange.map((d, i) => {
                    const dk      = toDateStr(d);
                    const isToday = dk === todayStr;
                    return (
                      <th key={dk}
                        className={`px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide min-w-[130px]
                          ${isToday ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}>
                        <div>{DAY_NAMES[i]}</div>
                        <div className="text-[10px] font-normal text-gray-400">
                          {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gridEmployees.map(emp => (
                  <tr key={emp.employee_id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="sticky left-0 z-10 bg-white px-3 py-2 border-r border-gray-100">
                      <div className="text-xs font-semibold text-gray-800 truncate max-w-[150px]" title={emp.emp_fullname}>
                        {emp.emp_fullname}
                      </div>
                      {!isSupervisor && (
                        <div className="text-[10px] text-gray-400 truncate max-w-[150px]">{emp.emp_dept}</div>
                      )}
                      {emp.emp_shift && (
                        <div className="text-[10px] text-gray-300 truncate max-w-[150px]" title={`Default: ${emp.emp_shift}`}>
                          ↳ {emp.emp_shift}
                        </div>
                      )}
                    </td>
                    {dateRange.map(d => {
                      const dk      = toDateStr(d);
                      const key     = cellKey(emp.employee_id, dk);
                      const entry   = getEntry(emp.employee_id, dk);
                      const isDirty = key in dirty;
                      const isToday = dk === todayStr;
                      return (
                        <td key={dk}
                          className={`px-1.5 py-1.5 align-middle ${isToday ? 'bg-blue-50/30' : ''}`}>
                          <ShiftCell
                            entry={entry}
                            canEdit={canEdit}
                            isDirty={isDirty}
                            compact={false}
                            onChange={e => setEntry(emp.employee_id, dk, e)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
