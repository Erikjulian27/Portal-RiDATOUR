import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useLanguage } from '../context/LanguageContext';

const Layout = ({ title }) => {
  const { t } = useLanguage();

  return (
    <div className="flex h-screen bg-slate-50" data-testid="app-layout">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title || t('dashboard')} />
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
