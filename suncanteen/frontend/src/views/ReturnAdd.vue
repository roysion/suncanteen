<template>
  <div class="return-add">
    <el-form ref="formRef" :model="form" label-width="120px">
      <el-form-item label="关联订单" prop="order_id">
        <el-select v-model="form.order_id" placeholder="请选择订单">
          <el-option v-for="order in orders" :key="order.id" :label="order.order_no" :value="order.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="类型" prop="type">
        <el-select v-model="form.type" placeholder="请选择类型">
          <el-option label="退货" value="return" />
          <el-option label="换货" value="exchange" />
        </el-select>
      </el-form-item>
      <el-form-item label="商品" prop="product_id">
        <el-select v-model="form.product_id" placeholder="请选择商品">
          <el-option v-for="product in products" :key="product.id" :label="product.product_name" :value="product.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="数量" prop="quantity">
        <el-input-number v-model="form.quantity" :min="1" />
      </el-form-item>
      <el-form-item label="原因" prop="reason">
        <el-textarea v-model="form.reason" placeholder="请输入退换货原因" rows="3" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-textarea v-model="form.remark" placeholder="请输入备注" rows="3" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSubmit">提交申请</el-button>
        <el-button @click="goBack">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { returnApi, order } from '../api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const formRef = ref()
const orders = ref([])
const products = ref([])

const form = ref({
  order_id: '',
  type: '',
  product_id: '',
  quantity: 1,
  reason: '',
  remark: ''
})

const loadOrders = async () => {
  try {
    const response = await order.list({ page: 1, size: 50 })
    if (response.success) {
      orders.value = response.data.orders.filter(o => o.status === 'inspected' || o.status === 'completed')
    }
  } catch (error) {
    ElMessage.error('加载订单列表失败')
  }
}

const loadProductsByOrder = async (orderId) => {
  if (!orderId) {
    products.value = []
    return
  }
  try {
    const response = await order.get(orderId)
    if (response.success) {
      products.value = response.data.items.map(item => ({
        id: item.product_id,
        product_name: item.product_name
      }))
    }
  } catch (error) {
    ElMessage.error('加载订单商品失败')
  }
}

watch(() => form.value.order_id, (newVal) => {
  loadProductsByOrder(newVal)
})

const handleSubmit = async () => {
  if (!form.value.order_id) {
    ElMessage.error('请选择关联订单')
    return
  }
  if (!form.value.type) {
    ElMessage.error('请选择类型')
    return
  }
  if (!form.value.product_id) {
    ElMessage.error('请选择商品')
    return
  }
  if (!form.value.reason) {
    ElMessage.error('请输入退换货原因')
    return
  }
  try {
    const response = await returnApi.create(form.value)
    if (response.success) {
      ElMessage.success('申请提交成功')
      router.push('/returns')
    }
  } catch (error) {
    ElMessage.error('提交失败')
  }
}

const goBack = () => {
  router.push('/returns')
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.return-add {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}
</style>