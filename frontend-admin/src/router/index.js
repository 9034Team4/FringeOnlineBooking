// src/router/index.ts (or .js)
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginPage.vue')
  },
  {
    path: '/reg',
    name: 'reg',
    component: () => import('@/views/RegisterPage.vue')
  },
  {
    path: '/',
    component: () => import('@/components/AppLayout.vue'),
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/DashboardPage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'events',
        name: 'events',
        component: () => import('@/views/EventsPage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'event-details/:id',
        name: 'event-details',
        component: () => import('@/views/EventDetailsPage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'msg',
        name: 'msg',
        component: () => import('@/views/MessagesPage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'staff',
        name: 'staff',
        component: () => import('@/views/StaffPage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'seats',
        name: 'seat-management',
        component: () => import('@/views/SeatManagementPage.vue'),
        meta: { requiresAuth: true }
      },
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const isLoggedIn = Boolean(localStorage.getItem('admin-token'))

  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})


export default router
