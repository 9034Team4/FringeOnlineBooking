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
    key: 'AIzaSyAmotJf5VUQkZ2cy4a7W_1-cxIIdIRU-ps',
  },
})
app.mount('#app')
