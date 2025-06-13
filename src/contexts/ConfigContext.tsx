import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { DatabaseService } from '../services/database';
import { EndpointConfig, DatabaseConfig, SystemConfig } from '../types';

interface ConfigContextType {
  config: EndpointConfig;
  databaseConfig: DatabaseConfig;
  systemConfigs: SystemConfig[];
  selectedConfigId: string | null;
  configName: string;
  dbConnectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  dbConnectionError: string | null;
  isLoading: boolean;
  setConfig: React.Dispatch<React.SetStateAction<EndpointConfig>>;
  setDatabaseConfig: React.Dispatch<React.SetStateAction<DatabaseConfig>>;
  setSelectedConfigId: React.Dispatch<React.SetStateAction<string | null>>;
  setConfigName: React.Dispatch<React.SetStateAction<string>>;
  connectToDatabase: (dbConfig: DatabaseConfig) => Promise<void>;
  saveToDatabase: () => Promise<void>;
  loadSystemConfig: (configId: string) => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [config, setConfig] = useState<EndpointConfig>(DEFAULT_CONFIG);
  const [databaseConfig, setDatabaseConfig] = useState<DatabaseConfig>(DEFAULT_DB_CONFIG);
  const [systemConfigs, setSystemConfigs] = useState<SystemConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [configName, setConfigName] = useState('');
  const [dbConnectionStatus, setDbConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [dbConnectionError, setDbConnectionError] = useState<string | null>(null);

  const dbService = DatabaseService.getInstance();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Cargar configuración inicial
    const loadInitialConfig = async () => {
      setIsLoading(true);
      try {
        // 1. Cargar configuración de conexión a BD primero
        const savedDbConfig = localStorage.getItem('iot-dashboard-db-config');
        if (savedDbConfig) {
          try {
            const parsed = JSON.parse(savedDbConfig);
            setDatabaseConfig(prev => ({ ...prev, ...parsed }));
            await connectToDatabase({ ...databaseConfig, ...parsed });
          } catch (error) {
            console.error('Error loading saved database config:', error);
          }
        }

        // 2. Cargar última configuración de BD (si hay conexión)
        if (dbConnectionStatus === 'connected') {
          try {
            const configs = await dbService.getAllSystemConfigs();
            if (configs.length > 0) {
              const lastConfig = configs[configs.length - 1];
              setConfig({
                baseUrl: lastConfig.baseUrl,
                endpoints: lastConfig.endpoints,
                tables: lastConfig.tables
              });
              setConfigName(lastConfig.name);
              setSelectedConfigId(lastConfig.id!);
              ApiService.updateConfig({
                baseUrl: lastConfig.baseUrl,
                endpoints: lastConfig.endpoints,
                tables: lastConfig.tables
              });
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.error('Error loading last config from DB:', error);
          }
        }

        // 3. Fallback a configuración local
        const savedConfig = localStorage.getItem('iot-dashboard-config');
        if (savedConfig) {
          try {
            const parsed = JSON.parse(savedConfig);
            setConfig(prev => ({ ...prev, ...parsed }));
          } catch (error) {
            console.error('Error loading saved config:', error);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialConfig();
  }, []);

  const connectToDatabase = async (dbConfig: DatabaseConfig) => {
    setDbConnectionStatus('connecting');
    setDbConnectionError(null);

    const result = await dbService.connect(dbConfig);
    
    if (result.success) {
      setDbConnectionStatus('connected');
      localStorage.setItem('iot-dashboard-db-config', JSON.stringify(dbConfig));
      const configs = await dbService.getAllSystemConfigs();
      setSystemConfigs(configs);
    } else {
      setDbConnectionStatus('error');
      setDbConnectionError(result.error || 'Connection failed');
    }
  };

  const saveToDatabase = async () => {
    if (dbConnectionStatus !== 'connected') return;

    try {
      const systemConfig: SystemConfig = {
        id: selectedConfigId || undefined,
        name: configName || 'Configuración Sin Nombre',
        baseUrl: config.baseUrl,
        endpoints: config.endpoints,
        tables: config.tables,
        databaseConfig: databaseConfig
      };

      const result = await dbService.saveSystemConfig(systemConfig);
      
      if (result.success && result.data) {
        setSelectedConfigId(result.data.id!);
        await dbService.getAllSystemConfigs().then(setSystemConfigs);
      }
    } catch (error) {
      console.error('Error saving to database:', error);
    }
  };

  const loadSystemConfig = async (configId: string) => {
    const systemConfig = await dbService.getSystemConfig(configId);
    if (systemConfig) {
      setConfig({
        baseUrl: systemConfig.baseUrl,
        endpoints: systemConfig.endpoints,
        tables: systemConfig.tables
      });
      setConfigName(systemConfig.name);
      setSelectedConfigId(configId);
      ApiService.updateConfig({
        baseUrl: systemConfig.baseUrl,
        endpoints: systemConfig.endpoints,
        tables: systemConfig.tables
      });
    }
  };

  return (
    <ConfigContext.Provider value={{
      config,
      databaseConfig,
      systemConfigs,
      selectedConfigId,
      configName,
      dbConnectionStatus,
      dbConnectionError,
      isLoading,
      setConfig,
      setDatabaseConfig,
      setSelectedConfigId,
      setConfigName,
      connectToDatabase,
      saveToDatabase,
      loadSystemConfig
    }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

const DEFAULT_CONFIG: EndpointConfig = {
  baseUrl: 'https://proyectos-iot.onrender.com',
  endpoints: {
    latest: '/api/latest',
    chart: '/api/chart',
    history: '/api/history',
    stats: '/api/stats'
  },
  tables: [
    {
      name: 'temhum1',
      label: 'Sensor Ambiental 1',
      fields: [
        {
          name: 'temperatura',
          label: 'Temperatura',
          unit: '°C',
          type: 'number',
          showInKPI: true,
          showInChart: true,
          showInStats: true,
          showInHistory: true,
          range: { min: 18, max: 25 },
          color: '#3B82F6'
        }
      ]
    }
  ]
};

const DEFAULT_DB_CONFIG: DatabaseConfig = {
  connectionType: 'postgresql',
  postgresHost: '',
  postgresPort: 5432,
  postgresDatabase: '',
  postgresUser: '',
  postgresPassword: '',
  postgresSSL: false,
  supabaseUrl: '',
  supabaseKey: ''
};
