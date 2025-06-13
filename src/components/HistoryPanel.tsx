import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { ApiService } from '../services/api';
import { formatDateTime } from '../utils/validation';

export function HistoryPanel() {
  const [activeTable, setActiveTable] = useState<string>('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const config = ApiService.getConfig();
    if (config.tables.length > 0 && !activeTable) {
      setActiveTable(config.tables[0].name);
    }
  }, [activeTable]);

  useEffect(() => {
    const fetchHistoryData = async () => {
      if (!activeTable) return;
      
      setLoading(true);
      try {
        const result = await ApiService.getHistoryData(activeTable);
        setData(result || []);
        setCurrentPage(1);
      } catch (error) {
        console.error('Error fetching history data:', error);
      }
      setLoading(false);
    };

    fetchHistoryData();
  }, [activeTable]);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = data.slice(startIndex, startIndex + itemsPerPage);

  const exportToCSV = () => {
    if (data.length === 0) return;
    
    const config = ApiService.getConfig();
    const currentTableConfig = config.tables.find(t => t.name === activeTable);
    const historyFields = currentTableConfig ? ApiService.getFieldsForDisplay(activeTable, 'History') : [];
    
    // Create headers using field labels
    const headers = ['ID', ...historyFields.map(field => field.label), 'Fecha/Hora'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.id,
        ...historyFields.map(field => row[field.name] || ''),
        formatDateTime(row.received_at)
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTable}_history.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const config = ApiService.getConfig();
  const currentTableConfig = config.tables.find(t => t.name === activeTable);
  const historyFields = currentTableConfig ? ApiService.getFieldsForDisplay(activeTable, 'History') : [];

  const renderTableHeaders = () => {
    return (
      <tr className="bg-gray-50">
        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
        {historyFields.map((field) => (
          <th 
            key={field.name}
            className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell"
          >
            {field.label} ({field.unit})
          </th>
        ))}
        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Fecha/Hora</th>
      </tr>
    );
  };

  const renderTableRow = (item: any, index: number) => {
    return (
      <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{item.id}</td>
        {historyFields.map((field) => (
          <td 
            key={field.name}
            className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden sm:table-cell"
          >
            {field.type === 'number' && typeof item[field.name] === 'number' 
              ? item[field.name].toFixed(field.name.includes('ppm') || field.name.includes('ec') ? 0 : 1)
              : item[field.name] || '--'
            }
          </td>
        ))}
        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
          {formatDateTime(item.received_at)}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Historial de Datos</h2>
        <button
          onClick={exportToCSV}
          className="flex items-center px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
        >
          <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
          Exportar CSV
        </button>
      </div>

      {/* Selector de tabla */}
      <div className="flex flex-wrap gap-2">
        {config.tables.map((table) => (
          <button
            key={table.name}
            onClick={() => setActiveTable(table.name)}
            className={`px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
              activeTable === table.name
                ? 'bg-sky-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {table.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  {renderTableHeaders()}
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentData.length > 0 ? (
                    currentData.map((item, index) => renderTableRow(item, index))
                  ) : (
                    <tr>
                      <td colSpan={historyFields.length + 2} className="px-6 py-4 text-center text-gray-500 text-sm">
                        {historyFields.length === 0 
                          ? 'No hay campos configurados para mostrar en el historial. Ve a Configuración para habilitar campos.'
                          : 'No hay datos disponibles'
                        }
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="bg-white px-3 sm:px-4 py-3 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-xs sm:text-sm text-gray-700">
                    Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(startIndex + itemsPerPage, data.length)}</span> de{' '}
                    <span className="font-medium">{data.length}</span> resultados
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden sm:inline">Anterior</span>
                    </button>
                    <span className="flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-700">
                      {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="hidden sm:inline">Siguiente</span>
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}