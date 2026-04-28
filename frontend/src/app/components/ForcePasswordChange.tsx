import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertTriangle, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { authApi, type User } from '@/lib/api';
import { PasswordStrength } from './LoginPage';

interface Props {
  user: User;
  onDone: () => void; // called after password changed (logout)
}

export default function ForcePasswordChange({ user, onDone }: Props) {
  const [pw, setPw]   = useState({ next: '', confirm: '' });
  const [show, setShow] = useState({ next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState<{ ok: boolean; text: string } | null>(null);
  const [done, setDone]     = useState(false);

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 pr-10';

  const handleSubmit = async () => {
    if (pw.next.length < 6) return setMsg({ ok: false, text: 'New password must be at least 6 characters.' });
    if (pw.next === 'Family Care') return setMsg({ ok: false, text: 'You cannot keep the default password. Please choose a new one.' });
    if (pw.next !== pw.confirm) return setMsg({ ok: false, text: 'Passwords do not match.' });

    setSaving(true); setMsg(null);
    try {
      const res = await authApi.forceChangePassword(pw.next);
      setMsg({ ok: true, text: res.message });
      setDone(true);
      setTimeout(() => onDone(), 2500);
    } catch (e: any) {
      setMsg({ ok: false, text: e.message ?? 'Password change failed.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-blue-500 rounded-t-2xl p-6 text-white text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 mb-3">
            <AlertTriangle size={28} />
          </div>
          <h1 className="text-xl font-bold">Password Change Required</h1>
          <p className="text-sm text-white/80 mt-1">
            Hello, <strong>{user.full_name}</strong>. Your account is using the default password and must be changed before you can continue.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {!done ? (
            <>
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <span>For your security, you must change your password before accessing the system. This cannot be skipped.</span>
              </div>

              <div>
                <PwField label="New Password" value={pw.next} show={show.next}
                  onChange={(v) => setPw((p) => ({ ...p, next: v }))}
                  onToggle={() => setShow((s) => ({ ...s, next: !s.next }))} />
                {pw.next && <PasswordStrength password={pw.next} className="mt-2" />}
              </div>
              <PwField label="Confirm New Password" value={pw.confirm} show={show.confirm}
                onChange={(v) => setPw((p) => ({ ...p, confirm: v }))}
                onToggle={() => setShow((s) => ({ ...s, confirm: !s.confirm }))} />

              {msg && (
                <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${msg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {msg.ok ? <CheckCircle size={16} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />}
                  <span>{msg.text}</span>
                </div>
              )}

              <button onClick={handleSubmit} disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                {saving ? 'Changing Password...' : 'Change Password & Continue'}
              </button>
            </>
          ) : (
            <div className="text-center py-4 space-y-3">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100">
                <CheckCircle size={28} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Password Changed!</h3>
              <p className="text-sm text-gray-500">
                Your password has been updated. Please log in again with your new password.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <Loader2 size={14} className="animate-spin" /> Redirecting to login...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PwField({ label, value, show, onChange, onToggle }: {
  label: string; value: string; show: boolean;
  onChange: (v: string) => void; onToggle: () => void;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1 font-medium">{label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 pr-10"
          value={value} onChange={(e) => onChange(e.target.value)} autoComplete="new-password" />
        <button type="button" onClick={onToggle}
          className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
