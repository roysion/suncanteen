<template>
  <el-container class="layout-container" style="height: 100%">
    <el-aside width="200px" class="layout-sidebar">
      <div class="logo">
        <h2>阳光食堂</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="layout-menu"
        mode="vertical"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/dashboard">
          <el-icon><component :is="icons.LayoutDashboard" /></el-icon>
          <span>数据驾驶舱</span>
        </el-menu-item>
        <el-sub-menu index="supplier">
          <template #title>
            <el-icon><component :is="icons.Users" /></el-icon>
            <span>供应商管理</span>
          </template>
          <el-menu-item index="/suppliers">供应商列表</el-menu-item>
          <el-menu-item index="/suppliers/add">新增供应商</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/products">
          <el-icon><component :is="icons.Shop" /></el-icon>
          <span>商品管理</span>
        </el-menu-item>
        <el-sub-menu index="order">
          <template #title>
            <el-icon><component :is="icons.ShoppingCart" /></el-icon>
            <span>订单管理</span>
          </template>
          <el-menu-item index="/orders">订单列表</el-menu-item>
          <el-menu-item index="/orders/add">创建订单</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/deliveries">
          <el-icon><component :is="icons.Truck" /></el-icon>
          <span>配送管理</span>
        </el-menu-item>
        <el-menu-item index="/inspections">
          <el-icon><component :is="icons.CheckSquare" /></el-icon>
          <span>验收管理</span>
        </el-menu-item>
        <el-sub-menu index="inventory">
          <template #title>
            <el-icon><component :is="icons.Package" /></el-icon>
            <span>库存管理</span>
          </template>
          <el-menu-item index="/inventory">库存列表</el-menu-item>
          <el-menu-item index="/inventory/out">出库登记</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/returns">
          <el-icon><component :is="icons.RefreshCw" /></el-icon>
          <span>退换货管理</span>
        </el-menu-item>
        <el-menu-item index="/settlements">
          <el-icon><component :is="icons.FileText" /></el-icon>
          <span>结算管理</span>
        </el-menu-item>
        <el-menu-item index="/reconciliation">
          <el-icon><component :is="icons.Balance" /></el-icon>
          <span>对账管理</span>
        </el-menu-item>
        <el-sub-menu index="user">
          <template #title>
            <el-icon><component :is="icons.User" /></el-icon>
            <span>用户管理</span>
          </template>
          <el-menu-item index="/users">用户列表</el-menu-item>
          <el-menu-item index="/users/add">新增用户</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="organization">
          <template #title>
            <el-icon><component :is="icons.Building" /></el-icon>
            <span>机构管理</span>
          </template>
          <el-menu-item index="/organizations">机构列表</el-menu-item>
          <el-menu-item index="/organizations/add">新增机构</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="report">
          <template #title>
            <el-icon><component :is="icons.BarChart3" /></el-icon>
            <span>数据分析</span>
          </template>
          <el-menu-item index="/reports/purchase">采购分析</el-menu-item>
          <el-menu-item index="/reports/inventory">库存分析</el-menu-item>
          <el-menu-item index="/reports/analysis">报表分析</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="system">
          <template #title>
            <el-icon><component :is="icons.Settings" /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/system/settings">系统设置</el-menu-item>
          <el-menu-item index="/system/logs">操作日志</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="toggle-btn" @click="toggleSidebar"><component :is="icons.Menu" /></el-icon>
          <span class="page-title">{{ pageTitle }}</span>
        </div>
        <div class="header-right">
          <span class="user-info">{{ userInfo.real_name }}</span>
          <el-button type="text" @click="handleLogout">
            <el-icon><component :is="icons.LogOut" /></el-icon>
            退出
          </el-button>
        </div>
      </el-header>
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { auth } from '../api'
import * as icons from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const userInfo = ref(JSON.parse(localStorage.getItem('user') || '{}'))
const activeMenu = computed(() => route.path)

const pageTitles = {
  '/dashboard': '数据驾驶舱',
  '/suppliers': '供应商列表',
  '/suppliers/add': '新增供应商',
  '/products': '商品管理',
  '/orders': '订单列表',
  '/orders/add': '创建订单',
  '/deliveries': '配送管理',
  '/inspections': '验收管理',
  '/inventory': '库存列表',
  '/inventory/out': '出库登记',
  '/returns': '退换货管理',
  '/settlements': '结算管理',
  '/reconciliation': '对账管理',
  '/users': '用户列表',
  '/users/add': '新增用户',
  '/organizations': '机构管理',
  '/organizations/add': '新增机构',
  '/reports/purchase': '采购分析',
  '/reports/inventory': '库存分析',
  '/reports/analysis': '报表分析',
  '/system/settings': '系统设置',
  '/system/logs': '操作日志'
}

const pageTitle = computed(() => pageTitles[route.path] || '阳光食堂')

const handleMenuSelect = (index) => {
  router.push(index)
}

const handleLogout = async () => {
  try {
    await auth.logout()
  } finally {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }
}

const toggleSidebar = () => {
}
</script>

<style scoped>
.layout-container {
  background: #f5f7fa;
}

.layout-sidebar {
  background: #2f4050;
  color: #fff;
}

.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #1f2d3d;
}

.logo h2 {
  margin: 0;
  font-size: 18px;
}

.layout-menu {
  border-right: none;
}

.layout-header {
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toggle-btn {
  font-size: 20px;
  cursor: pointer;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  font-size: 14px;
}

.layout-main {
  padding: 20px;
  overflow-y: auto;
}
</style>