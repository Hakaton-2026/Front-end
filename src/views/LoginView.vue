<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import '@/assets/style-telas/login.css'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({
  email: '',
  senha: '',
})

const erro = ref('')
const enviando = ref(false)
const precisaVerificarEmail = ref(false)
const emailNaoVerificado = ref('')
const indoParaVerificacao = ref(false)

function extrairMensagens(valor) {
  if (typeof valor === 'string') {
    return valor
  }

  if (Array.isArray(valor)) {
    return valor
      .map(extrairMensagens)
      .filter(Boolean)
      .join(' ')
  }

  if (valor && typeof valor === 'object') {
    return Object.values(valor)
      .map(extrairMensagens)
      .filter(Boolean)
      .join(' ')
  }

  return ''
}

function erroDeEmailNaoVerificado(error) {
  const dados = error.response?.data

  if (dados?.code === 'email_not_verified') {
    return true
  }

  const mensagem = [
    extrairMensagens(dados),
    error.mensagem || '',
  ]
    .join(' ')
    .toLowerCase()

  return (
    mensagem.includes('verificar seu e-mail')
    || mensagem.includes('verificar o e-mail')
    || mensagem.includes('email_not_verified')
    || mensagem.includes('e-mail não verificado')
  )
}

function mensagemDeErro(error) {
  const dados = error.response?.data

  if (typeof dados === 'string' && dados.trim()) {
    return dados
  }

  if (Array.isArray(dados)) {
    return extrairMensagens(dados)
  }

  if (dados?.detail) {
    return extrairMensagens(dados.detail)
  }

  if (dados?.non_field_errors?.length) {
    return extrairMensagens(dados.non_field_errors)
  }

  if (dados && typeof dados === 'object') {
    const mensagem = extrairMensagens(dados)

    if (mensagem) return mensagem
  }

  if (
    error.mensagem
    && !/^Erro \d+\.$/.test(error.mensagem)
  ) {
    return error.mensagem
  }

  if (!error.response) {
    return 'Não foi possível conectar ao servidor.'
  }

  if (error.response.status >= 500) {
    return 'Ocorreu um erro no servidor. Tente novamente em instantes.'
  }

  if (
    error.response.status === 401
    || error.response.status === 400
  ) {
    return 'E-mail ou senha incorretos.'
  }

  return 'Não foi possível entrar. Verifique os dados e tente novamente.'
}

async function entrar() {
  erro.value = ''
  precisaVerificarEmail.value = false
  emailNaoVerificado.value = ''
  enviando.value = true

  try {
    await auth.login(
      form.email.trim(),
      form.senha,
    )

    await auth.fetchUser()

    const destino = typeof route.query.voltar === 'string'
      ? route.query.voltar
      : '/perfil'

    await router.push(destino)
  } catch (error) {
    precisaVerificarEmail.value =
      erroDeEmailNaoVerificado(error)

    if (precisaVerificarEmail.value) {
      emailNaoVerificado.value =
        error.response?.data?.email || form.email.trim()

      erro.value =
        'Seu e-mail ainda não foi verificado. '
        + 'Confirme o código para poder entrar.'
    } else {
      erro.value = mensagemDeErro(error)
    }
  } finally {
    enviando.value = false
  }
}

async function irParaVerificacao() {
  const email = emailNaoVerificado.value || form.email.trim()

  if (!email) {
    erro.value = 'Informe seu e-mail para continuar a verificação.'
    return
  }

  indoParaVerificacao.value = true

  try {
    // Preserva o e-mail para a tela de verificação e o reenvio do código.
    auth.setPendingEmail(email)

    // Gera um código novo (e o mostra no console no modo de teste),
    // pois o último pode ter expirado ou nunca ter sido visto.
    try {
      await auth.resend2FACode()
    } catch (erroReenvio) {
      console.error('Não foi possível gerar um novo código:', erroReenvio)
    }

    await router.push({
      name: 'verificar',
    })
  } catch (error) {
    console.error('Erro ao abrir a verificação de e-mail:', error)
    erro.value = 'Não foi possível abrir a tela de verificação.'
  } finally {
    indoParaVerificacao.value = false
  }
}

function cadastrarComGoogle() {
  // Substitua pela rota OAuth configurada no seu backend.
  window.location.href = '/api/auth/google/login/'
}

</script>

<template>
  <section class="pagina">
    <div class="cartao">
      <h1>Login</h1>

      <p class="texto-suave">
        Use o e-mail e a senha da sua conta.
      </p>

      <form class="formulario" @submit.prevent="entrar">
        <label>
          E-mail

          <input v-model="form.email" class="input" type="email" required autocomplete="email" />
        </label>

        <label>
          Senha

          <input v-model="form.senha" class="input" type="password" required autocomplete="current-password" />
        </label>

        <p v-if="erro" class="erro" role="alert">
          {{ erro }}
        </p>

        <button v-if="precisaVerificarEmail" type="button" class="botao" :disabled="indoParaVerificacao"
          @click="irParaVerificacao">
          {{
            indoParaVerificacao
              ? 'Abrindo verificação...'
              : 'Verificar e-mail'
          }}
        </button>

        <button type="submit" class="botao" :disabled="enviando || indoParaVerificacao">
          {{ enviando ? 'Entrando...' : 'Entrar' }}
        </button>

        <div class="separador">
          <span>ou</span>
        </div>

        <button type="button" class="botao-google" :disabled="enviando" @click="cadastrarComGoogle">
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.27 5.48-4.8 7.18l7.73 6C44.38 38.03 46.98 31.88 46.98 24.55z" />
            <path fill="#FBBC05"
              d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>

          Continuar com Google
        </button>

      </form>

      <p class="voltar">
        Você não tem uma conta ainda?

        <RouterLink to="/cadastro" class="link-cadastro">
          Clique aqui
        </RouterLink>
      </p>
    </div>
  </section>
</template>

<style scoped>

.separador {
  display: flex;
  align-items: center;
  gap: 15px;
  margin: 20px 0;
  color: #888;
  font-size: 14px;
}

.separador::before,
.separador::after {
  content: "";
  flex: 1;
  height: 1px;
  background: #ddd;
}

.botao-google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;

  width: 100%;
  padding: 13px 20px;

  background: #fff;
  color: #333;

  border: 1px solid #dadce0;
  border-radius: 8px;

  font-size: 15px;
  font-weight: 600;
  cursor: pointer;

  transition: all 0.2s ease;
}

.botao-google:hover {
  background: #f8f9fa;
  border-color: #aaa;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.botao-google:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>