
<template>
  <main class="workspace">
    <div class="dashboard">

      <!-- CABEÇALHO -->
      <header class="header">
        <div class="brand">
          <div class="brand-icon">
            <span>✦</span>
          </div>

          <div class="brand-info">
            <div class="brand-title">
              <select
                v-if="projetos.length"
                v-model="projetoId"
                class="project-select"
              >
                <option
                  v-for="projeto in projetos"
                  :key="projeto.id"
                  :value="projeto.id"
                >
                  {{ projeto.nome }}
                </option>
              </select>

              <h1 v-else>Nexos Workspace</h1>
            </div>

            <div class="brand-subtitle">
              <span class="online-dot"></span>
              Espaço de trabalho
              <span class="separator">•</span>
              {{ totalTarefas }} tarefas
            </div>
          </div>
        </div>

        <div class="header-right">
          <div class="search">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="10.8" cy="10.8" r="6.5" stroke="currentColor" stroke-width="2"/>
              <path d="m16 16 4.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>

            <input
              v-model="busca"
              placeholder="Buscar tarefas..."
              type="search"
            />
            <kbd>⌘ K</kbd>
          </div>

          <button class="primary-button" @click="abrirModal()">
            <span class="plus">+</span>
            Nova tarefa
          </button>

          <div class="user-avatar">NX</div>
        </div>
      </header>

      <!-- NAVEGAÇÃO -->
      <nav class="navigation">
        <div class="nav-links">
          <button
            v-for="aba in abas"
            :key="aba"
            :class="{ selected: abaAtual === aba }"
            @click="abaAtual = aba"
          >
            {{ aba }}
          </button>
        </div>

        <button class="settings-button" @click="modalProjeto = true">
          ⚙ Gerenciar projetos
        </button>
      </nav>

      <!-- CONTEÚDO -->
      <div class="content">

        <div v-if="loading" class="empty-state">
          Carregando seu espaço de trabalho...
        </div>

        <div v-else-if="erro" class="empty-state">
          <h2>Não foi possível carregar os projetos</h2>
          <p>{{ erro }}</p>
          <button class="primary-button" @click="carregarProjetos">
            Tentar novamente
          </button>
        </div>

        <div v-else-if="!projetoAtual" class="empty-state">
          <div class="empty-icon">✦</div>
          <h2>Seu espaço começa aqui</h2>
          <p>Crie um projeto para organizar suas tarefas.</p>
          <button class="primary-button" @click="modalProjeto = true">
            + Criar primeiro projeto
          </button>
        </div>

        <template v-else>

          <!-- RESUMO -->
          <section class="overview">
            <div class="overview-text">
              <div class="eyebrow">VISÃO GERAL</div>
              <h2>Organize suas ideias. Faça acontecer.</h2>
              <p>
                Acompanhe o progresso do seu projeto e mantenha tudo em ordem.
              </p>
            </div>

            <div class="overview-stats">
              <div class="stat">
                <span class="stat-label">Total de tarefas</span>
                <strong>{{ totalTarefas }}</strong>
                <span class="stat-bottom">No projeto</span>
              </div>

              <div class="stat">
                <span class="stat-label">Em andamento</span>
                <strong class="blue-text">{{ contar('andamento') }}</strong>
                <span class="stat-bottom">Em desenvolvimento</span>
              </div>

              <div class="stat">
                <span class="stat-label">Concluídas</span>
                <strong class="green-text">{{ contar('concluido') }}</strong>
                <span class="stat-bottom">{{ progresso }}% finalizado</span>
              </div>
            </div>
          </section>

          <!-- PROGRESSO -->
          <div class="progress-section">
            <div class="progress-label">
              <span>Progresso geral do projeto</span>
              <strong>{{ progresso }}%</strong>
            </div>

            <div class="progress-track">
              <div
                class="progress-fill"
                :style="{ width: progresso + '%' }"
              ></div>
            </div>
          </div>

          <!-- KANBAN -->
          <section v-if="abaAtual === 'Kanban'" class="kanban">
            <div
              v-for="coluna in colunas"
              :key="coluna.id"
              class="column"
              :class="coluna.id"
              @dragover.prevent
              @drop="soltar($event, coluna.id)"
            >
              <div class="column-header">
                <div class="column-name">
                  <span class="column-dot"></span>
                  <h3>{{ coluna.nome }}</h3>
                  <span class="count">{{ contar(coluna.id) }}</span>
                </div>

                <button
                  class="column-add"
                  title="Adicionar tarefa"
                  @click="abrirModal(null, coluna.id)"
                >
                  +
                </button>
              </div>

              <div class="column-body">
                <article
                  v-for="tarefa in tarefasFiltradas(coluna.id)"
                  :key="tarefa.id"
                  class="task-card"
                  draggable="true"
                  @dragstart="arrastar($event, tarefa.id)"
                  @click="abrirModal(tarefa)"
                >
                  <div class="task-top">
                    <span class="task-type">TAREFA</span>
                    <button class="more">···</button>
                  </div>

                  <h4>{{ tarefa.titulo }}</h4>

                  <p v-if="tarefa.descricao" class="task-description">
                    {{ tarefa.descricao }}
                  </p>

                  <div class="tags">
                    <span
                      v-for="tag in tarefa.tags"
                      :key="tag"
                      class="tag"
                      :class="classeTag(tag)"
                    >
                      {{ tag }}
                    </span>
                  </div>

                  <div class="task-divider"></div>

                  <footer class="task-footer">
                    <div class="task-date">
                      <span>▢</span>
                      {{ formatarData(tarefa.data) }}
                    </div>

                    <div
                      class="member-avatar"
                      :title="tarefa.responsavel"
                    >
                      {{ iniciais(tarefa.responsavel) }}
                    </div>
                  </footer>
                </article>

                <button
                  class="quick-add"
                  @click="abrirModal(null, coluna.id)"
                >
                  <span>+</span>
                  Adicionar tarefa
                </button>
              </div>
            </div>
          </section>

          <!-- NOTAS -->
          <section v-else-if="abaAtual === 'Notas'" class="panel">
            <h2>Notas do projeto</h2>
            <p>Organize informações e ideias importantes.</p>
            <textarea
              v-model="notas"
              placeholder="Comece a escrever..."
              rows="12"
            ></textarea>
            <small>As notas desta demonstração não são persistidas.</small>
          </section>

          <!-- DOCUMENTOS -->
          <section v-else-if="abaAtual === 'Documentos'" class="panel">
            <h2>Documentos</h2>
            <p>Área reservada para os arquivos do projeto.</p>
            <div class="document-empty">
              <span>▤</span>
              <h3>Seus documentos aparecerão aqui</h3>
              <p>A integração de arquivos será adicionada posteriormente.</p>
            </div>
          </section>

          <!-- CONFIGURAÇÕES -->
          <section v-else class="panel">
            <h2>Configurações</h2>
            <p>Informações do espaço de trabalho.</p>

            <div class="project-details">
              <strong>{{ projetoAtual.nome }}</strong>
              <p>{{ projetoAtual.descricao || 'Sem descrição.' }}</p>
              <button
                class="primary-button"
                @click="editarProjeto(projetoAtual)"
              >
                Editar projeto
              </button>
            </div>
          </section>

        </template>
      </div>
    </div>

    <!-- MODAL DE TAREFAS -->
    <div
      v-if="modalAberto"
      class="modal-backdrop"
      @click.self="modalAberto = false"
    >
      <section class="modal">
        <div class="modal-heading">
          <div>
            <span class="eyebrow">GERENCIAMENTO</span>
            <h2>{{ form.id ? 'Editar tarefa' : 'Criar nova tarefa' }}</h2>
          </div>

          <button class="close" @click="modalAberto = false">✕</button>
        </div>

        <form @submit.prevent="salvarTarefa">
          <label>Título da tarefa</label>
          <input
            v-model.trim="form.titulo"
            placeholder="Ex: Desenvolver página inicial"
            required
            maxlength="150"
          />

          <label>Descrição</label>
          <textarea
            v-model="form.descricao"
            placeholder="Adicione mais detalhes..."
            rows="3"
          ></textarea>

          <div class="form-row">
            <div>
              <label>Status</label>
              <select v-model="form.status">
                <option value="afazer">A Fazer</option>
                <option value="andamento">Em Andamento</option>
                <option value="concluido">Concluída</option>
              </select>
            </div>

            <div>
              <label>Prazo</label>
              <input v-model="form.data" type="date" />
            </div>
          </div>

          <label>Responsável</label>
          <input v-model="form.responsavel" placeholder="Nome do responsável" />

          <label>Etiquetas</label>
          <input
            v-model="form.tagsTexto"
            placeholder="Design, Frontend, API..."
          />

          <div class="modal-footer">
            <button
              v-if="form.id"
              type="button"
              class="delete-button"
              @click="excluirTarefa"
            >
              Excluir
            </button>

            <div class="footer-right">
              <button
                type="button"
                class="cancel-button"
                @click="modalAberto = false"
              >
                Cancelar
              </button>

              <button type="submit" class="primary-button">
                Salvar tarefa
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>

    <!-- MODAL DE PROJETOS -->
    <div
      v-if="modalProjeto"
      class="modal-backdrop"
      @click.self="fecharModalProjeto"
    >
      <section class="modal">
        <div class="modal-heading">
          <div>
            <span class="eyebrow">WORKSPACE</span>
            <h2>Gerenciar projetos</h2>
          </div>

          <button class="close" @click="fecharModalProjeto">✕</button>
        </div>

        <div v-if="projetos.length" class="project-list">
          <div
            v-for="projeto in projetos"
            :key="projeto.id"
            class="project-list-item"
          >
            <span>{{ projeto.nome }}</span>

            <div>
              <button @click="editarProjeto(projeto)">Editar</button>
              <button
                class="delete-text"
                :disabled="excluindoId === projeto.id"
                @click="excluirProjeto(projeto)"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>

        <form @submit.prevent="salvarProjeto">
          <h3>{{ projetoForm.id !== null ? 'Editar projeto' : 'Novo projeto' }}</h3>

          <label>Nome do projeto</label>
          <input
            v-model.trim="projetoForm.nome"
            required
            maxlength="150"
            placeholder="Nome do projeto"
          />

          <label>Descrição</label>
          <textarea
            v-model.trim="projetoForm.descricao"
            rows="3"
            placeholder="Descrição do projeto"
          ></textarea>

          <p v-if="erroProjeto" class="form-error">{{ erroProjeto }}</p>

          <div class="modal-footer">
            <button
              v-if="projetoForm.id !== null"
              type="button"
              class="cancel-button"
              @click="limparProjetoForm"
            >
              Cancelar edição
            </button>

            <button
              type="submit"
              class="primary-button"
              :disabled="salvandoProjeto"
            >
              {{ salvandoProjeto ? 'Salvando...' : 'Salvar projeto' }}
            </button>
          </div>
        </form>
      </section>
    </div>

  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import apiClient from '@/api/config'

const projetos = ref([])
const projetoId = ref(null)

const loading = ref(true)
const erro = ref('')
const busca = ref('')

const abas = ['Kanban', 'Notas', 'Documentos', 'Configurações']
const abaAtual = ref('Kanban')

const colunas = [
  { id: 'afazer', nome: 'A Fazer' },
  { id: 'andamento', nome: 'Em Andamento' },
  { id: 'concluido', nome: 'Concluídas' },
]

const projetoAtual = computed(() =>
  projetos.value.find(p => p.id === projetoId.value) || null
)

// Tarefas demonstrativas, mantidas apenas na memória.
const tarefas = ref([])

const tarefasAtuais = computed(() =>
  tarefas.value.filter(t => t.projetoId === projetoId.value)
)

const totalTarefas = computed(() => tarefasAtuais.value.length)

const progresso = computed(() => {
  if (!totalTarefas.value) return 0

  return Math.round(
    contar('concluido') / totalTarefas.value * 100
  )
})

function contar(status) {
  return tarefasAtuais.value.filter(t => t.status === status).length
}

function tarefasFiltradas(status) {
  const termo = busca.value.toLowerCase().trim()

  return tarefasAtuais.value.filter(t =>
    t.status === status &&
    (
      t.titulo.toLowerCase().includes(termo) ||
      t.descricao.toLowerCase().includes(termo) ||
      t.tags.some(tag => tag.toLowerCase().includes(termo))
    )
  )
}

function iniciais(nome = '') {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('') || '?'
}

function formatarData(data) {
  if (!data) return 'Sem prazo'
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

function classeTag(tag) {
  const valor = tag.toLowerCase()

  if (['frontend', 'dev', 'vue'].includes(valor)) return 'tag-blue'
  if (['design', 'ui', 'ux'].includes(valor)) return 'tag-red'
  if (['backend', 'api'].includes(valor)) return 'tag-purple'
  if (['setup', 'qa', 'teste'].includes(valor)) return 'tag-orange'

  return 'tag-default'
}

// TAREFAS

const modalAberto = ref(false)

const form = ref({
  id: null,
  titulo: '',
  descricao: '',
  status: 'afazer',
  data: '',
  responsavel: '',
  tagsTexto: '',
})

function abrirModal(tarefa = null, status = 'afazer') {
  form.value = tarefa
    ? {
        ...tarefa,
        tagsTexto: tarefa.tags.join(', '),
      }
    : {
        id: null,
        titulo: '',
        descricao: '',
        status,
        data: '',
        responsavel: '',
        tagsTexto: '',
      }

  modalAberto.value = true
}

function salvarTarefa() {
  if (!projetoAtual.value || !form.value.titulo.trim()) return

  const dados = {
    id: form.value.id || crypto.randomUUID(),
    projetoId: projetoId.value,
    titulo: form.value.titulo.trim(),
    descricao: form.value.descricao.trim(),
    status: form.value.status,
    data: form.value.data,
    responsavel: form.value.responsavel.trim() || 'Sem responsável',
    tags: form.value.tagsTexto
      .split(',')
      .map(t => t.trim())
      .filter(Boolean),
  }

  const indice = tarefas.value.findIndex(t => t.id === dados.id)

  if (indice >= 0) {
    tarefas.value[indice] = dados
  } else {
    tarefas.value.push(dados)
  }

  modalAberto.value = false
}

function excluirTarefa() {
  if (!window.confirm('Excluir esta tarefa?')) return

  tarefas.value = tarefas.value.filter(t => t.id !== form.value.id)
  modalAberto.value = false
}

function arrastar(event, id) {
  event.dataTransfer.setData('text/plain', String(id))
  event.dataTransfer.effectAllowed = 'move'
}

function soltar(event, status) {
  const id = event.dataTransfer.getData('text/plain')
  const tarefa = tarefasAtuais.value.find(t => String(t.id) === id)

  if (tarefa) tarefa.status = status
}

// PROJETOS - API DJANGO

const modalProjeto = ref(false)
const salvandoProjeto = ref(false)
const excluindoId = ref(null)
const erroProjeto = ref('')
const notas = ref('')

const projetoForm = ref({
  id: null,
  nome: '',
  descricao: '',
})

function extrairLista(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.projetos)) return data.projetos
  return []
}

function mensagemErro(err, padrao) {
  const dados = err.response?.data

  if (typeof dados?.detail === 'string') return dados.detail
  if (typeof dados?.mensagem === 'string') return dados.mensagem

  if (dados && typeof dados === 'object') {
    const campo = Object.values(dados).find(
      valor => Array.isArray(valor) && valor.length
    )

    if (campo) return String(campo[0])
  }

  return err.message || padrao
}

async function carregarProjetos() {
  loading.value = true
  erro.value = ''

  try {
    const { data } = await apiClient.get('/projetos/')
    projetos.value = extrairLista(data)

    // Seleciona automaticamente o primeiro projeto.
    if (!projetos.value.some(p => p.id === projetoId.value)) {
      projetoId.value = projetos.value[0]?.id ?? null
    }
  } catch (err) {
    erro.value = mensagemErro(err, 'Erro ao carregar projetos.')
  } finally {
    loading.value = false
  }
}

function limparProjetoForm() {
  projetoForm.value = { id: null, nome: '', descricao: '' }
  erroProjeto.value = ''
}

function editarProjeto(projeto) {
  projetoForm.value = {
    id: projeto.id,
    nome: projeto.nome,
    descricao: projeto.descricao || '',
  }

  modalProjeto.value = true
}

function fecharModalProjeto() {
  if (salvandoProjeto.value) return
  modalProjeto.value = false
  limparProjetoForm()
}

async function salvarProjeto() {
  if (!projetoForm.value.nome.trim()) return

  salvandoProjeto.value = true
  erroProjeto.value = ''

  const payload = {
    nome: projetoForm.value.nome.trim(),
    descricao: projetoForm.value.descricao.trim(),
  }

  try {
    const resposta = projetoForm.value.id !== null
      ? await apiClient.patch(`/projetos/${projetoForm.value.id}/`, payload)
      : await apiClient.post('/projetos/', payload)

    const idSalvo = resposta.data?.id ?? projetoForm.value.id

    await carregarProjetos()

    if (idSalvo !== null && projetos.value.some(p => p.id === idSalvo)) {
      projetoId.value = idSalvo
    }

    limparProjetoForm()
    modalProjeto.value = false
  } catch (err) {
    erroProjeto.value = mensagemErro(err, 'Erro ao salvar projeto.')
  } finally {
    salvandoProjeto.value = false
  }
}

async function excluirProjeto(projeto) {
  if (!window.confirm(`Excluir o projeto "${projeto.nome}"?`)) return

  excluindoId.value = projeto.id
  erroProjeto.value = ''

  try {
    await apiClient.delete(`/projetos/${projeto.id}/`)

    tarefas.value = tarefas.value.filter(t => t.projetoId !== projeto.id)

    await carregarProjetos()
  } catch (err) {
    erroProjeto.value = mensagemErro(err, 'Erro ao excluir projeto.')
  } finally {
    excluindoId.value = null
  }
}

onMounted(carregarProjetos)
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.workspace {
  --navy: #102d51;
  --blue: #3579e8;
  --muted: #8798ae;
  --border: #e8edf5;

  min-height: 100vh;
  padding: 28px;
  background: #f5f7fb;
  color: #263c58;
  font-family: Inter, system-ui, sans-serif;
}

button, input, textarea, select {
  font: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.dashboard {
  max-width: 1500px;
  margin: auto;
  background: white;
  border: 1px solid #edf0f5;
  border-radius: 16px;
  box-shadow: 0 8px 35px #253d6010;
  overflow: hidden;
}

/* HEADER */

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 23px 28px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #dcfff0, #b5f3dc);
  display: grid;
  place-items: center;
  color: #10ad7b;
  font-size: 29px;
}

.brand-info h1 {
  font-size: 18px;
  margin: 0;
}

.project-select {
  border: 0;
  background: transparent;
  color: #183653;
  font-size: 19px;
  font-weight: 750;
  max-width: 260px;
  outline: none;
  cursor: pointer;
}

.brand-subtitle {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  color: var(--muted);
  font-size: 12px;
}

.online-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #1dc38c;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 13px;
}

.search {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 245px;
  padding: 0 12px;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #fbfcff;
  color: #9bacc1;
}

.search svg {
  width: 17px;
  height: 17px;
  flex-shrink: 0;
}

.search input {
  width: 100%;
  border: 0;
  background: transparent;
  outline: none;
  font-size: 12px;
  min-width: 0;
}

.search kbd {
  white-space: nowrap;
  font-size: 10px;
  color: #9faec1;
}

.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 0;
  border-radius: 8px;
  padding: 12px 17px;
  background: #10345f;
  color: white;
  font-size: 12px;
  font-weight: 650;
  transition: .2s;
}

.primary-button:hover {
  background: #24558d;
  transform: translateY(-1px);
}

.plus {
  font-size: 18px;
  line-height: 12px;
}

.user-avatar,
.member-avatar {
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #163a68;
  color: white;
  font-size: 10px;
  font-weight: 700;
}

.user-avatar {
  width: 35px;
  height: 35px;
}

/* NAVIGATION */

.navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 28px;
  border-bottom: 1px solid var(--border);
}

.nav-links {
  display: flex;
  gap: 27px;
  overflow-x: auto;
}

.nav-links button {
  padding: 18px 8px;
  border: 0;
  border-bottom: 3px solid transparent;
  background: none;
  color: #8ba0b9;
  font-size: 12px;
  font-weight: 650;
  white-space: nowrap;
}

.nav-links button.selected {
  color: #174a80;
  border-bottom-color: #174a80;
}

.settings-button {
  border: 0;
  background: transparent;
  color: #8ba0b9;
  font-size: 12px;
  white-space: nowrap;
}

/* CONTENT */

.content {
  padding: 28px;
  background: #fcfdff;
}

.overview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 25px;
  margin-bottom: 25px;
}

.eyebrow {
  display: block;
  color: #4388df;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
  margin-bottom: 9px;
}

.overview-text h2 {
  margin: 0;
  font-size: 21px;
  letter-spacing: -.5px;
}

.overview-text p {
  color: var(--muted);
  font-size: 12px;
  margin: 9px 0 0;
}

.overview-stats {
  display: flex;
  gap: 10px;
}

.stat {
  display: flex;
  flex-direction: column;
  min-width: 130px;
  padding: 16px 19px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: white;
}

.stat-label {
  font-size: 10px;
  color: var(--muted);
}

.stat strong {
  font-size: 26px;
  margin: 5px 0;
  color: #1e3858;
}

.stat .blue-text {
  color: #418af0;
}

.stat .green-text {
  color: #18b986;
}

.stat-bottom {
  font-size: 10px;
  color: #9aaac0;
}

.progress-section {
  margin-bottom: 28px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 9px;
  font-size: 11px;
  color: #7187a2;
}

.progress-label strong {
  color: #20b687;
}

.progress-track {
  width: 100%;
  height: 6px;
  border-radius: 20px;
  background: #eaf0f6;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #45cba1, #13ad80);
  border-radius: inherit;
  transition: width .3s;
}

/* KANBAN */

.kanban {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 17px;
  align-items: start;
}

.column {
  min-height: 480px;
  padding: 15px 12px;
  border-radius: 11px;
  background: #f2f5f9;
}

.column.andamento {
  background: #edf5ff;
}

.column.concluido {
  background: #ecf9f3;
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 8px 17px;
}

.column-name {
  display: flex;
  align-items: center;
  gap: 9px;
}

.column-name h3 {
  font-size: 13px;
  font-weight: 750;
  margin: 0;
}

.column-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #8b9eb5;
}

.andamento .column-dot {
  background: #4894f4;
}

.concluido .column-dot {
  background: #1bbd88;
}

.andamento .column-name h3 {
  color: #3789ec;
}

.concluido .column-name h3 {
  color: #15a778;
}

.count {
  display: grid;
  place-items: center;
  min-width: 21px;
  height: 21px;
  padding: 0 5px;
  border-radius: 6px;
  background: #e5ebf3;
  color: #71869f;
  font-size: 10px;
  font-weight: 750;
}

.andamento .count {
  background: #dbeaff;
  color: #438de9;
}

.concluido .count {
  background: #d7f3e5;
  color: #1cae7b;
}

.column-add {
  border: 0;
  background: transparent;
  font-size: 23px;
  color: #7894b2;
}

.column-body {
  display: flex;
  flex-direction: column;
  gap: 11px;
}

/* TASK CARDS */

.task-card {
  padding: 16px;
  border-radius: 9px;
  border: 1px solid #edf0f5;
  background: white;
  box-shadow: 0 3px 10px #23436509;
  cursor: grab;
  transition: transform .2s, box-shadow .2s;
}

.task-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 22px #23436517;
}

.task-card:active {
  cursor: grabbing;
}

.task-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-type {
  font-size: 9px;
  font-weight: 800;
  color: #a3b2c5;
  letter-spacing: 1px;
}

.more {
  border: 0;
  background: transparent;
  font-size: 20px;
  color: #9aacc2;
}

.task-card h4 {
  margin: 10px 0;
  color: #2b4564;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.task-description {
  margin: 0 0 13px;
  color: #8b9cb1;
  font-size: 11px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 15px;
}

.tag {
  padding: 5px 9px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 650;
}

.tag-blue {
  background: #e6f1ff;
  color: #3788ed;
}

.tag-red {
  background: #ffebe8;
  color: #e57970;
}

.tag-purple {
  background: #eee8ff;
  color: #8964c7;
}

.tag-orange {
  background: #fff0df;
  color: #d38b36;
}

.tag-default {
  background: #eaf0f6;
  color: #6f87a3;
}

.task-divider {
  height: 1px;
  background: #f0f3f7;
  margin: 15px 0 11px;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-date {
  display: flex;
  gap: 7px;
  color: #91a3b9;
  font-size: 10px;
}

.member-avatar {
  width: 25px;
  height: 25px;
}

.quick-add {
  width: 100%;
  padding: 12px;
  border: 1px dashed #d6e0ec;
  border-radius: 8px;
  background: transparent;
  color: #91a3ba;
  font-size: 11px;
  text-align: left;
  transition: .2s;
}

.quick-add span {
  font-size: 17px;
  margin-right: 7px;
}

.quick-add:hover {
  border-color: #80abe1;
  color: #347bc9;
  background: #ffffff80;
}

/* PANELS */

.panel {
  padding: 27px;
  background: white;
  border: 1px solid var(--border);
  border-radius: 11px;
}

.panel h2 {
  font-size: 19px;
  margin: 0 0 9px;
}

.panel p,
.panel small {
  color: var(--muted);
  font-size: 12px;
}

.panel textarea {
  width: 100%;
  padding: 15px;
  margin-top: 20px;
  border: 1px solid var(--border);
  border-radius: 8px;
  resize: vertical;
  outline-color: var(--blue);
}

.document-empty {
  text-align: center;
  padding: 65px 15px;
  color: #9aabc0;
}

.document-empty span {
  font-size: 35px;
}

.document-empty h3 {
  font-size: 15px;
}

.project-details {
  margin-top: 25px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 9px;
}

.project-details .primary-button {
  margin-top: 15px;
}

.empty-state {
  text-align: center;
  padding: 90px 20px;
}

.empty-state h2 {
  font-size: 20px;
}

.empty-state p {
  color: var(--muted);
  font-size: 13px;
}

.empty-state .primary-button {
  margin-top: 18px;
}

.empty-icon {
  font-size: 42px;
  color: #16b889;
}

/* MODAL */

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: #122c4b80;
  backdrop-filter: blur(4px);
}

.modal {
  width: min(510px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  padding: 29px;
  border-radius: 15px;
  background: white;
  box-shadow: 0 20px 70px #0c284b30;
}

.modal-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 23px;
}

.modal-heading h2 {
  margin: 0;
  font-size: 21px;
}

.close {
  border: 0;
  background: #f2f5f9;
  color: #8095ae;
  width: 30px;
  height: 30px;
  border-radius: 7px;
}

.modal form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.modal label {
  font-size: 11px;
  font-weight: 750;
  color: #516b88;
  margin-top: 9px;
}

.modal input,
.modal textarea,
.modal select {
  width: 100%;
  padding: 12px 13px;
  border: 1px solid #e0e8f2;
  border-radius: 8px;
  background: #fcfdff;
  color: #263c58;
  font-size: 12px;
  outline-color: #5295e7;
}

.modal textarea {
  resize: vertical;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 13px;
}

.form-row > div {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-top: 22px;
}

.footer-right {
  display: flex;
  gap: 9px;
  margin-left: auto;
}

.cancel-button {
  border: 0;
  border-radius: 8px;
  padding: 11px 15px;
  background: #edf2f8;
  color: #607994;
  font-size: 12px;
}

.delete-button {
  border: 0;
  background: transparent;
  color: #df6868;
  font-size: 12px;
}

.form-error {
  color: #cc4444;
  font-size: 12px;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 25px;
}

.project-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 13px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 12px;
}

.project-list-item > div {
  display: flex;
  gap: 12px;
}

.project-list-item button {
  border: 0;
  background: transparent;
  color: var(--blue);
  font-size: 11px;
}

.project-list-item .delete-text {
  color: #d85e5e;
}

.modal form h3 {
  font-size: 14px;
  margin: 0 0 5px;
}

/* RESPONSIVIDADE */

@media (max-width: 1100px) {
  .overview {
    flex-direction: column;
    align-items: stretch;
  }

  .overview-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }

  .stat {
    min-width: 0;
  }
}

@media (max-width: 900px) {
  .kanban {
    overflow-x: auto;
    grid-template-columns: repeat(3, minmax(280px, 1fr));
    padding-bottom: 10px;
  }

  .header {
    flex-wrap: wrap;
  }

  .header-right {
    width: 100%;
  }

  .search {
    flex: 1;
  }
}

@media (max-width: 600px) {
  .workspace {
    padding: 0;
  }

  .dashboard {
    border-radius: 0;
    min-height: 100vh;
  }

  .header,
  .content {
    padding: 20px 15px;
  }

  .navigation {
    padding: 0 15px;
    overflow-x: auto;
    gap: 20px;
  }

  .settings-button {
    display: none;
  }

  .nav-links {
    gap: 12px;
  }

  .overview-stats {
    gap: 6px;
  }

  .stat {
    padding: 12px 9px;
  }

  .stat-label,
  .stat-bottom {
    font-size: 9px;
  }

  .stat strong {
    font-size: 22px;
  }

  .search kbd,
  .user-avatar {
    display: none;
  }

  .primary-button {
    padding: 12px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

