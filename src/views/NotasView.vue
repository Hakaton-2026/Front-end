<script setup>
import { onBeforeUnmount } from 'vue'

import SidebarNotas from '@/components/notas/SidebarNotas.vue'
import EditorNota from '@/components/notas/EditorNota.vue'

// Estado compartilhado: o botão de menu do header (Navbar) abre e fecha
// esta mesma sidebar.
import { sidebarNotasAberta } from '@/composables/useSidebarNotas'

function fecharSidebarNotas() {
  sidebarNotasAberta.value = false
}

// Ao sair da página de Notas, a sidebar volta fechada.
onBeforeUnmount(fecharSidebarNotas)
</script>

<template>
  <div
    class="pagina-notas"
    :class="{ 'sidebar-aberta': sidebarNotasAberta }"
  >
    <!-- Sidebar de notas (já tem o fundo escurecido para o celular) -->
    <SidebarNotas
      :aberta="sidebarNotasAberta"
      @fechar="fecharSidebarNotas"
    />

    <!-- Conteúdo do editor -->
    <section class="conteudo-notas">
      <EditorNota />
    </section>
  </div>
</template>

<style scoped>
.pagina-notas {
  /* Mesma largura da SidebarNotas */
  --largura-sidebar-notas: 280px;

  position: relative;
  width: 100%;
  min-width: 0;
  min-height: calc(100vh - 64px);
}

/* Editor com a sidebar fechada: usa toda a largura */
.conteudo-notas {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;

  transition:
    margin-left 0.3s ease,
    width 0.3s ease;
}

/* Computador: o editor desliza para a direita quando a sidebar abre */
.sidebar-aberta .conteudo-notas {
  margin-left: var(--largura-sidebar-notas);
  width: calc(100% - var(--largura-sidebar-notas));
}

/* Celular: a sidebar abre por cima, o editor não se move */
@media (max-width: 768px) {
  .sidebar-aberta .conteudo-notas {
    margin-left: 0;
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .conteudo-notas {
    transition: none;
  }
}
</style>