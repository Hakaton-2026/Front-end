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

          <input
            v-model="form.email"
            class="input"
            type="email"
            required
            autocomplete="email"
          />
        </label>

        <label>
          Senha

          <input
            v-model="form.senha"
            class="input"
            type="password"
            required
            autocomplete="current-password"
          />
        </label>

        <p
          v-if="erro"
          class="erro"
          role="alert"
        >
          {{ erro }}
        </p>

        <button
          v-if="precisaVerificarEmail"
          type="button"
          class="botao"
          :disabled="indoParaVerificacao"
          @click="irParaVerificacao"
        >
          {{
            indoParaVerificacao
              ? 'Abrindo verificação...'
              : 'Verificar e-mail'
          }}
        </button>

        <button
          type="submit"
          class="botao"
          :disabled="enviando || indoParaVerificacao"
        >
          {{ enviando ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <p class="voltar">
        Você não tem uma conta ainda?

        <RouterLink
          to="/cadastro"
          class="link-cadastro"
        >
          Clique aqui
        </RouterLink>
      </p>
    </div>
  </section>
</template>

<style scoped>
</style>