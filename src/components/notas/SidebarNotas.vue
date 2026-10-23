<script setup>
// Com dois elementos na raiz (fundo + sidebar), repassamos class/style
// do componente pai direto para a sidebar, como antes.
defineOptions({ inheritAttrs: false })

defineProps({
  aberta: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['fechar'])
</script>

<template>
  <!-- Fundo escurecido: aparece só no celular e fecha a sidebar ao tocar -->
  <div
    class="fundo-sidebar-notas"
    :class="{ aberta }"
    aria-hidden="true"
    @click="emit('fechar')"
  ></div>

  <aside
    v-bind="$attrs"
    class="sidebar-notas"
    :class="{ aberta }"
    :aria-hidden="!aberta"
  >
    <!-- Mantenha aqui os botões e o conteúdo atual da sua sidebar -->

    <div class="cabecalho-sidebar-notas">
      <h3>Minhas notas</h3>

      <button
        type="button"
        aria-label="Fechar menu de notas"
        @click="emit('fechar')"
      >
        <ion-icon name="close-outline" />
      </button>
    </div>

    <!-- Exemplo: coloque aqui sua lista de notas -->
    <div class="lista-notas">
      <!-- Conteúdo existente da sidebar -->
    </div>
  </aside>
</template>

<style scoped>
.sidebar-notas {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;

  width: 280px;
  max-width: 85vw;
  box-sizing: border-box;
  padding:
    calc(20px + env(safe-area-inset-top))
    20px
    calc(20px + env(safe-area-inset-bottom));

  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--cor-superficie, #202020);
  border-right: 1px solid var(--cor-borda, #383838);

  transform: translateX(-100%);
  visibility: hidden;
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    visibility 0.3s ease,
    box-shadow 0.3s ease;

  /* Acima da barra de formatação (1300) e do fundo escurecido (1390) */
  z-index: 1400;
}

.sidebar-notas.aberta {
  transform: translateX(0);
  visibility: visible;
  box-shadow: 8px 0 32px rgb(0 0 0 / 35%);
}

.cabecalho-sidebar-notas {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--cor-borda, #383838);
}

.cabecalho-sidebar-notas h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--cor-texto, #fff);
}

.cabecalho-sidebar-notas button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;

  width: 36px;
  height: 36px;

  border: 1px solid var(--cor-borda, #444);
  border-radius: 8px;
  background: transparent;
  color: var(--cor-texto, #fff);

  font-size: 22px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.cabecalho-sidebar-notas button:hover {
  background: color-mix(in srgb, currentColor 10%, transparent);
}

.cabecalho-sidebar-notas button:focus-visible {
  outline: 2px solid #ff5700;
  outline-offset: 2px;
}

/* Fundo escurecido (escondido no computador) */
.fundo-sidebar-notas {
  display: none;
}

@media (max-width: 768px) {
  .fundo-sidebar-notas {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 1390;

    background: rgb(0 0 0 / 55%);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  .fundo-sidebar-notas.aberta {
    opacity: 1;
    pointer-events: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-notas,
  .fundo-sidebar-notas {
    transition: none;
  }
}
</style>