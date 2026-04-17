<template>
  <div class="tool-card">
    <div class="tool-card-header">
      <div>
        <h3>随机决策器</h3>
        <p>输入多个选项，帮你随机选一个。今天吃啥、做啥，交给命运。</p>
      </div>
    </div>

    <div class="options-input">
      <div v-for="(item, index) in options" :key="index" class="option-row">
        <el-input v-model="options[index]" :placeholder="`选项 ${index + 1}`" @keyup.enter="addOption" />
        <el-button v-if="options.length > 2" text type="danger" @click="removeOption(index)">删除</el-button>
      </div>
      <el-button @click="addOption" size="small">+ 添加选项</el-button>
    </div>

    <div class="pick-area">
      <el-button
        type="primary"
        size="large"
        :loading="spinning"
        :disabled="validOptions.length < 2"
        @click="doPick"
      >
        {{ spinning ? '选择中...' : '随机选一个！' }}
      </el-button>
    </div>

    <transition name="fade">
      <div v-if="picked" class="picked-result">
        <div class="picked-label">命运选择了</div>
        <div class="picked-value">{{ picked }}</div>
        <el-button @click="doPick" :disabled="spinning" style="margin-top: 12px">再来一次</el-button>
      </div>
    </transition>

    <div v-if="history.length" class="history-panel">
      <div class="panel-label">历史记录</div>
      <div class="history-list">
        <el-tag v-for="(h, i) in history" :key="i" type="info" effect="plain" style="margin: 2px">
          {{ h }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const options = ref(['', '', ''])
const picked = ref('')
const spinning = ref(false)
const history = ref<string[]>([])

const validOptions = computed(() => options.value.filter(o => o.trim()))

const addOption = () => {
  options.value.push('')
}

const removeOption = (index: number) => {
  options.value.splice(index, 1)
}

const doPick = () => {
  const valid = validOptions.value
  if (valid.length < 2) return

  spinning.value = true
  picked.value = ''

  let count = 0
  const total = 10 + Math.floor(Math.random() * 10)
  const interval = setInterval(() => {
    picked.value = valid[Math.floor(Math.random() * valid.length)] ?? ''
    count++
    if (count >= total) {
      clearInterval(interval)
      spinning.value = false
      history.value.unshift(picked.value)
      if (history.value.length > 20) history.value.pop()
    }
  }, 80)
}
</script>

<style scoped>
.options-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.option-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.option-row :deep(.el-input) {
  flex: 1;
}
.pick-area {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}
.picked-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: #fff;
}
.picked-label {
  font-size: 14px;
  opacity: 0.85;
}
.picked-value {
  font-size: 36px;
  font-weight: 700;
  margin-top: 8px;
}
.history-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.panel-label {
  font-size: 13px;
  color: #909399;
  font-weight: 500;
}
.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
