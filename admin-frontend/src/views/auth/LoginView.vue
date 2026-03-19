<template>
  <div class="login-container">
    <!-- 左侧装饰区 -->
    <div class="login-banner">
      <div class="banner-content">
        <h1 class="banner-title">后台管理系统</h1>
        <p class="banner-desc">基于 Vue 3 + Element Plus + NestJS 构建的现代化管理平台</p>
        <div class="banner-features">
          <div class="feature-item">
            <el-icon class="feature-icon"><CircleCheck /></el-icon>
            <span>快速开发</span>
          </div>
          <div class="feature-item">
            <el-icon class="feature-icon"><Lock /></el-icon>
            <span>安全可靠</span>
          </div>
          <div class="feature-item">
            <el-icon class="feature-icon"><TrendCharts /></el-icon>
            <span>数据可视化</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧登录表单 -->
    <div class="login-form-wrapper">
      <div class="login-form-container">
        <div class="login-header">
          <h2>欢迎登录</h2>
          <p>请输入您的账号信息</p>
        </div>

        <el-form :model="loginForm" :rules="rules" ref="loginFormRef" class="login-form">
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="用户名"
              size="large"
              clearable
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="密码"
              size="large"
              show-password
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="captchaCode">
            <div class="captcha-wrapper">
              <el-input
                v-model="loginForm.captchaCode"
                placeholder="验证码"
                size="large"
                clearable
                @keyup.enter="handleLogin"
              >
                <template #prefix>
                  <el-icon><Picture /></el-icon>
                </template>
              </el-input>
              <div class="captcha-box" @click="refreshCaptcha" v-html="captchaSvg"></div>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="login-btn"
              :loading="loading"
              @click="handleLogin"
            >
              登 录
            </el-button>
          </el-form-item>

          <div class="login-footer">
            <el-link type="primary" @click="handleRegister">还没有账号？立即注册</el-link>
          </div>
        </el-form>
      </div>
    </div>

    <!-- 注册对话框 -->
    <el-dialog v-model="registerDialogVisible" title="用户注册" width="400px">
      <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="3-50位字符" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="至少6位"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="再次输入密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="registerDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="registerLoading" @click="submitRegister">
          注册
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, Picture, CircleCheck, TrendCharts } from '@element-plus/icons-vue'
import { getCaptcha, login, register } from '@/api/auth'
import { md5 } from 'js-md5'

const router = useRouter()

// 登录表单
const loginFormRef = ref<FormInstance>()
const loginForm = reactive({
  username: '',
  password: '',
  captchaCode: '',
  captchaId: ''
})

// 验证码相关
const captchaSvg = ref('')

// 加载状态
const loading = ref(false)

// 表单验证规则
const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captchaCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

// 注册相关
const registerDialogVisible = ref(false)
const registerFormRef = ref<FormInstance>()
const registerLoading = ref(false)
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度为 3-50 位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

/**
 * 获取验证码
 */
const refreshCaptcha = async () => {
  try {
    const res: any = await getCaptcha()
    captchaSvg.value = res.svg
    loginForm.captchaId = res.captchaId
  } catch (error) {
    ElMessage.error('获取验证码失败')
  }
}

/**
 * 登录
 */
const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const res: any = await login({
        username: loginForm.username,
        password: md5(loginForm.password), // MD5 加密密码
        captchaId: loginForm.captchaId,
        captchaCode: loginForm.captchaCode
      })

      // 保存 token 和用户信息（响应拦截器已自动提取 data）
      localStorage.setItem('token', res.access_token)
      localStorage.setItem('userInfo', JSON.stringify(res.user))

      ElMessage.success('登录成功')
      router.push('/dashboard')
    } catch (error: any) {
      // 登录失败，刷新验证码
      refreshCaptcha()
      loginForm.captchaCode = ''
    } finally {
      loading.value = false
    }
  })
}

/**
 * 打开注册对话框
 */
const handleRegister = () => {
  registerDialogVisible.value = true
}

/**
 * 提交注册
 */
const submitRegister = async () => {
  if (!registerFormRef.value) return

  await registerFormRef.value.validate(async (valid) => {
    if (!valid) return

    registerLoading.value = true
    try {
      await register({
        username: registerForm.username,
        password: md5(registerForm.password) // MD5 加密密码
      })

      ElMessage.success('注册成功，请登录')
      registerDialogVisible.value = false

      // 自动填充用户名
      loginForm.username = registerForm.username
      loginForm.password = ''

      // 重置注册表单
      registerFormRef.value?.resetFields()
    } catch (error) {
      // 错误已在拦截器中处理
    } finally {
      registerLoading.value = false
    }
  })
}

// 页面加载时获取验证码
onMounted(() => {
  refreshCaptcha()
})
</script>

<style scoped>
.login-container {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

/* 左侧装饰区 */
.login-banner {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-banner::before {
  content: '';
  position: absolute;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: drift 20s linear infinite;
}

@keyframes drift {
  from {
    transform: translate(0, 0);
  }
  to {
    transform: translate(50px, 50px);
  }
}

.banner-content {
  position: relative;
  z-index: 1;
  color: #fff;
  text-align: center;
  padding: 40px;
  max-width: 500px;
}

.banner-title {
  font-size: 48px;
  font-weight: 600;
  margin-bottom: 20px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.banner-desc {
  font-size: 18px;
  margin-bottom: 50px;
  opacity: 0.95;
  line-height: 1.6;
}

.banner-features {
  display: flex;
  gap: 30px;
  justify-content: center;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.feature-icon {
  font-size: 32px;
  background: rgba(255, 255, 255, 0.2);
  padding: 15px;
  border-radius: 50%;
  backdrop-filter: blur(10px);
}

.feature-item span {
  font-size: 14px;
  opacity: 0.9;
}

/* 右侧表单区 */
.login-form-wrapper {
  width: 500px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: -5px 0 20px rgba(0, 0, 0, 0.1);
}

.login-form-container {
  width: 100%;
  max-width: 380px;
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header h2 {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.login-header p {
  font-size: 14px;
  color: #909399;
}

.login-form {
  margin-top: 30px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

.login-form :deep(.el-input__wrapper) {
  padding: 12px 15px;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  transition: all 0.3s;
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset;
}

.captcha-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.captcha-wrapper .el-input {
  flex: 1;
}

.captcha-box {
  width: 120px;
  height: 40px;
  cursor: pointer;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  transition: all 0.3s;
  overflow: hidden;
}

.captcha-box:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

.captcha-box :deep(svg) {
  width: 100%;
  height: 100%;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  margin-top: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.login-footer {
  text-align: center;
  margin-top: 20px;
}

/* 响应式 */
@media (max-width: 768px) {
  .login-banner {
    display: none;
  }
  
  .login-form-wrapper {
    width: 100%;
  }
}
</style>
