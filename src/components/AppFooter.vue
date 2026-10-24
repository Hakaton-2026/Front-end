
<script setup>
import { NOME_SITE } from '@/config'

const ano = new Date().getFullYear()
</script>

<template>
  <footer class="rodape">
    <div class="container">
      <p class="texto-suave">
        © {{ ano }} {{ NOME_SITE }}
      </p>
    </div>
  </footer>
</template>

<style scoped>
.rodape {
  padding: 20px 0;
  border-top: 1px solid var(--cor-borda);
  background: var(--cor-superficie);
}

.rodape p {
  margin: 0;
  color: var(--cor-texto-suave);
  text-align: center;
}
</style>
