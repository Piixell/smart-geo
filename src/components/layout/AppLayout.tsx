import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-ink-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
        />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-ink-50">
          <div className="w-full mx-auto px-4 py-3">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
