import React, { useState } from 'react';
import { UserRole } from '../App';
import {
  Home,
  Clock,
  DollarSign,
  Users,
  UserCircle,
  Settings,
  ChevronRight,
  Wifi,
  X,
} from 'lucide-react';

interface SidebarProps {
  userRole: UserRole;
  activePage: string;
  onNavigate: (page: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ userRole, activePage, onNavigate, mobileOpen = false, onMobileClose }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const allMenuItems = [
    { icon: Home,       label: 'Dashboard',  page: 'dashboard',  color: 'text-blue-500', roles: null },
    { icon: Clock,      label: 'Attendance', page: 'attendance', color: 'text-blue-500', roles: null },
    { icon: DollarSign, label: 'Payroll',    page: 'payroll',    color: 'text-blue-500', roles: ['admin', 'employee', 'management', 'superadmin'] },
    { icon: Users,      label: 'Employees',  page: 'employees',  color: 'text-blue-500', roles: ['admin', 'supervisor', 'management', 'superadmin'] },
    { icon: UserCircle, label: 'My Profile', page: 'profile',    color: 'text-blue-500', roles: null },
    { icon: Settings,   label: 'Settings',   page: 'settings',   color: 'text-blue-500', roles: null },
    { icon: Wifi,       label: 'Biometric',  page: 'biometric',  color: 'text-blue-500', roles: ['admin', 'superadmin'] },
  ];

  const menuItems = allMenuItems.filter(
    (item) => !item.roles || item.roles.includes(userRole as string)
  );

  const navItems = (expanded: boolean, onItemClick?: () => void) =>
    menuItems.map((item) => {
      const Icon = item.icon;
      const isActive = activePage === item.page;
      return (
        <button
          key={item.page}
          onClick={() => { onNavigate(item.page); onItemClick?.(); }}
          className={`w-full flex items-center py-3 rounded-lg
            transition-all duration-200 group/item
            ${expanded ? 'space-x-4 px-4' : 'justify-center px-2'}
            ${isActive
              ? 'text-white shadow-md'
              : `hover:bg-blue-50 ${item.color}`
            }`}
          style={isActive ? { backgroundColor: 'var(--brand-primary)', color: 'var(--brand-primary-fg)' } : undefined}
        >
          <Icon size={24} className="flex-shrink-0" />
          <span
            className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
              expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
            } ${isActive ? 'text-white' : 'text-gray-700'}`}
          >
            {item.label}
          </span>
          {expanded && !isActive && (
            <ChevronRight
              size={16}
              className="ml-auto text-gray-400 opacity-0 group-hover/item:opacity-100 transition-opacity"
            />
          )}
        </button>
      );
    });

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <aside
        className={`hidden md:flex flex-col bg-white shadow-lg transition-all duration-300 ease-in-out sticky top-0 self-start h-screen overflow-y-auto ${
          isExpanded ? 'w-64' : 'w-20'
        } relative group`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex-1 space-y-2">
            {navItems(isExpanded)}
          </div>
          <div className={`mt-4 pt-4 border-t border-gray-200 ${
            isExpanded ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-300`} />
        </div>
      </aside>

      {/* Mobile drawer — full-screen overlay, only visible when mobileOpen */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <aside className="fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 md:hidden flex flex-col overflow-y-auto">
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
              <span className="font-semibold text-gray-700 text-sm">Menu</span>
              <button
                onClick={onMobileClose}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 p-3 space-y-1">
              {navItems(true, onMobileClose)}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
