<script setup>
import { useToastStore } from "@/stores/toast";
const toastStore = useToastStore();

// Exemplo de uso do Toast no template

// import { useToastStore } from '@/stores/toast'
// const useToast = useToastStore()
// function handleClick(){
//   return useToast.showToast('Abriu aqui')
// }

</script>
<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="toast"
        :class="'toast-' + toast.type"
      >
        {{ toast.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* ===== Toast ===== */
.toast-container {
  position: fixed;
  top: 72px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 99;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(500px, calc(100vw - 24px));
}

.toast {
  padding: 12px 20px;
  border-radius: var(--raio);
  font-size: 0.875rem;
  font-weight: 500;
  
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.toast-success { background: var(--cor-sucesso); color: var(--cor-sucesso-texto); }
.toast-error { background: var(--cor-erro); color: var(--cor-erro-texto); }


.toast-enter-active {
  animation: toast-in 0.2s ease-out;
}

.toast-leave-active {
  animation: toast-out 0.2s ease-in;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes toast-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-8px);
  }
}

</style>
