
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
