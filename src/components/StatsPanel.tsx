import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ApiService } from '../services/api';

interface StatsData {
  date: string;
  records: string;
  [key: string]: any; // Para campos dinámicos como avg_temperatura, min_temperatura, etc.
}

export function StatsPanel() {
  const [statsData, setStatsData] = useState<Record<string, StatsData[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTable, setActiveTable] = useState<string>('');

  useEffect(() => {
    const config = ApiService.getConfig();
    if (config.tables.length > 0 && !activeTable) {
      setActiveTable(config.tables[0].name);
    }
  }, [activeTable]);

  useEffect(() => {
    const fetchStatsData = async () => {
      setLoading(true);
      try {
        const config = ApiService.getConfig();
        const dataPromises = config.tables.map(async (table) => {
          const data = await ApiService.getStatsData(table.name);
          return { tableName: table.name, data: data || [] };
        });

        const results = await Promise.all(dataPromises);
        const newStatsData: Record<string, StatsData[]> = {};
        
        results.forEach(({ tableName, data }) => {
          newStatsData[tableName] = data;
        });

        setStatsData(newStatsData);
      } catch (error) {
        console.error('Error fetching stats data:', error);
      }
      setLoading(false);
    };

    fetchStatsData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  const config = ApiService.getConfig();
  const currentTable = config.tables.find(t => t.name === activeTable);
  const statsFields = currentTable ? ApiService.getFieldsForDisplay(activeTable, 'Stats') : [];
  const currentStats = Array.isArray(statsData[activeTable]) ? statsData[activeTable] : [];
  console.log('Current active table:', activeTable);
  console.log('Stats data for table:', statsData[activeTable]);
  console.log('Processed currentStats:', currentStats);

  // Generate dynamic column keys based on configured fields
  const getStatsColumns = () => {
    const columns: { key: string; label: string; color: string }[] = [];
    
    statsFields.forEach(field => {
      if (field.type === 'number') {
        columns.push(
          { key: `avg_${field.name}`, label: `${field.label} Prom`, color: field.color || '#3B82F6' },
          { key: `min_${field.name}`, label: `${field.label} Min`, color: '#93C5FD' },
          { key: `max_${field.name}`, label: `${field.label} Max`, color: '#1E40AF' }
        );
      }
    });
    
    return columns;
  };

  const statsColumns = getStatsColumns();

  console.log('Current table:', activeTable);
  console.log('Current stats:', currentStats);
  console.log('Stats fields:', statsFields);
  console.log('Stats columns:', statsColumns);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Estadísticas Diarias</h2>
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
      </div>

      {currentTable && (
        <>
          {/* Tabla de estadísticas */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Registros</th>
                    {statsFields.map((field) => (
                      <th key={field.name} className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan={3}>
                        {field.label} ({field.unit})
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-gray-50">
                    <th className="px-3 sm:px-6 py-2"></th>
                    <th className="px-3 sm:px-6 py-2 hidden sm:table-cell"></th>
                    {statsFields.map((field) => (
                      <React.Fragment key={field.name}>
                        <th className="px-1 sm:px-2 py-2 text-xs text-gray-500">Prom</th>
                        <th className="px-1 sm:px-2 py-2 text-xs text-gray-500">Min</th>
                        <th className="px-1 sm:px-2 py-2 text-xs text-gray-500">Max</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentStats.length > 0 ? (
                    currentStats.map((stat, index) => {
                      console.log(`Rendering stat row ${index}:`, stat);
                      return (
                        <tr key={stat.fecha || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                            {stat.fecha ? new Date(stat.fecha).toLocaleDateString('es-ES') : '--'}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden sm:table-cell">
                            {stat.total || '--'}
                          </td>
                          {statsFields.map((field) => {
                            const fieldData = stat[field.name];
                            console.log(`Field ${field.name} data:`, fieldData);
                            
                            return (
                              <React.Fragment key={field.name}>
                                <td className="px-1 sm:px-2 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 text-center">
                                  {fieldData?.promedio !== undefined ? Number(fieldData.promedio).toFixed(1) : '--'}
                                </td>
                                <td className="px-1 sm:px-2 py-4 whitespace-nowrap text-xs sm:text-sm text-blue-600 text-center">
                                  {fieldData?.minimo !== undefined ? Number(fieldData.minimo).toFixed(1) : '--'}
                                </td>
                                <td className="px-1 sm:px-2 py-4 whitespace-nowrap text-xs sm:text-sm text-red-600 text-center">
                                  {fieldData?.maximo !== undefined ? Number(fieldData.maximo).toFixed(1) : '--'}
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      );
                    })
                  ) : (
                    <tr key="no-data">
                      <td colSpan={2 + (statsFields.length * 3)} className="px-6 py-4 text-center text-gray-500 text-sm">
                        {statsFields.length === 0 
                          ? 'No hay campos configurados para mostrar estadísticas. Ve a Configuración para habilitar campos.'
                          : 'No hay datos estadísticos disponibles'
                        }
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gráficos de estadísticas */}
          {currentStats.length > 0 && statsFields.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {statsFields.map((field) => {
                // Transform data for the chart to match the expected format
                const chartData = currentStats.map(stat => ({
                  ...stat,
                  [`${field.name}_promedio`]: stat[field.name]?.promedio,
                  [`${field.name}_minimo`]: stat[field.name]?.minimo,
                  [`${field.name}_maximo`]: stat[field.name]?.maximo,
                }));
                
                return (
                <div key={field.name} className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                    {field.label} - Estadísticas Diarias
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="fecha" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                        fontSize={10}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis fontSize={10} tick={{ fontSize: 10 }} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                      />
                      <Legend />
                      <Bar dataKey={`${field.name}_promedio`} fill={field.color || '#3B82F6'} name={`Promedio ${field.unit || ''}`.trim()} />
                      <Bar dataKey={`${field.name}_minimo`} fill="#93C5FD" name={`Mínimo ${field.unit || ''}`.trim()} />
                      <Bar dataKey={`${field.name}_maximo`} fill="#1E40AF" name={`Máximo ${field.unit || ''}`.trim()} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )})}
            </div>
          )}
        </>
      )}
    </div>
  );
}