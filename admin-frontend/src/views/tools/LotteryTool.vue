<template>
  <div class="tool-panel-content">
    <div class="lottery-tool">
      <div class="wheel-section">
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
            <el-pagination
              v-model:current-page="recPage"
              :page-size="10"
              :total="recTotal"
              layout="prev,pager,next"
              small
              style="margin-top:12px;justify-content:center;display:flex"
              @current-change="fetchRecords"
            />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

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
          <div class="color-picker-row">
            <el-color-picker v-model="form.color" />
            <span
              v-for="color in colors"
              :key="color"
              class="color-dot"
              @click="form.color = color"
              :style="{ background: color, outline: form.color === color ? '3px solid #333' : '2px solid #ddd' }"
            />
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
import { computed, nextTick, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { createPrize, deletePrize, drawLottery, getPrizes, getRecords, updatePrize } from '@/api/lottery'

const wheelSize = 400
const duration = 5
const colors = ['#FF6B6B', '#FF9F43', '#FECA57', '#48DBFB', '#1DD1A1', '#54A0FF', '#5F27CD', '#FF78C4', '#00D2D3', '#C8D6E5']

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

const totalProb = computed(() => prizes.value.reduce((sum, item) => sum + Number(item.probability), 0))

const getVisualSliceAngle = () => {
  if (!prizes.value.length) return 0
  return (Math.PI * 2) / prizes.value.length
}

const getColor = (index: number, prize: any) => prize.color || colors[index % colors.length]

const drawWheel = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const context = canvas.getContext('2d')
  if (!context) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = wheelSize * dpr
  canvas.height = wheelSize * dpr
  canvas.style.width = `${wheelSize}px`
  canvas.style.height = `${wheelSize}px`
  context.setTransform(dpr, 0, 0, dpr, 0, 0)

  const centerX = wheelSize / 2
  const centerY = wheelSize / 2
  const radius = wheelSize / 2 - 6
  context.clearRect(0, 0, wheelSize, wheelSize)

  context.save()
  context.shadowColor = 'rgba(0,0,0,0.25)'
  context.shadowBlur = 20
  context.beginPath()
  context.arc(centerX, centerY, radius, 0, Math.PI * 2)
  context.fillStyle = '#fff'
  context.fill()
  context.restore()

  if (!prizes.value.length) return

  const angle = getVisualSliceAngle()
  let startAngle = -Math.PI / 2

  prizes.value.forEach((prize, index) => {
    context.beginPath()
    context.moveTo(centerX, centerY)
    context.arc(centerX, centerY, radius, startAngle, startAngle + angle)
    context.closePath()
    context.fillStyle = getColor(index, prize)
    context.fill()
    context.strokeStyle = 'rgba(255,255,255,0.8)'
    context.lineWidth = 2
    context.stroke()

    context.save()
    context.translate(centerX, centerY)
    context.rotate(startAngle + angle / 2)
    context.textAlign = 'right'
    context.fillStyle = '#fff'
    context.shadowColor = 'rgba(0,0,0,0.4)'
    context.shadowBlur = 4
    const textRadius = radius * 0.75
    if (prize.icon) {
      context.font = '18px sans-serif'
      context.fillText(prize.icon, textRadius - 2, -6)
    }
    context.font = 'bold 12px sans-serif'
    const prizeName = prize.name.length > 5 ? `${prize.name.slice(0, 5)}…` : prize.name
    context.fillText(prizeName, textRadius - 2, prize.icon ? 12 : 5)
    context.restore()

    startAngle += angle
  })

  context.beginPath()
  context.arc(centerX, centerY, radius, 0, Math.PI * 2)
  context.strokeStyle = 'rgba(255,255,255,0.5)'
  context.lineWidth = 5
  context.stroke()

  const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, 36)
  gradient.addColorStop(0, '#fff')
  gradient.addColorStop(1, '#e8e8e8')
  context.beginPath()
  context.arc(centerX, centerY, 36, 0, Math.PI * 2)
  context.fillStyle = gradient
  context.fill()
  context.strokeStyle = 'rgba(0,0,0,0.08)'
  context.lineWidth = 2
  context.stroke()
}

const handleSpin = async () => {
  if (spinning.value || prizes.value.length < 2) return

  spinning.value = true
  try {
    const response: any = await drawLottery()
    const { prize, index } = response
    const sliceAngle = 360 / prizes.value.length
    const targetAngle = index * sliceAngle + sliceAngle / 2
    const extraTurns = 360 * 8
    const normalized = ((rotation.value % 360) + 360) % 360
    const targetRotation = extraTurns + (360 - targetAngle) - normalized
    rotation.value += targetRotation

    window.setTimeout(() => {
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

const fetchPrizes = async () => {
  const response: any = await getPrizes()
  prizes.value = response || []
  await nextTick()
  drawWheel()
}

const fetchRecords = async () => {
  recLoading.value = true
  try {
    const response: any = await getRecords(recPage.value, 10)
    records.value = response.list || []
    recTotal.value = response.total || 0
  } finally {
    recLoading.value = false
  }
}

const openDialog = (prize?: any) => {
  form.value = prize ? { ...prize } : { ...defForm(), color: colors[prizes.value.length % colors.length] }
  dialogVisible.value = true
}

const submitForm = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const payload = {
        ...form.value,
        probability: Number(form.value.probability),
        sort: Number(form.value.sort || 0),
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

const delPrize = async (prize: any) => {
  await ElMessageBox.confirm(`确定删除「${prize.name}」吗？`, '提示', { type: 'warning' })
  await deletePrize(prize.id)
  ElMessage.success('删除成功')
  fetchPrizes()
}

const saveProb = async (prize: any) => {
  await updatePrize(prize.id, { probability: Number(prize.probability) })
}

const fmtDate = (value: string) => new Date(value).toLocaleString('zh-CN')

onMounted(() => {
  fetchPrizes()
  fetchRecords()
})
</script>

<style scoped>
.lottery-tool {
  display: flex;
  gap: 24px;
  width: 100%;
}

.wheel-section {
  flex-shrink: 0;
  width: 460px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(145deg, #1a1f3a 0%, #2d1b69 100%);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
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
  border-top: 36px solid #ffd700;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
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
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.6);
  transition: all 0.2s;
  z-index: 15;
  line-height: 1.4;
  transform: translateZ(0);
}

.spin-btn:hover:not(.disabled) {
  transform: scale(1.08);
  box-shadow: 0 6px 24px rgba(102, 126, 234, 0.8);
}

.spin-btn.disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background: linear-gradient(135deg, #a0a0a0 0%, #888 100%);
}

.prob-tip {
  margin-top: 20px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 13px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 20px;
}

.prob-tip.warn {
  color: #feca57;
}

.config-section {
  flex: 1;
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
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
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.prize-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.prize-emoji {
  font-size: 22px;
  flex-shrink: 0;
}

.prize-info {
  flex: 1;
  min-width: 0;
}

.prize-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.prize-desc {
  color: #909399;
  font-size: 12px;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pct {
  color: #606266;
  font-size: 13px;
}

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
  from {
    transform: scale(1);
  }

  to {
    transform: scale(1.15);
  }
}

.win-icon {
  font-size: 64px;
  margin: 10px 0;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
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

.color-picker-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.color-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  display: inline-block;
}

@media (max-width: 1280px) {
  .lottery-tool {
    flex-direction: column;
  }

  .wheel-section {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .wheel-wrapper {
    width: 300px;
    height: 300px;
  }

  .wheel-rotate {
    top: 15px;
    left: 15px;
    width: 270px;
    height: 270px;
  }

  .wheel-rotate canvas {
    width: 270px;
    height: 270px;
  }
}
</style>
