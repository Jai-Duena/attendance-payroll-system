import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Settings,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Building2,
  Upload,
  ImageOff,
  ChevronDown,
  ChevronUp,
  Download,
  Paintbrush,
  Moon,
  Sun,
  Type,
  CalendarDays,
} from 'lucide-react';
import {
  settingsApi,
  companyApi,
  holidaysApi,
  type PayrollSettingTable,
  type CompanyProfile,
  type HolidayEntry,
} from '@/lib/api';
import { useCompany } from '../context/CompanyContext';
import { useTheme, type AppTheme, type FontSize } from '../context/ThemeContext';
import { UserRole } from '../App';

interface SettingsPageProps {
  userRole: UserRole;
  scrollToSection?: string;
  onSectionScrolled?: () => void;
  isReadOnly?: boolean;
}

// ─── Table Metadata ───────────────────────────────────────────────────────────

type FieldType = 'text' | 'number' | 'date' | 'decimal3' | 'percent4';

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  pk?: boolean;          // is this the primary key?
  pkEditable?: boolean;  // pk editable only on create
  placeholder?: string;
}

interface TableConfig {
  key: PayrollSettingTable;
  label: string;
  description: string;
  pk: string;
  pkType: 'string' | 'int';
  fields: FieldDef[];
}

const TABLE_CONFIGS: TableConfig[] = [
  {
    key: 'rate_multipliers',
    label: 'Rate Multipliers',
    description: 'Pay rate multipliers applied to different work conditions.',
    pk: 'code',
    pkType: 'string',
    fields: [
      { key: 'code',        label: 'Code',        type: 'text',     required: true, pk: true, pkEditable: true },
      { key: 'multiplier',  label: 'Multiplier',  type: 'decimal3', required: true },
      { key: 'description', label: 'Description', type: 'text',     placeholder: 'e.g. Overtime: Hourly Rate × 1.25' },
    ],
  },
  {
    key: 'pagibig',
    label: 'Pag-IBIG',
    description: 'Pag-IBIG (HDMF) contribution brackets.',
    pk: 'id',
    pkType: 'int',
    fields: [
      { key: 'salary_from',     label: 'Salary From (₱)',      type: 'number', required: true },
      { key: 'salary_to',       label: 'Salary To (₱)',        type: 'number', required: true },
      { key: 'employee_share',  label: 'Employee Share',        type: 'number', required: true, placeholder: 'Amount or rate' },
      { key: 'employer_share',  label: 'Employer Share',        type: 'number', required: true, placeholder: 'Amount or rate' },
      { key: 'effective_date',  label: 'Effective Date',        type: 'date',   required: true },
    ],
  },
  {
    key: 'philhealth',
    label: 'PhilHealth',
    description: 'PhilHealth (PHIC) contribution brackets.',
    pk: 'id',
    pkType: 'int',
    fields: [
      { key: 'salary_from',     label: 'Salary From (₱)',      type: 'number', required: true },
      { key: 'salary_to',       label: 'Salary To (₱)',        type: 'number', required: true },
      { key: 'employee_share',  label: 'Employee Share (₱)',   type: 'number', required: true },
      { key: 'employer_share',  label: 'Employer Share (₱)',   type: 'number', required: true },
      { key: 'effective_date',  label: 'Effective Date',        type: 'date',   required: true },
    ],
  },
  {
    key: 'sss',
    label: 'SSS',
    description: 'SSS contribution brackets.',
    pk: 'id',
    pkType: 'int',
    fields: [
      { key: 'salary_from',     label: 'Salary From (₱)',      type: 'number', required: true },
      { key: 'salary_to',       label: 'Salary To (₱)',        type: 'number', required: true },
      { key: 'employee_share',  label: 'Employee Share (₱)',   type: 'number', required: true },
      { key: 'employer_share',  label: 'Employer Share (₱)',   type: 'number', required: true },
      { key: 'effective_date',  label: 'Effective Date',        type: 'date',   required: true },
    ],
  },
  {
    key: 'withholding_tax',
    label: 'Withholding Tax',
    description: 'BIR monthly withholding tax brackets.',
    pk: 'id',
    pkType: 'int',
    fields: [
      { key: 'salary_from',  label: 'Salary From (₱)',  type: 'number',   required: true },
      { key: 'salary_to',    label: 'Salary To (₱)',    type: 'number',   required: true },
      { key: 'base_tax',     label: 'Base Tax (₱)',     type: 'number',   required: true },
      { key: 'excess_rate',  label: 'Excess Rate',      type: 'percent4', required: true, placeholder: '0.2000 = 20%' },
      { key: 'effective_date', label: 'Effective Date', type: 'date',     required: true },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtNum(val: number | null | undefined, decimals = 2): string {
  if (val === null || val === undefined) return '--';
  return Number(val).toLocaleString('en-PH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtDate(val: string | null | undefined): string {
  if (!val) return '--';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}

function blankForm(fields: FieldDef[]): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f.key, '']));
}

function rowToForm(row: Record<string, unknown>, fields: FieldDef[]): Record<string, string> {
  return Object.fromEntries(
    fields.map((f) => {
      const v = row[f.key];
      if (v === null || v === undefined) return [f.key, ''];
      return [f.key, String(v)];
    })
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50 ${right ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  );
}

function Td({ children, right, mono }: { children: React.ReactNode; right?: boolean; mono?: boolean }) {
  return (
    <td className={`px-4 py-3 text-sm text-gray-700 whitespace-nowrap ${right ? 'text-right' : ''} ${mono ? 'font-mono' : ''}`}>
      {children}
    </td>
  );
}

// ─── Row display: renders a cell value based on its field definition ──────────
function CellValue({ field, value }: { field: FieldDef; value: unknown }) {
  if (value === null || value === undefined || value === '') return <span className="text-gray-400">--</span>;
  const v = value as string | number;

  if (field.type === 'date') return <>{fmtDate(String(v))}</>;
  if (field.type === 'number' || field.type === 'decimal3') {
    const d = field.type === 'decimal3' ? 3 : 2;
    return <span className="font-mono">{fmtNum(Number(v), d)}</span>;
  }
  if (field.type === 'percent4') {
    return <span className="font-mono">{(Number(v) * 100).toFixed(2)}%</span>;
  }
  if (field.pk) {
    return <span className="font-semibold text-blue-700 font-mono text-xs">{String(v)}</span>;
  }
  return <>{String(v)}</>;
}

// ─── Form field input ─────────────────────────────────────────────────────────
function FormField({
  field,
  value,
  onChange,
  isCreate,
}: {
  field: FieldDef;
  value: string;
  onChange: (key: string, val: string) => void;
  isCreate: boolean;
}) {
  const disabled = !!field.pk && (!field.pkEditable || !isCreate);
  const inputCls =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-50 disabled:text-gray-400';

  if (field.type === 'date') {
    return (
      <input
        type="date"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(field.key, e.target.value)}
        className={inputCls}
        required={field.required}
      />
    );
  }
  if (field.type === 'number' || field.type === 'decimal3' || field.type === 'percent4') {
    return (
      <input
        type="number"
        step={field.type === 'decimal3' ? '0.001' : field.type === 'percent4' ? '0.0001' : '0.01'}
        min="0"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder={field.placeholder ?? '0.00'}
        className={inputCls}
        required={field.required}
      />
    );
  }
  // text
  return (
    <input
      type="text"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(field.key, e.target.value)}
      placeholder={field.placeholder ?? ''}
      className={inputCls}
      required={field.required}
    />
  );
}

// ─── Add / Edit Modal ──────────────────────────────────────────────────────────
interface ModalProps {
  config: TableConfig;
  mode: 'add' | 'edit';
  initialData: Record<string, string>;
  editPk: string | number | null;
  onClose: () => void;
  onSaved: () => void;
}

function RecordModal({ config, mode, initialData, editPk, onClose, onSaved }: ModalProps) {
  const [form, setForm]     = useState<Record<string, string>>(initialData);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  const handleChange = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr('');

    // Convert numeric strings to numbers for submission
    const payload: Record<string, unknown> = {};
    for (const f of config.fields) {
      const raw = form[f.key];
      if (raw === '' && !f.required) {
        payload[f.key] = null;
      } else if (f.type === 'number' || f.type === 'decimal3' || f.type === 'percent4') {
        payload[f.key] = raw === '' ? null : Number(raw);
      } else {
        payload[f.key] = raw;
      }
    }

    try {
      if (mode === 'add') {
        await settingsApi.create(config.key, payload);
      } else {
        const pkVal = editPk ?? (config.pkType === 'int' ? Number(form[config.pk]) : form[config.pk]);
        // Include pk in body so backend can identify the row
        const updatePayload = { ...payload, [config.pk]: pkVal };
        await settingsApi.update(config.key, pkVal ?? 0, updatePayload);
      }
      onSaved();
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => { if (!saving) onClose(); }} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
          <div>
            <h3 className="font-bold text-lg text-gray-800">
              {mode === 'add' ? 'Add Row' : 'Edit Row'} -- {config.label}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{config.description}</p>
          </div>
          {!saving && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          <form id="record-form" onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {config.fields.map((f) => (
                <div key={f.key} className={f.type === 'text' && !f.pk ? 'col-span-2' : ''}>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    {f.label}
                    {f.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  <FormField
                    field={f}
                    value={form[f.key] ?? ''}
                    onChange={handleChange}
                    isCreate={mode === 'add'}
                  />
                </div>
              ))}
            </div>

            {err && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                <AlertCircle size={15} /> {err}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-gray-200 flex-shrink-0">
          <button
            type="submit"
            form="record-form"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving...' : mode === 'add' ? 'Add Row' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 border border-gray-300 hover:bg-gray-50 disabled:opacity-40 text-gray-600 rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({
  config,
  row,
  onClose,
  onDeleted,
}: {
  config: TableConfig;
  row: Record<string, unknown>;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setErr('');
    try {
      const pkVal = config.pkType === 'int'
        ? Number(row[config.pk])
        : String(row[config.pk]);
      await settingsApi.delete(config.key, { [config.pk]: pkVal });
      onDeleted();
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : 'Delete failed');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => { if (!deleting) onClose(); }} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-100 p-2.5 rounded-full flex-shrink-0">
            <Trash2 size={20} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Delete Row</h3>
            <p className="text-xs text-gray-500">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-1">
          Delete this row from <strong>{config.label}</strong>?
        </p>
        <p className="text-xs text-gray-400 font-mono bg-gray-50 rounded px-2 py-1 mb-4 break-all">
          {config.pk}: {String(row[config.pk])}
        </p>
        {err && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-3">
            <AlertCircle size={14} /> {err}
          </div>
        )}
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
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2.5 border border-gray-300 hover:bg-gray-50 disabled:opacity-40 text-gray-600 rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Single Table Panel ────────────────────────────────────────────────────────
function PayrollTable({
  config,
  canWrite,
}: {
  config: TableConfig;
  canWrite: boolean;
}) {
  const [rows, setRows]         = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [toast, setToast]       = useState<{ ok: boolean; msg: string } | null>(null);

  const [modalMode, setModalMode]   = useState<'add' | 'edit' | null>(null);
  const [modalData, setModalData]   = useState<Record<string, string>>({});
  const [modalEditPk, setModalEditPk] = useState<string | number | null>(null);
  const [deleteRow, setDeleteRow]   = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await settingsApi.list(config.key);
      setRows(res.data as unknown as Record<string, unknown>[]);
    } catch (ex: unknown) {
      setError(ex instanceof Error ? ex.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [config.key]);

  useEffect(() => { load(); }, [load]);

  const showToast = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const openAdd = () => {
    setModalData(blankForm(config.fields));
    setModalMode('add');
  };

  const openEdit = (row: Record<string, unknown>) => {
    setModalData(rowToForm(row, config.fields));
    const pkRaw = row[config.pk];
    setModalEditPk(config.pkType === 'int' ? Number(pkRaw) : String(pkRaw ?? ''));
    setModalMode('edit');
  };

  const handleSaved = () => {
    setModalMode(null);
    showToast(true, modalMode === 'add' ? 'Row added.' : 'Row updated.');
    load();
  };

  const handleDeleted = () => {
    setDeleteRow(null);
    showToast(true, 'Row deleted.');
    load();
  };

  // Determine which fields to show as header columns
  const headerFields = config.fields;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{config.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          {canWrite && (
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              <Plus size={15} /> Add Row
            </button>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
          toast.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin" /> Loading...
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p className="font-medium">No rows found</p>
            {canWrite && <p className="text-sm mt-1">Click "Add Row" to get started.</p>}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                {headerFields.map((f) => (
                  <Th key={f.key} right={f.type !== 'text' && f.type !== 'date' && !f.pk}>
                    {f.label}
                  </Th>
                ))}
                {canWrite && <Th>Actions</Th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {rows.map((row, idx) => (
                <tr key={String(row[config.pk] ?? idx)} className="hover:bg-blue-50/40 transition-colors">
                  {headerFields.map((f) => (
                    <Td
                      key={f.key}
                      right={f.type !== 'text' && f.type !== 'date' && !f.pk}
                      mono={f.type === 'number' || f.type === 'decimal3' || f.type === 'percent4'}
                    >
                      <CellValue field={f} value={row[f.key]} />
                    </Td>
                  ))}
                  {canWrite && (
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEdit(row)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteRow(row)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </Td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Row count */}
      {!loading && rows.length > 0 && (
        <p className="text-xs text-gray-400 text-right">{rows.length} row{rows.length !== 1 ? 's' : ''}</p>
      )}

      {/* Modals */}
      {modalMode && (
        <RecordModal
          config={config}
          mode={modalMode}
          initialData={modalData}
          editPk={modalEditPk}
          onClose={() => setModalMode(null)}
          onSaved={handleSaved}
        />
      )}
      {deleteRow && (
        <DeleteModal
          config={config}
          row={deleteRow}
          onClose={() => setDeleteRow(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}

// ─── Payroll Settings Panel ────────────────────────────────────────────────────
function PayrollSettingsPanel({ canWrite, initialTab, onMounted }: { canWrite: boolean; initialTab?: string; onMounted?: () => void }) {
  const [activeTable, setActiveTable] = useState<PayrollSettingTable>((initialTab as PayrollSettingTable) || 'rate_multipliers');
  const config = TABLE_CONFIGS.find((t) => t.key === activeTable)!;
  const [isOpen, setIsOpen] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTable(initialTab as PayrollSettingTable);
      setIsOpen(true);
      // Scroll into view after a short delay so the panel is rendered
      const timer = setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        onMounted?.();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialTab, onMounted]);

  return (
    <div ref={panelRef} className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Panel header */}
      <div
        className="px-6 py-5 border-b border-gray-200 flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsOpen((v) => !v)}
      >
        <div>
          <h2 className="text-lg font-bold text-gray-800">Payroll Settings</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure contribution tables and rate multipliers used during payroll computation.
          </p>
        </div>
        {isOpen ? <ChevronUp size={18} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />}
      </div>

      {isOpen && (<>
      {/* Tab bar */}
      <div className="px-6 pt-4 border-b border-gray-100">
        <div className="flex gap-1 overflow-x-auto pb-0 -mb-px">
          {TABLE_CONFIGS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTable(t.key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTable === t.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table content */}
      <div className="p-6">
        <PayrollTable config={config} canWrite={canWrite} />
      </div>
      </>)}
    </div>
  );
}

// ─── Logo Crop Modal ─────────────────────────────────────────────────────────

type CropAspect = '1:1' | '3:1' | '2:1';
const CROP_ASPECTS: { label: string; value: CropAspect; wRatio: number; hRatio: number }[] = [
  { label: 'Square',   value: '1:1', wRatio: 1, hRatio: 1 },
  { label: 'Wide 3:1', value: '3:1', wRatio: 3, hRatio: 1 },
  { label: 'Wide 2:1', value: '2:1', wRatio: 2, hRatio: 1 },
];
const CROP_DISPLAY_W = 320;

function LogoCropModal({ file, onConfirm, onCancel }: {
  file: File;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [aspect, setAspect] = useState<CropAspect>('1:1');
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ active: false, startX: 0, startY: 0, ox: 0, oy: 0 });

  const opt = CROP_ASPECTS.find(a => a.value === aspect)!;
  const displayH = Math.round(CROP_DISPLAY_W * opt.hRatio / opt.wRatio);

  const fitReset = useCallback((image: HTMLImageElement, dh: number) => {
    const s = Math.min(CROP_DISPLAY_W / image.width, dh / image.height) * 0.9;
    setScale(s);
    setOffset({ x: (CROP_DISPLAY_W - image.width * s) / 2, y: (dh - image.height * s) / 2 });
  }, []);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => { setImg(image); fitReset(image, CROP_DISPLAY_W); };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file, fitReset]);

  // Re-center when aspect changes
  useEffect(() => { if (img) fitReset(img, displayH); }, [aspect]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redraw canvas -- draw only the image, no background (checkerboard is CSS on the container)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    canvas.width = CROP_DISPLAY_W;
    canvas.height = displayH;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, CROP_DISPLAY_W, displayH);
    ctx.drawImage(img, offset.x, offset.y, img.width * scale, img.height * scale);
  }, [img, scale, offset, displayH]);

  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    const d = dragRef.current;
    if (!d.active) return;
    setOffset({ x: d.ox + e.clientX - d.startX, y: d.oy + e.clientY - d.startY });
  };
  const onMouseUp = () => { dragRef.current.active = false; };
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    dragRef.current = { active: true, startX: t.clientX, startY: t.clientY, ox: offset.x, oy: offset.y };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const d = dragRef.current;
    if (!d.active) return;
    const t = e.touches[0];
    setOffset({ x: d.ox + t.clientX - d.startX, y: d.oy + t.clientY - d.startY });
  };

  function handleConfirm() {
    if (!img) return;
    // Create a clean export canvas -- no checkerboard, just the image on transparent background
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CROP_DISPLAY_W;
    exportCanvas.height = displayH;
    const ctx = exportCanvas.getContext('2d')!;
    ctx.drawImage(img, offset.x, offset.y, img.width * scale, img.height * scale);

    // Scan for tight bounding box of non-transparent pixels to remove empty padding
    const px = ctx.getImageData(0, 0, CROP_DISPLAY_W, displayH).data;
    let minX = CROP_DISPLAY_W, maxX = -1, minY = displayH, maxY = -1;
    for (let y = 0; y < displayH; y++) {
      for (let x = 0; x < CROP_DISPLAY_W; x++) {
        if (px[(y * CROP_DISPLAY_W + x) * 4 + 3] > 5) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < 0) {
      // Nothing visible -- export whole frame as fallback
      exportCanvas.toBlob(b => { if (b) onConfirm(b); }, 'image/png');
      return;
    }

    // Crop to tight content bounding box
    const cw = maxX - minX + 1;
    const ch = maxY - minY + 1;
    const cropped = document.createElement('canvas');
    cropped.width = cw;
    cropped.height = ch;
    cropped.getContext('2d')!.drawImage(exportCanvas, minX, minY, cw, ch, 0, 0, cw, ch);
    cropped.toBlob(b => { if (b) onConfirm(b); }, 'image/png');
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-sm font-bold text-gray-800">Frame Logo</h3>
          <button onClick={onCancel} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            {CROP_ASPECTS.map(a => (
              <button key={a.value} onClick={() => setAspect(a.value)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  aspect === a.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}>
                {a.label}
              </button>
            ))}
          </div>
          <div
            className="rounded-lg overflow-hidden border-2 border-blue-200 cursor-grab active:cursor-grabbing select-none mx-auto"
            style={{
              width: CROP_DISPLAY_W,
              height: displayH,
              backgroundImage: 'linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%),linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%)',
              backgroundSize: '10px 10px',
              backgroundPosition: '0 0,5px 5px',
              backgroundColor: '#f3f4f6',
            }}
          >
            <canvas
              ref={canvasRef}
              style={{ display: 'block', width: CROP_DISPLAY_W, height: displayH }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={() => { dragRef.current.active = false; }}
            />
          </div>
          <p className="text-xs text-gray-400 text-center">Drag to reposition . use slider to zoom</p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 shrink-0">Zoom</span>
            <input type="range" min={0.05} max={4} step={0.01} value={scale}
              onChange={e => setScale(parseFloat(e.target.value))}
              className="flex-1 accent-blue-600" />
            <span className="text-xs text-gray-500 w-10 text-right shrink-0">{Math.round(scale * 100)}%</span>
          </div>
          <button onClick={() => img && fitReset(img, displayH)}
            className="w-full py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
            Reset to Fit
          </button>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onCancel}
            className="flex-1 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleConfirm}
            className="flex-1 py-2 text-sm rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">
            Use This Frame
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Company Profile Panel ────────────────────────────────────────────────────

function CompanyProfilePanel({ canWrite }: { canWrite: boolean }) {
  const { profile, refresh } = useCompany();
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const bgInputRef     = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    company_name: '',
    address: '',
    contact: '',
    email: '',
  });
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bgUploading, setBgUploading] = useState(false);
  const [cropFile, setCropFile]   = useState<File | null>(null);
  const [toast, setToast]         = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isOpen, setIsOpen]       = useState(true);

  // Sync form from context whenever profile loads/changes
  useEffect(() => {
    if (!profile) return;
    setForm({
      company_name:   profile.company_name   ?? '',
      address:        profile.address        ?? '',
      contact:        profile.contact        ?? '',
      email:          profile.email          ?? '',
    });
  }, [profile]);

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        company_name: form.company_name,
        address:      form.address,
        contact:      form.contact,
        email:        form.email,
      };
      await companyApi.update(payload);
      await refresh();
      showToast('success', 'Company profile saved.');
    } catch {
      showToast('error', 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';
    setCropFile(file);
  }

  async function handleCropConfirm(blob: Blob) {
    setCropFile(null);
    setUploading(true);
    try {
      const croppedFile = new File([blob], 'logo.png', { type: 'image/png' });
      await companyApi.uploadLogo(croppedFile);
      await refresh();
      showToast('success', 'Logo updated.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      showToast('error', msg);
    } finally {
      setUploading(false);
    }
  }

  async function handleLogoRemove() {
    try {
      await companyApi.deleteLogo();
      await refresh();
      showToast('success', 'Logo removed.');
    } catch {
      showToast('error', 'Failed to remove logo.');
    }
  }

  async function handleBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (bgInputRef.current) bgInputRef.current.value = '';
    setBgUploading(true);
    try {
      await companyApi.uploadBgImage(file);
      await refresh();
      showToast('success', 'Background image updated.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      showToast('error', msg);
    } finally {
      setBgUploading(false);
    }
  }

  async function handleBgRemove() {
    try {
      await companyApi.deleteBgImage();
      await refresh();
      showToast('success', 'Background image removed.');
    } catch {
      showToast('error', 'Failed to remove background image.');
    }
  }

  const field = (label: string, key: keyof typeof form, type: string = 'text', hint?: string) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        disabled={!canWrite}
        placeholder={hint}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-400"
      />
    </div>
  );

  return (
    <>
      {cropFile && (
        <LogoCropModal
          file={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropFile(null)}
        />
      )}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 space-y-6">
      {/* Panel header */}
      <div className="flex items-center justify-between">
        <button className="flex items-center gap-3 flex-1 text-left" onClick={() => setIsOpen((v) => !v)}>
          <div className="bg-blue-600 text-white p-2.5 rounded-xl">
            <Building2 size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">Company Profile</h2>
            <p className="text-xs text-gray-500">Branding and contact info for your company.</p>
          </div>
          {isOpen ? <ChevronUp size={16} className="text-gray-400 ml-2" /> : <ChevronDown size={16} className="text-gray-400 ml-2" />}
        </button>
        {canWrite && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {isOpen && (<>
      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
          toast.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Left: Text fields */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Basic Info</h3>
          {field('Company Name', 'company_name', 'text', 'e.g. Family Care Hospital')}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              disabled={!canWrite}
              rows={3}
              placeholder="Full address"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-400 resize-none"
            />
          </div>
          {field('Contact Number', 'contact', 'text', 'e.g. +63 2 8888 0000')}
          {field('Email Address', 'email', 'email', 'e.g. info@company.com')}
        </div>

        {/* Right: Logo */}
        <div className="space-y-6">
          {/* Logo */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Upload size={13} /> Logo
            </h3>
            <div className="flex items-center gap-4">
              {profile?.logo_url ? (
                <img
                  src={profile.logo_url}
                  alt="Company logo"
                  className="h-16 w-16 rounded-lg object-contain border border-gray-200 bg-gray-50 p-1"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400">
                  <ImageOff size={24} />
                </div>
              )}
              {canWrite && (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-60"
                  >
                    {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                    {uploading ? 'Uploading...' : 'Upload Logo'}
                  </button>
                  {profile?.logo_url && (
                    <button
                      onClick={handleLogoRemove}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                    >
                      <X size={13} /> Remove Logo
                    </button>
                  )}
                  <p className="text-xs text-gray-400">JPEG, PNG, GIF, WEBP, SVG . Max 2 MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Login Background Image */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Upload size={13} /> Login Background
            </h3>
            <div className="flex items-start gap-4">
              {profile?.bg_image_url ? (
                <img
                  src={profile.bg_image_url}
                  alt="Login background"
                  className="h-20 w-32 rounded-lg object-cover border border-gray-200 bg-gray-50"
                />
              ) : (
                <div className="h-20 w-32 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 text-xs text-center px-2">
                  <ImageOff size={20} />
                </div>
              )}
              {canWrite && (
                <div className="space-y-2">
                  <input
                    ref={bgInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleBgUpload}
                  />
                  <button
                    onClick={() => bgInputRef.current?.click()}
                    disabled={bgUploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-60"
                  >
                    {bgUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                    {bgUploading ? 'Uploading...' : 'Upload Background'}
                  </button>
                  {profile?.bg_image_url && (
                    <button
                      onClick={handleBgRemove}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                    >
                      <X size={13} /> Remove
                    </button>
                  )}
                  <p className="text-xs text-gray-400">JPEG, PNG, GIF, WEBP . Max 5 MB</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </>)}
    </div>
    </>
  );
}

// ─── Appearance Panel ────────────────────────────────────────────────────────
function AppearancePanel() {
  const { theme, fontSize, setTheme, setFontSize } = useTheme();

  const fontSizes: { value: FontSize; label: string }[] = [
    { value: 'small',  label: 'Small'  },
    { value: 'normal', label: 'Normal' },
    { value: 'large',  label: 'Large'  },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="bg-indigo-600 text-white p-2.5 rounded-xl">
          <Paintbrush size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">Appearance</h2>
          <p className="text-xs text-gray-500">Customize your display preferences. Changes apply only to your browser.</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Dark mode toggle */}
        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon size={18} className="text-indigo-400" /> : <Sun size={18} className="text-yellow-500" />}
            <div>
              <p className="text-sm font-semibold text-gray-800">Dark Mode</p>
              <p className="text-xs text-gray-500">Switch between light and dark interface</p>
            </div>
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle dark mode"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Font size selector */}
        <div className="py-3 px-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Type size={18} className="text-gray-600" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Font Size</p>
              <p className="text-xs text-gray-500">Adjust the text size across the interface</p>
            </div>
          </div>
          <div className="flex gap-2">
            {fontSizes.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFontSize(value)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  fontSize === value
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Holidays Panel ──────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();

type HolidayModalMode = 'add' | 'edit';

function HolidayModal({
  mode,
  initial,
  onClose,
  onSaved,
}: {
  mode: HolidayModalMode;
  initial: HolidayEntry;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm]     = useState<HolidayEntry>(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');
  const originalDate        = initial.holiday_date;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      if (mode === 'add') {
        await holidaysApi.create(form);
      } else {
        await holidaysApi.update({ ...form, old_holiday_date: originalDate });
      }
      onSaved();
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => { if (!saving) onClose(); }} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="font-bold text-lg text-gray-800">
            {mode === 'add' ? 'Add Holiday' : 'Edit Holiday'}
          </h3>
          {!saving && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <X size={18} />
            </button>
          )}
        </div>
        {/* Body */}
        <form id="holiday-form" onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Date <span className="text-red-400">*</span></label>
            <input
              type="date"
              required
              value={form.holiday_date}
              onChange={(e) => setForm((f) => ({ ...f, holiday_date: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Type <span className="text-red-400">*</span></label>
            <select
              value={form.holiday_type}
              onChange={(e) => setForm((f) => ({ ...f, holiday_type: e.target.value as 'Regular' | 'Special' }))}
              className={inputCls}
              required
            >
              <option value="Regular">Regular</option>
              <option value="Special Non-working">Special Non-working</option>
              <option value="Special Working">Special Working</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              required
              value={form.holiday_name}
              onChange={(e) => setForm((f) => ({ ...f, holiday_name: e.target.value }))}
              placeholder="e.g. New Year's Day"
              className={inputCls}
            />
          </div>
          {err && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              <AlertCircle size={14} /> {err}
            </div>
          )}
        </form>
        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-gray-200">
          <button
            type="submit"
            form="holiday-form"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving...' : mode === 'add' ? 'Add Holiday' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 border border-gray-300 hover:bg-gray-50 disabled:opacity-40 text-gray-600 rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function HolidaysPanel({ canWrite }: { canWrite: boolean }) {
  const year = CURRENT_YEAR;
  const [rows, setRows]       = useState<HolidayEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [toast, setToast]     = useState<{ ok: boolean; msg: string } | null>(null);
  const [isOpen, setIsOpen]   = useState(true);

  const [modal, setModal]     = useState<{ mode: HolidayModalMode; entry: HolidayEntry } | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<HolidayEntry | null>(null);
  const [deleting, setDeleting]       = useState(false);
  const [deleteErr, setDeleteErr]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await holidaysApi.list(year);
      setRows(res.data);
    } catch (ex: unknown) {
      setError(ex instanceof Error ? ex.message : 'Failed to load holidays');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const showToast = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaved = () => {
    setModal(null);
    showToast(true, modal?.mode === 'add' ? 'Holiday added.' : 'Holiday updated.');
    load();
  };

  const handleDelete = async () => {
    if (!deleteEntry) return;
    setDeleting(true);
    setDeleteErr('');
    try {
      await holidaysApi.remove(deleteEntry.holiday_date);
      setDeleteEntry(null);
      showToast(true, 'Holiday deleted.');
      load();
    } catch (ex: unknown) {
      setDeleteErr(ex instanceof Error ? ex.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const blankEntry = (): HolidayEntry => ({
    holiday_date: `${year}-01-01`,
    holiday_type: 'Regular',
    holiday_name: '',
  });

  const fmtDate = (d: string) => {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Panel header */}
      <div
        className="px-6 py-5 border-b border-gray-200 flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="bg-red-500 text-white p-2.5 rounded-xl">
            <CalendarDays size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Holidays</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Public holidays used in attendance and payroll computation.
            </p>
          </div>
        </div>
        {isOpen ? <ChevronUp size={18} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />}
      </div>

      {isOpen && (
        <div className="p-6 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs font-semibold text-gray-500">{CURRENT_YEAR}</p>
            <div className="flex-1" />
            <button
              onClick={load}
              disabled={loading}
              className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            {canWrite && (
              <button
                onClick={() => setModal({ mode: 'add', entry: blankEntry() })}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
              >
                <Plus size={15} /> Add Holiday
              </button>
            )}
          </div>

          {/* Toast */}
          {toast && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              toast.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              {toast.msg}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
                <Loader2 size={20} className="animate-spin" /> Loading...
              </div>
            ) : rows.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <p className="font-medium">No holidays for {year}</p>
                {canWrite && <p className="text-sm mt-1">Click "Add Holiday" to add one.</p>}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 text-left">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 text-left">Name</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 text-left">Type</th>
                    {canWrite && <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 text-left">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {rows.map((h) => (
                    <tr key={h.holiday_date} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap font-mono">{fmtDate(h.holiday_date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{h.holiday_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          h.holiday_type === 'Regular'
                            ? 'bg-red-100 text-red-700'
                            : h.holiday_type === 'Special Working'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {h.holiday_type}
                        </span>
                      </td>
                      {canWrite && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setModal({ mode: 'edit', entry: { ...h } })}
                              title="Edit"
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => { setDeleteEntry(h); setDeleteErr(''); }}
                              title="Delete"
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!loading && rows.length > 0 && (
            <p className="text-xs text-gray-400 text-right">{rows.length} holiday{rows.length !== 1 ? 's' : ''}</p>
          )}
        </div>
      )}

      {/* Add / Edit modal */}
      {modal && (
        <HolidayModal
          mode={modal.mode}
          initial={modal.entry}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm */}
      {deleteEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { if (!deleting) setDeleteEntry(null); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2.5 rounded-full flex-shrink-0">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Delete Holiday</h3>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-1">
              Delete <strong>{deleteEntry.holiday_name}</strong>?
            </p>
            <p className="text-xs text-gray-400 font-mono bg-gray-50 rounded px-2 py-1 mb-4">
              {fmtDate(deleteEntry.holiday_date)} — {deleteEntry.holiday_type}
            </p>
            {deleteErr && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-3">
                <AlertCircle size={14} /> {deleteErr}
              </div>
            )}
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
                onClick={() => setDeleteEntry(null)}
                disabled={deleting}
                className="px-4 py-2.5 border border-gray-300 hover:bg-gray-50 disabled:opacity-40 text-gray-600 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Settings Page ─────────────────────────────────────────────────────────────
export default function SettingsPage({ userRole, scrollToSection, onSectionScrolled, isReadOnly = false }: SettingsPageProps) {
  const canWrite = userRole === 'admin' && !isReadOnly;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page header */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-gray-700 text-white p-3 rounded-xl">
              <Settings size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">Settings</h1>
              <p className="text-sm text-gray-500">
                {canWrite ? 'Manage system configuration and payroll tables.' : 'View system configuration.'}
              </p>
            </div>
          </div>
          {canWrite && (
            <button
              onClick={() => settingsApi.downloadBackup()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium transition-colors"
              title="Download full database backup"
            >
              <Download size={15} /> Download Backup
            </button>
          )}
        </div>
        {!canWrite && (
          <div className="mt-3 flex items-center gap-2 p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
            <AlertCircle size={15} /> You have read-only access. Contact an admin to make changes.
          </div>
        )}
      </div>

      {/* Appearance panel -- all users */}
      <AppearancePanel />

      {/* Company Profile panel -- admin only */}
      {canWrite && <CompanyProfilePanel canWrite={canWrite} />}

      {/* Holidays panel */}
      <HolidaysPanel canWrite={canWrite} />

      {/* Payroll Settings panel */}
      <PayrollSettingsPanel canWrite={canWrite} initialTab={scrollToSection} onMounted={onSectionScrolled} />
    </div>
  );
}
