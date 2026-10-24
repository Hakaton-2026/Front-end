
<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const CHAVE_DOCUMENTOS = 'documentos-salvos'
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const documentosLocais = ref([])
const documentosDrive = ref([])
const pesquisa = ref('')
const filtro = ref('todos')
const visualizacao = ref('lista')

const modalAberto = ref(false)
const documentoEditando = ref(null)
const titulo = ref('')
const link = ref('')
const erro = ref('')
const aviso = ref('')
const carregando = ref(false)
const visualizando = ref(null)

let tokenGoogle = null
let clienteOAuth = null

const tipos = [
  { id: 'todos', nome: 'Todos' },
  { id: 'documento', nome: 'Documentos' },
  { id: 'planilha', nome: 'Planilhas' },
  { id: 'apresentacao', nome: 'Apresentações' },
  { id: 'pasta', nome: 'Pastas' },
  { id: 'arquivo', nome: 'Outros arquivos' }
]

function identificarTipo(linkOuArquivo) {
  const mime = linkOuArquivo?.mimeType || ''
  const url = linkOuArquivo?.url || linkOuArquivo || ''

  if (mime === 'application/vnd.google-apps.folder') return 'pasta'
  if (mime === 'application/vnd.google-apps.document') return 'documento'
  if (mime === 'application/vnd.google-apps.spreadsheet') return 'planilha'
  if (mime === 'application/vnd.google-apps.presentation') return 'apresentacao'

  if (/docs\.google\.com\/document\//i.test(url)) return 'documento'
  if (/docs\.google\.com\/spreadsheets\//i.test(url)) return 'planilha'
  if (/docs\.google\.com\/presentation\//i.test(url)) return 'apresentacao'
  if (/drive\.google\.com\/drive\/folders\//i.test(url)) return 'pasta'

  return 'arquivo'
}

function validarLink(valor) {
  try {
    const url = new URL(valor.trim())
    const dominioValido =
      url.hostname === 'drive.google.com' ||
      url.hostname === 'docs.google.com'

    return url.protocol === 'https:' && dominioValido
  } catch {
    return false
  }
}

function extrairId(valor) {
  try {
    const url = new URL(valor)
    const caminhos = [
      /\/document\/d\/([^/]+)/,
      /\/spreadsheets\/d\/([^/]+)/,
      /\/presentation\/d\/([^/]+)/,
      /\/file\/d\/([^/]+)/,
      /\/drive\/folders\/([^/]+)/
    ]

    for (const padrao of caminhos) {
      const resultado = url.pathname.match(padrao)
      if (resultado) return resultado[1]
    }

    return url.searchParams.get('id') || ''
  } catch {
    return ''
  }
}

function criarDocumento(nome, url) {
  return {
    id: crypto.randomUUID(),
    titulo: nome.trim(),
    url: url.trim(),
    tipo: identificarTipo(url),
    origem: 'manual',
    criadoEm: new Date().toISOString()
  }
}

onMounted(() => {
  try {
    const salvos = JSON.parse(
      localStorage.getItem(CHAVE_DOCUMENTOS) || '[]'
    )

    documentosLocais.value = Array.isArray(salvos)
      ? salvos.map(doc => ({
          ...doc,
          tipo: identificarTipo(doc.url),
          origem: 'manual'
        }))
      : []
  } catch {
    documentosLocais.value = []
  }
})

watch(
  documentosLocais,
  documentos => {
    localStorage.setItem(CHAVE_DOCUMENTOS, JSON.stringify(documentos))
  },
  { deep: true }
)

const documentos = computed(() => [
  ...documentosDrive.value,
  ...documentosLocais.value
])

const documentosFiltrados = computed(() => {
  const termo = pesquisa.value.trim().toLowerCase()

  return documentos.value.filter(doc => {
    const correspondePesquisa =
      doc.titulo.toLowerCase().includes(termo)

    const correspondeTipo =
      filtro.value === 'todos' || doc.tipo === filtro.value

    return correspondePesquisa && correspondeTipo
  })
})

const totalDrive = computed(() => documentosDrive.value.length)

function abrirNovoDocumento() {
  documentoEditando.value = null
  titulo.value = ''
  link.value = ''
  erro.value = ''
  modalAberto.value = true
}

function editarDocumento(doc) {
  if (doc.origem !== 'manual') return

  documentoEditando.value = doc
  titulo.value = doc.titulo
  link.value = doc.url
  erro.value = ''
  modalAberto.value = true
}

function salvarDocumento() {
  erro.value = ''

  if (!titulo.value.trim()) {
    erro.value = 'Informe o nome do documento.'
    return
  }

  if (!validarLink(link.value)) {
    erro.value = 'Informe um link HTTPS válido do Google Docs ou Drive.'
    return
  }

  const tipo = identificarTipo(link.value)

  if (tipo === 'arquivo' && !extrairId(link.value)) {
    erro.value = 'Não consegui identificar esse arquivo. Confira o link compartilhado.'
    return
  }

  if (documentoEditando.value) {
    documentosLocais.value = documentosLocais.value.map(doc =>
      doc.id === documentoEditando.value.id
        ? { ...doc, titulo: titulo.value.trim(), url: link.value.trim(),
            tipo, atualizadoEm: new Date().toISOString() }
        : doc
    )
    aviso.value = 'Documento atualizado.'
  } else {
    documentosLocais.value.unshift(
      criarDocumento(titulo.value, link.value)
    )
    aviso.value = 'Documento adicionado.'
  }

  modalAberto.value = false
}

function excluirDocumento(doc) {
  if (doc.origem !== 'manual') return

  if (!confirm(`Deseja remover "${doc.titulo}" da sua lista?`)) return

  documentosLocais.value = documentosLocais.value.filter(
    item => item.id !== doc.id
  )

  if (visualizando.value?.id === doc.id) {
    visualizando.value = null
  }

  aviso.value = 'Documento removido da lista.'
}

function urlVisualizacao(doc) {
  if (doc.tipo === 'pasta') return null

  const id = doc.googleId || extrairId(doc.url)
  if (!id) return null

  if (doc.tipo === 'documento') {
    return `https://docs.google.com/document/d/${id}/preview`
  }

  if (doc.tipo === 'planilha') {
    return `https://docs.google.com/spreadsheets/d/${id}/preview`
  }

  if (doc.tipo === 'apresentacao') {
    return `https://docs.google.com/presentation/d/${id}/embed`
  }

  return `https://drive.google.com/file/d/${id}/preview`
}

function abrirDocumento(doc) {
  const url = urlVisualizacao(doc)

  if (url) {
    visualizando.value = { ...doc, previewUrl: url }
  } else {
    window.open(doc.url || doc.webViewLink, '_blank', 'noopener,noreferrer')
  }
}

function abrirNoGoogle(doc) {
  const destino = doc.url || doc.webViewLink
  if (destino) {
    window.open(destino, '_blank', 'noopener,noreferrer')
  }
}

async function copiarLink(doc) {
  try {
    await navigator.clipboard.writeText(doc.url || doc.webViewLink)
    aviso.value = 'Link copiado!'
  } catch {
    aviso.value = 'Não foi possível copiar. Abra o documento para copiar o link.'
  }
}

function nomeTipo(tipo) {
  return tipos.find(item => item.id === tipo)?.nome || 'Arquivo'
}

function iconeTipo(tipo) {
  return {
    documento: 'document-text-outline',
    planilha: 'grid-outline',
    apresentacao: 'easel-outline',
    pasta: 'folder-outline',
    arquivo: 'document-outline'
  }[tipo] || 'document-outline'
}

function carregarScript(src) {
  return new Promise((resolve, reject) => {
    const existente = document.querySelector(`script[src="${src}"]`)

    if (existente?.dataset.loaded === 'true') {
      resolve()
      return
    }

    const script = existente || document.createElement('script')

    if (!existente) {
      script.src = src
      script.async = true
      document.head.appendChild(script)
    }

    script.addEventListener('load', () => {
      script.dataset.loaded = 'true'
      resolve()
    }, { once: true })

    script.addEventListener('error', reject, { once: true })

    if (existente && window.google?.accounts?.oauth2) {
      resolve()
    }
  })
}

async function conectarGoogle() {
  erro.value = ''
  aviso.value = ''

  if (!CLIENT_ID) {
    aviso.value = 'Configure VITE_GOOGLE_CLIENT_ID no arquivo .env.'
    return
  }

  carregando.value = true

  try {
    await carregarScript('https://accounts.google.com/gsi/client')

    if (!window.google?.accounts?.oauth2) {
      throw new Error('Não foi possível carregar a autenticação Google.')
    }

    if (!clienteOAuth) {
      clienteOAuth = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.metadata.readonly',
        callback: () => {}
      })
    }

    const token = await new Promise((resolve, reject) => {
      clienteOAuth.callback = resposta => {
        if (resposta.error) {
          reject(new Error(resposta.error))
          return
        }

        resolve(resposta.access_token)
      }

      clienteOAuth.requestAccessToken({ prompt: tokenGoogle ? '' : 'consent' })
    })

    tokenGoogle = token
    await carregarDocumentosDrive()
  } catch (e) {
    aviso.value = `Não foi possível conectar ao Google: ${e.message}`
  } finally {
    carregando.value = false
  }
}

async function carregarDocumentosDrive() {
  if (!tokenGoogle) return

  const params = new URLSearchParams({
    pageSize: '100',
    orderBy: 'modifiedTime desc',
    q: 'trashed = false',
    fields: 'files(id,name,mimeType,modifiedTime,webViewLink,iconLink,thumbnailLink)'
  })

  const resposta = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params}`,
    {
      headers: { Authorization: `Bearer ${tokenGoogle}` }
    }
  )

  if (!resposta.ok) {
    if (resposta.status === 401) tokenGoogle = null
    throw new Error('O Google Drive não conseguiu retornar os arquivos.')
  }

  const dados = await resposta.json()

  documentosDrive.value = (dados.files || []).map(arquivo => ({
    id: `drive-${arquivo.id}`,
    googleId: arquivo.id,
    titulo: arquivo.name,
    tipo: identificarTipo(arquivo),
    url: arquivo.webViewLink ||
      `https://drive.google.com/open?id=${encodeURIComponent(arquivo.id)}`,
    webViewLink: arquivo.webViewLink,
    mimeType: arquivo.mimeType,
    modificadoEm: arquivo.modifiedTime,
    thumbnailLink: arquivo.thumbnailLink,
    origem: 'drive'
  }))

  aviso.value = `${documentosDrive.value.length} arquivo(s) carregado(s) do Google Drive.`
}
</script>

<template>
  <main class="documentos-pagina">
    <header class="documentos-cabecalho">
      <div>
        <span class="sobretitulo">ESPAÇO DE TRABALHO</span>
        <h1>Meus documentos</h1>
        <p>Organize seus arquivos e materiais de estudo em um só lugar.</p>
      </div>

      <div class="acoes-cabecalho">
        <button
          class="botao-secundario"
          :disabled="carregando"
          @click="conectarGoogle"
        >
          <ion-icon name="logo-google" />
          {{ carregando ? 'Conectando...' : 'Conectar Drive' }}
        </button>

        <button class="botao-principal" @click="abrirNovoDocumento">
          <ion-icon name="add-outline" />
          Adicionar link
        </button>
      </div>
    </header>

    <section class="resumo-documentos">
      <div class="resumo-card">
        <ion-icon name="documents-outline" />
        <div>
          <strong>{{ documentos.length }}</strong>
          <span>Documentos na lista</span>
        </div>
      </div>

      <div class="resumo-card">
        <ion-icon name="cloud-outline" />
        <div>
          <strong>{{ totalDrive }}</strong>
          <span>Arquivos do Drive</span>
        </div>
      </div>
    </section>

    <section class="documentos-ferramentas">
      <label class="campo-pesquisa">
        <ion-icon name="search-outline" />
        <input
          v-model="pesquisa"
          type="search"
          placeholder="Pesquisar documentos..."
        />
        <button
          v-if="pesquisa"
          class="limpar-pesquisa"
          aria-label="Limpar pesquisa"
          @click="pesquisa = ''"
        >
          <ion-icon name="close-outline" />
        </button>
      </label>

      <div class="alternar-visualizacao" aria-label="Visualização">
        <button
          :class="{ ativo: visualizacao === 'lista' }"
          aria-label="Visualizar em lista"
          @click="visualizacao = 'lista'"
        >
          <ion-icon name="list-outline" />
        </button>
        <button
          :class="{ ativo: visualizacao === 'grade' }"
          aria-label="Visualizar em grade"
          @click="visualizacao = 'grade'"
        >
          <ion-icon name="grid-outline" />
        </button>
      </div>
    </section>

    <nav class="filtros-documentos">
      <button
        v-for="tipo in tipos"
        :key="tipo.id"
        :class="{ ativo: filtro === tipo.id }"
        @click="filtro = tipo.id"
      >
        {{ tipo.nome }}
      </button>
    </nav>

    <div v-if="aviso" class="aviso-documentos" role="status">
      <span>{{ aviso }}</span>
      <button aria-label="Fechar aviso" @click="aviso = ''">
        <ion-icon name="close-outline" />
      </button>
    </div>

    <section
      v-if="documentosFiltrados.length"
      class="lista-documentos"
      :class="`modo-${visualizacao}`"
    >
      <article
        v-for="doc in documentosFiltrados"
        :key="doc.id"
        class="documento-card"
      >
        <button
          class="icone-documento"
          :class="`tipo-${doc.tipo}`"
          :aria-label="`Abrir ${doc.titulo}`"
          @click="abrirDocumento(doc)"
        >
          <ion-icon :name="iconeTipo(doc.tipo)" />
        </button>

        <div class="documento-info">
          <h2 :title="doc.titulo">{{ doc.titulo }}</h2>
          <p>{{ nomeTipo(doc.tipo) }}</p>
          <span class="origem-documento">
            <ion-icon
              :name="doc.origem === 'drive' ? 'cloud-outline' : 'link-outline'"
            />
            {{ doc.origem === 'drive' ? 'Google Drive' : 'Link salvo' }}
          </span>
        </div>

        <div class="acoes-documento">
          <button title="Visualizar" aria-label="Visualizar" @click="abrirDocumento(doc)">
            <ion-icon name="eye-outline" />
          </button>
          <button title="Abrir no Google" aria-label="Abrir no Google" @click="abrirNoGoogle(doc)">
            <ion-icon name="open-outline" />
          </button>
          <button title="Copiar link" aria-label="Copiar link" @click="copiarLink(doc)">
            <ion-icon name="copy-outline" />
          </button>
          <button
            v-if="doc.origem === 'manual'"
            title="Editar"
            aria-label="Editar"
            @click="editarDocumento(doc)"
          >
            <ion-icon name="create-outline" />
          </button>
          <button
            v-if="doc.origem === 'manual'"
            class="acao-excluir"
            title="Excluir da lista"
            aria-label="Excluir da lista"
            @click="excluirDocumento(doc)"
          >
            <ion-icon name="trash-outline" />
          </button>
        </div>
      </article>
    </section>

    <section v-else class="estado-vazio">
      <div class="estado-vazio-icone">
        <ion-icon name="folder-open-outline" />
      </div>
      <h2>
        {{ pesquisa ? 'Nenhum documento encontrado' : 'Sua lista está vazia' }}
      </h2>
      <p>
        {{
          pesquisa
            ? 'Tente pesquisar por outro nome ou alterar o filtro.'
            : 'Adicione um link do Google Docs ou conecte sua conta do Drive.'
        }}
      </p>
      <button
        v-if="!pesquisa"
        class="botao-principal"
        @click="abrirNovoDocumento"
      >
        <ion-icon name="add-outline" />
        Adicionar primeiro documento
      </button>
    </section>

    <!-- Modal para adicionar e editar -->
    <div
      v-if="modalAberto"
      class="modal-fundo"
      @click.self="modalAberto = false"
      @keydown.esc="modalAberto = false"
    >
      <section
        class="modal-documento"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal"
      >
        <header class="modal-cabecalho">
          <div>
            <span class="sobretitulo">BIBLIOTECA</span>
            <h2 id="titulo-modal">
              {{ documentoEditando ? 'Editar documento' : 'Novo documento' }}
            </h2>
          </div>
          <button class="fechar-modal" @click="modalAberto = false">
            <ion-icon name="close-outline" />
          </button>
        </header>

        <form class="formulario-documento" @submit.prevent="salvarDocumento">
          <label>
            Nome do documento
            <input
              v-model="titulo"
              type="text"
              maxlength="150"
              placeholder="Ex.: Resumo de Matemática"
              required
            />
          </label>

          <label>
            Link do Google Docs ou Drive
            <input
              v-model="link"
              type="url"
              placeholder="https://docs.google.com/..."
              required
            />
          </label>

          <p class="ajuda-formulario">
            O link precisa começar com HTTPS. Para abrir ou visualizar o arquivo,
            tua conta também precisa ter permissão de acesso.
          </p>

          <p v-if="erro" class="erro-formulario" role="alert">{{ erro }}</p>

          <footer class="modal-acoes">
            <button
              type="button"
              class="botao-secundario"
              @click="modalAberto = false"
            >
              Cancelar
            </button>
            <button type="submit" class="botao-principal">
              {{ documentoEditando ? 'Salvar alterações' : 'Adicionar documento' }}
            </button>
          </footer>
        </form>
      </section>
    </div>

    <!-- Visualizador -->
    <div
      v-if="visualizando"
      class="modal-fundo modal-fundo-visualizador"
      @click.self="visualizando = null"
    >
      <section class="modal-visualizador" role="dialog" aria-modal="true">
        <header class="visualizador-cabecalho">
          <div>
            <ion-icon :name="iconeTipo(visualizando.tipo)" />
            <h2>{{ visualizando.titulo }}</h2>
          </div>
          <div class="acoes-visualizador">
            <button class="botao-secundario" @click="abrirNoGoogle(visualizando)">
              <ion-icon name="open-outline" />
              Abrir no Google
            </button>
            <button class="fechar-modal" aria-label="Fechar visualizador" @click="visualizando = null">
              <ion-icon name="close-outline" />
            </button>
          </div>
        </header>

        <iframe
          v-if="visualizando.previewUrl"
          class="documento-iframe"
          :src="visualizando.previewUrl"
          :title="`Prévia de ${visualizando.titulo}`"
          allow="autoplay"
        />

        <div v-else class="estado-vazio">
          <p>Este tipo de arquivo não possui prévia incorporada.</p>
          <button class="botao-principal" @click="abrirNoGoogle(visualizando)">
            Abrir no Google Drive
          </button>
        </div>
      </section>
    </div>
  </main>
</template>


<style scoped>
/* =========================================
   CONFIGURAÇÕES GERAIS
========================================= */

.documentos-pagina {
  --cor-destaque: var(--cor-primaria, #a855f7);
  --cor-destaque-hover: var(--cor-primaria-hover, #9146df);
  --fundo-card: var(--cor-superficie, #222222);
  --texto: var(--cor-texto, #f5f5f5);
  --texto-secundario: var(--cor-texto-suave, #a3a3a3);
  --borda: var(--cor-borda, #3a3a3a);

  width: 100%;
  max-width: 1440px;
  min-width: 0;
  min-height: 100%;
  margin: 0 auto;
  padding: clamp(14px, 3vw, 32px);
  box-sizing: border-box;

  color: var(--texto);
  animation: entrada 0.35s ease both;
}

.documentos-pagina *,
.documentos-pagina *::before,
.documentos-pagina *::after {
  box-sizing: border-box;
}

@keyframes entrada {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* =========================================
   CABEÇALHO
========================================= */

.documentos-cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 24px;
}

.documentos-cabecalho > div:first-child {
  flex: 1 1 280px;
  min-width: 0;
}

.sobretitulo {
  color: var(--cor-destaque);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.7px;
}

.documentos-cabecalho h1 {
  margin: 7px 0;
  color: var(--texto);
  font-size: clamp(23px, 3vw, 34px);
  font-weight: 750;
  letter-spacing: -0.8px;
  overflow-wrap: anywhere;
}

.documentos-cabecalho p,
.documento-info p {
  margin: 0;
  color: var(--texto-secundario);
  font-size: 13px;
  line-height: 1.6;
}

.acoes-cabecalho,
.modal-acoes,
.acoes-visualizador {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.acoes-cabecalho {
  justify-content: flex-end;
}

/* =========================================
   BOTÕES PRINCIPAIS
========================================= */

.botao-principal,
.botao-secundario {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  min-height: 40px;
  padding: 9px 14px;

  border-radius: 9px;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  text-align: center;

  cursor: pointer;

  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.botao-principal ion-icon,
.botao-secundario ion-icon {
  flex-shrink: 0;
  font-size: 17px;
}

.botao-principal {
  color: #fff;
  background: var(--cor-destaque);
  border: 1px solid var(--cor-destaque);
}

.botao-principal:hover {
  background: var(--cor-destaque-hover);
  border-color: var(--cor-destaque-hover);
  transform: translateY(-1px);
}

.botao-secundario {
  color: var(--texto);
  background: var(--fundo-card);
  border: 1px solid var(--borda);
}

.botao-secundario:hover {
  color: var(--cor-destaque);
  border-color: var(--cor-destaque);
}

button:disabled {
  opacity: 0.6;
  cursor: wait;
}

/* =========================================
   CARDS DE RESUMO
========================================= */

.resumo-documentos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 22px;
}

.resumo-card {
  display: flex;
  align-items: center;
  gap: 13px;

  min-width: 0;
  min-height: 80px;
  padding: 15px;

  background: var(--fundo-card);
  border: 1px solid var(--borda);
  border-radius: 12px;

  transition: border-color 0.2s ease;
}

.resumo-card:hover {
  border-color: var(--cor-destaque);
}

.resumo-card > ion-icon {
  flex-shrink: 0;
  font-size: 24px;
  color: var(--cor-destaque);
}

.resumo-card div {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.resumo-card strong {
  color: var(--texto);
  font-size: clamp(18px, 2vw, 23px);
}

.resumo-card span {
  color: var(--texto-secundario);
  font-size: 11px;
  line-height: 1.5;
}

/* =========================================
   PESQUISA E VISUALIZAÇÃO
========================================= */

.documentos-ferramentas {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.campo-pesquisa {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 8px;

  width: 100%;
  max-width: 480px;
  min-width: 0;
  height: 42px;
  padding: 0 12px;

  border: 1px solid var(--borda);
  border-radius: 9px;
  background: var(--fundo-card);

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.campo-pesquisa:focus-within {
  border-color: var(--cor-destaque);
  box-shadow: 0 0 0 3px #a855f720;
}

.campo-pesquisa > ion-icon {
  flex-shrink: 0;
  color: var(--cor-destaque);
  font-size: 18px;
}

.campo-pesquisa input {
  flex: 1;
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: 0;

  color: var(--texto);
  background: transparent;

  border: 0;
  outline: 0;
  box-shadow: none;
  -webkit-appearance: none;
  appearance: none;

  font: inherit;
  font-size: 13px;
}
.campo-pesquisa input::-webkit-search-cancel-button,
.campo-pesquisa input::-webkit-search-decoration {
  -webkit-appearance: none;
  appearance: none;
}

.campo-pesquisa input::placeholder,
.formulario-documento input::placeholder {
  color: var(--texto-secundario);
  opacity: 0.8;
}

.limpar-pesquisa,
.alternar-visualizacao button,
.acoes-documento button,
.fechar-modal {
  display: grid;
  place-items: center;

  border: 0;
  cursor: pointer;
}

.limpar-pesquisa {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  font-size: 17px;
}

.limpar-pesquisa:hover {
  color: var(--cor-destaque);
  background: #a855f714;
}

.alternar-visualizacao {
  display: flex;
  flex-shrink: 0;
  padding: 3px;

  background: var(--fundo-card);
  border: 1px solid var(--borda);
  border-radius: 9px;
  
}

.alternar-visualizacao button {
  width: 45px;
  height: 45px;
  border-radius: 6px;
  font-size: 18px;
  
}

.alternar-visualizacao button:hover {
  color: var(--cor-destaque);
}

.alternar-visualizacao button.ativo {
  color: var(--cor-destaque);
  background: #a855f720;
}

/* =========================================
   FILTROS
========================================= */

.filtros-documentos {
  display: flex;
  gap: 7px;
  width: 100%;
  min-width: 0;

  overflow-x: auto;
  padding: 16px 0;

  scrollbar-width: thin;
  scrollbar-color: var(--cor-destaque) transparent;
  -webkit-overflow-scrolling: touch;
}

.filtros-documentos button {
  flex-shrink: 0;
  padding: 9px 12px;

  color: var(--texto-secundario);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;

  font: inherit;
  font-size: 11px;
  white-space: nowrap;
  cursor: pointer;

  transition: 0.2s ease;
}

.filtros-documentos button:hover {
  color: var(--cor-destaque);
  background: #a855f710;
}

.filtros-documentos button.ativo {
  color: var(--cor-destaque);
  background: #a855f714;
  border-color: var(--cor-destaque);
}

/* =========================================
   AVISOS
========================================= */

.aviso-documentos {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  min-width: 0;
  margin-bottom: 14px;
  padding: 12px;

  color: var(--texto);
  background: var(--fundo-card);
  border: 1px solid var(--borda);
  border-left: 3px solid var(--cor-destaque);
  border-radius: 9px;

  font-size: 12px;
  overflow-wrap: anywhere;
}

.aviso-documentos button {
  flex-shrink: 0;
  color: var(--texto-secundario);
  background: transparent;
  border: 0;
  font-size: 18px;
  cursor: pointer;
}

/* =========================================
   LISTA DE DOCUMENTOS
========================================= */

.lista-documentos {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  min-width: 0;
}

.documento-card {
  display: flex;
  align-items: center;
  gap: 13px;

  width: 100%;
  min-width: 0;
  padding: 13px 15px;

  background: var(--fundo-card);
  border: 1px solid var(--borda);
  border-radius: 11px;

  transition:
    border-color 0.2s ease,
    transform 0.2s ease;
}

.documento-card:hover {
  border-color: var(--cor-destaque);
  transform: translateY(-1px);
}

.icone-documento {
  display: grid;
  place-items: center;
  flex-shrink: 0;

  width: 44px;
  height: 44px;

  border: 0;
  border-radius: 10px;
  font-size: 22px;
  cursor: pointer;
}

.tipo-documento {
  color: #a855f7;
  background: #a855f720;
}

.tipo-planilha {
  color: #62cf91;
  background: #62cf9118;
}

.tipo-apresentacao {
  color: #c084fc;
  background: #c084fc20;
}

.tipo-pasta {
  color: #d8b4fe;
  background: #d8b4fe20;
}

.tipo-arquivo {
  color: #c4b5fd;
  background: #c4b5fd20;
}

.documento-info {
  flex: 1;
  min-width: 0;
}

.documento-info h2 {
  overflow: hidden;
  margin: 0 0 5px;

  color: var(--texto);
  font-size: 13px;
  font-weight: 650;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.documento-info p {
  margin-bottom: 5px;
  font-size: 11px;
}

.origem-documento {
  display: inline-flex;
  align-items: center;
  gap: 5px;

  color: var(--texto-secundario);
  font-size: 10px;
}

/* =========================================
   AÇÕES DOS DOCUMENTOS
========================================= */

.acoes-documento {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  gap: 4px;
}

.acoes-documento button {
  flex-shrink: 0;
  width: 35px;
  height: 35px;
  border-radius: 7px;
  font-size: 17px;

  transition:
    color 0.2s ease,
    background 0.2s ease;
}

.acoes-documento button:hover {
  color: var(--cor-destaque);
  background: #a855f720;
}

.acoes-documento button.acao-excluir:hover {
  color: #ff7373;
  background: #ff444415;
}

/* =========================================
   VISUALIZAÇÃO EM GRADE
========================================= */

.modo-grade {
  grid-template-columns:
    repeat(auto-fill, minmax(min(100%, 245px), 1fr));

  align-items: stretch;
}

.modo-grade .documento-card {
  display: flex;
  align-items: flex-start;
  align-content: flex-start;
  flex-wrap: wrap;

  min-height: 165px;
  padding: 16px;
}

.modo-grade .documento-info {
  flex: 1 1 calc(100% - 65px);
  padding-top: 3px;
}

.modo-grade .documento-info h2 {
  white-space: normal;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.modo-grade .acoes-documento {
  width: 100%;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--borda);
}

/* =========================================
   ESTADO VAZIO
========================================= */

.estado-vazio {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;

  min-height: 260px;
  padding: 28px 18px;

  text-align: center;
  border: 1px dashed var(--borda);
  border-radius: 13px;
}

.estado-vazio-icone {
  display: grid;
  place-items: center;

  width: 60px;
  height: 60px;

  color: var(--cor-destaque);
  background: #a855f720;
  border: 1px solid #a855f735;
  border-radius: 16px;
  font-size: 28px;
}

.estado-vazio h2 {
  margin: 0;
  color: var(--texto);
  font-size: 17px;
}

.estado-vazio p {
  max-width: 430px;
  margin: 0 0 5px;
  color: var(--texto-secundario);
  font-size: 12px;
  line-height: 1.7;
}

/* =========================================
   MODAIS
========================================= */

.modal-fundo {
  position: fixed;
  inset: 0;
  z-index: 2000;

  display: grid;
  place-items: center;

  padding: 18px;
  background: #000b;
  backdrop-filter: blur(5px);
}

.modal-documento,
.modal-visualizador {
  width: min(100%, 500px);
  max-height: calc(100dvh - 36px);

  overflow: auto;
  overscroll-behavior: contain;

  color: var(--texto);
  background: var(--cor-superficie, #222222);
  border: 1px solid var(--borda);
  border-radius: 15px;
  box-shadow: 0 20px 80px #0006;
}

.modal-cabecalho,
.visualizador-cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;

  padding: 17px 19px;
  border-bottom: 1px solid var(--borda);
}

.modal-cabecalho h2 {
  margin: 5px 0 0;
  color: var(--texto);
  font-size: 19px;
}

.fechar-modal {
  flex-shrink: 0;
  width: 35px;
  height: 35px;
  border-radius: 8px;
  font-size: 20px;

}

.fechar-modal:hover {
  color: var(--cor-destaque);
  border-color: var(--cor-destaque);
  
}

/* =========================================
   FORMULÁRIO
========================================= */

.formulario-documento {
  display: grid;
  gap: 15px;
  padding: 19px;
}

.formulario-documento label {
  display: grid;
  gap: 7px;
  min-width: 0;

  color: var(--texto);
  font-size: 12px;
  font-weight: 650;
}

.formulario-documento input {
  display: block;
  width: 100%;
  min-width: 0;
  height: 42px;
  padding: 0 11px;

  color: var(--texto);
  background: var(--cor-superficie, #222222);
  border: 1px solid var(--borda);
  border-radius: 8px;
  outline: none;

  font: inherit;
  font-size: 13px;

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.formulario-documento input:focus {
  border-color: var(--cor-destaque);
  box-shadow: 0 0 0 3px #a855f720;
}

.ajuda-formulario {
  margin: -3px 0 0;
  color: var(--texto-secundario);
  font-size: 11px;
  line-height: 1.7;
}

.erro-formulario {
  margin: 0;
  color: #ff7373;
  font-size: 12px;
}

.modal-acoes {
  justify-content: flex-end;
  padding-top: 13px;
  border-top: 1px solid var(--borda);
}

/* =========================================
   VISUALIZADOR
========================================= */

.modal-fundo-visualizador {
  padding: 3vh 3vw;
}

.modal-visualizador {
  display: flex;
  flex-direction: column;

  width: min(100%, 1200px);
  height: 94dvh;
  max-height: 94dvh;

  overflow: hidden;
}

.visualizador-cabecalho {
  flex-shrink: 0;
}

.visualizador-cabecalho > div:first-child {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.visualizador-cabecalho > div:first-child ion-icon {
  flex-shrink: 0;
  color: var(--cor-destaque);
  font-size: 22px;
}

.visualizador-cabecalho h2 {
  min-width: 0;
  overflow: hidden;
  margin: 0;

  color: var(--texto);
  font-size: 14px;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.acoes-visualizador {
  flex-shrink: 0;
}

.documento-iframe {
  flex: 1;
  width: 100%;
  min-height: 0;
  background: #fff;
  border: 0;
}

.modal-visualizador > .estado-vazio {
  flex: 1;
  border: 0;
}

/* =========================================
   TABLETS
========================================= */

@media (max-width: 900px) {
  .documentos-cabecalho {
    align-items: flex-start;
  }

  .acoes-cabecalho {
    justify-content: flex-start;
  }

  .documento-card {
    flex-wrap: wrap;
  }

  .documento-info {
    flex: 1 1 calc(100% - 65px);
  }

  .acoes-documento {
    width: 100%;
    padding-top: 9px;
    border-top: 1px solid var(--borda);
  }

  .modo-grade .documento-card {
    flex-wrap: wrap;
  }
}

/* =========================================
   CELULARES
========================================= */

@media (max-width: 600px) {
  .documentos-pagina {
    padding: 16px 12px 28px;
  }

  .documentos-cabecalho {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
    margin-bottom: 18px;
  }

  .documentos-cabecalho > div:first-child {
    flex-basis: auto;
  }

  .documentos-cabecalho h1 {
    font-size: 25px;
  }

  .documentos-cabecalho p {
    font-size: 12px;
  }

  .acoes-cabecalho {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
    gap: 8px;
  }

  .acoes-cabecalho button {
    width: 100%;
    min-width: 0;
    padding: 10px 8px;
    font-size: 11px;
  }

  .resumo-documentos {
    gap: 9px;
    margin-bottom: 18px;
  }

  .resumo-card {
    align-items: flex-start;
    flex-direction: column;
    gap: 9px;
    min-height: 100px;
    padding: 12px;
  }

  .resumo-card > ion-icon {
    font-size: 21px;
  }

  .resumo-card strong {
    font-size: 19px;
  }

  .resumo-card span {
    font-size: 10px;
  }

  .documentos-ferramentas {
    gap: 8px;
  }

  .campo-pesquisa {
    max-width: none;
    height: 42px;
    padding: 0 9px;
  }

  .campo-pesquisa input {
    font-size: 16px;
  }

  .alternar-visualizacao button {
    width: 34px;
    height: 34px;
  }

  .filtros-documentos {
    gap: 5px;
    padding: 13px 0;
  }

  .filtros-documentos button {
    padding: 8px 10px;
  }

  .documento-card {
    gap: 10px;
    padding: 12px;
  }

  .icone-documento {
    width: 42px;
    height: 42px;
  }

  .documento-info {
    flex-basis: calc(100% - 55px);
  }

  .documento-info h2 {
    font-size: 13px;
  }

  .acoes-documento {
    justify-content: space-between;
    gap: 4px;
  }

  .acoes-documento button {
    flex: 1;
    width: auto;
    min-width: 35px;
    max-width: 52px;
    height: 40px;
    font-size: 18px;
  }

  .modo-grade {
    grid-template-columns:
      repeat(auto-fill, minmax(min(100%, 200px), 1fr));
  }

  .modo-grade .documento-card {
    min-height: 155px;
  }

  .modal-fundo {
    padding: 10px;
  }

  .modal-documento {
    width: 100%;
    max-height: calc(100dvh - 20px);
  }

  .modal-cabecalho {
    padding: 14px;
  }

  .formulario-documento {
    gap: 13px;
    padding: 15px;
  }

  .formulario-documento input {
    height: 44px;
    font-size: 16px;
  }

  .modal-fundo-visualizador {
    padding: 8px;
  }

  .modal-visualizador {
    width: 100%;
    height: calc(100dvh - 16px);
    max-height: calc(100dvh - 16px);
    border-radius: 12px;
  }

  .visualizador-cabecalho {
    gap: 8px;
    padding: 11px;
  }

  .visualizador-cabecalho h2 {
    font-size: 12px;
  }

  .acoes-visualizador {
    gap: 5px;
  }

  .acoes-visualizador .botao-secundario {
    min-height: 34px;
    padding: 7px;
    font-size: 10px;
  }
}

/* =========================================
   CELULARES PEQUENOS
========================================= */

@media (max-width: 380px) {
  .documentos-pagina {
    padding: 13px 9px 24px;
  }

  .acoes-cabecalho {
    grid-template-columns: 1fr;
  }

  .acoes-cabecalho button {
    min-height: 42px;
  }

  .resumo-card {
    padding: 10px;
  }

  .resumo-card span {
    overflow-wrap: anywhere;
  }

  .modo-grade {
    grid-template-columns: 1fr;
  }

  .modal-acoes {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .modal-acoes button {
    width: 100%;
  }

  .visualizador-cabecalho {
    flex-wrap: wrap;
  }

  .acoes-visualizador {
    width: 100%;
    justify-content: space-between;
  }
}

/* =========================================
   ACESSIBILIDADE
========================================= */

.documentos-pagina .campo-pesquisa input:focus-visible {
  outline: none;
}

@media (prefers-reduced-motion: reduce) {
  .documentos-pagina {
    animation: none;
  }

  .documentos-pagina *,
  .documentos-pagina *::before,
  .documentos-pagina *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
</style>

