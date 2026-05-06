<template>
  <div class="product-add">
    <el-form ref="formRef" :model="form" label-width="120px">
      <el-form-item label="商品名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入商品名称" />
      </el-form-item>
      <el-form-item label="规格" prop="spec">
        <el-input v-model="form.spec" placeholder="请输入规格" />
      </el-form-item>
      <el-form-item label="单位" prop="unit">
        <el-select v-model="form.unit" placeholder="请选择单位">
          <el-option label="公斤" value="公斤" />
          <el-option label="克" value="克" />
          <el-option label="件" value="件" />
          <el-option label="箱" value="箱" />
          <el-option label="个" value="个" />
          <el-option label="袋" value="袋" />
        </el-select>
      </el-form-item>
      <el-form-item label="单价" prop="unit_price">
        <el-input-number v-model="form.unit_price" :min="0" step="0.01" />
      </el-form-item>
      <el-form-item label="分类" prop="category_id">
        <el-select v-model="form.category_id" placeholder="请选择分类">
          <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
        <el-button @click="goBack">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { product } from '../api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const formRef = ref()
const categories = ref([])

const form = ref({
  name: '',
  spec: '',
  unit: '',
  unit_price: 0,
  category_id: ''
})

const isEdit = ref(false)
const editId = ref(null)

const handleSubmit = async () => {
  if (!form.value.name) {
    ElMessage.error('请填写商品名称')
    return
  }
  if (!form.value.unit) {
    ElMessage.error('请选择单位')
    return
  }
  try {
    if (isEdit.value) {
      const response = await product.update(editId.value, form.value)
      if (response.success) {
        ElMessage.success('更新成功')
      }
    } else {
      const response = await product.create(form.value)
      if (response.success) {
        ElMessage.success('创建成功')
      }
    }
    router.push('/products')
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  }
}

const goBack = () => {
  router.push('/products')
}

onMounted(async () => {
  const catRes = await product.listCategories()
  if (catRes.success) categories.value = catRes.data

  const id = route.query.id
  if (id) {
    isEdit.value = true
    editId.value = id
    loadProduct(id)
  }
})

const loadProduct = async (id) => {
  try {
    const response = await product.get(id)
    if (response.success) {
      form.value = response.data
    }
  } catch (error) {
    ElMessage.error('加载商品信息失败')
  }
}
</script>

<style scoped>
.product-add {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}
</style>