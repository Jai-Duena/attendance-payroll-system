import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  payrollApi,
  thirteenthMonthApi,
  type PayrollBatch,
  type PayrollStatus,
  type PayrollTableType,
  type PayrollEmployee,
  type PayslipData,
  type AuditEntry,
  type ThirteenthMonthEntry,
  type PayrollCorrection,
  type CorrectionField,
  type CorrectionStatus,
  type RemittanceRow,
} from '@/lib/api';
import { type UserRole } from '../App';
import { useCompany } from '../context/CompanyContext';
import {
  Plus, RefreshCw, ChevronLeft, ChevronRight, Pencil, Printer,
  CheckCircle2, XCircle, Loader2, AlertTriangle, X, Search,
  Calculator, ChevronDown, ChevronUp, Clock, Download, Gift,
  FileText, Send, ClipboardList, ThumbsUp, Landmark,
} from 'lucide-react';
import { TableSkeleton } from './Skeleton';
import GovernmentReportsModal from './GovernmentReportsModal';

// ─── Helpers ───────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  Draft:          'bg-gray-100 text-gray-700',
  'Under Review': 'bg-yellow-100 text-yellow-700',
  Approved:       'bg-green-100 text-green-700',
  Released:       'bg-blue-100 text-blue-700',
  Dropped:        'bg-red-100 text-red-700',
};

const fmt = (v: unknown, decimals = 2) => {
  const n = parseFloat(String(v ?? 0));
  return isNaN(n) ? '0.00' : n.toLocaleString('en-PH', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const fmtDate = (d: string) => {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
};

const fmtDateTime = (d: string) => {
  if (!d) return '--';
  const dt = new Date(d.includes('T') ? d : d.replace(' ', 'T'));
  return dt.toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true });
};

type Row = Record<string, unknown>;

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) ?? '';

// ─── Sub-components ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function Spinner() {
  return <Loader2 size={20} className="animate-spin text-blue-500 mx-auto" />;
}

// ─── Floating Calculator ────────────────────────────────────────────────────

const CALC_BUTTONS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
];

function FloatingCalculator({ onClose }: { onClose: () => void }) {
  const [pos, setPos]         = useState({ x: window.innerWidth - 280, y: 120 });
  const [dragging, setDragging] = useState(false);
  const [dragOff, setDragOff]   = useState({ x: 0, y: 0 });
  const [display, setDisplay]   = useState('0');
  const [expr, setExpr]         = useState('');
  const [hasResult, setHasResult] = useState(false);

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setDragging(true);
    setDragOff({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };
  useEffect(() => {
    if (!dragging) return;
    const mm = (e: MouseEvent) => setPos({ x: e.clientX - dragOff.x, y: e.clientY - dragOff.y });
    const mu = () => setDragging(false);
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
    return () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); };
  }, [dragging, dragOff]);

  const press = (key: string) => {
    if (key === 'C') { setDisplay('0'); setExpr(''); setHasResult(false); return; }
    if (key === '=') {
      try {
        const raw = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
        // eslint-disable-next-line no-eval
        const result = Function('"use strict"; return (' + raw + ')')() as number;
        const str = parseFloat(result.toFixed(10)).toString();
        setDisplay(str);
        setExpr(str);
        setHasResult(true);
      } catch { setDisplay('Error'); setExpr(''); setHasResult(true); }
      return;
    }
    if (key === '±') {
      const n = parseFloat(display);
      if (!isNaN(n)) { const s = String(-n); setDisplay(s); setExpr(prev => prev.slice(0, -display.length) + s); }
      return;
    }
    if (key === '%') {
      const n = parseFloat(display);
      if (!isNaN(n)) { const s = String(n / 100); setDisplay(s); setExpr(prev => prev.slice(0, -display.length) + s); }
      return;
    }
    const isOp = ['÷','×','−','+'].includes(key);
    if (hasResult && !isOp) { setExpr(key === '0' ? '0' : key); setDisplay(key); setHasResult(false); return; }
    setHasResult(false);
    if (isOp) { setExpr(e => e + key); setDisplay(key); return; }
    const newExpr = expr + key;
    setExpr(newExpr);
    // Update display: take the last number segment
    const parts = newExpr.split(/[÷×−+]/);
    setDisplay(parts[parts.length - 1] || '0');
  };

  const opKeys = new Set(['÷','×','−','+','=']);
  const btnClass = (k: string) => {
    if (k === '=') return 'col-span-1 bg-blue-500 text-white hover:bg-blue-600';
    if (opKeys.has(k)) return 'bg-orange-400 text-white hover:bg-orange-500';
    if (['C','±','%'].includes(k)) return 'bg-gray-200 text-gray-700 hover:bg-gray-300';
    return 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-200';
  };

  return (
    <div
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999, userSelect: 'none', width: 220 }}
      className="rounded-2xl shadow-2xl border border-gray-300 overflow-hidden bg-gray-50"
    >
      {/* Header -- drag handle */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-gray-800 cursor-move"
        onMouseDown={onMouseDown}
      >
        <div className="flex items-center gap-1.5 text-white text-xs font-semibold">
          <Calculator size={13} />Calculator
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={13} /></button>
      </div>
      {/* Display */}
      <div className="bg-gray-900 px-3 py-3 text-right">
        <p className="text-xs text-gray-400 truncate min-h-[1rem]">{expr || ' '}</p>
        <p className="text-xl font-bold text-white truncate">{display}</p>
      </div>
      {/* Buttons */}
      <div className="p-2 bg-gray-50 grid grid-cols-4 gap-1.5">
        {CALC_BUTTONS.flat().map((k, i) => (
          <button
            key={`${k}-${i}`}
            onClick={() => press(k)}
            className={`rounded-xl text-sm font-medium py-2.5 transition-colors ${btnClass(k)} ${k === '0' ? 'col-span-2' : ''}`}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Generate Modal ────────────────────────────────────────────────────────

interface GenerateModalProps {
  onClose: () => void;
  onDone: () => void;
}

/** Returns the most recently completed semi-monthly cutoff period. */
function suggestedCutoff(): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();   // 0-indexed
  const d = now.getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  const lastDayOf = (yr: number, mo: number) =>
    new Date(yr, mo + 1, 0).getDate();

  if (d <= 15) {
    // We are in the first half → last completed period = prev month 16-end
    const pm = m === 0 ? 11 : m - 1;
    const py = m === 0 ? y - 1 : y;
    return {
      start: `${py}-${pad(pm + 1)}-16`,
      end:   `${py}-${pad(pm + 1)}-${pad(lastDayOf(py, pm))}`,
    };
  } else {
    // We are in the second half → last completed period = this month 1-15
    return {
      start: `${y}-${pad(m + 1)}-01`,
      end:   `${y}-${pad(m + 1)}-15`,
    };
  }
}

/** All six upcoming + current semi-monthly cutoffs to show as quick presets. */
function cutoffPresets(): { label: string; start: string; end: string }[] {
  const pad = (n: number) => String(n).padStart(2, '0');
  const lastDayOf = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const presets: { label: string; start: string; end: string }[] = [];
  const now = new Date();
  // Build 6 most-recent periods (current + 5 before)
  let y = now.getFullYear();
  let half = now.getDate() <= 15 ? 0 : 1; // 0 = first half, 1 = second half
  for (let i = 0; i < 6; i++) {
    const mo = half === 0
      ? (now.getMonth() === 0 && i > 0 ? ((12 - i) % 12) : now.getMonth())
      : now.getMonth();
    // simpler: iterate backwards
    let iy = y, im = now.getMonth(), ih = half;
    for (let j = 0; j < i; j++) {
      if (ih === 0) { ih = 1; im--; if (im < 0) { im = 11; iy--; } }
      else { ih = 0; }
    }
    // ih=0 → 1-15, ih=1 → 16-end
    const start = ih === 0
      ? `${iy}-${pad(im + 1)}-01`
      : `${iy}-${pad(im + 1)}-16`;
    const end = ih === 0
      ? `${iy}-${pad(im + 1)}-15`
      : `${iy}-${pad(im + 1)}-${pad(lastDayOf(iy, im))}`;
    const mName = new Date(iy, im, 1).toLocaleString('en-US', { month: 'short' });
    const label = ih === 0 ? `${mName} 1-15, ${iy}` : `${mName} 16-${lastDayOf(iy, im)}, ${iy}`;
    presets.push({ label, start, end });
  }
  return presets;
}

function GenerateModal({ onClose, onDone }: GenerateModalProps) {
  const suggested = suggestedCutoff();
  const [startDate, setStartDate]       = useState(suggested.start);
  const [endDate, setEndDate]           = useState(suggested.end);
  const [employees, setEmployees]       = useState<PayrollEmployee[]>([]);
  const [selected, setSelected]         = useState<Set<number>>(new Set());
  const [loading, setLoading]           = useState(false);
  const [loadingEmps, setLoadingEmps]   = useState(false);
  const [steps, setSteps]               = useState<{ step: string; success: boolean; message: string }[]>([]);
  const [done, setDone]                 = useState(false);
  const [error, setError]               = useState('');
  const [empSearch, setEmpSearch]       = useState('');
  const [dupConfirm, setDupConfirm]     = useState(false);  // waiting for user to confirm duplicate

  const fetchEmployees = useCallback(async () => {
    setLoadingEmps(true);
    try {
      const res = await payrollApi.getEmployees(startDate || undefined, endDate || undefined);
      setEmployees(res.data);
      setSelected(new Set(res.data.map(e => e.employee_id)));
    } catch {
      setEmployees([]);
    } finally {
      setLoadingEmps(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (startDate && endDate) fetchEmployees();
  }, [startDate, endDate, fetchEmployees]);

  const toggleAll = () => {
    if (selected.size === filteredEmployees.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredEmployees.map(e => e.employee_id)));
    }
  };

  const filteredEmployees = employees.filter(e =>
    e.emp_fullname.toLowerCase().includes(empSearch.toLowerCase()) ||
    e.emp_dept.toLowerCase().includes(empSearch.toLowerCase())
  );

  const runGenerate = async (force = false) => {
    if (!startDate || !endDate || selected.size === 0) {
      setError('Please select a date range and at least one employee.');
      return;
    }
    setError('');
    setDupConfirm(false);
    setLoading(true);
    setSteps([]);
    try {
      const res = await payrollApi.generate({
        start_date: startDate,
        end_date: endDate,
        employees: [...selected],
        ...(force ? { force: true } : {}),
      });
      setSteps(res.steps ?? []);
      if (res.success) {
        setDone(true);
        onDone();
      } else if (res.code === 'DUPLICATE_PERIOD') {
        setDupConfirm(true);
      } else {
        setError(res.message);
      }
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => runGenerate(false);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">Generate Payroll</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Cutoff presets */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Quick Select Period</p>
            <div className="flex flex-wrap gap-1.5">
              {cutoffPresets().map(p => {
                const active = p.start === startDate && p.end === endDate;
                return (
                  <button
                    key={p.label}
                    onClick={() => { setStartDate(p.start); setEndDate(p.end); setDupConfirm(false); setError(''); }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                      active
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setDupConfirm(false); setError(''); }}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {startDate && <p className="mt-1 text-xs text-blue-600">{fmtDate(startDate)}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setDupConfirm(false); setError(''); }}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {endDate && <p className="mt-1 text-xs text-blue-600">{fmtDate(endDate)}</p>}
            </div>
          </div>

          {/* Employees */}
          {employees.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-500">
                  Employees ({selected.size}/{filteredEmployees.length} selected)
                </label>
                <button onClick={toggleAll} className="text-xs text-blue-600 hover:underline">
                  {selected.size === filteredEmployees.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="relative mb-2">
                <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  placeholder="Search employees..."
                  value={empSearch}
                  onChange={e => setEmpSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="border rounded-lg overflow-y-auto max-h-44">
                {filteredEmployees.map(emp => (
                  <label key={emp.employee_id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-0">
                    <input
                      type="checkbox"
                      checked={selected.has(emp.employee_id)}
                      onChange={e => {
                        const s = new Set(selected);
                        e.target.checked ? s.add(emp.employee_id) : s.delete(emp.employee_id);
                        setSelected(s);
                      }}
                      className="rounded text-blue-500 focus:ring-blue-400"
                    />
                    <span className="text-xs font-medium text-gray-800 flex-1">{emp.emp_fullname}</span>
                    <span className="text-xs text-gray-500">{emp.emp_dept}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {loadingEmps && <div className="text-center py-2"><Spinner /></div>}
          {startDate && endDate && !loadingEmps && employees.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-2">No employees with attendance in this period.</p>
          )}

          {/* Pipeline Progress */}
          {steps.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-semibold text-gray-600 mb-2">Pipeline Progress</p>
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  {s.success
                    ? <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                    : <XCircle size={14} className="text-red-500 flex-shrink-0" />}
                  <span className="text-xs font-mono text-gray-700">{s.step}</span>
                  <span className="text-xs text-gray-500 ml-auto">{s.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Duplicate period confirmation */}
          {dupConfirm && !done && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-800">A payroll batch already exists for this period.</p>
                  <p className="text-xs text-amber-700 mt-0.5">Proceeding will generate an <strong>additional batch</strong> for the same period alongside the existing one. This will not delete or overwrite it.</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setDupConfirm(false)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => runGenerate(true)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600"
                >
                  Proceed Anyway
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
          {done && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              <CheckCircle2 size={14} className="text-green-600" />
              <p className="text-xs text-green-700 font-medium">Payroll generated successfully!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
            {done ? 'Close' : 'Cancel'}
          </button>
          {!done && (
            <button
              onClick={handleGenerate}
              disabled={loading || !startDate || !endDate || selected.size === 0}
              className="px-5 py-2 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <><Loader2 size={14} className="animate-spin" />Generating...</> : 'Generate Payroll'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Edit Row Modal ─────────────────────────────────────────────────────────

interface EditRowModalProps {
  tableType: string;
  row: Row;
  onClose: () => void;
  onSaved: () => void;
}

// ── Field label map used by the edit modal AND audit trail ──────────────────
export const FIELD_LABELS: Record<string, string> = {
  // earnings
  reg_pay:                     'Regular Pay',
  adj_reg_pay:                 'Regular Pay',
  ot_pay:                      'Overtime Pay',
  adj_ot_pay:                  'Overtime Pay',
  nd_pay:                      'Night Diff Pay',
  adj_nd_pay:                  'Night Diff Pay',
  ot_nd_pay:                   'OT Night Diff Pay',
  adj_ot_nd_pay:               'OT Night Diff Pay',
  reg_holiday_pay:             'Reg Holiday Pay',
  adj_reg_holiday_pay:         'Reg Holiday Pay',
  reg_holiday_ot_pay:          'Reg Holiday OT Pay',
  adj_reg_holiday_ot_pay:      'Reg Holiday OT Pay',
  reg_holiday_nd_pay:          'Reg Holiday ND Pay',
  adj_reg_holiday_nd_pay:      'Reg Holiday ND Pay',
  reg_holiday_ot_nd_pay:       'Reg Holiday OT ND Pay',
  adj_reg_holiday_ot_nd_pay:   'Reg Holiday OT ND Pay',
  reg_holiday_rd_pay:          'Reg Holiday RD Pay',
  adj_reg_holiday_rd_pay:      'Reg Holiday RD Pay',
  reg_holiday_rd_ot_pay:       'Reg Holiday RD OT Pay',
  adj_reg_holiday_rd_ot_pay:   'Reg Holiday RD OT Pay',
  reg_holiday_rd_nd_pay:       'Reg Holiday RD ND Pay',
  adj_reg_holiday_rd_nd_pay:   'Reg Holiday RD ND Pay',
  reg_holiday_rd_ot_nd_pay:    'Reg Holiday RD OT ND Pay',
  adj_reg_holiday_rd_ot_nd_pay:'Reg Holiday RD OT ND Pay',
  spec_holiday_pay:            'Spec Holiday Pay',
  adj_spec_holiday_pay:        'Spec Holiday Pay',
  spec_holiday_ot_pay:         'Spec Holiday OT Pay',
  adj_spec_holiday_ot_pay:     'Spec Holiday OT Pay',
  spec_holiday_nd_pay:         'Spec Holiday ND Pay',
  adj_spec_holiday_nd_pay:     'Spec Holiday ND Pay',
  spec_holiday_ot_nd_pay:      'Spec Holiday OT ND Pay',
  adj_spec_holiday_ot_nd_pay:  'Spec Holiday OT ND Pay',
  spec_holiday_rd_pay:         'Spec Holiday RD Pay',
  adj_spec_holiday_rd_pay:     'Spec Holiday RD Pay',
  spec_holiday_rd_ot_pay:      'Spec Holiday RD OT Pay',
  adj_spec_holiday_rd_ot_pay:  'Spec Holiday RD OT Pay',
  spec_holiday_rd_nd_pay:      'Spec Holiday RD ND Pay',
  adj_spec_holiday_rd_nd_pay:  'Spec Holiday RD ND Pay',
  spec_holiday_rd_ot_nd_pay:   'Spec Holiday RD OT ND Pay',
  adj_spec_holiday_rd_ot_nd_pay:'Spec Holiday RD OT ND Pay',
  rd_pay:                      'Rest Day Pay',
  adj_rd_pay:                  'Rest Day Pay',
  rd_ot_pay:                   'Rest Day OT Pay',
  adj_rd_ot_pay:               'Rest Day OT Pay',
  rd_nd_pay:                   'Rest Day ND Pay',
  adj_rd_nd_pay:               'Rest Day ND Pay',
  rd_ot_nd_pay:                'Rest Day OT ND Pay',
  adj_rd_ot_nd_pay:            'Rest Day OT ND Pay',
  leave_pay:                   'Leave Pay',
  adj_leave_pay:               'Leave Pay',
  total_pay:                   'Total Pay',
  adj_total_pay:               'Total Pay',
  // deductions
  employee_sss:                'Employee SSS',
  adj_employee_sss:            'Employee SSS',
  employer_sss:                'Employer SSS',
  adj_employer_sss:            'Employer SSS',
  employee_philhealth:         'Employee PhilHealth',
  adj_employee_philhealth:     'Employee PhilHealth',
  employer_philhealth:         'Employer PhilHealth',
  adj_employer_philhealth:     'Employer PhilHealth',
  employee_pagibig:            'Employee Pag-IBIG',
  adj_employee_pagibig:        'Employee Pag-IBIG',
  employer_pagibig:            'Employer Pag-IBIG',
  adj_employer_pagibig:        'Employer Pag-IBIG',
  late_deduct:                 'Late Deduction',
  adj_late_deduct:             'Late Deduction',
  other_deduct:                'Other Deduction',
  adj_other_deduct:            'Other Deduction',
  employee_total_benefits:     'Employee Total Benefits',
  employer_total_benefits:     'Employer Total Benefits',
  total_deduct:                'Total Deductions',
  total_contributions:         'Total Contributions',
  // tax
  taxable_income:              'Taxable Income',
  adj_taxable_income:          'Taxable Income',
  tax_deduct:                  'Withholding Tax',
  adj_tax_deduct:              'Withholding Tax',
  total:                       'Net After Tax',
  adj_total:                   'Net After Tax',
  // attendance
  reg_hrs:                     'Regular Hours',
  adj_reg_hrs:                 'Regular Hours',
  ot_hrs:                      'Overtime Hours',
  adj_ot_hrs:                  'Overtime Hours',
  nd_hrs:                      'Night Diff Hours',
  adj_nd_hrs:                  'Night Diff Hours',
  ot_nd_hrs:                   'OT Night Diff Hours',
  adj_ot_nd_hrs:               'OT Night Diff Hours',
  reg_holiday_days:            'Reg Holiday Days',
  adj_reg_holiday_days:        'Reg Holiday Days',
  reg_holiday_hrs:             'Reg Holiday Hours',
  adj_reg_holiday_hrs:         'Reg Holiday Hours',
  reg_holiday_ot_hrs:          'Reg Holiday OT Hours',
  adj_reg_holiday_ot_hrs:      'Reg Holiday OT Hours',
  reg_holiday_nd_hrs:          'Reg Holiday ND Hours',
  adj_reg_holiday_nd_hrs:      'Reg Holiday ND Hours',
  reg_holiday_ot_nd_hrs:       'Reg Holiday OT ND Hours',
  adj_reg_holiday_ot_nd_hrs:   'Reg Holiday OT ND Hours',
  reg_holiday_rd_hrs:          'Reg Holiday RD Hours',
  adj_reg_holiday_rd_hrs:      'Reg Holiday RD Hours',
  reg_holiday_rd_ot_hrs:       'Reg Holiday RD OT Hours',
  adj_reg_holiday_rd_ot_hrs:   'Reg Holiday RD OT Hours',
  reg_holiday_rd_nd_hrs:       'Reg Holiday RD ND Hours',
  adj_reg_holiday_rd_nd_hrs:   'Reg Holiday RD ND Hours',
  reg_holiday_rd_ot_nd_hrs:    'Reg Holiday RD OT ND Hours',
  adj_reg_holiday_rd_ot_nd_hrs:'Reg Holiday RD OT ND Hours',
  spec_holiday_hrs:            'Spec Holiday Hours',
  adj_spec_holiday_hrs:        'Spec Holiday Hours',
  spec_holiday_ot_hrs:         'Spec Holiday OT Hours',
  adj_spec_holiday_ot_hrs:     'Spec Holiday OT Hours',
  spec_holiday_nd_hrs:         'Spec Holiday ND Hours',
  adj_spec_holiday_nd_hrs:     'Spec Holiday ND Hours',
  spec_holiday_ot_nd_hrs:      'Spec Holiday OT ND Hours',
  adj_spec_holiday_ot_nd_hrs:  'Spec Holiday OT ND Hours',
  spec_holiday_rd_hrs:         'Spec Holiday RD Hours',
  adj_spec_holiday_rd_hrs:     'Spec Holiday RD Hours',
  spec_holiday_rd_ot_hrs:      'Spec Holiday RD OT Hours',
  adj_spec_holiday_rd_ot_hrs:  'Spec Holiday RD OT Hours',
  spec_holiday_rd_nd_hrs:      'Spec Holiday RD ND Hours',
  adj_spec_holiday_rd_nd_hrs:  'Spec Holiday RD ND Hours',
  spec_holiday_rd_ot_nd_hrs:   'Spec Holiday RD OT ND Hours',
  adj_spec_holiday_rd_ot_nd_hrs:'Spec Holiday RD OT ND Hours',
  rd_hrs:                      'Rest Day Hours',
  adj_rd_hrs:                  'Rest Day Hours',
  rd_ot_hrs:                   'Rest Day OT Hours',
  adj_rd_ot_hrs:               'Rest Day OT Hours',
  rd_nd_hrs:                   'Rest Day ND Hours',
  adj_rd_nd_hrs:               'Rest Day ND Hours',
  rd_ot_nd_hrs:                'Rest Day OT ND Hours',
  adj_rd_ot_nd_hrs:            'Rest Day OT ND Hours',
  late_mins:                   'Late (Minutes)',
  adj_late_mins:               'Late (Minutes)',
  leave_days:                  'Leave Days',
  adj_leave_days:              'Leave Days',
};

const adjFieldsByTable: Record<string, { field: string; label: string }[]> = {
  earnings: [
    { field: 'adj_reg_pay',                label: 'Adjusted Regular Pay' },
    { field: 'adj_ot_pay',                 label: 'Adjusted Overtime Pay' },
    { field: 'adj_nd_pay',                 label: 'Adjusted Night Diff Pay' },
    { field: 'adj_ot_nd_pay',              label: 'Adjusted OT Night Diff Pay' },
    { field: 'adj_reg_holiday_pay',        label: 'Adjusted Reg Holiday Pay' },
    { field: 'adj_reg_holiday_ot_pay',     label: 'Adjusted Reg Holiday OT Pay' },
    { field: 'adj_reg_holiday_nd_pay',     label: 'Adjusted Reg Holiday ND Pay' },
    { field: 'adj_reg_holiday_ot_nd_pay',  label: 'Adjusted Reg Holiday OT ND Pay' },
    { field: 'adj_reg_holiday_rd_pay',     label: 'Adjusted Reg Holiday RD Pay' },
    { field: 'adj_reg_holiday_rd_ot_pay',  label: 'Adjusted Reg Holiday RD OT Pay' },
    { field: 'adj_reg_holiday_rd_nd_pay',  label: 'Adjusted Reg Holiday RD ND Pay' },
    { field: 'adj_reg_holiday_rd_ot_nd_pay', label: 'Adjusted Reg Holiday RD OT ND Pay' },
    { field: 'adj_spec_holiday_pay',       label: 'Adjusted Spec Holiday Pay' },
    { field: 'adj_spec_holiday_ot_pay',    label: 'Adjusted Spec Holiday OT Pay' },
    { field: 'adj_spec_holiday_nd_pay',    label: 'Adjusted Spec Holiday ND Pay' },
    { field: 'adj_spec_holiday_ot_nd_pay', label: 'Adjusted Spec Holiday OT ND Pay' },
    { field: 'adj_spec_holiday_rd_pay',    label: 'Adjusted Spec Holiday RD Pay' },
    { field: 'adj_spec_holiday_rd_ot_pay', label: 'Adjusted Spec Holiday RD OT Pay' },
    { field: 'adj_spec_holiday_rd_nd_pay', label: 'Adjusted Spec Holiday RD ND Pay' },
    { field: 'adj_spec_holiday_rd_ot_nd_pay', label: 'Adjusted Spec Holiday RD OT ND Pay' },
    { field: 'adj_rd_pay',                 label: 'Adjusted Rest Day Pay' },
    { field: 'adj_rd_ot_pay',              label: 'Adjusted Rest Day OT Pay' },
    { field: 'adj_rd_nd_pay',              label: 'Adjusted Rest Day ND Pay' },
    { field: 'adj_rd_ot_nd_pay',           label: 'Adjusted Rest Day OT ND Pay' },
    { field: 'adj_leave_pay',              label: 'Adjusted Leave Pay' },
    { field: 'adj_total_pay',              label: 'Adjusted Total Pay' },
  ],
  deductions: [
    { field: 'adj_employee_sss',           label: 'Adjusted Employee SSS' },
    { field: 'adj_employer_sss',           label: 'Adjusted Employer SSS' },
    { field: 'adj_employee_philhealth',    label: 'Adjusted Employee PhilHealth' },
    { field: 'adj_employer_philhealth',    label: 'Adjusted Employer PhilHealth' },
    { field: 'adj_employee_pagibig',       label: 'Adjusted Employee Pag-IBIG' },
    { field: 'adj_employer_pagibig',       label: 'Adjusted Employer Pag-IBIG' },
    { field: 'adj_late_deduct',            label: 'Adjusted Late Deduction' },
    { field: 'other_deduct',               label: 'Other Deduction' },
  ],
  tax: [
    { field: 'adj_taxable_income',         label: 'Adjusted Taxable Income' },
    { field: 'adj_tax_deduct',             label: 'Adjusted Withholding Tax' },
    { field: 'adj_total',                  label: 'Adjusted Net After Tax' },
  ],
  attendance_summary: [
    { field: 'adj_reg_hrs',                label: 'Adjusted Regular Hours' },
    { field: 'adj_ot_hrs',                 label: 'Adjusted Overtime Hours' },
    { field: 'adj_nd_hrs',                 label: 'Adjusted Night Diff Hours' },
    { field: 'adj_ot_nd_hrs',              label: 'Adjusted OT Night Diff Hours' },
    { field: 'adj_reg_holiday_days',       label: 'Adjusted Reg Holiday Days' },
    { field: 'adj_reg_holiday_hrs',        label: 'Adjusted Reg Holiday Hours' },
    { field: 'adj_reg_holiday_ot_hrs',     label: 'Adjusted Reg Holiday OT Hours' },
    { field: 'adj_reg_holiday_nd_hrs',     label: 'Adjusted Reg Holiday ND Hours' },
    { field: 'adj_reg_holiday_ot_nd_hrs',  label: 'Adjusted Reg Holiday OT ND Hours' },
    { field: 'adj_reg_holiday_rd_hrs',     label: 'Adjusted Reg Holiday RD Hours' },
    { field: 'adj_reg_holiday_rd_ot_hrs',  label: 'Adjusted Reg Holiday RD OT Hours' },
    { field: 'adj_reg_holiday_rd_nd_hrs',  label: 'Adjusted Reg Holiday RD ND Hours' },
    { field: 'adj_reg_holiday_rd_ot_nd_hrs', label: 'Adjusted Reg Holiday RD OT ND Hours' },
    { field: 'adj_spec_holiday_hrs',       label: 'Adjusted Spec Holiday Hours' },
    { field: 'adj_spec_holiday_ot_hrs',    label: 'Adjusted Spec Holiday OT Hours' },
    { field: 'adj_spec_holiday_nd_hrs',    label: 'Adjusted Spec Holiday ND Hours' },
    { field: 'adj_spec_holiday_ot_nd_hrs', label: 'Adjusted Spec Holiday OT ND Hours' },
    { field: 'adj_spec_holiday_rd_hrs',    label: 'Adjusted Spec Holiday RD Hours' },
    { field: 'adj_spec_holiday_rd_ot_hrs', label: 'Adjusted Spec Holiday RD OT Hours' },
    { field: 'adj_spec_holiday_rd_nd_hrs', label: 'Adjusted Spec Holiday RD ND Hours' },
    { field: 'adj_spec_holiday_rd_ot_nd_hrs', label: 'Adjusted Spec Holiday RD OT ND Hours' },
    { field: 'adj_rd_hrs',                 label: 'Adjusted Rest Day Hours' },
    { field: 'adj_rd_ot_hrs',              label: 'Adjusted Rest Day OT Hours' },
    { field: 'adj_rd_nd_hrs',              label: 'Adjusted Rest Day ND Hours' },
    { field: 'adj_rd_ot_nd_hrs',           label: 'Adjusted Rest Day OT ND Hours' },
    { field: 'adj_late_mins',              label: 'Adjusted Late (Minutes)' },
    { field: 'adj_leave_days',             label: 'Adjusted Leave Days' },
  ],
};

type PreviewResult = {
  success: boolean;
  employee: string;
  direct:   { field: string; label: string; old: number | null; new: number }[];
  indirect: { table: string; table_label: string; field: string; label: string; old: number | null; new: number }[];
};

function EditRowModal({ tableType, row, onClose, onSaved }: EditRowModalProps) {
  const fields = adjFieldsByTable[tableType] ?? [];
  const [values, setValues]       = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    fields.forEach(f => { init[f.field] = String(row[f.field] ?? ''); });
    return init;
  });
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview]       = useState<PreviewResult | null>(null);
  const [saving, setSaving]         = useState(false);
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [error, setError]           = useState('');
  const [reason, setReason]         = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);

  // Collect fields that the user actually changed
  const collectChanges = () => {
    const out: { field: string; value: number }[] = [];
    for (const f of fields) {
      const rawVal = values[f.field].trim();
      if (rawVal === '') continue;
      const newNum = parseFloat(rawVal);
      const oldNum = parseFloat(String(row[f.field] ?? 'NaN'));
      if (isNaN(newNum)) continue;
      if (!isNaN(oldNum) && newNum === oldNum) continue;
      out.push({ field: f.field, value: newNum });
    }
    return out;
  };

  const hasChanges = collectChanges().length > 0;

  // Step 1: preview
  const handlePreview = async () => {
    const changes = collectChanges();
    if (changes.length === 0) { onClose(); return; }
    setPreviewing(true);
    setError('');
    try {
      const res = await payrollApi.previewRow({ table: tableType, id: row.id as number, changes });
      setPreview(res);
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  // Step 2: confirm & save
  const handleConfirm = async () => {
    const changes = collectChanges();
    if (changes.length === 0) return;
    if (!reason.trim()) {
      setError('Please provide a reason for this adjustment before saving.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      // Build notes: include reason and attachment file names if provided
      const attachmentNote = attachmentFiles.length > 0
        ? ` | Attachments: ${attachmentFiles.map(f => f.name).join(', ')}`
        : '';
      const notes = reason.trim() ? `${reason.trim()}${attachmentNote}` : (attachmentNote || undefined);
      await payrollApi.updateRow({ table: tableType, id: row.id as number, changes, notes });
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Save failed');
      setPreview(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (hasChanges) setDiscardConfirm(true);
    else onClose();
  };

  // ── Discard confirmation overlay ───────────────────────────────────────────
  if (discardConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 space-y-4">
          <p className="text-sm font-semibold text-gray-800">Discard changes?</p>
          <p className="text-xs text-gray-500">Your unsaved adjustments will be lost.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDiscardConfirm(false)} className="px-4 py-2 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Keep Editing</button>
            <button onClick={onClose} className="px-4 py-2 text-xs rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600">Discard</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Preview / Confirmation view ────────────────────────────────────────────
  if (preview) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[88vh] flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Confirm Changes</h3>
              <p className="text-xs text-gray-500 mt-0.5">{preview.employee}</p>
            </div>
            <button onClick={() => setPreview(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"><X size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Direct changes */}
            {preview.direct.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Your changes</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-2 py-1.5 font-medium text-gray-500 rounded-l">Field</th>
                      <th className="text-right px-2 py-1.5 font-medium text-gray-500">Before</th>
                      <th className="text-right px-2 py-1.5 font-medium text-gray-500 rounded-r">After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {preview.direct.map(d => (
                      <tr key={d.field}>
                        <td className="px-2 py-1.5 text-gray-700">{d.label}</td>
                        <td className="px-2 py-1.5 text-right text-red-500">{d.old !== null ? fmt(d.old) : '--'}</td>
                        <td className="px-2 py-1.5 text-right text-green-600 font-semibold">{fmt(d.new)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Indirect cascade changes */}
            {preview.indirect.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Cascade effects</p>
                {/* Group by table */}
                {Array.from(new Set(preview.indirect.map(i => i.table_label))).map(tLabel => (
                  <div key={tLabel} className="mb-3">
                    <p className="text-xs text-blue-600 font-medium mb-1">{tLabel}</p>
                    <table className="w-full text-xs">
                      <tbody className="divide-y">
                        {preview.indirect.filter(i => i.table_label === tLabel).map(d => (
                          <tr key={d.field}>
                            <td className="px-2 py-1.5 text-gray-600">{d.label}</td>
                            <td className="px-2 py-1.5 text-right text-red-400">{d.old !== null ? fmt(d.old) : '--'}</td>
                            <td className="px-2 py-1.5 text-right text-green-600 font-semibold">{fmt(d.new)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
            {preview.direct.length === 0 && preview.indirect.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">No changes detected.</p>
            )}

            {/* Reason */}
            <div className="border-t pt-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Reason for Adjustment <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={e => { setReason(e.target.value); if (e.target.value.trim()) setError(''); }}
                placeholder="Required -- describe why this adjustment is being made..."
                rows={3}
                className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 resize-none ${
                  error && !reason.trim() ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-400'
                }`}
              />
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Attachments</label>
              <label className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={e => setAttachmentFiles(Array.from(e.target.files ?? []))}
                />
                <span className="text-xs text-gray-500">
                  {attachmentFiles.length > 0
                    ? attachmentFiles.map(f => f.name).join(', ')
                    : 'Click to attach files (optional)'}
                </span>
              </label>
              {attachmentFiles.length > 0 && (
                <button
                  onClick={() => setAttachmentFiles([])}
                  className="mt-1 text-xs text-red-500 hover:underline"
                >
                  Clear attachments
                </button>
              )}
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
          <div className="flex justify-end gap-2 px-5 py-3 border-t">
            <button onClick={() => setPreview(null)} className="px-4 py-2 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
              ← Go Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="px-4 py-2 text-xs rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? <><Loader2 size={12} className="animate-spin" />Saving...</> : 'Confirm & Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Edit view (default) ────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Edit Adjustments</h3>
            <p className="text-xs text-gray-500 mt-0.5">{String(row.emp_fullname ?? '')}</p>
          </div>
          <button onClick={handleDiscard} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {fields.map(f => (
            <div key={f.field}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
              <input
                type="number"
                step="0.01"
                value={values[f.field]}
                onChange={e => setValues(v => ({ ...v, [f.field]: e.target.value }))}
                placeholder={String(row[f.field.replace('adj_', '')] ?? '0.00')}
                className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {row[f.field.replace('adj_', '')] !== undefined && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {(row[f.field] !== null && row[f.field] !== undefined)
                    ? <>Current: {fmt(row[f.field])}</>
                    : <>Computed: {fmt(row[f.field.replace('adj_', '')])}</>}
                </p>
              )}
            </div>
          ))}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 px-5 py-4 border-t">
          <button onClick={handleDiscard} className="px-4 py-2 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
            Discard
          </button>
          <button
            onClick={handlePreview}
            disabled={previewing}
            className="px-4 py-2 text-xs rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1.5"
          >
            {previewing ? <><Loader2 size={12} className="animate-spin" />Loading...</> : 'Review Changes →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Payslip Modal ──────────────────────────────────────────────────────────

function PayslipModal({ batchId, employeeId, onClose }: { batchId: number; employeeId: number; onClose: () => void }) {
  const { profile } = useCompany();
  const [data, setData]     = useState<PayslipData | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    payrollApi.getPayslip(batchId, employeeId)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [batchId, employeeId]);

  const handlePrint = () => {
    if (!data?.success) return;
    const win = window.open('', '_blank');
    if (!win) return;

    const { employee: emp, batch, summary: sum, earnings: ear, deductions: ded, tax } = data;
    const g = (obj: Record<string, unknown> | null | undefined, k: string) => obj?.[k];
    const p = (v: unknown) => parseFloat(String(v ?? 0));

    const earRows = ear ? (([
      ['Regular Pay',        'reg_pay'],
      ['Overtime Pay',       'ot_pay'],
      ['Night Differential', 'nd_pay'],
      ['OT Night Diff',      'ot_nd_pay'],
      ['Reg Holiday Pay',    'reg_holiday_pay'],
      ['Spec Holiday Pay',   'spec_holiday_pay'],
      ['Rest Day Pay',       'rd_pay'],
      ['Leave Pay',          'leave_pay'],
    ] as [string, string][])
      .filter(([, k]) => p(ear[k]) > 0)
      .map(([lbl, k]) => `<tr><td>${lbl}</td><td class="r">&#8369;${fmt(ear['adj_' + k] ?? ear[k])}</td></tr>`)
      .join('')) : '';

    const dedRows = ded ? (([
      ['SSS',        'employee_sss',       'employer_sss'],
      ['PhilHealth', 'employee_philhealth', 'employer_philhealth'],
      ['Pag-IBIG',   'employee_pagibig',   'employer_pagibig'],
    ] as [string, string, string][])
      .map(([lbl, ek, erk]) =>
        `<tr><td>${lbl}</td><td class="r">&#8369;${fmt(ded['adj_' + ek] ?? ded[ek])}</td><td class="r">&#8369;${fmt(ded['adj_' + erk] ?? ded[erk])}</td></tr>`)
      .join('')) : '';

    const lateRow = ded && p(ded.late_deduct) > 0
      ? `<tr><td>Late Deduction</td><td class="r">&#8369;${fmt(ded.adj_late_deduct ?? ded.late_deduct)}</td><td></td></tr>` : '';
    const otherRow = ded && p(ded.other_deduct) > 0
      ? `<tr><td>Other Deduction</td><td class="r">&#8369;${fmt(ded.other_deduct)}</td><td></td></tr>` : '';

    const isApproved = data.result_status === 'Approved' || data.result_status === 'Released';
    const apprName = isApproved && data.approver ? String(data.approver.emp_fullname ?? '') : '';
    const apprPos  = isApproved && data.approver ? String(data.approver.emp_position  ?? '') : '';
    const blankSigLine = `<div style="width:140px;border-bottom:1.5px solid #9ca3af;display:inline-block;">&nbsp;</div>`;
    const apprSigHtml = isApproved
      ? (data.approver?.emp_sign
          ? `<img src="${BACKEND}/${String(data.approver.emp_sign)}" onerror="this.style.display='none'" alt="" />`
          : blankSigLine)
      : blankSigLine;
    const empName = String(g(emp, 'emp_fullname') ?? '');
    const empPos  = String(g(emp, 'emp_position')  ?? '');
    const empSigHtml = g(emp, 'emp_sign')
      ? `<img src="${BACKEND}/${String(emp['emp_sign'])}" onerror="this.style.display='none'" alt="" />`
      : blankSigLine;

    win.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Payslip - ${empName}</title>
<style>
  @page { size: auto; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 10pt; color: #222; padding: 15mm 15mm 20mm; }
  .header { text-align: center; border-bottom: 2px solid #1d4ed8; padding-bottom: 10px; margin-bottom: 12px; }
  .logo   { max-height: 90px; max-width: 200px; width: auto; object-fit: contain; display: block; margin: 0 auto 4px; }
  .co   { font-size: 15pt; font-weight: 700; color: #1d4ed8; }
  .addr { font-size: 9pt; color: #6b7280; margin-top: 3px; }
  .meta { font-size: 9pt; color: #444; margin-top: 14px; }
  .info { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 24px;
          background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px;
          padding: 8px 12px; margin-bottom: 12px; font-size: 9pt; }
  .info .k { color: #6b7280; font-weight: 600; }
  .sec { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: .05em;
         color: #374151; border-bottom: 1px solid #d1d5db; padding-bottom: 3px; margin: 10px 0 6px; }
  table  { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 8px; }
  th     { background: #f3f4f6; padding: 4px 8px; border: 1px solid #e5e7eb;
           font-weight: 600; color: #374151; text-align: left; }
  td     { padding: 3px 8px; border: 1px solid #e5e7eb; vertical-align: middle; }
  .r     { text-align: right; }
  .tsub td { background: #f3f4f6; font-weight: 700; }
  .tnet td { background: #dbeafe; font-weight: 700; color: #1e40af; font-size: 10pt; }
  .sigs { display: flex; margin-top: 28px; border-top: 1px solid #e5e7eb; padding-top: 16px; }
  .sig-box { flex: 1; min-width: 0; text-align: center; padding: 0 20px; }
  .sig-box + .sig-box { border-left: 1px solid #e5e7eb; }
  .sig-space { height: 60px; display: flex; align-items: flex-end;
               justify-content: center; margin-bottom: 6px; }
  .sig-space img { max-height: 56px; max-width: 160px; object-fit: contain; display: block; }
  .sig-line { border-top: 1.5px solid #374151; padding-top: 5px; }
  .sig-name { font-weight: 700; font-size: 9pt; min-height: 1.2em; }
  .sig-pos  { font-size: 8pt; color: #6b7280; margin-top: 2px; min-height: 1em; }
  .sig-role { font-size: 8pt; color: #9ca3af; margin-top: 1px; }
</style></head><body>

<div class="header">
  ${profile.logo_url ? `<img class="logo" src="${profile.logo_url}" onerror="this.style.display='none'" alt="" />` : ''}
  <div class="co">${String(profile.company_name ?? '')}</div>
  ${profile.address ? `<div class="addr">${String(profile.address ?? '')}</div>` : ''}
  <div class="meta"><b>Period:</b> ${fmtDate(batch?.payroll_start ?? '')} &ndash; ${fmtDate(batch?.payroll_end ?? '')} &nbsp;&nbsp;|&nbsp;&nbsp; <b>Status:</b> ${data.result_status}</div>
</div>

<div class="info">
  <div><span class="k">Name: </span>${String(g(emp, 'emp_fullname') ?? '')}</div>
  <div><span class="k">Department: </span>${String(g(emp, 'emp_dept') ?? '')}</div>
  <div><span class="k">Position: </span>${String(g(emp, 'emp_position') ?? '')}</div>
  <div><span class="k">Employment: </span>${String(g(emp, 'emp_emptype') ?? '')}</div>
  <div><span class="k">Daily Rate: </span>&#8369;${fmt(g(emp, 'emp_dailyrate'))}</div>
  <div><span class="k">Days Worked: </span>${String(g(sum, 'days_worked') ?? 0)}</div>
</div>

<div class="sec">Earnings</div>
<table>
  <thead><tr><th>Description</th><th class="r">Amount</th></tr></thead>
  <tbody>
    ${earRows}
    <tr class="tsub"><td>Gross Pay</td><td class="r">&#8369;${fmt(ear?.adj_total_pay ?? ear?.total_pay ?? sum?.gross_pay)}</td></tr>
  </tbody>
</table>

<div class="sec">Deductions</div>
<table>
  <thead><tr><th>Description</th><th class="r">Employee Share</th><th class="r">Employer Share</th></tr></thead>
  <tbody>
    ${dedRows}${lateRow}${otherRow}
    <tr class="tsub"><td>Total Deductions</td><td class="r">&#8369;${fmt(ded?.total_deduct ?? sum?.total_deductions)}</td><td class="r">&#8369;${fmt(p(ded?.adj_employer_sss ?? ded?.employer_sss) + p(ded?.adj_employer_philhealth ?? ded?.employer_philhealth) + p(ded?.adj_employer_pagibig ?? ded?.employer_pagibig))}</td></tr>
  </tbody>
</table>

<div class="sec">Tax &amp; Net Pay</div>
<table>
  <tbody>
    <tr><td>Taxable Income</td><td class="r">&#8369;${fmt(tax?.adj_taxable_income ?? tax?.taxable_income)}</td></tr>
    <tr><td>Withholding Tax</td><td class="r">&#8369;${fmt(tax?.adj_tax_deduct ?? tax?.tax_deduct)}</td></tr>
    <tr class="tnet"><td>NET PAY</td><td class="r">&#8369;${fmt(tax?.adj_total ?? tax?.total ?? sum?.net_pay)}</td></tr>
  </tbody>
</table>

<div class="sigs">
  <div class="sig-box">
    <div class="sig-space">${apprSigHtml}</div>
    <div class="sig-line">
      <div class="sig-name">${apprName || '&nbsp;'}</div>
      <div class="sig-pos">${apprPos || '&nbsp;'}</div>
      <div class="sig-role">Authorized Signatory</div>
    </div>
  </div>
  <div class="sig-box">
    <div class="sig-space">${empSigHtml}</div>
    <div class="sig-line">
      <div class="sig-name">${empName || '&nbsp;'}</div>
      <div class="sig-pos">${empPos || '&nbsp;'}</div>
      <div class="sig-role">Employee</div>
    </div>
  </div>
</div>
</body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.onafterprint = () => win.close();
  };

  if (loading) return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-10"><Spinner /></div>
    </div>
  );
  if (!data?.success || !data.summary) return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 text-center">
        <p className="text-sm text-red-600">Payslip data not available.</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 text-sm rounded-lg border">Close</button>
      </div>
    </div>
  );

  const { employee: emp, batch, summary: sum, earnings: ear, deductions: ded, tax } = data;
  const eff = <T extends Record<string, unknown>>(obj: T | null | undefined, key: string) => obj?.[key];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-bold text-gray-800">Payslip</h2>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700">
              <Printer size={13} />Print
            </button>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"><X size={16} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4" ref={printRef}>
          {/* Header */}
          <div className="text-center mb-4 pb-3 border-b">
            {profile.logo_url && (
              <img
                src={profile.logo_url}
                alt="Logo"
                className="max-h-20 w-auto block mx-auto mb-1"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <p className="text-lg font-bold" style={{ color: 'var(--brand-primary)' }}>{profile.company_name}</p>
            {profile.address && <p className="text-xs text-gray-500 mt-0.5">{profile.address}</p>}
            <p className="text-xs text-gray-400 mt-4">
              <strong>Period:</strong> {fmtDate(batch?.payroll_start ?? '')} - {fmtDate(batch?.payroll_end ?? '')}
              <span className="mx-2">|</span>
              <strong>Status:</strong> {data.result_status}
            </p>
          </div>

          {/* Employee Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4 grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <div><span className="font-semibold text-gray-500">Name:</span> <span className="text-gray-800">{String(eff(emp, 'emp_fullname') ?? '')}</span></div>
            <div><span className="font-semibold text-gray-500">Department:</span> <span className="text-gray-800">{String(eff(emp, 'emp_dept') ?? '')}</span></div>
            <div><span className="font-semibold text-gray-500">Position:</span> <span className="text-gray-800">{String(eff(emp, 'emp_position') ?? '')}</span></div>
            <div><span className="font-semibold text-gray-500">Employment:</span> <span className="text-gray-800">{String(eff(emp, 'emp_emptype') ?? '')}</span></div>
            <div><span className="font-semibold text-gray-500">Daily Rate:</span> <span className="text-gray-800">₱{fmt(eff(emp, 'emp_dailyrate'))}</span></div>
            <div><span className="font-semibold text-gray-500">Days Worked:</span> <span className="text-gray-800">{String(eff(sum, 'days_worked') ?? 0)}</span></div>
          </div>

          {/* Earnings */}
          <h4 className="text-xs font-bold text-gray-600 border-b pb-1 mb-2 uppercase tracking-wide">Earnings</h4>
          <table className="w-full text-xs mb-3">
            <thead><tr className="bg-gray-50"><th className="px-3 py-1.5 text-left font-semibold text-gray-600">Description</th><th className="px-3 py-1.5 text-right font-semibold text-gray-600">Amount</th></tr></thead>
            <tbody>
              {ear && ([
                ['Regular Pay',        'reg_pay'],
                ['Overtime Pay',       'ot_pay'],
                ['Night Differential', 'nd_pay'],
                ['OT Night Diff',      'ot_nd_pay'],
                ['Reg Holiday Pay',    'reg_holiday_pay'],
                ['Spec Holiday Pay',   'spec_holiday_pay'],
                ['Rest Day Pay',       'rd_pay'],
                ['Leave Pay',          'leave_pay'],
              ] as [string, string][]).filter(([, k]) => parseFloat(String(ear[k] ?? 0)) > 0).map(([label, key]) => (
                <tr key={key} className="border-b"><td className="px-3 py-1">{label}</td><td className="px-3 py-1 text-right">₱{fmt(ear[`adj_${key}`] ?? ear[key])}</td></tr>
              ))}
              <tr className="bg-gray-50 font-bold"><td className="px-3 py-1.5">Gross Pay</td><td className="px-3 py-1.5 text-right">₱{fmt(ear?.['adj_total_pay'] ?? ear?.['total_pay'] ?? sum?.['gross_pay'])}</td></tr>
            </tbody>
          </table>

          {/* Deductions */}
          <h4 className="text-xs font-bold text-gray-600 border-b pb-1 mb-2 uppercase tracking-wide">Deductions</h4>
          <table className="w-full text-xs mb-3">
            <thead><tr className="bg-gray-50"><th className="px-3 py-1.5 text-left font-semibold text-gray-600">Description</th><th className="px-3 py-1.5 text-right font-semibold text-gray-600">Employee Share</th><th className="px-3 py-1.5 text-right font-semibold text-gray-600">Employer Share</th></tr></thead>
            <tbody>
              {ded && ([
                ['SSS',       'employee_sss',       'employer_sss'],
                ['PhilHealth','employee_philhealth', 'employer_philhealth'],
                ['Pag-IBIG',  'employee_pagibig',   'employer_pagibig'],
              ] as [string, string, string][]).map(([label, empKey, erKey]) => (
                <tr key={label} className="border-b">
                  <td className="px-3 py-1">{label}</td>
                  <td className="px-3 py-1 text-right">₱{fmt(ded[`adj_${empKey}`] ?? ded[empKey])}</td>
                  <td className="px-3 py-1 text-right">₱{fmt(ded[`adj_${erKey}`] ?? ded[erKey])}</td>
                </tr>
              ))}
              {ded && parseFloat(String(ded.late_deduct ?? 0)) > 0 && (
                <tr className="border-b"><td className="px-3 py-1">Late Deduction</td><td className="px-3 py-1 text-right">₱{fmt(ded.adj_late_deduct ?? ded.late_deduct)}</td><td className="px-3 py-1 text-right">--</td></tr>
              )}
              {ded && parseFloat(String(ded.other_deduct ?? 0)) > 0 && (
                <tr className="border-b"><td className="px-3 py-1">Other Deduction</td><td className="px-3 py-1 text-right">₱{fmt(ded.other_deduct)}</td><td className="px-3 py-1 text-right">--</td></tr>
              )}
              <tr className="bg-gray-50 font-bold"><td className="px-3 py-1.5">Total Deductions</td><td className="px-3 py-1.5 text-right">₱{fmt(ded?.total_deduct ?? sum?.total_deductions)}</td><td className="px-3 py-1.5 text-right">{ded ? `₱${fmt(parseFloat(String(ded.adj_employer_sss ?? ded.employer_sss ?? 0)) + parseFloat(String(ded.adj_employer_philhealth ?? ded.employer_philhealth ?? 0)) + parseFloat(String(ded.adj_employer_pagibig ?? ded.employer_pagibig ?? 0)))}` : ''}</td></tr>
            </tbody>
          </table>

          {/* Tax & Net */}
          <h4 className="text-xs font-bold text-gray-600 border-b pb-1 mb-2 uppercase tracking-wide">Tax &amp; Net Pay</h4>
          <table className="w-full text-xs mb-4">
            <tbody>
              <tr className="border-b"><td className="px-3 py-1 text-gray-600">Taxable Income</td><td className="px-3 py-1 text-right">₱{fmt(tax?.adj_taxable_income ?? tax?.taxable_income)}</td></tr>
              <tr className="border-b"><td className="px-3 py-1 text-gray-600">Withholding Tax</td><td className="px-3 py-1 text-right">₱{fmt(tax?.adj_tax_deduct ?? tax?.tax_deduct)}</td></tr>
              <tr className="bg-blue-50 font-bold text-blue-800"><td className="px-3 py-2 text-sm">NET PAY</td><td className="px-3 py-2 text-right text-sm">₱{fmt(tax?.adj_total ?? tax?.total ?? sum?.net_pay)}</td></tr>
            </tbody>
          </table>

          {/* Signatures */}
          <div className="mt-8 flex justify-between gap-8">
            {/* Left: Approver / Admin */}
            <div className="text-center flex-1">
              <div className="h-14 flex items-end justify-center mb-1">
                {(data.result_status === 'Approved' || data.result_status === 'Released') && data.approver?.emp_sign && (
                  <img
                    src={`${BACKEND}/${String(data.approver.emp_sign)}`}
                    alt="Approver Signature"
                    className="max-h-14 object-contain"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
              </div>
              <div className="border-t border-gray-400 pt-1 text-xs">
                {(data.result_status === 'Approved' || data.result_status === 'Released') && data.approver ? (
                  <>
                    <p className="font-semibold text-gray-800">{String(data.approver.emp_fullname ?? '')}</p>
                    <p className="text-gray-500">{String(data.approver.emp_position ?? '')}</p>
                  </>
                ) : <p className="text-gray-300">&nbsp;</p>}
                <p className="text-gray-400">Authorized Signatory</p>
              </div>
            </div>
            {/* Right: Employee */}
            <div className="text-center flex-1">
              <div className="h-14 flex items-end justify-center mb-1">
                {emp?.emp_sign && (
                  <img
                    src={`${BACKEND}/${String(emp.emp_sign)}`}
                    alt="Employee Signature"
                    className="max-h-14 object-contain"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
              </div>
              <div className="border-t border-gray-400 pt-1 text-xs">
                <p className="font-semibold text-gray-800">{String(eff(emp, 'emp_fullname') ?? '')}</p>
                <p className="text-gray-500">{String(eff(emp, 'emp_position') ?? '')}</p>
                <p className="text-gray-400">Employee</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Data Table ─────────────────────────────────────────────────────────────

const tableConfigs: Record<PayrollTableType, { label: string; columns: { key: string; label: string; format?: 'currency' | 'number' | 'date' }[] }> = {
  summary: {
    label: 'Payroll Summary',
    columns: [
      { key: 'emp_fullname',    label: 'Employee' },
      { key: 'emp_dept',        label: 'Department' },
      { key: 'payroll_period',  label: 'Period' },
      { key: 'days_worked',     label: 'Days Worked', format: 'number' },
      { key: 'gross_pay',       label: 'Gross Pay', format: 'currency' },
      { key: 'total_deductions',label: 'Deductions', format: 'currency' },
      { key: 'tax_deduct',      label: 'Tax', format: 'currency' },
      { key: 'net_pay',         label: 'Net Pay', format: 'currency' },
    ],
  },
  earnings: {
    label: 'Earnings Breakdown',
    columns: [
      { key: 'emp_fullname',                label: 'Employee' },
      { key: 'payroll_period',              label: 'Period' },
      { key: 'reg_pay',                     label: 'Regular', format: 'currency' },
      { key: 'ot_pay',                      label: 'OT', format: 'currency' },
      { key: 'nd_pay',                      label: 'Night Diff', format: 'currency' },
      { key: 'ot_nd_pay',                   label: 'OT Night Diff', format: 'currency' },
      { key: 'reg_holiday_pay',             label: 'RH Regular', format: 'currency' },
      { key: 'reg_holiday_ot_pay',          label: 'RH OT', format: 'currency' },
      { key: 'reg_holiday_nd_pay',          label: 'RH ND', format: 'currency' },
      { key: 'reg_holiday_ot_nd_pay',       label: 'RH OT ND', format: 'currency' },
      { key: 'reg_holiday_rd_pay',          label: 'RH RD', format: 'currency' },
      { key: 'reg_holiday_rd_ot_pay',       label: 'RH RD OT', format: 'currency' },
      { key: 'reg_holiday_rd_nd_pay',       label: 'RH RD ND', format: 'currency' },
      { key: 'reg_holiday_rd_ot_nd_pay',    label: 'RH RD OT ND', format: 'currency' },
      { key: 'spec_holiday_pay',            label: 'SH Regular', format: 'currency' },
      { key: 'spec_holiday_ot_pay',         label: 'SH OT', format: 'currency' },
      { key: 'spec_holiday_nd_pay',         label: 'SH ND', format: 'currency' },
      { key: 'spec_holiday_ot_nd_pay',      label: 'SH OT ND', format: 'currency' },
      { key: 'spec_holiday_rd_pay',         label: 'SH RD', format: 'currency' },
      { key: 'spec_holiday_rd_ot_pay',      label: 'SH RD OT', format: 'currency' },
      { key: 'spec_holiday_rd_nd_pay',      label: 'SH RD ND', format: 'currency' },
      { key: 'spec_holiday_rd_ot_nd_pay',   label: 'SH RD OT ND', format: 'currency' },
      { key: 'rd_pay',                      label: 'RD Regular', format: 'currency' },
      { key: 'rd_ot_pay',                   label: 'RD OT', format: 'currency' },
      { key: 'rd_nd_pay',                   label: 'RD ND', format: 'currency' },
      { key: 'rd_ot_nd_pay',                label: 'RD OT ND', format: 'currency' },
      { key: 'leave_pay',                   label: 'Leave', format: 'currency' },
      { key: 'total_pay',                   label: 'Total Pay', format: 'currency' },
    ],
  },
  deductions: {
    label: 'Deductions',
    columns: [
      { key: 'emp_fullname',          label: 'Employee' },
      { key: 'employee_sss',          label: 'SSS (Emp)', format: 'currency' },
      { key: 'employer_sss',          label: 'SSS (Er)', format: 'currency' },
      { key: 'employee_philhealth',   label: 'PhilHealth (Emp)', format: 'currency' },
      { key: 'employer_philhealth',   label: 'PhilHealth (Er)', format: 'currency' },
      { key: 'employee_pagibig',      label: 'Pag-IBIG (Emp)', format: 'currency' },
      { key: 'employer_pagibig',      label: 'Pag-IBIG (Er)', format: 'currency' },
      { key: 'late_deduct',           label: 'Late', format: 'currency' },
      { key: 'other_deduct',          label: 'Other', format: 'currency' },
      { key: 'employee_total_benefits', label: 'Emp Benefits Total', format: 'currency' },
      { key: 'employer_total_benefits', label: 'Er Benefits Total', format: 'currency' },
      { key: 'total_deduct',          label: 'Total Deductions', format: 'currency' },
      { key: 'total_contributions',   label: 'Total Contributions', format: 'currency' },
    ],
  },
  tax: {
    label: 'Tax Deduction',
    columns: [
      { key: 'emp_fullname',    label: 'Employee' },
      { key: 'emp_dept',        label: 'Department' },
      { key: 'payroll_period',  label: 'Period' },
      { key: 'taxable_income',  label: 'Taxable Income', format: 'currency' },
      { key: 'tax_deduct',      label: 'Withholding Tax', format: 'currency' },
      { key: 'total',           label: 'Net After Tax', format: 'currency' },
    ],
  },
  attendance_summary: {
    label: 'Attendance Summary',
    columns: [
      { key: 'emp_fullname',             label: 'Employee' },
      { key: 'emp_dept',                 label: 'Department' },
      { key: 'reg_hrs',                  label: 'Reg Hrs', format: 'number' },
      { key: 'ot_hrs',                   label: 'OT Hrs', format: 'number' },
      { key: 'nd_hrs',                   label: 'ND Hrs', format: 'number' },
      { key: 'ot_nd_hrs',                label: 'OT ND Hrs', format: 'number' },
      { key: 'reg_holiday_days',         label: 'RH Days', format: 'number' },
      { key: 'reg_holiday_hrs',          label: 'RH Hrs', format: 'number' },
      { key: 'reg_holiday_ot_hrs',       label: 'RH OT Hrs', format: 'number' },
      { key: 'reg_holiday_nd_hrs',       label: 'RH ND Hrs', format: 'number' },
      { key: 'reg_holiday_ot_nd_hrs',    label: 'RH OT ND Hrs', format: 'number' },
      { key: 'reg_holiday_rd_hrs',       label: 'RH RD Hrs', format: 'number' },
      { key: 'reg_holiday_rd_ot_hrs',    label: 'RH RD OT Hrs', format: 'number' },
      { key: 'reg_holiday_rd_nd_hrs',    label: 'RH RD ND Hrs', format: 'number' },
      { key: 'reg_holiday_rd_ot_nd_hrs', label: 'RH RD OT ND Hrs', format: 'number' },
      { key: 'spec_holiday_hrs',         label: 'SH Hrs', format: 'number' },
      { key: 'spec_holiday_ot_hrs',      label: 'SH OT Hrs', format: 'number' },
      { key: 'spec_holiday_nd_hrs',      label: 'SH ND Hrs', format: 'number' },
      { key: 'spec_holiday_ot_nd_hrs',   label: 'SH OT ND Hrs', format: 'number' },
      { key: 'spec_holiday_rd_hrs',      label: 'SH RD Hrs', format: 'number' },
      { key: 'spec_holiday_rd_ot_hrs',   label: 'SH RD OT Hrs', format: 'number' },
      { key: 'spec_holiday_rd_nd_hrs',   label: 'SH RD ND Hrs', format: 'number' },
      { key: 'spec_holiday_rd_ot_nd_hrs',label: 'SH RD OT ND Hrs', format: 'number' },
      { key: 'rd_hrs',                   label: 'RD Hrs', format: 'number' },
      { key: 'rd_ot_hrs',                label: 'RD OT Hrs', format: 'number' },
      { key: 'rd_nd_hrs',                label: 'RD ND Hrs', format: 'number' },
      { key: 'rd_ot_nd_hrs',             label: 'RD OT ND Hrs', format: 'number' },
      { key: 'late_mins',                label: 'Late (min)', format: 'number' },
      { key: 'leave_days',               label: 'Leave Days', format: 'number' },
    ],
  },
  results: {
    label: 'Payroll Results',
    columns: [
      { key: 'batch_id',       label: 'Batch' },
      { key: 'payroll_start',  label: 'Start', format: 'date' },
      { key: 'payroll_end',    label: 'End', format: 'date' },
      { key: 'num_employees',  label: 'Employees', format: 'number' },
      { key: 'status',         label: 'Status' },
      { key: 'created_at',     label: 'Created', format: 'date' },
    ],
  },
};

interface DataTableProps {
  type: PayrollTableType;
  batchId: number;
  isLocked?: boolean;
  isReadOnly?: boolean;
  scopedEmployeeId?: number;
  onRefresh?: () => void;
  onPayslip?: (row: Row) => void;
  onStatusChange?: (row: Row, status: PayrollStatus) => void;
}

function DataTable({ type, batchId, isLocked = false, isReadOnly = false, scopedEmployeeId, onRefresh, onPayslip, onStatusChange }: DataTableProps) {
  const [rows, setRows]               = useState<Row[]>([]);
  const [archivedRows, setArchivedRows] = useState<Row[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editRow, setEditRow]         = useState<Row | null>(null);
  const [loadError, setLoadError]     = useState('');
  const config = tableConfigs[type];
  const LIMIT = 20;

  const archivable: PayrollTableType[] = ['earnings','deductions','tax','attendance_summary','summary'];
  const editableTypes: PayrollTableType[] = ['earnings', 'deductions', 'tax', 'attendance_summary'];

  // ── Search / Sort / Dept filter state ────────────────────────────────────
  const [search, setSearch]             = useState('');
  const [dept, setDept]                 = useState('');
  const [depts, setDepts]               = useState<string[]>([]);
  const [sortCol, setSortCol]           = useState('id');
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('desc');

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
    setPage(1);
  };

  const downloadCSV = () => {
    if (rows.length === 0) return;
    const header = config.columns.map(c => `"${c.label}"`).join(',');
    const csvRows = rows.map(row =>
      config.columns.map(col => {
        const adjKey = `adj_${col.key}`;
        const adjVal = row[adjKey];
        const hasAdj = adjVal !== null && adjVal !== undefined && adjVal !== '';
        const val = String(hasAdj ? adjVal : (row[col.key] ?? '')).replace(/"/g, '""');
        return `"${val}"`;
      }).join(',')
    );
    const csv  = [header, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `payroll_${type}_batch_${batchId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const load = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    setLoadError('');
    try {
      const res = await payrollApi.getTable({
        type, batch_id: batchId, page, limit: LIMIT,
        // When scoped to a single employee (employee view mode), pass their ID and skip name/dept
        ...(scopedEmployeeId
          ? { employee_id: scopedEmployeeId }
          : { name: search || undefined, dept: dept || undefined }),
        sort_col: sortCol,
        sort_dir: sortDir,
      });
      setRows(res.data);
      setTotal(res.total);
      // collect unique depts from loaded rows for the filter dropdown
      const empDepts = [...new Set(res.data
        .map(r => String(r.emp_dept ?? '')).filter(Boolean))];
      setDepts(prev => [...new Set([...prev, ...empDepts])].sort());
    } catch (e: unknown) {
      setLoadError((e as Error).message ?? 'Failed to load data');
      // Rows intentionally preserved -- do not clear on error
    } finally {
      setLoading(false);
    }
  }, [type, batchId, page, search, dept, sortCol, sortDir, scopedEmployeeId]);

  const loadArchived = useCallback(async () => {
    if (!batchId || !archivable.includes(type)) return;
    try {
      const res = await payrollApi.getArchivedRows({ type, batch_id: batchId });
      setArchivedRows(res.data);
    } catch {
      setArchivedRows([]);
    }
  }, [type, batchId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadArchived(); }, [loadArchived]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const renderCell = (col: typeof config.columns[0], row: Row) => {
    const rawVal = row[col.key];
    // Check for adj_ override
    const adjKey = `adj_${col.key}`;
    const adjVal = row[adjKey];
    const hasAdj = adjVal !== null && adjVal !== undefined && adjVal !== '';
    const effectiveVal = hasAdj ? adjVal : rawVal;

    if (col.key === 'status') return <StatusBadge status={String(rawVal ?? '')} />;
    if (col.format === 'currency') return (
      <span className={hasAdj ? 'text-blue-600 font-medium' : ''}>
        {hasAdj && <span className="text-blue-400 text-[10px] mr-0.5" title={`Original: ₱${fmt(rawVal)}`}>●</span>}
        ₱{fmt(effectiveVal)}
      </span>
    );
    if (col.format === 'number') return (
      <span className={hasAdj ? 'text-blue-600 font-medium' : ''}>
        {hasAdj && <span className="text-blue-400 text-[10px] mr-0.5" title={`Original: ${fmt(rawVal, 0)}`}>●</span>}
        {fmt(effectiveVal, 0)}
      </span>
    );
    if (col.format === 'date')   return <span>{fmtDate(String(rawVal ?? ''))}</span>;
    if (col.key === 'payroll_period') {
      const parts = String(rawVal ?? '').split(' to ');
      if (parts.length === 2) return <span>{fmtDate(parts[0].trim())} - {fmtDate(parts[1].trim())}</span>;
    }
    return <span>{String(rawVal ?? '--')}</span>;
  };

  return (
    <div>
      {/* Controls: name search + department filter -- hidden when scoped to a single employee */}
      {type !== 'results' && !scopedEmployeeId && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-b bg-gray-50">
          <div className="relative flex-1 min-w-32 max-w-56">
            <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input
              placeholder="Search name..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {depts.length > 0 && (
            <select
              value={dept}
              onChange={e => { setDept(e.target.value); setPage(1); }}
              className="text-xs border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">All Departments</option>
              {depts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          {(search || dept) && (
            <button
              onClick={() => { setSearch(''); setDept(''); setPage(1); }}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100"
            >
              Clear
            </button>
          )}
        </div>
      )}
      {!loading && loadError && (
        <div className="px-4 py-3 flex items-center gap-2 bg-red-50 border-b text-xs text-red-600">
          <AlertTriangle size={13} className="flex-shrink-0" />
          <span className="flex-1">{loadError}</span>
          <button onClick={load} className="flex items-center gap-1 text-blue-600 font-medium hover:underline">
            <RefreshCw size={11} />Retry
          </button>
        </div>
      )}
      {loading && <div className="py-6 text-center"><Spinner /></div>}
      {!loading && !loadError && rows.length === 0 && (
        <div className="py-10 text-center text-sm text-gray-400">No data for this batch.</div>
      )}
      {!loading && loadError && rows.length === 0 && (
        <div className="py-10 text-center text-sm text-gray-400">No data loaded.</div>
      )}
      {!loading && rows.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {config.columns.map((col, colIdx) => (
                    <th
                      key={col.key}
                      className={`px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap cursor-pointer select-none hover:bg-gray-100 transition-colors ${colIdx === 0 ? 'sticky left-0 z-10 bg-gray-50 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)]' : ''}`}
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                      {sortCol === col.key && (
                        <span className="ml-1 text-blue-400">{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                  ))}
                  {(editableTypes.includes(type) || type === 'summary' || onPayslip) && (
                    <th className="px-3 py-2 text-left font-semibold text-gray-500 sticky right-0 z-10 bg-gray-50 border-l border-gray-200 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-blue-50/40 transition-colors">
                    {config.columns.map((col, colIdx) => (
                      <td key={col.key} className={`px-3 py-2 whitespace-nowrap ${colIdx === 0 ? 'sticky left-0 z-10 bg-white shadow-[4px_0_6px_-2px_rgba(0,0,0,0.04)]' : ''}`}>
                        {renderCell(col, row)}
                      </td>
                    ))}
                    {(editableTypes.includes(type) || type === 'summary' || onPayslip) && (
                      <td className="px-3 py-2 sticky right-0 z-10 bg-white border-l border-gray-100 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.04)]">
                        <div className="flex gap-1.5 items-center">
                          {editableTypes.includes(type) && !isLocked && !isReadOnly && (
                            <button
                              onClick={() => setEditRow(row)}
                              title="Edit adjustments"
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                          )}
                          {type === 'summary' && onPayslip && (
                            <button
                              onClick={() => onPayslip(row)}
                              title="View Payslip"
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600"
                            >
                              <Printer size={13} />
                            </button>
                          )}
                          {type === 'results' && onStatusChange && !isLocked && !isReadOnly && (
                            <select
                              value={String(row.status ?? 'Draft')}
                              onChange={e => onStatusChange(row, e.target.value as PayrollStatus)}
                              className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                            >
                              {(['Draft','Under Review','Approved','Released','Dropped'] as PayrollStatus[]).map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50 text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span>Showing {((page - 1) * LIMIT) + 1}-{Math.min(page * LIMIT, total)} of {total}</span>
              <button
                onClick={downloadCSV}
                title="Download CSV"
                className="flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-blue-600"
              >
                <Download size={11} /><span>CSV</span>
              </button>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 py-0.5">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {editRow && (
        <EditRowModal
          tableType={type}
          row={editRow}
          onClose={() => setEditRow(null)}
          onSaved={() => { load(); loadArchived(); onRefresh?.(); }}
        />
      )}

      {/* Previous Values -- archived rows */}
      {archivable.includes(type) && archivedRows.length > 0 && (
        <div className="border-t mt-2">
          <button
            onClick={() => setShowArchived(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Clock size={12} className="text-amber-500" />
              Previous Values ({archivedRows.length} row{archivedRows.length > 1 ? 's' : ''})
            </span>
            {showArchived ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showArchived && (
            <div className="overflow-x-auto bg-amber-50/40">
              <table className="w-full text-xs opacity-80">
                <thead>
                  <tr className="bg-amber-100/60 border-b">
                    {config.columns.map(col => (
                      <th key={col.key} className="px-3 py-2 text-left font-semibold text-amber-700 whitespace-nowrap">{col.label}</th>
                    ))}
                    <th className="px-3 py-2 text-left font-semibold text-amber-700">Archived At</th>
                  </tr>
                </thead>
                <tbody>
                  {archivedRows.map((row, i) => (
                    <tr key={i} className="border-b hover:bg-amber-50 transition-colors">
                      {config.columns.map(col => (
                        <td key={col.key} className="px-3 py-2 whitespace-nowrap text-gray-600">
                          {renderCell(col, row)}
                        </td>
                      ))}
                      <td className="px-3 py-2 whitespace-nowrap text-gray-400 text-xs">{fmtDate(String(row.archived_at ?? ''))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Audit Trail helpers ────────────────────────────────────────────────────

/** Groups rows that share the same employee + timestamp (to the second) */
const auditGroupKey = (e: AuditEntry) => `${e.employee_id}__${String(e.changed_at).slice(0, 19)}`;

const fmtTableName = (t: string) =>
  t.replace('fch_', '').replace(/_/g, ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

// ─── Audit Detail Modal ──────────────────────────────────────────────────────

function AuditDetailModal({ entries, groupKey, onClose }: { entries: AuditEntry[]; groupKey: string; onClose: () => void }) {
  const grouped = entries.filter(e => auditGroupKey(e) === groupKey).slice().sort((a, b) => a.id - b.id);
  const manualEntry = grouped.find(e => e.action === 'adj_edit') ?? grouped[0];
  const changerName = manualEntry
    ? (`${manualEntry.changer_firstname ?? ''} ${manualEntry.changer_lastname ?? ''}`.trim() || (manualEntry.changed_by_user_id ? `User #${manualEntry.changed_by_user_id}` : '--'))
    : '--';

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Edit Group -- {grouped[0]?.emp_fullname ?? '--'}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {fmtDateTime(grouped[0]?.changed_at ?? '')} &bull; {grouped.length} change{grouped.length !== 1 ? 's' : ''} &bull; By: {changerName}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"><X size={16} /></button>
        </div>

        {/* Reason banner */}
        {manualEntry?.notes && (
          <div className="px-5 py-2.5 bg-blue-50 border-b flex items-start gap-2">
            <span className="text-xs font-semibold text-blue-600 mt-0.5 flex-shrink-0">Reason:</span>
            <span className="text-xs text-blue-800 whitespace-pre-wrap">{manualEntry.notes}</span>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b">
                {['#', 'Type', 'Table', 'Field', 'Old Value', 'New Value'].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grouped.map((e, i) => (
                <tr key={e.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 text-gray-400 tabular-nums">{i + 1}</td>
                  <td className="px-3 py-2">
                    {e.action === 'adj_edit'
                      ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">Manual Edit</span>
                      : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">Auto Edit</span>
                    }
                  </td>
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{fmtTableName(e.table_name)}</td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{FIELD_LABELS[e.field_name] ?? e.field_name}</td>
                  <td className="px-3 py-2 text-red-500 tabular-nums">{e.old_value !== null ? fmt(e.old_value) : '--'}</td>
                  <td className="px-3 py-2 text-green-600 font-semibold tabular-nums">{e.new_value !== null ? fmt(e.new_value) : '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Audit Trail Table ──────────────────────────────────────────────────────

function AuditTable({ batchId, refreshKey }: { batchId: number; refreshKey?: number }) {
  const [entries, setEntries]       = useState<AuditEntry[]>([]);
  const [loading, setLoading]       = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!batchId) return;
    setLoading(true);
    payrollApi.getAuditTrail(batchId)
      .then(res => setEntries(res.data))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [batchId]);

  useEffect(() => { reload(); }, [reload, refreshKey]);

  if (loading) return <div className="py-8 text-center"><Spinner /></div>;
  if (entries.length === 0) return (
    <div className="py-12 text-center">
      <p className="text-sm text-gray-400">No changes recorded yet.</p>
      <button onClick={reload} className="mt-2 text-xs text-blue-500 hover:underline">Refresh</button>
    </div>
  );

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b">
              {['#', 'Time', 'Employee', 'Table', 'Field', 'Old Value', 'New Value', 'Changed By', 'Type'].map(h => (
                <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((e, idx) => {
              const isManual = e.action === 'adj_edit';
              const groupKey = auditGroupKey(e);
              // Find the manual entry for this group to get the reason for auto rows
              const manualInGroup = isManual ? e : entries.find(x => auditGroupKey(x) === groupKey && x.action === 'adj_edit');
              const changerName = e.changer_firstname
                ? `${e.changer_firstname} ${e.changer_lastname ?? ''}`.trim()
                : e.changed_by_user_id ? `User #${e.changed_by_user_id}` : '--';

              return (
                <tr
                  key={e.id}
                  onClick={() => setActiveGroup(groupKey)}
                  className="border-b hover:bg-blue-50/40 cursor-pointer transition-colors"
                  title="Click to view all related changes in this edit group"
                >
                  {/* # */}
                  <td className="px-3 py-2 text-gray-400 tabular-nums">{idx + 1}</td>
                  {/* Time */}
                  <td className="px-3 py-2 whitespace-nowrap text-gray-400">{fmtDateTime(e.changed_at)}</td>
                  {/* Employee */}
                  <td className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap">{e.emp_fullname}</td>
                  {/* Table */}
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{fmtTableName(e.table_name)}</td>
                  {/* Field */}
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{FIELD_LABELS[e.field_name] ?? e.field_name}</td>
                  {/* Old Value */}
                  <td className="px-3 py-2 text-red-500 tabular-nums">{e.old_value !== null ? fmt(e.old_value) : '--'}</td>
                  {/* New Value */}
                  <td className="px-3 py-2 text-green-600 font-semibold tabular-nums">{e.new_value !== null ? fmt(e.new_value) : '--'}</td>
                  {/* Changed By */}
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{changerName}</td>
                  {/* Type */}
                  <td className="px-3 py-2 min-w-[160px]">
                    {isManual ? (
                      <div className="space-y-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                          Manual Edit
                        </span>
                        {e.notes && (
                          <p className="text-gray-600 text-[11px] leading-snug line-clamp-2" title={e.notes}>
                            {e.notes}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                          Auto Edit
                        </span>
                        <p className="text-gray-400 text-[11px] leading-snug">
                          {manualInGroup
                            ? <>Triggered by manual edit{manualInGroup.notes ? `: ${manualInGroup.notes.slice(0, 60)}${manualInGroup.notes.length > 60 ? '...' : ''}` : ''}</>
                            : 'Triggered by manual edit'}
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      {activeGroup !== null && (
        <AuditDetailModal
          entries={entries}
          groupKey={activeGroup}
          onClose={() => setActiveGroup(null)}
        />
      )}
    </>
  );
}

// ─── Recompute Modal ────────────────────────────────────────────────────────

function RecomputeModal({ batchId, onClose, onDone }: { batchId: number; onClose: () => void; onDone: () => void }) {
  const [running, setRunning]         = useState(false);
  const [steps, setSteps]             = useState<{ step: string; success: boolean; message: string }[]>([]);
  const [result, setResult]           = useState<{ success: boolean; message: string } | null>(null);

  // Employee selection
  type EmpRow = { employee_id: number; emp_fullname: string; emp_dept?: string };
  const [emps, setEmps]               = useState<EmpRow[]>([]);
  const [loadingEmps, setLoadingEmps] = useState(true);
  const [selected, setSelected]       = useState<Set<number>>(new Set());
  const [empSearch, setEmpSearch]     = useState('');

  useEffect(() => {
    payrollApi.getTable({ type: 'attendance_summary', batch_id: batchId, page: 1, limit: 200 })
      .then(res => {
        const list = res.data as EmpRow[];
        setEmps(list);
        setSelected(new Set(list.map(e => e.employee_id)));
      })
      .catch(() => setEmps([]))
      .finally(() => setLoadingEmps(false));
  }, [batchId]);

  const visible     = emps.filter(e => !empSearch || e.emp_fullname.toLowerCase().includes(empSearch.toLowerCase()));
  const allSelected = emps.length > 0 && selected.size === emps.length;

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(emps.map(e => e.employee_id)));

  const toggleOne = (id: number) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleRecompute = async () => {
    if (selected.size === 0) return;
    setRunning(true);
    setSteps([]);
    setResult(null);
    try {
      // If all employees selected, use the batch-level recompute (more efficient)
      if (allSelected) {
        const res = await payrollApi.generate({ batch_id: batchId, step: 'recompute' });
        setSteps(res.steps ?? []);
        setResult({ success: res.success, message: res.message });
        if (res.success) onDone();
      } else {
        // Per-employee recompute -- run sequentially
        let lastSuccess = true;
        const allSteps: typeof steps = [];
        for (const empId of Array.from(selected)) {
          const emp = emps.find(e => e.employee_id === empId);
          const res = await payrollApi.generate({ batch_id: batchId, step: 'recompute', employee_id: empId });
          const label = emp ? emp.emp_fullname : `#${empId}`;
          allSteps.push(...(res.steps ?? []).map(s => ({ ...s, step: `${label} › ${s.step}` })));
          if (!res.success) { lastSuccess = false; break; }
        }
        setSteps(allSteps);
        setResult({ success: lastSuccess, message: lastSuccess ? `Recomputed ${selected.size} employee(s) successfully.` : 'Some steps failed.' });
        if (lastSuccess) onDone();
      }
    } catch (e: unknown) {
      setResult({ success: false, message: (e as Error).message ?? 'Recompute failed' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
          <h3 className="text-sm font-bold text-gray-800">Recompute Payroll</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"><X size={16} /></button>
        </div>

        {/* Employee selection */}
        {!result && (
          <div className="px-5 pt-4 pb-2 flex-shrink-0 space-y-2">
            <p className="text-xs text-gray-500">
              Select which employees to recompute for <strong>Batch #{batchId}</strong>.
              adj_ overrides on Earnings / Deductions / Tax will be <strong>cleared</strong> for selected employees.
              Attendance Summary adjustments are preserved and reapplied.
            </p>
            {!running && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Manual <strong>adj_ overrides</strong> on Earnings, Deductions, and Tax rows will be <strong>cleared</strong>.
                  Only <strong>Attendance Summary</strong> adjustments are preserved.
                </p>
              </div>
            )}
          </div>
        )}

        {!result && (
          <div className="px-5 pb-2 flex-shrink-0">
            <div className="border rounded-xl overflow-hidden">
              {/* Toolbar: select-all + search */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded"
                  id="recomp-select-all"
                />
                <label htmlFor="recomp-select-all" className="text-xs font-medium text-gray-600 flex-1 cursor-pointer">
                  {allSelected ? 'Deselect all' : `Select all (${emps.length})`}
                </label>
                <div className="relative">
                  <Search size={12} className="absolute left-2 top-1.5 text-gray-400" />
                  <input
                    placeholder="Filter..."
                    value={empSearch}
                    onChange={e => setEmpSearch(e.target.value)}
                    className="pl-6 pr-2 py-1 text-xs border rounded-lg w-28 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <span className="text-xs text-gray-400">{selected.size} selected</span>
              </div>
              {/* Employee list */}
              <div className="max-h-44 overflow-y-auto divide-y">
                {loadingEmps && (
                  <div className="py-4 text-center text-xs text-gray-400">Loading employees...</div>
                )}
                {!loadingEmps && visible.map(e => (
                  <label key={e.employee_id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.has(e.employee_id)}
                      onChange={() => toggleOne(e.employee_id)}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-800 flex-1">{e.emp_fullname}</span>
                    {e.emp_dept && <span className="text-xs text-gray-400">{e.emp_dept}</span>}
                  </label>
                ))}
                {!loadingEmps && visible.length === 0 && (
                  <div className="py-3 text-center text-xs text-gray-400">No employees found.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pipeline progress */}
        {steps.length > 0 && (
          <div className="px-5 pb-2 flex-1 overflow-y-auto">
            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-semibold text-gray-600 mb-1">Pipeline Progress</p>
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  {s.success
                    ? <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                    : <XCircle size={13} className="text-red-500 flex-shrink-0" />}
                  <span className="text-xs font-mono text-gray-700 capitalize">{s.step}</span>
                  {!s.success && <span className="text-xs text-red-500 ml-auto truncate max-w-[160px]">{s.message}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {result && (
          <div className="px-5 pb-3">
            <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
              result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {result.success ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              <p className="text-xs font-medium">{result.message}</p>
            </div>
          </div>
        )}

        <div className="px-5 py-3 border-t flex justify-end gap-2 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
            {result?.success ? 'Close' : 'Cancel'}
          </button>
          {!result?.success && (
            <button
              onClick={handleRecompute}
              disabled={running || selected.size === 0}
              className="px-4 py-2 text-xs rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1.5"
            >
              {running
                ? <><Loader2 size={12} className="animate-spin" />Computing...</>
                : <><RefreshCw size={12} />Recompute{selected.size < emps.length && emps.length > 0 ? ` (${selected.size})` : ' All'}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 13th Month Modal ───────────────────────────────────────────────────────

function ThirteenthMonthModal({ onClose }: { onClose: () => void }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear]         = useState(currentYear);
  const [entries, setEntries]   = useState<ThirteenthMonthEntry[]>([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [msg, setMsg]           = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const compute = useCallback(async () => {
    setLoading(true); setMsg(null); setEntries([]);
    try {
      const res = await thirteenthMonthApi.compute(year);
      setEntries(res.data);
      setSelected(new Set());
      if (res.data.length === 0) setMsg({ type: 'error', text: 'No basic pay found for this year. Ensure payroll batches exist.' });
    } catch {
      setMsg({ type: 'error', text: 'Failed to compute. Check the server.' });
    } finally { setLoading(false); }
  }, [year]);

  const handleSave = async () => {
    setSaving(true); setMsg(null);
    try {
      const res = await thirteenthMonthApi.save(year, entries);
      setMsg({ type: 'success', text: res.message });
      await compute();
    } catch { setMsg({ type: 'error', text: 'Save failed.' }); }
    finally { setSaving(false); }
  };

  const handleRelease = async () => {
    if (!selected.size) return;
    setReleasing(true); setMsg(null);
    try {
      const res = await thirteenthMonthApi.release(year, [...selected]);
      setMsg({ type: 'success', text: res.message });
      setSelected(new Set());
      await compute();
    } catch { setMsg({ type: 'error', text: 'Release failed.' }); }
    finally { setReleasing(false); }
  };

  const toggleAll = () =>
    setSelected(selected.size === entries.length ? new Set() : new Set(entries.map(e => e.employee_id)));

  const total13th   = entries.reduce((s, e) => s + e.thirteenth_month_pay, 0);
  const unreleasedSaved = entries.filter(e => e.is_saved && !e.is_released);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Gift size={18} className="text-blue-500" />
            <h2 className="text-base font-bold text-gray-800">13th Month Pay</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"><X size={18} /></button>
        </div>

        {/* Controls */}
        <div className="px-6 py-3 border-b bg-gray-50 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Calendar Year</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(parseInt(e.target.value) || currentYear)}
              min={2020} max={currentYear + 1}
              className="border rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <button
            onClick={compute} disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? <><Loader2 size={14} className="animate-spin" />Computing...</> : <><RefreshCw size={14} />Compute</>}
          </button>
          {entries.length > 0 && (
            <span className="text-xs text-gray-500 ml-1">
              {entries.length} employee(s) &bull; Total: <strong className="text-green-700">₱{fmt(total13th)}</strong>
            </span>
          )}
          <div className="ml-auto text-xs text-gray-400 leading-snug max-w-52 text-right">
            Formula: <em>Sum of basic pay in year ÷ 12</em>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {loading && <div className="py-12 text-center"><Spinner /></div>}
          {!loading && entries.length === 0 && (
            <div className="py-16 text-center text-sm text-gray-400">
              Select a year and click <strong>Compute</strong> to calculate 13th month pay.
            </div>
          )}
          {!loading && entries.length > 0 && (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-3 py-2">
                    <input type="checkbox" checked={selected.size === entries.length}
                      onChange={toggleAll} className="rounded" />
                  </th>
                  {['Employee','Department','Total Basic Pay','13th Month Pay','Status'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.employee_id} className="border-b hover:bg-blue-50/30 transition-colors">
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={selected.has(e.employee_id)}
                        onChange={() => {
                          const s = new Set(selected);
                          s.has(e.employee_id) ? s.delete(e.employee_id) : s.add(e.employee_id);
                          setSelected(s);
                        }} className="rounded" />
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-800">{e.emp_fullname}</td>
                    <td className="px-3 py-2 text-gray-500">{e.emp_dept}</td>
                    <td className="px-3 py-2 text-right">₱{fmt(e.total_basic_pay)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-green-700">₱{fmt(e.thirteenth_month_pay)}</td>
                    <td className="px-3 py-2">
                      {e.is_released
                        ? <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">Released</span>
                        : e.is_saved
                          ? <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Saved</span>
                          : <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Computed</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Message */}
        {msg && (
          <div className={`mx-6 mb-2 mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
            msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {msg.type === 'success' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
            {msg.text}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
            Close
          </button>
          {entries.length > 0 && (
            <button
              onClick={handleSave} disabled={saving}
              className="px-4 py-2 text-sm rounded-lg border border-blue-300 text-blue-600 font-semibold hover:bg-blue-50 disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? <><Loader2 size={13} className="animate-spin" />Saving...</> : 'Save All'}
            </button>
          )}
          {unreleasedSaved.length > 0 && selected.size > 0 && (
            <button
              onClick={handleRelease} disabled={releasing}
              className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              {releasing ? <><Loader2 size={13} className="animate-spin" />Releasing...</> : `Release (${selected.size})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Remittance Modal ───────────────────────────────────────────────────────

function RemittanceModal({
  batchId,
  batchLabel,
  scopedEmployeeId,
  onClose,
}: {
  batchId: number;
  batchLabel: string;
  scopedEmployeeId?: number;
  onClose: () => void;
}) {
  const isScoped = scopedEmployeeId !== undefined;
  type ContribType = 'all' | 'sss' | 'philhealth' | 'pagibig';
  const [selectedType, setSelectedType] = useState<ContribType>('all');
  const [rows,         setRows]         = useState<RemittanceRow[]>([]);
  const [search,       setSearch]       = useState('');
  const [loading,      setLoading]      = useState(false);
  const [downloading,  setDownloading]  = useState(false);
  const [error,        setError]        = useState('');

  const filteredRows = search.trim()
    ? rows.filter((r) => {
        const q = search.toLowerCase();
        return (
          r.emp_fullname.toLowerCase().includes(q) ||
          r.emp_dept.toLowerCase().includes(q)
        );
      })
    : rows;

  const loadData = useCallback(async (type: ContribType) => {
    setLoading(true);
    setError('');
    setRows([]);  // clear stale rows before fetching new type
    try {
      const res = await payrollApi.getRemittance(batchId, type === 'all' ? undefined : type, scopedEmployeeId);
      setRows(res.data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load remittance data');
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => { setSearch(''); loadData(selectedType); }, [selectedType]); // eslint-disable-line

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await payrollApi.downloadRemittance(batchId, selectedType);
    } catch (e: any) {
      setError(e.message ?? 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const TYPES: { key: ContribType; label: string }[] = [
    { key: 'all',       label: 'All'       },
    { key: 'sss',       label: 'SSS'       },
    { key: 'philhealth', label: 'PhilHealth' },
    { key: 'pagibig',   label: 'Pag-IBIG'  },
  ];

  const totals = filteredRows.reduce(
    (acc, r) => ({ emp: acc.emp + Number(r.employee_share), er: acc.er + Number(r.employer_share), total: acc.total + Number(r.total) }),
    { emp: 0, er: 0, total: 0 }
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Landmark size={20} className="text-indigo-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-800">Government Remittance</h2>
              <p className="text-xs text-gray-500">{batchLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {/* Type filter tabs */}
        <div className="px-6 py-3 border-b flex items-center gap-3">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setSelectedType(t.key)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  selectedType === t.key ? 'bg-indigo-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {/* Search -- hidden in scoped (employee) view */}
          {!isScoped && (
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee or dept..."
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 w-52"
              />
            </div>
          )}
          <div className="ml-auto">
            <button
              onClick={handleDownload}
              disabled={downloading || loading || rows.length === 0}
              className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {downloading ? 'Downloading...' : 'Download CSV'}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 size={24} className="animate-spin mr-2" />Loading...
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No remittance data for this batch.</div>
          ) : filteredRows.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No results match &ldquo;{search}&rdquo;.</div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Employee</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Department</th>
                  {selectedType === 'all' && <th className="px-4 py-3 text-left hidden md:table-cell">Type</th>}
                  <th className="px-4 py-3 text-left hidden md:table-cell">ID Number</th>
                  <th className="px-4 py-3 text-right">Emp. Share</th>
                  <th className="px-4 py-3 text-right hidden md:table-cell">Er. Share</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRows.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-800">{r.emp_fullname}</td>
                    <td className="px-4 py-2.5 text-gray-500 hidden md:table-cell">{r.emp_dept}</td>
                    {selectedType === 'all' && (
                      <td className="px-4 py-2.5 hidden md:table-cell">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          r.type === 'SSS'       ? 'bg-blue-100 text-blue-700' :
                          r.type === 'PhilHealth' ? 'bg-green-100 text-green-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>{r.type}</span>
                      </td>
                    )}
                    <td className="px-4 py-2.5 text-gray-500 font-mono hidden md:table-cell">{r.id_number || '--'}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">₱{Number(r.employee_share).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700 hidden md:table-cell">₱{Number(r.employer_share).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-800">₱{Number(r.total).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200 font-semibold text-sm">
                <tr>
                  <td className="px-4 py-2.5" colSpan={selectedType === 'all' ? 4 : 3}>
                    {search.trim() ? `Filtered ${filteredRows.length} of ${rows.length} rows` : `Totals (${rows.length} rows)`}
                  </td>
                  <td className="px-4 py-2.5 text-right">₱{totals.emp.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2.5 text-right hidden md:table-cell">₱{totals.er.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2.5 text-right">₱{totals.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Payroll Approval Modal ─────────────────────────────────────────────────

function PayrollApprovalModal({
  batch,
  onClose,
  onApproved,
}: {
  batch: PayrollBatch;
  onClose: () => void;
  onApproved: (approvedAt: string) => void;
}) {
  const [approving, setApproving] = useState(false);
  const [error, setError]         = useState('');

  const handleApprove = async () => {
    setApproving(true);
    setError('');
    try {
      const res = await payrollApi.approvePayroll(batch.batch_id);
      onApproved(res.approved_at ?? new Date().toISOString());
      onClose();
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to submit approval.');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <ThumbsUp size={18} className="text-green-500" /> Approve Payroll
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 leading-relaxed">
            By approving this payroll batch, you affix your electronic signature
            and acknowledge that you have reviewed and confirm as correct the
            payroll data for the period{' '}
            <strong>{fmtDate(batch.payroll_start)} - {fmtDate(batch.payroll_end)}</strong>.
            This action serves as your official acknowledgment and consent that
            the figures reflected in this payroll run are accurate to the best
            of your knowledge.
          </div>
          <p className="text-xs text-gray-500">
            Your registered e-signature will be affixed to the payslip upon approval.
            This acknowledgment is timestamped and cannot be undone.
          </p>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
              <AlertTriangle size={13} className="flex-shrink-0" />{error}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={approving}
            className="flex items-center gap-2 px-5 py-2 text-sm rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {approving ? <><Loader2 size={14} className="animate-spin" />Approving...</> : <><ThumbsUp size={14} />I Approve</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Correctable fields per table ───────────────────────────────────────────

const CORRECTABLE: Record<string, { field: string; label: string }[]> = {
  attendance_summary: [
    { field: 'reg_hrs',           label: 'Regular Hours' },
    { field: 'ot_hrs',            label: 'Overtime Hours' },
    { field: 'nd_hrs',            label: 'Night Diff Hours' },
    { field: 'ot_nd_hrs',         label: 'OT Night Diff Hours' },
    { field: 'late_mins',         label: 'Late (Minutes)' },
    { field: 'leave_days',        label: 'Leave Days' },
    { field: 'reg_holiday_days',  label: 'Regular Holiday Days' },
    { field: 'reg_holiday_hrs',   label: 'Regular Holiday Hours' },
    { field: 'spec_holiday_hrs',  label: 'Special Holiday Hours' },
    { field: 'rd_hrs',            label: 'Rest Day Hours' },
  ],
  earnings: [
    { field: 'reg_pay',           label: 'Regular Pay' },
    { field: 'ot_pay',            label: 'Overtime Pay' },
    { field: 'nd_pay',            label: 'Night Diff Pay' },
    { field: 'reg_holiday_pay',   label: 'Regular Holiday Pay' },
    { field: 'spec_holiday_pay',  label: 'Special Holiday Pay' },
    { field: 'rd_pay',            label: 'Rest Day Pay' },
    { field: 'leave_pay',         label: 'Leave Pay' },
    { field: 'total_pay',         label: 'Total Earnings' },
  ],
  deductions: [
    { field: 'employee_sss',         label: 'SSS (Employee Share)' },
    { field: 'employee_philhealth',   label: 'PhilHealth (Employee Share)' },
    { field: 'employee_pagibig',      label: 'Pag-IBIG (Employee Share)' },
    { field: 'late_deduct',           label: 'Late Deduction' },
    { field: 'other_deduct',          label: 'Other Deduction' },
    { field: 'total_deduct',          label: 'Total Deductions' },
  ],
  tax: [
    { field: 'taxable_income',   label: 'Taxable Income' },
    { field: 'tax_deduct',       label: 'Withholding Tax' },
    { field: 'total',            label: 'Net After Tax' },
  ],
  summary: [
    { field: 'days_worked',       label: 'Days Worked' },
    { field: 'gross_pay',         label: 'Gross Pay' },
    { field: 'total_deductions',  label: 'Total Deductions' },
    { field: 'tax_deduct',        label: 'Tax' },
    { field: 'net_pay',           label: 'Net Pay' },
  ],
};

const TABLE_LABELS: Record<string, string> = {
  attendance_summary: 'Attendance Summary',
  earnings:           'Earnings',
  deductions:         'Deductions',
  tax:                'Tax',
  summary:            'Payroll Summary',
};

// ─── Correction Request Modal (Employee/Supervisor) ─────────────────────────

function CorrectionRequestModal({
  batch,
  employeeId,
  onClose,
  onDone,
}: {
  batch: PayrollBatch;
  employeeId: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const tableTypes = ['attendance_summary', 'earnings', 'deductions', 'tax', 'summary'] as PayrollTableType[];
  const [tableData, setTableData]       = useState<Record<string, Row>>({});
  const [loadingData, setLoadingData]   = useState(true);
  // key: "table::field" → whether checked
  const [checked, setChecked]           = useState<Record<string, boolean>>({});
  // key: "table::field" → suggested value string
  const [suggested, setSuggested]       = useState<Record<string, string>>({});
  const [reason, setReason]             = useState('');
  const [files, setFiles]               = useState<File[]>([]);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState('');
  const [done, setDone]                 = useState(false);

  useEffect(() => {
    setLoadingData(true);
    Promise.all(
      tableTypes.map(type =>
        payrollApi.getTable({ type, batch_id: batch.batch_id, employee_id: employeeId, page: 1, limit: 1 })
          .then(res => ({ type, row: res.data[0] ?? null }))
          .catch(() => ({ type, row: null } as { type: PayrollTableType; row: Row | null }))
      )
    ).then(results => {
      const data: Record<string, Row> = {};
      results.forEach(({ type, row }) => { if (row) data[type] = row; });
      setTableData(data);
    }).finally(() => setLoadingData(false));
  }, [batch.batch_id, employeeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const key = (table: string, field: string) => `${table}::${field}`;

  const selectedCount = Object.values(checked).filter(Boolean).length;

  const handleSubmit = async () => {
    if (selectedCount === 0) { setError('Please select at least one field for correction.'); return; }
    if (!reason.trim())      { setError('Reason is required.'); return; }
    setError('');
    setSubmitting(true);

    // Build fields array
    const fields: CorrectionField[] = [];
    for (const [tableType, fields_] of Object.entries(CORRECTABLE)) {
      for (const { field, label } of fields_) {
        const k = key(tableType, field);
        if (!checked[k]) continue;
        const row = tableData[tableType] ?? {};
        const adjKey = `adj_${field}`;
        const hasAdj = row[adjKey] !== null && row[adjKey] !== undefined && row[adjKey] !== '';
        const currentVal = String(hasAdj ? row[adjKey] : (row[field] ?? ''));
        fields.push({
          table:           tableType,
          field,
          label,
          current_value:   currentVal,
          suggested_value: suggested[k]?.trim() ?? '',
        });
      }
    }

    try {
      const fd = new FormData();
      fd.append('batch_id',    String(batch.batch_id));
      fd.append('fields_json', JSON.stringify(fields));
      fd.append('reason',      reason.trim());
      files.forEach(f => fd.append('attachments[]', f));

      await payrollApi.submitCorrection(fd);
      setDone(true);
      onDone();
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Submit failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center space-y-4">
          <CheckCircle2 size={40} className="text-green-500 mx-auto" />
          <p className="font-semibold text-gray-800">Correction request submitted!</p>
          <p className="text-xs text-gray-500">HR/Admin will review your request and follow up accordingly.</p>
          <button onClick={onClose} className="mt-2 px-5 py-2 text-sm rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <FileText size={18} className="text-blue-500" /> Request Payroll Correction
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Batch #{batch.batch_id} -- {fmtDate(batch.payroll_start)} - {fmtDate(batch.payroll_end)}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {loadingData ? (
            <div className="py-12 text-center"><Spinner /></div>
          ) : (
            <>
              <p className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                Check the fields you believe need correction. Providing a suggested value is optional but helps HR process the request faster.
              </p>

              {tableTypes.map(tableType => {
                const row    = tableData[tableType];
                const fields_ = CORRECTABLE[tableType] ?? [];
                if (!row) return null;
                return (
                  <div key={tableType}>
                    <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide border-b pb-1 mb-2">
                      {TABLE_LABELS[tableType]}
                    </h4>
                    <div className="space-y-1.5">
                      {fields_.map(({ field, label }) => {
                        const k      = key(tableType, field);
                        const adjKey = `adj_${field}`;
                        const hasAdj = row[adjKey] !== null && row[adjKey] !== undefined && row[adjKey] !== '';
                        const currentVal = hasAdj ? row[adjKey] : (row[field] ?? '--');
                        const isChecked  = checked[k] ?? false;
                        return (
                          <div key={k} className={`rounded-lg border p-2.5 transition-colors ${isChecked ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id={k}
                                checked={isChecked}
                                onChange={e => setChecked(prev => ({ ...prev, [k]: e.target.checked }))}
                                className="rounded text-blue-500 flex-shrink-0"
                              />
                              <label htmlFor={k} className="flex-1 flex items-center justify-between gap-4 cursor-pointer text-xs">
                                <span className="font-medium text-gray-700">{label}</span>
                                <span className={`tabular-nums font-mono ${hasAdj ? 'text-blue-600' : 'text-gray-500'}`}>
                                  {hasAdj && <span className="text-blue-400 mr-0.5 text-[10px]" title="Adjusted value">●</span>}
                                  {typeof currentVal === 'number' ? fmt(currentVal) : String(currentVal)}
                                </span>
                              </label>
                            </div>
                            {isChecked && (
                              <div className="mt-2 ml-6">
                                <input
                                  type="text"
                                  placeholder="Suggested value (optional)"
                                  value={suggested[k] ?? ''}
                                  onChange={e => setSuggested(prev => ({ ...prev, [k]: e.target.value }))}
                                  className="w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Reason for Correction Request <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={e => { setReason(e.target.value); if (e.target.value.trim()) setError(''); }}
                  placeholder="Describe why you believe a correction is needed..."
                  rows={3}
                  className={`w-full border rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 ${error && !reason.trim() ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-400'}`}
                />
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Attachments <span className="text-gray-400">(optional)</span></label>
                <label className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                  <input type="file" multiple className="hidden" onChange={e => setFiles(Array.from(e.target.files ?? []))} />
                  <span className="text-xs text-gray-500">
                    {files.length > 0 ? files.map(f => f.name).join(', ') : 'Click to attach supporting documents (PDF, image, etc.)'}
                  </span>
                </label>
                {files.length > 0 && (
                  <button onClick={() => setFiles([])} className="mt-1 text-xs text-red-500 hover:underline">Remove attachments</button>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                  <AlertTriangle size={13} className="flex-shrink-0" />{error}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-between items-center px-6 py-4 border-t flex-shrink-0">
          <span className="text-xs text-gray-400">{selectedCount} field{selectedCount !== 1 ? 's' : ''} selected</span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={submitting || loadingData}
              className="flex items-center gap-2 px-5 py-2 text-sm rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50"
            >
              {submitting ? <><Loader2 size={14} className="animate-spin" />Submitting...</> : <><Send size={14} />Submit Request</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Corrections Modal ─────────────────────────────────────────────────

const correctionStatusColors: Record<string, string> = {
  Pending:   'bg-yellow-100 text-yellow-700',
  Reviewing: 'bg-blue-100 text-blue-700',
  Reviewed:  'bg-indigo-100 text-indigo-700',
  Corrected: 'bg-green-100 text-green-700',
  Rejected:  'bg-red-100 text-red-700',
};

/** Maps a CorrectionField's base field name → adj_ column for updateRow.
 *  Returns null for fields that cannot be directly written (computed totals, summary table). */
const toAdjField = (table: string, field: string): string | null => {
  if (!['earnings', 'deductions', 'tax', 'attendance_summary'].includes(table)) return null;
  if (field === 'total_deduct') return null;   // computed total, not directly editable
  if (field === 'other_deduct') return 'other_deduct'; // no adj_ prefix for this one
  return `adj_${field}`;
};

function AdminCorrectionsModal({ batchId, onClose }: { batchId: number; onClose: () => void }) {
  const [corrections, setCorrections]   = useState<PayrollCorrection[]>([]);
  const [loading, setLoading]           = useState(true);
  const [view, setView]                 = useState<'active' | 'history'>('active');
  const [expandedId, setExpandedId]     = useState<number | null>(null);
  const [busyId, setBusyId]             = useState<number | null>(null);
  const [actionError, setActionError]   = useState('');

  // Per-correction: admin notes text
  const [adminNotes, setAdminNotes]     = useState<Record<number, string>>({});
  // Per-correction: admin attachment files (filenames appended to admin_notes on save)
  const [adminFiles, setAdminFiles]     = useState<Record<number, File[]>>({});
  // Per-correction: admin's accepted/modified final value per field; key = 'table::field'
  const [finalValues, setFinalValues]   = useState<Record<number, Record<string, string>>>({});

  // Reject confirmation state
  const [rejectModal, setRejectModal]   = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectFiles, setRejectFiles]   = useState<File[]>([]);
  const [rejectError, setRejectError]   = useState('');
  const [rejectBusy, setRejectBusy]     = useState(false);

  // Approve confirmation state
  const [approveModal, setApproveModal] = useState<PayrollCorrection | null>(null);
  const [approveBusy, setApproveBusy]   = useState(false);
  const [approveError, setApproveError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    payrollApi.getCorrections(batchId)
      .then(res => {
        setCorrections(res.data);
        // Pre-fill final values from employee suggestions (don't overwrite already-edited values)
        setFinalValues(prev => {
          const next = { ...prev };
          res.data.forEach(c => {
            if (next[c.id]) return;
            next[c.id] = {};
            c.fields.forEach(f => {
              next[c.id][`${f.table}::${f.field}`] = f.suggested_value ?? '';
            });
          });
          return next;
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [batchId]);

  useEffect(() => { load(); }, [load]);

  const active  = corrections.filter(c => c.status === 'Pending' || c.status === 'Reviewing');
  const history = corrections.filter(c => c.status !== 'Pending' && c.status !== 'Reviewing');
  const displayed = view === 'active' ? active : history;

  // Build admin_notes string including optional attachment filenames
  const buildNotes = (id: number, base?: string) => {
    const text = base ?? adminNotes[id] ?? '';
    const files = adminFiles[id] ?? [];
    const fileNote = files.length > 0 ? ` | Files: ${files.map(f => f.name).join(', ')}` : '';
    return (text + fileNote) || undefined;
  };

  const doSetReviewing = async (id: number) => {
    setBusyId(id);
    setActionError('');
    try {
      await payrollApi.updateCorrectionStatus(id, 'Reviewing', buildNotes(id));
      load();
    } catch (e: any) {
      setActionError(e.message ?? 'Failed to update status');
    } finally {
      setBusyId(null);
    }
  };

  const doReject = async () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) { setRejectError('Reason is required.'); return; }
    setRejectBusy(true);
    setRejectError('');
    try {
      const fileNote = rejectFiles.length ? ` | Files: ${rejectFiles.map(f => f.name).join(', ')}` : '';
      await payrollApi.updateCorrectionStatus(rejectModal, 'Rejected', rejectReason.trim() + fileNote);
      setRejectModal(null); setRejectReason(''); setRejectFiles([]);
      load();
    } catch (e: any) {
      setRejectError(e.message ?? 'Failed to reject');
    } finally {
      setRejectBusy(false);
    }
  };

  const doApprove = async () => {
    const c = approveModal;
    if (!c) return;
    setApproveBusy(true);
    setApproveError('');
    try {
      // Group editable changes by table
      const byTable: Record<string, { field: string; value: number }[]> = {};
      for (const f of c.fields) {
        const rawVal = (finalValues[c.id]?.[`${f.table}::${f.field}`] ?? '').trim();
        if (!rawVal) continue;
        const numVal = parseFloat(rawVal);
        if (isNaN(numVal)) continue;
        const adjField = toAdjField(f.table, f.field);
        if (!adjField) continue;
        if (!byTable[f.table]) byTable[f.table] = [];
        byTable[f.table].push({ field: adjField, value: numVal });
      }
      // Apply each table group to live payroll
      for (const [table, changes] of Object.entries(byTable)) {
        const res = await payrollApi.getTable({
          type: table as PayrollTableType,
          batch_id: c.batch_id,
          employee_id: c.employee_id,
          limit: 1,
        });
        const targetRow = res.data[0];
        if (!targetRow?.id) throw new Error(`Could not find ${TABLE_LABELS[table] ?? table} row`);
        await payrollApi.updateRow({
          table,
          id: targetRow.id as number,
          changes,
          notes: `Correction #${c.id}${adminNotes[c.id] ? ` -- ${adminNotes[c.id]}` : ''}`,
        });
      }
      // Mark the correction itself as Corrected
      await payrollApi.updateCorrectionStatus(c.id, 'Corrected', buildNotes(c.id));
      setApproveModal(null);
      load();
    } catch (e: any) {
      setApproveError(e.message ?? 'Failed to apply correction');
    } finally {
      setApproveBusy(false);
    }
  };

  // Summarise what approve will actually do (used in confirm dialog)
  const approveChangeSummary = (c: PayrollCorrection) =>
    c.fields.map(f => {
      const rawVal  = (finalValues[c.id]?.[`${f.table}::${f.field}`] ?? '').trim();
      const adjField = rawVal ? toAdjField(f.table, f.field) : null;
      return {
        label:      f.label,
        current:    f.current_value,
        finalValue: rawVal,
        willApply:  !!adjField && !isNaN(parseFloat(rawVal)),
        isComputed: !!rawVal && !adjField,
      };
    });

  return (
    <>
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-6 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header with tab switcher */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <ClipboardList size={18} className="text-blue-500" />
              Correction Requests -- Batch #{batchId}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{active.length} active . {history.length} resolved</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('active')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                view === 'active' ? 'bg-blue-500 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}>
              Active ({active.length})
            </button>
            <button
              onClick={() => setView('history')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                view === 'history' ? 'bg-gray-700 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}>
              History ({history.length})
            </button>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 ml-1"><X size={18} /></button>
          </div>
        </div>

        {/* Error banner */}
        {actionError && (
          <div className="flex items-center justify-between gap-2 bg-red-50 border-b border-red-200 px-5 py-2.5 text-xs text-red-700 flex-shrink-0">
            <div className="flex items-center gap-2"><AlertTriangle size={13} className="flex-shrink-0" />{actionError}</div>
            <button onClick={() => setActionError('')} className="text-red-400 hover:text-red-600"><X size={12} /></button>
          </div>
        )}

        {/* Correction list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center"><Spinner /></div>
          ) : displayed.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">
              {view === 'active' ? 'No active correction requests.' : 'No resolved corrections.'}
            </div>
          ) : (
            <div className="divide-y">
              {displayed.map(c => {
                const isExpanded = expandedId === c.id;
                const isBusy     = busyId === c.id;
                const isReadOnly = view === 'history';
                return (
                  <div key={c.id} className="px-5 py-4">
                    {/* Collapsed summary row */}
                    <div
                      className="flex items-start justify-between gap-3 cursor-pointer select-none"
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${correctionStatusColors[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {c.status}
                          </span>
                          <span className="text-sm font-semibold text-gray-800">{c.emp_fullname}</span>
                          <span className="text-xs text-gray-400">#{c.employee_id}</span>
                          <span className="text-xs text-gray-400 ml-auto">{fmtDateTime(c.created_at)}</span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{c.reason}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{c.fields.length} field(s) flagged</p>
                      </div>
                      <div className="flex-shrink-0 mt-1">
                        {isExpanded ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="mt-4 space-y-4">

                        {/* Flagged fields table -- Final Value column only in active view */}
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-2">Flagged Fields</p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs border rounded-lg overflow-hidden">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left font-semibold text-gray-500">Section</th>
                                  <th className="px-3 py-2 text-left font-semibold text-gray-500">Field</th>
                                  <th className="px-3 py-2 text-right font-semibold text-gray-500">Current</th>
                                  <th className="px-3 py-2 text-right font-semibold text-gray-500">Suggested</th>
                                  {!isReadOnly && (
                                    <th className="px-3 py-2 text-right font-semibold text-blue-600">Final Value</th>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {c.fields.map((f, i) => {
                                  const fieldKey = `${f.table}::${f.field}`;
                                  const finalVal = finalValues[c.id]?.[fieldKey] ?? '';
                                  const hasChange = finalVal.trim() !== '' && finalVal.trim() !== f.current_value;
                                  return (
                                    <tr key={i} className={!isReadOnly && hasChange ? 'bg-green-50/60' : 'hover:bg-gray-50'}>
                                      <td className="px-3 py-2 text-gray-500">{TABLE_LABELS[f.table] ?? f.table}</td>
                                      <td className="px-3 py-2 text-gray-700 font-medium">{f.label}</td>
                                      <td className="px-3 py-2 text-right tabular-nums text-gray-600">{f.current_value || '--'}</td>
                                      <td className="px-3 py-2 text-right tabular-nums text-blue-600 font-medium">
                                        {f.suggested_value || <span className="text-gray-400 italic">none</span>}
                                      </td>
                                      {!isReadOnly && (
                                        <td className="px-3 py-2 text-right">
                                          <input
                                            type="text"
                                            value={finalVal}
                                            placeholder={f.suggested_value || f.current_value || '--'}
                                            onClick={e => e.stopPropagation()}
                                            onChange={e => {
                                              const v = e.target.value;
                                              setFinalValues(prev => ({
                                                ...prev,
                                                [c.id]: { ...(prev[c.id] ?? {}), [fieldKey]: v },
                                              }));
                                            }}
                                            className={`w-24 text-right border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 ${
                                              hasChange
                                                ? 'border-green-400 bg-green-50 focus:ring-green-400'
                                                : 'border-gray-300 focus:ring-blue-400'
                                            }`}
                                          />
                                        </td>
                                      )}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Employee's reason */}
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-1">Employee's Reason</p>
                          <p className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{c.reason}</p>
                        </div>

                        {/* Employee attachments */}
                        {c.attachment_list.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-1">Employee Attachments</p>
                            <div className="flex flex-wrap gap-2">
                              {c.attachment_list.map((a, i) => (
                                <a key={i}
                                  href={`${(import.meta.env.VITE_BACKEND_URL as string) ?? ''}/${a}`}
                                  target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                                  <FileText size={12} />{a.split('/').pop()}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Admin notes + optional attachment */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Admin Notes</label>
                          {isReadOnly ? (
                            c.admin_notes
                              ? <p className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{c.admin_notes}</p>
                              : <p className="text-xs text-gray-400 italic">No admin notes.</p>
                          ) : (
                            <>
                              <textarea
                                value={adminNotes[c.id] ?? (c.admin_notes ?? '')}
                                onChange={e => setAdminNotes(prev => ({ ...prev, [c.id]: e.target.value }))}
                                onClick={e => e.stopPropagation()}
                                placeholder="Notes for this correction (optional)..."
                                rows={2}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                              />
                              <label className="mt-1.5 flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                                <input
                                  type="file" multiple className="hidden"
                                  onChange={e => setAdminFiles(prev => ({ ...prev, [c.id]: Array.from(e.target.files ?? []) }))}
                                />
                                <span className="text-xs text-gray-500">
                                  {(adminFiles[c.id]?.length ?? 0) > 0
                                    ? adminFiles[c.id].map(f => f.name).join(', ')
                                    : 'Attach supporting documents (optional)'}
                                </span>
                              </label>
                              {(adminFiles[c.id]?.length ?? 0) > 0 && (
                                <button
                                  onClick={e => { e.stopPropagation(); setAdminFiles(prev => ({ ...prev, [c.id]: [] })); }}
                                  className="mt-1 text-xs text-red-500 hover:underline">
                                  Remove attachments
                                </button>
                              )}
                            </>
                          )}
                        </div>

                        {/* Action buttons -- active view only */}
                        {!isReadOnly && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {c.status === 'Pending' && (
                              <button
                                onClick={e => { e.stopPropagation(); doSetReviewing(c.id); }}
                                disabled={isBusy}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-40">
                                {isBusy ? <Loader2 size={11} className="animate-spin" /> : null}
                                Mark Reviewing
                              </button>
                            )}
                            <button
                              onClick={e => { e.stopPropagation(); setApproveModal(c); setApproveError(''); }}
                              disabled={isBusy}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-40">
                              <CheckCircle2 size={12} />Approve
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); setRejectModal(c.id); setRejectReason(''); setRejectFiles([]); setRejectError(''); }}
                              disabled={isBusy}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-40">
                              <XCircle size={12} />Reject
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end px-6 py-4 border-t flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>

    {/* ── Reject confirmation ── */}
    {rejectModal !== null && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={() => { if (!rejectBusy) setRejectModal(null); }} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6">
          <h3 className="font-bold text-red-700 mb-4 flex items-center gap-2">
            <XCircle size={16} />Reject Correction Request
          </h3>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={rejectReason}
            onChange={e => { setRejectReason(e.target.value); if (rejectError) setRejectError(''); }}
            placeholder="Explain why this correction request is being rejected..."
            rows={3}
            className={`w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 mb-2 ${
              rejectError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-400'
            }`}
          />
          <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-300 hover:bg-red-50/50 transition-colors mb-3">
            <input type="file" multiple className="hidden"
              onChange={e => setRejectFiles(Array.from(e.target.files ?? []))} />
            <span className="text-xs text-gray-500">
              {rejectFiles.length > 0 ? rejectFiles.map(f => f.name).join(', ') : 'Attach supporting documents (optional)'}
            </span>
          </label>
          {rejectFiles.length > 0 && (
            <button onClick={() => setRejectFiles([])} className="text-xs text-red-500 hover:underline mb-3 block">
              Remove attachments
            </button>
          )}
          {rejectError && <p className="text-xs text-red-600 mb-3">{rejectError}</p>}
          <div className="flex gap-3">
            <button onClick={() => { if (!rejectBusy) setRejectModal(null); }} disabled={rejectBusy}
              className="flex-1 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-medium disabled:opacity-50">
              Cancel
            </button>
            <button onClick={doReject} disabled={rejectBusy}
              className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              {rejectBusy ? <Loader2 size={14} className="animate-spin" /> : null}
              Confirm Reject
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Approve confirmation ── */}
    {approveModal && (() => {
      const summary  = approveChangeSummary(approveModal);
      const toApply  = summary.filter(s => s.willApply);
      const computed = summary.filter(s => s.isComputed);
      return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { if (!approveBusy) setApproveModal(null); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6 max-h-[85vh] overflow-y-auto">
            <h3 className="font-bold text-green-700 mb-4 flex items-center gap-2">
              <CheckCircle2 size={16} />Apply Correction to Live Payroll
            </h3>
            {toApply.length > 0 ? (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-600 mb-2">The following values will be updated:</p>
                <table className="w-full text-xs border rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-500">Field</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-500">Current</th>
                      <th className="px-3 py-2 text-right font-semibold text-green-700">New Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {toApply.map((s, i) => (
                      <tr key={i} className="bg-green-50/40">
                        <td className="px-3 py-2 text-gray-700 font-medium">{s.label}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-500">{s.current || '--'}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold text-green-700">{s.finalValue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-700">
                No editable values entered. The correction will be marked as Corrected without changing any payroll data.
              </div>
            )}
            {computed.length > 0 && (
              <p className="text-xs text-gray-400 mb-4">
                Note: <em>{computed.map(s => s.label).join(', ')}</em> are computed and cannot be directly edited.
              </p>
            )}
            {approveError && <p className="text-xs text-red-600 mb-3">{approveError}</p>}
            <div className="flex gap-3">
              <button onClick={() => { if (!approveBusy) setApproveModal(null); }} disabled={approveBusy}
                className="flex-1 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-medium disabled:opacity-50">
                Cancel
              </button>
              <button onClick={doApprove} disabled={approveBusy}
                className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                {approveBusy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Apply &amp; Approve
              </button>
            </div>
          </div>
        </div>
      );
    })()}
    </>
  );
}



// ─── Tabs ───────────────────────────────────────────────────────────────────

const TABS: { key: PayrollTableType | 'audit'; label: string }[] = [
  { key: 'summary',           label: 'Summary' },
  { key: 'earnings',          label: 'Earnings' },
  { key: 'deductions',        label: 'Deductions' },
  { key: 'tax',               label: 'Tax' },
  { key: 'attendance_summary',label: 'Attendance' },
  { key: 'audit',             label: '🕑 Audit Trail' },
];

export default function PayrollPage({ userRole = 'admin', userId, baseRole = 'admin', isReadOnly = false }: { userRole?: UserRole; userId?: number; baseRole?: UserRole; isReadOnly?: boolean }) {
  const isAdmin = userRole === 'admin';
  const canWrite = isAdmin && !isReadOnly;
  const isEmployee = userRole === 'employee';
  const isSupervisor = userRole === 'supervisor';
  // Scope by current VIEW (userRole), not base role -- employee/supervisor view shows only own data
  const scopedEmployeeId = (isEmployee || isSupervisor) && userId ? userId : undefined;
  const { profile: companyProfile } = useCompany();
  const [batches, setBatches]               = useState<PayrollBatch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [selectedBatch, setSelectedBatch]   = useState<PayrollBatch | null>(null);
  const [activeTab, setActiveTab]           = useState<PayrollTableType | 'audit'>('summary');
  const [showGenerate, setShowGenerate]     = useState(false);
  const [showRecompute, setShowRecompute]   = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [show13thMonth, setShow13thMonth]   = useState(false);
  const [showRemittance,  setShowRemittance]  = useState(false);
  const [showGovReports,  setShowGovReports]   = useState(false);
  const [payslip, setPayslip]               = useState<{ batchId: number; employeeId: number } | null>(null);
  const [tableKey, setTableKey]             = useState(0);
  const [showCompanyAlert, setShowCompanyAlert] = useState(false);

  // Batch filter
  const [statusFilter, setStatusFilter]   = useState<string>('all');
  const [batchSearch,  setBatchSearch]    = useState('');

  // Status change confirmation modal
  const [statusConfirm, setStatusConfirm] = useState<{
    row: Row; status: PayrollStatus; reviewDuration: string;
  } | null>(null);
  const [statusConfirmError, setStatusConfirmError] = useState('');
  const [statusConfirmLoading, setStatusConfirmLoading] = useState(false);

  // (Correction confirm modal lives inside AdminCorrectionsModal)

  const handleOpenGenerate = () => {
    const p = companyProfile;
    const missing = !p?.company_name || !p?.address || !p?.contact || !p?.email || !p?.logo_path;
    if (missing) {
      setShowCompanyAlert(true);
      return;
    }
    setShowGenerate(true);
  };

  // Employee/Supervisor: approval state per batch
  const [showApprovalModal, setShowApprovalModal]     = useState(false);
  const [approvalStatus, setApprovalStatus]           = useState<{ approved: boolean; approved_at: string | null } | null>(null);

  // Correction requests
  const [showCorrectionModal,  setShowCorrectionModal]  = useState(false);
  const [showAdminCorrections, setShowAdminCorrections] = useState(false);
  const [correctionCount,      setCorrectionCount]      = useState(0);

  const loadBatches = useCallback(async () => {
    setLoadingBatches(true);
    try {
      const res = await payrollApi.getBatches();
      const VISIBLE_STATUSES = ['Approved', 'Released', 'Under Review'];
      // Sort latest first
      const sorted = [...res.data].sort((a, b) => b.batch_id - a.batch_id);
      const visible = isAdmin ? sorted : sorted.filter(b => VISIBLE_STATUSES.includes(b.status));
      setBatches(visible);
      if (visible.length > 0 && !selectedBatch) {
        setSelectedBatch(visible[0]);
      }
    } catch {
      // Keep existing batches on error -- don't wipe the list when server is temporarily unreachable
    } finally {
      setLoadingBatches(false);
    }
  }, [selectedBatch]);

  useEffect(() => { loadBatches(); }, []); // eslint-disable-line

  // Fetch approval status when batch changes (employee/supervisor mode)
  useEffect(() => {
    if (!selectedBatch || !scopedEmployeeId) { setApprovalStatus(null); return; }
    payrollApi.getApprovalStatus(selectedBatch.batch_id)
      .then(setApprovalStatus)
      .catch(() => setApprovalStatus(null));
  }, [selectedBatch?.batch_id, scopedEmployeeId]); // eslint-disable-line

  // Fetch correction count when batch changes (admin mode)
  useEffect(() => {
    if (!selectedBatch || !isAdmin) { setCorrectionCount(0); return; }
    payrollApi.getCorrections(selectedBatch.batch_id, 'Pending')
      .then(res => setCorrectionCount(res.total))
      .catch(() => setCorrectionCount(0));
  }, [selectedBatch?.batch_id, isAdmin]); // eslint-disable-line

  const handleStatusChange = (row: Row, status: PayrollStatus) => {
    // All status changes go through modal confirmation
    setStatusConfirmError('');
    setStatusConfirm({ row, status, reviewDuration: '' });
  };

  const confirmStatusChange = async () => {
    if (!statusConfirm) return;
    const { row, status, reviewDuration } = statusConfirm;
    setStatusConfirmLoading(true);
    setStatusConfirmError('');
    try {
      await payrollApi.updateStatus(row.result_id as number, status, reviewDuration || undefined);
      const newStatus = status;
      setBatches(prev => {
        const updated = prev.map(b => b.result_id === (row.result_id as number) ? { ...b, status: newStatus } : b);
        // If Dropped, keep in list (filter will handle visibility)
        return updated;
      });
      if (selectedBatch?.result_id === (row.result_id as number)) {
        setSelectedBatch(sb => sb ? { ...sb, status: newStatus } : sb);
      }
      setStatusConfirm(null);
    } catch (e: any) {
      setStatusConfirmError(e.message ?? 'Failed to update status.');
    } finally {
      setStatusConfirmLoading(false);
    }
  };

  const handlePayslip = (row: Row) => {
    if (!selectedBatch) return;
    setPayslip({ batchId: selectedBatch.batch_id, employeeId: row.employee_id as number });
  };

  const exportBatchSummary = async () => {
    if (!selectedBatch) return;
    try {
      const res = await payrollApi.getTable({ type: 'summary', batch_id: selectedBatch.batch_id, limit: 1000 });
      const rows = res.data;
      const cols = [
        { key: 'emp_fullname',    label: 'Employee' },
        { key: 'emp_dept',        label: 'Department' },
        { key: 'reg_hrs',         label: 'Reg Hrs' },
        { key: 'ot_hrs',          label: 'OT Hrs' },
        { key: 'nd_hrs',          label: 'ND Hrs' },
        { key: 'late_mins',       label: 'Late (min)' },
        { key: 'leave_days',      label: 'Leave Days' },
        { key: 'reg_holiday_days', label: 'Hol Days' },
      ];
      const win = window.open('', '_blank');
      if (!win) return;
      win.document.write(`
        <html><head><title>Payroll Summary -- Batch #${selectedBatch.batch_id}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11px; padding: 20px; }
          h2 { font-size: 14px; margin-bottom: 4px; }
          p  { font-size: 11px; color: #555; margin: 0 0 12px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f3f4f6; text-align: left; padding: 5px 8px; border: 1px solid #ddd; font-size: 10px; }
          td { padding: 4px 8px; border: 1px solid #eee; }
          tr:nth-child(even) td { background: #fafafa; }
        </style></head><body>
        <h2>Payroll Summary -- Batch #${selectedBatch.batch_id}</h2>
        <p>${fmtDate(selectedBatch.payroll_start)} - ${fmtDate(selectedBatch.payroll_end)} &bull; ${selectedBatch.num_employees} employees &bull; Status: ${selectedBatch.status}</p>
        <table>
          <thead><tr>${cols.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
          <tbody>
            ${rows.map(r => `<tr>${cols.map(c => `<td>${r[c.key] ?? '--'}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
        </body></html>
      `);
      win.document.close();
      win.focus();
      win.print();
    } catch {/* ignore */}
  };

  const isLocked = selectedBatch ? ['Approved', 'Released', 'Dropped'].includes(selectedBatch.status) : false;

  const filteredBatches = batches.filter(b => {
    if (batchSearch.trim()) return String(b.batch_id).includes(batchSearch.trim());
    if (statusFilter === 'Dropped') return b.status === 'Dropped';
    if (b.status === 'Dropped') return false;
    if (statusFilter !== 'all') return b.status === statusFilter;
    return true;
  });

  return (
    <div className="min-h-[80vh] flex flex-col gap-4">
      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Payroll Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Compute, review, and release employee payroll</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadBatches}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowCalculator(v => !v)}
            className={`p-2 rounded-xl border hover:bg-gray-50 ${showCalculator ? 'border-blue-400 text-blue-500 bg-blue-50' : 'border-gray-200 text-gray-500'}`}
            title="Calculator"
          >
            <Calculator size={16} />
          </button>
          {canWrite && (
          <button
            onClick={() => setShow13thMonth(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-300 text-green-700 text-sm font-semibold hover:bg-green-50"
            title="13th Month Pay"
          >
            <Gift size={15} />13th Month
          </button>
          )}
          {(isAdmin || isEmployee) && selectedBatch && (
          <button
            onClick={() => setShowRemittance(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-300 text-indigo-700 text-sm font-semibold hover:bg-indigo-50"
            title="Government Remittance Reports"
          >
            <Landmark size={15} />Remittance
          </button>
          )}
          {/* Gov. Reports button hidden -- logic intact, re-enable when ready */}
          {canWrite && (
          <button
            onClick={handleOpenGenerate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold hover:opacity-90"
          >
            <Plus size={16} />New Payroll
          </button>
          )}
        </div>
      </div>

      {/* Batch filter row */}
      {!loadingBatches && batches.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {(isAdmin
            ? ['all', 'Draft', 'Under Review', 'Approved', 'Released', 'Dropped']
            : ['all', 'Under Review', 'Approved', 'Released']
          ).map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setBatchSearch(''); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === s && !batchSearch
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
          <input
            type="text"
            value={batchSearch}
            onChange={e => setBatchSearch(e.target.value)}
            placeholder="Batch #..."
            className="ml-auto w-28 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      )}

      {/* Batch cards row -- horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {loadingBatches && <div className="py-4 px-6"><TableSkeleton rows={3} cols={5} /></div>}
        {!loadingBatches && batches.length === 0 && (
          <div className="px-4 py-3 text-xs text-gray-400 bg-white rounded-2xl border shadow-sm">
            No batches yet. Generate your first payroll.
          </div>
        )}
        {!loadingBatches && batches.length > 0 && filteredBatches.length === 0 && (
          <div className="px-4 py-3 text-xs text-gray-400 bg-white rounded-2xl border shadow-sm">
            No batches match the current filter.
          </div>
        )}
        {filteredBatches.map(batch => (
          <button
            key={batch.batch_id}
            onClick={() => { setSelectedBatch(batch); setActiveTab('summary'); setTableKey(k => k + 1); }}
            className={`flex-shrink-0 text-left px-4 py-3 rounded-2xl border shadow-sm transition-all ${
              selectedBatch?.batch_id === batch.batch_id
                ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 ring-2 ring-blue-300'
                : 'bg-white hover:bg-gray-50 border-gray-200'
            }`}
            style={{ minWidth: 190 }}
          >
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="text-xs font-bold text-gray-700">Batch #{batch.batch_id}</span>
              <StatusBadge status={batch.status} />
            </div>
            <p className="text-xs text-gray-500 whitespace-nowrap">
              {fmtDate(batch.payroll_start)} -- {fmtDate(batch.payroll_end)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{batch.num_employees} employee(s)</p>
          </button>
        ))}
      </div>

      {/* Full-width Batch Detail */}
      {!selectedBatch ? (
        <div className="bg-white rounded-2xl shadow-sm border p-12 text-center text-sm text-gray-400">
          Select a batch above, or generate a new payroll.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border flex flex-col">
          {/* Batch Header */}
          <div className="px-5 py-4 border-b flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-gray-800">Batch #{selectedBatch.batch_id}</h2>
                <StatusBadge status={selectedBatch.status} />
                {isLocked && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Locked</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {fmtDate(selectedBatch.payroll_start)} - {fmtDate(selectedBatch.payroll_end)} &bull; {selectedBatch.num_employees} employees
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {isAdmin && (
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-gray-500">Status:</label>
                {isLocked || isReadOnly ? (
                  <span className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg ${statusColors[selectedBatch.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {selectedBatch.status}{isLocked ? ' (locked)' : ''}
                  </span>
                ) : (
                <select
                  value={selectedBatch.status}
                  onChange={e => handleStatusChange(
                    { result_id: selectedBatch.result_id } as Row,
                    e.target.value as PayrollStatus
                  )}
                  className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                  {(['Draft','Under Review','Approved','Released','Dropped'] as PayrollStatus[]).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                )}
              </div>
              )}
              {/* Recompute -- admin canWrite only */}
              {canWrite && !isLocked && (
                <button
                  onClick={() => setShowRecompute(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <RefreshCw size={12} />Recompute
                </button>
              )}
              {/* Admin: Corrections button with pending count badge */}
              {canWrite && (
                <button
                  onClick={() => setShowAdminCorrections(true)}
                  className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <ClipboardList size={12} />Corrections
                  {correctionCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {correctionCount > 9 ? '9+' : correctionCount}
                    </span>
                  )}
                </button>
              )}
              {/* Employee/Supervisor: Approve button */}
              {scopedEmployeeId && (
                approvalStatus?.approved ? (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 border border-green-300 text-green-700">
                    <CheckCircle2 size={12} />Approved {approvalStatus.approved_at ? fmtDate(approvalStatus.approved_at) : ''}
                  </span>
                ) : (
                  <button
                    onClick={() => setShowApprovalModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700"
                  >
                    <ThumbsUp size={12} />Approve
                  </button>
                )
              )}
              {/* Employee/Supervisor: Request Correction button */}
              {scopedEmployeeId && (
                <button
                  onClick={() => setShowCorrectionModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <FileText size={12} />Request Correction
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b px-5 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setTableKey(k => k + 1); }}
                className={`px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Table / Audit content */}
          <div className="flex-1 overflow-x-auto">
            {activeTab === 'audit' ? (
              <AuditTable batchId={selectedBatch.batch_id} refreshKey={tableKey} />
            ) : (
              <DataTable
                key={`${selectedBatch.batch_id}-${activeTab}-${tableKey}`}
                type={activeTab as PayrollTableType}
                batchId={selectedBatch.batch_id}
                isLocked={!isAdmin || isLocked}
                isReadOnly={isReadOnly}
                scopedEmployeeId={scopedEmployeeId}
                onRefresh={() => setTableKey(k => k + 1)}
                onPayslip={activeTab === 'summary' ? handlePayslip : undefined}
                onStatusChange={canWrite && activeTab === 'results' ? handleStatusChange : undefined}
              />
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showCalculator && <FloatingCalculator onClose={() => setShowCalculator(false)} />}
      {show13thMonth && <ThirteenthMonthModal onClose={() => setShow13thMonth(false)} />}
      {showRemittance && selectedBatch && (
        <RemittanceModal
          batchId={selectedBatch.batch_id}
          batchLabel={`Batch #${selectedBatch.batch_id} (${fmtDate(selectedBatch.payroll_start)} - ${fmtDate(selectedBatch.payroll_end)})`}
          scopedEmployeeId={scopedEmployeeId}
          onClose={() => setShowRemittance(false)}
        />
      )}
      {showGovReports && (
        <GovernmentReportsModal
          batches={batches}
          onClose={() => setShowGovReports(false)}
        />
      )}

      {/* Company profile incomplete alert */}
      {showCompanyAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCompanyAlert(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-100 p-2.5 rounded-full">
                <AlertTriangle size={20} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Company Profile Incomplete</h3>
                <p className="text-xs text-gray-500 mt-0.5">Required before generating payroll</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Please complete the company profile before generating payroll. The following are required:
            </p>
            <ul className="text-sm space-y-1 mb-5">
              {[
                { label: 'Company Name',    ok: !!companyProfile?.company_name },
                { label: 'Address',         ok: !!companyProfile?.address },
                { label: 'Contact Number',  ok: !!companyProfile?.contact },
                { label: 'Email',           ok: !!companyProfile?.email },
                { label: 'Company Logo',    ok: !!companyProfile?.logo_path },
              ].map(({ label, ok }) => (
                <li key={label} className={`flex items-center gap-2 ${ok ? 'text-green-700' : 'text-red-600'}`}>
                  {ok
                    ? <CheckCircle2 size={14} className="flex-shrink-0" />
                    : <XCircle size={14} className="flex-shrink-0" />}
                  {label}
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCompanyAlert(false)}
                className="flex-1 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showGenerate && (
        <GenerateModal
          onClose={() => setShowGenerate(false)}
          onDone={() => { loadBatches(); setTableKey(k => k + 1); }}
        />
      )}
      {showRecompute && selectedBatch && (
        <RecomputeModal
          batchId={selectedBatch.batch_id}
          onClose={() => setShowRecompute(false)}
          onDone={() => { setShowRecompute(false); setTableKey(k => k + 1); }}
        />
      )}
      {payslip && (
        <PayslipModal
          batchId={payslip.batchId}
          employeeId={payslip.employeeId}
          onClose={() => setPayslip(null)}
        />
      )}
      {showApprovalModal && selectedBatch && (
        <PayrollApprovalModal
          batch={selectedBatch}
          onClose={() => setShowApprovalModal(false)}
          onApproved={approvedAt => setApprovalStatus({ approved: true, approved_at: approvedAt })}
        />
      )}
      {showCorrectionModal && selectedBatch && scopedEmployeeId && (
        <CorrectionRequestModal
          batch={selectedBatch}
          employeeId={scopedEmployeeId}
          onClose={() => setShowCorrectionModal(false)}
          onDone={() => setShowCorrectionModal(false)}
        />
      )}
      {showAdminCorrections && selectedBatch && (
        <AdminCorrectionsModal
          batchId={selectedBatch.batch_id}
          onClose={() => {
            setShowAdminCorrections(false);
            // Refresh count after admin updates statuses
            payrollApi.getCorrections(selectedBatch.batch_id, 'Pending')
              .then(res => setCorrectionCount(res.total))
              .catch(() => {});
          }}
        />
      )}

      {/* Status change confirmation modal */}
      {statusConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { if (!statusConfirmLoading) setStatusConfirm(null); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-full ${
                statusConfirm.status === 'Dropped' ? 'bg-red-100' :
                statusConfirm.status === 'Under Review' ? 'bg-yellow-100' :
                (statusConfirm.status === 'Approved' || statusConfirm.status === 'Released') ? 'bg-green-100' :
                'bg-blue-100'
              }`}>
                <AlertTriangle size={20} className={
                  statusConfirm.status === 'Dropped' ? 'text-red-600' :
                  statusConfirm.status === 'Under Review' ? 'text-yellow-600' :
                  (statusConfirm.status === 'Approved' || statusConfirm.status === 'Released') ? 'text-green-600' :
                  'text-blue-600'
                } />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Change status to "{statusConfirm.status}"?</h3>
                <p className="text-xs text-gray-500 mt-0.5">Batch #{selectedBatch?.batch_id}</p>
              </div>
            </div>

            {statusConfirm.status === 'Under Review' ? (
              <div className="space-y-3 mb-5">
                <p className="text-sm text-gray-600">All active employees will be notified to check their payroll and report any discrepancies before approval.</p>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Review Duration <span className="text-gray-400 font-normal">(e.g. "3 days", "1 week")</span>
                  </label>
                  <input
                    type="text"
                    value={statusConfirm.reviewDuration}
                    onChange={e => setStatusConfirm(prev => prev ? { ...prev, reviewDuration: e.target.value } : prev)}
                    placeholder="e.g. 3 days"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <p className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-2.5">
                  Once approved, no further corrections will be accepted.
                </p>
              </div>
            ) : statusConfirm.status === 'Dropped' ? (
              <p className="text-sm text-gray-600 mb-5">This batch will be dropped. Dropped batches are hidden from the default view. This action cannot be undone.</p>
            ) : (statusConfirm.status === 'Approved' || statusConfirm.status === 'Released') ? (
              <p className="text-sm text-gray-600 mb-5">This action cannot be undone. Once {statusConfirm.status.toLowerCase()}, no further corrections will be accepted.</p>
            ) : (
              <p className="text-sm text-gray-600 mb-5">Change the batch status to "{statusConfirm.status}"?</p>
            )}

            {statusConfirmError && (
              <p className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">{statusConfirmError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStatusConfirm(null)}
                disabled={statusConfirmLoading}
                className="flex-1 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={statusConfirmLoading}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2 ${
                  statusConfirm.status === 'Dropped' ? 'bg-red-500 hover:bg-red-600' :
                  (statusConfirm.status === 'Approved' || statusConfirm.status === 'Released') ? 'bg-green-500 hover:bg-green-600' :
                  statusConfirm.status === 'Under Review' ? 'bg-yellow-500 hover:bg-yellow-600' :
                  'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {statusConfirmLoading && <Loader2 size={14} className="animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
