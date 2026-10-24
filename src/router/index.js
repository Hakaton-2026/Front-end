import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { NOME_SITE } from '@/config'
import { useAuthStore } from '@/stores/auth'
import ParticipantesProjeto from '@/components/ParticipantesProjeto.vue'

const rotasPublicas = [
  'home',
  'sobre',
  'login',
  'cadastro',
  'verificar',
]

const rotasSemLayout = [
  'notas',
  'login',
  'cadastro',
  'verificar',
]

const rotasSoParaVisitantes = [
  'login',
  'cadastro',
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  scrollBehavior: () => ({
    top: 0,
  }),

  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        titulo: 'Início',
      },
    },
    {
  path: '/participantes',
  name: 'participantes',
  component: ParticipantesProjeto,
},

    {
      path: '/sobre',
      name: 'sobre',
      component: () => import('@/views/SobreView.vue'),
      meta: {
        titulo: 'Sobre',
      },
    },

    {
      path: '/perfil',
      name: 'perfil',
      component: () => import('@/views/PerfilView.vue'),
      meta: {
        titulo: 'Meu perfil',
        requiresAuth: true,
      },
    },

    {
      path: '/projetos',
      name: 'projetos',
      component: () => import('@/views/ProjetoView.vue'),
      meta: {
        titulo: 'Projetos',
        requiresAuth: true,
      },
    },

    {
      path: '/projetos/:id',
      name: 'projeto-detalhes',
      component: () => import('@/views/ProjetoDetalheView.vue'),
      meta: {
        titulo: 'Detalhes do projeto',
        requiresAuth: true,
      },
    },

    {
      path: '/tarefas',
      name: 'tarefas',
      component: () => import('@/views/TarefasView.vue'),
      meta: {
        titulo: 'Tarefas',
        requiresAuth: true,
      },
    },

    {
      path: '/Kanban',
      redirect: {
        name: 'tarefas',
      },
    },

    {
      path: '/kanban',
      redirect: {
        name: 'tarefas',
      },
    },

    {
      path: '/Projetos',
      redirect: {
        name: 'projetos',
      },
    },

    {
      path: '/projetoandamento',
      redirect: {
        name: 'home',
      },
    },

    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: {
        titulo: 'Login',
      },
    },

    {
      path: '/cadastro',
      name: 'cadastro',
      component: () => import('@/views/CadastroView.vue'),
      meta: {
        titulo: 'Cadastro',
      },
    },

    {
      path: '/verificar',
      name: 'verificar',
      component: () => import('@/views/verificarEmailView.vue'),
      meta: {
        titulo: 'Verificar e-mail',
      },
    },

    {
      path: '/grupos',
      name: 'grupos',
      component: () => import('@/views/gruposView.vue'),
      meta: {
        titulo: 'Grupos',
        requiresAuth: true,
      },
    },

    {
      path: '/notas',
      name: 'notas',
      component: () => import('@/views/NotasView.vue'),
      meta: {
        titulo: 'Minhas Notas',
        requiresAuth: true,
      },
    },

    {
      path: '/Documentos',
      name: 'documentos',
      component: () => import('@/views/DocumentoView.vue'),
      meta: {
        titulo: 'Meus Documentos',
        requiresAuth: true,
      },
    },

    {
      path: '/Notificacao',
      name: 'notificacao',
      component: () => import('@/views/NotificacaoView.vue'),
      meta: {
        titulo: 'Notificações',
        requiresAuth: true,
      },
    },

    {
      path: '/:pathMatch(.*)*',
      redirect: {
        name: 'home',
      },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (auth.isAuthenticated && !auth.user) {
    await auth.fetchUser()
  }

  const exigeAutenticacao =
    to.meta.requiresAuth ||
    !rotasPublicas.includes(to.name)

  if (exigeAutenticacao && !auth.isAuthenticated) {
    return {
      name: 'login',
      query: {
        voltar: to.fullPath,
      },
    }
  }

  if (
    rotasSoParaVisitantes.includes(to.name) &&
    auth.isAuthenticated
  ) {
    return {
      name: 'home',
    }
  }

  return true
})

router.afterEach((to) => {
  document.title = to.meta.titulo
    ? `${to.meta.titulo} | ${NOME_SITE}`
    : NOME_SITE
})

export {
  rotasPublicas,
  rotasSemLayout,
}

export default router