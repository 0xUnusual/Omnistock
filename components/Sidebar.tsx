
import React from 'react';
import { AppView, User } from '../types';

interface SidebarProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  isOpen: boolean;
  user: User;
  t: any;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isOpen, user, t }) => {
  const navItems = [
    { view: AppView.DASHBOARD, label: t.dashboard, icon: 'dashboard' },
    { view: AppView.INVENTORY, label: t.inventory, icon: 'inventory_2' },
    { view: AppView.SALES, label: t.sales, icon: 'point_of_sale' },
    { view: AppView.CLIENTS, label: t.clients, icon: 'groups' },
    { view: AppView.RECEIVABLES, label: t.receivables, icon: 'account_balance_wallet' },
    { view: AppView.REPORTS, label: t.reports, icon: 'assessment' },
    { view: AppView.SETTINGS, label: t.settings, icon: 'settings' },
  ];

  const orgName = user?.organization?.nombre || 'OmniStock';
  const orgLogo = user?.organization?.config?.logo_url;

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 lg:relative ${isOpen ? 'w-64 translate-x-0' : 'w-20 lg:translate-x-0 -translate-x-full'} bg-surface-light dark:bg-surface-dark border-r border-slate-200 dark:border-slate-800 flex-shrink-0 transition-all duration-300 flex flex-col shadow-sm`}>
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white shrink-0">
            <span className="material-icons text-xl">inventory_2</span>
          </div>
          {(isOpen || window.innerWidth >= 1024) && isOpen && <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white truncate">{orgName}</span>}
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scroll">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onViewChange(item.view)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${activeView === item.view
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
          >
            <span className={`material-icons text-xl ${activeView === item.view ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`}>
              {item.icon}
            </span>
            {isOpen && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-900/10 dark:bg-slate-50/5 border border-slate-200 dark:border-slate-800 overflow-hidden group hover:border-primary/50 transition-all">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold relative overflow-hidden shrink-0 shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
            {orgLogo ? <img src={orgLogo} alt="Logo" className="h-full w-full object-cover" /> : (orgName || '?').charAt(0).toUpperCase()}
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
              <h3 className="font-bold text-xs truncate text-slate-900 dark:text-white uppercase tracking-wider">{orgName}</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-medium mt-0.5">{user?.nombre || 'Admin'}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
