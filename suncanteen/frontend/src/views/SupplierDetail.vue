<template>
  <div class="supplier-detail">
    <div class="detail-header">
      <el-button type="text" @click="goBack">返回列表</el-button>
      <h2>供应商详情</h2>
    </div>
    <div class="detail-content">
      <div class="info-section">
        <h3>基本信息</h3>
        <el-row :gutter="20">
          <el-col :span="6"><span class="label">供应商名称：</span>{{ supplierData.name }}</el-col>
          <el-col :span="6"><span class="label">联系人：</span>{{ supplierData.contact }}</el-col>
          <el-col :span="6"><span class="label">联系电话：</span>{{ supplierData.phone }}</el-col>
          <el-col :span="6"><span class="label">邮箱：</span>{{ supplierData.email }}</el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="6"><span class="label">地址：</span>{{ supplierData.address }}</el-col>
          <el-col :span="6"><span class="label">营业执照：</span>{{ supplierData.business_license || '-' }}</el-col>
          <el-col :span="6"><span class="label">食品经营许可证：</span>{{ supplierData.food_license || '-' }}</el-col>
          <el-col :span="6"><span class="label">状态：</span><el-tag :type="getStatusTagType(supplierData.status)">{{ getStatusLabel(supplierData.status) }}</el-tag></el-col>
        </el-row>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supplier } from '../api'

const router = useRouter()
const route = useRoute()

const supplierData = ref({})

const statusLabels = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  disabled: '已禁用'
}

const statusTagTypes = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  disabled: 'info'
}

const getStatusLabel = (status) => statusLabels[status] || status
const getStatusTagType = (status) => statusTagTypes[status] || 'info'

const goBack = () => {
  router.push('/suppliers')
}

onMounted(() => {
  const id = route.params.id
  if (id) {
    loadSupplier(id)
  }
})

const loadSupplier = async (id) => {
  try {
    const response = await supplier.get(id)
    if (response.success) {
      supplierData.value = response.data
    }
  } catch (error) {
    console.error('Failed to load supplier:', error)
  }
}
</script>

<style scoped>
.supplier-detail {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.info-section {
  margin-bottom: 20px;
}

.info-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.label {
  color: #999;
}
</style>