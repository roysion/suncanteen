<template>
  <div class="system-settings">
    <div class="settings-section">
      <h3>系统设置</h3>
      <el-form :model="settings" label-width="150px">
        <el-form-item label="系统名称">
          <el-input v-model="settings.system_name" />
        </el-form-item>
        <el-form-item label="系统版本">
          <el-input v-model="settings.version" disabled />
        </el-form-item>
        <el-form-item label="库存预警阈值">
          <el-input-number v-model="settings.inventory_warning" :min="0" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveSettings">保存设置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="settings-section">
      <h3>数据备份</h3>
      <el-button type="primary" @click="backupData">执行备份</el-button>
      <div class="backup-info">
        <p>上次备份时间：{{ lastBackupTime || '从未备份' }}</p>
      </div>
    </div>
    <div class="settings-section">
      <h3>清理缓存</h3>
      <el-button type="warning" @click="clearCache">清理系统缓存</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { system } from '../api'
import { ElMessage } from 'element-plus'

const settings = ref({
  system_name: '',
  version: '',
  inventory_warning: 100
})

const lastBackupTime = ref('')

const saveSettings = async () => {
  try {
    const response = await system.saveSettings(settings.value)
    if (response.success) {
      ElMessage.success('设置保存成功')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const backupData = async () => {
  try {
    const response = await system.backup()
    if (response.success) {
      ElMessage.success('备份成功')
      lastBackupTime.value = response.data.backup_time
    }
  } catch (error) {
    ElMessage.error('备份失败')
  }
}

const clearCache = async () => {
  try {
    const response = await system.clearCache()
    if (response.success) {
      ElMessage.success('缓存清理成功')
    }
  } catch (error) {
    ElMessage.error('清理失败')
  }
}

onMounted(async () => {
  try {
    const response = await system.getSettings()
    if (response.success) {
      settings.value = response.data.settings
      lastBackupTime.value = response.data.last_backup_time
    }
  } catch (error) {
    console.error('加载设置失败')
  }
})
</script>

<style scoped>
.system-settings {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.settings-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.settings-section:last-child {
  border-bottom: none;
}

.settings-section h3 {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
}

.backup-info {
  margin-top: 12px;
  color: #999;
}
</style>