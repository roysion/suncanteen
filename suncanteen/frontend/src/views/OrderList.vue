<template>
  <div class="order-list">
    <div class="search-bar">
      <el-input v-model="searchKeyword" placeholder="搜索订单号" class="search-input" @keyup.enter="loadOrders" />
      <el-select v-model="searchStatus" placeholder="状态筛选" class="search-select">
        <el-option label="全部" value="" />
        <el-option label="草稿" value="draft" />
        <el-option label="已提交" value="submitted" />
        <el-option label="已确认" value="confirmed" />
        <el-option label="配送中" value="delivering" />
        <el-option label="已送达" value="delivered" />
        <el-option label="已验收" value="inspected" />
        <el-option label="已完成" value="completed" />
        <el-option label="已取消" value="cancelled" />
        <el-option label="已驳回" value="rejected" />
      </el-select>
      <el-button type="primary" @click="loadOrders">搜索</el-button>
      <el-button type="success" @click="goToAdd">创建订单</el-button>
    </div>
    <el-table :data="orders" border>
      <el-table-column prop="order_no" label="订单编号" />
      <el-table-column prop="school_name" label="学校名称" />
      <el-table-column prop="supplier_name" label="供应商" />
      <el-table-column prop="total_amount" label="订单金额">
        <template #default="scope">¥{{ scope.row.total_amount.toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.status)">
            {{ getStatusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button type="text" @click="viewOrder(scope.row.id)">查看</el-button>
          <el-button v-if="scope.row.status === 'draft'" type="text" @click="editOrder(scope.row)">编辑</el-button>
          <el-button v-if="scope.row.status === 'draft'" type="text" @click="submitOrder(scope.row.id)">提交</el-button>
          <el-button v-if="scope.row.status === 'submitted'" type="text" @click="confirmOrder(scope.row.id)">确认</el-button>
          <el-button v-if="scope.row.status === 'submitted'" type="text" @click="rejectOrder(scope.row.id)">驳回</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      :total="total"
      :page-size="size"
      :current-page="page"
      @current-change="handlePageChange"
      layout="prev, pager, next, jumper, ->, total"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { order } from '../api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const orders = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const searchKeyword = ref('')
const searchStatus = ref('')

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

const loadOrders = async () => {
  try {
    const response = await order.list({
      page,
      size,
      keyword: searchKeyword.value,
      status: searchStatus.value
    })
    if (response.success) {
      orders.value = response.data.orders
      total.value = response.data.total
      page.value = response.data.page
    }
  } catch (error) {
    ElMessage.error('加载订单列表失败')
  }
}

const handlePageChange = (val) => {
  page.value = val
  loadOrders()
}

const goToAdd = () => {
  router.push('/orders/add')
}

const viewOrder = (id) => {
  router.push(`/orders/${id}`)
}

const editOrder = (row) => {
  router.push({ path: '/orders/add', query: { id: row.id } })
}

const submitOrder = async (id) => {
  try {
    const response = await order.submit(id)
    if (response.success) {
      ElMessage.success('提交成功')
      loadOrders()
    }
  } catch (error) {
    ElMessage.error('提交失败')
  }
}

const confirmOrder = async (id) => {
  try {
    const response = await order.confirm(id)
    if (response.success) {
      ElMessage.success('确认成功')
      loadOrders()
    }
  } catch (error) {
    ElMessage.error('确认失败')
  }
}

const rejectOrder = async (id) => {
  try {
    const response = await order.reject(id, { reason: '订单信息有误' })
    if (response.success) {
      ElMessage.success('驳回成功')
      loadOrders()
    }
  } catch (error) {
    ElMessage.error('驳回失败')
  }
}

loadOrders()
</script>

<style scoped>
.order-list {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input {
  width: 250px;
}

.search-select {
  width: 150px;
}
</style>