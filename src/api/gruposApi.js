
import apiClient from '@/api/config'

const gruposApi = {
  obterTodos(params = {}) {
    return apiClient.get('/grupos/', { params })
  },

  obterPorId(id) {
    return apiClient.get(`/grupos/${id}/`)
  },

  criar(dados) {
    return apiClient.post('/grupos/', dados)
  },

  atualizar(id, dados) {
    return apiClient.patch(`/grupos/${id}/`, dados)
  },

  deletar(id) {
    return apiClient.delete(`/grupos/${id}/`)
  },

  listarMembros(id) {
    return apiClient.get(`/grupos/${id}/membros/`)
  },

  adicionarMembro(id, dados) {
    return apiClient.post(`/grupos/${id}/membros/`, dados)
  },

  atualizarMembro(id, membroId, dados) {
    return apiClient.patch(
      `/grupos/${id}/membros/${membroId}/`,
      dados,
    )
  },

  removerMembro(id, membroId) {
    return apiClient.delete(
      `/grupos/${id}/membros/${membroId}/`,
    )
  },
}

export default gruposApi
