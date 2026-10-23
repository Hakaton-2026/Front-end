<script setup>
import { ref } from 'vue'
import { NOME_SITE } from '@/config'

const menuAberto = ref(false)

const links = [
  { to: '/', texto: 'Início' },
  { to: '/perfil', texto: 'Perfil' },
  { to: '/sobre', texto: 'Sobre' },
]
</script>

<template>
  <header class="navbar">
    <div class="container barra">
      <RouterLink to="/" class="marca">
        {{ NOME_SITE }}
      </RouterLink>

      <button
        class="botao-menu"
        type="button"
        aria-label="Abrir ou fechar o menu"
        :aria-expanded="menuAberto"
        @click="menuAberto = !menuAberto"
      >
        <ion-icon
          :name="menuAberto ? 'close-outline' : 'menu-outline'"
        ></ion-icon>
      </button>

      <nav
        :class="['links', { aberto: menuAberto }]"
        @click="menuAberto = false"
      >
        <RouterLink
          v-for="item in links"
          :key="item.to"
          :to="item.to"
        >
          {{ item.texto }}
        </RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  background: var(--cor-superficie);
  position: sticky;
  top: 0;
  z-index: 100;
}

.barra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  padding: 0 1.25rem;
}

.marca {
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--cor-primaria);
  text-decoration: none;
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
  text-decoration: none;
  padding: 0.5rem 0;
}

.links a.router-link-exact-active {
  color: var(--cor-primaria);
  font-weight: 600;
}

.botao-menu {
  display: none;
  font-size: 1.75rem;
  background: none;
  border: 0;
  cursor: pointer;
  color: var(--cor-texto);
  padding: 0.5rem;
}

@media (max-width: 720px) {
  .botao-menu {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .links {
    display: none;
    position: absolute;
    top: 64px;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    padding: 0.5rem 0;
    background: var(--cor-superficie);
    border-bottom: 1px solid var(--cor-borda);
  }

  .links.aberto {
    display: flex;
  }

  .links a {
    padding: 1rem 1.25rem;
  }

  .links a:last-child {
    border-bottom: none;
  }
}
</style>