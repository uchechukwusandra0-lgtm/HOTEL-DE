import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  BedDouble, 
  CreditCard, 
  Bell, 
  User, 
  HelpCircle, 
  LogOut 
} from 'lucide-react';
import { AuthService } from '../../services/auth';

const menuItems = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { name: 'My Bookings', path: '/dashboard/bookings', icon: Calendar },
  { name: 'Find a Room', path: '/dashboard/rooms', icon: BedDouble },
  { name: 'My Payments', path: '/dashboard/payments', icon: CreditCard },
  { name: 'Notifications', path: '/dashboard/notifications', icon: Bell },
  { name: 'My Profile', path: '/dashboard/profile', icon: User },
  { name: 'Help & Support', path: '/dashboard/support', icon: HelpCircle },
];

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await AuthService.signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A1A2F] text-white hidden md:flex flex-col">
        <div className="p-6">
          <h2 className="text-[#C9A24B] font-serif text-xl font-bold">Hotel De Port</h2>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-[#C9A24B] text-[#0A1A2F]' : 'hover:bg-[#162942]'
                }`
              }
              end={item.path === '/dashboard'}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.name}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-[#162942]">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#162942] transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-slate-200 py-4 px-8 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-[#0A1A2F]">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">Welcome, Guest</span>
          </div>
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
};
