<template>
  <div class="users-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
        </div>
      </template>

      <div class="user-info-section">
        <el-descriptions title="当前用户信息" :column="2" border>
          <el-descriptions-item label="用户ID">{{ currentUser.id }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDate(currentUser.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDate(currentUser.updatedAt) }}
          </el-descriptions-item>
        </el-descriptions>

        <div style="margin-top: 20px">
          <el-button type="primary" @click="showEditDialog">修改信息</el-button>
          <el-button type="success" @click="refreshUserInfo">刷新信息</el-button>
        </div>
      </div>
    </el-card>

    <!-- 修改用户信息对话框 -->
    <el-dialog v-model="editDialogVisible" title="修改用户信息" width="500px">
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
        <el-form-item label="新用户名" prop="username">
          <el-input
            v-model="editForm.username"
            placeholder="留空则不修改"
            clearable
          />
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="editForm.password"
            type="password"
            placeholder="留空则不修改"
            show-password
            clearable
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="editForm.confirmPassword"
            type="password"
            placeholder="再次输入新密码"
            show-password
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="submitEdit">
          确定修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { getUserDetail, updateUser } from '@/api/user'

// 当前用户信息
const currentUser = ref<any>({
  id: 0,
  username: '',
  createdAt: '',
  updatedAt: ''
})

// 编辑对话框
const editDialogVisible = ref(false)
const editFormRef = ref<FormInstance>()
const editLoading = ref(false)
const editForm = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

// 表单验证规则
const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (editForm.password && value !== editForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const editRules: FormRules = {
  username: [
    { min: 3, max: 50, message: '用户名长度为 3-50 位', trigger: 'blur' }
  ],
  password: [
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

/**
 * 格式化日期
 */
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

/**
 * 获取用户信息
 */
const fetchUserInfo = async () => {
  try {
    const userInfoStr = localStorage.getItem('userInfo')
    if (!userInfoStr) {
      ElMessage.error('未找到用户信息')
      return
    }

    const userInfo = JSON.parse(userInfoStr)
    const res: any = await getUserDetail(userInfo.id)
    currentUser.value = res
  } catch (error) {
    ElMessage.error('获取用户信息失败')
  }
}

/**
 * 刷新用户信息
 */
const refreshUserInfo = () => {
  fetchUserInfo()
  ElMessage.success('已刷新')
}

/**
 * 显示编辑对话框
 */
const showEditDialog = () => {
  editForm.username = ''
  editForm.password = ''
  editForm.confirmPassword = ''
  editDialogVisible.value = true
}

/**
 * 提交修改
 */
const submitEdit = async () => {
  if (!editFormRef.value) return

  await editFormRef.value.validate(async (valid) => {
    if (!valid) return

    // 检查是否至少填写了一项
    if (!editForm.username && !editForm.password) {
      ElMessage.warning('请至少填写一项要修改的内容')
      return
    }

    editLoading.value = true
    try {
      const updateData: any = {}
      if (editForm.username) {
        updateData.username = editForm.username
      }
      if (editForm.password) {
        updateData.password = editForm.password
      }

      const res: any = await updateUser(currentUser.value.id, updateData)
      
      ElMessage.success('修改成功')
      editDialogVisible.value = false

      // 更新本地用户信息
      if (updateData.username) {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        userInfo.username = updateData.username
        localStorage.setItem('userInfo', JSON.stringify(userInfo))
      }

      // 刷新页面数据
      await fetchUserInfo()

      // 重置表单
      editFormRef.value?.resetFields()
    } catch (error) {
      // 错误已在拦截器中处理
    } finally {
      editLoading.value = false
    }
  })
}

// 页面加载时获取用户信息
onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.users-container {
  width: 100%;
}

.users-container :deep(.el-card) {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.users-container :deep(.el-card:hover) {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.user-info-section {
  padding: 20px 0;
}

.user-info-section :deep(.el-descriptions) {
  margin-bottom: 20px;
}

.user-info-section :deep(.el-descriptions__title) {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.user-info-section :deep(.el-descriptions__label) {
  font-weight: 500;
  color: #606266;
}

.user-info-section :deep(.el-descriptions__content) {
  color: #303133;
}

.user-info-section :deep(.el-button) {
  border-radius: 6px;
  padding: 12px 24px;
  font-weight: 500;
  transition: all 0.3s;
}

.user-info-section :deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.user-info-section :deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.user-info-section :deep(.el-button--success) {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  border: none;
}

.user-info-section :deep(.el-button--success:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(67, 233, 123, 0.4);
}

/* 对话框样式 */
:deep(.el-dialog) {
  border-radius: 12px;
}

:deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  transition: all 0.3s;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #667eea inset;
}
</style>
