import apiClient from "./config";

const usuariosApi = {
    obterPorId(id){
        return apiClient.get(`/usuarios/${id}/`)
    },

    // Busca por nome ou e-mail (a própria conta não entra no resultado).
    buscar(termo){
        return apiClient.get('/usuarios/buscar/', { params: { q: termo } })
    },
};

export default usuariosApi;