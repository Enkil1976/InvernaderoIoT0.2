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