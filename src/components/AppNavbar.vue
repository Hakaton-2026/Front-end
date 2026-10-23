
<script setup>
import { ref, computed } from 'vue'
import { NOME_SITE } from '@/config'
import { useAuthStore } from '@/stores/auth'

const menuAberto = ref(false)
const pesquisa = ref('')

const authStore = useAuthStore()

const usuario = computed(() => authStore.user)

const fotoUsuario = computed(
  () => usuario.value?.profile_photo?.url || ''
)

const links = [
  { to: '/', texto: 'Início' },
  { to: '/perfil', texto: 'Perfil' },
  { to: '/sobre', texto: 'Sobre' },
]

function pesquisar() {
  const termo = pesquisa.value.trim()

  if (!termo) return

  // Integre a pesquisa com sua API quando necessário.
  console.log('Pesquisar:', termo)
}
</script>

<template>
  <header class="navbar">
    <div class="barra">

      <!-- Campo de pesquisa -->
      <form class="pesquisa" @submit.prevent="pesquisar">
        <ion-icon name="search-outline"></ion-icon>

        <input
          v-model="pesquisa"
          type="search"
          placeholder="Pesquisar..."
          aria-label="Pesquisar"
        />

        <button
          v-if="pesquisa"
          type="button"
          class="limpar-pesquisa"
          aria-label="Limpar pesquisa"
          @click="pesquisa = ''"
        >
          <ion-icon name="close-circle-outline"></ion-icon>
        </button>
      </form>

      <!-- Notificações, perfil e menu -->
      <div class="acoes">
        <RouterLink
          to="/notificacoes"
          class="botao-icone"
          aria-label="Notificações"
          title="Notificações"
        >
          <ion-icon name="notifications-outline"></ion-icon>
        </RouterLink>

        <RouterLink
          to="/perfil"
          class="perfil-link"
          aria-label="Meu perfil"
          title="Meu perfil"
        >
          <img
            v-if="fotoUsuario"
            :src="fotoUsuario"
            :alt="usuario?.name || 'Foto do usuário'"
            class="foto-usuario"
          />

          <span v-else class="avatar-padrao">
            <ion-icon name="person-outline"></ion-icon>
          </span>
        </RouterLink>

        <button
          class="botao-menu"
          type="button"
          aria-label="Abrir ou fechar o menu"
          :aria-expanded="menuAberto"
          @click="menuAberto = !menuAberto"
        >
          <ion-icon
            :name="menuAberto ? 'close-outline' : 'menu-outline'"
          ></ion-icon>
        </button>
      </div>
    </div>

    <!-- Links responsivos -->
    <nav
      :class="['links', { aberto: menuAberto }]"
      @click="menuAberto = false"
    >
      <RouterLink
        v-for="item in links"
        :key="item.to"
        :to="item.to"
      >
        {{ item.texto }}
      </RouterLink>
    </nav>
  </header>
</template>

<style scoped>
/* Cabeçalho */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: block;
  width: 100%;
  min-width: 0;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}


.barra {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  min-width: 0;
  min-height: 70px;
  padding: 0 1rem;
  box-sizing: border-box;
}

.marca {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 180px;
  overflow: hidden;
  color: var(--cor-primaria);
  font-size: 1.2rem;
  font-weight: 800;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pesquisa {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex: 1 1 0;
  min-width: 0;
  max-width: 280px;
  height: 42px;
  margin: 0 auto;
  padding: 0 0.8rem;
  box-sizing: border-box;
  color: var(--cor-texto);
  background: var(--cor-fundo);
  border: 1px solid var(--cor-borda);
  border-radius: 12px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.pesquisa:focus-within {
  border-color: var(--cor-primaria);
  box-shadow: 0 0 0 3px
    color-mix(in srgb, var(--cor-primaria) 15%, transparent);
}

.barra {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  min-width: 0;
  min-height: 70px;
  padding: 0 1rem;
  box-sizing: border-box;
}

.marca {
  flex: 0 0 auto;
  max-width: 180px;
  overflow: hidden;
  color: var(--cor-primaria);
  font-size: 1.2rem;
  font-weight: 800;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pesquisa {
  display: flex;

  gap: 1rem;
  flex: 0 1 400px;

  height: 48px;
  margin: 0 0 0 auto;
  padding: 0 0.8rem;

  color: var(--cor-texto);
  background: var(--cor-fundo);
  border: 1px solid var(--cor-borda);
  border-radius: 12px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.pesquisa:focus-within {
  border-color: var(--cor-primaria);
  box-shadow: 0 0 0 3px
    color-mix(in srgb, var(--cor-primaria) 15%, transparent);
}

.pesquisa > ion-icon {
  flex-shrink: 0;
  font-size: 1.2rem;
  opacity: 0.7;
}

.pesquisa input {
  flex: 1 ;
  width: 100%;
  min-width: 0;
  padding: 0;
  border: none;
  outline: none;
  color: var(--cor-texto);
  background: transparent;
  font: inherit;
}

.acoes {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  flex: 0 0 auto;
}

.botao-icone,
.perfil-link {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  text-decoration: none;
}

.botao-icone {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  color: var(--cor-texto);
  font-size: 1.5rem;
  transition: background 0.2s, color 0.2s;
}

.botao-icone:hover {
  color: var(--cor-primaria);
  background: var(--cor-fundo);
}

.perfil-link {
  width: 40px;
  height: 40px;
  overflow: hidden;
  box-sizing: border-box;
  border: 2px solid var(--cor-borda);
  border-radius: 50%;
  background: var(--cor-fundo);
  transition: border-color 0.2s;
}

.perfil-link:hover {
  border-color: var(--cor-primaria);
}

.foto-usuario {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-padrao {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--cor-texto);
  font-size: 1.4rem;
}

.botao-menu {
  display: none;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0.4rem;
  border: none;
  color: var(--cor-texto);
  background: transparent;
  font-size: 1.7rem;
  cursor: pointer;
}

.links {
  display: none;
  align-items: center;
  gap: 1.25rem;
  padding: 0 1rem 1rem;
}

.links a {
  color: var(--cor-texto);
  text-decoration: none;
}

.links a.router-link-exact-active {
  color: var(--cor-primaria);
  font-weight: 600;
}

@media (max-width: 720px) {
  .barra {
    min-height: 64px;
    gap: 0.5rem;
    padding: 0 0.65rem;
  }

  .marca {
    max-width: 100px;
    font-size: 1rem;
  }

  .pesquisa {
    height: 40px;
    gap: 0.35rem;
    padding: 0 0.5rem;
  }

  .acoes {
    gap: 0.25rem;
  }

  .botao-icone {
    width: 32px;
    height: 36px;
    font-size: 1.3rem;
  }

  .perfil-link {
    width: 32px;
    height: 32px;
  }

  .botao-menu {
    display: flex;
  }

  .links {
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    padding: 0.5rem 1rem;
    border-top: 1px solid var(--cor-borda);
    background: var(--cor-superficie);
  }

  .links.aberto {
    display: flex;
  }

  .links a {
    padding: 0.9rem 0;
  }
}

@media (max-width: 420px) {
  .barra {
    gap: 0.35rem;
    padding: 0 0.4rem;
  }

  .marca {
    max-width: 75px;
    font-size: 0.9rem;
  }

  .pesquisa {
    gap: 0.25rem;
    padding: 0 0.4rem;
  }

  .acoes {
    gap: 0.15rem;
  }

  .botao-icone {
    width: 28px;
  }

  .perfil-link {
    width: 28px;
    height: 28px;
  }

  .botao-menu {
    padding: 0.15rem;
    font-size: 1.4rem;
  }
}

</style>
