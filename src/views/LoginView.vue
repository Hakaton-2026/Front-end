<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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

.pagina {
  position: fixed;
  inset: 0;
  display: flex;
  padding: 1.5rem 1rem;
  overflow-y: auto;
  background: #ffffff;
}

.cartao {
  width: 100%;
  max-width: 400px;
  margin: auto;
  padding: clamp(1.25rem, 5vw, 2rem);
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

h1 {
  color: #111111;
  text-align: center;
  font-size: clamp(1.5rem, 6vw, 2rem);
}

.texto-suave {
  text-align: center;
  color: #666666;
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
  color: #111111;
  font-weight: 600;
}

.input {
  width: 100%;
  box-sizing: border-box;
  font: inherit;
  font-weight: 400;
  color: #111111;
  padding: 0.7rem 0.8rem;
  border: 1px solid #cccccc;
  background-color: #ffffff;
  border-radius: 8px;
  transition: border-color 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: #111111;
}
/* Ocupa a tela toda, com um fundo suave para o cartão "flutuar" sobre ele.
   Se a tela for baixa (celular deitado), esta área rola em vez de cortar o cartão. */
.pagina {
  position: fixed;
  inset: 0;
  display: flex;
  padding: 1.5rem 1rem;
  /* overflow-y: auto;
  background:
    radial-gradient(circle at 15% 20%, color-mix(in srgb, var(--cor-primaria) 22%, transparent), transparent 45%),
    radial-gradient(circle at 85% 80%, color-mix(in srgb, var(--cor-primaria) 14%, transparent), transparent 45%),
    var(--cor-fundo); */
}

.cartao {
  width: 100%;
  max-width: 400px;
  margin: auto; /* centraliza na tela sem cortar o topo quando a tela é baixa */
  padding: clamp(1.25rem, 5vw, 2rem);
  background: #ffff;
  border: 1px solid var(--cor-borda);
  border-radius: calc(var(--raio) * 1.6);
  box-shadow:
    0 1px 2px rgba(253, 254, 255, 0.06),
    0 10px 24px rgba(15, 23, 42, 0.1),
    0 28px 56px -12px rgba(79, 70, 229, 0.28);
  animation: flutuar 6s ease-in-out infinite;
}

/* Enquanto a pessoa digita, o cartão para de se mexer */
.cartao:focus-within {
  animation-play-state: paused;
}
/* 
@keyframes flutuar {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  } 
} */

@media (prefers-reduced-motion: reduce) {
  .cartao {
    animation: none;
  }
}

h1 {
  color: #0f172a;
  text-align: center;
  font-size: clamp(1.5rem, 6vw, 2rem);
}

.texto-suave {
  text-align: center;
  color: #64748b;
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
  border: 2px solid #1e1e1e;
  background-color: #fff;
  border-radius: var(--raio);
  transition: transform 0.2s ease-in-out;
}

.input:focus {
  transform: scale(1.05);
}

.erro {
  margin: 0;
  color: #dc2626;
  font-size: 0.875rem;
}

.botao {
  width: 100%;
}

.pagina {
  position: fixed;
  inset: 0;
  display: flex;
  padding: 1.5rem 1rem;
  overflow-y: auto;
  background: #ffffff;
}

.cartao {
  width: 100%;
  max-width: 400px;
  margin: auto;
  padding: clamp(1.25rem, 5vw, 2rem);
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

h1 {
  color: #111111;
  text-align: center;
  font-size: clamp(1.5rem, 6vw, 2rem);
}

.texto-suave {
  text-align: center;
  color: #666666;
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
  color: #111111;
  font-weight: 600;
}

.input {
  width: 100%;
  box-sizing: border-box;
  font: inherit;
  font-weight: 400;
  color: #111111;
  padding: 0.7rem 0.8rem;
  border: 1px solid #cccccc;
  background-color: #ffffff;
  border-radius: 8px;
  transition: border-color 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: #111111;
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
  color: #333333;
  display: block;
  margin-top: 1.25rem;
  text-align: center;
  font-size: 0.9rem;
}

.link-cadastro {
  color: #ff5700;
  font-weight: 600;
}

.botao:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.voltar {
  color: #1e1e1e;
  display: block;
  margin-top: 1.25rem;
  text-align: center;
  font-size: 0.9rem;
}

.link-cadastro {
  color: #ff5700;
  font-weight: 600;
}
.erro {
  margin: 0;
  color: #dc2626;
  font-size: 0.875rem;
}

.botao {
  width: 100%;
}

.botao:active{
background-color: #333333;
}


.botao:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.voltar {
  color: #333333;
  display: block;
  margin-top: 1.25rem;
  text-align: center;
  font-size: 0.9rem;
}

.link-cadastro {
  color: #ff5700;
  font-weight: 600;
}

</style>