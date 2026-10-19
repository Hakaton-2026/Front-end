import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { NOME_SITE } from '@/config'

/*
  Para criar uma página nova:
  1. crie o arquivo em src/views (ex.: ProdutosView.vue)
  2. adicione um item na lista abaixo, antes da última rota
  3. para aparecer no menu, adicione também em `links` no src/components/AppNavbar.vue

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
  path: '/login',
  name: 'login',
  component: () => import('@/views/LoginView.vue'),
  meta: { titulo: 'Login' },
    },
    {
      // Endereço que não existe volta para o início (precisa ser a última rota)
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.afterEach((to) => {
  document.title = to.meta.titulo ? `${to.meta.titulo} | ${NOME_SITE}` : NOME_SITE
})

export default router
