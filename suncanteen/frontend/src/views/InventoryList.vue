<template>
  <div class="inventory-list">
    <div class="search-bar">
      <el-input v-model="searchKeyword" placeholder="搜索商品名称" class="search-input" @keyup.enter="loadInventory" />
      <el-button type="primary" @click="loadInventory">搜索</el-button>
    </div>
    <el-table :data="inventory" border>
      <el-table-column prop="product_name" label="商品名称" />
      <el-table-column prop="spec" label="规格" />
      <el-table-column prop="unit" label="单位" />
      <el-table-column prop="quantity" label="库存数量" />
      <el-table-column prop="cost_price" label="成本单价">
        <template #default="scope">¥{{ scope.row.cost_price.toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="total_value" label="库存价值">
        <template #default="scope">¥{{ (scope.row.quantity * scope.row.cost_price).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="last_update_time" label="最后更新时间" />
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
import { inventory } from '../api'
import { ElMessage } from 'element-plus'

const inventory = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const searchKeyword = ref('')

const loadInventory = async () => {
  try {
    const response = await inventory.list({
      page,
      size,
      keyword: searchKeyword.value
    })
    if (response.success) {
      inventory.value = response.data.inventory
      total.value = response.data.total
      page.value = response.data.page
    }
  } catch (error) {
    ElMessage.error('加载库存列表失败')
  }
}

const handlePageChange = (val) => {
  page.value = val
  loadInventory()
}

loadInventory()
</script>

<style scoped>
.inventory-list {
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
</style>