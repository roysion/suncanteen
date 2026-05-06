import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  {
    path: '/',
    name: 'TabBar',
    component: () => import('../components/TabBar.vue'),
    redirect: '/home',
    children: [
      { path: '/home', name: 'Home', component: () => import('../views/Home.vue') },
      { path: '/orders', name: 'Orders', component: () => import('../views/Orders.vue') },
      { path: '/inventory', name: 'Inventory', component: () => import('../views/Inventory.vue') },
      { path: '/profile', name: 'Profile', component: () => import('../views/Profile.vue') }
    ]
  },
  { path: '/order-detail/:id', name: 'OrderDetail', component: () => import('../views/OrderDetail.vue') },
  { path: '/create-order', name: 'CreateOrder', component: () => import('../views/CreateOrder.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router