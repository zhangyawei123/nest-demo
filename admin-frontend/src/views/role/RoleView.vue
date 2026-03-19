<template>
  <div class="role-view">
    <div class="page-header">
      <h2>角色管理</h2>
      <el-button type="primary" @click="openDialog()">
        <el-icon><Plus /></el-icon>
        新增角色
      </el-button>
    </div>

    <el-card class="table-card">
      <el-table :data="roleList" v-loading="loading" style="width:100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" width="150" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column label="已分配菜单" min-width="250">
          <template #default="{ row }">
            <el-tag
              v-for="menu in row.menus"
              :key="menu.id"
              size="small"
              style="margin: 2px"
            >{{ menu.name }}</el-tag>
            <span v-if="!row.menus?.length" style="color:#c0c4cc">未分配</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openDialog(row)">编辑</el-button>
            <el-button size="small" type="warning" @click="openAssignDialog(row)">分配菜单</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑角色弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑角色' : '新增角色'" width="480px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入角色描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配菜单弹窗 -->
    <el-dialog v-model="assignDialogVisible" title="分配菜单" width="500px">
      <div class="assign-tip">为角色「{{ currentRole?.name }}」分配可访问的菜单：</div>
      <el-tree
        ref="treeRef"
        :data="allMenus"
        :props="{ label: 'name', children: 'children' }"
        show-checkbox
        node-key="id"
        default-expand-all
        :default-checked-keys="selectedMenuIds"
        class="menu-tree"
      >
        <template #default="{ node, data }">
          <span class="tree-node-label">
            <span>{{ data.name }}</span>
            <span v-if="data.path" class="tree-node-path">{{ data.path }}</span>
          </span>
        </template>
      </el-tree>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="assigning" @click="handleAssign">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getRoleList, createRole, updateRole, deleteRole, assignMenus } from '@/api/role'
import { getMenuTree } from '@/api/menu'

const loading = ref(false)
const submitting = ref(false)
const assigning = ref(false)
const dialogVisible = ref(false)
const assignDialogVisible = ref(false)
const roleList = ref<any[]>([])
const allMenus = ref<any[]>([])
const currentRole = ref<any>(null)
const selectedMenuIds = ref<number[]>([])
const treeRef = ref<any>(null)
const formRef = ref<FormInstance>()

const defaultForm = () => ({ id: 0, name: '', description: '' })
const form = ref(defaultForm())

const rules: FormRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
}

const fetchRoles = async () => {
  loading.value = true
  try {
    const res: any = await getRoleList()
    roleList.value = res || []
  } finally {
    loading.value = false
  }
}

const fetchMenus = async () => {
  const res: any = await getMenuTree()
  allMenus.value = res || []
}

const openDialog = (row?: any) => {
  form.value = row ? { id: row.id, name: row.name, description: row.description || '' } : defaultForm()
  dialogVisible.value = true
}

const handleSubmit = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (form.value.id) {
        await updateRole(form.value.id, { name: form.value.name, description: form.value.description })
        ElMessage.success('更新成功')
      } else {
        await createRole({ name: form.value.name, description: form.value.description })
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      fetchRoles()
    } finally {
      submitting.value = false
    }
  })
}

const openAssignDialog = (row: any) => {
  currentRole.value = row
  selectedMenuIds.value = (row.menus || []).map((m: any) => m.id)
  assignDialogVisible.value = true
}

const handleAssign = async () => {
  assigning.value = true
  try {
    const checkedKeys = treeRef.value.getCheckedKeys()
    const halfCheckedKeys = treeRef.value.getHalfCheckedKeys()
    const allSelectedIds = [...checkedKeys, ...halfCheckedKeys]
    await assignMenus(currentRole.value.id, allSelectedIds)
    ElMessage.success('分配成功')
    assignDialogVisible.value = false
    fetchRoles()
  } finally {
    assigning.value = false
  }
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除角色「${row.name}」吗？`, '提示', {
      type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消'
    })
    await deleteRole(row.id)
    ElMessage.success('删除成功')
    fetchRoles()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

onMounted(() => {
  fetchRoles()
  fetchMenus()
})
</script>

<style scoped>
.role-view { width: 100%; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-header h2 { margin: 0; font-size: 24px; font-weight: 600; color: #303133; }
.table-card { border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.table-card :deep(.el-card__body) { padding: 24px; }
.assign-tip { margin-bottom: 16px; color: #606266; font-size: 14px; }
.menu-tree { max-height: 400px; overflow-y: auto; border: 1px solid #dcdfe6; border-radius: 4px; padding: 8px; }
.tree-node-label { display: flex; align-items: center; gap: 8px; }
.tree-node-path { color: #909399; font-size: 12px; font-family: monospace; }
</style>
