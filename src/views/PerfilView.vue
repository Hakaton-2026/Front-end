
<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import '@/assets/style-telas/perfil.css'
import router from '@/router'

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


function voltar() {
  router.push('/login');
}
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
 
  <button type="button" class="opcao-item" @click="voltar">
            <ion-icon name="close-circle-outline"></ion-icon>
            <span>Sair da sua conta?</span>
 </button>
  
</div>

</section>
</template>

<style scoped>

.opcao-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  text-align: left;
  font-size: 0.95rem;
  margin-top:20px ;
}

.opcao-item ion-icon {
  font-size: 1.2rem;
  color: red;


.opcao-item:active {
  border-color: var(--cor-primaria);
  background: var(--cor-superficie-hover);
}
}

.opcao-item:hover {
  border-color: var(--cor-primaria);
  background: var(--cor-superficie-hover);
}

</style>
