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
            <div class="projeto-titulo">
              <h2>{{ projeto.nome }}</h2>
              <span
                v-if="projeto.meu_papel"
                class="selo"
                :class="`selo-${projeto.meu_papel}`"
              >
                {{ rotuloPapel(projeto.meu_papel) }}
              </span>
            </div>

            <p>{{ projeto.descricao || 'Sem descrição.' }}</p>

            <small v-if="!ehProprietario(projeto) && projeto.proprietario">
              Compartilhado por {{ nomeUsuario(projeto.proprietario) }}
            </small>
            <small v-else-if="projeto.total_participantes">
              {{ textoParticipantes(projeto.total_participantes) }}
            </small>

            <small v-if="projeto.id">
              ID: {{ projeto.id }}
            </small>
          </div>

          <div class="acoes">
            <button
              v-if="ehProprietario(projeto)"
              class="btn btn-secundario"
              @click="abrirFormulario(projeto)"
            >
              Compartilhar
            </button>

            <button
              v-if="podeEditar(projeto)"
              class="btn btn-secundario"
              @click="abrirFormulario(projeto)"
            >
              Editar
            </button>

            <button
              v-if="ehProprietario(projeto)"
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

    <!-- Criar / editar projeto (inclui pessoas e permissões) -->
    <div v-if="formularioAberto" class="modal-fundo" @click.self="fecharFormulario">
      <section
        class="modal"
        :class="{ 'modal-largo': mostrarPessoas }"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-formulario"
      >
        <h2 id="titulo-formulario">
          {{ formulario.id ? 'Editar projeto' : 'Novo projeto' }}
        </h2>

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

          <!-- Pessoas e permissões (somente proprietário) -->
          <section v-if="mostrarPessoas" class="bloco-pessoas">
            <h3 class="subtitulo">Pessoas com acesso</h3>

            <label for="busca-usuario">Adicionar pessoa</label>
            <input
              id="busca-usuario"
              v-model="termoBusca"
              type="search"
              autocomplete="off"
              placeholder="Busque por nome ou e-mail"
              :disabled="Boolean(usuarioSelecionado)"
              @keydown.enter.prevent
            />

            <ul v-if="resultadosBusca.length" class="lista-resultados">
              <li v-for="usuario in resultadosBusca" :key="usuario.id">
                <button
                  type="button"
                  class="item-usuario"
                  @click="selecionarUsuario(usuario)"
                >
                  <span class="avatar">{{ iniciais(usuario) }}</span>
                  <span class="usuario-dados">
                    <strong>{{ nomeUsuario(usuario) }}</strong>
                    <small v-if="usuario.name">{{ usuario.email }}</small>
                  </span>
                </button>
              </li>
            </ul>

            <p v-else-if="buscando" class="dica">Buscando...</p>
            <p v-else-if="buscaConcluida && termoBusca.trim().length >= 2" class="dica">
              Nenhum usuário encontrado.
            </p>

            <div v-if="usuarioSelecionado" class="selecionado">
              <div class="item-usuario estatico">
                <span class="avatar">{{ iniciais(usuarioSelecionado) }}</span>
                <span class="usuario-dados">
                  <strong>{{ nomeUsuario(usuarioSelecionado) }}</strong>
                  <small v-if="usuarioSelecionado.name">
                    {{ usuarioSelecionado.email }}
                  </small>
                </span>
              </div>

              <label class="rotulo-papel" for="papel-novo">Permissão</label>
              <select id="papel-novo" v-model="papelNovo">
                <option
                  v-for="papel in PAPEIS_COMPARTILHAMENTO"
                  :key="papel.valor"
                  :value="papel.valor"
                >
                  {{ papel.rotulo }}
                </option>
              </select>

              <p class="dica">{{ descricaoPapel(papelNovo) }}</p>

              <div class="acoes modal-acoes">
                <button
                  type="button"
                  class="btn btn-secundario"
                  :disabled="adicionando"
                  @click="limparSelecao"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  class="btn btn-principal"
                  :disabled="adicionando"
                  @click="adicionarPessoa"
                >
                  {{ adicionando ? 'Adicionando...' : 'Adicionar' }}
                </button>
              </div>
            </div>

            <p v-if="erroAdicionar" class="mensagem erro">
              {{ erroAdicionar }}
            </p>

            <p v-if="carregandoMembros" class="dica">Carregando participantes...</p>

            <div v-else-if="erroMembros" class="mensagem erro">
              {{ erroMembros }}
              <button type="button" class="btn btn-secundario" @click="carregarMembros">
                Tentar novamente
              </button>
            </div>

            <ul v-else class="lista-membros">
              <li v-if="projetoAtual?.proprietario" class="membro">
                <div class="item-usuario estatico">
                  <span class="avatar">{{ iniciais(projetoAtual.proprietario) }}</span>
                  <span class="usuario-dados">
                    <strong>{{ nomeUsuario(projetoAtual.proprietario) }}</strong>
                    <small v-if="projetoAtual.proprietario.name">
                      {{ projetoAtual.proprietario.email }}
                    </small>
                  </span>
                </div>
                <span class="selo selo-proprietario">Proprietário</span>
              </li>

              <li v-for="pessoa in pessoas" :key="pessoa.id" class="membro">
                <div class="item-usuario estatico">
                  <span class="avatar">{{ iniciais(pessoa.usuario) }}</span>
                  <span class="usuario-dados">
                    <strong>{{ nomeUsuario(pessoa.usuario) }}</strong>
                    <small v-if="pessoa.usuario.name">{{ pessoa.usuario.email }}</small>
                  </span>
                </div>

                <div class="membro-acoes">
                  <select
                    :value="pessoa.papel"
                    :disabled="atualizandoMembroId === pessoa.id"
                    :aria-label="`Permissão de ${nomeUsuario(pessoa.usuario)}`"
                    @change="alterarPapel(pessoa, $event)"
                  >
                    <option
                      v-for="papel in PAPEIS_COMPARTILHAMENTO"
                      :key="papel.valor"
                      :value="papel.valor"
                    >
                      {{ papel.rotulo }}
                    </option>
                  </select>

                  <button
                    type="button"
                    class="btn btn-perigo btn-pequeno"
                    :disabled="removendoMembroId === pessoa.id"
                    @click="removerPessoa(pessoa)"
                  >
                    {{ removendoMembroId === pessoa.id ? 'Removendo...' : 'Remover' }}
                  </button>
                </div>
              </li>

              <li v-if="pessoas.length === 0" class="dica">
                {{
                  formulario.id
                    ? 'Ninguém além de você tem acesso a este projeto.'
                    : 'Nenhuma pessoa adicionada. Você será o proprietário do projeto.'
                }}
              </li>
            </ul>
          </section>

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
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import apiClient from '@/api/config'
import projetosApi from '@/api/projetosApi'
import usuariosApi from '@/api/usuariosApi'
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()

const ROTULOS_PAPEL = {
  proprietario: 'Proprietário',
  editor: 'Editor',
  visualizador: 'Visualizador',
}

// Papéis que o proprietário pode conceder a outras pessoas.
const PAPEIS_COMPARTILHAMENTO = [
  {
    valor: 'visualizador',
    rotulo: 'Visualizador',
    descricao: 'Pode ver o projeto, mas não pode alterá-lo.',
  },
  {
    valor: 'editor',
    rotulo: 'Editor',
    descricao: 'Pode ver e editar o projeto.',
  },
]

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

// ------------------------------------------------------------
// Pessoas e permissões
// ------------------------------------------------------------

// Projeto aberto no modal (null ao criar um projeto novo).
const projetoAtual = ref(null)

// Participantes já salvos no servidor (projeto existente).
const membros = ref([])

// Pessoas escolhidas antes de o projeto existir; são adicionadas ao salvar.
const pendentes = ref([])

const carregandoMembros = ref(false)
const erroMembros = ref('')

const termoBusca = ref('')
const resultadosBusca = ref([])
const buscando = ref(false)
const buscaConcluida = ref(false)
const usuarioSelecionado = ref(null)
const papelNovo = ref('visualizador')
const adicionando = ref(false)
const erroAdicionar = ref('')

const atualizandoMembroId = ref(null)
const removendoMembroId = ref(null)

// Quem pode gerenciar pessoas: quem está criando ou o proprietário.
const mostrarPessoas = computed(
  () =>
    !formulario.value.id ||
    Boolean(projetoAtual.value && ehProprietario(projetoAtual.value)),
)

const pessoas = computed(() =>
  formulario.value.id ? membros.value : pendentes.value,
)

let temporizadorBusca = null
let buscaAtual = 0

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

// ------------------------------------------------------------
// Permissões e textos
// ------------------------------------------------------------

function ehProprietario(projeto) {
  return projeto.meu_papel === 'proprietario'
}

function podeEditar(projeto) {
  return ['proprietario', 'editor'].includes(projeto.meu_papel)
}

function rotuloPapel(papel) {
  return ROTULOS_PAPEL[papel] || papel
}

function descricaoPapel(papel) {
  return (
    PAPEIS_COMPARTILHAMENTO.find((item) => item.valor === papel)?.descricao ||
    ''
  )
}

function nomeUsuario(usuario) {
  return usuario?.name || usuario?.email || 'Usuário'
}

function iniciais(usuario) {
  const base = (usuario?.name || usuario?.email || '?').trim()
  const partes = base.split(/\s+/).filter(Boolean)

  if (partes.length >= 2) {
    return (partes[0][0] + partes[1][0]).toUpperCase()
  }

  return base.slice(0, 2).toUpperCase()
}

function textoParticipantes(total) {
  return total === 1
    ? 'Compartilhado com 1 pessoa'
    : `Compartilhado com ${total} pessoas`
}

// ------------------------------------------------------------
// Projetos
// ------------------------------------------------------------

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
  reiniciarBusca()

  erroFormulario.value = ''
  erroMembros.value = ''
  projetoAtual.value = projeto
  membros.value = []
  pendentes.value = []

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

  if (projeto && ehProprietario(projeto)) {
    carregarMembros()
  }
}

function fecharFormulario() {
  if (salvando.value || adicionando.value) return

  formularioAberto.value = false
  erroFormulario.value = ''

  reiniciarBusca()
  projetoAtual.value = null
  membros.value = []
  pendentes.value = []
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
      const { data: criado } = await apiClient.post('/projetos/', payload)
      await adicionarPendentes(criado.id)
    }

    formularioAberto.value = false
    reiniciarBusca()
    projetoAtual.value = null
    membros.value = []
    pendentes.value = []

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

// ------------------------------------------------------------
// Compartilhamento: abrir, buscar e listar
// ------------------------------------------------------------

function reiniciarBusca() {
  clearTimeout(temporizadorBusca)
  buscaAtual++

  termoBusca.value = ''
  resultadosBusca.value = []
  buscando.value = false
  buscaConcluida.value = false
  usuarioSelecionado.value = null
  papelNovo.value = 'visualizador'
  erroAdicionar.value = ''
}

async function carregarMembros() {
  if (!projetoAtual.value) return

  const projetoId = projetoAtual.value.id

  carregandoMembros.value = true
  erroMembros.value = ''

  try {
    const { data } = await projetosApi.listarMembros(projetoId)

    // Ignora a resposta se o modal foi fechado ou trocado de projeto.
    if (projetoAtual.value?.id !== projetoId) return

    membros.value = extrairLista(data)
  } catch (err) {
    if (projetoAtual.value?.id !== projetoId) return

    erroMembros.value = mensagemErro(
      err,
      'Não foi possível carregar os participantes.',
    )

    console.error('Erro ao carregar participantes:', err)
  } finally {
    if (projetoAtual.value?.id === projetoId) {
      carregandoMembros.value = false
    }
  }
}

function agendarBusca(termo) {
  clearTimeout(temporizadorBusca)

  // Invalida qualquer busca que ainda esteja em andamento.
  buscaAtual++

  const consulta = termo.trim()

  buscaConcluida.value = false
  erroAdicionar.value = ''

  if (consulta.length < 2) {
    resultadosBusca.value = []
    buscando.value = false
    return
  }

  buscando.value = true

  const idDaBusca = buscaAtual

  temporizadorBusca = setTimeout(
    () => executarBusca(consulta, idDaBusca),
    350,
  )
}

async function executarBusca(consulta, idDaBusca) {
  try {
    const { data } = await usuariosApi.buscar(consulta)

    if (idDaBusca !== buscaAtual) return

    const idsComAcesso = new Set(
      pessoas.value.map((pessoa) => pessoa.usuario.id),
    )

    resultadosBusca.value = extrairLista(data).filter(
      (usuario) => !idsComAcesso.has(usuario.id),
    )
  } catch (err) {
    if (idDaBusca !== buscaAtual) return

    resultadosBusca.value = []
    erroAdicionar.value = mensagemErro(
      err,
      'Não foi possível buscar usuários.',
    )

    console.error('Erro ao buscar usuários:', err)
  } finally {
    if (idDaBusca === buscaAtual) {
      buscando.value = false
      buscaConcluida.value = true
    }
  }
}

watch(termoBusca, agendarBusca)

function selecionarUsuario(usuario) {
  usuarioSelecionado.value = usuario
  papelNovo.value = 'visualizador'
  erroAdicionar.value = ''

  // Limpa o campo de busca e a lista de resultados.
  termoBusca.value = ''
}

function limparSelecao() {
  if (adicionando.value) return

  usuarioSelecionado.value = null
  papelNovo.value = 'visualizador'
  erroAdicionar.value = ''
}

// ------------------------------------------------------------
// Pessoas: adicionar, alterar permissão e remover
//
// Projeto novo: as alterações ficam em `pendentes` e são enviadas ao salvar.
// Projeto existente: cada alteração é enviada ao servidor na hora.
// ------------------------------------------------------------

function sincronizarTotalParticipantes() {
  if (projetoAtual.value) {
    projetoAtual.value.total_participantes = membros.value.length
  }
}

async function adicionarPendentes(projetoId) {
  const falhas = []

  for (const pendente of pendentes.value) {
    try {
      await projetosApi.adicionarMembro(projetoId, {
        usuario: pendente.usuario.id,
        papel: pendente.papel,
      })
    } catch (err) {
      falhas.push(nomeUsuario(pendente.usuario))
      console.error('Erro ao adicionar participante:', err)
    }
  }

  if (falhas.length) {
    toast.showToast(
      `Projeto criado, mas não foi possível adicionar: ${falhas.join(', ')}.`,
      'error',
    )
  }
}

async function adicionarPessoa() {
  if (!usuarioSelecionado.value) return

  const usuario = usuarioSelecionado.value

  // Projeto ainda não existe: só guarda na lista.
  if (!formulario.value.id) {
    pendentes.value.push({
      id: usuario.id,
      usuario,
      papel: papelNovo.value,
    })

    usuarioSelecionado.value = null
    papelNovo.value = 'visualizador'
    return
  }

  adicionando.value = true
  erroAdicionar.value = ''

  try {
    const { data } = await projetosApi.adicionarMembro(
      formulario.value.id,
      {
        usuario: usuario.id,
        papel: papelNovo.value,
      },
    )

    membros.value.push(data)
    sincronizarTotalParticipantes()

    toast.showToast(
      `${nomeUsuario(data.usuario)} agora tem acesso como ${rotuloPapel(data.papel).toLowerCase()}.`,
    )

    usuarioSelecionado.value = null
    papelNovo.value = 'visualizador'
  } catch (err) {
    erroAdicionar.value = mensagemErro(
      err,
      'Não foi possível adicionar a pessoa ao projeto.',
    )

    console.error('Erro ao adicionar participante:', err)
  } finally {
    adicionando.value = false
  }
}

async function alterarPapel(pessoa, evento) {
  const select = evento.target
  const novoPapel = select.value

  if (novoPapel === pessoa.papel) return

  if (!formulario.value.id) {
    pessoa.papel = novoPapel
    return
  }

  atualizandoMembroId.value = pessoa.id

  try {
    const { data } = await projetosApi.atualizarMembro(
      formulario.value.id,
      pessoa.id,
      { papel: novoPapel },
    )

    pessoa.papel = data.papel

    toast.showToast(
      `${nomeUsuario(pessoa.usuario)} agora é ${rotuloPapel(data.papel).toLowerCase()}.`,
    )
  } catch (err) {
    // Volta o seletor para o papel que continua valendo no servidor.
    select.value = pessoa.papel

    toast.showToast(
      mensagemErro(err, 'Não foi possível alterar a permissão.'),
      'error',
    )

    console.error('Erro ao alterar permissão:', err)
  } finally {
    atualizandoMembroId.value = null
  }
}

async function removerPessoa(pessoa) {
  if (!formulario.value.id) {
    pendentes.value = pendentes.value.filter((item) => item.id !== pessoa.id)
    return
  }

  const confirmado = window.confirm(
    `Remover ${nomeUsuario(pessoa.usuario)} deste projeto?`,
  )

  if (!confirmado) return

  removendoMembroId.value = pessoa.id

  try {
    await projetosApi.removerMembro(formulario.value.id, pessoa.id)

    membros.value = membros.value.filter((item) => item.id !== pessoa.id)
    sincronizarTotalParticipantes()

    toast.showToast(`${nomeUsuario(pessoa.usuario)} foi removido do projeto.`)
  } catch (err) {
    toast.showToast(
      mensagemErro(err, 'Não foi possível remover a pessoa do projeto.'),
      'error',
    )

    console.error('Erro ao remover participante:', err)
  } finally {
    removendoMembroId.value = null
  }
}

onMounted(carregarProjetos)

onBeforeUnmount(() => {
  clearTimeout(temporizadorBusca)
})
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
  color: var(--cor-texto-suave, #666);
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

.projeto-titulo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  margin-bottom: 12px;
}

.projeto-conteudo h2 {
  margin: 0;
  overflow-wrap: anywhere;
}

.projeto-conteudo p {
  color: var(--cor-texto-suave, #666);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.projeto-conteudo small {
  display: block;
  margin-top: 6px;
  color: var(--cor-texto-suave, #777);
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
  border: 1px solid var(--cor-borda, #ddd);
  color: var(--cor-texto, #333);
  background: var(--cor-superficie-hover, #e9e9e9);
}

.btn-perigo {
  color: white;
  background: #c62828;
}

.btn-pequeno {
  padding: 7px 11px;
  font-size: 0.875rem;
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

/* ---------- Selos de papel ---------- */

.selo {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
  color: var(--cor-texto-suave, #666);
  background: var(--cor-superficie-hover, #eee);
  border: 1px solid var(--cor-borda, #ddd);
}

.selo-proprietario {
  color: var(--cor-primaria, #315efb);
  background: color-mix(in srgb, var(--cor-primaria, #315efb) 14%, transparent);
  border-color: color-mix(in srgb, var(--cor-primaria, #315efb) 40%, transparent);
}

.selo-editor {
  color: var(--cor-texto, #202124);
}

/* ---------- Modais ---------- */

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

.modal-largo {
  width: min(620px, 100%);
}

.modal h2 {
  margin-top: 0;
  margin-bottom: 24px;
  overflow-wrap: anywhere;
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
.modal textarea,
.modal select {
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

/* ---------- Pessoas e permissões ---------- */

.bloco-pessoas {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--cor-borda, #ddd);
}

.subtitulo {
  margin: 12px 0 4px;
  font-size: 1.05rem;
}

.dica {
  margin: 4px 0;
  color: var(--cor-texto-suave, #666);
  font-size: 0.9rem;
}

.lista-resultados,
.lista-membros {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.lista-resultados {
  max-height: 220px;
  overflow-y: auto;
}

.item-usuario {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid var(--cor-borda, #ddd);
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.item-usuario:hover {
  background: var(--cor-superficie-hover, #f3f3f3);
}

.item-usuario.estatico {
  border-color: transparent;
  padding-left: 0;
  cursor: default;
}

.item-usuario.estatico:hover {
  background: transparent;
}

.avatar {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: white;
  background: var(--cor-primaria, #315efb);
  font-size: 0.8rem;
  font-weight: 700;
}

.usuario-dados {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.usuario-dados strong,
.usuario-dados small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.usuario-dados small {
  color: var(--cor-texto-suave, #777);
}

.selecionado {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--cor-borda, #ddd);
  border-radius: 10px;
}

.selecionado .item-usuario.estatico {
  padding: 0;
}

.selecionado .rotulo-papel {
  margin-top: 4px;
}

.membro {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid var(--cor-borda, #eee);
}

.membro:last-child {
  border-bottom: 0;
}

.membro .item-usuario {
  width: auto;
  flex: 1;
}

.membro-acoes {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.membro-acoes select {
  width: auto;
  padding: 7px 10px;
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

  .membro {
    flex-direction: column;
    align-items: stretch;
  }

  .membro-acoes {
    justify-content: space-between;
  }

  .membro-acoes select {
    flex: 1;
  }
}
</style>