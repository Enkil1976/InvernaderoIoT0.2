import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ApiService } from '../services/api';

export function ChartsPanel() {
  const [chartData, setChartData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTable, setActiveTable] = useState<string>('');

  useEffect(() => {
    const config = ApiService.getConfig();
    if (config.tables.length > 0 && !activeTable) {
      setActiveTable(config.tables[0].name);
    }
  }, [activeTable]);

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        const config = ApiService.getConfig();
        const dataPromises = config.tables.map(async (table) => {
          const data = await ApiService.getChartData(table.name);
          return { tableName: table.name, data: data || [] };
        });

        const results = await Promise.all(dataPromises);
        const newChartData: Record<string, any[]> = {};
        
        results.forEach(({ tableName, data }) => {
          newChartData[tableName] = data;
        });

        setChartData(newChartData);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
      setLoading(false);
    };

    fetchChartData();
    const interval = setInterval(fetchChartData, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
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
  const chartFields = currentTable ? ApiService.getFieldsForDisplay(activeTable, 'Chart') : [];
  const currentData = chartData[activeTable] || [];

  // Group fields by type for better chart organization
  const numericFields = chartFields.filter(field => field.type === 'number');

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Gráficas - Últimas 24 Horas</h2>
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
        <div className="space-y-6 sm:space-y-8">
          {/* Create separate charts for different field groups */}
          {numericFields.length > 0 && (
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                {currentTable.label} - Datos en Tiempo Real
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={currentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    fontSize={12}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    fontSize={12}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip />
                  <Legend />
                  {numericFields.map((field) => (
                    <Line
                      key={field.name}
                      type="monotone"
                      dataKey={field.name}
                      stroke={field.color || '#3B82F6'}
                      name={`${field.label} (${field.unit})`}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Create individual charts for fields with different scales */}
          {numericFields.filter(field => field.range).map((field) => (
            <div key={`${field.name}-individual`} className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                {field.label} ({field.unit})
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={currentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    fontSize={12}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    domain={field.range ? [field.range.min - 2, field.range.max + 2] : ['dataMin - 2', 'dataMax + 2']}
                    fontSize={12}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={field.name}
                    stroke={field.color || '#3B82F6'}
                    name={`${field.label} (${field.unit})`}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}

          {chartFields.length === 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
              No hay campos configurados para mostrar en gráficas para esta tabla.
              <br />
              Ve a Configuración para habilitar campos en las gráficas.
            </div>
          )}
        </div>
      )}
    </div>
  );
}