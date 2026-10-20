<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { NOME_SITE } from '@/config'

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
      <RouterLink to="/" class="marca">{{ NOME_SITE }}</RouterLink>
      <h1>Entrar</h1>
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

     <RouterLink to="/" class="voltar">← Voltar ao início</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.pagina {
  min-height: calc(100vh - 4rem);
  display: flex;
  align-items: center;
  justify-content: center;
}
h1{
color: #0f172a;

}
.texto-suave{
   color: #64748b;
}
.cartao {
  width: 100%;
  max-width: 400px;
  padding: 2rem 1.5rem;
  background: #ffff;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
}

.marca {
  display: block;
  margin-bottom: 1rem;
  font-weight: 700;
  font-size: 1.25rem;
}

.formulario {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: #0f172a;
  font-weight: 600;
}

.input {
  font: inherit;
  font-weight: 400;
  color: black;
  padding: 0.6rem 0.8rem;
  border: 2x solid #1e1e1e;
  background-color: transparent;
  border-radius: var(--raio);
transition: transforme .98s ease-in-out;
}

.input:focus {
    transform: scale(1.1);
}
.erro {
  margin: 0;
  color: #dc2626;
  font-size: 0.875rem;
}

.botao {
  width: 100%;
}

.botao:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.voltar {
  display: block;
  margin-top: 1.25rem;
  text-align: center;
  font-size: 0.9rem;
}
</style>