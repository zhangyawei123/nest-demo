<template>
  <main class="site-shell">
    <header class="site-nav">
      <RouterLink class="brand" to="/">
        <span class="brand-mark"></span>
        <span>Nebula AI</span>
      </RouterLink>
      <nav>
        <a href="#studio">能力</a>
        <a href="#workflow">充值</a>
        <a href="#pricing">积分</a>
        <RouterLink to="/auth">登录</RouterLink>
      </nav>
    </header>

    <section class="hero">
      <canvas ref="canvasRef" class="hero-canvas" aria-hidden="true"></canvas>
      <div class="hero-shade"></div>
      <div class="hero-copy">
        <span class="eyebrow">AI CREATIVE STUDIO</span>
        <h1>Nebula AI</h1>
        <p>面向用户的 AI 创作官网：聊天、生图、历史作品、签到积分和充值订单都在一个工作台里完成。</p>
        <div class="hero-actions">
          <RouterLink class="primary-action" to="/auth">开始使用</RouterLink>
          <RouterLink class="secondary-action" to="/app">进入工作台</RouterLink>
        </div>
      </div>
      <div class="hero-status">
        <span>当前消耗规则</span>
        <strong>聊天 1 / 生图 2 积分</strong>
      </div>
    </section>

    <section id="studio" class="studio-story-section">
      <div class="section-label">PRODUCT</div>
      <div class="studio-story">
        <div>
          <h2>充值之后，用户直接进入创作。</h2>
          <p>积分不是孤立余额，而是连接 AI 聊天、生图和历史作品的消费凭证。</p>
        </div>
        <div class="studio-mock">
          <div class="mock-head">
            <span></span>
            <strong>创作工作台</strong>
          </div>
          <div class="mock-line wide"></div>
          <div class="mock-line"></div>
          <div class="mock-grid">
            <span>AI 聊天</span>
            <span>AI 生图</span>
            <span>我的作品</span>
          </div>
        </div>
      </div>
    </section>

    <section id="workflow" class="workflow-section">
      <div class="section-label">USER FLOW</div>
      <div class="workflow-grid">
        <div>
          <h2>用户在官网消费，商家在后台确认到账。</h2>
        </div>
        <div class="workflow-list">
          <div class="workflow-row">
            <span>01</span>
            <p>注册登录后进入工作台，查看积分、签到、历史作品和可用套餐。</p>
          </div>
          <div class="workflow-row">
            <span>02</span>
            <p>选择套餐生成订单，按商家指定方式付款并保留订单号。</p>
          </div>
          <div class="workflow-row">
            <span>03</span>
            <p>后台确认支付后，积分事务到账，用户可继续聊天或生图。</p>
          </div>
        </div>
      </div>
    </section>

    <section id="pricing" class="pricing-section">
      <div class="pricing-copy">
        <span class="section-label">POINTS</span>
        <h2>先跑稳手动确认，再接真实支付。</h2>
        <p>现在官网创建订单、后台确认到账；后续微信或支付宝回调会复用同一套确认逻辑，避免重复造账。</p>
      </div>
      <RouterLink class="pricing-link" to="/app">查看套餐</RouterLink>
    </section>

    <footer class="site-footer">
      <span>Nebula AI</span>
      <span>官网面向用户，后台面向商家运营。</span>
    </footer>
  </main>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

const canvasRef = ref<HTMLCanvasElement>()
let raf = 0
let startedAt = 0

const render = (time: number) => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  if (!startedAt) startedAt = time
  const elapsed = (time - startedAt) / 1000
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  const dpr = window.devicePixelRatio || 1
  if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#f8fbff')
  gradient.addColorStop(0.52, '#eef4ff')
  gradient.addColorStop(1, '#f4f8ff')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  for (let i = 0; i < 56; i += 1) {
    const x = (Math.sin(elapsed * 0.16 + i * 2.17) * 0.5 + 0.5) * width
    const y = (Math.cos(elapsed * 0.13 + i * 1.61) * 0.5 + 0.5) * height
    const r = 1 + ((i * 7) % 9)
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(47, 145, 255, ${0.08 + (i % 5) * 0.025})`
    ctx.fill()
  }

  ctx.strokeStyle = 'rgba(80, 130, 210, 0.16)'
  ctx.lineWidth = 1
  for (let i = 0; i < 9; i += 1) {
    const y = height * (0.18 + i * 0.085) + Math.sin(elapsed + i) * 8
    ctx.beginPath()
    ctx.moveTo(width * 0.44, y)
    ctx.bezierCurveTo(width * 0.58, y - 48, width * 0.78, y + 58, width * 1.05, y - 18)
    ctx.stroke()
  }

  raf = requestAnimationFrame(render)
}

onMounted(() => {
  raf = requestAnimationFrame(render)
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
})
</script>
