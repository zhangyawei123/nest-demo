<template>
  <el-aside width="220px" class="sidebar">
    <div class="logo-container">
      <div class="logo-icon">
        <el-icon><Platform /></el-icon>
      </div>
      <h2 class="logo-title">Admin</h2>
    </div>

    <el-scrollbar class="sidebar-scrollbar">
      <el-menu
        :default-active="activeMenu"
        router
        :unique-opened="true"
        class="sidebar-menu"
      >
        <template v-for="menu in visibleMenus" :key="menu.id">
          <el-menu-item :index="menu.path === '/' ? '/dashboard' : menu.path" class="menu-item">
            <el-icon v-if="menu.icon && iconMap[menu.icon]">
              <component :is="iconMap[menu.icon]" />
            </el-icon>
            <span>{{ menu.name }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>
  </el-aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Platform, HomeFilled, Document, User, UserFilled, Grid, Setting, Opportunity, VideoPlay, Bell, Memo, ChatDotRound } from '@element-plus/icons-vue'
import { useMenuStore } from '@/stores/menu'

const route = useRoute()
const menuStore = useMenuStore()

// 图标映射表
const iconMap: Record<string, any> = {
  Platform,
  HomeFilled,
  Document,
  User,
  UserFilled,
  Grid,
  Setting,
  Opportunity,
  VideoPlay,
  Bell,
  Memo,
  ChatDotRound,
}

const activeMenu = computed(() => route.path)
const visibleMenus = computed(() => menuStore.menus.filter((m: any) => m.visible !== false))
</script>

<style scoped>
.sidebar {
  background: linear-gradient(180deg, #1a1f35 0%, #252b45 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.logo-title {
  color: white;
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.5px;
}

.sidebar-scrollbar {
  flex: 1;
  overflow: hidden;
}

.sidebar-menu {
  background: transparent;
  border: none;
  padding: 8px 0;
}

.sidebar-menu :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.65);
  border-radius: 8px;
  margin: 2px 10px;
  height: 44px;
  line-height: 44px;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.sidebar-menu :deep(.el-menu-item .el-icon) {
  font-size: 18px;
  margin-right: 10px;
}
</style>
