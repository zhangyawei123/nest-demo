import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getMyMenus } from '@/api/user'
import router from '@/router'

// 使用 Vite 的 glob import 预加载所有视图组件
const modules = import.meta.glob('@/views/**/*.vue')

// 根据组件路径获取对应的加载器
function loadComponent(componentPath: string) {
  const path = `/src/views/${componentPath}.vue`
  const loader = modules[path]
  if (!loader) {
    console.error(`组件未找到: ${path}`)
    console.log('可用组件:', Object.keys(modules))
    return null
  }
  return loader
}

export const useMenuStore = defineStore('menu', () => {
  const menus = ref<any[]>([])
  const loaded = ref(false)

  async function loadMenus() {
    if (loaded.value) return
    try {
      const data: any = await getMyMenus()
      menus.value = data || []
      registerRoutes(menus.value)
      loaded.value = true
    } catch (e) {
      menus.value = []
    }
  }

  function registerRoutes(menuList: any[]) {
    menuList.forEach((menu) => {
      registerMenuRoute(menu)
    })
  }

  function registerMenuRoute(menu: any) {
    if (!menu.component) return

    // 动态加载组件
    const loader = loadComponent(menu.component)
    if (!loader) {
      console.warn(`组件加载失败: ${menu.component}`)
      return
    }

    // 计算路由路径
    let routePath = menu.path || ''
    if (routePath === '/') {
      routePath = 'dashboard'
    } else if (routePath.startsWith('/')) {
      routePath = routePath.substring(1)
    }

    // 避免重复注册
    const existing = router.getRoutes().find(r => r.name === menu.name)
    if (existing) return

    // 构建路由配置
    const routeConfig: any = {
      path: routePath,
      name: menu.name,
      component: loader,
    }

    // 如果有子菜单，注册为嵌套路由
    if (menu.children && menu.children.length > 0) {
      routeConfig.children = []
      menu.children.forEach((child: any) => {
        if (!child.component) return
        const childLoader = loadComponent(child.component)
        if (!childLoader) {
          console.warn(`子组件加载失败: ${child.component}`)
          return
        }
        
        // 子路由路径是相对父路由的
        let childPath = child.path || ''
        if (childPath.startsWith('/')) {
          // 如果是绝对路径，提取相对部分
          const parentPath = menu.path
          if (childPath.startsWith(parentPath + '/')) {
            childPath = childPath.substring(parentPath.length + 1)
          }
        }
        
        routeConfig.children.push({
          path: childPath,
          name: child.name,
          component: childLoader,
        })
      })
    }

    router.addRoute('home', routeConfig)
  }

  function reset() {
    menus.value = []
    loaded.value = false
  }

  return { menus, loaded, loadMenus, reset }
})
