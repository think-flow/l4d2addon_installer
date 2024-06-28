import { createWebHashHistory, createRouter, RouteRecordRaw } from 'vue-router'

import Main from './windows/main.vue'
import About from './windows/about.vue'

const routes: RouteRecordRaw[] = [
    { path: '/', component: Main },
    { path: '/about', component: About },
]

export const router = createRouter({
    history: createWebHashHistory(),
    routes,
})
