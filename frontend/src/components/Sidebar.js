import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Logo } from './Logo';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Plane, 
  CalendarCheck, 
  CreditCard, 
  FileText, 
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

const Sidebar = () => {
  const { user, logout, hasRole } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { 
      path: '/dashboard', 
      icon: LayoutDashboard, 
      label: t('dashboard'),
      roles: ['super_admin', 'branch_manager', 'sales', 'marketing', 'operations', 'finance']
    },
    { 
      path: '/leads', 
      icon: UserCheck, 
      label: t('leads'),
      roles: ['super_admin', 'branch_manager', 'sales', 'marketing']
    },
    { 
      path: '/customers', 
      icon: Users, 
      label: t('customers'),
      roles: ['super_admin', 'branch_manager', 'sales', 'marketing', 'operations']
    },
    { 
      path: '/trips', 
      icon: Plane, 
      label: t('trips'),
      roles: ['super_admin', 'branch_manager', 'sales', 'operations']
    },
    { 
      path: '/bookings', 
      icon: CalendarCheck, 
      label: t('bookings'),
      roles: ['super_admin', 'branch_manager', 'sales', 'operations']
    },
    { 
      path: '/payments', 
      icon: CreditCard, 
      label: t('payments'),
      roles: ['super_admin', 'branch_manager', 'sales', 'finance']
    },
    { 
      path: '/documents', 
      icon: FileText, 
      label: t('documents'),
      roles: ['super_admin', 'branch_manager', 'operations']
    },
    { 
      path: '/users', 
      icon: Users, 
      label: t('users'),
      roles: ['super_admin', 'branch_manager']
    },
  ];

  const filteredMenu = menuItems.filter(item => hasRole(item.roles));

  return (
    <aside className="w-64 bg-white border-r border-slate-100 h-screen flex flex-col" data-testid="sidebar">
      <div className="p-6 border-b border-slate-100">
        <Logo />
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-1">
          {filteredMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              data-testid={`nav-${item.path.slice(1)}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <item.icon size={20} />
              <span className="flex-1">{item.label}</span>
              <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          ))}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
            <span className="text-violet-700 font-semibold text-sm">
              {user?.full_name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-500 truncate">{t(user?.role)}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          data-testid="logout-btn"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all w-full"
        >
          <LogOut size={20} />
          <span>{t('logout')}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
