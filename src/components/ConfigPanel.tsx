import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, CheckCircle, AlertCircle, Plus, Trash2, Eye, Database, Wifi, Download, Upload, Server } from 'lucide-react';
import { ApiService } from '../services/api';
import { DatabaseService, DatabaseConfig, SystemConfig } from '../services/database';

interface FieldConfig {
  name: string;
  label: string;
  unit: string;
  type: 'number' | 'string' | 'date';
  showInKPI: boolean;
  showInChart: boolean;
  showInStats: boolean;
  showInHistory: boolean;
  range?: { min: number; max: number };
  color?: string;
}

interface TableConfig {
  name: string;
  label: string;
  fields: FieldConfig[];
}

interface EndpointConfig {
  baseUrl: string;
  endpoints: {
    latest: string;
    chart: string;
    history: string;
    stats: string;
  };
  tables: TableConfig[];
}

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
        },
        {
          name: 'humedad',
          label: 'Humedad',
          unit: '%',
          type: 'number',
          showInKPI: true,
          showInChart: true,
          showInStats: true,
          showInHistory: true,
          range: { min: 50, max: 70 },
          color: '#10B981'
        },
        {
          name: 'dew_point',
          label: 'Punto de Rocío',
          unit: '°C',
          type: 'number',
          showInKPI: true,
          showInChart: false,
          showInStats: false,
          showInHistory: true,
          color: '#06B6D4'
        }
      ]
    }
  ]
};

export function ConfigPanel() {
  const [config, setConfig] = useState<EndpointConfig>(DEFAULT_CONFIG);
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | 'testing' | null>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'tables' | 'database'>('endpoints');
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  
  // Database configuration state
  const [databaseConfig, setDatabaseConfig] = useState<DatabaseConfig>({
    connectionType: 'postgresql',
    postgresHost: '',
    postgresPort: 5432,
    postgresDatabase: '',
    postgresUser: '',
    postgresPassword: '',
    postgresSSL: false,
    supabaseUrl: '',
    supabaseKey: '',
    redisUrl: '',
    redisPassword: ''
  });
  const [dbConnectionStatus, setDbConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [dbConnectionError, setDbConnectionError] = useState<string | null>(null);
  const [systemConfigs, setSystemConfigs] = useState<SystemConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [configName, setConfigName] = useState('');
  const [postgresTestStatus, setPostgresTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [redisTestStatus, setRedisTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const dbService = DatabaseService.getInstance();

  useEffect(() => {
    // Cargar configuración guardada
    const savedConfig = localStorage.getItem('iot-dashboard-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      } catch (error) {
        console.error('Error loading saved config:', error);
      }
    }

    // Cargar configuración de base de datos
    const savedDbConfig = localStorage.getItem('iot-dashboard-db-config');
    if (savedDbConfig) {
      try {
        const parsed = JSON.parse(savedDbConfig);
        setDatabaseConfig({ ...databaseConfig, ...parsed });
        // Auto-connect if config exists
        connectToDatabase({ ...databaseConfig, ...parsed });
      } catch (error) {
        console.error('Error loading saved database config:', error);
      }
    }
  }, []);

  const connectToDatabase = async (dbConfig: DatabaseConfig) => {
    setDbConnectionStatus('connecting');
    setDbConnectionError(null);

    const result = await dbService.connect(dbConfig);
    
    if (result.success) {
      setDbConnectionStatus('connected');
      localStorage.setItem('iot-dashboard-db-config', JSON.stringify(dbConfig));
      await loadSystemConfigs();
    } else {
      setDbConnectionStatus('error');
      setDbConnectionError(result.error || 'Connection failed');
    }
  };

  const testPostgreSQLConnection = async () => {
    setPostgresTestStatus('testing');
    const result = await dbService.testPostgreSQLConnection(databaseConfig);
    setPostgresTestStatus(result.success ? 'success' : 'error');
    
    if (!result.success) {
      setDbConnectionError(result.error || 'PostgreSQL test failed');
    }
    
    setTimeout(() => setPostgresTestStatus('idle'), 3000);
  };

  const testRedisConnection = async () => {
    setRedisTestStatus('testing');
    const result = await dbService.testRedisConnection(databaseConfig.redisUrl, databaseConfig.redisPassword);
    setRedisTestStatus(result.success ? 'success' : 'error');
    
    if (!result.success) {
      setDbConnectionError(result.error || 'Redis test failed');
    }
    
    setTimeout(() => setRedisTestStatus('idle'), 3000);
  };

  const loadSystemConfigs = async () => {
    const configs = await dbService.getAllSystemConfigs();
    setSystemConfigs(configs);
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
    }
  };

  const saveToDatabase = async () => {
    if (dbConnectionStatus !== 'connected') {
      setSaveStatus('error');
      return;
    }

    setIsSaving(true);
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
        setSaveStatus('success');
        await loadSystemConfigs();
        
        // Update ApiService with new config
        ApiService.updateConfig(config);
      } else {
        setSaveStatus('error');
        console.error('Save error:', result.error);
      }
    } catch (error) {
      setSaveStatus('error');
      console.error('Error saving to database:', error);
    }
    
    setIsSaving(false);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleConfigChange = (field: keyof EndpointConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEndpointChange = (endpoint: keyof EndpointConfig['endpoints'], value: string) => {
    setConfig(prev => ({
      ...prev,
      endpoints: {
        ...prev.endpoints,
        [endpoint]: value
      }
    }));
  };

  const handleTableChange = (index: number, field: keyof TableConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      tables: prev.tables.map((table, i) => 
        i === index ? { ...table, [field]: value } : table
      )
    }));
  };

  const handleFieldChange = (tableIndex: number, fieldIndex: number, field: keyof FieldConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      tables: prev.tables.map((table, i) => 
        i === tableIndex ? {
          ...table,
          fields: table.fields.map((f, j) => 
            j === fieldIndex ? { ...f, [field]: value } : f
          )
        } : table
      )
    }));
  };

  const addTable = () => {
    const newTable: TableConfig = {
      name: '',
      label: '',
      fields: []
    };
    setConfig(prev => ({
      ...prev,
      tables: [...prev.tables, newTable]
    }));
  };

  const removeTable = (index: number) => {
    setConfig(prev => ({
      ...prev,
      tables: prev.tables.filter((_, i) => i !== index)
    }));
  };

  const addField = (tableIndex: number) => {
    const newField: FieldConfig = {
      name: '',
      label: '',
      unit: '',
      type: 'number',
      showInKPI: true,
      showInChart: true,
      showInStats: true,
      showInHistory: true,
      color: '#3B82F6'
    };
    
    setConfig(prev => ({
      ...prev,
      tables: prev.tables.map((table, i) => 
        i === tableIndex ? {
          ...table,
          fields: [...table.fields, newField]
        } : table
      )
    }));
  };

  const removeField = (tableIndex: number, fieldIndex: number) => {
    setConfig(prev => ({
      ...prev,
      tables: prev.tables.map((table, i) => 
        i === tableIndex ? {
          ...table,
          fields: table.fields.filter((_, j) => j !== fieldIndex)
        } : table
      )
    }));
  };

  const testEndpoint = async (endpoint: keyof EndpointConfig['endpoints'], table: string) => {
    const testKey = `${endpoint}-${table}`;
    setTestResults(prev => ({ ...prev, [testKey]: 'testing' }));

    try {
      const url = `${config.baseUrl}${config.endpoints[endpoint]}/${table}`;
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'cors'
      });

      setTestResults(prev => ({ 
        ...prev, 
        [testKey]: response.ok ? 'success' : 'error' 
      }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, [testKey]: 'error' }));
    }
  };

  const testAllEndpoints = async () => {
    for (const table of config.tables) {
      if (table.name.trim()) {
        for (const endpoint of Object.keys(config.endpoints) as Array<keyof EndpointConfig['endpoints']>) {
          await testEndpoint(endpoint, table.name);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }
  };

  const saveConfiguration = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('iot-dashboard-config', JSON.stringify(config));
      ApiService.updateConfig(config);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
    setIsSaving(false);
  };

  const resetToDefaults = () => {
    setConfig(DEFAULT_CONFIG);
    setTestResults({});
    setConfigName('');
    setSelectedConfigId(null);
    localStorage.removeItem('iot-dashboard-config');
  };

  const exportConfig = () => {
    const exportData = {
      config,
      databaseConfig,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iot-dashboard-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        if (importData.config) {
          setConfig(importData.config);
        }
        if (importData.databaseConfig) {
          setDatabaseConfig(importData.databaseConfig);
        }
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(null), 3000);
      } catch (error) {
        console.error('Error importing config:', error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  const getTestIcon = (status: 'success' | 'error' | 'testing' | null) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'testing':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return null;
    }
  };

  const getConnectionStatusIcon = () => {
    switch (dbConnectionStatus) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'connecting':
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Database className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTestStatusIcon = (status: 'idle' | 'testing' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'testing':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="w-6 h-6 text-gray-600" />
          <h2 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h2>
        </div>
        <div className="flex space-x-2">
          <input
            type="file"
            accept=".json"
            onChange={importConfig}
            className="hidden"
            id="import-config"
          />
          <label
            htmlFor="import-config"
            className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </label>
          <button
            onClick={exportConfig}
            className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
          <button
            onClick={resetToDefaults}
            className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar
          </button>
          <button
            onClick={dbConnectionStatus === 'connected' ? saveToDatabase : saveConfiguration}
            disabled={isSaving}
            className="flex items-center px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Guardando...' : (dbConnectionStatus === 'connected' ? 'Guardar en BD' : 'Guardar Local')}
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className={`p-4 rounded-lg ${
          saveStatus === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {saveStatus === 'success' 
            ? '✅ Configuración guardada correctamente' 
            : '❌ Error al guardar la configuración'
          }
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('database')}
          className={`flex-1 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'database'
              ? 'bg-white text-sky-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Base de Datos
        </button>
        <button
          onClick={() => setActiveTab('endpoints')}
          className={`flex-1 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'endpoints'
              ? 'bg-white text-sky-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Endpoints de API
        </button>
        <button
          onClick={() => setActiveTab('tables')}
          className={`flex-1 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'tables'
              ? 'bg-white text-sky-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Configuración de Tablas
        </button>
      </div>

      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Database Connection Status */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                {getConnectionStatusIcon()}
                <span className="ml-2">Estado de Conexión</span>
                {dbConnectionStatus === 'connected' && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({dbService.getConnectionType()?.toUpperCase()})
                  </span>
                )}
              </h3>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                dbConnectionStatus === 'connected' 
                  ? 'bg-green-100 text-green-800'
                  : dbConnectionStatus === 'error'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {dbConnectionStatus === 'connected' ? 'Conectado' : 
                 dbConnectionStatus === 'connecting' ? 'Conectando...' :
                 dbConnectionStatus === 'error' ? 'Error' : 'Desconectado'}
              </div>
            </div>
            
            {dbConnectionError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {dbConnectionError}
              </div>
            )}
          </div>

          {/* Connection Type Selector */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tipo de Conexión</h3>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="postgresql"
                  checked={databaseConfig.connectionType === 'postgresql'}
                  onChange={(e) => setDatabaseConfig(prev => ({ ...prev, connectionType: e.target.value as 'postgresql' | 'supabase' }))}
                  className="mr-2"
                />
                <Server className="w-4 h-4 mr-2 text-blue-600" />
                PostgreSQL Directo
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="supabase"
                  checked={databaseConfig.connectionType === 'supabase'}
                  onChange={(e) => setDatabaseConfig(prev => ({ ...prev, connectionType: e.target.value as 'postgresql' | 'supabase' }))}
                  className="mr-2"
                />
                <Database className="w-4 h-4 mr-2 text-green-600" />
                Supabase
              </label>
            </div>
          </div>

          {/* Database Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {databaseConfig.connectionType === 'postgresql' ? (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Server className="w-5 h-5 mr-2 text-blue-600" />
                  Configuración de PostgreSQL
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Host
                      </label>
                      <input
                        type="text"
                        value={databaseConfig.postgresHost || ''}
                        onChange={(e) => setDatabaseConfig(prev => ({ ...prev, postgresHost: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        placeholder="localhost"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Puerto
                      </label>
                      <input
                        type="number"
                        value={databaseConfig.postgresPort || 5432}
                        onChange={(e) => setDatabaseConfig(prev => ({ ...prev, postgresPort: parseInt(e.target.value) || 5432 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        placeholder="5432"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base de Datos
                    </label>
                    <input
                      type="text"
                      value={databaseConfig.postgresDatabase || ''}
                      onChange={(e) => setDatabaseConfig(prev => ({ ...prev, postgresDatabase: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="iot_dashboard"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Usuario
                      </label>
                      <input
                        type="text"
                        value={databaseConfig.postgresUser || ''}
                        onChange={(e) => setDatabaseConfig(prev => ({ ...prev, postgresUser: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        placeholder="postgres"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contraseña
                      </label>
                      <input
                        type="password"
                        value={databaseConfig.postgresPassword || ''}
                        onChange={(e) => setDatabaseConfig(prev => ({ ...prev, postgresPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={databaseConfig.postgresSSL || false}
                      onChange={(e) => setDatabaseConfig(prev => ({ ...prev, postgresSSL: e.target.checked }))}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">Usar SSL</label>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={testPostgreSQLConnection}
                      disabled={!databaseConfig.postgresHost || !databaseConfig.postgresUser || !databaseConfig.postgresDatabase || postgresTestStatus === 'testing'}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {getTestStatusIcon(postgresTestStatus)}
                      <span className="ml-2">
                        {postgresTestStatus === 'testing' ? 'Probando...' : 'Probar Conexión'}
                      </span>
                    </button>
                    <button
                      onClick={() => connectToDatabase(databaseConfig)}
                      disabled={!databaseConfig.postgresHost || !databaseConfig.postgresUser || !databaseConfig.postgresDatabase || dbConnectionStatus === 'connecting'}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      {dbConnectionStatus === 'connecting' ? 'Conectando...' : 'Conectar'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Database className="w-5 h-5 mr-2 text-green-600" />
                  Configuración de Supabase
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL de Supabase
                    </label>
                    <input
                      type="url"
                      value={databaseConfig.supabaseUrl || ''}
                      onChange={(e) => setDatabaseConfig(prev => ({ ...prev, supabaseUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="https://tu-proyecto.supabase.co"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Clave Anónima de Supabase
                    </label>
                    <input
                      type="password"
                      value={databaseConfig.supabaseKey || ''}
                      onChange={(e) => setDatabaseConfig(prev => ({ ...prev, supabaseKey: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    />
                  </div>
                  <button
                    onClick={() => connectToDatabase(databaseConfig)}
                    disabled={!databaseConfig.supabaseUrl || !databaseConfig.supabaseKey || dbConnectionStatus === 'connecting'}
                    className="w-full flex items-center justify-center px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    {dbConnectionStatus === 'connecting' ? 'Conectando...' : 'Conectar a Supabase'}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Wifi className="w-5 h-5 mr-2 text-red-600" />
                Configuración de Redis
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL de Redis
                  </label>
                  <input
                    type="url"
                    value={databaseConfig.redisUrl}
                    onChange={(e) => setDatabaseConfig(prev => ({ ...prev, redisUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="redis://localhost:6379"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña de Redis (opcional)
                  </label>
                  <input
                    type="password"
                    value={databaseConfig.redisPassword || ''}
                    onChange={(e) => setDatabaseConfig(prev => ({ ...prev, redisPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Contraseña opcional"
                  />
                </div>
                <button
                  onClick={testRedisConnection}
                  disabled={!databaseConfig.redisUrl || redisTestStatus === 'testing'}
                  className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {getTestStatusIcon(redisTestStatus)}
                  <span className="ml-2">
                    {redisTestStatus === 'testing' ? 'Probando...' : 'Probar Conexión Redis'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Saved Configurations */}
          {dbConnectionStatus === 'connected' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Configuraciones Guardadas</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    placeholder="Nombre de la configuración"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                {systemConfigs.map((config) => (
                  <div key={config.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{config.name}</h4>
                      <p className="text-sm text-gray-500">
                        Creado: {config.createdAt ? new Date(config.createdAt).toLocaleDateString('es-ES') : 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => loadSystemConfig(config.id!)}
                        className="px-3 py-1 text-sm bg-sky-100 text-sky-700 rounded hover:bg-sky-200 transition-colors"
                      >
                        Cargar
                      </button>
                      <button
                        onClick={() => dbService.deleteSystemConfig(config.id!).then(() => loadSystemConfigs())}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
                
                {systemConfigs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay configuraciones guardadas en la base de datos
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'endpoints' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuración Base */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuración Base</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Base de la API
                  </label>
                  <input
                    type="url"
                    value={config.baseUrl}
                    onChange={(e) => handleConfigChange('baseUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="https://proyectos-iot.onrender.com"
                  />
                </div>
              </div>
            </div>

            {/* Endpoints */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Endpoints</h3>
              
              <div className="space-y-4">
                {Object.entries(config.endpoints).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                      {key === 'latest' ? 'Datos Actuales' : 
                       key === 'chart' ? 'Gráficas' :
                       key === 'history' ? 'Historial' : 'Estadísticas'}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleEndpointChange(key as keyof EndpointConfig['endpoints'], e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder={`/api/${key}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pruebas de Conectividad */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Pruebas de Conectividad</h3>
              <button
                onClick={testAllEndpoints}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Probar Todos
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tabla
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Latest
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chart
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      History
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {config.tables.filter(table => table.name.trim()).map((table, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {table.name}
                      </td>
                      {Object.keys(config.endpoints).map((endpoint) => (
                        <td key={endpoint} className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => testEndpoint(endpoint as keyof EndpointConfig['endpoints'], table.name)}
                            className="flex items-center justify-center w-full"
                          >
                            {getTestIcon(testResults[`${endpoint}-${table.name}`])}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tables' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Configuración de Tablas y Campos</h3>
            <button
              onClick={addTable}
              className="flex items-center px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Tabla
            </button>
          </div>

          <div className="space-y-4">
            {config.tables.map((table, tableIndex) => (
              <div key={tableIndex} className="bg-white rounded-lg shadow-md border">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre de la Tabla
                        </label>
                        <input
                          type="text"
                          value={table.name}
                          onChange={(e) => handleTableChange(tableIndex, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                          placeholder="ej: temhum1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Etiqueta de la Tabla
                        </label>
                        <input
                          type="text"
                          value={table.label}
                          onChange={(e) => handleTableChange(tableIndex, 'label', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                          placeholder="ej: Sensor Ambiental 1"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setExpandedTable(expandedTable === table.name ? null : table.name)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeTable(tableIndex)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {expandedTable === table.name && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-gray-800">Campos de la Tabla</h4>
                      <button
                        onClick={() => addField(tableIndex)}
                        className="flex items-center px-3 py-1 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 transition-colors text-sm"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Agregar Campo
                      </button>
                    </div>

                    <div className="space-y-4">
                      {table.fields.map((field, fieldIndex) => (
                        <div key={fieldIndex} className="border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del Campo
                              </label>
                              <input
                                type="text"
                                value={field.name}
                                onChange={(e) => handleFieldChange(tableIndex, fieldIndex, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                                placeholder="ej: temperatura"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Etiqueta
                              </label>
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) => handleFieldChange(tableIndex, fieldIndex, 'label', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                                placeholder="ej: Temperatura"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unidad
                              </label>
                              <input
                                type="text"
                                value={field.unit}
                                onChange={(e) => handleFieldChange(tableIndex, fieldIndex, 'unit', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                                placeholder="ej: °C"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo
                              </label>
                              <select
                                value={field.type}
                                onChange={(e) => handleFieldChange(tableIndex, fieldIndex, 'type', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                              >
                                <option value="number">Número</option>
                                <option value="string">Texto</option>
                                <option value="date">Fecha</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Color
                              </label>
                              <input
                                type="color"
                                value={field.color || '#3B82F6'}
                                onChange={(e) => handleFieldChange(tableIndex, fieldIndex, 'color', e.target.value)}
                                className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                              />
                            </div>
                            {field.type === 'number' && (
                              <>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Rango Mín
                                  </label>
                                  <input
                                    type="number"
                                    value={field.range?.min || ''}
                                    onChange={(e) => handleFieldChange(tableIndex, fieldIndex, 'range', {
                                      ...field.range,
                                      min: parseFloat(e.target.value) || 0
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Rango Máx
                                  </label>
                                  <input
                                    type="number"
                                    value={field.range?.max || ''}
                                    onChange={(e) => handleFieldChange(tableIndex, fieldIndex, 'range', {
                                      ...field.range,
                                      max: parseFloat(e.target.value) || 100
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                                    placeholder="100"
                                  />
                                </div>
                              </>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={field.showInKPI}
                                  onChange={(e) => handleFieldChange(tableIndex, fieldIndex, 'showInKPI', e.target.checked)}
                                  className="mr-2 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                />
                                <span className="text-sm text-gray-700">KPI</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={field.showInChart}
                                  onChange={(e) => handleFieldChange(tableIndex, fieldIndex, 'showInChart', e.target.checked)}
                                  className="mr-2 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                />
                                <span className="text-sm text-gray-700">Gráficos</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={field.showInStats}
                                  onChange={(e) => handleFieldChange(tableIndex, fieldIndex, 'showInStats', e.target.checked)}
                                  className="mr-2 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                />
                                <span className="text-sm text-gray-700">Estadísticas</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={field.showInHistory}
                                  onChange={(e) => handleFieldChange(tableIndex, fieldIndex, 'showInHistory', e.target.checked)}
                                  className="mr-2 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                />
                                <span className="text-sm text-gray-700">Historial</span>
                              </label>
                            </div>
                            <button
                              onClick={() => removeField(tableIndex, fieldIndex)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}