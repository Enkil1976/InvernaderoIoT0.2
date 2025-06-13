# ConfigPanel Documentation

## Overview
The ConfigPanel component provides a comprehensive interface for configuring the IoT Dashboard system. It handles:
- Database connections (PostgreSQL, Supabase, Redis)
- API endpoint configuration
- Sensor table and field definitions
- System configuration management

## Features

### Database Configuration
- Supports multiple database types:
  - Direct PostgreSQL connection
  - Supabase integration
  - Redis caching
- Connection testing functionality
- SSL configuration options
- Connection status monitoring

### API Configuration
- Base URL configuration
- Customizable endpoints for:
  - Latest data
  - Chart data
  - Historical data
  - Statistics
- Endpoint testing functionality

### Table/Field Management
- Define sensor data tables
- Configure fields with:
  - Data types (number, string, date)
  - Display settings (KPI, charts, stats, history)
  - Units and labels
  - Value ranges (for numbers)
  - Color coding
- Add/remove tables and fields

### Configuration Management
- Save configurations:
  - Locally (browser storage)
  - To database (when connected)
- Import/export configurations
- Reset to defaults
- Load saved configurations

## Technical Details

### Interfaces
```typescript
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

interface DatabaseConfig {
  connectionType: 'postgresql' | 'supabase';
  postgresHost: string;
  postgresPort: number;
  postgresDatabase: string;
  postgresUser: string;
  postgresPassword: string;
  postgresSSL: boolean;
  supabaseUrl: string;
  supabaseKey: string;
  redisUrl: string;
  redisPassword: string;
}
```

### Default Configuration
```typescript
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
        // ... more default fields
      ]
    }
  ]
};
```

## Usage Examples

### Connecting to PostgreSQL
1. Select "PostgreSQL Directo" connection type
2. Enter connection details:
   - Host: Your PostgreSQL server
   - Port: 5432 (default)
   - Database: Database name
   - Username/Password: Credentials
3. Click "Probar Conexión" to test
4. Click "Conectar" to establish connection

### Configuring API Endpoints
1. Navigate to "Endpoints de API" tab
2. Set base URL (e.g., https://your-api.example.com)
3. Configure individual endpoints:
   - /api/latest - Current sensor readings
   - /api/chart - Data for charts
   - /api/history - Historical data
   - /api/stats - Statistical data
4. Test endpoints using "Probar Todos" button

### Defining Sensor Tables
1. Navigate to "Configuración de Tablas" tab
2. Add/edit tables:
   - Name: Internal table name
   - Label: Display name
3. Add fields to tables:
   - Configure data types and display options
   - Set ranges for numerical values
   - Assign colors for visual identification

## Best Practices

1. **Database Connections**
   - Use SSL for production PostgreSQL connections
   - Store Supabase credentials securely
   - Test connections before saving

2. **API Configuration**
   - Ensure endpoints match your backend API
   - Test all endpoints after configuration
   - Use HTTPS for production

3. **Field Configuration**
   - Set appropriate ranges for numerical values
   - Use consistent naming conventions
   - Assign distinct colors for better visualization

4. **Configuration Management**
   - Export configurations before major changes
   - Name saved configurations descriptively
   - Store database credentials securely

## Troubleshooting

### Connection Issues
- Verify database server is running
- Check network connectivity
- Validate credentials
- Review error messages in console

### API Errors
- Verify endpoint URLs
- Check CORS configuration on server
- Test endpoints directly in browser/Postman

### Configuration Problems
- Reset to defaults if configuration becomes corrupted
- Check browser console for errors
- Verify configuration JSON structure when importing
