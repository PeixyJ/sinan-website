import {createWebHistory, createRouter} from 'vue-router'

import Dashboard from '@/pages/dashboard/index.vue'
import Login from '@/pages/login/index.vue'
import GithubCallback from '@/pages/github-callback/index.vue'
import CollectionSpace from '@/views/CollectionSpace.vue'

const routes = [
    {path: '/auth', component: Login},
    {path: '/github-callback', component: GithubCallback},
    {path: '/collection/space/:id', component: CollectionSpace},
    {path: '/test-favicon', component: () => import('@/pages/test-favicon.vue')},
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