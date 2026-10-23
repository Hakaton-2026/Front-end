import apiClient from './config'

const projetosApi = {
  obterTodos(params = {}) {
    return apiClient.get('/projetos/', { params })
  },

  obterPorId(id) {
    return apiClient.get(`/projetos/${id}/`)
  },

  criar(data) {
    return apiClient.post('/projetos/', data)
  },

  atualizar(id, data) {
    return apiClient.put(`/projetos/${id}/`, data)
  },

  atualizarParcialmente(id, data) {
    return apiClient.patch(`/projetos/${id}/`, data)
  },

  deletar(id) {
    return apiClient.delete(`/projetos/${id}/`)
  },

  // ------------------------------------------------------------
  // Participantes (compartilhamento)
  // ------------------------------------------------------------

  listarMembros(id) {
    return apiClient.get(`/projetos/${id}/membros/`)
  },

  // data: { usuario: <id>, papel: 'visualizador' | 'editor' }
  adicionarMembro(id, data) {
    return apiClient.post(`/projetos/${id}/membros/`, data)
  },

  // data: { papel: 'visualizador' | 'editor' }
  atualizarMembro(id, membroId, data) {
    return apiClient.patch(`/projetos/${id}/membros/${membroId}/`, data)
  },

  removerMembro(id, membroId) {
    return apiClient.delete(`/projetos/${id}/membros/${membroId}/`)
  },
}

export default projetosApi