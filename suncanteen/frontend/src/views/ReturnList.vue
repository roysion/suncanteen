<template>
  <div class="return-list">
    <div class="search-bar">
      <el-input v-model="searchKeyword" placeholder="搜索退换货单号" class="search-input" @keyup.enter="loadReturns" />
      <el-select v-model="searchStatus" placeholder="状态筛选" class="search-select">
        <el-option label="全部" value="" />
        <el-option label="待处理" value="pending" />
        <el-option label="已同意" value="approved" />
        <el-option label="已拒绝" value="rejected" />
        <el-option label="已完成" value="completed" />
      </el-select>
      <el-button type="primary" @click="loadReturns">搜索</el-button>
      <el-button type="success" @click="goToAdd">新增退换货</el-button>
    </div>
    <el-table :data="returns" border>
      <el-table-column prop="return_no" label="退换货单号" />
      <el-table-column prop="order_no" label="关联订单" />
      <el-table-column prop="type" label="类型">
        <template #default="scope">{{ scope.row.type === 'return' ? '退货' : '换货' }}</template>
      </el-table-column>
      <el-table-column prop="supplier_name" label="供应商" />
      <el-table-column prop="product_name" label="商品名称" />
      <el-table-column prop="quantity" label="数量" />
      <el-table-column prop="reason" label="原因" />
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.status)">
            {{ getStatusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="申请时间" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button type="text" @click="viewDetail(scope.row.id)">查看</el-button>
          <el-button v-if="scope.row.status === 'pending'" type="text" @click="handleReturn(scope.row)">处理</el-button>
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
    <el-dialog title="处理退换货" v-model="handleDialogVisible">
      <el-form>
        <el-form-item label="处理结果">
          <el-select v-model="handleResult" placeholder="请选择处理结果">
            <el-option label="同意" value="approved" />
            <el-option label="拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理备注">
          <el-textarea v-model="handleRemark" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHandle">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { returnOrder } from '../api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const returns = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const searchKeyword = ref('')
const searchStatus = ref('')
const handleDialogVisible = ref(false)
const handleResult = ref('')
const handleRemark = ref('')
const currentReturnId = ref(null)

const statusLabels = {
  pending: '待处理',
  approved: '已同意',
  rejected: '已拒绝',
  completed: '已完成'
}

const statusTagTypes = {
  pending: 'warning',
  approved: 'primary',
  rejected: 'danger',
  completed: 'success'
}

const getStatusLabel = (status) => statusLabels[status] || status
const getStatusTagType = (status) => statusTagTypes[status] || 'info'

const loadReturns = async () => {
  try {
    const response = await returnOrder.list({
      page,
      size,
      keyword: searchKeyword.value,
      status: searchStatus.value
    })
    if (response.success) {
      returns.value = response.data.returns
      total.value = response.data.total
      page.value = response.data.page
    }
  } catch (error) {
    ElMessage.error('加载退换货列表失败')
  }
}

const handlePageChange = (val) => {
  page.value = val
  loadReturns()
}

const goToAdd = () => {
  router.push('/returns/add')
}

const viewDetail = (id) => {
}

const handleReturn = (row) => {
  currentReturnId.value = row.id
  handleResult.value = ''
  handleRemark.value = ''
  handleDialogVisible.value = true
}

const submitHandle = async () => {
  if (!handleResult.value) {
    ElMessage.error('请选择处理结果')
    return
  }
  try {
    const response = await returnOrder.handle(currentReturnId.value, {
      status: handleResult.value,
      remark: handleRemark.value
    })
    if (response.success) {
      ElMessage.success('处理成功')
      handleDialogVisible.value = false
      loadReturns()
    }
  } catch (error) {
    ElMessage.error('处理失败')
  }
}

loadReturns()
</script>

<style scoped>
.return-list {
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