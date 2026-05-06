<template>
  <div class="organization-add">
    <el-form ref="formRef" :model="form" label-width="120px">
      <el-form-item label="机构名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入机构名称" />
      </el-form-item>
      <el-form-item label="机构类型" prop="type">
        <el-select v-model="form.type" placeholder="请选择机构类型">
          <el-option label="学校" value="school" />
          <el-option label="管理机构" value="admin" />
        </el-select>
      </el-form-item>
      <el-form-item label="地址" prop="address">
        <el-input v-model="form.address" placeholder="请输入地址" />
      </el-form-item>
      <el-form-item label="联系人" prop="contact">
        <el-input v-model="form.contact" placeholder="请输入联系人" />
      </el-form-item>
      <el-form-item label="联系电话" prop="phone">
        <el-input v-model="form.phone" placeholder="请输入联系电话" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
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
import { organization } from '../api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const formRef = ref()

const form = ref({
  name: '',
  type: '',
  address: '',
  contact: '',
  phone: '',
  email: ''
})

const isEdit = ref(false)
const editId = ref(null)

const handleSubmit = async () => {
  if (!form.value.name) {
    ElMessage.error('请填写机构名称')
    return
  }
  if (!form.value.type) {
    ElMessage.error('请选择机构类型')
    return
  }
  try {
    if (isEdit.value) {
      const response = await organization.update(editId.value, form.value)
      if (response.success) {
        ElMessage.success('更新成功')
      }
    } else {
      const response = await organization.create(form.value)
      if (response.success) {
        ElMessage.success('创建成功')
      }
    }
    router.push('/organizations')
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  }
}

const goBack = () => {
  router.push('/organizations')
}

onMounted(async () => {
  const id = route.query.id
  if (id) {
    isEdit.value = true
    editId.value = id
    loadOrganization(id)
  }
})

const loadOrganization = async (id) => {
  try {
    const response = await organization.get(id)
    if (response.success) {
      form.value = response.data
    }
  } catch (error) {
    ElMessage.error('加载机构信息失败')
  }
}
</script>

<style scoped>
.organization-add {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}
</style>