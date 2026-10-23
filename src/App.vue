
<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import AppNavbar from '@/components/AppNavbar.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppFooter from '@/components/AppFooter.vue'

import { rotasSemLayout } from './router'

const route = useRoute()
const sidebarAberta = ref(false)

const comLayout = computed(() => {
  return !rotasSemLayout.includes(route.name)
})

function fecharSidebar() {
  sidebarAberta.value = false
}

function alternarSidebar() {
  sidebarAberta.value = !sidebarAberta.value
}
</script>

<template>
  <div class="app">
    <!-- Sidebar fixa à esquerda -->
    <AppSidebar
      v-if="comLayout"
      :aberto="sidebarAberta"
      @fechar="fecharSidebar"
    />

    <!-- Área inteira à direita da sidebar -->
    <div :class="['app-area', { 'sem-layout': !comLayout }]">

      <!-- Header ocupa somente a área disponível -->
      <AppNavbar v-if="comLayout" />

      <!-- Botão para abrir a sidebar no celular -->
      <button
        v-if="comLayout"
        class="botao-sidebar"
        type="button"
        :aria-label="sidebarAberta ? 'Fechar menu' : 'Abrir menu'"
        :aria-expanded="sidebarAberta"
        @click="alternarSidebar"
      >
        <ion-icon
          :name="sidebarAberta ? 'close-outline' : 'menu-outline'"
        ></ion-icon>
      </button>

      <!-- Conteúdo das páginas -->
      <main class="conteudo">
        <RouterView />
      </main>

      <!-- Rodapé -->
      <AppFooter v-if="comLayout" />

    </div>
  </div>
</template>

<style>
:root {
  --largura-sidebar: 260px;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  min-height: 100%;
  margin: 0;
}

body {
  overflow-x: hidden;
}

.app {
  display: flex;
  width: 100%;
  min-height: 100vh;
}

/* Área à direita do menu lateral */
.app-area {
  display: flex;
  flex-direction: column;

  width: calc(100% - var(--largura-sidebar));
  min-width: 0;
  min-height: 100vh;

  margin-left: var(--largura-sidebar);
}

/* Páginas sem header, sidebar e footer */
.app-area.sem-layout {
  width: 100%;
  margin-left: 0;
}

/* Conteúdo das páginas */
.conteudo {
  flex: 1;
  width: 100%;
  min-width: 0;
  margin: 0;
  padding: 2rem;
}

/* Botão mobile */
.botao-sidebar {
  display: none;
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 1101;

  align-items: center;
  justify-content: center;

  width: 40px;
  height: 40px;

  border: 1px solid var(--cor-borda);
  border-radius: 10px;

  background: var(--cor-superficie);
  color: var(--cor-texto);

  font-size: 1.5rem;
  cursor: pointer;
}

/* Tablets e celulares */
@media (max-width: 768px) {
  .app-area {
    width: 100%;
    margin-left: 0;
  }

  .conteudo {
    padding: 1rem;
  }

  .botao-sidebar {
    display: flex;
  }
}
</style>
