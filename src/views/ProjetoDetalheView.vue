<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import projetosApi from '@/api/projetosApi'
import tarefasApi from '@/api/tarefasApi'
import { useToastStore } from '@/stores/toast'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const colunas = [
  { id: 1, titulo: 'A fazer' },
  { id: 2, titulo: 'Em andamento' },
  { id: 3, titulo: 'Concluído' },
]

const projeto = ref(null)
const membros = ref([])
const tarefas = ref([])
const materiais = ref([])

const carregando = ref(true)
const carregandoTarefas = ref(false)
const carregandoMateriais = ref(false)

const erro = ref('')
const erroTarefas = ref('')
const erroMateriais = ref('')

const salvandoMaterial = ref(false)

const materialForm = reactive({
  titulo: '',
  url: '',
  descricao: '',
})

const modalTarefaAberto = ref(false)
const editandoTarefa = ref(null)
const salvandoTarefa = ref(false)
const erroFormTarefa = ref('')
const tarefaArrastada = ref(null)
const excluindoTarefaId = ref(null)

// Detalhes colaborativos da tarefa: checklist e comentários.
const detalheTarefaAberto = ref(false)
const tarefaDetalhada = ref(null)
const checklist = ref([])
const comentarios = ref([])
const textoChecklist = ref('')
const textoComentario = ref('')
const carregandoDetalhesTarefa = ref(false)
const salvandoChecklist = ref(false)
const salvandoComentario = ref(false)

const projetoId = computed(() => Number(route.params.id))

const podeEditar = computed(() =>
  ['proprietario', 'editor'].includes(projeto.value?.meu_papel),
)

const participantes = computed(() => {
  if (!projeto.value) return []

  const lista = []

  if (projeto.value.proprietario?.id != null) {
    lista.push({
      id: `proprietario-${projeto.value.proprietario.id}`,
      usuario: projeto.value.proprietario,
      papel: 'proprietario',
    })
  }

  for (const membro of membros.value) {
    if (membro.usuario?.id == null) continue

    lista.push({
      id: membro.id,
      usuario: membro.usuario,
      papel: membro.papel,
    })
  }

  const vistos = new Set()

  return lista.filter((item) => {
    const id = Number(item.usuario.id)

    if (vistos.has(id)) return false

    vistos.add(id)
    return true
  })
})

const responsaveis = computed(() =>
  participantes.value.map((item) => item.usuario),
)

const totalConcluidas = computed(() =>
  tarefas.value.filter((tarefa) => Number(tarefa.situacao) === 3).length,
)

function tarefasDaColuna(status) {
  return tarefas.value.filter(
    (tarefa) => Number(tarefa.situacao) === Number(status),
  )
}

function dataHoje() {
  const data = new Date()
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}

const formTarefa = reactive({
  titulo: '',
  descricao: '',
  situacao: 1,
  prioridade: 1,
  prazoInicio: dataHoje(),
  prazoFim: dataHoje(),
  texto: '',
  user: null,
})

function extrairLista(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
}

function erroTexto(err, fallback) {
  const dados = err?.response?.data

  if (typeof dados === 'string') return dados
  if (typeof dados?.detail === 'string') return dados.detail

  if (dados && typeof dados === 'object') {
    const partes = Object.entries(dados).map(([campo, valor]) => {
      const mensagem = Array.isArray(valor)
        ? valor.join(', ')
        : String(valor)

      return `${campo}: ${mensagem}`
    })

    if (partes.length) return partes.join('\n')
  }

  return err?.message || fallback
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

function papelTexto(papel) {
  return {
    proprietario: 'Proprietário',
    editor: 'Editor',
    visualizador: 'Visualizador',
  }[papel] || papel || 'Participante'
}

function prioridadeTexto(valor) {
  return {
    1: 'Baixa',
    2: 'Média',
    3: 'Alta',
    4: 'Urgente',
  }[Number(valor)] || 'Baixa'
}

function responsavelTexto(id) {
  const pessoa = responsaveis.value.find(
    (usuario) => Number(usuario.id) === Number(id),
  )

  return pessoa ? nomeUsuario(pessoa) : 'Usuário não identificado'
}

function autorComentario(comentario) {
  return comentario?.autor?.name || comentario?.autor?.email || 'Usuário'
}

function progressoChecklist(tarefa) {
  const concluidos = Number(tarefa?.checklist_concluidos || 0)
  const total = Number(tarefa?.checklist_total || 0)
  return `${concluidos}/${total}`
}

function dataTexto(valor) {
  if (!valor) return 'Sem prazo'

  const [ano, mes, dia] = String(valor).slice(0, 10).split('-')

  return ano && mes && dia
    ? `${dia}/${mes}/${ano}`
    : 'Sem prazo'
}

async function carregar(id = projetoId.value) {
  if (!id || Number.isNaN(id)) {
    erro.value = 'O identificador do projeto é inválido.'
    carregando.value = false
    return
  }

  carregando.value = true
  carregandoMateriais.value = true
  erro.value = ''
  erroTarefas.value = ''
  erroMateriais.value = ''

  const resultados = await Promise.allSettled([
    projetosApi.obterPorId(id),
    projetosApi.listarMembros(id),
    tarefasApi.obterTodos({ projeto: id, page_size: 100 }),
    tarefasApi.listarMateriais({ projeto: id }),
  ])

  if (id !== projetoId.value) return

  const [
    resProjeto,
    resMembros,
    resTarefas,
    resMateriais,
  ] = resultados

  if (resProjeto.status === 'fulfilled') {
    projeto.value = resProjeto.value.data
  } else {
    erro.value = erroTexto(
      resProjeto.reason,
      'Não foi possível carregar o projeto.',
    )
  }

  if (resMembros.status === 'fulfilled') {
    membros.value = extrairLista(resMembros.value.data)
  } else {
    toast.showToast(
      erroTexto(
        resMembros.reason,
        'Não foi possível carregar os participantes.',
      ),
      'error',
    )
  }

  if (resTarefas.status === 'fulfilled') {
    tarefas.value = extrairLista(resTarefas.value.data).filter(
      (tarefa) => Number(tarefa.projeto) === Number(id),
    )
  } else {
    erroTarefas.value = erroTexto(
      resTarefas.reason,
      'Não foi possível carregar as tarefas do projeto.',
    )
  }

  if (resMateriais.status === 'fulfilled') {
    materiais.value = extrairLista(resMateriais.value.data)
  } else {
    erroMateriais.value = erroTexto(
      resMateriais.reason,
      'Não foi possível carregar os materiais do projeto.',
    )
  }

  carregandoMateriais.value = false
  carregando.value = false
}

async function recarregarTarefas() {
  if (!projeto.value?.id) return

  const id = projeto.value.id
  carregandoTarefas.value = true
  erroTarefas.value = ''

  try {
    const { data } = await tarefasApi.obterTodos({
      projeto: id,
      page_size: 100,
    })

    if (Number(projetoId.value) !== Number(id)) return

    tarefas.value = extrairLista(data).filter(
      (tarefa) => Number(tarefa.projeto) === Number(id),
    )
  } catch (err) {
    erroTarefas.value = erroTexto(
      err,
      'Não foi possível carregar as tarefas do projeto.',
    )
  } finally {
    if (Number(projetoId.value) === Number(id)) {
      carregandoTarefas.value = false
    }
  }
}

function abrirCriacaoTarefa() {
  if (!podeEditar.value) return

  editandoTarefa.value = null
  erroFormTarefa.value = ''

  Object.assign(formTarefa, {
    titulo: '',
    descricao: '',
    situacao: 1,
    prioridade: 1,
    prazoInicio: dataHoje(),
    prazoFim: dataHoje(),
    texto: '',
    user:
      Number(projeto.value?.proprietario?.id) ||
      Number(responsaveis.value[0]?.id) ||
      null,
  })

  modalTarefaAberto.value = true
}

function abrirEdicaoTarefa(tarefa) {
  if (!podeEditar.value) return

  editandoTarefa.value = tarefa
  erroFormTarefa.value = ''

  Object.assign(formTarefa, {
    titulo: tarefa.titulo || '',
    descricao: tarefa.descricao || '',
    situacao: Number(tarefa.situacao) || 1,
    prioridade: Number(tarefa.prioridade) || 1,
    prazoInicio: tarefa.prazoInicio || dataHoje(),
    prazoFim: tarefa.prazoFim || tarefa.prazoInicio || dataHoje(),
    texto: tarefa.texto || '',
    user: Number(tarefa.user) || null,
  })

  modalTarefaAberto.value = true
}

function fecharModalTarefa() {
  if (salvandoTarefa.value) return

  modalTarefaAberto.value = false
  editandoTarefa.value = null
  erroFormTarefa.value = ''
}

async function salvarTarefa() {
  if (!podeEditar.value || !projeto.value?.id) return

  erroFormTarefa.value = ''

  if (!formTarefa.titulo.trim()) {
    erroFormTarefa.value = 'Informe o título da tarefa.'
    return
  }

  if (
    !formTarefa.user ||
    !responsaveis.value.some(
      (pessoa) => Number(pessoa.id) === Number(formTarefa.user),
    )
  ) {
    erroFormTarefa.value =
      'Selecione um responsável que participe deste projeto.'
    return
  }

  if (!formTarefa.prazoInicio || !formTarefa.prazoFim) {
    erroFormTarefa.value =
      'Informe a data de início e o prazo final.'
    return
  }

  if (formTarefa.prazoFim < formTarefa.prazoInicio) {
    erroFormTarefa.value =
      'O prazo final não pode ser anterior à data de início.'
    return
  }

  salvandoTarefa.value = true

  const payload = {
    titulo: formTarefa.titulo.trim(),
    descricao: formTarefa.descricao.trim(),
    situacao: Number(formTarefa.situacao),
    prioridade: Number(formTarefa.prioridade),
    prazoInicio: formTarefa.prazoInicio,
    prazoFim: formTarefa.prazoFim,
    texto: formTarefa.texto.trim(),
    projeto: Number(projeto.value.id),
    user: Number(formTarefa.user),
  }

  try {
    if (editandoTarefa.value) {
      await tarefasApi.atualizar(editandoTarefa.value.id, payload)
      toast.showToast('Tarefa atualizada com sucesso.')
    } else {
      await tarefasApi.criar(payload)
      toast.showToast('Tarefa adicionada ao projeto.')
    }

    modalTarefaAberto.value = false
    editandoTarefa.value = null
    await recarregarTarefas()
  } catch (err) {
    erroFormTarefa.value = erroTexto(
      err,
      'Não foi possível salvar a tarefa.',
    )
  } finally {
    salvandoTarefa.value = false
  }
}

function iniciarArraste(evento, tarefa) {
  if (!podeEditar.value) {
    evento.preventDefault()
    return
  }

  tarefaArrastada.value = tarefa
  evento.dataTransfer?.setData('text/plain', String(tarefa.id))

  if (evento.dataTransfer) {
    evento.dataTransfer.effectAllowed = 'move'
  }
}

async function soltarTarefa(evento, status) {
  evento.preventDefault()

  const tarefa = tarefaArrastada.value
  tarefaArrastada.value = null

  if (
    !tarefa ||
    !podeEditar.value ||
    Number(tarefa.situacao) === Number(status)
  ) {
    return
  }

  try {
    await tarefasApi.atualizarParcialmente(tarefa.id, {
      situacao: Number(status),
    })

    tarefa.situacao = Number(status)
    toast.showToast('Situação da tarefa atualizada.')
  } catch (err) {
    toast.showToast(
      erroTexto(
        err,
        'Não foi possível alterar a situação da tarefa.',
      ),
      'error',
    )

    await recarregarTarefas()
  }
}

async function excluirTarefa(tarefa) {
  if (!podeEditar.value) return

  if (
    !window.confirm(
      `Deseja excluir a tarefa "${tarefa.titulo}"?`,
    )
  ) {
    return
  }

  excluindoTarefaId.value = tarefa.id

  try {
    await tarefasApi.deletar(tarefa.id)

    tarefas.value = tarefas.value.filter(
      (item) => Number(item.id) !== Number(tarefa.id),
    )

    toast.showToast('Tarefa excluída.')
  } catch (err) {
    toast.showToast(
      erroTexto(err, 'Não foi possível excluir a tarefa.'),
      'error',
    )
  } finally {
    excluindoTarefaId.value = null
  }
}

async function abrirDetalhesTarefa(tarefa) {
  tarefaDetalhada.value = tarefa
  detalheTarefaAberto.value = true
  textoChecklist.value = ''
  textoComentario.value = ''
  checklist.value = []
  comentarios.value = []
  await carregarDetalhesTarefa()
}

async function carregarDetalhesTarefa() {
  const tarefaId = tarefaDetalhada.value?.id
  if (!tarefaId) return

  carregandoDetalhesTarefa.value = true

  try {
    const [resChecklist, resComentarios] = await Promise.all([
      tarefasApi.listarChecklist(tarefaId),
      tarefasApi.listarComentarios(tarefaId),
    ])

    // Não aplique a resposta caso o usuário tenha aberto outra tarefa enquanto
    // as requisições estavam em andamento.
    if (Number(tarefaDetalhada.value?.id) !== Number(tarefaId)) return

    checklist.value = extrairLista(resChecklist.data)
    comentarios.value = extrairLista(resComentarios.data)
  } catch (err) {
    toast.showToast(
      erroTexto(err, 'Não foi possível carregar o checklist e os comentários.'),
      'error',
    )
  } finally {
    carregandoDetalhesTarefa.value = false
  }
}

async function adicionarItemChecklist() {
  const texto = textoChecklist.value.trim()
  const tarefaId = tarefaDetalhada.value?.id

  if (
    !podeEditar.value ||
    !texto ||
    !tarefaId ||
    salvandoChecklist.value
  ) {
    return
  }

  salvandoChecklist.value = true

  try {
    await tarefasApi.adicionarItemChecklist(tarefaId, texto)
    textoChecklist.value = ''
    await Promise.all([
      carregarDetalhesTarefa(),
      recarregarTarefas(),
    ])
  } catch (err) {
    toast.showToast(
      erroTexto(err, 'Não foi possível adicionar o item.'),
      'error',
    )
  } finally {
    salvandoChecklist.value = false
  }
}

async function alternarItemChecklist(item) {
  if (!podeEditar.value) return

  try {
    await tarefasApi.atualizarItemChecklist(item.id, {
      concluido: !item.concluido,
    })

    await Promise.all([
      carregarDetalhesTarefa(),
      recarregarTarefas(),
    ])
  } catch (err) {
    toast.showToast(
      erroTexto(err, 'Não foi possível atualizar o item.'),
      'error',
    )
  }
}

async function excluirItemChecklist(item) {
  if (!podeEditar.value) return

  if (!window.confirm(`Excluir o item "${item.texto}" do checklist?`)) {
    return
  }

  try {
    await tarefasApi.removerItemChecklist(item.id)

    await Promise.all([
      carregarDetalhesTarefa(),
      recarregarTarefas(),
    ])
  } catch (err) {
    toast.showToast(
      erroTexto(err, 'Não foi possível excluir o item.'),
      'error',
    )
  }
}

async function adicionarComentarioTarefa() {
  const descricao = textoComentario.value.trim()
  const tarefaId = tarefaDetalhada.value?.id

  if (!descricao || !tarefaId || salvandoComentario.value) return

  salvandoComentario.value = true

  try {
    // O backend identifica automaticamente o autor pelo usuário autenticado.
    await tarefasApi.criarComentario(tarefaId, descricao)
    textoComentario.value = ''
    await carregarDetalhesTarefa()
  } catch (err) {
    toast.showToast(
      erroTexto(err, 'Não foi possível publicar o comentário.'),
      'error',
    )
  } finally {
    salvandoComentario.value = false
  }
}

function fecharDetalhesTarefa() {
  if (salvandoChecklist.value || salvandoComentario.value) return

  detalheTarefaAberto.value = false
  tarefaDetalhada.value = null
  checklist.value = []
  comentarios.value = []
  textoChecklist.value = ''
  textoComentario.value = ''
}

async function adicionarMaterial() {
  if (!podeEditar.value) return

  if (!materialForm.titulo.trim() || !materialForm.url.trim()) {
    erroMateriais.value = 'Informe o título e o link do material.'
    return
  }

  salvandoMaterial.value = true
  erroMateriais.value = ''

  try {
    const url = new URL(materialForm.url.trim())

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Use um endereço HTTP ou HTTPS.')
    }

    await tarefasApi.criarMaterial({
      projeto: Number(projeto.value.id),
      titulo: materialForm.titulo.trim(),
      url: url.href,
      descricao: materialForm.descricao.trim(),
    })

    Object.assign(materialForm, {
      titulo: '',
      url: '',
      descricao: '',
    })

    const { data } = await tarefasApi.listarMateriais({
      projeto: projeto.value.id,
    })

    materiais.value = extrairLista(data)
    toast.showToast('Material adicionado ao projeto.')
  } catch (err) {
    erroMateriais.value = erroTexto(
      err,
      err?.message || 'Não foi possível adicionar o material.',
    )
  } finally {
    salvandoMaterial.value = false
  }
}

async function excluirMaterial(material) {
  if (!podeEditar.value) return

  if (!window.confirm(`Excluir o material "${material.titulo}"?`)) {
    return
  }

  try {
    await tarefasApi.removerMaterial(material.id)

    materiais.value = materiais.value.filter(
      (item) => Number(item.id) !== Number(material.id),
    )

    toast.showToast('Material excluído.')
  } catch (err) {
    erroMateriais.value = erroTexto(
      err,
      'Não foi possível excluir o material.',
    )
  }
}

watch(projetoId, (id) => carregar(id), { immediate: true })
</script>

<template>
  <main class="projeto-detalhe-page">
    <header class="topo-detalhe">
      <button
        class="botao-voltar"
        @click="router.push({ name: 'projetos' })"
      >
        ← Todos os projetos
      </button>

      <button
        v-if="podeEditar"
        class="botao-principal"
        @click="abrirCriacaoTarefa"
      >
        + Nova tarefa
      </button>
    </header>

    <div v-if="carregando" class="estado-carregamento">
      Carregando projeto...
    </div>

    <section v-else-if="erro" class="aviso erro-aviso">
      <p>{{ erro }}</p>

      <button class="botao-secundario" @click="carregar()">
        Tentar novamente
      </button>
    </section>

    <template v-else-if="projeto">
      <section class="hero-projeto">
        <div class="hero-info">
          <div class="linha-selos">
            <span
              class="papel-tag"
              :class="`papel-${projeto.meu_papel}`"
            >
              {{ papelTexto(projeto.meu_papel) }}
            </span>

            <span class="id-projeto">
              PROJETO #{{ projeto.id }}
            </span>
          </div>

          <h1>{{ projeto.nome }}</h1>

          <p>
            {{ projeto.descricao || 'Este projeto ainda não tem uma descrição.' }}
          </p>

          <small v-if="projeto.proprietario">
            Proprietário: {{ nomeUsuario(projeto.proprietario) }}
            <template v-if="projeto.proprietario.email">
              · {{ projeto.proprietario.email }}
            </template>
          </small>
        </div>

        <div class="indicadores">
          <article>
            <span>Tarefas</span>
            <strong>{{ tarefas.length }}</strong>
          </article>

          <article>
            <span>Concluídas</span>
            <strong>{{ totalConcluidas }}</strong>
          </article>

          <article>
            <span>Participantes</span>
            <strong>{{ participantes.length }}</strong>
          </article>
        </div>
      </section>

      <section class="painel">
        <header class="secao-cabecalho">
          <div>
            <h2>Participantes</h2>
            <p>Usuários que podem acessar este projeto.</p>
          </div>
        </header>

        <div v-if="participantes.length" class="grade-participantes">
          <article
            v-for="pessoa in participantes"
            :key="pessoa.id"
            class="participante-card"
          >
            <span class="avatar">
              {{ iniciais(pessoa.usuario) }}
            </span>

            <div class="participante-info">
              <strong>{{ nomeUsuario(pessoa.usuario) }}</strong>
              <small>{{ pessoa.usuario?.email || '' }}</small>
            </div>

            <span
              class="papel-tag"
              :class="`papel-${pessoa.papel}`"
            >
              {{ papelTexto(pessoa.papel) }}
            </span>
          </article>
        </div>

        <p v-else class="texto-suave">
          Não há participantes para exibir.
        </p>
      </section>

      <section class="painel painel-kanban">
        <header class="secao-cabecalho">
          <div>
            <h2>Kanban do projeto</h2>
            <p>
              Este quadro exibe somente as tarefas deste projeto.
            </p>
          </div>

          <button
            v-if="podeEditar"
            class="botao-principal"
            @click="abrirCriacaoTarefa"
          >
            + Adicionar tarefa
          </button>
        </header>

        <div v-if="erroTarefas" class="aviso erro-aviso">
          <span>{{ erroTarefas }}</span>

          <button class="botao-secundario" @click="recarregarTarefas">
            Tentar novamente
          </button>
        </div>

        <div v-if="carregandoTarefas" class="estado-carregamento">
          Atualizando tarefas...
        </div>

        <div v-else class="quadro-kanban">
          <section
            v-for="coluna in colunas"
            :key="coluna.id"
            class="coluna-kanban"
            @dragover.prevent
            @drop="soltarTarefa($event, coluna.id)"
          >
            <header class="cabecalho-coluna">
              <span
                class="ponto-status"
                :class="`status-${coluna.id}`"
              />

              <h3>{{ coluna.titulo }}</h3>

              <span class="contagem-coluna">
                {{ tarefasDaColuna(coluna.id).length }}
              </span>
            </header>

            <article
              v-for="tarefa in tarefasDaColuna(coluna.id)"
              :key="tarefa.id"
              class="cartao-tarefa"
              :draggable="podeEditar"
              @dragstart="iniciarArraste($event, tarefa)"
              @dragend="tarefaArrastada = null"
            >
              <div class="metadados-tarefa">
                <span class="tarefa-id">
                  #{{ tarefa.id }}
                </span>

                <span
                  class="prioridade-tag"
                  :class="`prioridade-${tarefa.prioridade}`"
                >
                  {{ prioridadeTexto(tarefa.prioridade) }}
                </span>
              </div>

              <h4>{{ tarefa.titulo }}</h4>

              <p v-if="tarefa.descricao" class="descricao-tarefa">
                {{ tarefa.descricao }}
              </p>

              <div class="dados-tarefa">
                <span>
                  Responsável: {{ responsavelTexto(tarefa.user) }}
                </span>

                <span>
                  Prazo: {{ dataTexto(tarefa.prazoFim) }}
                </span>

                <span class="progresso-checklist">
                  Checklist: {{ progressoChecklist(tarefa) }}
                </span>
              </div>

              <div class="acoes-tarefa">
                <button
                  class="botao-secundario botao-pequeno"
                  @click="abrirDetalhesTarefa(tarefa)"
                >
                  Detalhes · Checklist e comentários
                </button>

                <button
                  v-if="podeEditar"
                  class="botao-secundario botao-pequeno"
                  @click="abrirEdicaoTarefa(tarefa)"
                >
                  Editar
                </button>

                <button
                  v-if="podeEditar"
                  class="botao-perigo botao-pequeno"
                  :disabled="excluindoTarefaId === tarefa.id"
                  @click="excluirTarefa(tarefa)"
                >
                  {{ excluindoTarefaId === tarefa.id ? 'Excluindo...' : 'Excluir' }}
                </button>
              </div>
            </article>

            <p
              v-if="!tarefasDaColuna(coluna.id).length"
              class="coluna-vazia"
            >
              Nenhuma tarefa nesta etapa.
            </p>

            <button
              v-if="coluna.id === 1 && podeEditar"
              class="adicionar-na-coluna"
              @click="abrirCriacaoTarefa"
            >
              + Adicionar tarefa
            </button>
          </section>
        </div>
      </section>

      <section class="painel">
        <header class="secao-cabecalho">
          <div>
            <h2>Materiais de apoio</h2>
            <p>Links de documentos, pastas e outros recursos do projeto.</p>
          </div>
        </header>

        <p v-if="erroMateriais" class="aviso erro-aviso">
          {{ erroMateriais }}
        </p>

        <p v-if="carregandoMateriais" class="texto-suave">
          Carregando materiais...
        </p>

        <form
          v-if="podeEditar"
          class="form-material"
          @submit.prevent="adicionarMaterial"
        >
          <label>
            Título *
            <input
              v-model.trim="materialForm.titulo"
              maxlength="100"
              required
              placeholder="Documento de requisitos"
            />
          </label>

          <label>
            Link *
            <input
              v-model.trim="materialForm.url"
              type="url"
              maxlength="500"
              required
              placeholder="https://..."
            />
          </label>

          <label class="campo-descricao">
            Descrição
            <textarea
              v-model.trim="materialForm.descricao"
              rows="2"
              maxlength="255"
              placeholder="Descrição opcional"
            />
          </label>

          <button
            class="botao-principal"
            :disabled="salvandoMaterial"
          >
            {{ salvandoMaterial ? 'Salvando...' : 'Adicionar link' }}
          </button>
        </form>

        <ul v-if="materiais.length" class="lista-materiais">
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
              v-if="podeEditar"
              class="botao-perigo botao-pequeno"
              @click="excluirMaterial(material)"
            >
              Excluir
            </button>
          </li>
        </ul>

        <p
          v-else-if="!carregandoMateriais"
          class="texto-suave"
        >
          Nenhum material cadastrado.
        </p>
      </section>
    </template>

    <!-- Modal de detalhes: checklist e comentários da tarefa -->
    <div
      v-if="detalheTarefaAberto && tarefaDetalhada"
      class="fundo-modal"
      @click.self="fecharDetalhesTarefa"
    >
      <section
        class="modal-tarefa modal-detalhes-tarefa"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-detalhes-tarefa"
      >
        <header class="modal-topo">
          <div>
            <span class="id-projeto">TAREFA #{{ tarefaDetalhada.id }}</span>
            <h2 id="titulo-detalhes-tarefa">{{ tarefaDetalhada.titulo }}</h2>
            <p>{{ projeto?.nome }}</p>
            <p v-if="tarefaDetalhada.descricao" class="descricao-detalhe">
              {{ tarefaDetalhada.descricao }}
            </p>
          </div>

          <button
            type="button"
            class="fechar-modal"
            aria-label="Fechar detalhes da tarefa"
            @click="fecharDetalhesTarefa"
          >
            ×
          </button>
        </header>

        <p v-if="carregandoDetalhesTarefa" class="estado-carregamento">
          Carregando checklist e comentários...
        </p>

        <template v-else>
          <section class="secao-detalhes-tarefa">
            <header class="titulo-secao-detalhes">
              <div>
                <h3>Checklist</h3>
                <p>
                  {{ checklist.filter((item) => item.concluido).length }} de
                  {{ checklist.length }} itens concluídos
                </p>
              </div>

              <strong>
                {{ checklist.length
                  ? Math.round(
                      checklist.filter((item) => item.concluido).length
                      / checklist.length * 100,
                    )
                  : 0 }}%
              </strong>
            </header>

            <form
              v-if="podeEditar"
              class="form-adicionar-checklist"
              @submit.prevent="adicionarItemChecklist"
            >
              <input
                v-model.trim="textoChecklist"
                maxlength="255"
                required
                placeholder="Adicionar item ao checklist"
                :disabled="salvandoChecklist"
              />

              <button
                class="botao-principal"
                :disabled="!textoChecklist.trim() || salvandoChecklist"
              >
                {{ salvandoChecklist ? 'Adicionando...' : 'Adicionar' }}
              </button>
            </form>

            <ul v-if="checklist.length" class="checklist-projeto">
              <li v-for="item in checklist" :key="item.id">
                <label>
                  <input
                    type="checkbox"
                    :checked="item.concluido"
                    :disabled="!podeEditar"
                    @change="alternarItemChecklist(item)"
                  />
                  <span :class="{ 'item-concluido': item.concluido }">
                    {{ item.texto }}
                  </span>
                </label>

                <button
                  v-if="podeEditar"
                  class="botao-perigo botao-pequeno"
                  @click="excluirItemChecklist(item)"
                >
                  Excluir
                </button>
              </li>
            </ul>

            <p v-else class="texto-suave">
              Nenhum item no checklist.
              <template v-if="!podeEditar">
                Solicite a um editor que adicione itens.
              </template>
            </p>
          </section>

          <section class="secao-detalhes-tarefa">
            <header class="titulo-secao-detalhes">
              <div>
                <h3>Comentários</h3>
                <p>Mensagens visíveis aos participantes deste projeto.</p>
              </div>

              <span class="contagem-coluna">{{ comentarios.length }}</span>
            </header>

            <form
              class="form-comentario-projeto"
              @submit.prevent="adicionarComentarioTarefa"
            >
              <textarea
                v-model.trim="textoComentario"
                rows="3"
                maxlength="255"
                required
                placeholder="Escreva um comentário..."
                :disabled="salvandoComentario"
              />

              <div class="rodape-comentario">
                <small>{{ textoComentario.length }}/255 caracteres</small>

                <button
                  class="botao-principal"
                  :disabled="!textoComentario.trim() || salvandoComentario"
                >
                  {{ salvandoComentario ? 'Enviando...' : 'Comentar' }}
                </button>
              </div>
            </form>

            <ul v-if="comentarios.length" class="comentarios-projeto">
              <li v-for="comentario in comentarios" :key="comentario.id">
                <header>
                  <strong>{{ autorComentario(comentario) }}</strong>

                  <time v-if="comentario.created_at">
                    {{ new Date(comentario.created_at).toLocaleString('pt-BR') }}
                  </time>
                </header>

                <p>{{ comentario.descricao }}</p>
              </li>
            </ul>

            <p v-else class="texto-suave">
              Ainda não há comentários nesta tarefa.
            </p>
          </section>
        </template>

        <footer class="acoes-modal">
          <button
            type="button"
            class="botao-secundario"
            :disabled="salvandoChecklist || salvandoComentario"
            @click="fecharDetalhesTarefa"
          >
            Fechar
          </button>
        </footer>
      </section>
    </div>

    <!-- Modal para criar e editar tarefas do projeto -->
    <div
      v-if="modalTarefaAberto"
      class="fundo-modal"
      @click.self="fecharModalTarefa"
    >
      <section
        class="modal-tarefa"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-tarefa"
      >
        <header class="modal-topo">
          <div>
            <span class="id-projeto">
              {{ editandoTarefa ? `TAREFA #${editandoTarefa.id}` : 'NOVA ATIVIDADE' }}
            </span>

            <h2 id="titulo-modal-tarefa">
              {{ editandoTarefa ? 'Editar tarefa' : 'Adicionar tarefa' }}
            </h2>

            <p>{{ projeto?.nome }}</p>
          </div>

          <button
            type="button"
            class="fechar-modal"
            aria-label="Fechar"
            @click="fecharModalTarefa"
          >
            ×
          </button>
        </header>

        <form class="form-tarefa" @submit.prevent="salvarTarefa">
          <label>
            Título *
            <input
              v-model.trim="formTarefa.titulo"
              maxlength="45"
              required
              placeholder="Título da tarefa"
            />
          </label>

          <label>
            Descrição
            <textarea
              v-model.trim="formTarefa.descricao"
              maxlength="200"
              rows="3"
              placeholder="Descreva a atividade"
            />
          </label>

          <label>
            Responsável *
            <select v-model.number="formTarefa.user" required>
              <option :value="null" disabled>
                Selecione um participante
              </option>

              <option
                v-for="pessoa in responsaveis"
                :key="pessoa.id"
                :value="Number(pessoa.id)"
              >
                {{ nomeUsuario(pessoa) }}{{ pessoa.email ? ` — ${pessoa.email}` : '' }}
              </option>
            </select>
          </label>

          <div class="campos-duplos">
            <label>
              Data de início *
              <input
                v-model="formTarefa.prazoInicio"
                type="date"
                required
              />
            </label>

            <label>
              Prazo final *
              <input
                v-model="formTarefa.prazoFim"
                type="date"
                :min="formTarefa.prazoInicio"
                required
              />
            </label>
          </div>

          <div class="campos-duplos">
            <label>
              Situação
              <select v-model.number="formTarefa.situacao">
                <option :value="1">A fazer</option>
                <option :value="2">Em andamento</option>
                <option :value="3">Concluído</option>
              </select>
            </label>

            <label>
              Prioridade
              <select v-model.number="formTarefa.prioridade">
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
              v-model.trim="formTarefa.texto"
              maxlength="500"
              rows="2"
              placeholder="Observações opcionais"
            />
          </label>

          <p v-if="erroFormTarefa" class="aviso erro-aviso">
            {{ erroFormTarefa }}
          </p>

          <footer class="acoes-modal">
            <button
              type="button"
              class="botao-secundario"
              :disabled="salvandoTarefa"
              @click="fecharModalTarefa"
            >
              Cancelar
            </button>

            <button
              class="botao-principal"
              :disabled="salvandoTarefa || !responsaveis.length"
            >
              {{ salvandoTarefa ? 'Salvando...' : 'Salvar tarefa' }}
            </button>
          </footer>
        </form>
      </section>
    </div>
  </main>
</template>

<style scoped>
.projeto-detalhe-page {
  width: min(1280px, 100%);
  min-width: 0;
  margin: 0 auto;
  padding: 30px 24px 48px;
  box-sizing: border-box;
  color: var(--cor-texto, #f5f5f5);
}

.projeto-detalhe-page * {
  box-sizing: border-box;
}

.topo-detalhe {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 22px;
}

.botao-voltar,
.botao-principal,
.botao-secundario,
.botao-perigo,
.adicionar-na-coluna {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid transparent;
  border-radius: 9px;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 650;
  cursor: pointer;
  transition: 0.18s ease;
}

.botao-voltar,
.botao-secundario {
  color: var(--cor-texto, #f5f5f5);
  background: var(--cor-superficie, #222);
  border-color: var(--cor-borda, #3a3a3a);
}

.botao-principal {
  background: var(--cor-primaria, #7c3aed);
  color: #fff;
}

.botao-perigo {
  color: #fca5a5;
  border-color: #ef444455;
  background: #ef444418;
}

.botao-pequeno {
  padding: 6px 9px;
  font-size: 0.78rem;
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.estado-carregamento {
  padding: 36px 12px;
  text-align: center;
  color: var(--cor-texto-suave, #999);
}

.aviso {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  margin: 12px 0;
  border-radius: 9px;
}

.erro-aviso {
  color: #fca5a5;
  background: #ef444418;
  border: 1px solid #ef444455;
}

.hero-projeto {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(260px, 1fr);
  gap: 24px;
  padding: 26px;
  margin-bottom: 22px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 16px;
  background: var(--cor-superficie, #222);
}

.hero-info {
  min-width: 0;
}

.linha-selos {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.id-projeto {
  color: var(--cor-texto-suave, #999);
  font-size: 0.75rem;
  font-weight: 750;
  letter-spacing: 0.06em;
}

.hero-info h1 {
  margin: 0 0 10px;
  font-size: clamp(1.6rem, 3vw, 2.3rem);
  overflow-wrap: anywhere;
}

.hero-info p {
  margin: 0 0 14px;
  color: var(--cor-texto-suave, #aaa);
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.hero-info small {
  color: var(--cor-texto-suave, #999);
  overflow-wrap: anywhere;
}

.papel-tag {
  display: inline-flex;
  padding: 4px 9px;
  border: 1px solid var(--cor-borda, #444);
  border-radius: 999px;
  color: var(--cor-texto-suave, #aaa);
  background: var(--cor-fundo, #171717);
  font-size: 0.72rem;
  font-weight: 700;
}

.papel-proprietario {
  color: #c4b5fd;
  border-color: #8b5cf655;
  background: #8b5cf51a;
}

.papel-editor {
  color: #93c5fd;
  border-color: #3b82f655;
  background: #3b82f61a;
}

.indicadores {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 9px;
  align-content: center;
}

.indicadores article {
  min-width: 0;
  padding: 15px 12px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 11px;
  background: var(--cor-fundo, #171717);
}

.indicadores span {
  display: block;
  color: var(--cor-texto-suave, #999);
  font-size: 0.76rem;
}

.indicadores strong {
  display: block;
  margin-top: 8px;
  font-size: 1.55rem;
}

.painel {
  min-width: 0;
  padding: 21px;
  margin-bottom: 22px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 15px;
  background: var(--cor-superficie, #222);
}

.secao-cabecalho {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
}

.secao-cabecalho h2 {
  margin: 0 0 6px;
  font-size: 1.15rem;
}

.secao-cabecalho p {
  margin: 0;
  color: var(--cor-texto-suave, #999);
  font-size: 0.87rem;
  line-height: 1.45;
}

.grade-participantes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.participante-card {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 240px;
  max-width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 10px;
}

.avatar {
  display: grid;
  flex: 0 0 36px;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: #fff;
  background: var(--cor-primaria, #7c3aed);
  font-size: 0.78rem;
  font-weight: 750;
}

.participante-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  gap: 3px;
}

.participante-info strong,
.participante-info small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.participante-info strong {
  font-size: 0.86rem;
}

.participante-info small {
  color: var(--cor-texto-suave, #999);
  font-size: 0.76rem;
}

.quadro-kanban {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: start;
  gap: 14px;
}

.coluna-kanban {
  min-width: 0;
  min-height: 175px;
  padding: 12px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 12px;
  background: var(--cor-fundo, #171717);
}

.cabecalho-coluna {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 2px 1px 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--cor-borda, #3a3a3a);
}

.cabecalho-coluna h3 {
  flex: 1;
  margin: 0;
  font-size: 0.94rem;
}

.ponto-status {
  flex: 0 0 9px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.status-1 { background: #64748b; }
.status-2 { background: #d97706; }
.status-3 { background: #16a34a; }

.contagem-coluna {
  display: grid;
  place-items: center;
  min-width: 25px;
  height: 25px;
  padding: 0 6px;
  border-radius: 8px;
  background: var(--cor-superficie, #222);
  font-size: 0.78rem;
}

.cartao-tarefa {
  min-width: 0;
  padding: 13px;
  margin-bottom: 10px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 10px;
  background: var(--cor-superficie, #222);
  overflow-wrap: anywhere;
}

.cartao-tarefa[draggable="true"] {
  cursor: grab;
}

.cartao-tarefa:hover {
  border-color: var(--cor-primaria, #7c3aed);
}

.metadados-tarefa {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.tarefa-id {
  color: var(--cor-texto-suave, #888);
  font-size: 0.74rem;
}

.prioridade-tag {
  padding: 4px 7px;
  border-radius: 20px;
  color: #94a3b8;
  background: #64748b22;
  font-size: 0.72rem;
  font-weight: 750;
}

.prioridade-2 {
  color: #fbbf24;
  background: #d9770622;
}

.prioridade-3 {
  color: #d8b4fe;
  background: #a855f722;
}

.prioridade-4 {
  color: #fca5a5;
  background: #ef444422;
}

.cartao-tarefa h4 {
  margin: 9px 0 7px;
  font-size: 0.96rem;
  line-height: 1.4;
}

.descricao-tarefa {
  margin: 0 0 10px;
  color: var(--cor-texto-suave, #aaa);
  font-size: 0.84rem;
  line-height: 1.45;
  white-space: pre-wrap;
}

.dados-tarefa {
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: var(--cor-texto-suave, #999);
  font-size: 0.76rem;
}

.acoes-tarefa {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 12px;
}

.progresso-checklist {
  color: var(--cor-texto, #ddd);
  font-weight: 650;
}

.coluna-vazia {
  padding: 20px 5px;
  color: var(--cor-texto-suave, #888);
  text-align: center;
  font-size: 0.82rem;
}

.adicionar-na-coluna {
  width: 100%;
  border: 1px dashed var(--cor-borda, #444);
  color: var(--cor-texto-suave, #aaa);
  background: transparent;
}

.adicionar-na-coluna:hover {
  border-color: var(--cor-primaria, #7c3aed);
  color: var(--cor-texto, #fff);
}

.form-material,
.form-tarefa {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-material {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 18px;
}

.form-material label,
.form-tarefa label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
  font-size: 0.86rem;
  font-weight: 650;
}

.form-material input,
.form-material textarea,
.form-tarefa input,
.form-tarefa textarea,
.form-tarefa select {
  width: 100%;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--cor-borda, #444);
  border-radius: 8px;
  color: var(--cor-texto, #fff);
  background: var(--cor-fundo, #171717);
  font: inherit;
}

.form-material .campo-descricao {
  grid-column: 1 / -1;
}

.form-material button {
  justify-self: start;
}

.lista-materiais {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.lista-materiais li {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 9px;
}

.lista-materiais li > div {
  min-width: 0;
  overflow-wrap: anywhere;
}

.lista-materiais a {
  color: #c4b5fd;
  font-weight: 700;
}

.lista-materiais p {
  margin: 5px 0;
  color: var(--cor-texto-suave, #aaa);
  font-size: 0.84rem;
}

.lista-materiais small {
  color: var(--cor-texto-suave, #888);
}

.texto-suave {
  color: var(--cor-texto-suave, #999);
  font-size: 0.86rem;
}

.fundo-modal {
  position: fixed;
  z-index: 1500;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 16px;
  overflow-y: auto;
  background: #000a;
}

.modal-tarefa {
  width: min(620px, 100%);
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  padding: 23px;
  border: 1px solid var(--cor-borda, #444);
  border-radius: 15px;
  background: var(--cor-superficie, #222);
  color: var(--cor-texto, #fff);
  box-shadow: 0 20px 70px #0008;
}

.modal-detalhes-tarefa {
  width: min(900px, 100%);
  max-height: calc(100dvh - 32px);
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.modal-detalhes-tarefa,
.modal-detalhes-tarefa * {
  min-width: 0;
}

.descricao-detalhe {
  margin-top: 8px !important;
  max-width: 620px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.secao-detalhes-tarefa {
  padding: 16px 0;
  border-top: 1px solid var(--cor-borda, #3a3a3a);
}

.titulo-secao-detalhes {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.titulo-secao-detalhes h3 {
  margin: 0 0 4px;
  font-size: 1rem;
}

.titulo-secao-detalhes p {
  margin: 0;
  color: var(--cor-texto-suave, #999);
  font-size: 0.82rem;
}

.titulo-secao-detalhes > strong {
  font-variant-numeric: tabular-nums;
  font-size: 1rem;
}

.form-adicionar-checklist {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.form-adicionar-checklist input,
.form-comentario-projeto textarea {
  width: 100%;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--cor-borda, #444);
  border-radius: 8px;
  color: var(--cor-texto, #fff);
  background: var(--cor-fundo, #171717);
  font: inherit;
}

.form-adicionar-checklist button,
.form-comentario-projeto button {
  flex: 0 0 auto;
}

.checklist-projeto,
.comentarios-projeto {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.checklist-projeto li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 9px;
}

.checklist-projeto label {
  display: flex;
  align-items: flex-start;
  flex: 1 1 auto;
  width: calc(100% - 90px);
  min-width: 0;
  gap: 9px;
  overflow: visible;
}

.checklist-projeto label span {
  display: block;
  flex: 1 1 auto;
  min-width: 0;
  line-height: 1.45;
  overflow-wrap: anywhere;
  word-break: normal;
}

.checklist-projeto input[type="checkbox"] {
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
  margin-top: 3px;
  accent-color: var(--cor-primaria, #7c3aed);
}

.item-concluido {
  color: var(--cor-texto-suave, #999);
  text-decoration: line-through;
}

.form-comentario-projeto {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
}

.rodape-comentario {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.rodape-comentario small {
  color: var(--cor-texto-suave, #999);
}

.comentarios-projeto li {
  padding: 12px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 9px;
  overflow-wrap: anywhere;
}

.comentarios-projeto li header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px 12px;
}

.comentarios-projeto li strong {
  font-size: 0.85rem;
}

.comentarios-projeto li time {
  color: var(--cor-texto-suave, #999);
  font-size: 0.75rem;
}

.comentarios-projeto li p {
  margin: 8px 0 0;
  white-space: pre-wrap;
  line-height: 1.5;
}

.modal-topo {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
}

.modal-topo h2 {
  margin: 6px 0;
}

.modal-topo p {
  margin: 0;
  color: var(--cor-texto-suave, #999);
}

.fechar-modal {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border: 1px solid var(--cor-borda, #444);
  border-radius: 8px;
  color: inherit;
  background: transparent;
  font-size: 1.5rem;
  cursor: pointer;
}

.campos-duplos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.acoes-modal {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  margin-top: 6px;
}

@media (max-width: 900px) {
  .hero-projeto {
    grid-template-columns: 1fr;
  }

  .quadro-kanban {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .projeto-detalhe-page {
    padding: 20px 14px 36px;
  }

  .topo-detalhe {
    align-items: stretch;
    flex-direction: column;
  }

  .topo-detalhe button {
    align-self: flex-start;
  }

  .hero-projeto,
  .painel {
    padding: 15px;
  }

  .indicadores {
    gap: 7px;
  }

  .indicadores article {
    padding: 10px 8px;
  }

  .indicadores span {
    font-size: 0.68rem;
  }

  .indicadores strong {
    font-size: 1.2rem;
  }

  .secao-cabecalho {
    flex-direction: column;
    align-items: stretch;
  }

  .secao-cabecalho button {
    align-self: flex-start;
  }

  .participante-card {
    min-width: 0;
    width: 100%;
  }

  .form-material,
  .campos-duplos {
    grid-template-columns: 1fr;
  }

  .form-material .campo-descricao {
    grid-column: auto;
  }

  .lista-materiais li {
    flex-direction: column;
  }

  .modal-tarefa {
    padding: 16px;
  }

  .form-adicionar-checklist {
    flex-direction: column;
  }

  .form-adicionar-checklist button {
    align-self: flex-start;
  }

  .checklist-projeto li {
    align-items: center;
  }

  .checklist-projeto label {
    width: calc(100% - 70px);
  }
}
</style>