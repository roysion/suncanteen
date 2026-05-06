<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon bg-blue">
          <el-icon><component :is="icons.ShoppingCart" /></el-icon>
        </div>
        <div class="stat-content">
          <p class="stat-value">{{ dashboardData.todayOrders }}</p>
          <p class="stat-label">今日订单</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-green">
          <el-icon><component :is="icons.Wallet" /></el-icon>
        </div>
        <div class="stat-content">
          <p class="stat-value">¥{{ dashboardData.todayAmount.toFixed(2) }}</p>
          <p class="stat-label">今日金额</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-orange">
          <el-icon><component :is="icons.Clock" /></el-icon>
        </div>
        <div class="stat-content">
          <p class="stat-value">{{ dashboardData.pendingOrders }}</p>
          <p class="stat-label">待处理订单</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-purple">
          <el-icon><component :is="icons.Package" /></el-icon>
        </div>
        <div class="stat-content">
          <p class="stat-value">¥{{ dashboardData.inventoryValue.toFixed(2) }}</p>
          <p class="stat-label">库存价值</p>
        </div>
      </div>
    </div>
    <div class="charts-row">
      <div class="chart-card">
        <h3>月度采购趋势</h3>
        <div ref="purchaseChart" class="chart"></div>
      </div>
      <div class="chart-card">
        <h3>库存分布</h3>
        <div ref="inventoryChart" class="chart"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { report } from '../api'
import * as icons from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const dashboardData = ref({
  todayOrders: 0,
  todayAmount: 0,
  pendingOrders: 0,
  monthlyPurchases: 0,
  inventoryValue: 0
})

const purchaseChart = ref(null)
const inventoryChart = ref(null)

const initPurchaseChart = () => {
  const chart = echarts.init(purchaseChart.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
    yAxis: { type: 'value' },
    series: [{
      data: [12000, 19000, 15000, 21000, 18000, 25000],
      type: 'line',
      smooth: true,
      areaStyle: {}
    }]
  })
}

const initInventoryChart = () => {
  const chart = echarts.init(inventoryChart.value)
  chart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10 },
      label: { show: false },
      emphasis: { label: { show: true } },
      labelLine: { show: false },
      data: [
        { value: 35, name: '蔬菜类' },
        { value: 25, name: '肉类' },
        { value: 20, name: '粮油类' },
        { value: 12, name: '调料类' },
        { value: 8, name: '其他' }
      ]
    }]
  })
}

const loadDashboardData = async () => {
  try {
    const response = await report.dashboard()
    if (response.success) {
      dashboardData.value = response.data
    }
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
}

onMounted(() => {
  loadDashboardData()
  initPurchaseChart()
  initInventoryChart()
  
  window.addEventListener('resize', () => {
    purchaseChart.value && echarts.init(purchaseChart.value).resize()
    inventoryChart.value && echarts.init(inventoryChart.value).resize()
  })
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  color: #fff;
}

.stat-icon.bg-blue { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-icon.bg-green { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
.stat-icon.bg-orange { background: linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%); }
.stat-icon.bg-purple { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); }

.stat-content {
  flex: 1;
}

.stat-value {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.stat-label {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #999;
}

.charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.chart-card h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
}

.chart {
  height: 280px;
}
</style>