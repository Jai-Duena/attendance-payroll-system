import React, { useState, useEffect, useRef } from 'react';
import { StickyNote, Plus, X, Pencil, Trash2, Check, Loader2, Pin, PinOff, GripVertical, ChevronRight } from 'lucide-react';
import { notesApi, Note } from '@/lib/api';
import CalendarWidget from './CalendarWidget';
import type { UserRole } from '../App';

const NOTE_COLORS = [
  'bg-blue-100', 'bg-red-100', 'bg-yellow-100',
  'bg-green-100', 'bg-purple-100', 'bg-pink-100',
];

interface RightSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  userRole: UserRole;
  userId: number;
  userDept: string;
}

export default function RightSidebar({ isOpen, onToggle, userRole, userId, userDept }: RightSidebarProps) {

  // ── Notes ─────────────────────────────────────────────────
  const [notes, setNotes]           = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState('');
  const [newNote, setNewNote]       = useState('');
  const [newColor, setNewColor]     = useState(NOTE_COLORS[0]);
  const [editingId, setEditingId]   = useState<number | null>(null);
  const [editText, setEditText]     = useState('');
  const [editColor, setEditColor]   = useState(NOTE_COLORS[0]);
  const [saving, setSaving]         = useState(false);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // Drag-to-reorder state
  const draggedId  = useRef<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const loadNotes = () => {
    notesApi.list()
      .then((data) => { setNotes(data); setNotesError(''); })
      .catch(() => setNotesError('Could not load notes. Please check your session.'))
      .finally(() => setNotesLoading(false));
  };

  useEffect(() => { loadNotes(); }, []);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    setNotesError('');
    try {
      await notesApi.create(newNote.trim(), newColor);
      setNewNote('');
      setNewColor(NOTE_COLORS[0]);
      loadNotes();
    } catch (e: any) {
      setNotesError(e?.message ?? 'Failed to add note.');
    }
    setSaving(false);
  };

  const handleDeleteNote = async (id: number) => {
    await notesApi.delete(id).catch(() => {});
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditText(note.note_text);
    setEditColor(note.color);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    setSaving(true);
    await notesApi.update(editingId, editText.trim(), editColor).catch(() => {});
    setNotes((prev) =>
      prev.map((n) => n.id === editingId ? { ...n, note_text: editText.trim(), color: editColor } : n)
    );
    setEditingId(null);
    setSaving(false);
  };

  const handleTogglePin = async (note: Note) => {
    const newPinned = !note.pinned;
    setNotes((prev) => {
      const updated = prev.map((n) => n.id === note.id ? { ...n, pinned: newPinned } : n);
      return [...updated.filter((n) => n.pinned), ...updated.filter((n) => !n.pinned)];
    });
    await notesApi.togglePin(note.id, newPinned).catch(() => {});
  };

  const handleDrop = (targetId: number) => {
    const fromId = draggedId.current;
    if (!fromId || fromId === targetId) { setDragOverId(null); return; }
    const reordered = [...notes];
    const fromIdx = reordered.findIndex((n) => n.id === fromId);
    const toIdx   = reordered.findIndex((n) => n.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [removed] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, removed);
    setNotes(reordered);
    draggedId.current = null;
    setDragOverId(null);
    notesApi.reorder(reordered.map((n, i) => ({ id: n.id, sort_order: i }))).catch(() => {});
  };

  const fmtNoteDate = (s: string) => {
    const d = new Date(s.includes('T') ? s : s + 'T00:00:00');
    return isNaN(d.getTime()) ? s : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`fixed top-1/2 -translate-y-1/2 z-40 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-l-lg shadow-lg transition-all lg:hidden ${
          isOpen ? 'right-96' : 'right-0'
        }`}
        aria-label="Toggle right sidebar"
      >
        {isOpen ? <X size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative top-0 right-0 h-full lg:h-fit lg:self-start
          w-96 bg-gray-50 shadow-lg overflow-y-auto lg:overflow-visible z-40
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Close button for mobile */}
        <button
          onClick={onToggle}
          className="lg:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-50"
          aria-label="Close sidebar"
        >
          <X size={24} />
        </button>

        <div className="space-y-4 p-4 mt-10 lg:mt-4">

          {/* ── Calendar Panel ─────────────────────────────── */}
          <CalendarWidget userRole={userRole} userId={userId} userDept={userDept} />

          {/* ── Notes Panel ─────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="flex items-center space-x-2 px-4 py-3 border-b border-gray-100">
              <div className="bg-blue-500 text-white rounded-lg p-1.5">
                <StickyNote size={16} />
              </div>
              <h3 className="text-sm font-bold text-gray-800">My Notes</h3>
            </div>

            <div className="p-3 space-y-3">
              {/* Notes List */}
              {notesLoading ? (
                <div className="flex justify-center py-3">
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                </div>
              ) : notesError ? (
                <p className="text-xs text-red-500 text-center py-2 bg-red-50 rounded-lg px-2">{notesError}</p>
              ) : notes.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">No notes yet.</p>
              ) : (
                <div className="space-y-2 max-h-[228px] overflow-y-auto pr-0.5">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move';
                        draggedId.current = note.id;
                      }}
                      onDragOver={(e) => { e.preventDefault(); setDragOverId(note.id); }}
                      onDrop={(e) => { e.preventDefault(); handleDrop(note.id); }}
                      onDragEnd={() => { draggedId.current = null; setDragOverId(null); }}
                      className={`${note.color} rounded-lg p-2.5 group transition-shadow cursor-grab active:cursor-grabbing
                        ${note.pinned ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}
                        ${dragOverId === note.id ? 'ring-2 ring-blue-400 opacity-70' : ''}
                      `}
                    >
                      {editingId === note.id ? (
                        <div className="space-y-1.5">
                          <textarea
                            ref={editInputRef}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={2}
                            className="w-full bg-white bg-opacity-70 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none resize-none"
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                              {NOTE_COLORS.map((c) => (
                                <button
                                  key={c}
                                  onClick={() => setEditColor(c)}
                                  className={`w-4 h-4 rounded-full ${c} border-2 ${editColor === c ? 'border-gray-600' : 'border-transparent'}`}
                                />
                              ))}
                            </div>
                            <div className="flex gap-1">
                              <button onClick={handleSaveEdit} disabled={saving} className="text-green-600 hover:text-green-800 p-0.5">
                                {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                              </button>
                              <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700 p-0.5">
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {/* Top row: drag handle + pin indicator */}
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex items-start gap-1 flex-1">
                              <GripVertical size={11} className="text-gray-400 mt-0.5 flex-shrink-0 opacity-50 group-hover:opacity-100" />
                              <p className="text-xs text-gray-800 flex-1 leading-relaxed break-words">{note.note_text}</p>
                            </div>
                            <div className="flex gap-0.5 flex-shrink-0 ml-1">
                              <button
                                onClick={() => handleTogglePin(note)}
                                title={note.pinned ? 'Unpin' : 'Pin to top'}
                                className={`p-0.5 rounded transition-colors ${note.pinned ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 hover:text-yellow-500 opacity-0 group-hover:opacity-100'}`}
                              >
                                {note.pinned ? <Pin size={11} /> : <PinOff size={11} />}
                              </button>
                              <button onClick={() => startEdit(note)} className="text-gray-500 hover:text-blue-600 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Pencil size={11} />
                              </button>
                              <button onClick={() => handleDeleteNote(note.id)} className="text-gray-500 hover:text-red-600 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                          {/* Bottom: date */}
                          <p className="text-xs text-gray-400 mt-1.5 text-right pl-4">
                            {fmtNoteDate(note.updated_at !== note.created_at ? note.updated_at : note.created_at)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Note Form */}
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote(); } }}
                  placeholder="Write a note... (Enter to add)"
                  rows={2}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 resize-none transition-colors"
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {NOTE_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setNewColor(c)}
                        className={`w-5 h-5 rounded-full ${c} border-2 transition-all ${
                          newColor === c ? 'border-gray-600 scale-110' : 'border-transparent'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleAddNote}
                    disabled={saving || !newNote.trim()}
                    className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
}
