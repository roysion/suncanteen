import axios from 'axios'

const instance = axios.create({
  baseURL: '/api',
  timeout: 10000
})

instance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const auth = {
  login: (data) => instance.post('/auth/login', data),
  logout: () => instance.post('/auth/logout'),
  getUserInfo: () => instance.get('/auth/user/info')
}

export const supplier = {
  register: (data) => instance.post('/suppliers/register', data),
  list: (params) => instance.get('/suppliers', { params }),
  get: (id) => instance.get(`/suppliers/${id}`),
  approve: (id, data) => instance.put(`/suppliers/${id}/approve`, data),
  reject: (id, data) => instance.put(`/suppliers/${id}/reject`, data),
  updateStatus: (id, data) => instance.put(`/suppliers/${id}/status`, data),
  update: (id, data) => instance.put(`/suppliers/${id}`, data),
  delete: (id) => instance.delete(`/suppliers/${id}`)
}

export const product = {
  create: (data) => instance.post('/products', data),
  list: (params) => instance.get('/products', { params }),
  get: (id) => instance.get(`/products/${id}`),
  update: (id, data) => instance.put(`/products/${id}`, data),
  delete: (id) => instance.delete(`/products/${id}`),
  listCategories: () => instance.get('/products/categories'),
  createCategory: (data) => instance.post('/products/categories', data)
}

export const order = {
  create: (data) => instance.post('/orders', data),
  submit: (id) => instance.put(`/orders/${id}/submit`),
  confirm: (id) => instance.put(`/orders/${id}/confirm`),
  reject: (id, data) => instance.put(`/orders/${id}/reject`, data),
  list: (params) => instance.get('/orders', { params }),
  get: (id) => instance.get(`/orders/${id}`),
  update: (id, data) => instance.put(`/orders/${id}`, data)
}

export const delivery = {
  create: (data) => instance.post('/deliveries', data),
  list: (params) => instance.get('/deliveries', { params }),
  get: (id) => instance.get(`/deliveries/${id}`),
  sign: (id) => instance.put(`/deliveries/${id}/sign`)
}

export const inspection = {
  create: (data) => instance.post('/inspections', data),
  list: (params) => instance.get('/inspections', { params }),
  get: (id) => instance.get(`/inspections/${id}`)
}

export const inventory = {
  list: (params) => instance.get('/inventory', { params }),
  get: (id) => instance.get(`/inventory/${id}`),
  createOut: (data) => instance.post('/inventory/out', data),
  check: (data) => instance.post('/inventory/check', data),
  listOut: (params) => instance.get('/inventory/records/out', { params })
}

export const returnApi = {
  create: (data) => instance.post('/returns', data),
  approve: (id) => instance.put(`/returns/${id}/approve`),
  reject: (id, data) => instance.put(`/returns/${id}/reject`, data),
  complete: (id) => instance.put(`/returns/${id}/complete`),
  list: (params) => instance.get('/returns', { params }),
  get: (id) => instance.get(`/returns/${id}`)
}

export const settlement = {
  createMonthly: (data) => instance.post('/settlements/monthly', data),
  confirm: (id) => instance.put(`/settlements/${id}/confirm`),
  list: (params) => instance.get('/settlements', { params }),
  get: (id) => instance.get(`/settlements/${id}`)
}

export const user = {
  create: (data) => instance.post('/users', data),
  list: (params) => instance.get('/users', { params }),
  get: (id) => instance.get(`/users/${id}`),
  update: (id, data) => instance.put(`/users/${id}`, data),
  updatePassword: (id, data) => instance.put(`/users/${id}/password`, data),
  delete: (id) => instance.delete(`/users/${id}`),
  listRoles: () => instance.get('/users/roles')
}

export const organization = {
  create: (data) => instance.post('/organizations', data),
  list: (params) => instance.get('/organizations', { params }),
  get: (id) => instance.get(`/organizations/${id}`),
  update: (id, data) => instance.put(`/organizations/${id}`, data),
  delete: (id) => instance.delete(`/organizations/${id}`)
}

export const report = {
  purchaseAnalysis: (params) => instance.get('/reports/purchase', { params }),
  inventoryAnalysis: () => instance.get('/reports/inventory'),
  dashboard: () => instance.get('/reports/dashboard'),
  purchase: (params) => instance.get('/reports/purchase/detail', { params }),
  exportPurchase: (params) => instance.get('/reports/purchase/export', { params }),
  inventory: (params) => instance.get('/reports/inventory/detail', { params }),
  exportInventory: (params) => instance.get('/reports/inventory/export', { params }),
  getSuppliers: () => instance.get('/reports/suppliers'),
  getWarehouses: () => instance.get('/reports/warehouses')
}

export const system = {
  getSettings: () => instance.get('/system/settings'),
  updateSettings: (data) => instance.put('/system/settings', data),
  getLogs: (params) => instance.get('/system/logs', { params })
}