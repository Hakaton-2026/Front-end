
<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()

const form = reactive({
  nome: '',
  email: '',
  senha: '',
  confirmarSenha: '',
})

const erro = ref('')
const sucesso = ref('')
const enviando = ref(false)

async function cadastrar() {
  erro.value = ''
  sucesso.value = ''

  if (form.senha !== form.confirmarSenha) {
    erro.value = 'As senhas não são iguais.'
    return
  }

  enviando.value = true

  try {
    await api.post('/usuarios/', {
      nome: form.nome,
      email: form.email,
      senha: form.senha,
    })

    sucesso.value = 'Conta criada com sucesso!'

    setTimeout(() => {
      router.push('/login')
    }, 1000)
  } catch (e) {
    erro.value =
      e.response?.data?.mensagem ||
      e.response?.data?.email?.[0] ||
      'Não foi possível criar sua conta. Verifique os dados.'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <section class="pagina">
    <div class="cartao">
      <h1>Criar conta</h1>

      
      <form class="formulario" @submit.prevent="cadastrar">
        <label>
          Nome
          <input
            v-model="form.nome"
            class="input"
            type="text"
            placeholder="Seu nome"
            autocomplete="name"
            required
          />
        </label>

        <label>
          E-mail
          <input
            v-model="form.email"
            class="input"
            type="email"
            placeholder="seu@email.com"
            autocomplete="email"
            required
          />
        </label>

        <label>
          Senha
          <input
            v-model="form.senha"
            class="input"
            type="password"
            placeholder="Crie uma senha"
            autocomplete="new-password"
            minlength="8"
            required
          />
        </label>

        <label>
          Confirmar senha
          <input
            v-model="form.confirmarSenha"
            class="input"
            type="password"
            placeholder="Digite a senha novamente"
            autocomplete="new-password"
            minlength="8"
            required
          />
        </label>

        <p v-if="erro" class="erro">
          {{ erro }}
        </p>

        <p v-if="sucesso" class="sucesso">
          {{ sucesso }}
        </p>

        <button
          type="submit"
          class="botao"
          :disabled="enviando"
        >
          {{ enviando ? 'Criando conta...' : 'Cadastrar' }}
        </button>
      </form>

      <p class="voltar">
        Já tem uma conta?
        <RouterLink to="/login" class="link-login">
          Entrar
        </RouterLink>
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
  max-width: 300px;
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
  background: #ffffff;
  border-radius: 8px;
  transition:transform border-color 0.2s ease;
}

.input:focus {
  transform: scale(1.05);
  outline: none;
  border-color: #111111;
}

.erro {
  margin: 0;
  color: #dc2626;
  font-size: 0.875rem;
}

.sucesso {
  margin: 0;
  color: #15803d;
  font-size: 0.875rem;
}

.botao {
  width: 100%;
  transition: transform .2s ease-out;
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

.link-login {
  color: #ff5700;
  font-weight: 600;
}
</style>
