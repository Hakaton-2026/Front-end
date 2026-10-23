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
}

export default projetosApi