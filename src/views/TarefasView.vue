
<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useTarefasStore } from "@/stores/tarefas";
import { useAuthStore } from "@/stores/auth";

const store = useTarefasStore();
const auth = useAuthStore();

const abas = [
  { id: "kanban", nome: "Kanban", icone: "grid-outline" },
  { id: "agenda", nome: "Agenda", icone: "calendar-outline" },
  { id: "notion", nome: "Anotações", icone: "document-text-outline" },
  { id: "classroom", nome: "Atividades", icone: "checkmark-circle-outline" },
];

const colunas = [
  { id: 1, titulo: "A fazer", cor: "#64748b" },
  { id: 2, titulo: "Em andamento", cor: "#d97706" },
  { id: 3, titulo: "Concluído", cor: "#16a34a" },
];

const abaAtiva = ref("kanban");
const modalAberto = ref(false);
const tarefaEditando = ref(null);
const filtro = ref("");
const mensagem = ref("");
const tipoMensagem = ref("sucesso");
const salvando = ref(false);

const tarefaArrastada = ref(null);
const colunaDestino = ref(null);
const atualizandoStatus = ref(false);

const arrastandoQuadro = ref(false);
const inicioX = ref(0);
const scrollInicial = ref(0);

function dataLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarData(data) {
  if (!data) return "Sem data";

  const [ano, mes, dia] = String(data).slice(0, 10).split("-");

  if (!ano || !mes || !dia) return "Sem data";

  return `${dia}/${mes}/${ano}`;
}

const hoje = dataLocal(new Date());

const dataSelecionada = ref(hoje);
const mesAtual = ref(
  new Date(new Date().getFullYear(), new Date().getMonth(), 1)
);

const formulario = reactive({
  titulo: "",
  descricao: "",
  prioridade: 1,
  prazoInicio: hoje,
  prazoFim: hoje,
  texto: "",
});

function mostrarMensagem(texto, tipo = "sucesso") {
  mensagem.value = texto;
  tipoMensagem.value = tipo;
}

const tarefasFiltradas = computed(() => {
  const termo = filtro.value.trim().toLowerCase();

  if (!termo) return store.tarefas;

  return store.tarefas.filter((tarefa) =>
    [tarefa.titulo, tarefa.descricao, tarefa.texto].some((valor) =>
      String(valor || "").toLowerCase().includes(termo)
    )
  );
});

const tarefasDaData = computed(() =>
  tarefasFiltradas.value.filter((tarefa) => {
    const inicio = tarefa.prazoInicio || "";
    const fim = tarefa.prazoFim || tarefa.prazoInicio || "";

    return inicio <= dataSelecionada.value &&
      fim >= dataSelecionada.value;
  })
);

const diasDoMes = computed(() => {
  const ano = mesAtual.value.getFullYear();
  const mes = mesAtual.value.getMonth();
  const inicioSemana = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();

  return [
    ...Array(inicioSemana).fill(null),
    ...Array.from({ length: totalDias }, (_, indice) => {
      const data = dataLocal(new Date(ano, mes, indice + 1));

      return {
        dia: indice + 1,
        data,
        tarefas: tarefasFiltradas.value.filter((tarefa) => {
          const inicio = tarefa.prazoInicio || "";
          const fim = tarefa.prazoFim || tarefa.prazoInicio || "";

          return inicio <= data && fim >= data;
        }),
      };
    }),
  ];
});

const tituloMes = computed(() =>
  mesAtual.value.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  })
);

const totalConcluidas = computed(() =>
  store.tarefas.filter(
    (tarefa) => Number(tarefa.prioridade) === 3
  ).length
);

const totalPendentes = computed(() =>
  store.tarefas.filter(
    (tarefa) => Number(tarefa.prioridade) !== 3
  ).length
);

function tarefasDaColuna(colunaId) {
  return tarefasFiltradas.value.filter(
    (tarefa) => Number(tarefa.prioridade) === Number(colunaId)
  );
}

function nomeStatus(status) {
  return (
    colunas.find((coluna) => coluna.id === Number(status))?.titulo ||
    "A fazer"
  );
}

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
  formulario.prazoInicio =
    tarefa.prazoInicio || dataLocal(new Date());
  formulario.prazoFim =
    tarefa.prazoFim ||
    tarefa.prazoInicio ||
    dataLocal(new Date());
  formulario.texto = tarefa.texto || "";

  modalAberto.value = true;
}

function montarDadosTarefa(status = formulario.prioridade) {
  const userId = auth.user?.id;

  return {
    titulo: formulario.titulo.trim(),
    descricao: formulario.descricao.trim(),
    prioridade: Number(status),
    prazoInicio: formulario.prazoInicio,
    prazoFim: formulario.prazoFim,
    texto: formulario.texto.trim(),
    user: tarefaEditando.value?.user ?? userId,
  };
}

async function salvarTarefa() {
  if (salvando.value) return;

  if (!formulario.titulo.trim()) {
    mostrarMensagem("Informe o título da tarefa.", "erro");
    return;
  }

  if (!formulario.prazoInicio || !formulario.prazoFim) {
    mostrarMensagem(
      "Informe a data de início e o prazo final.",
      "erro"
    );
    return;
  }

  if (formulario.prazoFim < formulario.prazoInicio) {
    mostrarMensagem(
      "O prazo final não pode ser anterior ao início.",
      "erro"
    );
    return;
  }

  if (!tarefaEditando.value && !auth.user?.id) {
    mostrarMensagem(
      "Não foi possível identificar o usuário. Entre novamente.",
      "erro"
    );
    return;
  }

  salvando.value = true;

  try {
    const dados = montarDadosTarefa();

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
      "erro"
    );
  } finally {
    salvando.value = false;
  }
}

async function mudarStatus(tarefa, status) {
  const novoStatus = Number(status);
  const statusAnterior = Number(tarefa.prioridade);

  if (novoStatus === statusAnterior) return;

  try {
    await store.updateTarefa(tarefa.id, {
      titulo: tarefa.titulo,
      descricao: tarefa.descricao || "",
      prioridade: novoStatus,
      prazoInicio: tarefa.prazoInicio,
      prazoFim: tarefa.prazoFim || tarefa.prazoInicio,
      texto: tarefa.texto || "",
      user: tarefa.user,
    });

    mostrarMensagem("Status atualizado com sucesso.");
    return true;
  } catch (erro) {
    mostrarMensagem(
      store.error || erro?.message || "Não foi possível mudar o status.",
      "erro"
    );

    return false;
  }
}

async function excluirTarefa(tarefa) {
  const confirmar = window.confirm(
    `Deseja realmente excluir "${tarefa.titulo}"?`
  );

  if (!confirmar) return;

  try {
    await store.deleteTarefa(tarefa.id);
    mostrarMensagem("Tarefa excluída.");
  } catch (erro) {
    mostrarMensagem(
      store.error || erro?.message || "Não foi possível excluir a tarefa.",
      "erro"
    );
  }
}

/* Arrastar tarefas entre colunas */

function iniciarArrasteTarefa(event, tarefa) {
  tarefaArrastada.value = tarefa;

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(tarefa.id));
  }
}

function arrastarSobreColuna(event, coluna) {
  event.preventDefault();

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }

  colunaDestino.value = coluna.id;
}

async function soltarTarefa(event, coluna) {
  event.preventDefault();

  const tarefa = tarefaArrastada.value;
  colunaDestino.value = null;

  if (!tarefa || atualizandoStatus.value) return;

  const statusAtual = Number(tarefa.prioridade);
  const novoStatus = Number(coluna.id);

  if (statusAtual === novoStatus) {
    tarefaArrastada.value = null;
    return;
  }

  atualizandoStatus.value = true;

  try {
    await mudarStatus(tarefa, novoStatus);
  } finally {
    tarefaArrastada.value = null;
    atualizandoStatus.value = false;
  }
}

function finalizarArrasteTarefa() {
  tarefaArrastada.value = null;
  colunaDestino.value = null;
}

/* Arrastar o quadro horizontalmente com o mouse */

function iniciarArrasteQuadro(event) {
  if (event.button !== 0) return;

  if (
    event.target.closest(
      ".task-card, button, input, select, textarea, a"
    )
  ) {
    return;
  }

  const quadro = event.currentTarget;

  arrastandoQuadro.value = true;
  inicioX.value = event.clientX;
  scrollInicial.value = quadro.scrollLeft;

  quadro.classList.add("is-dragging");
}

function arrastarQuadro(event) {
  if (!arrastandoQuadro.value) return;

  const quadro = event.currentTarget;
  quadro.scrollLeft =
    scrollInicial.value - (event.clientX - inicioX.value);
}

function finalizarArrasteQuadro(event) {
  arrastandoQuadro.value = false;

  event?.currentTarget?.classList.remove("is-dragging");
}

function mudarMes(direcao) {
  mesAtual.value = new Date(
    mesAtual.value.getFullYear(),
    mesAtual.value.getMonth() + direcao,
    1
  );
}

function selecionarDia(dia) {
  if (dia) dataSelecionada.value = dia.data;
}

onMounted(async () => {
  try {
    await store.fetchTarefas();
  } catch (erro) {
    mostrarMensagem(
      store.error ||
        erro?.message ||
        "Falha ao carregar tarefas. Confira a API e sua autenticação.",
      "erro"
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
        <ion-icon name="add-outline"></ion-icon>
        Nova tarefa
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
          <ion-icon :name="aba.icone"></ion-icon>
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
      <button aria-label="Fechar mensagem" @click="mensagem = ''">
        ×
      </button>
    </div>

    <div v-if="store.loading" class="state-message">
      Carregando tarefas...
    </div>

    <div
      v-else-if="store.error && !store.tarefas.length"
      class="error-panel"
    >
      <h2>Não foi possível carregar as tarefas</h2>
      <p>{{ store.error }}</p>
      <button class="secondary-button" @click="store.fetchTarefas()">
        Tentar novamente
      </button>
    </div>

    <template v-else>
      <!-- KANBAN -->
      <section v-if="abaAtiva === 'kanban'" class="kanban-wrapper">
        <div class="kanban-hint">
          <ion-icon name="move-outline"></ion-icon>
          <span>
            Arraste o quadro para os lados ou mova tarefas entre colunas.
          </span>
        </div>

        <div
          class="kanban-board"
          @mousedown="iniciarArrasteQuadro"
          @mousemove="arrastarQuadro"
          @mouseup="finalizarArrasteQuadro"
          @mouseleave="finalizarArrasteQuadro"
          @dragend="finalizarArrasteTarefa"
        >
          <article
            v-for="coluna in colunas"
            :key="coluna.id"
            class="kanban-column"
            :class="{
              'column-drop-active': colunaDestino === coluna.id
            }"
            @dragover="arrastarSobreColuna($event, coluna)"
            @drop="soltarTarefa($event, coluna)"
          >
            <header class="column-header">
              <div class="column-title">
                <span
                  class="status-dot"
                  :style="{ background: coluna.cor }"
                ></span>
                <h2>{{ coluna.titulo }}</h2>
              </div>

              <span class="count">
                {{ tarefasDaColuna(coluna.id).length }}
              </span>
            </header>

            <div class="task-list">
              <article
                v-for="tarefa in tarefasDaColuna(coluna.id)"
                :key="tarefa.id"
                class="task-card"
                :class="{
                  'task-dragging': tarefaArrastada?.id === tarefa.id
                }"
                draggable="true"
                @dragstart="iniciarArrasteTarefa($event, tarefa)"
                @dragend="finalizarArrasteTarefa"
              >
                <div class="task-card-top">
                  <span class="task-id">#{{ tarefa.id }}</span>

                  <button
                    class="icon-button"
                    type="button"
                    title="Editar tarefa"
                    aria-label="Editar tarefa"
                    @click.stop="abrirEdicao(tarefa)"
                  >
                    <ion-icon name="create-outline"></ion-icon>
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
                  <ion-icon name="calendar-outline"></ion-icon>
                  <span>{{ formatarData(tarefa.prazoFim) }}</span>
                </div>

                <div class="task-actions">
                  <label class="status-select-label">
                    <span>Status</span>

                    <select
                      :value="Number(tarefa.prioridade)"
                      aria-label="Alterar status"
                      @mousedown.stop
                      @change="
                        mudarStatus(
                          tarefa,
                          Number($event.target.value)
                        )
                      "
                    >
                      <option
                        v-for="item in colunas"
                        :key="item.id"
                        :value="item.id"
                      >
                        {{ item.titulo }}
                      </option>
                    </select>
                  </label>

                  <button
                    class="delete-button"
                    type="button"
                    @click.stop="excluirTarefa(tarefa)"
                  >
                    <ion-icon name="trash-outline"></ion-icon>
                    Excluir
                  </button>
                </div>
              </article>

              <div
                v-if="!tarefasDaColuna(coluna.id).length"
                class="empty-column"
              >
                <ion-icon name="file-tray-outline"></ion-icon>
                <span>Nenhuma tarefa aqui.</span>
                <small>Arraste uma tarefa para esta coluna.</small>
              </div>
            </div>

            <button class="add-card-button" @click="abrirCriacao">
              <ion-icon name="add-outline"></ion-icon>
              Adicionar tarefa
            </button>
          </article>
        </div>
      </section>

      <!-- AGENDA -->
      <section v-else-if="abaAtiva === 'agenda'" class="agenda-layout">
        <div class="calendar-panel">
          <header class="calendar-header">
            <button
              class="icon-button"
              aria-label="Mês anterior"
              @click="mudarMes(-1)"
            >
              <ion-icon name="chevron-back-outline"></ion-icon>
            </button>

            <h2>{{ tituloMes }}</h2>

            <button
              class="icon-button"
              aria-label="Próximo mês"
              @click="mudarMes(1)"
            >
              <ion-icon name="chevron-forward-outline"></ion-icon>
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
                'has-tasks': dia?.tarefas.length
              }"
              :disabled="!dia"
              @click="selecionarDia(dia)"
            >
              <span v-if="dia">{{ dia.dia }}</span>
              <small v-if="dia?.tarefas.length">
                {{ dia.tarefas.length }}
              </small>
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
              <span>
                {{ nomeStatus(tarefa.prioridade) }} · Prazo
                {{ formatarData(tarefa.prazoFim) }}
              </span>
            </div>

            <button
              class="icon-button"
              title="Editar tarefa"
              @click="abrirEdicao(tarefa)"
            >
              <ion-icon name="create-outline"></ion-icon>
            </button>
          </article>

          <p v-if="!tarefasDaData.length" class="empty-state">
            Nenhuma tarefa para esta data.
          </p>
        </div>
      </section>

      <!-- ANOTAÇÕES -->
      <section v-else-if="abaAtiva === 'notion'" class="notes-view">
        <header class="section-heading">
          <div>
            <h2>Minhas anotações</h2>
            <p>Descrições e notas associadas às tarefas.</p>
          </div>

          <button class="secondary-button" @click="abrirCriacao">
            <ion-icon name="add-outline"></ion-icon>
            Nova anotação
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

            <div v-if="tarefa.texto" class="note-body">
              {{ tarefa.texto }}
            </div>

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

      <!-- ATIVIDADES -->
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
            <div class="activity-icon">
              <ion-icon name="checkmark-outline"></ion-icon>
            </div>

            <div class="activity-main">
              <h3>{{ tarefa.titulo }}</h3>
              <p>{{ tarefa.descricao || "Sem instruções adicionais." }}</p>
              <span>Início: {{ formatarData(tarefa.prazoInicio) }}</span>
              <span>Entrega: {{ formatarData(tarefa.prazoFim) }}</span>
            </div>

            <div class="activity-status">
              <span
                class="status-pill"
                :class="`pill-${tarefa.prioridade}`"
              >
                {{ nomeStatus(tarefa.prioridade) }}
              </span>

              <button
                class="secondary-button"
                @click="abrirEdicao(tarefa)"
              >
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

    <!-- MODAL DE CRIAÇÃO E EDIÇÃO -->
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
            <span class="eyebrow">
              {{ tarefaEditando ? "EDITAR REGISTRO" : "NOVO REGISTRO" }}
            </span>

            <h2 id="modal-title">
              {{ tarefaEditando ? "Editar tarefa" : "Criar tarefa" }}
            </h2>
          </div>

          <button
            class="icon-button close-button"
            aria-label="Fechar"
            @click="modalAberto = false"
          >
            <ion-icon name="close-outline"></ion-icon>
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
            ></textarea>
          </label>

          <div class="form-row">
            <label>
              Data de início *
              <input
                v-model="formulario.prazoInicio"
                type="date"
                required
              />
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
            ></textarea>
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
              :disabled="salvando"
            >
              {{ salvando ? "Salvando..." : "Salvar tarefa" }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </section>
</template>

<style scoped>

/* =========================================
   COR PRINCIPAL DO COMPONENTE
   ========================================= */

.tarefas-page {
  --tarefas-roxo: #A855F7;
  --tarefas-roxo-hover: #9333EA;
  --tarefas-roxo-suave: rgba(168, 85, 247, 0.14);
  --tarefas-roxo-borda: rgba(168, 85, 247, 0.4);

  color: var(--cor-texto, #f5f5f5);
  background: var(--cor-fundo, #171717);
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.tarefas-page *,
.tarefas-page *::before,
.tarefas-page *::after {
  box-sizing: border-box;
}

/* =========================================
   CABEÇALHO
   ========================================= */

.tarefas-page .eyebrow {
  color: var(--tarefas-roxo);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.tarefas-page .page-header h1 {
  color: var(--cor-texto, #f5f5f5);
}

.tarefas-page .page-header p {
  color: var(--cor-texto-suave, #a3a3a3);
}

/* =========================================
   BOTÕES ROXOS
   ========================================= */

.tarefas-page .primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  padding: 11px 17px;
  min-height: 42px;

  border: 1px solid var(--tarefas-roxo);
  border-radius: 10px;

  background: var(--tarefas-roxo);
  color: #fff;

  font-weight: 700;
  cursor: pointer;

  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.tarefas-page .primary-button:hover {
  background: var(--tarefas-roxo-hover);
  border-color: var(--tarefas-roxo-hover);
}

.tarefas-page .primary-button:active {
  transform: scale(0.98);
}

.tarefas-page .primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tarefas-page .secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  padding: 10px 14px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 9px;

  background: var(--cor-superficie, #222);
  color: var(--cor-texto, #f5f5f5);

  cursor: pointer;
  transition: 0.2s ease;
}

.tarefas-page .secondary-button:hover {
  border-color: var(--tarefas-roxo);
  background: var(--tarefas-roxo-suave);
}

/* =========================================
   RESUMO DAS TAREFAS
   ========================================= */

.tarefas-page .stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}

.tarefas-page .stat-card {
  min-width: 0;
  padding: 18px;

  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 13px;

  background: var(--cor-superficie, #222);
  transition: border-color 0.2s ease;
}

.tarefas-page .stat-card:hover {
  border-color: var(--tarefas-roxo-borda);
}

.tarefas-page .stat-card span {
  display: block;
  color: var(--cor-texto-suave, #a3a3a3);
  font-size: 0.85rem;
}

.tarefas-page .stat-card strong {
  display: block;
  margin-top: 8px;
  color: var(--tarefas-roxo);
  font-size: 1.8rem;
  font-weight: 800;
}

/* =========================================
   ABAS
   ========================================= */

.tarefas-page .toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 20px;
  min-width: 0;
}

.tarefas-page .tabs {
  display: flex;
  align-items: center;
  gap: 5px;

  min-width: 0;
  max-width: 100%;
  padding: 5px;

  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--tarefas-roxo) transparent;

  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 11px;

  background: var(--cor-superficie, #222);
}

.tarefas-page .tabs button {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 7px;

  padding: 10px 13px;
  border: 1px solid transparent;
  border-radius: 8px;

  background: transparent;
  color: var(--cor-texto-suave, #a3a3a3);

  white-space: nowrap;
  cursor: pointer;
  transition: 0.2s ease;
}

.tarefas-page .tabs button:hover {
  color: var(--cor-texto, #fff);
  background: var(--tarefas-roxo-suave);
}

.tarefas-page .tabs button.active {
  color: #fff;
  background: var(--tarefas-roxo);
  border-color: var(--tarefas-roxo);
}

.tarefas-page .tabs button ion-icon {
  font-size: 1.1rem;
}

/* =========================================
   PESQUISA
   ========================================= */

.tarefas-page .search-input {
  flex: 0 1 280px;
  width: 100%;
  min-width: 0;
  padding: 11px 14px;

  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 10px;

  background: var(--cor-superficie, #222);
  color: var(--cor-texto, #fff);
  outline: none;
}

.tarefas-page .search-input:focus {
  border-color: var(--tarefas-roxo);
  box-shadow: 0 0 0 3px var(--tarefas-roxo-suave);
}

/* =========================================
   MENSAGENS
   ========================================= */

.tarefas-page .notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  padding: 12px 15px;
  margin-bottom: 18px;

  border: 1px solid var(--tarefas-roxo-borda);
  border-radius: 10px;

  background: var(--tarefas-roxo-suave);
  color: var(--cor-texto, #fff);
}

.tarefas-page .notice button {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 1.4rem;
  cursor: pointer;
}

.tarefas-page .notice.erro {
  border-color: rgba(248, 113, 113, 0.5);
  background: rgba(248, 113, 113, 0.1);
}

.tarefas-page .notice.sucesso {
  border-color: var(--tarefas-roxo-borda);
}

.tarefas-page .state-message,
.tarefas-page .empty-state {
  padding: 24px;
  color: var(--cor-texto-suave, #a3a3a3);
  text-align: center;
}

/* =========================================
   KANBAN HORIZONTAL
   ========================================= */

.tarefas-page .kanban-wrapper {
  width: 100%;
  min-width: 0;
}

.tarefas-page .kanban-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;

  color: var(--cor-texto-suave, #a3a3a3);
  font-size: 0.82rem;
}

.tarefas-page .kanban-hint ion-icon {
  color: var(--tarefas-roxo);
  font-size: 1.1rem;
}

.tarefas-page .kanban-board {
  display: flex;
  align-items: stretch;
  gap: 16px;

  width: 100%;
  min-width: 0;
  padding: 4px 3px 16px;

  overflow-x: auto;
  overflow-y: hidden;

  scrollbar-width: thin;
  scrollbar-color: var(--tarefas-roxo) transparent;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
}

.tarefas-page .kanban-board::-webkit-scrollbar {
  height: 8px;
}

.tarefas-page .kanban-board::-webkit-scrollbar-thumb {
  border-radius: 20px;
  background: var(--tarefas-roxo);
}

.tarefas-page .kanban-board::-webkit-scrollbar-track {
  background: transparent;
}

.tarefas-page .kanban-board.is-dragging {
  cursor: grabbing;
  user-select: none;
}

/* =========================================
   COLUNAS
   ========================================= */

.tarefas-page .kanban-column {
  display: flex;
  flex: 0 0 300px;
  flex-direction: column;

  width: 300px;
  min-width: 0;
  min-height: 270px;
  padding: 15px;

  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 14px;

  background: var(--cor-superficie, #222);
  scroll-snap-align: start;

  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.tarefas-page .kanban-column.column-drop-active {
  border-color: var(--tarefas-roxo);
  background: var(--tarefas-roxo-suave);
  box-shadow: 0 0 0 2px var(--tarefas-roxo-borda);
}

.tarefas-page .column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  padding-bottom: 14px;
  margin-bottom: 14px;

  border-bottom: 1px solid var(--cor-borda, #3a3a3a);
}

.tarefas-page .column-title {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.tarefas-page .column-title h2 {
  margin: 0;
  color: var(--cor-texto, #f5f5f5);
  font-size: 0.98rem;
  font-weight: 750;
}

.tarefas-page .status-dot {
  flex: 0 0 9px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  box-shadow: 0 0 9px currentColor;
}

.tarefas-page .count {
  display: flex;
  align-items: center;
  justify-content: center;

  min-width: 28px;
  height: 28px;
  padding: 0 8px;

  border: 1px solid var(--tarefas-roxo-borda);
  border-radius: 8px;

  background: var(--tarefas-roxo-suave);
  color: var(--tarefas-roxo);
  font-size: 0.8rem;
  font-weight: 800;
}

/* =========================================
   CARTÕES
   ========================================= */

.tarefas-page .task-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  min-height: 120px;
}

.tarefas-page .task-card {
  min-width: 0;
  padding: 14px;

  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 11px;

  background: var(--cor-fundo, #171717);
  color: var(--cor-texto, #f5f5f5);

  overflow-wrap: anywhere;

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease,
    transform 0.2s ease;
}

.tarefas-page .task-card[draggable="true"] {
  cursor: grab;
}

.tarefas-page .task-card[draggable="true"]:active {
  cursor: grabbing;
}

.tarefas-page .task-card:hover {
  border-color: var(--tarefas-roxo-borda);
  box-shadow: 0 5px 18px rgba(168, 85, 247, 0.1);
}

.tarefas-page .task-card.task-dragging {
  opacity: 0.45;
  transform: scale(0.98);
}

.tarefas-page .task-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.tarefas-page .task-id {
  color: var(--tarefas-roxo);
  font-size: 0.78rem;
  font-weight: 800;
}

.tarefas-page .task-card h3 {
  margin: 0 0 9px;
  color: var(--cor-texto, #f5f5f5);
  font-size: 0.98rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.tarefas-page .task-description {
  margin: 0 0 12px;
  color: var(--cor-texto-suave, #a3a3a3);
  font-size: 0.86rem;
  line-height: 1.6;
}

.tarefas-page .task-note {
  margin-top: 10px;
  padding: 10px;

  border-left: 2px solid var(--tarefas-roxo);
  border-radius: 0 7px 7px 0;

  background: var(--tarefas-roxo-suave);
  color: var(--cor-texto-suave, #a3a3a3);

  font-size: 0.82rem;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.tarefas-page .task-date {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 13px;

  color: var(--cor-texto-suave, #a3a3a3);
  font-size: 0.8rem;
}

.tarefas-page .task-date ion-icon {
  color: var(--tarefas-roxo);
  font-size: 1.05rem;
}

/* =========================================
   CONTROLES DOS CARTÕES
   ========================================= */

.tarefas-page .icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 35px;
  height: 35px;
  flex: 0 0 auto;

  border: 1px solid transparent;
  border-radius: 9px;

  background: transparent;
  color: var(--cor-texto-suave, #a3a3a3);

  cursor: pointer;
  transition: 0.2s ease;
}

.tarefas-page .icon-button ion-icon {
  font-size: 1.15rem;
}

.tarefas-page .icon-button:hover {
  border-color: var(--tarefas-roxo-borda);
  background: var(--tarefas-roxo-suave);
  color: var(--tarefas-roxo);
}

.tarefas-page .task-actions {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;

  margin-top: 13px;
  padding-top: 12px;

  border-top: 1px solid var(--cor-borda, #3a3a3a);
}

.tarefas-page .status-select-label {
  display: flex;
  flex: 1 1 130px;
  flex-direction: column;
  gap: 6px;
  min-width: 0;

  color: var(--cor-texto-suave, #a3a3a3);
  font-size: 0.75rem;
}

.tarefas-page .status-select-label select {
  width: 100%;
  min-width: 0;
  padding: 8px;

  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 8px;

  background: var(--cor-superficie, #222);
  color: var(--cor-texto, #fff);
  font-size: 0.78rem;
  outline: none;
}

.tarefas-page .status-select-label select:focus {
  border-color: var(--tarefas-roxo);
  box-shadow: 0 0 0 2px var(--tarefas-roxo-suave);
}

.tarefas-page .delete-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;

  padding: 8px;

  border: 1px solid transparent;
  border-radius: 8px;

  background: transparent;
  color: #f87171;

  font-size: 0.78rem;
  cursor: pointer;
  transition: 0.2s ease;
}

.tarefas-page .delete-button:hover {
  border-color: rgba(248, 113, 113, 0.35);
  background: rgba(248, 113, 113, 0.1);
}

.tarefas-page .empty-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;

  min-height: 120px;
  padding: 16px;

  border: 1px dashed var(--cor-borda, #3a3a3a);
  border-radius: 10px;

  color: var(--cor-texto-suave, #a3a3a3);
  text-align: center;
  font-size: 0.82rem;
}

.tarefas-page .empty-column ion-icon {
  color: var(--tarefas-roxo);
  font-size: 1.5rem;
}

.tarefas-page .empty-column small {
  font-size: 0.72rem;
}

.tarefas-page .add-card-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  width: 100%;
  margin-top: 13px;
  padding: 10px;

  border: 1px dashed var(--tarefas-roxo-borda);
  border-radius: 9px;

  background: transparent;
  color: var(--tarefas-roxo);

  font-size: 0.85rem;
  cursor: pointer;
  transition: 0.2s ease;
}

.tarefas-page .add-card-button:hover {
  border-color: var(--tarefas-roxo);
  background: var(--tarefas-roxo-suave);
}

/* =========================================
   MODAL DE TAREFA
   ========================================= */

.tarefas-page .modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 20px;
  overflow-y: auto;

  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.tarefas-page .task-modal {
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;

  border: 1px solid var(--tarefas-roxo-borda);
  border-radius: 16px;

  background: var(--cor-superficie, #222);
  color: var(--cor-texto, #fff);

  box-shadow: 0 20px 70px rgba(0, 0, 0, 0.45);
}

.tarefas-page .modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 23px;
}

.tarefas-page .modal-header h2 {
  margin: 8px 0 0;
  color: var(--cor-texto, #fff);
  font-size: 1.4rem;
  font-weight: 800;
}

.tarefas-page .close-button:hover {
  color: var(--tarefas-roxo);
}

.tarefas-page .task-form {
  display: flex;
  flex-direction: column;
  gap: 17px;
}

.tarefas-page .task-form > label,
.tarefas-page .form-row > label {
  display: flex;
  flex-direction: column;
  gap: 8px;

  min-width: 0;

  color: var(--cor-texto, #f5f5f5);
  font-size: 0.87rem;
  font-weight: 650;
}

.tarefas-page .task-form input,
.tarefas-page .task-form select,
.tarefas-page .task-form textarea {
  width: 100%;
  min-width: 0;
  padding: 11px 12px;

  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 9px;

  background: var(--cor-fundo, #171717);
  color: var(--cor-texto, #fff);

  font: inherit;
  font-size: 0.88rem;
  outline: none;
  transition: 0.2s ease;
}

.tarefas-page .task-form input:focus,
.tarefas-page .task-form select:focus,
.tarefas-page .task-form textarea:focus {
  border-color: var(--tarefas-roxo);
  box-shadow: 0 0 0 3px var(--tarefas-roxo-suave);
}

.tarefas-page .task-form textarea {
  resize: vertical;
  line-height: 1.6;
}

.tarefas-page .task-form input::placeholder,
.tarefas-page .task-form textarea::placeholder {
  color: var(--cor-texto-suave, #a3a3a3);
}

.tarefas-page .form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 13px;
}

.tarefas-page .form-hint {
  margin: 0;
  color: var(--cor-texto-suave, #a3a3a3);
  font-size: 0.78rem;
  line-height: 1.5;
}

.tarefas-page .modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;

  padding-top: 17px;
  border-top: 1px solid var(--cor-borda, #3a3a3a);
}

/* =========================================
   AGENDA
   ========================================= */

.tarefas-page .agenda-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  align-items: start;
  gap: 20px;
}

.tarefas-page .calendar-panel,
.tarefas-page .agenda-list {
  min-width: 0;
  padding: 18px;

  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 13px;

  background: var(--cor-superficie, #222);
}

.tarefas-page .calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 18px;
}

.tarefas-page .calendar-header h2 {
  margin: 0;
  color: var(--cor-texto, #fff);
  font-size: 1rem;
  text-transform: capitalize;
  text-align: center;
}

.tarefas-page .calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 5px;
}

.tarefas-page .weekday {
  padding: 9px 0;
  color: var(--cor-texto-suave, #a3a3a3);
  font-size: 0.75rem;
  text-align: center;
}

.tarefas-page .calendar-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;

  min-width: 0;
  min-height: 48px;
  padding: 5px;

  border: 1px solid transparent;
  border-radius: 8px;

  background: var(--cor-fundo, #171717);
  color: var(--cor-texto, #fff);

  cursor: pointer;
  transition: 0.2s ease;
}

.tarefas-page .calendar-day:disabled {
  background: transparent;
  cursor: default;
}

.tarefas-page .calendar-day:not(:disabled):hover,
.tarefas-page .calendar-day.selected {
  border-color: var(--tarefas-roxo);
  background: var(--tarefas-roxo-suave);
  color: var(--tarefas-roxo-claro);
}

.tarefas-page .calendar-day.has-tasks:not(.selected) {
  border-color: var(--tarefas-roxo-borda);
}

.tarefas-page .calendar-day small {
  color: var(--tarefas-roxo);
  font-size: 0.68rem;
  font-weight: 800;
}

.tarefas-page .agenda-list > h2 {
  margin: 9px 0 18px;
  color: var(--cor-texto, #fff);
  font-size: 1.2rem;
}

.tarefas-page .agenda-task {
  display: flex;
  align-items: flex-start;
  gap: 12px;

  padding: 14px 0;
  border-bottom: 1px solid var(--cor-borda, #3a3a3a);
}

.tarefas-page .agenda-task:last-of-type {
  border-bottom: 0;
}

.tarefas-page .agenda-marker {
  flex: 0 0 4px;
  align-self: stretch;
  min-height: 48px;
  border-radius: 5px;
  background: var(--tarefas-roxo);
}

.tarefas-page .agenda-marker.status-1 {
  background: #A855F7;
}

.tarefas-page .agenda-marker.status-2 {
  background: #F59E0B;
}

.tarefas-page .agenda-marker.status-3 {
  background: #22C55E;
}

.tarefas-page .agenda-task-content {
  flex: 1;
  min-width: 0;
}

.tarefas-page .agenda-task h3 {
  margin: 0 0 6px;
  color: var(--cor-texto, #fff);
  font-size: 0.93rem;
}

.tarefas-page .agenda-task p,
.tarefas-page .agenda-task-content > span {
  display: block;
  margin: 0 0 6px;
  color: var(--cor-texto-suave, #a3a3a3);
  font-size: 0.8rem;
  line-height: 1.5;
}

/* =========================================
   ANOTAÇÕES
   ========================================= */

.tarefas-page .section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.tarefas-page .section-heading h2 {
  margin: 0;
  color: var(--cor-texto, #fff);
  font-size: 1.25rem;
}

.tarefas-page .section-heading p {
  margin: 7px 0 0;
  color: var(--cor-texto-suave, #a3a3a3);
  font-size: 0.87rem;
}

.tarefas-page .notes-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px;
}

.tarefas-page .note-card {
  min-width: 0;
  padding: 18px;

  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 13px;

  background: var(--cor-superficie, #222);
  transition: border-color 0.2s ease;
}

.tarefas-page .note-card:hover {
  border-color: var(--tarefas-roxo-borda);
}

.tarefas-page .note-label {
  color: var(--tarefas-roxo);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.8px;
}

.tarefas-page .note-card h3 {
  margin: 11px 0 8px;
  color: var(--cor-texto, #fff);
  font-size: 1rem;
}

.tarefas-page .note-card p,
.tarefas-page .note-body {
  color: var(--cor-texto-suave, #a3a3a3);
  font-size: 0.87rem;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.tarefas-page .note-body {
  margin-top: 12px;
  padding: 12px;

  border-left: 2px solid var(--tarefas-roxo);
  border-radius: 0 7px 7px 0;
  background: var(--tarefas-roxo-suave);
}

.tarefas-page .note-card footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;

  margin-top: 16px;
  padding-top: 12px;

  border-top: 1px solid var(--cor-borda, #3a3a3a);
  color: var(--cor-texto-suave, #a3a3a3);
  font-size: 0.8rem;
}

.tarefas-page .text-button {
  padding: 5px;
  border: 0;
  background: transparent;
  color: var(--tarefas-roxo);
  cursor: pointer;
}

.tarefas-page .text-button:hover {
  color: var(--tarefas-roxo-claro);
}

/* =========================================
   ATIVIDADES
   ========================================= */

.tarefas-page .activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tarefas-page .activity-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;

  min-width: 0;
  padding: 16px;

  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 12px;

  background: var(--cor-superficie, #222);
  transition: border-color 0.2s ease;
}

.tarefas-page .activity-card:hover {
  border-color: var(--tarefas-roxo-borda);
}

.tarefas-page .activity-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 40px;

  width: 40px;
  height: 40px;

  border-radius: 11px;
  background: var(--tarefas-roxo-suave);
  color: var(--tarefas-roxo);
  font-size: 1.25rem;
}

.tarefas-page .activity-main {
  flex: 1;
  min-width: 0;
}

.tarefas-page .activity-main h3 {
  margin: 0 0 7px;
  color: var(--cor-texto, #fff);
  font-size: 0.95rem;
}

.tarefas-page .activity-main p,
.tarefas-page .activity-main span {
  display: block;
  margin: 0 0 7px;
  color: var(--cor-texto-suave, #a3a3a3);
  font-size: 0.82rem;
  line-height: 1.5;
}

.tarefas-page .activity-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.tarefas-page .status-pill {
  display: inline-flex;
  padding: 6px 9px;
  border-radius: 7px;

  background: var(--tarefas-roxo-suave);
  color: var(--tarefas-roxo-claro);
  font-size: 0.75rem;
  white-space: nowrap;
}

.tarefas-page .pill-2 {
  background: rgba(245, 158, 11, 0.12);
  color: #FBBF24;
}

.tarefas-page .pill-3 {
  background: rgba(34, 197, 94, 0.12);
  color: #4ADE80;
}

/* =========================================
   ERROS
   ========================================= */

.tarefas-page .error-panel {
  padding: 22px;
  border: 1px solid rgba(248, 113, 113, 0.35);
  border-radius: 12px;
  background: rgba(248, 113, 113, 0.06);
}

.tarefas-page .error-panel h2 {
  color: #FCA5A5;
  font-size: 1.05rem;
}

.tarefas-page .error-panel p {
  color: var(--cor-texto-suave, #a3a3a3);
}

/* =========================================
   FOCO E ACESSIBILIDADE
   ========================================= */

.tarefas-page button:focus-visible,
.tarefas-page input:focus-visible,
.tarefas-page select:focus-visible,
.tarefas-page textarea:focus-visible {
  outline: 2px solid var(--tarefas-roxo);
  outline-offset: 2px;
}

/* =========================================
   TABLETS
   ========================================= */

@media (max-width: 900px) {
  .tarefas-page .kanban-column {
    flex-basis: 280px;
    width: 280px;
  }

  .tarefas-page .agenda-layout {
    grid-template-columns: 1fr;
  }

  .tarefas-page .toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .tarefas-page .search-input {
    flex: 1 1 auto;
  }
}

/* =========================================
   CELULARES
   ========================================= */

@media (max-width: 600px) {
  .tarefas-page .page-header {
    align-items: stretch;
    flex-direction: column;
    gap: 14px;
  }

  .tarefas-page .page-header h1 {
    font-size: 1.5rem;
  }

  .tarefas-page .page-header > .primary-button {
    width: 100%;
  }

  .tarefas-page .stats {
    grid-template-columns: 1fr;
    gap: 9px;
  }

  .tarefas-page .stat-card {
    padding: 13px 15px;
  }

  .tarefas-page .stat-card strong {
    font-size: 1.45rem;
  }

  .tarefas-page .tabs {
    width: 100%;
  }

  .tarefas-page .tabs button {
    padding: 9px 11px;
    font-size: 0.82rem;
  }

  .tarefas-page .kanban-board {
    gap: 12px;
    scroll-snap-type: x mandatory;
  }

  .tarefas-page .kanban-column {
    flex: 0 0 min(84vw, 310px);
    width: min(84vw, 310px);
    min-height: 230px;
    padding: 12px;
  }

  .tarefas-page .task-card {
    padding: 12px;
  }

  .tarefas-page .task-actions {
    align-items: stretch;
  }

  .tarefas-page .status-select-label {
    flex-basis: 100%;
  }

  .tarefas-page .delete-button {
    justify-content: flex-start;
  }

  .tarefas-page .modal-backdrop {
    align-items: flex-end;
    padding: 0;
  }

  .tarefas-page .task-modal {
    width: 100%;
    max-width: none;
    max-height: 92dvh;
    padding: 20px 16px;
    border-radius: 18px 18px 0 0;
  }

  .tarefas-page .form-row {
    grid-template-columns: 1fr;
  }

  .tarefas-page .modal-actions {
    flex-direction: column-reverse;
  }

  .tarefas-page .modal-actions button {
    width: 100%;
  }

  .tarefas-page .notes-grid {
    grid-template-columns: 1fr;
  }

  .tarefas-page .activity-card {
    flex-wrap: wrap;
  }

  .tarefas-page .activity-status {
    width: 100%;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding-left: 54px;
  }

  .tarefas-page .calendar-panel,
  .tarefas-page .agenda-list {
    padding: 12px;
  }

  .tarefas-page .calendar-grid {
    gap: 3px;
  }

  .tarefas-page .calendar-day {
    min-height: 40px;
    padding: 3px;
    font-size: 0.8rem;
  }

  .tarefas-page .weekday {
    font-size: 0.68rem;
  }
}

@media (max-width: 360px) {
  .tarefas-page .kanban-column {
    flex-basis: 88vw;
    width: 88vw;
  }

  .tarefas-page .task-modal {
    padding: 17px 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tarefas-page *,
  .tarefas-page *::before,
  .tarefas-page *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
</style>