
<template>
  <main class="grupos-container">
    <!-- LISTA DE GRUPOS -->
    <template v-if="!grupoSelecionado">
      <header class="cabecalho">
        <div>
          <h1>Meus grupos</h1>
          <p>Organize seus estudos e compartilhe atividades com outras pessoas.</p>
        </div>

        <button class="btn btn-principal" @click="abrirFormulario">
          <ion-icon name="add-outline"></ion-icon>
          Novo grupo
        </button>
      </header>

      <div class="pesquisa-grupos">
        <ion-icon name="search-outline"></ion-icon>
        <input
          v-model="pesquisa"
          type="search"
          placeholder="Pesquisar meus grupos..."
        />
      </div>

      <p v-if="mensagem" class="mensagem sucesso">{{ mensagem }}</p>
      <p v-if="error" class="mensagem erro">{{ error }}</p>

      <div v-if="loading" class="estado">
        Carregando grupos...
      </div>

      <div v-else-if="error" class="estado">
        <button class="btn btn-secundario" @click="carregarGrupos">
          Tentar novamente
        </button>
      </div>

      <section v-else>
        <div v-if="gruposFiltrados.length" class="lista-grupos">
          <article
            v-for="grupo in gruposFiltrados"
            :key="grupo.id"
            class="grupo-card"
          >
            <div class="grupo-icone">
              <ion-icon name="people-outline"></ion-icon>
            </div>

            <div class="grupo-conteudo">
              <h2>{{ grupo.nome }}</h2>
              <p>{{ grupo.descricao || 'Sem descrição.' }}</p>

              <small>
                {{ totalParticipantes(grupo) }}
              </small>

              <small v-if="grupo.id">
                ID: {{ grupo.id }}
              </small>
            </div>

            <button
              class="btn btn-secundario"
              @click="abrirGrupo(grupo)"
            >
              Abrir grupo
              <ion-icon name="arrow-forward-outline"></ion-icon>
            </button>
          </article>
        </div>

        <div v-else class="estado vazio">
          <ion-icon name="people-outline"></ion-icon>
          <h2>
            {{ pesquisa ? 'Nenhum grupo encontrado' : 'Você ainda não tem grupos' }}
          </h2>
          <p>
            {{
              pesquisa
                ? 'Experimente pesquisar por outro nome.'
                : 'Crie um grupo para começar a organizar seus estudos.'
            }}
          </p>

          <button
            v-if="!pesquisa"
            class="btn btn-principal"
            @click="abrirFormulario"
          >
            Criar primeiro grupo
          </button>
        </div>
      </section>
    </template>

    <!-- DETALHES DO GRUPO -->
    <template v-else>
      <header class="cabecalho cabecalho-detalhes">
        <div>
          <button class="btn-voltar" @click="voltarParaGrupos">
            <ion-icon name="arrow-back-outline"></ion-icon>
            Voltar aos grupos
          </button>

          <h1>{{ grupoSelecionado.nome }}</h1>
          <p>{{ grupoSelecionado.descricao || 'Este grupo não possui descrição.' }}</p>
        </div>

        <button
          v-if="souProprietario"
          class="btn btn-principal"
          @click="abrirAdicionarPessoa"
        >
          <ion-icon name="person-add-outline"></ion-icon>
          Adicionar participante
        </button>
      </header>

      <p v-if="mensagem" class="mensagem sucesso">{{ mensagem }}</p>
      <p v-if="erroMembros" class="mensagem erro">{{ erroMembros }}</p>

      <section class="participantes-secao">
        <div class="titulo-secao">
          <div>
            <h2>Participantes</h2>
            <p>As pessoas que têm acesso a este grupo.</p>
          </div>

          <span class="contador">
            {{ membros.length }}
            {{ membros.length === 1 ? 'pessoa' : 'pessoas' }}
          </span>
        </div>

        <div v-if="carregandoMembros" class="estado">
          Carregando participantes...
        </div>

        <div v-else-if="erroMembros" class="estado">
          <button class="btn btn-secundario" @click="carregarMembros">
            Tentar novamente
          </button>
        </div>

        <div v-else-if="membros.length" class="lista-membros">
          <article
            v-for="membro in membros"
            :key="membro.id"
            class="membro-card"
          >
            <div class="membro-identidade">
              <div class="avatar">
                {{ iniciais(membro.usuario || membro) }}
              </div>

              <div class="usuario-dados">
                <strong>{{ nomeUsuario(membro.usuario || membro) }}</strong>
                <small>{{ (membro.usuario || membro).email || 'E-mail não informado' }}</small>
              </div>
            </div>

            <div class="membro-acoes">
              <span
                class="selo"
                :class="`selo-${membro.papel || 'visualizador'}`"
              >
                {{ rotuloPapel(membro.papel) }}
              </span>

              <template v-if="souProprietario && !ehProprietario(membro)">
                <select
                  :value="membro.papel"
                  :disabled="atualizandoMembroId === membro.id"
                  :aria-label="`Permissão de ${nomeUsuario(membro.usuario || membro)}`"
                  @change="alterarPapel(membro, $event)"
                >
                  <option value="visualizador">Visualizador</option>
                  <option value="editor">Editor</option>
                </select>

                <button
                  class="btn btn-perigo btn-pequeno"
                  :disabled="removendoMembroId === membro.id"
                  @click="removerPessoa(membro)"
                >
                  {{ removendoMembroId === membro.id ? 'Removendo...' : 'Remover' }}
                </button>
              </template>
            </div>
          </article>
        </div>

        <div v-else class="estado vazio">
          <ion-icon name="person-add-outline"></ion-icon>
          <h3>Nenhum participante adicional</h3>
          <p>Adicione pessoas para colaborar com este grupo.</p>

          <button
            v-if="souProprietario"
            class="btn btn-principal"
            @click="abrirAdicionarPessoa"
          >
            Adicionar primeira pessoa
          </button>
        </div>
      </section>
    </template>

    <!-- MODAL CRIAR GRUPO -->
    <div
      v-if="formularioAberto"
      class="modal-fundo"
      @click.self="fecharFormulario"
    >
      <section
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-grupo"
      >
        <h2 id="titulo-grupo">Criar novo grupo</h2>
        <p class="modal-descricao">
          Defina um nome e uma descrição para seu grupo.
        </p>

        <form @submit.prevent="criarGrupo">
          <label for="nome-grupo">Nome do grupo</label>
          <input
            id="nome-grupo"
            v-model.trim="formulario.nome"
            maxlength="150"
            required
            placeholder="Ex.: Grupo de estudos de Matemática"
          />

          <label for="descricao-grupo">Descrição</label>
          <textarea
            id="descricao-grupo"
            v-model.trim="formulario.descricao"
            rows="4"
            placeholder="Explique o objetivo do grupo"
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
              {{ salvando ? 'Criando...' : 'Criar grupo' }}
            </button>
          </div>
        </form>
      </section>
    </div>

    <!-- MODAL ADICIONAR PARTICIPANTE -->
    <div
      v-if="modalPessoaAberto"
      class="modal-fundo"
      @click.self="fecharAdicionarPessoa"
    >
      <section
        class="modal modal-largo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-pessoa"
      >
        <h2 id="titulo-pessoa">Adicionar participante</h2>
        <p class="modal-descricao">
          Pesquise uma pessoa cadastrada no Nexos pelo nome ou e-mail.
        </p>

        <label for="busca-usuario">Pesquisar usuário</label>
        <div class="campo-pesquisa">
          <ion-icon name="search-outline"></ion-icon>
          <input
            id="busca-usuario"
            v-model="termoBusca"
            type="search"
            autocomplete="off"
            placeholder="Digite pelo menos 2 caracteres"
            :disabled="Boolean(usuarioSelecionado)"
          />
        </div>

        <p v-if="buscando" class="dica">Pesquisando usuários...</p>

        <p
          v-else-if="buscaConcluida && !resultadosBusca.length && termoBusca.trim().length >= 2"
          class="dica"
        >
          Nenhum usuário encontrado. Verifique o nome ou o e-mail.
        </p>

        <p v-if="erroBusca" class="mensagem erro">
          {{ erroBusca }}
        </p>

        <ul v-if="resultadosBusca.length && !usuarioSelecionado" class="lista-resultados">
          <li v-for="usuario in resultadosBusca" :key="usuario.id">
            <button
              type="button"
              class="item-usuario"
              @click="selecionarUsuario(usuario)"
            >
              <span class="avatar">
                {{ iniciais(usuario) }}
              </span>

              <span class="usuario-dados">
                <strong>{{ nomeUsuario(usuario) }}</strong>
                <small>{{ usuario.email || 'E-mail não informado' }}</small>
              </span>

              <ion-icon name="add-circle-outline"></ion-icon>
            </button>
          </li>
        </ul>

        <div v-if="usuarioSelecionado" class="selecionado">
          <div class="membro-identidade">
            <div class="avatar">{{ iniciais(usuarioSelecionado) }}</div>
            <div class="usuario-dados">
              <strong>{{ nomeUsuario(usuarioSelecionado) }}</strong>
              <small>{{ usuarioSelecionado.email }}</small>
            </div>
          </div>

          <button
            type="button"
            class="btn btn-secundario"
            :disabled="adicionando"
            @click="limparSelecao"
          >
            Escolher outra pessoa
          </button>

          <label for="papel-novo">Permissão no grupo</label>
          <select id="papel-novo" v-model="papelNovo">
            <option value="visualizador">Visualizador — pode consultar</option>
            <option value="editor">Editor — pode editar</option>
          </select>

          <p class="dica">
            {{
              papelNovo === 'editor'
                ? 'O participante poderá visualizar e editar o conteúdo do grupo.'
                : 'O participante poderá visualizar o conteúdo do grupo.'
            }}
          </p>
        </div>

        <p v-if="erroAdicionar" class="mensagem erro">
          {{ erroAdicionar }}
        </p>

        <div class="acoes modal-acoes">
          <button
            type="button"
            class="btn btn-secundario"
            :disabled="adicionando"
            @click="fecharAdicionarPessoa"
          >
            Cancelar
          </button>

          <button
            type="button"
            class="btn btn-principal"
            :disabled="!usuarioSelecionado || adicionando"
            @click="adicionarPessoa"
          >
            {{ adicionando ? 'Adicionando...' : 'Adicionar ao grupo' }}
          </button>
        </div>
      </section>
    </div>
  </main>
</template>


<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import usuariosApi from '@/api/usuariosApi'
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()

const CHAVE_GRUPOS = 'nexos_grupos'

const grupos = ref([])
const loading = ref(false)
const salvando = ref(false)
const error = ref('')
const mensagem = ref('')
const pesquisa = ref('')

const formularioAberto = ref(false)
const erroFormulario = ref('')
const formulario = ref({
  nome: '',
  descricao: '',
})

const grupoSelecionado = ref(null)
const membros = ref([])
const carregandoMembros = ref(false)
const erroMembros = ref('')
const atualizandoMembroId = ref(null)
const removendoMembroId = ref(null)

const modalPessoaAberto = ref(false)
const termoBusca = ref('')
const resultadosBusca = ref([])
const buscando = ref(false)
const buscaConcluida = ref(false)
const erroBusca = ref('')
const usuarioSelecionado = ref(null)
const papelNovo = ref('visualizador')
const adicionando = ref(false)
const erroAdicionar = ref('')

let temporizadorBusca = null
let buscaAtual = 0

const gruposFiltrados = computed(() => {
  const termo = pesquisa.value.trim().toLowerCase()

  if (!termo) return grupos.value

  return grupos.value.filter((grupo) =>
    `${grupo.nome || ''} ${grupo.descricao || ''}`
      .toLowerCase()
      .includes(termo),
  )
})

const souProprietario = computed(() => {
  return grupoSelecionado.value?.souProprietario === true
})

function extrairLista(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.usuarios)) return data.usuarios
  return []
}

function mensagemErro(err, padrao) {
  const dados = err?.response?.data

  if (typeof dados?.detail === 'string') return dados.detail
  if (typeof dados?.mensagem === 'string') return dados.mensagem

  if (dados && typeof dados === 'object') {
    for (const valor of Object.values(dados)) {
      if (Array.isArray(valor) && valor.length) {
        return String(valor[0])
      }

      if (typeof valor === 'string') return valor
    }
  }

  return padrao
}

function nomeUsuario(usuario) {
  return usuario?.name ||
    usuario?.nome ||
    usuario?.username ||
    usuario?.email ||
    'Usuário'
}

function iniciais(usuario) {
  const nome = nomeUsuario(usuario).trim()
  const partes = nome.split(/\s+/).filter(Boolean)

  if (partes.length >= 2) {
    return `${partes[0][0]}${partes[1][0]}`.toUpperCase()
  }

  return nome.slice(0, 2).toUpperCase() || 'US'
}

function totalParticipantes(grupo) {
  const total = grupo.participantes?.length || 0

  return `${total} ${total === 1 ? 'participante' : 'participantes'}`
}

function rotuloPapel(papel) {
  const rotulos = {
    proprietario: 'Proprietário',
    editor: 'Editor',
    visualizador: 'Visualizador',
  }

  return rotulos[papel] || papel || 'Participante'
}

function ehProprietario(membro) {
  return membro?.papel === 'proprietario'
}

// ----------------------------------------------------
// Persistência local dos grupos
// ----------------------------------------------------

function salvarGrupos() {
  try {
    localStorage.setItem(CHAVE_GRUPOS, JSON.stringify(grupos.value))
    return true
  } catch (err) {
    console.error('Erro ao salvar grupos:', err)
    error.value = 'Não foi possível salvar os grupos neste navegador.'
    return false
  }
}

async function carregarGrupos() {
  loading.value = true
  error.value = ''

  try {
    const dados = localStorage.getItem(CHAVE_GRUPOS)
    const lista = dados ? JSON.parse(dados) : []

    grupos.value = Array.isArray(lista) ? lista : []
  } catch (err) {
    console.error('Erro ao carregar grupos locais:', err)
    grupos.value = []
    error.value = 'Não foi possível carregar os grupos salvos neste navegador.'
  } finally {
    loading.value = false
  }
}

function abrirFormulario() {
  erroFormulario.value = ''
  formulario.value = {
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

async function criarGrupo() {
  erroFormulario.value = ''

  const nome = formulario.value.nome.trim()

  if (!nome) {
    erroFormulario.value = 'Informe o nome do grupo.'
    return
  }

  salvando.value = true

  try {
    const grupo = {
      id: `grupo-${Date.now()}`,
      nome,
      descricao: formulario.value.descricao.trim(),
      participantes: [],
      souProprietario: true,
      criadoEm: new Date().toISOString(),
    }

    grupos.value.unshift(grupo)

    if (!salvarGrupos()) {
      grupos.value = grupos.value.filter(
        (item) => item.id !== grupo.id,
      )
      return
    }

    formularioAberto.value = false
    formulario.value = { nome: '', descricao: '' }

    abrirGrupo(grupo)
    notificar('Grupo criado com sucesso.')
  } finally {
    salvando.value = false
  }
}

function abrirGrupo(grupo) {
  grupoSelecionado.value = grupo
  membros.value = grupo.participantes || []
  erroMembros.value = ''
  mensagem.value = ''
}

function voltarParaGrupos() {
  fecharAdicionarPessoa()
  grupoSelecionado.value = null
  membros.value = []
  erroMembros.value = ''
  mensagem.value = ''
}

function carregarMembros() {
  const grupo = grupoSelecionado.value

  if (!grupo) return

  carregandoMembros.value = true
  erroMembros.value = ''

  try {
    membros.value = grupo.participantes || []
  } finally {
    carregandoMembros.value = false
  }
}

function atualizarGrupoSelecionado() {
  const grupoId = grupoSelecionado.value?.id
  if (!grupoId) return

  const atualizado = grupos.value.find(
    (grupo) => String(grupo.id) === String(grupoId),
  )

  if (atualizado) {
    grupoSelecionado.value = atualizado
    membros.value = atualizado.participantes || []
  }
}

// ----------------------------------------------------
// Pesquisa de usuários no backend
// Reutiliza usuariosApi.buscar(), igual aos projetos.
// ----------------------------------------------------

function abrirAdicionarPessoa() {
  reiniciarBusca()
  modalPessoaAberto.value = true
}

function fecharAdicionarPessoa() {
  if (adicionando.value) return

  modalPessoaAberto.value = false
  reiniciarBusca()
}

function reiniciarBusca() {
  clearTimeout(temporizadorBusca)
  buscaAtual++

  termoBusca.value = ''
  resultadosBusca.value = []
  buscando.value = false
  buscaConcluida.value = false
  erroBusca.value = ''
  usuarioSelecionado.value = null
  papelNovo.value = 'visualizador'
  erroAdicionar.value = ''
}

watch(termoBusca, (termo) => {
  clearTimeout(temporizadorBusca)

  const idBusca = ++buscaAtual
  const consulta = termo.trim()

  resultadosBusca.value = []
  buscaConcluida.value = false
  erroBusca.value = ''

  if (consulta.length < 2 || usuarioSelecionado.value) {
    buscando.value = false
    return
  }

  buscando.value = true

  temporizadorBusca = setTimeout(async () => {
    try {
      const resposta = await usuariosApi.buscar(consulta)

      if (idBusca !== buscaAtual) return

      const usuarios = extrairLista(resposta?.data ?? resposta)

      const idsParticipantes = new Set(
        membros.value.map((membro) =>
          String((membro.usuario || membro).id),
        ),
      )

      resultadosBusca.value = usuarios.filter(
        (usuario) =>
          usuario.id != null &&
          !idsParticipantes.has(String(usuario.id)),
      )
    } catch (err) {
      if (idBusca !== buscaAtual) return

      erroBusca.value = mensagemErro(
        err,
        'Não foi possível pesquisar usuários.',
      )

      console.error('Erro ao pesquisar usuários:', err)
    } finally {
      if (idBusca === buscaAtual) {
        buscando.value = false
        buscaConcluida.value = true
      }
    }
  }, 350)
})

function selecionarUsuario(usuario) {
  usuarioSelecionado.value = usuario
  papelNovo.value = 'visualizador'
  erroAdicionar.value = ''
  resultadosBusca.value = []
}

function limparSelecao() {
  if (adicionando.value) return

  usuarioSelecionado.value = null
  papelNovo.value = 'visualizador'
  erroAdicionar.value = ''
  termoBusca.value = ''
}

// ----------------------------------------------------
// Participantes: armazenamento local
// ----------------------------------------------------

function adicionarPessoa() {
  const grupo = grupoSelecionado.value
  const usuario = usuarioSelecionado.value

  if (!grupo || !usuario) return

  adicionando.value = true
  erroAdicionar.value = ''

  try {
    const jaExiste = (grupo.participantes || []).some(
      (membro) =>
        String((membro.usuario || membro).id) === String(usuario.id),
    )

    if (jaExiste) {
      erroAdicionar.value = 'Este usuário já participa do grupo.'
      return
    }

    const novoMembro = {
      id: `membro-${Date.now()}-${usuario.id}`,
      usuario: {
        id: usuario.id,
        name: nomeUsuario(usuario),
        email: usuario.email || '',
      },
      papel: papelNovo.value,
      adicionadoEm: new Date().toISOString(),
    }

    grupo.participantes = [
      ...(grupo.participantes || []),
      novoMembro,
    ]

    const indice = grupos.value.findIndex(
      (item) => String(item.id) === String(grupo.id),
    )

    if (indice !== -1) {
      grupos.value.splice(indice, 1, grupo)
    }

    if (!salvarGrupos()) {
      grupo.participantes = grupo.participantes.filter(
        (membro) => membro.id !== novoMembro.id,
      )
      atualizarGrupoSelecionado()
      return
    }

    atualizarGrupoSelecionado()

    notificar(`${nomeUsuario(usuario)} foi adicionado ao grupo.`)
    fecharAdicionarPessoa()
  } finally {
    adicionando.value = false
  }
}

function alterarPapel(membro, evento) {
  const papelAnterior = membro.papel
  const novoPapel = evento.target.value

  membro.papel = novoPapel

  if (!salvarGrupos()) {
    membro.papel = papelAnterior
    evento.target.value = papelAnterior
    return
  }

  atualizarGrupoSelecionado()
  notificar('Permissão atualizada.')
}

function removerPessoa(membro) {
  const usuario = membro.usuario || membro

  const confirmado = window.confirm(
    `Deseja remover ${nomeUsuario(usuario)} deste grupo?`,
  )

  if (!confirmado) return

  const grupo = grupoSelecionado.value
  if (!grupo) return

  const participantesAnteriores = [...(grupo.participantes || [])]

  grupo.participantes = participantesAnteriores.filter(
    (item) => String(item.id) !== String(membro.id),
  )

  const indice = grupos.value.findIndex(
    (item) => String(item.id) === String(grupo.id),
  )

  if (indice !== -1) {
    grupos.value.splice(indice, 1, grupo)
  }

  if (!salvarGrupos()) {
    grupo.participantes = participantesAnteriores
    atualizarGrupoSelecionado()
    return
  }

  atualizarGrupoSelecionado()
  notificar(`${nomeUsuario(usuario)} foi removido do grupo.`)
}

// ----------------------------------------------------
// Notificações
// ----------------------------------------------------

function notificar(texto) {
  mensagem.value = texto

  if (typeof toast.showToast === 'function') {
    toast.showToast(texto)
  }
}

onMounted(carregarGrupos)

onBeforeUnmount(() => {
  clearTimeout(temporizadorBusca)
})
</script>

<style scoped>
.grupos-container {
  --roxo: #A855F7;
  --roxo-hover: #a141fa;
  --roxo-claro: #c084fc;
  --roxo-transparente: rgb(168 85 247 / 12%);
  --roxo-borda: rgb(168 85 247 / 35%);

  width: min(1100px, 100%);
  margin: 0 auto;
  padding: 32px 24px;
  color: var(--cor-texto, #f5f5f5);
}

/* Cabeçalho */

.cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
}

.cabecalho h1 {
  margin: 0 0 8px;
  font-size: 2rem;
  font-weight: 750;
  overflow-wrap: anywhere;
}

.cabecalho p,
.modal-descricao {
  margin: 0;
  color: var(--cor-texto-suave, #aaa);
  line-height: 1.6;
}

.cabecalho-detalhes {
  align-items: flex-end;
}

.btn-voltar {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 18px;
  padding: 0;
  border: 0;
  color: var(--cor-texto-suave, #aaa);
  background: transparent;
  font: inherit;
  cursor: pointer;
  transition: color 0.2s ease;
}

.btn-voltar:hover {
  color: var(--roxo, #A855F7);
}

.btn-voltar ion-icon {
  font-size: 1.2rem;
}

/* Botões */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 15px;
  border: 1px solid transparent;
  border-radius: 9px;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease,
    transform 0.2s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn ion-icon {
  font-size: 1.15rem;
}

.btn-principal {
  color: #fff;
  background: var(--roxo, #A855F7);
  box-shadow: 0 4px 14px rgb(168 85 247 / 20%);
}

.btn-principal:hover:not(:disabled) {
  background: var(--roxo-hover, #a141fa);
  box-shadow: 0 6px 22px rgb(168 85 247 / 35%);
}

.btn-secundario {
  border-color: var(--cor-borda, #383838);
  color: var(--cor-texto, #f5f5f5);
  background: var(--cor-superficie-hover, #2b2b2b);
}

.btn-secundario:hover:not(:disabled) {
  border-color: var(--roxo-borda, rgb(168 85 247 / 35%));
  background: var(--roxo-transparente, rgb(168 85 247 / 12%));
}

.btn-perigo {
  color: #fff;
  background: #c62828;
}

.btn-perigo:hover:not(:disabled) {
  background: #a91f1f;
}

.btn-pequeno {
  padding: 7px 10px;
  font-size: 0.85rem;
}

/* Pesquisa de grupos e usuários */

.pesquisa-grupos,
.campo-pesquisa {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border: 1px solid var(--cor-borda, #383838);
  border-radius: 11px;
  background: var(--cor-superficie, #222);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.pesquisa-grupos {
  margin-bottom: 24px;
}

.pesquisa-grupos ion-icon,
.campo-pesquisa ion-icon {
  flex-shrink: 0;
  color: var(--cor-texto-suave, #aaa);
  font-size: 1.2rem;
  transition: color 0.2s ease;
}

.pesquisa-grupos:focus-within,
.campo-pesquisa:focus-within {
  border-color: var(--roxo, #A855F7);
  box-shadow: 0 0 0 3px rgb(168 85 247 / 12%);
}

.pesquisa-grupos:focus-within ion-icon,
.campo-pesquisa:focus-within ion-icon {
  color: var(--roxo-claro, #c084fc);
}

.pesquisa-grupos input,
.campo-pesquisa input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 13px 0;
  border: 0;
  outline: none;
  color: inherit;
  background: transparent;
  font: inherit;
}

.pesquisa-grupos input:focus,
.campo-pesquisa input:focus {
  box-shadow: none;
}

/* Lista de grupos */

.lista-grupos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
}

.grupo-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  min-width: 0;
  padding: 22px;
  border: 1px solid var(--cor-borda, #383838);
  border-radius: 16px;
  background: var(--cor-superficie, #222);
  box-shadow: 0 4px 16px rgb(0 0 0 / 10%);
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.25s ease;
}

.grupo-card:hover {
  border-color: var(--roxo, #A855F7);
  box-shadow: 0 8px 28px rgb(168 85 247 / 12%);
  transform: translateY(-3px);
}

.grupo-icone {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border: 1px solid var(--roxo-borda);
  border-radius: 13px;
  color: var(--roxo-claro);
  background: var(--roxo-transparente);
  font-size: 1.55rem;
}

.grupo-conteudo {
  flex: 1;
  width: 100%;
  min-width: 0;
}

.grupo-conteudo h2 {
  margin: 0 0 10px;
  font-size: 1.2rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.grupo-conteudo p {
  color: var(--cor-texto-suave, #aaa);
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.grupo-conteudo small {
  display: block;
  margin-top: 7px;
  color: var(--cor-texto-suave, #999);
  overflow-wrap: anywhere;
}

/* Estados vazios e carregamento */

.estado {
  padding: 38px 20px;
  text-align: center;
  color: var(--cor-texto-suave, #aaa);
}

.vazio {
  border: 1px dashed var(--cor-borda, #444);
  border-radius: 14px;
  background: var(--cor-superficie, #222);
}

.vazio > ion-icon {
  font-size: 2.8rem;
  color: var(--roxo, #A855F7);
}

.vazio h2,
.vazio h3 {
  color: var(--cor-texto, #f5f5f5);
}

.vazio p {
  margin-bottom: 20px;
  line-height: 1.6;
}

/* Mensagens */

.mensagem {
  margin: 14px 0;
  padding: 12px 14px;
  border-radius: 9px;
  overflow-wrap: anywhere;
}

.erro {
  border: 1px solid rgb(248 113 113 / 30%);
  color: #ffb4b4;
  background: rgb(198 40 40 / 14%);
}

.sucesso {
  border: 1px solid rgb(34 197 94 / 25%);
  color: #a5f3c1;
  background: rgb(34 197 94 / 12%);
}

/* Participantes */

.participantes-secao {
  margin-top: 28px;
  padding: 22px;
  border: 1px solid var(--cor-borda, #383838);
  border-radius: 15px;
  background: var(--cor-superficie, #222);
}

.titulo-secao {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.titulo-secao h2 {
  margin: 0 0 6px;
}

.titulo-secao p {
  margin: 0;
  color: var(--cor-texto-suave, #aaa);
  line-height: 1.5;
}

.contador {
  flex-shrink: 0;
  padding: 6px 11px;
  border: 1px solid var(--roxo-borda);
  border-radius: 999px;
  color: var(--roxo-claro);
  background: var(--roxo-transparente);
  font-size: 0.85rem;
  font-weight: 600;
}

.lista-membros,
.lista-resultados {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.membro-card,
.item-usuario,
.selecionado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--cor-borda, #383838);
  border-radius: 11px;
  background: var(--cor-superficie, #222);
  transition: border-color 0.2s ease, background 0.2s ease;
}

.membro-card:hover {
  border-color: var(--roxo-borda);
}

.membro-identidade {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.avatar {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 50%;
  color: #fff;
  background: linear-gradient(135deg, #A855F7, #7e22ce);
  box-shadow: 0 3px 12px rgb(168 85 247 / 18%);
  font-size: 0.85rem;
  font-weight: 700;
}

.usuario-dados {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
}

.usuario-dados strong,
.usuario-dados small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.usuario-dados small,
.dica {
  color: var(--cor-texto-suave, #aaa);
  font-size: 0.88rem;
}

.membro-acoes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.membro-acoes select,
.modal select {
  max-width: 100%;
  padding: 9px 10px;
  border: 1px solid var(--cor-borda, #383838);
  border-radius: 8px;
  color: var(--cor-texto, #f5f5f5);
  background: var(--cor-superficie, #222);
  font: inherit;
}

.membro-acoes select:focus,
.modal select:focus {
  border-color: var(--roxo, #A855F7);
  outline: none;
  box-shadow: 0 0 0 3px rgb(168 85 247 / 10%);
}

.selo {
  padding: 5px 9px;
  border: 1px solid var(--cor-borda, #444);
  border-radius: 999px;
  color: var(--cor-texto-suave, #ccc);
  background: var(--cor-superficie-hover, #303030);
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}

.selo-editor {
  border-color: rgb(168 85 247 / 40%);
  color: #c4b5fd;
  background: rgb(168 85 247 / 10%);
}

.selo-visualizador {
  border-color: rgb(59 130 246 / 35%);
  color: #a5d8ff;
  background: rgb(59 130 246 / 8%);
}

.selo-proprietario {
  border-color: rgb(34 197 94 / 35%);
  color: #86efac;
  background: rgb(34 197 94 / 8%);
}

/* Modais */

.modal-fundo {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgb(0 0 0 / 68%);
  backdrop-filter: blur(5px);
}

.modal {
  box-sizing: border-box;
  width: min(480px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  padding: 26px;
  border: 1px solid var(--roxo-borda, rgb(168 85 247 / 35%));
  border-radius: 16px;
  color: var(--cor-texto, #f5f5f5);
  background: var(--cor-superficie, #222);
  box-shadow:
    0 20px 70px rgb(0 0 0 / 35%),
    0 0 30px rgb(168 85 247 / 7%);
}

.modal-largo {
  width: min(580px, 100%);
}

.modal h2 {
  margin: 0 0 10px;
  overflow-wrap: anywhere;
}

.modal-descricao {
  margin-bottom: 20px;
}

.modal form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.modal label {
  display: block;
  margin: 12px 0 4px;
  font-weight: 600;
}

.modal input,
.modal textarea {
  box-sizing: border-box;
  width: 100%;
  padding: 12px;
  border: 1px solid var(--cor-borda, #383838);
  border-radius: 9px;
  outline: none;
  color: var(--cor-texto, #f5f5f5);
  background: var(--cor-fundo, #171717);
  font: inherit;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.modal input:focus,
.modal textarea:focus,
.modal select:focus {
  border-color: var(--roxo, #A855F7);
  box-shadow: 0 0 0 3px rgb(168 85 247 / 10%);
}

.modal textarea {
  resize: vertical;
}

.modal-acoes {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

.campo-pesquisa {
  margin-top: 8px;
}

.campo-pesquisa input {
  background: transparent;
}

.lista-resultados {
  max-height: 240px;
  overflow-y: auto;
  margin-top: 12px;
}

.item-usuario {
  width: 100%;
  color: inherit;
  text-align: left;
  cursor: pointer;
  font: inherit;
}

.item-usuario:hover {
  border-color: var(--roxo, #A855F7);
  background: var(--roxo-transparente, rgb(168 85 247 / 12%));
}

.item-usuario > ion-icon {
  flex-shrink: 0;
  color: var(--roxo-claro, #c084fc);
  font-size: 1.4rem;
}

.selecionado {
  flex-wrap: wrap;
  margin-top: 14px;
  border-color: var(--roxo-borda);
}

.selecionado .membro-identidade {
  flex: 1 1 220px;
}

.selecionado label,
.selecionado select,
.selecionado .dica {
  flex-basis: 100%;
}

.selecionado .dica {
  margin: 0;
}

.dica {
  margin: 10px 0;
  line-height: 1.5;
}

/* Responsividade */

@media (max-width: 650px) {
  .grupos-container {
    padding: 22px 15px;
  }

  .cabecalho,
  .cabecalho-detalhes {
    align-items: flex-start;
    flex-direction: column;
  }

  .cabecalho h1 {
    font-size: 1.65rem;
  }

  .cabecalho > .btn,
  .cabecalho-detalhes > .btn {
    width: 100%;
  }

  .lista-grupos {
    grid-template-columns: 1fr;
  }

  .grupo-card > .btn {
    width: 100%;
  }

  .participantes-secao {
    padding: 15px;
  }

  .titulo-secao {
    align-items: flex-start;
  }

  .membro-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .membro-identidade {
    width: 100%;
  }

  .membro-acoes {
    justify-content: flex-start;
    width: 100%;
  }

  .membro-acoes select {
    flex: 1;
  }

  .modal {
    padding: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .grupos-container *,
  .grupos-container *::before,
  .grupos-container *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
