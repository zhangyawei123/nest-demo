<template>
  <el-aside width="248px" class="sidebar">
    <div class="sidebar-shell">
      <div class="sidebar-top">
        <div class="logo-container">
          <div class="logo-icon">
            <div class="logo-icon-core">
              <el-icon><Platform /></el-icon>
            </div>
          </div>
          <div class="logo-content">
            <h2 class="logo-title">NEBULA</h2>
            <p class="logo-subtitle">CREATIVE CONSOLE</p>
          </div>
        </div>

        <div class="nav-caption">
          <span class="nav-caption-dot"></span>
          <span>Creative Navigation</span>
        </div>
      </div>

      <el-scrollbar class="sidebar-scrollbar">
        <el-menu
          :default-active="activeMenu"
          router
          :unique-opened="true"
          class="sidebar-menu"
        >
          <template v-for="menu in visibleMenus" :key="menu.id">
            <el-sub-menu
              v-if="visibleChildren(menu).length"
              :index="'sub-' + menu.id"
            >
              <template #title>
                <el-icon v-if="menu.icon && iconMap[menu.icon]">
                  <component :is="iconMap[menu.icon]" />
                </el-icon>
                <span class="menu-label">{{ menu.name }}</span>
              </template>
              <el-menu-item
                v-for="child in visibleChildren(menu)"
                :key="child.id"
                :index="child.path"
                class="menu-item"
              >
                <el-icon v-if="child.icon && iconMap[child.icon]">
                  <component :is="iconMap[child.icon]" />
                </el-icon>
                <span class="menu-label">{{ child.name }}</span>
              </el-menu-item>
            </el-sub-menu>
            <el-menu-item
              v-else
              :index="menu.path === '/' ? '/dashboard' : menu.path"
              class="menu-item"
            >
              <el-icon v-if="menu.icon && iconMap[menu.icon]">
                <component :is="iconMap[menu.icon]" />
              </el-icon>
              <span class="menu-label">{{ menu.name }}</span>
            </el-menu-item>
          </template>
        </el-menu>
      </el-scrollbar>

      <div class="sidebar-footer">
        <div class="footer-card footer-card-left">
          <span class="footer-label">THEME</span>
          <span class="footer-value">BRIGHT</span>
        </div>
        <div class="footer-card footer-card-right">
          <span class="footer-label">NAVS</span>
          <span class="footer-value">{{ visibleMenus.length }}</span>
        </div>
      </div>
    </div>
  </el-aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Platform, HomeFilled, Document, User, UserFilled, Grid, Setting, Opportunity, VideoPlay, Bell, Memo, ChatDotRound, More, Tools, Trophy, Money, TrendCharts } from '@element-plus/icons-vue'
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
  More,
  Tools,
  Trophy,
  Money,
  TrendCharts,
}

const activeMenu = computed(() => route.path)
const visibleMenus = computed(() => menuStore.menus.filter((m: any) => m.visible !== false))
const visibleChildren = (menu: any) =>
  (menu.children || []).filter((c: any) => c.visible !== false)
</script>

<style scoped>
.sidebar {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(102, 170, 255, 0.2), transparent 34%),
    radial-gradient(circle at bottom right, rgba(160, 130, 255, 0.16), transparent 28%),
    linear-gradient(180deg, #f8fbff 0%, #f3f7ff 42%, #eef3ff 100%);
  border-right: 1px solid rgba(86, 124, 178, 0.12);
  box-shadow: 18px 0 40px rgba(71, 104, 153, 0.12);
}

.sidebar::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(132, 170, 225, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(132, 170, 225, 0.1) 1px, transparent 1px);
  background-size: 30px 30px;
  opacity: 0.45;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.35), transparent 92%);
}

.sidebar-shell {
  position: relative;
  z-index: 1;
  height: 100%;
  padding: 16px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sidebar-top {
  padding: 10px 8px 0;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 14px;
  border-radius: 22px;
  border: 1px solid rgba(121, 152, 196, 0.16);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(247, 250, 255, 0.9));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 14px 32px rgba(72, 106, 160, 0.1);
}

.logo-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(87, 166, 255, 0.16), rgba(139, 92, 246, 0.14));
  box-shadow: inset 0 0 24px rgba(87, 166, 255, 0.12);
}

.logo-icon-core {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  background: linear-gradient(135deg, #2f91ff 0%, #7c4dff 100%);
  box-shadow: 0 10px 24px rgba(47, 145, 255, 0.38);
}

.logo-content {
  min-width: 0;
}

.logo-title {
  color: #22324c;
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.12em;
}

.logo-subtitle {
  margin: 6px 0 0;
  color: #7b8ca8;
  font-size: 11px;
  letter-spacing: 0.22em;
}

.nav-caption {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 14px 10px 0;
  padding: 0 8px;
  color: #7f91ae;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.nav-caption-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4c9dff;
  box-shadow: 0 0 10px rgba(76, 157, 255, 0.45);
}

.sidebar-scrollbar {
  flex: 1;
  overflow: hidden;
  padding: 0 4px;
}

.sidebar-menu {
  background: transparent;
  border: none;
  padding: 6px 0 12px;
}

.sidebar-menu :deep(.el-menu-item) {
  position: relative;
  color: #4a5972;
  border-radius: 16px;
  margin: 6px 6px;
  height: 48px;
  line-height: 48px;
  border: 1px solid transparent;
  transition: all 0.25s ease;
  overflow: hidden;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.78);
  border-color: rgba(122, 160, 211, 0.18);
  color: #2558b8;
  transform: translateX(2px);
  box-shadow: 0 10px 22px rgba(93, 121, 168, 0.08);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(245, 249, 255, 0.98) 100%);
  border-color: rgba(112, 154, 222, 0.24);
  color: #1f57bd;
  box-shadow: 0 14px 30px rgba(90, 126, 187, 0.14);
}

.sidebar-menu :deep(.el-menu-item.is-active)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 0 999px 999px 0;
  background: linear-gradient(180deg, #2f91ff 0%, #7c4dff 100%);
}

.sidebar-menu :deep(.el-menu-item .el-icon),
.sidebar-menu :deep(.el-sub-menu__title .el-icon) {
  font-size: 18px;
  margin-right: 10px;
}

.sidebar-menu :deep(.el-sub-menu__title) {
  position: relative;
  color: #4a5972;
  border-radius: 16px;
  margin: 6px 6px;
  height: 48px;
  line-height: 48px;
  border: 1px solid transparent;
  transition: all 0.25s ease;
}

.sidebar-menu :deep(.el-sub-menu__title:hover) {
  background: rgba(255, 255, 255, 0.78);
  border-color: rgba(122, 160, 211, 0.18);
  color: #2558b8;
  transform: translateX(2px);
  box-shadow: 0 10px 22px rgba(93, 121, 168, 0.08);
}

.sidebar-menu :deep(.el-sub-menu .el-menu) {
  background: transparent;
}

.sidebar-menu :deep(.el-sub-menu .el-menu-item) {
  margin-left: 18px;
  padding-left: 44px !important;
  height: 44px;
  line-height: 44px;
}

.sidebar-menu :deep(.el-sub-menu.is-opened > .el-sub-menu__title) {
  color: #2558b8;
  background: rgba(255, 255, 255, 0.82);
  border-color: rgba(122, 160, 211, 0.18);
}

.menu-label {
  font-weight: 600;
  letter-spacing: 0.02em;
}

.sidebar-footer {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 0 6px 4px;
}

.footer-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid rgba(121, 152, 196, 0.16);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(245, 249, 255, 0.92));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 10px 20px rgba(92, 118, 162, 0.08);
}

.footer-label {
  color: #7f91ae;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
}

.footer-value {
  color: #243755;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.footer-online {
  color: #2f91ff;
  text-shadow: 0 0 12px rgba(47, 145, 255, 0.18);
}
</style>
