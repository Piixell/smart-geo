import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  Calculator, 
  FileText, 
  CreditCard,
  Building2,
  FileCheck,
  FolderOpen,
  Users,
  Settings,
  MapPin
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  category: string;
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: Home,
    path: '/',
    category: 'main'
  },
  {
    label: 'Planner',
    icon: Calendar,
    path: '/planner',
    category: 'gestione'
  },
  {
    label: 'Contabilità',
    icon: Calculator,
    path: '/contabilita',
    category: 'gestione'
  },
  {
    label: 'Fatture non contabilizzate',
    icon: FileText,
    path: '/fatture-non-contabilizzate',
    category: 'gestione'
  },
  {
    label: 'Spese',
    icon: CreditCard,
    path: '/spese',
    category: 'gestione'
  },
  {
    label: 'Comune e Catasto',
    icon: Building2,
    path: '/comune-catasto',
    category: 'gestione'
  },
  {
    label: 'APE',
    icon: FileCheck,
    path: '/ape',
    category: 'gestione'
  },
  {
    label: 'Varie',
    icon: FolderOpen,
    path: '/varie',
    category: 'gestione'
  },
  {
    label: 'Rubrica',
    icon: Users,
    path: '/rubrica',
    category: 'gestione'
  },
  {
    label: 'Parametri',
    icon: Settings,
    path: '/parametri',
    category: 'settings'
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const gestioneItems = menuItems.filter(item => item.category === 'gestione');
  const mainItems = menuItems.filter(item => item.category === 'main');
  const settingsItems = menuItems.filter(item => item.category === 'settings');

  return (
    <>
      {/* Overlay per mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={clsx(
        'fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-all duration-300 ease-in-out flex flex-col',
        'lg:translate-x-0 lg:static lg:inset-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <MapPin className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Smart-Geo</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 flex-1 flex flex-col">
          <div className="flex-1">
            {/* Main Items */}
            <ul className="space-y-2 px-4">
              {mainItems.map((item) => (
                <SidebarItem
                  key={item.path}
                  item={item}
                  isActive={location.pathname === item.path}
                  onClose={onClose}
                />
              ))}
            </ul>

            {/* Gestione Section */}
            <div className="mt-8">
              <div className="px-4 mb-2">
                <span className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                  Gestione
                </span>
              </div>
              <ul className="space-y-2 px-4">
                {gestioneItems.map((item) => (
                  <SidebarItem
                    key={item.path}
                    item={item}
                    isActive={location.pathname === item.path}
                    onClose={onClose}
                  />
                ))}
              </ul>
            </div>
          </div>

          {/* Settings - Posizionato al fondo */}
          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
            <ul className="space-y-2 px-4 pb-4">
              {settingsItems.map((item) => (
                <SidebarItem
                  key={item.path}
                  item={item}
                  isActive={location.pathname === item.path}
                  onClose={onClose}
                />
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </>
  );
};

interface SidebarItemProps {
  item: MenuItem;
  isActive: boolean;
  onClose: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, isActive, onClose }) => {
  const { label, icon: Icon, path } = item;

  return (
    <li>
      <NavLink
        to={path}
        onClick={onClose}
        className={clsx(
          'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200',
          isActive 
            ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-r-2 border-primary-600' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
        )}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="font-medium">{label}</span>
      </NavLink>
    </li>
  );
}; 