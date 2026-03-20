import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { requiresAuth: true },
      redirect: '/dashboard',
      children: [
        {
          path: 'profile',
          name: 'profile',
          component: () => import('../views/user/UsersView.vue'),
          meta: { requiresAuth: true }
        }
      ]
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token')

  // 未登录只能访问登录页
  if (!token) {
    if (to.path === '/login') return next()
    ElMessage.warning('请先登录')
    return next('/login')
  }

  // 已登录访问登录页，跳首页
  if (to.path === '/login') {
    return next('/dashboard')
  }

  // 有 token：确保动态路由已注册
  const { useMenuStore } = await import('@/stores/menu')
  const menuStore = useMenuStore()
  if (!menuStore.loaded) {
    await menuStore.loadMenus()
    // 注册完成后重新导航，让新路由生效
    return next({ ...to, replace: true })
  }

  return next()
})

export default router
