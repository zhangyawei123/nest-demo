<template>
  <div class="article-edit">
    <div class="page-header">
      <h2>{{ isEdit ? '编辑文章' : '发布文章' }}</h2>
      <div class="header-actions">
        <el-button @click="goBack">返回</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存' : '发布' }}
        </el-button>
      </div>
    </div>

    <el-card class="edit-card">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, shallowRef } from 'vue'
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
        const url = `http://localhost:3000${fileUrl}`
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

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.edit-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.edit-card :deep(.el-card__body) {
  padding: 32px;
}

.logo-preview {
  margin-top: 12px;
}

.editor-wrapper {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
}

.editor-toolbar {
  border-bottom: 1px solid #dcdfe6;
}

.editor-content {
  height: 500px !important;
  overflow-y: hidden;
}

.editor-content :deep(.w-e-text-container) {
  background-color: #fff;
  height: 500px !important;
}

.editor-content :deep(.w-e-scroll) {
  height: 500px !important;
  overflow-y: auto;
}

.editor-content :deep(.w-e-text-placeholder) {
  color: #c0c4cc;
}
</style>
