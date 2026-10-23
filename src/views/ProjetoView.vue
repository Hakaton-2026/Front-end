```vue
<template>
  <main class="projetos-container">
    <header class="cabecalho">
      <div>
        <h1>Meus projetos</h1>
        <p>Gerencie os projetos do Nexos.</p>
      </div>

      <button class="btn btn-principal" @click="abrirFormulario()">
        Novo projeto
      </button>
    </header>

    <div v-if="loading" class="estado">
      Carregando projetos...
    </div>

    <div v-else-if="error" class="mensagem erro">
      {{ error }}
      <button class="btn btn-secundario" @click="carregarProjetos">
        Tentar novamente
      </button>
    </div>

    <section v-else>
      <div v-if="projetos.length === 0" class="estado vazio">
        <h2>Nenhum projeto encontrado</h2>
        <p>Cadastre seu primeiro projeto para começar.</p>
        <button class="btn btn-principal" @click="abrirFormulario()">
          Criar projeto
        </button>
      </div>

      <div v-else class="lista-projetos">
        <article
          v-for="projeto in projetos"
          :key="projeto.id"
          class="projeto-card"
        >
          <div class="projeto-conteudo">
            <h2>{{ projeto.nome }}</h2>
            <p>{{ projeto.descricao || 'Sem descrição.' }}</p>
            <small v-if="projeto.id">
              ID: {{ projeto.id }}
            </small>
          </div>

          <div class="acoes">
            <button
              class="btn btn-secundario"
              @click="abrirFormulario(projeto)"
            >
              Editar
            </button>

            <button
              class="btn btn-perigo"
              :disabled="excluindoId === projeto.id"
              @click="excluirProjeto(projeto)"
            >
              {{ excluindoId === projeto.id ? 'Excluindo...' : 'Excluir' }}
            </button>
          </div>
        </article>
      </div>
    </section>

    <div v-if="formularioAberto" class="modal-fundo" @click.self="fecharFormulario">
      <section class="modal">
        <h2>{{ formulario.id ? 'Editar projeto' : 'Novo projeto' }}</h2>

        <form @submit.prevent="salvarProjeto">
          <label for="nome">Nome do projeto</label>
          <input
            id="nome"
            v-model.trim="formulario.nome"
            type="text"
            maxlength="150"
            required
            placeholder="Digite o nome do projeto"
          />

          <label for="descricao">Descrição</label>
          <textarea
            id="descricao"
            v-model.trim="formulario.descricao"
            rows="4"
            placeholder="Descreva o projeto"
          />

          <p v-if="erroFormulario" class="mensagem erro">
            {{ erroFormulario }}
          </p>

          <div class="acoes modal-acoes">
            <button
              type="button"
              class="btn btn-secundario"
              :disabled="salvando"
              @click="fecharFormulario"
            >
              Cancelar
            </button>

            <button
              type="submit"
              class="btn btn-principal"
              :disabled="salvando"
            >
              {{ salvando ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import apiClient from '@/api/config'

const projetos = ref([])
const loading = ref(false)
const salvando = ref(false)
const excluindoId = ref(null)
const error = ref('')
const erroFormulario = ref('')
const formularioAberto = ref(false)

const formulario = ref({
  id: null,
  nome: '',
  descricao: '',
})

function extrairLista(data) {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.results)) {
    return data.results
  }

  if (Array.isArray(data?.projetos)) {
    return data.projetos
  }

  return []
}

function mensagemErro(err, mensagemPadrao) {
  const dados = err.response?.data

  if (typeof dados?.detail === 'string') {
    return dados.detail
  }

  if (typeof dados?.mensagem === 'string') {
    return dados.mensagem
  }

  if (typeof dados === 'object' && dados !== null) {
    const campoComErro = Object.values(dados).find(
      (valor) => Array.isArray(valor) && valor.length > 0,
    )

    if (campoComErro) {
      return String(campoComErro[0])
    }
  }

  return err.mensagem || mensagemPadrao
}

async function carregarProjetos() {
  loading.value = true
  error.value = ''

  try {
    const { data } = await apiClient.get('/projetos/')
    projetos.value = extrairLista(data)
  } catch (err) {
    error.value = mensagemErro(
      err,
      'Não foi possível carregar os projetos.',
    )

    console.error('Erro ao carregar projetos:', err)
  } finally {
    loading.value = false
  }
}

function abrirFormulario(projeto = null) {
  erroFormulario.value = ''

  formulario.value = projeto
    ? {
        id: projeto.id,
        nome: projeto.nome || '',
        descricao: projeto.descricao || '',
      }
    : {
        id: null,
        nome: '',
        descricao: '',
      }

  formularioAberto.value = true
}

function fecharFormulario() {
  if (salvando.value) return

  formularioAberto.value = false
  erroFormulario.value = ''
}

async function salvarProjeto() {
  erroFormulario.value = ''

  if (!formulario.value.nome.trim()) {
    erroFormulario.value = 'Informe o nome do projeto.'
    return
  }

  salvando.value = true

  const payload = {
    nome: formulario.value.nome.trim(),
    descricao: formulario.value.descricao.trim(),
  }

  try {
    if (formulario.value.id !== null) {
      await apiClient.patch(
        `/projetos/${formulario.value.id}/`,
        payload,
      )
    } else {
      await apiClient.post('/projetos/', payload)
    }

    formularioAberto.value = false
    await carregarProjetos()
  } catch (err) {
    erroFormulario.value = mensagemErro(
      err,
      'Não foi possível salvar o projeto.',
    )

    console.error('Erro ao salvar projeto:', err)
  } finally {
    salvando.value = false
  }
}

async function excluirProjeto(projeto) {
  const confirmado = window.confirm(
    `Deseja realmente excluir o projeto "${projeto.nome}"?`,
  )

  if (!confirmado) return

  excluindoId.value = projeto.id
  error.value = ''

  try {
    await apiClient.delete(`/projetos/${projeto.id}/`)
    await carregarProjetos()
  } catch (err) {
    error.value = mensagemErro(
      err,
      'Não foi possível excluir o projeto.',
    )

    console.error('Erro ao excluir projeto:', err)
  } finally {
    excluindoId.value = null
  }
}

onMounted(carregarProjetos)
</script>

<style scoped>
.projetos-container {
  width: min(1100px, 100%);
  margin: 0 auto;
  padding: 32px 24px;
  color: var(--cor-texto, #202124);
}

.cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
}

.cabecalho h1 {
  margin: 0 0 8px;
  font-size: 2rem;
}

.cabecalho p {
  margin: 0;
  color: var(--cor-texto-secundario, #666);
}

.lista-projetos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

.projeto-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
  min-height: 180px;
  padding: 22px;
  border: 1px solid var(--cor-borda, #ddd);
  border-radius: 12px;
  background: var(--cor-superficie, #fff);
  box-shadow: 0 2px 8px rgb(0 0 0 / 5%);
}

.projeto-conteudo h2 {
  margin: 0 0 12px;
  overflow-wrap: anywhere;
}

.projeto-conteudo p {
  color: var(--cor-texto-secundario, #666);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.projeto-conteudo small {
  color: var(--cor-texto-secundario, #777);
}

.acoes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.btn {
  padding: 10px 15px;
  border: 0;
  border-radius: 7px;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-principal {
  color: white;
  background: var(--cor-primaria, #315efb);
}

.btn-secundario {
  color: var(--cor-texto, #333);
  background: var(--cor-botao-secundario, #e9e9e9);
}

.btn-perigo {
  color: white;
  background: #c62828;
}

.estado {
  padding: 40px 20px;
  text-align: center;
}

.vazio {
  border: 1px dashed var(--cor-borda, #ccc);
  border-radius: 12px;
}

.mensagem {
  margin: 16px 0;
  padding: 12px 14px;
  border-radius: 8px;
}

.erro {
  color: #a51d1d;
  background: #ffeded;
}

.modal-fundo {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(0 0 0 / 50%);
}

.modal {
  width: min(500px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  padding: 26px;
  border-radius: 12px;
  background: var(--cor-superficie, #fff);
  color: var(--cor-texto, #202124);
}

.modal h2 {
  margin-top: 0;
  margin-bottom: 24px;
}

.modal form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.modal label {
  margin-top: 8px;
  font-weight: 600;
}

.modal input,
.modal textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 12px;
  border: 1px solid var(--cor-borda, #ccc);
  border-radius: 7px;
  background: var(--cor-superficie, #fff);
  color: inherit;
  font: inherit;
}

.modal textarea {
  resize: vertical;
}

.modal-acoes {
  justify-content: flex-end;
  margin-top: 16px;
}

@media (max-width: 600px) {
  .projetos-container {
    padding: 22px 16px;
  }

  .cabecalho {
    align-items: flex-start;
    flex-direction: column;
  }

  .cabecalho h1 {
    font-size: 1.6rem;
  }
}
</style>
