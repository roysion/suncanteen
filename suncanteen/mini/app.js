App({
  onLaunch: function () {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.navigateTo({ url: '/pages/login/login' })
    }
  },
  globalData: {
    user: null,
    token: ''
  },
  login: function (user, token) {
    this.globalData.user = user
    this.globalData.token = token
    wx.setStorageSync('token', token)
    wx.setStorageSync('user', JSON.stringify(user))
  },
  logout: function () {
    this.globalData.user = null
    this.globalData.token = ''
    wx.removeStorageSync('token')
    wx.removeStorageSync('user')
  },
  request: function (options) {
    const token = wx.getStorageSync('token')
    const header = options.header || {}
    if (token) {
      header.Authorization = `Bearer ${token}`
    }
    return new Promise((resolve, reject) => {
      wx.request({
        ...options,
        header,
        url: 'http://localhost:3000/api' + options.url,
        success: (res) => {
          if (res.statusCode === 401) {
            this.logout()
            wx.navigateTo({ url: '/pages/login/login' })
            reject(res)
          } else {
            resolve(res.data)
          }
        },
        fail: reject
      })
    })
  }
})