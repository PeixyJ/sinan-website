import {createWebHistory, createRouter} from 'vue-router'

import Dashboard from '@/pages/dashboard/index.vue'
import Login from '@/pages/login/index.vue'

const routes = [
    {path: '/auth', component: Login},
    {
        path: '/',
        component: Dashboard,
        children: [
            {
                path: '',
                redirect: '/dashboard'
            },
            {
                path: 'dashboard',
                name: 'dashboard',
                component: () => import('@/pages/dashboard/views/Home.vue')
            },
            {
                path: 'inbox',
                name: 'inbox',
                component: () => import('@/pages/dashboard/views/Inbox.vue')
            },
            {
                path: 'bookmarks',
                name: 'bookmarks',
                component: () => import('@/pages/dashboard/views/Bookmarks.vue')
            },
            {
                path: 'space/:id',
                name: 'space',
                component: () => import('@/pages/dashboard/views/Space.vue')
            },
            {
                path: 'tag/:id',
                name: 'tag',
                component: () => import('@/pages/dashboard/views/Tag.vue')
            }
        ]
    },
]

export const router = createRouter({
    history: createWebHistory(),
    routes,
})