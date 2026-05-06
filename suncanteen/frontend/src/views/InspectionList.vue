<template>
  <div class="inspection-list">
    <div class="search-bar">
      <el-input v-model="searchKeyword" placeholder="搜索订单号" class="search-input" @keyup.enter="loadInspections" />
      <el-select v-model="searchStatus" placeholder="状态筛选" class="search-select">
        <el-option label="全部" value="" />
        <el-option label="待验收" value="pending" />
        <el-option label="验收通过" value="passed" />
        <el-option label="验收不合格" value="failed" />
      </el-select>
      <el-button type="primary" @click="loadInspections">搜索</el-button>
    </div>
    <el-table :data="inspections" border>
      <el-table-column prop="order_no" label="关联订单" />
      <el-table-column prop="supplier_name" label="供应商" />
      <el-table-column prop="school_name" label="学校" />
      <el-table-column prop="inspector" label="验收人" />
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.status)">
            {{ getStatusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="inspect_time" label="验收时间" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button type="text" @click="viewDetail(scope.row.id)">查看</el-button>
          <el-button v-if="scope.row.status === 'pending'" type="text" @click="doInspect(scope.row)">验收</el-button>
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
    <el-dialog title="验收操作" v-model="inspectDialogVisible" width="800px">
      <div v-if="currentInspection" class="inspect-form">
        <h4>商品明细</h4>
        <el-table :data="currentInspection.items" border>
          <el-table-column prop="product_name" label="商品名称" />
          <el-table-column prop="spec" label="规格" />
          <el-table-column prop="unit" label="单位" />
          <el-table-column prop="ordered_qty" label="订购数量" />
          <el-table-column prop="actual_qty" label="实际数量">
            <template #default="scope">
              <el-input-number v-model="scope.row.actual_qty" :min="0" />
            </template>
          </el-table-column>
          <el-table-column prop="inspect_result" label="验收结果">
            <template #default="scope">
              <el-select v-model="scope.row.inspect_result">
                <el-option label="合格" value="passed" />
                <el-option label="不合格" value="failed" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注">
            <template #default="scope">
              <el-input v-model="scope.row.remark" />
            </template>
          </el-table-column>
        </el-table>
        <el-form-item label="验收备注" style="margin-top: 16px">
          <el-textarea v-model="inspectRemark" rows="3" />
        </el-form-item>
      </div>
      <template #footer>
        <el-button @click="inspectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitInspection">确认验收</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { inspection } from '../api'
import { ElMessage } from 'element-plus'

const inspections = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const searchKeyword = ref('')
const searchStatus = ref('')
const inspectDialogVisible = ref(false)
const currentInspection = ref(null)
const inspectRemark = ref('')

const statusLabels = {
  pending: '待验收',
  passed: '验收通过',
  failed: '验收不合格'
}

const statusTagTypes = {
  pending: 'warning',
  passed: 'success',
  failed: 'danger'
}

const getStatusLabel = (status) => statusLabels[status] || status
const getStatusTagType = (status) => statusTagTypes[status] || 'info'

const loadInspections = async () => {
  try {
    const response = await inspection.list({
      page,
      size,
      keyword: searchKeyword.value,
      status: searchStatus.value
    })
    if (response.success) {
      inspections.value = response.data.inspections
      total.value = response.data.total
      page.value = response.data.page
    }
  } catch (error) {
    ElMessage.error('加载验收列表失败')
  }
}

const handlePageChange = (val) => {
  page.value = val
  loadInspections()
}

const viewDetail = (id) => {
}

const doInspect = async (row) => {
  try {
    const response = await inspection.get(row.id)
    if (response.success) {
      currentInspection.value = response.data
      inspectRemark.value = ''
      inspectDialogVisible.value = true
    }
  } catch (error) {
    ElMessage.error('加载验收详情失败')
  }
}

const submitInspection = async () => {
  if (!currentInspection.value) return
  try {
    const data = {
      id: currentInspection.value.id,
      items: currentInspection.value.items.map(item => ({
        id: item.id,
        actual_qty: item.actual_qty,
        inspect_result: item.inspect_result,
        remark: item.remark
      })),
      remark: inspectRemark.value
    }
    const response = await inspection.update(data)
    if (response.success) {
      ElMessage.success('验收成功')
      inspectDialogVisible.value = false
      loadInspections()
    }
  } catch (error) {
    ElMessage.error('验收失败')
  }
}

loadInspections()
</script>

<style scoped>
.inspection-list {
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

.inspect-form {
  padding: 10px;
}
</style>