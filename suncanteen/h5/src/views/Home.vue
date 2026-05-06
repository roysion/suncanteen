<template>
  <div class="page-container">
    <van-nav-bar title="阳光食堂" />
    <div class="stats-section">
      <van-grid :column-num="2">
        <van-grid-item icon="orders-o" text="待处理订单" @click="goToOrders">
          <div class="stat-value">{{ pendingOrders }}</div>
        </van-grid-item>
        <van-grid-item icon="goods-o" text="库存预警" @click="goToInventory">
          <div class="stat-value warning">{{ lowStockCount }}</div>
        </van-grid-item>
      </van-grid>
    </div>
    <div class="quick-actions">
      <van-button type="primary" block @click="goToCreateOrder">
        <van-icon name="plus" /> 创建订单
      </van-button>
    </div>
    <div class="section">
      <van-cell-group title="最近订单">
        <van-cell
          v-for="order in recentOrders"
          :key="order.id"
          :title="order.order_no"
          :value="`¥${order.total_amount.toFixed(2)}`"
          is-link
          @click="goToOrderDetail(order.id)"
        >
          <template #right-icon>
            <van-tag :type="getStatusType(order.status)">{{ getStatusLabel(order.status) }}</van-tag>
          </template>
        </van-cell>
      </van-cell-group>
    </div>
    <div v-if="recentOrders.length === 0" class="empty">
      <van-empty description="暂无订单" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { order, inventory } from '../api'

const router = useRouter()
const pendingOrders = ref(0)
const lowStockCount = ref(0)
const recentOrders = ref([])

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

const getStatusLabel = (status) => statusLabels[status] || status
const getStatusType = (status) => statusTypes[status] || 'default'

const loadData = async () => {
  try {
    const [orderRes, inventoryRes] = await Promise.all([
      order.list({ page: 1, size: 5 }),
      inventory.list({ page: 1, size: 10 })
    ])
    if (orderRes.success) {
      recentOrders.value = orderRes.data.orders
      pendingOrders.value = orderRes.data.orders.filter(o => ['submitted', 'confirmed', 'delivering'].includes(o.status)).length
    }
    if (inventoryRes.success) {
      lowStockCount.value = inventoryRes.data.inventory.filter(i => i.quantity < 100).length
    }
  } catch (error) {
    console.error('加载数据失败')
  }
}

const goToOrders = () => {
  router.push('/orders')
}

const goToInventory = () => {
  router.push('/inventory')
}

const goToCreateOrder = () => {
  router.push('/create-order')
}

const goToOrderDetail = (id) => {
  router.push(`/order-detail/${id}`)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.stats-section {
  margin-bottom: 16px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
}

.stat-value.warning {
  color: #f56c6c;
}

.quick-actions {
  margin-bottom: 16px;
}

.section {
  background: #fff;
  border-radius: 8px;
}

.empty {
  padding: 40px 0;
}
</style>