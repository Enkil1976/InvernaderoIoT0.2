import React, { useEffect, useState } from 'react';
import { Thermometer, Droplets, CloudRain, FlaskConical, Zap, Beaker } from 'lucide-react';
import { StatusCard } from './StatusCard';
import { ApiService } from '../services/api';
import { formatDateTime } from '../utils/validation';

export function StatusPanel() {
  const [sensorData, setSensorData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const config = ApiService.getConfig();
        const dataPromises = config.tables.map(async (table) => {
          const data = await ApiService.getLatestData(table.name);
          return { tableName: table.name, data };
        });

        const results = await Promise.all(dataPromises);
        const newSensorData: Record<string, any> = {};
        
        results.forEach(({ tableName, data }) => {
          newSensorData[tableName] = data;
        });

        setSensorData(newSensorData);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error fetching latest data:', error);
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Actualizar cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  const getIconForField = (fieldName: string) => {
    const iconMap: Record<string, any> = {
      temperatura: Thermometer,
      humedad: Droplets,
      dew_point: CloudRain,
      ph: FlaskConical,
      ec: Zap,
      ppm: Beaker
    };
    return iconMap[fieldName] || Thermometer;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  const config = ApiService.getConfig();

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Estado Actual de Sensores</h2>
        <div className="text-xs sm:text-sm text-gray-500">
          Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}
        </div>
      </div>

      {config.tables.map((table, tableIndex) => {
        const tableData = sensorData[table.name];
        const kpiFields = ApiService.getFieldsForDisplay(table.name, 'KPI');
        
        if (kpiFields.length === 0) return null;

        return (
          <div key={table.name} className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
              <div 
                className="w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-2"
                style={{ backgroundColor: kpiFields[0]?.color || '#3B82F6' }}
              ></div>
              {table.label}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {kpiFields.map((field, fieldIndex) => {
                const Icon = getIconForField(field.name);
                const value = tableData?.[field.name] || 0;
                const timestamp = tableData?.received_at;

                return (
                  <StatusCard
                    key={field.name}
                    title={field.label}
                    value={value}
                    unit={field.unit}
                    icon={Icon}
                    range={field.range}
                    timestamp={timestamp ? formatDateTime(timestamp) : undefined}
                    className={fieldIndex >= 2 ? "sm:col-span-2 lg:col-span-1" : ""}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}