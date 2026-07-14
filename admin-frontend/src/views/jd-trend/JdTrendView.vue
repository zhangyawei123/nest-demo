<template>
  <div class="trend-page">
    <header class="page-header">
      <div>
        <span class="eyebrow">JD PRODUCT WATCH</span>
        <h2>京东商品趋势监控</h2>
        <p>
          每六小时记录公开页面中的价格、评价数和榜单名次，并汇总当天价格区间。
        </p>
      </div>
      <el-button type="primary" :loading="collecting" @click="handleCollect">
        <el-icon><Refresh /></el-icon>
        生成今日报告
      </el-button>
    </header>

    <section class="status-band" v-if="configuration">
      <div class="status-item">
        <span>定时采集</span>
        <strong
          >{{ configuration.collectionSchedule.join(' / ') }} ·
          {{ configuration.timeZone }}</strong
        >
      </div>
      <div class="status-item">
        <span>{{ configuration.riskCooldownUntil ? '采集状态' : '操作间隔' }}</span>
        <strong>{{ collectionSafetyLabel }}</strong>
      </div>
      <div class="status-item">
        <span>Cookie</span>
        <el-tag :type="configuration.cookieConfigured ? 'success' : 'warning'">
          {{ configuration.cookieConfigured ? '已配置' : '未配置' }}
        </el-tag>
      </div>
      <div class="status-item">
        <span>消息提醒</span>
        <strong>{{ notificationLabel }}</strong>
      </div>
    </section>

    <el-tabs v-model="activeTab" class="trend-tabs">
      <el-tab-pane label="今日分析" name="report">
        <section class="report-section" v-loading="reportLoading">
          <template v-if="latestReport">
            <div class="report-head">
              <div>
                <span class="report-date">{{ latestReport.reportDate }}</span>
                <h3>商品趋势日报</h3>
              </div>
              <div class="report-stats">
                <div>
                  <strong>{{ latestReport.productCount }}</strong
                  ><span>监控商品</span>
                </div>
                <div>
                  <strong>{{ latestReport.successCount }}</strong
                  ><span>采集成功</span>
                </div>
                <div>
                  <strong>{{ statusLabel(latestReport.status) }}</strong
                  ><span>报告状态</span>
                </div>
              </div>
            </div>

            <el-alert
              :title="latestReport.summary.message"
              :type="latestReport.status === 'complete' ? 'success' : 'warning'"
              :closable="false"
              show-icon
            />

            <el-table
              :data="latestReport.items"
              class="trend-table"
              empty-text="今天还没有商品数据"
            >
              <el-table-column prop="sku" label="SKU" width="135" />
              <el-table-column label="商品" min-width="300">
                <template #default="{ row }">
                  <a
                    :href="row.productUrl"
                    target="_blank"
                    rel="noreferrer"
                    class="product-link"
                  >
                    {{ row.title || row.sku }}
                  </a>
                  <span class="shop-name">{{ row.shop || '店铺未知' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="当前价格" width="130" align="right">
                <template #default="{ row }">
                  <strong>{{ money(row.price) }}</strong>
                  <span :class="changeClass(row.priceChange)">{{
                    signed(row.priceChange)
                  }}</span>
                </template>
              </el-table-column>
              <el-table-column label="今日价格区间" width="170" align="right">
                <template #default="{ row }">
                  <strong>{{
                    priceRange(row.dailyMinPrice, row.dailyMaxPrice)
                  }}</strong>
                  <span class="change neutral"
                    >{{ row.sampleCount }} 次采样</span
                  >
                </template>
              </el-table-column>
              <el-table-column label="评价数" width="140" align="right">
                <template #default="{ row }">
                  <strong>{{ number(row.commentCount) }}</strong>
                  <span :class="changeClass(row.commentChange, true)">{{
                    signed(row.commentChange)
                  }}</span>
                </template>
              </el-table-column>
              <el-table-column label="榜单名次" width="140" align="right">
                <template #default="{ row }">
                  <strong>{{
                    row.rankPosition ? `第 ${row.rankPosition} 名` : '-'
                  }}</strong>
                  <span :class="changeClass(row.rankChange, true)">{{
                    signed(row.rankChange)
                  }}</span>
                </template>
              </el-table-column>
              <el-table-column label="页面状态" width="110">
                <template #default="{ row }">
                  <el-tag
                    :type="row.pageStatus === 'ok' ? 'success' : 'danger'"
                  >
                    {{ pageStatusLabel(row.pageStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </template>
          <el-empty
            v-else
            description="还没有日报，请先添加商品并生成今日报告"
          />
        </section>
      </el-tab-pane>

      <el-tab-pane label="监控商品" name="products">
        <section class="product-section">
          <div class="product-toolbar">
            <el-input
              v-model="newProductValue"
              placeholder="粘贴京东商品链接或输入 SKU"
              clearable
              @keyup.enter="handleAddProduct"
            />
            <el-input
              v-model="newProductName"
              placeholder="备注名称（可选）"
              clearable
            />
            <el-button
              type="primary"
              :loading="addingProduct"
              @click="handleAddProduct"
            >
              <el-icon><Plus /></el-icon>
              添加
            </el-button>
          </div>

          <el-table
            :data="products"
            v-loading="productLoading"
            empty-text="还没有监控商品"
          >
            <el-table-column prop="sku" label="SKU" width="150" />
            <el-table-column label="商品" min-width="320">
              <template #default="{ row }">
                <a
                  :href="row.url"
                  target="_blank"
                  rel="noreferrer"
                  class="product-link"
                >
                  {{ row.name || row.url }}
                </a>
              </template>
            </el-table-column>
            <el-table-column label="监控" width="100">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.enabled"
                  @change="handleToggle(row, $event)"
                />
              </template>
            </el-table-column>
            <el-table-column label="添加时间" width="180">
              <template #default="{ row }">{{
                formatDate(row.createdAt)
              }}</template>
            </el-table-column>
            <el-table-column label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <el-button
                  circle
                  text
                  type="danger"
                  title="删除商品"
                  @click="handleDelete(row)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </el-tab-pane>

      <el-tab-pane label="历史报告" name="history">
        <section class="history-section">
          <el-table
            :data="reports"
            v-loading="historyLoading"
            empty-text="暂无历史报告"
          >
            <el-table-column prop="reportDate" label="日期" width="150" />
            <el-table-column prop="productCount" label="商品数" width="110" />
            <el-table-column prop="successCount" label="成功数" width="110" />
            <el-table-column label="最近采集" width="130">
              <template #default="{ row }">{{
                collectionSlotLabel(row.collectionSlot)
              }}</template>
            </el-table-column>
            <el-table-column label="Cookie" width="130">
              <template #default="{ row }">{{
                cookieStatusLabel(row.cookieStatus)
              }}</template>
            </el-table-column>
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <el-tag
                  :type="row.status === 'complete' ? 'success' : 'warning'"
                >
                  {{ statusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="更新时间" min-width="180">
              <template #default="{ row }">{{
                formatDate(row.updatedAt)
              }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button text type="primary" @click="showReport(row)"
                  >查看</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </section>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Delete, Plus, Refresh } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  collectJdTrends,
  createJdTrendProduct,
  deleteJdTrendProduct,
  getJdTrendConfiguration,
  getJdTrendProducts,
  getJdTrendReports,
  getLatestJdTrendReport,
  updateJdTrendProduct,
  type JdTrendConfiguration,
  type JdTrendProduct,
  type JdTrendReport,
} from '@/api/jd-trend';

const activeTab = ref('report');
const products = ref<JdTrendProduct[]>([]);
const reports = ref<JdTrendReport[]>([]);
const latestReport = ref<JdTrendReport | null>(null);
const configuration = ref<JdTrendConfiguration | null>(null);
const newProductValue = ref('');
const newProductName = ref('');
const collecting = ref(false);
const addingProduct = ref(false);
const productLoading = ref(false);
const reportLoading = ref(false);
const historyLoading = ref(false);

const notificationLabel = computed(() => {
  const labels = [];
  if (configuration.value?.dingtalkConfigured) labels.push('钉钉');
  if (configuration.value?.wecomConfigured) labels.push('企业微信');
  return labels.length ? labels.join(' + ') : '未配置';
});

const collectionSafetyLabel = computed(() =>
  configuration.value?.riskCooldownUntil
    ? `安全冷却至 ${formatDate(configuration.value.riskCooldownUntil)}`
    : `${configuration.value?.pacingSeconds || '-'} 秒`,
);

const loadProducts = async () => {
  productLoading.value = true;
  try {
    products.value = await getJdTrendProducts();
  } finally {
    productLoading.value = false;
  }
};

const loadReport = async () => {
  reportLoading.value = true;
  try {
    latestReport.value = await getLatestJdTrendReport();
  } finally {
    reportLoading.value = false;
  }
};

const loadHistory = async () => {
  historyLoading.value = true;
  try {
    reports.value = await getJdTrendReports();
  } finally {
    historyLoading.value = false;
  }
};

const handleAddProduct = async () => {
  if (!newProductValue.value.trim()) {
    ElMessage.warning('请输入京东商品链接或 SKU');
    return;
  }
  addingProduct.value = true;
  try {
    await createJdTrendProduct({
      value: newProductValue.value.trim(),
      name: newProductName.value.trim() || undefined,
    });
    newProductValue.value = '';
    newProductName.value = '';
    ElMessage.success('商品已加入监控');
    await loadProducts();
  } finally {
    addingProduct.value = false;
  }
};

const handleToggle = async (
  product: JdTrendProduct,
  enabled: string | number | boolean,
) => {
  await updateJdTrendProduct(product.id, { enabled: Boolean(enabled) });
  product.enabled = Boolean(enabled);
};

const handleDelete = async (product: JdTrendProduct) => {
  await ElMessageBox.confirm(
    `确定删除 SKU ${product.sku} 吗？历史报告不会删除。`,
    '删除商品',
    {
      type: 'warning',
    },
  );
  await deleteJdTrendProduct(product.id);
  ElMessage.success('已删除');
  await loadProducts();
};

const handleCollect = async () => {
  if (!products.value.some((product) => product.enabled)) {
    ElMessage.warning('请先添加并启用至少一个商品');
    activeTab.value = 'products';
    return;
  }
  collecting.value = true;
  try {
    latestReport.value = await collectJdTrends();
    ElMessage.success('今天的趋势报告已生成');
    await loadHistory();
    activeTab.value = 'report';
  } finally {
    collecting.value = false;
  }
};

const showReport = (report: JdTrendReport) => {
  latestReport.value = report;
  activeTab.value = 'report';
};

const money = (value: number | null) =>
  value === null ? '-' : `¥${Number(value).toFixed(2)}`;
const priceRange = (minimum: number | null, maximum: number | null) => {
  if (minimum === null || maximum === null) return '-';
  if (minimum === maximum) return money(minimum);
  return `${money(minimum)} - ${money(maximum)}`;
};
const number = (value: number | null) =>
  value === null ? '-' : Number(value).toLocaleString('zh-CN');
const signed = (value: number | null) =>
  value === null ? '无对比' : `${value > 0 ? '+' : ''}${value}`;
const changeClass = (value: number | null, positiveIsGood = false) => {
  if (value === null || value === 0) return 'change neutral';
  const good = positiveIsGood ? value > 0 : value < 0;
  return `change ${good ? 'good' : 'bad'}`;
};
const formatDate = (value: string) => new Date(value).toLocaleString('zh-CN');
const statusLabel = (value: string) =>
  ({ complete: '完整', partial: '部分成功', failed: '失败', empty: '无商品' })[
    value
  ] || value;
const pageStatusLabel = (value: string) =>
  ({
    ok: '正常',
    login_required: '需登录',
    risk_control: '安全验证',
    unavailable: '已下架',
    error: '采集失败',
  })[value] || value;
const cookieStatusLabel = (value: string) =>
  ({
    valid: '有效',
    expired: '已失效',
    risk_control: '安全验证',
    missing: '未配置',
    not_checked: '未检查',
    check_failed: '检查失败',
  })[value] || value;
const collectionSlotLabel = (value: string) =>
  value ? `${value.slice(-2)}:00` : '-';

onMounted(async () => {
  await Promise.all([
    loadProducts(),
    loadReport(),
    loadHistory(),
    getJdTrendConfiguration().then((data) => {
      configuration.value = data;
    }),
  ]);
});
</script>

<style scoped>
.trend-page {
  padding: 28px 32px 44px;
  color: #243042;
}
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}
.eyebrow {
  color: #a72b2b;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
}
.page-header h2 {
  margin: 7px 0 5px;
  font-size: 28px;
  letter-spacing: 0;
}
.page-header p {
  margin: 0;
  color: #6b7280;
}
.status-band {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-block: 1px solid #e5e7eb;
  margin-bottom: 20px;
}
.status-item {
  min-height: 74px;
  padding: 16px 20px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.status-item:first-child {
  padding-left: 0;
}
.status-item:last-child {
  border-right: 0;
}
.status-item span {
  color: #7b8493;
  font-size: 12px;
}
.status-item strong {
  font-size: 14px;
}
.trend-tabs {
  --el-color-primary: #b42323;
}
.report-section,
.product-section,
.history-section {
  min-height: 420px;
  padding-top: 12px;
}
.report-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  margin-bottom: 20px;
}
.report-date {
  color: #a72b2b;
  font-size: 13px;
  font-weight: 700;
}
.report-head h3 {
  margin: 5px 0 0;
  font-size: 22px;
  letter-spacing: 0;
}
.report-stats {
  display: flex;
  gap: 34px;
}
.report-stats div {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
}
.report-stats strong {
  font-size: 20px;
}
.report-stats span {
  color: #8a93a2;
  font-size: 11px;
}
.trend-table {
  margin-top: 18px;
}
.product-link {
  color: #243042;
  font-weight: 600;
  text-decoration: none;
}
.product-link:hover {
  color: #b42323;
}
.shop-name,
.change {
  display: block;
  margin-top: 4px;
  color: #8a93a2;
  font-size: 12px;
}
.change.good {
  color: #16825d;
}
.change.bad {
  color: #c33b32;
}
.change.neutral {
  color: #8a93a2;
}
.product-toolbar {
  display: grid;
  grid-template-columns: minmax(260px, 1.5fr) minmax(180px, 1fr) auto;
  gap: 12px;
  margin-bottom: 18px;
}
@media (max-width: 900px) {
  .trend-page {
    padding: 20px 16px 36px;
  }
  .page-header,
  .report-head {
    align-items: flex-start;
    flex-direction: column;
  }
  .status-band {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .status-item:nth-child(2) {
    border-right: 0;
  }
  .product-toolbar {
    grid-template-columns: 1fr;
  }
  .report-stats {
    width: 100%;
    justify-content: space-between;
    gap: 16px;
  }
}
</style>
