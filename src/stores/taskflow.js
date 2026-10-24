
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

const CHAVE = 'taskflow-home-v1'

const DADOS_INICIAIS = {
  projects: [
    { id: 'p1', name: 'Site BabyCare', color: '#A855F7' },
    { id: 'p2', name: 'Estudos', color: '#38BDF8' },
    { id: 'p3', name: 'Tarefas pessoais', color: '#22C55E' },
  ],
  tasks: [
    {
      id: 't1',
      title: 'Criar layout da página inicial',
      p: 'p1',
      done: true,
    },
    {
      id: 't2',
      title: 'Configurar API de autenticação',
      p: 'p1',
      done: false,
    },
    {
      id: 't3',
      title: 'Revisar conteúdos da semana',
      p: 'p2',
      done: false,
    },
    {
      id: 't4',
      title: 'Organizar o ambiente de trabalho',
      p: 'p3',
      done: false,
    },
  ],
}

function gerarId() {
  return `i${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

function carregar() {
  try {
    const bruto = localStorage.getItem(CHAVE)

    if (bruto) {
      const dados = JSON.parse(bruto)

      if (
        Array.isArray(dados.projects) &&
        Array.isArray(dados.tasks)
      ) {
        return {
          projects: dados.projects.filter(
            (p) =>
              p &&
              typeof p.id === 'string' &&
              typeof p.name === 'string'
          ),
          tasks: dados.tasks.filter(
            (t) =>
              t &&
              typeof t.id === 'string' &&
              typeof t.title === 'string' &&
              typeof t.p === 'string'
          ),
        }
      }
    }
  } catch (erro) {
    console.error('Erro ao carregar tarefas:', erro)
  }

  return JSON.parse(JSON.stringify(DADOS_INICIAIS))
}

export const useTaskflowStore = defineStore('taskflow', () => {
  const inicial = carregar()

  const projetos = ref(inicial.projects)
  const tarefas = ref(inicial.tasks)

  // Salva automaticamente quando projetos ou tarefas mudam.
  watch(
    [projetos, tarefas],
    () => {
      try {
        localStorage.setItem(
          CHAVE,
          JSON.stringify({
            projects: projetos.value,
            tasks: tarefas.value,
          })
        )
      } catch (erro) {
        console.error('Erro ao salvar tarefas:', erro)
      }
    },
    { deep: true }
  )

  const totalConcluidas = computed(
    () => tarefas.value.filter((tarefa) => tarefa.done).length
  )

  const totalPendentes = computed(
    () => tarefas.value.filter((tarefa) => !tarefa.done).length
  )

  const resumoProjetos = computed(() =>
    projetos.value.map((projeto) => {
      const tarefasProjeto = tarefas.value.filter(
        (tarefa) => tarefa.p === projeto.id
      )

      const feitas = tarefasProjeto.filter(
        (tarefa) => tarefa.done
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
    })
  )

  function nomeDoProjeto(id) {
    return (
      projetos.value.find((projeto) => projeto.id === id)?.name ||
      'Projeto removido'
    )
  }

  function criarProjeto(nome) {
    const limpo = String(nome ?? '').trim()

    if (!limpo) return null

    const existe = projetos.value.some(
      (projeto) =>
        projeto.name.toLowerCase() === limpo.toLowerCase()
    )

    if (existe) return null

    const id = gerarId()

    projetos.value.push({
      id,
      name: limpo,
      color: '#A855F7',
    })

    return id
  }

  function adicionarTarefa({ titulo, projetoId }) {
    const limpo = String(titulo ?? '').trim()

    const projetoExiste = projetos.value.some(
      (projeto) => projeto.id === projetoId
    )

    if (!limpo || !projetoExiste) return false

    tarefas.value.push({
      id: gerarId(),
      title: limpo,
      p: projetoId,
      done: false,
    })

    return true
  }

  function alternarTarefa(id) {
    const tarefa = tarefas.value.find(
      (item) => item.id === id
    )

    if (tarefa) {
      tarefa.done = !tarefa.done
    }
  }

  // EXCLUI UMA TAREFA E ATUALIZA OS TOTAIS AUTOMATICAMENTE.
  function excluirTarefa(id) {
    const existe = tarefas.value.some(
      (tarefa) => tarefa.id === id
    )

    if (!existe) return false

    tarefas.value = tarefas.value.filter(
      (tarefa) => tarefa.id !== id
    )

    return true
  }

  return {
    projetos,
    tarefas,
    totalConcluidas,
    totalPendentes,
    resumoProjetos,
    nomeDoProjeto,
    criarProjeto,
    adicionarTarefa,
    alternarTarefa,
    excluirTarefa,
  }
})
