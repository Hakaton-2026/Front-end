
<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import '@/assets/telas/perfil.css'

const authStore = useAuthStore()

const tema = ref('escuro')

function alternarTema() {
    const novoTema = tema.value === 'escuro' ? 'claro' : 'escuro'
  tema.value = novoTema
  document.documentElement.setAttribute(
    'data-theme',
    novoTema
  )

  localStorage.setItem('tema', novoTema)
}

onMounted(() => {
  const temaSalvo = localStorage.getItem('tema')

  if (temaSalvo === 'claro' || temaSalvo === 'escuro') {
    tema.value = temaSalvo
  }

  document.documentElement.setAttribute(
    'data-theme',
    tema.value
  )
})
</script>

<template>
  <section class="perfil">
        <div class="usuario-area">
      <div class="foto">
        <img
          v-if="authStore.user?.profile_photo"
          :src="authStore.user.profile_photo"
          alt="Foto de perfil"
        />

        <ion-icon
          v-else
          name="person-outline"
        ></ion-icon>
      </div>

      <div class="dados-usuario">
        <h2>{{ authStore.user?.name || authStore.user?.nome || 'Seu nome' }}</h2>

        <p>
          {{ authStore.user?.email || 'Seu e-mail aparecerá aqui' }}
        </p>
      </div>
    </div>

<!-- Aparência -->
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
      :name="tema === 'escuro' ? 'moon-outline' : 'sunny-outline'"
    ></ion-icon>

    <span>
      {{ tema === 'escuro' ? 'Tema escuro' : 'Tema claro' }}
    </span>

    <span class="interruptor" :class="{ ativo: tema === 'escuro' }">
      <span class="interruptor-circulo"></span>
    </span>
  </button>
</div>

  </section>
</template>

<style scoped>
</style>
