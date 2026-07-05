import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from '../CommandPalette';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const handleSearchClick = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  const handleCommandPaletteClose = useCallback(() => {
    setCommandPaletteOpen(false);
  }, []);

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-ink-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          onSearchClick={handleSearchClick}
        />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-ink-50">
          <div className="w-full mx-auto px-4 py-3">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={handleCommandPaletteClose} 
      />
    </div>
  );
};
