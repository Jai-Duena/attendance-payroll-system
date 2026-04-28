import React, { useEffect, useState } from 'react';
import { Megaphone, X, Plus, Trash2, CalendarRange, Users, Building2, ChevronDown, ChevronUp, History, Clock, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { announcementsApi, departmentsApi, Announcement } from '../../lib/api';
import { UserRole } from '../App';

interface BulletinBoardProps {
  userRole: UserRole;
  baseRole: UserRole;
  userDept: string;
  userName: string;
  isReadOnly?: boolean;
}

// ─── Employee View ────────────────────────────────────────────
function EmployeeBulletinBoard() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  useEffect(() => {
    announcementsApi.list().then(setAnnouncements).catch(() => {});
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const visible = announcements.filter((a) => {
    if (dismissed.has(a.id)) return false;
    if (a.display_from && a.display_from > today) return false;
    if (a.display_to   && a.display_to   < today) return false;
    return true;
  });

  if (visible.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 mb-1">
        <Megaphone size={18} className="text-red-500" />
        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Bulletin Board</h3>
      </div>
      <AnimatePresence>
        {visible.map((a) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="bg-red-50 border-l-4 border-red-400 rounded-lg shadow-sm p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-800 text-sm leading-relaxed">{a.content}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Building2 size={12} />
                    {a.author} &mdash; {a.emp_dept}
                  </span>
                  {a.display_from && a.display_to && (
                    <span className="flex items-center gap-1">
                      <CalendarRange size={12} />
                      {a.display_from} &rarr; {a.display_to}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setDismissed((prev) => new Set([...prev, a.id]))}
                className="ml-3 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Supervisor / Admin Manager View ─────────────────────────
function BulletinBoardManager({ userRole, userDept, userName, isReadOnly = false }: { userRole: UserRole; userDept: string; userName: string; isReadOnly?: boolean }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);

  // Form state
  const [content, setContent] = useState('');
  const [displayFrom, setDisplayFrom] = useState('');
  const [displayTo, setDisplayTo] = useState('');
  const [targetDept, setTargetDept] = useState(userRole === 'supervisor' ? userDept : 'All');

  const today = new Date().toISOString().split('T')[0];

  const load = () => {
    announcementsApi.list().then(setAnnouncements).catch(() => {});
  };

  useEffect(() => {
    load();
    if (userRole === 'admin') {
      departmentsApi.list().then(setDepartments).catch(() => {});
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!content.trim()) { setError('Message is required.'); return; }
    if (!displayFrom)    { setError('Display start date is required.'); return; }
    if (!displayTo)      { setError('Display end date is required.'); return; }
    if (displayTo < displayFrom) { setError('End date must be on or after start date.'); return; }

    setSubmitting(true);
    try {
      await announcementsApi.create({
        content,
        display_from: displayFrom,
        display_to: displayTo,
        target_dept: userRole === 'supervisor' ? userDept : targetDept,
      });
      setContent('');
      setDisplayFrom('');
      setDisplayTo('');
      setTargetDept(userRole === 'supervisor' ? userDept : 'All');
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.message ?? 'Failed to post announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    await announcementsApi.delete(deleteTargetId).catch(() => {});
    setDeleteTargetId(null);
    load();
  };

  const isActive = (a: Announcement) => {
    if (!a.display_from || !a.display_to) return true;
    return a.display_from <= today && a.display_to >= today;
  };
  const isExpired   = (a: Announcement) => !!(a.display_to && a.display_to < today);
  const isScheduled = (a: Announcement) => !!(a.display_from && a.display_from > today);

  // Partition: history (expired) | visible (active + scheduled, max 3)
  const historyItems  = announcements.filter(isExpired);
  const activeItems   = announcements.filter(a => !isExpired(a) &&  isActive(a));
  const scheduledItems = announcements
    .filter(a => !isExpired(a) && isScheduled(a))
    .sort((a, b) => (a.display_from ?? '').localeCompare(b.display_from ?? ''));
  const MAX_VISIBLE   = 3;
  // Own announcements float to the top; within each group sort by display_from
  const allVisible = [...activeItems, ...scheduledItems].sort((a, b) => {
    const aOwn = a.author === userName ? 0 : 1;
    const bOwn = b.author === userName ? 0 : 1;
    if (aOwn !== bOwn) return aOwn - bOwn;
    return (a.display_from ?? '').localeCompare(b.display_from ?? '');
  });
  const visibleItems  = showAllAnnouncements ? allVisible : allVisible.slice(0, MAX_VISIBLE);
  const hiddenCount   = Math.max(0, allVisible.length - MAX_VISIBLE);

  return (
    <div className="bg-white rounded-xl shadow-lg p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="bg-blue-500 text-white rounded-lg p-2">
            <Megaphone size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Bulletin Board</h2>
            <p className="text-xs text-gray-500">
              {userRole === 'supervisor' ? `Managing: ${userDept} department` : 'All departments'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* History Button */}
          <button
            onClick={() => setShowHistory(true)}
            className="relative flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            <History size={15} />
            <span className="hidden sm:inline">History</span>
            {historyItems.length > 0 && (
              <span className="ml-1 bg-gray-400 text-white text-xs rounded-full px-1.5 py-px leading-none">
                {historyItems.length}
              </span>
            )}
          </button>
          {/* New Announcement Button */}
          {!isReadOnly && (
          <button
            onClick={() => { setShowForm((v) => !v); setError(''); }}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm
              ${showForm
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{showForm ? 'Cancel' : 'New Announcement'}</span>
          </button>
          )}
        </div>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="overflow-hidden"
          >
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 space-y-3">
              <h3 className="font-semibold text-gray-700 text-sm mb-1">Post New Announcement</h3>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Message</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  placeholder="Type your announcement here..."
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                    <CalendarRange size={12} /> Display From
                  </label>
                  <input
                    type="date"
                    value={displayFrom}
                    min={today}
                    onChange={(e) => setDisplayFrom(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                    <CalendarRange size={12} /> Display Until
                  </label>
                  <input
                    type="date"
                    value={displayTo}
                    min={displayFrom || today}
                    onChange={(e) => setDisplayTo(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Target Dept -- Admin only */}
              {userRole === 'admin' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                    <Users size={12} /> Target Audience
                  </label>
                  <select
                    value={targetDept}
                    onChange={(e) => setTargetDept(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="All">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d} Department</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Supervisor: show locked dept */}
              {userRole === 'supervisor' && (
                <div className="flex items-center space-x-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <Building2 size={12} />
                  <span>This announcement will be posted to: <strong>{userDept}</strong> department</span>
                </div>
              )}

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                {submitting ? 'Posting...' : 'Post Announcement'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Announcements List -- max 3: active first, then scheduled by nearest date */}
      {allVisible.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No active or upcoming announcements.</p>
      ) : (
        <div className="space-y-2">
          {visibleItems.map((a) => {
            const active = isActive(a);
            const scheduled = isScheduled(a);
            const expanded = expandedId === a.id;
            return (
              <div
                key={a.id}
                className={`border rounded-lg overflow-hidden transition-colors ${
                  active    ? 'border-blue-200 bg-blue-50'
                  : scheduled ? 'border-yellow-200 bg-yellow-50'
                  : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer"
                  onClick={() => setExpandedId(expanded ? null : a.id)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                      active    ? 'bg-green-100 text-green-700'
                      : scheduled ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-200 text-gray-500'
                    }`}>
                      {active ? 'Active' : scheduled ? 'Scheduled' : 'Inactive'}
                    </span>
                    <p className="text-sm text-gray-800 truncate">{a.content}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                      <Building2 size={11} />
                      {a.target_dept === 'All' ? 'All Depts' : a.target_dept}
                    </span>
                    {(userRole === 'admin' || a.author === userName) && !isReadOnly && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTargetId(a.id); }}
                        className="text-red-400 hover:text-red-600 p-1 rounded transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                    {expanded ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
                  </div>
                </div>

                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-3 border-t border-gray-200 pt-3 space-y-1 text-xs text-gray-600">
                        <p><span className="font-semibold">Message:</span> {a.content}</p>
                        <p><span className="font-semibold">Posted by:</span> {a.author} ({a.emp_dept})</p>
                        <p><span className="font-semibold">Target:</span> {a.target_dept === 'All' ? 'All Departments' : `${a.target_dept} Department`}</p>
                        <p><span className="font-semibold">Display period:</span>{' '}
                          {a.display_from && a.display_to
                            ? `${a.display_from} → ${a.display_to}`
                            : 'Always visible'}
                        </p>
                        <p><span className="font-semibold">Posted on:</span> {new Date(a.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Show more / show less toggle */}
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowAllAnnouncements(v => !v)}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              {showAllAnnouncements
                ? <><ChevronUp size={13} />Show less</>
                : <><ChevronDown size={13} />Show {hiddenCount} more announcement{hiddenCount > 1 ? 's' : ''}</>
              }
            </button>
          )}
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowHistory(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-auto max-h-[75vh] flex flex-col z-10">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="bg-gray-500 text-white rounded-lg p-1.5"><History size={18} /></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Announcement History</h3>
                  <p className="text-xs text-gray-500">Expired announcements</p>
                </div>
              </div>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {historyItems.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No expired announcements.</p>
              ) : (
                historyItems.map((a) => (
                  <div key={a.id} className="border border-gray-200 bg-gray-50 rounded-lg p-3 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">Expired</span>
                        <span className="text-xs text-gray-400 flex items-center gap-0.5">
                          <Building2 size={10} />
                          {a.target_dept === 'All' ? 'All Depts' : a.target_dept}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{a.content}</p>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400">
                        <span>By: {a.author}</span>
                        {a.display_from && a.display_to && (
                          <span className="flex items-center gap-0.5">
                            <CalendarRange size={11} />
                            {a.display_from} → {a.display_to}
                          </span>
                        )}
                      </div>
                    </div>
                    {(userRole === 'admin' || a.author === userName) && !isReadOnly && (
                      <button
                        onClick={() => setDeleteTargetId(a.id)}
                        className="text-red-400 hover:text-red-600 p-1 rounded flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Announcement?</h3>
            <p className="text-sm text-gray-600 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold text-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────
export default function BulletinBoard({ userRole, baseRole, userDept, userName, isReadOnly = false }: BulletinBoardProps) {
  // When a supervisor/admin switches to employee view, show the employee view
  const effectiveRole = userRole === 'employee' ? 'employee' : baseRole;

  if (effectiveRole === 'employee') {
    return <EmployeeBulletinBoard />;
  }

  return <BulletinBoardManager userRole={effectiveRole} userDept={userDept} userName={userName} isReadOnly={isReadOnly} />;
}
