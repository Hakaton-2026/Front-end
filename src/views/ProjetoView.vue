<template>
  <main class="projetos-container">
    <header class="cabecalho">
      <div>
        <span class="sobretitulo">NEXOS / ORGANIZAÇÃO</span>
        <h1>Meus projetos</h1>
        <p>Organize seus projetos, participantes e atividades.</p>
      </div>

      <button class="btn btn-principal" @click="abrirFormulario()">
        + Novo projeto
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
        <p>Crie seu primeiro projeto para começar.</p>
        <button class="btn btn-principal" @click="abrirFormulario()">
          Criar projeto
        </button>
      </div>

      <div v-else class="lista-projetos">
        <article
          v-for="projeto in projetos"
          :key="projeto.id"
          class="projeto-card"
          role="button"
          tabindex="0"
          :aria-label="`Abrir projeto ${projeto.nome}`"
          @click="abrirDetalhesProjeto(projeto)"
          @keydown.enter.prevent="abrirDetalhesProjeto(projeto)"
          @keydown.space.prevent="abrirDetalhesProjeto(projeto)"
        >
          <div class="projeto-conteudo">
            <div class="projeto-titulo">
              <h2>{{ projeto.nome }}</h2>

              <span
                class="selo"
                :class="`selo-${projeto.meu_papel}`"
              >
                {{ rotuloPapel(projeto.meu_papel) }}
              </span>
            </div>

            <p>{{ projeto.descricao || 'Sem descrição.' }}</p>

            <small v-if="projeto.proprietario">
              Proprietário: {{ nomeUsuario(projeto.proprietario) }}
            </small>

            <small>
              {{ textoParticipantes(projeto.total_participantes || 0) }}
            </small>
          </div>

          <div class="acoes">
            <button
              type="button"
              class="btn btn-secundario"
              @click.stop="abrirMateriaisProjeto(projeto)"
            >
              Materiais
            </button>

            <button
              v-if="ehProprietario(projeto)"
              type="button"
              class="btn btn-secundario"
              @click.stop="abrirFormulario(projeto)"
            >
              Participantes
            </button>

            <button
              v-if="podeEditar(projeto)"
              type="button"
              class="btn btn-secundario"
              @click.stop="abrirFormulario(projeto)"
            >
              Editar
            </button>

            <button
              v-if="ehProprietario(projeto)"
              type="button"
              class="btn btn-perigo"
              :disabled="excluindoId === projeto.id"
              @click.stop="excluirProjeto(projeto)"
            >
              {{ excluindoId === projeto.id ? 'Excluindo...' : 'Excluir' }}
            </button>

            <button
              type="button"
              class="btn btn-abrir"
              @click.stop="abrirDetalhesProjeto(projeto)"
            >
              Abrir projeto →
            </button>
          </div>
        </article>
      </div>
    </section>

    <!-- Modal de criação e edição do projeto -->
    <div
      v-if="formularioAberto"
      class="modal-fundo"
      @click.self="fecharFormulario"
    >
      <section
        class="modal"
        :class="{ 'modal-largo': mostrarPessoas }"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-formulario"
      >
        <header class="modal-cabecalho">
          <div>
            <span class="sobretitulo">
              {{ formulario.id ? 'CONFIGURAÇÕES' : 'NOVO PROJETO' }}
            </span>

            <h2 id="titulo-formulario">
              {{ formulario.id ? 'Editar projeto' : 'Criar projeto' }}
            </h2>
          </div>

          <button
            type="button"
            class="btn-fechar"
            aria-label="Fechar"
            @click="fecharFormulario"
          >
            ×
          </button>
        </header>

        <form @submit.prevent="salvarProjeto">
          <label for="nome-projeto">Nome do projeto *</label>

          <input
            id="nome-projeto"
            v-model.trim="formulario.nome"
            type="text"
            maxlength="45"
            required
            placeholder="Nome do projeto"
          />

          <label for="descricao-projeto">Descrição</label>

          <textarea
            id="descricao-projeto"
            v-model.trim="formulario.descricao"
            maxlength="255"
            rows="4"
            placeholder="Descreva o objetivo do projeto"
          />

          <p v-if="erroFormulario" class="mensagem erro">
            {{ erroFormulario }}
          </p>

          <p
            v-if="!formulario.id"
            class="dica"
          >
            Depois de criar o projeto, você poderá adicionar participantes e configurar as permissões.
          </p>

          <!-- Gerenciamento de participantes: somente proprietário -->
          <section v-if="mostrarPessoas" class="bloco-pessoas">
            <h3>Participantes do projeto</h3>

            <label for="busca-usuario">Buscar usuário</label>

            <input
              id="busca-usuario"
              v-model="termoBusca"
              type="search"
              autocomplete="off"
              placeholder="Nome ou e-mail"
              :disabled="Boolean(usuarioSelecionado)"
              @keydown.enter.prevent
            />

            <ul
              v-if="resultadosBusca.length"
              class="lista-resultados"
            >
              <li
                v-for="usuario in resultadosBusca"
                :key="usuario.id"
              >
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
                    <small>{{ usuario.email }}</small>
                  </span>
                </button>
              </li>
            </ul>

            <p v-else-if="buscando" class="dica">
              Buscando usuários...
            </p>

            <p
              v-else-if="buscaConcluida && termoBusca.trim().length >= 2"
              class="dica"
            >
              Nenhum usuário encontrado.
            </p>

            <div v-if="usuarioSelecionado" class="usuario-selecionado">
              <div class="item-usuario estatico">
                <span class="avatar">
                  {{ iniciais(usuarioSelecionado) }}
                </span>

                <span class="usuario-dados">
                  <strong>{{ nomeUsuario(usuarioSelecionado) }}</strong>
                  <small>{{ usuarioSelecionado.email }}</small>
                </span>
              </div>

              <label for="papel-novo">Permissão</label>

              <select id="papel-novo" v-model="papelNovo">
                <option value="visualizador">Visualizador</option>
                <option value="editor">Editor</option>
              </select>

              <p class="dica">
                {{ descricaoPapel(papelNovo) }}
              </p>

              <div class="acoes">
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
                  {{ adicionando ? 'Adicionando...' : 'Adicionar participante' }}
                </button>
              </div>
            </div>

            <p v-if="erroAdicionar" class="mensagem erro">
              {{ erroAdicionar }}
            </p>

            <p v-if="carregandoMembros" class="dica">
              Carregando participantes...
            </p>

            <p v-else-if="erroMembros" class="mensagem erro">
              {{ erroMembros }}
              <button
                type="button"
                class="btn btn-secundario"
                @click="carregarMembros"
              >
                Tentar novamente
              </button>
            </p>

            <ul v-else class="lista-membros">
              <li
                v-if="projetoAtual?.proprietario"
                class="membro"
              >
                <div class="item-usuario estatico">
                  <span class="avatar">
                    {{ iniciais(projetoAtual.proprietario) }}
                  </span>

                  <span class="usuario-dados">
                    <strong>
                      {{ nomeUsuario(projetoAtual.proprietario) }}
                    </strong>

                    <small>
                      {{ projetoAtual.proprietario.email }}
                    </small>
                  </span>
                </div>

                <span class="selo selo-proprietario">
                  Proprietário
                </span>
              </li>

              <li
                v-for="pessoa in membros"
                :key="pessoa.id"
                class="membro"
              >
                <div class="item-usuario estatico">
                  <span class="avatar">
                    {{ iniciais(pessoa.usuario) }}
                  </span>

                  <span class="usuario-dados">
                    <strong>
                      {{ nomeUsuario(pessoa.usuario) }}
                    </strong>

                    <small>{{ pessoa.usuario.email }}</small>
                  </span>
                </div>

                <div class="membro-acoes">
                  <select
                    :value="pessoa.papel"
                    :disabled="atualizandoMembroId === pessoa.id"
                    :aria-label="`Permissão de ${nomeUsuario(pessoa.usuario)}`"
                    @change="alterarPapel(pessoa, $event)"
                  >
                    <option value="visualizador">Visualizador</option>
                    <option value="editor">Editor</option>
                  </select>

                  <button
                    type="button"
                    class="btn btn-perigo btn-pequeno"
                    :disabled="removendoMembroId === pessoa.id"
                    @click="removerPessoa(pessoa)"
                  >
                    {{
                      removendoMembroId === pessoa.id
                        ? 'Removendo...'
                        : 'Remover'
                    }}
                  </button>
                </div>
              </li>
            </ul>
          </section>

          <footer class="modal-acoes">
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
              {{ salvando ? 'Salvando...' : 'Salvar projeto' }}
            </button>
          </footer>
        </form>
      </section>
    </div>

    <!-- Modal de materiais de apoio do projeto -->
    <div
      v-if="modalMateriaisAberto"
      class="modal-fundo"
      @click.self="fecharModalMateriais"
    >
      <section
        class="modal modal-materiais"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-materiais"
      >
        <header class="modal-cabecalho">
          <div>
            <span class="sobretitulo">RECURSOS DO PROJETO</span>
            <h2 id="titulo-materiais">Materiais de apoio</h2>
            <p>{{ projetoMateriaisAtual?.nome }}</p>
          </div>

          <button
            type="button"
            class="btn-fechar"
            aria-label="Fechar"
            @click="fecharModalMateriais"
          >
            ×
          </button>
        </header>

        <p v-if="erroMateriaisProjeto" class="mensagem erro">
          {{ erroMateriaisProjeto }}
        </p>

        <p v-if="carregandoMateriaisProjeto" class="dica">
          Carregando materiais...
        </p>

        <form
          v-if="podeEditar(projetoMateriaisAtual || {})"
          class="form-material"
          @submit.prevent="adicionarMaterialProjeto"
        >
          <label for="material-titulo">Título *</label>

          <input
            id="material-titulo"
            v-model.trim="formMaterialProjeto.titulo"
            maxlength="100"
            required
            placeholder="Documento de requisitos"
          />

          <label for="material-url">Link *</label>

          <input
            id="material-url"
            v-model.trim="formMaterialProjeto.url"
            type="url"
            maxlength="500"
            required
            placeholder="https://..."
          />

          <label for="material-descricao">Descrição</label>

          <textarea
            id="material-descricao"
            v-model.trim="formMaterialProjeto.descricao"
            maxlength="255"
            rows="2"
            placeholder="Descrição opcional"
          />

          <button
            type="submit"
            class="btn btn-principal"
            :disabled="salvandoMaterialProjeto"
          >
            {{
              salvandoMaterialProjeto
                ? 'Salvando...'
                : 'Adicionar material'
            }}
          </button>
        </form>

        <ul
          v-if="materiaisProjeto.length"
          class="lista-materiais"
        >
          <li
            v-for="material in materiaisProjeto"
            :key="material.id"
          >
            <div class="material-info">
              <a
                :href="material.url"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ material.titulo }}
              </a>

              <p v-if="material.descricao">
                {{ material.descricao }}
              </p>

              <small>{{ material.url }}</small>
            </div>

            <button
              v-if="podeEditar(projetoMateriaisAtual || {})"
              type="button"
              class="btn btn-perigo btn-pequeno"
              @click="excluirMaterialProjeto(material)"
            >
              Excluir
            </button>
          </li>
        </ul>

        <p
          v-else-if="!carregandoMateriaisProjeto"
          class="dica"
        >
          Nenhum material cadastrado.
        </p>
      </section>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import projetosApi from '@/api/projetosApi'
import usuariosApi from '@/api/usuariosApi'
import tarefasApi from '@/api/tarefasApi'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const toast = useToastStore()

const projetos = ref([])
const loading = ref(false)
const salvando = ref(false)
const excluindoId = ref(null)
const error = ref('')

const formularioAberto = ref(false)
const erroFormulario = ref('')
const formulario = ref({
  id: null,
  nome: '',
  descricao: '',
})

const projetoAtual = ref(null)
const membros = ref([])
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

const modalMateriaisAberto = ref(false)
const projetoMateriaisAtual = ref(null)
const materiaisProjeto = ref([])
const carregandoMateriaisProjeto = ref(false)
const salvandoMaterialProjeto = ref(false)
const erroMateriaisProjeto = ref('')
const formMaterialProjeto = ref({
  titulo: '',
  url: '',
  descricao: '',
})

const mostrarPessoas = computed(() =>
  Boolean(
    formulario.value.id &&
    projetoAtual.value?.meu_papel === 'proprietario',
  ),
)

let temporizadorBusca = null
let idBusca = 0

function extrairLista(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.projetos)) return data.projetos
  return []
}

function mensagemErro(err, fallback) {
  const dados = err?.response?.data

  if (typeof dados === 'string') return dados
  if (typeof dados?.detail === 'string') return dados.detail
  if (typeof dados?.mensagem === 'string') return dados.mensagem

  if (dados && typeof dados === 'object') {
    const erros = Object.entries(dados).map(([campo, valor]) => {
      return `${campo}: ${
        Array.isArray(valor) ? valor.join(', ') : String(valor)
      }`
    })

    if (erros.length) return erros.join('\n')
  }

  return err?.message || fallback
}

function ehProprietario(projeto) {
  return projeto?.meu_papel === 'proprietario'
}

function podeEditar(projeto) {
  return ['proprietario', 'editor'].includes(projeto?.meu_papel)
}

function rotuloPapel(papel) {
  return {
    proprietario: 'Proprietário',
    editor: 'Editor',
    visualizador: 'Visualizador',
  }[papel] || 'Participante'
}

function descricaoPapel(papel) {
  return papel === 'editor'
    ? 'Pode consultar e editar o conteúdo do projeto.'
    : 'Pode consultar o conteúdo do projeto, sem editá-lo.'
}

function nomeUsuario(usuario) {
  return usuario?.name || usuario?.email || 'Usuário'
}

function iniciais(usuario) {
  const partes = String(
    usuario?.name || usuario?.email || '?',
  ).trim().split(/\s+/).filter(Boolean)

  if (partes.length > 1) {
    return `${partes[0][0]}${partes[1][0]}`.toUpperCase()
  }

  return (partes[0] || '?').slice(0, 2).toUpperCase()
}

function textoParticipantes(total) {
  return total === 1
    ? '1 participante'
    : `${total} participantes`
}

function abrirDetalhesProjeto(projeto) {
  router.push({
    name: 'projeto-detalhes',
    params: { id: projeto.id },
  })
}

async function carregarProjetos() {
  loading.value = true
  error.value = ''

  try {
    const { data } = await projetosApi.obterTodos()
    projetos.value = extrairLista(data)
  } catch (err) {
    error.value = mensagemErro(
      err,
      'Não foi possível carregar os projetos.',
    )
  } finally {
    loading.value = false
  }
}

function limparBusca() {
  clearTimeout(temporizadorBusca)
  idBusca += 1

  termoBusca.value = ''
  resultadosBusca.value = []
  buscando.value = false
  buscaConcluida.value = false
  usuarioSelecionado.value = null
  papelNovo.value = 'visualizador'
  erroAdicionar.value = ''
}

function abrirFormulario(projeto = null) {
  limparBusca()

  erroFormulario.value = ''
  erroMembros.value = ''
  projetoAtual.value = projeto
  membros.value = []

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
  limparBusca()
  projetoAtual.value = null
  membros.value = []
}

async function salvarProjeto() {
  erroFormulario.value = ''

  if (!formulario.value.nome.trim()) {
    erroFormulario.value = 'Informe o nome do projeto.'
    return
  }

  salvando.value = true

  const dados = {
    nome: formulario.value.nome.trim(),
    descricao: formulario.value.descricao.trim(),
  }

  try {
    if (formulario.value.id) {
      await projetosApi.atualizarParcialmente(
        formulario.value.id,
        dados,
      )
      toast.showToast('Projeto atualizado.')
    } else {
      await projetosApi.criar(dados)
      toast.showToast('Projeto criado.')
    }

    formularioAberto.value = false
    limparBusca()
    projetoAtual.value = null
    membros.value = []

    await carregarProjetos()
  } catch (err) {
    erroFormulario.value = mensagemErro(
      err,
      'Não foi possível salvar o projeto.',
    )
  } finally {
    salvando.value = false
  }
}

async function excluirProjeto(projeto) {
  if (
    !window.confirm(
      `Deseja realmente excluir o projeto "${projeto.nome}"?`,
    )
  ) {
    return
  }

  excluindoId.value = projeto.id

  try {
    await projetosApi.deletar(projeto.id)
    projetos.value = projetos.value.filter(
      (item) => item.id !== projeto.id,
    )
    toast.showToast('Projeto excluído.')
  } catch (err) {
    error.value = mensagemErro(
      err,
      'Não foi possível excluir o projeto.',
    )
  } finally {
    excluindoId.value = null
  }
}

async function carregarMembros() {
  if (!projetoAtual.value?.id) return

  const projetoId = projetoAtual.value.id
  carregandoMembros.value = true
  erroMembros.value = ''

  try {
    const { data } = await projetosApi.listarMembros(projetoId)

    if (projetoAtual.value?.id === projetoId) {
      membros.value = extrairLista(data)
    }
  } catch (err) {
    erroMembros.value = mensagemErro(
      err,
      'Não foi possível carregar os participantes.',
    )
  } finally {
    if (projetoAtual.value?.id === projetoId) {
      carregandoMembros.value = false
    }
  }
}

function agendarBusca(termo) {
  clearTimeout(temporizadorBusca)

  const consulta = termo.trim()
  idBusca += 1
  const buscaAtual = idBusca

  buscaConcluida.value = false
  erroAdicionar.value = ''

  if (consulta.length < 2) {
    resultadosBusca.value = []
    buscando.value = false
    return
  }

  buscando.value = true
  temporizadorBusca = setTimeout(
    () => executarBusca(consulta, buscaAtual),
    300,
  )
}

async function executarBusca(consulta, buscaAtual) {
  try {
    const { data } = await usuariosApi.buscar(consulta)

    if (buscaAtual !== idBusca) return

    const ids = new Set(
      membros.value.map((membro) => Number(membro.usuario?.id)),
    )

    if (projetoAtual.value?.proprietario?.id) {
      ids.add(Number(projetoAtual.value.proprietario.id))
    }

    resultadosBusca.value = extrairLista(data).filter(
      (usuario) => !ids.has(Number(usuario.id)),
    )
  } catch (err) {
    if (buscaAtual !== idBusca) return

    erroAdicionar.value = mensagemErro(
      err,
      'Não foi possível buscar usuários.',
    )

    resultadosBusca.value = []
  } finally {
    if (buscaAtual === idBusca) {
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
}

function limparSelecao() {
  if (adicionando.value) return

  usuarioSelecionado.value = null
  papelNovo.value = 'visualizador'
  erroAdicionar.value = ''
}

async function adicionarPessoa() {
  if (!formulario.value.id || !usuarioSelecionado.value) return

  adicionando.value = true
  erroAdicionar.value = ''

  try {
    const { data } = await projetosApi.adicionarMembro(
      formulario.value.id,
      {
        usuario: usuarioSelecionado.value.id,
        papel: papelNovo.value,
      },
    )

    membros.value.push(data)
    usuarioSelecionado.value = null
    termoBusca.value = ''
    papelNovo.value = 'visualizador'

    await carregarProjetos()
    toast.showToast('Participante adicionado ao projeto.')
  } catch (err) {
    erroAdicionar.value = mensagemErro(
      err,
      'Não foi possível adicionar o participante.',
    )
  } finally {
    adicionando.value = false
  }
}

async function alterarPapel(pessoa, evento) {
  const papelAnterior = pessoa.papel
  const novoPapel = evento.target.value

  if (novoPapel === papelAnterior) return

  atualizandoMembroId.value = pessoa.id

  try {
    const { data } = await projetosApi.atualizarMembro(
      formulario.value.id,
      pessoa.id,
      { papel: novoPapel },
    )

    pessoa.papel = data.papel
    toast.showToast('Permissão atualizada.')
  } catch (err) {
    evento.target.value = papelAnterior

    toast.showToast(
      mensagemErro(err, 'Não foi possível alterar a permissão.'),
      'error',
    )
  } finally {
    atualizandoMembroId.value = null
  }
}

async function removerPessoa(pessoa) {
  if (
    !window.confirm(
      `Remover ${nomeUsuario(pessoa.usuario)} deste projeto?`,
    )
  ) {
    return
  }

  removendoMembroId.value = pessoa.id

  try {
    await projetosApi.removerMembro(
      formulario.value.id,
      pessoa.id,
    )

    membros.value = membros.value.filter(
      (item) => item.id !== pessoa.id,
    )

    await carregarProjetos()
    toast.showToast('Participante removido.')
  } catch (err) {
    toast.showToast(
      mensagemErro(err, 'Não foi possível remover o participante.'),
      'error',
    )
  } finally {
    removendoMembroId.value = null
  }
}

async function abrirMateriaisProjeto(projeto) {
  projetoMateriaisAtual.value = projeto
  materiaisProjeto.value = []
  erroMateriaisProjeto.value = ''
  formMaterialProjeto.value = {
    titulo: '',
    url: '',
    descricao: '',
  }
  modalMateriaisAberto.value = true

  await carregarMateriaisProjeto()
}

async function carregarMateriaisProjeto() {
  const id = projetoMateriaisAtual.value?.id

  if (!id) return

  carregandoMateriaisProjeto.value = true
  erroMateriaisProjeto.value = ''

  try {
    const { data } = await tarefasApi.listarMateriais({ projeto: id })
    materiaisProjeto.value = extrairLista(data)
  } catch (err) {
    erroMateriaisProjeto.value = mensagemErro(
      err,
      'Não foi possível carregar os materiais.',
    )
  } finally {
    carregandoMateriaisProjeto.value = false
  }
}

async function adicionarMaterialProjeto() {
  const projetoId = projetoMateriaisAtual.value?.id

  if (!projetoId) return

  if (
    !formMaterialProjeto.value.titulo.trim() ||
    !formMaterialProjeto.value.url.trim()
  ) {
    erroMateriaisProjeto.value = 'Informe o título e o link.'
    return
  }

  salvandoMaterialProjeto.value = true
  erroMateriaisProjeto.value = ''

  try {
    const url = new URL(formMaterialProjeto.value.url.trim())

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Use um link HTTP ou HTTPS.')
    }

    await tarefasApi.criarMaterial({
      projeto: projetoId,
      titulo: formMaterialProjeto.value.titulo.trim(),
      url: url.href,
      descricao: formMaterialProjeto.value.descricao.trim(),
    })

    formMaterialProjeto.value = {
      titulo: '',
      url: '',
      descricao: '',
    }

    await carregarMateriaisProjeto()
    toast.showToast('Material adicionado.')
  } catch (err) {
    erroMateriaisProjeto.value = mensagemErro(
      err,
      err?.message || 'Não foi possível adicionar o material.',
    )
  } finally {
    salvandoMaterialProjeto.value = false
  }
}

async function excluirMaterialProjeto(material) {
  if (
    !window.confirm(
      `Excluir o material "${material.titulo}"?`,
    )
  ) {
    return
  }

  try {
    await tarefasApi.removerMaterial(material.id)

    materiaisProjeto.value = materiaisProjeto.value.filter(
      (item) => item.id !== material.id,
    )

    toast.showToast('Material excluído.')
  } catch (err) {
    erroMateriaisProjeto.value = mensagemErro(
      err,
      'Não foi possível excluir o material.',
    )
  }
}

function fecharModalMateriais() {
  modalMateriaisAberto.value = false
  projetoMateriaisAtual.value = null
  materiaisProjeto.value = []
  erroMateriaisProjeto.value = ''
}

onMounted(carregarProjetos)

onBeforeUnmount(() => {
  clearTimeout(temporizadorBusca)
})
</script>

<style scoped>
.projetos-container {
  width: min(1150px, 100%);
  min-width: 0;
  margin: 0 auto;
  padding: 30px 24px 48px;
  box-sizing: border-box;
  color: var(--cor-texto, #f5f5f5);
}

.projetos-container * {
  box-sizing: border-box;
}

.cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 26px;
}

.sobretitulo {
  color: var(--cor-primaria, #a855f7);
  font-size: 0.73rem;
  font-weight: 800;
  letter-spacing: 1.3px;
}

.cabecalho h1 {
  margin: 8px 0;
  font-size: clamp(1.7rem, 3vw, 2.25rem);
}

.cabecalho p,
.modal-cabecalho p {
  margin: 0;
  color: var(--cor-texto-suave, #999);
}

.lista-projetos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 290px), 1fr));
  gap: 18px;
}

.projeto-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 22px;
  min-width: 0;
  min-height: 210px;
  padding: 21px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 14px;
  background: var(--cor-superficie, #222);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.projeto-card:hover,
.projeto-card:focus-visible {
  transform: translateY(-3px);
  border-color: var(--cor-primaria, #a855f7);
  box-shadow: 0 12px 28px rgb(0 0 0 / 16%);
  outline: none;
}

.projeto-conteudo {
  min-width: 0;
}

.projeto-titulo {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 9px;
  margin-bottom: 12px;
}

.projeto-titulo h2 {
  min-width: 0;
  margin: 0;
  font-size: 1.1rem;
  overflow-wrap: anywhere;
}

.projeto-conteudo p {
  color: var(--cor-texto-suave, #aaa);
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.projeto-conteudo small {
  display: block;
  margin-top: 7px;
  color: var(--cor-texto-suave, #999);
  overflow-wrap: anywhere;
}

.acoes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 650;
  cursor: pointer;
  transition: filter 0.18s ease, border-color 0.18s ease;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-principal {
  color: #fff;
  background: var(--cor-primaria, #7c3aed);
}

.btn-principal:hover:not(:disabled) {
  filter: brightness(1.12);
}

.btn-secundario {
  color: var(--cor-texto, #eee);
  border-color: var(--cor-borda, #444);
  background: var(--cor-fundo, #171717);
}

.btn-secundario:hover {
  border-color: var(--cor-primaria, #7c3aed);
}

.btn-abrir {
  color: #fff;
  background: var(--cor-primaria, #7c3aed);
}

.btn-perigo {
  color: #fca5a5;
  border-color: #ef444455;
  background: #ef444418;
}

.btn-pequeno {
  padding: 6px 9px;
  font-size: 0.78rem;
}

.selo {
  padding: 4px 8px;
  border: 1px solid var(--cor-borda, #444);
  border-radius: 30px;
  color: var(--cor-texto-suave, #aaa);
  background: var(--cor-fundo, #171717);
  font-size: 0.72rem;
  font-weight: 750;
  white-space: nowrap;
}

.selo-proprietario {
  color: #c4b5fd;
  border-color: #8b5cf655;
  background: #8b5cf51a;
}

.selo-editor {
  color: #93c5fd;
  border-color: #3b82f655;
  background: #3b82f61a;
}

.estado {
  padding: 36px 20px;
  color: var(--cor-texto-suave, #999);
  text-align: center;
}

.vazio {
  border: 1px dashed var(--cor-borda, #444);
  border-radius: 14px;
}

.mensagem {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  margin: 14px 0;
  border-radius: 9px;
}

.erro {
  color: #fca5a5;
  border: 1px solid #ef444455;
  background: #ef444418;
}

.modal-fundo {
  position: fixed;
  z-index: 1500;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 16px;
  overflow-y: auto;
  background: rgb(0 0 0 / 70%);
}

.modal {
  width: min(520px, 100%);
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  padding: 24px;
  border: 1px solid var(--cor-borda, #444);
  border-radius: 14px;
  color: var(--cor-texto, #f5f5f5);
  background: var(--cor-superficie, #222);
  box-shadow: 0 18px 60px rgb(0 0 0 / 25%);
}

.modal-largo {
  width: min(670px, 100%);
}

.modal-cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
}

.modal-cabecalho h2 {
  margin: 7px 0;
  font-size: 1.4rem;
}

.btn-fechar {
  flex: 0 0 auto;
  width: 35px;
  height: 35px;
  border: 1px solid var(--cor-borda, #444);
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
}

.modal form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.modal label {
  margin-top: 7px;
  font-size: 0.86rem;
  font-weight: 650;
}

.modal input,
.modal textarea,
.modal select {
  width: 100%;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--cor-borda, #444);
  border-radius: 8px;
  color: var(--cor-texto, #f5f5f5);
  background: var(--cor-fundo, #171717);
  font: inherit;
}

.modal textarea {
  resize: vertical;
}

.modal-acoes {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  margin-top: 17px;
}

.dica {
  margin: 7px 0;
  color: var(--cor-texto-suave, #999);
  font-size: 0.83rem;
  line-height: 1.5;
}

.bloco-pessoas {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
  padding-top: 15px;
  border-top: 1px solid var(--cor-borda, #444);
}

.bloco-pessoas h3 {
  margin: 0;
  font-size: 1rem;
}

.lista-resultados,
.lista-membros,
.lista-materiais {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.lista-resultados {
  max-height: 190px;
  overflow-y: auto;
}

.item-usuario {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
  padding: 9px;
  border: 1px solid var(--cor-borda, #444);
  border-radius: 9px;
  background: var(--cor-fundo, #171717);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.item-usuario:hover {
  border-color: var(--cor-primaria, #7c3aed);
}

.item-usuario.estatico {
  cursor: default;
}

.avatar {
  display: grid;
  place-items: center;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: white;
  background: var(--cor-primaria, #7c3aed);
  font-size: 0.8rem;
  font-weight: 750;
}

.usuario-dados {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.usuario-dados strong,
.usuario-dados small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.usuario-dados strong {
  font-size: 0.84rem;
}

.usuario-dados small {
  color: var(--cor-texto-suave, #999);
  font-size: 0.76rem;
}

.usuario-selecionado {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--cor-borda, #444);
  border-radius: 10px;
}

.membro {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid var(--cor-borda, #333);
}

.membro:last-child {
  border-bottom: 0;
}

.membro .item-usuario {
  flex: 1;
  width: auto;
  border-color: transparent;
  padding-left: 0;
}

.membro-acoes {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
}

.membro-acoes select {
  width: auto;
  padding: 7px;
}

.modal-materiais {
  width: min(680px, 100%);
}

.form-material {
  padding: 13px;
  border: 1px solid var(--cor-borda, #444);
  border-radius: 10px;
}

.lista-materiais {
  margin-top: 15px;
}

.lista-materiais li {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--cor-borda, #444);
  border-radius: 9px;
  background: var(--cor-fundo, #171717);
}

.material-info {
  min-width: 0;
  overflow-wrap: anywhere;
}

.material-info a {
  color: #c4b5fd;
  font-weight: 700;
}

.material-info p {
  margin: 5px 0;
  color: var(--cor-texto-suave, #aaa);
}

.material-info small {
  color: var(--cor-texto-suave, #888);
}

@media (max-width: 650px) {
  .projetos-container {
    padding: 22px 14px 35px;
  }

  .cabecalho {
    align-items: flex-start;
    flex-direction: column;
  }

  .projeto-card {
    padding: 16px;
  }

  .acoes .btn {
    flex: 1;
  }

  .modal {
    padding: 17px;
  }

  .membro {
    align-items: stretch;
    flex-direction: column;
  }

  .membro-acoes select {
    flex: 1;
  }
}
</style>