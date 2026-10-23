import apiClient from "./config";

const usuariosApi = {
    obterPorId(id){
        return apiClient.get(`/usuarios/${id}/`)
    },
};

export default usuariosApi;