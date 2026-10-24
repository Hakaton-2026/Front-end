
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

/* =====================================
   CONFIGURAÇÕES
===================================== */

const CHAVE_TITULO = 'nexos-nota-titulo'
const CHAVE_CONTEUDO = 'nexos-nota-conteudo'
const CHAVE_NOTAS = 'nexos-notas'

const COR_PADRAO = '#ffffff'
const TEMPO_SALVAMENTO = 1000

const notasStore = useNotasStore()

/* =====================================
   ESTADOS
===================================== */

const titulo = ref(
  localStorage.getItem(CHAVE_TITULO) || 'Minha primeira nota'
)

const notaId = ref(null)
const notaFavorita = ref(false)

const fonte = ref('Inter')
const tamanhoFonte = ref('16px')
const corTexto = ref(COR_PADRAO)

const salvamento = ref('Salvo')
const teclado = ref(0)

let temporizadorSalvamento = null
let carregandoNota = false
let salvandoNota = false
let salvarNovamente = false

/* =====================================
   CORES E ESTILOS
===================================== */

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
        .map((n) =>
          Number(n).toString(16).padStart(2, '0')
        )
        .join('')
    )
  }

  return COR_PADRAO
}

function sincronizarEstilos(instancia) {
  const atributos = instancia.getAttributes('textStyle')

  fonte.value = atributos.fontFamily || 'Inter'
  tamanhoFonte.value = atributos.fontSize || '16px'
  corTexto.value = paraHex(atributos.color)
}

/* =====================================
   EDITOR TIPTAP
===================================== */

const editor = useEditor({
  extensions: [
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
    if (carregandoNota) return

    localStorage.setItem(
      CHAVE_CONTEUDO,
      editor.getHTML()
    )

    agendarSalvamento()
  },

  onSelectionUpdate({ editor }) {
    sincronizarEstilos(editor)
  },
})

/* =====================================
   SALVAMENTO LOCAL
===================================== */

function atualizarCacheLocal(nota) {
  if (!nota?.id) return

  let lista = []

  try {
    const dados = JSON.parse(
      localStorage.getItem(CHAVE_NOTAS) || '[]'
    )

    lista = Array.isArray(dados) ? dados : []
  } catch (erro) {
    console.error('Erro ao ler notas locais:', erro)
  }

  const indice = lista.findIndex(
    (item) => String(item.id) === String(nota.id)
  )

  if (indice >= 0) {
    lista[indice] = {
      ...lista[indice],
      ...nota,
    }
  } else {
    lista.unshift(nota)
  }

  localStorage.setItem(
    CHAVE_NOTAS,
    JSON.stringify(lista)
  )

  localStorage.setItem(CHAVE_TITULO, titulo.value)
  localStorage.setItem(
    CHAVE_CONTEUDO,
    editor.value?.getHTML() || ''
  )

  localStorage.setItem(
    'nexos-nota-id',
    String(nota.id)
  )

  window.dispatchEvent(
    new CustomEvent('nexos-nota-salva', {
      detail: nota,
    })
  )
}

/* =====================================
   SALVAMENTO AUTOMÁTICO
===================================== */

function agendarSalvamento() {
  if (carregandoNota) return

  if (temporizadorSalvamento) {
    clearTimeout(temporizadorSalvamento)
  }

  salvamento.value = 'Alterações pendentes'

  temporizadorSalvamento = setTimeout(
    salvarNota,
    TEMPO_SALVAMENTO
  )
}

async function salvarNota() {
  temporizadorSalvamento = null

  if (!editor.value) return

  if (salvandoNota) {
    salvarNovamente = true
    return
  }

  salvandoNota = true
  salvamento.value = 'Salvando...'

  const idAntesDeSalvar = notaId.value

  const dadosNota = {
    titulo: titulo.value.trim() || 'Sem título',
    texto: editor.value.getHTML(),
  }

  try {
    const notaSalva = idAntesDeSalvar
      ? await notasStore.updateNota(
          idAntesDeSalvar,
          dadosNota
        )
      : await notasStore.addNota(dadosNota)

    if (!notaSalva?.id && !idAntesDeSalvar) {
      throw new Error('A API não retornou o ID da nova nota.')
    }

    const idSalvo = notaSalva?.id ?? idAntesDeSalvar

    // Evita que uma resposta antiga substitua outra nota aberta.
    if (
      notaId.value !== idAntesDeSalvar &&
      notaId.value !== null
    ) {
      return
    }

    notaId.value = idSalvo

    const notaAtualizada = {
      ...notaSalva,
      id: idSalvo,
      titulo: dadosNota.titulo,
      texto: dadosNota.texto,
      conteudo: dadosNota.texto,
      favorito: notaFavorita.value,
      atualizadoEm: Date.now(),
    }

    atualizarCacheLocal(notaAtualizada)

    salvamento.value = 'Salvo automaticamente'
  } catch (erro) {
    salvamento.value = 'Erro ao salvar'

    console.error(
      'Erro ao salvar nota automaticamente:',
      erro
    )
  } finally {
    salvandoNota = false

    if (salvarNovamente) {
      salvarNovamente = false
      agendarSalvamento()
    }
  }
}

/* =====================================
   FAVORITOS
===================================== */

function alternarFavorito() {
  notaFavorita.value = !notaFavorita.value

  const id = notaId.value

  if (id) {
    let lista = []

    try {
      lista = JSON.parse(
        localStorage.getItem(CHAVE_NOTAS) || '[]'
      )
    } catch {
      lista = []
    }

    if (!Array.isArray(lista)) lista = []

    lista = lista.map((nota) =>
      String(nota.id) === String(id)
        ? {
            ...nota,
            favorito: notaFavorita.value,
            atualizadoEm: Date.now(),
          }
        : nota
    )

    localStorage.setItem(
      CHAVE_NOTAS,
      JSON.stringify(lista)
    )

    const notaAtualizada = lista.find(
      (nota) => String(nota.id) === String(id)
    )

    if (notaAtualizada) {
      window.dispatchEvent(
        new CustomEvent('nexos-nota-salva', {
          detail: notaAtualizada,
        })
      )
    }
  }

  salvamento.value = notaFavorita.value
    ? 'Nota marcada como favorita'
    : 'Favorito removido'
}

/* =====================================
   OBSERVAR TÍTULO
===================================== */

watch(
  titulo,
  (novoTitulo) => {
    localStorage.setItem(
      CHAVE_TITULO,
      novoTitulo
    )

    if (carregandoNota) return

    agendarSalvamento()
  },
  { flush: 'sync' }
)

/* =====================================
   CARREGAR NOTA
===================================== */

function carregarNota(nota) {
  if (!nota?.id) return

  if (temporizadorSalvamento) {
    clearTimeout(temporizadorSalvamento)
    temporizadorSalvamento = null
  }

  carregandoNota = true

  notaId.value = nota.id
  titulo.value = nota.titulo || ''

  const conteudo = nota.texto || nota.conteudo || ''

  let favorita = Boolean(nota.favorito)

  try {
    const listaLocal = JSON.parse(
      localStorage.getItem(CHAVE_NOTAS) || '[]'
    )

    if (Array.isArray(listaLocal)) {
      const local = listaLocal.find(
        (item) => String(item.id) === String(nota.id)
      )

      if (local) {
        favorita = Boolean(local.favorito)
      }
    }
  } catch (erro) {
    console.error('Erro ao consultar favorito:', erro)
  }

  notaFavorita.value = favorita

  editor.value?.commands.setContent(
    conteudo,
    false
  )

  localStorage.setItem(CHAVE_TITULO, titulo.value)
  localStorage.setItem(CHAVE_CONTEUDO, conteudo)
  localStorage.setItem('nexos-nota-id', String(nota.id))

  carregandoNota = false

  salvamento.value = 'Salvo'
}

/* =====================================
   NOVA NOTA
===================================== */

function prepararNovaNota() {
  if (temporizadorSalvamento) {
    clearTimeout(temporizadorSalvamento)
    temporizadorSalvamento = null
  }

  carregandoNota = true

  notaId.value = null
  notaFavorita.value = false
  titulo.value = ''

  editor.value?.commands.setContent('', false)

  localStorage.removeItem('nexos-nota-id')
  localStorage.setItem(CHAVE_TITULO, '')
  localStorage.setItem(CHAVE_CONTEUDO, '')

  localStorage.removeItem(
    'nexos-nota-nova-pendente'
  )

  carregandoNota = false

  salvamento.value = 'Nova nota'
}

/* =====================================
   ABRIR NOTA PELO EVENTO
===================================== */

async function abrirNota(event) {
  const id = event?.detail?.id

  if (!id) return

  let nota = notasStore.notas.find(
    (item) => String(item.id) === String(id)
  )

  if (!nota) {
    try {
      await notasStore.fetchNotas()

      nota = notasStore.notas.find(
        (item) => String(item.id) === String(id)
      )
    } catch (erro) {
      console.error(
        'Erro ao carregar nota para edição:',
        erro
      )
    }
  }

  if (nota) {
    carregarNota(nota)
    return
  }

  // Compatibilidade com notas armazenadas localmente.
  try {
    const lista = JSON.parse(
      localStorage.getItem(CHAVE_NOTAS) || '[]'
    )

    const notaLocal = Array.isArray(lista)
      ? lista.find(
          (item) => String(item.id) === String(id)
        )
      : null

    if (notaLocal) {
      carregarNota(notaLocal)
    }
  } catch (erro) {
    console.error('Erro ao abrir nota local:', erro)
  }
}

/* =====================================
   TECLADO VIRTUAL
===================================== */

function atualizarTeclado() {
  const vv = window.visualViewport

  if (!vv) return

  if (vv.scale > 1.01) {
    teclado.value = 0
    return
  }

  const altura = Math.round(
    window.innerHeight -
    vv.height -
    vv.offsetTop
  )

  teclado.value = altura < 80 ? 0 : altura
}

/* =====================================
   CICLO DE VIDA
===================================== */

onMounted(() => {
  window.visualViewport?.addEventListener(
    'resize',
    atualizarTeclado
  )

  window.visualViewport?.addEventListener(
    'scroll',
    atualizarTeclado
  )

  window.addEventListener(
    'nexos-nota-abrir',
    abrirNota
  )

  window.addEventListener(
    'nexos-nota-nova',
    prepararNovaNota
  )

  if (
    localStorage.getItem(
      'nexos-nota-nova-pendente'
    ) === 'true'
  ) {
    prepararNovaNota()
  }
})

onBeforeUnmount(() => {
  if (temporizadorSalvamento) {
    clearTimeout(temporizadorSalvamento)
  }

  window.visualViewport?.removeEventListener(
    'resize',
    atualizarTeclado
  )

  window.visualViewport?.removeEventListener(
    'scroll',
    atualizarTeclado
  )

  window.removeEventListener(
    'nexos-nota-abrir',
    abrirNota
  )

  window.removeEventListener(
    'nexos-nota-nova',
    prepararNovaNota
  )

  editor.value?.destroy()
})

/* =====================================
   FORMATAÇÃO
===================================== */

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
  editor.value
    ?.chain()
    .focus()
    .unsetColor()
    .run()

  corTexto.value = COR_PADRAO
}

/* =====================================
   CHECKLIST
===================================== */

function adicionarChecklist() {
  const instancia = editor.value

  if (!instancia) return

  const { selection } = instancia.state
  const { $from } = selection

  let nivelItem = -1
  let nivelLista = -1

  for (
    let nivel = $from.depth;
    nivel > 0;
    nivel--
  ) {
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

  if (nivelItem === -1 || nivelLista === -1) {
    instancia
      .chain()
      .focus()
      .toggleTaskList()
      .run()

    return
  }

  const lista = $from.node(nivelLista)
  const item = $from.node(nivelItem)
  const indiceItem = $from.index(nivelLista)

  if (lista.type.name === 'taskList') {
    instancia
      .chain()
      .focus()
      .toggleTaskList()
      .run()

    return
  }

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
    console.error(
      'Não foi possível encontrar os tipos de lista do Tiptap.'
    )

    return
  }

  const conteudos = []

  item.forEach((filho) => {
    conteudos.push(filho)
  })

  const novoItem = tipoTaskItem.create(
    { checked: false },
    conteudos
  )

  const novosBlocos = []

  if (anteriores.length > 0) {
    novosBlocos.push(
      tipoListaNormal.create(null, anteriores)
    )
  }

  novosBlocos.push(
    tipoTaskList.create(null, [novoItem])
  )

  if (posteriores.length > 0) {
    novosBlocos.push(
      tipoListaNormal.create(null, posteriores)
    )
  }

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

/* =====================================
   LISTAS
===================================== */

function alternarMarcadores() {
  editor.value
    ?.chain()
    .focus()
    .toggleBulletList()
    .run()
}

function alternarNumeracao() {
  editor.value
    ?.chain()
    .focus()
    .toggleOrderedList()
    .run()
}
</script>
