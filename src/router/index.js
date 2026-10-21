import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { NOME_SITE } from '@/config'
import { useAuthStore } from '@/stores/auth'

/*
  ESCOLHA AQUI quem pode o quê. Use o `name` da rota.

  rotasPublicas          qualquer pessoa abre, mesmo sem login.
                         Toda rota que NÃO está nesta lista exige login.

  rotasSemLayout         páginas sem menu e sem rodapé.

  rotasSoParaVisitantes  só para quem NÃO está logado (quem já entrou é mandado para o início).
*/
const rotasPublicas = ['sobre', 'login', 'cadastro', 'verificar']
const rotasSemLayout = ['login', 'cadastro', 'verificar']
const rotasSoParaVisitantes = ['login', 'cadastro']

/*
  Para criar uma página nova:
  1. crie o arquivo em src/views (ex.: ProdutosView.vue)
  2. adicione um item na lista abaixo, antes da última rota
  3. se ela puder ser aberta sem login, coloque o name dela em rotasPublicas
  4. para aparecer no menu, adicione também em `links` no src/components/AppNavbar.vue

  meta.titulo -> título que aparece na aba do navegador
*/
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { titulo: 'Início' },
    },
    {
      path: '/sobre',
      name: 'sobre',
      component: () => import('@/views/SobreView.vue'),
      meta: { titulo: 'Sobre' },
    },
    {
      path: '/perfil',
      name: 'perfil',
      component: () => import('@/views/PerfilView.vue'),
      meta: { titulo: 'Meu perfil' },
    },
    {
      path: '/Login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { titulo: 'Login' },
    },
    {
      path: '/cadastro',
      name: 'cadastro',
      component: () => import('@/views/CadastroView.vue'),
      meta: { titulo: 'Cadastro' },
    },
    {
      path: '/verificar',
      name: 'verificar',
      component: () => import('@/views/verificarEmailView.vue'),
      meta: { titulo: 'Verificar' },
    },
    {
      // Endereço que não existe volta para o início (precisa ser a última rota)
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  // Página privada sem login: vai para o login, guardando para onde a pessoa queria ir
  if (!rotasPublicas.includes(to.name) && !auth.logado) {
    return { name: 'login', query: { voltar: to.fullPath } }
  }

  // Login e cadastro não fazem sentido para quem já entrou
  if (rotasSoParaVisitantes.includes(to.name) && auth.logado) {
    return { name: 'home' }
  }
})

router.afterEach((to) => {
  document.title = to.meta.titulo ? `${to.meta.titulo} | ${NOME_SITE}` : NOME_SITE
})

export {rotasPublicas , rotasSemLayout }
export default router