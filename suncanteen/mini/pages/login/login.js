const app = getApp()

Page({
  data: {
    username: '',
    password: ''
  },
  onUsernameInput: function (e) {
    this.setData({ username: e.detail.value })
  },
  onPasswordInput: function (e) {
    this.setData({ password: e.detail.value })
  },
  handleLogin: async function () {
    const { username, password } = this.data
    if (!username || !password) {
      wx.showToast({ title: '请填写用户名和密码', icon: 'none' })
      return
    }
    try {
      const result = await app.request({
        url: '/auth/login',
        method: 'POST',
        data: { username, password }
      })
      if (result.success) {
        app.login(result.data.user, result.data.token)
        wx.showToast({ title: '登录成功', icon: 'success' })
        wx.switchTab({ url: '/pages/home/home' })
      } else {
        wx.showToast({ title: result.message || '登录失败', icon: 'none' })
      }
    } catch (error) {
      wx.showToast({ title: '登录失败', icon: 'none' })
    }
  }
})