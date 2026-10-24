<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import '@/assets/style-telas/perfil.css'
import AcessQrCode from '@/components/AcessQrCode.vue'

const authStore = useAuthStore()
const router = useRouter()
const tema = ref('escuro')

onMounted(async () => {
  if (authStore.isAuthenticated && !authStore.user) {
    await authStore.fetchUser()
  }

  const temaDaConta = authStore.user?.theme
  const temaSalvo = localStorage.getItem('tema')

  if (temaDaConta === 'Claro') {
    tema.value = 'claro'
  } else if (temaDaConta === 'Escuro') {
    tema.value = 'escuro'
  } else if (temaSalvo === 'claro' || temaSalvo === 'escuro') {
    tema.value = temaSalvo
  }

  document.documentElement.setAttribute('data-theme', tema.value)
  localStorage.setItem('tema', tema.value)
})

async function alternarTema() {
  const proximoTema = tema.value === 'escuro'
    ? 'claro'
    : 'escuro'

  tema.value = proximoTema

  document.documentElement.setAttribute(
    'data-theme',
    proximoTema,
  )

  localStorage.setItem('tema', proximoTema)

  await authStore.setTheme(
    proximoTema === 'claro' ? 'Claro' : 'Escuro',
  )
}

async function sair() {
  authStore.logout()
  await router.replace({ name: 'login' })
}

const QrCodeAberto = ref(false)

function handleQrCode() {
  QrCodeAberto.value = !QrCodeAberto.value
}

</script>

<template>
  <section class="perfil">
    <div class="usuario-area">
      <div class="foto">
        <img
          v-if="authStore.user?.profile_photo?.url"
          :src="authStore.user.profile_photo.url"
          alt="Foto de perfil"
        />

        <ion-icon
          v-else
          name="person-outline"
        ></ion-icon>
      </div>

      <div class="dados-usuario">
        <h2>{{ authStore.user?.name || 'Seu nome' }}</h2>
        <p>
          {{ authStore.user?.email || 'Seu e-mail aparecerá aqui' }}
        </p>
      </div>
    </div>

    <div class="aparencia">
      <h2>Aparência</h2>

      <button
        type="button"
        class="alternar-tema"
        @click="alternarTema"
        :aria-label="tema === 'escuro'
          ? 'Ativar tema claro'
          : 'Ativar tema escuro'"
        :aria-pressed="tema === 'escuro'"
      >
        <ion-icon
          :name="tema === 'escuro'
            ? 'moon-outline'
            : 'sunny-outline'"
        ></ion-icon>

        <span>
          {{ tema === 'escuro' ? 'Tema escuro' : 'Tema claro' }}
        </span>

        <span
          class="interruptor"
          :class="{ ativo: tema === 'escuro' }"
        >
          <span class="interruptor-circulo"></span>
        </span>
      </button>

      <button @click="handleQrCode" class="alternar-tema">
        <ion-icon name="qr-code-outline"></ion-icon>
        <span>Abrir QR Code</span>
      </button>

      <AcessQrCode v-if="QrCodeAberto"/>

      <button
        type="button"
        class="opcao-item"
        @click="sair"
      >
        <ion-icon name="close-circle-outline"></ion-icon>
        <span>Sair da sua conta</span>
      </button>
    </div>
  </section>
</template>

<style scoped>

.opcao-acessibilidade {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-top: 12px;
  padding: 14px;
  text-align: left;
}

.opcao-acessibilidade > ion-icon {
  flex-shrink: 0;
  font-size: 1.4rem;
  color: var(--cor-primaria);
}

.texto-acessibilidade {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.texto-acessibilidade strong {
  color: var(--cor-texto);
}

.texto-acessibilidade small {
  color: var(--cor-texto-suave);
  font-size: 0.85rem;
}

.opcao-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  text-align: left;
  font-size: 0.95rem;
  margin-top: 20px;
}

.opcao-item ion-icon {
  font-size: 1.2rem;
  color: red;
}

.opcao-item:active,
.opcao-item:hover {
  border-color: var(--cor-primaria);
  background: var(--cor-superficie-hover);
}
</style>