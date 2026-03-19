<template>
  <div class="menu-view">
    <div class="page-header">
      <h2>菜单管理</h2>
      <el-button type="primary" @click="openDialog()">
        <el-icon><Plus /></el-icon>
        新增菜单
      </el-button>
    </div>

    <el-card class="table-card">
      <el-table :data="menuList" v-loading="loading" row-key="id" default-expand-all :tree-props="{ children: 'children', hasChildren: 'hasChildren' }" style="width:100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="菜单名称" min-width="180" />
        <el-table-column prop="component" label="组件路径" min-width="200">
          <template #default="{ row }">
            <span v-if="row.component" style="font-family:monospace;font-size:12px;color:#606266">{{ row.component }}</span>
            <span v-else style="color:#c0c4cc">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" min-width="150" />
        <el-table-column label="图标" width="100">
          <template #default="{ row }">
            <span v-if="row.icon">{{ row.icon }}</span>
            <span v-else style="color:#c0c4cc">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="显示" width="100">
          <template #default="{ row }">
            <el-tag :type="row.visible ? 'success' : 'info'" size="small">
              {{ row.visible ? '显示' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑菜单' : '新增菜单'" width="480px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-form-item label="父菜单">
          <el-tree-select
            v-model="form.parentId"
            :data="menuList"
            :props="{ label: 'name', value: 'id' }"
            check-strictly
            clearable
            placeholder="选择父菜单（不选则为顶级）"
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="form.name" placeholder="如：文章管理" />
        </el-form-item>
        <el-form-item label="路由路径">
          <el-input v-model="form.path" placeholder="如：/articles" />
        </el-form-item>
        <el-form-item label="组件路径">
          <el-input v-model="form.component" placeholder="如：article/ArticleListView" />
          <div style="font-size:12px;color:#909399;margin-top:4px">相对于 @/views/ 的路径，不含 .vue</div>
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="form.icon" placeholder="如：Document" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model.number="form.sort" :min="0" :max="999" style="width:120px" />
        </el-form-item>
        <el-form-item label="是否显示">
          <el-switch v-model="form.visible" />
          <div style="font-size:12px;color:#909399;margin-top:4px">隐藏后不在侧边栏显示，但路由仍可访问</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getMenuTree, createMenu, updateMenu, deleteMenu } from '@/api/menu'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const menuList = ref<any[]>([])
const formRef = ref<FormInstance>()

const defaultForm = () => ({ id: 0, name: '', path: '', component: '', icon: '', sort: 0, visible: true, parentId: null })
const form = ref(defaultForm())

const rules: FormRules = {
  name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }]
}

const fetchMenus = async () => {
  loading.value = true
  try {
    const res: any = await getMenuTree()
    menuList.value = res || []
  } finally {
    loading.value = false
  }
}

const flattenMenus = (menus: any[]): any[] => {
  const result: any[] = []
  const flatten = (list: any[]) => {
    list.forEach(item => {
      result.push(item)
      if (item.children && item.children.length) {
        flatten(item.children)
      }
    })
  }
  flatten(menus)
  return result
}

const openDialog = (row?: any) => {
  if (row) {
    form.value = { ...row }
  } else {
    form.value = defaultForm()
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const payload = {
        name: form.value.name,
        path: form.value.path,
        component: form.value.component,
        icon: form.value.icon,
        sort: Number(form.value.sort || 0),
        visible: form.value.visible,
        parentId: form.value.parentId || null
      }
      if (form.value.id) {
        await updateMenu(form.value.id, payload)
        ElMessage.success('更新成功')
      } else {
        await createMenu(payload)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      fetchMenus()
    } finally {
      submitting.value = false
    }
  })
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除菜单「${row.name}」吗？`, '提示', {
      type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消'
    })
    await deleteMenu(row.id)
    ElMessage.success('删除成功')
    fetchMenus()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

onMounted(fetchMenus)
</script>

<style scoped>
.menu-view { width: 100%; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-header h2 { margin: 0; font-size: 24px; font-weight: 600; color: #303133; }
.table-card { border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.table-card :deep(.el-card__body) { padding: 24px; }
</style>
