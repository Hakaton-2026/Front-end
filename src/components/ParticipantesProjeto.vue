<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import projetosApi from '@/api/projetosApi'
import usuariosApi from '@/api/usuariosApi'

const route = useRoute()
const projetoId = computed(() => String(route.query.projeto || ''))

const projeto = ref(null)
const membros = ref([])
const usuarios = ref([])
const pesquisa = ref('')
const usuarioSelecionado = ref('')
const papelSelecionado = ref('visualizador')
const filtro = ref('todos')
const carregando = ref(false)
const salvando = ref(false)
const erro = ref('')
const sucesso = ref('')
const buscandoUsuarios = ref(false)

let buscaAtual = 0

const podeGerenciar = computed(
  () => projeto.value?.meu_papel === 'proprietario',
)

// O proprietário vem dos dados do projeto.
// Os demais participantes vêm da rota /projetos/:id/membros/.
const participantes = computed(() => {
  const lista = []
  const proprietario = projeto.value?.proprietario

  if (proprietario?.id != null) {
    lista.push({
      id: `proprietario-${proprietario.id}`,
      usuario: proprietario,
      papel: 'proprietario',
      isOwner: true,
      status: 'ativo',
    })
  }

  for (const membro of membros.value) {
    if (!membro?.usuario?.id) continue

    if (
      proprietario?.id != null &&
      Number(membro.usuario.id) === Number(proprietario.id)
    ) {
      continue
    }

    lista.push({
      ...membro,
      isOwner: false,
      status: 'ativo',
    })
  }

  return lista
})

const participantesFiltrados = computed(() => {
  if (filtro.value === 'pendentes') {
    return []
  }

  if (filtro.value === 'ativos') {
    return participantes.value.filter(
      (pessoa) => pessoa.status === 'ativo',
    )
  }

  return participantes.value
})

function extrairLista(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results

  return []
}

function mensagemErro(error, padrao) {
  const dados = error?.response?.data

  if (typeof error?.mensagem === 'string' && error.mensagem) {
    return error.mensagem
  }

  if (typeof dados === 'string') return dados
  if (typeof dados?.detail === 'string') return dados.detail
  if (typeof dados?.mensagem === 'string') return dados.mensagem
  if (typeof dados?.message === 'string') return dados.message

  if (dados && typeof dados === 'object') {
    const partes = Object.entries(dados).map(([campo, valor]) => {
      const texto = Array.isArray(valor)
        ? valor.join(', ')
        : String(valor)

      return `${campo}: ${texto}`
    })

    if (partes.length) return partes.join('\n')
  }

  return error?.message || padrao
}

async function carregarParticipantes() {
  if (!projetoId.value) {
    projeto.value = null
    membros.value = []
    erro.value =
      'Abra esta página a partir de um projeto para gerenciar os participantes.'

    return
  }

  carregando.value = true
  erro.value = ''
  sucesso.value = ''

  try {
    const [respostaProjeto, respostaMembros] = await Promise.all([
      projetosApi.obterPorId(projetoId.value),
      projetosApi.listarMembros(projetoId.value),
    ])

    projeto.value = respostaProjeto.data
    membros.value = extrairLista(respostaMembros.data)
  } catch (error) {
    erro.value = mensagemErro(
      error,
      'Não foi possível carregar os participantes.',
    )
  } finally {
    carregando.value = false
  }
}

async function buscarUsuarios() {
  erro.value = ''
  sucesso.value = ''
  usuarioSelecionado.value = ''

  const termo = pesquisa.value.trim()
  const sequencia = ++buscaAtual

  if (termo.length < 2) {
    usuarios.value = []
    buscandoUsuarios.value = false
    return
  }

  buscandoUsuarios.value = true

  try {
    const response = await usuariosApi.buscar(termo)

    // Ignora uma resposta antiga se a pesquisa já mudou.
    if (sequencia !== buscaAtual) return

    const dados = extrairLista(response.data)

    const idsExistentes = new Set(
      participantes.value.map(
        (pessoa) => String(pessoa.usuario?.id),
      ),
    )

    usuarios.value = dados.filter(
      (usuario) => !idsExistentes.has(String(usuario.id)),
    )
  } catch (error) {
    if (sequencia === buscaAtual) {
      erro.value = mensagemErro(
        error,
        'Não foi possível pesquisar usuários cadastrados.',
      )

      usuarios.value = []
    }
  } finally {
    if (sequencia === buscaAtual) {
      buscandoUsuarios.value = false
    }
  }
}

async function convidarUsuario() {
  if (!projetoId.value || !usuarioSelecionado.value) {
    erro.value = 'Selecione um usuário para adicionar.'
    return
  }

  if (!podeGerenciar.value) {
    erro.value =
      'Somente o proprietário do projeto pode gerenciar participantes.'

    return
  }

  salvando.value = true
  erro.value = ''
  sucesso.value = ''

  try {
    await projetosApi.adicionarMembro(projetoId.value, {
      usuario: Number(usuarioSelecionado.value),
      papel: papelSelecionado.value,
    })

    sucesso.value = 'Participante adicionado com sucesso!'

    usuarioSelecionado.value = ''
    pesquisa.value = ''
    usuarios.value = []

    await carregarParticipantes()
  } catch (error) {
    erro.value = mensagemErro(
      error,
      'Não foi possível adicionar o participante.',
    )
  } finally {
    salvando.value = false
  }
}

async function alterarPapel(participante, novoPapel) {
  if (participante.isOwner || !podeGerenciar.value) return

  if (!['visualizador', 'editor'].includes(novoPapel)) {
    return
  }

  erro.value = ''
  sucesso.value = ''

  try {
    await projetosApi.atualizarMembro(
      projetoId.value,
      participante.id,
      { papel: novoPapel },
    )

    sucesso.value = 'Permissão atualizada.'

    await carregarParticipantes()
  } catch (error) {
    erro.value = mensagemErro(
      error,
      'Não foi possível alterar a permissão.',
    )
  }
}

async function removerParticipante(participante) {
  if (participante.isOwner || !podeGerenciar.value) return

  const nome = nomeParticipante(participante)

  if (!window.confirm(`Deseja remover ${nome} do projeto?`)) {
    return
  }

  erro.value = ''
  sucesso.value = ''

  try {
    await projetosApi.removerMembro(
      projetoId.value,
      participante.id,
    )

    sucesso.value = 'Participante removido.'

    await carregarParticipantes()
  } catch (error) {
    erro.value = mensagemErro(
      error,
      'Não foi possível remover o participante.',
    )
  }
}

function nomeParticipante(participante) {
  return (
    participante?.usuario?.name ||
    participante?.usuario?.nome ||
    participante?.usuario?.email ||
    'Usuário'
  )
}

function emailParticipante(participante) {
  return participante?.usuario?.email || ''
}

watch(
  projetoId,
  () => {
    pesquisa.value = ''
    usuarios.value = []
    usuarioSelecionado.value = ''

    carregarParticipantes()
  },
  { immediate: true },
)
</script>

<template>
  <main class="participantes-page">
    <header class="participantes-header">
      <div>
        <span class="participantes-eyebrow">
          GESTÃO DO PROJETO
        </span>

        <h1>Participantes</h1>

        <p>Gerencie quem pode acessar este projeto.</p>
      </div>

      <RouterLink
        :to="{ path: '/projetos' }"
        class="participantes-voltar"
      >
        <ion-icon name="arrow-back-outline"></ion-icon>
        Voltar aos projetos
      </RouterLink>
    </header>

    <section class="participantes-card">
      <div class="participantes-titulo">
        <div>
          <h2>
            <ion-icon name="people-outline"></ion-icon>
            Pessoas do projeto
          </h2>

          <p>
            {{ participantes.length }}
            {{
              participantes.length === 1
                ? 'participante'
                : 'participantes'
            }}
          </p>

          <p
            v-if="projeto"
            class="participantes-descricao"
          >
            {{ projeto.nome }}
          </p>
        </div>

        <button
          class="participantes-atualizar"
          type="button"
          :disabled="carregando"
          @click="carregarParticipantes"
        >
          <ion-icon name="refresh-outline"></ion-icon>
          Atualizar
        </button>
      </div>

      <div class="participantes-filtros">
        <button
          type="button"
          :class="{ ativo: filtro === 'todos' }"
          @click="filtro = 'todos'"
        >
          Todos
        </button>

        <button
          type="button"
          :class="{ ativo: filtro === 'ativos' }"
          @click="filtro = 'ativos'"
        >
          Ativos
        </button>

        <button
          type="button"
          :class="{ ativo: filtro === 'pendentes' }"
          @click="filtro = 'pendentes'"
        >
          Convites pendentes
        </button>
      </div>

      <p
        v-if="carregando"
        class="participantes-vazio"
      >
        Carregando participantes...
      </p>

      <div
        v-else-if="participantesFiltrados.length"
        class="participantes-lista"
      >
        <article
          v-for="participante in participantesFiltrados"
          :key="participante.id"
          class="participante-item"
        >
          <div class="participante-avatar">
            <ion-icon name="person-outline"></ion-icon>
          </div>

          <div class="participante-dados">
            <strong>
              {{ nomeParticipante(participante) }}
            </strong>

            <span>
              {{ emailParticipante(participante) }}
            </span>

            <small>
              {{ participante.isOwner ? 'Proprietário' : 'Ativo' }}
            </small>
          </div>

          <div class="participante-acoes">
            <select
              v-if="!participante.isOwner"
              :value="participante.papel || 'visualizador'"
              aria-label="Permissão do participante"
              :disabled="!podeGerenciar"
              @change="
                alterarPapel(participante, $event.target.value)
              "
            >
              <option value="visualizador">
                Visualizador
              </option>

              <option value="editor">
                Editor
              </option>
            </select>

            <span
              v-else
              class="participante-papel-proprietario"
            >
              Proprietário
            </span>

            <button
              v-if="!participante.isOwner"
              type="button"
              class="participante-remover"
              title="Remover participante"
              aria-label="Remover participante"
              :disabled="!podeGerenciar"
              @click="removerParticipante(participante)"
            >
              <ion-icon name="trash-outline"></ion-icon>
            </button>
          </div>
        </article>
      </div>

      <div v-else class="participantes-vazio">
        <ion-icon name="people-outline"></ion-icon>

        <h3>
          {{
            filtro === 'pendentes'
              ? 'Nenhum convite pendente'
              : 'Nenhum participante encontrado'
          }}
        </h3>

        <p v-if="filtro === 'pendentes'">
          A API atual adiciona usuários cadastrados diretamente
          e não mantém convites pendentes.
        </p>

        <p v-else>
          Adicione alguém para colaborar neste projeto.
        </p>
      </div>
    </section>

    <section class="participantes-card">
      <h2>
        <ion-icon name="person-add-outline"></ion-icon>
        Adicionar participantes
      </h2>

      <p class="participantes-descricao">
        Pesquise usuários cadastrados para adicioná-los a este projeto.
      </p>

      <template v-if="podeGerenciar">
        <label for="pesquisaUsuario">
          Nome ou e-mail
        </label>

        <input
          id="pesquisaUsuario"
          v-model="pesquisa"
          type="search"
          placeholder="Digite pelo menos 2 caracteres"
          autocomplete="off"
          @input="buscarUsuarios"
        />

        <p
          v-if="buscandoUsuarios"
          class="participantes-ajuda"
        >
          Buscando usuários...
        </p>

        <div
          v-if="usuarios.length"
          class="usuarios-resultados"
        >
          <label
            v-for="usuario in usuarios"
            :key="usuario.id"
            class="usuario-opcao"
          >
            <input
              v-model="usuarioSelecionado"
              type="radio"
              name="usuarioSelecionado"
              :value="String(usuario.id)"
            />

            <span>
              <strong>
                {{ usuario.name || usuario.nome || usuario.email }}
              </strong>

              <small>{{ usuario.email }}</small>
            </span>
          </label>
        </div>

        <p
          v-else-if="pesquisa.trim().length >= 2 && !buscandoUsuarios"
          class="participantes-ajuda"
        >
          Nenhum usuário disponível. Só é possível adicionar
          contas já cadastradas.
        </p>

        <label for="papelSelecionado">
          Permissão inicial
        </label>

        <select
          id="papelSelecionado"
          v-model="papelSelecionado"
          class="participantes-papel"
        >
          <option value="visualizador">
            Visualizador — pode consultar o projeto
          </option>

          <option value="editor">
            Editor — pode modificar o projeto
          </option>
        </select>

        <button
          type="button"
          class="participantes-convidar"
          :disabled="salvando || !usuarioSelecionado"
          @click="convidarUsuario"
        >
          <ion-icon name="person-add-outline"></ion-icon>
          {{
            salvando
              ? 'Adicionando...'
              : 'Adicionar participante'
          }}
        </button>
      </template>

      <p v-else class="participantes-ajuda">
        Somente o proprietário do projeto pode adicionar,
        remover ou alterar participantes.
      </p>

      <p
        v-if="erro"
        class="participantes-mensagem erro"
        role="alert"
      >
        {{ erro }}
      </p>

      <p
        v-if="sucesso"
        class="participantes-mensagem sucesso"
        role="status"
      >
        {{ sucesso }}
      </p>
    </section>
  </main>
</template>

<style scoped>
.participantes-page {
  width: min(100% - 32px, 1100px);
  margin: 0 auto;
  padding: 32px 0;
  color: var(--cor-texto, #f5f5f5);
}

.participantes-header,
.participantes-titulo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.participantes-header {
  margin-bottom: 28px;
}

.participantes-eyebrow {
  color: var(--cor-primaria, #a855f7);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.participantes-header h1 {
  margin: 8px 0;
  font-size: clamp(26px, 4vw, 34px);
}

.participantes-header p,
.participantes-descricao {
  color: var(--cor-texto-suave, #a3a3a3);
}

.participantes-voltar,
.participantes-atualizar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: var(--raio, 10px);
  background: var(--cor-superficie, #222);
  color: var(--cor-texto, #f5f5f5);
  text-decoration: none;
  cursor: pointer;
}

.participantes-card {
  margin-bottom: 22px;
  padding: 24px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 16px;
  background: var(--cor-superficie, #222);
}

.participantes-card h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 8px;
  font-size: 20px;
}

.participantes-card h2 ion-icon {
  color: var(--cor-primaria, #a855f7);
}

.participantes-titulo p {
  margin: 4px 0 0;
  color: var(--cor-texto-suave, #a3a3a3);
}

.participantes-filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 24px 0 12px;
}

.participantes-filtros button {
  padding: 9px 13px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 9px;
  background: transparent;
  color: var(--cor-texto, #f5f5f5);
  cursor: pointer;
}

.participantes-filtros button.ativo {
  border-color: var(--cor-primaria, #a855f7);
  background: var(--cor-primaria, #a855f7);
  color: white;
}

.participantes-lista {
  display: grid;
  gap: 10px;
}

.participante-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-top: 1px solid var(--cor-borda, #3a3a3a);
}

.participante-avatar {
  display: grid;
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 50%;
  background: color-mix(
    in srgb,
    var(--cor-primaria, #a855f7) 18%,
    transparent
  );
  color: var(--cor-primaria, #a855f7);
  font-size: 22px;
}

.participante-dados {
  display: grid;
  flex: 1;
  gap: 4px;
  min-width: 0;
}

.participante-dados span,
.participante-dados small,
.participantes-ajuda {
  color: var(--cor-texto-suave, #a3a3a3);
  overflow-wrap: anywhere;
}

.participante-acoes {
  display: flex;
  align-items: center;
  gap: 8px;
}

.participante-acoes select,
.participantes-papel {
  max-width: 100%;
  padding: 9px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 8px;
  background: var(--cor-fundo, #181818);
  color: var(--cor-texto, #f5f5f5);
}

.participante-remover {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 8px;
  background: transparent;
  color: #ef4444;
  cursor: pointer;
}

.participante-remover:disabled,
.participante-acoes select:disabled,
.participantes-atualizar:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.participante-papel-proprietario {
  font-size: 12px;
  color: var(--cor-primaria, #a855f7);
  font-weight: 700;
}

.participantes-card > label {
  display: block;
  margin: 18px 0 7px;
  font-weight: 600;
}

.participantes-card > input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 9px;
  background: var(--cor-fundo, #181818);
  color: var(--cor-texto, #f5f5f5);
  font: inherit;
}

.usuarios-resultados {
  display: grid;
  gap: 8px;
  margin: 12px 0;
}

.usuario-opcao {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--cor-borda, #3a3a3a);
  border-radius: 9px;
  cursor: pointer;
}

.usuario-opcao span {
  display: grid;
  gap: 4px;
}

.usuario-opcao small {
  color: var(--cor-texto-suave, #a3a3a3);
}

.participantes-convidar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 18px;
  padding: 11px 15px;
  border: 1px solid var(--cor-primaria, #a855f7);
  border-radius: 9px;
  background: var(--cor-primaria, #a855f7);
  color: #fff;
  cursor: pointer;
}

.participantes-convidar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.participantes-mensagem {
  margin-top: 14px;
  white-space: pre-line;
}

.participantes-mensagem.erro {
  color: #ef4444;
}

.participantes-mensagem.sucesso {
  color: #22c55e;
}

.participantes-vazio {
  padding: 24px 8px;
  text-align: center;
  color: var(--cor-texto-suave, #a3a3a3);
}

.participantes-vazio > ion-icon {
  font-size: 30px;
  color: var(--cor-primaria, #a855f7);
}

@media (max-width: 700px) {
  .participantes-header,
  .participantes-titulo {
    align-items: flex-start;
    flex-direction: column;
  }

  .participantes-card {
    padding: 16px;
  }

  .participante-item {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .participante-dados {
    flex-basis: calc(100% - 60px);
  }

  .participante-acoes {
    width: 100%;
    padding-left: 54px;
  }

  .participante-acoes select {
    flex: 1;
  }
}
</style>