<template>
  <div class="tab-bar-container">
    <router-view />
    <van-tabbar v-model="active" @change="handleChange">
      <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
      <van-tabbar-item icon="orders-o" to="/orders">订单</van-tabbar-item>
      <van-tabbar-item icon="goods-o" to="/inventory">库存</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/profile">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const active = computed(() => {
  const path = route.path
  if (path === '/home') return 0
  if (path === '/orders') return 1
  if (path === '/inventory') return 2
  if (path === '/profile') return 3
  return 0
})

const handleChange = (index) => {
  const paths = ['/home', '/orders', '/inventory', '/profile']
  router.push(paths[index])
}

onMounted(() => {
})
</script>

<style scoped>
.tab-bar-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>