<template>
  <div class="tool-card">
    <div class="tool-card-header">
      <div>
        <h3>图表生成器</h3>
        <p>粘贴表格数据（每行一条，用逗号或 Tab 分隔"名称,数值"），一键生成图表。</p>
      </div>
    </div>

    <div class="chart-type-row">
      <el-radio-group v-model="chartType">
        <el-radio-button value="bar">柱状图</el-radio-button>
        <el-radio-button value="line">折线图</el-radio-button>
        <el-radio-button value="pie">饼图</el-radio-button>
      </el-radio-group>
    </div>

    <el-input
      v-model="rawData"
      type="textarea"
      :rows="6"
      placeholder="例如：&#10;苹果,120&#10;香蕉,80&#10;橘子,200&#10;葡萄,150"
      resize="vertical"
    />

    <div class="chart-actions">
      <el-button type="primary" :disabled="!rawData.trim()" @click="renderChart">生成图表</el-button>
      <el-button :disabled="!chartRendered" @click="downloadChart">下载图片</el-button>
    </div>

    <el-alert v-if="errorMsg" :title="errorMsg" type="error" :closable="false" show-icon />

    <div v-show="chartRendered" ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { ComposeOption } from 'echarts/core'
import type { BarSeriesOption, LineSeriesOption, PieSeriesOption } from 'echarts/charts'
import type {
  TitleComponentOption,
  TooltipComponentOption,
  LegendComponentOption,
  GridComponentOption,
} from 'echarts/components'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  CanvasRenderer,
])

type EChartsOption = ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | PieSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | LegendComponentOption
  | GridComponentOption
>

const rawData = ref('')
const chartType = ref('bar')
const errorMsg = ref('')
const chartRendered = ref(false)
const chartContainer = ref<HTMLElement | null>(null)

let chartInstance: echarts.ECharts | null = null

const parseData = () => {
  const lines = rawData.value.trim().split('\n').filter(l => l.trim())
  const result: { name: string; value: number }[] = []
  for (const line of lines) {
    const parts = line.split(/[,\t，]/).map(s => s.trim())
    if (parts.length >= 2) {
      const name = parts[0] || ''
      const value = parseFloat(parts[1] || '0')
      if (name && !isNaN(value)) {
        result.push({ name, value })
      }
    }
  }
  return result
}

const renderChart = () => {
  errorMsg.value = ''
  const data = parseData()
  if (data.length === 0) {
    errorMsg.value = '未解析到有效数据，请检查格式（每行：名称,数值）'
    chartRendered.value = false
    return
  }

  if (!chartContainer.value) return

  if (chartInstance) {
    chartInstance.dispose()
  }
  chartInstance = echarts.init(chartContainer.value)

  const names = data.map(d => d.name)
  const values = data.map(d => d.value)
  const type = chartType.value

  let option: EChartsOption

  if (type === 'pie') {
    option = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      series: [
        {
          type: 'pie',
          radius: ['30%', '65%'],
          data: data.map(d => ({ name: d.name, value: d.value })),
          label: { formatter: '{b}\n{d}%' },
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
        },
      ],
    }
  } else {
    option = {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: names, axisLabel: { rotate: names.length > 6 ? 30 : 0 } },
      yAxis: { type: 'value' },
      series: [
        {
          type: type as 'bar' | 'line',
          data: values,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#667eea' },
                { offset: 1, color: '#764ba2' },
              ],
            },
          },
        },
      ],
    }
  }

  chartInstance.setOption(option)
  chartRendered.value = true
}

const downloadChart = () => {
  if (!chartInstance) return
  const url = chartInstance.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' })
  const a = document.createElement('a')
  a.href = url
  a.download = `chart_${Date.now()}.png`
  a.click()
}

onBeforeUnmount(() => {
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<style scoped>
.chart-type-row {
  overflow-x: auto;
}
.chart-actions {
  display: flex;
  gap: 12px;
}
.chart-container {
  width: 100%;
  height: 400px;
  border: 1px solid #ebeef5;
  border-radius: 12px;
}
</style>
