import React, { useState } from 'react';
import { Sparkles, UserCircle, ShieldCheck, Crown } from 'lucide-react';
import { UserRole } from '../App';

interface WelcomeCardProps {
  userName: string;
  userRole?: UserRole;
  baseRole?: UserRole;
  userId?: number;
}

export default function WelcomeCard({ userName, userRole, baseRole, userId }: WelcomeCardProps) {
  const firstName = userName.split(' ')[0] || userName;

  // Detect first-time login per user (persisted in localStorage)
  const [isFirstTime] = useState<boolean>(() => {
    if (!userId) return false;
    const key = `fch_seen_${userId}`;
    const seen = !!localStorage.getItem(key);
    if (!seen) localStorage.setItem(key, '1');
    return !seen;
  });

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: '2-digit'
  });

  // Check if user is viewing employee dashboard while being supervisor/admin
  const isViewingAsEmployee = userRole === 'employee' && baseRole && baseRole !== 'employee';

  const getMessage = () => {
    if (isViewingAsEmployee) {
      return "Managing your personal tasks and requests. Switch views above to access your team management features.";
    }
    switch (userRole) {
      case 'admin':
        return "You have full system access. Manage employees, payroll, and oversee all operations.";
      case 'supervisor':
        return "Manage your team's attendance and approve requests below.";
      default:
        return "Ready to make today productive? Check your requests and updates below.";
    }
  };

  return (
    <div
      className="rounded-2xl shadow-xl p-6 md:p-8 text-white relative overflow-hidden"
      style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--brand-primary-fg)' }}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
      
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <div className="flex items-center space-x-3">
            <Sparkles size={28} className="md:w-8 md:h-8" />
            <h2 className="text-2xl md:text-4xl font-bold">
              {isFirstTime ? `Welcome, ${firstName}!` : `Welcome back, ${firstName}!`}
            </h2>
          </div>
          
          {isViewingAsEmployee && (
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <UserCircle size={18} />
              <span className="text-sm font-semibold">Employee View</span>
              {baseRole === 'admin' && <Crown size={16} className="ml-1" />}
              {baseRole === 'supervisor' && <ShieldCheck size={16} className="ml-1" />}
            </div>
          )}
        </div>
        
        <p className="text-base md:text-lg" style={{ color: 'var(--brand-primary-light)' }}>{currentDate}</p>
        <p className="text-white/90 mt-3 text-sm md:text-base">{getMessage()}</p>
      </div>
    </div>
  );
}
