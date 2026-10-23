<script setup>
import { ref } from 'vue'
import SidebarNotas from '@/components/notas/SidebarNotas.vue'
import EditorNota from '@/components//notas/EditorNota.vue'

const sidebarNotasAberta = ref(false)

function alternarSidebarNotas() {
  sidebarNotasAberta.value = !sidebarNotasAberta.value
}

function fecharSidebarNotas() {
  sidebarNotasAberta.value = false
}
</script>

<template>
  <main
    class="pagina-notas"
    :class="{ 'sidebar-aberta': sidebarNotasAberta }"
  >
    <!-- Barra de ações superior unificada -->
    <div class="acoes-topo">
      <!-- Botão Voltar para o Início -->
      <RouterLink to="/" class="btn-voltar-inicio" title="Voltar para a página inicial">
        <ion-icon name="arrow-back-outline"></ion-icon>
        <span>Início</span>
      </RouterLink>

      <!-- Botão Menu de Notas -->
      <button
        type="button"
        class="botao-sidebar-notas"
        :aria-expanded="sidebarNotasAberta"
        @click="alternarSidebarNotas"
      >
        <ion-icon
          :name="sidebarNotasAberta ? 'chevron-back-outline' : 'menu-outline'"
        />
        <span>Menu de notas</span>
      </button>
    </div>

    <!-- Área de layout estrutural (Sidebar + Conteúdo) -->
    <div class="layout-container">
      <SidebarNotas
        :aberta="sidebarNotasAberta"
        @fechar="fecharSidebarNotas"
      />

      <section class="conteudo-notas">
        <EditorNota />
      </section>
    </div>
  </main>
</template>

<style scoped>
.pagina-notas {
  --largura-sidebar-notas: 280px;
  width: 100%;
  min-width: 0;
  min-height: calc(100vh - 70px);
  display: flex;
  flex-direction: column;
  background: var(--cor-fundo-site); /* Cor de fundo escura padrão */
}

/* Container de botões superiores */
.acoes-topo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--cor-borda, #383838);
  background: var(--cor-fundo, #171717);
  position: relative;
  z-index: 101; /* Fica acima do z-index 100 da sidebar no modo desktop */
}

/* Novo Botão: Voltar para o Início */
.btn-voltar-inicio {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  color: var(--cor-destaque, #a855f7); /* Mudado para roxo para combinar */
  background: transparent;
  border: 1px solid var(--cor-destaque, #a855f7);
  border-radius: 9px;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background 0.2s, color 0.2s;
}

.btn-voltar-inicio:hover {
  background: var(--cor-destaque, #a855f7);
  color: #ffffff;
}

.btn-voltar-inicio ion-icon {
  font-size: 18px;
}

/* Botão Alternar Sidebar */
.botao-sidebar-notas {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  color: var(--cor-texto, #f5f5f5);
  background: var(--cor-fundo);
  border: 1px solid var(--cor-borda, #383838);
  border-radius: 9px;
  cursor: pointer;
  font-size: 0.95rem;
}

.botao-sidebar-notas ion-icon {
  font-size: 21px;
}

/* Container estrutural inferior */
.layout-container {
  display: flex;
  flex: 1;
  position: relative;
  width: 100%;
  min-width: 0;
}

/* Conteúdo do Editor e Notas */
.conteudo-notas {
  flex: 1;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 1.5rem;
  transition: margin-left 0.3s ease, width 0.3s ease;
}

/* ==========================================================================
   Regras de Layout para Desktop (Telas acima de 768px)
   ========================================================================== */
@media (min-width: 769px) {
  /* Empurra o conteúdo lateralmente apenas no computador */
  .sidebar-aberta .conteudo-notas {
    margin-left: var(--largura-sidebar-notas);
    width: calc(100% - var(--largura-sidebar-notas));
  }
}

/* ==========================================================================
   Adaptações Responsivas - Modo Celular (max-width: 768px)
   ========================================================================== */
@media (max-width: 768px) {
  .pagina-notas {
    min-height: calc(100vh - 64px);
  }

  /* Eleva a barra de botões acima do z-index 1200 da gaveta mobile da sidebar */
  .acoes-topo {
    padding: 8px 12px;
    gap: 8px;
    z-index: 1250; 
    position: relative;
  }

  .btn-voltar-inicio, 
  .botao-sidebar-notas {
    padding: 8px 12px;
    font-size: 0.85rem;
  }

  /* Garante que o editor não sofra deslocamento para os lados em telas pequenas */
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
