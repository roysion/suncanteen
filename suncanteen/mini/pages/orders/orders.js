const app = getApp()

Page({
  data: {
    activeTab: 0,
    allOrders: []
  },
  onLoad: async function () {
    await this.loadOrders()
  },
  onShow: async function () {
    await this.loadOrders()
  },
  loadOrders: async function () {
    try {
      const result = await app.request({ url: '/orders?page=1&size=20' })
      if (result.success) {
        this.setData({ allOrders: result.data.orders })
      }
    } catch (error) {
      console.error('加载订单失败', error)
    }
  },
  get filteredOrders: function () {
    if (this.data.activeTab === 0) return this.data.allOrders
    if (this.data.activeTab === 1) return this.data.allOrders.filter(o => ['submitted', 'confirmed', 'delivering', 'delivered'].includes(o.status))
    if (this.data.activeTab === 2) return this.data.allOrders.filter(o => o.status === 'completed')
    return this.data.allOrders
  },
  setActiveTab: function (e) {
    const tab = parseInt(e.currentTarget.dataset.tab)
    this.setData({ activeTab: tab })
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
  goToDetail: function (e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${id}` })
  }
})