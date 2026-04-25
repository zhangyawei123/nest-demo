<template>
  <el-container class="layout-container">
    <!-- 侧边栏独立组件 -->
    <Sidebar />

    <!-- 主内容区 -->
    <el-container class="main-container" direction="vertical">
      <!-- 顶部导航栏 -->
      <TopNavbar
        :current-route-name="currentRouteName"
        :username="userInfo.username"
        @command="handleCommand"
      />

      <!-- 内容区 -->
      <el-main class="main-content">
        <div class="content-wrapper">
          <router-view v-slot="{ Component }">
            <transition name="fade-transform" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import Sidebar from '@/components/Sidebar.vue'
import TopNavbar from '@/components/TopNavbar.vue'
import { useMenuStore } from '@/stores/menu'
import { getActiveNotices } from '@/api/notice'

const router = useRouter()
const route = useRoute()
const menuStore = useMenuStore()

const currentRouteName = computed(() => {
  if (route.path === '/profile') {
    return '个人中心'
  }
  const matched = menuStore.menus.find((m: any) => m.path === route.path)
  return matched?.name || ''
})

const userInfo = ref({ username: '' })

const handleCommand = (command: string) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      menuStore.reset()
      ElMessage.success('已退出登录')
      router.push('/login')
    })
  } else if (command === 'profile') {
    router.push('/profile')
  }
}

const escapeHtml = (str: string) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const showNotices = async () => {
  try {
    const list: any = await getActiveNotices()
    if (!list?.length) return
    const noticeKey = 'noticed_at'
    const last = localStorage.getItem(noticeKey)
    const today = new Date().toDateString()
    if (last === today) return
    localStorage.setItem(noticeKey, today)
    const html = list
      .map((n: any) => `<div style="margin-bottom:10px"><strong>${escapeHtml(n.title)}</strong><p style="margin:4px 0 0;color:#606266;font-size:13px">${escapeHtml(n.content)}</p></div>`)
      .join('')
    ElMessageBox.alert(html, '系统公告', { dangerouslyUseHTMLString: true, confirmButtonText: '知道了' })
  } catch {}
}

onMounted(() => {
  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    userInfo.value = JSON.parse(userInfoStr)
  }
  showNotices()
})
</script>

<style scoped>
.layout-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.main-container {
  background:
    radial-gradient(circle at top left, rgba(47, 145, 255, 0.08), transparent 30%),
    linear-gradient(180deg, #f7faff 0%, #f2f6fd 100%);
}

.main-content {
  padding: 20px;
  overflow-y: auto;
  height: calc(100vh - 110px);
}

.content-wrapper { min-height: 100%; }

.fade-transform-enter-active,
.fade-transform-leave-active { transition: all 0.3s; }

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

@media (max-width: 900px) {
  .main-content {
    height: calc(100vh - 154px);
  }
}

@media (max-width: 640px) {
  .main-content {
    padding: 16px;
  }
}
</style>
