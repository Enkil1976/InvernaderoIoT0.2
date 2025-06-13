import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

export interface TableConfig {
  id?: string;
  name: string;
  label: string;
  fields: FieldConfig[];
  configId?: string;
}

export interface FieldConfig {
  id?: string;
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
  tableId?: string;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private supabase: SupabaseClient | null = null;
  private postgresConnection: any = null;
  private isConnected = false;
  private connectionError: string | null = null;
  private connectionType: 'postgresql' | 'supabase' | null = null;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async connect(config: DatabaseConfig): Promise<{ success: boolean; error?: string }> {
    try {
      this.connectionType = config.connectionType;

      if (config.connectionType === 'postgresql') {
        return await this.connectToPostgreSQL(config);
      } else {
        return await this.connectToSupabase(config);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      this.connectionError = errorMessage;
      this.isConnected = false;
      return { success: false, error: errorMessage };
    }
  }

  private async connectToPostgreSQL(config: DatabaseConfig): Promise<{ success: boolean; error?: string }> {
    try {
      // Para el entorno del navegador, simularemos la conexión PostgreSQL
      // En un entorno real, esto se manejaría a través de un backend
      const connectionString = `postgresql://${config.postgresUser}:${config.postgresPassword}@${config.postgresHost}:${config.postgresPort}/${config.postgresDatabase}${config.postgresSSL ? '?sslmode=require' : ''}`;
      
      // Validar parámetros de conexión
      if (!config.postgresHost || !config.postgresUser || !config.postgresDatabase) {
        throw new Error('Faltan parámetros de conexión PostgreSQL requeridos');
      }

      // Simular conexión (en producción esto sería una llamada real al backend)
      await this.simulatePostgreSQLConnection(config);
      
      this.isConnected = true;
      this.connectionError = null;
      
      // Crear las tablas si no existen
      await this.createPostgreSQLTables();
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'PostgreSQL connection failed';
      this.connectionError = errorMessage;
      this.isConnected = false;
      return { success: false, error: errorMessage };
    }
  }

  private async simulatePostgreSQLConnection(config: DatabaseConfig): Promise<void> {
    // Simular tiempo de conexión
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simular validación de credenciales
    if (config.postgresUser === 'invalid' || config.postgresPassword === 'invalid') {
      throw new Error('Credenciales de PostgreSQL inválidas');
    }
    
    // En un entorno real, aquí se establecería la conexión real
    console.log('Simulando conexión a PostgreSQL:', {
      host: config.postgresHost,
      port: config.postgresPort,
      database: config.postgresDatabase,
      user: config.postgresUser,
      ssl: config.postgresSSL
    });
  }

  private async createPostgreSQLTables(): Promise<void> {
    // En un entorno real, esto ejecutaría las consultas SQL reales
    const createTablesSQL = `
      -- Tabla principal de configuraciones del sistema
      CREATE TABLE IF NOT EXISTS system_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        base_url TEXT NOT NULL,
        endpoints JSONB NOT NULL DEFAULT '{}',
        database_config JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Tabla de configuración de tablas
      CREATE TABLE IF NOT EXISTS table_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        config_id UUID REFERENCES system_configs(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        label TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(config_id, name)
      );

      -- Tabla de configuración de campos
      CREATE TABLE IF NOT EXISTS field_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        table_id UUID REFERENCES table_configs(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        label TEXT NOT NULL,
        unit TEXT NOT NULL DEFAULT '',
        type TEXT NOT NULL DEFAULT 'number' CHECK (type IN ('number', 'string', 'date')),
        show_in_kpi BOOLEAN DEFAULT true,
        show_in_chart BOOLEAN DEFAULT true,
        show_in_stats BOOLEAN DEFAULT true,
        show_in_history BOOLEAN DEFAULT true,
        range_min NUMERIC,
        range_max NUMERIC,
        color TEXT DEFAULT '#3B82F6',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(table_id, name)
      );

      -- Insertar configuración inicial
      INSERT INTO system_configs (name, base_url, endpoints) VALUES (
        'Configuración PostgreSQL por Defecto',
        'https://proyectos-iot.onrender.com',
        '{"latest": "/api/latest", "chart": "/api/chart", "history": "/api/history", "stats": "/api/stats"}'
      ) ON CONFLICT DO NOTHING;
    `;
    
    console.log('Creando tablas PostgreSQL:', createTablesSQL);
  }

  private async connectToSupabase(config: DatabaseConfig): Promise<{ success: boolean; error?: string }> {
    if (!config.supabaseUrl || !config.supabaseKey) {
      return { success: false, error: 'URL y clave de Supabase son requeridos' };
    }

    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    
    // Test connection
    const { data, error } = await this.supabase
      .from('system_configs')
      .select('count')
      .limit(1);

    if (error) {
      this.connectionError = error.message;
      this.isConnected = false;
      return { success: false, error: error.message };
    }

    this.isConnected = true;
    this.connectionError = null;
    return { success: true };
  }

  async testPostgreSQLConnection(config: DatabaseConfig): Promise<{ success: boolean; error?: string }> {
    try {
      // Validar parámetros
      if (!config.postgresHost || !config.postgresUser || !config.postgresDatabase) {
        return { success: false, error: 'Faltan parámetros de conexión requeridos' };
      }

      // Simular prueba de conexión
      await this.simulatePostgreSQLConnection(config);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'PostgreSQL connection test failed';
      return { success: false, error: errorMessage };
    }
  }

  async saveSystemConfig(config: SystemConfig): Promise<{ success: boolean; error?: string; data?: SystemConfig }> {
    if (!this.isConnected) {
      return { success: false, error: 'Database not connected' };
    }

    try {
      if (this.connectionType === 'postgresql') {
        return await this.saveSystemConfigPostgreSQL(config);
      } else {
        return await this.saveSystemConfigSupabase(config);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save configuration';
      return { success: false, error: errorMessage };
    }
  }

  private async saveSystemConfigPostgreSQL(config: SystemConfig): Promise<{ success: boolean; error?: string; data?: SystemConfig }> {
    // En un entorno real, esto ejecutaría consultas SQL reales
    console.log('Guardando configuración en PostgreSQL:', config);
    
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const savedConfig: SystemConfig = {
      ...config,
      id: config.id || `pg_${Date.now()}`,
      createdAt: config.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Guardar en localStorage como fallback para la demo
    const existingConfigs = JSON.parse(localStorage.getItem('postgresql-configs') || '[]');
    const configIndex = existingConfigs.findIndex((c: SystemConfig) => c.id === savedConfig.id);
    
    if (configIndex >= 0) {
      existingConfigs[configIndex] = savedConfig;
    } else {
      existingConfigs.push(savedConfig);
    }
    
    localStorage.setItem('postgresql-configs', JSON.stringify(existingConfigs));
    
    return { success: true, data: savedConfig };
  }

  private async saveSystemConfigSupabase(config: SystemConfig): Promise<{ success: boolean; error?: string; data?: SystemConfig }> {
    if (!this.supabase) {
      return { success: false, error: 'Supabase not connected' };
    }

    const configData = {
      name: config.name,
      base_url: config.baseUrl,
      endpoints: config.endpoints,
      database_config: config.databaseConfig,
      updated_at: new Date().toISOString()
    };

    let result;
    if (config.id) {
      result = await this.supabase
        .from('system_configs')
        .update(configData)
        .eq('id', config.id)
        .select()
        .single();
    } else {
      result = await this.supabase
        .from('system_configs')
        .insert({ ...configData, created_at: new Date().toISOString() })
        .select()
        .single();
    }

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    const savedConfig = result.data;
    await this.saveTablesConfigSupabase(savedConfig.id, config.tables);

    return { success: true, data: await this.getSystemConfig(savedConfig.id) };
  }

  private async saveTablesConfigSupabase(configId: string, tables: TableConfig[]): Promise<void> {
    if (!this.supabase) return;

    await this.supabase
      .from('table_configs')
      .delete()
      .eq('config_id', configId);

    for (const table of tables) {
      const { data: tableData, error: tableError } = await this.supabase
        .from('table_configs')
        .insert({
          config_id: configId,
          name: table.name,
          label: table.label,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (tableError || !tableData) continue;

      const fieldsData = table.fields.map(field => ({
        table_id: tableData.id,
        name: field.name,
        label: field.label,
        unit: field.unit,
        type: field.type,
        show_in_kpi: field.showInKPI,
        show_in_chart: field.showInChart,
        show_in_stats: field.showInStats,
        show_in_history: field.showInHistory,
        range_min: field.range?.min,
        range_max: field.range?.max,
        color: field.color,
        created_at: new Date().toISOString()
      }));

      await this.supabase
        .from('field_configs')
        .insert(fieldsData);
    }
  }

  async getSystemConfig(configId?: string): Promise<SystemConfig | undefined> {
    if (!this.isConnected) return undefined;

    try {
      if (this.connectionType === 'postgresql') {
        return await this.getSystemConfigPostgreSQL(configId);
      } else {
        return await this.getSystemConfigSupabase(configId);
      }
    } catch (error) {
      console.error('Error loading system config:', error);
      return undefined;
    }
  }

  private async getSystemConfigPostgreSQL(configId?: string): Promise<SystemConfig | undefined> {
    // Cargar desde localStorage para la demo
    const configs = JSON.parse(localStorage.getItem('postgresql-configs') || '[]');
    
    if (configId) {
      return configs.find((c: SystemConfig) => c.id === configId) || undefined;
    } else {
      return configs.length > 0 ? configs[configs.length - 1] : undefined;
    }
  }

  private async getSystemConfigSupabase(configId?: string): Promise<SystemConfig | undefined> {
    if (!this.supabase) return undefined;

    let query = this.supabase
      .from('system_configs')
      .select(`
        *,
        table_configs (
          *,
          field_configs (*)
        )
      `);

    if (configId) {
      query = query.eq('id', configId);
    } else {
      query = query.order('created_at', { ascending: false }).limit(1);
    }

    const { data, error } = await query.single();

    if (error || !data) return undefined;

    return {
      id: data.id,
      name: data.name,
      baseUrl: data.base_url,
      endpoints: data.endpoints,
      databaseConfig: data.database_config,
      tables: data.table_configs.map((table: any) => ({
        id: table.id,
        name: table.name,
        label: table.label,
        fields: table.field_configs.map((field: any) => ({
          id: field.id,
          name: field.name,
          label: field.label,
          unit: field.unit,
          type: field.type,
          showInKPI: field.show_in_kpi,
          showInChart: field.show_in_chart,
          showInStats: field.show_in_stats,
          showInHistory: field.show_in_history,
          range: field.range_min !== null && field.range_max !== null 
            ? { min: field.range_min, max: field.range_max }
            : undefined,
          color: field.color
        }))
      })),
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async getAllSystemConfigs(): Promise<SystemConfig[]> {
    if (!this.isConnected) return [];

    try {
      if (this.connectionType === 'postgresql') {
        return await this.getAllSystemConfigsPostgreSQL();
      } else {
        return await this.getAllSystemConfigsSupabase();
      }
    } catch (error) {
      console.error('Error loading system configs:', error);
      return [];
    }
  }

  private async getAllSystemConfigsPostgreSQL(): Promise<SystemConfig[]> {
    const configs = JSON.parse(localStorage.getItem('postgresql-configs') || '[]');
    return configs.map((config: SystemConfig) => ({
      id: config.id,
      name: config.name,
      baseUrl: '',
      endpoints: { latest: '', chart: '', history: '', stats: '' },
      tables: [],
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    }));
  }

  private async getAllSystemConfigsSupabase(): Promise<SystemConfig[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from('system_configs')
      .select('id, name, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(config => ({
      id: config.id,
      name: config.name,
      baseUrl: '',
      endpoints: { latest: '', chart: '', history: '', stats: '' },
      tables: [],
      createdAt: config.created_at,
      updatedAt: config.updated_at
    }));
  }

  async deleteSystemConfig(configId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isConnected) {
      return { success: false, error: 'Database not connected' };
    }

    try {
      if (this.connectionType === 'postgresql') {
        return await this.deleteSystemConfigPostgreSQL(configId);
      } else {
        return await this.deleteSystemConfigSupabase(configId);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete configuration';
      return { success: false, error: errorMessage };
    }
  }

  private async deleteSystemConfigPostgreSQL(configId: string): Promise<{ success: boolean; error?: string }> {
    const configs = JSON.parse(localStorage.getItem('postgresql-configs') || '[]');
    const filteredConfigs = configs.filter((c: SystemConfig) => c.id !== configId);
    localStorage.setItem('postgresql-configs', JSON.stringify(filteredConfigs));
    return { success: true };
  }

  private async deleteSystemConfigSupabase(configId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Supabase not connected' };
    }

    const { error } = await this.supabase
      .from('system_configs')
      .delete()
      .eq('id', configId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  isConnectedToDatabase(): boolean {
    return this.isConnected;
  }

  getConnectionError(): string | null {
    return this.connectionError;
  }

  getConnectionType(): 'postgresql' | 'supabase' | null {
    return this.connectionType;
  }

  disconnect(): void {
    this.supabase = null;
    this.postgresConnection = null;
    this.isConnected = false;
    this.connectionError = null;
    this.connectionType = null;
  }
}
