import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import api from '@/services/api'

/*
  Login e logout. Em qualquer página:

    import { useAuthStore } from '@/stores/auth'
    const auth = useAuthStore()

    await auth.entrar(email, senha)   // faz o login
    auth.sair()                       // faz o logout
    auth.logado                       // true ou false
    auth.usuario                      // dados do usuário (se o back-end enviar)

  Os dados ficam salvos no navegador, então o login continua depois de recarregar a página.
*/
function lerUsuarioSalvo() {
  try {
    return JSON.parse(localStorage.getItem('usuario') || 'null')
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const usuario = ref(lerUsuarioSalvo())
  const logado = computed(() => !!token.value)

  async function entrar(email, senha) {
    // AJUSTE: a rota e o formato da resposta conforme o back-end da equipe
    const { data } = await api.post('/auth/login', { email, senha })

    token.value = data.token
    usuario.value = data.usuario ?? null
    localStorage.setItem('token', token.value)
    localStorage.setItem('usuario', JSON.stringify(usuario.value))
  }

  function sair() {
    token.value = ''
    usuario.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
  }

  return { token, usuario, logado, entrar, sair }
})
