/*
  # Sistema de Configuración IoT Dashboard

  1. Nuevas Tablas
    - `system_configs` - Configuraciones principales del sistema
    - `table_configs` - Configuración de tablas de datos
    - `field_configs` - Configuración de campos por tabla

  2. Seguridad
    - Habilitar RLS en todas las tablas
    - Políticas para usuarios autenticados

  3. Funcionalidades
    - Gestión completa de configuraciones
    - Soporte para múltiples configuraciones
    - Configuración de endpoints y conexiones
    - Configuración granular de campos
*/

-- Tabla principal de configuraciones del sistema
CREATE TABLE IF NOT EXISTS system_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  base_url text NOT NULL,
  endpoints jsonb NOT NULL DEFAULT '{}',
  database_config jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de configuración de tablas
CREATE TABLE IF NOT EXISTS table_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid REFERENCES system_configs(id) ON DELETE CASCADE,
  name text NOT NULL,
  label text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(config_id, name)
);

-- Tabla de configuración de campos
CREATE TABLE IF NOT EXISTS field_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid REFERENCES table_configs(id) ON DELETE CASCADE,
  name text NOT NULL,
  label text NOT NULL,
  unit text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'number' CHECK (type IN ('number', 'string', 'date')),
  show_in_kpi boolean DEFAULT true,
  show_in_chart boolean DEFAULT true,
  show_in_stats boolean DEFAULT true,
  show_in_history boolean DEFAULT true,
  range_min numeric,
  range_max numeric,
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now(),
  UNIQUE(table_id, name)
);

-- Habilitar RLS
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_configs ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para system_configs
CREATE POLICY "Users can read system configs"
  ON system_configs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create system configs"
  ON system_configs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update system configs"
  ON system_configs
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete system configs"
  ON system_configs
  FOR DELETE
  TO authenticated
  USING (true);

-- Políticas de seguridad para table_configs
CREATE POLICY "Users can read table configs"
  ON table_configs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create table configs"
  ON table_configs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update table configs"
  ON table_configs
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete table configs"
  ON table_configs
  FOR DELETE
  TO authenticated
  USING (true);

-- Políticas de seguridad para field_configs
CREATE POLICY "Users can read field configs"
  ON field_configs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create field configs"
  ON field_configs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update field configs"
  ON field_configs
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete field configs"
  ON field_configs
  FOR DELETE
  TO authenticated
  USING (true);

-- Insertar configuración inicial por defecto
INSERT INTO system_configs (name, base_url, endpoints) VALUES (
  'Configuración por Defecto',
  'https://proyectos-iot.onrender.com',
  '{
    "latest": "/api/latest",
    "chart": "/api/chart", 
    "history": "/api/history",
    "stats": "/api/stats"
  }'
) ON CONFLICT DO NOTHING;

-- Obtener el ID de la configuración recién creada
DO $$
DECLARE
  config_id uuid;
  table1_id uuid;
  table2_id uuid;
  table3_id uuid;
BEGIN
  -- Obtener el ID de la configuración por defecto
  SELECT id INTO config_id FROM system_configs WHERE name = 'Configuración por Defecto' LIMIT 1;
  
  IF config_id IS NOT NULL THEN
    -- Insertar tablas de configuración
    INSERT INTO table_configs (config_id, name, label) VALUES
      (config_id, 'temhum1', 'Sensor Ambiental 1'),
      (config_id, 'temhum2', 'Sensor Ambiental 2'),
      (config_id, 'calidad_agua', 'Calidad del Agua')
    ON CONFLICT (config_id, name) DO NOTHING;
    
    -- Obtener IDs de las tablas
    SELECT id INTO table1_id FROM table_configs WHERE config_id = config_id AND name = 'temhum1';
    SELECT id INTO table2_id FROM table_configs WHERE config_id = config_id AND name = 'temhum2';
    SELECT id INTO table3_id FROM table_configs WHERE config_id = config_id AND name = 'calidad_agua';
    
    -- Insertar campos para temhum1
    IF table1_id IS NOT NULL THEN
      INSERT INTO field_configs (table_id, name, label, unit, type, show_in_kpi, show_in_chart, show_in_stats, show_in_history, range_min, range_max, color) VALUES
        (table1_id, 'temperatura', 'Temperatura', '°C', 'number', true, true, true, true, 18, 25, '#3B82F6'),
        (table1_id, 'humedad', 'Humedad', '%', 'number', true, true, true, true, 50, 70, '#10B981'),
        (table1_id, 'dew_point', 'Punto de Rocío', '°C', 'number', true, false, false, true, null, null, '#06B6D4')
      ON CONFLICT (table_id, name) DO NOTHING;
    END IF;
    
    -- Insertar campos para temhum2
    IF table2_id IS NOT NULL THEN
      INSERT INTO field_configs (table_id, name, label, unit, type, show_in_kpi, show_in_chart, show_in_stats, show_in_history, range_min, range_max, color) VALUES
        (table2_id, 'temperatura', 'Temperatura', '°C', 'number', true, true, true, true, 18, 25, '#3B82F6'),
        (table2_id, 'humedad', 'Humedad', '%', 'number', true, true, true, true, 50, 70, '#10B981'),
        (table2_id, 'dew_point', 'Punto de Rocío', '°C', 'number', true, false, false, true, null, null, '#06B6D4')
      ON CONFLICT (table_id, name) DO NOTHING;
    END IF;
    
    -- Insertar campos para calidad_agua
    IF table3_id IS NOT NULL THEN
      INSERT INTO field_configs (table_id, name, label, unit, type, show_in_kpi, show_in_chart, show_in_stats, show_in_history, range_min, range_max, color) VALUES
        (table3_id, 'ph', 'pH', 'pH', 'number', true, true, false, true, 5.5, 6.5, '#06B6D4'),
        (table3_id, 'ec', 'Conductividad', 'µS/cm', 'number', true, true, false, true, 800, 1500, '#F59E0B'),
        (table3_id, 'ppm', 'PPM', 'ppm', 'number', true, true, false, true, 400, 750, '#EF4444')
      ON CONFLICT (table_id, name) DO NOTHING;
    END IF;
  END IF;
END $$;