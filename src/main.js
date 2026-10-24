import '@/assets/styles.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { temaPlugin } from './plugin/tema.js'
import VLibras from '@vue-a11y/vlibras'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(temaPlugin)
app.use(VLibras)

router.isReady().then(() => app.mount('#app'))
