export interface TemHumData {
  id: number;
  temperatura: number;
  humedad: number;
  dew_point: number;
  received_at: string;
}

export interface CalidadAguaData {
  id: number;
  ph: number;
  ec: number;
  ppm: number;
  received_at: string;
}

export interface StatsData {
  date: string;
  records: string;
  avg_temperatura: number;
  min_temperatura: number;
  max_temperatura: number;
  avg_humedad: number;
  min_humedad?: number;
  max_humedad?: number;
}

export interface ChartDataPoint {
  time: string;
  temperatura?: number;
  humedad?: number;
  ph?: number;
  ec?: number;
  ppm?: number;
}

export interface HistoryResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: any[];
}

export interface StatsResponse {
  days: number;
  stats: StatsData[];
}

export interface ChartResponse {
  hours: number;
  data: ChartDataPoint[];
}

export type SensorData = TemHumData | CalidadAguaData;
export type TableType = 'temhum1' | 'temhum2' | 'calidad_agua';

export interface AlertRange {
  temperatura?: { min: number; max: number };
  humedad?: { min: number; max: number };
  ph?: { min: number; max: number };
  ec?: { min: number; max: number };
  ppm?: { min: number; max: number };
}

export interface FieldConfig {
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

export interface TableConfig {
  name: string;
  label: string;
  fields: FieldConfig[];
}

export interface EndpointConfig {
  baseUrl: string;
  endpoints: {
    latest: string;
    chart: string;
    history: string;
    stats: string;
  };
  tables: TableConfig[];
}

export interface DatabaseConfig {
  // PostgreSQL directo
  postgresHost?: string;
  postgresPort?: number;
  postgresDatabase?: string;
  postgresUser?: string;
  postgresPassword?: string;
  postgresSSL?: boolean;
  
  // Supabase (alternativo)
  supabaseUrl?: string;
  supabaseKey?: string;
  
  // Tipo de conexión
  connectionType: 'postgresql' | 'supabase';
}

export interface SystemConfig {
  id?: string;
  name: string;
  baseUrl: string;
  endpoints: {
    latest: string;
    chart: string;
    history: string;
    stats: string;
  };
  tables: TableConfig[];
  databaseConfig?: DatabaseConfig;
  createdAt?: string;
  updatedAt?: string;
}
