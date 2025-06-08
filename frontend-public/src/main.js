import { createApp } from 'vue'
import App from './App.jsx'
import router from './router'
import store from './store'
import VueGoogleMaps from '@fawmi/vue-google-maps'
import { createPinia } from 'pinia'

const app = createApp(App)
const pinia = createPinia()

app.use(router)
app.use(store)
app.use(pinia)
app.use(VueGoogleMaps, {
  load: {
    key: 'AIzaSyC69mW6F039vRbkfhDl2SQ1cUod86UCU4s',
  },
})
app.mount('#app')
