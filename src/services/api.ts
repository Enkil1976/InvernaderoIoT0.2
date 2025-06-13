const BASE_URL = 'https://proyectos-iot.onrender.com';

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

// Configuración por defecto
let currentConfig = {
  baseUrl: BASE_URL,
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
          type: 'number' as const,
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
          type: 'number' as const,
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
          type: 'number' as const,
          showInKPI: true,
          showInChart: false,
          showInStats: false,
          showInHistory: true,
          color: '#06B6D4'
        }
      ]
    },
    {
      name: 'temhum2',
      label: 'Sensor Ambiental 2',
      fields: [
        {
          name: 'temperatura',
          label: 'Temperatura',
          unit: '°C',
          type: 'number' as const,
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
          type: 'number' as const,
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
          type: 'number' as const,
          showInKPI: true,
          showInChart: false,
          showInStats: false,
          showInHistory: true,
          color: '#06B6D4'
        }
      ]
    },
    {
      name: 'calidad_agua',
      label: 'Calidad del Agua',
      fields: [
        {
          name: 'ph',
          label: 'pH',
          unit: 'pH',
          type: 'number' as const,
          showInKPI: true,
          showInChart: true,
          showInStats: false,
          showInHistory: true,
          range: { min: 5.5, max: 6.5 },
          color: '#06B6D4'
        },
        {
          name: 'ec',
          label: 'Conductividad',
          unit: 'µS/cm',
          type: 'number' as const,
          showInKPI: true,
          showInChart: true,
          showInStats: false,
          showInHistory: true,
          range: { min: 800, max: 1500 },
          color: '#F59E0B'
        },
        {
          name: 'ppm',
          label: 'PPM',
          unit: 'ppm',
          type: 'number' as const,
          showInKPI: true,
          showInChart: true,
          showInStats: false,
          showInHistory: true,
          range: { min: 400, max: 750 },
          color: '#EF4444'
        }
      ]
    }
  ]
};

// Mock data for fallback when API is unavailable
const MOCK_DATA = {
  temhum1: {
    latest: { id: 1, temperatura: 22.5, humedad: 65.2, dew_point: 15.3, received_at: new Date().toISOString() },
    chart: Array.from({ length: 24 }, (_, i) => ({
      time: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toLocaleString('sv-SE', { timeZone: 'UTC' }).slice(0, 13),
      temperatura: 20 + Math.random() * 10,
      humedad: 60 + Math.random() * 20
    })),
    history: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      temperatura: 20 + Math.random() * 10,
      humedad: 60 + Math.random() * 20,
      dew_point: 15 + Math.random() * 5,
      received_at: new Date(Date.now() - i * 60 * 60 * 1000).toISOString()
    })),
    stats: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T00:00:00.000Z',
      records: Math.floor(Math.random() * 1000 + 500).toString(),
      avg_temperatura: 20 + Math.random() * 8,
      min_temperatura: 18 + Math.random() * 3,
      max_temperatura: 25 + Math.random() * 5,
      avg_humedad: 60 + Math.random() * 15
    }))
  },
  temhum2: {
    latest: { id: 1, temperatura: 24.1, humedad: 58.7, dew_point: 16.2, received_at: new Date().toISOString() },
    chart: Array.from({ length: 24 }, (_, i) => ({
      time: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toLocaleString('sv-SE', { timeZone: 'UTC' }).slice(0, 13),
      temperatura: 22 + Math.random() * 8,
      humedad: 55 + Math.random() * 25
    })),
    history: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      temperatura: 22 + Math.random() * 8,
      humedad: 55 + Math.random() * 25,
      dew_point: 16 + Math.random() * 4,
      received_at: new Date(Date.now() - i * 60 * 60 * 1000).toISOString()
    })),
    stats: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T00:00:00.000Z',
      records: Math.floor(Math.random() * 1000 + 500).toString(),
      avg_temperatura: 22 + Math.random() * 6,
      min_temperatura: 19 + Math.random() * 3,
      max_temperatura: 27 + Math.random() * 4,
      avg_humedad: 58 + Math.random() * 12
    }))
  },
  calidad_agua: {
    latest: { id: 1, ph: 6.2, ec: 1200, ppm: 600, received_at: new Date().toISOString() },
    chart: Array.from({ length: 24 }, (_, i) => ({
      time: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toLocaleString('sv-SE', { timeZone: 'UTC' }).slice(0, 13),
      ph: 5.8 + Math.random() * 0.8,
      ec: 1000 + Math.random() * 400,
      ppm: 500 + Math.random() * 200
    })),
    history: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      ph: 5.8 + Math.random() * 0.8,
      ec: 1000 + Math.random() * 400,
      ppm: 500 + Math.random() * 200,
      received_at: new Date(Date.now() - i * 60 * 60 * 1000).toISOString()
    })),
    stats: []
  }
};

export class ApiService {
  private static isApiAvailable = true;
  private static lastApiCheck = 0;
  private static readonly API_CHECK_INTERVAL = 30000; // 30 seconds

  static updateConfig(newConfig: any) {
    currentConfig = { ...currentConfig, ...newConfig };
    // Cargar configuración guardada si existe
    const savedConfig = localStorage.getItem('iot-dashboard-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        currentConfig = { ...currentConfig, ...parsed };
      } catch (error) {
        console.error('Error loading saved config:', error);
      }
    }
  }

  static getConfig() {
    return currentConfig;
  }

  static getTableConfig(tableName: string): TableConfig | null {
    return currentConfig.tables.find(table => table.name === tableName) || null;
  }

  static getFieldConfig(tableName: string, fieldName: string): FieldConfig | null {
    const table = this.getTableConfig(tableName);
    return table?.fields.find(field => field.name === fieldName) || null;
  }

  static getFieldsForDisplay(tableName: string, displayType: 'KPI' | 'Chart' | 'Stats' | 'History'): FieldConfig[] {
    const table = this.getTableConfig(tableName);
    if (!table) return [];

    const filterKey = `showIn${displayType}` as keyof FieldConfig;
    return table.fields.filter(field => field[filterKey] as boolean);
  }

  private static async checkApiAvailability(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastApiCheck < this.API_CHECK_INTERVAL) {
      return this.isApiAvailable;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${currentConfig.baseUrl}/api/health`, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'cors'
      });
      
      clearTimeout(timeoutId);
      this.isApiAvailable = response.ok;
    } catch (error) {
      console.warn('API health check failed, using mock data:', error);
      this.isApiAvailable = false;
    }

    this.lastApiCheck = now;
    return this.isApiAvailable;
  }

  private static async fetchWithErrorHandling<T>(endpoint: string, table: string): Promise<T | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const url = `${currentConfig.baseUrl}${endpoint}/${table}`;
      const response = await fetch(url, {
        signal: controller.signal,
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.isApiAvailable = true;
      return data;
    } catch (error) {
      console.warn(`API request failed for ${endpoint}/${table}:`, error);
      this.isApiAvailable = false;
      
      // Return mock data based on the endpoint pattern
      return this.getMockDataForEndpoint(endpoint, table) as T;
    }
  }

  private static getMockDataForEndpoint(endpoint: string, table: string): any {
    const endpointName = endpoint.split('/').pop(); // latest, chart, history, stats
    const mockTable = MOCK_DATA[table as keyof typeof MOCK_DATA];
    
    if (!mockTable) {
      return null;
    }

    switch (endpointName) {
      case 'latest':
        return mockTable.latest;
      case 'chart':
        return { data: mockTable.chart };
      case 'history':
        return { data: mockTable.history };
      case 'stats':
        return { stats: mockTable.stats || [] };
      default:
        return null;
    }
  }

  static async getLatestData(table: string) {
    const isAvailable = await this.checkApiAvailability();
    if (!isAvailable) {
      console.info(`Using mock data for ${table} (API unavailable)`);
      return this.getMockDataForEndpoint(currentConfig.endpoints.latest, table);
    }
    return this.fetchWithErrorHandling(currentConfig.endpoints.latest, table);
  }

  static async getChartData(table: string) {
    console.log(`[getChartData] Fetching chart data for table: ${table}`);
    const isAvailable = await this.checkApiAvailability();
  
    if (!isAvailable) {
      console.warn(`[getChartData] API not available, using mock data for ${table} charts`);
      const mockData = this.getMockDataForEndpoint(currentConfig.endpoints.chart, table);
      console.log(`[getChartData] Mock data for ${table}:`, mockData);
      return mockData?.data || [];
    }
  
    try {
      console.log(`[getChartData] Making API request to ${currentConfig.endpoints.chart}/${table}`);
      const response = await this.fetchWithErrorHandling<any>(currentConfig.endpoints.chart, table);
      console.log(`[getChartData] API response for ${table}:`, response);
  
      return Array.isArray(response) ? response : (response?.data || []);
    } catch (error) {
      console.error(`[getChartData] Error fetching chart data for ${table}:`, error);
      const mockData = this.getMockDataForEndpoint(currentConfig.endpoints.chart, table);
      return mockData?.data || [];
    }
  }


  static async getHistoryData(table: string) {
    console.log(`[getHistoryData] Fetching history data for table: ${table}`);
    const isAvailable = await this.checkApiAvailability();
    
    if (!isAvailable) {
      console.warn(`[getHistoryData] API not available, using mock data for ${table} history`);
      const mockData = this.getMockDataForEndpoint(currentConfig.endpoints.history, table);
      console.log(`[getHistoryData] Mock data:`, mockData);
      return mockData?.data || [];
    }
    
    try {
      console.log(`[getHistoryData] Making API request to ${currentConfig.endpoints.history}/${table}`);
      const response = await this.fetchWithErrorHandling<any>(currentConfig.endpoints.history, table);
      console.log(`[getHistoryData] API response:`, response);
      return Array.isArray(response) ? response : (response?.data || []);
    } catch (error) {
      console.error(`[getHistoryData] Error fetching history data for ${table}:`, error);
      const mockData = this.getMockDataForEndpoint(currentConfig.endpoints.history, table);
      return mockData?.data || [];
    }
  }

  static async getStatsData(table: string) {
    console.log(`[getStatsData] Fetching stats data for table: ${table}`);
    const isAvailable = await this.checkApiAvailability();
    
    if (!isAvailable) {
      console.warn(`[getStatsData] API not available, using mock data for ${table} stats`);
      const mockData = this.getMockDataForEndpoint(currentConfig.endpoints.stats, table);
      console.log(`[getStatsData] Mock data:`, mockData);
      return mockData?.stats || [];
    }
    
    try {
      console.log(`[getStatsData] Making API request to ${currentConfig.endpoints.stats}/${table}`);
      const response = await this.fetchWithErrorHandling<any>(currentConfig.endpoints.stats, table);
      console.log(`[getStatsData] API response:`, response);
      return Array.isArray(response) ? response : (response?.stats || []);
    } catch (error) {
      console.error(`[getStatsData] Error fetching stats data for ${table}:`, error);
      const mockData = this.getMockDataForEndpoint(currentConfig.endpoints.stats, table);
      return mockData?.stats || [];
    }
  }

  // Inicializar configuración al cargar
  static {
    this.updateConfig({});
  }
}