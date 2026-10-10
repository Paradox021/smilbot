import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const BOT_API_KEY = process.env.BOT_API_KEY?.trim();

if (!BOT_API_KEY) {
  throw new Error(
    'BOT_API_KEY no está definida. Configúrala en .env con el mismo valor que BOT_API_KEY del backend.'
  );
}

const AUTH_ERROR_MESSAGES = ['API key del bot inválida', 'No autenticado'];
const REDACTED = '[REDACTED]';

export const api = axios.create({
  baseURL: process.env.BACKEND_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// La cabecera se añade por petición (y no en api.defaults) para que la clave
// no aparezca si alguien imprime la instancia o su configuración por defecto.
api.interceptors.request.use(config => {
  config.headers.set('Authorization', `Bot ${BOT_API_KEY}`);
  return config;
});

/**
 * Oculta la clave en los objetos que acompañan a respuestas y errores de axios,
 * para que un console.error(err) o console.log(response) no la filtre.
 */
function redactAuth(target: AxiosError | AxiosResponse): void {
  const configs: (InternalAxiosRequestConfig | undefined)[] = [target.config];
  if (target instanceof AxiosError) configs.push(target.response?.config);

  for (const config of configs) {
    if (config?.headers?.has('Authorization')) {
      config.headers.set('Authorization', REDACTED);
    }
  }

  // El objeto request (ClientRequest) guarda las cabeceras en crudo: se oculta de util.inspect.
  const holders: object[] = [target];
  if (target instanceof AxiosError && target.response) holders.push(target.response);
  for (const holder of holders) {
    if ('request' in holder) {
      Object.defineProperty(holder, 'request', { enumerable: false });
    }
  }
}

api.interceptors.response.use(
  response => {
    redactAuth(response);
    return response;
  },
  (error: unknown) => {
    if (!(error instanceof AxiosError)) return Promise.reject(error);

    redactAuth(error);

    const status = error.response?.status;
    const backendError = (error.response?.data as { error?: unknown } | undefined)?.error;
    const route = `${error.config?.method?.toUpperCase()} ${error.config?.url}`;

    if (status === 401) {
      if (typeof backendError === 'string' && AUTH_ERROR_MESSAGES.includes(backendError)) {
        console.error(`[API] 401 en ${route}: BOT_API_KEY incorrecta o ausente (${backendError}).`);
      } else {
        console.error(`[API] 401 en ${route}:`, backendError ?? 'sin detalle');
      }
    } else if (status === 403) {
      console.error(`[API] 403 en ${route}:`, backendError ?? 'sin detalle');
    }

    // Los errores de autenticación no se reintentan: se propagan al llamador.
    return Promise.reject(error);
  }
);
