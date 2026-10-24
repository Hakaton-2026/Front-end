<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import {
  TextStyle,
  FontFamily,
  FontSize,
} from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { useNotasStore } from '@/stores/notas'

const CHAVE_TITULO = 'nexos-nota-titulo'
const CHAVE_CONTEUDO = 'nexos-nota-conteudo'
const COR_PADRAO = '#ffffff'
const TEMPO_SALVAMENTO = 1000
const notasStore = useNotasStore()

const titulo = ref(
  localStorage.getItem(CHAVE_TITULO) || 'Minha primeira nota'
)
const notaId = ref(null)

const fonte = ref('Inter')
const tamanhoFonte = ref('16px')
const corTexto = ref(COR_PADRAO)
const salvamento = ref('Salvo')
let temporizadorSalvamento = null
let carregandoNota = false

// Altura do teclado virtual (px). Usada para a barra ficar acima dele no celular.
const teclado = ref(0)

/*
 * O seletor de cor só aceita #rrggbb, mas o Tiptap devolve rgb(...)
 * quando lê o HTML salvo. Esta função normaliza.
 */
function paraHex(cor) {
  if (!cor) return COR_PADRAO

  if (cor.startsWith('#')) {
    return cor.length === 7 ? cor : COR_PADRAO
  }

  const partes = cor.match(/\d+/g)

  if (partes && partes.length >= 3) {
    return (
      '#' +
      partes
        .slice(0, 3)
        .map((n) => Number(n).toString(16).padStart(2, '0'))
        .join('')
    )
  }

  return COR_PADRAO
}

// Mantém fonte, tamanho e cor da barra iguais ao trecho onde o cursor está.
function sincronizarEstilos(instancia) {
  const atributos = instancia.getAttributes('textStyle')

  fonte.value = atributos.fontFamily || 'Inter'
  tamanhoFonte.value = atributos.fontSize || '16px'
  corTexto.value = paraHex(atributos.color)
}

const editor = useEditor({
  extensions: [
    // No Tiptap v3 o StarterKit já inclui o sublinhado.
    StarterKit,
    TextStyle,
    FontFamily,
    FontSize,
    Color,
    TaskList,
    TaskItem.configure({
      nested: true,
      HTMLAttributes: {
        class: 'item-checklist',
      },
    }),
  ],

  content:
    localStorage.getItem(CHAVE_CONTEUDO) ||
    '<h2>Minha nota</h2><p>Comece a escrever aqui...</p>',

  onUpdate({ editor }) {
    localStorage.setItem(CHAVE_CONTEUDO, editor.getHTML())
    agendarSalvamento()
  },

  onSelectionUpdate({ editor }) {
    sincronizarEstilos(editor)
  },
})

watch(titulo, (novoTitulo) => {
  localStorage.setItem(CHAVE_TITULO, novoTitulo)
  if (carregandoNota) return
  agendarSalvamento()
}, { flush: 'sync' })

function agendarSalvamento() {
  if (temporizadorSalvamento) {
    clearTimeout(temporizadorSalvamento)
  }

  salvamento.value = 'Alterações pendentes'
  temporizadorSalvamento = setTimeout(salvarNota, TEMPO_SALVAMENTO)
}

async function salvarNota() {
  temporizadorSalvamento = null

  if (!editor.value) return

  salvamento.value = 'Salvando...'

  try {
    const dadosNota = {
      titulo: titulo.value.trim() || 'Sem título',
      texto: editor.value.getHTML(),
    }

    const notaSalva = notaId.value
      ? await notasStore.updateNota(notaId.value, dadosNota)
      : await notasStore.addNota(dadosNota)

    notaId.value = notaSalva?.id || notaId.value
    salvamento.value = 'Salvo automaticamente'
  } catch (err) {
    salvamento.value = 'Erro ao salvar'
    console.error('Erro ao salvar nota automaticamente:', err)
  }
}

function carregarNota(nota) {
  if (!nota?.id) return

  carregandoNota = true
  notaId.value = nota.id
  titulo.value = nota.titulo || ''
  editor.value?.commands.setContent(
    nota.texto || nota.conteudo || '',
    false
  )
  carregandoNota = false
  salvamento.value = 'Salvo'
}

function prepararNovaNota() {
  notaId.value = null
  titulo.value = ''
  editor.value?.commands.setContent('', false)
  salvamento.value = 'Rascunho local'
}

async function abrirNota(event) {
  const id = event?.detail?.id
  if (!id) return

  let nota = notasStore.notas.find((item) => item.id === id)

  if (!nota) {
    try {
      await notasStore.fetchNotas()
      nota = notasStore.notas.find((item) => item.id === id)
    } catch (err) {
      console.error('Erro ao carregar nota para edição:', err)
    }
  }

  if (nota) carregarNota(nota)
}

/*
 * No celular, o teclado virtual cobre elementos fixos no rodapé.
 * Medimos a área visível e levantamos a barra para ficar logo acima dele.
 */
function atualizarTeclado() {
  const vv = window.visualViewport

  if (!vv) return

  // Com zoom (pinça) não é teclado.
  if (vv.scale > 1.01) {
    teclado.value = 0
    return
  }

  const altura = Math.round(window.innerHeight - vv.height - vv.offsetTop)

  teclado.value = altura < 80 ? 0 : altura
}

onMounted(() => {
  window.visualViewport?.addEventListener('resize', atualizarTeclado)
  window.visualViewport?.addEventListener('scroll', atualizarTeclado)
  window.addEventListener('nexos-nota-abrir', abrirNota)
  window.addEventListener('nexos-nota-nova', prepararNovaNota)
})

onBeforeUnmount(() => {
  if (temporizadorSalvamento) {
    clearTimeout(temporizadorSalvamento)
  }

  window.visualViewport?.removeEventListener('resize', atualizarTeclado)
  window.visualViewport?.removeEventListener('scroll', atualizarTeclado)
  window.removeEventListener('nexos-nota-abrir', abrirNota)
  window.removeEventListener('nexos-nota-nova', prepararNovaNota)
  editor.value?.destroy()
})

function aplicarFonte() {
  editor.value
    ?.chain()
    .focus()
    .setFontFamily(fonte.value)
    .run()
}

function aplicarTamanho() {
  editor.value
    ?.chain()
    .focus()
    .setFontSize(tamanhoFonte.value)
    .run()
}

function aplicarCor() {
  editor.value
    ?.chain()
    .focus()
    .setColor(corTexto.value)
    .run()
}

function removerCor() {
  editor.value?.chain().focus().unsetColor().run()
  corTexto.value = COR_PADRAO
}

/*
 * Converte somente o item da lista em que o cursor está.
 * Os itens anteriores e posteriores continuam como lista normal.
 */
function adicionarChecklist() {
  const instancia = editor.value

  if (!instancia) return

  const { selection } = instancia.state
  const { $from } = selection

  let nivelItem = -1
  let nivelLista = -1

  // Encontra o item e a lista que contêm o cursor.
  for (let nivel = $from.depth; nivel > 0; nivel--) {
    const nome = $from.node(nivel).type.name

    if (nome === 'listItem') {
      nivelItem = nivel
    }

    if (
      nome === 'bulletList' ||
      nome === 'orderedList' ||
      nome === 'taskList'
    ) {
      nivelLista = nivel
      break
    }
  }

  // Fora de uma lista: cria um checklist normalmente.
  if (nivelItem === -1 || nivelLista === -1) {
    instancia.chain().focus().toggleTaskList().run()
    return
  }

  const lista = $from.node(nivelLista)
  const item = $from.node(nivelItem)
  const indiceItem = $from.index(nivelLista)

  // Se a lista já for checklist, mantém o comportamento de alternância.
  if (lista.type.name === 'taskList') {
    instancia.chain().focus().toggleTaskList().run()
    return
  }

  // Guarda os itens anteriores e posteriores ao item selecionado.
  const itens = []

  lista.forEach((no, indice) => {
    itens.push({
      node: no,
      indice,
    })
  })

  const anteriores = itens
    .filter(({ indice }) => indice < indiceItem)
    .map(({ node }) => node)

  const posteriores = itens
    .filter(({ indice }) => indice > indiceItem)
    .map(({ node }) => node)

  const tipoLista = lista.type.name
  const schema = instancia.state.schema

  const tipoListaNormal = schema.nodes[tipoLista]
  const tipoTaskList = schema.nodes.taskList
  const tipoTaskItem = schema.nodes.taskItem
  const tipoItemNormal = schema.nodes.listItem

  if (
    !tipoListaNormal ||
    !tipoTaskList ||
    !tipoTaskItem ||
    !tipoItemNormal
  ) {
    console.error('Não foi possível encontrar os tipos de lista do Tiptap.')
    return
  }

  // Converte o conteúdo do item selecionado para um item de checklist.
  const conteudos = []

  item.forEach((filho) => conteudos.push(filho))

  const novoItem = tipoTaskItem.create(
    { checked: false },
    conteudos
  )

  const novosBlocos = []

  if (anteriores.length > 0) {
    novosBlocos.push(tipoListaNormal.create(null, anteriores))
  }

  novosBlocos.push(tipoTaskList.create(null, [novoItem]))

  if (posteriores.length > 0) {
    novosBlocos.push(tipoListaNormal.create(null, posteriores))
  }

  // Substitui a lista original pelas listas resultantes.
  const inicioLista = $from.before(nivelLista)
  const fimLista = inicioLista + lista.nodeSize

  const transacao = instancia.state.tr.replaceWith(
    inicioLista,
    fimLista,
    novosBlocos
  )

  instancia.view.dispatch(transacao)
  instancia.commands.focus()
}

function alternarMarcadores() {
  editor.value?.chain().focus().toggleBulletList().run()
}

function alternarNumeracao() {
  editor.value?.chain().focus().toggleOrderedList().run()
}
</script>

<template>
  <section class="editor-nota">
    <input
      v-model="titulo"
      class="titulo-nota"
      type="text"
      placeholder="Título da nota"
      aria-label="Título da nota"
    />

    <p class="status-salvamento">
      {{ salvamento }}
    </p>

    <div
      v-if="editor"
      class="barra-formatacao"
      :class="{ 'com-teclado': teclado > 0 }"
      :style="{ '--teclado': teclado + 'px' }"
      role="toolbar"
      aria-label="Formatação do texto"
    >
      <!-- Fonte e tamanho -->
      <div class="grupo-fmt">
        <select
          v-model="fonte"
          class="sel-fmt sel-fmt-fonte"
          title="Fonte do texto"
          aria-label="Fonte do texto"
          @change="aplicarFonte"
        >
          <option value="Inter">Inter</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="monospace">Monospace</option>
        </select>

        <select
          v-model="tamanhoFonte"
          class="sel-fmt sel-fmt-tamanho"
          title="Tamanho da fonte"
          aria-label="Tamanho da fonte"
          @change="aplicarTamanho"
        >
          <option value="12px">12 px</option>
          <option value="14px">14 px</option>
          <option value="16px">16 px</option>
          <option value="20px">20 px</option>
          <option value="24px">24 px</option>
          <option value="32px">32 px</option>
        </select>
      </div>

      <!-- Estilo do texto -->
      <div class="grupo-fmt">
        <button
          type="button"
          class="btn-fmt"
          title="Negrito"
          aria-label="Negrito"
          :aria-pressed="editor.isActive('bold')"
          :class="{ ativo: editor.isActive('bold') }"
          @mousedown.prevent
          @click="editor.chain().focus().toggleBold().run()"
        >
          <strong>B</strong>
        </button>

        <button
          type="button"
          class="btn-fmt"
          title="Itálico"
          aria-label="Itálico"
          :aria-pressed="editor.isActive('italic')"
          :class="{ ativo: editor.isActive('italic') }"
          @mousedown.prevent
          @click="editor.chain().focus().toggleItalic().run()"
        >
          <em>I</em>
        </button>

        <button
          type="button"
          class="btn-fmt"
          title="Sublinhado"
          aria-label="Sublinhado"
          :aria-pressed="editor.isActive('underline')"
          :class="{ ativo: editor.isActive('underline') }"
          @mousedown.prevent
          @click="editor.chain().focus().toggleUnderline().run()"
        >
          <u>U</u>
        </button>
      </div>

      <!-- Títulos -->
      <div class="grupo-fmt">
        <button
          type="button"
          class="btn-fmt"
          title="Título H1"
          aria-label="Título H1"
          :aria-pressed="editor.isActive('heading', { level: 1 })"
          :class="{ ativo: editor.isActive('heading', { level: 1 }) }"
          @mousedown.prevent
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        >
          H1
        </button>

        <button
          type="button"
          class="btn-fmt"
          title="Título H2"
          aria-label="Título H2"
          :aria-pressed="editor.isActive('heading', { level: 2 })"
          :class="{ ativo: editor.isActive('heading', { level: 2 }) }"
          @mousedown.prevent
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        >
          H2
        </button>
      </div>

      <!-- Listas -->
      <div class="grupo-fmt">
        <button
          type="button"
          class="btn-fmt"
          title="Lista com marcadores"
          aria-label="Lista com marcadores"
          :aria-pressed="editor.isActive('bulletList')"
          :class="{ ativo: editor.isActive('bulletList') }"
          @mousedown.prevent
          @click="alternarMarcadores"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <circle cx="5" cy="6" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="5" cy="18" r="1.2" fill="currentColor" stroke="none" />
            <path d="M10 6h10M10 12h10M10 18h10" />
          </svg>
        </button>

        <button
          type="button"
          class="btn-fmt"
          title="Lista numerada"
          aria-label="Lista numerada"
          :aria-pressed="editor.isActive('orderedList')"
          :class="{ ativo: editor.isActive('orderedList') }"
          @mousedown.prevent
          @click="alternarNumeracao"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <text x="2" y="8" font-size="7" font-weight="700" fill="currentColor" stroke="none">1</text>
            <text x="2" y="14" font-size="7" font-weight="700" fill="currentColor" stroke="none">2</text>
            <text x="2" y="20" font-size="7" font-weight="700" fill="currentColor" stroke="none">3</text>
            <path d="M10 6h10M10 12h10M10 18h10" />
          </svg>
        </button>

        <button
          type="button"
          class="btn-fmt"
          title="Checklist"
          aria-label="Checklist"
          :aria-pressed="editor.isActive('taskList')"
          :class="{ ativo: editor.isActive('taskList') }"
          @mousedown.prevent
          @click="adicionarChecklist"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="4" y="4" width="16" height="16" rx="3" />
            <path d="M8 12.5l3 3 5-6" />
          </svg>
        </button>
      </div>

      <!-- Cor -->
      <div class="grupo-fmt">
        <label class="btn-fmt controle-cor" title="Cor do texto">
          <span
            class="amostra-cor"
            :style="{ background: corTexto }"
          ></span>

          <input
            v-model="corTexto"
            type="color"
            aria-label="Escolher cor do texto"
            @change="aplicarCor"
          />
        </label>

        <button
          type="button"
          class="btn-fmt btn-texto"
          title="Voltar à cor padrão"
          @mousedown.prevent
          @click="removerCor"
        >
          Padrão
        </button>
      </div>
    </div>

    <EditorContent
      :editor="editor"
      class="area-escrita"
    />
  </section>
</template>

<style>
.editor-nota {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px 36px 70px;
  box-sizing: border-box;
  color: var(--cor-texto, #eeeeee);
}

.titulo-nota {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: inherit;
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 8px;
}

.status-salvamento {
  color: #999;
  font-size: 12px;
  margin-bottom: 18px;
}

/* ===================================================== */
/* Barra de formatação — computador: fixa no topo        */
/* ===================================================== */
.barra-formatacao {
  --acento: #ff5700;

  position: sticky;
  top: 64px;
  z-index: 100;

  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 6px;

  padding: 8px 10px;
  margin-bottom: 22px;

  background: var(--cor-superficie, var(--cor-fundo, #202020));
  border: 1px solid var(--cor-borda, #3c3c3c);
  border-radius: 14px;
  box-shadow: 0 6px 24px rgb(0 0 0 / 18%);
}

/* Efeito de vidro nos navegadores que suportam */
@supports (background: color-mix(in srgb, red 50%, blue)) and
  (backdrop-filter: blur(1px)) {
  .barra-formatacao {
    background: color-mix(
      in srgb,
      var(--cor-superficie, var(--cor-fundo, #202020)) 86%,
      transparent
    );
    backdrop-filter: blur(14px) saturate(140%);
    -webkit-backdrop-filter: blur(14px) saturate(140%);
  }
}

/* Grupos de botões separados por uma linha fina */
.grupo-fmt {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 2px;
}

.grupo-fmt + .grupo-fmt {
  padding-left: 8px;
  border-left: 1px solid var(--cor-borda, #3c3c3c);
}

.grupo-fmt:first-child {
  gap: 6px;
}

/* Botões */
.btn-fmt {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  box-sizing: border-box;

  border: none;
  border-radius: 8px;
  background: transparent;
  color: inherit;

  font: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;

  transition:
    background 0.15s ease,
    color 0.15s ease,
    transform 0.1s ease;
  -webkit-tap-highlight-color: transparent;
}

.btn-fmt:hover {
  background: color-mix(in srgb, currentColor 12%, transparent);
}

.btn-fmt:active {
  transform: scale(0.94);
}

.btn-fmt.ativo,
.btn-fmt.ativo:hover {
  background: rgb(255 87 0 / 18%);
  color: var(--acento);
}

.btn-fmt:focus-visible,
.sel-fmt:focus-visible,
.controle-cor:focus-within {
  outline: 2px solid var(--acento);
  outline-offset: 1px;
}

.btn-texto {
  font-size: 13px;
  font-weight: 500;
  opacity: 0.85;
}

/* Selects de fonte e tamanho */
.sel-fmt {
  height: 36px;
  padding: 0 8px;
  box-sizing: border-box;

  border: 1px solid var(--cor-borda, #3c3c3c);
  border-radius: 8px;
  background: transparent;
  color: inherit;

  font: inherit;
  font-size: 14px;
  cursor: pointer;
}

.sel-fmt option {
  background: var(--cor-superficie, var(--cor-fundo, #202020));
  color: var(--cor-texto, #eeeeee);
}

.sel-fmt-fonte {
  width: 112px;
}

.sel-fmt-tamanho {
  width: 84px;
}

/* Seletor de cor: bolinha com a cor atual */
.controle-cor {
  position: relative;
}

.amostra-cor {
  display: block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, currentColor 35%, transparent);
  box-sizing: border-box;
}

.controle-cor input[type='color'] {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  opacity: 0;
  cursor: pointer;
}

/* ===================================================== */
/* Área de escrita                                       */
/* ===================================================== */
.area-escrita .tiptap p {
  margin: 8px 0;
}

.area-escrita .tiptap h1,
.area-escrita .tiptap h2,
.area-escrita .tiptap h3 {
  margin: 24px 0 12px;
}

.area-escrita .tiptap ul,
.area-escrita .tiptap ol {
  padding-left: 28px;
}

.area-escrita .tiptap ul[data-type='taskList'] {
  list-style: none;
  padding-left: 0;
  margin-left: 0;
}

.area-escrita .tiptap ul[data-type='taskList'] li {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin: 5px 0;
  padding: 0;
}

.area-escrita .tiptap ul[data-type='taskList'] li > label {
  flex: 0 0 auto;
  margin: 5px 0 0;
  user-select: none;
}

.area-escrita .tiptap ul[data-type='taskList'] li > div {
  flex: 1;
  min-width: 0;
}

.area-escrita .tiptap ul[data-type='taskList'] li > div > p {
  margin: 0;
}

.area-escrita .tiptap ul[data-type='taskList'] input[type='checkbox'] {
  width: 16px;
  height: 16px;
  accent-color: #ff5700;
  cursor: pointer;
}

/* ===================================================== */
/* Celular: a barra vira o rodapé fixo da tela           */
/* (um único bloco @media, sem regras que se sobrepõem)  */
/* ===================================================== */
@media (max-width: 700px) {
  /* Espaço no fim da nota para o rodapé não cobrir o texto */
  .editor-nota {
    padding: 18px 16px 110px;
  }

  .titulo-nota {
    font-size: 28px;
  }

  .area-escrita .tiptap {
    padding-bottom: 24px;
  }

  .barra-formatacao {
    position: fixed;
    top: auto;
    left: 0;
    right: 0;
    bottom: var(--teclado, 0px);
    z-index: 1300;

    flex-wrap: nowrap;
    gap: 6px;

    width: 100%;
    max-width: 100%;
    box-sizing: border-box;

    margin: 0;
    padding: 8px 10px calc(8px + env(safe-area-inset-bottom));

    border: none;
    border-top: 1px solid var(--cor-borda, #3c3c3c);
    border-radius: 18px 18px 0 0;
    box-shadow: 0 -6px 24px rgb(0 0 0 / 22%);

    /* Rolagem horizontal sem mostrar a barra de rolagem */
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;

    transition: bottom 0.12s ease-out;
  }

  .barra-formatacao::-webkit-scrollbar {
    display: none;
  }

  /* Com o teclado aberto, a barra encosta nele (sem a área segura) */
  .barra-formatacao.com-teclado {
    padding-bottom: 8px;
    border-radius: 0;
  }

  /* Alvos de toque maiores */
  .btn-fmt {
    min-width: 42px;
    height: 42px;
  }

  /* 16px evita o zoom automático do iPhone ao tocar no select */
  .sel-fmt {
    height: 42px;
    font-size: 16px;
  }

  .sel-fmt-fonte {
    width: 124px;
  }

  .sel-fmt-tamanho {
    width: 96px;
  }

  .grupo-fmt + .grupo-fmt {
    padding-left: 6px;
  }
}
</style>