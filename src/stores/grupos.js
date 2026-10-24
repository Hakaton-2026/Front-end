
import { ref, watch } from 'vue'

const CHAVE = 'nexos-grupos'

function carregarGrupos() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || []
  } catch {
    return []
  }
}

const grupos = ref(carregarGrupos())

watch(
  grupos,
  (novosGrupos) => {
    localStorage.setItem(CHAVE, JSON.stringify(novosGrupos))
  },
  { deep: true }
)

export function useGrupos() {
  function criarGrupo(nome, descricao = '') {
    const novoGrupo = {
      id: crypto.randomUUID(),
      nome: nome.trim(),
      descricao: descricao.trim(),
      criadoEm: new Date().toISOString(),
    }

    grupos.value.unshift(novoGrupo)
    return novoGrupo
  }

  function excluirGrupo(id) {
    grupos.value = grupos.value.filter(
      (grupo) => grupo.id !== id
    )
  }

  return {
    grupos,
    criarGrupo,
    excluirGrupo,
  }
}
