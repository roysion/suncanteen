<template>
  <div class="page-container">
    <van-nav-bar title="订单详情" left-arrow @click="goBack" />
    <van-card v-if="order" :title="order.order_no" :desc="order.supplier_name">
      <template #tag>
        <van-tag :type="getStatusType(order.status)">{{ getStatusLabel(order.status) }}</van-tag>
      </template>
      <van-cell-group inset>
        <van-cell title="订单金额" :value="`¥${order.total_amount.toFixed(2)}`" />
        <van-cell title="创建时间" :value="order.created_at" />
        <van-cell title="备注" :value="order.remark || '-'" />
      </van-cell-group>
    </van-card>
    <van-card title="商品明细">
      <van-cell-group inset v-for="item in items" :key="item.id">
        <van-cell :title="item.product_name" :value="`规格: ${item.spec}`">
          <template #right-icon>
            <div class="item-info">
              <div>{{ item.kindergarten_qty + item.primary_qty + item.junior_qty }} {{ item.unit }}</div>
              <div class="price">¥{{ item.amount.toFixed(2) }}</div>
            </div>
          </template>
        </van-cell>
      </van-cell-group>
    </van-card>
    <div class="total-row">合计：¥{{ totalAmount.toFixed(2) }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { order } from '../api'

const router = useRouter()
const route = useRoute()
const order = ref(null)
const items = ref([])

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

const totalAmount = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.amount || 0), 0)
})

const goBack = () => {
  router.back()
}

onMounted(() => {
  const id = route.params.id
  if (id) {
    loadOrder(id)
  }
})

const loadOrder = async (id) => {
  try {
    const response = await order.get(id)
    if (response.success) {
      order.value = response.data.order
      items.value = response.data.items
    }
  } catch (error) {
    console.error('加载订单失败')
  }
}
</script>

<style scoped>
.item-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.item-info div:first-child {
  font-size: 14px;
  color: #333;
}

.price {
  font-size: 12px;
  color: #409eff;
}

.total-row {
  text-align: right;
  font-size: 18px;
  font-weight: 600;
  padding: 16px;
  background: #fff;
  margin-top: 16px;
}
</style>