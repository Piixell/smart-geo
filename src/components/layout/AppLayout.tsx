import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-900 transition-colors"
              style={{ height: 'calc(100vh - 3.5rem - 3rem)', padding: '1.5rem' }}>
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}; 