<template>
  <div class="page-container">
    <van-nav-bar title="订单管理" />
    <van-tabs v-model="activeTab" @change="handleTabChange">
      <van-tab title="全部">
        <van-list v-model="loading" :finished="finished" finished-text="没有更多了" @load="loadMore">
          <van-cell
            v-for="order in allOrders"
            :key="order.id"
            :title="order.order_no"
            :value="`¥${order.total_amount.toFixed(2)}`"
            is-link
            @click="goToDetail(order.id)"
          >
            <template #right-icon>
              <van-tag :type="getStatusType(order.status)">{{ getStatusLabel(order.status) }}</van-tag>
            </template>
            <template #footer>
              <span>{{ order.supplier_name }}</span>
              <span>{{ order.created_at }}</span>
            </template>
          </van-cell>
        </van-list>
      </van-tab>
      <van-tab title="待处理">
        <van-list v-model="loading" :finished="finished" finished-text="没有更多了" @load="loadMore">
          <van-cell
            v-for="order in pendingOrders"
            :key="order.id"
            :title="order.order_no"
            :value="`¥${order.total_amount.toFixed(2)}`"
            is-link
            @click="goToDetail(order.id)"
          >
            <template #right-icon>
              <van-tag type="warning">{{ getStatusLabel(order.status) }}</van-tag>
            </template>
          </van-cell>
        </van-list>
      </van-tab>
      <van-tab title="已完成">
        <van-list v-model="loading" :finished="finished" finished-text="没有更多了" @load="loadMore">
          <van-cell
            v-for="order in completedOrders"
            :key="order.id"
            :title="order.order_no"
            :value="`¥${order.total_amount.toFixed(2)}`"
            is-link
            @click="goToDetail(order.id)"
          >
            <template #right-icon>
              <van-tag type="success">{{ getStatusLabel(order.status) }}</van-tag>
            </template>
          </van-cell>
        </van-list>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { order } from '../api'

const router = useRouter()
const activeTab = ref(0)
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const allOrders = ref([])

const statusLabels = {
  draft: '草稿',
  submitted: '已提交',
  confirmed: '已确认',
  delivering: '配送中',
  delivered: '已送达',
  inspected: '已验收',
  completed: '已完成',
  cancelled: '已取消'
}

const statusTypes = {
  draft: 'default',
  submitted: 'warning',
  confirmed: 'primary',
  delivering: 'success',
  delivered: 'success',
  inspected: 'success',
  completed: 'success',
  cancelled: 'danger'
}

const pendingOrders = computed(() => allOrders.value.filter(o => ['submitted', 'confirmed', 'delivering', 'delivered'].includes(o.status)))
const completedOrders = computed(() => allOrders.value.filter(o => o.status === 'completed'))

const getStatusLabel = (status) => statusLabels[status] || status
const getStatusType = (status) => statusTypes[status] || 'default'

const loadOrders = async () => {
  loading.value = true
  try {
    const response = await order.list({ page: page.value, size: 10 })
    if (response.success) {
      if (response.data.orders.length === 0) {
        finished.value = true
      } else {
        allOrders.value = [...allOrders.value, ...response.data.orders]
        page.value++
      }
    }
  } catch (error) {
    console.error('加载订单失败')
  } finally {
    loading.value = false
  }
}

const loadMore = () => {
  loadOrders()
}

const handleTabChange = () => {
}

const goToDetail = (id) => {
  router.push(`/order-detail/${id}`)
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
</style>