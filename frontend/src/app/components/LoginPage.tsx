import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, LogIn, Briefcase, Mail, MessageSquare, ArrowLeft, CheckCircle, AlertCircle, Loader2, KeyRound, Send, X } from 'lucide-react';
import { authApi, publicApi, prewarmChallenge } from '../../lib/api';

interface LoginPageProps {
  onLogin: (username: string, password: string) => void;
  error?: string;
}

// ── Password Strength Indicator ────────────────────────────────────────────────
export function PasswordStrength({ password, className = '' }: { password: string; className?: string }) {
  if (!password) return null;

  let score = 0;
  if (password.length >= 8)           score++;
  if (password.length >= 12)          score++;
  if (/[a-z]/.test(password))         score++;
  if (/[A-Z]/.test(password))         score++;
  if (/\d/.test(password))            score++;
  if (/[^a-zA-Z0-9]/.test(password))  score++;

  const levels = [
    { label: 'Very Weak',   barColor: 'bg-red-500',     textColor: 'text-red-600'     },
    { label: 'Very Weak',   barColor: 'bg-red-500',     textColor: 'text-red-600'     },
    { label: 'Weak',        barColor: 'bg-orange-400',  textColor: 'text-orange-600'  },
    { label: 'Fair',        barColor: 'bg-yellow-400',  textColor: 'text-yellow-600'  },
    { label: 'Good',        barColor: 'bg-blue-400',    textColor: 'text-blue-600'    },
    { label: 'Strong',      barColor: 'bg-green-400',   textColor: 'text-green-600'   },
    { label: 'Very Strong', barColor: 'bg-emerald-500', textColor: 'text-emerald-700' },
  ];
  const lvl = levels[Math.min(score, 6)];
  const bars = Math.max(1, Math.ceil((score / 6) * 5));

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex gap-1">
        {[0,1,2,3,4].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < bars ? lvl.barColor : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${lvl.textColor}`}>{lvl.label}</p>
    </div>
  );
}

// ── Main LoginPage ─────────────────────────────────────────────────────────────
export default function LoginPage({ onLogin, error: serverError }: LoginPageProps) {
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError]   = useState('');

  // Forgot password flow
  type ForgotStep = null | 'lookup' | 'choose' | 'email' | 'email-sent' | 'ticket' | 'ticket-sent';
  const [forgotStep, setForgotStep]           = useState<ForgotStep>(null);
  const [forgotId, setForgotId]               = useState('');
  const [forgotMsg, setForgotMsg]             = useState('');
  const [forgotLoading, setForgotLoading]     = useState(false);
  const [forgotError, setForgotError]         = useState('');
  const [forgotSuccess, setForgotSuccess]     = useState('');
  const [forgotHasEmail, setForgotHasEmail]   = useState(false);
  const [forgotMaskedEmail, setForgotMaskedEmail] = useState<string | null>(null);

  // Company branding
  const [companyName, setCompanyName] = useState('Attendance & Payroll');
  const [logoUrl, setLogoUrl]         = useState<string | null>(null);
  const [bgImageUrl, setBgImageUrl]   = useState<string | null>(null);

  useEffect(() => {
    // Solve the InfinityFree anti-bot challenge before any API call fires,
    // so branding and login requests are never intercepted.
    prewarmChallenge().then(() =>
      publicApi.companyBranding()
        .then(({ data }) => {
          if (data.company_name) setCompanyName(data.company_name);
          if (data.logo_url)     setLogoUrl(data.logo_url);
          if (data.bg_image_url) setBgImageUrl(data.bg_image_url);
        })
        .catch(() => {})
    );
  }, []);

  const error = localError || serverError || '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!username || !password) {
      setLocalError('Please enter both username and password.');
      return;
    }
    onLogin(username, password);
  };

  const openForgot = () => {
    setForgotStep('lookup');
    setForgotId('');
    setForgotMsg('');
    setForgotError('');
    setForgotSuccess('');
    setForgotHasEmail(false);
    setForgotMaskedEmail(null);
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotId.trim()) { setForgotError('Please enter your username or email.'); return; }
    setForgotLoading(true); setForgotError('');
    try {
      const res = await authApi.checkAccount(forgotId.trim());
      setForgotHasEmail(res.has_email);
      setForgotMaskedEmail(res.masked_email);
      setForgotStep('choose');
    } catch (err: any) {
      setForgotError(err.message ?? 'No account found with that username or email.');
    } finally { setForgotLoading(false); }
  };

  const closeForgot = () => setForgotStep(null);

  const handleEmailReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true); setForgotError('');
    try {
      const res = await authApi.forgotPasswordEmail(forgotId.trim());
      setForgotSuccess(res.message);
      setForgotStep('email-sent');
    } catch (err: any) {
      setForgotError(err.message ?? 'Failed to send reset email. Please try again.');
    } finally { setForgotLoading(false); }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true); setForgotError('');
    try {
      const res = await authApi.forgotPasswordTicket(forgotId.trim(), forgotMsg.trim() || undefined);
      setForgotSuccess(res.message);
      setForgotStep('ticket-sent');
    } catch (err: any) {
      setForgotError(err.message ?? 'Failed to submit request. Please try again.');
    } finally { setForgotLoading(false); }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4"
      style={bgImageUrl ? {
        backgroundImage: `url(${bgImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      } : undefined}
    >
      {/* No overlay -- keep background image at original brightness */}
      {!bgImageUrl && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 pointer-events-none" />
      )}
      <div className="w-full max-w-md relative z-10">

        {/* Single Panel */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Logo / Header */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 px-7 pt-8 pb-6 text-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={companyName}
                className="w-28 h-28 mx-auto rounded-full shadow-xl object-cover border-4 border-white/30 mb-4"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="inline-flex items-center justify-center w-28 h-28 bg-white/20 rounded-full shadow-xl border-4 border-white/30 mb-4">
                <Briefcase size={52} className="text-white" />
              </div>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{companyName}</h1>
            <p className="text-blue-100 text-sm">Sign in to access your account</p>
          </div>

          {/* Form */}
          <div className="p-7">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setLocalError(''); }}
                  placeholder="Enter your username or email"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLocalError(''); }}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Forgot Password link (no Remember Me) */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={openForgot}
                className="text-sm text-blue-500 hover:text-blue-600 font-semibold"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
            >
              <span>Sign In</span>
              <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          </div>

          {/* Footer */}
          <p className="text-center py-3 text-xs text-gray-400 border-t border-gray-100">
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Forgot Password Modal ── */}
      {forgotStep !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeForgot} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 text-blue-600 rounded-lg p-2">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">
                    {forgotStep === 'lookup'       ? 'Forgot Password'
                    : forgotStep === 'choose'      ? 'Choose Recovery Method'
                    : forgotStep === 'email'       ? 'Reset via Email'
                    : forgotStep === 'email-sent'  ? 'Email Sent'
                    : forgotStep === 'ticket'      ? 'Request Admin Reset'
                    :                               'Request Submitted'}
                  </h3>
                  <p className="text-xs text-gray-500">Account recovery</p>
                </div>
              </div>
              <button onClick={closeForgot} className="text-gray-400 hover:text-gray-600 p-1 rounded">
                <X size={20} />
              </button>
            </div>

            <div className="p-5">

              {/* Step 0: Lookup account */}
              {forgotStep === 'lookup' && (
                <form onSubmit={handleLookup} className="space-y-4">
                  <p className="text-sm text-gray-600">Enter your username or email address to begin account recovery.</p>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Username or Email</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        autoFocus
                        value={forgotId}
                        onChange={(e) => { setForgotId(e.target.value); setForgotError(''); }}
                        placeholder="username or email@example.com"
                        className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm transition-colors"
                      />
                    </div>
                  </div>
                  {forgotError && (
                    <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} />{forgotError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
                  >
                    {forgotLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                    {forgotLoading ? 'Checking...' : 'Next'}
                  </button>
                </form>
              )}

              {/* Step 1: Choose method */}
              {forgotStep === 'choose' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">How would you like to recover your account?</p>

                  {forgotHasEmail ? (
                    <button
                      onClick={() => { setForgotStep('email'); setForgotError(''); }}
                      className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all text-left group"
                    >
                      <div className="bg-blue-100 text-blue-600 rounded-lg p-2.5 flex-shrink-0 group-hover:bg-blue-200">
                        <Mail size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">Send to my email</p>
                        <p className="text-xs text-gray-500 mt-0.5">A temporary password will be sent to <span className="font-medium text-gray-700">{forgotMaskedEmail}</span>.</p>
                      </div>
                    </button>
                  ) : (
                    <div className="w-full flex items-center gap-4 p-4 border-2 border-gray-100 rounded-xl opacity-50 cursor-not-allowed">
                      <div className="bg-gray-100 text-gray-400 rounded-lg p-2.5 flex-shrink-0">
                        <Mail size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-500 text-sm">Send to my email</p>
                        <p className="text-xs text-gray-400 mt-0.5">No email address is registered to this account.</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => { setForgotStep('ticket'); setForgotError(''); setForgotMsg(''); }}
                    className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 rounded-xl transition-all text-left group"
                  >
                    <div className="bg-purple-100 text-purple-600 rounded-lg p-2.5 flex-shrink-0 group-hover:bg-purple-200">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">Send a ticket to admin</p>
                      <p className="text-xs text-gray-500 mt-0.5">Submit a reset request. The admin will generate a new password for you.</p>
                    </div>
                  </button>
                </div>
              )}

              {/* Step 2a: Email reset confirmation */}
              {forgotStep === 'email' && (
                <form onSubmit={handleEmailReset} className="space-y-4">
                  <p className="text-sm text-gray-600">A temporary password will be sent to your registered email address.</p>
                  <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                    <Mail size={16} className="text-blue-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-blue-800">{forgotMaskedEmail}</span>
                  </div>
                  {forgotError && (
                    <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} />{forgotError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep('choose')}
                      className="flex items-center gap-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
                    >
                      {forgotLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      {forgotLoading ? 'Sending...' : 'Send Password'}
                    </button>
                  </div>
                </form>
              )}

              {/* Step: Email sent success */}
              {forgotStep === 'email-sent' && (
                <div className="text-center space-y-4 py-3">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100">
                    <CheckCircle size={28} className="text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Check Your Email</h4>
                    <p className="text-sm text-gray-600">{forgotSuccess}</p>
                  </div>
                  <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                    You will be required to change this password when you log in.
                  </p>
                  <button
                    onClick={closeForgot}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              )}

              {/* Step 2b: Admin ticket form */}
              {forgotStep === 'ticket' && (
                <form onSubmit={handleTicketSubmit} className="space-y-4">
                  <p className="text-sm text-gray-600">A reset request will be submitted for your account. The admin will generate a new password for you.</p>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Additional Message <span className="font-normal text-gray-400">(optional)</span></label>
                    <textarea
                      value={forgotMsg}
                      onChange={(e) => setForgotMsg(e.target.value)}
                      placeholder="Describe your situation (optional)..."
                      rows={2}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 text-sm resize-none transition-colors"
                    />
                  </div>
                  {forgotError && (
                    <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} />{forgotError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep('choose')}
                      className="flex items-center gap-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
                    >
                      {forgotLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      {forgotLoading ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              )}

              {/* Step: Ticket submitted */}
              {forgotStep === 'ticket-sent' && (
                <div className="text-center space-y-4 py-3">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-100">
                    <CheckCircle size={28} className="text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Request Submitted</h4>
                    <p className="text-sm text-gray-600">{forgotSuccess}</p>
                  </div>
                  <button
                    onClick={closeForgot}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
