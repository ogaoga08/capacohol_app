import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/style.css';
import VCalendar from 'v-calendar'; // v-calendarをインポート
import 'v-calendar/style.css';

const app = createApp(App)

//v-calendarプラグインの登録
app.use(router)
app.use(VCalendar, {})
app.mount('#app')
