import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import { NOME_SITE } from "@/config";
import { useAuthStore } from "@/stores/auth";

const rotasPublicas = ["home", "sobre", "login", "cadastro", "verificar"];

const rotasSemLayout = [
  'notas',
  'login',
  'cadastro',
  'verificar',
]

const rotasSoParaVisitantes = ["login", "cadastro"];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  scrollBehavior: () => ({ top: 0 }),

  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
      meta: { titulo: "Início" },
    },
    {
      path: "/sobre",
      name: "sobre",
      component: () => import("@/views/SobreView.vue"),
      meta: { titulo: "Sobre" },
    },
    {
      path: "/perfil",
      name: "perfil",
      component: () => import("@/views/PerfilView.vue"),
      meta: { titulo: "Meu perfil" },
    },
    {
      path: "/projetos",
      name: "projetos",
      component: () => import("@/views/ProjetoView.vue"),
      meta: { titulo: "Projetos" },
    },
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/LoginView.vue"),
      meta: { titulo: "Login" },
    },
    {
      path: "/cadastro",
      name: "cadastro",
      component: () => import("@/views/CadastroView.vue"),
      meta: { titulo: "Cadastro" },
    },
    {
      path: "/verificar",
      name: "verificar",
      component: () => import("@/views/verificarEmailView.vue"),
      meta: { titulo: "Verificar e-mail" },
    },

    {
      path: "/grupos",
      name: "grupos",
      component: () => import("@/views/gruposView.vue"),
      meta: { requiresAuth: true },
    },
    
    {
      path: "/:pathMatch(.*)*",
      redirect: "/",
    },
    {
      path: '/Projetos',
      name: 'projetos',
      component: () => import('@/views/ProjetosView.vue'),
      meta: { titulo: 'Projetos' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },

    {
      path: '/Kanban',
      name: 'Kanban',
      component: () => import('@/views/KanbanView.vue'),
      meta: { titulo: 'Meu Kanban' },
    },

    {
      path: '/notas',
      name: 'notas',
      component: () => import('@/views/NotasView.vue'),
      meta: { titulo: 'Minhas Notas' },
    },


    {
      path: '/Documentos',
      name: 'documentos',
      component: () => import('@/views/DocumentoView.vue'),
      meta: { titulo: 'Meus Documentos' },
    },

    {
      path: '/Notificacao',
      name: 'Notificacao',
      component: () => import('@/views/NotificacaoView.vue'),
      meta: { titulo: 'Meus Notificação' },
    },


    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  // Recupera os dados da conta quando já existe um token salvo.
  if (auth.isAuthenticated && !auth.user) {
    await auth.fetchUser();
  }

  // Impede o acesso a páginas privadas sem autenticação.
  if (!rotasPublicas.includes(to.name) && !auth.isAuthenticated) {
    return {
      name: "login",
      query: { voltar: to.fullPath },
    };
  }

  // Uma conta autenticada não precisa voltar ao login ou cadastro.
  if (rotasSoParaVisitantes.includes(to.name) && auth.isAuthenticated) {
    return { name: "home" };
  }

  return true;
});

router.afterEach((to) => {
  document.title = to.meta.titulo
    ? `${to.meta.titulo} | ${NOME_SITE}`
    : NOME_SITE;
});

export { rotasPublicas, rotasSemLayout };

export default router;
