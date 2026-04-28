import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, X, Edit2, Trash2,
  Loader2, CalendarDays, Calendar, Building2, User,
} from 'lucide-react';
import { calendarApi, departmentsApi, type CalEvent } from '@/lib/api';
import type { UserRole } from '../App';

// ── Color maps ────────────────────────────────────────────────────────────────
const DOT: Record<string, string> = {
  red: 'bg-red-500', orange: 'bg-orange-400', green: 'bg-green-500',
  purple: 'bg-purple-500', yellow: 'bg-yellow-400', pink: 'bg-pink-500',
  indigo: 'bg-indigo-500', blue: 'bg-blue-500', teal: 'bg-teal-500',
};

const BADGE: Record<string, string> = {
  red:    'bg-red-50    border-red-200    text-red-700',
  orange: 'bg-orange-50 border-orange-200 text-orange-700',
  green:  'bg-green-50  border-green-200  text-green-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  pink:   'bg-pink-50   border-pink-200   text-pink-700',
  indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  blue:   'bg-blue-50   border-blue-200   text-blue-700',
  teal:   'bg-teal-50   border-teal-200   text-teal-700',
};

// Default colors + labels per event type
const TYPE_META: Record<string, { color: string; label: string }> = {
  holiday:      { color: 'red',    label: 'Holiday'      },
  leave:        { color: 'green',  label: 'Leave'        },
  payroll:      { color: 'purple', label: 'Payroll'      },
  overtime:     { color: 'yellow', label: 'Overtime'     },
  change_shift: { color: 'indigo', label: 'Shift Change' },
  custom:       { color: 'blue',   label: 'Event'        },
};

const PICKER_COLORS = ['blue','red','green','orange','purple','pink','yellow','teal','indigo'];

const WEEKDAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const MONTHS   = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format a local Date object as YYYY-MM-DD without UTC conversion. */
const localDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Expand multi-day events onto every date within their range. */
function buildDateMap(events: CalEvent[]): Record<string, CalEvent[]> {
  const map: Record<string, CalEvent[]> = {};
  for (const ev of events) {
    const start = new Date(ev.date + 'T00:00:00');
    const end   = ev.end_date ? new Date(ev.end_date + 'T00:00:00') : new Date(start);
    let cur = new Date(start);
    while (cur <= end) {
      const key = localDateKey(cur);
      if (!map[key]) map[key] = [];
      if (!map[key].find(e => e.id === ev.id)) map[key].push(ev);
      cur.setDate(cur.getDate() + 1);
    }
  }
  return map;
}

function fmtDateHeader(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface FormState {
  title: string;
  description: string;
  event_date: string;
  end_date: string;
  color: string;
  target_type: string;
  target_dept: string;
}

const emptyForm = (date = ''): FormState => ({
  title: '', description: '', event_date: date, end_date: '',
  color: 'blue', target_type: 'all', target_dept: '',
});

interface CalendarWidgetProps {
  userRole: UserRole;
  userId: number;
  userDept: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CalendarWidget({ userRole, userId, userDept }: CalendarWidgetProps) {
  const today    = new Date();
  const todayStr = localDateKey(today);

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);
  const [events,       setEvents]       = useState<CalEvent[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [editingId,    setEditingId]    = useState<number | null>(null);
  const [form,         setForm]         = useState<FormState>(emptyForm(todayStr));
  const [formError,    setFormError]    = useState('');
  const [saving,       setSaving]       = useState(false);
  const [deletingId,   setDeletingId]   = useState<number | string | null>(null);
  const [departments,  setDepartments]  = useState<string[]>([]);

  const canEdit = userRole === 'admin' || userRole === 'supervisor' || userRole === 'employee';

  const monthKey = useMemo(() =>
    `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`
  , [currentMonth]);

  // ── Data fetching ───────────────────────────────────────────────────────────
  const loadEvents = useCallback(() => {
    setLoading(true);
    calendarApi.getMonth(monthKey)
      .then(res => setEvents(res.events ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [monthKey]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  useEffect(() => {
    if (userRole === 'admin') {
      departmentsApi.list().then(setDepartments).catch(() => {});
    }
  }, [userRole]);

  // ── Calendar grid computation ───────────────────────────────────────────────
  const dateMap = useMemo(() => buildDateMap(events), [events]);

  const calDays = useMemo((): (string | null)[] => {
    const yr  = currentMonth.getFullYear();
    const mo  = currentMonth.getMonth();
    const firstDay    = new Date(yr, mo, 1).getDay();
    const daysInMonth = new Date(yr, mo + 1, 0).getDate();
    const days: (string | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(`${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    return days;
  }, [currentMonth]);

  const selectedEvents = selectedDate ? (dateMap[selectedDate] ?? []) : [];

  // ── Navigation ──────────────────────────────────────────────────────────────
  const prevMonth = () =>
    setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  // ── Form helpers ────────────────────────────────────────────────────────────
  const openAdd = (date?: string) => {
    const defaultTarget = userRole === 'employee' ? 'employee' : 'all';
    setForm({ ...emptyForm(date ?? todayStr), target_type: defaultTarget });
    setEditingId(null);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (ev: CalEvent) => {
    setForm({
      title:       ev.title,
      description: ev.subtitle ?? '',
      event_date:  ev.date,
      end_date:    ev.end_date ?? '',
      color:       ev.color,
      target_type: ev.target_type ?? 'all',
      target_dept: ev.target_dept ?? userDept,
    });
    setEditingId(ev.id as number);
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim())  { setFormError('Title is required.'); return; }
    if (!form.event_date)    { setFormError('Start date is required.'); return; }
    if (form.target_type === 'dept' && !form.target_dept) {
      setFormError('Please select a department.'); return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        title:       form.title.trim(),
        description: form.description.trim() || undefined,
        event_date:  form.event_date,
        end_date:    form.end_date || undefined,
        color:       form.color,
        target_type: form.target_type,
        target_dept: form.target_type === 'dept' ? form.target_dept : undefined,
      };
      if (editingId) {
        await calendarApi.updateEvent(editingId, payload);
      } else {
        await calendarApi.createEvent(payload);
      }
      setShowForm(false);
      loadEvents();
    } catch (err: any) {
      setFormError(err.message ?? 'Failed to save event.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    setDeletingId(id);
    try {
      await calendarApi.deleteEvent(id as number);
      loadEvents();
    } catch {}
    finally { setDeletingId(null); }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-xl shadow-md overflow-visible">

      {/* ── Panel header ───────────────────────────────────────────────────── */}
      <div className="flex items-center space-x-2 px-4 py-3 border-b border-gray-100">
        <div className="bg-blue-500 text-white rounded-lg p-1.5">
          <CalendarDays size={16} />
        </div>
        <h3 className="text-sm font-bold text-gray-800 flex-1">Calendar</h3>
        {canEdit && (
          <button
            onClick={() => openAdd(selectedDate ?? undefined)}
            className="flex items-center gap-1 text-xs bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1.5 rounded-lg font-medium transition-colors"
          >
            <Plus size={12} /> Add Event
          </button>
        )}
      </div>

      <div className="p-3">

        {/* ── Month navigation ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm font-bold text-gray-800">
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* ── Weekday header row ───────────────────────────────────────────── */}
        <div className="grid grid-cols-7 mb-0.5">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-0.5">{d}</div>
          ))}
        </div>

        {/* ── Day grid ────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-blue-400" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-px">
            {calDays.map((dateStr, i) => {
              if (!dateStr) return <div key={`pad-${i}`} className="h-[38px]" />;

              const dayEvents  = dateMap[dateStr] ?? [];
              const isToday    = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const dayNum     = parseInt(dateStr.split('-')[2], 10);
              const dots       = dayEvents.slice(0, 3);
              const extra      = dayEvents.length - 3;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`flex flex-col items-center rounded-lg py-0.5 px-0.5 transition-colors min-h-[38px] w-full
                    ${isSelected
                      ? 'bg-blue-500'
                      : isToday
                      ? 'bg-blue-50 ring-1 ring-blue-300'
                      : 'hover:bg-gray-50'
                    }`}
                >
                  <span className={`text-xs font-semibold leading-none mt-1
                    ${isSelected ? 'text-white' : isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                    {dayNum}
                  </span>
                  <div className="flex flex-wrap justify-center gap-px mt-0.5">
                    {dots.map((ev, idx) => (
                      <span
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${DOT[ev.color] ?? 'bg-gray-400'}`}
                      />
                    ))}
                    {extra > 0 && (
                      <span className={`text-[8px] leading-none font-bold
                        ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                        +{extra}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Legend ──────────────────────────────────────────────────────── */}
        <div className="mt-2.5 pt-2.5 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {Object.entries(TYPE_META).map(([type, meta]) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT[meta.color]}`} />
                <span className="text-[10px] text-gray-500">{meta.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Selected date events ──────────────────────────────────────────── */}
      {selectedDate && (
        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-700">
              {fmtDateHeader(selectedDate)}
            </p>
            {canEdit && (
              <button
                onClick={() => openAdd(selectedDate)}
                className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-0.5 font-medium"
              >
                <Plus size={11} /> Add
              </button>
            )}
          </div>

          {selectedEvents.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">No events on this day.</p>
          ) : (
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
              {selectedEvents.map(ev => {
                const badgeCls = BADGE[ev.color] ?? BADGE.blue;
                const dotCls   = DOT[ev.color]   ?? 'bg-gray-400';
                return (
                  <div
                    key={String(ev.id)}
                    className={`flex items-start justify-between gap-2 rounded-lg px-2.5 py-2 border text-xs ${badgeCls}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotCls}`} />
                        <span className="font-semibold truncate">{ev.title}</span>
                      </div>
                      {ev.subtitle && (
                        <p className="text-[10px] opacity-70 ml-3.5 truncate">{ev.subtitle}</p>
                      )}
                      {ev.type === 'custom' && ev.created_by && (
                        <p className="text-[10px] opacity-60 ml-3.5 mt-0.5">By: {ev.created_by}</p>
                      )}
                    </div>
                    {ev.editable && (
                      <div className="flex gap-1 flex-shrink-0 mt-0.5">
                        <button
                          onClick={() => openEdit(ev)}
                          title="Edit event"
                          className="opacity-60 hover:opacity-100 transition-opacity p-0.5"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(ev.id)}
                          disabled={deletingId === ev.id}
                          title="Delete event"
                          className="opacity-60 hover:opacity-100 transition-opacity p-0.5"
                        >
                          {deletingId === ev.id
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Trash2 size={12} />
                          }
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Add / Edit Event Modal ────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm">

            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="bg-blue-500 text-white rounded-lg p-1.5">
                  <Calendar size={15} />
                </div>
                <h3 className="font-bold text-gray-800 text-sm">
                  {editingId ? 'Edit Event' : 'New Event'}
                </h3>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Event title"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Additional details..."
                  rows={2}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Start <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.event_date}
                    onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    End <span className="text-gray-400 font-normal">(opt.)</span>
                  </label>
                  <input
                    type="date"
                    value={form.end_date}
                    min={form.event_date}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Color</label>
                <div className="flex flex-wrap gap-2">
                  {PICKER_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      title={c}
                      className={`w-6 h-6 rounded-full transition-transform ${DOT[c]}
                        ${form.color === c
                          ? 'ring-2 ring-offset-2 ring-gray-500 scale-125'
                          : 'hover:scale-110'
                        }`}
                    />
                  ))}
                </div>
                {/* Color coding legend */}
                <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Color guide</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {Object.values(TYPE_META).map(({ color, label }) => (
                      <span key={label} className="flex items-center gap-1 text-[11px] text-gray-600">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${DOT[color]}`} />
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Audience -- admin can pick all / dept; supervisor is locked to dept; employee to self */}
              {userRole === 'admin' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Visible to
                  </label>
                  <select
                    value={form.target_type}
                    onChange={e => setForm(f => ({ ...f, target_type: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="all">All Employees</option>
                    <option value="dept">Specific Department</option>
                  </select>
                  {form.target_type === 'dept' && (
                    <select
                      value={form.target_dept}
                      onChange={e => setForm(f => ({ ...f, target_dept: e.target.value }))}
                      className="mt-2 w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="">Select department...</option>
                      {departments.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {userRole === 'supervisor' && (
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
                  <Building2 size={13} className="text-blue-500 flex-shrink-0" />
                  <span>
                    This event will be visible to all employees in the{' '}
                    <strong>{userDept}</strong> department.
                  </span>
                </div>
              )}

              {userRole === 'employee' && (
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
                  <User size={13} className="text-blue-500 flex-shrink-0" />
                  <span>This event will only be visible to <strong>you</strong>.</span>
                </div>
              )}

              {formError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
