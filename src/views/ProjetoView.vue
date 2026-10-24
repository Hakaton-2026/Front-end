
<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useToastStore } from '@/stores/toast'
import { useAuthStore } from '@/stores/auth'
import projetosApi from '@/api/projetosApi'
import tarefasApi from '@/api/tarefasApi'
import usuariosApi from '@/api/usuariosApi'
import '@/assets/taskflow.css'

const router = useRouter()
const toast = useToastStore()
const auth = useAuthStore()

const projetos = ref([])
const tarefasPorProjeto = ref({})
const participantesPorProjeto = ref({})
const loading = ref(false)
const salvando = ref(false)
const excluindoId = ref(null)
const error = ref('')

const novoProjeto = ref('')
const mensagem = ref('')
const tipoMensagem = ref('')

const formularioAberto = ref(false)
const erroFormulario = ref('')
const formulario = ref({
  id: null,
  nome: '',
  descricao: '',
})

const projetoSelecionado = ref(null)
const emailParticipante = ref('')
const usuarioSelecionado = ref(null)
const usuariosSugeridos = ref([])
const buscandoUsuarios = ref(false)
const alterandoPapelId = ref(null)
const mensagemParticipante = ref('')
const tipoMensagemParticipante = ref('')

let temporizadorBusca = null
let sequenciaBusca = 0

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

function extrairLista(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.projetos)) return data.projetos
  if (Array.isArray(data?.usuarios)) return data.usuarios
  return []
}

function mensagemErro(erro, padrao) {
  const dados = erro?.response?.data

  if (typeof dados === 'string') return dados
  if (typeof dados?.detail === 'string') return dados.detail
  if (typeof dados?.mensagem === 'string') return dados.mensagem
  if (typeof dados?.message === 'string') return dados.message

  if (dados && typeof dados === 'object') {
    const mensagens = Object.entries(dados).map(([campo, valor]) => {
      const texto = Array.isArray(valor)
        ? valor.join(', ')
        : String(valor)
      return `${campo}: ${texto}`
    })
    if (mensagens.length) return mensagens.join('\n')
  }

  return erro?.message || padrao
}

async function obterUsuarioAtual() {
  if (auth.isAuthenticated && !auth.user) {
    await auth.fetchUser()
  }
  return auth.user
}

function nomeUsuario(usuario) {
  return usuario?.name || usuario?.nome || usuario?.email || 'Usuário'
}

function nomeExibicaoParticipante(pessoa) {
  return (
    pessoa?.nome ||
    pessoa?.name ||
    pessoa?.usuario?.name ||
    pessoa?.usuario?.nome ||
    pessoa?.email ||
    'Participante'
  )
}

function rotuloPapel(papel) {
  return {
    proprietario: 'Proprietário',
    editor: 'Editor',
    visualizador: 'Visualizador',
  }[papel] || 'Participante'
}

function participantesDoProjeto(projeto) {
  if (!projeto?.id) return []
  return participantesPorProjeto.value[String(projeto.id)] || []
}

function mapearParticipantesProjeto(projeto, membros = []) {
  const lista = []
  const proprietario = projeto?.proprietario

  if (proprietario?.id != null) {
    lista.push({
      id: `proprietario-${proprietario.id}`,
      usuarioId: proprietario.id,
      nome: nomeUsuario(proprietario),
      name: nomeUsuario(proprietario),
      email: proprietario.email || '',
      papel: 'proprietario',
      criador: true,
      usuario: proprietario,
    })
  }

  for (const membro of membros) {
    const usuario = membro?.usuario
    if (!usuario?.id) continue

    if (
      proprietario?.id != null &&
      Number(usuario.id) === Number(proprietario.id)
    ) {
      continue
    }

    lista.push({
      id: membro.id,
      usuarioId: usuario.id,
      nome: nomeUsuario(usuario),
      name: nomeUsuario(usuario),
      email: usuario.email || '',
      papel: membro.papel || 'visualizador',
      criador: false,
      usuario,
    })
  }

  return lista
}

async function carregarMembrosProjeto(projeto) {
  if (!projeto?.id) return

  const resposta = await projetosApi.listarMembros(projeto.id)

  participantesPorProjeto.value = {
    ...participantesPorProjeto.value,
    [String(projeto.id)]: mapearParticipantesProjeto(
      projeto,
      extrairLista(resposta.data)
    ),
  }
}

function usuarioEhParticipante(projeto, usuario) {
  if (!usuario) return false

  const emailUsuario = String(usuario.email || '').trim().toLowerCase()

  return participantesDoProjeto(projeto).some((pessoa) => {
    const mesmoId =
      usuario.id != null &&
      pessoa.usuarioId != null &&
      Number(usuario.id) === Number(pessoa.usuarioId)

    const mesmoEmail =
      Boolean(emailUsuario) &&
      emailUsuario === String(pessoa.email || '').trim().toLowerCase()

    return mesmoId || mesmoEmail
  })
}

function ehProprietario(projeto) {
  if (projeto?.meu_papel === 'proprietario') return true

  const usuario = auth.user
  if (!usuario) return false

  return participantesDoProjeto(projeto).some((pessoa) => {
    if (!pessoa.criador && pessoa.papel !== 'proprietario') return false

    const mesmoId =
      usuario.id != null &&
      pessoa.usuarioId != null &&
      Number(usuario.id) === Number(pessoa.usuarioId)

    const email = String(usuario.email || '').trim().toLowerCase()
    const mesmoEmail =
      Boolean(email) &&
      email === String(pessoa.email || '').trim().toLowerCase()

    return mesmoId || mesmoEmail
  })
}

function podeEditar(projeto) {
  return (
    ['proprietario', 'editor'].includes(projeto?.meu_papel) ||
    ehProprietario(projeto)
  )
}

function papelDoUsuarioNoProjeto(projeto) {
  if (projeto?.meu_papel) return projeto.meu_papel

  const usuario = auth.user
  if (!usuario) return ''

  const pessoa = participantesDoProjeto(projeto).find((participante) => {
    const mesmoId =
      usuario.id != null &&
      participante.usuarioId != null &&
      Number(usuario.id) === Number(participante.usuarioId)

    const email = String(usuario.email || '').trim().toLowerCase()
    const mesmoEmail =
      Boolean(email) &&
      email === String(participante.email || '').trim().toLowerCase()

    return mesmoId || mesmoEmail
  })

  return pessoa?.papel || (ehProprietario(projeto) ? 'proprietario' : '')
}

function proprietarioDoProjeto(projeto) {
  if (projeto?.proprietario) return projeto.proprietario

  const pessoa = participantesDoProjeto(projeto).find(
    (participante) =>
      participante.criador || participante.papel === 'proprietario'
  )

  if (!pessoa) return null

  return {
    id: pessoa.usuarioId,
    name: nomeExibicaoParticipante(pessoa),
    email: pessoa.email,
  }
}

function textoParticipantes(projeto) {
  const total = Math.max(
    Number(projeto?.total_participantes || 0),
    participantesDoProjeto(projeto).length
  )
  return total === 1 ? '1 participante' : `${total} participantes`
}

function idProjetoDaTarefa(tarefa) {
  return tarefa?.projeto?.id ?? tarefa?.projeto
}

function resumoTarefas(projeto) {
  const lista = tarefasPorProjeto.value[String(projeto.id)] || []
  const feitas = lista.filter(
    (tarefa) => Number(tarefa.situacao) === 3
  ).length

  return {
    total: lista.length,
    feitas,
    pendentes: lista.length - feitas,
    porcentagem: lista.length
      ? Math.round((feitas / lista.length) * 100)
      : 0,
  }
}

const resumoProjetos = computed(() =>
  projetos.value.map((projeto) => ({
    ...projeto,
    name: projeto.nome,
    description: projeto.descricao || '',
    color: '#A855F7',
    participantes: participantesDoProjeto(projeto),
    ...resumoTarefas(projeto),
  }))
)

async function carregarResumoTarefas() {
  const resultados = await Promise.all(
    projetos.value.map(async (projeto) => {
      try {
        const resposta = await tarefasApi.obterTodos({
          projeto: projeto.id,
          page_size: 100,
        })

        const lista = extrairLista(resposta.data)

        return [
          String(projeto.id),
          lista.filter(
            (tarefa) =>
              String(idProjetoDaTarefa(tarefa)) === String(projeto.id)
          ),
        ]
      } catch (erro) {
        console.error('Erro ao carregar tarefas:', erro)
        return [String(projeto.id), null]
      }
    })
  )

  const dados = { ...tarefasPorProjeto.value }

  for (const [id, lista] of resultados) {
    if (lista !== null) dados[id] = lista
  }

  tarefasPorProjeto.value = dados
}

async function carregarProjetos() {
  loading.value = true
  error.value = ''

  try {
    await obterUsuarioAtual()

    const resposta = await projetosApi.obterTodos()
    projetos.value = extrairLista(resposta.data)

    const resultados = await Promise.all(
      projetos.value.map(async (projeto) => {
        try {
          const respostaMembros =
            await projetosApi.listarMembros(projeto.id)

          return [
            String(projeto.id),
            mapearParticipantesProjeto(
              projeto,
              extrairLista(respostaMembros.data)
            ),
          ]
        } catch (erro) {
          console.error('Erro ao carregar membros:', erro)
          return [
            String(projeto.id),
            mapearParticipantesProjeto(projeto, []),
          ]
        }
      })
    )

    participantesPorProjeto.value = Object.fromEntries(resultados)
    await carregarResumoTarefas()
  } catch (erro) {
    error.value = mensagemErro(
      erro,
      'Não foi possível carregar os projetos.'
    )
  } finally {
    loading.value = false
  }
}

async function criarProjeto() {
  mensagem.value = ''
  tipoMensagem.value = ''

  const nome = novoProjeto.value.trim()

  if (!nome) {
    mensagem.value = 'Digite o nome do projeto.'
    tipoMensagem.value = 'erro'
    return
  }

  if (nome.length > 45) {
    mensagem.value = 'O nome deve ter no máximo 45 caracteres.'
    tipoMensagem.value = 'erro'
    return
  }

  const existe = projetos.value.some(
    (projeto) =>
      String(projeto.nome || '').trim().toLocaleLowerCase('pt-BR') ===
      nome.toLocaleLowerCase('pt-BR')
  )

  if (existe) {
    mensagem.value = 'Esse projeto já existe.'
    tipoMensagem.value = 'erro'
    return
  }

  salvando.value = true

  try {
    const resposta = await projetosApi.criar({
      nome,
      descricao: '',
    })

    const criado = resposta.data
    projetos.value.unshift(criado)

    tarefasPorProjeto.value = {
      ...tarefasPorProjeto.value,
      [String(criado.id)]: [],
    }

    await carregarMembrosProjeto(criado)

    novoProjeto.value = ''
    mensagem.value = 'Projeto criado com sucesso!'
    tipoMensagem.value = 'sucesso'
  } catch (erro) {
    mensagem.value = mensagemErro(
      erro,
      'Não foi possível criar o projeto.'
    )
    tipoMensagem.value = 'erro'
  } finally {
    salvando.value = false
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
  formulario.value = {
    id: null,
    nome: '',
    descricao: '',
  }
  erroFormulario.value = ''
}

async function salvarProjeto() {
  erroFormulario.value = ''

  const nome = formulario.value.nome.trim()

  if (!nome) {
    erroFormulario.value = 'Informe o nome do projeto.'
    return
  }

  if (nome.length > 45) {
    erroFormulario.value = 'O nome deve ter no máximo 45 caracteres.'
    return
  }

  salvando.value = true

  try {
    const dados = {
      nome,
      descricao: formulario.value.descricao.trim(),
    }

    if (formulario.value.id) {
      await projetosApi.atualizarParcialmente(
        formulario.value.id,
        dados
      )
      toast.showToast('Projeto atualizado.')
    } else {
      await projetosApi.criar(dados)
      toast.showToast('Projeto criado.')
    }

    formularioAberto.value = false
    await carregarProjetos()
  } catch (erro) {
    erroFormulario.value = mensagemErro(
      erro,
      'Não foi possível salvar o projeto.'
    )
  } finally {
    salvando.value = false
  }
}

async function excluirProjeto(projeto) {
  if (!ehProprietario(projeto)) return

  const confirmou = window.confirm(
    `Deseja realmente excluir o projeto "${projeto.nome}"?`
  )
  if (!confirmou) return

  excluindoId.value = projeto.id
  error.value = ''

  try {
    await projetosApi.deletar(projeto.id)

    projetos.value = projetos.value.filter(
      (item) => String(item.id) !== String(projeto.id)
    )

    const tarefas = { ...tarefasPorProjeto.value }
    delete tarefas[String(projeto.id)]
    tarefasPorProjeto.value = tarefas

    const participantes = { ...participantesPorProjeto.value }
    delete participantes[String(projeto.id)]
    participantesPorProjeto.value = participantes

    toast.showToast('Projeto excluído.')
  } catch (erro) {
    error.value = mensagemErro(
      erro,
      'Não foi possível excluir o projeto.'
    )
  } finally {
    excluindoId.value = null
  }
}

function abrirDetalhesProjeto(projeto) {
  router.push({
    name: 'projeto-detalhes',
    params: { id: projeto.id },
  })
}

// ---------------------------------------------------------
// GERENCIAMENTO DE PARTICIPANTES
// ---------------------------------------------------------

function limparBusca() {
  sequenciaBusca++

  if (temporizadorBusca) {
    clearTimeout(temporizadorBusca)
  }

  temporizadorBusca = null
  emailParticipante.value = ''
  usuarioSelecionado.value = null
  usuariosSugeridos.value = []
  buscandoUsuarios.value = false
}

function abrirParticipantes(projeto) {
  projetoSelecionado.value =
    projetoSelecionado.value === String(projeto.id)
      ? null
      : String(projeto.id)

  limparBusca()
  mensagemParticipante.value = ''
  tipoMensagemParticipante.value = ''
}

// Busca automática com debounce.
// Cada resultado é associado à pesquisa que o originou.
function pesquisarUsuarios(projeto) {
  const chamada = ++sequenciaBusca

  if (temporizadorBusca) {
    clearTimeout(temporizadorBusca)
  }

  temporizadorBusca = null
  usuarioSelecionado.value = null
  usuariosSugeridos.value = []
  mensagemParticipante.value = ''
  tipoMensagemParticipante.value = ''

  const termo = emailParticipante.value.trim()

  if (termo.length < 2 || !ehProprietario(projeto)) {
    buscandoUsuarios.value = false
    return
  }

  buscandoUsuarios.value = true

  temporizadorBusca = setTimeout(async () => {
    try {
      const resposta = await usuariosApi.buscar(termo)

      // Impede que resultados antigos substituam a pesquisa atual.
      if (chamada !== sequenciaBusca) return

      usuariosSugeridos.value = extrairLista(resposta.data)
        .filter((usuario) => !usuarioEhParticipante(projeto, usuario))
    } catch (erro) {
      if (chamada !== sequenciaBusca) return

      mensagemParticipante.value = mensagemErro(
        erro,
        'Não foi possível pesquisar usuários.'
      )
      tipoMensagemParticipante.value = 'erro'
    } finally {
      if (chamada === sequenciaBusca) {
        buscandoUsuarios.value = false
      }
    }
  }, 250)
}

function selecionarUsuario(usuario) {
  sequenciaBusca++

  if (temporizadorBusca) {
    clearTimeout(temporizadorBusca)
  }

  temporizadorBusca = null
  usuarioSelecionado.value = usuario
  emailParticipante.value = usuario.email || nomeUsuario(usuario)
  usuariosSugeridos.value = []
  buscandoUsuarios.value = false
}

// Proprietário altera a função diretamente no backend.
async function alterarPapel(projeto, participante, novoPapel) {
  if (!ehProprietario(projeto)) return

  if (
    participante.criador ||
    participante.papel === 'proprietario'
  ) {
    return
  }

  if (!['editor', 'visualizador'].includes(novoPapel)) return
  if (participante.papel === novoPapel) return

  alterandoPapelId.value = String(participante.id)
  mensagemParticipante.value = ''
  tipoMensagemParticipante.value = ''

  try {
    await projetosApi.atualizarMembro(
      projeto.id,
      participante.id,
      { papel: novoPapel }
    )

    await carregarMembrosProjeto(projeto)

    mensagemParticipante.value =
      'Função atualizada com sucesso!'
    tipoMensagemParticipante.value = 'sucesso'
  } catch (erro) {
    mensagemParticipante.value = mensagemErro(
      erro,
      'Não foi possível alterar a função.'
    )
    tipoMensagemParticipante.value = 'erro'

    try {
      await carregarMembrosProjeto(projeto)
    } catch (erroCarregamento) {
      console.error(erroCarregamento)
    }
  } finally {
    alterandoPapelId.value = null
  }
}

async function adicionarParticipante(projeto) {
  mensagemParticipante.value = ''
  tipoMensagemParticipante.value = ''

  if (!ehProprietario(projeto)) {
    mensagemParticipante.value =
      'Somente o proprietário pode adicionar participantes.'
    tipoMensagemParticipante.value = 'erro'
    return
  }

  const usuario = usuarioSelecionado.value

  if (!usuario?.id) {
    mensagemParticipante.value =
      'Selecione uma pessoa nas sugestões da pesquisa.'
    tipoMensagemParticipante.value = 'erro'
    return
  }

  if (usuarioEhParticipante(projeto, usuario)) {
    mensagemParticipante.value =
      'Esta pessoa já participa do projeto.'
    tipoMensagemParticipante.value = 'erro'
    return
  }

  salvando.value = true

  try {
    await projetosApi.adicionarMembro(projeto.id, {
      usuario: Number(usuario.id),
      papel: 'visualizador',
    })

    await carregarMembrosProjeto(projeto)
    limparBusca()

    mensagemParticipante.value =
      'Participante adicionado com sucesso!'
    tipoMensagemParticipante.value = 'sucesso'
  } catch (erro) {
    mensagemParticipante.value = mensagemErro(
      erro,
      'Não foi possível adicionar o participante.'
    )
    tipoMensagemParticipante.value = 'erro'
  } finally {
    salvando.value = false
  }
}

async function removerParticipante(projeto, participante) {
  if (
    !ehProprietario(projeto) ||
    participante.criador ||
    participante.papel === 'proprietario'
  ) {
    mensagemParticipante.value =
      'Somente o proprietário pode remover outros participantes.'
    tipoMensagemParticipante.value = 'erro'
    return
  }

  const nome = nomeExibicaoParticipante(participante)
  if (!window.confirm(`Deseja remover ${nome} deste projeto?`)) {
    return
  }

  mensagemParticipante.value = ''
  tipoMensagemParticipante.value = ''

  try {
    await projetosApi.removerMembro(
      projeto.id,
      participante.id
    )

    await carregarMembrosProjeto(projeto)

    mensagemParticipante.value =
      'Participante removido com sucesso.'
    tipoMensagemParticipante.value = 'sucesso'
  } catch (erro) {
    mensagemParticipante.value = mensagemErro(
      erro,
      'Não foi possível remover o participante.'
    )
    tipoMensagemParticipante.value = 'erro'
  }
}

// ---------------------------------------------------------
// MATERIAIS DE APOIO
// ---------------------------------------------------------

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
    const resposta = await tarefasApi.listarMateriais({
      projeto: id,
    })
    materiaisProjeto.value = extrairLista(resposta.data)
  } catch (erro) {
    erroMateriaisProjeto.value = mensagemErro(
      erro,
      'Não foi possível carregar os materiais.'
    )
  } finally {
    carregandoMateriaisProjeto.value = false
  }
}

async function adicionarMaterialProjeto() {
  const projetoId = projetoMateriaisAtual.value?.id
  if (!projetoId) return

  const titulo = formMaterialProjeto.value.titulo.trim()
  const link = formMaterialProjeto.value.url.trim()

  if (!titulo || !link) {
    erroMateriaisProjeto.value =
      'Informe o título e o link.'
    return
  }

  let urlValidada

  try {
    urlValidada = new URL(link)
    if (!['http:', 'https:'].includes(urlValidada.protocol)) {
      throw new Error('Protocolo inválido')
    }
  } catch {
    erroMateriaisProjeto.value =
      'Informe um link válido iniciado por http:// ou https://.'
    return
  }

  salvandoMaterialProjeto.value = true
  erroMateriaisProjeto.value = ''

  try {
    await tarefasApi.criarMaterial({
      projeto: projetoId,
      titulo,
      url: urlValidada.href,
      descricao: formMaterialProjeto.value.descricao.trim(),
    })

    formMaterialProjeto.value = {
      titulo: '',
      url: '',
      descricao: '',
    }

    await carregarMateriaisProjeto()
    toast.showToast('Material adicionado.')
  } catch (erro) {
    erroMateriaisProjeto.value = mensagemErro(
      erro,
      'Não foi possível adicionar o material.'
    )
  } finally {
    salvandoMaterialProjeto.value = false
  }
}

async function excluirMaterialProjeto(material) {
  if (!window.confirm(`Excluir o material "${material.titulo}"?`)) {
    return
  }

  try {
    await tarefasApi.removerMaterial(material.id)

    materiaisProjeto.value = materiaisProjeto.value.filter(
      (item) => item.id !== material.id
    )

    toast.showToast('Material excluído.')
  } catch (erro) {
    erroMateriaisProjeto.value = mensagemErro(
      erro,
      'Não foi possível excluir o material.'
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
  sequenciaBusca++
  if (temporizadorBusca) {
    clearTimeout(temporizadorBusca)
  }
})
</script>

<template>
  <main class="tf-page projetos-container">
    <header class="tf-page-header projetos-header">
      <div>
        <span class="tf-eyebrow">ORGANIZAÇÃO</span>
        <h1>Meus projetos</h1>
        <p>Organize seus projetos, tarefas e participantes.</p>
      </div>

      <RouterLink to="/" class="tf-button tf-button-secondary">
        <ion-icon name="arrow-back-outline"></ion-icon>
        Voltar ao início
      </RouterLink>
    </header>

    <form class="tf-create-project" @submit.prevent="criarProjeto">
      <label for="nomeProjeto">Criar novo projeto</label>

      <div class="tf-form-row">
        <input
          id="nomeProjeto"
          v-model="novoProjeto"
          type="text"
          placeholder="Ex.: Trabalho de informática"
          maxlength="45"
          required
        />

        <button
          type="submit"
          class="tf-button botao-principal"
          :disabled="salvando"
        >
          <ion-icon name="add-outline"></ion-icon>
          {{ salvando ? 'Criando...' : 'Criar projeto' }}
        </button>
      </div>

      <p
        v-if="mensagem"
        class="tf-message"
        :class="`tf-message-${tipoMensagem}`"
        aria-live="polite"
      >
        {{ mensagem }}
      </p>

      <p v-if="error" class="tf-message tf-message-erro" role="alert">
        {{ error }}
        <button
          type="button"
          class="tf-text-link"
          @click="carregarProjetos"
        >
          Tentar novamente
        </button>
      </p>
    </form>

    <section class="tf-project-grid projetos-grid">
      <article
        v-for="projeto in resumoProjetos"
        :key="projeto.id"
        class="tf-project-card projeto-card"
      >
        <div class="tf-project-heading">
          <span
            class="tf-project-dot"
            :style="{ backgroundColor: projeto.color }"
          ></span>
          <h2>{{ projeto.name }}</h2>
        </div>

        <p class="tf-project-description">
          {{ projeto.description || 'Sem descrição.' }}
        </p>

        <div
          v-if="proprietarioDoProjeto(projeto)"
          class="tf-project-owner"
        >
          Proprietário:
          {{ nomeUsuario(proprietarioDoProjeto(projeto)) }}
        </div>

        <div
          v-if="papelDoUsuarioNoProjeto(projeto)"
          class="tf-project-role"
        >
          {{ rotuloPapel(papelDoUsuarioNoProjeto(projeto)) }}
        </div>

        <div class="tf-project-description tf-task-summary">
          {{ projeto.total }}
          {{ projeto.total === 1 ? 'tarefa' : 'tarefas' }}
          cadastradas
        </div>

        <div class="tf-progress-info">
          <span>Progresso</span>
          <strong>{{ projeto.porcentagem }}%</strong>
        </div>

        <div
          class="tf-progress-track"
          role="progressbar"
          :aria-valuenow="projeto.porcentagem"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="`Progresso de ${projeto.name}`"
        >
          <div
            class="tf-progress-fill"
            :style="{ width: `${projeto.porcentagem}%` }"
          ></div>
        </div>

        <div class="tf-project-stats">
          <span>
            <ion-icon name="checkmark-circle-outline"></ion-icon>
            {{ projeto.feitas }} concluídas
          </span>

          <span>
            <ion-icon name="time-outline"></ion-icon>
            {{ projeto.pendentes }} pendentes
          </span>

          <span>
            <ion-icon name="people-outline"></ion-icon>
            {{ textoParticipantes(projeto) }}
          </span>
        </div>

        <div class="tf-project-actions">
          <button
            type="button"
            class="tf-project-link"
            @click="abrirDetalhesProjeto(projeto)"
          >
            <ion-icon name="list-outline"></ion-icon>
            <span>Ver tarefas</span>
            <ion-icon name="arrow-forward-outline"></ion-icon>
          </button>

          <button
            type="button"
            class="tf-project-link"
            @click="abrirMateriaisProjeto(projeto)"
          >
            <ion-icon name="document-attach-outline"></ion-icon>
            <span>Materiais de apoio</span>
            <ion-icon name="arrow-forward-outline"></ion-icon>
          </button>

          <button
            type="button"
            class="tf-project-link tf-participants-link"
            :aria-expanded="projetoSelecionado === String(projeto.id)"
            @click="abrirParticipantes(projeto)"
          >
            <ion-icon name="people-outline"></ion-icon>
            <span>
              {{
                projetoSelecionado === String(projeto.id)
                  ? 'Fechar participantes'
                  : 'Gerenciar participantes'
              }}
            </span>
            <ion-icon
              :name="
                projetoSelecionado === String(projeto.id)
                  ? 'chevron-up-outline'
                  : 'chevron-down-outline'
              "
            ></ion-icon>
          </button>

          <button
            v-if="podeEditar(projeto)"
            type="button"
            class="tf-project-link"
            @click="abrirFormulario(projeto)"
          >
            <ion-icon name="create-outline"></ion-icon>
            <span>Editar projeto</span>
          </button>

          <button
            v-if="ehProprietario(projeto)"
            type="button"
            class="tf-project-link tf-delete-project"
            :disabled="excluindoId === projeto.id"
            @click="excluirProjeto(projeto)"
          >
            <ion-icon name="trash-outline"></ion-icon>
            <span>
              {{
                excluindoId === projeto.id
                  ? 'Excluindo...'
                  : 'Excluir projeto'
              }}
            </span>
          </button>
        </div>

        <!-- Gerenciamento dos participantes -->
        <section
          v-if="projetoSelecionado === String(projeto.id)"
          class="tf-participants-panel"
        >
          <h3>
            <ion-icon name="person-add-outline"></ion-icon>
            Adicionar pessoa
          </h3>

          <form
            v-if="ehProprietario(projeto)"
            @submit.prevent="adicionarParticipante(projeto)"
          >
            <div class="tf-participant-field tf-autocomplete">
              <label :for="`email-${projeto.id}`">
                Nome ou e-mail do participante
              </label>

              <input
                :id="`email-${projeto.id}`"
                v-model="emailParticipante"
                type="text"
                placeholder="Comece a digitar um nome ou e-mail..."
                maxlength="254"
                autocomplete="off"
                aria-autocomplete="list"
                :aria-expanded="usuariosSugeridos.length > 0"
                @input="pesquisarUsuarios(projeto)"
              />

              <p
                v-if="buscandoUsuarios"
                class="tf-search-status"
                aria-live="polite"
              >
                Pesquisando usuários...
              </p>

              <!-- Sugestões aparecem enquanto se digita -->
              <div
                v-else-if="usuariosSugeridos.length"
                class="tf-search-results"
                role="listbox"
                aria-label="Usuários encontrados"
              >
                <button
                  v-for="usuario in usuariosSugeridos"
                  :key="usuario.id"
                  type="button"
                  role="option"
                  class="tf-search-option"
                  :aria-selected="false"
                  @click="selecionarUsuario(usuario)"
                >
                  <span class="tf-participant-avatar">
                    {{
                      nomeUsuario(usuario)
                        .charAt(0)
                        .toLocaleUpperCase('pt-BR')
                    }}
                  </span>

                  <span class="tf-search-user">
                    <strong>{{ nomeUsuario(usuario) }}</strong>
                    <small>{{ usuario.email }}</small>
                  </span>

                  <ion-icon name="add-circle-outline"></ion-icon>
                </button>
              </div>

              <p
                v-else-if="
                  emailParticipante.trim().length >= 2 &&
                  !usuarioSelecionado &&
                  !buscandoUsuarios &&
                  !mensagemParticipante
                "
                class="tf-search-status"
              >
                Nenhum usuário disponível com esse nome ou e-mail.
              </p>

              <div
                v-if="usuarioSelecionado"
                class="tf-selected-user"
              >
                <ion-icon name="checkmark-circle-outline"></ion-icon>

                <span>
                  Selecionado:
                  <strong>
                    {{ nomeUsuario(usuarioSelecionado) }}
                  </strong>
                </span>

                <button
                  type="button"
                  aria-label="Limpar seleção"
                  title="Limpar seleção"
                  @click="limparBusca"
                >
                  <ion-icon name="close-outline"></ion-icon>
                </button>
              </div>
            </div>

            <button
              type="submit"
              class="tf-button tf-add-participant botao-principal"
              :disabled="salvando || !usuarioSelecionado"
            >
              <ion-icon name="person-add-outline"></ion-icon>
              {{
                salvando
                  ? 'Adicionando...'
                  : 'Adicionar participante'
              }}
            </button>
          </form>

          <p v-else class="tf-project-description">
            Somente o proprietário pode adicionar, remover
            ou alterar participantes.
          </p>

          <p
            v-if="mensagemParticipante"
            class="tf-participant-message"
            :class="`tf-message-${tipoMensagemParticipante}`"
            aria-live="polite"
          >
            {{ mensagemParticipante }}
          </p>

          <div class="tf-participant-divider"></div>

          <h3>
            Pessoas no projeto
            <span class="tf-participant-count">
              {{ projeto.participantes.length }}
            </span>
          </h3>

          <div
            v-if="projeto.participantes.length"
            class="tf-participant-list"
          >
            <div
              v-for="pessoa in projeto.participantes"
              :key="pessoa.id"
              class="tf-participant-item"
            >
              <div class="tf-participant-avatar">
                {{
                  nomeExibicaoParticipante(pessoa)
                    .charAt(0)
                    .toLocaleUpperCase('pt-BR')
                }}
              </div>

              <div class="tf-participant-info">
                <strong>
                  {{ nomeExibicaoParticipante(pessoa) }}
                </strong>
                <span>{{ pessoa.email }}</span>

                <small
                  v-if="
                    pessoa.criador ||
                    pessoa.papel === 'proprietario'
                  "
                >
                  Proprietário
                </small>
              </div>

              <!-- Alteração de função -->
              <div class="tf-participant-role">
                <span
                  v-if="
                    pessoa.criador ||
                    pessoa.papel === 'proprietario'
                  "
                  class="tf-owner-label"
                >
                  Proprietário
                </span>

                <select
                  v-else
                  :value="pessoa.papel"
                  :disabled="
                    !ehProprietario(projeto) ||
                    alterandoPapelId === String(pessoa.id)
                  "
                  :aria-label="
                    `Função de ${nomeExibicaoParticipante(pessoa)}`
                  "
                  @change="
                    alterarPapel(
                      projeto,
                      pessoa,
                      $event.target.value
                    )
                  "
                >
                  <option value="visualizador">
                    Visualizador
                  </option>
                  <option value="editor">
                    Editor
                  </option>
                </select>
              </div>

              <button
                v-if="
                  ehProprietario(projeto) &&
                  !pessoa.criador &&
                  pessoa.papel !== 'proprietario'
                "
                type="button"
                class="tf-remove-participant"
                :aria-label="
                  `Remover ${nomeExibicaoParticipante(pessoa)}`
                "
                title="Remover participante"
                @click="removerParticipante(projeto, pessoa)"
              >
                <ion-icon name="trash-outline"></ion-icon>
              </button>
            </div>
          </div>

          <div v-else class="tf-participants-empty">
            <ion-icon name="people-outline"></ion-icon>
            <p>Nenhuma pessoa adicionada ainda.</p>
          </div>
        </section>
      </article>

      <div
        v-if="!loading && resumoProjetos.length === 0"
        class="tf-empty"
      >
        <ion-icon name="folder-open-outline"></ion-icon>
        <h2>Nenhum projeto cadastrado</h2>
        <p>Crie seu primeiro projeto usando o formulário acima.</p>
      </div>

      <div v-if="loading" class="tf-empty">
        <p>Carregando projetos...</p>
      </div>
    </section>

    <!-- Modal de edição -->
    <div
      v-if="formularioAberto"
      class="tf-modal-backdrop"
      @click.self="fecharFormulario"
    >
      <section
        class="tf-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-formulario"
      >
        <header class="tf-modal-header">
          <div>
            <span class="tf-eyebrow">CONFIGURAÇÕES</span>
            <h2 id="titulo-formulario">Editar projeto</h2>
          </div>

          <button
            type="button"
            class="tf-modal-close"
            aria-label="Fechar"
            @click="fecharFormulario"
          >
            ×
          </button>
        </header>

        <form @submit.prevent="salvarProjeto">
          <div class="tf-participant-field">
            <label for="editar-nome-projeto">
              Nome do projeto
            </label>
            <input
              id="editar-nome-projeto"
              v-model="formulario.nome"
              type="text"
              maxlength="45"
              required
            />
          </div>

          <div class="tf-participant-field">
            <label for="editar-descricao-projeto">
              Descrição
            </label>
            <textarea
              id="editar-descricao-projeto"
              v-model="formulario.descricao"
              maxlength="255"
              rows="4"
              placeholder="Descreva o objetivo do projeto"
            ></textarea>
          </div>

          <p
            v-if="erroFormulario"
            class="tf-message tf-message-erro"
            role="alert"
          >
            {{ erroFormulario }}
          </p>

          <div class="tf-modal-actions">
            <button
              type="button"
              class="tf-button tf-button-secondary"
              :disabled="salvando"
              @click="fecharFormulario"
            >
              Cancelar
            </button>

            <button
              type="submit"
              class="tf-button botao-principal"
              :disabled="salvando"
            >
              {{ salvando ? 'Salvando...' : 'Salvar projeto' }}
            </button>
          </div>
        </form>
      </section>
    </div>

    <!-- Modal de materiais -->
    <div
      v-if="modalMateriaisAberto"
      class="tf-modal-backdrop"
      @click.self="fecharModalMateriais"
    >
      <section
        class="tf-modal tf-modal-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-materiais"
      >
        <header class="tf-modal-header">
          <div>
            <span class="tf-eyebrow">
              RECURSOS DO PROJETO
            </span>
            <h2 id="titulo-materiais">Materiais de apoio</h2>
            <p>{{ projetoMateriaisAtual?.nome }}</p>
          </div>

          <button
            type="button"
            class="tf-modal-close"
            aria-label="Fechar"
            @click="fecharModalMateriais"
          >
            ×
          </button>
        </header>

        <p
          v-if="erroMateriaisProjeto"
          class="tf-message tf-message-erro"
          role="alert"
        >
          {{ erroMateriaisProjeto }}
        </p>

        <p
          v-if="carregandoMateriaisProjeto"
          class="tf-project-description"
        >
          Carregando materiais...
        </p>

        <form
          v-if="podeEditar(projetoMateriaisAtual || {})"
          class="tf-material-form"
          @submit.prevent="adicionarMaterialProjeto"
        >
          <h3>Adicionar material</h3>

          <div class="tf-participant-field">
            <label for="material-titulo">Título</label>
            <input
              id="material-titulo"
              v-model="formMaterialProjeto.titulo"
              maxlength="100"
              required
              placeholder="Documento de requisitos"
            />
          </div>

          <div class="tf-participant-field">
            <label for="material-url">Link</label>
            <input
              id="material-url"
              v-model="formMaterialProjeto.url"
              type="url"
              maxlength="500"
              required
              placeholder="https://..."
            />
          </div>

          <div class="tf-participant-field">
            <label for="material-descricao">Descrição</label>
            <textarea
              id="material-descricao"
              v-model="formMaterialProjeto.descricao"
              maxlength="255"
              rows="2"
              placeholder="Descrição opcional"
            ></textarea>
          </div>

          <button
            type="submit"
            class="tf-button tf-add-participant"
            :disabled="salvandoMaterialProjeto"
          >
            {{
              salvandoMaterialProjeto
                ? 'Salvando...'
                : 'Adicionar material'
            }}
          </button>
        </form>

        <div
          v-if="materiaisProjeto.length"
          class="tf-material-list"
        >
          <article
            v-for="material in materiaisProjeto"
            :key="material.id"
            class="tf-material-item"
          >
            <div class="tf-material-info">
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
              class="tf-remove-participant"
              :aria-label="`Excluir ${material.titulo}`"
              title="Excluir material"
              @click="excluirMaterialProjeto(material)"
            >
              <ion-icon name="trash-outline"></ion-icon>
            </button>
          </article>
        </div>

        <p
          v-else-if="!carregandoMateriaisProjeto"
          class="tf-participants-empty"
        >
          Nenhum material cadastrado.
        </p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.tf-page {
  background: var(--cor-fundo);
  color: var(--cor-texto);
}

.tf-page-header h1,
.tf-project-card h2 {
  color: var(--cor-texto);
}

.tf-page-header p,
.tf-project-description {
  color: var(--cor-texto-suave);
}

.tf-create-project,
.tf-project-card {
  background: var(--cor-superficie);
  color: var(--cor-texto);
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
}

.tf-create-project {
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.tf-create-project label,
.tf-participant-field label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--cor-texto);
  font-weight: 600;
}

.tf-form-row {
  display: flex;
  gap: 0.75rem;
}

.tf-form-row input,
.tf-participant-field input,
.tf-participant-field textarea {
  width: 100%;
  min-width: 0;
  padding: 0.75rem;
  background: var(--cor-superficie);
  color: var(--cor-texto);
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  font: inherit;
}

.tf-form-row input:focus,
.tf-participant-field input:focus,
.tf-participant-field textarea:focus {
  outline: 1px solid #a855f7;
  border-color: #a855f7;
}

.tf-create-project .tf-button,
.tf-add-participant {
  background: #a855f7;
  color: #fff;
  border: 1px solid #a855f7;
  border-radius: var(--raio);
}

.tf-create-project .tf-button:hover,
.tf-add-participant:hover {
  background: #9333ea;
  border-color: #9333ea;
}

.tf-project-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 1.25rem;
  transition: border-color 0.2s ease;
}

.tf-project-card:hover {
  border-color: #a855f7;
}

.tf-project-heading {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.tf-project-heading h2 {
  overflow-wrap: anywhere;
  font-size: 1.15rem;
}

.tf-project-dot {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #a855f7;
}

.tf-project-owner,
.tf-project-role {
  margin-top: 0.55rem;
  color: var(--cor-texto-suave);
  font-size: 0.82rem;
  overflow-wrap: anywhere;
}

.tf-project-role {
  color: #a855f7;
  font-weight: 600;
}

.tf-task-summary {
  margin-top: 0.75rem;
}

.tf-progress-info {
  display: flex;
  justify-content: space-between;
  margin: 1rem 0 0.5rem;
  color: var(--cor-texto-suave);
}

.tf-progress-info strong {
  color: #a855f7;
}

.tf-progress-track {
  height: 8px;
  overflow: hidden;
  background: var(--cor-superficie-hover);
  border-radius: 999px;
}

.tf-progress-fill {
  height: 100%;
  background: #a855f7 !important;
  border-radius: inherit;
  transition: width 0.3s ease;
}

.tf-project-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem 1rem;
  margin-top: 1rem;
  color: var(--cor-texto-suave);
  font-size: 0.85rem;
}

.tf-project-stats span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.tf-project-stats ion-icon {
  color: #a855f7;
}

.tf-project-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1.25rem;
}

.tf-project-actions .tf-project-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.75rem;
  background: transparent;
  color: var(--cor-texto);
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  text-decoration: none;
  text-align: left;
  cursor: pointer;
  font: inherit;
}

.tf-project-link span {
  flex: 1;
}

.tf-project-link:hover {
  background: var(--cor-superficie-hover);
  border-color: #a855f7;
}

.tf-project-actions .tf-participants-link {
  color: #a855f7;
}

.tf-project-actions .tf-delete-project {
  color: #ef4444;
}

.tf-project-link:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tf-participants-panel {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--cor-fundo);
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
}

.tf-participants-panel h3,
.tf-material-form h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  color: var(--cor-texto);
  font-size: 1rem;
}

.tf-participants-panel h3 ion-icon {
  color: #a855f7;
}

.tf-participant-field {
  margin-bottom: 0.9rem;
}

.tf-add-participant {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  cursor: pointer;
}

.tf-participant-divider {
  height: 1px;
  margin: 1.25rem 0;
  background: var(--cor-borda);
}

.tf-participant-count {
  display: grid;
  place-items: center;
  min-width: 24px;
  height: 24px;
  padding: 0 0.4rem;
  background: #a855f7;
  color: #fff;
  border-radius: 999px;
  font-size: 0.75rem;
}

.tf-participant-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tf-participant-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.tf-participant-avatar {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #a855f7;
  color: #fff;
  font-weight: 700;
}

.tf-participant-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.tf-participant-info strong {
  color: var(--cor-texto);
  font-size: 0.85rem;
}

.tf-participant-info span {
  color: var(--cor-texto-suave);
  font-size: 0.75rem;
  overflow-wrap: anywhere;
}

.tf-participant-info small {
  color: #a855f7;
  font-size: 0.72rem;
  font-weight: 600;
}

.tf-remove-participant {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  background: transparent;
  color: #ef4444;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  cursor: pointer;
}

.tf-remove-participant:hover {
  background: var(--cor-superficie-hover);
  border-color: #ef4444;
}

.tf-participants-empty,
.tf-empty {
  padding: 1.5rem 0.5rem;
  color: var(--cor-texto-suave);
  text-align: center;
}

.tf-participants-empty ion-icon,
.tf-empty > ion-icon {
  font-size: 2rem;
  color: #a855f7;
}

.tf-message-erro {
  color: #ef4444;
  white-space: pre-line;
}

.tf-message-sucesso {
  color: #16a34a;
}

/* Pesquisa dinâmica */

.tf-autocomplete {
  position: relative;
}

.tf-search-results {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  z-index: 40;
  max-height: 260px;
  overflow-y: auto;
  background: var(--cor-superficie);
  border: 1px solid #a855f7;
  border-radius: var(--raio);
  box-shadow: 0 8px 24px rgb(0 0 0 / 25%);
}

.tf-search-option {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.65rem;
  border: 0;
  border-bottom: 1px solid var(--cor-borda);
  background: var(--cor-superficie);
  color: var(--cor-texto);
  text-align: left;
  cursor: pointer;
}

.tf-search-option:hover,
.tf-search-option:focus {
  background: var(--cor-superficie-hover);
}

.tf-search-user {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.tf-search-user strong {
  overflow-wrap: anywhere;
}

.tf-search-user small {
  color: var(--cor-texto-suave);
  overflow-wrap: anywhere;
}

.tf-search-status {
  color: var(--cor-texto-suave);
  font-size: 0.85rem;
}

.tf-selected-user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.6rem;
  border: 1px solid #a855f7;
  border-radius: var(--raio);
  color: var(--cor-texto);
}

.tf-selected-user > ion-icon {
  color: #a855f7;
}

.tf-selected-user span {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.tf-selected-user button {
  background: none;
  color: var(--cor-texto);
  border: 0;
  cursor: pointer;
}

/* Alteração da função */

.tf-participant-role select {
  max-width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  background: var(--cor-superficie);
  color: var(--cor-texto);
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
}

.tf-participant-role select:focus {
  border-color: #a855f7;
  outline: 1px solid #a855f7;
}

.tf-participant-role select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tf-owner-label {
  color: #a855f7;
  font-size: 0.75rem;
  font-weight: 600;
}

.tf-add-participant:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modais */

.tf-modal-backdrop {
  position: fixed;
  z-index: 1500;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  overflow-y: auto;
  background: rgb(0 0 0 / 70%);
}

.tf-modal {
  width: min(520px, 100%);
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  padding: 1.5rem;
  background: var(--cor-superficie);
  color: var(--cor-texto);
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  box-shadow: 0 18px 60px rgb(0 0 0 / 25%);
}

.tf-modal-wide {
  width: min(680px, 100%);
}

.tf-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.tf-modal-header h2 {
  margin: 0.45rem 0;
  font-size: 1.4rem;
}

.tf-modal-header p {
  margin: 0;
  color: var(--cor-texto-suave);
  overflow-wrap: anywhere;
}

.tf-modal-close {
  display: grid;
  place-items: center;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  background: transparent;
  color: var(--cor-texto);
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  font-size: 1.5rem;
  cursor: pointer;
}

.tf-modal-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1.25rem;
}

.tf-modal form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tf-material-form {
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
}

.tf-material-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.tf-material-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.9rem;
  background: var(--cor-fundo);
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
}

.tf-material-info {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.tf-material-info a {
  color: #a855f7;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.tf-material-info p {
  margin: 0.4rem 0;
  color: var(--cor-texto-suave);
}

.tf-material-info small {
  display: block;
  margin-top: 0.35rem;
  color: var(--cor-texto-suave);
  overflow-wrap: anywhere;
}

@media (max-width: 768px) {
  .tf-page {
    padding: 1rem;
  }

  .tf-form-row {
    flex-direction: column;
  }

  .tf-form-row .tf-button {
    justify-content: center;
  }

  .tf-project-card {
    padding: 1rem;
  }

  .tf-participants-panel {
    padding: 0.8rem;
  }

  .tf-modal {
    padding: 1rem;
  }

  .tf-modal-actions {
    flex-direction: column-reverse;
  }

  .tf-modal-actions .tf-button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 580px) {
  .tf-participant-item {
    flex-wrap: wrap;
  }

  .tf-participant-role {
    margin-left: 50px;
  }
}
</style>