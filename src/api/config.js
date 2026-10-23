import axios from 'axios'

// ============================================================
// Configurações gerais
// ============================================================

export const NOME_SITE = 'Meu Site'

export const API_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000/api/'
).replace(/\/+$/, '') + '/'

export const BASE_URL = API_URL

// ============================================================
// Gerenciamento de tokens
// ============================================================

export function getToken(key) {
  return (
    localStorage.getItem(key) ||
    sessionStorage.getItem(key)
  )
}

export function setTokens(
  access,
  refresh,
  remember = false,
) {
  clearTokens()

  const storage = remember
    ? localStorage
    : sessionStorage

  storage.setItem('access_token', access)
  storage.setItem('refresh_token', refresh)
}

export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')

  sessionStorage.removeItem('access_token')
  sessionStorage.removeItem('refresh_token')
}

// ============================================================
// Eventos de autenticação
// ============================================================

function emitirEvento(nome, detail = {}) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent(nome, { detail }),
  )
}

function redirecionarParaLogin() {
  if (typeof window === 'undefined') {
    return
  }

  if (
    window.location.pathname.toLowerCase() !== '/login'
  ) {
    window.location.replace('/login')
  }
}

function ehRotaPublicaDeAutenticacao(url = '') {
  const rotas = [
    '/token/',
    '/registro/',
    '/verificar-email/',
    '/reenviar-codigo/',
  ]

  return rotas.some((rota) => url.includes(rota))
}

// ============================================================
// Cliente Axios centralizado
// ============================================================

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,

  headers: {
    'Content-Type': 'application/json',
  },
})

// ============================================================
// Interceptor de requisição
// ============================================================

apiClient.interceptors.request.use(
  (config) => {
    const token = getToken('access_token')

    config.headers = config.headers || {}

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      delete config.headers.Authorization
    }

    return config
  },
)

// ============================================================
// Interceptor de resposta
// ============================================================

apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const original = error.config

    const resposta = error.response?.data

    error.mensagem = (
      typeof resposta === 'string'
        ? resposta
        : resposta?.detail ||
          resposta?.mensagem ||
          resposta?.message ||
          resposta?.non_field_errors?.[0] ||
          (
            error.code === 'ECONNABORTED'
              ? 'A requisição demorou demais.'
              : ''
          ) ||
          (
            error.response
              ? `Erro ${error.response.status}.`
              : 'Sem conexão com o servidor.'
          )
    )

    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      ehRotaPublicaDeAutenticacao(original.url)
    ) {
      return Promise.reject(error)
    }

    original._retry = true

    const refreshToken = getToken('refresh_token')

    if (!refreshToken) {
      clearTokens()

      emitirEvento('auth:expired')

      redirecionarParaLogin()

      return Promise.reject(error)
    }

    const manterConectado = Boolean(
      localStorage.getItem('refresh_token'),
    )

    try {
      // Utiliza o Axios diretamente para evitar
      // recursão no interceptor de renovação.

      const { data } = await axios.post(
        `${BASE_URL}token/refresh/`,
        {
          refresh: refreshToken,
        },
        {
          timeout: 20000,

          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      if (!data.access) {
        throw new Error(
          'O servidor não retornou um novo access token.',
        )
      }

      const novoRefresh = data.refresh || refreshToken

      setTokens(
        data.access,
        novoRefresh,
        manterConectado,
      )

      emitirEvento(
        'auth:tokens-refreshed',
        {
          access: data.access,
          refresh: novoRefresh,
        },
      )

      original.headers = original.headers || {}

      original.headers.Authorization = (
        `Bearer ${data.access}`
      )

      return apiClient(original)
    } catch (erroRenovacao) {
      clearTokens()

      emitirEvento('auth:expired')

      redirecionarParaLogin()

      return Promise.reject(erroRenovacao)
    }
  },
)

// ============================================================
// Exportação principal
// ============================================================

export default apiClient