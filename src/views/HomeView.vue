<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import projetosApi from '@/api/projetosApi'
import tarefasApi from '@/api/tarefasApi'
import '@/assets/taskflow.css'

const route = useRoute()
const authStore = useAuthStore()

const projetosApiLista = ref([])
const tarefasApiLista = ref([])
const loading = ref(false)
const salvando = ref(false)
const erro = ref('')

const tituloTarefa = ref('')
const projetoSelecionado = ref('')
const mensagem = ref('')

function extrairLista(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.projetos)) return data.projetos
  if (Array.isArray(data?.tarefas)) return data.tarefas
  return []
}

function mensagemErro(error, padrao) {
  if (typeof error?.mensagem === 'string' && error.mensagem) {
    return error.mensagem
  }

  const dados = error?.response?.data

  if (typeof dados === 'string') return dados
  if (typeof dados?.detail === 'string') return dados.detail
  if (typeof dados?.mensagem === 'string') return dados.mensagem
  if (typeof dados?.message === 'string') return dados.message

  if (dados && typeof dados === 'object') {
    const erros = Object.entries(dados).map(([campo, valor]) => {
      const texto = Array.isArray(valor)
        ? valor.join(', ')
        : String(valor)

      return `${campo}: ${texto}`
    })

    if (erros.length) return erros.join('\n')
  }

  return error?.message || padrao
}

function dataHoje() {
  const data = new Date()
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}

const nomeUsuario = computed(
  () => authStore.user?.name || authStore.user?.nome || 'Usuário',
)

const projetos = computed(() =>
  projetosApiLista.value.map((projeto) => ({
    ...projeto,
    name: projeto.nome || projeto.name || 'Projeto sem nome',
    description: projeto.descricao || projeto.description || '',
  })),
)

// Normaliza apenas para a apresentação da tela.
// A API continua recebendo e devolvendo os nomes originais dos campos.
const tarefas = computed(() =>
  tarefasApiLista.value.map((tarefa) => ({
    ...tarefa,
    title: tarefa.titulo || tarefa.title || 'Tarefa sem título',
    p: tarefa.projeto == null ? '' : String(tarefa.projeto),
    done: Number(tarefa.situacao) === 3 || tarefa.done === true,
  })),
)

const totalConcluidas = computed(
  () =>
    tarefasApiLista.value.filter(
      (tarefa) => Number(tarefa.situacao) === 3,
    ).length,
)

const totalPendentes = computed(
  () => tarefas.value.length - totalConcluidas.value,
)

const projetoFiltro = computed(
  () => String(route.query.projeto || ''),
)

const tarefasFiltradas = computed(() => {
  if (!projetoFiltro.value) return tarefas.value

  return tarefas.value.filter(
    (tarefa) => tarefa.p === projetoFiltro.value,
  )
})

const tituloFiltro = computed(() => {
  if (!projetoFiltro.value) return 'Todas as tarefas'

  return nomeDoProjeto(projetoFiltro.value)
})

const resumoProjetos = computed(() =>
  projetos.value.map((projeto) => {
    const tarefasProjeto = tarefasApiLista.value.filter(
      (tarefa) =>
        String(tarefa.projeto ?? '') === String(projeto.id),
    )

    const feitas = tarefasProjeto.filter(
      (tarefa) => Number(tarefa.situacao) === 3,
    ).length

    const total = tarefasProjeto.length

    return {
      ...projeto,
      total,
      feitas,
      pendentes: total - feitas,
      porcentagem: total
        ? Math.round((feitas / total) * 100)
        : 0,
    }
  }),
)

function nomeDoProjeto(id) {
  return (
    projetos.value.find(
      (projeto) => String(projeto.id) === String(id),
    )?.name || 'Projeto removido'
  )
}

watch(
  projetos,
  (lista) => {
    if (
      !lista.some(
        (projeto) =>
          String(projeto.id) === String(projetoSelecionado.value),
      )
    ) {
      projetoSelecionado.value = lista[0]
        ? String(lista[0].id)
        : ''
    }
  },
  { immediate: true },
)

async function carregarDados() {
  erro.value = ''

  if (!authStore.isAuthenticated) {
    erro.value = 'Faça login para carregar seus projetos e tarefas.'
    projetosApiLista.value = []
    tarefasApiLista.value = []
    return
  }

  loading.value = true

  try {
    if (!authStore.user) {
      await authStore.fetchUser()
    }

    const [respostaProjetos, respostaTarefas] = await Promise.all([
      projetosApi.obterTodos(),
      tarefasApi.obterTodos({ page_size: 100 }),
    ])

    projetosApiLista.value = extrairLista(respostaProjetos.data)
    tarefasApiLista.value = extrairLista(respostaTarefas.data)
  } catch (error) {
    erro.value = mensagemErro(
      error,
      'Não foi possível carregar os dados do servidor.',
    )
  } finally {
    loading.value = false
  }
}

async function adicionarTarefa() {
  mensagem.value = ''
  erro.value = ''

  const titulo = tituloTarefa.value.trim()

  if (!titulo) {
    mensagem.value = 'Digite o nome da tarefa.'
    return
  }

  if (titulo.length > 45) {
    mensagem.value =
      'O nome da tarefa deve ter no máximo 45 caracteres.'
    return
  }

  if (!projetoSelecionado.value) {
    mensagem.value =
      'Crie um projeto antes de adicionar tarefas.'
    return
  }

  salvando.value = true

  try {
    const hoje = dataHoje()

    await tarefasApi.criar({
      titulo,
      descricao: '',
      situacao: 1,
      prioridade: 1,
      prazoInicio: hoje,
      prazoFim: hoje,
      projeto: Number(projetoSelecionado.value),
    })

    tituloTarefa.value = ''
    mensagem.value = 'Tarefa adicionada com sucesso!'

    await carregarDados()
  } catch (error) {
    mensagem.value = mensagemErro(
      error,
      'Não foi possível adicionar a tarefa.',
    )
  } finally {
    salvando.value = false
  }
}

async function excluirTarefa(id) {
  const confirmar = window.confirm(
    'Tem certeza de que deseja excluir esta tarefa?',
  )

  if (!confirmar) return

  erro.value = ''

  try {
    await tarefasApi.deletar(id)

    tarefasApiLista.value = tarefasApiLista.value.filter(
      (tarefa) => String(tarefa.id) !== String(id),
    )
  } catch (error) {
    erro.value = mensagemErro(
      error,
      'Não foi possível excluir a tarefa.',
    )
  }
}

async function alternarTarefa(id) {
  const tarefa = tarefasApiLista.value.find(
    (item) => String(item.id) === String(id),
  )

  if (!tarefa) return

  erro.value = ''

  const novaSituacao =
    Number(tarefa.situacao) === 3 ? 1 : 3

  try {
    const resposta = await tarefasApi.atualizarParcialmente(
      id,
      { situacao: novaSituacao },
    )

    const atualizada = resposta.data

    const indice = tarefasApiLista.value.findIndex(
      (item) => String(item.id) === String(id),
    )

    if (indice !== -1) {
      tarefasApiLista.value.splice(indice, 1, {
        ...tarefa,
        ...atualizada,
      })
    }
  } catch (error) {
    erro.value = mensagemErro(
      error,
      'Não foi possível atualizar o status da tarefa.',
    )
  }
}

onMounted(carregarDados)
</script>

<template>
  <main class="tf-page">
    <header class="tf-page-header">
      <div>
        <span class="tf-eyebrow">
          SEU ESPAÇO DE ORGANIZAÇÃO
        </span>

        <h1>Olá, {{ nomeUsuario }}!</h1>

        <p>Vamos organizar suas tarefas de hoje?</p>
      </div>

      <RouterLink to="/projetos" class="tf-button">
        <ion-icon name="folder-open-outline"></ion-icon>
        Meus projetos
      </RouterLink>
    </header>

    <p
      v-if="erro"
      class="tf-message tf-message-erro"
      role="alert"
    >
      {{ erro }}
    </p>

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
          <p>
            Escolha o projeto e descreva o que precisa fazer.
          </p>
        </div>
      </div>

      <form
        class="tf-create-task"
        @submit.prevent="adicionarTarefa"
      >
        <input
          v-model="tituloTarefa"
          type="text"
          placeholder="Ex.: Terminar o trabalho"
          maxlength="45"
          aria-label="Nome da tarefa"
        />

        <select
          v-model="projetoSelecionado"
          aria-label="Selecionar projeto"
        >
          <option value="" disabled>
            Selecione um projeto
          </option>

          <option
            v-for="projeto in projetos"
            :key="projeto.id"
            :value="String(projeto.id)"
          >
            {{ projeto.name }}
          </option>
        </select>

        <button
          type="submit"
          class="tf-button"
          :disabled="salvando || loading || !projetos.length"
        >
          <ion-icon name="add-outline"></ion-icon>
          {{ salvando ? 'Adicionando...' : 'Adicionar' }}
        </button>
      </form>

      <p
        v-if="mensagem"
        class="tf-message"
        aria-live="polite"
      >
        {{ mensagem }}
      </p>

      <p
        v-if="loading"
        class="tf-message"
        aria-live="polite"
      >
        Carregando dados do servidor...
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
          <ion-icon name="close-circle-outline"></ion-icon>
          Limpar filtro
        </RouterLink>
      </div>

      <div
        v-if="tarefasFiltradas.length"
        class="tf-task-list"
      >
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
              @change="alternarTarefa(tarefa.id)"
            />

            <span class="tf-task-check"></span>

            <span class="tf-task-content">
              <strong>{{ tarefa.title }}</strong>
              <small>{{ nomeDoProjeto(tarefa.p) }}</small>
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

        <h2>
          {{ loading ? 'Carregando tarefas...' : 'Nenhuma tarefa encontrada' }}
        </h2>

        <p>
          Adicione uma tarefa ou escolha outro projeto.
        </p>
      </div>
    </section>

    <section class="tf-task-panel">
      <div class="tf-section-heading">
        <div>
          <h2>Progresso dos projetos</h2>
          <p>
            Veja quanto já foi concluído em cada projeto.
          </p>
        </div>

        <RouterLink
          to="/projetos"
          class="tf-text-link"
        >
          Ver projetos
          <ion-icon name="arrow-forward-outline"></ion-icon>
        </RouterLink>
      </div>

      <div
        v-if="resumoProjetos.length"
        class="tf-project-progress-list"
      >
        <article
          v-for="projeto in resumoProjetos"
          :key="projeto.id"
          class="tf-project-progress"
        >
          <div class="tf-progress-info">
            <span>{{ projeto.name }}</span>
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
              :style="{ width: `${projeto.porcentagem}%` }"
            ></div>
          </div>

          <RouterLink
            :to="{ path: '/', query: { projeto: projeto.id } }"
            class="tf-text-link"
          >
            Ver tarefas
            <ion-icon name="arrow-forward-outline"></ion-icon>
          </RouterLink>
        </article>
      </div>

      <div v-else class="tf-empty">
        <ion-icon name="folder-open-outline"></ion-icon>

        <h2>Nenhum projeto criado</h2>

        <p>
          Crie seu primeiro projeto para acompanhar o progresso.
        </p>

        <RouterLink
          to="/projetos"
          class="tf-button"
        >
          <ion-icon name="add-outline"></ion-icon>
          Criar projeto
        </RouterLink>
      </div>
    </section>
  </main>
</template>