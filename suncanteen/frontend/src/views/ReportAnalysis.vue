<template>
  <div class="report-analysis">
    <div class="report-tabs">
      <el-button :class="['tab-btn', { active: activeTab === 'order' }]" @click="activeTab = 'order'">订单统计</el-button>
      <el-button :class="['tab-btn', { active: activeTab === 'supplier' }]" @click="activeTab = 'supplier'">供应商统计</el-button>
      <el-button :class="['tab-btn', { active: activeTab === 'inventory' }]" @click="activeTab = 'inventory'">库存分析</el-button>
    </div>
    <div v-if="activeTab === 'order'" class="tab-content">
      <div class="filter-bar">
        <el-date-picker v-model="orderStartDate" type="date" placeholder="开始日期" />
        <el-date-picker v-model="orderEndDate" type="date" placeholder="结束日期" />
        <el-button type="primary" @click="loadOrderReport">查询</el-button>
      </div>
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-value">¥{{ orderStats.totalAmount.toFixed(2) }}</div>
          <div class="stat-label">订单总额</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ orderStats.orderCount }}</div>
          <div class="stat-label">订单数量</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ orderStats.supplierCount }}</div>
          <div class="stat-label">供应商数</div>
        </div>
      </div>
      <div class="chart-row">
        <div class="chart-card">
          <h4>订单趋势</h4>
          <div ref="orderTrendChart" class="chart"></div>
        </div>
      </div>
    </div>
    <div v-if="activeTab === 'supplier'" class="tab-content">
      <div class="filter-bar">
        <el-date-picker v-model="supplierStartDate" type="date" placeholder="开始日期" />
        <el-date-picker v-model="supplierEndDate" type="date" placeholder="结束日期" />
        <el-button type="primary" @click="loadSupplierReport">查询</el-button>
      </div>
      <div class="chart-row">
        <div class="chart-card">
          <h4>供应商订单金额排行</h4>
          <div ref="supplierChart" class="chart"></div>
        </div>
      </div>
    </div>
    <div v-if="activeTab === 'inventory'" class="tab-content">
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-value">{{ inventoryStats.totalCount }}</div>
          <div class="stat-label">商品种类</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">¥{{ inventoryStats.totalValue.toFixed(2) }}</div>
          <div class="stat-label">库存价值</div>
        </div>
      </div>
      <div class="chart-row">
        <div class="chart-card">
          <h4>库存预警商品</h4>
          <el-table :data="lowStockProducts" border>
            <el-table-column prop="product_name" label="商品名称" />
            <el-table-column prop="quantity" label="库存数量" />
            <el-table-column prop="min_stock" label="预警阈值" />
            <el-table-column prop="unit" label="单位" />
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { report } from '../api'

const activeTab = ref('order')
const orderStartDate = ref('')
const orderEndDate = ref('')
const supplierStartDate = ref('')
const supplierEndDate = ref('')

const orderStats = ref({
  totalAmount: 0,
  orderCount: 0,
  supplierCount: 0
})

const inventoryStats = ref({
  totalCount: 0,
  totalValue: 0
})

const lowStockProducts = ref([])

let orderTrendChart = null
let supplierChart = null

const loadOrderReport = async () => {
  try {
    const response = await report.getOrderReport({
      start_date: orderStartDate.value,
      end_date: orderEndDate.value
    })
    if (response.success) {
      orderStats.value = response.data.summary
      renderOrderTrendChart(response.data.trend)
    }
  } catch (error) {
    console.error('加载订单报表失败')
  }
}

const loadSupplierReport = async () => {
  try {
    const response = await report.getSupplierReport({
      start_date: supplierStartDate.value,
      end_date: supplierEndDate.value
    })
    if (response.success) {
      renderSupplierChart(response.data)
    }
  } catch (error) {
    console.error('加载供应商报表失败')
  }
}

const loadInventoryReport = async () => {
  try {
    const response = await report.getInventoryReport()
    if (response.success) {
      inventoryStats.value = response.data.summary
      lowStockProducts.value = response.data.lowStockProducts
    }
  } catch (error) {
    console.error('加载库存报表失败')
  }
}

const renderOrderTrendChart = (data) => {
  nextTick(() => {
    if (!orderTrendChart) {
      orderTrendChart = echarts.init(document.querySelector('.report-analysis .tab-content:first-child .chart'))
    }
    orderTrendChart.setOption({
      xAxis: { type: 'category', data: data.labels },
      yAxis: { type: 'value' },
      series: [{ data: data.values, type: 'line' }],
      tooltip: { trigger: 'axis' }
    })
  })
}

const renderSupplierChart = (data) => {
  nextTick(() => {
    if (!supplierChart) {
      supplierChart = echarts.init(document.querySelector('.report-analysis .tab-content:nth-child(2) .chart'))
    }
    supplierChart.setOption({
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: data.labels },
      series: [{ data: data.values, type: 'bar' }],
      tooltip: { trigger: 'axis' }
    })
  })
}

onMounted(() => {
  loadOrderReport()
  loadInventoryReport()
})
</script>

<style scoped>
.report-analysis {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.report-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 8px 20px;
  border-radius: 4px;
  background: #f5f5f5;
  border: none;
}

.tab-btn.active {
  background: #409eff;
  color: #fff;
}

.tab-content {
  min-height: 400px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.stats-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
}

.stat-label {
  margin-top: 8px;
  color: #999;
}

.chart-row {
  display: flex;
  gap: 20px;
}

.chart-card {
  flex: 1;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.chart-card h4 {
  margin: 0 0 16px 0;
}

.chart {
  height: 300px;
}
</style>