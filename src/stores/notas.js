
import { ref } from 'vue'
import { defineStore } from 'pinia'
import notasApi from '@/api/notasApi'

export const useNotasStore = defineStore('notas', () => {
  const notas = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchNotas() {
    loading.value = true
    error.value = null

    try {
      const response = await notasApi.obterTodos()
      notas.value = response.data.results

    } catch (err) {
      error.value = obterMensagemErro(
        err,
        'Erro ao buscar notas.'
      )

      console.error('Erro ao buscar notas:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function addNota(dadosNota) {
    try {
        const response = await notasApi.criar(dados)

        await notas.fetchNotas()
    } catch (err) {
      error.value = obterMensagemErro(
        err,
        'Erro ao adicionar nota.'
      )

      console.error('Erro ao adicionar nota:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateNota(id, dadosNota) {
    try {
      const response = await notasApi.atualizar(id, dados)
      const notaAtualizada = response.data

      await fetchNotas()
    } catch (err) {
      error.value = obterMensagemErro(
        err,
        'Erro ao atualizar nota.'
      )

      console.error('Erro ao atualizar nota:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteNota(id) {
    if (!id) {
      error.value = 'O ID da nota é obrigatório.'
      return false
    }

    loading.value = true
    error.value = null

    try {
      await notasApi.deletar(id)

      notas.value = notas.value.filter(
        (nota) => nota.id !== id
      )

      return true
    } catch (err) {
      error.value = obterMensagemErro(
        err,
        'Erro ao excluir nota.'
      )

      console.error('Erro ao excluir nota:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function limparErro() {
    error.value = null
  }

  return {
    notas,
    loading,
    error,
    fetchNotas,
    addNota,
    updateNota,
    deleteNota,
    limparErro,
  }
})
