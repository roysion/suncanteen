<template>
  <div class="inventory-report">
    <div class="filter-bar">
      <el-date-picker v-model="reportDate" type="date" placeholder="报表日期" />
      <el-select v-model="warehouseId" placeholder="选择仓库">
        <el-option label="全部" value="" />
        <el-option v-for="wh in warehouses" :key="wh.id" :label="wh.name" :value="wh.id" />
      </el-select>
      <el-button type="primary" @click="loadReport">生成报表</el-button>
      <el-button type="success" @click="exportReport">导出Excel</el-button>
    </div>
    <div class="summary-cards">
      <el-card class="summary-card">
        <div class="card-title">库存总价值</div>
        <div class="card-value">¥{{ summary.totalValue.toFixed(2) }}</div>
      </el-card>
      <el-card class="summary-card">
        <div class="card-title">商品种类</div>
        <div class="card-value">{{ summary.productCount }}</div>
      </el-card>
      <el-card class="summary-card">
        <div class="card-title">库存总量</div>
        <div class="card-value">{{ summary.totalQuantity }}</div>
      </el-card>
    </div>
    <el-table :data="reportData" border>
      <el-table-column prop="product_name" label="商品名称" />
      <el-table-column prop="spec" label="规格" />
      <el-table-column prop="unit" label="单位" />
      <el-table-column prop="quantity" label="库存数量" />
      <el-table-column prop="unit_price" label="单价">
        <template #default="scope">¥{{ scope.row.unit_price.toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="total_value" label="库存价值">
        <template #default="scope">¥{{ scope.row.total_value.toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="warehouse_name" label="仓库" />
      <el-table-column prop="stock_status" label="库存状态">
        <template #default="scope">
          <el-tag :type="scope.row.stock_status === 'normal' ? 'success' : scope.row.stock_status === 'warning' ? 'warning' : 'danger'">
            {{ scope.row.stock_status === 'normal' ? '正常' : scope.row.stock_status === 'warning' ? '预警' : '紧缺' }}
          </el-tag>
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
import { ref, reactive, onMounted } from 'vue'
import { report } from '../api'
import { ElMessage } from 'element-plus'

const warehouses = ref([])
const reportData = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const reportDate = ref('')
const warehouseId = ref('')

const summary = reactive({
  totalValue: 0,
  productCount: 0,
  totalQuantity: 0
})

const loadReport = async () => {
  try {
    const response = await report.inventory({
      page,
      size,
      reportDate: reportDate.value,
      warehouseId: warehouseId.value
    })
    if (response.success) {
      reportData.value = response.data.list
      total.value = response.data.total
      summary.totalValue = response.data.summary.totalValue || 0
      summary.productCount = response.data.summary.productCount || 0
      summary.totalQuantity = response.data.summary.totalQuantity || 0
    }
  } catch (error) {
    ElMessage.error('加载报表失败')
  }
}

const exportReport = async () => {
  try {
    const response = await report.exportInventory({
      reportDate: reportDate.value,
      warehouseId: warehouseId.value
    })
    if (response.success) {
      ElMessage.success('导出成功')
    }
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const handlePageChange = (val) => {
  page.value = val
  loadReport()
}

onMounted(async () => {
  const whRes = await report.getWarehouses()
  if (whRes.success) warehouses.value = whRes.data
  loadReport()
})
</script>

<style scoped>
.inventory-report {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.summary-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.summary-card {
  flex: 1;
  text-align: center;
}

.card-title {
  font-size: 14px;
  color: #999;
  margin-bottom: 8px;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #67C23A;
}
</style>