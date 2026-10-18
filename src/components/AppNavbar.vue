<script setup>
import { ref } from 'vue'
import { NOME_SITE } from '@/config'

const menuAberto = ref(false)

// Para adicionar uma página no menu, basta incluir um item aqui
const links = [
  { to: '/', texto: 'Início' },
  { to: '/sobre', texto: 'Sobre' },
]
</script>

<template>
  <header class="navbar">
    <div class="container barra">
      <RouterLink to="/" class="marca">{{ NOME_SITE }}</RouterLink>

      <button
        class="botao-menu"
        type="button"
        aria-label="Abrir ou fechar o menu"
        :aria-expanded="menuAberto"
        @click="menuAberto = !menuAberto"
      >
        ☰
      </button>

      <nav :class="['links', { aberto: menuAberto }]" @click="menuAberto = false">
        <RouterLink v-for="item in links" :key="item.to" :to="item.to">
          {{ item.texto }}
        </RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  background: var(--cor-superficie);
  border-bottom: 1px solid var(--cor-borda);
  position: sticky;
  top: 0;
  z-index: 10;
}

.barra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
}

.marca {
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--cor-primaria);
}

.marca:hover {
  text-decoration: none;
}

.links {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.links a {
  color: var(--cor-texto);
}

.links a.router-link-exact-active {
  color: var(--cor-primaria);
  font-weight: 600;
}

/* Botão de menu: só aparece no celular */
.botao-menu {
  display: none;
  font-size: 1.5rem;
  background: none;
  border: 0;
  cursor: pointer;
  color: var(--cor-texto);
}

@media (max-width: 720px) {
  .botao-menu {
    display: block;
  }

  .links {
    display: none;
    position: absolute;
    top: 64px;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--cor-superficie);
    border-bottom: 1px solid var(--cor-borda);
  }

  .links.aberto {
    display: flex;
  }
}
</style>
