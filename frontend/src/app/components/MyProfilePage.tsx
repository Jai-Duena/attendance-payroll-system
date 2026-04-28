import React, { useState, useEffect, useRef } from 'react';
import {
  User, Lock, Mail, CheckCircle, AlertCircle, Loader2,
  Eye, EyeOff, Save, ShieldCheck, Camera, Upload, PenLine, Trash2, X, Bell,
} from 'lucide-react';
import { employeesApi, authApi, departmentsApi, type Employee, type User as AuthUser } from '@/lib/api';
interface Props {
  user: AuthUser;
  onUserUpdate?: (updated: AuthUser) => void;
  onChangeEmail?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) ?? '';

const fmtD = (v: string | null | undefined): string => {
  if (!v) return '--';
  const d = new Date(v.includes('T') ? v : v + 'T00:00:00');
  return isNaN(d.getTime()) ? v : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
};

const SHIFTS = [
  'Shift 1: 6 AM to 2 PM',
  'Shift 2: 2 PM to 10 PM',
  'Shift 3: 10 PM to 6 AM',
  'Day Shift: 8 AM to 5 PM',
  'Morning Shift: 7 AM to 3 PM',
];
const EMP_TYPES = ['Regular', 'Probationary', 'Part-Time', 'Contractual', 'Resigned', 'Terminated'];
const ACC_TYPES = ['Employee', 'Supervisor', 'Admin', 'Management'];

function fmtSSS(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 2) return d;
  if (d.length <= 9) return d.slice(0, 2) + '-' + d.slice(2);
  return d.slice(0, 2) + '-' + d.slice(2, 9) + '-' + d.slice(9);
}
function fmtPagibig(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 12);
  const p: string[] = [];
  if (d.length > 0) p.push(d.slice(0, 4));
  if (d.length > 4) p.push(d.slice(4, 8));
  if (d.length > 8) p.push(d.slice(8, 12));
  return p.join('-');
}
function fmtPhilHealth(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 12);
  if (d.length <= 2) return d;
  if (d.length <= 11) return d.slice(0, 2) + '-' + d.slice(2);
  return d.slice(0, 2) + '-' + d.slice(2, 11) + '-' + d.slice(11);
}
function fmtTIN(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 9);
  const p: string[] = [];
  if (d.length > 0) p.push(d.slice(0, 3));
  if (d.length > 3) p.push(d.slice(3, 6));
  if (d.length > 6) p.push(d.slice(6, 9));
  return p.join('-');
}
function lettersOnly(v: string) { return v.replace(/[^a-zA-Z\s]/g, ''); }
function toInitial(mname: string) {
  if (!mname.trim()) return '';
  return mname.trim().split(/\s+/).map((w) => (w[0] ?? '').toUpperCase() + '.').join('');
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-50 disabled:text-gray-500';
const labelCls = 'text-xs text-gray-500 block mb-1 font-medium';

export default function MyProfilePage({ user, onUserUpdate, onChangeEmail, onDirtyChange }: Props) {
  const [emp, setEmp] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [depts, setDepts] = useState<string[]>([]);

  // Profile edit state
  const [editing, setEditing] = useState(false);
  const [pForm, setPForm]     = useState<Partial<Employee>>({});
  const [pSaving, setPSaving] = useState(false);
  const [pMsg, setPMsg]       = useState<{ ok: boolean; text: string } | null>(null);

  // Photo
  const [photoFile, setPhotoFile]     = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Signature
  const [signMode, setSignMode]   = useState<'draw' | 'upload'>('upload');
  const [signFile, setSignFile]   = useState<File | null>(null);
  const [signData, setSignData]   = useState('');
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const drawingRef   = useRef(false);
  const signFileRef  = useRef<HTMLInputElement>(null);

  // Password change state
  const [showPwForm, setShowPwForm] = useState(false);
  const [pw, setPw]                 = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw]         = useState({ current: false, next: false, confirm: false });
  const [pwSaving, setPwSaving]     = useState(false);
  const [pwMsg, setPwMsg]           = useState<{ ok: boolean; text: string } | null>(null);

  const [emailNotif, setEmailNotif]         = useState(false);
  const [emailNotifSaving, setEmailNotifSaving] = useState(false);
  const [emailNotifMsg, setEmailNotifMsg]   = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    authApi.getEmailNotifPref()
      .then(r => setEmailNotif(r.email_notifications))
      .catch(() => {});
  }, []);

  const toggleEmailNotif = async (val: boolean) => {
    setEmailNotifSaving(true);
    setEmailNotifMsg(null);
    try {
      const r = await authApi.setEmailNotifPref(val);
      setEmailNotif(r.email_notifications);
      setEmailNotifMsg({ ok: true, text: r.email_notifications ? 'Email notifications enabled.' : 'Email notifications disabled.' });
    } catch (e: any) {
      setEmailNotifMsg({ ok: false, text: e.message ?? 'Failed to update preference.' });
    } finally {
      setEmailNotifSaving(false);
      setTimeout(() => setEmailNotifMsg(null), 4000);
    }
  };

  useEffect(() => {
    Promise.all([
      employeesApi.single(user.id),
      departmentsApi.list(),
    ]).then(([e, d]) => {
      setEmp(e);
      setPForm(e);
      setDepts(d);
      setPhotoPreview(e.emp_photo ? `${BACKEND}/${e.emp_photo}` : '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user.id]);

  useEffect(() => {
    onDirtyChange?.(editing);
  }, [editing]);

  useEffect(() => {
    if (editing && signMode === 'draw') {
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
      }, 50);
    }
  }, [editing, signMode]);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    drawingRef.current = true;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };
  const drawOnCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#111';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };
  const stopDraw = () => {
    drawingRef.current = false;
    if (canvasRef.current) setSignData(canvasRef.current.toDataURL('image/png'));
  };
  const clearCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.getContext('2d')!.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setSignData('');
    }
  };

  const startEdit = () => {
    setPForm({ ...emp });
    setPhotoFile(null);
    setPhotoPreview(emp?.emp_photo ? `${BACKEND}/${emp.emp_photo}` : '');
    setSignFile(null); setSignData(''); setSignMode('upload');
    setPMsg(null);
    setEditing(true);
  };
  const cancelEdit = () => {
    setPForm({ ...emp });
    setPhotoFile(null);
    setPhotoPreview(emp?.emp_photo ? `${BACKEND}/${emp.emp_photo}` : '');
    setSignFile(null); setSignData('');
    setEditing(false); setPMsg(null);
  };

  const saveProfile = async () => {
    setPSaving(true); setPMsg(null);
    try {
      const fd = new FormData();
      fd.append('employee_id', String(user.id));
      const fields: (keyof Employee)[] = [
        'emp_fname', 'emp_mname', 'emp_minit', 'emp_lname', 'emp_gender',
        'emp_dept', 'emp_position', 'emp_emptype', 'emp_acc_type',
        'emp_shift', 'emp_datehire', 'emp_dailyrate',
        'emp_sss', 'emp_pagibig', 'emp_philhealth', 'emp_tin',
        'emp_username',
      ];
      fields.forEach((k) => {
        const v = (pForm as any)[k];
        if (v !== undefined && v !== null) fd.append(k, String(v));
      });
      if (photoFile) fd.append('emp_photo', photoFile);
      if (signMode === 'upload' && signFile) fd.append('signature_file', signFile);
      else if (signMode === 'draw' && signData) fd.append('signature_data', signData);

      await employeesApi.update(fd);
      const updated = await employeesApi.single(user.id);
      setEmp(updated);
      setPForm(updated);
      setPhotoPreview(updated.emp_photo ? `${BACKEND}/${updated.emp_photo}` : '');
      setPhotoFile(null); setSignFile(null); setSignData('');
      setEditing(false);
      setPMsg({ ok: true, text: 'Profile updated successfully!' });
    } catch (e: any) {
      setPMsg({ ok: false, text: e.message ?? 'Update failed' });
    } finally {
      setPSaving(false);
    }
  };

  const changePassword = async () => {
    if (!pw.current) return setPwMsg({ ok: false, text: 'Enter your current password.' });
    if (pw.next.length < 6) return setPwMsg({ ok: false, text: 'New password must be at least 6 characters.' });
    if (pw.next !== pw.confirm) return setPwMsg({ ok: false, text: 'Passwords do not match.' });
    if (pw.next === 'Family Care') return setPwMsg({ ok: false, text: 'Cannot use the default password.' });

    setPwSaving(true); setPwMsg(null);
    try {
      const res = await authApi.changePassword(pw.current, pw.next);
      setPwMsg({ ok: true, text: res.message });
      // Session destroyed server-side a€" log user out after delay
      setTimeout(() => { window.location.reload(); }, 2000);
    } catch (e: any) {
      setPwMsg({ ok: false, text: e.message ?? 'Password change failed' });
    } finally {
      setPwSaving(false);
    }
  };

  const F = (k: keyof Employee) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setPForm((f) => ({ ...f, [k]: e.target.value }));

  const isAdmin = user.role === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 gap-3">
        <Loader2 size={22} className="animate-spin" /><span>Loading profile...</span>
      </div>
    );
  }

  if (!emp) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-500">
        <AlertCircle size={32} className="mx-auto mb-2 text-red-400" />
        Failed to load profile.
      </div>
    );
  }

  const editBtns = (
    <div className="flex gap-2">
      <button onClick={cancelEdit} disabled={pSaving}
        className="px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg font-medium disabled:opacity-40">
        Cancel
      </button>
      <button onClick={saveProfile} disabled={pSaving}
        className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50">
        {pSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {pSaving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Profile Header with photo */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {photoPreview
              ? <img src={photoPreview} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-blue-200" />
              : <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold border-2 border-blue-200">
                  {(emp.emp_fullname ?? 'U')[0].toUpperCase()}
                </div>
            }
            {editing && (
              <button type="button" onClick={() => photoInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1.5 shadow hover:bg-blue-700">
                <Camera size={12} />
              </button>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">{emp.emp_fullname}</h1>
            <p className="text-sm text-gray-500">{emp.emp_position || 'No position set'} - {emp.emp_dept || 'No department'}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{emp.emp_acc_type}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">{emp.emp_emptype}</span>
            </div>
            {editing && photoFile && (
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                <CheckCircle size={12} className="text-green-500" />
                {photoFile.name}
                <button onClick={() => { setPhotoFile(null); setPhotoPreview(emp.emp_photo ? `${BACKEND}/${emp.emp_photo}` : ''); }}
                  className="ml-1 text-red-400 hover:text-red-600"><X size={12} /></button>
              </div>
            )}
          </div>
          {!editing && (
            <button onClick={startEdit}
              className="px-4 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium">
              Edit Profile
            </button>
          )}
        </div>
        <input ref={photoInputRef} type="file"
          accept="image/png,image/jpeg,image/jpg,image/jfif,.jfif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); }
          }} />
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <User size={18} className="text-blue-500" />
            <h2 className="font-semibold text-gray-800">Personal Information</h2>
          </div>
          {editing && editBtns}
        </div>

        {pMsg && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-4 ${pMsg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {pMsg.ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {pMsg.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>First Name</label>
            <input className={inputCls} disabled={!editing} value={pForm.emp_fname ?? ''}
              onChange={(e) => setPForm((f) => ({ ...f, emp_fname: lettersOnly(e.target.value) }))} />
          </div>
          <div>
            <label className={labelCls}>Middle Name</label>
            <input className={inputCls} disabled={!editing} value={pForm.emp_mname ?? ''}
              onChange={(e) => {
                const v = lettersOnly(e.target.value);
                setPForm((f) => ({ ...f, emp_mname: v, emp_minit: toInitial(v) }));
              }} />
          </div>
          <div>
            <label className={labelCls}>Last Name</label>
            <input className={inputCls} disabled={!editing} value={pForm.emp_lname ?? ''}
              onChange={(e) => setPForm((f) => ({ ...f, emp_lname: lettersOnly(e.target.value) }))} />
          </div>
          <div>
            <label className={labelCls}>Middle Initial (auto)</label>
            <input className={inputCls} readOnly disabled value={pForm.emp_minit ?? ''} />
          </div>
          <div>
            <label className={labelCls}>Username</label>
            <input className={inputCls} disabled={!editing} value={pForm.emp_username ?? ''}
              onChange={(e) => setPForm((f) => ({ ...f, emp_username: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Employee ID</label>
            <input className={inputCls} readOnly disabled value={String(emp.employee_id)} />
          </div>
          <div>
            <label className={labelCls}>Sex</label>
            {editing ? (
              <select className={inputCls} value={pForm.emp_gender ?? ''}
                onChange={(e) => setPForm((f) => ({ ...f, emp_gender: e.target.value }))}>
                <option value="">None</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            ) : (
              <input className={inputCls} readOnly disabled value={pForm.emp_gender || 'None'} />
            )}
          </div>
        </div>
      </div>

      {/* Employment Details */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={18} className="text-blue-500" />
          <h2 className="font-semibold text-gray-800">Employment Details</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Department</label>
            {editing && isAdmin ? (
              <>
                <select className={inputCls}
                  value={depts.includes(pForm.emp_dept ?? '') ? (pForm.emp_dept ?? '') : (pForm.emp_dept ? '__custom__' : '')}
                  onChange={(e) => setPForm((f) => ({ ...f, emp_dept: e.target.value }))}>
                  <option value="">- Select -</option>
                  {depts.map((d) => <option key={d} value={d}>{d}</option>)}
                  <option value="__custom__">Other</option>
                </select>
                {(pForm.emp_dept === '__custom__' || (!depts.includes(pForm.emp_dept ?? '') && pForm.emp_dept && pForm.emp_dept !== '__custom__')) && (
                  <input className={`${inputCls} mt-1`}
                    value={pForm.emp_dept === '__custom__' ? '' : (pForm.emp_dept ?? '')}
                    onChange={(e) => setPForm((f) => ({ ...f, emp_dept: e.target.value }))}
                    placeholder="Enter department name" />
                )}
              </>
            ) : (
              <input className={inputCls} disabled value={pForm.emp_dept ?? ''} />
            )}
          </div>
          <div>
            <label className={labelCls}>Position</label>
            <input className={inputCls} disabled={!editing || !isAdmin} value={pForm.emp_position ?? ''}
              onChange={(e) => setPForm((f) => ({ ...f, emp_position: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Employment Type</label>
            {editing && isAdmin ? (
              <select className={inputCls} value={pForm.emp_emptype ?? ''}
                onChange={(e) => setPForm((f) => ({ ...f, emp_emptype: e.target.value }))}>
                {EMP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : (
              <input className={inputCls} disabled value={pForm.emp_emptype ?? ''} />
            )}
          </div>
          <div>
            <label className={labelCls}>Account Type</label>
            {editing && isAdmin ? (
              <select className={inputCls} value={pForm.emp_acc_type ?? ''}
                onChange={(e) => setPForm((f) => ({ ...f, emp_acc_type: e.target.value }))}>
                {ACC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : (
              <input className={inputCls} disabled value={pForm.emp_acc_type ?? ''} />
            )}
          </div>
          <div>
            <label className={labelCls}>Date Hired</label>
            {editing && isAdmin ? (
              <input type="date" className={inputCls} value={pForm.emp_datehire ?? ''}
                onChange={(e) => setPForm((f) => ({ ...f, emp_datehire: e.target.value }))} />
            ) : (
              <p className={inputCls}>{fmtD(pForm.emp_datehire)}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Daily Rate</label>
            <input type="number" min={0} className={inputCls} disabled={!editing || !isAdmin}
              value={pForm.emp_dailyrate ?? 0}
              onChange={(e) => setPForm((f) => ({ ...f, emp_dailyrate: Number(e.target.value) }))} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Shift</label>
            {editing && isAdmin ? (
              <>
                <select className={inputCls}
                  value={SHIFTS.includes(pForm.emp_shift ?? '') ? (pForm.emp_shift ?? '') : (pForm.emp_shift ? '__custom__' : '')}
                  onChange={(e) => setPForm((f) => ({ ...f, emp_shift: e.target.value }))}>
                  <option value="">- Select shift -</option>
                  {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  <option value="__custom__">Other</option>
                </select>
                {(pForm.emp_shift === '__custom__' || (!SHIFTS.includes(pForm.emp_shift ?? '') && pForm.emp_shift && pForm.emp_shift !== '__custom__')) && (
                  <input className={`${inputCls} mt-1`}
                    value={pForm.emp_shift === '__custom__' ? '' : (pForm.emp_shift ?? '')}
                    onChange={(e) => setPForm((f) => ({ ...f, emp_shift: e.target.value }))}
                    placeholder="e.g. Special Shift: 9 AM to 5 PM" />
                )}
              </>
            ) : (
              <input className={inputCls} disabled value={pForm.emp_shift ?? ''} />
            )}
          </div>
        </div>
      </div>

      {/* Government IDs */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={18} className="text-blue-500" />
          <h2 className="font-semibold text-gray-800">Government IDs</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>SSS Number (##-#######-#)</label>
            <input className={inputCls} disabled={!editing} value={pForm.emp_sss ?? ''} placeholder="00-0000000-0"
              onChange={(e) => setPForm((f) => ({ ...f, emp_sss: fmtSSS(e.target.value) }))} />
          </div>
          <div>
            <label className={labelCls}>Pag-IBIG Number (####-####-####)</label>
            <input className={inputCls} disabled={!editing} value={pForm.emp_pagibig ?? ''} placeholder="0000-0000-0000"
              onChange={(e) => setPForm((f) => ({ ...f, emp_pagibig: fmtPagibig(e.target.value) }))} />
          </div>
          <div>
            <label className={labelCls}>PhilHealth Number (##-#########-#)</label>
            <input className={inputCls} disabled={!editing} value={pForm.emp_philhealth ?? ''} placeholder="00-000000000-0"
              onChange={(e) => setPForm((f) => ({ ...f, emp_philhealth: fmtPhilHealth(e.target.value) }))} />
          </div>
          <div>
            <label className={labelCls}>TIN (###-###-###)</label>
            <input className={inputCls} disabled={!editing} value={pForm.emp_tin ?? ''} placeholder="000-000-000"
              onChange={(e) => setPForm((f) => ({ ...f, emp_tin: fmtTIN(e.target.value) }))} />
          </div>
        </div>
      </div>

      {/* Signature */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <PenLine size={18} className="text-blue-500" />
          <h2 className="font-semibold text-gray-800">Signature</h2>
        </div>

        {!editing && emp.emp_sign && (
          <img src={`${BACKEND}/${emp.emp_sign}`} alt="Signature" className="h-16 border border-gray-200 rounded p-1 bg-white" />
        )}
        {!editing && !emp.emp_sign && (
          <p className="text-sm text-gray-400">No signature on file. Click "Edit Profile" to add one.</p>
        )}

        {editing && (
          <>
            <div className="flex gap-2 mb-3">
              <button type="button" onClick={() => setSignMode('draw')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${signMode === 'draw' ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                <PenLine size={13} /> Draw
              </button>
              <button type="button" onClick={() => setSignMode('upload')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${signMode === 'upload' ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                <Upload size={13} /> Upload
              </button>
            </div>

            {signMode === 'draw' ? (
              <div>
                <p className="text-xs text-gray-400 mb-2">Draw your signature in the box below.</p>
                <canvas ref={canvasRef} width={600} height={120}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg bg-white cursor-crosshair touch-none"
                  style={{ maxHeight: '120px' }}
                  onMouseDown={startDraw}
                  onMouseMove={drawOnCanvas}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw} />
                <button type="button" onClick={clearCanvas}
                  className="mt-2 flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50">
                  <Trash2 size={12} /> Clear
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-400 mb-2">Upload a PNG or JPEG image of your signature.</p>
                <button type="button" onClick={() => signFileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-xs hover:bg-gray-50">
                  <Upload size={13} /> Choose signature image
                </button>
                <input ref={signFileRef} type="file" accept="image/png,image/jpeg,image/jpg" className="hidden"
                  onChange={(e) => { setSignFile(e.target.files?.[0] ?? null); }} />
                {signFile && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <CheckCircle size={12} className="text-green-500" /> {signFile.name}
                    <button onClick={() => setSignFile(null)} className="text-red-400 hover:text-red-600"><X size={12} /></button>
                  </div>
                )}
                {!signFile && emp.emp_sign && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-400 mb-1">Current signature:</p>
                    <img src={`${BACKEND}/${emp.emp_sign}`} alt="Signature" className="h-12 border border-gray-200 rounded p-1 bg-white" />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Email */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-blue-500" />
            <h2 className="font-semibold text-gray-800">Email Address</h2>
          </div>
          {user.has_email && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <CheckCircle size={13} /> Verified
            </span>
          )}
        </div>

        {user.has_email ? (
          <div className="flex items-center gap-3">
            <div className={`${inputCls} flex-1`}>{user.email}</div>
            <button onClick={() => onChangeEmail?.()}
              className="px-4 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium whitespace-nowrap">
              Change Email
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <AlertCircle size={16} className="flex-shrink-0" />
              No email address set. Add one to receive notifications and access all features.
            </div>
            <button onClick={() => onChangeEmail?.()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
              <Mail size={14} /> Add Email Address
            </button>
          </div>
        )}

        {/* Email notifications toggle */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-2">
              <Bell size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Email Notifications</p>
                <p className="text-xs text-gray-400 mt-0.5">Receive an email whenever you get a system notification</p>
              </div>
            </div>
            <button
              onClick={() => toggleEmailNotif(!emailNotif)}
              disabled={emailNotifSaving || !user.has_email}
              title={!user.has_email ? 'Add an email address first' : undefined}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
                emailNotif ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                emailNotif ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
          {emailNotifMsg && (
            <p className={`mt-2 text-xs ${emailNotifMsg.ok ? 'text-green-600' : 'text-red-600'}`}>{emailNotifMsg.text}</p>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-blue-500" />
            <h2 className="font-semibold text-gray-800">Change Password</h2>
          </div>
          <button onClick={() => { setShowPwForm(!showPwForm); setPwMsg(null); setPw({ current: '', next: '', confirm: '' }); }}
            className="px-4 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium">
            {showPwForm ? 'Cancel' : 'Change'}
          </button>
        </div>

        {showPwForm && (
          <div className="space-y-3">
            <PwField label="Current Password" value={pw.current} show={showPw.current}
              onChange={(v) => setPw((p) => ({ ...p, current: v }))}
              onToggle={() => setShowPw((s) => ({ ...s, current: !s.current }))} />
            <PwField label="New Password" value={pw.next} show={showPw.next}
              onChange={(v) => setPw((p) => ({ ...p, next: v }))}
              onToggle={() => setShowPw((s) => ({ ...s, next: !s.next }))} />
            <PwField label="Confirm New Password" value={pw.confirm} show={showPw.confirm}
              onChange={(v) => setPw((p) => ({ ...p, confirm: v }))}
              onToggle={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))} />
            {pwMsg && (
              <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${pwMsg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {pwMsg.ok ? <CheckCircle size={16} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />}
                <span>{pwMsg.text}</span>
              </div>
            )}
            <button onClick={changePassword} disabled={pwSaving}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg text-sm font-medium">
              {pwSaving ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
              {pwSaving ? 'Changing...' : 'Change Password'}
            </button>
            <p className="text-xs text-gray-400">You will be logged out after changing your password.</p>
          </div>
        )}
      </div>

    </div>
  );
}


function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-xs text-gray-400 block mb-0.5">{label}</label>
      <p className="text-sm text-gray-800 font-medium">{value}</p>
    </div>
  );
}

function PwField({ label, value, show, onChange, onToggle }: {
  label: string; value: string; show: boolean;
  onChange: (v: string) => void; onToggle: () => void;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          className={`${inputCls} pr-10`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
        />
        <button type="button" onClick={onToggle}
          className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
