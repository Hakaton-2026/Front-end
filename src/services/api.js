import axios from 'axios'
import { API_URL } from '@/config'

/*
  Axios pronto para falar com o back-end. Exemplo de uso em qualquer página:

    import api from '@/services/api'
    const { data } = await api.get('/produtos')
    await api.post('/pedidos', { item: 1 })

  O endereço do servidor fica em src/config.js.
*/
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
})

// Envia o token em toda requisição, se a pessoa estiver logada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Se o servidor disser que o login não vale mais (401), limpa os dados salvos.
// Também deixa a mensagem de erro pronta em `erro.mensagem`.
api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    if (erro.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
    }

    const dados = erro.response?.data
    erro.mensagem =
      (typeof dados === 'string' ? dados : dados?.mensagem || dados?.message) ||
      (erro.code === 'ECONNABORTED' ? 'A requisição demorou demais.' : '') ||
      (erro.response ? `Erro ${erro.response.status}` : 'Sem conexão com o servidor.')

    return Promise.reject(erro)
  },
)

export default api
