<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import SidebarNotas from '@/components/notas/SidebarNotas.vue'
import EditorNota from '@/components/notas/EditorNota.vue'

const CHAVE_NOTAS = 'nexos-notas'

const sidebarNotasAberta = ref(false)
const secaoAtiva = ref('editor')
const notas = ref([])

const notasRecentes = computed(() =>
  [...notas.value]
    .sort((a, b) => (b.atualizadoEm ?? 0) - (a.atualizadoEm ?? 0))
    .slice(0, 8)
)

const favoritos = computed(() =>
  notas.value.filter((nota) => Boolean(nota.favorito))
)

const documentos = computed(() => notas.value.slice(0, 10))

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

function carregarNotas() {
  try {
    const salvas = JSON.parse(localStorage.getItem(CHAVE_NOTAS) || '[]')
    notas.value = Array.isArray(salvas) ? salvas : []
  } catch {
    notas.value = []
  }
}

function formatarData(valor) {
  if (!valor) return 'Hoje'

  return new Date(valor).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function extrairTexto(conteudo) {
  if (!conteudo) return 'Nenhum conteúdo registrado ainda.'

  const texto = String(conteudo)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!texto) return 'Nenhum conteúdo registrado ainda.'

  return texto.length > 120 ? `${texto.slice(0, 120)}...` : texto
}

function alternarSidebarNotas() {
  sidebarNotasAberta.value = !sidebarNotasAberta.value
}

function fecharSidebarNotas() {
  sidebarNotasAberta.value = false
}

function selecionarSecao(novaSecao) {
  secaoAtiva.value = novaSecao
}

function abrirNota(notaId) {
  secaoAtiva.value = 'editor'
  window.dispatchEvent(
    new CustomEvent('nexos-nota-abrir', { detail: { id: notaId } })
  )
}

function criarNovaNota() {
  secaoAtiva.value = 'editor'
  window.dispatchEvent(new CustomEvent('nexos-nota-nova'))
}

function excluirNota(notaId) {
  const lista = [...notas.value].filter((nota) => nota.id !== notaId)
  notas.value = lista
  localStorage.setItem(CHAVE_NOTAS, JSON.stringify(lista))
  window.dispatchEvent(new CustomEvent('nexos-nota-removida', { detail: notaId }))
}

function duplicarNota(notaId) {
  const origem = notas.value.find((nota) => nota.id === notaId)

  if (!origem) return

  const copia = {
    ...origem,
    id: `${origem.id}-copia-${Date.now()}`,
    titulo: `${origem.titulo || 'Nota'} (cópia)`,
    favorito: false,
    atualizadoEm: Date.now(),
  }

  const lista = [copia, ...notas.value.filter((nota) => nota.id !== notaId)]
  notas.value = lista
  localStorage.setItem(CHAVE_NOTAS, JSON.stringify(lista))
  window.dispatchEvent(new CustomEvent('nexos-nota-salva', { detail: copia }))
}

function sincronizarNotas(event) {
  const novaNota = event?.detail

  if (!novaNota || !novaNota.id) return

  const lista = [...notas.value]
  const indice = lista.findIndex((nota) => nota.id === novaNota.id)

  if (indice >= 0) {
    lista[indice] = novaNota
  } else {
    lista.unshift(novaNota)
  }

  notas.value = lista.sort(
    (a, b) => (b.atualizadoEm ?? 0) - (a.atualizadoEm ?? 0)
  )
}

function removerNota(event) {
  const id = event?.detail

  if (!id) return

  const lista = [...notas.value].filter((nota) => nota.id !== id)
  notas.value = lista

}

function atualizarListaCompleta(event) {
  const lista = Array.isArray(event?.detail) ? event.detail : []
  notas.value = lista
}

onMounted(() => {
  carregarNotas()
  window.addEventListener('nexos-nota-salva', sincronizarNotas)
  window.addEventListener('nexos-nota-removida', removerNota)
  window.addEventListener('nexos-nota-atualizada', atualizarListaCompleta)
})

onBeforeUnmount(() => {
  window.removeEventListener('nexos-nota-salva', sincronizarNotas)
  window.removeEventListener('nexos-nota-removida', removerNota)
  window.removeEventListener('nexos-nota-atualizada', atualizarListaCompleta)
})
</script>

<template>
  <main
    class="pagina-notas"
    :class="{ 'sidebar-aberta': sidebarNotasAberta }"
  >
    <div class="acoes-topo">
      <RouterLink to="/" class="btn-voltar-inicio" title="Voltar para a página inicial">
        <ion-icon name="arrow-back-outline"></ion-icon>
        <span>Início</span>
      </RouterLink>

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

    <div class="layout-container">
      <SidebarNotas
        :aberta="sidebarNotasAberta"
        :secao-ativa="secaoAtiva"
        @fechar="fecharSidebarNotas"
        @selecionar-secao="selecionarSecao"
      />

      <section class="conteudo-notas">
        <div v-if="secaoAtiva === 'editor'" class="conteudo-editor">
          <EditorNota />
        </div>

        <div v-else class="painel-lista-notas">
          <header class="cabecalho-lista">
            <div>
              <p class="usuario-rótulo">
                {{ secaoAtiva === 'documentos' ? 'Meus documentos' : secaoAtiva === 'recentes' ? 'Notas recentes' : 'Favoritos' }}
              </p>
              <h2>
                {{ secaoAtiva === 'documentos' ? 'Todos os seus documentos' : secaoAtiva === 'recentes' ? 'Últimas atualizações' : 'Notas marcadas como favoritas' }}
              </h2>
            </div>

            <div class="acoes-lista">
              <button type="button" class="botao-abrir-editor" @click="secaoAtiva = 'editor'">
                Abrir editor
              </button>
              <button type="button" class="botao-nova-nota" @click="criarNovaNota">
                Nova nota
              </button>
            </div>
          </header>

          <div v-if="listaAtual.length" class="lista-notas">
            <article
              v-for="nota in listaAtual"
              :key="nota.id"
              class="card-nota"
            >
              <button type="button" class="card-nota__conteudo" @click="abrirNota(nota.id)">
                <div class="card-nota__topo">
                  <span v-if="nota.favorito" class="badge-favorito">Favorito</span>
                  <span class="card-nota__tempo">{{ formatarData(nota.atualizadoEm) }}</span>
                </div>

                <h3>{{ nota.titulo || 'Sem título' }}</h3>
                <p>{{ extrairTexto(nota.conteudo) }}</p>
              </button>

              <div class="card-nota__acoes">
                <button type="button" class="acao-nota" @click="duplicarNota(nota.id)">
                  Duplicar
                </button>
                <button type="button" class="acao-nota acao-nota--danger" @click="excluirNota(nota.id)">
                  Excluir
                </button>
              </div>
            </article>
          </div>

          <div v-else class="lista-vazia">
            <ion-icon name="document-outline"></ion-icon>
            <p>
              {{ secaoAtiva === 'documentos'
                ? 'Ainda não há documentos salvos no editor.'
                : secaoAtiva === 'recentes'
                  ? 'Ainda não há notas recentes.'
                  : 'Você ainda não marcou nenhuma nota como favorita.' }}
            </p>
          </div>
        </div>
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
  background: var(--cor-fundo-site);
}

.acoes-topo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--cor-borda, #383838);
  background: var(--cor-fundo, #171717);
  position: relative;
  z-index: 101;
}

.btn-voltar-inicio {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  color: var(--cor-destaque, #a855f7);
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

.layout-container {
  display: flex;
  flex: 1;
  position: relative;
  width: 100%;
  min-width: 0;
}

.conteudo-notas {
  flex: 1;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 1.5rem;
  transition: margin-left 0.3s ease, width 0.3s ease;
}

.conteudo-editor {
  width: 100%;
}

.painel-lista-notas {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px 8px;
}

.cabecalho-lista {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.usuario-rótulo {
  margin: 0 0 8px;
  color: #c4b5fd;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.cabecalho-lista h2 {
  margin: 0;
  font-size: clamp(1.5rem, 2vw, 2.1rem);
}

.acoes-lista {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.botao-abrir-editor,
.botao-nova-nota {
  border: 1px solid var(--cor-destaque, #a855f7);
  background: transparent;
  color: var(--cor-destaque, #a855f7);
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 600;
  cursor: pointer;
}

.lista-notas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.card-nota {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 180px;
  text-align: left;
  padding: 18px;
  color: var(--cor-texto, #f5f5f5);
  background: var(--cor-fundo, #171717);
  border: 1px solid var(--cor-borda, #383838);
  border-radius: 16px;
  transition: transform 0.16s ease, border-color 0.16s ease;
}

.card-nota:hover {
  transform: translateY(-2px);
  border-color: rgb(168 85 247 / 50%);
}

.card-nota__conteudo {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0;
  text-align: left;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.card-nota__topo {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.badge-favorito {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: rgb(250 204 21 / 12%);
  color: #fbbf24;
  padding: 4px 8px;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.card-nota__tempo {
  color: #9ca3af;
  font-size: 0.72rem;
}

.card-nota h3 {
  margin: 0;
  font-size: 1.05rem;
}

.card-nota p {
  margin: 0;
  color: var(--cor-texto-secundario, #a3a3a3);
  line-height: 1.55;
}

.card-nota__acoes {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.acao-nota {
  flex: 1;
  border: 1px solid var(--cor-borda, #383838);
  background: transparent;
  color: var(--cor-texto, #f5f5f5);
  border-radius: 8px;
  padding: 8px 10px;
  cursor: pointer;
}

.acao-nota--danger {
  color: #fca5a5;
  border-color: rgb(248 113 113 / 35%);
}

.lista-vazia {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 220px;
  border: 1px dashed var(--cor-borda, #383838);
  border-radius: 18px;
  color: var(--cor-texto-secundario, #b2b2b2);
  background: rgb(255 255 255 / 02%);
  text-align: center;
  padding: 30px 20px;
}

.lista-vazia ion-icon {
  font-size: 32px;
  color: var(--cor-destaque, #a855f7);
}

@media (min-width: 769px) {
  .sidebar-aberta .conteudo-notas {
    margin-left: var(--largura-sidebar-notas);
    width: calc(100% - var(--largura-sidebar-notas));
  }
}

@media (max-width: 768px) {
  .pagina-notas {
    min-height: calc(100vh - 64px);
  }

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

  .conteudo-notas {
    padding: 1rem 0.8rem;
  }

  .cabecalho-lista {
    align-items: flex-start;
    flex-direction: column;
  }

  .sidebar-aberta .conteudo-notas {
    margin-left: 0;
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .conteudo-notas,
  .card-nota {
    transition: none;
  }
}
</style>
