// Base URL -- override via VITE_API_URL env variable
// Dev: http://localhost/backend/api  |  Prod: /backend/api (relative, same domain)
const BASE_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost/backend/api';

// ── InfinityFree anti-bot challenge solver ────────────────────────────────────
// InfinityFree intercepts requests from unrecognised User-Agents (common on
// mobile) at the nginx level and replaces the ENTIRE response with a JavaScript
// challenge BEFORE PHP runs. The challenge sets a cookie (`__test`) and
// redirects to `?i=1`. A browser page-load executes this JS automatically.
// A fetch() call cannot execute JS, so it receives raw JS text with no JSON.
//
// Fix: detect the challenge signature, open an invisible same-origin iframe
// (which IS a full browser context that executes the challenge JS, sets the
// cookie, and follows the redirect), wait for it to finish, then retry once.
let _challengePromise: Promise<void> | null = null;

function isChallenge(text: string): boolean {
  return text.includes('slowAES.decrypt') && text.includes('__test');
}

/**
 * Call this once at app startup (before any API calls) to pre-solve the
 * InfinityFree anti-bot challenge. Safe to call multiple times — deduplicates.
 */
export function prewarmChallenge(): Promise<void> {
  return solveChallenge();
}

function solveChallenge(): Promise<void> {
  // Deduplicate: if already solving, share the same promise
  if (_challengePromise) return _challengePromise;

  _challengePromise = new Promise<void>((resolve) => {
    // Only works in a browser context (always true for React components)
    if (typeof document === 'undefined') { resolve(); return; }

    const iframe = document.createElement('iframe');
    iframe.style.cssText =
      'position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;top:0;left:0;border:0';

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      _challengePromise = null;
      try { document.body.removeChild(iframe); } catch { /* already removed */ }
      resolve();
    };

    // The iframe loads the backend root, solves the JS challenge, and the
    // resulting `__test` cookie is available to same-origin fetch calls.
    iframe.onload = () => setTimeout(finish, 300); // small delay for cookie write
    setTimeout(finish, 10_000); // hard timeout — never block the UI forever

    // Use the backend root (lightweight, no heavy PHP logic)
    iframe.src = BASE_URL.replace(/\/api$/, '/');
    document.body.appendChild(iframe);
  });

  return _challengePromise;
}

// ── JSON extractor ────────────────────────────────────────────────────────────
// Handles residual cases where InfinityFree injects HTML *around* the JSON
// (ad banners etc). Tries every { or [ position as a potential JSON start so
// that injected HTML containing { characters (e.g. inline CSS/JS) doesn't
// trick the parser into picking the wrong start position.
function extractJson(text: string): Record<string, unknown> {
  const trimmed = text.trimStart();
  // Fast path — already clean JSON (the common production case)
  try { return JSON.parse(trimmed); } catch { /* fall through */ }

  // Try every { or [ as a potential JSON start, pairing with the rightmost
  // matching closer and walking backwards until json_decode succeeds.
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch !== '{' && ch !== '[') continue;
    const closer = ch === '{' ? '}' : ']';
    let end = trimmed.lastIndexOf(closer);
    while (end > i) {
      try { return JSON.parse(trimmed.slice(i, end + 1)); } catch { /* keep going */ }
      end = trimmed.lastIndexOf(closer, end - 1);
    }
  }
  throw new SyntaxError('Could not extract valid JSON from response');
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const doFetch = () =>
    fetch(`${BASE_URL}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
      ...options,
    });

  let res: Response;
  try {
    res = await doFetch();
  } catch {
    // Network-level error (server down, no internet, CORS preflight failure, etc.)
    throw new Error('Unable to reach the server. Check your connection and try again.');
  }

  let text: string;
  try { text = await res.text(); } catch {
    throw new Error(`Unable to read server response (HTTP ${res.status}).`);
  }

  // ── Challenge detection: retry once after solving ─────────────────────────
  if (isChallenge(text)) {
    await solveChallenge();
    try {
      res  = await doFetch();
      text = await res.text();
    } catch {
      throw new Error('Unable to reach the server. Check your connection and try again.');
    }
  }

  let data: Record<string, unknown>;
  try {
    data = extractJson(text);
  } catch {
    throw new Error(`Server returned an invalid response (HTTP ${res.status}). Check the server logs.`);
  }

  if (!res.ok) {
    throw new Error((data.error as string | undefined) ?? `Request failed (${res.status})`);
  }

  return data as T;
}

// FormData upload -- no Content-Type header (browser sets multipart boundary)
async function requestUpload<T>(path: string, body: FormData): Promise<T> {
  const doFetch = () =>
    fetch(`${BASE_URL}${path}`, { credentials: 'include', method: 'POST', body });

  let res = await doFetch();
  let text = await res.text();

  if (isChallenge(text)) {
    await solveChallenge();
    res  = await doFetch();
    text = await res.text();
  }

  const data = extractJson(text);
  if (!res.ok) throw new Error((data.error as string | undefined) ?? `Request failed (${res.status})`);
  return data as T;
}

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    request<{ user: User }>('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () =>
    request<{ success: boolean }>('/auth/logout.php', { method: 'POST' }),

  me: () =>
    request<{ user: User }>('/auth/me.php'),

  changePassword: (current_password: string, new_password: string) =>
    request<{ success: boolean; message: string }>('/auth/change-password.php', {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password }),
    }),

  forceChangePassword: (new_password: string) =>
    request<{ success: boolean; message: string }>('/auth/force-change-password.php', {
      method: 'POST',
      body: JSON.stringify({ new_password }),
    }),

  requestEmail: (email: string) =>
    request<{ success: boolean; message: string }>('/auth/request-email.php', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyEmailCode: (code: string) =>
    request<{ success: boolean; message: string; email: string }>('/auth/verify-email-code.php', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  checkAccount: (identifier: string) =>
    request<{ exists: boolean; has_email: boolean; masked_email: string | null }>('/auth/check-account.php', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    }),

  forgotPasswordEmail: (identifier: string) =>
    request<{ success: boolean; message: string }>('/auth/forgot-password.php', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    }),

  forgotPasswordTicket: (identifier: string, message?: string) =>
    request<{ success: boolean; message: string }>('/auth/reset-ticket.php', {
      method: 'POST',
      body: JSON.stringify({ identifier, message }),
    }),

  getEmailNotifPref: () =>
    request<{ email_notifications: boolean; has_email: boolean }>('/auth/notification-pref.php'),

  setEmailNotifPref: (enabled: boolean) =>
    request<{ success: boolean; email_notifications: boolean }>('/auth/notification-pref.php', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),
};

// Password Reset Requests (admin)
export const resetRequestsApi = {
  list: (status: 'pending' | 'approved' | 'rejected' | 'all' = 'pending') =>
    request<PasswordResetRequest[]>(`/auth/reset-requests.php?status=${status}`),

  approve: (id: number) =>
    request<{ success: boolean; temp_password: string; employee_id: number }>('/auth/reset-requests.php', {
      method: 'POST',
      body: JSON.stringify({ id, action: 'approve' }),
    }),

  reject: (id: number) =>
    request<{ success: boolean }>('/auth/reset-requests.php', {
      method: 'POST',
      body: JSON.stringify({ id, action: 'reject' }),
    }),

  remove: (id: number) =>
    request<{ success: boolean }>('/auth/reset-requests.php', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),

  unlockAccount: (employee_id: number) =>
    request<{ success: boolean; message: string }>('/auth/reset-requests.php', {
      method: 'PUT',
      body: JSON.stringify({ employee_id }),
    }),
};

// Public company branding (no auth required -- for login page)
export const publicApi = {
  companyBranding: () =>
    request<{ success: boolean; data: { company_name: string; logo_url: string | null; bg_image_url: string | null; color_primary: string; color_secondary: string } }>('/settings/company-public.php'),
};

// Announcements
export const announcementsApi = {
  list: () =>
    request<Announcement[]>('/announcements/index.php'),

  create: (payload: {
    content: string;
    display_from: string;
    display_to: string;
    target_dept: string;
  }) =>
    request<{ success: boolean; id: number }>('/announcements/index.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  delete: (id: number) =>
    request<{ success: boolean }>('/announcements/index.php', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};

// Departments
export const departmentsApi = {
  list: () =>
    request<string[]>('/employees/departments.php'),
};

// Requests (leave / overtime)
export const requestsApi = {
  list: (filters?: { dept?: string; employee?: string; employee_id?: number; status?: string }) => {
    const qs = new URLSearchParams();
    if (filters?.dept)        qs.set('dept',        filters.dept);
    if (filters?.employee_id) qs.set('employee_id', String(filters.employee_id));
    else if (filters?.employee) qs.set('employee',  filters.employee);
    if (filters?.status)      qs.set('status',      filters.status);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return request<LeaveRequest[]>(`/requests/index.php${query}`);
  },

  summary: () =>
    request<RequestSummary>('/requests/summary.php'),

  approve: (uniq_id: string) =>
    request<{ success: boolean }>('/requests/approve.php', {
      method: 'POST',
      body: JSON.stringify({ uniq_id }),
    }),

  reject: (uniq_id: string) =>
    request<{ success: boolean }>('/requests/reject.php', {
      method: 'POST',
      body: JSON.stringify({ uniq_id }),
    }),

  submit: (payload: Record<string, unknown>) =>
    request<{ success: boolean }>('/requests/submit.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  submitFormData: (fd: FormData) =>
    requestUpload<{ success: boolean }>('/requests/submit.php', fd),

  myRequests: () =>
    request<LeaveRequest[]>('/requests/my.php'),

  cancelRequest: (uniq_id: string) =>
    request<{ success: boolean }>('/requests/cancel.php', {
      method: 'POST',
      body: JSON.stringify({ uniq_id }),
    }),
};

// Chat
export const chatApi = {
  list: () =>
    request<ChatMessage[]>('/chat/index.php'),

  send: (message: string) =>
    request<{ success: boolean; id: number }>('/chat/index.php', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
};

// Notifications
export const notificationsApi = {
  list: (limit = 50, offset = 0) =>
    request<{ notifications: AppNotification[]; unread: number }>(
      `/notifications/index.php?limit=${limit}&offset=${offset}`
    ),

  markOne: (id: number) =>
    request<{ success: boolean }>('/notifications/index.php', {
      method: 'PUT',
      body: JSON.stringify({ id }),
    }),

  markAll: () =>
    request<{ success: boolean }>('/notifications/index.php', {
      method: 'PUT',
      body: JSON.stringify({ action: 'mark_all' }),
    }),

  delete: (id: number) =>
    request<{ success: boolean }>('/notifications/index.php', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};

// Unified Messages (DM, department, company via fch_messages table)
export const messagesApi = {
  getMessages: (roomId: string, sinceId?: number) => {
    const qs = new URLSearchParams({ room_id: roomId });
    if (sinceId) qs.set('since_id', String(sinceId));
    return request<{ messages: UnifiedMessage[] }>(`/chat/messages.php?${qs.toString()}`);
  },

  send: (roomId: string, message: string) =>
    request<UnifiedMessage>('/chat/messages.php', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId, message }),
    }),

  getConversations: () =>
    request<{ conversations: DmConversation[] }>('/chat/messages.php?conversations=1'),

  searchUsers: (q: string) =>
    request<{ employees: SearchUser[] }>(`/employees/search.php?q=${encodeURIComponent(q)}`),
};

// Notes
export const notesApi = {
  list: () =>
    request<Note[]>('/notes/index.php'),

  create: (note_text: string, color: string) =>
    request<Note>('/notes/index.php', {
      method: 'POST',
      body: JSON.stringify({ note_text, color }),
    }),

  update: (id: number, note_text: string, color?: string) =>
    request<{ success: boolean }>('/notes/index.php', {
      method: 'PUT',
      body: JSON.stringify({ id, note_text, color }),
    }),

  togglePin: (id: number, pinned: boolean) =>
    request<{ success: boolean }>('/notes/index.php', {
      method: 'PUT',
      body: JSON.stringify({ id, pinned }),
    }),

  reorder: (items: { id: number; sort_order: number }[]) =>
    request<{ success: boolean }>('/notes/index.php', {
      method: 'PUT',
      body: JSON.stringify({ id: 0, reorder: items }),
    }),

  delete: (id: number) =>
    request<{ success: boolean }>('/notes/index.php', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};

// ─── Types ───────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  full_name: string;
  first_name: string;
  role: 'employee' | 'supervisor' | 'admin' | 'management' | 'superadmin';
  department: string;
  needs_password_change: boolean;
  has_email: boolean;
  email: string | null;
  email_notifications: boolean;
  photo_url: string | null;
  is_read_only?: boolean;
}

export interface Announcement {
  id: number;
  author: string;
  emp_acc_type: string;
  emp_dept: string;
  content: string;
  display_from: string | null;
  display_to: string | null;
  target_dept: string;
  created_at: string;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  employee_name: string;
  department: string;
  emp_position: string | null;
  emp_sign: string | null;
  type: string;
  reason: string | null;
  status: string;
  sup_status: string | null;
  admin_status: string | null;
  sup_name: string | null;
  admin_name: string | null;
  sup_fullname: string | null;
  sup_position: string | null;
  sup_sign: string | null;
  admin_fullname: string | null;
  admin_position: string | null;
  admin_sign: string | null;
  created_at: string;
  effective_date: string | null;
  // Manual Punch
  mp_date: string | null;
  mp_time: string | null;
  mp_type: string | null;
  mp_reason: string | null;
  mp_proof: string | null;
  // Change Shift
  cs_date: string | null;
  cs_new_shift: string | null;
  cs_old_shift: string | null;
  // Leave
  leave_type: string | null;
  leave_from: string | null;
  leave_to: string | null;
  leave_total: number | null;
  // Overtime
  ot_date: string | null;
  ot_work_done: string | null;
  ot_from: string | null;
  ot_to: string | null;
  ot_total: number | null;
  // WFH
  wfh_date: string | null;
  wfh_start: string | null;
  wfh_end: string | null;
  wfh_activity: string | null;
  wfh_output: string | null;
  // Other
  other_type: string | null;
  other_from_date: string | null;
  other_to_date: string | null;
  other_total_date: number | null;
  other_from_time: string | null;
  other_to_time: string | null;
  other_total_time: number | null;
}

export interface DeptSummary {
  department: string;
  employees: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  total_requests: number;
  nearest_pending_date: string | null;
}

export interface EmployeeSummary {
  employee_id: number;
  employee_name: string;
  department: string;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  total_requests: number;
  nearest_pending_date: string | null;
}

export interface RequestSummary {
  departments: DeptSummary[];
  employees: EmployeeSummary[];
}

export interface EmployeeMe {
  employee_id: number;
  emp_fullname: string;
  emp_username: string;
  emp_dept: string;
  emp_acc_type: string;
  emp_shift: string | null;
  emp_emptype: string;
  emp_gender?: string | null;
  vacation_leave_used: number;
  sick_leave_used: number;
  vacation_leave_total: number;
  sick_leave_total: number;
  vacation_leave_remaining: number;
  sick_leave_remaining: number;
  maternity_leave_used: number;
  maternity_leave_total: number;
  maternity_leave_remaining: number;
  paternity_leave_used: number;
  paternity_leave_total: number;
  paternity_leave_remaining: number;
  solo_parent_leave_used: number;
  solo_parent_leave_total: number;
  solo_parent_leave_remaining: number;
  vawc_leave_used: number;
  vawc_leave_total: number;
  vawc_leave_remaining: number;
  gynecological_leave_used: number;
  gynecological_leave_total: number;
  gynecological_leave_remaining: number;
  vl_sl_eligible?: boolean;
  gyno_eligible?: boolean;
  is_trainee?: boolean;
  vl_eligible_date?: string | null;
  gyno_eligible_date?: string | null;
  emp_datehire?: string | null;
}

export interface ChatMessage {
  id: number;
  user: string;
  role: string;
  message: string;
  created_at: string;
  sender_name?: string; // alias for user
}

export interface PasswordResetRequest {
  id: number;
  employee_id: number | null;
  identifier: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  emp_fullname: string | null;
  emp_dept: string | null;
}

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  reference_id: string | null;
  is_read: number; // 0 or 1
  created_at: string;
}

export interface UnifiedMessage {
  id: number;
  room_id: string;
  sender_id: number;
  sender_name: string;
  sender_photo: string | null;
  message: string;
  created_at: string;
}

export interface DmConversation {
  room_id: string;
  type: 'direct';
  other_id: number;
  name: string;
  photo: string | null;
  last_msg: string | null;
  last_at: string;
  unread_count?: number;
}

export interface SearchUser {
  id: number;
  name: string;
  department: string;
  role: string;
  photo_url: string | null;
}

export interface Note {
  id: number;
  note_text: string;
  color: string;
  pinned: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ─── Attendance Types ───────────────────────────────────────

export interface AttendanceRecord {
  uniq_id: number;
  employee_id: number;
  emp_fullname: string;
  emp_dept: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  shift_time_in: string | null;
  shift_time_out: string | null;
  total_hrs: number;
  adj_date: string | null;
  adj_time_in: string | null;
  adj_time_out: string | null;
  adj_shift_time_in: string | null;
  adj_shift_time_out: string | null;
}

export interface AttendanceSummaryRow {
  id: number;
  batch_id: number;
  employee_id: number;
  emp_fullname: string;
  emp_dept: string;
  payroll_start: string;
  payroll_end: string;
  reg_hrs: number;
  ot_hrs: number;
  nd_hrs: number;
  ot_nd_hrs: number;
  reg_holiday_days: number;
  reg_holiday_hrs: number;
  reg_holiday_ot_hrs: number;
  spec_holiday_hrs: number;
  spec_holiday_ot_hrs: number;
  rd_hrs: number;
  rd_ot_hrs: number;
  late_mins: number;
  leave_days: number;
  adj_reg_hrs: number | null;
  adj_ot_hrs: number | null;
}

export interface AttendancePunch {
  id: number;
  employee_id: number;
  emp_fullname: string | null;
  emp_dept: string | null;
  punch_time: string;
  punch_type: string | null;
  verifycode: string | null;
}

export interface PunchOption {
  id: number;
  punch_time: string;
  punch_type: string | null;
  verifycode: string | null;
}

export interface AttendanceFlag {
  id: number;
  attendance_id: number;
  employee_id: number;
  emp_fullname: string | null;
  date: string | null;
  flag_column: string;
  current_value: string | null;
  suggested_punch_id: number | null;
  suggested_value: string;
  reason: string | null;
  status: 'Pending' | 'Approved' | 'Rejected';
  admin_notes: string | null;
  reviewed_by: number | null;
  reviewed_by_name: string | null;  // joined from fch_employees
  reviewed_at: string | null;
  created_at: string;
  attachment: string | null;
  // Attendance record data (joined)
  shift_time_in: string | null;
  shift_time_out: string | null;
  eff_shift_time_in: string | null;
  eff_shift_time_out: string | null;
  att_time_in: string | null;
  att_time_out: string | null;
  att_total_hrs: number | null;
}

export interface ShiftPreset {
  shift_start?: string; // "HH:MM" (optional, legacy)
  shift_end?:   string; // "HH:MM" (optional, legacy)
  label:        string; // e.g. "Shift 1: 6 AM to 2 PM"
}

export interface AttendanceListResponse {
  data: AttendanceRecord[] | AttendanceSummaryRow[] | AttendancePunch[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type AttendanceTable = 'attendance' | 'summary' | 'punches';

export interface AttendanceFilters {
  table?: AttendanceTable;
  page?: number;
  limit?: number;
  name?: string;
  dept?: string;
  employee_id?: string;
  date?: string;
  month?: string;
  year?: string;
  batch_id?: string;
  payroll_period?: string; // format "YYYY-MM-DD|YYYY-MM-DD"
}

export interface PayrollPeriodOption {
  payroll_start: string;
  payroll_end: string;
}

// ─── Attendance API ─────────────────────────────────────────

export const attendanceApi = {
  list: (filters: AttendanceFilters = {}) => {
    const qs = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    return request<AttendanceListResponse>(`/attendance/index.php?${qs.toString()}`);
  },

  sync: () =>
    request<{ success: boolean; message: string }>('/attendance/sync.php', {
      method: 'POST',
    }),

  update: (payload: {
    uniq_id: number;
    adj_date?: string | null;
    adj_time_in?: string | null;
    adj_time_out?: string | null;
    adj_shift_time_in?: string | null;
    adj_shift_time_out?: string | null;
  }) =>
    request<{ success: boolean; message: string }>('/attendance/update.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'edit', ...payload }),
    }),

  deleteRecord: (uniq_id: number) =>
    request<{ success: boolean; message: string }>('/attendance/update.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', uniq_id }),
    }),

  upload: (file: File) => {
    const fd = new FormData();
    fd.append('dtr_file', file);
    return fetch(`${BASE_URL}/attendance/upload.php`, {
      credentials: 'include',
      method: 'POST',
      body: fd,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Upload failed (${res.status})`);
      return data as { success: boolean; inserted: number; skipped: number; message: string };
    });
  },

  getPunchesForDate: (employeeId: number, date: string) =>
    request<{ data: PunchOption[] }>(`/attendance/punches-for-date.php?employee_id=${employeeId}&date=${date}`),

  recordForDate: (date: string, employeeId?: number) =>
    request<{ data: AttendanceRecord | null }>(
      `/attendance/record-for-date.php?date=${date}${employeeId ? `&employee_id=${employeeId}` : ''}`
    ),

  assignPunch: (payload: { punch_id: number; punch_role: 'time_in' | 'time_out' }) =>
    request<{ success: boolean; message: string; target_date: string }>('/attendance/update.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'assign_punch', ...payload }),
    }),

  submitFlag: (payload: {
    attendance_id: number;
    flag_column: string;
    suggested_punch_id?: number | null;
    suggested_value: string;
    reason: string;
  }) =>
    request<{ success: boolean; message: string }>('/attendance/flags.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'submit', ...payload }),
    }),

  submitFlagFormData: (fd: FormData) =>
    requestUpload<{ success: boolean; message: string }>('/attendance/flags.php', fd),

  listFlags: (params?: { status?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams({ action: 'list', ...(params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])) : {}) });
    return request<{ data: AttendanceFlag[]; total: number }>(`/attendance/flags.php?${qs}`);
  },

  reviewFlag: (payload: { flag_id: number; status: 'Approved' | 'Rejected'; admin_notes?: string }) =>
    request<{ success: boolean; message: string }>('/attendance/flags.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'review', ...payload }),
    }),

  pendingFlagsCount: () =>
    request<{ count: number }>('/attendance/flags.php?action=pending_count'),

  bulkReviewFlags: (payload: { flag_ids: number[]; status: 'Approved' | 'Rejected'; admin_notes?: string }) =>
    request<{ success: boolean; processed: number }>('/attendance/flags.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'bulk_review', ...payload }),
    }),

  getShiftPresets: () =>
    request<{ data: ShiftPreset[] }>('/attendance/shift-presets.php'),

  exportCsv: (params: {
    type?: 'attendance' | 'summary' | 'punches';
    month?: string;
    year?: number;
    date_from?: string;
    date_to?: string;
    dept?: string;
    employee_id?: number;
    employee_ids?: string; // comma-separated IDs
  }) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    return fetch(`${BASE_URL}/attendance/export.php?${qs.toString()}`, {
      credentials: 'include',
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const cd   = res.headers.get('Content-Disposition') ?? '';
      const match = cd.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : 'attendance_export.csv';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  },

  getAuditLog: (params: {
    employee_id?: number;
    dept?: string;
    date_from?: string;
    date_to?: string;
    action?: 'edit' | 'delete';
    page?: number;
    limit?: number;
  } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    return request<{ data: AttendanceAuditEntry[]; total: number; page: number; limit: number; totalPages: number }>(`/attendance/audit.php?${qs.toString()}`);
  },

  checkTardiness: (date?: string) =>
    request<{ success: boolean; date: string; late_notified: number; absent_notified: number }>('/attendance/check-tardiness.php', {
      method: 'POST',
      body: JSON.stringify({ date: date ?? new Date().toISOString().slice(0, 10) }),
    }),
};

export const attendanceOptions = {
  batchIds: () =>
    request<number[]>('/attendance/options.php?type=batch_ids'),
  payrollPeriods: () =>
    request<PayrollPeriodOption[]>('/attendance/options.php?type=payroll_periods'),
};

// ─── Employees ──────────────────────────────────────────────

export interface Employee {
  employee_id: number;
  uniq_id: number;
  emp_fname: string;
  emp_mname: string;
  emp_minit: string;
  emp_lname: string;
  emp_fullname: string;
  emp_dept: string;
  emp_position: string;
  emp_emptype: string;
  emp_acc_type: string;
  emp_shift: string;
  emp_datehire: string;
  emp_dailyrate: number;
  emp_sss: string;
  emp_pagibig: string;
  emp_philhealth: string;
  emp_tin: string | null;
  emp_username: string;
  emp_email: string | null;
  emp_sign: string | null;
  emp_photo: string | null;
  emp_gender?: string | null;
  has_email?: number;
}

export interface EmployeeListResponse {
  data: Employee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const employeesApi = {
  me: () =>
    request<EmployeeMe>('/employees/me.php'),

  nextId: () =>
    request<{ next_id: number }>('/employees/next-id.php'),

  list: (params: { page?: number; limit?: number; name?: string; dept?: string; status?: string } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) qs.set(k, String(v)); });
    return request<EmployeeListResponse>(`/employees/list.php?${qs.toString()}`);
  },

  single: (id: number) =>
    request<Employee>(`/employees/single.php?id=${id}`),

  create: (data: FormData) =>
    requestUpload<{ success: boolean; message: string; employee_id: string }>('/employees/create.php', data),

  update: (data: FormData) =>
    requestUpload<{ success: boolean; message: string }>('/employees/update.php', data),

  delete: (employee_id: number) =>
    request<{ success: boolean; message: string }>('/employees/update.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', employee_id }),
    }),

  hardDelete: (uniq_id: number) =>
    request<{ success: boolean; message: string }>('/employees/update.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'hard_delete', uniq_id }),
    }),
};

// ─── Shift Schedule ─────────────────────────────────────────

export interface ShiftScheduleEntry {
  id?: number;
  employee_id: number;
  emp_fullname?: string;
  emp_dept?: string;
  shift_start: string; // "HH:MM"
  shift_end: string;   // "HH:MM"
  shift_label: string | null;
  date: string;        // "YYYY-MM-DD"
}

export const shiftScheduleApi = {
  get: (params: { employee_id?: number; dept?: string; from: string; to: string }) => {
    const qs = new URLSearchParams({ from: params.from, to: params.to });
    if (params.employee_id) qs.set('employee_id', String(params.employee_id));
    if (params.dept)        qs.set('dept', params.dept);
    return request<{ data: ShiftScheduleEntry[] }>(`/attendance/shift-schedule.php?${qs.toString()}`);
  },

  save: (entries: { employee_id: number; date: string; shift_start: string; shift_end: string; shift_label: string | null }[]) =>
    request<{ success: boolean; processed: number }>('/attendance/shift-schedule.php', {
      method: 'POST',
      body: JSON.stringify({ entries }),
    }),

  remove: (employee_id: number, date: string) =>
    request<{ success: boolean }>('/attendance/shift-schedule.php', {
      method: 'DELETE',
      body: JSON.stringify({ employee_id, date }),
    }),
};

// ─── Payroll Types ──────────────────────────────────────────

export type PayrollStatus = 'Draft' | 'Under Review' | 'Approved' | 'Released' | 'Dropped';

export type PayrollTableType =
  | 'results'
  | 'summary'
  | 'earnings'
  | 'deductions'
  | 'tax'
  | 'attendance_summary';

export interface PayrollBatch {
  result_id: number;
  batch_id: number;
  payroll_start: string;
  payroll_end: string;
  num_employees: number;
  status: PayrollStatus;
  created_at: string;
  updated_at: string;
}

export interface PayrollPipelineStep {
  step: string;
  success: boolean;
  message: string;
}

export interface PayrollGenerateResponse {
  success: boolean;
  batch_id?: number;
  message: string;
  code?: string;
  steps?: PayrollPipelineStep[];
}

export interface PayrollTableResponse {
  success: boolean;
  data: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  archived?: number;
}

export interface PayrollEmployee {
  employee_id: number;
  emp_fullname: string;
  emp_dept: string;
  emp_position: string;
  emp_emptype: string;
}

export interface PayslipData {
  success: boolean;
  employee: Record<string, unknown>;
  batch: { payroll_start: string; payroll_end: string } | null;
  summary: Record<string, unknown> | null;
  attendance: Record<string, unknown> | null;
  earnings: Record<string, unknown> | null;
  deductions: Record<string, unknown> | null;
  tax: Record<string, unknown> | null;
  result_status: PayrollStatus;
  approver?: Record<string, unknown> | null;
}

export interface AuditEntry {
  id: number;
  batch_id: number;
  employee_id: number;
  emp_fullname: string;
  table_name: string;
  field_name: string;
  old_value: number | null;
  new_value: number | null;
  action: string;
  changed_by_user_id: number | null;
  changed_at: string;
  notes: string | null;
  changer_firstname?: string;
  changer_lastname?: string;
}

export interface AttendanceAuditEntry {
  id: number;
  attendance_uniq_id: string;
  employee_id: number;
  emp_fullname: string;
  action: 'edit' | 'delete';
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  changed_by_user_id: number | null;
  changed_by_name: string | null;
  changed_at: string;
}

export interface RemittanceRow {
  employee_id: number;
  emp_fullname: string;
  emp_dept: string;
  type: 'SSS' | 'PhilHealth' | 'Pag-IBIG';
  id_number: string;
  employee_share: number;
  employer_share: number;
  total: number;
}

export type CorrectionStatus =
  | 'Pending'
  | 'Reviewing'
  | 'Reviewed'
  | 'Corrected'
  | 'Rejected';

export interface CorrectionField {
  table: string;
  field: string;
  label: string;
  current_value: string;
  suggested_value: string;
}

export interface PayrollCorrection {
  id: number;
  batch_id: number;
  employee_id: number;
  emp_fullname: string;
  fields_json: string;
  fields: CorrectionField[];
  reason: string;
  attachments: string | null;
  attachment_list: string[];
  status: CorrectionStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Payroll API ────────────────────────────────────────────

export const payrollApi = {
  /** List all payroll batches */
  getBatches: () =>
    request<{ success: boolean; data: PayrollBatch[] }>('/payroll/batches.php'),

  /** List employees (optionally filtered by attendance in period) */
  getEmployees: (start?: string, end?: string) => {
    const qs = new URLSearchParams();
    if (start) qs.set('start', start);
    if (end)   qs.set('end',   end);
    const q = qs.toString() ? `?${qs.toString()}` : '';
    return request<{ success: boolean; data: PayrollEmployee[] }>(`/payroll/employees.php${q}`);
  },

  /** Generate payroll -- full pipeline or a single step re-run */
  generate: (payload:
    | { start_date: string; end_date: string; employees: number[]; force?: boolean }
    | { batch_id: number; step: string; employee_id?: number }
  ) =>
    request<PayrollGenerateResponse>('/payroll/generate.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** Get paginated table data */
  getTable: (params: {
    type: PayrollTableType;
    batch_id?: number;
    page?: number;
    limit?: number;
    name?: string;
    dept?: string;
    sort_col?: string;
    sort_dir?: 'asc' | 'desc';
    employee_id?: number;
  }) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    return request<PayrollTableResponse>(`/payroll/table.php?${qs.toString()}`);
  },

  /** Update adj_ columns on an earnings / deductions / tax / attendance row (batch) */
  updateRow: (payload: { table: string; id: number; changes: { field: string; value: number | null }[]; notes?: string }) =>
    request<{ success: boolean; message: string }>('/payroll/update-row.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** Dry-run preview of saving adj_ changes -- returns before/after diff without persisting */
  previewRow: (payload: { table: string; id: number; changes: { field: string; value: number | null }[] }) =>
    request<{
      success: boolean;
      employee: string;
      direct:   { field: string; label: string; old: number | null; new: number }[];
      indirect: { table: string; table_label: string; field: string; label: string; old: number | null; new: number }[];
    }>('/payroll/preview-row.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** Change the status of a payroll result */
  updateStatus: (result_id: number, status: PayrollStatus, review_duration?: string) =>
    request<{ success: boolean; message: string }>('/payroll/update-status.php', {
      method: 'POST',
      body: JSON.stringify({ result_id, status, ...(review_duration ? { review_duration } : {}) }),
    }),

  /** Full payslip data for one employee in a batch */
  getPayslip: (batch_id: number, employee_id: number) =>
    request<PayslipData>(`/payroll/payslip.php?batch_id=${batch_id}&employee_id=${employee_id}`),

  /** Get list of distinct departments in a batch+type */
  getDepts: (type: PayrollTableType, batch_id: number) => {
    const qs = new URLSearchParams({ type, batch_id: String(batch_id), list_depts: '1' });
    return request<{ success: boolean; data: string[] }>(`/payroll/table.php?${qs.toString()}`);
  },

  /** Get archived (historical) rows for a table (is_archived=1) */
  getArchivedRows: (params: { type: PayrollTableType; batch_id: number; employee_id?: number }) => {
    const qs = new URLSearchParams({ type: params.type, batch_id: String(params.batch_id), archived: '1' });
    if (params.employee_id) qs.set('employee_id', String(params.employee_id));
    return request<PayrollTableResponse>(`/payroll/table.php?${qs.toString()}`);
  },

  /** Get audit trail for a batch (optionally filtered to one employee) */
  getAuditTrail: (batch_id: number, employee_id?: number) => {
    const qs = new URLSearchParams({ batch_id: String(batch_id) });
    if (employee_id) qs.set('employee_id', String(employee_id));
    return request<{ success: boolean; data: AuditEntry[]; total: number; page: number; limit: number; totalPages: number }>(`/payroll/audit.php?${qs.toString()}`);
  },

  /** Check if the logged-in employee has approved a batch */
  getApprovalStatus: (batch_id: number) =>
    request<{ approved: boolean; approved_at: string | null }>(`/payroll/approve.php?batch_id=${batch_id}`),

  /** Record employee e-signature approval for a batch */
  approvePayroll: (batch_id: number) =>
    request<{ success: boolean; message: string; approved_at: string | null }>('/payroll/approve.php', {
      method: 'POST',
      body: JSON.stringify({ batch_id }),
    }),

  /** Get correction requests (admin: all for batch; others: own) */
  getCorrections: (batch_id?: number, status?: string) => {
    const params = new URLSearchParams();
    if (batch_id) params.set('batch_id', String(batch_id));
    if (status)   params.set('status', status);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<{ success: boolean; data: PayrollCorrection[]; total: number }>(`/payroll/corrections.php${qs}`);
  },

  /** Submit a correction request (employee, with optional file attachments) */
  submitCorrection: (payload: FormData) =>
    requestUpload<{ success: boolean; id: number; message: string }>('/payroll/corrections.php', payload),

  updateCorrectionStatus: (id: number, status: string, admin_notes?: string) =>
    request<{ success: boolean; message: string }>('/payroll/corrections.php', {
      method: 'PUT',
      body: JSON.stringify({ id, status, admin_notes }),
    }),

  getRemittance: (batch_id: number, type?: 'sss' | 'philhealth' | 'pagibig' | 'all', employee_id?: number) => {
    const qs = new URLSearchParams({ batch_id: String(batch_id) });
    if (type && type !== 'all') qs.set('type', type);
    if (employee_id !== undefined) qs.set('employee_id', String(employee_id));
    return request<{ batch: { payroll_start: string; payroll_end: string }; type: string; data: RemittanceRow[] }>(`/payroll/remittance.php?${qs.toString()}`);
  },

  downloadRemittance: (batch_id: number, type: 'sss' | 'philhealth' | 'pagibig' | 'all') => {
    const qs = new URLSearchParams({ batch_id: String(batch_id), type, download: '1' });
    return fetch(`${BASE_URL}/payroll/remittance.php?${qs.toString()}`, {
      credentials: 'include',
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `Download failed (${res.status})`);
      }
      const blob = await res.blob();
      const cd   = res.headers.get('Content-Disposition') ?? '';
      const match = cd.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : 'remittance.csv';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  },

  downloadGovReport: (
    type: 'sss_r3' | 'philhealth_rf1' | 'pagibig_mcr',
    batch_id: number,
  ) => {
    const qs = new URLSearchParams({ type, batch_id: String(batch_id) });
    return fetch(`${BASE_URL}/payroll/government-reports.php?${qs.toString()}`, {
      credentials: 'include',
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `Download failed (${res.status})`);
      }
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') ?? '';
      const match = cd.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : 'gov-report.csv';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    });
  },

  downloadBirReport: (
    type: 'bir_1601c' | 'bir_2316',
    params: { month?: string; year?: number },
  ) => {
    const qs = new URLSearchParams({ type });
    if (params.month) qs.set('month', params.month);
    if (params.year)  qs.set('year', String(params.year));
    return fetch(`${BASE_URL}/payroll/bir-reports.php?${qs.toString()}`, {
      credentials: 'include',
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `Download failed (${res.status})`);
      }
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') ?? '';
      const match = cd.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : 'bir-report.csv';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    });
  },
};

// ─── 13th Month Types ──────────────────────────────────────────

export interface ThirteenthMonthEntry {
  employee_id: number;
  emp_fullname: string;
  emp_dept: string;
  total_basic_pay: number;
  thirteenth_month_pay: number;
  is_saved: boolean;
  saved_amount: number | null;
  is_released: number;
  released_at: string | null;
}

export const thirteenthMonthApi = {
  compute: (year: number) =>
    request<{ success: boolean; year: number; data: ThirteenthMonthEntry[] }>(
      `/payroll/thirteenth-month.php?year=${year}`
    ),
  save: (year: number, entries: ThirteenthMonthEntry[]) =>
    request<{ success: boolean; message: string }>('/payroll/thirteenth-month.php', {
      method: 'POST',
      body: JSON.stringify({ year, entries }),
    }),
  release: (year: number, employee_ids: number[]) =>
    request<{ success: boolean; message: string; affected: number }>('/payroll/thirteenth-month.php', {
      method: 'PUT',
      body: JSON.stringify({ year, employee_ids }),
    }),
};

// ─── Settings Types ──────────────────────────────────────────

export type PayrollSettingTable = 'rate_multipliers' | 'pagibig' | 'philhealth' | 'sss' | 'withholding_tax';

export interface RateMultiplierRow {
  code: string;
  multiplier: number;
  description: string | null;
}

export interface ContributionRow {
  id: number;
  salary_from: number;
  salary_to: number;
  employee_share: number;
  employer_share: number;
  effective_date: string;
}

export interface WithholdingTaxRow {
  id: number;
  salary_from: number;
  salary_to: number;
  base_tax: number;
  excess_rate: number;
  effective_date: string;
}

export type PayrollSettingRow = RateMultiplierRow | ContributionRow | WithholdingTaxRow;

// ─── Settings API ────────────────────────────────────────────

export const settingsApi = {
  list: (table: PayrollSettingTable) =>
    request<{ success: boolean; data: PayrollSettingRow[] }>(`/settings/payroll.php?table=${table}`),

  create: (table: PayrollSettingTable, data: Record<string, unknown>) =>
    request<{ success: boolean; message: string; id: number | string }>(`/settings/payroll.php?table=${table}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (table: PayrollSettingTable, pk: string | number, data: Record<string, unknown>) =>
    request<{ success: boolean; message: string }>(`/settings/payroll.php?table=${table}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // pkData should be e.g. { code: 'RD_ND' } or { id: 5 } -- matching the table's PK column
  delete: (table: PayrollSettingTable, pkData: Record<string, string | number>) =>
    request<{ success: boolean; message: string }>(`/settings/payroll.php?table=${table}`, {
      method: 'DELETE',
      body: JSON.stringify(pkData),
    }),

  /** Download a full database backup as a .sql file */
  downloadBackup: () => {
    window.open(`${BASE_URL}/settings/backup.php`, '_blank');
  },
};

// ─── Holiday Types & API ─────────────────────────────────────

export interface HolidayEntry {
  holiday_date: string;          // 'YYYY-MM-DD'
  holiday_type: 'Regular' | 'Special Non-working' | 'Special Working';
  holiday_name: string;
}

export const holidaysApi = {
  list: (year?: number) =>
    request<{ success: boolean; data: HolidayEntry[] }>(
      year ? `/settings/holidays.php?year=${year}` : '/settings/holidays.php'
    ),

  create: (entry: Omit<HolidayEntry, never>) =>
    request<{ success: boolean; message: string }>('/settings/holidays.php', {
      method: 'POST',
      body: JSON.stringify(entry),
    }),

  update: (entry: HolidayEntry & { old_holiday_date?: string }) =>
    request<{ success: boolean; message: string }>('/settings/holidays.php', {
      method: 'PUT',
      body: JSON.stringify(entry),
    }),

  remove: (holiday_date: string) =>
    request<{ success: boolean; message: string }>('/settings/holidays.php', {
      method: 'DELETE',
      body: JSON.stringify({ holiday_date }),
    }),
};

// ─── Company Profile Types ───────────────────────────────────

export interface CompanyProfile {
  id: number;
  company_name: string;
  address: string | null;
  contact: string | null;
  email: string | null;
  logo_path: string | null;
  logo_url: string | null;
  bg_image_path: string | null;
  bg_image_url: string | null;
  color_primary: string;
  color_secondary: string;
  color_tertiary: string | null;
  updated_at: string | null;
}

// ─── Company API ─────────────────────────────────────────────

export const companyApi = {
  get: () =>
    request<{ success: boolean; data: CompanyProfile }>('/settings/company.php'),

  update: (data: Partial<Omit<CompanyProfile, 'id' | 'logo_path' | 'logo_url' | 'updated_at'>>) =>
    request<{ success: boolean; message: string }>('/settings/company.php', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  uploadLogo: (file: File) => {
    const fd = new FormData();
    fd.append('logo', file);
    return fetch(`${BASE_URL}/settings/company.php?action=upload_logo`, {
      credentials: 'include',
      method: 'POST',
      body: fd,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Upload failed (${res.status})`);
      return data as { success: boolean; message: string; logo_url: string };
    });
  },

  deleteLogo: () =>
    request<{ success: boolean; message: string }>('/settings/company.php?action=delete_logo', {
      method: 'DELETE',
    }),

  uploadBgImage: (file: File) => {
    const fd = new FormData();
    fd.append('bg_image', file);
    return fetch(`${BASE_URL}/settings/company.php?action=upload_bg_image`, {
      credentials: 'include',
      method: 'POST',
      body: fd,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Upload failed (${res.status})`);
      return data as { success: boolean; message: string; bg_image_url: string };
    });
  },

  deleteBgImage: () =>
    request<{ success: boolean; message: string }>('/settings/company.php?action=delete_bg_image', {
      method: 'DELETE',
    }),
};

// ─── Calendar ────────────────────────────────────────────────────────────────
export interface CalEvent {
  id: number | string;
  date: string;          // YYYY-MM-DD (start)
  end_date: string | null;
  type: 'holiday' | 'leave' | 'payroll' | 'overtime' | 'wfh' | 'change_shift' | 'custom';
  title: string;
  subtitle: string;
  color: string;
  editable: boolean;
  employee_id?: number | null;
  target_type?: string;
  target_dept?: string | null;
  created_by?: string;
}

interface CalEventPayload {
  title: string;
  description?: string;
  event_date: string;
  end_date?: string;
  color?: string;
  target_type?: string;
  target_dept?: string;
  target_employee_id?: number;
}

export const calendarApi = {
  getMonth: (month: string) =>
    request<{ success: boolean; events: CalEvent[] }>(`/calendar/?month=${month}`),

  createEvent: (data: CalEventPayload) =>
    request<{ success: boolean; id: number }>('/calendar/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateEvent: (id: number, data: Partial<CalEventPayload>) =>
    request<{ success: boolean }>(`/calendar/?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteEvent: (id: number) =>
    request<{ success: boolean }>(`/calendar/?id=${id}`, { method: 'DELETE' }),
};

// ── Biometric ─────────────────────────────────────────────────────────────────
export interface BioSyncLog {
  id: number;
  status: 'success' | 'error' | 'warning';
  message: string;
  users_synced: number;
  punches_synced: number;
  created_at: string;
}

export interface BioUser {
  id: number;
  uid: number;
  device_user_id: string;
  name: string;
  privilege: number;
  card: string;
  employee_id: number | null;
  emp_fullname: string | null;
  last_synced_at: string | null;
}

export interface BioSettings {
  device_ip: string;
  device_port: string;
  device_timeout: string;
  sync_interval_minutes: string;
  chain_web_sync: string;
}

export interface BioStatus {
  last_sync: BioSyncLog | null;
  recent_logs: BioSyncLog[];
  stats: {
    total_punches: number;
    total_bio_users: number;
    unmapped_users: number;
  };
  settings: BioSettings;
}

export const biometricApi = {
  getStatus: () =>
    request<BioStatus>('/biometric/status.php'),

  getSettings: () =>
    request<{ settings: BioSettings }>('/biometric/settings.php'),

  saveSettings: (settings: Partial<BioSettings>) =>
    request<{ success: boolean }>('/biometric/settings.php', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  getUsers: () =>
    request<{ data: BioUser[] }>('/biometric/settings.php?action=users'),

  mapUser: (bioUserId: number, employeeId: number | null) =>
    request<{ success: boolean }>('/biometric/settings.php?action=map', {
      method: 'PUT',
      body: JSON.stringify({ bio_user_id: bioUserId, employee_id: employeeId }),
    }),

  triggerSync: () =>
    request<{ success: boolean; exit_code: number; output: string }>('/biometric/trigger.php', {
      method: 'POST',
    }),

  getTaskStatus: () =>
    request<{ registered: boolean; status?: string; next_run?: string; last_run?: string }>('/biometric/register-task.php'),

  registerTask: () =>
    request<{ success: boolean; interval_min: number; task: { registered: boolean; status?: string; next_run?: string; last_run?: string }; error?: string; detail?: string }>('/biometric/register-task.php', {
      method: 'POST',
    }),
};
