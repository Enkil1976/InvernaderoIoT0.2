import { AlertRange } from '../types';

export const ALERT_RANGES: AlertRange = {
  temperatura: { min: 18, max: 25 },
  humedad: { min: 50, max: 70 },
  ph: { min: 5.5, max: 6.5 },
  ec: { min: 800, max: 1500 },
  ppm: { min: 400, max: 750 }
};

export function isValueInRange(value: number, range: { min: number; max: number }): boolean {
  return value >= range.min && value <= range.max;
}

export function getAlertLevel(value: number, range: { min: number; max: number }): 'normal' | 'warning' | 'danger' {
  if (isValueInRange(value, range)) return 'normal';
  
  const deviation = Math.min(
    Math.abs(value - range.min) / range.min,
    Math.abs(value - range.max) / range.max
  );
  
  return deviation > 0.2 ? 'danger' : 'warning';
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
}