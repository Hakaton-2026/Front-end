<script setup>
import AppNavbar from '@/components/AppNavbar.vue'
import AppFooter from '@/components/AppFooter.vue'
</script>

<template>
  <div class="app">
    <AppNavbar />
    <main class="container conteudo">
      <RouterView />
    </main>
    <AppFooter />
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
