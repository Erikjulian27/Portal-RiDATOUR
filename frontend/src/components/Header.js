import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Bell, Search, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const Header = ({ title }) => {
  const { user } = useAuth();
  const { language, changeLanguage } = useLanguage();

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10" data-testid="header">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-heading font-semibold text-slate-900">{title}</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="Search..."
              className="pl-10 w-64 bg-slate-50 border-slate-200"
              data-testid="header-search"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="language-toggle">
                <Globe size={20} className="text-slate-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => changeLanguage('en')}
                className={language === 'en' ? 'bg-violet-50' : ''}
              >
                🇬🇧 English
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => changeLanguage('id')}
                className={language === 'id' ? 'bg-violet-50' : ''}
              >
                🇮🇩 Bahasa Indonesia
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="relative" data-testid="notifications-btn">
            <Bell size={20} className="text-slate-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
          </Button>

          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center">
              <span className="text-violet-700 font-semibold text-sm">
                {user?.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-slate-900">{user?.full_name}</p>
              <p className="text-xs text-slate-500">{user?.branch || 'All Branches'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
