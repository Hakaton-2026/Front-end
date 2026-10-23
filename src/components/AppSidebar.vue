
<script setup>
defineProps({
  aberto: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['fechar'])
</script>

<template>
  <aside :class="['sidebar', { open: aberto }]">
    <ul class="sidebar-menu">
      
  
      <li>
        <RouterLink
          to="/projetoandamento"
          class="sidebar-link"
          @click="emit('fechar')"
        >
          <ion-icon name="bookmark-outline"></ion-icon>
          <span>Início</span>
        </RouterLink>
      </li>

      <li>
        <RouterLink
          to="/notificacoes"
          class="sidebar-link"
          @click="emit('fechar')"
        >
          <ion-icon name="notifications-outline"></ion-icon>
          <span>Projetos</span>
        </RouterLink>
      </li>

      <li>
        <RouterLink
          to="/amigos"
          class="sidebar-link"
          @click="emit('fechar')"
        >
          <ion-icon name="chatbubbles-outline"></ion-icon>
          <span>Meu Kanban</span>
        </RouterLink>
      </li>  
    
      
      
      
        <li>
        <RouterLink
          to="/meus-projetos"
          class="sidebar-link"
          @click="emit('fechar')"
        >
          <ion-icon name="book-outline"></ion-icon>
          <span>Notas</span>
        </RouterLink>
      </li>

      <li>
        <RouterLink
          to="/projetoandamento"
          class="sidebar-link"
          @click="emit('fechar')"
        >
          <ion-icon name="bookmark-outline"></ion-icon>
          <span>Documentos</span>
        </RouterLink>
      </li>

      <li>
        <RouterLink
          to="/notificacoes"
          class="sidebar-link"
          @click="emit('fechar')"
        >
          <ion-icon name="notifications-outline"></ion-icon>
          <span>Sobre</span>
        </RouterLink>
      </li>

    </ul>
  </aside>

  <div
    v-if="aberto"
    class="sidebar-fundo"
    @click="emit('fechar')"
  ></div>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;

  width: var(--largura-sidebar, 260,,px);
  height: 100vh;
  box-sizing: border-box;
  padding: 80px 16px 24px;

  display: flex;
  flex-direction: column;

  overflow-y: auto;

  background: var(--cor-lateral);
  border-right: 1px solid var(--cor-borda);
  border-radius: 0 5px 5px 0;
}

.sidebar-menu {
  width: 100%;
  padding: 0;
  margin: 0;
  list-style: none;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 10px;

  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  margin-bottom: 25px;

  color: #ffff;
  text-decoration: none;
  border-radius: 8px;

  transition: all 0.2s ease;
}
.sidebar-link ion-icon {
  flex-shrink: 0;
  font-size: 22px;
  color: #ffff;
  transition: color 0.2s ease;

}.sidebar-link:hover,
.sidebar-link.router-link-active {
  background: #a0e4ff;
  color: #000000;
}

.sidebar-link:hover ion-icon,
.sidebar-link.router-link-active ion-icon {
  color: #000000;
}

.sidebar-fundo {
  display: none;
}

@media (max-width: 768px) {
  .sidebar {
    width: min(var(--largura-sidebar, 260px), 85vw);
    padding-top: 70px;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .sidebar-fundo {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 999;
    background: rgb(0 0 0 / 45%);
  }
}
</style>
