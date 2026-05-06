<template>
  <div class="purchase-report">
    <div class="filter-bar">
      <el-date-picker v-model="startDate" type="date" placeholder="开始日期" />
      <el-date-picker v-model="endDate" type="date" placeholder="结束日期" />
      <el-select v-model="supplierId" placeholder="选择供应商">
        <el-option label="全部" value="" />
        <el-option v-for="sup in suppliers" :key="sup.id" :label="sup.name" :value="sup.id" />
      </el-select>
      <el-button type="primary" @click="loadReport">生成报表</el-button>
      <el-button type="success" @click="exportReport">导出Excel</el-button>
    </div>
    <div class="summary-cards">
      <el-card class="summary-card">
        <div class="card-title">采购总金额</div>
        <div class="card-value">¥{{ summary.totalAmount.toFixed(2) }}</div>
      </el-card>
      <el-card class="summary-card">
        <div class="card-title">订单数量</div>
        <div class="card-value">{{ summary.orderCount }}</div>
      </el-card>
      <el-card class="summary-card">
        <div class="card-title">供应商数量</div>
        <div class="card-value">{{ summary.supplierCount }}</div>
      </el-card>
    </div>
    <el-table :data="reportData" border>
      <el-table-column prop="order_no" label="订单编号" />
      <el-table-column prop="supplier_name" label="供应商" />
      <el-table-column prop="product_name" label="商品名称" />
      <el-table-column prop="quantity" label="数量" />
      <el-table-column prop="unit" label="单位" />
      <el-table-column prop="unit_price" label="单价">
        <template #default="scope">¥{{ scope.row.unit_price.toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="amount" label="金额">
        <template #default="scope">¥{{ scope.row.amount.toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="order_date" label="下单日期" />
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

const suppliers = ref([])
const reportData = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const startDate = ref('')
const endDate = ref('')
const supplierId = ref('')

const summary = reactive({
  totalAmount: 0,
  orderCount: 0,
  supplierCount: 0
})

const loadReport = async () => {
  try {
    const response = await report.purchase({
      page,
      size,
      startDate: startDate.value,
      endDate: endDate.value,
      supplierId: supplierId.value
    })
    if (response.success) {
      reportData.value = response.data.list
      total.value = response.data.total
      summary.totalAmount = response.data.summary.totalAmount || 0
      summary.orderCount = response.data.summary.orderCount || 0
      summary.supplierCount = response.data.summary.supplierCount || 0
    }
  } catch (error) {
    ElMessage.error('加载报表失败')
  }
}

const exportReport = async () => {
  try {
    const response = await report.exportPurchase({
      startDate: startDate.value,
      endDate: endDate.value,
      supplierId: supplierId.value
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
  const supRes = await report.getSuppliers()
  if (supRes.success) suppliers.value = supRes.data
  loadReport()
})
</script>

<style scoped>
.purchase-report {
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
  color: #409EFF;
}
</style>