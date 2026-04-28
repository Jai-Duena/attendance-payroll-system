import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import WelcomeCard from './components/WelcomeCard';
import BulletinBoard from './components/BulletinBoard';
import EmployeeContent from './components/EmployeeContent';
import SupervisorContent from './components/SupervisorContent';
import AdminContent from './components/AdminContent';
import RightSidebar from './components/RightSidebar';
import LoginPage from './components/LoginPage';
import AttendancePage from './components/AttendancePage';
import EmployeesPage from './components/EmployeesPage';
import MyProfilePage from './components/MyProfilePage';
import PayrollPage from './components/PayrollPage';
import SettingsPage from './components/SettingsPage';
import BiometricPage from './components/BiometricPage';
import ForcePasswordChange from './components/ForcePasswordChange';
import { CompanyProvider } from './context/CompanyContext';
import { ThemeProvider } from './context/ThemeContext';
import AddEmailPrompt from './components/AddEmailPrompt';
import { authApi, type User } from '@/lib/api';

export type UserRole = 'employee' | 'supervisor' | 'admin' | 'management' | 'superadmin';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser]           = useState<User | null>(null);
  const [userRole, setUserRole]   = useState<UserRole>('employee');
  const [baseRole, setBaseRole]   = useState<UserRole>('employee');
  const [userName, setUserName]   = useState('');
  const [userDept, setUserDept]   = useState('');
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [activePage, setActivePage]   = useState('dashboard');
  const [settingsSection, setSettingsSection] = useState<string | undefined>(undefined);
  const [profileDirty, setProfileDirty] = useState(false);

  const handleNavigate = (path: string) => {
    setMobileSidebarOpen(false);
    if (activePage === 'profile' && profileDirty) {
      if (!window.confirm('You have unsaved changes on your profile. Leave without saving?')) return;
      setProfileDirty(false);
    }
    const [page, section] = path.split(':');
    setActivePage(page);
    if (section) setSettingsSection(section);
    else setSettingsSection(undefined);
  };

  // Post-login flows
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [emailVerifiedBanner, setEmailVerifiedBanner] = useState(false);

  // Check for email verification redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('email_verified') === '1') {
      window.history.replaceState({}, '', '/');
      setEmailVerifiedBanner(true);
      setTimeout(() => setEmailVerifiedBanner(false), 6000);
    }
  }, []);

  // Restore session on page refresh — solve the InfinityFree anti-bot challenge
  // first so that me() and all subsequent fetch() calls go through cleanly.
  useEffect(() => {
    import('@/lib/api').then(({ prewarmChallenge, authApi: api }) =>
      prewarmChallenge()
        .then(() => api.me())
        .then(({ user: u }) => {
          applyUser(u);
          setIsAuthenticated(true);
        })
        .catch(() => {})
        .finally(() => setAuthChecked(true))
    );
  }, []);

  function applyUser(u: User) {
    setUser(u);
    setUserName(u.full_name);
    const r = u.role as UserRole;
    setUserRole(r); setBaseRole(r);
    setUserDept(u.department);
  }

  const handleLogin = async (username: string, password: string) => {
    setLoginError('');
    try {
      const { user: u } = await authApi.login(username, password);
      applyUser(u);
      setActivePage('dashboard');
      setSettingsSection(undefined);
      setIsAuthenticated(true);
      // Show add-email prompt if no email (dismissable)
      if (!u.has_email && !u.needs_password_change) {
        setShowAddEmail(true);
      }
    } catch (err: any) {
      setLoginError(err.message ?? 'Login failed');
    }
  };

  const handleLogout = async () => {
    await authApi.logout().catch(() => {});
    setIsAuthenticated(false);
    setUser(null);
    setUserName(''); setUserDept('');
    setUserRole('employee'); setBaseRole('employee');
    setActivePage('dashboard');
    setSettingsSection(undefined);
    setRightSidebarOpen(false);
    setShowAddEmail(false);
    setShowChangeEmail(false);
  };

  const handleUserUpdate = (u: User) => { applyUser(u); };

  if (!authChecked) return null;

  if (!isAuthenticated || !user) {
    return <LoginPage onLogin={handleLogin} error={loginError} />;
  }

  // Force password change -- full screen block
  if (user.needs_password_change) {
    return <ForcePasswordChange user={user} onDone={handleLogout} />;
  }

  // Management role is always read-only; also respect explicit flag for other roles
  const isReadOnly = baseRole === 'management' || (user.is_read_only ?? false);
  // Effective role: management/superadmin get elevated to admin for data access.
  // All other roles use userRole (the current view) so that admin in "Employee view"
  // is properly scoped to employee-level data and cannot delete others' records.
  const effectiveRole: UserRole = (userRole === 'management' || userRole === 'superadmin') ? 'admin' : userRole;

  const hideSidebar = activePage === 'attendance' || activePage === 'employees' || activePage === 'profile' || activePage === 'payroll' || activePage === 'settings' || activePage === 'biometric';

  return (
    <ThemeProvider>
    <CompanyProvider>
    <div className="min-h-screen bg-blue-50 flex flex-col">
      <Header
        userRole={userRole}
        baseRole={baseRole}
        setUserRole={setUserRole}
        userName={userName}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        photoUrl={user?.photo_url}
        userId={user?.id}
        userDept={userDept}
        onMobileSidebarToggle={() => setMobileSidebarOpen(v => !v)}
      />

      <div className="flex flex-1 relative">
        <Sidebar userRole={userRole} activePage={activePage} onNavigate={handleNavigate}
          mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
            {activePage === 'attendance' ? (
              <AttendancePage userRole={effectiveRole} userId={user?.id} userDept={userDept} isReadOnly={isReadOnly} />
            ) : activePage === 'employees' ? (
              <EmployeesPage userRole={effectiveRole} userDept={userDept} isReadOnly={isReadOnly} />
            ) : activePage === 'profile' ? (
              <MyProfilePage user={user} onUserUpdate={handleUserUpdate} onChangeEmail={() => setShowChangeEmail(true)} onDirtyChange={setProfileDirty} />
            ) : activePage === 'payroll' && userRole !== 'supervisor' ? (
              <PayrollPage userRole={effectiveRole} userId={user?.id} baseRole={effectiveRole} isReadOnly={isReadOnly} />
            ) : activePage === 'payroll' && userRole === 'supervisor' ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <p className="text-gray-500 text-sm mb-2">Payroll is not available in Supervisor mode.</p>
                <p className="text-gray-400 text-xs">Switch to <strong>Employee</strong> view to access your payslip.</p>
              </div>
            ) : activePage === 'settings' ? (
              <SettingsPage userRole={effectiveRole} scrollToSection={settingsSection} onSectionScrolled={() => setSettingsSection(undefined)} isReadOnly={isReadOnly} />
            ) : activePage === 'biometric' && (baseRole === 'admin' || baseRole === 'superadmin') ? (
              <BiometricPage />
            ) : (
              <>
                <WelcomeCard userName={user.first_name || userName} userRole={userRole} baseRole={baseRole} userId={user?.id} />
                <BulletinBoard userRole={userRole} baseRole={baseRole} userDept={userDept} userName={userName} isReadOnly={isReadOnly} />
                {userRole === 'employee'    && <EmployeeContent />}
                {userRole === 'supervisor'  && <SupervisorContent />}
                {userRole === 'admin'       && <AdminContent userRole={userRole} isReadOnly={isReadOnly} />}
                {userRole === 'management'  && <AdminContent userRole="admin" isReadOnly={true} />}
                {userRole === 'superadmin'  && <AdminContent userRole="admin" isReadOnly={false} />}
              </>
            )}
          </div>
        </main>

        {!hideSidebar && (
          <RightSidebar
            isOpen={rightSidebarOpen}
            onToggle={() => setRightSidebarOpen(!rightSidebarOpen)}
            userRole={baseRole}
            userId={user?.id ?? 0}
            userDept={userDept}
          />
        )}
      </div>

      <Footer />

      {/* Add Email prompt (dismissable, shown after login when no email) */}
      {showAddEmail && (
        <AddEmailPrompt
          user={user}
          onDismiss={() => setShowAddEmail(false)}
          onEmailSent={(_email) => {
            setShowAddEmail(false);
            authApi.me().then(({ user: u }) => applyUser(u)).catch(() => {});
            setEmailVerifiedBanner(true);
            setTimeout(() => setEmailVerifiedBanner(false), 6000);
          }}
        />
      )}

      {/* Change Email prompt (triggered from My Profile) */}
      {showChangeEmail && (
        <AddEmailPrompt
          user={user}
          onDismiss={() => setShowChangeEmail(false)}
          onEmailSent={(_email) => {
            setShowChangeEmail(false);
            authApi.me().then(({ user: u }) => applyUser(u)).catch(() => {});
            setEmailVerifiedBanner(true);
            setTimeout(() => setEmailVerifiedBanner(false), 6000);
          }}
        />
      )}

      {/* Email verified success banner */}
      {emailVerifiedBanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-green-600 text-white px-5 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top-2 fade-in duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
          <p className="text-sm font-semibold">Email address verified successfully!</p>
          <button onClick={() => setEmailVerifiedBanner(false)} className="ml-2 opacity-70 hover:opacity-100">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      )}
    </div>
    </CompanyProvider>
    </ThemeProvider>
  );
}
