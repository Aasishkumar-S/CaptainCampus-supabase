import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Bus,
  User,
  Route as RouteIcon,
  MapPinned,
  Satellite,
  CalendarClock,
  GraduationCap,
  Megaphone,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Live Map', path: '/live-map', icon: MapPin },
  { name: 'Buses', path: '/buses', icon: Bus },
  { name: 'Drivers', path: '/drivers', icon: User },
  { name: 'Routes', path: '/routes', icon: RouteIcon },
  { name: 'Stops', path: '/stops', icon: MapPinned },
  { name: 'GPS Devices', path: '/gps-devices', icon: Satellite },
  { name: 'Trips', path: '/trips', icon: CalendarClock },
  { name: 'Students', path: '/students', icon: GraduationCap },
  { name: 'Announcements', path: '/announcements', icon: Megaphone },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const AdminLayout: React.FC = () => {
  const { userProfile, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Find page title based on current path
  const currentNavItem = navItems.find((item) =>
    item.path === '/dashboard'
      ? location.pathname === '/dashboard' || location.pathname === '/'
      : location.pathname.startsWith(item.path)
  );
  const pageTitle = currentNavItem ? currentNavItem.name : 'Admin Portal';

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getUserInitials = (name?: string) => {
    if (!name) return 'AD';
    return name
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex text-slate-800 dark:text-slate-100 font-sans">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop fixed, Mobile off-canvas) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-gradient-to-b from-indigo-950 via-slate-950 to-indigo-950 text-slate-200 flex flex-col border-r border-indigo-900/40 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo and Brand */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-indigo-900/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Captain <span className="text-indigo-400 font-extrabold">Campus</span>
              </div>
              <div className="text-[11px] font-medium tracking-wide uppercase text-indigo-300/70">
                Transportation Ops
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-indigo-300/50">
            Operations & Fleet
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/dashboard'
                ? location.pathname === '/dashboard' || location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-300'
                  }`}
                />
                <span>{item.name}</span>
                {item.name === 'Live Map' && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Sidebar Footer / User Profile */}
        <div className="p-4 border-t border-indigo-900/30 bg-black/20">
          <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-inner">
                {getUserInitials(userProfile?.name)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  {userProfile?.name || 'Administrator'}
                </div>
                <div className="text-[11px] font-medium text-indigo-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="capitalize">{userProfile?.role?.replace('_', ' ') || 'Admin'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72 min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg focus-ring"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {pageTitle}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Campus fleet monitoring & route coordination
              </p>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors focus-ring"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors relative focus-ring"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-ring"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-medium text-xs flex items-center justify-center">
                  {getUserInitials(userProfile?.name)}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                    {userProfile?.name || 'Administrator'}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    {userProfile?.email || 'admin@campus.edu'}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 z-50 animate-fadeIn"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/60">
                    <p className="text-xs font-medium text-slate-400 uppercase">Signed in as</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {userProfile?.email}
                    </p>
                  </div>
                  <NavLink
                    to="/settings"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Settings</span>
                  </NavLink>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto animate-fadeIn">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
