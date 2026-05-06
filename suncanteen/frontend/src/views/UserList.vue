<template>
  <div class="user-list">
    <div class="search-bar">
      <el-input v-model="searchKeyword" placeholder="搜索用户名或姓名" class="search-input" @keyup.enter="loadUsers" />
      <el-button type="primary" @click="loadUsers">搜索</el-button>
      <el-button type="success" @click="goToAdd">新增用户</el-button>
    </div>
    <el-table :data="users" border>
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="real_name" label="真实姓名" />
      <el-table-column prop="phone" label="联系电话" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="organization_name" label="所属机构" />
      <el-table-column prop="role_name" label="角色" />
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
          <el-button type="text" @click="editUser(scope.row)">编辑</el-button>
          <el-button type="text" @click="resetPassword(scope.row.id)">重置密码</el-button>
          <el-button v-if="scope.row.status === 'active'" type="text" @click="toggleStatus(scope.row.id, 'inactive')">禁用</el-button>
          <el-button v-if="scope.row.status === 'inactive'" type="text" @click="toggleStatus(scope.row.id, 'active')">启用</el-button>
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
    <el-dialog title="重置密码" v-model="resetDialogVisible">
      <el-form>
        <el-form-item label="新密码">
          <el-input type="password" v-model="newPassword" placeholder="请输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="doReset">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { user } from '../api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const users = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const searchKeyword = ref('')
const resetDialogVisible = ref(false)
const newPassword = ref('')
const resetId = ref(null)

const loadUsers = async () => {
  try {
    const response = await user.list({
      page,
      size,
      keyword: searchKeyword.value
    })
    if (response.success) {
      users.value = response.data.users
      total.value = response.data.total
      page.value = response.data.page
    }
  } catch (error) {
    ElMessage.error('加载用户列表失败')
  }
}

const handlePageChange = (val) => {
  page.value = val
  loadUsers()
}

const goToAdd = () => {
  router.push('/users/add')
}

const editUser = (row) => {
  router.push({ path: '/users/add', query: { id: row.id } })
}

const resetPassword = (id) => {
  resetId.value = id
  newPassword.value = ''
  resetDialogVisible.value = true
}

const doReset = async () => {
  if (!newPassword.value) {
    ElMessage.error('请输入新密码')
    return
  }
  try {
    const response = await user.updatePassword(resetId.value, { password: newPassword.value })
    if (response.success) {
      ElMessage.success('密码重置成功')
      resetDialogVisible.value = false
    }
  } catch (error) {
    ElMessage.error('密码重置失败')
  }
}

const toggleStatus = async (id, status) => {
  try {
    const response = await user.update(id, { status })
    if (response.success) {
      ElMessage.success(status === 'active' ? '启用成功' : '禁用成功')
      loadUsers()
    }
  } catch (error) {
    ElMessage.error(status === 'active' ? '启用失败' : '禁用失败')
  }
}

loadUsers()
</script>

<style scoped>
.user-list {
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