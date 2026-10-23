
<script setup>
import { ref } from 'vue'
import SidebarNotas from '@/components/notas/SidebarNotas.vue'
import EditorNota from '@/components/notas/EditorNota.vue'

const sidebarNotasAberta = ref(false)

function alternarSidebarNotas() {
  sidebarNotasAberta.value = !sidebarNotasAberta.value
}

function fecharSidebarNotas() {
  sidebarNotasAberta.value = false
}
</script>

<template>
  <div
    class="pagina-notas"
    :class="{ 'sidebar-aberta': sidebarNotasAberta }"
  >
    <!-- Botão de abrir e fechar -->
    <button
      class="botao-sidebar-notas"
      type="button"
      :aria-label="
        sidebarNotasAberta
          ? 'Fechar menu de notas'
          : 'Abrir menu de notas'
      "
      :aria-expanded="sidebarNotasAberta"
      @click="alternarSidebarNotas"
    >
      <ion-icon
        :name="
          sidebarNotasAberta
            ? 'close-outline'
            : 'menu-outline'
        "
      />
    </button>

    <!-- Fundo para fechar a sidebar no celular -->
    <div
      v-if="sidebarNotasAberta"
      class="fundo-sidebar-notas"
      @click="fecharSidebarNotas"
    />

    <!-- Sidebar de notas -->
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
  --largura-sidebar-notas: 260px;

  position: relative;
  min-height: calc(100vh - 64px);
  width: 100%;
  min-width: 0;
}

/* Botão do menu */
.botao-sidebar-notas {
  position: fixed;
  top: 76px;
  left: 12px;
  z-index: 1200;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 40px;
  height: 40px;

  border: 1px solid var(--cor-borda, #444);
  border-radius: 10px;
  background: var(--cor-superficie, #202020);
  color: var(--cor-texto, #fff);

  font-size: 24px;
  cursor: pointer;
}

/* Editor fechado: usa toda a largura */
.conteudo-notas {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;

  transition:
    margin-left 0.3s ease,
    width 0.3s ease;
}

/* Editor desliza para a direita no computador */
.sidebar-aberta .conteudo-notas {
  margin-left: var(--largura-sidebar-notas);
  width: calc(100% - var(--largura-sidebar-notas));
}
.editor-nota {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* Fundo usado no celular */
.fundo-sidebar-notas {
  display: none;
}

@media (max-width: 768px) {
  .sidebar-aberta .conteudo-notas {
    margin-left: 0;
    width: 100%;
  }

  .fundo-sidebar-notas {
    display: block;
    position: fixed;
    inset: 64px 0 0;
    z-index: 1090;
    background: rgb(0 0 0 / 45%);
  }

  .botao-sidebar-notas {
    top: 76px;
  }
}
</style>
