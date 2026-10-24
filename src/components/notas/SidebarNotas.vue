<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  aberta: {
    type: Boolean,
    default: false
  },
  secaoAtiva: {
    type: String,
    default: 'editor'
  }
})

const emit = defineEmits(['fechar', 'selecionar-secao'])

const sidebarClasses = computed(() => ({
  aberta: props.aberta
}))

function fecharSidebar() {
  emit('fechar')
}

function selecionarSecao(secao) {
  emit('selecionar-secao', secao)
  emit('fechar')
}

function voltarAoInicio() {
  emit('fechar')
  router.push('/')
}
</script>

<template>
  <Transition name="sidebar-notas">
    <aside
      v-if="aberta"
      class="sidebar-notas"
      :class="sidebarClasses"
      aria-label="Menu de notas"
    >
      <div class="sidebar-notas__cabecalho">
        <div class="sidebar-notas__titulo">
          <ion-icon name="document-text-outline"></ion-icon>
          <h2>Minhas notas</h2>
        </div>
      </div>

      <nav class="sidebar-notas__menu">
        <button
          type="button"
          class="sidebar-notas__item"
          :class="{ ativo: secaoAtiva === 'editor' }"
          @click="selecionarSecao('editor')"
        >
          <ion-icon name="document-outline"></ion-icon>
          <span>Editor de notas</span>
        </button>

        <button
          type="button"
          class="sidebar-notas__item"
          :class="{ ativo: secaoAtiva === 'documentos' }"
          @click="selecionarSecao('documentos')"
        >
          <ion-icon name="folder-outline"></ion-icon>
          <span>Meus documentos</span>
        </button>

        <button
          type="button"
          class="sidebar-notas__item"
          :class="{ ativo: secaoAtiva === 'recentes' }"
          @click="selecionarSecao('recentes')"
        >
          <ion-icon name="time-outline"></ion-icon>
          <span>Notas recentes</span>
        </button>

        <button
          type="button"
          class="sidebar-notas__item"
          :class="{ ativo: secaoAtiva === 'favoritos' }"
          @click="selecionarSecao('favoritos')"
        >
          <ion-icon name="star-outline"></ion-icon>
          <span>Favoritos</span>
        </button>
      </nav>

      <div class="sidebar-notas__rodape">
        <ion-icon name="information-circle-outline"></ion-icon>
        <span>Organize seus estudos em um só lugar.</span>
      </div>
    </aside>
  </Transition>

  <Transition name="fundo-sidebar">
    <div
      v-if="aberta"
      class="sidebar-notas__fundo"
      @click="fecharSidebar"
    ></div>
  </Transition>
</template>

<style scoped>
/* Base estrutural do painel */
.sidebar-notas {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;

  width: 280px;
  max-width: 85vw;
  padding: 20px 16px;
  box-sizing: border-box;

  display: flex;
  flex-direction: column;

  overflow-y: auto;
  overflow-x: hidden;

  background: var(--cor-fundo, #171717);
  color: var(--cor-texto, #f5f5f5);
  border-right: 1px solid var(--cor-borda, #383838);

  z-index: 100;
}

/* Customização do botão Voltar ao início (Roxo) */
.sidebar-notas__inicio {
  margin-top: 12px;
  color: var(--cor-destaque, #a855f7);
  border: 1px solid var(--cor-destaque, #a855f7) !important;
}

.sidebar-notas__inicio:hover {
  background: var(--cor-hover, rgb(168 85 247 / 12%)) !important;
}

/* Elementos do Cabeçalho interno */
.sidebar-notas__cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 24px;
}

.sidebar-notas__titulo {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.sidebar-notas__titulo ion-icon {
  font-size: 24px;
  color: var(--cor-destaque, #a855f7); /* Roxo no ícone principal */
}

.sidebar-notas__titulo h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}

.sidebar-notas__fechar {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;

  color: var(--cor-texto, #f5f5f5);
  background: transparent;
  border: 1px solid var(--cor-borda, #383838);
  border-radius: 9px;
  cursor: pointer;
}

.sidebar-notas__fechar ion-icon {
  font-size: 20px;
}

/* Links e botões de Navegação interna */
.sidebar-notas__menu {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.sidebar-notas__item {
  display: flex;
  align-items: center;
  gap: 12px;

  width: 100%;
  padding: 12px;
  text-align: left;
  box-sizing: border-box;

  color: var(--cor-texto, #f5f5f5);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;

  font-size: 14px;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.sidebar-notas__item ion-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.sidebar-notas__item:hover {
  background: var(--cor-hover, rgb(128 128 128 / 12%));
  border-color: var(--cor-borda, #383838);
}

/* Estado Ativo (Fundo roxo translúcido e bordas roxas suaves) */
.sidebar-notas__item.ativo {
  color: var(--cor-destaque, #a855f7);
  background: var(--cor-hover, rgb(168 85 247 / 12%));
  border-color: var(--cor-borda, rgb(168 85 247 / 35%));
}

/* Rodapé interno informativo */
.sidebar-notas__rodape {
  display: flex;
  align-items: flex-start;
  gap: 9px;

  margin-top: auto;
  padding: 20px 8px 5px;

  color: var(--cor-texto-secundario, #999);
  font-size: 12px;
  line-height: 1.5;
}

.sidebar-notas__rodape ion-icon {
  flex-shrink: 0;
  font-size: 18px;
}

/* Fundo escuro (Overlay) padrão escondido no Desktop */
.sidebar-notas__fundo {
  display: none;
}

/* ==========================================================================
   Responsividade - Celulares e Tablets (Comportamento de gaveta flutuante)
   ========================================================================== */
@media (max-width: 768px) {
  .sidebar-notas {
    position: fixed;
    top: 74px;
    width: min(280px, 85vw);
    z-index: 1200;
  }

  .sidebar-notas__fundo {
    display: block;
    position: fixed;
    inset: 64px 0 0;
    background: rgb(0 0 0 / 45%);
    z-index: 1190;
  }
}

/* Animações e Transições */
.sidebar-notas-enter-active,
.sidebar-notas-leave-active {
  transition: transform 0.3s ease;
}

.sidebar-notas-enter-from,
.sidebar-notas-leave-to {
  transform: translateX(-100%);
}

.fundo-sidebar-enter-active,
.fundo-sidebar-leave-active {
  transition: opacity 0.3s ease;
}

.fundo-sidebar-enter-from,
.fundo-sidebar-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-notas-enter-active,
  .sidebar-notas-leave-active,
  .fundo-sidebar-enter-active,
  .fundo-sidebar-leave-active {
    transition: none;
  }
}
</style>
