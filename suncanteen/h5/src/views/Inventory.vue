<template>
  <div class="page-container">
    <van-nav-bar title="库存管理" />
    <van-search v-model="keyword" placeholder="搜索商品" @search="handleSearch" />
    <van-list v-model="loading" :finished="finished" finished-text="没有更多了" @load="loadMore">
      <van-cell-group>
        <van-cell
          v-for="item in inventory"
          :key="item.product_id"
          :title="item.product_name"
          :value="`规格: ${item.spec}`"
        >
          <template #right-icon>
            <div class="inventory-info">
              <div :class="['qty', { warning: item.quantity < 100 }]">{{ item.quantity }} {{ item.unit }}</div>
              <div class="price">¥{{ item.cost_price.toFixed(2) }}</div>
            </div>
          </template>
          <template #footer>
            <span v-if="item.quantity < 100" class="warning-text">库存不足</span>
          </template>
        </van-cell>
      </van-cell-group>
    </van-list>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { inventory } from '../api'

const keyword = ref('')
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const inventory = ref([])

const loadInventory = async () => {
  loading.value = true
  try {
    const response = await inventory.list({ page: page.value, size: 10, keyword: keyword.value })
    if (response.success) {
      if (response.data.inventory.length === 0) {
        finished.value = true
      } else {
        inventory.value = [...inventory.value, ...response.data.inventory]
        page.value++
      }
    }
  } catch (error) {
    console.error('加载库存失败')
  } finally {
    loading.value = false
  }
}

const loadMore = () => {
  loadInventory()
}

const handleSearch = () => {
  page.value = 1
  finished.value = false
  inventory.value = []
  loadInventory()
}

onMounted(() => {
  loadInventory()
})
</script>

<style scoped>
.inventory-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.qty {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.qty.warning {
  color: #f56c6c;
}

.price {
  font-size: 12px;
  color: #999;
}

.warning-text {
  color: #f56c6c;
  font-size: 12px;
}
</style>