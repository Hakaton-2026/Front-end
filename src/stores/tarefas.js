
import { ref } from 'vue'
import { defineStore } from 'pinia'
import tarefasApi from '@/api/tarefasApi'

export const useTarefasStore = defineStore('tarefas', () => {
  const tarefas = ref([])
  const loading = ref(false)
  const error = ref(null)

  function obterMensagemErro(err, mensagemPadrao) {
    const dados = err?.response?.data

    if (typeof dados === 'string') {
      return dados
    }

    if (dados?.detail) {
      return dados.detail
    }

    if (dados && typeof dados === 'object') {
      return Object.entries(dados)
        .map(([campo, mensagens]) => {
          const texto = Array.isArray(mensagens)
            ? mensagens.join(', ')
            : String(mensagens)

          return `${campo}: ${texto}`
        })
        .join('\n')
    }

    return err?.message || mensagemPadrao
  }

  async function fetchTarefas() {
    loading.value = true
    error.value = null

    try {
      const response = await tarefasApi.obterTodos()
      const dados = response.data

      tarefas.value = Array.isArray(dados)
        ? dados
        : Array.isArray(dados?.results)
          ? dados.results
          : []
    } catch (err) {
      error.value = obterMensagemErro(
        err,
        'Erro ao buscar tarefas.'
      )

      console.error('Erro ao buscar tarefas:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function addTarefa(dadosTarefa) {
    if (!dadosTarefa?.titulo?.trim()) {
      error.value = 'O título da tarefa é obrigatório.'
      return null
    }

    loading.value = true
    error.value = null

    try {
      const dados = {
        ...dadosTarefa,
        titulo: dadosTarefa.titulo.trim(),
      }

      const response = await tarefasApi.criar(dados)
      const novaTarefa = response.data

      tarefas.value.push(novaTarefa)

      return novaTarefa
    } catch (err) {
      error.value = obterMensagemErro(
        err,
        'Erro ao adicionar tarefa.'
      )

      console.error('Erro ao adicionar tarefa:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateTarefa(id, dadosTarefa) {
    if (!id) {
      error.value = 'O ID da tarefa é obrigatório.'
      return null
    }

    if (
      dadosTarefa?.titulo !== undefined &&
      !dadosTarefa.titulo.trim()
    ) {
      error.value = 'O título da tarefa é obrigatório.'
      return null
    }

    loading.value = true
    error.value = null

    try {
      const dados = { ...dadosTarefa }

      if (typeof dados.titulo === 'string') {
        dados.titulo = dados.titulo.trim()
      }

      const response = await tarefasApi.atualizar(id, dados)
      const tarefaAtualizada = response.data

      const indice = tarefas.value.findIndex(
        (tarefa) => tarefa.id === tarefaAtualizada.id
      )

      if (indice !== -1) {
        tarefas.value.splice(indice, 1, tarefaAtualizada)
      } else {
        await fetchTarefas()
      }

      return tarefaAtualizada
    } catch (err) {
      error.value = obterMensagemErro(
        err,
        'Erro ao atualizar tarefa.'
      )

      console.error('Erro ao atualizar tarefa:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteTarefa(id) {
    if (!id) {
      error.value = 'O ID da tarefa é obrigatório.'
      return false
    }

    loading.value = true
    error.value = null

    try {
      await tarefasApi.deletar(id)

      tarefas.value = tarefas.value.filter(
        (tarefa) => tarefa.id !== id
      )

      return true
    } catch (err) {
      error.value = obterMensagemErro(
        err,
        'Erro ao excluir tarefa.'
      )

      console.error('Erro ao excluir tarefa:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function limparErro() {
    error.value = null
  }

  return {
    tarefas,
    loading,
    error,
    fetchTarefas,
    addTarefa,
    updateTarefa,
    deleteTarefa,
    limparErro,
  }
})
