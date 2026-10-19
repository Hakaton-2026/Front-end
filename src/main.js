import './assets/styles.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { temaPlugin } from './plugin/tema.js'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(temaPlugin)
app.mount('#app')
