<template>
  <div class="tool-panel-content">
    <div class="section-block">
      <div class="section-title">生成二维码</div>
      <el-input
        v-model="content"
        type="textarea"
        :rows="4"
        placeholder="请输入文本、链接或任意内容"
        resize="vertical"
      />

      <div class="tool-grid">
        <el-input-number v-model="size" :min="160" :max="480" :step="20" />
        <el-select v-model="errorLevel">
          <el-option label="低容错 L" value="L" />
          <el-option label="中容错 M" value="M" />
          <el-option label="较高容错 Q" value="Q" />
          <el-option label="高容错 H" value="H" />
        </el-select>
      </div>

      <div class="action-row">
        <el-button type="primary" :loading="generating" :disabled="!content.trim()" @click="generateCode">
          生成二维码
        </el-button>
        <el-button :disabled="!qrCodeUrl" @click="downloadCode">下载图片</el-button>
        <el-button :disabled="!content.trim()" @click="copyText(content, '内容已复制')">复制内容</el-button>
      </div>

      <div v-if="qrCodeUrl" class="preview-box">
        <img :src="qrCodeUrl" alt="二维码预览" class="qr-image" />
      </div>
    </div>

    <div class="section-block">
      <div class="section-title">解析二维码</div>

      <div class="action-row">
        <el-upload :auto-upload="false" :show-file-list="false" accept="image/*" @change="handleFileChange">
          <template #trigger>
            <el-button type="primary" plain>选择二维码图片</el-button>
          </template>
        </el-upload>
        <el-button :loading="decoding" :disabled="!decodePreviewUrl" @click="decodeSelectedImage">开始解析</el-button>
      </div>

      <div v-if="decodePreviewUrl" class="preview-box">
        <img :src="decodePreviewUrl" alt="待解析二维码" class="decode-image" />
      </div>

      <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" show-icon />

      <div v-if="decodedText" class="result-panel">
        <div class="result-item">
          <span class="label">解析结果</span>
          <span class="value">{{ decodedText }}</span>
        </div>
        <div class="action-row">
          <el-button @click="copyText(decodedText, '解析结果已复制')">复制结果</el-button>
          <a v-if="isLink(decodedText)" :href="decodedText" class="open-link" target="_blank" rel="noopener noreferrer">
            打开链接
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import QRCode from 'qrcode'
import jsQR from 'jsqr'

type ErrorLevel = 'L' | 'M' | 'Q' | 'H'

const content = ref('')
const size = ref(260)
const errorLevel = ref<ErrorLevel>('M')
const qrCodeUrl = ref('')
const generating = ref(false)
const decoding = ref(false)
const decodePreviewUrl = ref('')
const selectedImageFile = ref<File | null>(null)
const decodedText = ref('')
const errorMessage = ref('')

const copyText = async (text: string, successMessage: string) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(successMessage)
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

const generateCode = async () => {
  const text = content.value.trim()
  if (!text) return

  generating.value = true
  try {
    qrCodeUrl.value = await QRCode.toDataURL(text, {
      width: size.value,
      margin: 2,
      errorCorrectionLevel: errorLevel.value,
    })
  } catch (error: any) {
    ElMessage.error(error?.message || '二维码生成失败')
  } finally {
    generating.value = false
  }
}

const downloadCode = () => {
  if (!qrCodeUrl.value) return
  const link = document.createElement('a')
  link.href = qrCodeUrl.value
  link.download = `qrcode_${Date.now()}.png`
  link.click()
}

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('图片读取失败'))
    reader.readAsDataURL(file)
  })

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片加载失败'))
    image.src = src
  })

const handleFileChange = async (file: UploadFile) => {
  if (!file.raw) return
  selectedImageFile.value = file.raw
  decodedText.value = ''
  errorMessage.value = ''

  try {
    decodePreviewUrl.value = await readFileAsDataUrl(file.raw)
  } catch (error: any) {
    errorMessage.value = error?.message || '图片读取失败'
    decodePreviewUrl.value = ''
    selectedImageFile.value = null
  }
}

const decodeSelectedImage = async () => {
  if (!selectedImageFile.value) return

  decoding.value = true
  errorMessage.value = ''
  decodedText.value = ''

  try {
    const source = decodePreviewUrl.value || await readFileAsDataUrl(selectedImageFile.value)
    const image = await loadImage(source)
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('浏览器不支持 Canvas')
    }

    canvas.width = image.width
    canvas.height = image.height
    context.drawImage(image, 0, 0)

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    })

    if (!result?.data) {
      throw new Error('未识别到二维码，请检查图片是否清晰')
    }

    decodedText.value = result.data
  } catch (error: any) {
    errorMessage.value = error?.message || '二维码解析失败'
  } finally {
    decoding.value = false
  }
}

const isLink = (value: string) => /^https?:\/\//i.test(value)
</script>

<style scoped>
.section-block {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-block + .section-block {
  border-top: 1px solid #ebeef5;
  padding-top: 18px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.preview-box {
  display: flex;
  justify-content: center;
  padding: 16px;
  border: 1px dashed #dcdfe6;
  border-radius: 12px;
  background: #f8fafc;
}

.qr-image {
  width: 260px;
  max-width: 100%;
  border-radius: 10px;
}

.decode-image {
  max-width: 100%;
  max-height: 320px;
  border-radius: 10px;
}

.open-link {
  display: inline-flex;
  align-items: center;
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
}

.open-link:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .tool-grid {
    grid-template-columns: 1fr;
  }
}
</style>
