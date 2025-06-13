import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { StatusPanel } from './components/StatusPanel';
import { ChartsPanel } from './components/ChartsPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { StatsPanel } from './components/StatsPanel';
import { ConfigPanel } from './components/ConfigPanel';
import { Menu, X } from 'lucide-react';

function App() {
  const [activeSection, setActiveSection] = useState('status');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        return <ConfigPanel />;
      default:
        return <StatusPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          {sidebarOpen ? (
            <X className="w-6 h-6 text-gray-600" />
          ) : (
            <Menu className="w-6 h-6 text-gray-600" />
          )}
        </button>
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
      
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;