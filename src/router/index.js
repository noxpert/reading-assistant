import { createRouter, createWebHistory } from 'vue-router'
import TranslatePage from '../views/TranslatePage.vue'
import DatabasePage from '../views/DatabasePage.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: DatabasePage },
    { path: '/translate', component: TranslatePage },
  ],
})
