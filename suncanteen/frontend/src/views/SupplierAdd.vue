<template>
  <div class="supplier-add">
    <el-form ref="formRef" :model="form" label-width="120px">
      <el-form-item label="供应商名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入供应商名称" />
      </el-form-item>
      <el-form-item label="供应商编码" prop="code">
        <el-input v-model="form.code" placeholder="请输入供应商编码" />
      </el-form-item>
      <el-form-item label="营业执照" prop="business_license">
        <el-input v-model="form.business_license" placeholder="请输入营业执照号码" />
      </el-form-item>
      <el-form-item label="食品经营许可证" prop="food_license">
        <el-input v-model="form.food_license" placeholder="请输入食品经营许可证号码" />
      </el-form-item>
      <el-form-item label="地址" prop="address">
        <el-input v-model="form.address" placeholder="请输入地址" />
      </el-form-item>
      <el-form-item label="联系人" prop="contact_name">
        <el-input v-model="form.contact_name" placeholder="请输入联系人" />
      </el-form-item>
      <el-form-item label="联系电话" prop="contact_phone">
        <el-input v-model="form.contact_phone" placeholder="请输入联系电话" />
      </el-form-item>
      <el-form-item label="开户银行" prop="bank_name">
        <el-input v-model="form.bank_name" placeholder="请输入开户银行" />
      </el-form-item>
      <el-form-item label="银行账号" prop="bank_account">
        <el-input v-model="form.bank_account" placeholder="请输入银行账号" />
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
import { supplier } from '../api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const formRef = ref()
const form = ref({
  name: '',
  code: '',
  business_license: '',
  food_license: '',
  address: '',
  contact_name: '',
  contact_phone: '',
  bank_name: '',
  bank_account: ''
})

const isEdit = ref(false)
const editId = ref(null)

const handleSubmit = async () => {
  if (!form.value.name || !form.value.code) {
    ElMessage.error('请填写供应商名称和编码')
    return
  }
  try {
    let response
    if (isEdit.value) {
      response = await supplier.update(editId.value, form.value)
    } else {
      response = await supplier.register(form.value)
    }
    if (response.success) {
      ElMessage.success(isEdit.value ? '更新成功' : '注册成功')
      router.push('/suppliers')
    }
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '注册失败')
  }
}

const goBack = () => {
  router.push('/suppliers')
}

onMounted(() => {
  const id = route.query.id
  if (id) {
    isEdit.value = true
    editId.value = id
    loadSupplier(id)
  }
})

const loadSupplier = async (id) => {
  try {
    const response = await supplier.get(id)
    if (response.success) {
      form.value = response.data
    }
  } catch (error) {
    ElMessage.error('加载供应商信息失败')
  }
}
</script>

<style scoped>
.supplier-add {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}
</style>