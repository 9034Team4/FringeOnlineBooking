import { createApp } from 'vue'
import App from './App.jsx'
import router from './router'
import store from './store'
import '@fortawesome/fontawesome-free/css/all.css'

const app = createApp(App)

app.use(router)
app.use(store)
app.mount('#app')
