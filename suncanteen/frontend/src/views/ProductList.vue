<template>
  <div class="product-list">
    <div class="search-bar">
      <el-input v-model="searchKeyword" placeholder="搜索商品名称" class="search-input" @keyup.enter="loadProducts" />
      <el-button type="primary" @click="loadProducts">搜索</el-button>
      <el-button type="success" @click="goToAdd">新增商品</el-button>
    </div>
    <el-table :data="products" border>
      <el-table-column prop="name" label="商品名称" />
      <el-table-column prop="spec" label="规格" />
      <el-table-column prop="unit" label="单位" />
      <el-table-column prop="unit_price" label="单价">
        <template #default="scope">¥{{ scope.row.unit_price.toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="category_name" label="分类" />
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
            {{ scope.row.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button type="text" @click="editProduct(scope.row)">编辑</el-button>
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
import { product } from '../api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const products = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const searchKeyword = ref('')

const loadProducts = async () => {
  try {
    const response = await product.list({
      page,
      size,
      keyword: searchKeyword.value
    })
    if (response.success) {
      products.value = response.data.products
      total.value = response.data.total
      page.value = response.data.page
    }
  } catch (error) {
    ElMessage.error('加载商品列表失败')
  }
}

const handlePageChange = (val) => {
  page.value = val
  loadProducts()
}

const goToAdd = () => {
  router.push('/products/add')
}

const editProduct = (row) => {
  router.push({ path: '/products/add', query: { id: row.id } })
}

loadProducts()
</script>

<style scoped>
.product-list {
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