import { useEffect, useState } from 'react';
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
      if (!activeTable) return;
    
      setLoading(true);
      try {
        console.log(`[ChartsPanel] Fetching chart data for table: ${activeTable}`);
        const response = await ApiService.getChartData(activeTable);
        console.log(`[ChartsPanel] Raw response for ${activeTable}:`, response);
    
        if (response === null || response === undefined) {
          console.warn(`[ChartsPanel] No data received for table: ${activeTable}`);
          setChartData(prev => ({
            ...prev,
            [activeTable]: []
          }));
          return;
        }
    
        // Si la respuesta es un array
        if (Array.isArray(response)) {
          setChartData(prev => ({
            ...prev,
            [activeTable]: response
          }));
          return;
        }
    
        // Si la respuesta es un objeto válido con datos
        if (typeof response === 'object') {
          // Si esperas un array en alguna propiedad, puedes extraerlo aquí
          const extractedData = response.data || response.rows || response.values;
          if (Array.isArray(extractedData)) {
            setChartData(prev => ({
              ...prev,
              [activeTable]: extractedData
            }));
          } else {
            console.warn(`[ChartsPanel] Received object but no valid data array inside.`, response);
            setChartData(prev => ({
              ...prev,
              [activeTable]: []
            }));
          }
          return;
        }
    
        // En caso de tipo inesperado
        console.warn(`[ChartsPanel] Received unexpected data type for ${activeTable}:`, typeof response);
        setChartData(prev => ({
          ...prev,
          [activeTable]: []
        }));
      } catch (error) {
        console.error('[ChartsPanel] Error fetching chart data:', error);
      } finally {
        setLoading(false);
      }
    };
    

    fetchChartData();
    const interval = setInterval(fetchChartData, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [activeTable]);

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

  console.log(`[ChartsPanel] Current table: ${activeTable}`);
  console.log(`[ChartsPanel] Chart fields:`, chartFields);
  console.log(`[ChartsPanel] Current data:`, currentData);

  // Filter numeric fields that have showInChart set to true
  const numericFields = chartFields.filter(field => 
    field.type === 'number' && field.showInChart !== false
  );
  
  console.log('Raw currentData:', currentData);
  
  // Transform data to ensure all numeric fields are properly formatted and handle date formats
  const formattedData = currentData.map((item, index) => {
    const formattedItem = { ...item };
    
    // Format the time field to a consistent format
    if (formattedItem.time) {
      try {
        const timeValue = String(formattedItem.time);
        
        // Store the original time string
        formattedItem.originalTime = timeValue;
        
        // Try to parse the time value
        let date: Date | null = null;
        
        // For mock data, we need to handle the format 'YYYY-MM-DD HH'
        if (timeValue.match(/^\d{4}-\d{2}-\d{2} \d{2}$/)) {
          const [datePart, hour] = timeValue.split(' ');
          const [year, month, day] = datePart.split('-').map(Number);
          date = new Date(Date.UTC(year, month - 1, day, Number(hour)));
        } 
        // Try parsing as ISO string
        else {
          date = new Date(timeValue);
        }
        
        // If we have a valid date, store it
        if (date && !isNaN(date.getTime())) {
          // Add index to milliseconds to ensure unique timestamps
          date.setMilliseconds(index);
          formattedItem.time = date.toISOString();
        } else {
          // If we can't parse the date, use the index as hours from now
          const now = new Date();
          now.setHours(now.getHours() - (currentData.length - index - 1));
          formattedItem.time = now.toISOString();
          console.warn('Using fallback time for item:', item);
        }
      } catch (e) {
        console.error('Error formatting date:', e, 'Value:', formattedItem.time);
        // Fallback: use current time with offset
        const now = new Date();
        now.setHours(now.getHours() - (currentData.length - index - 1));
        formattedItem.time = now.toISOString();
      }
    } else {
      // If no time field, use current time with offset
      const now = new Date();
      now.setHours(now.getHours() - (currentData.length - index - 1));
      formattedItem.time = now.toISOString();
    }
    
    // Format numeric fields
    numericFields.forEach(field => {
      if (field.name in formattedItem) {
        const value = formattedItem[field.name];
        formattedItem[field.name] = typeof value === 'number' ? value : (parseFloat(value) || 0);
      }
    });
    
    return formattedItem;
  });
  
  // Sort data by time to ensure proper rendering
  formattedData.sort((a, b) => {
    try {
      const timeA = a.time ? new Date(a.time).getTime() : 0;
      const timeB = b.time ? new Date(b.time).getTime() : 0;
      return timeA - timeB;
    } catch (e) {
      console.error('Error sorting data:', e);
      return 0;
    }
  });
  
  console.log('Formatted data:', formattedData);

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
                <LineChart 
                  data={formattedData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="time" 
                    fontSize={12}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => {
                      try {
                        // Try to find the item with this time value
                        const item = formattedData.find(item => 
                          item.time === value || 
                          item.originalTime === value ||
                          (typeof value === 'string' && item.originalTime && value.startsWith(item.originalTime))
                        );
                        
                        if (item?.originalTime) {
                          const timeStr = String(item.originalTime);
                          // If it's in the format 'YYYY-MM-DD HH'
                          if (timeStr.match(/^\d{4}-\d{2}-\d{2} \d{2}$/)) {
                            const hour = timeStr.split(' ')[1];
                            return `${hour}:00`; // Add minutes for better display
                          }
                          // If it's in the format 'YYYY-MM-DD HH:mm'
                          else if (timeStr.includes(' ')) {
                            const timePart = timeStr.split(' ')[1];
                            return timePart.slice(0, 5); // Return just HH:MM
                          }
                          return timeStr;
                        }
                        
                        // If we don't have an original time, try to format the value directly
                        if (typeof value === 'string') {
                          if (value.includes('T')) {
                            const date = new Date(value);
                            if (!isNaN(date.getTime())) {
                              return date.toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              });
                            }
                          }
                          // If it's in the format 'YYYY-MM-DD HH:MM:SS' or similar
                          else if (value.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/)) {
                            return value.split(' ')[1].substring(0, 5);
                          }
                        }
                        
                        return value ? String(value).split('T')[1]?.substring(0, 5) || '00:00' : '--';
                        
                        // If we can't parse it, return the raw value
                        return String(value).split(' ').pop() || '';
                      } catch (e) {
                        console.error('Error formatting date:', e, 'Value:', value);
                        return String(value).split(' ').pop() || '';
                      }
                    }}
                  />
                  <YAxis 
                    fontSize={12}
                    tick={{ fontSize: 10 }}
                    width={40}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                    labelFormatter={(value) => {
                      try {
                        const date = new Date(value);
                        if (!isNaN(date.getTime())) {
                          return date.toLocaleString('es-ES', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          });
                        }
                        // Try to get the original time if available
                        const item = formattedData.find(item => item.time === value);
                        if (item?.originalTime) {
                          return item.originalTime;
                        }
                        return value; // Return original if can't parse
                      } catch (e) {
                        console.error('Error formatting tooltip date:', e, 'Value:', value);
                        return value;
                      }
                    }}
                    formatter={(value, name, props) => {
                      const field = numericFields.find(f => f.name === (props as any).dataKey);
                      const unit = field?.unit ? ` ${field.unit}` : '';
                      return [`${value}${unit}`, field?.label || name];
                    }}
                  />
                  <Legend 
                    verticalAlign="top"
                    height={36}
                    formatter={(value, entry, index) => {
                      const field = numericFields[index];
                      return field?.label || String(value);
                    }}
                  />
                  {numericFields.map((field) => (
                    <Line
                      key={field.name}
                      type="monotone"
                      dataKey={field.name}
                      stroke={field.color || '#3B82F6'}
                      name={field.label}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 0 }}
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