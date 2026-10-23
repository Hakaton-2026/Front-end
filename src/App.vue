<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import AppNavbar from '@/components/AppNavbar.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppFooter from '@/components/AppFooter.vue'

import { rotasSemLayout } from './router'

const route = useRoute()
const sidebarAberta = ref(false)

const comLayout = computed(
  () => !rotasSemLayout.includes(route.name)
)

const paginaNotas = computed(
  () => route.path.replace(/\/+$/, '') === '/notas'
)

function fecharSidebar() {
  sidebarAberta.value = false
}
</script>

<template>
  <div class="app">
    <!-- Header: largura total da tela -->
    <AppNavbar v-if="comLayout" />

    <!-- Botão para abrir a sidebar no celular -->
   <!-- Botão da sidebar principal, exceto em Notas -->
<button
  v-if="comLayout && !paginaNotas"
  class="botao-sidebar"
  type="button"
  :aria-label="sidebarAberta ? 'Fechar menu' : 'Abrir menu'"
  :aria-expanded="sidebarAberta"
  @click="sidebarAberta = !sidebarAberta"
>
  <ion-icon
    :name="sidebarAberta ? 'close-outline' : 'menu-outline'"
  />
</button>

<!-- Sidebar principal nas demais páginas -->
<AppSidebar
  v-if="comLayout && !paginaNotas"
  :aberto="sidebarAberta"
  @fechar="fecharSidebar"
/>


    <!-- Conteúdo de todas as páginas -->
<div
  :class="[
    'app-area',
    {
      'sem-layout': !comLayout,
      'area-notas': paginaNotas
    }
  ]"
>
  <main class="container conteudo">
    <RouterView />
  </main>

  <AppFooter v-if="comLayout" />
</div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
}

.app-area {
  margin-left: var(--largura-sidebar, 260px);
  min-width: 0;
  min-height: calc(100vh - 64px);

  display: flex;
  flex-direction: column;
}

.app-area.sem-layout {
  margin-left: 0;
}

.conteudo {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.botao-sidebar {
  display: none;
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 1101;

  align-items: center;
  justify-content: center;

  width: 42px;
  height: 42px;

  color: var(--cor-texto);
  background: var(--cor-superficie);
  border: 1px solid var(--cor-borda);
  border-radius: 8px;

  font-size: 25px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .app-area {
    margin-left: 0;
  }

  .botao-sidebar {
    display: flex;
  }
}
</style>
