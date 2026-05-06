<template>
  <div class="organization-list">
    <div class="search-bar">
      <el-input v-model="searchKeyword" placeholder="搜索机构名称" class="search-input" @keyup.enter="loadOrganizations" />
      <el-button type="primary" @click="loadOrganizations">搜索</el-button>
      <el-button type="success" @click="goToAdd">新增机构</el-button>
    </div>
    <el-table :data="organizations" border>
      <el-table-column prop="name" label="机构名称" />
      <el-table-column prop="type" label="类型">
        <template #default="scope">{{ scope.row.type === 'school' ? '学校' : '管理机构' }}</template>
      </el-table-column>
      <el-table-column prop="address" label="地址" />
      <el-table-column prop="contact" label="联系人" />
      <el-table-column prop="phone" label="联系电话" />
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
          <el-button type="text" @click="editOrg(scope.row)">编辑</el-button>
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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { organization } from '../api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const organizations = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const searchKeyword = ref('')

const loadOrganizations = async () => {
  try {
    const response = await organization.list({
      page,
      size,
      keyword: searchKeyword.value
    })
    if (response.success) {
      organizations.value = response.data.organizations
      total.value = response.data.total
      page.value = response.data.page
    }
  } catch (error) {
    ElMessage.error('加载机构列表失败')
  }
}

const handlePageChange = (val) => {
  page.value = val
  loadOrganizations()
}

const goToAdd = () => {
  router.push('/organizations/add')
}

const editOrg = (row) => {
  router.push({ path: '/organizations/add', query: { id: row.id } })
}

const toggleStatus = async (id, status) => {
  try {
    const response = await organization.update(id, { status })
    if (response.success) {
      ElMessage.success(status === 'active' ? '启用成功' : '禁用成功')
      loadOrganizations()
    }
  } catch (error) {
    ElMessage.error(status === 'active' ? '启用失败' : '禁用失败')
  }
}

loadOrganizations()
</script>

<style scoped>
.organization-list {
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