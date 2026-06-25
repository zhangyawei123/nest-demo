<template>
  <div class="tool-panel-content ai-draw-tool">
    <el-form :model="form" label-width="92px" label-position="left">
      <el-form-item label="模型">
        <el-input v-model="form.model" placeholder="gpt-image-2" />
      </el-form-item>

      <el-form-item label="图片尺寸">
        <el-input
          v-model="form.size"
          placeholder="例如 1024x1024 / 1024x1536，留空表示模型默认"
        >
          <template #append>
            <el-select
              v-model="sizePreset"
              placeholder="预设"
              style="width: 140px"
              @change="onPresetChange"
            >
              <el-option label="留空" value="" />
              <el-option label="1024x1024" value="1024x1024" />
              <el-option label="1024x1536" value="1024x1536" />
              <el-option label="1536x1024" value="1536x1024" />
              <el-option label="768x1344" value="768x1344" />
              <el-option label="1344x768" value="1344x768" />
            </el-select>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="返回格式">
        <el-radio-group v-model="form.response_format">
          <el-radio value="url">URL</el-radio>
          <el-radio value="b64_json">Base64</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="参考图">
        <div class="image-config">
          <el-upload
            class="image-uploader"
            :action="uploadUrl"
            :headers="uploadHeaders"
            name="file"
            accept="image/*"
            :show-file-list="false"
            :before-upload="beforeUpload"
            :on-success="onUploadSuccess"
            :on-error="onUploadError"
          >
            <el-button type="primary" plain>上传图片</el-button>
            <template #tip>
              <span class="upload-tip"
                >可选，最多上传 4 张，作为参考图传给生图模型</span
              >
            </template>
          </el-upload>

          <div class="manual-url">
            <el-input
              v-model="manualUrl"
              placeholder="或直接粘贴图片 URL 后回车添加"
              clearable
              @keyup.enter="addManualUrl"
            >
              <template #append>
                <el-button @click="addManualUrl">添加</el-button>
              </template>
            </el-input>
          </div>

          <div v-if="form.image.length" class="image-list">
            <div
              v-for="(url, index) in form.image"
              :key="url + index"
              class="image-item"
            >
              <el-image
                :src="resolveImageUrl(url)"
                fit="cover"
                class="image-thumb"
                :preview-src-list="form.image.map(resolveImageUrl)"
                :initial-index="index"
                preview-teleported
              />
              <div class="image-meta">
                <span class="image-url" :title="url">{{ url }}</span>
                <el-button
                  type="danger"
                  link
                  size="small"
                  @click="removeImage(index)"
                  >移除</el-button
                >
              </div>
            </div>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="描述词">
        <el-input
          v-model="form.prompt"
          type="textarea"
          :rows="6"
          maxlength="3000"
          show-word-limit
          placeholder="请输入你想生成的图片内容"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="loading" @click="handleGenerate"
          >开始生成</el-button
        >
        <el-button :disabled="loading" @click="handleReset">重置表单</el-button>
        <span v-if="lastRecordId" class="record-id"
          >记录 ID：{{ lastRecordId }}</span
        >
      </el-form-item>
    </el-form>

    <div v-if="resultUrls.length" class="result-panel">
      <h4 class="result-title">生成结果</h4>
      <div class="result-grid">
        <div
          v-for="(url, index) in resultUrls"
          :key="url + index"
          class="result-card"
        >
          <el-image
            :src="resolveImageUrl(url)"
            fit="contain"
            class="result-image"
            :preview-src-list="resultUrls.map(resolveImageUrl)"
            :initial-index="index"
            preview-teleported
          />
          <div class="result-actions">
            <el-button size="small" @click="copyText(url)">复制链接</el-button>
            <el-button size="small" type="primary" @click="openUrl(url)"
              >新窗口打开</el-button
            >
          </div>
        </div>
      </div>
    </div>

    <el-alert
      v-if="resultRaw && !resultUrls.length && !loading"
      type="warning"
      :closable="false"
      show-icon
      title="接口已返回，但没有可展示的图片 URL，可能返回了 b64_json，请切换返回格式或查看原始响应。"
      style="margin-top: 16px"
    />

    <el-collapse
      v-if="resultRaw"
      v-model="rawCollapse"
      style="margin-top: 16px"
    >
      <el-collapse-item title="查看原始响应" name="raw">
        <pre class="raw-json">{{ rawJson }}</pre>
      </el-collapse-item>
    </el-collapse>

    <section class="history-panel">
      <div class="history-header">
        <div>
          <h4 class="history-title">历史生图</h4>
          <p class="history-desc">
            生成完成的图片会保存到自己的服务器，历史记录中展示的是长期可访问地址。
          </p>
        </div>
        <div class="history-actions">
          <el-input
            v-model="historyQuery.keyword"
            placeholder="搜索提示词或模型"
            clearable
            class="history-search"
            @keyup.enter="searchHistory"
            @clear="searchHistory"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select
            v-model="historyQuery.status"
            placeholder="状态"
            clearable
            class="history-status"
            @change="searchHistory"
          >
            <el-option label="全部" value="" />
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
            <el-option label="生成中" value="pending" />
          </el-select>
          <el-button
            :icon="Refresh"
            :loading="historyLoading"
            @click="fetchHistory"
            >刷新</el-button
          >
        </div>
      </div>

      <div v-loading="historyLoading" class="history-body">
        <el-empty
          v-if="!historyLoading && !historyList.length"
          description="暂无生图历史"
        />

        <div v-else class="history-list">
          <article
            v-for="record in historyList"
            :key="record.id"
            class="history-item"
          >
            <div class="history-thumb-wrap">
              <el-image
                v-if="record.generatedUrls?.length"
                :src="firstRecordUrl(record)"
                fit="cover"
                class="history-thumb"
                :preview-src-list="recordUrls(record)"
                preview-teleported
              />
              <div v-else class="history-thumb-empty">
                <el-icon><Picture /></el-icon>
              </div>
            </div>

            <div class="history-content">
              <div class="history-row">
                <div class="history-prompt" :title="record.prompt">
                  {{ record.prompt }}
                </div>
                <el-tag :type="statusType(record.status)" size="small">{{
                  statusText(record.status)
                }}</el-tag>
              </div>
              <div class="history-meta">
                <span>#{{ record.id }}</span>
                <span>{{ record.model }}</span>
                <span>{{ record.size || '默认尺寸' }}</span>
                <span>{{ formatTime(record.createdAt) }}</span>
              </div>
              <div v-if="record.errorMessage" class="history-error">
                {{ record.errorMessage }}
              </div>
              <div class="history-record-actions">
                <el-button
                  size="small"
                  :icon="RefreshRight"
                  :disabled="loading"
                  @click="reuseRecord(record)"
                >
                  再次生成
                </el-button>
                <el-button
                  v-if="record.generatedUrls?.length"
                  size="small"
                  :icon="CopyDocument"
                  @click="copyText(firstRecordUrl(record))"
                >
                  复制首图
                </el-button>
                <el-button
                  v-if="record.generatedUrls?.length"
                  size="small"
                  type="primary"
                  @click="openUrl(firstRecordUrl(record))"
                >
                  打开
                </el-button>
              </div>
            </div>
          </article>
        </div>

        <div
          v-if="historyTotal > historyQuery.pageSize"
          class="history-pagination"
        >
          <el-pagination
            v-model:current-page="historyQuery.page"
            v-model:page-size="historyQuery.pageSize"
            layout="total, sizes, prev, pager, next"
            :page-sizes="[8, 12, 20, 40]"
            :total="historyTotal"
            @current-change="fetchHistory"
            @size-change="handleHistorySizeChange"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { UploadProps } from 'element-plus';
import {
  CopyDocument,
  Picture,
  Refresh,
  RefreshRight,
  Search,
} from '@element-plus/icons-vue';
import {
  generateImage,
  getDrawGenerationHistory,
  type DrawGenerationRecord,
  type GenerateImageResponse,
} from '@/api/draw';
import { getUploadedAssetUrl, normalizeAssetUrl } from '@/utils/upload-url';

const defaultForm = () => ({
  model: 'gpt-image-2',
  prompt: '生成一张边牧与古牧正在抖音直播间直播带货截图',
  image: [] as string[],
  size: '1024x1024',
  response_format: 'url',
});

const form = reactive(defaultForm());
const sizePreset = ref('1024x1024');
const manualUrl = ref('');
const loading = ref(false);
const resultRaw = ref<GenerateImageResponse | null>(null);
const lastRecordId = ref<number | null>(null);
const rawCollapse = ref<string[]>([]);
const historyLoading = ref(false);
const historyList = ref<DrawGenerationRecord[]>([]);
const historyTotal = ref(0);
const historyQuery = reactive({
  page: 1,
  pageSize: 8,
  keyword: '',
  status: '' as '' | 'pending' | 'success' | 'failed',
});

const uploadUrl = '/api/upload/image';
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
}));

const resultUrls = computed(() => {
  const data = resultRaw.value?.data;
  if (!Array.isArray(data)) return [] as string[];
  return data
    .map((item) => item?.url)
    .filter((url): url is string => Boolean(url));
});

const rawJson = computed(() => {
  if (!resultRaw.value) return '';
  try {
    return JSON.stringify(resultRaw.value, null, 2);
  } catch {
    return String(resultRaw.value);
  }
});

const resolveImageUrl = (url: string) => {
  return normalizeAssetUrl(url);
};

const onPresetChange = (value: string) => {
  form.size = value;
};

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  if (form.image.length >= 4) {
    ElMessage.warning('参考图最多上传 4 张');
    return false;
  }
  const sizeMb = file.size / 1024 / 1024;
  if (sizeMb > 5) {
    ElMessage.warning('单张图片大小不能超过 5MB');
    return false;
  }
  return true;
};

const onUploadSuccess: UploadProps['onSuccess'] = (response) => {
  const url = getUploadedAssetUrl(response);
  if (!url) {
    ElMessage.error('上传成功但未返回 URL');
    return;
  }
  form.image.push(url);
  ElMessage.success('图片已添加');
};

const onUploadError: UploadProps['onError'] = () => {
  ElMessage.error('图片上传失败');
};

const addManualUrl = () => {
  const url = manualUrl.value.trim();
  if (!url) return;
  if (form.image.length >= 4) {
    ElMessage.warning('参考图最多 4 张');
    return;
  }
  form.image.push(url);
  manualUrl.value = '';
};

const removeImage = (index: number) => {
  form.image.splice(index, 1);
};

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success('已复制');
  } catch {
    ElMessage.error('复制失败，请手动复制');
  }
};

const openUrl = (url: string) => {
  window.open(url, '_blank', 'noopener');
};

const handleGenerate = async () => {
  const prompt = form.prompt.trim();
  if (!prompt) {
    ElMessage.warning('请输入生图描述');
    return;
  }

  loading.value = true;
  resultRaw.value = null;
  lastRecordId.value = null;

  try {
    const resp = await generateImage({
      model: form.model.trim() || 'gpt-image-2',
      prompt,
      image: form.image.length ? form.image.slice() : [],
      size: form.size.trim(),
      response_format: form.response_format || 'url',
    });
    const data = resp as unknown as GenerateImageResponse;
    resultRaw.value = data;
    lastRecordId.value = data?.id ?? null;
    if (!resultUrls.value.length) {
      rawCollapse.value = ['raw'];
    }
    ElMessage.success('生成完成');
    fetchHistory();
  } catch (e: any) {
    const message = e?.response?.data?.message || e?.message || '生图失败';
    ElMessage.error(message);
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  Object.assign(form, defaultForm());
  sizePreset.value = '1024x1024';
  manualUrl.value = '';
  resultRaw.value = null;
  lastRecordId.value = null;
};

const fetchHistory = async () => {
  historyLoading.value = true;
  try {
    const res = await getDrawGenerationHistory({
      page: historyQuery.page,
      pageSize: historyQuery.pageSize,
      keyword: historyQuery.keyword.trim() || undefined,
      status: historyQuery.status || undefined,
    });
    historyList.value = res?.list || [];
    historyTotal.value = res?.total || 0;
  } catch (e: any) {
    const message =
      e?.response?.data?.message || e?.message || '获取历史生图失败';
    ElMessage.error(message);
  } finally {
    historyLoading.value = false;
  }
};

const searchHistory = () => {
  historyQuery.page = 1;
  fetchHistory();
};

const handleHistorySizeChange = () => {
  historyQuery.page = 1;
  fetchHistory();
};

const reuseRecord = (record: DrawGenerationRecord) => {
  form.model = record.model || 'gpt-image-2';
  form.prompt = record.prompt || '';
  form.image = Array.isArray(record.image)
    ? record.image.filter((item): item is string => typeof item === 'string')
    : [];
  form.size = record.size || '';
  form.response_format = record.responseFormat || 'url';
  sizePreset.value = form.size;
  resultRaw.value = null;
  lastRecordId.value = record.id;
  ElMessage.success('已回填历史参数');
};

const recordUrls = (record: DrawGenerationRecord) => {
  return (record.generatedUrls || []).map(resolveImageUrl).filter(Boolean);
};

const firstRecordUrl = (record: DrawGenerationRecord) => {
  return recordUrls(record)[0] || '';
};

const statusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '生成中',
    success: '成功',
    failed: '失败',
  };
  return map[status] || status || '-';
};

const statusType = (status: string) => {
  if (status === 'success') return 'success';
  if (status === 'failed') return 'danger';
  if (status === 'pending') return 'warning';
  return 'info';
};

const formatTime = (value: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN');
};

onMounted(() => {
  fetchHistory();
});
</script>

<style scoped>
.ai-draw-tool {
  padding: 4px 4px 16px;
}

.upload-tip {
  margin-left: 12px;
  color: #909399;
  font-size: 12px;
}

.image-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.manual-url {
  max-width: 520px;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 160px;
}

.image-thumb {
  width: 160px;
  height: 160px;
  border-radius: 8px;
  background: #f5f7fa;
  border: 1px solid #ebeef5;
}

.image-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.image-url {
  flex: 1;
  font-size: 12px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-id {
  margin-left: 16px;
  color: #909399;
  font-size: 12px;
}

.result-panel {
  margin-top: 16px;
}

.result-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.result-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  background: #ffffff;
}

.result-image {
  width: 100%;
  max-height: 360px;
  background: #f5f7fa;
  border-radius: 8px;
}

.result-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.raw-json {
  margin: 0;
  padding: 12px;
  max-height: 360px;
  overflow: auto;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 12px;
  color: #303133;
  white-space: pre-wrap;
  word-break: break-all;
}

.history-panel {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.history-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.history-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 700;
  color: #303133;
}

.history-desc {
  margin: 0;
  color: #909399;
  font-size: 13px;
  line-height: 1.6;
}

.history-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.history-search {
  width: 240px;
}

.history-status {
  width: 116px;
}

.history-body {
  min-height: 140px;
}

.history-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 12px;
}

.history-item {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 12px;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  background: #fff;
}

.history-thumb-wrap {
  width: 112px;
  height: 112px;
}

.history-thumb,
.history-thumb-empty {
  width: 112px;
  height: 112px;
  border-radius: 10px;
  border: 1px solid #ebeef5;
  background: #f5f7fa;
}

.history-thumb-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a8abb2;
  font-size: 28px;
}

.history-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.history-prompt {
  min-width: 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.45;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.history-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  color: #909399;
  font-size: 12px;
}

.history-error {
  color: #f56c6c;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-all;
}

.history-record-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: auto;
}

.history-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

@media (max-width: 768px) {
  .history-header {
    flex-direction: column;
  }

  .history-actions,
  .history-search,
  .history-status {
    width: 100%;
  }

  .history-list {
    grid-template-columns: 1fr;
  }

  .history-item {
    grid-template-columns: 88px minmax(0, 1fr);
  }

  .history-thumb-wrap,
  .history-thumb,
  .history-thumb-empty {
    width: 88px;
    height: 88px;
  }
}
</style>
