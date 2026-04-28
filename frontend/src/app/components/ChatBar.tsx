import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare, X, Search, Send, ChevronLeft,
  Users, Building2, ChevronUp, ChevronDown,
} from 'lucide-react';
import { messagesApi, chatApi, UnifiedMessage, DmConversation, ChatMessage, SearchUser } from '@/lib/api';

interface ChatBarProps {
  userId: number;
  userName: string;
  userDept: string;
  photoUrl?: string | null;
}

type RoomType = 'company' | 'department' | 'direct';

interface RoomInfo {
  id: string;          // room_id string like 'company', 'dept_XXX', 'dm_1_2'
  type: RoomType;
  name: string;
  photo?: string | null;
  otherId?: number;    // for DM only
}

function dmRoomId(a: number, b: number) {
  return `dm_${Math.min(a, b)}_${Math.max(a, b)}`;
}

function timeStr(dateStr: string) {
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T'));
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const timeOnly = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (diffMs < 24 * 60 * 60 * 1000) return timeOnly;
  // Same year: show "Mar 25, 5:30 PM"; different year: show "Mar 25, 2025, 5:30 PM"
  const sameYear = d.getFullYear() === now.getFullYear();
  const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(!sameYear ? { year: 'numeric' } : {}) });
  return `${datePart}, ${timeOnly}`;
}

export default function ChatBar({ userId, userName, userDept, photoUrl }: ChatBarProps) {
  const [expanded, setExpanded]             = useState(false);
  const [activeRoom, setActiveRoom]         = useState<RoomInfo | null>(null);

  // Conversation list
  const [dmConvos, setDmConvos]             = useState<DmConversation[]>([]);
  const [searchQuery, setSearchQuery]       = useState('');
  const [searchResults, setSearchResults]   = useState<SearchUser[]>([]);
  const [searching, setSearching]           = useState(false);

  // Messages
  const [messages, setMessages]             = useState<(UnifiedMessage | ChatMessage)[]>([]);
  const [input, setInput]                   = useState('');
  const [sending, setSending]               = useState(false);
  const messagesEndRef                      = useRef<HTMLDivElement>(null);
  const lastIdRef                           = useRef<number>(0);
  const pollRef                             = useRef<ReturnType<typeof setInterval> | null>(null);

  const deptRoomId = userDept ? `dept_${userDept}` : null;

  // Preset rooms
  const presetRooms: RoomInfo[] = [
    { id: 'company',    type: 'company',    name: 'Company Chat' },
    ...(deptRoomId ? [{ id: deptRoomId, type: 'department' as RoomType, name: `${userDept} Dept` }] : []),
  ];

  // Load DM conversations when expanded
  const loadConvos = useCallback(async () => {
    try {
      const data = await messagesApi.getConversations();
      setDmConvos(data.conversations);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (expanded) loadConvos();
  }, [expanded, loadConvos]);

  // User search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const data = await messagesApi.searchUsers(searchQuery);
        setSearchResults(data.employees);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Load messages for active room
  const loadMessages = useCallback(async (roomInfo: RoomInfo, sinceLast = false) => {
    try {
      if (roomInfo.type === 'company') {
        const rows = await chatApi.list();
        setMessages(rows);
        if (rows.length) lastIdRef.current = rows[rows.length - 1].id;
      } else {
        const sinceId = sinceLast ? (lastIdRef.current || undefined) : undefined;
        const data    = await messagesApi.getMessages(roomInfo.id, sinceId);
        if (sinceLast && data.messages.length > 0) {
          setMessages(prev => [...prev, ...data.messages]);
          lastIdRef.current = data.messages[data.messages.length - 1].id;
        } else if (!sinceLast) {
          setMessages(data.messages);
          if (data.messages.length) lastIdRef.current = data.messages[data.messages.length - 1].id;
        }
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!activeRoom) {
      setMessages([]);
      lastIdRef.current = 0;
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    loadMessages(activeRoom, false);
    pollRef.current = setInterval(() => loadMessages(activeRoom, true), 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeRoom, loadMessages]);

  // Scroll to bottom when messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !activeRoom || sending) return;
    setSending(true);
    setInput('');
    try {
      if (activeRoom.type === 'company') {
        await chatApi.send(text);
        const rows = await chatApi.list();
        setMessages(rows);
      } else {
        const msg = await messagesApi.send(activeRoom.id, text);
        setMessages(prev => [...prev, msg]);
        lastIdRef.current = msg.id;
      }
    } catch { setInput(text); }
    setSending(false);
  };

  const openRoom = (room: RoomInfo) => {
    setActiveRoom(room);
    setSearchQuery('');
    setSearchResults([]);
  };

  const openDm = (user: SearchUser) => {
    const rid = dmRoomId(userId, user.id);
    openRoom({ id: rid, type: 'direct', name: user.name, photo: user.photo_url, otherId: user.id });
    // Refresh DM list in background
    loadConvos();
  };

  const isMine = (msg: UnifiedMessage | ChatMessage): boolean => {
    if ('sender_id' in msg) return (msg as UnifiedMessage).sender_id === userId;
    return (msg as ChatMessage).user === userName;
  };
  const senderName = (msg: UnifiedMessage | ChatMessage): string => {
    if ('sender_name' in msg && typeof (msg as any).sender_name === 'string') return (msg as any).sender_name;
    return (msg as ChatMessage).user ?? '';
  };
  const senderPhoto = (msg: UnifiedMessage | ChatMessage): string | null => {
    if ('sender_photo' in msg) return (msg as UnifiedMessage).sender_photo ?? null;
    return null;
  };

  return (
    <div className="fixed bottom-0 right-4 z-50 flex flex-col items-end" style={{ width: 320 }}>

      {/* ── Chat Panel (expanded) ──────────────────────────────────────── */}
      {expanded && (
        <div className="bg-white rounded-t-xl shadow-2xl border border-gray-200 border-b-0 flex flex-col overflow-hidden"
          style={{ height: 480, width: 320 }}>

          {activeRoom ? (
            /* ── Message View ───────────────────────────────────────────── */
            <>
              <div className="px-3 py-2.5 flex items-center gap-2 bg-blue-600 flex-shrink-0">
                <button onClick={() => setActiveRoom(null)} className="text-white hover:text-blue-200">
                  <ChevronLeft size={18} />
                </button>
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0">
                  {activeRoom.photo ? (
                    <img src={activeRoom.photo} className="w-full h-full object-cover" alt={activeRoom.name} />
                  ) : activeRoom.type === 'company' ? (
                    <Building2 size={13} className="text-white" />
                  ) : activeRoom.type === 'department' ? (
                    <Users size={13} className="text-white" />
                  ) : (
                    <span className="text-white font-bold text-xs">{activeRoom.name.charAt(0)}</span>
                  )}
                </div>
                <span className="text-white font-semibold text-sm truncate flex-1">{activeRoom.name}</span>
                <button onClick={() => setExpanded(false)}><X size={15} className="text-white" /></button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 bg-gray-50">
                {messages.length === 0 && (
                  <p className="text-xs text-gray-400 text-center mt-8">No messages yet. Say hello!</p>
                )}
                {messages.map(msg => {
                  const mine  = isMine(msg);
                  const name  = senderName(msg);
                  const photo = senderPhoto(msg);
                  return (
                    <div key={msg.id} className={`flex items-end gap-1.5 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`w-6 h-6 rounded-full flex-shrink-0 overflow-hidden
                        ${mine ? 'bg-blue-200' : 'bg-gray-200'} flex items-center justify-center`}>
                        {(mine && photoUrl) ? (
                          <img src={photoUrl} className="w-full h-full object-cover" alt={userName} />
                        ) : photo ? (
                          <img src={photo} className="w-full h-full object-cover" alt={name} />
                        ) : (
                          <span className="text-[10px] font-bold text-gray-500 select-none">{name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className={`max-w-[70%] ${mine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                        {!mine && (
                          <p className="text-[11px] text-blue-500 font-semibold px-1">{name}</p>
                        )}
                        <div className={`rounded-2xl px-3 py-1.5 text-sm shadow-sm break-words
                          ${mine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'}`}>
                          {msg.message}
                        </div>
                        <p className={`text-[10px] text-gray-400 px-1 ${mine ? 'text-right' : 'text-left'}`}>
                          {timeStr(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-2.5 border-t border-gray-100 flex items-center gap-2 bg-white flex-shrink-0">
                <input
                  className="flex-1 text-sm bg-gray-100 rounded-full px-3 py-2 outline-none placeholder-gray-400"
                  placeholder="Type a message..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-colors flex-shrink-0 disabled:opacity-50"
                >
                  <Send size={14} className="text-white" />
                </button>
              </div>
            </>
          ) : (
            /* ── Conversation List View ─────────────────────────────────── */
            <>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-blue-600 flex-shrink-0">
                <span className="font-semibold text-white text-sm">Messages</span>
                <button onClick={() => setExpanded(false)}><X size={16} className="text-white" /></button>
              </div>

              {/* Search */}
              <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5">
                  <Search size={13} className="text-gray-400 flex-shrink-0" />
                  <input
                    className="bg-transparent text-sm flex-1 outline-none placeholder-gray-400"
                    placeholder="Search people..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')}>
                      <X size={13} className="text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {searchQuery.trim() ? (
                  /* Search results */
                  searching ? (
                    <p className="text-xs text-gray-400 text-center py-6">Searching...</p>
                  ) : searchResults.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">No users found</p>
                  ) : (
                    searchResults.map(u => (
                      <button key={u.id} onClick={() => openDm(u)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-blue-100">
                          {u.photo_url
                            ? <img src={u.photo_url} className="w-full h-full object-cover" alt={u.name} />
                            : <div className="w-full h-full flex items-center justify-center bg-blue-500">
                                <span className="text-white font-bold text-sm select-none">{u.name.charAt(0)}</span>
                              </div>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                          <p className="text-xs text-gray-400 truncate">{u.department}</p>
                        </div>
                      </button>
                    ))
                  )
                ) : (
                  <>
                    {/* Channels */}
                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide px-4 pt-3 pb-1">Channels</p>
                    {presetRooms.map(room => (
                      <button key={room.id} onClick={() => openRoom(room)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                          {room.type === 'company'
                            ? <Building2 size={15} className="text-white" />
                            : <Users size={15} className="text-white" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{room.name}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {room.type === 'company' ? 'Everyone in the company' : `${userDept} team`}
                          </p>
                        </div>
                      </button>
                    ))}

                    {/* Recent DMs */}
                    {dmConvos.length > 0 && (
                      <>
                        <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide px-4 pt-3 pb-1">Direct Messages</p>
                        {dmConvos.map(c => (
                          <button key={c.room_id}
                            onClick={() => openRoom({ id: c.room_id, type: 'direct', name: c.name, photo: c.photo, otherId: c.other_id })}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-blue-100">
                              {c.photo
                                ? <img src={c.photo} className="w-full h-full object-cover" alt={c.name} />
                                : <div className="w-full h-full bg-blue-500 flex items-center justify-center">
                                    <span className="text-white font-bold text-sm select-none">{c.name.charAt(0)}</span>
                                  </div>}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                              <p className="text-xs text-gray-400 truncate">{c.last_msg ?? 'No messages yet'}</p>
                            </div>
                          </button>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Toggle Bar (always visible) ──────────────────────────────────── */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-t-xl text-white shadow-xl transition-colors"
        style={{ borderTopLeftRadius: expanded ? 0 : undefined, borderTopRightRadius: expanded ? 0 : undefined }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={16} />
          <span className="font-semibold text-sm">Messages</span>
        </div>
        {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>
    </div>
  );
}
