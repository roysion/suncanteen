<template>
  <div class="page-container">
    <van-nav-bar title="创建订单" left-arrow @click="goBack" />
    <van-form @submit="handleSubmit">
      <van-cell-group inset>
        <van-field
          v-model="form.supplier_id"
          name="supplier_id"
          label="供应商"
          placeholder="请选择供应商"
          readonly
          is-link
          @click="showSupplierPicker = true"
        >
          <template #right-icon>
            <van-icon name="arrow-right" />
          </template>
        </van-field>
        <van-field
          v-model="form.remark"
          name="remark"
          label="备注"
          placeholder="请输入备注"
        />
      </van-cell-group>
      <van-card title="商品列表">
        <van-button type="primary" block @click="showProductPicker = true">添加商品</van-button>
        <div v-if="selectedProducts.length === 0" class="empty">
          <van-empty description="请添加商品" />
        </div>
        <van-cell-group inset v-for="(product, index) in selectedProducts" :key="product.id">
          <van-cell :title="product.product_name" :value="`规格: ${product.spec}`">
            <template #right-icon>
              <div class="product-info">
                <van-stepper v-model="product.quantity" @change="updateTotal" />
                <van-icon name="delete" @click="removeProduct(index)" />
              </div>
            </template>
          </van-cell>
        </van-cell-group>
      </van-card>
      <div class="total-row">订单总额：¥{{ totalAmount.toFixed(2) }}</div>
      <van-button type="primary" native-type="submit" block>提交订单</van-button>
    </van-form>
    <van-action-sheet v-model="showSupplierPicker" title="选择供应商">
      <van-cell-group>
        <van-cell
          v-for="supplier in suppliers"
          :key="supplier.id"
          :title="supplier.name"
          is-link
          @click="selectSupplier(supplier)"
        />
      </van-cell-group>
    </van-action-sheet>
    <van-action-sheet v-model="showProductPicker" title="选择商品">
      <van-search v-model="productKeyword" placeholder="搜索商品" />
      <van-cell-group>
        <van-cell
          v-for="product in products"
          :key="product.id"
          :title="product.name"
          :value="`规格: ${product.spec} | 单价: ¥${product.unit_price.toFixed(2)}`"
          is-link
          @click="selectProduct(product)"
        />
      </van-cell-group>
    </van-action-sheet>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { order, supplier, product } from '../api'
import { showToast } from 'vant'

const router = useRouter()
const showSupplierPicker = ref(false)
const showProductPicker = ref(false)
const productKeyword = ref('')
const suppliers = ref([])
const products = ref([])

const form = ref({
  supplier_id: '',
  supplier_name: '',
  remark: ''
})

const selectedProducts = ref([])

const totalAmount = computed(() => {
  return selectedProducts.value.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
})

const updateTotal = () => {
}

const loadSuppliers = async () => {
  try {
    const response = await supplier.list({ page: 1, size: 50 })
    if (response.success) {
      suppliers.value = response.data.suppliers.filter(s => s.status === 'approved')
    }
  } catch (error) {
    console.error('加载供应商失败')
  }
}

const loadProducts = async () => {
  try {
    const response = await product.list({ page: 1, size: 100 })
    if (response.success) {
      products.value = response.data.products
    }
  } catch (error) {
    console.error('加载商品失败')
  }
}

const selectSupplier = (supplier) => {
  form.value.supplier_id = supplier.id
  form.value.supplier_name = supplier.name
  showSupplierPicker.value = false
}

const selectProduct = (product) => {
  const existing = selectedProducts.value.find(p => p.id === product.id)
  if (!existing) {
    selectedProducts.value.push({
      id: product.id,
      product_name: product.name,
      spec: product.spec,
      unit: product.unit,
      unit_price: product.unit_price,
      quantity: 1
    })
  }
  showProductPicker.value = false
}

const removeProduct = (index) => {
  selectedProducts.value.splice(index, 1)
}

const handleSubmit = async () => {
  if (!form.value.supplier_id) {
    showToast('请选择供应商')
    return
  }
  if (selectedProducts.value.length === 0) {
    showToast('请添加商品')
    return
  }
  try {
    const data = {
      supplier_id: form.value.supplier_id,
      remark: form.value.remark,
      items: selectedProducts.value.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        kindergarten_qty: item.quantity,
        primary_qty: 0,
        junior_qty: 0
      }))
    }
    const response = await order.create(data)
    if (response.success) {
      showToast('订单创建成功')
      router.push('/orders')
    } else {
      showToast(response.message || '创建失败')
    }
  } catch (error) {
    showToast('创建失败')
  }
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  loadSuppliers()
  loadProducts()
})
</script>

<style scoped>
.product-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.empty {
  padding: 40px 0;
}

.total-row {
  text-align: right;
  font-size: 18px;
  font-weight: 600;
  padding: 16px;
  background: #fff;
  margin-top: 16px;
}
</style>