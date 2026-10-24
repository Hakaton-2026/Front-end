import apiClient from './config'

const tarefasApi = {
  // A API pagina de 10 em 10; pedimos o máximo permitido para o quadro de tarefas.
  obterTodos(params = {}) {
    return apiClient.get('/tarefas/', {
      params: { page_size: 100, ...params },
    })
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

  atualizarParcialmente(id, data) {
    return apiClient.patch(`/tarefas/${id}/`, data)
  },

  deletar(id) {
    return apiClient.delete(`/tarefas/${id}/`)
  },

  // ------------------------------------------------------------
  // Comentários (o autor é definido pelo servidor)
  // ------------------------------------------------------------

  listarComentarios(tarefaId) {
    return apiClient.get('/comentarios/', { params: { tarefa: tarefaId } })
  },

  criarComentario(tarefaId, descricao) {
    return apiClient.post('/comentarios/', { tarefa: tarefaId, descricao })
  },

  atualizarComentario(id, descricao) {
    return apiClient.patch(`/comentarios/${id}/`, { descricao })
  },

  removerComentario(id) {
    return apiClient.delete(`/comentarios/${id}/`)
  },

  // ------------------------------------------------------------
  // Checklist
  // ------------------------------------------------------------

  listarChecklist(tarefaId) {
    return apiClient.get('/checklist/', { params: { tarefa: tarefaId } })
  },

  adicionarItemChecklist(tarefaId, texto) {
    return apiClient.post('/checklist/', { tarefa: tarefaId, texto })
  },

  // data: { texto?: string, concluido?: boolean }
  atualizarItemChecklist(id, data) {
    return apiClient.patch(`/checklist/${id}/`, data)
  },

  removerItemChecklist(id) {
    return apiClient.delete(`/checklist/${id}/`)
  },

  // ------------------------------------------------------------
  // Materiais de apoio (link de um projeto OU de uma tarefa)
  // ------------------------------------------------------------

  // params: { tarefa: <id> } ou { projeto: <id> }
  listarMateriais(params) {
    return apiClient.get('/materiais/', { params })
  },

  // data: { titulo, url, descricao?, projeto: <id> } ou { ..., tarefa: <id> }
  criarMaterial(data) {
    return apiClient.post('/materiais/', data)
  },

  atualizarMaterial(id, data) {
    return apiClient.patch(`/materiais/${id}/`, data)
  },

  removerMaterial(id) {
    return apiClient.delete(`/materiais/${id}/`)
  },
}

export default tarefasApi