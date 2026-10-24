<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useTarefasStore } from '@/stores/tarefas'
import { useAuthStore } from '@/stores/auth'
import projetosApi from '@/api/projetosApi'
import tarefasApi from '@/api/tarefasApi'

const store = useTarefasStore()
const auth = useAuthStore()

const colunas = [
  { id: 1, titulo: 'A fazer', cor: '#64748b' },
  { id: 2, titulo: 'Em andamento', cor: '#d97706' },
  { id: 3, titulo: 'Concluído', cor: '#16a34a' },
]

// Tipos de filtro disponíveis ao lado da busca.
const tiposFiltro = [
  { id: 'todos', rotulo: 'Todos os campos' },
  { id: 'titulo', rotulo: 'Título' },
  { id: 'descricao', rotulo: 'Descrição' },
  { id: 'prioridade', rotulo: 'Prioridade' },
  { id: 'situacao', rotulo: 'Situação' },
  { id: 'prazo', rotulo: 'Prazo' },
]

const opcoesPrioridade = [
  { id: 1, rotulo: 'Baixa' },
  { id: 2, rotulo: 'Média' },
  { id: 3, rotulo: 'Alta' },
  { id: 4, rotulo: 'Urgente' },
]

const opcoesPrazo = [
  { id: 'atrasadas', rotulo: 'Atrasadas' },
  { id: 'hoje', rotulo: 'Vencem hoje' },
  { id: 'semana', rotulo: 'Próximos 7 dias' },
  { id: 'data', rotulo: 'Data específica' },
]

const projetos = ref([])
const carregandoProjetos = ref(false)
const erroProjetos = ref('')
const abaAtiva = ref('kanban')
const tipoFiltro = ref('todos')
const filtro = ref('')
const filtroData = ref('')
const filtroProjeto = ref('')
const modalAberto = ref(false)
const tarefaEditando = ref(null)
const salvando = ref(false)
const mensagem = ref('')
const tipoMensagem = ref('sucesso')
const responsaveis = ref([])
const carregandoResponsaveis = ref(false)
const erroResponsaveis = ref('')

const detalheAberto = ref(false)
const tarefaDetalhada = ref(null)
const carregandoDetalhes = ref(false)
const checklist = ref([])
const comentarios = ref([])
const materiais = ref([])
const textoChecklist = ref('')
const textoComentario = ref('')
const novoMaterial = reactive({
  titulo: '',
  url: '',
  descricao: '',
})
const salvandoChecklist = ref(false)
const salvandoComentario = ref(false)
const salvandoMaterial = ref(false)
const tarefaArrastada = ref(null)

function dataLocal(data = new Date()) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}

function formatarData(data) {
  if (!data) return 'Sem data'

  const [ano, mes, dia] = String(data).slice(0, 10).split('-')

  if (!ano || !mes || !dia) return 'Sem data'

  return `${dia}/${mes}/${ano}`
}

function extrairLista(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results

  return []
}

function mensagemErro(erro, padrao) {
  const dados = erro?.response?.data

  if (typeof dados === 'string') return dados
  if (typeof dados?.detail === 'string') return dados.detail

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

function mostrarMensagem(texto, tipo = 'sucesso') {
  mensagem.value = texto
  tipoMensagem.value = tipo
}

/* ------------------------------------------------------------------
 * Filtros da listagem (busca + tipo de filtro)
 * ------------------------------------------------------------------ */

function contem(valor, termo) {
  return String(valor || '')
    .toLocaleLowerCase('pt-BR')
    .includes(termo.toLocaleLowerCase('pt-BR'))
}

function dataComDias(dias) {
  const data = new Date()
  data.setDate(data.getDate() + dias)

  return dataLocal(data)
}

function prazoDaTarefa(tarefa) {
  return String(tarefa.prazoFim || tarefa.prazoInicio || '').slice(0, 10)
}

function correspondePrazo(tarefa, opcao) {
  const prazo = prazoDaTarefa(tarefa)

  if (!prazo) return false

  const hoje = dataLocal()

  if (opcao === 'atrasadas') {
    return prazo < hoje && Number(tarefa.situacao) !== 3
  }

  if (opcao === 'hoje') return prazo === hoje

  if (opcao === 'semana') {
    return prazo >= hoje && prazo <= dataComDias(7)
  }

  if (opcao === 'data') {
    return !filtroData.value || prazo === filtroData.value
  }

  return true
}

function correspondeFiltro(tarefa) {
  const valor = String(filtro.value ?? '').trim()

  if (!valor) return true

  switch (tipoFiltro.value) {
    case 'titulo':
      return contem(tarefa.titulo, valor)

    case 'descricao':
      return contem(tarefa.descricao, valor)

    case 'prioridade':
      return Number(tarefa.prioridade) === Number(valor)

    case 'situacao':
      return Number(tarefa.situacao) === Number(valor)

    case 'prazo':
      return correspondePrazo(tarefa, valor)

    default:
      return [tarefa.titulo, tarefa.descricao, tarefa.texto].some(
        (campo) => contem(campo, valor),
      )
  }
}

const filtroEhTexto = computed(() =>
  ['todos', 'titulo', 'descricao'].includes(tipoFiltro.value),
)

const placeholderBusca = computed(() => ({
  todos: 'Buscar tarefas...',
  titulo: 'Buscar no título...',
  descricao: 'Buscar na descrição...',
})[tipoFiltro.value] || 'Buscar tarefas...')

// Ao trocar o tipo de filtro, o valor anterior deixa de fazer sentido.
watch(tipoFiltro, () => {
  filtro.value = ''
  filtroData.value = ''
})

/* ------------------------------------------------------------------
 * Alerta de prazo (cor das bordas + notificação)
 *
 *  verde    -> tarefa concluída
 *  amarelo  -> tarefa em andamento
 *  laranja  -> o tempo está acabando (faltam poucos dias)
 *  vermelho -> prazo crítico (hoje/amanhã) ou atrasada, com aviso
 *
 * Concluída é sempre verde. Para as demais, o prazo (laranja/vermelho)
 * tem prioridade sobre o amarelo de "em andamento".
 * ------------------------------------------------------------------ */

// Limites em dias restantes até o prazo final. Ajuste aqui se quiser.
const DIAS_ALERTA_LARANJA = 3 // faltam até 3 dias
const DIAS_ALERTA_VERMELHO = 1 // vence hoje ou amanhã (ou já passou)

// "Agora" reativo: atualiza a cada minuto para os alertas mudarem
// sozinhos com a página aberta (inclusive na virada do dia).
const agora = ref(Date.now())
let temporizadorAlerta = null

// Guarda quais tarefas críticas o usuário já dispensou no aviso.
const alertaDispensado = ref('')

function pluralDias(quantidade) {
  return `${quantidade} ${quantidade === 1 ? 'dia' : 'dias'}`
}

const legendaAlerta = [
  { nivel: 'verde', rotulo: 'Concluída' },
  { nivel: 'amarelo', rotulo: 'Em andamento' },
  {
    nivel: 'laranja',
    rotulo: `Tempo acabando (até ${pluralDias(DIAS_ALERTA_LARANJA)})`,
  },
  {
    nivel: 'vermelho',
    rotulo: `Crítica (até ${pluralDias(DIAS_ALERTA_VERMELHO)}) ou atrasada`,
  },
]

function diasAteDataIso(dataIso) {
  const [ano, mes, dia] = String(dataIso).split('-').map(Number)

  if (!ano || !mes || !dia) return null

  const hoje = new Date(agora.value)

  const inicioHoje = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate(),
  )

  const alvo = new Date(ano, mes - 1, dia)

  return Math.round((alvo - inicioHoje) / 86400000)
}

function alertaDaTarefa(tarefa) {
  const situacao = Number(tarefa.situacao)

  if (situacao === 3) {
    return {
      nivel: 'verde',
      rotulo: 'Concluída',
      icone: 'checkmark-circle-outline',
    }
  }

  const dias = diasAteDataIso(prazoDaTarefa(tarefa))

  if (dias !== null) {
    if (dias < 0) {
      return {
        nivel: 'vermelho',
        rotulo: `Atrasada há ${pluralDias(-dias)}`,
        icone: 'alert-circle-outline',
      }
    }

    if (dias === 0) {
      return {
        nivel: 'vermelho',
        rotulo: 'Vence hoje',
        icone: 'alert-circle-outline',
      }
    }

    if (dias <= DIAS_ALERTA_VERMELHO) {
      return {
        nivel: 'vermelho',
        rotulo: dias === 1 ? 'Vence amanhã' : `Faltam ${pluralDias(dias)}`,
        icone: 'alert-circle-outline',
      }
    }

    if (dias <= DIAS_ALERTA_LARANJA) {
      return {
        nivel: 'laranja',
        rotulo: `Faltam ${pluralDias(dias)}`,
        icone: 'hourglass-outline',
      }
    }
  }

  if (situacao === 2) {
    return {
      nivel: 'amarelo',
      rotulo: 'Em andamento',
      icone: 'time-outline',
    }
  }

  return { nivel: 'neutro', rotulo: '', icone: '' }
}

function classeAlerta(tarefa) {
  const { nivel } = alertaDaTarefa(tarefa)

  return nivel === 'neutro' ? '' : `alerta-${nivel}`
}

function rotuloAlerta(tarefa) {
  return alertaDaTarefa(tarefa).rotulo
}

function iconeAlerta(tarefa) {
  return alertaDaTarefa(tarefa).icone
}

// Notificação: tarefas do próprio usuário que estão no vermelho.
const tarefasCriticasMinhas = computed(() =>
  store.tarefas
    .filter(
      (tarefa) =>
        Number(tarefa.user) === Number(auth.user?.id) &&
        alertaDaTarefa(tarefa).nivel === 'vermelho',
    )
    .sort((a, b) =>
      prazoDaTarefa(a).localeCompare(prazoDaTarefa(b)),
    ),
)

const chaveAlerta = computed(() =>
  tarefasCriticasMinhas.value.map((tarefa) => tarefa.id).join(','),
)

// Reaparece sozinho quando surge uma nova tarefa crítica.
const mostrarAlerta = computed(() =>
  tarefasCriticasMinhas.value.length > 0 &&
  alertaDispensado.value !== chaveAlerta.value,
)

const tituloAlerta = computed(() => {
  const total = tarefasCriticasMinhas.value.length

  return total === 1
    ? 'Atenção: você tem 1 tarefa com o tempo acabando'
    : `Atenção: você tem ${total} tarefas com o tempo acabando`
})

function dispensarAlerta() {
  alertaDispensado.value = chaveAlerta.value
}

const projetosEditaveis = computed(() =>
  projetos.value.filter((projeto) =>
    ['proprietario', 'editor'].includes(projeto.meu_papel),
  ),
)

const tarefasFiltradas = computed(() => {
  return store.tarefas.filter((tarefa) => {
    const correspondeProjeto =
      !filtroProjeto.value ||
      (
        filtroProjeto.value === 'pessoal'
          ? !tarefa.projeto
          : String(tarefa.projeto || '') === String(filtroProjeto.value)
      )

    return correspondeFiltro(tarefa) && correspondeProjeto
  })
})

const totalConcluidas = computed(() =>
  store.tarefas.filter(
    (tarefa) => Number(tarefa.situacao) === 3,
  ).length,
)

const totalPendentes = computed(() =>
  store.tarefas.filter(
    (tarefa) => Number(tarefa.situacao) !== 3,
  ).length,
)

function tarefasDaColuna(colunaId) {
  return tarefasFiltradas.value.filter(
    (tarefa) => Number(tarefa.situacao) === Number(colunaId),
  )
}

function nomeStatus(status) {
  return (
    colunas.find((coluna) => coluna.id === Number(status))?.titulo
    || 'A fazer'
  )
}

function nomePrioridade(prioridade) {
  return ({
    1: 'Baixa',
    2: 'Média',
    3: 'Alta',
    4: 'Urgente',
  })[Number(prioridade)] || 'Baixa'
}

function nomeProjeto(projetoId) {
  if (!projetoId) return 'Tarefa pessoal'

  return (
    projetos.value.find(
      (projeto) => Number(projeto.id) === Number(projetoId),
    )?.nome || `Projeto #${projetoId}`
  )
}

function projetoPorId(projetoId) {
  return (
    projetos.value.find(
      (projeto) => Number(projeto.id) === Number(projetoId),
    ) || null
  )
}

function podeEditarProjeto(projetoId) {
  const projeto = projetoPorId(projetoId)

  return Boolean(
    projeto && ['proprietario', 'editor'].includes(projeto.meu_papel),
  )
}

function podeEditarTarefa(tarefa) {
  if (!tarefa?.projeto) {
    return Number(tarefa?.user) === Number(auth.user?.id)
  }

  return podeEditarProjeto(tarefa.projeto)
}

function podeComentar(tarefa) {
  if (!tarefa) return false

  if (!tarefa.projeto) {
    return Number(tarefa.user) === Number(auth.user?.id)
  }

  return Boolean(projetoPorId(tarefa.projeto))
}

function limparFormulario() {
  formulario.projeto = projetosEditaveis.value[0]?.id ?? null
  formulario.user = auth.user?.id ?? null
  formulario.titulo = ''
  formulario.descricao = ''
  formulario.situacao = 1
  formulario.prioridade = 1
  formulario.prazoInicio = dataLocal()
  formulario.prazoFim = dataLocal()
  formulario.texto = ''

  responsaveis.value = []
  erroResponsaveis.value = ''
  tarefaEditando.value = null
}

const formulario = reactive({
  projeto: null,
  user: null,
  titulo: '',
  descricao: '',
  situacao: 1,
  prioridade: 1,
  prazoInicio: dataLocal(),
  prazoFim: dataLocal(),
  texto: '',
})

async function carregarProjetos() {
  carregandoProjetos.value = true
  erroProjetos.value = ''

  try {
    const resposta = await projetosApi.obterTodos({
      page_size: 100,
    })

    projetos.value = extrairLista(resposta.data)
  } catch (erro) {
    erroProjetos.value = mensagemErro(
      erro,
      'Não foi possível carregar os projetos.',
    )

    mostrarMensagem(erroProjetos.value, 'erro')
  } finally {
    carregandoProjetos.value = false
  }
}

async function carregarResponsaveis(
  projetoId,
  responsavelPreferido = null,
) {
  responsaveis.value = []
  erroResponsaveis.value = ''

  if (!projetoId) {
    formulario.user = auth.user?.id ?? null
    return
  }

  const projeto = projetoPorId(projetoId)

  if (!projeto) {
    erroResponsaveis.value =
      'O projeto selecionado não está disponível para sua conta.'

    return
  }

  carregandoResponsaveis.value = true

  try {
    const resposta = await projetosApi.listarMembros(projetoId)
    const membros = extrairLista(resposta.data)

    const pessoas = [
      projeto.proprietario,
      ...membros.map((membro) => membro.usuario),
    ].filter(
      (pessoa) => pessoa?.id !== undefined && pessoa?.id !== null,
    )

    const idsIncluidos = new Set()

    responsaveis.value = pessoas.filter((pessoa) => {
      const id = Number(pessoa.id)

      if (idsIncluidos.has(id)) return false

      idsIncluidos.add(id)
      return true
    })

    const preferido = responsavelPreferido ?? formulario.user

    const responsavelExiste = responsaveis.value.some(
      (pessoa) => Number(pessoa.id) === Number(preferido),
    )

    const usuarioAtualExiste = responsaveis.value.some(
      (pessoa) => Number(pessoa.id) === Number(auth.user?.id),
    )

    if (responsavelExiste) {
      formulario.user = Number(preferido)
    } else if (usuarioAtualExiste) {
      formulario.user = Number(auth.user.id)
    } else {
      formulario.user = responsaveis.value[0]?.id ?? null
    }
  } catch (erro) {
    erroResponsaveis.value = mensagemErro(
      erro,
      'Não foi possível carregar os participantes do projeto.',
    )
  } finally {
    carregandoResponsaveis.value = false
  }
}

async function aoMudarProjeto(event) {
  const projetoId = event?.target?.value
    ? Number(event.target.value)
    : null

  formulario.projeto = projetoId

  await carregarResponsaveis(projetoId)
}

async function abrirCriacao() {
  limparFormulario()
  modalAberto.value = true

  // A criação pessoal funciona mesmo sem projetos disponíveis.
  await carregarResponsaveis(
    formulario.projeto,
    auth.user?.id,
  )
}

async function abrirEdicao(tarefa) {
  if (!podeEditarTarefa(tarefa)) {
    mostrarMensagem(
      'Você tem acesso somente para visualizar esta tarefa.',
      'erro',
    )
    return
  }

  tarefaEditando.value = tarefa
  formulario.projeto = tarefa.projeto
    ? Number(tarefa.projeto)
    : null

  formulario.user = Number(tarefa.user) || auth.user?.id || null
  formulario.titulo = tarefa.titulo || ''
  formulario.descricao = tarefa.descricao || ''
  formulario.situacao = Number(tarefa.situacao) || 1
  formulario.prioridade = Number(tarefa.prioridade) || 1
  formulario.prazoInicio = tarefa.prazoInicio || dataLocal()
  formulario.prazoFim =
    tarefa.prazoFim || tarefa.prazoInicio || dataLocal()
  formulario.texto = tarefa.texto || ''

  modalAberto.value = true

  await carregarResponsaveis(
    formulario.projeto,
    tarefa.user,
  )
}

function montarDadosTarefa() {
  const projetoId = formulario.projeto
    ? Number(formulario.projeto)
    : null

  return {
    titulo: formulario.titulo.trim(),
    descricao: formulario.descricao.trim(),
    situacao: Number(formulario.situacao),
    prioridade: Number(formulario.prioridade),
    prazoInicio: formulario.prazoInicio,
    prazoFim: formulario.prazoFim,
    texto: formulario.texto.trim(),
    projeto: projetoId,
    user: projetoId
      ? Number(formulario.user)
      : Number(auth.user?.id),
  }
}

async function salvarTarefa() {
  if (salvando.value) return

  if (!formulario.titulo.trim()) {
    mostrarMensagem('Informe o título da tarefa.', 'erro')
    return
  }

  if (formulario.projeto) {
    if (!projetoPorId(formulario.projeto)) {
      mostrarMensagem(
        'Selecione um projeto válido ou escolha tarefa pessoal.',
        'erro',
      )
      return
    }

    if (!formulario.user) {
      mostrarMensagem(
        'Selecione um responsável que participe do projeto.',
        'erro',
      )
      return
    }

    if (
      !responsaveis.value.some(
        (pessoa) => Number(pessoa.id) === Number(formulario.user),
      )
    ) {
      mostrarMensagem(
        'O responsável precisa participar do projeto selecionado.',
        'erro',
      )
      return
    }
  } else if (!auth.user?.id) {
    mostrarMensagem(
      'Não foi possível identificar o usuário autenticado.',
      'erro',
    )
    return
  } else {
    formulario.user = Number(auth.user.id)
  }

  if (!formulario.prazoInicio || !formulario.prazoFim) {
    mostrarMensagem(
      'Informe a data de início e o prazo final.',
      'erro',
    )
    return
  }

  if (formulario.prazoFim < formulario.prazoInicio) {
    mostrarMensagem(
      'O prazo final não pode ser anterior à data de início.',
      'erro',
    )
    return
  }

  salvando.value = true

  try {
    const dados = montarDadosTarefa()

    if (tarefaEditando.value) {
      await store.updateTarefa(
        tarefaEditando.value.id,
        dados,
      )

      mostrarMensagem('Tarefa atualizada com sucesso.')
    } else {
      const resultado = await store.addTarefa(dados)

      if (!resultado) {
        throw new Error(
          store.error || 'Não foi possível criar a tarefa.',
        )
      }

      mostrarMensagem('Tarefa criada com sucesso.')
    }

    modalAberto.value = false
    limparFormulario()

    // Recarrega tarefas, inclusive as contagens do checklist.
    await store.fetchTarefas()
  } catch (erro) {
    mostrarMensagem(
      store.error ||
        mensagemErro(erro, 'Não foi possível salvar a tarefa.'),
      'erro',
    )
  } finally {
    salvando.value = false
  }
}

function dadosParaAtualizarStatus(tarefa, situacao) {
  return {
    titulo: tarefa.titulo,
    descricao: tarefa.descricao || '',
    situacao: Number(situacao),
    prioridade: Number(tarefa.prioridade) || 1,
    prazoInicio: tarefa.prazoInicio,
    prazoFim: tarefa.prazoFim || tarefa.prazoInicio,
    texto: tarefa.texto || '',
    projeto: tarefa.projeto
      ? Number(tarefa.projeto)
      : null,
    user: Number(tarefa.user || auth.user?.id),
  }
}

async function mudarStatus(tarefa, situacao) {
  if (!podeEditarTarefa(tarefa)) {
    mostrarMensagem(
      'Você não tem permissão para alterar esta tarefa.',
      'erro',
    )
    return
  }

  try {
    await store.updateTarefa(
      tarefa.id,
      dadosParaAtualizarStatus(tarefa, situacao),
    )

    mostrarMensagem('Situação atualizada com sucesso.')
  } catch (erro) {
    mostrarMensagem(
      store.error ||
        mensagemErro(erro, 'Não foi possível alterar a situação.'),
      'erro',
    )
  }
}

async function excluirTarefa(tarefa) {
  if (!podeEditarTarefa(tarefa)) {
    mostrarMensagem(
      'Você não tem permissão para excluir esta tarefa.',
      'erro',
    )
    return
  }

  if (
    !window.confirm(
      `Deseja realmente excluir a tarefa "${tarefa.titulo}"?`,
    )
  ) {
    return
  }

  try {
    await store.deleteTarefa(tarefa.id)
    mostrarMensagem('Tarefa excluída.')
  } catch (erro) {
    mostrarMensagem(
      store.error ||
        mensagemErro(erro, 'Não foi possível excluir a tarefa.'),
      'erro',
    )
  }
}

function iniciarArrasteTarefa(event, tarefa) {
  if (!podeEditarTarefa(tarefa)) {
    event.preventDefault()
    return
  }

  event.dataTransfer?.setData('text/plain', String(tarefa.id))

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }

  tarefaArrastada.value = tarefa
}

function finalizarArrasteTarefa() {
  tarefaArrastada.value = null
}

async function soltarTarefa(event, coluna) {
  event.preventDefault()

  const tarefa = tarefaArrastada.value
  tarefaArrastada.value = null

  if (!tarefa || Number(tarefa.situacao) === Number(coluna.id)) {
    return
  }

  await mudarStatus(tarefa, coluna.id)
}

function autorComentario(comentario) {
  const autor = comentario?.autor
  return autor?.name || autor?.email || 'Usuário'
}

async function abrirDetalhes(tarefa) {
  tarefaDetalhada.value = tarefa
  detalheAberto.value = true
  textoChecklist.value = ''
  textoComentario.value = ''

  novoMaterial.titulo = ''
  novoMaterial.url = ''
  novoMaterial.descricao = ''

  checklist.value = []
  comentarios.value = []
  materiais.value = []

  await carregarDetalhes()
}

async function carregarDetalhes() {
  const tarefaId = tarefaDetalhada.value?.id

  if (!tarefaId) return

  carregandoDetalhes.value = true

  try {
    const [
      resChecklist,
      resComentarios,
      resMateriais,
    ] = await Promise.all([
      tarefasApi.listarChecklist(tarefaId),
      tarefasApi.listarComentarios(tarefaId),
      tarefasApi.listarMateriais({ tarefa: tarefaId }),
    ])

    // Evita aplicar respostas de uma tarefa que já foi fechada ou trocada.
    if (
      Number(tarefaDetalhada.value?.id) !== Number(tarefaId)
    ) {
      return
    }

    checklist.value = extrairLista(resChecklist.data)
    comentarios.value = extrairLista(resComentarios.data)
    materiais.value = extrairLista(resMateriais.data)
  } catch (erro) {
    mostrarMensagem(
      mensagemErro(
        erro,
        'Não foi possível carregar os detalhes da tarefa.',
      ),
      'erro',
    )
  } finally {
    carregandoDetalhes.value = false
  }
}

/**
 * Atualiza os detalhes e recarrega a listagem do Kanban.
 * A listagem obtém as contagens calculadas pelo backend.
 * O ajuste local também garante que o cartão reflita os dados
 * do checklist recém-carregado.
 */
async function sincronizarChecklistComKanban() {
  const tarefaId = Number(tarefaDetalhada.value?.id)

  if (!tarefaId) return

  await carregarDetalhes()

  if (Number(tarefaDetalhada.value?.id) !== tarefaId) return

  try {
    await store.fetchTarefas()
  } catch {
    // A contagem do cartão ainda será atualizada usando o checklist carregado.
  }

  const tarefaNaLista = store.tarefas.find(
    (tarefa) => Number(tarefa.id) === tarefaId,
  )

  if (!tarefaNaLista) return

  tarefaNaLista.checklist_total = checklist.value.length

  tarefaNaLista.checklist_concluidos = checklist.value.filter(
    (item) => item.concluido,
  ).length
}

async function adicionarChecklist() {
  const texto = textoChecklist.value.trim()
  const tarefaId = tarefaDetalhada.value?.id

  if (
    !texto ||
    !tarefaId ||
    !podeEditarTarefa(tarefaDetalhada.value) ||
    salvandoChecklist.value
  ) {
    return
  }

  salvandoChecklist.value = true

  try {
    await tarefasApi.adicionarItemChecklist(tarefaId, texto)

    textoChecklist.value = ''

    await sincronizarChecklistComKanban()
  } catch (erro) {
    mostrarMensagem(
      mensagemErro(erro, 'Não foi possível adicionar o item.'),
      'erro',
    )
  } finally {
    salvandoChecklist.value = false
  }
}

async function alternarChecklist(item) {
  if (!podeEditarTarefa(tarefaDetalhada.value)) return

  try {
    await tarefasApi.atualizarItemChecklist(item.id, {
      concluido: !item.concluido,
    })

    await sincronizarChecklistComKanban()
  } catch (erro) {
    mostrarMensagem(
      mensagemErro(erro, 'Não foi possível atualizar o checklist.'),
      'erro',
    )
  }
}

async function excluirItemChecklist(item) {
  if (!podeEditarTarefa(tarefaDetalhada.value)) return

  if (!window.confirm(`Excluir o item "${item.texto}"?`)) {
    return
  }

  try {
    await tarefasApi.removerItemChecklist(item.id)

    await sincronizarChecklistComKanban()
  } catch (erro) {
    mostrarMensagem(
      mensagemErro(erro, 'Não foi possível excluir o item.'),
      'erro',
    )
  }
}

async function adicionarComentario() {
  const descricao = textoComentario.value.trim()

  if (
    !descricao ||
    !tarefaDetalhada.value ||
    !podeComentar(tarefaDetalhada.value)
  ) {
    return
  }

  salvandoComentario.value = true

  try {
    await tarefasApi.criarComentario(
      tarefaDetalhada.value.id,
      descricao,
    )

    textoComentario.value = ''
    await carregarDetalhes()
  } catch (erro) {
    mostrarMensagem(
      mensagemErro(erro, 'Não foi possível publicar o comentário.'),
      'erro',
    )
  } finally {
    salvandoComentario.value = false
  }
}

async function adicionarMaterial() {
  if (!tarefaDetalhada.value) return

  if (
    !podeEditarTarefa(tarefaDetalhada.value)
  ) {
    mostrarMensagem(
      'Você não tem permissão para adicionar materiais nesta tarefa.',
      'erro',
    )
    return
  }

  if (!novoMaterial.titulo.trim() || !novoMaterial.url.trim()) {
    mostrarMensagem(
      'Informe o título e o link do material.',
      'erro',
    )
    return
  }

  try {
    const url = new URL(novoMaterial.url.trim())

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error(
        'Use um link que comece com http:// ou https://.',
      )
    }

    salvandoMaterial.value = true

    await tarefasApi.criarMaterial({
      tarefa: tarefaDetalhada.value.id,
      titulo: novoMaterial.titulo.trim(),
      url: url.href,
      descricao: novoMaterial.descricao.trim(),
    })

    novoMaterial.titulo = ''
    novoMaterial.url = ''
    novoMaterial.descricao = ''

    await carregarDetalhes()
  } catch (erro) {
    mostrarMensagem(
      mensagemErro(
        erro,
        erro?.message || 'Não foi possível adicionar o material.',
      ),
      'erro',
    )
  } finally {
    salvandoMaterial.value = false
  }
}

async function excluirMaterial(material) {
  if (!podeEditarTarefa(tarefaDetalhada.value)) return

  if (!window.confirm(`Excluir o material "${material.titulo}"?`)) {
    return
  }

  try {
    await tarefasApi.removerMaterial(material.id)
    await carregarDetalhes()
  } catch (erro) {
    mostrarMensagem(
      mensagemErro(erro, 'Não foi possível excluir o material.'),
      'erro',
    )
  }
}

function fecharDetalhes() {
  detalheAberto.value = false
  tarefaDetalhada.value = null
  checklist.value = []
  comentarios.value = []
  materiais.value = []
  textoChecklist.value = ''
  textoComentario.value = ''
}

onMounted(async () => {
  // Reavalia os alertas de prazo a cada minuto.
  temporizadorAlerta = setInterval(() => {
    agora.value = Date.now()
  }, 60000)

  await Promise.allSettled([
    carregarProjetos(),
    store.fetchTarefas(),
  ])
})

onUnmounted(() => {
  clearInterval(temporizadorAlerta)
})
</script>

<template>
  <main class="tarefas-page">
    <header class="page-header">
      <div>
        <span class="eyebrow">ORGANIZAÇÃO DE PROJETOS</span>
        <h1>Tarefas</h1>
        <p>Organize atividades, responsáveis, prazos e materiais de cada projeto.</p>
      </div>

      <button class="primary-button" @click="abrirCriacao">
        <ion-icon name="add-outline" />
        Nova tarefa
      </button>
    </header>

    <section class="stats-grid">
      <article class="stat-card">
        <span>Total de tarefas</span>
        <strong>{{ store.tarefas.length }}</strong>
      </article>

      <article class="stat-card">
        <span>Pendentes</span>
        <strong>{{ totalPendentes }}</strong>
      </article>

      <article class="stat-card">
        <span>Concluídas</span>
        <strong>{{ totalConcluidas }}</strong>
      </article>
    </section>

    <aside
      v-if="mostrarAlerta"
      class="deadline-alert"
      role="alert"
    >
      <ion-icon name="alarm-outline" class="deadline-alert-icon" />

      <div class="deadline-alert-body">
        <strong>{{ tituloAlerta }}</strong>

        <ul>
          <li
            v-for="tarefa in tarefasCriticasMinhas.slice(0, 3)"
            :key="tarefa.id"
          >
            <button type="button" @click="abrirDetalhes(tarefa)">
              {{ tarefa.titulo }}
            </button>

            <span>{{ rotuloAlerta(tarefa) }}</span>
          </li>
        </ul>

        <small
          v-if="tarefasCriticasMinhas.length > 3"
          class="deadline-alert-more"
        >
          e mais {{ tarefasCriticasMinhas.length - 3 }}
          {{ tarefasCriticasMinhas.length - 3 === 1 ? 'tarefa' : 'tarefas' }}
        </small>
      </div>

      <button
        type="button"
        class="deadline-alert-close"
        aria-label="Dispensar alerta"
        @click="dispensarAlerta"
      >
        ×
      </button>
    </aside>

    <div class="toolbar">
      <nav class="tabs" aria-label="Visualização de tarefas">
        <button
          :class="{ active: abaAtiva === 'kanban' }"
          @click="abaAtiva = 'kanban'"
        >
          Kanban
        </button>

        <button
          :class="{ active: abaAtiva === 'lista' }"
          @click="abaAtiva = 'lista'"
        >
          Lista
        </button>
      </nav>

      <div class="filter-group">
        <select
          v-model="tipoFiltro"
          class="filter-type"
          aria-label="Tipo de filtro"
        >
          <option
            v-for="tipo in tiposFiltro"
            :key="tipo.id"
            :value="tipo.id"
          >
            {{ tipo.rotulo }}
          </option>
        </select>

        <input
          v-if="filtroEhTexto"
          v-model="filtro"
          type="search"
          class="search-input"
          :placeholder="placeholderBusca"
          aria-label="Buscar tarefas"
        />

        <select
          v-else-if="tipoFiltro === 'prioridade'"
          v-model="filtro"
          class="search-input"
          aria-label="Filtrar por prioridade"
        >
          <option value="">Todas as prioridades</option>

          <option
            v-for="opcao in opcoesPrioridade"
            :key="opcao.id"
            :value="String(opcao.id)"
          >
            {{ opcao.rotulo }}
          </option>
        </select>

        <select
          v-else-if="tipoFiltro === 'situacao'"
          v-model="filtro"
          class="search-input"
          aria-label="Filtrar por situação"
        >
          <option value="">Todas as situações</option>

          <option
            v-for="coluna in colunas"
            :key="coluna.id"
            :value="String(coluna.id)"
          >
            {{ coluna.titulo }}
          </option>
        </select>

        <template v-else>
          <select
            v-model="filtro"
            class="search-input"
            aria-label="Filtrar por prazo"
          >
            <option value="">Todos os prazos</option>

            <option
              v-for="opcao in opcoesPrazo"
              :key="opcao.id"
              :value="opcao.id"
            >
              {{ opcao.rotulo }}
            </option>
          </select>

          <input
            v-if="filtro === 'data'"
            v-model="filtroData"
            type="date"
            class="search-input"
            aria-label="Data do prazo final"
          />
        </template>
      </div>

      <select
        v-model="filtroProjeto"
        class="search-input project-filter"
        aria-label="Filtrar por projeto"
      >
        <option value="">Todos os projetos</option>
        <option value="pessoal">Tarefas pessoais (sem projeto)</option>

        <option
          v-for="projeto in projetos"
          :key="projeto.id"
          :value="String(projeto.id)"
        >
          {{ projeto.nome }}
        </option>
      </select>
    </div>

    <ul class="alerta-legenda" aria-label="Legenda das cores de prazo">
      <li
        v-for="item in legendaAlerta"
        :key="item.nivel"
        :class="`alerta-${item.nivel}`"
      >
        <span class="legenda-cor" />
        {{ item.rotulo }}
      </li>
    </ul>

    <p
      v-if="mensagem"
      class="notice"
      :class="tipoMensagem"
      role="status"
    >
      <span>{{ mensagem }}</span>

      <button
        type="button"
        aria-label="Fechar mensagem"
        @click="mensagem = ''"
      >
        ×
      </button>
    </p>

    <p v-if="erroProjetos" class="notice erro">
      {{ erroProjetos }}
    </p>

    <p
      v-if="store.loading || carregandoProjetos"
      class="empty-state"
    >
      Carregando tarefas e projetos...
    </p>

    <section
      v-else-if="store.error && !store.tarefas.length"
      class="error-panel"
    >
      <h2>Não foi possível carregar as tarefas</h2>
      <p>{{ store.error }}</p>

      <button class="secondary-button" @click="store.fetchTarefas()">
        Tentar novamente
      </button>
    </section>

    <template v-else>
      <section v-if="abaAtiva === 'kanban'" class="kanban-board">
        <article
          v-for="coluna in colunas"
          :key="coluna.id"
          class="kanban-column"
          @dragover.prevent
          @drop="soltarTarefa($event, coluna)"
        >
          <header class="column-header">
            <span
              class="status-dot"
              :style="{ background: coluna.cor }"
            />

            <h2>{{ coluna.titulo }}</h2>

            <span class="count">
              {{ tarefasDaColuna(coluna.id).length }}
            </span>
          </header>

          <div class="task-list">
            <article
              v-for="tarefa in tarefasDaColuna(coluna.id)"
              :key="tarefa.id"
              class="task-card"
              :class="classeAlerta(tarefa)"
              :draggable="podeEditarTarefa(tarefa)"
              @dragstart="iniciarArrasteTarefa($event, tarefa)"
              @dragend="finalizarArrasteTarefa"
            >
              <div class="task-card-meta">
                <span>#{{ tarefa.id }}</span>

                <span
                  class="priority-pill"
                  :class="`priority-${tarefa.prioridade}`"
                >
                  {{ nomePrioridade(tarefa.prioridade) }}
                </span>
              </div>

              <h3>{{ tarefa.titulo }}</h3>

              <p v-if="tarefa.descricao">
                {{ tarefa.descricao }}
              </p>

              <div class="task-project">
                <ion-icon name="folder-outline" />
                {{ nomeProjeto(tarefa.projeto) }}
              </div>

              <div class="task-date">
                <ion-icon name="calendar-outline" />
                Prazo: {{ formatarData(tarefa.prazoFim) }}
              </div>

              <div
                v-if="classeAlerta(tarefa)"
                class="alerta-badge"
              >
                <ion-icon :name="iconeAlerta(tarefa)" />
                {{ rotuloAlerta(tarefa) }}
              </div>

              <div class="checklist-summary">
                <span>Checklist</span>

                <strong>
                  {{ Number(tarefa.checklist_concluidos || 0) }}
                  /
                  {{ Number(tarefa.checklist_total || 0) }}
                </strong>
              </div>

              <label class="status-control">
                Situação

                <select
                  :value="Number(tarefa.situacao)"
                  :disabled="!podeEditarTarefa(tarefa)"
                  @change="mudarStatus(tarefa, Number($event.target.value))"
                >
                  <option
                    v-for="item in colunas"
                    :key="item.id"
                    :value="item.id"
                  >
                    {{ item.titulo }}
                  </option>
                </select>
              </label>

              <div class="card-actions">
                <button
                  class="secondary-button"
                  @click="abrirDetalhes(tarefa)"
                >
                  Checklist e detalhes
                </button>

                <button
                  v-if="podeEditarTarefa(tarefa)"
                  class="secondary-button"
                  @click="abrirEdicao(tarefa)"
                >
                  Editar
                </button>

                <button
                  v-if="podeEditarTarefa(tarefa)"
                  class="danger-button"
                  @click="excluirTarefa(tarefa)"
                >
                  Excluir
                </button>
              </div>
            </article>

            <p
              v-if="!tarefasDaColuna(coluna.id).length"
              class="empty-column"
            >
              Nenhuma tarefa nesta coluna.
            </p>
          </div>

          <button
            v-if="coluna.id === 1"
            class="add-task-button"
            @click="abrirCriacao"
          >
            <ion-icon name="add-outline" />
            Adicionar tarefa
          </button>
        </article>
      </section>

      <section v-else class="list-view">
        <article
          v-for="tarefa in tarefasFiltradas"
          :key="tarefa.id"
          class="list-task"
          :class="classeAlerta(tarefa)"
        >
          <div class="list-task-main">
            <span
              v-if="classeAlerta(tarefa)"
              class="alerta-badge"
            >
              <ion-icon :name="iconeAlerta(tarefa)" />
              {{ rotuloAlerta(tarefa) }}
            </span>

            <h3>{{ tarefa.titulo }}</h3>
            <p>{{ tarefa.descricao || 'Sem descrição.' }}</p>

            <small>
              {{ nomeProjeto(tarefa.projeto) }} ·
              {{ nomeStatus(tarefa.situacao) }} ·
              Prioridade {{ nomePrioridade(tarefa.prioridade) }} ·
              Prazo {{ formatarData(tarefa.prazoFim) }}
            </small>
          </div>

          <div class="card-actions">
            <button
              class="secondary-button"
              @click="abrirDetalhes(tarefa)"
            >
              Checklist e detalhes
            </button>

            <button
              v-if="podeEditarTarefa(tarefa)"
              class="secondary-button"
              @click="abrirEdicao(tarefa)"
            >
              Editar
            </button>
          </div>
        </article>

        <p v-if="!tarefasFiltradas.length" class="empty-state">
          Nenhuma tarefa encontrada.
        </p>
      </section>
    </template>

    <!-- Criar ou editar tarefa -->
    <div
      v-if="modalAberto"
      class="modal-backdrop"
      @click.self="modalAberto = false"
    >
      <section
        class="task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
      >
        <header class="modal-header">
          <div>
            <span class="eyebrow">
              {{ tarefaEditando ? 'EDITAR TAREFA' : 'NOVA TAREFA' }}
            </span>

            <h2 id="task-modal-title">
              {{ tarefaEditando ? 'Editar tarefa' : 'Criar tarefa' }}
            </h2>
          </div>

          <button
            class="close-button"
            aria-label="Fechar"
            @click="modalAberto = false"
          >
            ×
          </button>
        </header>

        <form class="task-form" @submit.prevent="salvarTarefa">
          <label>
            Projeto (opcional)

            <select
              :value="formulario.projeto ?? ''"
              @change="aoMudarProjeto"
            >
              <option value="">Tarefa pessoal (sem projeto)</option>

              <option
                v-for="projeto in projetosEditaveis"
                :key="projeto.id"
                :value="projeto.id"
              >
                {{ projeto.nome }}
              </option>
            </select>
          </label>

          <p v-if="!projetosEditaveis.length" class="form-hint">
            Você pode criar uma tarefa pessoal sem vinculá-la a um projeto.
          </p>

          <label>
            Título *

            <input
              v-model.trim="formulario.titulo"
              maxlength="45"
              required
              placeholder="Ex.: Preparar apresentação"
            />
          </label>

          <label>
            Descrição

            <textarea
              v-model.trim="formulario.descricao"
              maxlength="200"
              rows="2"
              placeholder="Descreva a tarefa"
            />
          </label>

          <label v-if="formulario.projeto">
            Responsável *

            <select
              v-model.number="formulario.user"
              required
              :disabled="carregandoResponsaveis || !responsaveis.length"
            >
              <option
                v-for="pessoa in responsaveis"
                :key="pessoa.id"
                :value="Number(pessoa.id)"
              >
                {{ pessoa.name || pessoa.email || `Usuário #${pessoa.id}` }}
              </option>
            </select>
          </label>

          <label v-else>
            Responsável

            <input
              :value="auth.user?.name || auth.user?.email || 'Usuário autenticado'"
              disabled
            />

            <small class="form-hint">
              Tarefas pessoais são atribuídas somente a você.
            </small>
          </label>

          <p v-if="carregandoResponsaveis" class="form-hint">
            Carregando participantes...
          </p>

          <p v-if="erroResponsaveis" class="form-error">
            {{ erroResponsaveis }}
          </p>

          <div class="form-row">
            <label>
              Data de início *

              <input
                v-model="formulario.prazoInicio"
                type="date"
                required
              />
            </label>

            <label>
              Prazo final *

              <input
                v-model="formulario.prazoFim"
                type="date"
                :min="formulario.prazoInicio"
                required
              />
            </label>
          </div>

          <div class="form-row">
            <label>
              Situação

              <select v-model.number="formulario.situacao">
                <option :value="1">A fazer</option>
                <option :value="2">Em andamento</option>
                <option :value="3">Concluído</option>
              </select>
            </label>

            <label>
              Prioridade

              <select v-model.number="formulario.prioridade">
                <option :value="1">Baixa</option>
                <option :value="2">Média</option>
                <option :value="3">Alta</option>
                <option :value="4">Urgente</option>
              </select>
            </label>
          </div>

          <label>
            Anotações

            <textarea
              v-model.trim="formulario.texto"
              maxlength="500"
              rows="3"
              placeholder="Observações adicionais (opcional)"
            />
          </label>

          <footer class="modal-actions">
            <button
              type="button"
              class="secondary-button"
              @click="modalAberto = false"
            >
              Cancelar
            </button>

            <button
              type="submit"
              class="primary-button"
              :disabled="salvando"
            >
              {{ salvando ? 'Salvando...' : 'Salvar tarefa' }}
            </button>
          </footer>
        </form>
      </section>
    </div>

    <!-- Checklist, comentários e materiais -->
    <div
      v-if="detalheAberto && tarefaDetalhada"
      class="modal-backdrop details-backdrop"
      @click.self="fecharDetalhes"
    >
      <section
        class="details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="details-title"
      >
        <header class="modal-header">
          <div>
            <span class="eyebrow">
              TAREFA #{{ tarefaDetalhada.id }}
            </span>

            <h2 id="details-title">
              {{ tarefaDetalhada.titulo }}
            </h2>

            <p>
              {{ nomeProjeto(tarefaDetalhada.projeto) }} ·
              {{ nomeStatus(tarefaDetalhada.situacao) }} ·
              Prioridade {{ nomePrioridade(tarefaDetalhada.prioridade) }}
            </p>
          </div>

          <button
            class="close-button"
            aria-label="Fechar detalhes"
            @click="fecharDetalhes"
          >
            ×
          </button>
        </header>

        <p
          v-if="tarefaDetalhada.descricao"
          class="details-description"
        >
          {{ tarefaDetalhada.descricao }}
        </p>

        <p v-if="carregandoDetalhes" class="empty-state">
          Carregando detalhes...
        </p>

        <div v-else class="details-grid">
          <section class="detail-section">
            <header class="detail-section-header">
              <h3>Checklist</h3>

              <strong>
                {{ checklist.filter((item) => item.concluido).length }}
                / {{ checklist.length }}
              </strong>
            </header>

            <form
              class="inline-form"
              @submit.prevent="adicionarChecklist"
            >
              <input
                v-model.trim="textoChecklist"
                maxlength="255"
                placeholder="Novo item do checklist"
                :disabled="!podeEditarTarefa(tarefaDetalhada) || salvandoChecklist"
              />

              <button
                class="primary-button"
                :disabled="!textoChecklist.trim() || !podeEditarTarefa(tarefaDetalhada) || salvandoChecklist"
              >
                {{ salvandoChecklist ? 'Salvando...' : 'Adicionar' }}
              </button>
            </form>

            <ul v-if="checklist.length" class="checklist-list">
              <li v-for="item in checklist" :key="item.id">
                <label>
                  <input
                    type="checkbox"
                    :checked="item.concluido"
                    :disabled="!podeEditarTarefa(tarefaDetalhada)"
                    @change="alternarChecklist(item)"
                  />

                  <span :class="{ completed: item.concluido }">
                    {{ item.texto }}
                  </span>
                </label>

                <button
                  v-if="podeEditarTarefa(tarefaDetalhada)"
                  class="small-danger"
                  @click="excluirItemChecklist(item)"
                >
                  Excluir
                </button>
              </li>
            </ul>

            <p v-else class="muted">
              Nenhum item no checklist.
            </p>
          </section>

          <section class="detail-section">
            <h3>Comentários</h3>

            <form
              class="comment-form"
              @submit.prevent="adicionarComentario"
            >
              <textarea
                v-model.trim="textoComentario"
                rows="3"
                maxlength="255"
                placeholder="Escreva um comentário..."
                :disabled="!podeComentar(tarefaDetalhada) || salvandoComentario"
              />

              <button
                class="primary-button"
                :disabled="!textoComentario.trim() || !podeComentar(tarefaDetalhada) || salvandoComentario"
              >
                {{ salvandoComentario ? 'Enviando...' : 'Comentar' }}
              </button>
            </form>

            <ul v-if="comentarios.length" class="comments-list">
              <li
                v-for="comentario in comentarios"
                :key="comentario.id"
              >
                <div class="comment-meta">
                  <strong>{{ autorComentario(comentario) }}</strong>

                  <time v-if="comentario.created_at">
                    {{ new Date(comentario.created_at).toLocaleString('pt-BR') }}
                  </time>
                </div>

                <p>{{ comentario.descricao }}</p>
              </li>
            </ul>

            <p v-else class="muted">
              Ainda não há comentários.
            </p>
          </section>

          <section class="detail-section detail-section-wide">
            <h3>Materiais de apoio</h3>

            <form
              class="material-form"
              @submit.prevent="adicionarMaterial"
            >
              <label>
                Título *

                <input
                  v-model.trim="novoMaterial.titulo"
                  maxlength="100"
                  required
                  placeholder="Ex.: Documento de requisitos"
                  :disabled="!podeEditarTarefa(tarefaDetalhada)"
                />
              </label>

              <label>
                Link *

                <input
                  v-model.trim="novoMaterial.url"
                  type="url"
                  maxlength="500"
                  required
                  placeholder="https://..."
                  :disabled="!podeEditarTarefa(tarefaDetalhada)"
                />
              </label>

              <label>
                Descrição

                <textarea
                  v-model.trim="novoMaterial.descricao"
                  maxlength="255"
                  rows="2"
                  placeholder="Descrição opcional"
                  :disabled="!podeEditarTarefa(tarefaDetalhada)"
                />
              </label>

              <button
                class="primary-button"
                :disabled="!podeEditarTarefa(tarefaDetalhada) || salvandoMaterial"
              >
                {{ salvandoMaterial ? 'Salvando...' : 'Adicionar material' }}
              </button>
            </form>

            <ul v-if="materiais.length" class="materials-list">
              <li
                v-for="material in materiais"
                :key="material.id"
              >
                <div>
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
                  v-if="podeEditarTarefa(tarefaDetalhada)"
                  class="small-danger"
                  @click="excluirMaterial(material)"
                >
                  Excluir
                </button>
              </li>
            </ul>

            <p v-else class="muted">
              Nenhum material vinculado a esta tarefa.
            </p>
          </section>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.tarefas-page {
  --accent: #a855f7;
  --accent-soft: rgba(168, 85, 247, .14);
  --accent-border: rgba(168, 85, 247, .42);
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  color: var(--cor-texto, #f5f5f5);
  background: var(--cor-fundo, #171717);
  padding-bottom: 30px;
}

.tarefas-page * {
  box-sizing: border-box;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 7px 0;
  font-size: clamp(1.8rem, 3vw, 2.3rem);
}

.page-header p {
  margin: 0;
  color: var(--cor-texto-suave, #a3a3a3);
}

.eyebrow {
  color: var(--accent);
  font-size: .73rem;
  font-weight: 800;
  letter-spacing: 1.4px;
}

.primary-button,
.secondary-button,
.danger-button,
.add-task-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid transparent;
  border-radius: 9px;
  padding: 10px 13px;
  font: inherit;
  font-size: .88rem;
  cursor: pointer;
  transition: .2s ease;
}

.primary-button {
  background: var(--accent);
  color: #fff;
  font-weight: 700;
}

.primary-button:hover:not(:disabled) {
  background: #9333ea;
}

.primary-button:disabled,
.secondary-button:disabled,
.danger-button:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.secondary-button {
  border-color: var(--cor-borda, #3a3a3a);
  background: var(--cor-superficie, #222);
  color: var(--cor-texto, #f5f5f5);
}

.secondary-button:hover {
  border-color: var(--accent-border);
  background: var(--accent-soft);
}

.danger-button,
.small-danger {
  border-color: rgba(248, 113, 113, .35);
  background: rgba(248, 113, 113, .08);
  color: #fca5a5;
}

.danger-button {
  padding: 8px 10px;
}

.danger-button:hover,
.small-danger:hover {
  background: rgba(248, 113, 113, .16);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}

.stat-card {
  padding: 17px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 13px;
  background: var(--cor-superficie, #222);
}

.stat-card span {
  display: block;
  color: var(--cor-texto-suave, #a3a3a3);
  font-size: .85rem;
}

.stat-card strong {
  display: block;
  margin-top: 7px;
  color: var(--accent);
  font-size: 1.75rem;
}

/* Desktop: abas | filtros | projeto, tudo em uma linha. */
.toolbar {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) minmax(180px, 260px);
  grid-template-areas: "tabs filtros projeto";
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.toolbar > .tabs {
  grid-area: tabs;
}

.toolbar > .filter-group {
  grid-area: filtros;
}

.toolbar > .project-filter {
  grid-area: projeto;
  width: 100%;
  max-width: none;
}

.tabs {
  display: flex;
  gap: 5px;
  padding: 4px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 10px;
  background: var(--cor-superficie, #222);
}

.tabs button {
  padding: 9px 13px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--cor-texto-suave, #a3a3a3);
  cursor: pointer;
}

.tabs button.active {
  background: var(--accent);
  color: #fff;
}

.search-input {
  min-width: 0;
  width: 100%;
  max-width: 280px;
  padding: 10px 12px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 9px;
  background: var(--cor-superficie, #222);
  color: var(--cor-texto, #fff);
}

/* Seletor do tipo de filtro + campo de valor (texto, select ou data) */
.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.filter-group .search-input {
  flex: 1 1 0;
  max-width: none;
}

.filter-group input[type="date"] {
  flex: 0 1 160px;
}

.filter-type {
  flex: 0 0 170px;
  width: 170px;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--accent-border);
  border-radius: 9px;
  background: var(--cor-superficie, #222);
  color: var(--cor-texto, #fff);
  cursor: pointer;
}

.filter-type:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.notice {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 16px;
  padding: 12px 14px;
  border: 1px solid var(--accent-border);
  border-radius: 9px;
  background: var(--accent-soft);
}

.notice button {
  border: 0;
  background: none;
  color: inherit;
  font-size: 1.3rem;
  cursor: pointer;
}

.notice.erro,
.form-error {
  border-color: rgba(248, 113, 113, .4);
  color: #fca5a5;
}

.notice.erro {
  background: rgba(248, 113, 113, .08);
}

.empty-state {
  padding: 24px;
  text-align: center;
  color: var(--cor-texto-suave, #a3a3a3);
}

.error-panel {
  padding: 22px;
  border: 1px solid rgba(248, 113, 113, .35);
  border-radius: 12px;
}

.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, minmax(250px, 1fr));
  gap: 14px;
  align-items: start;
}

.kanban-column {
  min-width: 0;
  padding: 13px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 13px;
  background: var(--cor-superficie, #222);
}

.column-header {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 4px 2px 13px;
  border-bottom: 1px solid var(--cor-borda, #3a3a3a);
  margin-bottom: 13px;
}

.column-header h2 {
  flex: 1;
  margin: 0;
  font-size: 1rem;
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.count {
  display: grid;
  place-items: center;
  min-width: 26px;
  height: 26px;
  border-radius: 8px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: .8rem;
  font-weight: 800;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 11px;
  min-height: 120px;
}

.task-card {
  min-width: 0;
  padding: 13px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 11px;
  background: var(--cor-fundo, #171717);
  overflow-wrap: anywhere;
}

.task-card[draggable=true] {
  cursor: grab;
}

.task-card:hover {
  border-color: var(--accent-border);
}

/* Alerta de prazo: a cor da borda indica o nível. */
.alerta-verde {
  --alerta-cor: #22c55e;
}

.alerta-amarelo {
  --alerta-cor: #eab308;
}

.alerta-laranja {
  --alerta-cor: #f97316;
}

.alerta-vermelho {
  --alerta-cor: #ef4444;
}

.task-card.alerta-verde,
.task-card.alerta-amarelo,
.task-card.alerta-laranja,
.task-card.alerta-vermelho,
.list-task.alerta-verde,
.list-task.alerta-amarelo,
.list-task.alerta-laranja,
.list-task.alerta-vermelho {
  border-color: var(--alerta-cor);
  border-left-width: 4px;
}

/* No vermelho, um brilho discreto reforça o aviso. */
.task-card.alerta-vermelho,
.list-task.alerta-vermelho {
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--alerta-cor) 35%, transparent),
    0 0 16px color-mix(in srgb, var(--alerta-cor) 22%, transparent);
}

.alerta-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding: 4px 10px;
  border: 1px solid color-mix(in srgb, var(--alerta-cor) 45%, transparent);
  border-radius: 20px;
  background: color-mix(in srgb, var(--alerta-cor) 14%, transparent);
  color: var(--alerta-cor);
  font-size: .76rem;
  font-weight: 700;
}

.list-task-main > .alerta-badge {
  margin: 0 0 8px;
}

.alerta-legenda {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin: -6px 0 18px;
  padding: 0;
  list-style: none;
  color: var(--cor-texto-suave, #a3a3a3);
  font-size: .78rem;
}

.alerta-legenda li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legenda-cor {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: var(--alerta-cor);
}

/* Notificação de tarefas com o tempo acabando. */
.deadline-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
  padding: 13px 14px;
  border: 1px solid rgba(239, 68, 68, .55);
  border-left-width: 4px;
  border-radius: 11px;
  background: rgba(239, 68, 68, .1);
  color: #fecaca;
}

.deadline-alert-icon {
  flex: 0 0 auto;
  margin-top: 1px;
  color: #f87171;
  font-size: 1.4rem;
}

.deadline-alert-body {
  flex: 1 1 auto;
  min-width: 0;
}

.deadline-alert-body strong {
  display: block;
  color: #fca5a5;
}

.deadline-alert-body ul {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.deadline-alert-body li {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 10px;
  font-size: .86rem;
}

.deadline-alert-body li button {
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-weight: 700;
  text-align: left;
  text-decoration: underline;
  cursor: pointer;
  overflow-wrap: anywhere;
}

.deadline-alert-body li span,
.deadline-alert-more {
  color: #fca5a5;
}

.deadline-alert-more {
  display: block;
  margin-top: 6px;
}

.deadline-alert-close {
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(239, 68, 68, .4);
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font-size: 1.3rem;
  line-height: 1;
  cursor: pointer;
}

.task-card-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  margin-bottom: 9px;
  color: var(--accent);
  font-size: .78rem;
  font-weight: 750;
}

.priority-pill {
  padding: 4px 7px;
  border-radius: 20px;
  background: #64748b22;
  color: #cbd5e1;
}

.priority-2 {
  background: #d9770622;
  color: #fbbf24;
}

.priority-3 {
  background: #a855f722;
  color: #d8b4fe;
}

.priority-4 {
  background: #ef444422;
  color: #fca5a5;
}

.task-card h3 {
  margin: 0 0 8px;
  font-size: 1rem;
  line-height: 1.45;
}

.task-card > p {
  margin: 0 0 11px;
  color: var(--cor-texto-suave, #a3a3a3);
  font-size: .88rem;
  line-height: 1.5;
}

.task-project,
.task-date {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 8px;
  color: var(--cor-texto-suave, #a3a3a3);
  font-size: .8rem;
}

.task-project ion-icon,
.task-date ion-icon {
  color: var(--accent);
}

.checklist-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 9px 10px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 8px;
  color: var(--cor-texto-suave, #a3a3a3);
  font-size: .82rem;
}

.checklist-summary strong {
  color: var(--cor-texto, #f5f5f5);
  font-variant-numeric: tabular-nums;
}

.status-control {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 12px;
  color: var(--cor-texto-suave, #a3a3a3);
  font-size: .77rem;
}

.status-control select,
.task-form input,
.task-form select,
.task-form textarea,
.detail-section input,
.detail-section textarea {
  width: 100%;
  min-width: 0;
  padding: 10px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 8px;
  background: var(--cor-superficie, #222);
  color: var(--cor-texto, #f5f5f5);
  font: inherit;
}

.status-control select {
  padding: 7px;
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 12px;
}

.card-actions .secondary-button,
.card-actions .danger-button {
  padding: 7px 9px;
  font-size: .8rem;
}

.empty-column {
  padding: 18px 7px;
  color: var(--cor-texto-suave, #a3a3a3);
  font-size: .86rem;
  text-align: center;
}

.add-task-button {
  width: 100%;
  margin-top: 10px;
  border-color: transparent;
  background: transparent;
  color: var(--accent);
}

.add-task-button:hover {
  background: var(--accent-soft);
}

.list-view {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.list-task {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 15px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 11px;
  background: var(--cor-superficie, #222);
}

.list-task-main {
  min-width: 0;
}

.list-task h3 {
  margin: 0 0 5px;
}

.list-task p {
  margin: 0 0 7px;
  color: var(--cor-texto-suave, #a3a3a3);
}

.list-task small {
  color: var(--accent);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, .72);
  overflow-y: auto;
}

.task-modal,
.details-modal {
  width: min(100%, 620px);
  max-height: calc(100vh - 40px);
  overflow-x: hidden;
  overflow-y: auto;
  padding: 22px;
  border: 1px solid var(--cor-borda, #444);
  border-radius: 16px;
  background: var(--cor-fundo, #171717);
  color: var(--cor-texto, #f5f5f5);
  box-shadow: 0 20px 70px #0008;
}

.details-modal {
  width: min(100%, 1000px);
  overscroll-behavior: contain;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 19px;
}

.modal-header h2 {
  margin: 5px 0;
  font-size: 1.4rem;
  overflow-wrap: anywhere;
}

.modal-header p {
  margin: 7px 0 0;
  color: var(--cor-texto-suave, #a3a3a3);
  font-size: .85rem;
}

.close-button {
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

.task-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.task-form label,
.material-form label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
  color: var(--cor-texto-suave, #c4c4c4);
  font-size: .86rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.form-hint,
.muted {
  color: var(--cor-texto-suave, #a3a3a3);
  font-size: .83rem;
}

.form-error {
  padding: 8px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  margin-top: 5px;
}

.details-description {
  margin: -5px 0 18px;
  color: var(--cor-texto-suave, #c4c4c4);
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.detail-section {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 12px;
  background: var(--cor-superficie, #202020);
}

.detail-section h3 {
  margin: 0 0 12px;
  font-size: 1rem;
}

.detail-section-wide {
  grid-column: 1 / -1;
}

.detail-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.detail-section-header strong {
  font-variant-numeric: tabular-nums;
}

.inline-form {
  display: flex;
  gap: 7px;
  margin-bottom: 12px;
}

.inline-form input {
  flex: 1 1 auto;
  min-width: 0;
}

.inline-form .primary-button {
  flex: 0 0 auto;
  padding: 9px;
}

.checklist-list,
.comments-list,
.materials-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.checklist-list li,
.materials-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
  width: 100%;
  padding: 9px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 8px;
  background: var(--cor-fundo, #171717);
}

.checklist-list label {
  display: flex;
  align-items: flex-start;
  flex: 1 1 auto;
  min-width: 0;
  width: calc(100% - 70px);
  gap: 9px;
}

.checklist-list label span {
  display: block;
  flex: 1 1 auto;
  min-width: 0;
  line-height: 1.45;
  overflow-wrap: anywhere;
  word-break: normal;
}

.checklist-list label input[type="checkbox"] {
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
  margin-top: 2px;
  accent-color: var(--accent);
}

.completed {
  text-decoration: line-through;
  color: var(--cor-texto-suave, #888);
}

.small-danger {
  flex: 0 0 auto;
  padding: 5px 7px;
  border: 1px solid rgba(248, 113, 113, .3);
  border-radius: 7px;
  cursor: pointer;
}

.comment-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 13px;
}

.comment-form .primary-button {
  align-self: flex-end;
}

.comments-list li {
  padding: 10px;
  border-radius: 8px;
  background: var(--cor-fundo, #171717);
  overflow-wrap: anywhere;
}

.comment-meta {
  display: flex;
  justify-content: space-between;
  gap: 9px;
  flex-wrap: wrap;
}

.comment-meta strong {
  font-size: .85rem;
  color: var(--accent);
}

.comment-meta time {
  font-size: .72rem;
  color: var(--cor-texto-suave, #888);
}

.comments-list p {
  margin: 7px 0 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.material-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 14px;
}

.material-form label:nth-child(3) {
  grid-column: 1 / -1;
}

.material-form .primary-button {
  justify-self: start;
}

.materials-list li {
  align-items: flex-start;
}

.materials-list li > div {
  flex: 1 1 auto;
  min-width: 0;
}

.materials-list a {
  color: #c4b5fd;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.materials-list p {
  margin: 5px 0;
  color: var(--cor-texto-suave, #aaa);
  font-size: .82rem;
}

.materials-list small {
  display: block;
  margin-top: 5px;
  color: var(--cor-texto-suave, #777);
  overflow-wrap: anywhere;
}

/* Tablet: abas e projeto na primeira linha, filtros ocupam a linha de baixo. */
@media (max-width: 1100px) {
  .toolbar {
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas:
      "tabs projeto"
      "filtros filtros";
  }

  .toolbar > .project-filter {
    justify-self: end;
    max-width: 320px;
  }
}

@media (max-width: 900px) {
  .kanban-board {
    grid-template-columns: 1fr;
  }

  .kanban-column {
    min-width: 0;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .detail-section-wide {
    grid-column: auto;
  }
}

@media (max-width: 600px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .stats-grid {
    gap: 8px;
  }

  .stat-card {
    padding: 12px;
  }

  .stat-card strong {
    font-size: 1.45rem;
  }

  /* Celular: tudo empilhado em uma coluna, com largura total. */
  .toolbar {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "tabs"
      "filtros"
      "projeto";
    gap: 10px;
  }

  .toolbar > .project-filter {
    justify-self: stretch;
    max-width: none;
  }

  .tabs {
    width: 100%;
  }

  .tabs button {
    flex: 1;
  }

  /* Em coluna, o flex-basis valeria como altura; por isso zera aqui. */
  .filter-group {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group .search-input,
  .filter-group input[type="date"],
  .filter-type {
    flex: 0 0 auto;
    width: 100%;
    max-width: none;
  }

  /* 16px evita o zoom automático dos campos no iOS. */
  .search-input,
  .filter-type {
    font-size: 16px;
  }

  .form-row,
  .material-form {
    grid-template-columns: 1fr;
  }

  .material-form label:nth-child(3) {
    grid-column: auto;
  }

  .modal-backdrop {
    padding: 10px;
  }

  .task-modal,
  .details-modal {
    max-height: calc(100dvh - 20px);
    padding: 15px;
  }

  .list-task {
    align-items: flex-start;
    flex-direction: column;
  }

  .card-actions {
    width: 100%;
  }

  .card-actions button {
    flex: 1;
  }

  .inline-form {
    flex-direction: column;
  }

  .inline-form .primary-button {
    align-self: flex-start;
  }

  .checklist-list li {
    align-items: center;
  }

  .checklist-list label {
    width: calc(100% - 60px);
  }
}
</style>