import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  Calculator, 
  CreditCard,
  Building2,
  FileCheck,
  FolderOpen,
  Users,
  Settings,
  FileText,
  X
} from 'lucide-react';
import { clsx } from 'clsx';
import { useImpostazioni } from '../../services/impostazioni';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  category: 'pratiche' | 'amministrazione' | 'configurazione';
}

const menuItems: MenuItem[] = [
  // Navigazione principale
  {
    label: 'Dashboard',
    icon: Home,
    path: '/',
    category: 'pratiche'
  },
  {
    label: 'Agenda settimanale',
    icon: Calendar,
    path: '/planner',
    category: 'pratiche'
  },
  {
    label: 'Pratiche comunali e catastali',
    icon: Building2,
    path: '/comune-catasto',
    category: 'pratiche'
  },
  {
    label: 'Attestati di Prestazione Energetica',
    icon: FileCheck,
    path: '/ape',
    category: 'pratiche'
  },
  {
    label: 'Pratiche varie',
    icon: FolderOpen,
    path: '/varie',
    category: 'pratiche'
  },
  // Strumenti
  {
    label: 'Preventivi',
    icon: FileText,
    path: '/preventivi',
    category: 'amministrazione'
  },
  {
    label: 'Contabilità',
    icon: Calculator,
    path: '/contabilita',
    category: 'amministrazione'
  },
  {
    label: 'Spese',
    icon: CreditCard,
    path: '/spese',
    category: 'amministrazione'
  },
  {
    label: 'Rubrica',
    icon: Users,
    path: '/rubrica',
    category: 'amministrazione'
  },
  // Impostazioni
  {
    label: 'Parametri di sistema',
    icon: Settings,
    path: '/parametri',
    category: 'configurazione'
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const { aspetto, menu } = useImpostazioni();

  const navigazioneItems = menuItems.filter(item => item.category === 'pratiche');
  const strumentiItems = menuItems.filter(item => item.category === 'amministrazione');
  const impostazioniItems = menuItems.filter(item => item.category === 'configurazione');

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const NavItem = ({ item }: { item: MenuItem }) => (
    <NavLink
      to={item.path}
      onClick={onClose}
      className={clsx(
        'sidebar-item group relative',
        isActive(item.path) && 'sidebar-item-active'
      )}
    >
      {isActive(item.path) && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r" />
      )}
      <item.icon className={clsx(
        'w-5 h-5 flex-shrink-0',
        isActive(item.path) ? 'text-white' : 'text-neutral-400 group-hover:text-white'
      )} />
      <span className="sidebar-label leading-tight">{menu[item.path] || item.label}</span>
    </NavLink>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-ink-900/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-40 flex flex-col bg-neutral-900 transition-all duration-200',
        'w-sidebar lg:relative',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )} style={{ backgroundColor: aspetto.coloreBarra }}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src={aspetto.logo || '/logo-az.png'} alt={`Logo ${aspetto.nome}`} className="h-9 w-auto object-contain" data-testid="sidebar-logo" />
            <div className="leading-tight" data-testid="sidebar-brand">
              <div className="font-display text-base font-bold text-white tracking-tight">{aspetto.nome}</div>
              <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-[0.14em]">{aspetto.sottotitolo}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {/* Navigazione */}
          <div>
            <div className="px-3 mb-2">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                {menu.gruppoPratiche}              </span>
            </div>
            <div className="space-y-1">
              {navigazioneItems.map(item => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>
          </div>

          {/* Strumenti */}
          <div>
            <div className="px-3 mb-2">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                {menu.gruppoAmministrazione}              </span>
            </div>
            <div className="space-y-1">
              {strumentiItems.map(item => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>
          </div>

          {/* Impostazioni */}
          <div>
            <div className="px-3 mb-2">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                {menu.gruppoConfigurazione}              </span>
            </div>
            <div className="space-y-1">
              {impostazioniItems.map(item => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10">
          <div className="text-[11px] text-neutral-400 leading-relaxed">
            <div className="font-medium text-neutral-300">{aspetto.nomeCompleto}</div>
            <div>© {new Date().getFullYear()} · Area riservata</div>
          </div>
        </div>
      </aside>
    </>
  );
};
