import React from 'react';
import { useCompany } from '../context/CompanyContext';

export default function Footer() {
  const { profile } = useCompany();
  return (
    <footer
      className="text-white py-4 shadow-lg"
      style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--brand-primary-fg)' }}
    >
      <div className="px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <p className="text-sm">Attendance and Payroll System</p>
        </div>

        <div className="flex items-center space-x-2 text-sm">
          <span>© {new Date().getFullYear()} {profile.company_name}. All rights reserved.</span>
        </div>

        <div className="flex items-center space-x-4 text-sm">
          <span></span>
          <a href="#" className="hover:opacity-70 transition-opacity">Help</a>
          <span>|</span>
          <a href="#" className="hover:opacity-70 transition-opacity">About</a>
        </div>
      </div>
    </footer>
  );
}
