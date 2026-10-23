<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const sidebarNotasAberta = ref(false)

function alternarSidebarNotas() {
  sidebarNotasAberta.value = !sidebarNotasAberta.value
}

function fecharSidebarNotas() {
  sidebarNotasAberta.value = false
}
defineProps({
  menuAberto: {
    type: Boolean,
    default: false,
  },
  // Em Notas o botão aparece também no computador.
  menuSempreVisivel: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['alternar-menu'])

const pesquisa = ref('')

const authStore = useAuthStore()

const usuario = computed(() => authStore.user)

const fotoUsuario = computed(
  () => usuario.value?.profile_photo?.url || ''
)

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

      <!-- Abre/fecha a sidebar -->
 


      <button
        type="button"
        class="botao-icone botao-menu"
        :class="{ 'sempre-visivel': menuSempreVisivel }"
        :aria-label="menuAberto ? 'Fechar menu' : 'Abrir menu'"
        :aria-expanded="menuAberto"
        @click="emit('alternar-menu')"
      >
        <ion-icon
          :name="menuAberto ? 'close-outline' : 'menu-outline'"
        ></ion-icon>
      </button>

     
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

      <!-- Notificações e perfil -->
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
      </div>
    </div>
  </header>
</template>

<style scoped>
/* ==========================================================================
   1. Cabeçalho e Estrutura Principal (Navbar)
   ========================================================================== */
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

/* ==========================================================================
   2. Campo de Pesquisa (Input) - AUMENTADO
   ========================================================================== */
.pesquisa {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 0 1 380px;      /* Aumentado de 280px para 380px (Largura) */
  min-width: 120px;
  height: 46px;         /* Aumentado de 42px para 46px (Altura) */
  margin: 0 0 0 auto;
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
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--cor-primaria) 15%, transparent);
}

.pesquisa > ion-icon {
  flex-shrink: 0;
  font-size: 1.2rem;
  opacity: 0.7;
}

.pesquisa input {
  flex: 1;
  width: 100%;
  min-width: 0;
  padding: 0;
  border: none;
  outline: none;
  color: var(--cor-texto);
  background: transparent;
  font: inherit;
}

/* ==========================================================================
   3. Bloco de Ações (Notificação e Perfil) - AUMENTADO
   ========================================================================== */
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

/* Sino de Notificação */
.botao-icone {
  width: 44px;           /* Aumentado de 40px para 44px */
  height: 44px;          /* Aumentado de 40px para 44px */
  border-radius: 12px;
  color: var(--cor-texto);
  font-size: 1.6rem;     /* Ícone aumentado de 1.5rem para 1.6rem */
  transition: background 0.2s, color 0.2s;
}

.botao-icone:hover {
  color: var(--cor-primaria);
  background: var(--cor-fundo);
}

/* Botão de início fica colorido quando você já está na página inicial */
.botao-inicio.router-link-exact-active {
  color: var(--cor-primaria);
}

/* Botão que abre a sidebar */
.botao-menu {
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

/* Escondido no computador, exceto na página de Notas */
.botao-menu:not(.sempre-visivel) {
  display: none;
}

@media (max-width: 768px) {
  .botao-menu:not(.sempre-visivel) {
    display: flex;
  }
}

/* Link/Círculo do Perfil */
.perfil-link {
  width: 44px;           /* Aumentado de 40px para 44px */
  height: 44px;          /* Aumentado de 40px para 44px */
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

/* Ícone de Boneco (Fallback do Perfil) */
.avatar-padrao {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--cor-texto);
  font-size: 1.5rem;     /* Ícone aumentado de 1.4rem para 1.5rem */
}

/* ==========================================================================
   4. Responsividade - Tablets e Telas Médias (max-width: 720px)
   ========================================================================== */
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
    width: 34px;
    height: 36px;
    font-size: 1.3rem;
  }

  .perfil-link {
    width: 34px;
    height: 34px;
  }
}

/* ==========================================================================
   5. Responsividade - Smartphones (max-width: 420px)
   ========================================================================== */
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
    width: 30px;
  }

  .perfil-link {
    width: 40px;
    height: 40px;
  }
    
}
</style>