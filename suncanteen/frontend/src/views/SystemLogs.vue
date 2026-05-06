<template>
  <div class="system-logs">
    <div class="filter-bar">
      <el-input v-model="searchKeyword" placeholder="搜索操作内容" class="search-input" @keyup.enter="loadLogs" />
      <el-select v-model="logType" placeholder="日志类型">
        <el-option label="全部" value="" />
        <el-option label="登录" value="login" />
        <el-option label="新增" value="create" />
        <el-option label="修改" value="update" />
        <el-option label="删除" value="delete" />
        <el-option label="导出" value="export" />
      </el-select>
      <el-date-picker v-model="startDate" type="date" placeholder="开始日期" />
      <el-date-picker v-model="endDate" type="date" placeholder="结束日期" />
      <el-button type="primary" @click="loadLogs">搜索</el-button>
    </div>
    <el-table :data="logs" border>
      <el-table-column prop="user_name" label="操作用户" />
      <el-table-column prop="type" label="操作类型">
        <template #default="scope">
          <el-tag :type="getTypeTagType(scope.row.type)">
            {{ getTypeLabel(scope.row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="module" label="操作模块" />
      <el-table-column prop="content" label="操作内容" />
      <el-table-column prop="ip" label="IP地址" />
      <el-table-column prop="created_at" label="操作时间" />
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
import { system } from '../api'
import { ElMessage } from 'element-plus'

const logs = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const searchKeyword = ref('')
const logType = ref('')
const startDate = ref('')
const endDate = ref('')

const typeLabels = {
  login: '登录',
  create: '新增',
  update: '修改',
  delete: '删除',
  export: '导出'
}

const typeTagTypes = {
  login: 'info',
  create: 'success',
  update: 'warning',
  delete: 'danger',
  export: 'primary'
}

const getTypeLabel = (type) => typeLabels[type] || type
const getTypeTagType = (type) => typeTagTypes[type] || 'info'

const loadLogs = async () => {
  try {
    const response = await system.getLogs({
      page,
      size,
      keyword: searchKeyword.value,
      type: logType.value,
      startDate: startDate.value,
      endDate: endDate.value
    })
    if (response.success) {
      logs.value = response.data.logs
      total.value = response.data.total
      page.value = response.data.page
    }
  } catch (error) {
    ElMessage.error('加载日志失败')
  }
}

const handlePageChange = (val) => {
  page.value = val
  loadLogs()
}

loadLogs()
</script>

<style scoped>
.system-logs {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input {
  width: 250px;
}
</style>