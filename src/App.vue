<script setup>
import AppNavbar from '@/components/AppNavbar.vue'
import AppFooter from '@/components/AppFooter.vue'
import ToastMessage from './components/ToastMessage.vue';
</script>

import {computed} from 'vue'
import {useRoute} from 'vue-router'
import { rotasSemLayout } from './router';

const route = useRoute()
const comLayout = computed(() => !rotasSemLayout.includes(route.name))
</script>
<template>
  <div class="app">
    <AppNavbar />
    <ToastMessage />
    <AppNavbar v-if="comLayout" />
    <main class="container conteudo">
      <RouterView />
    </main>
    <AppFooter v-if="comLayout" />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.conteudo {
  flex: 1;
  padding-top: 2rem;
  padding-bottom: 2rem;
}
</style>