<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import ToastNotification from '@/components/ToastNotifification.vue';
import { NOME_SITE } from '../config';
import '@/assets/style-telas/verificar.css';
const router = useRouter();
const authStore = useAuthStore();

const codigo2fa = ref('');
const loading = ref(false);
const errorMessage = ref('');
const menuOpcoesAberto = ref(true);

const mensagem = ref('');
const tipoMensagem = ref('sucesso');
const mostrarMensagem = ref(false);

function exibirMensagem(texto, tipo = 'sucesso') {
  mensagem.value = texto;
  tipoMensagem.value = tipo;
  mostrarMensagem.value = true;
}

function fecharToast() {
  mostrarMensagem.value = false;
}

async function handleVerificacao() {
  if (codigo2fa.value.length < 6) {
    errorMessage.value = 'Por favor, insira o código de 6 dígitos.';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    await authStore.verify2FA(codigo2fa.value);
    exibirMensagem('E-mail verificado com sucesso!', 'sucesso');
    setTimeout(() => {
      router.push('/');
    }, 1500);
  } catch (err) {
    errorMessage.value =
      err.response?.data?.detail ??
      'Código inválido ou expirado. Tente novamente.';
  } finally {
    loading.value = false;
  }
}

async function reenviarCodigo() {
  try {
    if (authStore.resend2FACode) {
      await authStore.resend2FACode();
      exibirMensagem('Um novo código de verificação foi enviado para o seu e-mail.', 'sucesso');
    }
  } catch (err) {
    exibirMensagem('Erro ao reenviar código. Tente mais tarde.', 'erro');
  }
}

function cancelarAutenticacao() {
  authStore.logout();
  router.push('/login');
}
</script>

<template>
  <div class="verificacao-container">
    <ToastNotification
      :mensagem="mensagem"
      :tipo="tipoMensagem"
      :mostrar="mostrarMensagem"
      @fechar="fecharToast"
    />
    
    <!-- Removida a div .cartao de dentro para evitar o conflito de bordas gigantes -->
    <div class="verificacao-card">
      
      <!-- Área do Cabeçalho / Logo -->
      <div class="header-area">
        <h1>{{ NOME_SITE }}</h1>
        <p>Autenticação de dois fatores. Enviamos um código para o seu e-mail. Insira o código de 6 dígitos abaixo para verificar.</p>
      </div>

      <div v-if="errorMessage" class="error-feedback">{{ errorMessage }}</div>

      <!-- Formulário -->
      <form @submit.prevent="handleVerificacao">
        <div class="input-group">
          <input 
            id="codigo"
            v-model="codigo2fa"
            type="text"
            placeholder="xxxxxx"
            maxlength="6"
            required
            autocomplete="one-time-code"
            class="input-codigo"
          >
        </div>

        <!-- Removida a classe global .botao-principal para evitar conflito com a borda preta -->
        <button type="submit" :disabled="loading" class="btn-verificar">
          {{ loading ? 'Verificando...' : 'Verificar' }}
        </button>
      </form>

      <!-- Opções Adicionais estilo Dropdown -->
      <div class="opcoes-container">
        <button type="button" class="btn-dropdown-gatilho" @click="menuOpcoesAberto = !menuOpcoesAberto">
          <span>Opções adicionais</span>
          <ion-icon :name="menuOpcoesAberto ? 'chevron-up-outline' : 'chevron-down-outline'"></ion-icon>
        </button>
        
        <div v-if="menuOpcoesAberto" class="conteudo-dropdown">
          <button type="button" class="opcao-item" @click="reenviarCodigo">
            <ion-icon name="refresh-outline"></ion-icon>
            <span>Enviar código novamente</span>
          </button>
          <button type="button" class="opcao-item" @click="cancelarAutenticacao">
            <ion-icon name="close-circle-outline"></ion-icon>
            <span>Cancelar e Sair</span>
          </button>
        </div>
      </div>
      
    </div>
  </div>
</template>

<style scoped>
</style>
