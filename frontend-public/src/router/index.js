import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomePage.vue')
  },
  {
    path: '/events',
    name: 'Events',
    component: () => import('../views/EventList.vue')
  },
  {
    path: '/events/:id',
    name: 'EventDetails',
    component: () => import('../views/EventDetailsPage.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginPage.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/ProfilePage.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterPage.vue')
  },
  {
    path: '/verify-email',
    name: 'VerifyEmail',
    component: () => import('../views/VerifyEmail.vue'),
    props: route => ({ email: route.query.email, token: route.query.token })
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/views/AuthPage.vue')
  },
  {
    path: '/booking-confirmation',
    name: 'BookingConfirmation',
    component: () => import('@/views/BookingConfirmation.vue')
  },
  {
    path: '/ticket',
    name: 'Ticket',
    component: () => import('../views/TicketView.vue')
  },
  {
    path: '/venue',
    name: 'VenueDetails',
    component: () => import('@/views/VenueDetailsPage.vue')
  },
  {
    path: '/events/:eventId/seats',
    name: 'seat-selection',
    component: () => import('@/views/SeatSelectionPage.vue')
  },
  {
    path: '/events/:eventId/payment',
    name: 'payment',
    component: () => import('@/views/PaymentPage.vue')
  },
  {
    path: '/events/:eventId/confirmation',
    name: 'booking-confirmation',
    component: () => import('@/views/BookingConfirmationPage.vue')
  },
  {
    path: '/my-tickets',
    name: 'my-tickets',
    component: () => import('../views/MyTicketsPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/ticket/:id',
    name: 'ticket-details',
    component: () => import('../views/TicketDetailsPage.vue'),
    props: true,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
