<template>
  <div class="markdown-body" v-html="html"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'
import 'highlight.js/styles/github.css'

const props = defineProps<{
  content: string
}>()

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const md: MarkdownIt = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  highlight(code: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="code-block hljs"><code class="language-${lang}">${
          hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
        }</code></pre>`
      } catch {
        /* fall through */
      }
    }
    return `<pre class="code-block hljs"><code>${escapeHtml(code)}</code></pre>`
  },
})

const html = computed(() => {
  if (!props.content) return ''
  return DOMPurify.sanitize(md.render(props.content))
})
</script>

<style scoped>
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin: 12px 0 8px;
  font-weight: 600;
  line-height: 1.4;
}
.markdown-body :deep(h1) { font-size: 20px; }
.markdown-body :deep(h2) { font-size: 18px; }
.markdown-body :deep(h3) { font-size: 16px; }
.markdown-body :deep(h4) { font-size: 15px; }

.markdown-body :deep(p) {
  margin: 6px 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 6px 0;
  padding-left: 24px;
}

.markdown-body :deep(li) {
  margin: 3px 0;
}

.markdown-body :deep(blockquote) {
  margin: 8px 0;
  padding: 4px 12px;
  border-left: 3px solid #409eff;
  background: rgba(64, 158, 255, 0.06);
  color: #606266;
}

.markdown-body :deep(a) {
  color: #409eff;
  text-decoration: none;
}
.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  margin: 8px 0;
  font-size: 13px;
}
.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid #e4e7ed;
  padding: 6px 10px;
}
.markdown-body :deep(th) {
  background: #f5f7fa;
  font-weight: 600;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid #e4e7ed;
  margin: 12px 0;
}

.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 6px;
}

/* 代码块 */
.markdown-body :deep(.code-block),
.markdown-body :deep(pre) {
  background: #1e1e1e !important;
  color: #d4d4d4;
  padding: 12px 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
  font-size: 13px;
  line-height: 1.5;
}

.markdown-body :deep(.code-block code),
.markdown-body :deep(pre code) {
  background: transparent !important;
  padding: 0;
  color: inherit;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

/* 行内代码 */
.markdown-body :deep(p code),
.markdown-body :deep(li code) {
  background: #f0f2f5;
  color: #c7254e;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}
</style>
