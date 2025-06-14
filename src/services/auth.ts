import axios, { AxiosResponse } from 'axios';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    created_at: string;
    role: 'admin' | 'user';
  };
  // Permitir que el backend envíe el role a nivel raíz (opcional)
  role?: 'admin' | 'user';
}

export interface RegisterResponse {
  user: {
    id: number;
    username: string;
    email: string;
    created_at: string;
    role: 'admin' | 'user';
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class AuthService {
  private baseURL: string;
  private authToken: string | null = null;

  constructor() {
    // Usar la misma URL base que el resto de la aplicación
    this.baseURL = 'https://proyectos-iot.onrender.com';
    
    // Configurar interceptor para incluir token automáticamente
    axios.interceptors.request.use(
      (config) => {
        if (this.authToken && config.url?.includes(this.baseURL)) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para manejar respuestas de error de autenticación
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado o inválido
          this.clearAuthToken();
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          
          // Redirigir al login si no estamos ya en la página de auth
          if (!window.location.pathname.includes('/auth')) {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  async login(username: string, password: string): Promise<ApiResponse<LoginResponse>> {
    try {
      const response: AxiosResponse<LoginResponse> = await axios.post(
        `${this.baseURL}/api/auth/login`,
        { username, password },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.response?.data?.message) {
        return {
          success: false,
          error: error.response.data.message,
        };
      } else if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Credenciales inválidas',
        };
      } else if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Usuario no encontrado',
        };
      } else if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Tiempo de espera agotado',
        };
      } else {
        return {
          success: false,
          error: 'Error de conexión con el servidor',
        };
      }
    }
  }

  async register(username: string, email: string, password: string): Promise<ApiResponse<RegisterResponse>> {
    try {
      const response: AxiosResponse<RegisterResponse> = await axios.post(
        `${this.baseURL}/api/auth/register`,
        { username, email, password },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Register error:', error);
      
      if (error.response?.data?.message) {
        return {
          success: false,
          error: error.response.data.message,
        };
      } else if (error.response?.status === 409) {
        return {
          success: false,
          error: 'El usuario o email ya existe',
        };
      } else if (error.response?.status === 400) {
        return {
          success: false,
          error: 'Datos inválidos',
        };
      } else if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Tiempo de espera agotado',
        };
      } else {
        return {
          success: false,
          error: 'Error de conexión con el servidor',
        };
      }
    }
  }

  // Método para verificar si el token es válido
  async verifyToken(): Promise<boolean> {
    if (!this.authToken) return false;

    try {
      // Hacer una petición a un endpoint protegido para verificar el token
      await axios.get(`${this.baseURL}/api/auth/verify`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
        timeout: 5000,
      });
      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }
}

export const authService = new AuthService();
