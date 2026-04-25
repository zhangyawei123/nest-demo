<template>
  <div class="article-edit">
    <div class="page-header article-edit-header">
      <div class="page-title-block">
        <div class="page-kicker">Editor Workspace</div>
        <h2>{{ isEdit ? '编辑文章' : '发布文章' }}</h2>
        <p class="page-description">通过统一的内容工作台编辑标题、封面与正文，实时查看当前文章的基础信息。</p>
      </div>
      <div class="header-actions">
        <div class="header-chip">
          <span class="header-chip-label">当前模式</span>
          <span class="header-chip-value">{{ isEdit ? '编辑中' : '待发布' }}</span>
        </div>
        <el-button @click="goBack">返回</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存' : '发布' }}
        </el-button>
      </div>
    </div>

    <div class="edit-layout">
      <el-card class="edit-card edit-main-card">
        <template #header>
          <div class="card-header">
            <div>
              <div class="card-kicker">Article Editor</div>
              <div class="card-title-row">内容编辑区</div>
            </div>
            <span class="card-pill">{{ isEdit ? 'Draft Update' : 'New Draft' }}</span>
          </div>
        </template>

        <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="article-form">
          <el-form-item label="文章标题" prop="title">
            <el-input
              v-model="form.title"
              placeholder="请输入文章标题"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="封面图片" prop="logo">
            <ImageUpload v-model="form.logo" />
          </el-form-item>

          <el-form-item label="文章内容" prop="content">
            <div class="editor-wrapper">
              <Toolbar
                :editor="editorRef"
                :defaultConfig="toolbarConfig"
                mode="default"
                class="editor-toolbar"
              />
              <Editor
                v-model="form.content"
                :defaultConfig="editorConfig"
                mode="default"
                class="editor-content"
                @onCreated="handleCreated"
              />
            </div>
          </el-form-item>
        </el-form>
      </el-card>

      <div class="edit-side">
        <el-card class="side-card">
          <template #header>
            <div class="side-card-header">发布概览</div>
          </template>
          <div class="summary-list">
            <div class="summary-item">
              <span class="summary-label">标题长度</span>
              <span class="summary-value">{{ form.title.length }}/200</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">内容字数</span>
              <span class="summary-value">{{ contentWordCount }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">预计阅读</span>
              <span class="summary-value">{{ estimatedReadMinutes }} 分钟</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">封面状态</span>
              <span class="summary-value">{{ form.logo ? '已上传' : '待补充' }}</span>
            </div>
          </div>
        </el-card>

        <el-card class="side-card">
          <template #header>
            <div class="side-card-header">编辑建议</div>
          </template>
          <div class="tips-list">
            <div class="tip-item">
              <span class="tip-index">01</span>
              <p>标题建议控制在 12-28 个字，方便列表页和详情页展示。</p>
            </div>
            <div class="tip-item">
              <span class="tip-index">02</span>
              <p>优先上传清晰封面图，文章列表和详情页的视觉会明显更完整。</p>
            </div>
            <div class="tip-item">
              <span class="tip-index">03</span>
              <p>正文建议按段落和小标题分层，阅读体验会更好。</p>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { createArticle, updateArticle, getArticleDetail } from '@/api/article'
import ImageUpload from '@/components/ImageUpload.vue'

const router = useRouter()
const route = useRoute()

const isEdit = ref(false)
const articleId = ref(0)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  title: '',
  logo: '',
  content: ''
})

const plainContent = computed(() =>
  form.content.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
)

const contentWordCount = computed(() => plainContent.value.length)
const estimatedReadMinutes = computed(() => Math.max(1, Math.ceil(contentWordCount.value / 400)))

const rules: FormRules = {
  title: [{ required: true, message: '请输入文章标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入文章内容', trigger: 'blur' }]
}

const editorRef = shallowRef()

const toolbarConfig = {
  excludeKeys: []
}

const editorConfig = {
  placeholder: '请输入文章内容...',
  MENU_CONF: {
    uploadImage: {
      server: '/api/upload/image',
      fieldName: 'file',
      maxFileSize: 5 * 1024 * 1024,
      allowedFileTypes: ['image/*'],
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      customInsert(res: any, insertFn: any) {
        // 后端统一响应格式：{ code: 200, data: { url: '...' } }
        const fileUrl = res?.data?.url || res?.url
        const url = `/api${fileUrl}`
        insertFn(url, '', url)
      }
    }
  }
}

const handleCreated = (editor: any) => {
  editorRef.value = editor
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      if (isEdit.value) {
        await updateArticle(articleId.value, {
          title: form.title,
          logo: form.logo || undefined,
          content: form.content
        })
        ElMessage.success('更新成功')
      } else {
        await createArticle({
          title: form.title,
          logo: form.logo || undefined,
          content: form.content
        })
        ElMessage.success('发布成功')
      }
      router.push('/articles')
    } catch (error) {
      ElMessage.error(isEdit.value ? '更新失败' : '发布失败')
    } finally {
      submitting.value = false
    }
  })
}

const goBack = () => {
  router.back()
}

const fetchArticleDetail = async (id: number) => {
  try {
    const res: any = await getArticleDetail(id)
    form.title = res.title
    form.logo = res.logo || ''
    form.content = res.content
  } catch (error) {
    ElMessage.error('获取文章详情失败')
    router.push('/articles')
  }
}

onMounted(() => {
  const id = route.query.id
  if (id) {
    isEdit.value = true
    articleId.value = Number(id)
    fetchArticleDetail(articleId.value)
  }
})

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor) {
    editor.destroy()
  }
})
</script>

<style scoped>
.article-edit {
  width: 100%;
}

.article-edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.page-title-block {
  min-width: 0;
}

.page-kicker {
  margin-bottom: 8px;
  color: #8ca0bc;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.page-header h2 {
  margin: 0;
  font-size: 30px;
  font-weight: 700;
  color: #243755;
}

.page-description {
  margin-top: 10px;
  color: #7d90af;
  font-size: 14px;
  line-height: 1.7;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.header-chip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(122, 160, 211, 0.16);
  box-shadow: 0 10px 22px rgba(91, 119, 164, 0.08);
}

.header-chip-label {
  color: #8ca0bc;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.header-chip-value {
  color: #294063;
  font-size: 14px;
  font-weight: 700;
}

.edit-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
}

.edit-card {
  border-radius: 28px !important;
  border: 1px solid rgba(122, 160, 211, 0.16) !important;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 249, 255, 0.94)) !important;
  box-shadow: 0 18px 38px rgba(95, 124, 170, 0.12) !important;
}

.edit-card :deep(.el-card__header),
.side-card :deep(.el-card__header) {
  padding: 22px 24px 16px;
  border-bottom: 1px solid rgba(122, 160, 211, 0.12);
}

.edit-card :deep(.el-card__body) {
  padding: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.card-kicker {
  margin-bottom: 8px;
  color: #8ca0bc;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.card-title-row {
  color: #243755;
  font-size: 18px;
  font-weight: 700;
}

.card-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(47, 145, 255, 0.12), rgba(124, 77, 255, 0.12));
  color: #2f69d0;
  font-size: 12px;
  font-weight: 700;
}

.article-form :deep(.el-form-item) {
  margin-bottom: 26px;
}

.article-form :deep(.el-form-item__label) {
  color: #50637f;
  font-size: 14px;
  font-weight: 700;
}

.edit-side {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.side-card {
  border-radius: 24px !important;
  border: 1px solid rgba(122, 160, 211, 0.16) !important;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 249, 255, 0.94)) !important;
  box-shadow: 0 16px 32px rgba(95, 124, 170, 0.1) !important;
}

.side-card :deep(.el-card__body) {
  padding: 20px 22px 22px;
}

.side-card-header {
  color: #243755;
  font-size: 16px;
  font-weight: 700;
}

.summary-list,
.tips-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-item,
.tip-item {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(122, 160, 211, 0.12);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.summary-label {
  color: #7d90af;
  font-size: 13px;
}

.summary-value {
  color: #243755;
  font-size: 14px;
  font-weight: 700;
}

.tip-item {
  display: flex;
  gap: 12px;
}

.tip-item p {
  margin: 0;
  color: #6d819f;
  font-size: 13px;
  line-height: 1.7;
}

.tip-index {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(47, 145, 255, 0.12), rgba(124, 77, 255, 0.12));
  color: #2f69d0;
  font-size: 12px;
  font-weight: 700;
}

.editor-wrapper {
  width: 100%;
  overflow: hidden;
  border: 1px solid rgba(122, 160, 211, 0.16);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.editor-toolbar {
  border-bottom: 1px solid rgba(122, 160, 211, 0.12);
  background: linear-gradient(180deg, rgba(249, 252, 255, 0.96), rgba(242, 247, 255, 0.92));
}

.editor-content {
  height: 500px !important;
  overflow-y: hidden;
}

.editor-toolbar :deep(.w-e-bar) {
  background: transparent;
  border: 0;
}

.editor-toolbar :deep(.w-e-menu) {
  border-radius: 10px;
}

.editor-content :deep(.w-e-text-container) {
  background-color: rgba(255, 255, 255, 0.9);
  height: 500px !important;
}

.editor-content :deep(.w-e-scroll) {
  height: 500px !important;
  overflow-y: auto;
}

.editor-content :deep(.w-e-text-container [data-slate-editor]) {
  padding: 0 18px 22px;
}

.editor-content :deep(.w-e-text-placeholder) {
  color: #9aaac2;
}

.editor-content :deep(.w-e-text-container blockquote) {
  border-left: 4px solid #2f91ff;
  color: #5d7395;
}

@media (max-width: 1024px) {
  .edit-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .article-edit-header,
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
