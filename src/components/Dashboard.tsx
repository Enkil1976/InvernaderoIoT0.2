import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { StatusPanel } from './StatusPanel';
import { ChartsPanel } from './ChartsPanel';
import { HistoryPanel } from './HistoryPanel';
import { StatsPanel } from './StatsPanel';
import { ConfigPanel } from './ConfigPanel';
import { UserMenu } from './UserMenu';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';

export function Dashboard() {
  const [activeSection, setActiveSection] = useState('status');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const renderContent = () => {
    switch (activeSection) {
      case 'status':
        return <StatusPanel />;
      case 'charts':
        return <ChartsPanel />;
      case 'history':
        return <HistoryPanel />;
      case 'stats':
        return <StatsPanel />;
      case 'config':
        return (
          <ProtectedRoute requiredRole="admin">
            <ConfigPanel />
          </ProtectedRoute>
        );
      default:
        return <StatusPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar with user menu */}
      <div className="lg:ml-64 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>

          {/* Welcome message */}
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-gray-900">
              Bienvenido, {user?.username}
            </h1>
            <p className="text-sm text-gray-500">
              Dashboard IoT - Invernadero
            </p>
          </div>

          {/* User menu */}
          <UserMenu />
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={(section) => {
          setActiveSection(section);
          setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <main className="lg:ml-64 min-h-screen pt-20 lg:pt-4">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
