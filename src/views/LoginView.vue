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

function mensagemDeErro(error) {
  const dados = error.response?.data

  if (error.mensagem) return error.mensagem
  if (dados?.detail) return dados.detail

  if (dados?.non_field_errors?.length) {
    return dados.non_field_errors[0]
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
    return 'E-mail ou senha incorretos. Confira também se seu e-mail já foi verificado.'
  }

  return 'Não foi possível entrar. Verifique os dados e tente novamente.'
}

async function entrar() {
  erro.value = ''
  enviando.value = true

  try {
    await auth.login(form.email.trim(), form.senha)
    await auth.fetchUser()

    const destino = typeof route.query.voltar === 'string'
      ? route.query.voltar
      : '/perfil'

    await router.push(destino)
  } catch (error) {
    erro.value = mensagemDeErro(error)
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <section class="pagina">
    <div class="cartao">
      <h1>Login</h1>
      <p class="texto-suave">Use o e-mail e a senha da sua conta.</p>

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

        <p v-if="erro" class="erro" role="alert">
          {{ erro }}
        </p>

        <button
          type="submit"
          class="botao"
          :disabled="enviando"
        >
          {{ enviando ? 'Entrando...' : 'Entrar' }}
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
</style>