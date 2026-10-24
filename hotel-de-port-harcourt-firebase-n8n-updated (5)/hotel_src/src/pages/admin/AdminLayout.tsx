// src/pages/admin/AdminLayout.tsx
// Master Operations Layout for Hotel De Port Harcourt Staff Admin

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  CreditCard,
  MessageSquare,
  Wrench,
  Star,
  ShoppingBag,
  FileText,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Shield,
  RotateCcw,
  Clock,
  Sparkles,
  Webhook
} from 'lucide-react';
import { AuthService } from '../../services/auth.ts';
import { useToast } from '../../components/ui/Toast.tsx';

// Tabs
import { DashboardTab } from './DashboardTab.tsx';
import { BookingsTab } from './BookingsTab.tsx';
import { PaymentsTab } from './PaymentsTab.tsx';
import { EnquiriesTab } from './EnquiriesTab.tsx';
import { MaintenanceTab } from './MaintenanceTab.tsx';
import { ReviewsTab } from './ReviewsTab.tsx';
import { AbandonedTab } from './AbandonedTab.tsx';
import { ReportsTab } from './ReportsTab.tsx';
import { N8nSettingsTab } from './N8nSettingsTab.tsx';

type TabId =
  | 'dashboard'
  | 'bookings'
  | 'payments'
  | 'enquiries'
  | 'maintenance'
  | 'reviews'
  | 'abandoned'
  | 'reports'
  | 'n8n-settings';

interface TabItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const TABS: TabItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'enquiries', label: 'Enquiries & Chatbot', icon: MessageSquare },
  { id: 'maintenance', label: 'Housekeeping & Maintenance', icon: Wrench, badge: 'Urgent' },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'abandoned', label: 'Abandoned Bookings', icon: ShoppingBag },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'n8n-settings', label: 'n8n Webhook Settings', icon: Webhook, badge: 'Direct' }
];

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // 1. Auth Protection check
  const isAuthenticated = AuthService.isAdminAuthenticated();
  const adminUser = AuthService.getAdminUser();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Port Harcourt (WAT) live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-GB', {
          timeZone: 'Africa/Lagos',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await AuthService.logout();
    success('Logged out successfully.');
    navigate('/admin/login', { replace: true });
  };

  const handleClearRecords = () => {
    error('Bulk deletion is disabled for safety. Delete test records directly in Firebase Console after confirming the project and collection.');
  };

  if (!isAuthenticated) {
    return null;
  }

  const currentTabObj = TABS.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#1E293B] flex flex-col lg:flex-row">
      {/* =====================================
          LEFT SIDEBAR (Navy #0A1A2F, Gold #C9A24B active state)
          ===================================== */}
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0A1A2F] text-white border-r border-[#C9A24B]/30 shrink-0 select-none">
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A24B] to-[#9F7B2B] flex items-center justify-center text-[#0A1A2F] font-serif font-black text-lg shadow-md">
            HD
          </div>
          <div>
            <h1 className="font-serif font-bold text-sm tracking-wide text-white leading-tight">
              Hotel De Port
            </h1>
            <span className="text-[10px] text-[#C9A24B] uppercase tracking-wider font-semibold">
              Staff Operations PMS
            </span>
          </div>
        </div>

        {/* Navigation Tabs List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#C9A24B] text-[#0A1A2F] shadow-md font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#0A1A2F]' : 'text-[#C9A24B]'}`} />
                  <span className="truncate">{tab.label}</span>
                </div>
                {tab.badge && !isActive && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                    tab.id === 'n8n-settings'
                      ? 'bg-[#C9A24B]/20 text-amber-200 border border-[#C9A24B]/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer (Admin details & actions) */}
        <div className="p-4 border-t border-white/10 bg-[#06101E]/60 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#C9A24B]/20 text-[#C9A24B] border border-[#C9A24B]/30 flex items-center justify-center font-bold text-xs uppercase">
              {adminUser?.name
                ? adminUser.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .slice(0, 2)
                : 'SU'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {adminUser?.name || 'Sandra Uchechukwu'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {adminUser?.email || 'uchechukwusandra0@gmail.com'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleClearRecords}
              title="Bulk deletion disabled for safety"
              className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-medium flex items-center justify-center gap-1 transition-colors border border-white/10 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-[#C9A24B]" />
              <span>Clear Records</span>
            </button>
            <button
              onClick={handleLogout}
              className="py-1.5 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors border border-rose-500/20 cursor-pointer"
              title="Logout session"
            >
              <LogOut className="w-3 h-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-72 bg-[#0A1A2F] text-white flex flex-col h-full shadow-2xl z-10">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#C9A24B] flex items-center justify-center text-[#0A1A2F] font-serif font-bold text-sm">
                  HD
                </div>
                <span className="font-serif font-bold text-sm text-white">
                  Hotel De Port
                </span>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                      isActive
                        ? 'bg-[#C9A24B] text-[#0A1A2F] font-bold'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-[#C9A24B]" />
                      <span>{tab.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/10 space-y-2">
              <button
                onClick={handleLogout}
                className="w-full py-2 rounded-xl bg-rose-500/10 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Logout Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================
          MAIN CONTENT AREA & TOP BAR
          ===================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-xs px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="font-serif text-lg sm:text-xl font-bold text-[#0A1A2F] leading-tight">
                {currentTabObj?.label || 'Staff Operations'}
              </h1>
              <span className="text-[11px] text-slate-500">
                Hotel De Port • GRA Phase 2
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Clock (WAT) */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-semibold text-slate-700">
              <Clock className="w-3.5 h-3.5 text-[#C9A24B]" />
              <span>{currentTime} WAT</span>
            </div>

            {/* Quick jump to public hotel website */}
            <Link
              to="/"
              target="_blank"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Open public website in new tab"
            >
              <span>Public Website</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </Link>

            {/* User Badge */}
            <div className="hidden md:flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-[#0A1A2F] text-[#C9A24B] flex items-center justify-center font-bold text-xs">
                TB
              </div>
              <div className="text-left text-xs">
                <span className="font-bold text-[#0A1A2F] block leading-tight">
                  {adminUser?.name || 'Tonye Briggs'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {adminUser?.role || 'General Manager'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="hidden sm:flex p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Tab Content Container */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && <DashboardTab onNavigateTab={tab => setActiveTab(tab as TabId)} />}
          {activeTab === 'bookings' && <BookingsTab />}
          {activeTab === 'payments' && <PaymentsTab />}
          {activeTab === 'enquiries' && <EnquiriesTab />}
          {activeTab === 'maintenance' && <MaintenanceTab />}
          {activeTab === 'reviews' && <ReviewsTab />}
          {activeTab === 'abandoned' && <AbandonedTab />}
          {activeTab === 'reports' && <ReportsTab />}
          {activeTab === 'n8n-settings' && <N8nSettingsTab />}
        </main>
      </div>
    </div>
  );
};
