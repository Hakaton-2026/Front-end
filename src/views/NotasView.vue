
<script setup>
import {
  computed,
  nextTick,
  onMounted,
  onBeforeUnmount,
  ref,
  watch
} from 'vue'

import { useNotasStore } from '@/stores/notas'

import SidebarNotas from '@/components/notas/SidebarNotas.vue'
import EditorNota from '@/components/notas/EditorNota.vue'

const notasStore = useNotasStore()

const CHAVE_NOTAS = 'nexos-notas'

const sidebarNotasAberta = ref(false)
const secaoAtiva = ref('editor')

/* =====================================
   UTILITÁRIOS
===================================== */

function mesmoId(a, b) {
  return String(a) === String(b)
}

function obterData(nota) {
  const valor =
    nota.atualizadoEm ??
    nota.updated_at ??
    nota.criadoEm ??
    nota.created_at

  if (!valor) return 0

  const data = new Date(valor).getTime()

  return Number.isNaN(data) ? 0 : data
}

function lerCacheLocal() {
  try {
    const dados = JSON.parse(
      localStorage.getItem(CHAVE_NOTAS) || '[]'
    )

    return Array.isArray(dados) ? dados : []
  } catch (erro) {
    console.error('Erro ao ler notas locais:', erro)
    return []
  }
}

function salvarCacheLocal(lista) {
  localStorage.setItem(
    CHAVE_NOTAS,
    JSON.stringify(lista)
  )
}

/* =====================================
   LISTAS
===================================== */

const notasRecentes = computed(() =>
  [...notasStore.notas]
    .sort((a, b) => obterData(b) - obterData(a))
    .slice(0, 8)
)

const favoritos = computed(() =>
  notasStore.notas.filter(
    (nota) => Boolean(nota.favorito)
  )
)

const documentos = computed(() =>
  [...notasStore.notas]
    .sort((a, b) => obterData(b) - obterData(a))
)

const listaAtual = computed(() => {
  switch (secaoAtiva.value) {
    case 'documentos':
      return documentos.value

    case 'recentes':
      return notasRecentes.value

    case 'favoritos':
      return favoritos.value

    default:
      return []
  }
})

/* =====================================
   FORMATAÇÃO
===================================== */

function formatarData(valor) {
  if (!valor) return 'Hoje'

  const data = new Date(valor)

  if (Number.isNaN(data.getTime())) {
    return 'Data indisponível'
  }

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function extrairTexto(conteudo) {
  if (!conteudo) {
    return 'Nenhum conteúdo registrado ainda.'
  }

  const texto = String(conteudo)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!texto) {
    return 'Nenhum conteúdo registrado ainda.'
  }

  return texto.length > 120
    ? `${texto.slice(0, 120)}...`
    : texto
}

/* =====================================
   SIDEBAR
===================================== */

function alternarSidebarNotas() {
  sidebarNotasAberta.value = !sidebarNotasAberta.value
}

function fecharSidebarNotas() {
  sidebarNotasAberta.value = false
}

function selecionarSecao(novaSecao) {
  secaoAtiva.value = novaSecao
  fecharSidebarNotas()
}

/* =====================================
   ABRIR NOTA
===================================== */

async function abrirNota(notaId) {
  secaoAtiva.value = 'editor'

  await nextTick()

  window.dispatchEvent(
    new CustomEvent('nexos-nota-abrir', {
      detail: {
        id: notaId
      }
    })
  )
}

/* =====================================
   CRIAR NOVA NOTA
===================================== */

async function criarNovaNota() {
  secaoAtiva.value = 'editor'

  localStorage.setItem(
    'nexos-nota-nova-pendente',
    'true'
  )

  await nextTick()

  window.dispatchEvent(
    new CustomEvent('nexos-nota-nova')
  )
}

/* =====================================
   EXCLUIR NOTA
===================================== */

async function excluirNota(notaId) {
  try {
    await notasStore.deleteNota(notaId)

    const lista = lerCacheLocal().filter(
      (nota) => !mesmoId(nota.id, notaId)
    )

    salvarCacheLocal(lista)

    window.dispatchEvent(
      new CustomEvent('nexos-nota-removida', {
        detail: notaId
      })
    )
  } catch (erro) {
    console.error('Erro ao excluir nota:', erro)
    alert('Não foi possível excluir a nota.')
  }
}

/* =====================================
   FAVORITOS
===================================== */

function alternarFavorito(notaId) {
  const indice = notasStore.notas.findIndex(
    (nota) => mesmoId(nota.id, notaId)
  )

  if (indice === -1) return

  const atual = notasStore.notas[indice]

  const atualizada = {
    ...atual,
    favorito: !Boolean(atual.favorito),
    atualizadoEm: Date.now()
  }

  // Atualiza a lista reativa da store.
  notasStore.notas.splice(
    indice,
    1,
    atualizada
  )

  // Mantém compatibilidade com o cache local
  // utilizado pelo EditorNota.
  const lista = lerCacheLocal()

  const indiceLocal = lista.findIndex(
    (nota) => mesmoId(nota.id, notaId)
  )

  if (indiceLocal >= 0) {
    lista[indiceLocal] = {
      ...lista[indiceLocal],
      ...atualizada
    }
  } else {
    lista.unshift(atualizada)
  }

  salvarCacheLocal(lista)

  window.dispatchEvent(
    new CustomEvent('nexos-nota-salva', {
      detail: atualizada
    })
  )
}

/* =====================================
   DUPLICAR NOTA
===================================== */

async function duplicarNota(notaId) {
  const origem = notasStore.notas.find(
    (nota) => mesmoId(nota.id, notaId)
  )

  if (!origem) return

  try {
    const copia = await notasStore.addNota({
      titulo: `${origem.titulo || 'Nota'} (cópia)`,
      texto: origem.texto || origem.conteudo || ''
    })

    if (copia?.id) {
      const novaNota = {
        ...copia,
        favorito: false,
        atualizadoEm: Date.now()
      }

      const lista = lerCacheLocal()

      lista.unshift({
        ...novaNota,
        conteudo: novaNota.texto || ''
      })

      salvarCacheLocal(lista)

      window.dispatchEvent(
        new CustomEvent('nexos-nota-salva', {
          detail: novaNota
        })
      )
    }
  } catch (erro) {
    console.error('Erro ao duplicar nota:', erro)
    alert('Não foi possível duplicar a nota.')
  }
}

/* =====================================
   SINCRONIZAÇÃO COM O EDITOR
===================================== */

function sincronizarNota(event) {
  const novaNota = event?.detail

  if (!novaNota?.id) return

  const indice = notasStore.notas.findIndex(
    (nota) => mesmoId(nota.id, novaNota.id)
  )

  if (indice >= 0) {
    notasStore.notas.splice(indice, 1, {
      ...notasStore.notas[indice],
      ...novaNota
    })
  } else {
    notasStore.notas.unshift(novaNota)
  }
}

function removerNota(event) {
  const id = event?.detail

  if (!id) return

  const indice = notasStore.notas.findIndex(
    (nota) => mesmoId(nota.id, id)
  )

  if (indice >= 0) {
    notasStore.notas.splice(indice, 1)
  }
}

/* =====================================
   CARREGAMENTO INICIAL
===================================== */

async function carregarNotas() {
  try {
    await notasStore.fetchNotas()

    // Recupera a marcação local de favoritos,
    // pois a implementação atual do editor
    // mantém essa informação no localStorage.
    const listaLocal = lerCacheLocal()

    notasStore.notas.forEach((nota, indice) => {
      const local = listaLocal.find(
        (item) => mesmoId(item.id, nota.id)
      )

      if (local) {
        notasStore.notas.splice(indice, 1, {
          ...nota,
          favorito: Boolean(local.favorito)
        })
      }
    })
  } catch (erro) {
    console.error(
      'Não foi possível carregar as notas:',
      erro
    )
  }
}

/* =====================================
   CICLO DE VIDA
===================================== */

onMounted(() => {
  window.addEventListener(
    'nexos-nota-salva',
    sincronizarNota
  )

  window.addEventListener(
    'nexos-nota-removida',
    removerNota
  )

  carregarNotas()
})

onBeforeUnmount(() => {
  window.removeEventListener(
    'nexos-nota-salva',
    sincronizarNota
  )

  window.removeEventListener(
    'nexos-nota-removida',
    removerNota
  )
})

watch(
  () => notasStore.notas.length,
  (quantidade) => {
    if (
      quantidade === 0 &&
      secaoAtiva.value !== 'editor'
    ) {
      secaoAtiva.value = 'editor'
    }
  }
)
</script>
