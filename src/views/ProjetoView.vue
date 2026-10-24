
<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import { useTaskflowStore } from '@/stores/taskflow'
import '@/assets/taskflow.css'

const taskflow = useTaskflowStore()
const { resumoProjetos } = storeToRefs(taskflow)

const novoProjeto = ref('')
const mensagem = ref('')

function criarProjeto() {
  mensagem.value = ''

  const nome = novoProjeto.value.trim()

  if (!nome) {
    mensagem.value = 'Digite o nome do projeto.'
    return
  }

  const id = taskflow.criarProjeto(nome)

  if (!id) {
    mensagem.value = 'Esse projeto já existe.'
    return
  }

  novoProjeto.value = ''
  mensagem.value = 'Projeto criado com sucesso!'
}
</script>

<template>
  <main class="tf-page">
    <header class="tf-page-header">
      <div>
        <span class="tf-eyebrow">ORGANIZAÇÃO</span>
        <h1>Meus projetos</h1>
        <p>Organize seus projetos e acompanhe suas tarefas.</p>
      </div>

      <RouterLink to="/" class="tf-button tf-button-secondary">
        <ion-icon name="arrow-back-outline"></ion-icon>
        Voltar ao início
      </RouterLink>
    </header>

    <form class="tf-create-project" @submit.prevent="criarProjeto">
      <label for="nomeProjeto">Criar novo projeto</label>

      <div class="tf-form-row">
        <input
          id="nomeProjeto"
          v-model="novoProjeto"
          type="text"
          placeholder="Ex.: Trabalho de informática"
          maxlength="80"
        />

        <button type="submit" class="tf-button">
          <ion-icon name="add-outline"></ion-icon>
          Criar projeto
        </button>
      </div>

      <p v-if="mensagem" class="tf-message" aria-live="polite">
        {{ mensagem }}
      </p>
    </form>

    <section class="tf-project-grid">
      <article
        v-for="projeto in resumoProjetos"
        :key="projeto.id"
        class="tf-project-card"
      >
        <div class="tf-project-heading">
          <span
            class="tf-project-dot"
            :style="{ backgroundColor: projeto.color }"
          ></span>

          <h2>{{ projeto.name }}</h2>
        </div>

        <p class="tf-project-description">
          {{ projeto.total }}
          {{ projeto.total === 1 ? 'tarefa' : 'tarefas' }}
          cadastradas
        </p>

        <div class="tf-progress-info">
          <span>Progresso</span>
          <strong>{{ projeto.porcentagem }}%</strong>
        </div>

        <div
          class="tf-progress-track"
          role="progressbar"
          :aria-valuenow="projeto.porcentagem"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="`Progresso de ${projeto.name}`"
        >
          <div
            class="tf-progress-fill"
            :style="{
              width: `${projeto.porcentagem}%`,
              backgroundColor: projeto.color
            }"
          ></div>
        </div>

        <div class="tf-project-stats">
          <span>
            <ion-icon name="checkmark-circle-outline"></ion-icon>
            {{ projeto.feitas }} concluídas
          </span>

          <span>
            <ion-icon name="time-outline"></ion-icon>
            {{ projeto.pendentes }} pendentes
          </span>
        </div>

        <RouterLink
          :to="{ path: '/', query: { projeto: projeto.id } }"
          class="tf-project-link"
        >
          Ver tarefas
          <ion-icon name="arrow-forward-outline"></ion-icon>
        </RouterLink>
      </article>

      <div v-if="resumoProjetos.length === 0" class="tf-empty">
        <ion-icon name="folder-open-outline"></ion-icon>
        <h2>Nenhum projeto cadastrado</h2>
        <p>Crie seu primeiro projeto usando o formulário acima.</p>
      </div>
    </section>
  </main>
</template>
