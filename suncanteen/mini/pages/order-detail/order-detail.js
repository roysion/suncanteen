const app = getApp()

Page({
  data: {
    order: null,
    items: []
  },
  onLoad: async function (options) {
    const id = options.id
    if (id) {
      await this.loadOrder(id)
    }
  },
  loadOrder: async function (id) {
    try {
      const result = await app.request({ url: `/orders/${id}` })
      if (result.success) {
        this.setData({
          order: result.data.order,
          items: result.data.items
        })
      }
    } catch (error) {
      console.error('加载订单失败', error)
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
  get totalAmount: function () {
    return this.data.items.reduce((sum, item) => sum + (item.amount || 0), 0)
  }
})