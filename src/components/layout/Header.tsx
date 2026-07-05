import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, User, LogOut, Settings, Moon, Sun, Search, Bell, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

interface HeaderProps {
  onMenuClick: () => void;
  onSearchClick: () => void;
}

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/planner': 'Planner',
  '/comune-catasto': 'Comune e Catasto',
  '/ape': 'APE',
  '/varie': 'Varie',
  '/contabilita': 'Contabilità',
  '/fatture-non-contabilizzate': 'Fatture non contabili',
  '/spese': 'Spese',
  '/rubrica': 'Rubrica',
  '/parametri': 'Parametri',
  '/user-settings': 'Impostazioni',
};

export const Header: React.FC<HeaderProps> = ({ onMenuClick, onSearchClick }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = pageTitles[location.pathname] || 'Dashboard';
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const { user, signOut } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();

  // Keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onSearchClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSearchClick]);

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
  };

  const handleUserMenuToggle = () => {
    if (userMenuOpen) {
      setIsAnimatingOut(true);
    } else {
      setUserMenuOpen(true);
      setIsAnimatingOut(false);
    }
  };

  useEffect(() => {
    if (isAnimatingOut) {
      const timer = setTimeout(() => {
        setUserMenuOpen(false);
        setIsAnimatingOut(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isAnimatingOut]);

  return (
    <header className="h-topbar bg-white border-b border-ink-200 px-4 flex items-center justify-between flex-shrink-0">
      {/* Left Side */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md text-ink-500 hover:text-ink-700 hover:bg-ink-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Breadcrumb */}
        <div className="hidden sm:flex items-center gap-2 text-sm text-ink-500">
          <span className="text-ink-400">Home</span>
          <ChevronRight className="w-4 h-4 text-ink-300" />
          <span className="text-ink-700 font-medium">{currentPage}</span>
        </div>
      </div>

      {/* Center - Search Button */}
      <button
        onClick={onSearchClick}
        className="hidden md:flex items-center gap-2 px-4 py-2 bg-ink-50 border border-ink-200 rounded-lg text-sm text-ink-400 hover:bg-ink-100 hover:border-ink-300 transition-all min-w-[280px]"
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left">Cerca...</span>
        <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-ink-200 rounded text-xs font-mono text-ink-500">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        {/* Mobile Search */}
        <button
          onClick={onSearchClick}
          className="md:hidden p-2 rounded-md text-ink-500 hover:text-ink-700 hover:bg-ink-100 transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-md text-ink-500 hover:text-ink-700 hover:bg-ink-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-signal-500 rounded-full" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md text-ink-500 hover:text-ink-700 hover:bg-ink-100 transition-colors"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={handleUserMenuToggle}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-ink-100 transition-colors"
          >
            <div className="w-8 h-8 bg-signal-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-sm font-medium text-ink-700">
                {user?.name || user?.username || 'Utente'}
              </div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {userMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-10"
                onClick={handleUserMenuToggle}
              />
              <div className={`absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-ink-200 py-1 z-20 ${
                isAnimatingOut ? 'animate-fade-out-up' : 'animate-fade-in-down'
              }`}>
                <div className="px-4 py-3 border-b border-ink-100">
                  <div className="text-sm font-medium text-ink-700">
                    {user?.name || user?.username || 'Utente'}
                  </div>
                  <div className="text-xs text-ink-500">
                    {user?.email || ''}
                  </div>
                </div>
                
                <div className="py-1">
                  <button 
                    onClick={toggleTheme}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 transition-colors"
                  >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    {isDark ? 'Modalità chiara' : 'Modalità scura'}
                  </button>
                  
                  <button
                    onClick={() => navigate('/user-settings')}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Impostazioni
                  </button>
                  
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-error-500 hover:bg-error-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Disconnetti
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
