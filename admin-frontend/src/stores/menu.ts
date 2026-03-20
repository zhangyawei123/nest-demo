import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getMyMenus } from '@/api/user'
import router from '@/router'
import RouterLayout from '@/components/RouterLayout.vue'

// 使用 Vite 的 glob import 预加载所有视图组件
// @/views glob 的 key 格式为 /src/views/xxx.vue
const modules = import.meta.glob('/src/views/**/*.vue')

function loadComponent(componentPath: string) {
  const key = `/src/views/${componentPath}.vue`
  const loader = modules[key]
  if (!loader) {
    console.warn(`组件未找到: ${key}`)
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

    const hasChildren = menu.children && menu.children.length > 0

    if (hasChildren) {
      // 父菜单使用 RouterLayout 容器，自身组件作为空路径默认子路由
      const children: any[] = [
        { path: '', name: menu.name, component: loader },
      ]

      menu.children.forEach((child: any) => {
        if (!child.component) return
        const childLoader = loadComponent(child.component)
        if (!childLoader) {
          console.warn(`子组件加载失败: ${child.component}`)
          return
        }
        // 子路由路径是相对父路由的
        let childPath = child.path || ''
        if (childPath.startsWith(menu.path + '/')) {
          childPath = childPath.substring(menu.path.length + 1)
        } else if (childPath.startsWith('/')) {
          childPath = childPath.substring(1)
        }
        children.push({
          path: childPath,
          name: child.name,
          component: childLoader,
        })
      })

      router.addRoute('home', {
        path: routePath,
        name: menu.name + '_layout',
        component: RouterLayout,
        children,
      })
    } else {
      router.addRoute('home', {
        path: routePath,
        name: menu.name,
        component: loader,
      })
    }
  }

  function reset() {
    menus.value = []
    loaded.value = false
  }

  return { menus, loaded, loadMenus, reset }
})
