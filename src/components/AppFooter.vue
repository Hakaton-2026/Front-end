<script setup>
import { NOME_SITE } from '@/config'

const ano = new Date().getFullYear()
</script>

<template>
  <footer class="rodape">
    <div class="container">
      <p class="texto-suave">© {{ ano }} {{ NOME_SITE }}</p>
    </div>
  </footer>
</template>

<style scoped>
.rodape {
  border-top: 1px solid var(--cor-borda);
  background: var(--cor-superficie);
  padding: 1.25rem 0;
  text-align: center;
}

.rodape p {
  margin: 0;
  font-size: 0.875rem;
}
</style>
