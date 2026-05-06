const app = getApp()

Page({
  data: {
    keyword: '',
    inventory: []
  },
  onLoad: async function () {
    await this.loadInventory()
  },
  onShow: async function () {
    await this.loadInventory()
  },
  onSearchInput: function (e) {
    this.setData({ keyword: e.detail.value })
    this.loadInventory()
  },
  loadInventory: async function () {
    try {
      const result = await app.request({ url: `/inventory?page=1&size=20&keyword=${this.data.keyword}` })
      if (result.success) {
        this.setData({ inventory: result.data.inventory })
      }
    } catch (error) {
      console.error('加载库存失败', error)
    }
  }
})