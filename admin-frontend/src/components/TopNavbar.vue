<template>
  <el-header class="navbar">
    <div class="navbar-content">
      <div class="navbar-left">
        <div class="navbar-panel">
          <div class="navbar-kicker">Workspace Navigation</div>
          <div class="breadcrumb-row">
            <el-breadcrumb separator="/" class="breadcrumb">
              <el-breadcrumb-item :to="{ path: '/dashboard' }">
                <el-icon><HomeFilled /></el-icon>
                首页
              </el-breadcrumb-item>
              <el-breadcrumb-item v-if="props.currentRouteName">
                {{ props.currentRouteName }}
              </el-breadcrumb-item>
            </el-breadcrumb>
            <div class="page-indicator">{{ displayRouteName }}</div>
          </div>
        </div>
      </div>

      <div class="navbar-right">
        <div class="route-chip">
          <span class="route-chip-label">当前页面</span>
          <span class="route-chip-value">{{ displayRouteName }}</span>
        </div>
        <el-dropdown @command="handleCommand" trigger="click">
          <div class="user-avatar">
            <div class="avatar-shell">
              <el-avatar :size="38" class="avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
            </div>
            <div class="user-meta">
              <span class="user-greeting">欢迎回来</span>
              <span class="username">{{ props.username || '管理员' }}</span>
            </div>
            <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon>
                个人中心
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </el-header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { HomeFilled, User, ArrowDown, SwitchButton } from '@element-plus/icons-vue'

const props = withDefaults(defineProps<{
  currentRouteName?: string
  username?: string
}>(), {
  currentRouteName: '',
  username: '',
})

const emit = defineEmits<{
  (e: 'command', command: 'profile' | 'logout'): void
}>()

const displayRouteName = computed(() => props.currentRouteName || '控制台')

const handleCommand = (command: string | number | object) => {
  if (command === 'profile' || command === 'logout') {
    emit('command', command)
  }
}
</script>

<style scoped>
.navbar {
  padding: 18px 20px 0;
  height: auto !important;
  background: transparent;
}

.navbar-content {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 18px;
  border-radius: 28px;
  border: 1px solid rgba(122, 160, 211, 0.16);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(245, 249, 255, 0.96));
  box-shadow:
    0 18px 38px rgba(95, 124, 170, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.94);
}

.navbar-left {
  flex: 1;
  min-width: 0;
}

.navbar-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.navbar-kicker {
  color: #8ca0bc;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.breadcrumb-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.breadcrumb {
  min-width: 0;
  font-size: 14px;
}

.breadcrumb :deep(.el-breadcrumb__item) {
  display: flex;
  align-items: center;
}

.breadcrumb :deep(.el-breadcrumb__inner) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #6c84a8;
  font-weight: 600;
}

.breadcrumb :deep(.el-breadcrumb__inner.is-link),
.breadcrumb :deep(.el-breadcrumb__inner a) {
  color: #41638f;
}

.breadcrumb :deep(.el-breadcrumb__separator) {
  color: #a6b7cf;
}

.breadcrumb :deep(.el-icon) {
  margin-right: 0;
}

.page-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(47, 145, 255, 0.12), rgba(124, 77, 255, 0.12));
  color: #2f69d0;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.route-chip {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(122, 160, 211, 0.14);
  box-shadow: 0 10px 22px rgba(91, 119, 164, 0.08);
}

.route-chip-label {
  color: #8ca0bc;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.route-chip-value {
  color: #294063;
  font-size: 14px;
  font-weight: 700;
}

.user-avatar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px 8px 8px;
  border-radius: 22px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
  border: 1px solid rgba(122, 160, 211, 0.16);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(243, 248, 255, 0.98));
  box-shadow:
    0 12px 24px rgba(95, 124, 170, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.96);
}

.user-avatar:hover {
  transform: translateY(-1px);
  border-color: rgba(95, 148, 226, 0.24);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(238, 245, 255, 1));
  box-shadow:
    0 16px 28px rgba(95, 124, 170, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.98);
}

.avatar-shell {
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(47, 145, 255, 0.14), rgba(124, 77, 255, 0.18));
}

.avatar {
  background: linear-gradient(135deg, #2f91ff 0%, #7c4dff 100%);
  box-shadow: 0 12px 22px rgba(66, 121, 255, 0.28);
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-greeting {
  color: #8ca0bc;
  font-size: 11px;
  font-weight: 700;
}

.username {
  font-size: 14px;
  color: #243755;
  font-weight: 700;
  white-space: nowrap;
}

.dropdown-icon {
  font-size: 12px;
  color: #8ca0bc;
  transition: transform 0.3s;
}

.user-avatar:hover .dropdown-icon {
  transform: rotate(180deg);
}

@media (max-width: 900px) {
  .navbar-content,
  .breadcrumb-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .navbar-right {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 640px) {
  .navbar {
    padding: 14px 14px 0;
  }

  .navbar-content {
    padding: 14px;
    border-radius: 22px;
  }

  .route-chip {
    display: none;
  }

  .user-meta {
    max-width: 120px;
  }

  .username {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
