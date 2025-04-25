import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import TingJian from '../views/TingJian.vue'
import Editor from '../views/Editor.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/tingjian',
    name: 'TingJian',
    component: TingJian
  },
  {
    path: '/editor',
    name: 'Editor',
    component: Editor
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 