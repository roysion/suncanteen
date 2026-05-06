<template>
  <div class="supplier-list">
    <div class="search-bar">
      <el-input v-model="searchKeyword" placeholder="搜索供应商名称或编码" class="search-input" @keyup.enter="loadSuppliers" />
      <el-select v-model="searchStatus" placeholder="状态筛选" class="search-select">
        <el-option label="全部" value="" />
        <el-option label="待审核" value="pending" />
        <el-option label="已通过" value="approved" />
        <el-option label="已驳回" value="rejected" />
        <el-option label="合作中" value="cooperating" />
        <el-option label="已暂停" value="suspended" />
      </el-select>
      <el-button type="primary" @click="loadSuppliers">搜索</el-button>
      <el-button type="success" @click="goToAdd">新增供应商</el-button>
    </div>
    <el-table :data="suppliers" border>
      <el-table-column prop="name" label="供应商名称" />
      <el-table-column prop="code" label="供应商编码" />
      <el-table-column prop="contact_name" label="联系人" />
      <el-table-column prop="contact_phone" label="联系电话" />
      <el-table-column prop="address" label="地址" />
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.status)">
            {{ getStatusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button type="text" @click="viewSupplier(scope.row.id)">查看</el-button>
          <el-button type="text" @click="editSupplier(scope.row)">编辑</el-button>
          <el-button v-if="scope.row.status === 'pending'" type="text" @click="approveSupplier(scope.row.id)">审核通过</el-button>
          <el-button v-if="scope.row.status === 'pending'" type="text" @click="showRejectDialog(scope.row.id)">驳回</el-button>
          <el-button v-if="scope.row.status === 'approved'" type="text" @click="updateSupplierStatus(scope.row.id, 'cooperating')">启用合作</el-button>
          <el-button v-if="scope.row.status === 'cooperating'" type="text" @click="updateSupplierStatus(scope.row.id, 'suspended')">暂停合作</el-button>
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
    <el-dialog title="驳回供应商" v-model="rejectDialogVisible">
      <el-form>
        <el-form-item label="驳回原因">
          <el-textarea v-model="rejectReason" placeholder="请输入驳回原因" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="doReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supplier } from '../api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const suppliers = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const searchKeyword = ref('')
const searchStatus = ref('')
const rejectDialogVisible = ref(false)
const rejectReason = ref('')
const rejectId = ref(null)

const statusLabels = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  cooperating: '合作中',
  suspended: '已暂停',
  terminated: '已解约'
}

const statusTagTypes = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cooperating: 'success',
  suspended: 'warning',
  terminated: 'danger'
}

const getStatusLabel = (status) => statusLabels[status] || status
const getStatusTagType = (status) => statusTagTypes[status] || 'info'

const loadSuppliers = async () => {
  try {
    const response = await supplier.list({
      page,
      size,
      keyword: searchKeyword.value,
      status: searchStatus.value
    })
    if (response.success) {
      suppliers.value = response.data.suppliers
      total.value = response.data.total
      page.value = response.data.page
    }
  } catch (error) {
    ElMessage.error('加载供应商列表失败')
  }
}

const handlePageChange = (val) => {
  page.value = val
  loadSuppliers()
}

const goToAdd = () => {
  router.push('/suppliers/add')
}

const viewSupplier = (id) => {
  router.push(`/suppliers/${id}`)
}

const editSupplier = (row) => {
  router.push({ path: '/suppliers/add', query: { id: row.id } })
}

const approveSupplier = async (id) => {
  try {
    const response = await supplier.approve(id, {})
    if (response.success) {
      ElMessage.success('审核通过')
      loadSuppliers()
    }
  } catch (error) {
    ElMessage.error('审核失败')
  }
}

const showRejectDialog = (id) => {
  rejectId.value = id
  rejectReason.value = ''
  rejectDialogVisible.value = true
}

const doReject = async () => {
  if (!rejectReason.value.trim()) {
    ElMessage.error('请填写驳回原因')
    return
  }
  try {
    const response = await supplier.reject(rejectId.value, { reject_reason: rejectReason.value })
    if (response.success) {
      ElMessage.success('驳回成功')
      rejectDialogVisible.value = false
      loadSuppliers()
    }
  } catch (error) {
    ElMessage.error('驳回失败')
  }
}

const updateSupplierStatus = async (id, status) => {
  try {
    const response = await supplier.updateStatus(id, { status })
    if (response.success) {
      ElMessage.success('状态更新成功')
      loadSuppliers()
    }
  } catch (error) {
    ElMessage.error('状态更新失败')
  }
}

loadSuppliers()
</script>

<style scoped>
.supplier-list {
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

.search-select {
  width: 150px;
}
</style>