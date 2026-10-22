import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import authApi from '@/api/authApi'
import {
  setTokens,
  clearTokens,
  getToken,
} from '@/api/config'

const CHAVE_EMAIL_PENDENTE = 'pending_verification_email'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const pendingEmail = ref(
    typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem(CHAVE_EMAIL_PENDENTE)
      : null,
  )

  const accessToken = ref(getToken('access_token'))
  const refreshToken = ref(getToken('refresh_token'))

  const isAuthenticated = computed(
    () => Boolean(accessToken.value),
  )

  function definirEmailPendente(email) {
    pendingEmail.value = email || null

    if (typeof sessionStorage === 'undefined') return

    if (email) {
      sessionStorage.setItem(CHAVE_EMAIL_PENDENTE, email)
    } else {
      sessionStorage.removeItem(CHAVE_EMAIL_PENDENTE)
    }
  }

  function mostrarCodigoDeTeste(resposta, origem) {
    const codigo = resposta?.debug_verification_code

    if (!codigo) return

    console.info(
      `[MODO DE TESTE] Código de verificação (${origem}):`,
      codigo,
    )
  }

  function aplicarTema(tema) {
    const temaApi =
      tema === 'Claro' || tema === 'claro'
        ? 'Claro'
        : 'Escuro'

    const temaInterface =
      temaApi === 'Claro' ? 'claro' : 'escuro'

    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute(
        'data-theme',
        temaInterface,
      )
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tema', temaInterface)
    }
  }

  async function setTheme(tema) {
    const temaApi =
      tema === 'Claro' || tema === 'claro'
        ? 'Claro'
        : 'Escuro'

    aplicarTema(temaApi)

    if (!isAuthenticated.value) return

    try {
      await updateUser({ theme: temaApi })
    } catch (err) {
      console.error('Erro ao salvar tema', err)
    }
  }

  async function login(email, password, rememberMe = false) {
    loading.value = true
    error.value = null

    try {
      const { data } = await authApi.login(
        email,
        password,
      )

      if (!data?.access || !data?.refresh) {
        throw new Error(
          'O servidor não retornou os tokens de autenticação esperados.',
        )
      }

      accessToken.value = data.access
      refreshToken.value = data.refresh

      setTokens(
        data.access,
        data.refresh,
        rememberMe,
      )

      definirEmailPendente(null)

      return data
    } catch (err) {
      error.value =
        err.mensagem
        || err.response?.data?.detail
        || err.response?.data?.non_field_errors?.[0]
        || 'Erro ao fazer login.'

      throw err
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    error.value = null

    definirEmailPendente(null)
    clearTokens()
  }

  async function fetchUser() {
    if (!accessToken.value) return null

    loading.value = true
    error.value = null

    try {
      const response = await authApi.me()

      user.value = response.data

      if (user.value?.theme) {
        aplicarTema(user.value.theme)
      }

      return user.value
    } catch (err) {
      error.value =
        err.mensagem
        || err.response?.data?.detail
        || 'Erro ao carregar usuário.'

      if (err.response?.status === 401) {
        logout()
      }

      console.error(err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function register(data) {
    loading.value = true
    error.value = null

    definirEmailPendente(data.email)

    try {
      const response = await authApi.register(data)

      mostrarCodigoDeTeste(
        response.data,
        'cadastro',
      )

      return response.data
    } catch (err) {
      error.value =
        err.mensagem
        || err.response?.data?.detail
        || err.response?.data?.email?.[0]
        || err.response?.data?.name?.[0]
        || err.response?.data?.password?.[0]
        || 'Erro ao criar usuário.'

      definirEmailPendente(null)

      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateUser(payload) {
    const { data } = await authApi.updateMe(payload)

    user.value = data

    return data
  }

  async function uploadPhoto(file) {
    return authApi.uploadImage(file)
  }

  async function changePassword(
    currentPassword,
    newPassword,
  ) {
    loading.value = true
    error.value = null

    try {
      await authApi.changePassword(
        currentPassword,
        newPassword,
      )
    } catch (err) {
      error.value =
        err.mensagem
        || err.response?.data?.current_password?.[0]
        || err.response?.data?.new_password?.[0]
        || 'Erro ao alterar a senha.'

      throw err
    } finally {
      loading.value = false
    }
  }

  async function verify2FA(codigo) {
    const email = pendingEmail.value

    if (!email) {
      throw new Error(
        'E-mail não encontrado para verificação.',
      )
    }

    const { data } = await authApi.verifyEmail(
      email,
      codigo,
    )

    if (!data?.access || !data?.refresh) {
      throw new Error(
        'O servidor não retornou os tokens após a verificação.',
      )
    }

    accessToken.value = data.access
    refreshToken.value = data.refresh

    setTokens(
      data.access,
      data.refresh,
      false,
    )

    definirEmailPendente(null)

    await fetchUser()

    return data
  }

  async function resend2FACode() {
    const email =
      pendingEmail.value || user.value?.email

    if (!email) {
      throw new Error(
        'E-mail não encontrado para reenvio.',
      )
    }

    const response =
      await authApi.resendVerificationCode(email)

    mostrarCodigoDeTeste(
      response.data,
      'reenvio',
    )

    return response
  }

  if (typeof window !== 'undefined') {
    window.addEventListener(
      'auth:tokens-refreshed',
      (event) => {
        const tokens = event.detail || {}

        if (tokens.access) {
          accessToken.value = tokens.access
        }

        if (tokens.refresh) {
          refreshToken.value = tokens.refresh
        }
      },
    )

    window.addEventListener('auth:expired', () => {
      user.value = null
      accessToken.value = null
      refreshToken.value = null
    })
  }

  return {
    user,
    accessToken,
    refreshToken,
    pendingEmail,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    fetchUser,
    register,
    updateUser,
    uploadPhoto,
    changePassword,
    setTheme,
    verify2FA,
    resend2FACode,
  }
})