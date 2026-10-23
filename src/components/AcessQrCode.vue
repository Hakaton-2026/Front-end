<script setup>
import Qrcode from "qrcode.vue";
import IconClose from "~icons/mdi/close";
import { handleShowValue } from "@/utils/showValue";
import { ref } from "vue";

const websiteUrl = import.meta.env.VITE_WEBSITE_URL || "localhost:5173/";
const showValue = ref(true)

</script>

<template>
  <div class="background-container" v-show="showValue">
    <div class="close-container" @click="showValue = handleShowValue(showValue)">
      <IconClose class="close-icon" />
    </div>
    <div class="qrcode-container">
      <h2 class="qrcode-text">Acesse no celular!</h2>
      <qrcode :value="websiteUrl" level="H" render-as="svg" class="qrcode" />
    </div>
  </div>
</template>

<style scoped>
.background-container {
  background-color: var(--cor-fundo);
  padding: 2vw 2vw 4vw 2vw;
  box-shadow: 0 0 10px 1px var(--cor-borda);
  border-radius: var(--raio);
}

.qrcode-container {
  max-width: 30vw;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.close-container {
  position: relative;
}

.close-icon {
  position: absolute;
  right: 0;
  top: 0;
  font-size: 3vw;
}

.qrcode-text {
  font-size: clamp(1.8rem, 6vw, 3rem);
  margin: 2vw 0;
}

.qrcode {
  width: 100%;
  height: auto;
}
</style>
