
import { ref } from 'vue'
import { defineStore } from 'pinia'
import notasApi from '@/api/notasApi'

export const useNotasStore = defineStore('notas', () => {
  const notas = ref([])
  const loading = ref(false)
  const error = ref(null)

  function obterMensagemErro(err, mensagemPadrao) {
    const dados = err?.response?.data

    if (typeof dados === 'string') return dados
    if (dados?.detail) return dados.detail

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

    return err?.mensagem || err?.message || mensagemPadrao
  }

  async function fetchNotas() {
    loading.value = true
    error.value = null

    try {
      const response = await notasApi.obterTodos()
      const dados = response.data

      notas.value = Array.isArray(dados)
        ? dados
        : Array.isArray(dados?.results)
          ? dados.results
          : []

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
    if (!dadosNota?.titulo?.trim()) {
      error.value = 'O título da nota é obrigatório.'
      return null
    }

    loading.value = true
    error.value = null

    try {
      const dados = {
        ...dadosNota,
        titulo: dadosNota.titulo.trim(),
      }
      delete dados.id
      delete dados.user
      const response = await notasApi.criar(dados)
      const novaNota = response.data

      notas.value.unshift(novaNota)
      return novaNota
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
    if (!id) {
      error.value = 'O ID da nota é obrigatório.'
      return null
    }

    loading.value = true
    error.value = null

    try {
      const dados = { ...dadosNota }
      if (typeof dados.titulo === 'string') {
        dados.titulo = dados.titulo.trim()
      }

      const response = await notasApi.atualizar(id, dados)
      const notaAtualizada = response.data

      const indice = notas.value.findIndex(
        (nota) => nota.id === notaAtualizada.id
      )

      if (indice !== -1) {
        notas.value.splice(indice, 1, notaAtualizada)
      } else {
        await fetchNotas()
      }

      return notaAtualizada
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
