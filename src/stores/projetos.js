import { ref } from 'vue'
import { defineStore } from 'pinia'
import projetosApi from '@/api/projetosApi'

export const useProjetosStore = defineStore('projetos', () => {
  const projetos = ref([])
  const carregando = ref(false)
  const erro = ref(null)

  function registrarErro(error, mensagemPadrao) {
    const mensagem =
      error?.mensagem ||
      error?.response?.data?.detail ||
      error?.response?.data?.mensagem ||
      error?.response?.data?.message ||
      mensagemPadrao

    erro.value = mensagem
    console.error(mensagem, error)

    throw error
  }

  async function obterTodos(params = {}) {
    carregando.value = true
    erro.value = null

    try {
      const response = await projetosApi.obterTodos(params)
      const dados = response.data

      projetos.value = Array.isArray(dados)
        ? dados
        : Array.isArray(dados?.results)
          ? dados.results
          : []

      return projetos.value
    } catch (error) {
      registrarErro(error, 'Erro ao carregar projetos.')
    } finally {
      carregando.value = false
    }
  }

  async function obterPorId(id) {
    erro.value = null

    try {
      const response = await projetosApi.obterPorId(id)
      return response.data
    } catch (error) {
      registrarErro(
        error,
        `Erro ao obter o projeto ${id}.`,
      )
    }
  }

  async function criar(data) {
    erro.value = null

    try {
      const response = await projetosApi.criar(data)
      const projetoCriado = response.data

      const existe = projetos.value.some(
        (projeto) =>
          String(projeto.id) === String(projetoCriado.id),
      )

      if (!existe) {
        projetos.value.unshift(projetoCriado)
      }

      return projetoCriado
    } catch (error) {
      registrarErro(error, 'Erro ao criar projeto.')
    }
  }

  async function atualizar(id, data) {
    erro.value = null

    try {
      const response =
        await projetosApi.atualizarParcialmente(id, data)

      const projetoAtualizado = response.data

      const index = projetos.value.findIndex(
        (projeto) => String(projeto.id) === String(id),
      )

      if (index !== -1) {
        projetos.value[index] = {
          ...projetos.value[index],
          ...projetoAtualizado,
        }
      }

      return projetoAtualizado
    } catch (error) {
      registrarErro(
        error,
        `Erro ao atualizar o projeto ${id}.`,
      )
    }
  }

  async function atualizarCompleto(id, data) {
    erro.value = null

    try {
      const response = await projetosApi.atualizar(id, data)
      const projetoAtualizado = response.data

      const index = projetos.value.findIndex(
        (projeto) => String(projeto.id) === String(id),
      )

      if (index !== -1) {
        projetos.value[index] = projetoAtualizado
      }

      return projetoAtualizado
    } catch (error) {
      registrarErro(
        error,
        `Erro ao atualizar completamente o projeto ${id}.`,
      )
    }
  }

  async function deletar(id) {
    erro.value = null

    try {
      await projetosApi.deletar(id)

      projetos.value = projetos.value.filter(
        (projeto) => String(projeto.id) !== String(id),
      )

      return true
    } catch (error) {
      registrarErro(
        error,
        `Erro ao excluir o projeto ${id}.`,
      )
    }
  }

  function limparErro() {
    erro.value = null
  }

  return {
    projetos,
    carregando,
    erro,
    obterTodos,
    obterPorId,
    criar,
    atualizar,
    atualizarCompleto,
    deletar,
    limparErro,
  }
})