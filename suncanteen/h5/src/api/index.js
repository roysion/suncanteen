import axios from 'axios'

const instance = axios.create({
  baseURL: '/api',
  timeout: 10000
})

instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, error => {
  return Promise.reject(error)
})

instance.interceptors.response.use(response => {
  return response.data
}, error => {
  if (error.response?.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }
  return Promise.reject(error)
})

export const auth = {
  login: (data) => instance.post('/auth/login', data),
  logout: () => instance.post('/auth/logout')
}

export const order = {
  list: (params) => instance.get('/orders', { params }),
  get: (id) => instance.get(`/orders/${id}`),
  create: (data) => instance.post('/orders', data)
}

export const inventory = {
  list: (params) => instance.get('/inventory', { params })
}

export const supplier = {
  list: (params) => instance.get('/suppliers', { params })
}

export const product = {
  list: (params) => instance.get('/products', { params })
}