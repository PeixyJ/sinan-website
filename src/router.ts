import {createWebHistory, createRouter} from 'vue-router'

import Dashboard from '@/pages/dashboard/index.vue'
import Login from '@/pages/login/index.vue'

const routes = [
    {path: '/auth', component: Login},
    {path: '/dashboard', component: Dashboard},
]

export const router = createRouter({
    history: createWebHistory(),
    routes,
})