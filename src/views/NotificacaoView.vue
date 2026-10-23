
<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const CHAVE_NOTIFICACOES = 'notificacoes-grupos'

const filtroAtivo = ref('todas')
const notificacoes = ref([])
const carregando = ref(true)

const filtros = [
  { id: 'todas', nome: 'Todas' },
  { id: 'nao-lidas', nome: 'Não lidas' },
  { id: 'alteracoes', nome: 'Alterações' },
  { id: 'avisos', nome: 'Avisos importantes' }
]

// Dados de demonstração.
// Depois serão substituídos pelos dados da API.
const exemplos = [
  {
    id: '1',
    autor: 'Mariana Costa',
    iniciais: 'MC',
    grupo: 'Projeto Integrador',
    titulo: 'Editou um documento',
    descricao: 'Mariana atualizou o documento de planejamento do projeto.',
    tipo: 'alteracao',
    icone: 'document-text-outline',
    data: new Date(Date.now() - 5 * 60000).toISOString(),
    lida: false,
    papelAutor: 'participante'
  },
  {
    id: '2',
    autor: 'Pedro Henrique',
    iniciais: 'PH',
    grupo: 'Projeto Integrador',
    titulo: 'Adicionou um novo material',
    descricao: 'Um novo arquivo foi adicionado aos materiais do grupo.',
    tipo: 'material',
    icone: 'folder-open-outline',
    data: new Date(Date.now() - 35 * 60000).toISOString(),
    lida: false,
    papelAutor: 'participante'
  },
  {
    id: '3',
    autor: 'Ana Oliveira',
    iniciais: 'AO',
    grupo: 'Trabalho de Redes',
    titulo: 'Concluiu uma tarefa',
    descricao: 'Ana marcou a tarefa de pesquisa como concluída.',
    tipo: 'tarefa',
    icone: 'checkmark-circle-outline',
    data: new Date(Date.now() - 2 * 3600000).toISOString(),
    lida: true,
    papelAutor: 'participante'
  },
  {
    id: '4',
    autor: 'Anderson',
    iniciais: 'AN',
    grupo: 'Projeto Integrador',
    titulo: 'Publicou um aviso importante',
    descricao: 'A entrega do trabalho será na próxima sexta-feira. Confira o prazo e organizem as atividades.',
    tipo: 'aviso',
    icone: 'megaphone-outline',
    data: new Date(Date.now() - 5 * 3600000).toISOString(),
    lida: false,
    papelAutor: 'lider'
  },
  {
    id: '5',
    autor: 'Anderson',
    iniciais: 'AN',
    grupo: 'Trabalho de Redes',
    titulo: 'Atualizou as orientações',
    descricao: 'O líder adicionou novas instruções para a realização do trabalho.',
    tipo: 'alteracao',
    icone: 'create-outline',
    data: new Date(Date.now() - 24 * 3600000).toISOString(),
    lida: true,
    papelAutor: 'lider'
  }
]

onMounted(() => {
  try {
    const salvas = JSON.parse(
      localStorage.getItem(CHAVE_NOTIFICACOES) || 'null'
    )

    notificacoes.value = Array.isArray(salvas)
      ? salvas
      : exemplos
  } catch {
    notificacoes.value = exemplos
  }

  carregando.value = false
})

watch(
  notificacoes,
  valor => {
    localStorage.setItem(
      CHAVE_NOTIFICACOES,
      JSON.stringify(valor)
    )
  },
  { deep: true }
)

const naoLidas = computed(() =>
  notificacoes.value.filter(n => !n.lida).length
)

const notificacoesFiltradas = computed(() => {
  const lista = [...notificacoes.value]

  return lista
    .filter(n => {
      if (filtroAtivo.value === 'nao-lidas') {
        return !n.lida
      }

      if (filtroAtivo.value === 'alteracoes') {
        return ['alteracao', 'material', 'tarefa'].includes(n.tipo)
      }

      if (filtroAtivo.value === 'avisos') {
        return n.tipo === 'aviso'
      }

      return true
    })
    .sort((a, b) => new Date(b.data) - new Date(a.data))
})

const agrupadas = computed(() => {
  const grupos = {}

  notificacoesFiltradas.value.forEach(n => {
    const data = new Date(n.data)
    const hoje = new Date()
    const ontem = new Date()

    ontem.setDate(hoje.getDate() - 1)

    let titulo

    if (data.toDateString() === hoje.toDateString()) {
      titulo = 'Hoje'
    } else if (data.toDateString() === ontem.toDateString()) {
      titulo = 'Ontem'
    } else {
      titulo = data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    }

    if (!grupos[titulo]) grupos[titulo] = []
    grupos[titulo].push(n)
  })

  return Object.entries(grupos).map(([titulo, itens]) => ({
    titulo,
    itens
  }))
})

function marcarComoLida(id) {
  notificacoes.value = notificacoes.value.map(n =>
    n.id === id ? { ...n, lida: true } : n
  )
}

function marcarTodasComoLidas() {
  notificacoes.value = notificacoes.value.map(n => ({
    ...n,
    lida: true
  }))
}

function excluirNotificacao(id) {
  notificacoes.value = notificacoes.value.filter(n => n.id !== id)
}

function tempoRelativo(data) {
  const minutos = Math.floor(
    (Date.now() - new Date(data).getTime()) / 60000
  )

  if (minutos < 1) return 'Agora'
  if (minutos < 60) return `Há ${minutos} min`

  const horas = Math.floor(minutos / 60)

  if (horas < 24) return `Há ${horas} h`

  const dias = Math.floor(horas / 24)

  if (dias === 1) return 'Há 1 dia'
  if (dias < 7) return `Há ${dias} dias`

  return new Date(data).toLocaleDateString('pt-BR')
}

function nomeTipo(tipo) {
  const nomes = {
    alteracao: 'Alteração',
    material: 'Novo material',
    tarefa: 'Tarefa',
    aviso: 'Aviso importante'
  }

  return nomes[tipo] || 'Atualização'
}
</script>

<template>
  <main class="pagina-notificacoes">
    <header class="cabecalho-notificacoes">
      <div>
        <span class="sobretitulo">CENTRAL DE ATIVIDADES</span>
        <h1>Notificações</h1>
        <p>
          Acompanhe as novidades, alterações e avisos dos seus grupos.
        </p>
      </div>

      <button
        v-if="naoLidas > 0"
        class="botao-marcar-todas"
        @click="marcarTodasComoLidas"
      >
        <ion-icon name="checkmark-done-outline" />
        Marcar todas como lidas
      </button>
    </header>

    <section class="resumo-notificacoes">
      <article class="resumo-card">
        <div class="resumo-icone">
          <ion-icon name="notifications-outline" />
        </div>

        <div>
          <strong>{{ notificacoes.length }}</strong>
          <span>Total de notificações</span>
        </div>
      </article>

      <article class="resumo-card">
        <div class="resumo-icone nao-lidas-icone">
          <ion-icon name="mail-unread-outline" />
        </div>

        <div>
          <strong>{{ naoLidas }}</strong>
          <span>Não lidas</span>
        </div>
      </article>
    </section>

    <nav class="filtros-notificacoes">
      <button
        v-for="filtro in filtros"
        :key="filtro.id"
        :class="{ ativo: filtroAtivo === filtro.id }"
        @click="filtroAtivo = filtro.id"
      >
        {{ filtro.nome }}

        <span
          v-if="filtro.id === 'nao-lidas' && naoLidas > 0"
          class="contador-filtro"
        >
          {{ naoLidas }}
        </span>
      </button>
    </nav>

    <section v-if="carregando" class="estado-notificacoes">
      <ion-icon name="hourglass-outline" />
      <p>Carregando notificações...</p>
    </section>

    <section
      v-else-if="notificacoesFiltradas.length === 0"
      class="estado-notificacoes"
    >
      <div class="estado-icone-vazio">
        <ion-icon name="notifications-off-outline" />
      </div>

      <h2>Nenhuma notificação por aqui</h2>

      <p>
        Quando houver novas atividades nos seus grupos, elas aparecerão aqui.
      </p>
    </section>

    <section v-else class="lista-notificacoes">
      <div
        v-for="grupo in agrupadas"
        :key="grupo.titulo"
        class="grupo-data"
      >
        <h2 class="titulo-data">{{ grupo.titulo }}</h2>

        <article
          v-for="notificacao in grupo.itens"
          :key="notificacao.id"
          class="notificacao-card"
          :class="{
            'notificacao-nao-lida': !notificacao.lida,
            'notificacao-aviso': notificacao.tipo === 'aviso'
          }"
        >
          <div
            class="icone-notificacao"
            :class="`icone-${notificacao.tipo}`"
          >
            <ion-icon :name="notificacao.icone" />
          </div>

          <div class="notificacao-conteudo">
            <div class="notificacao-meta">
              <span class="nome-grupo">
                <ion-icon name="people-outline" />
                {{ notificacao.grupo }}
              </span>

              <span class="tempo-notificacao">
                {{ tempoRelativo(notificacao.data) }}
              </span>
            </div>

            <h3>
              {{ notificacao.titulo }}

              <span
                v-if="!notificacao.lida"
                class="ponto-nao-lida"
                aria-label="Não lida"
              />
            </h3>

            <p>{{ notificacao.descricao }}</p>

            <div class="autor-notificacao">
              <span class="avatar-autor">
                {{ notificacao.iniciais }}
              </span>

              <span>
                <strong>{{ notificacao.autor }}</strong>
                <span class="papel-autor">
                  {{
                    notificacao.papelAutor === 'lider'
                      ? 'Líder do grupo'
                      : 'Participante'
                  }}
                </span>
              </span>

              <span
                class="tipo-etiqueta"
                :class="`etiqueta-${notificacao.tipo}`"
              >
                {{ nomeTipo(notificacao.tipo) }}
              </span>
            </div>
          </div>

          <div class="acoes-notificacao">
            <button
              v-if="!notificacao.lida"
              title="Marcar como lida"
              aria-label="Marcar como lida"
              @click="marcarComoLida(notificacao.id)"
            >
              <ion-icon name="checkmark-done-outline" />
            </button>

            <button
              title="Remover notificação"
              aria-label="Remover notificação"
              @click="excluirNotificacao(notificacao.id)"
            >
              <ion-icon name="trash-outline" />
            </button>
          </div>
        </article>
      </div>
    </section>

    <footer class="rodape-notificacoes">
      <ion-icon name="shield-checkmark-outline" />
      <span>
        Você acompanha aqui as atividades e os avisos dos seus grupos.
      </span>
    </footer>
  </main>
</template>

<style scoped>
.pagina-notificacoes {
  --destaque: var(--cor-primaria, #A855F7);
  --destaque-hover: var(--cor-primaria-hover, #A141FA);
  --superficie: var(--cor-superficie, #222222);
  --texto: var(--cor-texto, #f5f5f5);
  --texto-suave: var(--cor-texto-suave, #a3a3a3);
  --borda: var(--cor-borda, #3a3a3a);

  width: 100%;
  min-width: 0;
  padding: 24px;
  color: var(--texto);
  animation: aparecer 0.3s ease;
}

@keyframes aparecer {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.cabecalho-notificacoes {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 18px;
  margin-bottom: 24px;
}

.sobretitulo {
  color: var(--destaque);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.cabecalho-notificacoes h1 {
  margin: 7px 0;
  font-size: clamp(25px, 3vw, 32px);
  font-weight: 750;
  letter-spacing: -0.7px;
}

.cabecalho-notificacoes p {
  margin: 0;
  color: var(--texto-suave);
  font-size: 13px;
  line-height: 1.6;
}

.botao-marcar-todas {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 9px 12px;
  color: var(--destaque);
  background: transparent;
  border: 1px solid var(--borda);
  border-radius: 9px;
  font-size: 11px;
  font-weight: 650;
  cursor: pointer;
  transition: 0.2s ease;
}

.botao-marcar-todas:hover {
  background: #a855f71a;
  border-color: var(--destaque);
}

.botao-marcar-todas ion-icon {
  font-size: 17px;
}

/* Resumo */

.resumo-notificacoes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 22px;
}

.resumo-card {
  display: flex;
  align-items: center;
  gap: 13px;
  min-height: 78px;
  padding: 15px;
  background: var(--superficie);
  border: 1px solid var(--borda);
  border-radius: 12px;
}

.resumo-icone {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 42px;
  height: 42px;
  color: var(--destaque);
  background: #a855f720;
  border-radius: 10px;
  font-size: 22px;
}

.nao-lidas-icone {
  background: #a855f714;
}

.resumo-card div:last-child {
  display: grid;
  gap: 4px;
}

.resumo-card strong {
  font-size: 22px;
}

.resumo-card span {
  color: var(--texto-suave);
  font-size: 11px;
}

/* Filtros */

.filtros-notificacoes {
  display: flex;
  gap: 7px;
  overflow-x: auto;
  padding: 0 0 16px;
  border-bottom: 1px solid var(--borda);
  scrollbar-width: thin;
}

.filtros-notificacoes button {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 7px;
  padding: 9px 12px;
  color: var(--texto-suave);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  transition: 0.2s ease;
}

.filtros-notificacoes button:hover {
  color: var(--destaque);
  background: #a855f710;
}

.filtros-notificacoes button.ativo {
  color: var(--destaque);
  background: #a855f718;
  border-color: #a855f750;
}

.contador-filtro {
  display: grid;
  place-items: center;
  min-width: 19px;
  height: 19px;
  padding: 0 5px;
  color: #fff;
  background: var(--destaque);
  border-radius: 20px;
  font-size: 10px;
  font-weight: 750;
}

/* Grupos de datas */

.lista-notificacoes {
  display: grid;
  gap: 23px;
  padding-top: 18px;
}

.grupo-data {
  display: grid;
  gap: 9px;
}

.titulo-data {
  margin: 0 0 3px;
  color: var(--texto-suave);
  font-size: 12px;
  font-weight: 750;
}

/* Cartões */

.notificacao-card {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  min-width: 0;
  padding: 15px;
  background: var(--superficie);
  border: 1px solid var(--borda);
  border-radius: 12px;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.notificacao-card:hover {
  border-color: #a855f760;
}

.notificacao-nao-lida {
  background: color-mix(
    in srgb,
    var(--superficie) 94%,
    var(--destaque)
  );
  border-left: 3px solid var(--destaque);
}

.notificacao-aviso {
  border-left-color: #f59e0b;
}

.icone-notificacao {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 41px;
  height: 41px;
  color: var(--destaque);
  background: #a855f720;
  border-radius: 10px;
  font-size: 21px;
}

.icone-alteracao {
  color: #a855f7;
  background: #a855f720;
}

.icone-material {
  color: #60a5fa;
  background: #60a5fa20;
}

.icone-tarefa {
  color: #34d399;
  background: #34d39920;
}

.icone-aviso {
  color: #f59e0b;
  background: #f59e0b20;
}

.notificacao-conteudo {
  flex: 1;
  min-width: 0;
}

.notificacao-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin-bottom: 7px;
}

.nome-grupo {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--destaque);
  font-size: 10px;
  font-weight: 700;
}

.nome-grupo ion-icon {
  font-size: 14px;
}

.tempo-notificacao {
  color: var(--texto-suave);
  font-size: 10px;
}

.notificacao-conteudo h3 {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  margin: 0 0 6px;
  color: var(--texto);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.5;
}

.ponto-nao-lida {
  width: 7px;
  height: 7px;
  background: var(--destaque);
  border-radius: 50%;
}

.notificacao-conteudo > p {
  margin: 0;
  color: var(--texto-suave);
  font-size: 12px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

/* Autor */

.autor-notificacao {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 12px;
}

.avatar-autor {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 29px;
  height: 29px;
  color: var(--destaque);
  background: #a855f720;
  border: 1px solid #a855f735;
  border-radius: 50%;
  font-size: 9px;
  font-weight: 800;
}

.autor-notificacao > span:nth-child(2) {
  display: grid;
  gap: 2px;
}

.autor-notificacao strong {
  color: var(--texto);
  font-size: 10px;
  font-weight: 700;
}

.papel-autor {
  color: var(--texto-suave);
  font-size: 9px;
}

.tipo-etiqueta {
  margin-left: auto;
  padding: 5px 7px;
  color: var(--destaque);
  background: #a855f714;
  border-radius: 6px;
  font-size: 9px;
  font-weight: 650;
}

.etiqueta-material {
  color: #60a5fa;
  background: #60a5fa18;
}

.etiqueta-tarefa {
  color: #34d399;
  background: #34d39918;
}

.etiqueta-aviso {
  color: #f59e0b;
  background: #f59e0b18;
}

/* Ações */

.acoes-notificacao {
  display: flex;
  flex-shrink: 0;
  gap: 3px;
}

.acoes-notificacao button {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  color: var(--texto-suave);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 7px;
  font-size: 16px;
  cursor: pointer;
  transition: 0.2s ease;
}

.acoes-notificacao button:hover {
  color: var(--destaque);
  background: #a855f718;
  border-color: #a855f735;
}

/* Estado vazio */

.estado-notificacoes {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 11px;
  min-height: 260px;
  padding: 25px;
  text-align: center;
}

.estado-icone-vazio {
  display: grid;
  place-items: center;
  width: 57px;
  height: 57px;
  color: var(--destaque);
  background: #a855f720;
  border-radius: 16px;
  font-size: 27px;
}

.estado-notificacoes > ion-icon {
  color: var(--destaque);
  font-size: 25px;
}

.estado-notificacoes h2 {
  margin: 0;
  font-size: 16px;
}

.estado-notificacoes p {
  max-width: 390px;
  margin: 0;
  color: var(--texto-suave);
  font-size: 12px;
  line-height: 1.7;
}

/* Rodapé */

.rodape-notificacoes {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin-top: 25px;
  padding: 14px 8px;
  color: var(--texto-suave);
  border-top: 1px solid var(--borda);
  font-size: 10px;
  text-align: center;
}

.rodape-notificacoes ion-icon {
  flex-shrink: 0;
  color: var(--destaque);
  font-size: 16px;
}

/* Celular */

@media (max-width: 760px) {
  .pagina-notificacoes {
    padding: 18px 14px;
  }

  .cabecalho-notificacoes {
    align-items: flex-start;
    flex-direction: column;
  }

  .resumo-card {
    min-height: 70px;
    gap: 9px;
    padding: 11px;
  }

  .resumo-icone {
    width: 35px;
    height: 35px;
    font-size: 19px;
  }

  .resumo-card strong {
    font-size: 19px;
  }

  .resumo-card span {
    font-size: 10px;
  }

  .notificacao-card {
    gap: 9px;
    padding: 12px 10px;
  }

  .icone-notificacao {
    width: 35px;
    height: 35px;
    font-size: 19px;
  }

  .notificacao-meta {
    align-items: flex-start;
    flex-direction: column;
  }

  .acoes-notificacao {
    flex-direction: column;
  }

  .tipo-etiqueta {
    margin-left: 0;
  }
}

@media (max-width: 420px) {
  .pagina-notificacoes {
    padding: 14px 10px;
  }

  .resumo-notificacoes {
    gap: 8px;
  }

  .resumo-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .notificacao-card {
    flex-wrap: wrap;
  }

  .notificacao-conteudo {
    flex-basis: calc(100% - 48px);
  }

  .acoes-notificacao {
    flex-direction: row;
    width: 100%;
    justify-content: flex-end;
    padding-top: 7px;
    border-top: 1px solid var(--borda);
  }

  .filtros-notificacoes button {
    padding: 8px 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pagina-notificacoes,
  .pagina-notificacoes * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
