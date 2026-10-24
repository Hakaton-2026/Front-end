import apiClient from './config'

const notasApi = {
  obterTodos() {
    return apiClient.get('/notas/')
  },

  obterPorId(id) {
    return apiClient.get(`/notas/${id}/`)
  },

  criar(data) {
    return apiClient.post('/notas/', data)
  },

  atualizar(id, data) {
    return apiClient.patch(`/notas/${id}/`, data)
  },

  deletar(id) {
    return apiClient.delete(`/notas/${id}/`)
  },
}

export default notasApi