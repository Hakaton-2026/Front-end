<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useTarefasStore } from "@/stores/tarefas";
import { useAuthStore } from "@/stores/auth";

const store = useTarefasStore();
const auth = useAuthStore();

const abas = [
  { id: "kanban", nome: "Kanban", icone: "▦" },
  { id: "agenda", nome: "Agenda", icone: "▣" },
  { id: "notion", nome: "Anotações", icone: "▤" },
  { id: "classroom", nome: "Atividades", icone: "✓" },
];

const abaAtiva = ref("kanban");
const modalAberto = ref(false);
const tarefaEditando = ref(null);
const filtro = ref("");
const mensagem = ref("");
const tipoMensagem = ref("sucesso");
const dataSelecionada = ref(dataLocal(new Date()));
const mesAtual = ref(
  new Date(new Date().getFullYear(), new Date().getMonth(), 1),
);

const formulario = reactive({
  titulo: "",
  descricao: "",
  prioridade: 1,
  prazoInicio: dataLocal(new Date()),
  prazoFim: dataLocal(new Date()),
  texto: "",
});

const colunas = [
  { id: 1, titulo: "A fazer", cor: "#64748b" },
  { id: 2, titulo: "Em andamento", cor: "#d97706" },
  { id: 3, titulo: "Concluído", cor: "#16a34a" },
];

function dataLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function formatarData(data) {
  if (!data) return "Sem data";

  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function mostrarMensagem(texto, tipo = "sucesso") {
  mensagem.value = texto;
  tipoMensagem.value = tipo;
}

const tarefasFiltradas = computed(() => {
  const termo = filtro.value.trim().toLowerCase();

  if (!termo) return store.tarefas;

  return store.tarefas.filter((tarefa) =>
    [tarefa.titulo, tarefa.descricao, tarefa.texto].some((valor) =>
      String(valor || "")
        .toLowerCase()
        .includes(termo),
    ),
  );
});

const tarefasDaData = computed(() =>
  tarefasFiltradas.value.filter(
    (tarefa) =>
      tarefa.prazoInicio <= dataSelecionada.value &&
      tarefa.prazoFim >= dataSelecionada.value,
  ),
);

const diasDoMes = computed(() => {
  const ano = mesAtual.value.getFullYear();
  const mes = mesAtual.value.getMonth();
  const primeiroDia = new Date(ano, mes, 1);
  const inicioSemana = primeiroDia.getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();

  return [
    ...Array(inicioSemana).fill(null),
    ...Array.from({ length: totalDias }, (_, indice) => {
      const data = dataLocal(new Date(ano, mes, indice + 1));
      return {
        dia: indice + 1,
        data,
        tarefas: tarefasFiltradas.value.filter(
          (tarefa) => tarefa.prazoInicio <= data && tarefa.prazoFim >= data,
        ),
      };
    }),
  ];
});

const tituloMes = computed(() =>
  mesAtual.value.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  }),
);

const totalConcluidas = computed(
  () =>
    store.tarefas.filter((tarefa) => Number(tarefa.prioridade) === 3).length,
);

const totalPendentes = computed(
  () =>
    store.tarefas.filter((tarefa) => Number(tarefa.prioridade) !== 3).length,
);

function limparFormulario() {
  formulario.titulo = "";
  formulario.descricao = "";
  formulario.prioridade = 1;
  formulario.prazoInicio = dataLocal(new Date());
  formulario.prazoFim = dataLocal(new Date());
  formulario.texto = "";
  tarefaEditando.value = null;
}

function abrirCriacao() {
  limparFormulario();
  modalAberto.value = true;
}

function abrirEdicao(tarefa) {
  tarefaEditando.value = tarefa;
  formulario.titulo = tarefa.titulo || "";
  formulario.descricao = tarefa.descricao || "";
  formulario.prioridade = Number(tarefa.prioridade) || 1;
  formulario.prazoInicio = tarefa.prazoInicio || dataLocal(new Date());
  formulario.prazoFim =
    tarefa.prazoFim || tarefa.prazoInicio || dataLocal(new Date());
  formulario.texto = tarefa.texto || "";
  modalAberto.value = true;
}

async function salvarTarefa() {
  if (!formulario.titulo.trim()) {
    mostrarMensagem("Informe o título da tarefa.", "erro");
    return;
  }

  if (!formulario.prazoInicio || !formulario.prazoFim) {
    mostrarMensagem("Informe a data de início e o prazo final.", "erro");
    return;
  }

  if (formulario.prazoFim < formulario.prazoInicio) {
    mostrarMensagem("O prazo final não pode ser anterior ao início.", "erro");
    return;
  }

  const userId = auth.user?.id;

  if (!tarefaEditando.value && !userId) {
    mostrarMensagem(
      "Não foi possível identificar o usuário autenticado. Entre novamente na sua conta.",
      "erro",
    );
    return;
  }

  const dados = {
    titulo: formulario.titulo.trim(),
    descricao: formulario.descricao.trim(),
    prioridade: Number(formulario.prioridade),
    prazoInicio: formulario.prazoInicio,
    prazoFim: formulario.prazoFim,
    texto: formulario.texto.trim(),
    user: tarefaEditando.value?.user ?? userId,
  };

  try {
    if (tarefaEditando.value) {
      await store.updateTarefa(tarefaEditando.value.id, dados);
      mostrarMensagem("Tarefa atualizada com sucesso.");
    } else {
      await store.addTarefa(dados);
      mostrarMensagem("Tarefa criada com sucesso.");
    }

    modalAberto.value = false;
    limparFormulario();
  } catch (erro) {
    mostrarMensagem(
      store.error || erro?.message || "Não foi possível salvar a tarefa.",
      "erro",
    );
  }
}

async function mudarStatus(tarefa, status) {
  try {
    await store.updateTarefa(tarefa.id, {
      titulo: tarefa.titulo,
      descricao: tarefa.descricao || "",
      prioridade: status,
      prazoInicio: tarefa.prazoInicio,
      prazoFim: tarefa.prazoFim,
      texto: tarefa.texto || "",
      user: tarefa.user,
    });

    mostrarMensagem("Status atualizado.");
  } catch (erro) {
    mostrarMensagem(
      store.error || erro?.message || "Não foi possível mudar o status.",
      "erro",
    );
  }
}

async function excluirTarefa(tarefa) {
  const confirmar = window.confirm(
    `Deseja realmente excluir "${tarefa.titulo}"?`,
  );

  if (!confirmar) return;

  try {
    await store.deleteTarefa(tarefa.id);
    mostrarMensagem("Tarefa excluída.");
  } catch (erro) {
    mostrarMensagem(
      store.error || erro?.message || "Não foi possível excluir a tarefa.",
      "erro",
    );
  }
}

function mudarMes(direcao) {
  mesAtual.value = new Date(
    mesAtual.value.getFullYear(),
    mesAtual.value.getMonth() + direcao,
    1,
  );
}

function selecionarDia(dia) {
  if (dia) dataSelecionada.value = dia.data;
}

function nomeStatus(status) {
  return (
    colunas.find((coluna) => coluna.id === Number(status))?.titulo || "A fazer"
  );
}

onMounted(async () => {
  try {
    await store.fetchTarefas();
  } catch {
    mostrarMensagem(
      store.error ||
        "Falha ao carregar tarefas. Confira a API e sua autenticação.",
      "erro",
    );
  }
});
</script>

<template>
  <section class="tarefas-page">
    <header class="page-header">
      <div>
        <span class="eyebrow">ORGANIZAÇÃO PESSOAL</span>
        <h1>Central de tarefas</h1>
        <p>Planeje, organize e acompanhe suas atividades em um só lugar.</p>
      </div>

      <button class="primary-button" @click="abrirCriacao">
        + Nova tarefa
      </button>
    </header>

    <div class="stats">
      <article class="stat-card">
        <span>Total de tarefas</span>
        <strong>{{ store.tarefas.length }}</strong>
      </article>
      <article class="stat-card">
        <span>Pendentes</span>
        <strong>{{ totalPendentes }}</strong>
      </article>
      <article class="stat-card">
        <span>Concluídas</span>
        <strong>{{ totalConcluidas }}</strong>
      </article>
    </div>

    <div class="toolbar">
      <nav class="tabs" aria-label="Visualizações de tarefas">
        <button
          v-for="aba in abas"
          :key="aba.id"
          :class="{ active: abaAtiva === aba.id }"
          @click="abaAtiva = aba.id"
        >
          <span>{{ aba.icone }}</span>
          {{ aba.nome }}
        </button>
      </nav>

      <input
        v-model="filtro"
        class="search-input"
        type="search"
        placeholder="Buscar tarefas..."
        aria-label="Buscar tarefas"
      />
    </div>

    <div v-if="mensagem" class="notice" :class="tipoMensagem">
      <span>{{ mensagem }}</span>
      <button aria-label="Fechar mensagem" @click="mensagem = ''">×</button>
    </div>

    <div v-if="store.loading" class="state-message">Carregando tarefas...</div>

    <div v-else-if="store.error && !store.tarefas.length" class="error-panel">
      <h2>Não foi possível carregar as tarefas</h2>
      <p>{{ store.error }}</p>
      <button class="secondary-button" @click="store.fetchTarefas()">
        Tentar novamente
      </button>
    </div>

    <template v-else>
      <!-- VISÃO KANBAN -->
      <section v-if="abaAtiva === 'kanban'" class="kanban-board">
        <article
          v-for="coluna in colunas"
          :key="coluna.id"
          class="kanban-column"
        >
          <header class="column-header">
            <span class="status-dot" :style="{ background: coluna.cor }"></span>
            <h2>{{ coluna.titulo }}</h2>
            <span class="count">
              {{
                tarefasFiltradas.filter(
                  (t) => Number(t.prioridade) === coluna.id,
                ).length
              }}
            </span>
          </header>

          <div class="task-list">
            <article
              v-for="tarefa in tarefasFiltradas.filter(
                (t) => Number(t.prioridade) === coluna.id,
              )"
              :key="tarefa.id"
              class="task-card"
            >
              <div class="task-card-top">
                <span class="task-id">#{{ tarefa.id }}</span>
                <button
                  class="icon-button"
                  title="Editar"
                  @click="abrirEdicao(tarefa)"
                >
                  ✎
                </button>
              </div>

              <h3>{{ tarefa.titulo }}</h3>
              <p v-if="tarefa.descricao" class="task-description">
                {{ tarefa.descricao }}
              </p>

              <div v-if="tarefa.texto" class="task-note">
                {{ tarefa.texto }}
              </div>

              <div class="task-date">
                <span>◷</span>
                {{ formatarData(tarefa.prazoFim) }}
              </div>

              <div class="task-actions">
                <select
                  :value="Number(tarefa.prioridade)"
                  aria-label="Alterar status"
                  @change="mudarStatus(tarefa, Number($event.target.value))"
                >
                  <option
                    v-for="item in colunas"
                    :key="item.id"
                    :value="item.id"
                  >
                    {{ item.titulo }}
                  </option>
                </select>
                <button class="delete-button" @click="excluirTarefa(tarefa)">
                  Excluir
                </button>
              </div>
            </article>

            <p
              v-if="
                !tarefasFiltradas.some(
                  (t) => Number(t.prioridade) === coluna.id,
                )
              "
              class="empty-column"
            >
              Nenhuma tarefa aqui.
            </p>
          </div>

          <button class="add-card-button" @click="abrirCriacao">
            + Adicionar tarefa
          </button>
        </article>
      </section>

      <!-- VISÃO DE AGENDA -->
      <section v-else-if="abaAtiva === 'agenda'" class="agenda-layout">
        <div class="calendar-panel">
          <header class="calendar-header">
            <button
              class="icon-button"
              aria-label="Mês anterior"
              @click="mudarMes(-1)"
            >
              ‹
            </button>
            <h2>{{ tituloMes }}</h2>
            <button
              class="icon-button"
              aria-label="Próximo mês"
              @click="mudarMes(1)"
            >
              ›
            </button>
          </header>

          <div class="calendar-grid">
            <span
              v-for="dia in ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']"
              :key="dia"
              class="weekday"
            >
              {{ dia }}
            </span>

            <button
              v-for="(dia, indice) in diasDoMes"
              :key="dia?.data || `vazio-${indice}`"
              class="calendar-day"
              :class="{
                selected: dia?.data === dataSelecionada,
                'has-tasks': dia?.tarefas.length,
              }"
              :disabled="!dia"
              @click="selecionarDia(dia)"
            >
              <span v-if="dia">{{ dia.dia }}</span>
              <small v-if="dia?.tarefas.length">{{ dia.tarefas.length }}</small>
            </button>
          </div>
        </div>

        <div class="agenda-list">
          <span class="eyebrow">AGENDA DO DIA</span>
          <h2>{{ formatarData(dataSelecionada) }}</h2>

          <article
            v-for="tarefa in tarefasDaData"
            :key="tarefa.id"
            class="agenda-task"
          >
            <div
              class="agenda-marker"
              :class="`status-${tarefa.prioridade}`"
            ></div>
            <div class="agenda-task-content">
              <h3>{{ tarefa.titulo }}</h3>
              <p>{{ tarefa.descricao || "Sem descrição" }}</p>
              <span
                >{{ nomeStatus(tarefa.prioridade) }} · Prazo
                {{ formatarData(tarefa.prazoFim) }}</span
              >
            </div>
            <button
              class="icon-button"
              title="Editar tarefa"
              @click="abrirEdicao(tarefa)"
            >
              ✎
            </button>
          </article>

          <p v-if="!tarefasDaData.length" class="empty-state">
            Nenhuma tarefa para esta data.
          </p>
        </div>
      </section>

      <!-- VISÃO DE ANOTAÇÕES -->
      <section v-else-if="abaAtiva === 'notion'" class="notes-view">
        <header class="section-heading">
          <div>
            <h2>Minhas anotações</h2>
            <p>Descrições e notas associadas às tarefas salvas na API.</p>
          </div>
          <button class="secondary-button" @click="abrirCriacao">
            + Nova anotação
          </button>
        </header>

        <div class="notes-grid">
          <article
            v-for="tarefa in tarefasFiltradas"
            :key="tarefa.id"
            class="note-card"
          >
            <span class="note-label">TAREFA #{{ tarefa.id }}</span>
            <h3>{{ tarefa.titulo }}</h3>
            <p>{{ tarefa.descricao || "Sem descrição adicionada." }}</p>
            <div v-if="tarefa.texto" class="note-body">{{ tarefa.texto }}</div>
            <footer>
              <span>{{ nomeStatus(tarefa.prioridade) }}</span>
              <button class="text-button" @click="abrirEdicao(tarefa)">
                Editar nota →
              </button>
            </footer>
          </article>
        </div>

        <p v-if="!tarefasFiltradas.length" class="empty-state">
          Nenhuma anotação encontrada. Crie uma tarefa para começar.
        </p>
      </section>

      <!-- VISÃO DE ATIVIDADES -->
      <section v-else class="classroom-view">
        <header class="section-heading">
          <div>
            <h2>Atividades e entregas</h2>
            <p>Acompanhe os prazos e o andamento das suas atividades.</p>
          </div>
        </header>

        <div class="activity-list">
          <article
            v-for="tarefa in tarefasFiltradas"
            :key="tarefa.id"
            class="activity-card"
          >
            <div class="activity-icon">✓</div>
            <div class="activity-main">
              <h3>{{ tarefa.titulo }}</h3>
              <p>{{ tarefa.descricao || "Sem instruções adicionais." }}</p>
              <span>Início: {{ formatarData(tarefa.prazoInicio) }}</span>
              <span>Entrega: {{ formatarData(tarefa.prazoFim) }}</span>
            </div>
            <div class="activity-status">
              <span class="status-pill" :class="`pill-${tarefa.prioridade}`">
                {{ nomeStatus(tarefa.prioridade) }}
              </span>
              <button class="secondary-button" @click="abrirEdicao(tarefa)">
                Abrir
              </button>
            </div>
          </article>
        </div>

        <p v-if="!tarefasFiltradas.length" class="empty-state">
          Nenhuma atividade cadastrada.
        </p>
      </section>
    </template>

    <!-- FORMULÁRIO DE CRIAÇÃO E EDIÇÃO -->
    <div
      v-if="modalAberto"
      class="modal-backdrop"
      @click.self="modalAberto = false"
    >
      <section
        class="task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header class="modal-header">
          <div>
            <span class="eyebrow">{{
              tarefaEditando ? "EDITAR REGISTRO" : "NOVO REGISTRO"
            }}</span>
            <h2 id="modal-title">
              {{ tarefaEditando ? "Editar tarefa" : "Criar tarefa" }}
            </h2>
          </div>
          <button
            class="icon-button close-button"
            aria-label="Fechar"
            @click="modalAberto = false"
          >
            ×
          </button>
        </header>

        <form class="task-form" @submit.prevent="salvarTarefa">
          <label>
            Título *
            <input
              v-model="formulario.titulo"
              maxlength="45"
              required
              placeholder="Ex.: Entregar trabalho"
            />
          </label>

          <label>
            Descrição
            <textarea
              v-model="formulario.descricao"
              maxlength="200"
              rows="2"
              placeholder="Do que se trata esta tarefa?"
            />
          </label>

          <div class="form-row">
            <label>
              Data de início *
              <input v-model="formulario.prazoInicio" type="date" required />
            </label>
            <label>
              Prazo final *
              <input
                v-model="formulario.prazoFim"
                type="date"
                :min="formulario.prazoInicio"
                required
              />
            </label>
          </div>

          <label>
            Status
            <select v-model.number="formulario.prioridade">
              <option :value="1">A fazer</option>
              <option :value="2">Em andamento</option>
              <option :value="3">Concluído</option>
            </select>
          </label>

          <label>
            Anotações
            <textarea
              v-model="formulario.texto"
              maxlength="500"
              rows="4"
              placeholder="Links, observações ou detalhes adicionais..."
            />
          </label>

          <p class="form-hint">
            * Campos obrigatórios. Os dados serão enviados para o backend.
          </p>

          <div class="modal-actions">
            <button
              type="button"
              class="secondary-button"
              @click="modalAberto = false"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="primary-button"
              :disabled="store.loading"
            >
              {{ store.loading ? "Salvando..." : "Salvar tarefa" }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </section>
</template>

<style scoped>
.tarefas-page {
  --line: var(--bs-border-color, #e2e8f0);
  --surface: var(--bs-body-bg, #fff);
  --muted: var(--bs-secondary-color, #64748b);
  --ink: var(--bs-body-color, #172033);
  color: var(--ink);
  padding-bottom: 3rem;
}
.page-header,
.toolbar,
.section-heading,
.calendar-header,
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}
.page-header {
  margin-bottom: 1.5rem;
}
.eyebrow {
  display: block;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  margin-bottom: 0.45rem;
}
h1 {
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  letter-spacing: -0.04em;
  margin: 0 0 0.5rem;
}
h2,
h3,
p {
  margin-top: 0;
}
.page-header p,
.section-heading p {
  color: var(--muted);
  margin-bottom: 0;
}
.primary-button,
.secondary-button {
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 0.7rem 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: 0.15s ease;
}
.primary-button {
  background: #4f46e5;
  color: white;
}
.primary-button:hover {
  background: #4338ca;
}
.primary-button:disabled {
  opacity: 0.6;
  cursor: wait;
}
.secondary-button {
  background: var(--surface);
  border-color: var(--line);
  color: var(--ink);
}
.secondary-button:hover {
  background: #f1f5f9;
  color: #172033;
}
.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.stat-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 1.1rem 1.25rem;
}
.stat-card span {
  display: block;
  color: var(--muted);
  font-size: 0.85rem;
  margin-bottom: 0.6rem;
}
.stat-card strong {
  font-size: 1.8rem;
}
.toolbar {
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.tabs {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}
.tabs button {
  border: 1px solid transparent;
  background: transparent;
  color: var(--muted);
  border-radius: 9px;
  padding: 0.65rem 0.85rem;
  cursor: pointer;
  font-weight: 650;
}
.tabs button.active {
  color: #4338ca;
  background: #eef2ff;
  border-color: #c7d2fe;
}
.tabs button span {
  margin-right: 0.35rem;
}
.search-input {
  min-width: 210px;
  max-width: 300px;
  flex: 1;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 0.7rem 0.9rem;
  background: var(--surface);
  color: var(--ink);
}
.notice {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1rem;
  margin: 1rem 0;
  border-radius: 10px;
  background: #ecfdf5;
  color: #166534;
}
.notice.erro {
  background: #fef2f2;
  color: #991b1b;
  white-space: pre-line;
}
.notice button {
  border: 0;
  background: transparent;
  font-size: 1.2rem;
  cursor: pointer;
  color: inherit;
}
.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  align-items: start;
}
.kanban-column {
  background: #f8fafc;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 0.9rem;
  min-width: 0;
}
.column-header {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0.2rem 0 1rem;
}
.column-header h2 {
  font-size: 0.95rem;
  margin: 0;
}
.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
.count {
  margin-left: auto;
  background: #e2e8f0;
  color: #475569;
  border-radius: 7px;
  padding: 0.15rem 0.45rem;
  font-size: 0.75rem;
}
.task-list {
  display: grid;
  gap: 0.75rem;
}
.task-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 0.9rem;
  box-shadow: 0 2px 5px #0f172a08;
  overflow-wrap: anywhere;
}
.task-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.task-id,
.note-label {
  font-size: 0.7rem;
  color: var(--muted);
  font-weight: 750;
}
.task-card h3 {
  font-size: 1rem;
  margin: 0.4rem 0;
}
.task-description {
  color: var(--muted);
  font-size: 0.85rem;
  line-height: 1.5;
  margin-bottom: 0.75rem;
}
.task-note {
  border-left: 3px solid #c7d2fe;
  padding: 0.45rem 0.65rem;
  font-size: 0.82rem;
  white-space: pre-wrap;
  margin: 0.6rem 0;
  background: #f8fafc;
}
.task-date {
  font-size: 0.78rem;
  color: var(--muted);
  margin: 0.8rem 0;
}
.task-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.task-actions select {
  min-width: 0;
  flex: 1;
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 0.4rem;
  background: var(--surface);
  color: var(--ink);
  font-size: 0.78rem;
}
.icon-button {
  border: 0;
  background: transparent;
  color: var(--muted);
  padding: 0.3rem 0.45rem;
  border-radius: 7px;
  cursor: pointer;
  font-size: 1rem;
}
.icon-button:hover {
  background: #e2e8f0;
  color: #334155;
}
.delete-button,
.text-button {
  border: 0;
  background: transparent;
  color: #dc2626;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 650;
}
.add-card-button {
  width: 100%;
  margin-top: 0.8rem;
  padding: 0.7rem;
  border: 1px dashed #cbd5e1;
  border-radius: 9px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
}
.add-card-button:hover {
  background: #eef2ff;
}
.empty-column,
.empty-state {
  color: var(--muted);
  text-align: center;
  font-size: 0.9rem;
  padding: 1.5rem 0.5rem;
}
.agenda-layout {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1.1fr);
  gap: 1.25rem;
}
.calendar-panel,
.agenda-list {
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 1.2rem;
  background: var(--surface);
}
.calendar-header h2 {
  font-size: 1.05rem;
  text-transform: capitalize;
  margin: 0;
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.35rem;
  margin-top: 1rem;
}
.weekday {
  text-align: center;
  font-size: 0.72rem;
  color: var(--muted);
  padding: 0.4rem 0;
}
.calendar-day {
  min-height: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
}
.calendar-day:disabled {
  cursor: default;
}
.calendar-day.selected {
  background: #eef2ff;
  border-color: #818cf8;
  color: #4338ca;
  font-weight: 800;
}
.calendar-day.has-tasks:not(.selected) {
  background: #f1f5f9;
}
.calendar-day small {
  color: #4f46e5;
  font-size: 0.65rem;
}
.agenda-list h2 {
  margin-bottom: 1rem;
}
.agenda-task {
  display: flex;
  gap: 0.8rem;
  align-items: flex-start;
  border-top: 1px solid var(--line);
  padding: 1rem 0;
}
.agenda-marker {
  width: 4px;
  min-height: 46px;
  border-radius: 4px;
  background: #64748b;
}
.agenda-marker.status-2 {
  background: #d97706;
}
.agenda-marker.status-3 {
  background: #16a34a;
}
.agenda-task-content {
  flex: 1;
  min-width: 0;
}
.agenda-task h3 {
  font-size: 0.95rem;
  margin-bottom: 0.35rem;
}
.agenda-task p,
.agenda-task span {
  color: var(--muted);
  font-size: 0.8rem;
  margin-bottom: 0.3rem;
}
.notes-view,
.classroom-view {
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 1.25rem;
  background: var(--surface);
}
.notes-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1.25rem;
}
.note-card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 1rem;
  min-width: 0;
}
.note-card h3 {
  margin: 0;
  font-size: 1rem;
}
.note-card p,
.note-body {
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--muted);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.note-card footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.8rem;
  border-top: 1px solid var(--line);
  font-size: 0.75rem;
}
.note-card footer span {
  color: var(--muted);
}
.text-button {
  color: #4f46e5;
}
.activity-list {
  margin-top: 1rem;
}
.activity-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--line);
}
.activity-icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #eef2ff;
  color: #4f46e5;
  font-weight: 800;
  flex-shrink: 0;
}
.activity-main {
  flex: 1;
  min-width: 0;
}
.activity-main h3 {
  font-size: 1rem;
  margin-bottom: 0.3rem;
}
.activity-main p,
.activity-main span {
  color: var(--muted);
  font-size: 0.8rem;
  margin-right: 0.75rem;
}
.activity-status {
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: 0.6rem;
}
.status-pill {
  border-radius: 100px;
  padding: 0.35rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 750;
  white-space: nowrap;
}
.pill-1 {
  background: #f1f5f9;
  color: #475569;
}
.pill-2 {
  background: #fef3c7;
  color: #92400e;
}
.pill-3 {
  background: #dcfce7;
  color: #166534;
}
.state-message,
.error-panel {
  text-align: center;
  padding: 3rem 1rem;
}
.error-panel {
  border: 1px solid #fecaca;
  background: #fef2f2;
  border-radius: 12px;
  color: #991b1b;
}
.modal-backdrop {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: #0f172a99;
  overflow-y: auto;
}
.task-modal {
  width: min(100%, 620px);
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  background: var(--surface);
  color: var(--ink);
  border-radius: 16px;
  padding: 1.4rem;
  box-shadow: 0 24px 80px #0003;
}
.modal-header {
  align-items: flex-start;
  margin-bottom: 1.3rem;
}
.modal-header h2 {
  margin: 0;
}
.close-button {
  font-size: 1.5rem;
}
.task-form {
  display: grid;
  gap: 1rem;
}
.task-form label {
  display: grid;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 700;
}
.task-form input,
.task-form textarea,
.task-form select {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid var(--line);
  border-radius: 9px;
  padding: 0.7rem 0.8rem;
  background: var(--surface);
  color: var(--ink);
  font: inherit;
  font-weight: 400;
}
.task-form input:focus,
.task-form textarea:focus,
.task-form select:focus,
.search-input:focus {
  outline: 2px solid #a5b4fc;
  outline-offset: 1px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.form-hint {
  color: var(--muted);
  font-size: 0.78rem;
  margin: 0;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  padding-top: 0.5rem;
}
@media (max-width: 900px) {
  .kanban-board {
    grid-template-columns: 1fr;
  }
  .notes-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 650px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .stats {
    gap: 0.5rem;
  }
  .stat-card {
    padding: 0.8rem;
  }
  .stat-card span {
    font-size: 0.75rem;
  }
  .stat-card strong {
    font-size: 1.4rem;
  }
  .agenda-layout,
  .notes-grid,
  .form-row {
    grid-template-columns: 1fr;
  }
  .toolbar {
    align-items: stretch;
  }
  .tabs {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
  .tabs button {
    text-align: left;
  }
  .search-input {
    max-width: none;
  }
  .activity-card {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .activity-status {
    align-items: flex-start;
    margin-left: 56px;
    flex-direction: row;
  }
}
</style>
