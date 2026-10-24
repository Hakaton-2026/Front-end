
<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useTaskflowStore } from '@/stores/taskflow'
import '@/assets/taskflow.css'

const route = useRoute()
const authStore = useAuthStore()
const taskflow = useTaskflowStore()

const {
  tarefas,
  projetos,
  totalConcluidas,
  totalPendentes,
  resumoProjetos
} = storeToRefs(taskflow)

const tituloTarefa = ref('')
const projetoSelecionado = ref('')
const mensagem = ref('')

const nomeUsuario = computed(
  () => authStore.user?.name ||
    authStore.user?.nome ||
    'Usuário'
)

const projetoFiltro = computed(
  () => String(route.query.projeto || '')
)

const tarefasFiltradas = computed(() => {
  if (!projetoFiltro.value) return tarefas.value

  return tarefas.value.filter(
    tarefa => tarefa.p === projetoFiltro.value
  )
})

const tituloFiltro = computed(() => {
  if (!projetoFiltro.value) return 'Todas as tarefas'

  return taskflow.nomeDoProjeto(projetoFiltro.value)
})

watch(
  projetos,
  lista => {
    if (
      !lista.some(p => p.id === projetoSelecionado.value)
    ) {
      projetoSelecionado.value = lista[0]?.id || ''
    }
  },
  { immediate: true, deep: true }
)

function adicionarTarefa() {
  mensagem.value = ''

  if (!tituloTarefa.value.trim()) {
    mensagem.value = 'Digite o nome da tarefa.'
    return
  }

  if (!projetoSelecionado.value) {
    mensagem.value = 'Crie um projeto antes de adicionar tarefas.'
    return
  }

  const sucesso = taskflow.adicionarTarefa({
    titulo: tituloTarefa.value,
    projetoId: projetoSelecionado.value
  })

  if (sucesso) {
    tituloTarefa.value = ''
    mensagem.value = 'Tarefa adicionada!'
  } else {
    mensagem.value = 'Não foi possível adicionar a tarefa.'
  }
}

function excluirTarefa(id) {
  const confirmar = window.confirm(
    'Tem certeza de que deseja excluir esta tarefa?'
  )

  if (confirmar) {
    taskflow.excluirTarefa(id)
  }
}
</script>

<template>
  <main class="tf-page">
    <header class="tf-page-header">
      <div>
        <span class="tf-eyebrow">SEU ESPAÇO DE ORGANIZAÇÃO</span>
        <h1>Olá, {{ nomeUsuario }}!</h1>
        <p>Vamos organizar suas tarefas de hoje?</p>
      </div>

      <RouterLink to="/projetos" class="tf-button">
        <ion-icon name="folder-open-outline"></ion-icon>
        Meus projetos
      </RouterLink>
    </header>

    <section class="tf-stats-grid">
      <article class="tf-stat-card">
        <span class="tf-stat-icon">
          <ion-icon name="list-outline"></ion-icon>
        </span>
        <div>
          <p>Total de tarefas</p>
          <strong>{{ tarefas.length }}</strong>
        </div>
      </article>

      <article class="tf-stat-card">
        <span class="tf-stat-icon tf-stat-green">
          <ion-icon name="checkmark-circle-outline"></ion-icon>
        </span>
        <div>
          <p>Concluídas</p>
          <strong>{{ totalConcluidas }}</strong>
        </div>
      </article>

      <article class="tf-stat-card">
        <span class="tf-stat-icon tf-stat-blue">
          <ion-icon name="time-outline"></ion-icon>
        </span>
        <div>
          <p>Pendentes</p>
          <strong>{{ totalPendentes }}</strong>
        </div>
      </article>
    </section>

    <section class="tf-task-panel">
      <div class="tf-section-heading">
        <div>
          <h2>Adicionar tarefa</h2>
          <p>Escolha o projeto e descreva o que precisa fazer.</p>
        </div>
      </div>

      <form class="tf-create-task" @submit.prevent="adicionarTarefa">
        <input
          v-model="tituloTarefa"
          type="text"
          placeholder="Ex.: Terminar o trabalho"
          maxlength="160"
        />

        <select v-model="projetoSelecionado">
          <option value="" disabled>Selecione um projeto</option>
          <option
            v-for="projeto in projetos"
            :key="projeto.id"
            :value="projeto.id"
          >
            {{ projeto.name }}
          </option>
        </select>

        <button type="submit" class="tf-button">
          <ion-icon name="add-outline"></ion-icon>
          Adicionar
        </button>
      </form>

      <p v-if="mensagem" class="tf-message" aria-live="polite">
        {{ mensagem }}
      </p>
    </section>

    <section class="tf-task-panel">
      <div class="tf-section-heading">
        <div>
          <h2>{{ tituloFiltro }}</h2>
          <p>Acompanhe suas atividades.</p>
        </div>

        <RouterLink
          v-if="projetoFiltro"
          to="/"
          class="tf-text-link"
        >
          Limpar filtro
        </RouterLink>
      </div>

      <div v-if="tarefasFiltradas.length" class="tf-task-list">
        <article
          v-for="tarefa in tarefasFiltradas"
          :key="tarefa.id"
          class="tf-task-item"
          :class="{ 'tf-task-done': tarefa.done }"
        >
          <label class="tf-task-label">
            <input
              type="checkbox"
              :checked="tarefa.done"
              @change="taskflow.alternarTarefa(tarefa.id)"
            />

            <span class="tf-task-check"></span>

            <span class="tf-task-content">
              <strong>{{ tarefa.title }}</strong>
              <small>{{ taskflow.nomeDoProjeto(tarefa.p) }}</small>
            </span>
          </label>

          <button
            type="button"
            class="tf-delete"
            :aria-label="`Excluir tarefa ${tarefa.title}`"
            title="Excluir tarefa"
            @click="excluirTarefa(tarefa.id)"
          >
            <ion-icon name="trash-outline"></ion-icon>
          </button>
        </article>
      </div>

      <div v-else class="tf-empty">
        <ion-icon name="clipboard-outline"></ion-icon>
        <h2>Nenhuma tarefa encontrada</h2>
        <p>Adicione uma tarefa ou escolha outro projeto.</p>
      </div>
    </section>

    <section class="tf-task-panel">
      <div class="tf-section-heading">
        <div>
          <h2>Progresso dos projetos</h2>
          <p>Veja quanto já foi concluído em cada projeto.</p>
        </div>
      </div>

      <div class="tf-project-progress-list">
        <article
          v-for="projeto in resumoProjetos"
          :key="projeto.id"
          class="tf-project-progress"
        >
          <div class="tf-progress-info">
            <span>{{ projeto.name }}</span>
            <strong>{{ projeto.porcentagem }}%</strong>
          </div>

          <div class="tf-progress-track">
            <div
              class="tf-progress-fill"
              :style="{
                width: `${projeto.porcentagem}%`,
                backgroundColor: projeto.color
              }"
            ></div>
          </div>

          <RouterLink
            :to="{ path: '/', query: { projeto: projeto.id } }"
            class="tf-text-link"
          >
            Ver tarefas
          </RouterLink>
        </article>
      </div>
    </section>
  </main>
</template>
