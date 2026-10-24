<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import AppNavbar from '@/components/AppNavbar.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppFooter from '@/components/AppFooter.vue'
import ToastMessage from './components/ToastMessage.vue';

import { sidebarNotasAberta } from '@/composables/useSidebarNotas'
import { rotasSemLayout } from './router'

const route = useRoute()
const sidebarAberta = ref(false)

const comLayout = computed(
  () => !rotasSemLayout.includes(route.name)
)

const paginaNotas = computed(
  () => route.path.replace(/\/+$/, '') === '/notas'
)

// O botão do header controla a sidebar da página em que você está.
const menuAberto = computed(() =>
  paginaNotas.value ? sidebarNotasAberta.value : sidebarAberta.value
)

function alternarMenu() {
  if (paginaNotas.value) {
    sidebarNotasAberta.value = !sidebarNotasAberta.value
  } else {
    sidebarAberta.value = !sidebarAberta.value
  }
}

function fecharSidebar() {
  sidebarAberta.value = false
}

</script>

<template>
  <div class="app">
    <ToastMessage />
    <!-- Header: largura total da tela (já inclui o botão da sidebar) -->
    <AppNavbar
      v-if="comLayout"
      :menu-aberto="menuAberto"
      :menu-sempre-visivel="paginaNotas"
      @alternar-menu="alternarMenu"
    />

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

@media (max-width: 768px) {
  .app-area {
    margin-left: 0;
  }
}
</style>