<template>
  <div class="login-page">
    <div class="logo-section">
      <div class="logo">
        <van-icon name="store-o" size="80" color="#409eff" />
      </div>
      <h1>阳光食堂</h1>
      <p>采购配送进销存一体化平台</p>
    </div>
    <div class="form-section">
      <van-form @submit="handleSubmit">
        <van-field
          v-model="form.username"
          name="username"
          label="用户名"
          placeholder="请输入用户名"
          required
        />
        <van-field
          v-model="form.password"
          type="password"
          name="password"
          label="密码"
          placeholder="请输入密码"
          required
        />
        <div class="form-btn">
          <van-button type="primary" native-type="submit" loading="loading">登录</van-button>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../api'
import { showToast } from 'vant'

const router = useRouter()
const loading = ref(false)

const form = ref({
  username: '',
  password: ''
})

const handleSubmit = async () => {
  if (!form.value.username || !form.value.password) {
    showToast('请填写用户名和密码')
    return
  }
  loading.value = true
  try {
    const response = await auth.login(form.value)
    if (response.success) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      showToast('登录成功')
      router.push('/home')
    } else {
      showToast(response.message || '登录失败')
    }
  } catch (error) {
    showToast('登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #409eff 0%, #67c23a 100%);
  padding: 40px 20px;
}

.logo-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  margin-bottom: 20px;
}

.logo-section h1 {
  color: #fff;
  font-size: 28px;
  margin-bottom: 8px;
}

.logo-section p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.form-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
}

.form-btn {
  margin-top: 20px;
}

.form-btn .van-button {
  width: 100%;
}
</style>