<template>
  <div class="inventory-out">
    <el-form ref="formRef" :model="form" label-width="120px">
      <el-form-item label="出库用途" prop="purpose">
        <el-select v-model="form.purpose" placeholder="请选择出库用途">
          <el-option label="午餐使用" value="午餐使用" />
          <el-option label="晚餐使用" value="晚餐使用" />
          <el-option label="早餐使用" value="早餐使用" />
          <el-option label="其他" value="其他" />
        </el-select>
      </el-form-item>
      <el-form-item label="出库商品">
        <div class="product-list">
          <el-table :data="form.items" border>
            <el-table-column prop="product_name" label="商品名称" />
            <el-table-column prop="spec" label="规格" />
            <el-table-column prop="unit" label="单位" />
            <el-table-column prop="quantity" label="出库数量">
              <template #default="scope">
                <el-input-number v-model="scope.row.quantity" :min="0" :max="scope.row.max_quantity" @change="updateTotal" />
              </template>
            </el-table-column>
            <el-table-column prop="cost_price" label="成本单价">
              <template #default="scope">¥{{ scope.row.cost_price.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="amount" label="金额">
              <template #default="scope">¥{{ scope.row.amount.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="操作">
              <template #default="scope">
                <el-button type="text" @click="removeItem(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <el-button type="primary" @click="showProductDialog = true" style="margin-top: 10px">添加商品</el-button>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-textarea v-model="form.remark" placeholder="请输入备注" rows="3" />
      </el-form-item>
      <el-form-item>
        <div class="total-info">出库总额：¥{{ totalAmount.toFixed(2) }}</div>
        <el-button type="primary" @click="handleSubmit">确认出库</el-button>
        <el-button @click="goBack">取消</el-button>
      </el-form-item>
    </el-form>
    <el-dialog title="选择商品" v-model="showProductDialog" width="800px">
      <div class="product-search">
        <el-input v-model="productKeyword" placeholder="搜索商品" @keyup.enter="loadInventory" />
        <el-button type="primary" @click="loadInventory">搜索</el-button>
      </div>
      <el-table :data="inventoryList" border>
        <el-table-column prop="product_name" label="商品名称" />
        <el-table-column prop="spec" label="规格" />
        <el-table-column prop="unit" label="单位" />
        <el-table-column prop="quantity" label="库存数量" />
        <el-table-column prop="cost_price" label="成本单价">
          <template #default="scope">¥{{ scope.row.cost_price.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button type="text" @click="addProduct(scope.row)">添加</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { inventory } from '../api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const formRef = ref()
const inventoryList = ref([])
const productKeyword = ref('')
const showProductDialog = ref(false)

const form = ref({
  purpose: '',
  items: [],
  remark: ''
})

const totalAmount = computed(() => {
  return form.value.items.reduce((sum, item) => sum + (item.amount || 0), 0)
})

const updateTotal = () => {
  form.value.items.forEach(item => {
    item.amount = (item.quantity || 0) * (item.cost_price || 0)
  })
}

const loadInventory = async () => {
  try {
    const response = await inventory.list({ keyword: productKeyword.value })
    if (response.success) {
      inventoryList.value = response.data.inventory
    }
  } catch (error) {
    ElMessage.error('加载库存列表失败')
  }
}

const addProduct = (item) => {
  const existing = form.value.items.find(i => i.product_id === item.product_id)
  if (!existing) {
    form.value.items.push({
      product_id: item.product_id,
      product_name: item.product_name,
      spec: item.spec,
      unit: item.unit,
      quantity: 0,
      max_quantity: item.quantity,
      cost_price: item.cost_price,
      amount: 0
    })
  }
}

const removeItem = (index) => {
  form.value.items.splice(index, 1)
}

const handleSubmit = async () => {
  if (!form.value.purpose) {
    ElMessage.error('请选择出库用途')
    return
  }
  if (form.value.items.length === 0) {
    ElMessage.error('请添加出库商品')
    return
  }
  const hasQty = form.value.items.some(item => item.quantity > 0)
  if (!hasQty) {
    ElMessage.error('请至少填写一个商品数量')
    return
  }
  try {
    const data = {
      purpose: form.value.purpose,
      items: form.value.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      })),
      remark: form.value.remark
    }
    const response = await inventory.createOut(data)
    if (response.success) {
      ElMessage.success('出库成功')
      router.push('/inventory')
    }
  } catch (error) {
    ElMessage.error('出库失败')
  }
}

const goBack = () => {
  router.push('/inventory')
}
</script>

<style scoped>
.inventory-out {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.product-search {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.total-info {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}
</style>