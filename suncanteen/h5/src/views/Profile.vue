<template>
  <div class="page-container">
    <van-nav-bar title="我的" />
    <div class="user-info">
      <van-icon name="user-circle-o" size="80" />
      <div class="info">
        <h3>{{ userInfo.real_name }}</h3>
        <p>{{ userInfo.username }}</p>
      </div>
    </div>
    <van-cell-group>
      <van-cell title="修改密码" is-link @click="goToChangePassword">
        <template #right-icon>
          <van-icon name="arrow-right" />
        </template>
      </van-cell>
      <van-cell title="关于系统" is-link @click="goToAbout">
        <template #right-icon>
          <van-icon name="arrow-right" />
        </template>
      </van-cell>
    </van-cell-group>
    <van-button type="danger" block @click="handleLogout">退出登录</van-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../api'
import { showToast } from 'vant'

const router = useRouter()
const userInfo = ref(JSON.parse(localStorage.getItem('user') || '{}'))

const handleLogout = async () => {
  try {
    await auth.logout()
  } finally {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    showToast('已退出登录')
    router.push('/login')
  }
}

const goToChangePassword = () => {
  showToast('功能开发中')
}

const goToAbout = () => {
  showToast('阳光食堂 v1.0.0')
}
</script>

<style scoped>
.user-info {
  display: flex;
  align-items: center;
  padding: 20px;
  background: linear-gradient(180deg, #409eff 0%, #67c23a 100%);
  color: #fff;
  margin: -16px -16px 16px -16px;
  border-radius: 0 0 16px 16px;
}

.user-info .van-icon {
  margin-right: 16px;
}

.info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
}

.info p {
  margin: 0;
  font-size: 14px;
  opacity: 0.8;
}
</style>