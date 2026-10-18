# Front-end base (Vue 3)

Projeto inicial enxuto: Vue 3 com rotas, Pinia, Axios e componentes prontos, e só duas páginas simples.
O layout é responsivo (o menu vira um botão no celular).

## Primeiros passos

```bash
npm install
npm run dev
```

Abra o endereço que o terminal mostrar (normalmente http://localhost:5173).
Precisa de Node 22.18+ ou 24.12+ (confira com `node -v`).

## Estrutura

```
src/
  config.js              nome do site e endereço do back-end (troque aqui)
  assets/styles.css      cores, reset e classes responsivas (.container, .grid, .botao)
  components/            AppNavbar (menu responsivo) e AppFooter
  router/index.js        as rotas do site
  services/api.js        Axios pronto para falar com o back-end (envia o token do login)
  stores/auth.js         Pinia: login e logout
  views/                 HomeView (início) e SobreView
```

Rotas: `/` (início) e `/sobre`. Endereços que não existem voltam para o início.

## Receitas rápidas

**Mudar o nome do site:** `src/config.js` (e o `<title>` em `index.html`).

**Mudar as cores:** bloco `:root` no topo de `src/assets/styles.css`.

**Criar uma página nova**
1. Crie `src/views/ProdutosView.vue`.
2. Em `src/router/index.js`, copie uma rota existente e ajuste (antes da última rota).
3. Para aparecer no menu, adicione `{ to: '/produtos', texto: 'Produtos' }` em `links` no `AppNavbar.vue`.

**Falar com o back-end (Axios):** coloque o endereço em `API_URL` no `src/config.js` e use:
```js
import api from '@/services/api'
const { data } = await api.get('/produtos')
```

**Login (Pinia):**
```js
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()

await auth.entrar(email, senha)  // login
auth.sair()                      // logout
auth.logado                      // true ou false
```
Dentro de `src/stores/auth.js`, a rota `/auth/login` e o formato da resposta são exemplos: ajuste conforme o back-end da equipe.

**Outro estado compartilhado:** crie um arquivo novo em `src/stores/` seguindo o modelo do `auth.js`.

## Subir para o GitHub

```bash
git status        # a lista deve ser curta e sem node_modules
git add .
git commit -m "Projeto inicial"
git branch -M main
git remote add origin https://github.com/Hakaton-2026/Front-end.git
git push -u origin main
```

## Publicar o site na Vercel

A Vercel pega o repositório do GitHub, roda `npm run build` e coloca o site no ar num link público.
Depois disso, todo `git push` na branch `main` publica a versão nova sozinho.

1. Entre em vercel.com com a conta do GitHub.
2. **Add New > Project** e escolha o repositório.
3. A Vercel reconhece o Vite sozinha. Clique em **Deploy**.

O `vercel.json` faz o site continuar funcionando quando alguém recarrega a página ou abre direto
`/sobre`. Sem ele, a Vercel responderia 404, porque só existe um `index.html` e as rotas são
desenhadas pelo Vue no navegador.

Atenção: segundo discussões na comunidade da Vercel, o plano gratuito (Hobby) publica repositórios
**públicos** de organização, mas os **privados** exigem o plano Pro. Confira as regras atuais em
vercel.com/docs antes do evento.

Para testar a versão final no seu computador: `npm run build` e depois `npm run preview`.
