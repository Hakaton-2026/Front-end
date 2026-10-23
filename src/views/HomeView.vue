<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import '@/assets/style-telas/home.css'
import {
  FolderKanban,
  ListTodo,
  CircleCheck,
  BookOpen,
  LayoutDashboard,
  Plus,
  ArrowRight,
  Users,
  GraduationCap
} from 'lucide-vue-next'

const router = useRouter()

const usuario = ref({
  nome: 'Fafnir',
})

const projetos = ref([
  {
    id: 1,
    nome: 'Site BabyCare',
    membros: '3 membros',
    icone: '',
    cor: 'verde',
    concluidas: 5,
    total: 8,
  },
  {
    id: 2,
    nome: 'Estudos',
    membros: 'Você',
    icone: '▣',
    cor: 'azul',
    concluidas: 2,
    total: 6,
  },
  {
    id: 3,
    nome: 'Tarefas Pessoais',
    membros: 'Você',
    icone: '♙',
    cor: 'roxo',
    concluidas: 4,
    total: 10,
  },
])

const totalTarefas = computed(() =>
  projetos.value.reduce((total, p) => total + p.total, 0)
)

const totalConcluidas = computed(() =>
  projetos.value.reduce((total, p) => total + p.concluidas, 0)
)

function progresso(projeto) {
  if (!projeto.total) return 0

  return Math.round(
    (projeto.concluidas / projeto.total) * 100
  )
}

function abrirProjeto(id) {
  router.push(`/projetos/${id}`)
}

function novoProjeto() {
  router.push('/projetos/novo')
}

function abrirKanban() {
  router.push('/kanban')
}
</script>

<template>
  <div class="home-layout">

    <main class="home-conteudo">

      <!-- BOAS-VINDAS -->
      <header class="home-header">
        <div class="boas-vindas">
          <h1>Olá, {{ usuario.nome }}!</h1>
          <p>Você está pronto para fazer grandes coisas hoje.</p>
        </div>
      </header>

      <!-- ESTATÍSTICAS -->
      <section class="estatisticas">

        <div class="stat-card">

          <div class="stat-icone azul">
            <FolderKanban :size="23" :stroke-width="2" />
          </div>

          <div class="stat-info">
            <span class="stat-titulo">Projetos</span>
            <strong>{{ projetos.length }}</strong>
            <small>ativos</small>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icone verde">
            <ListTodo :size="23" :stroke-width="2" />
          </div>

          <div class="stat-info">
            <span class="stat-titulo">Tarefas</span>
            <strong>{{ totalTarefas }}</strong>
            <small>total</small>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icone verde">
            <CircleCheck :size="23" :stroke="2" />
          </div>

          <div class="stat-info">
            <span class="stat-titulo">Concluídas</span>
            <strong>{{ totalConcluidas }}</strong>
            <small>total</small>
          </div>
        </div>

      </section>

      <!-- PROJETOS -->
      <section class="secao-projetos">

        <div class="secao-titulo">
          <h2>Seus Projetos</h2>

          <button class="btn-primario" @click="novoProjeto">
            <Plus :size="13" />
            Novo Projeto
          </button>
        </div>

        <div class="projetos-grid">

          <article v-for="projeto in projetos" :key="projeto.id" class="projeto-card" @click="abrirProjeto(projeto.id)">

            <div class="projeto-info">

              <div class="projeto-icone" :class="projeto.cor">
                <BookOpen :size="23" :stroke="23" />
              </div>

              <div>
                <h3>{{ projeto.nome }}</h3>
                <p>{{ projeto.membros }}</p>
              </div>

            </div>

            <div class="projeto-progresso">

              <div class="progresso-texto">
                <span>
                  {{ projeto.concluidas }}/{{ projeto.total }}
                </span>

                <span>
                  {{ progresso(projeto) }}%
                </span>
              </div>

              <div class="barra-progresso">
                <div class="barra-preenchida" :class="projeto.cor" :style="{
                  width: progresso(projeto) + '%'
                }"></div>
              </div>

            </div>

          </article>

        </div>

      </section>

      <!-- KANBAN INDIVIDUAL -->
      <section class="secao-kanban">

        <h2>Seu Kanban Individual</h2>

        <div class="kanban-card">

          <div class="kanban-info">

            <div class="kanban-icone">▣</div>

            <div>
              <h3>Seu Kanban individual</h3>
              <p>Organize suas tarefas pessoais</p>
            </div>

          </div>

          <button class="btn-kanban" @click="abrirKanban">
            Ver meu kanban →
          </button>

        </div>

      </section>

    </main>

  </div>
</template>
