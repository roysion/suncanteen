const app = getApp()

Page({
  data: {
    user: {}
  },
  onLoad: function () {
    const userStr = wx.getStorageSync('user')
    if (userStr) {
      this.setData({ user: JSON.parse(userStr) })
    }
  },
  goToChangePassword: function () {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },
  goToAbout: function () {
    wx.showToast({ title: '阳光食堂 v1.0.0', icon: 'none' })
  },
  handleLogout: async function () {
    try {
      await app.request({ url: '/auth/logout', method: 'POST' })
    } finally {
      app.logout()
      wx.showToast({ title: '已退出登录', icon: 'success' })
      wx.navigateTo({ url: '/pages/login/login' })
    }
  }
})