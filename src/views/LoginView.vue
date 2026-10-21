<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import '@/assets/style-telas/login.css'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({ email: '', senha: '' })
const erro = ref('')
const enviando = ref(false)

// Transforma o erro da requisição numa frase para a pessoa
function mensagemDeErro(e) {
  if (!e.response) return 'Não foi possível conectar ao servidor.'
  if (e.response.status >= 500) return 'Erro no servidor. Tente de novo em instantes.'
  return e.response.data?.mensagem || 'E-mail ou senha incorretos.'
}

async function entrar() {
  erro.value = ''
  enviando.value = true
  try {
    await auth.entrar(form.email, form.senha)
    // Se a pessoa foi mandada para cá ao tentar abrir uma página protegida, volta para ela
    router.push(route.query.voltar || '/perfil')
  } catch (e) {
    erro.value = mensagemDeErro(e)
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
          <input class="input" v-model="form.email" type="email" required autocomplete="email" />
        </label>

        <label>
          Senha
          <input class="input" v-model="form.senha" type="password" required autocomplete="current-password" />
        </label>

        <p v-if="erro" class="erro">{{ erro }}</p>

        <button type="submit" class="botao" :disabled="enviando">
          {{ enviando ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <p class="voltar">
        Você não tem uma conta ainda?
        <RouterLink to="/cadastro" class="link-cadastro">Clique aqui</RouterLink>
      </p>
    </div>
  </section>
</template>

<style scoped>


</style>