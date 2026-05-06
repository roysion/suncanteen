<template>
  <div class="user-add">
    <el-form ref="formRef" :model="form" label-width="120px">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input type="password" v-model="form.password" placeholder="请输入密码" />
      </el-form-item>
      <el-form-item label="真实姓名" prop="real_name">
        <el-input v-model="form.real_name" placeholder="请输入真实姓名" />
      </el-form-item>
      <el-form-item label="联系电话" prop="phone">
        <el-input v-model="form.phone" placeholder="请输入联系电话" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item label="所属机构" prop="organization_id">
        <el-select v-model="form.organization_id" placeholder="请选择机构">
          <el-option v-for="org in organizations" :key="org.id" :label="org.name" :value="org.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="角色" prop="role_id">
        <el-select v-model="form.role_id" placeholder="请选择角色">
          <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id" />
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
import { user, organization } from '../api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const formRef = ref()
const organizations = ref([])
const roles = ref([])

const form = ref({
  username: '',
  password: '',
  real_name: '',
  phone: '',
  email: '',
  organization_id: '',
  role_id: ''
})

const isEdit = ref(false)
const editId = ref(null)

const handleSubmit = async () => {
  if (!form.value.username) {
    ElMessage.error('请填写用户名')
    return
  }
  if (!isEdit.value && !form.value.password) {
    ElMessage.error('请填写密码')
    return
  }
  if (!form.value.real_name) {
    ElMessage.error('请填写真实姓名')
    return
  }
  if (!form.value.organization_id) {
    ElMessage.error('请选择所属机构')
    return
  }
  if (!form.value.role_id) {
    ElMessage.error('请选择角色')
    return
  }
  try {
    const data = { ...form.value }
    if (isEdit.value) {
      delete data.password
      const response = await user.update(editId.value, data)
      if (response.success) {
        ElMessage.success('更新成功')
      }
    } else {
      const response = await user.create(data)
      if (response.success) {
        ElMessage.success('创建成功')
      }
    }
    router.push('/users')
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  }
}

const goBack = () => {
  router.push('/users')
}

onMounted(async () => {
  const [orgRes, roleRes] = await Promise.all([
    organization.list(),
    user.listRoles()
  ])
  if (orgRes.success) organizations.value = orgRes.data
  if (roleRes.success) roles.value = roleRes.data

  const id = route.query.id
  if (id) {
    isEdit.value = true
    editId.value = id
    loadUser(id)
  }
})

const loadUser = async (id) => {
  try {
    const response = await user.get(id)
    if (response.success) {
      form.value = {
        username: response.data.username,
        password: '',
        real_name: response.data.real_name,
        phone: response.data.phone || '',
        email: response.data.email || '',
        organization_id: response.data.organization_id,
        role_id: response.data.role_id
      }
    }
  } catch (error) {
    ElMessage.error('加载用户信息失败')
  }
}
</script>

<style scoped>
.user-add {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}
</style>