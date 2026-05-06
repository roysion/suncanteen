<template>
  <div class="order-detail">
    <div class="detail-header">
      <el-button type="text" @click="goBack">返回列表</el-button>
      <h2>订单详情</h2>
    </div>
    <div class="detail-content">
      <div class="info-section">
        <h3>基本信息</h3>
        <el-row :gutter="20">
          <el-col :span="6"><span class="label">订单编号：</span>{{ orderData.order_no }}</el-col>
          <el-col :span="6"><span class="label">学校：</span>{{ orderData.school_name }}</el-col>
          <el-col :span="6"><span class="label">供应商：</span>{{ orderData.supplier_name }}</el-col>
          <el-col :span="6"><span class="label">状态：</span><el-tag :type="getStatusTagType(orderData.status)">{{ getStatusLabel(orderData.status) }}</el-tag></el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="6"><span class="label">订单金额：</span>¥{{ orderData.total_amount.toFixed(2) }}</el-col>
          <el-col :span="6"><span class="label">创建时间：</span>{{ orderData.created_at }}</el-col>
          <el-col :span="12"><span class="label">备注：</span>{{ orderData.remark || '-' }}</el-col>
        </el-row>
      </div>
      <div class="info-section">
        <h3>商品明细</h3>
        <el-table :data="orderItems" border>
          <el-table-column prop="product_name" label="商品名称" />
          <el-table-column prop="spec" label="规格" />
          <el-table-column prop="unit" label="单位" />
          <el-table-column prop="kindergarten_qty" label="幼儿园数量" />
          <el-table-column prop="primary_qty" label="小学数量" />
          <el-table-column prop="junior_qty" label="初中数量" />
          <el-table-column prop="unit_price" label="单价">
            <template #default="scope">¥{{ scope.row.unit_price.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="amount" label="金额">
            <template #default="scope">¥{{ scope.row.amount.toFixed(2) }}</template>
          </el-table-column>
        </el-table>
        <div class="total-row">合计：¥{{ totalAmount.toFixed(2) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { order } from '../api'

const router = useRouter()
const route = useRoute()

const orderData = ref({})
const orderItems = ref([])

const statusLabels = {
  draft: '草稿',
  submitted: '已提交',
  confirmed: '已确认',
  delivering: '配送中',
  delivered: '已送达',
  inspected: '已验收',
  completed: '已完成',
  cancelled: '已取消',
  rejected: '已驳回'
}

const statusTagTypes = {
  draft: 'info',
  submitted: 'warning',
  confirmed: 'primary',
  delivering: 'success',
  delivered: 'success',
  inspected: 'success',
  completed: 'success',
  cancelled: 'danger',
  rejected: 'danger'
}

const getStatusLabel = (status) => statusLabels[status] || status
const getStatusTagType = (status) => statusTagTypes[status] || 'info'

const totalAmount = computed(() => {
  return orderItems.value.reduce((sum, item) => sum + (item.amount || 0), 0)
})

const goBack = () => {
  router.push('/orders')
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
      orderData.value = response.data.order
      orderItems.value = response.data.items
    }
  } catch (error) {
    console.error('Failed to load order:', error)
  }
}
</script>

<style scoped>
.order-detail {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.info-section {
  margin-bottom: 20px;
}

.info-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.label {
  color: #999;
}

.total-row {
  text-align: right;
  font-size: 16px;
  font-weight: 600;
  margin-top: 12px;
  padding-right: 12px;
}
</style>