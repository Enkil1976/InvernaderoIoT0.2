import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  History, 
  Gauge,
  Leaf,
  Droplets,
  Settings
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { id: 'status', label: 'Estado Actual', icon: Gauge },
  { id: 'charts', label: 'Gráficas', icon: TrendingUp },
  { id: 'history', label: 'Historial', icon: History },
  { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
  { id: 'config', label: 'Configuración', icon: Settings }
];

export function Sidebar({ activeSection, onSectionChange, isOpen, onClose }: SidebarProps) {
  return (
    <>
      <div className={`
        w-64 bg-white shadow-lg h-screen fixed left-0 top-0 z-40 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-sky-500 rounded-lg">
              <Leaf className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Invernadero</h1>
              <p className="text-xs sm:text-sm text-gray-500">IoT Dashboard</p>
            </div>
          </div>
        </div>
        
        <nav className="mt-6 sm:mt-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center px-4 sm:px-6 py-3 text-left transition-colors ${
                  activeSection === item.id
                    ? 'bg-sky-50 text-sky-700 border-r-2 border-sky-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-3" />
                <span className="text-sm sm:text-base">{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Droplets className="w-3 h-3 sm:w-4 sm:h-4 text-sky-500" />
            <span>Actualización cada 30s</span>
          </div>
        </div>
      </div>
    </>
  );
}