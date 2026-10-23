
<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  aberto: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['fechar'])

const authStore = useAuthStore()
const router = useRouter()

const perfilAberto = ref(false)

const usuario = computed(() => authStore.user)

function alternarPerfil() {
  perfilAberto.value = !perfilAberto.value
}

function fecharMenu() {
  perfilAberto.value = false
  emit('fechar')
}

function abrirPerfil() {
  fecharMenu()
  router.push('/perfil')
}

async function sair() {
  perfilAberto.value = false
  authStore.logout()
  emit('fechar')
  await router.replace({ name: 'login' })
}
</script>

<template>
    <aside :class="['sidebar', { open: props.aberto }]">
<img
  src="/images/nexos-br.png"
  class="logo-sidebar"
  alt="Logo Nexos"
>    <!-- Navegação -->
    <ul class="sidebar-menu">
      <li>
        <RouterLink
          to="/projetoandamento"
          class="sidebar-link"
          @click="fecharMenu"
        >
          <ion-icon name="home-outline" />
          <span>Início</span>
        </RouterLink>
      </li>

      <li>
        <RouterLink
          to="/projetos"
          class="sidebar-link"
          @click="fecharMenu"
        >
          <ion-icon name="folder-outline" />
          <span>Projetos</span>
        </RouterLink>
      </li>

      <li>
        <RouterLink
          to="/Kanban"
          class="sidebar-link"
          @click="fecharMenu"
        >
          <ion-icon name="chatbubbles-outline" />
          <span>Meu Kanban</span>
        </RouterLink>
      </li>

      <li>
        <RouterLink
          to="/notas"
          class="sidebar-link"
          @click="fecharMenu"
        >
          <ion-icon name="book-outline" />
          <span>Notas</span>
        </RouterLink>
      </li>

      <li>
        <RouterLink
          to="/documentos"
          class="sidebar-link"
          @click="fecharMenu"
        >
          <ion-icon name="document-text-outline" />
          <span>Documentos</span>
        </RouterLink>
      </li>

      <li>
        <RouterLink
          to="/sobre"
          class="sidebar-link"
          @click="fecharMenu"
        >
          <ion-icon name="information-circle-outline" />
          <span>Sobre</span>
        </RouterLink>
      </li>
    </ul>

    <!-- Perfil do usuário no final da sidebar -->
    <div class="perfil-container">
      <!-- Painel que abre para cima -->
      <Transition name="perfil">
        <div
          v-if="perfilAberto"
          class="perfil-dropdown"
        >
          <div class="dropdown-titulo">
            <span>Conta conectada</span>
          </div>

          <div class="conta-atual">
            <div class="foto-conta">
              <img
                v-if="usuario?.profile_photo?.url"
                :src="usuario.profile_photo.url"
                alt="Foto do usuário"
              />

              <ion-icon
                v-else
                name="person-outline"
              />
            </div>

            <div class="conta-dados">
              <strong>
                {{ usuario?.name || 'Seu nome' }}
              </strong>

              <span>
                {{ usuario?.email || 'Seu e-mail' }}
              </span>
            </div>

            <ion-icon
              class="conta-confirmada"
              name="checkmark-circle"
            />
          </div>

          <div class="dropdown-divisor"></div>

          <button
            type="button"
            class="dropdown-link"
            @click="abrirPerfil"
          >
            <ion-icon name="person-circle-outline" />
            <span>Meu perfil</span>
          </button>

          <button
            type="button"
            class="dropdown-link sair-link"
            @click="sair"
          >
            <ion-icon name="log-out-outline" />
            <span>Sair da conta</span>
          </button>
        </div>
      </Transition>

      <!-- Botão com foto, nome, e-mail e seta -->
      <button
        type="button"
        class="perfil-botao"
        :aria-expanded="perfilAberto"
        aria-label="Abrir opções da conta"
        @click="alternarPerfil"
      >
        <div class="perfil-foto">
          <img
            v-if="usuario?.profile_photo?.url"
            :src="usuario.profile_photo.url"
            alt="Foto do perfil"
          />

          <ion-icon
            v-else
            name="person-outline"
          />
        </div>

        <div class="perfil-dados">
          <strong>
            {{ usuario?.name || 'Seu nome' }}
          </strong>

          <span>
            {{ usuario?.email || 'Seu e-mail' }}
          </span>
        </div>

        <ion-icon
          class="perfil-seta"
          :name="perfilAberto
            ? 'chevron-up-outline'
            : 'chevron-down-outline'"
        />
      </button>
    </div>
  </aside>

  <!-- Fundo escuro no celular -->
  <div
    v-if="props.aberto"
    class="sidebar-fundo"
    @click="fecharMenu"
  />
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;

  width: var(--largura-sidebar, 260px);
  height: 100vh;
  box-sizing: border-box;
  padding: 80px 12px 12px;

  display: flex;
  flex-direction: column;

  overflow-y: auto;

  background: var(--cor-lateral);
  border-right: 1px solid var(--cor-borda);
  border-radius: 0 5px 5px 0;
}

.sidebar-menu {
  width: 100%;
  padding: 0;
  margin: 0;
  list-style: none;
}

.sidebar-menu li {
  width: 100%;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 10px;

  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  margin-bottom: 12px;

  color: #fff;
  text-decoration: none;
  border-radius: 8px;

  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.sidebar-link ion-icon {
  flex-shrink: 0;
  font-size: 22px;
  color: inherit;
}

.sidebar-link:hover,
.sidebar-link.router-link-active {
  background: #a0e4ff;
  color: #000;
}

/* Área do perfil no final */
.perfil-container {
  position: relative;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--cor-borda);
}

/* Botão do perfil */
.perfil-botao {
  display: flex;
  align-items: center;
  gap: 10px;

  width: 100%;
  min-width: 0;
  padding: 10px 6px;

  color: var(--cor-texto);
  background: transparent;
  border: 0;
  border-radius: 10px;
  text-align: left;
  cursor: pointer;

  transition: background-color 0.2s ease;
}

.perfil-botao:hover {
  background: var(--cor-superficie-hover);
}.logo-sidebar {
  display: block;
  width: 200px;
  max-width: 100%;
  height: auto;
  object-fit: contain;
  margin: -40px auto 40px;
}
.perfil-foto,
.foto-conta {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  width: 42px;
  height: 42px;
  overflow: hidden;

  color: #fff;
  background: #424242;
  border-radius: 50%;
}

.perfil-foto img,
.foto-conta img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.perfil-foto ion-icon,
.foto-conta ion-icon {
  font-size: 24px;
}

.perfil-dados,
.conta-dados {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: 4px;
}

.perfil-dados strong,
.conta-dados strong {
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.perfil-dados span,
.conta-dados span {
  overflow: hidden;
  color: var(--cor-texto-suave);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.perfil-seta {
  flex-shrink: 0;
  font-size: 18px;
  color: var(--cor-texto-suave);
}

/* Painel que abre acima do perfil */
.perfil-dropdown {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 0;

  width: 100%;
  box-sizing: border-box;
  padding: 12px;

  color: var(--cor-texto);
  background: var(--cor-superficie);
  border: 1px solid var(--cor-borda);
  border-radius: 12px;
  box-shadow: 0 8px 28px rgb(0 0 0 / 20%);
  z-index: 1002;
}

.dropdown-titulo {
  padding: 2px 4px 12px;
  color: var(--cor-texto-suave);
  font-size: 12px;
}

.conta-atual {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.foto-conta {
  width: 34px;
  height: 34px;
}

.foto-conta ion-icon {
  font-size: 20px;
}

.conta-dados strong {
  font-size: 12px;
}

.conta-dados span {
  font-size: 10px;
}

.conta-confirmada {
  flex-shrink: 0;
  color: #22c55e;
  font-size: 18px;
}

.dropdown-divisor {
  height: 1px;
  margin: 12px 0;
  background: var(--cor-borda);
}

.dropdown-link {
  display: flex;
  align-items: center;
  gap: 10px;

  width: 100%;
  padding: 10px 8px;

  color: var(--cor-texto);
  background: transparent;
  border: 0;
  border-radius: 8px;
  text-align: left;
  font-size: 13px;
  cursor: pointer;
}

.dropdown-link ion-icon {
  font-size: 19px;
}

.dropdown-link:hover {
  background: var(--cor-superficie-hover);
}

.sair-link {
  color: #ef4444;
}

/* Animação do painel */
.perfil-enter-active,
.perfil-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.perfil-enter-from,
.perfil-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* Celular */
.sidebar-fundo {
  display: none;
}

@media (max-width: 768px) {
  .sidebar {
    width: min(var(--largura-sidebar, 260px), 85vw);
    padding-top: 70px;

    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .sidebar-fundo {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 999;
    background: rgb(0 0 0 / 45%);
  }
}
</style>
