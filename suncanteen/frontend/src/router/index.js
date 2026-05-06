import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  {
    path: '/',
    name: 'Layout',
    component: () => import('../components/Layout.vue'),
    redirect: '/dashboard',
    children: [
      { path: '/dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue') },
      { path: '/suppliers', name: 'SupplierList', component: () => import('../views/SupplierList.vue') },
      { path: '/suppliers/add', name: 'SupplierAdd', component: () => import('../views/SupplierAdd.vue') },
      { path: '/suppliers/:id', name: 'SupplierDetail', component: () => import('../views/SupplierDetail.vue') },
      { path: '/products', name: 'ProductList', component: () => import('../views/ProductList.vue') },
      { path: '/products/add', name: 'ProductAdd', component: () => import('../views/ProductAdd.vue') },
      { path: '/orders', name: 'OrderList', component: () => import('../views/OrderList.vue') },
      { path: '/orders/add', name: 'OrderAdd', component: () => import('../views/OrderAdd.vue') },
      { path: '/orders/:id', name: 'OrderDetail', component: () => import('../views/OrderDetail.vue') },
      { path: '/deliveries', name: 'DeliveryList', component: () => import('../views/DeliveryList.vue') },
      { path: '/inspections', name: 'InspectionList', component: () => import('../views/InspectionList.vue') },
      { path: '/inventory', name: 'InventoryList', component: () => import('../views/InventoryList.vue') },
      { path: '/inventory/out', name: 'InventoryOut', component: () => import('../views/InventoryOut.vue') },
      { path: '/returns', name: 'ReturnList', component: () => import('../views/ReturnList.vue') },
      { path: '/returns/add', name: 'ReturnAdd', component: () => import('../views/ReturnAdd.vue') },
      { path: '/settlements', name: 'SettlementList', component: () => import('../views/SettlementList.vue') },
      { path: '/reconciliation', name: 'ReconciliationList', component: () => import('../views/ReconciliationList.vue') },
      { path: '/users', name: 'UserList', component: () => import('../views/UserList.vue') },
      { path: '/users/add', name: 'UserAdd', component: () => import('../views/UserAdd.vue') },
      { path: '/organizations', name: 'OrganizationList', component: () => import('../views/OrganizationList.vue') },
      { path: '/organizations/add', name: 'OrganizationAdd', component: () => import('../views/OrganizationAdd.vue') },
      { path: '/reports/purchase', name: 'PurchaseReport', component: () => import('../views/PurchaseReport.vue') },
      { path: '/reports/inventory', name: 'InventoryReport', component: () => import('../views/InventoryReport.vue') },
      { path: '/reports/analysis', name: 'ReportAnalysis', component: () => import('../views/ReportAnalysis.vue') },
      { path: '/system/settings', name: 'SystemSettings', component: () => import('../views/SystemSettings.vue') },
      { path: '/system/logs', name: 'SystemLogs', component: () => import('../views/SystemLogs.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router