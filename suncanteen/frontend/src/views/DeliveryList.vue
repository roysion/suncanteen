<template>
  <div class="delivery-list">
    <div class="search-bar">
      <el-input v-model="searchKeyword" placeholder="搜索配送单号" class="search-input" @keyup.enter="loadDeliveries" />
      <el-select v-model="searchStatus" placeholder="状态筛选" class="search-select">
        <el-option label="全部" value="" />
        <el-option label="待配送" value="pending" />
        <el-option label="配送中" value="delivering" />
        <el-option label="已送达" value="delivered" />
        <el-option label="已签收" value="signed" />
      </el-select>
      <el-button type="primary" @click="loadDeliveries">搜索</el-button>
    </div>
    <el-table :data="deliveries" border>
      <el-table-column prop="delivery_no" label="配送单号" />
      <el-table-column prop="order_no" label="关联订单" />
      <el-table-column prop="school_name" label="收货学校" />
      <el-table-column prop="supplier_name" label="供应商" />
      <el-table-column prop="driver_name" label="配送员" />
      <el-table-column prop="driver_phone" label="联系电话" />
      <el-table-column prop="vehicle_no" label="车牌号" />
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
          <el-button type="text" @click="viewDelivery(scope.row.id)">查看</el-button>
          <el-button v-if="scope.row.status === 'delivering'" type="text" @click="signDelivery(scope.row.id)">签收</el-button>
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
import { delivery } from '../api'
import { ElMessage } from 'element-plus'

const deliveries = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const searchKeyword = ref('')
const searchStatus = ref('')

const statusLabels = {
  pending: '待配送',
  delivering: '配送中',
  delivered: '已送达',
  signed: '已签收'
}

const statusTagTypes = {
  pending: 'info',
  delivering: 'primary',
  delivered: 'success',
  signed: 'success'
}

const getStatusLabel = (status) => statusLabels[status] || status
const getStatusTagType = (status) => statusTagTypes[status] || 'info'

const loadDeliveries = async () => {
  try {
    const response = await delivery.list({
      page,
      size,
      keyword: searchKeyword.value,
      status: searchStatus.value
    })
    if (response.success) {
      deliveries.value = response.data.deliveries
      total.value = response.data.total
      page.value = response.data.page
    }
  } catch (error) {
    ElMessage.error('加载配送单列表失败')
  }
}

const handlePageChange = (val) => {
  page.value = val
  loadDeliveries()
}

const viewDelivery = (id) => {
}

const signDelivery = async (id) => {
  try {
    const response = await delivery.sign(id)
    if (response.success) {
      ElMessage.success('签收成功')
      loadDeliveries()
    }
  } catch (error) {
    ElMessage.error('签收失败')
  }
}

loadDeliveries()
</script>

<style scoped>
.delivery-list {
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