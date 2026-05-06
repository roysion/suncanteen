<template>
  <div class="settlement-list">
    <div class="search-bar">
      <el-input v-model="searchKeyword" placeholder="搜索结算单号" class="search-input" @keyup.enter="loadSettlements" />
      <el-select v-model="searchStatus" placeholder="状态筛选" class="search-select">
        <el-option label="全部" value="" />
        <el-option label="待结算" value="pending" />
        <el-option label="已结算" value="settled" />
      </el-select>
      <el-button type="primary" @click="loadSettlements">搜索</el-button>
    </div>
    <el-table :data="settlements" border>
      <el-table-column prop="settlement_no" label="结算单号" />
      <el-table-column prop="supplier_name" label="供应商" />
      <el-table-column prop="school_name" label="学校" />
      <el-table-column prop="start_date" label="开始日期" />
      <el-table-column prop="end_date" label="结束日期" />
      <el-table-column prop="order_count" label="订单数" />
      <el-table-column prop="total_amount" label="总金额">
        <template #default="scope">¥{{ scope.row.total_amount.toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'settled' ? 'success' : 'warning'">
            {{ scope.row.status === 'settled' ? '已结算' : '待结算' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button type="text" @click="viewDetail(scope.row.id)">查看详情</el-button>
          <el-button v-if="scope.row.status === 'pending'" type="text" @click="confirmSettlement(scope.row.id)">确认结算</el-button>
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
import { settlement } from '../api'
import { ElMessage } from 'element-plus'

const settlements = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const searchKeyword = ref('')
const searchStatus = ref('')

const loadSettlements = async () => {
  try {
    const response = await settlement.list({
      page,
      size,
      keyword: searchKeyword.value,
      status: searchStatus.value
    })
    if (response.success) {
      settlements.value = response.data.settlements
      total.value = response.data.total
      page.value = response.data.page
    }
  } catch (error) {
    ElMessage.error('加载结算列表失败')
  }
}

const handlePageChange = (val) => {
  page.value = val
  loadSettlements()
}

const viewDetail = (id) => {
}

const confirmSettlement = async (id) => {
  try {
    const response = await settlement.confirm(id)
    if (response.success) {
      ElMessage.success('结算成功')
      loadSettlements()
    }
  } catch (error) {
    ElMessage.error('结算失败')
  }
}

loadSettlements()
</script>

<style scoped>
.settlement-list {
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