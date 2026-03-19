<template>
  <div class="lottery-container">
    <div class="wheel-section">
      <h2 class="wheel-title">🎡 幸运转盘</h2>
      <div class="wheel-wrapper">
        <div class="pointer-wrap"><div class="pointer" /></div>
        <div
          class="wheel-rotate"
          :style="{ transform: `rotate(${rotation}deg)`, transition: spinning ? `transform ${duration}s cubic-bezier(0.17,0.67,0.21,0.99)` : 'none' }"
        >
          <canvas ref="canvasRef" />
        </div>
        <button class="spin-btn" :class="{ disabled: spinning || prizes.length < 2 }" @click="handleSpin">
          {{ spinning ? '转动中…' : '开始\n抽奖' }}
        </button>
      </div>
      <div class="prob-tip" :class="{ warn: Math.abs(totalProb - 100) > 0.5 }">
        概率合计：<strong>{{ totalProb.toFixed(1) }}%</strong>
        <span v-if="Math.abs(totalProb - 100) > 0.5"> ⚠️ 建议合计为100%</span>
      </div>
    </div>

    <div class="config-section">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="🎁 奖项配置" name="config">
          <div class="config-header">
            <el-button type="primary" size="small" @click="openDialog()"><el-icon><Plus /></el-icon> 添加奖项</el-button>
          </div>
          <div class="prize-list">
            <div v-for="(prize, idx) in prizes" :key="prize.id" class="prize-item">
              <span class="prize-dot" :style="{ background: prize.color || colors[idx % colors.length] }" />
              <span class="prize-emoji">{{ prize.icon || '🎁' }}</span>
              <div class="prize-info">
                <div class="prize-name">{{ prize.name }}</div>
                <div class="prize-desc">{{ prize.description }}</div>
              </div>
              <el-input-number v-model.number="prize.probability" :min="0" :max="100" :precision="1" :step="5" size="small" style="width:110px" @change="() => { saveProb(prize); drawWheel() }" />
              <span class="pct">%</span>
              <el-button text type="primary" size="small" @click="openDialog(prize)">编辑</el-button>
              <el-button text type="danger" size="small" @click="delPrize(prize)">删除</el-button>
            </div>
            <el-empty v-if="!prizes.length" description="暂无奖项" :image-size="60" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="📋 抽奖记录" name="records">
          <el-table :data="records" size="small" v-loading="recLoading">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="prizeName" label="奖项" />
            <el-table-column label="时间">
              <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
          <el-pagination v-model:current-page="recPage" :page-size="10" :total="recTotal" layout="prev,pager,next" small style="margin-top:12px;justify-content:center;display:flex" @current-change="fetchRecords" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 中奖弹窗 -->
    <el-dialog v-model="resultVisible" width="340px" :show-close="false" align-center>
      <div class="result-box">
        <div class="firework">🎉🎊🎉</div>
        <div class="win-icon">{{ winner?.icon || '🏆' }}</div>
        <div class="win-label">恭喜获得</div>
        <div class="win-name">{{ winner?.name }}</div>
        <div class="win-desc">{{ winner?.description }}</div>
        <el-button type="primary" round style="margin-top:20px;width:120px" @click="resultVisible = false">好的！</el-button>
      </div>
    </el-dialog>

    <!-- 奖项弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑奖项' : '添加奖项'" width="460px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="如：一等奖" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" placeholder="如：AirPods Pro" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="form.icon" placeholder="emoji，如 🎁 🏆 🎀" />
        </el-form-item>
        <el-form-item label="概率%" prop="probability">
          <el-input-number v-model.number="form.probability" :min="0" :max="100" :precision="1" :step="5" style="width:150px" />
        </el-form-item>
        <el-form-item label="颜色">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <el-color-picker v-model="form.color" />
            <span v-for="c in colors" :key="c" @click="form.color=c"
              :style="{ background:c, width:'22px', height:'22px', borderRadius:'50%', cursor:'pointer', outline: form.color===c ? '3px solid #333' : '2px solid #ddd', display:'inline-block' }" />
          </div>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model.number="form.sort" :min="0" style="width:120px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getPrizes, createPrize, updatePrize, deletePrize, drawLottery, getRecords } from '@/api/lottery'

const wheelSize = 400
const duration = 5
const colors = ['#FF6B6B','#FF9F43','#FECA57','#48DBFB','#1DD1A1','#54A0FF','#5F27CD','#FF78C4','#00D2D3','#C8D6E5']

const canvasRef = ref<HTMLCanvasElement>()
const prizes = ref<any[]>([])
const rotation = ref(0)
const spinning = ref(false)
const activeTab = ref('config')
const resultVisible = ref(false)
const winner = ref<any>(null)
const records = ref<any[]>([])
const recLoading = ref(false)
const recPage = ref(1)
const recTotal = ref(0)
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const defForm = () => ({ id: 0, name: '', description: '', icon: '🎁', probability: 10, color: colors[0], sort: 0, enabled: true })
const form = ref(defForm())
const rules: FormRules = {
  name: [{ required: true, message: '请输入奖项名称', trigger: 'blur' }],
  probability: [{ required: true, message: '请设置概率', trigger: 'change' }],
}

const totalProb = computed(() => prizes.value.reduce((s, p) => s + Number(p.probability), 0))

function getVisualSliceAngle() {
  if (!prizes.value.length) return 0
  return (Math.PI * 2) / prizes.value.length
}

function getColor(idx: number, prize: any) {
  return prize.color || colors[idx % colors.length]
}

function drawWheel() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  const dpr = window.devicePixelRatio || 1
  canvas.width = wheelSize * dpr
  canvas.height = wheelSize * dpr
  canvas.style.width = `${wheelSize}px`
  canvas.style.height = `${wheelSize}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const cx = wheelSize / 2, cy = wheelSize / 2, r = wheelSize / 2 - 6
  ctx.clearRect(0, 0, wheelSize, wheelSize)

  // 外圈阴影
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.25)'
  ctx.shadowBlur = 20
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.restore()

  if (!prizes.value.length) return

  const angle = getVisualSliceAngle()
  let startAngle = -Math.PI / 2

  prizes.value.forEach((prize, idx) => {
    // 扇形
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, startAngle, startAngle + angle)
    ctx.closePath()
    ctx.fillStyle = getColor(idx, prize)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'
    ctx.lineWidth = 2
    ctx.stroke()

    // 文字
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(startAngle + angle / 2)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#fff'
    ctx.shadowColor = 'rgba(0,0,0,0.4)'
    ctx.shadowBlur = 4
    const tr = r * 0.75
    if (prize.icon) {
      ctx.font = '18px sans-serif'
      ctx.fillText(prize.icon, tr - 2, -6)
    }
    ctx.font = 'bold 12px sans-serif'
    const nm = prize.name.length > 5 ? prize.name.slice(0, 5) + '…' : prize.name
    ctx.fillText(nm, tr - 2, prize.icon ? 12 : 5)
    ctx.restore()

    startAngle += angle
  })

  // 外圆圈
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = 5
  ctx.stroke()

  // 中心圆装饰
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 36)
  g.addColorStop(0, '#fff')
  g.addColorStop(1, '#e8e8e8')
  ctx.beginPath()
  ctx.arc(cx, cy, 36, 0, Math.PI * 2)
  ctx.fillStyle = g
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'
  ctx.lineWidth = 2
  ctx.stroke()
}

async function handleSpin() {
  if (spinning.value || prizes.value.length < 2) return
  spinning.value = true
  try {
    const res: any = await drawLottery()
    const { prize, index } = res

    const sliceAngle = 360 / prizes.value.length
    const targetAngle = index * sliceAngle + sliceAngle / 2
    const extraTurns = 360 * 8
    const normalized = ((rotation.value % 360) + 360) % 360
    const targetRotation = extraTurns + (360 - targetAngle) - normalized
    rotation.value += targetRotation

    setTimeout(() => {
      spinning.value = false
      winner.value = prize
      resultVisible.value = true
      fetchRecords()
    }, duration * 1000 + 300)
  } catch {
    spinning.value = false
    ElMessage.error('抽奖失败，请重试')
  }
}

async function fetchPrizes() {
  const res: any = await getPrizes()
  prizes.value = res || []
  await nextTick()
  drawWheel()
}

async function fetchRecords() {
  recLoading.value = true
  try {
    const res: any = await getRecords(recPage.value, 10)
    records.value = res.list || []
    recTotal.value = res.total || 0
  } finally {
    recLoading.value = false
  }
}

function openDialog(prize?: any) {
  form.value = prize ? { ...prize } : { ...defForm(), color: colors[prizes.value.length % colors.length] }
  dialogVisible.value = true
}

async function submitForm() {
  await formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const payload = {
        ...form.value,
        probability: Number(form.value.probability),
        sort: Number(form.value.sort || 0)
      }
      form.value.id ? await updatePrize(form.value.id, payload) : await createPrize(payload)
      ElMessage.success(form.value.id ? '更新成功' : '添加成功')
      dialogVisible.value = false
      fetchPrizes()
    } finally {
      submitting.value = false
    }
  })
}

async function delPrize(prize: any) {
  await ElMessageBox.confirm(`确定删除「${prize.name}」吗？`, '提示', { type: 'warning' })
  await deletePrize(prize.id)
  ElMessage.success('删除成功')
  fetchPrizes()
}

async function saveProb(prize: any) {
  await updatePrize(prize.id, { probability: Number(prize.probability) })
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchPrizes()
  fetchRecords()
})
</script>

<style scoped>
.lottery-container {
  display: flex;
  gap: 32px;
  width: 100%;
  min-height: calc(100vh - 120px);
}

/* 左侧转盘 */
.wheel-section {
  flex-shrink: 0;
  width: 460px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(145deg, #1a1f3a 0%, #2d1b69 100%);
  border-radius: 24px;
  padding: 32px 24px 24px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.wheel-title {
  color: #fff;
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 28px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.3);
  letter-spacing: 2px;
}

.wheel-wrapper {
  position: relative;
  width: 420px;
  height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pointer-wrap {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.pointer {
  width: 0;
  height: 0;
  border-left: 14px solid transparent;
  border-right: 14px solid transparent;
  border-top: 36px solid #FFD700;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
}

.wheel-rotate {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  overflow: hidden;
  transform-origin: center center;
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.18));
}

.wheel-rotate canvas {
  display: block;
  width: 400px;
  height: 400px;
  border-radius: 50%;
}

.spin-btn {
  position: absolute;
  width: 74px;
  height: 74px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 4px solid #fff;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: pre-line;
  text-align: center;
  box-shadow: 0 4px 20px rgba(102,126,234,0.6);
  transition: all 0.2s;
  z-index: 15;
  line-height: 1.4;
  transform: translateZ(0);
}

.spin-btn:hover:not(.disabled) {
  transform: scale(1.08);
  box-shadow: 0 6px 24px rgba(102,126,234,0.8);
}

.spin-btn.disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background: linear-gradient(135deg, #a0a0a0 0%, #888 100%);
}

.prob-tip {
  margin-top: 20px;
  color: rgba(255,255,255,0.7);
  font-size: 13px;
  padding: 8px 16px;
  background: rgba(255,255,255,0.08);
  border-radius: 20px;
}

.prob-tip.warn { color: #feca57; }

/* 右侧配置 */
.config-section {
  flex: 1;
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  overflow: hidden;
}

.config-header {
  margin-bottom: 16px;
}

.prize-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 420px;
  overflow-y: auto;
}

.prize-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #f8f9ff;
  border-radius: 12px;
  border: 1px solid #eef0f8;
  transition: all 0.2s;
}

.prize-item:hover {
  background: #f0f2ff;
  border-color: #c5caf0;
  box-shadow: 0 2px 8px rgba(102,126,234,0.1);
}

.prize-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.prize-emoji { font-size: 22px; flex-shrink: 0; }

.prize-info { flex: 1; min-width: 0; }

.prize-name { font-weight: 600; color: #303133; font-size: 14px; }

.prize-desc { color: #909399; font-size: 12px; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.pct { color: #606266; font-size: 13px; }

/* 结果弹窗 */
.result-box {
  text-align: center;
  padding: 20px 0 10px;
}

.firework {
  font-size: 32px;
  animation: bounce 0.6s infinite alternate;
  margin-bottom: 12px;
}

@keyframes bounce {
  from { transform: scale(1); }
  to { transform: scale(1.15); }
}

.win-icon {
  font-size: 64px;
  margin: 10px 0;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
}

.win-label {
  color: #909399;
  font-size: 14px;
  margin-bottom: 6px;
}

.win-name {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.win-desc {
  color: #606266;
  font-size: 14px;
}

.record-pagination { margin-top: 12px; display: flex; justify-content: center; }
</style>
