# Invernadero IoT Dashboard

Aplicación de monitoreo en tiempo real para invernaderos que permite visualizar y analizar datos de sensores ambientales. Desarrollada con React, TypeScript y Supabase.

## Características Principales

- **Panel de Estado**: Visualización en tiempo real de las métricas de los sensores
- **Gráficos Interactivos**: Visualización de tendencias históricas de temperatura, humedad y otros parámetros
- **Histórico de Datos**: Consulta de registros históricos con filtros avanzados
- **Estadísticas**: Análisis estadístico de los datos recolectados
- **Panel de Configuración**: Personalización de la visualización de datos y rangos de alerta
- **Diseño Responsivo**: Accesible desde dispositivos móviles y de escritorio

## Tecnologías Utilizadas

- **Frontend**:
  - React 18
  - TypeScript
  - Tailwind CSS
  - Recharts
  - Lucide Icons
  - Vite

- **Backend/Base de Datos**:
  - Supabase
  - PostgreSQL

## Requisitos del Sistema

- Node.js 16 o superior
- npm 8 o superior
- Navegador web moderno (Chrome, Firefox, Safari, Edge)

## Instalación

1. Clonar el repositorio:
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd invernadero-iot-dashboard
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno:
   Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:
   ```
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
   ```

4. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

5. Abrir [http://localhost:5173](http://localhost:5173) en tu navegador.

## Estructura del Proyecto

```
src/
├── components/         # Componentes de React
│   ├── ChartsPanel.tsx  # Panel de gráficos
│   ├── ConfigPanel.tsx  # Panel de configuración
│   ├── HistoryPanel.tsx # Historial de datos
│   ├── Sidebar.tsx      # Barra lateral de navegación
│   ├── StatsPanel.tsx   # Panel de estadísticas
│   └── StatusPanel.tsx  # Panel de estado
├── contexts/            # Contextos de React
│   └── ConfigContext.tsx# Contexto de configuración
├── services/            # Servicios
│   ├── api.ts           # Servicio de API
│   └── database.ts      # Configuración de base de datos
├── types/               # Definiciones de tipos TypeScript
└── utils/               # Utilidades
```

## Configuración

La aplicación permite configurar:
- Rangos óptimos para cada parámetro
- Visualización de KPIs
- Colores de las series en los gráficos
- Unidades de medida
- Intervalos de actualización

## Modo Desarrollo

Para desarrollo, la aplicación incluye datos de prueba que se pueden activar configurando `useMockData` a `true` en el servicio de API.

## Despliegue

Para desplegar la aplicación en producción:

1. Construir la versión optimizada:
   ```bash
   npm run build
   ```

2. Los archivos estáticos generados estarán en el directorio `dist/`.

## Contribución

1. Hacer fork del proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Hacer commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Hacer push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Contacto

Para soporte o consultas, por favor contactar al equipo de desarrollo.
