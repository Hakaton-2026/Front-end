<script setup>
const props = defineProps({
    mensagem:{
        type:String,
        default:''
    },
    tipo:{
        type: String,
        default:'sucesso' 
    },
    mostrar:{
        type: Boolean, 
        default: false
    }
})

</script>
<template>
<div
v-if="mostrar"
:class="['toast', tipo]"><span class="msg"> {{ mensagem }}
    <button class="fechar-toast" ></button>
</span></div>
</template>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);

  width: 300px;
  min-height: 60px;
  padding: 0 10px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 18px;
  color: #000;
  background: #fff;
  border: 2px solid #FF5700;

  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
  z-index: 9999;
  user-select: none;

  animation:
    descer 0.5s ease-out forwards,
    movi 1s ease-in-out infinite 0.5s;
}

.toast.erro {
  background-color: #dc3545;
  color: #fff;
  border: 1px solid #dc3545;
}

.fechar-toast {
  background: transparent;
  border: none;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  margin-left: 15px;
  color: inherit;
}

@keyframes descer {
  0% {
    top: -120px;
    opacity: 0;
  }
  100% {
    top: 20px;
    opacity: 1;
  }
}

@keyframes movi {
  0% {
    transform: translateX(-50%) scale(1);
  }
  50% {
    transform: translateX(-50%) scale(.95);
  }
  100% {
    transform: translateX(-50%) scale(1);
  }}
</style>