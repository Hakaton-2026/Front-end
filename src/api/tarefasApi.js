import apiClient from './config'

const tarefasApi = {
  obterTodos() {
    return apiClient.get('/tarefas/')
  },

  obterPorId(id) {
    return apiClient.get(`/tarefas/${id}/`)
  },

  criar(data) {
    return apiClient.post('/tarefas/', data)
  },

  atualizar(id, data) {
    return apiClient.put(`/tarefas/${id}/`, data)
  },

  deletar(id) {
    return apiClient.delete(`/tarefas/${id}/`)
  },
}

export default tarefasApi