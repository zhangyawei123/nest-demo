<template>
  <div class="login-container">
    <canvas ref="canvasRef" class="login-canvas" aria-hidden="true"></canvas>
    <div class="login-atmosphere"></div>

    <main class="login-shell">
      <section class="login-hero">
        <div class="brand-mark">
          <span>S</span>
        </div>
        <div class="hero-copy">
          <p class="hero-kicker">Syue Admin</p>
          <h1>后台管理系统</h1>
          <p class="hero-desc">统一管理内容、AI 工具、积分和小游戏模块。</p>
        </div>

        <div class="hero-metrics">
          <div class="metric-item">
            <strong>Vue 3</strong>
            <span>前端体验</span>
          </div>
          <div class="metric-item">
            <strong>NestJS</strong>
            <span>接口服务</span>
          </div>
          <div class="metric-item">
            <strong>HTTPS</strong>
            <span>安全访问</span>
          </div>
        </div>
      </section>

      <section class="login-form-wrapper">
        <div class="form-glow"></div>
        <div class="login-header">
          <span class="login-kicker">Account Access</span>
          <h2>欢迎登录</h2>
          <p>请输入账号信息进入管理后台。</p>
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
              进入后台
            </el-button>
          </el-form-item>

          <div class="login-footer">
            <span>还没有账号？</span>
            <el-link type="primary" @click="handleRegister">立即注册</el-link>
          </div>
        </el-form>
      </section>
    </main>

    <!-- 注册对话框 -->
    <el-dialog v-model="registerDialogVisible" title="用户注册" width="400px" class="register-dialog">
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
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, Picture } from '@element-plus/icons-vue'
import { getCaptcha, login, register } from '@/api/auth'
import { md5 } from 'js-md5'

const router = useRouter()
const canvasRef = ref<HTMLCanvasElement>()

interface LoginParticle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  alpha: number
}

let animationFrame = 0
let particles: LoginParticle[] = []
const pointer = {
  x: 0,
  y: 0,
  active: false
}

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

const createParticles = (width: number, height: number) => {
  const count = Math.min(96, Math.max(48, Math.floor((width * height) / 18000)))
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.38,
    vy: (Math.random() - 0.5) * 0.38,
    radius: Math.random() * 1.8 + 0.8,
    alpha: Math.random() * 0.35 + 0.3
  }))
}

const resizeCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const width = window.innerWidth
  const height = window.innerHeight
  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  const context = canvas.getContext('2d')
  if (!context) return
  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  createParticles(width, height)
}

const drawLoginCanvas = () => {
  const canvas = canvasRef.value
  const context = canvas?.getContext('2d')
  if (!canvas || !context) return

  const width = window.innerWidth
  const height = window.innerHeight
  context.clearRect(0, 0, width, height)

  const gradient = context.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#f7faff')
  gradient.addColorStop(0.5, '#eef5ff')
  gradient.addColorStop(1, '#f4f0ff')
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)

  const halo = context.createRadialGradient(width * 0.22, height * 0.18, 0, width * 0.22, height * 0.18, width * 0.42)
  halo.addColorStop(0, 'rgba(47, 145, 255, 0.18)')
  halo.addColorStop(1, 'rgba(47, 145, 255, 0)')
  context.fillStyle = halo
  context.fillRect(0, 0, width, height)

  const secondHalo = context.createRadialGradient(width * 0.78, height * 0.8, 0, width * 0.78, height * 0.8, width * 0.36)
  secondHalo.addColorStop(0, 'rgba(124, 77, 255, 0.12)')
  secondHalo.addColorStop(1, 'rgba(124, 77, 255, 0)')
  context.fillStyle = secondHalo
  context.fillRect(0, 0, width, height)

  particles.forEach((particle) => {
    if (pointer.active) {
      const dx = pointer.x - particle.x
      const dy = pointer.y - particle.y
      const distance = Math.hypot(dx, dy)
      if (distance < 170 && distance > 0) {
        particle.vx -= (dx / distance) * 0.008
        particle.vy -= (dy / distance) * 0.008
      }
    }

    particle.x += particle.vx
    particle.y += particle.vy
    particle.vx *= 0.992
    particle.vy *= 0.992

    if (particle.x < -20) particle.x = width + 20
    if (particle.x > width + 20) particle.x = -20
    if (particle.y < -20) particle.y = height + 20
    if (particle.y > height + 20) particle.y = -20

    context.beginPath()
    context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
    context.fillStyle = `rgba(47, 145, 255, ${particle.alpha * 0.72})`
    context.fill()
  })

  for (let index = 0; index < particles.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < particles.length; nextIndex += 1) {
      const current = particles[index]!
      const next = particles[nextIndex]!
      const distance = Math.hypot(current.x - next.x, current.y - next.y)
      if (distance > 132) continue
      context.beginPath()
      context.moveTo(current.x, current.y)
      context.lineTo(next.x, next.y)
      context.strokeStyle = `rgba(124, 77, 255, ${(1 - distance / 132) * 0.16})`
      context.lineWidth = 1
      context.stroke()
    }
  }

  animationFrame = window.requestAnimationFrame(drawLoginCanvas)
}

const handlePointerMove = (event: PointerEvent) => {
  pointer.x = event.clientX
  pointer.y = event.clientY
  pointer.active = true
}

const handlePointerLeave = () => {
  pointer.active = false
}

const startCanvas = () => {
  resizeCanvas()
  window.cancelAnimationFrame(animationFrame)
  animationFrame = window.requestAnimationFrame(drawLoginCanvas)
  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerleave', handlePointerLeave)
}

const stopCanvas = () => {
  window.cancelAnimationFrame(animationFrame)
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerleave', handlePointerLeave)
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
  startCanvas()
})

onBeforeUnmount(() => {
  stopCanvas()
})
</script>

<style scoped>
.login-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  color: #243755;
  background: #f7faff;
}

.login-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.login-atmosphere {
  pointer-events: none;
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(247, 250, 255, 0.7), rgba(247, 250, 255, 0.16) 48%, rgba(239, 245, 255, 0.78)),
    radial-gradient(circle at 82% 18%, rgba(124, 77, 255, 0.14), transparent 28%),
    radial-gradient(circle at 18% 82%, rgba(47, 145, 255, 0.16), transparent 30%);
}

.login-shell {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(390px, 460px);
  align-items: center;
  gap: 56px;
  padding: 56px clamp(28px, 7vw, 104px);
}

.login-hero {
  max-width: 660px;
  animation: hero-enter 0.8s ease both;
}

.brand-mark {
  width: 68px;
  height: 68px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(226, 246, 255, 0.28);
  border-radius: 22px;
  background: linear-gradient(135deg, #2f91ff 0%, #7c4dff 100%);
  box-shadow:
    0 22px 52px rgba(77, 120, 230, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.32);
  backdrop-filter: blur(16px);
  animation: mark-float 4.8s ease-in-out infinite;
}

.brand-mark span {
  color: #ffffff;
  font-size: 34px;
  font-weight: 900;
  line-height: 1;
}

.hero-copy {
  margin-top: 28px;
}

.hero-kicker,
.login-kicker {
  margin: 0 0 12px;
  color: #2f69d0;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-copy h1 {
  max-width: 560px;
  margin: 0;
  color: #243755;
  font-size: clamp(42px, 6vw, 76px);
  font-weight: 850;
  line-height: 1.02;
  letter-spacing: 0;
}

.hero-desc {
  max-width: 470px;
  margin: 22px 0 0;
  color: #6d819f;
  font-size: 17px;
  line-height: 1.8;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  max-width: 520px;
  margin-top: 46px;
}

.metric-item {
  min-height: 86px;
  display: flex;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border: 1px solid rgba(122, 160, 211, 0.16);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.74);
  box-shadow: 0 12px 28px rgba(95, 124, 170, 0.08);
  backdrop-filter: blur(14px);
  animation: metric-rise 0.8s ease both;
}

.metric-item:nth-child(2) {
  animation-delay: 0.08s;
}

.metric-item:nth-child(3) {
  animation-delay: 0.16s;
}

.metric-item strong {
  color: #243755;
  font-size: 18px;
  line-height: 1;
}

.metric-item span {
  color: #8ca0bc;
  font-size: 12px;
}

/* 右侧表单区 */
.login-form-wrapper {
  position: relative;
  width: 100%;
  padding: 38px;
  border: 1px solid rgba(122, 160, 211, 0.18);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow:
    0 28px 72px rgba(95, 124, 170, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(24px);
  animation: form-enter 0.72s ease 0.08s both;
  overflow: hidden;
}

.form-glow {
  pointer-events: none;
  position: absolute;
  inset: -1px;
  background:
    linear-gradient(120deg, rgba(47, 145, 255, 0.12), transparent 34%, rgba(124, 77, 255, 0.1)),
    radial-gradient(circle at 88% 8%, rgba(47, 145, 255, 0.14), transparent 26%);
  opacity: 0.9;
}

.login-header {
  position: relative;
  z-index: 1;
  margin-bottom: 30px;
}

.login-header h2 {
  margin: 0;
  color: #243755;
  font-size: 32px;
  font-weight: 850;
  line-height: 1.15;
}

.login-header p {
  margin: 10px 0 0;
  color: #7d90af;
  font-size: 14px;
  line-height: 1.6;
}

.login-form {
  position: relative;
  z-index: 1;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-form :deep(.el-input__wrapper) {
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow:
    0 0 0 1px rgba(100, 116, 139, 0.15) inset,
    0 10px 24px rgba(15, 23, 42, 0.05);
  transition:
    box-shadow 0.18s ease,
    background 0.18s ease,
    transform 0.18s ease;
}

.login-form :deep(.el-input__wrapper:hover) {
  background: #ffffff;
  transform: translateY(-1px);
  box-shadow:
    0 0 0 1px rgba(47, 145, 255, 0.26) inset,
    0 14px 28px rgba(15, 23, 42, 0.08);
}

.login-form :deep(.el-input__wrapper.is-focus) {
  background: #ffffff;
  box-shadow:
    0 0 0 2px rgba(47, 145, 255, 0.28) inset,
    0 16px 32px rgba(47, 145, 255, 0.12);
}

.login-form :deep(.el-input__inner) {
  color: #243755;
  font-weight: 650;
}

.login-form :deep(.el-input__prefix) {
  color: #2f91ff;
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
  width: 128px;
  height: 48px;
  flex-shrink: 0;
  cursor: pointer;
  border: 1px solid rgba(100, 116, 139, 0.15);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;
  overflow: hidden;
}

.captcha-box:hover {
  border-color: rgba(47, 145, 255, 0.32);
  background: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
}

.captcha-box :deep(svg) {
  width: 100%;
  height: 100%;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 800;
  margin-top: 4px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #2f91ff 0%, #7c4dff 100%);
  box-shadow: 0 18px 36px rgba(75, 121, 255, 0.26);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    filter 0.18s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  filter: saturate(1.06);
  box-shadow: 0 22px 42px rgba(75, 121, 255, 0.32);
}

.login-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 18px;
  color: #64748b;
  font-size: 13px;
}

.register-dialog :deep(.el-dialog) {
  border-radius: 20px;
}

@keyframes hero-enter {
  from {
    opacity: 0;
    transform: translate3d(-24px, 18px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes form-enter {
  from {
    opacity: 0;
    transform: translate3d(28px, 0, 0) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes mark-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes metric-rise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式 */
@media (max-width: 980px) {
  .login-shell {
    grid-template-columns: minmax(0, 1fr);
    gap: 34px;
    padding: 34px 20px;
  }

  .login-hero {
    max-width: none;
  }

  .hero-copy h1 {
    font-size: 42px;
  }

  .hero-desc {
    max-width: 100%;
  }

  .hero-metrics {
    max-width: none;
  }

  .login-form-wrapper {
    max-width: 520px;
    margin: 0 auto;
    padding: 28px;
  }
}

@media (max-width: 640px) {
  .login-shell {
    min-height: 100vh;
    align-content: center;
    gap: 22px;
  }

  .brand-mark {
    width: 56px;
    height: 56px;
    border-radius: 18px;
  }

  .brand-mark span {
    font-size: 28px;
  }

  .hero-copy {
    margin-top: 18px;
  }

  .hero-copy h1 {
    font-size: 34px;
  }

  .hero-desc {
    font-size: 14px;
  }

  .hero-metrics {
    display: none;
  }

  .login-form-wrapper {
    padding: 22px;
    border-radius: 22px;
  }

  .login-header h2 {
    font-size: 26px;
  }

  .captcha-wrapper {
    align-items: stretch;
  }

  .captcha-box {
    width: 116px;
    height: 48px;
  }
}
</style>
