const app = getApp()

Page({
  data: {
    pendingOrders: 0,
    lowStockCount: 0,
    recentOrders: []
  },
  onLoad: async function () {
    await this.loadData()
  },
  onShow: async function () {
    await this.loadData()
  },
  loadData: async function () {
    try {
      const [orderRes, inventoryRes] = await Promise.all([
        app.request({ url: '/orders?page=1&size=5' }),
        app.request({ url: '/inventory?page=1&size=10' })
      ])
      if (orderRes.success) {
        this.setData({
          recentOrders: orderRes.data.orders,
          pendingOrders: orderRes.data.orders.filter(o => ['submitted', 'confirmed', 'delivering'].includes(o.status)).length
        })
      }
      if (inventoryRes.success) {
        this.setData({
          lowStockCount: inventoryRes.data.inventory.filter(i => i.quantity < 100).length
        })
      }
    } catch (error) {
      console.error('加载数据失败', error)
    }
  },
  getStatusLabel: function (status) {
    const labels = {
      draft: '草稿',
      submitted: '已提交',
      confirmed: '已确认',
      delivering: '配送中',
      delivered: '已送达',
      inspected: '已验收',
      completed: '已完成',
      cancelled: '已取消'
    }
    return labels[status] || status
  },
  getStatusClass: function (status) {
    const classes = {
      draft: 'status-default',
      submitted: 'status-warning',
      confirmed: 'status-primary',
      delivering: 'status-success',
      delivered: 'status-success',
      inspected: 'status-success',
      completed: 'status-success',
      cancelled: 'status-danger'
    }
    return classes[status] || 'status-default'
  },
  goToOrders: function () {
    wx.switchTab({ url: '/pages/orders/orders' })
  },
  goToInventory: function () {
    wx.switchTab({ url: '/pages/inventory/inventory' })
  },
  goToCreateOrder: function () {
    wx.navigateTo({ url: '/pages/create-order/create-order' })
  },
  goToOrderDetail: function (e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${id}` })
  }
})