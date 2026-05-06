<template>
  <div class="reconciliation-list">
    <div class="search-bar">
      <el-input v-model="searchKeyword" placeholder="搜索对账单号" class="search-input" @keyup.enter="loadReconciliations" />
      <el-select v-model="searchStatus" placeholder="状态筛选" class="search-select">
        <el-option label="全部" value="" />
        <el-option label="待对账" value="pending" />
        <el-option label="对账中" value="reconciling" />
        <el-option label="已完成" value="completed" />
      </el-select>
      <el-button type="primary" @click="loadReconciliations">搜索</el-button>
    </div>
    <el-table :data="reconciliations" border>
      <el-table-column prop="reconciliation_no" label="对账单号" />
      <el-table-column prop="supplier_name" label="供应商" />
      <el-table-column prop="month" label="对账月份" />
      <el-table-column prop="order_count" label="订单数" />
      <el-table-column prop="order_amount" label="订单金额">
        <template #default="scope">¥{{ scope.row.order_amount.toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="settled_amount" label="已结算金额">
        <template #default="scope">¥{{ scope.row.settled_amount.toFixed(2) }}</template>
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
          <el-button type="text" @click="viewDetail(scope.row.id)">查看详情</el-button>
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
import { reconciliation } from '../api'
import { ElMessage } from 'element-plus'

const reconciliations = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const searchKeyword = ref('')
const searchStatus = ref('')

const statusLabels = {
  pending: '待对账',
  reconciling: '对账中',
  completed: '已完成'
}

const statusTagTypes = {
  pending: 'warning',
  reconciling: 'primary',
  completed: 'success'
}

const getStatusLabel = (status) => statusLabels[status] || status
const getStatusTagType = (status) => statusTagTypes[status] || 'info'

const loadReconciliations = async () => {
  try {
    const response = await reconciliation.list({
      page,
      size,
      keyword: searchKeyword.value,
      status: searchStatus.value
    })
    if (response.success) {
      reconciliations.value = response.data.reconciliations
      total.value = response.data.total
      page.value = response.data.page
    }
  } catch (error) {
    ElMessage.error('加载对账单列表失败')
  }
}

const handlePageChange = (val) => {
  page.value = val
  loadReconciliations()
}

const viewDetail = (id) => {
}

loadReconciliations()
</script>

<style scoped>
.reconciliation-list {
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