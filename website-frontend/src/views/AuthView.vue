<template>
  <main class="auth-page login-design-page">
    <div class="login-design-bg" aria-hidden="true">
      <span class="bg-orb bg-orb-large"></span>
      <span class="bg-orb bg-orb-mid"></span>
      <span class="bg-orb bg-orb-small"></span>
      <span class="bg-grid"></span>
    </div>

    <section class="login-design-shell">
      <div class="login-brand-side">
        <RouterLink class="login-brand" to="/">
          <span class="nebula-mark" aria-hidden="true">
            <i></i>
            <b></b>
          </span>
          <span>Nebula AI</span>
        </RouterLink>

        <div class="login-copy">
          <h1>{{ mode === 'login' ? '登录用户官网' : '创建用户账号' }}</h1>
          <p>官网账号用于充值积分、查看订单和进入<br />AI 创作工作台</p>
        </div>

        <div class="login-visual" aria-hidden="true">
          <div class="visual-platform">
            <span class="platform-ring ring-one"></span>
            <span class="platform-ring ring-two"></span>
            <span class="platform-base"></span>
            <span class="platform-glow"></span>
            <span class="visual-ribbon ribbon-left"></span>
            <span class="visual-ribbon ribbon-right"></span>
          </div>
          <span class="visual-dot dot-one"></span>
          <span class="visual-dot dot-two"></span>
          <span class="visual-dot dot-three"></span>
        </div>
      </div>

      <el-card class="auth-form login-form-card" shadow="never">
        <el-tabs v-model="mode" class="login-tabs" stretch @tab-change="switchMode">
          <el-tab-pane name="login" label="登录" />
          <el-tab-pane name="register" label="注册" />
        </el-tabs>

        <el-form class="login-form" @submit.prevent="handleSubmit">
          <el-form-item>
            <el-input
              v-model.trim="form.username"
              autocomplete="username"
              placeholder="用户名 / 邮箱 / 手机号"
              size="large"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-input
              v-model="form.password"
              autocomplete="current-password"
              type="password"
              placeholder="请输入密码"
              size="large"
              show-password
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item v-if="mode === 'login'">
            <div class="captcha-row login-captcha-row">
              <el-input v-model="form.captchaCode" placeholder="输入验证码" size="large">
                <template #prefix>
                  <el-icon><CircleCheck /></el-icon>
                </template>
              </el-input>
              <button class="captcha-image login-captcha-image" type="button" @click="loadCaptcha" v-html="captchaSvg"></button>
            </div>
          </el-form-item>

          <div v-if="mode === 'login'" class="login-options">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
            <button type="button">忘记密码?</button>
          </div>

          <el-alert v-if="errorMessage" type="warning" :closable="false" show-icon>
            {{ errorMessage }}
          </el-alert>

          <el-button native-type="submit" type="primary" size="large" :loading="submitting" class="full-button login-submit">
            {{ mode === 'login' ? '登录' : '注册并登录' }}
          </el-button>

          <div class="login-divider">
            <span></span>
            <em>其他登录方式</em>
            <span></span>
          </div>

          <button type="button" class="login-chat-button" aria-label="其他登录方式">
            <el-icon><ChatRound /></el-icon>
          </button>
        </el-form>
      </el-card>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ChatRound, CircleCheck, Lock, User } from '@element-plus/icons-vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { getCaptcha, login, register } from '@/api/auth'

type Mode = 'login' | 'register'

const route = useRoute()
const router = useRouter()
const mode = ref<Mode>('login')
const submitting = ref(false)
const errorMessage = ref('')
const captchaSvg = ref('')
const captchaId = ref('')
const rememberMe = ref(false)
const form = reactive({
  username: '',
  password: '',
  captchaCode: '',
})

const loadCaptcha = async () => {
  const res = await getCaptcha()
  captchaId.value = res.captchaId
  captchaSvg.value = res.svg
}

const switchMode = (nextMode: string) => {
  if (nextMode !== 'login' && nextMode !== 'register') return
  mode.value = nextMode
  errorMessage.value = ''
  if (nextMode === 'login') loadCaptcha()
}

const validate = () => {
  if (!form.username) return '请输入用户名'
  if (!form.password) return '请输入密码'
  if (mode.value === 'register' && form.password.length < 6) return '密码至少 6 位'
  if (mode.value === 'login' && !form.captchaCode) return '请输入验证码'
  return ''
}

const handleSubmit = async () => {
  const message = validate()
  if (message) {
    errorMessage.value = message
    return
  }

  submitting.value = true
  errorMessage.value = ''
  try {
    if (mode.value === 'register') {
      await register({ username: form.username, password: form.password })
      mode.value = 'login'
      form.captchaCode = ''
      await loadCaptcha()
      errorMessage.value = '注册成功，请输入验证码登录'
      return
    }

    const res = await login({
      username: form.username,
      password: form.password,
      captchaId: captchaId.value,
      captchaCode: form.captchaCode,
    })
    localStorage.setItem('website_token', res.access_token)
    localStorage.setItem('website_user', JSON.stringify(res.user))
    router.push(String(route.query.redirect || '/app'))
  } catch (error: any) {
    errorMessage.value = error.message || '操作失败'
    if (mode.value === 'login') {
      form.captchaCode = ''
      await loadCaptcha()
    }
  } finally {
    submitting.value = false
  }
}

onMounted(loadCaptcha)
</script>
