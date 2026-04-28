import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UserRole } from '../App';
import { Settings, LogOut, UserCircle, ShieldCheck, Crown, Bell, Building2, X, Check, ChevronRight, MessageSquare, Search, Send, ChevronLeft, Users, ChevronDown, ChevronUp, Menu } from 'lucide-react';
import { useCompany } from '../context/CompanyContext';
import { notificationsApi, AppNotification, messagesApi, chatApi, UnifiedMessage, DmConversation, ChatMessage, SearchUser } from '@/lib/api';

type RoomType = 'company' | 'department' | 'direct';
interface RoomInfo {
  id: string;
  type: RoomType;
  name: string;
  photo?: string | null;
  otherId?: number;
}
interface ChatWindow {
  room: RoomInfo;
  collapsed: boolean;
  messages: (UnifiedMessage | ChatMessage)[];
  input: string;
  sending: boolean;
}
function dmRoomId(a: number, b: number) {
  return `dm_${Math.min(a, b)}_${Math.max(a, b)}`;
}
function timeStr(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const SSE_URL = ((import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? 'http://localhost/backend/api') + '/notifications/sse.php';

interface Toast { id: number; title: string; message: string; page: string; }
let _toastId = 0;

/** Map a notification type to the app page/section it belongs to.
 *  Returns a compound string "page:section" when section routing is needed,
 *  or plain "page" otherwise.
 */
function notifRoute(type: string, baseRole: UserRole): string {
  if (type.startsWith('attendance')) return 'attendance';
  if (type.startsWith('payroll')) return 'payroll';
  if (type.startsWith('request')) return 'dashboard';
  if (type.startsWith('settings_update')) {
    // e.g. "settings_update_rate_multipliers" → "settings:rate_multipliers"
    const parts = type.split('_');
    // "settings_update" has 2 parts; table key starts at index 2
    const tableKey = parts.slice(2).join('_');
    return tableKey ? `settings:${tableKey}` : 'settings';
  }
  return 'dashboard';
}

interface HeaderProps {
  userRole: UserRole;
  baseRole: UserRole;
  setUserRole: (role: UserRole) => void;
  userName: string;
  onLogout?: () => void;
  onNavigate?: (page: string) => void;
  photoUrl?: string | null;
  userId?: number;
  userDept?: string;
  onMobileSidebarToggle?: () => void;
}

export default function Header({
  userRole, baseRole, setUserRole, userName, onLogout, onNavigate,
  photoUrl, userId, userDept, onMobileSidebarToggle,
}: HeaderProps) {
  const { profile } = useCompany();

  // ── Profile dropdown ──────────────────────────────────────────────────────
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [photoUrl]);

  // ── Notifications ─────────────────────────────────────────────────────────
  const [notifOpen, setNotifOpen]           = useState(false);
  const notifRef                            = useRef<HTMLDivElement>(null);

  // ── Messages / Chat ──────────────────────────────────────────────────────
  const [chatListOpen, setChatListOpen]     = useState(false);
  const chatListRef                         = useRef<HTMLDivElement>(null);
  const [openChats, setOpenChats]           = useState<ChatWindow[]>([]);
  const [dmConvos, setDmConvos]             = useState<DmConversation[]>([]);
  const [chatSearch, setChatSearch]         = useState('');
  const [chatSearchRes, setChatSearchRes]   = useState<SearchUser[]>([]);
  const [chatSearching, setChatSearching]   = useState(false);
  const chatPollsRef                        = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const chatLastIdsRef                      = useRef<Map<string, number>>(new Map());
  const chatEndRefsRef                      = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const prevMsgCountsRef                    = useRef<Map<string, number>>(new Map());
  // Track last-seen per DM room for unread badge
  const chatLastSeenRef = useRef<Record<string, string>>((() => {
    try { return JSON.parse(localStorage.getItem('chat_last_seen') ?? '{}'); } catch { return {}; }
  })());
  // For message toast alerts: track previous last_at per room and whether initial load is done
  const prevConvoLastAtRef = useRef<Map<string, string>>(new Map());
  const convoInitRef = useRef(false);
  const openChatsRef = useRef<ChatWindow[]>([]);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [notifications, setNotifications]   = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [toasts, setToasts]                 = useState<Toast[]>([]);
  const lastIdRef                           = useRef<number>(0);
  const esRef                               = useRef<EventSource | null>(null);

  const addToast = useCallback((title: string, message: string, page: string) => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, title, message, page }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationsApi.list(50);
      setNotifications(data.notifications);
      setUnreadCount(data.unread);
      if (data.notifications.length > 0) {
        const max = Math.max(...data.notifications.map(n => n.id));
        if (max > lastIdRef.current) lastIdRef.current = max;
      }
    } catch { /* ignore */ }
  }, []);

  const connectSSE = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    const url = `${SSE_URL}?last_id=${lastIdRef.current}`;
    const es  = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    es.addEventListener('init', (e: MessageEvent) => {
      const payload = JSON.parse(e.data) as { unread: number; last_id: number };
      setUnreadCount(payload.unread);
      if (payload.last_id > lastIdRef.current) lastIdRef.current = payload.last_id;
    });

    es.addEventListener('notification', (e: MessageEvent) => {
      const payload = JSON.parse(e.data) as { notifications: AppNotification[]; last_id: number };
      if (payload.last_id > lastIdRef.current) lastIdRef.current = payload.last_id;
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const fresh = payload.notifications.filter(n => !existingIds.has(n.id));
        if (fresh.length === 0) return prev;
        // Toast each new notification
        fresh.forEach(n => addToast(n.title, n.message, notifRoute(n.type, baseRole)));
        const newUnread = fresh.filter(n => !n.is_read).length;
        setUnreadCount(c => c + newUnread);
        return [...fresh.reverse(), ...prev];
      });
    });

    es.addEventListener('reconnect', (e: MessageEvent) => {
      const payload = JSON.parse(e.data) as { last_id: number };
      if (payload.last_id > lastIdRef.current) lastIdRef.current = payload.last_id;
      es.close();
      esRef.current = null;
      // Reconnect immediately; server closed gracefully after ~55s
      setTimeout(connectSSE, 200);
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
      // Reconnect after 5 s on unexpected error
      setTimeout(connectSSE, 5000);
    };
  }, [addToast]);

  // Boot: load initial list, then connect SSE
  useEffect(() => {
    loadNotifications().then(connectSSE);
    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [loadNotifications, connectSSE]);

  // ── Chat helpers ─────────────────────────────────────────────────────────
  // Parse both MySQL datetime ("2026-03-18 14:30:00") and ISO strings correctly
  const tsToMs = (s: string) => new Date(s.includes('T') ? s : s.replace(' ', 'T')).getTime();

  const computeUnreadMsgs = useCallback((convos: DmConversation[]) => {
    const stored = chatLastSeenRef.current;
    return convos.filter(c => {
      const seen = stored[c.room_id];
      if (!seen) return !!c.last_at;
      return tsToMs(c.last_at) > tsToMs(seen);
    }).length;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadConvos = useCallback(async () => {
    try {
      const data = await messagesApi.getConversations();
      setDmConvos(data.conversations);
      setUnreadMsgCount(computeUnreadMsgs(data.conversations));

      // Toast for new DM messages (skip on initial load)
      if (convoInitRef.current) {
        data.conversations.forEach(c => {
          if (!c.last_at || !c.last_msg) return;
          const prevAt = prevConvoLastAtRef.current.get(c.room_id);
          if (!prevAt) return; // room is new (wasn't there on last load)
          if (tsToMs(c.last_at) <= tsToMs(prevAt)) return; // not newer
          // Skip if the chat window is already open and visible
          const isVisible = openChatsRef.current.some(w => w.room.id === c.room_id && !w.collapsed);
          if (isVisible) return;
          addToast(`New message from ${c.name}`, c.last_msg, '');
        });
      } else {
        convoInitRef.current = true;
      }

      // Update stored last_at timestamps
      data.conversations.forEach(c => {
        if (c.last_at) prevConvoLastAtRef.current.set(c.room_id, c.last_at);
      });
    } catch { /* ignore */ }
  }, [computeUnreadMsgs, addToast]);

  // Poll conversations for unread badge
  useEffect(() => {
    loadConvos();
    const interval = setInterval(loadConvos, 30_000);
    return () => clearInterval(interval);
  }, [loadConvos]);

  useEffect(() => { loadConvos(); }, [chatListOpen, loadConvos]);

  // Keep openChatsRef in sync so loadConvos can check open windows without stale closure
  useEffect(() => { openChatsRef.current = openChats; }, [openChats]);

  // Search users
  useEffect(() => {
    if (!chatSearch.trim()) { setChatSearchRes([]); return; }
    setChatSearching(true);
    const t = setTimeout(async () => {
      try {
        const data = await messagesApi.searchUsers(chatSearch);
        setChatSearchRes(data.employees);
      } catch { setChatSearchRes([]); }
      setChatSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [chatSearch]);

  const loadWindowMessages = useCallback(async (roomId: string, room: RoomInfo, sinceLast = false) => {
    const lastId = chatLastIdsRef.current.get(roomId) ?? 0;
    try {
      if (room.type === 'company') {
        const rows = await chatApi.list();
        setOpenChats(prev => prev.map(w => w.room.id === roomId ? { ...w, messages: rows } : w));
        if (rows.length) chatLastIdsRef.current.set(roomId, rows[rows.length - 1].id);
      } else {
        const sinceId = sinceLast ? (lastId || undefined) : undefined;
        const data    = await messagesApi.getMessages(roomId, sinceId);
        if (sinceLast && data.messages.length > 0) {
          setOpenChats(prev => prev.map(w => w.room.id === roomId
            ? { ...w, messages: [...w.messages, ...data.messages] } : w));
          chatLastIdsRef.current.set(roomId, data.messages[data.messages.length - 1].id);
        } else if (!sinceLast) {
          setOpenChats(prev => prev.map(w => w.room.id === roomId ? { ...w, messages: data.messages } : w));
          if (data.messages.length) chatLastIdsRef.current.set(roomId, data.messages[data.messages.length - 1].id);
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Manage poll lifecycle
  useEffect(() => {
    const currentIds = new Set(openChats.map(w => w.room.id));
    chatPollsRef.current.forEach((iv, roomId) => {
      if (!currentIds.has(roomId)) {
        clearInterval(iv);
        chatPollsRef.current.delete(roomId);
        chatLastIdsRef.current.delete(roomId);
      }
    });
    openChats.forEach(w => {
      if (!chatPollsRef.current.has(w.room.id)) {
        loadWindowMessages(w.room.id, w.room, false);
        const iv = setInterval(() => loadWindowMessages(w.room.id, w.room, true), 4000);
        chatPollsRef.current.set(w.room.id, iv);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openChats.map(w => w.room.id).join(','), loadWindowMessages]);

  // Cleanup polls on unmount
  useEffect(() => () => {
    chatPollsRef.current.forEach(iv => clearInterval(iv));
  }, []);

  // Scroll to bottom only when new messages arrive (not on input changes)
  useEffect(() => {
    openChats.forEach(w => {
      const prev = prevMsgCountsRef.current.get(w.room.id) ?? 0;
      if (!w.collapsed && w.messages.length > prev) {
        chatEndRefsRef.current.get(w.room.id)?.scrollIntoView({ behavior: 'smooth' });
      }
      prevMsgCountsRef.current.set(w.room.id, w.messages.length);
    });
  }, [openChats]);

  const handleChatSend = async (roomId: string) => {
    const win = openChats.find(w => w.room.id === roomId);
    if (!win || !win.input.trim() || win.sending) return;
    const text = win.input.trim();
    setOpenChats(prev => prev.map(w => w.room.id === roomId ? { ...w, input: '', sending: true } : w));
    try {
      if (win.room.type === 'company') {
        await chatApi.send(text);
        const rows = await chatApi.list();
        setOpenChats(prev => prev.map(w => w.room.id === roomId ? { ...w, messages: rows } : w));
      } else {
        const msg = await messagesApi.send(roomId, text);
        setOpenChats(prev => prev.map(w => w.room.id === roomId
          ? { ...w, messages: [...w.messages, msg] } : w));
        chatLastIdsRef.current.set(roomId, msg.id);
      }
      // Advance the "last seen" marker for this room so the next loadConvos
      // poll does not fire a toast for the message we just sent ourselves.
      const now = new Date();
      const nowStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
      prevConvoLastAtRef.current.set(roomId, nowStr);
    } catch {
      setOpenChats(prev => prev.map(w => w.room.id === roomId ? { ...w, input: text } : w));
    }
    setOpenChats(prev => prev.map(w => w.room.id === roomId ? { ...w, sending: false } : w));
  };

  const openChatRoom = (room: RoomInfo) => {
    setOpenChats(prev => {
      if (prev.some(w => w.room.id === room.id))
        return prev.map(w => w.room.id === room.id ? { ...w, collapsed: false } : w);
      const base = prev.length >= 3 ? prev.slice(1) : prev;
      return [...base, { room, collapsed: false, messages: [], input: '', sending: false }];
    });
    // Mark this DM room as seen -- store in MySQL datetime format to match c.last_at format
    if (room.type === 'direct') {
      const d = new Date();
      const seenAt = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
      chatLastSeenRef.current[room.id] = seenAt;
      try { localStorage.setItem('chat_last_seen', JSON.stringify(chatLastSeenRef.current)); } catch { /* ignore */ }
      setUnreadMsgCount(() => {
        const stored = chatLastSeenRef.current;
        return dmConvos.filter(c => {
          if (c.room_id === room.id) return false;
          const seen = stored[c.room_id];
          if (!seen) return !!c.last_at;
          return tsToMs(c.last_at) > tsToMs(seen);
        }).length;
      });
    }
    setChatListOpen(false);
    setChatSearch('');
    setChatSearchRes([]);
  };

  const closeChatWindow = (roomId: string) => {
    setOpenChats(prev => prev.filter(w => w.room.id !== roomId));
  };

  const toggleChatCollapse = (roomId: string) => {
    setOpenChats(prev => prev.map(w => w.room.id === roomId ? { ...w, collapsed: !w.collapsed } : w));
  };

  const openDm = (u: SearchUser) => {
    const rid = dmRoomId(userId ?? 0, u.id);
    openChatRoom({ id: rid, type: 'direct', name: u.name, photo: u.photo_url, otherId: u.id });
    loadConvos();
  };

  const isChatMine = (msg: UnifiedMessage | ChatMessage): boolean => {
    if ('sender_id' in msg) return (msg as UnifiedMessage).sender_id === userId;
    return (msg as ChatMessage).user === userName;
  };
  const chatSenderName = (msg: UnifiedMessage | ChatMessage): string => {
    if ('sender_name' in msg && typeof (msg as any).sender_name === 'string') return (msg as any).sender_name;
    return (msg as ChatMessage).user ?? '';
  };
  const chatSenderPhoto = (msg: UnifiedMessage | ChatMessage): string | null => {
    if ('sender_photo' in msg) return (msg as UnifiedMessage).sender_photo ?? null;
    return null;
  };

  const deptRoomId = userDept ? `dept_${userDept}` : null;
  const presetRooms: RoomInfo[] = [
    { id: 'company', type: 'company', name: 'Company Chat' },
    ...(deptRoomId ? [{ id: deptRoomId, type: 'department' as RoomType, name: `${userDept} Dept` }] : []),
  ];

  const handleNotifClick = async (n: AppNotification) => {
    // Mark as read
    if (!n.is_read) {
      await notificationsApi.markOne(n.id).catch(() => {});
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: 1 } : x));
      setUnreadCount(c => Math.max(0, c - 1));
    }
    // Navigate
    const page = notifRoute(n.type, baseRole);
    setNotifOpen(false);
    onNavigate?.(page);
  };

  const handleMarkAll = async () => {
    await notificationsApi.markAll().catch(() => {});
    setNotifications(prev => prev.map(x => ({ ...x, is_read: 1 })));
    setUnreadCount(0);
  };

  const handleDeleteNotif = async (id: number) => {
    await notificationsApi.delete(id).catch(() => {});
    setNotifications(prev => {
      const removed = prev.find(x => x.id === id);
      if (removed && !removed.is_read) setUnreadCount(c => Math.max(0, c - 1));
      return prev.filter(x => x.id !== id);
    });
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':      return <Crown size={13} />;
      case 'management': return <Crown size={13} />;
      case 'superadmin': return <Crown size={13} className="text-amber-400" />;
      case 'supervisor': return <ShieldCheck size={13} />;
      default:            return <UserCircle size={13} />;
    }
  };
  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':      return 'Administrator';
      case 'management': return 'Management';
      case 'superadmin': return 'Super Admin';
      case 'supervisor': return 'Supervisor';
      default:            return 'Employee';
    }
  };

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60_000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current  && !profileRef.current.contains(e.target as Node))  setProfileOpen(false);
      if (notifRef.current    && !notifRef.current.contains(e.target as Node))    setNotifOpen(false);
      if (chatListRef.current && !chatListRef.current.contains(e.target as Node)) setChatListOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const logoUrl     = profile?.logo_url     ?? null;
  const companyName = profile?.company_name ?? 'Family Care Hospital';

  return (
    <>
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">

        {/* ── Left: Hamburger (mobile) + Logo + Company Name ─────────────── */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger button — visible on mobile only */}
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 flex-shrink-0"
            onClick={onMobileSidebarToggle}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo"
              className="h-9 w-9 object-contain rounded-md flex-shrink-0" />
          ) : (
            <div className="h-9 w-9 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Building2 size={20} className="text-white" />
            </div>
          )}
          <span className="font-bold text-gray-800 text-base md:text-lg truncate hidden sm:block">
            {companyName}
          </span>
        </div>

        {/* ── Right: Notifications + Profile ────────────────────────────── */}
        <div className="flex items-center gap-2">

          {/* Messages */}
          <div ref={chatListRef} className="relative">
            <button
              onClick={() => { setChatListOpen(v => !v); setNotifOpen(false); setProfileOpen(false); }}
              className="relative w-9 h-9 rounded-full bg-gray-100 hover:bg-blue-100 flex items-center justify-center transition-colors border border-gray-200"
              title="Messages"
            >
              <MessageSquare size={18} className="text-gray-600" />
              {unreadMsgCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                </span>
              )}
            </button>

            {chatListOpen && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-blue-600 flex-shrink-0">
                  <span className="font-semibold text-white text-sm">Messages</span>
                  <button onClick={() => setChatListOpen(false)}><X size={16} className="text-white" /></button>
                </div>
                {/* Search */}
                <div className="px-3 py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5">
                    <Search size={13} className="text-gray-400 flex-shrink-0" />
                    <input
                      className="bg-transparent text-sm flex-1 outline-none placeholder-gray-400"
                      placeholder="Search people..."
                      value={chatSearch}
                      onChange={e => setChatSearch(e.target.value)}
                    />
                    {chatSearch && (
                      <button onClick={() => setChatSearch('')}><X size={13} className="text-gray-400 hover:text-gray-600" /></button>
                    )}
                  </div>
                </div>
                {/* List */}
                <div className="overflow-y-auto" style={{ maxHeight: 340 }}>
                  {chatSearch.trim() ? (
                    chatSearching ? (
                      <p className="text-xs text-gray-400 text-center py-6">Searching...</p>
                    ) : chatSearchRes.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-6">No users found</p>
                    ) : (
                      chatSearchRes.map(u => (
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
                      <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide px-4 pt-3 pb-1">Channels</p>
                      {presetRooms.map(room => (
                        <button key={room.id} onClick={() => openChatRoom(room)}
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
                      {dmConvos.length > 0 && (
                        <>
                          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide px-4 pt-3 pb-1">Direct Messages</p>
                          {dmConvos.map(c => {
                            const seen = chatLastSeenRef.current[c.room_id];
                            const isUnread = c.last_at && (seen ? tsToMs(c.last_at) > tsToMs(seen) : true);
                            return (
                            <button key={c.room_id}
                              onClick={() => openChatRoom({ id: c.room_id, type: 'direct', name: c.name, photo: c.photo, otherId: c.other_id })}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${isUnread ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}`}>
                              <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-blue-100">
                                {c.photo
                                  ? <img src={c.photo} className="w-full h-full object-cover" alt={c.name} />
                                  : <div className="w-full h-full bg-blue-500 flex items-center justify-center">
                                      <span className="text-white font-bold text-sm select-none">{c.name.charAt(0)}</span>
                                    </div>}
                                {isUnread && (
                                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`text-sm truncate ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>{c.name}</p>
                                <p className={`text-xs truncate ${isUnread ? 'font-semibold text-gray-700' : 'text-gray-400'}`}>{c.last_msg ?? 'No messages yet'}</p>
                              </div>
                              {isUnread && (
                                <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                              )}
                            </button>
                            );
                          })}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); if (!notifOpen) loadNotifications(); }}
              className="relative w-9 h-9 rounded-full bg-gray-100 hover:bg-blue-100 flex items-center justify-center transition-colors border border-gray-200"
              title="Notifications"
            >
              <Bell size={18} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full
                  text-white text-[10px] flex items-center justify-center font-bold leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                {/* Header */}
                <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between bg-blue-600">
                  <span className="font-semibold text-white text-xs">
                    Notifications {unreadCount > 0 && <span className="ml-1 bg-white/20 rounded-full px-1.5 py-0.5 text-[10px]">{unreadCount}</span>}
                  </span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAll} title="Mark all read"
                        className="text-white/80 hover:text-white flex items-center gap-0.5 text-[11px]">
                        <Check size={12} /> All
                      </button>
                    )}
                    <button onClick={() => setNotifOpen(false)}><X size={14} className="text-white" /></button>
                  </div>
                </div>

                {/* List */}
                <div className="max-h-[260px] overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center">
                      <Bell size={22} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-xs text-gray-400">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className={`px-3 py-2 flex gap-2 items-start cursor-pointer hover:bg-gray-50 transition-colors
                          ${!n.is_read ? 'bg-blue-50' : 'bg-white'}`}
                      >
                        <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${!n.is_read ? 'bg-blue-500' : 'bg-transparent'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 leading-snug">{n.title}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{n.message}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-[10px] text-gray-400">{timeAgo(n.created_at)}</p>
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-blue-500 bg-blue-50 rounded px-1 py-0.5">
                              <ChevronRight size={8} />{notifRoute(n.type, baseRole).split(':')[0]}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteNotif(n.id); }}
                          className="text-gray-300 hover:text-gray-500 flex-shrink-0 mt-0.5"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }}
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors flex-shrink-0 bg-blue-100"
              title={userName}
            >
              {photoUrl && !imgError ? (
                <img
                  src={photoUrl}
                  alt={userName}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm select-none">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-12 w-60 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                {/* User card */}
                <div className="px-4 py-4 bg-gradient-to-br from-blue-600 to-blue-700 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/40 flex-shrink-0 bg-blue-500">
                    {photoUrl && !imgError ? (
                      <img src={photoUrl} alt={userName} className="w-full h-full object-cover"
                        onError={() => setImgError(true)} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white font-bold select-none">{userName.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{userName}</p>
                    <div className="flex items-center gap-1 text-blue-200 text-xs mt-0.5">
                      {getRoleIcon(baseRole)}
                      <span>{getRoleLabel(baseRole)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="py-1">
                  {/* Role switch: admin/superadmin ↔ employee or supervisor ↔ employee (not for management) */}
                  {(baseRole === 'admin' || baseRole === 'supervisor' || baseRole === 'superadmin') && (
                    <button
                      onClick={() => {
                        setUserRole(userRole === 'employee' ? baseRole : 'employee');
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {userRole === 'employee' ? (
                        <>
                          {baseRole === 'superadmin'
                            ? <Crown size={16} className="text-amber-400" />
                            : baseRole === 'admin'
                            ? <Crown size={16} className="text-yellow-500" />
                            : <ShieldCheck size={16} className="text-blue-500" />}
                          Switch to {baseRole === 'superadmin' ? 'Super Admin' : baseRole === 'admin' ? 'Admin' : 'Supervisor'} View
                        </>
                      ) : (
                        <>
                          <UserCircle size={16} className="text-gray-400" />
                          Switch to Employee View
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => { setProfileOpen(false); onNavigate?.('settings'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings size={16} className="text-gray-400" />
                    Settings
                  </button>
                  <div className="my-1 border-t border-gray-100" />
                  <button
                    onClick={() => { setProfileOpen(false); onLogout?.(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} className="text-red-400" />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>

    {/* ── Floating Chat Windows (up to 3) ──────────────────────────────── */}
    {openChats.map((win, idx) => (
      <div
        key={win.room.id}
        className="fixed bottom-0 z-[9998] flex flex-col"
        style={{ width: win.collapsed ? 240 : 320, right: 16 + idx * 328 }}
      >
        {/* Title bar -- click anywhere to collapse/expand */}
        <div
          className="bg-blue-600 px-2 py-1.5 flex items-center gap-1.5 rounded-t-xl shadow-2xl cursor-pointer select-none"
          onClick={() => toggleChatCollapse(win.room.id)}
        >
          <div className="w-5 h-5 rounded-full overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0">
            {win.room.photo ? (
              <img src={win.room.photo} className="w-full h-full object-cover" alt={win.room.name} />
            ) : win.room.type === 'company' ? (
              <Building2 size={11} className="text-white" />
            ) : win.room.type === 'department' ? (
              <Users size={11} className="text-white" />
            ) : (
              <span className="text-white font-bold" style={{ fontSize: 9 }}>{win.room.name.charAt(0)}</span>
            )}
          </div>
          <span className="text-white font-semibold text-xs truncate flex-1">{win.room.name}</span>
          <span className="text-white flex-shrink-0">
            {win.collapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </span>
          <button
            onClick={e => { e.stopPropagation(); closeChatWindow(win.room.id); }}
            className="text-white hover:text-blue-200 flex-shrink-0"
            title="Close"
          >
            <X size={13} />
          </button>
        </div>

        {/* Messages + Input */}
        {!win.collapsed && (
          <div className="bg-white border border-gray-200 border-t-0 flex flex-col" style={{ height: '50vh' }}>
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 bg-gray-50">
              {win.messages.length === 0 && (
                <p className="text-xs text-gray-400 text-center mt-8">No messages yet. Say hello!</p>
              )}
              {win.messages.map((msg: UnifiedMessage | ChatMessage) => {
                const mine  = isChatMine(msg);
                const name  = chatSenderName(msg);
                const photo = chatSenderPhoto(msg);
                return (
                  <div key={msg.id} className={`flex items-end gap-1.5 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
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
                      {!mine && <p className="text-[11px] text-blue-500 font-semibold px-1">{name}</p>}
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
              <div ref={el => { chatEndRefsRef.current.set(win.room.id, el); }} />
            </div>
            <div className="px-3 py-2.5 border-t border-gray-100 flex items-center gap-2 bg-white flex-shrink-0">
              <input
                className="flex-1 text-sm bg-gray-100 rounded-full px-3 py-2 outline-none placeholder-gray-400"
                placeholder="Type a message..."
                value={win.input}
                onChange={e => {
                  const val = e.target.value;
                  setOpenChats(prev => prev.map(w => w.room.id === win.room.id ? { ...w, input: val } : w));
                }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(win.room.id); } }}
                disabled={win.sending}
              />
              <button
                onClick={() => handleChatSend(win.room.id)}
                disabled={!win.input.trim() || win.sending}
                className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-colors flex-shrink-0 disabled:opacity-50"
              >
                <Send size={14} className="text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    ))}

    {/* ── Toast notifications ────────────────────────────────────────────── */}
    {toasts.length > 0 && (
      <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            onClick={() => { setToasts(prev => prev.filter(x => x.id !== t.id)); onNavigate?.(t.page); }}
            className="pointer-events-auto flex items-start gap-3 bg-white border border-gray-200 shadow-xl rounded-xl px-4 py-3 w-80 animate-in slide-in-from-right-4 fade-in duration-300 cursor-pointer hover:shadow-2xl hover:border-blue-200 transition-all"
          >
            <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
              <Bell size={13} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 leading-snug">{t.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{t.message}</p>
              <p className="text-[10px] text-blue-500 mt-1 flex items-center gap-0.5 font-medium">
                <ChevronRight size={9} /> Go to {t.page.split(':')[0]}
              </p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setToasts(prev => prev.filter(x => x.id !== t.id)); }}
              className="flex-shrink-0 text-gray-300 hover:text-gray-500"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    )}
    </>
  );
}