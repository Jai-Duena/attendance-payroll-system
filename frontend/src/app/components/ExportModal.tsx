import React, { useState, useEffect } from 'react';
import { X, Download, Loader2, Users, User, AlertCircle } from 'lucide-react';
import { attendanceApi, attendanceOptions, employeesApi, type Employee, type PayrollPeriodOption } from '@/lib/api';

type ExportTab = 'attendance' | 'summary' | 'punches';

interface Props {
  initialTab: ExportTab;
  onClose: () => void;
}

export default function ExportModal({ initialTab, onClose }: Props) {
  const [tab, setTab] = useState<ExportTab>(initialTab);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  // Employee filter
  const [empScope, setEmpScope] = useState<'all' | 'specific'>('all');
  const [empSearch, setEmpSearch] = useState('');
  const [empList, setEmpList] = useState<Employee[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [selectedEmps, setSelectedEmps] = useState<Employee[]>([]);

  // Attendance tab
  const [attDateFrom, setAttDateFrom] = useState('');
  const [attDateTo, setAttDateTo] = useState('');

  // Summary tab
  const [payrollPeriodOptions, setPayrollPeriodOptions] = useState<PayrollPeriodOption[]>([]);
  const [batchIdOptions, setBatchIdOptions] = useState<number[]>([]);
  const [sumScope, setSumScope] = useState<'payroll' | 'batch'>('payroll');
  const [sumPayrollPeriod, setSumPayrollPeriod] = useState('');
  const [sumBatchId, setSumBatchId] = useState('');

  // Punches tab
  const [punchDateFrom, setPunchDateFrom] = useState('');
  const [punchDateTo, setPunchDateTo] = useState('');

  // Load payroll period & batch options once
  useEffect(() => {
    attendanceOptions.payrollPeriods().then(setPayrollPeriodOptions).catch(() => {});
    attendanceOptions.batchIds().then(setBatchIdOptions).catch(() => {});
  }, []);

  // Search employees when scope = specific
  useEffect(() => {
    if (empScope !== 'specific') return;
    setEmpLoading(true);
    const timeout = setTimeout(() => {
      employeesApi.list({ limit: 200, name: empSearch || undefined })
        .then((r) => setEmpList(r.data))
        .catch(() => {})
        .finally(() => setEmpLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [empScope, empSearch]);

  const toggleEmp = (emp: Employee) => {
    setSelectedEmps((prev) =>
      prev.some((e) => e.employee_id === emp.employee_id)
        ? prev.filter((e) => e.employee_id !== emp.employee_id)
        : [...prev, emp],
    );
  };

  const buildParams = (): Parameters<typeof attendanceApi.exportCsv>[0] | null => {
    const empIds = empScope === 'specific' && selectedEmps.length > 0
      ? selectedEmps.map((e) => e.employee_id).join(',')
      : undefined;

    if (tab === 'attendance') {
      if (!attDateFrom || !attDateTo) {
        setError('Please select both Date From and Date To.');
        return null;
      }
      return { type: 'attendance', date_from: attDateFrom, date_to: attDateTo, ...(empIds ? { employee_ids: empIds } : {}) };
    }

    if (tab === 'summary') {
      if (sumScope === 'payroll') {
        if (!sumPayrollPeriod) { setError('Please select a payroll period.'); return null; }
        const [df, dt] = sumPayrollPeriod.split('|');
        return { type: 'summary', date_from: df, date_to: dt, ...(empIds ? { employee_ids: empIds } : {}) };
      }
      if (sumScope === 'batch') {
        if (!sumBatchId) { setError('Please select a batch.'); return null; }
        // batch_id is matched to a payroll period by index in batchIdOptions
        const idx = batchIdOptions.indexOf(Number(sumBatchId));
        const period = payrollPeriodOptions[idx];
        if (!period) { setError('Could not resolve date range from batch.'); return null; }
        return { type: 'summary', date_from: period.payroll_start, date_to: period.payroll_end, ...(empIds ? { employee_ids: empIds } : {}) };
      }
      // fallthrough -- should not happen
      return null;
    }

    if (tab === 'punches') {
      if (!punchDateFrom || !punchDateTo) { setError('Please select both Date From and Date To.'); return null; }
      return { type: 'punches', date_from: punchDateFrom, date_to: punchDateTo, ...(empIds ? { employee_ids: empIds } : {}) };
    }

    return null;
  };

  const handleExport = async () => {
    setError('');
    if (empScope === 'specific' && selectedEmps.length === 0) {
      setError('Please select at least one employee, or switch to "All Employees".');
      return;
    }
    const params = buildParams();
    if (!params) return;
    setExporting(true);
    try {
      await attendanceApi.exportCsv(params);
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const tabLabels: Record<ExportTab, string> = {
    attendance: 'Attendance',
    summary: 'Payroll Summary',
    punches: 'Raw Punches',
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <Download size={18} className="text-green-600" />
            <h2 className="text-lg font-semibold text-gray-800">Export CSV</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Tab selector */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Export Type</label>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(['attendance', 'summary', 'punches'] as ExportTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(''); }}
                  className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${
                    tab === t ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tabLabels[t]}
                </button>
              ))}
            </div>
          </div>

          {/* ── Date range -- Attendance ── */}
          {tab === 'attendance' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Date Range</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">From</label>
                  <input type="date" value={attDateFrom} onChange={(e) => setAttDateFrom(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">To</label>
                  <input type="date" value={attDateTo} onChange={(e) => setAttDateTo(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
              </div>
            </div>
          )}

          {/* ── Summary options ── */}
          {tab === 'summary' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Filter By</label>
              <div className="flex gap-2">
                {(['payroll', 'batch'] as const).map((s) => (
                  <button key={s} onClick={() => setSumScope(s)}
                    className={`flex-1 text-xs py-1.5 rounded-lg border font-medium transition-colors ${
                      sumScope === s ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>
                    {s === 'payroll' ? 'Payroll Period' : 'Batch ID'}
                  </button>
                ))}
              </div>

              {sumScope === 'payroll' && (
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Payroll Period</label>
                  <select value={sumPayrollPeriod} onChange={(e) => setSumPayrollPeriod(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                    <option value="">-- Select period --</option>
                    {payrollPeriodOptions.map((p, i) => (
                      <option key={i} value={`${p.payroll_start}|${p.payroll_end}`}>
                        {p.payroll_start} → {p.payroll_end}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {sumScope === 'batch' && (
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Batch ID</label>
                  <select value={sumBatchId} onChange={(e) => setSumBatchId(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                    <option value="">-- Select batch --</option>
                    {batchIdOptions.map((b) => (
                      <option key={b} value={String(b)}>Batch #{b}</option>
                    ))}
                  </select>
                </div>
              )}

            </div>
          )}

          {/* ── Date range -- Punches ── */}
          {tab === 'punches' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Date Range</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">From</label>
                  <input type="date" value={punchDateFrom} onChange={(e) => setPunchDateFrom(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">To</label>
                  <input type="date" value={punchDateTo} onChange={(e) => setPunchDateTo(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
              </div>
            </div>
          )}

          {/* ── Employee scope ── */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Employees</label>
            <div className="flex gap-2">
              <button
                onClick={() => { setEmpScope('all'); setSelectedEmps([]); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  empScope === 'all' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <Users size={14} /> All Employees
              </button>
              <button
                onClick={() => setEmpScope('specific')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  empScope === 'specific' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <User size={14} /> Specific Employees
              </button>
            </div>

            {empScope === 'specific' && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Search employee name..."
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                />

                {/* Selected chips */}
                {selectedEmps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEmps.map((emp) => (
                      <span key={emp.employee_id}
                        className="flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {emp.emp_fullname}
                        <button onClick={() => toggleEmp(emp)} className="hover:text-blue-500 ml-0.5">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="border rounded-lg overflow-y-auto max-h-40">
                  {empLoading ? (
                    <div className="flex items-center justify-center py-6 text-gray-400 text-sm">
                      <Loader2 size={14} className="animate-spin mr-1.5" /> Loading...
                    </div>
                  ) : empList.length === 0 ? (
                    <div className="text-center py-6 text-sm text-gray-400">No employees found.</div>
                  ) : (
                    empList.map((emp) => {
                      const checked = selectedEmps.some((e) => e.employee_id === emp.employee_id);
                      return (
                        <label key={emp.employee_id}
                          className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm ${checked ? 'bg-blue-50' : ''}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleEmp(emp)}
                            className="rounded" />
                          <span className="flex-1 font-medium text-gray-800">{emp.emp_fullname}</span>
                          <span className="text-xs text-gray-400">{emp.emp_dept}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm">
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex-shrink-0 flex justify-end gap-2">
          <button onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors">
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}
