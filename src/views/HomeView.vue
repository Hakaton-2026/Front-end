<script setup>
import { NOME_SITE } from '@/config'
</script>

<template>
  <section class="inicio centro">
    <h1>{{ NOME_SITE }}</h1>
    <p class="texto-suave">Escreva aqui uma frase sobre o projeto.</p>
  </section>
</template>

<style scoped>
.inicio {
  padding: 4rem 0;
}

.inicio h1 {
  font-size: clamp(1.8rem, 6vw, 3rem);
}
</style>
