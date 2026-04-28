import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Mail, AlertTriangle, CheckCircle, AlertCircle, Loader2, RefreshCw, X } from 'lucide-react';
import { authApi, type User } from '@/lib/api';

interface Props {
  user: User;
  mode?: 'add' | 'change';
  onDismiss: () => void;
  onEmailSent: (email: string) => void;
}

export default function AddEmailPrompt({ user, mode = 'add', onDismiss, onEmailSent }: Props) {
  const [step, setStep]           = useState<'email' | 'code'>('email');
  const [email, setEmail]         = useState('');
  const [code, setCode]           = useState('');
  const [sending, setSending]     = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [msg, setMsg]             = useState<{ ok: boolean; text: string } | null>(null);
  const [showWarn, setShowWarn]   = useState(false);
  const [resendSecs, setResendSecs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startResendTimer = () => {
    setResendSecs(60);
    timerRef.current = setInterval(() => {
      setResendSecs((s) => {
        if (s <= 1) { clearInterval(timerRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const sendCode = async () => {
    if (!email.trim()) return setMsg({ ok: false, text: 'Please enter an email address.' });
    setSending(true); setMsg(null);
    try {
      const res = await authApi.requestEmail(email.trim());
      setMsg((res as any).pending ? { ok: false, text: (res as any).message } : null);
      setStep('code');
      setCode('');
      if (!(res as any).pending) startResendTimer();
    } catch (e: any) {
      const msg: string = e.message ?? '';
      if (msg.startsWith('RATE_LIMIT:')) {
        setMsg({ ok: false, text: msg.replace('RATE_LIMIT:', '').trim() });
        setStep('code');
        setCode('');
      } else {
        setMsg({ ok: false, text: msg || 'Failed to send verification code.' });
      }
    } finally {
      setSending(false);
    }
  };

  const resendCode = async () => {
    if (resendSecs > 0) return;
    setSending(true); setMsg(null);
    try {
      await authApi.requestEmail(email.trim());
      setMsg({ ok: true, text: 'A new code has been sent.' });
      startResendTimer();
    } catch (e: any) {
      setMsg({ ok: false, text: e.message ?? 'Failed to resend code.' });
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) return setMsg({ ok: false, text: 'Please enter the 6-digit code.' });
    setVerifying(true); setMsg(null);
    try {
      const res = await authApi.verifyEmailCode(code.trim());
      setMsg({ ok: true, text: res.message });
      setTimeout(() => onEmailSent(email), 1500);
    } catch (e: any) {
      setMsg({ ok: false, text: e.message ?? 'Verification failed.' });
    } finally {
      setVerifying(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={mode === 'change' ? onDismiss : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`${mode === 'change' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'} p-2 rounded-lg`}>
              <Mail size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{mode === 'change' ? 'Change Email Address' : 'Add Email Address'}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {step === 'email'
                  ? (mode === 'change' ? 'Enter your new email address' : 'Required for notifications and full access')
                  : `Enter the code sent to ${email}`}
              </p>
            </div>
          </div>
          {mode === 'change' && (
            <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {step === 'email' && (
            <>
              {mode === 'add' && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>
                    Your account doesn't have an email address yet. Without an email you won't receive notifications or be able to recover your account.
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-500 block mb-1 font-medium">Email Address</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  onKeyDown={(e) => e.key === 'Enter' && sendCode()}
                  autoFocus
                />
              </div>

              {msg && (
                <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${msg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {msg.ok ? <CheckCircle size={16} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />}
                  <span>{msg.text}</span>
                </div>
              )}

              {mode === 'change' ? (
                <div className="flex gap-2">
                  <button onClick={onDismiss}
                    className="px-4 py-2.5 text-sm border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg font-medium">
                    Cancel
                  </button>
                  <button onClick={sendCode} disabled={sending}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-semibold">
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                    {sending ? 'Sending...' : 'Send Verification Code'}
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={sendCode} disabled={sending}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-semibold">
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                    {sending ? 'Sending...' : 'Send Verification Code'}
                  </button>

                  {!showWarn ? (
                    <button onClick={() => setShowWarn(true)}
                      className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                      Skip for now
                    </button>
                  ) : (
                    <div className="border border-orange-200 rounded-lg p-3 bg-orange-50 space-y-2">
                      <div className="flex items-start gap-2 text-sm text-orange-800">
                        <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
                        <span>You will not receive any notifications. This prompt will appear on every login until you add an email. Are you sure?</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={onDismiss}
                          className="flex-1 py-2 text-sm bg-orange-100 hover:bg-orange-200 text-orange-800 font-medium rounded-lg">
                          Yes, add email later
                        </button>
                        <button onClick={() => setShowWarn(false)}
                          className="flex-1 py-2 text-sm border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg">
                          Go back
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {step === 'code' && (
            <>
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <Mail size={16} className="mt-0.5 flex-shrink-0" />
                <span>A 6-digit code was sent to <strong>{email}</strong>. Enter it below.</span>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1 font-medium">Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg text-2xl font-bold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  onKeyDown={(e) => e.key === 'Enter' && verifyCode()}
                  autoFocus
                />
              </div>

              {msg && (
                <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${msg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {msg.ok ? <CheckCircle size={16} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />}
                  <span>{msg.text}</span>
                </div>
              )}

              <button onClick={verifyCode} disabled={verifying || code.length !== 6}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-semibold">
                {verifying ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {verifying ? 'Verifying...' : 'Verify Code'}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button onClick={() => { setStep('email'); setMsg(null); setCode(''); }}
                  className="text-gray-400 hover:text-gray-600">
                  ← Change email
                </button>
                <button onClick={resendCode} disabled={resendSecs > 0 || sending}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed">
                  <RefreshCw size={13} />
                  {resendSecs > 0 ? `Resend in ${resendSecs}s` : 'Resend code'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

