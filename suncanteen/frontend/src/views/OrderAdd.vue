<template>
  <div class="order-add">
    <el-form ref="formRef" :model="form" label-width="120px">
      <el-form-item label="供应商" prop="supplier_id">
        <el-select v-model="form.supplier_id" placeholder="请选择供应商">
          <el-option v-for="s in suppliers" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="商品列表">
        <div class="product-list">
          <el-table :data="form.items" border>
            <el-table-column prop="product_name" label="商品名称" />
            <el-table-column prop="spec" label="规格" />
            <el-table-column prop="unit" label="单位" />
            <el-table-column prop="unit_price" label="单价">
              <template #default="scope">¥{{ scope.row.unit_price.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="kindergarten_qty" label="幼儿园数量">
              <template #default="scope">
                <el-input-number v-model="scope.row.kindergarten_qty" :min="0" @change="updateTotal" />
              </template>
            </el-table-column>
            <el-table-column prop="primary_qty" label="小学数量">
              <template #default="scope">
                <el-input-number v-model="scope.row.primary_qty" :min="0" @change="updateTotal" />
              </template>
            </el-table-column>
            <el-table-column prop="junior_qty" label="初中数量">
              <template #default="scope">
                <el-input-number v-model="scope.row.junior_qty" :min="0" @change="updateTotal" />
              </template>
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
      <el-form-item label="订单备注" prop="remark">
        <el-textarea v-model="form.remark" placeholder="请输入订单备注" rows="3" />
      </el-form-item>
      <el-form-item>
        <div class="total-info">订单总额：¥{{ totalAmount.toFixed(2) }}</div>
        <el-button type="primary" @click="handleSubmit">保存订单</el-button>
        <el-button @click="goBack">取消</el-button>
      </el-form-item>
    </el-form>
    <el-dialog title="选择商品" v-model="showProductDialog" width="800px">
      <div class="product-search">
        <el-input v-model="productKeyword" placeholder="搜索商品" @keyup.enter="loadProducts" />
        <el-button type="primary" @click="loadProducts">搜索</el-button>
      </div>
      <el-table :data="productList" border>
        <el-table-column prop="name" label="商品名称" />
        <el-table-column prop="spec" label="规格" />
        <el-table-column prop="unit" label="单位" />
        <el-table-column prop="price" label="单价">
          <template #default="scope">¥{{ scope.row.price.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="supplier_name" label="供应商" />
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
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { order, product, supplier } from '../api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const formRef = ref()
const suppliers = ref([])
const productList = ref([])
const productKeyword = ref('')
const showProductDialog = ref(false)

const form = ref({
  supplier_id: '',
  items: [],
  remark: ''
})

const isEdit = ref(false)
const editId = ref(null)

const totalAmount = computed(() => {
  return form.value.items.reduce((sum, item) => sum + (item.amount || 0), 0)
})

const updateTotal = () => {
  form.value.items.forEach(item => {
    const totalQty = (item.kindergarten_qty || 0) + (item.primary_qty || 0) + (item.junior_qty || 0)
    item.amount = totalQty * (item.unit_price || 0)
  })
}

const loadSuppliers = async () => {
  try {
    const response = await supplier.list({ status: 'cooperating' })
    if (response.success) {
      suppliers.value = response.data.suppliers
    }
  } catch (error) {
    ElMessage.error('加载供应商列表失败')
  }
}

const loadProducts = async () => {
  try {
    const response = await product.list({ keyword: productKeyword.value, supplier_id: form.value.supplier_id })
    if (response.success) {
      productList.value = response.data.products
    }
  } catch (error) {
    ElMessage.error('加载商品列表失败')
  }
}

const addProduct = (productItem) => {
  const existing = form.value.items.find(item => item.product_id === productItem.id)
  if (!existing) {
    form.value.items.push({
      product_id: productItem.id,
      product_name: productItem.name,
      spec: productItem.spec,
      unit: productItem.unit,
      unit_price: productItem.price,
      kindergarten_qty: 0,
      primary_qty: 0,
      junior_qty: 0,
      amount: 0
    })
  }
  updateTotal()
}

const removeItem = (index) => {
  form.value.items.splice(index, 1)
}

const handleSubmit = async () => {
  if (!form.value.supplier_id) {
    ElMessage.error('请选择供应商')
    return
  }
  if (form.value.items.length === 0) {
    ElMessage.error('请添加商品')
    return
  }
  const hasQty = form.value.items.some(item => item.kindergarten_qty > 0 || item.primary_qty > 0 || item.junior_qty > 0)
  if (!hasQty) {
    ElMessage.error('请至少填写一个商品数量')
    return
  }
  try {
    const data = {
      supplier_id: form.value.supplier_id,
      items: form.value.items.map(item => ({
        product_id: item.product_id,
        kindergarten_qty: item.kindergarten_qty || 0,
        primary_qty: item.primary_qty || 0,
        junior_qty: item.junior_qty || 0
      })),
      remark: form.value.remark
    }
    let response
    if (isEdit.value) {
      response = await order.update(editId.value, data)
    } else {
      response = await order.create(data)
    }
    if (response.success) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      router.push('/orders')
    }
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  }
}

const goBack = () => {
  router.push('/orders')
}

onMounted(() => {
  loadSuppliers()
  const id = route.query.id
  if (id) {
    isEdit.value = true
    editId.value = id
    loadOrder(id)
  }
})

const loadOrder = async (id) => {
  try {
    const response = await order.get(id)
    if (response.success) {
      const orderData = response.data.order
      const items = response.data.items
      form.value = {
        supplier_id: orderData.supplier_id,
        remark: orderData.remark,
        items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          spec: item.spec,
          unit: item.unit,
          unit_price: item.unit_price,
          kindergarten_qty: item.kindergarten_qty,
          primary_qty: item.primary_qty,
          junior_qty: item.junior_qty,
          amount: item.amount
        }))
      }
    }
  } catch (error) {
    ElMessage.error('加载订单信息失败')
  }
}
</script>

<style scoped>
.order-add {
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