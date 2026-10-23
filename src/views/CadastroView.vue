
<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import '@/assets/style-telas/cadastro.css'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({
  nome: '',
  email: '',
  senha: '',
  confirmarSenha: '',
})

const erro = ref('')
const sucesso = ref('')
const enviando = ref(false)

function mensagemDeErro(error) {
  const dados = error.response?.data

  if (error.mensagem) return error.mensagem
  if (dados?.detail) return dados.detail
  if (dados?.email?.length) return dados.email[0]
  if (dados?.name?.length) return dados.name[0]
  if (dados?.password?.length) return dados.password[0]
  if (dados?.non_field_errors?.length) {
    return dados.non_field_errors[0]
  }

  if (!error.response) {
    return 'Não foi possível conectar ao servidor.'
  }

  if (error.response.status >= 500) {
    return 'Ocorreu um erro no servidor. Tente novamente mais tarde.'
  }

  return 'Não foi possível criar sua conta. Verifique os dados informados.'
}

async function cadastrar() {
  erro.value = ''
  sucesso.value = ''

  if (!form.nome.trim() || !form.email.trim()) {
    erro.value = 'Preencha seu nome e e-mail.'
    return
  }

  if (form.senha.length < 8) {
    erro.value = 'A senha precisa ter pelo menos 8 caracteres.'
    return
  }

  if (form.senha !== form.confirmarSenha) {
    erro.value = 'As senhas não são iguais.'
    return
  }

  enviando.value = true

  try {
    await auth.register({
      name: form.nome.trim(),
      email: form.email.trim(),
      password: form.senha,
    })

    sucesso.value = 'Conta criada. Vamos verificar seu e-mail.'

    window.setTimeout(() => {
      router.push({ name: 'verificar' })
    }, 700)
  } catch (error) {
    erro.value = mensagemDeErro(error)
  } finally {
    enviando.value = false
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
      <h1>Criar conta</h1>

      <p class="texto-suave">
        Preencha os dados para começar.
      </p>

      <form class="formulario" @submit.prevent="cadastrar">
        <label for="nome">
          Nome

          <input
            id="nome"
            v-model="form.nome"
            class="input"
            type="text"
            placeholder="Seu nome"
            autocomplete="name"
            required
          />
        </label>

        <label for="email">
          E-mail

          <input
            id="email"
            v-model="form.email"
            class="input"
            type="email"
            placeholder="seu@email.com"
            autocomplete="email"
            required
          />
        </label>

        <label for="senha">
          Senha

          <input
            id="senha"
            v-model="form.senha"
            class="input"
            type="password"
            placeholder="Crie uma senha"
            autocomplete="new-password"
            minlength="8"
            required
          />
        </label>

        <label for="confirmarSenha">
          Confirmar senha

          <input
            id="confirmarSenha"
            v-model="form.confirmarSenha"
            class="input"
            type="password"
            placeholder="Digite a senha novamente"
            autocomplete="new-password"
            minlength="8"
            required
          />
        </label>

        <p v-if="erro" class="erro" role="alert">
          {{ erro }}
        </p>

        <p v-if="sucesso" class="sucesso" role="status">
          {{ sucesso }}
        </p>

        <button
          type="submit"
          class="botao"
          :disabled="enviando"
        >
          {{ enviando ? 'Criando conta...' : 'Cadastrar' }}
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
        Já tem uma conta?

        <RouterLink to="/login" class="link-login">
          Entrar
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

