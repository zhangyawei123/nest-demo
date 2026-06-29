<template>
  <el-header class="navbar">
    <div class="navbar-content">
      <div class="navbar-left">
        <div class="navbar-panel">
          <div class="navbar-kicker">Workspace Navigation</div>
          <div class="breadcrumb-row">
            <el-breadcrumb separator="/" class="breadcrumb">
              <el-breadcrumb-item :to="{ path: '/dashboard' }">
                <el-icon><HomeFilled /></el-icon>
                首页
              </el-breadcrumb-item>
              <el-breadcrumb-item v-if="props.currentRouteName">
                {{ props.currentRouteName }}
              </el-breadcrumb-item>
            </el-breadcrumb>
            <div class="page-indicator">{{ displayRouteName }}</div>
          </div>
        </div>
      </div>

      <div class="navbar-right">
        <div class="route-chip">
          <span class="route-chip-label">当前页面</span>
          <span class="route-chip-value">{{ displayRouteName }}</span>
        </div>
        <el-popover
          placement="bottom-end"
          width="440"
          trigger="click"
          @show="handlePointsPopoverShow"
        >
          <template #reference>
            <button class="points-chip" type="button">
              <span class="points-chip-icon">
                <el-icon><Coin /></el-icon>
              </span>
              <span class="points-chip-copy">
                <span class="points-chip-label">积分</span>
                <strong class="points-chip-value">{{
                  pointsProfile.points
                }}</strong>
              </span>
            </button>
          </template>

          <div class="points-popover">
            <div class="points-popover-head">
              <div>
                <div class="points-title">积分中心</div>
                <div class="points-subtitle">
                  连续签到每满 7 天，获得 1 次补签机会。
                </div>
              </div>
              <el-button
                type="primary"
                size="small"
                :disabled="pointsProfile.signedInToday"
                :loading="signingIn"
                @click="handleSignIn"
              >
                {{
                  pointsProfile.signedInToday
                    ? '今日已签'
                    : `签到 +${pointsProfile.todaySignInPoints}`
                }}
              </el-button>
            </div>

            <div class="points-balance-row">
              <div class="points-balance-card">
                <span>当前余额</span>
                <strong>{{ pointsProfile.points }}</strong>
              </div>
              <div class="points-rule-card">
                <span>连续签到</span>
                <strong>{{ pointsProfile.currentStreak }}</strong>
              </div>
              <div class="points-rule-card">
                <span>补签机会</span>
                <strong>{{ pointsProfile.makeupSignInChances }}</strong>
              </div>
              <div class="points-rule-card">
                <span>AI 聊天</span>
                <strong>-{{ pointsProfile.costs.aiChat }}</strong>
              </div>
              <div class="points-rule-card">
                <span>AI 生图</span>
                <strong>-{{ pointsProfile.costs.drawGeneration }}</strong>
              </div>
            </div>

            <div class="calendar-panel" v-loading="calendarLoading">
              <div class="calendar-head">
                <el-button
                  link
                  :icon="ArrowLeft"
                  @click="changeCalendarMonth(-1)"
                />
                <div class="calendar-title">
                  <el-icon><CalendarIcon /></el-icon>
                  {{ calendar.month }}
                </div>
                <el-button
                  link
                  :icon="ArrowRight"
                  @click="changeCalendarMonth(1)"
                />
              </div>
              <div class="calendar-weekdays">
                <span v-for="weekday in weekdays" :key="weekday">{{
                  weekday
                }}</span>
              </div>
              <div class="calendar-grid">
                <span
                  v-for="blank in calendarLeadingBlanks"
                  :key="'blank-' + blank"
                  class="calendar-empty"
                ></span>
                <button
                  v-for="day in calendar.days"
                  :key="day.date"
                  type="button"
                  :class="[
                    'calendar-day',
                    day.signedIn ? 'is-signed' : '',
                    day.isMakeup ? 'is-makeup' : '',
                    day.isToday ? 'is-today' : '',
                    canMakeup(day) ? 'can-makeup' : '',
                  ]"
                  :disabled="!canMakeup(day)"
                  :title="calendarDayTitle(day)"
                  @click="handleMakeupSignIn(day.date)"
                >
                  <span>{{ day.day }}</span>
                  <small v-if="day.signedIn">{{
                    day.isMakeup ? '补' : '签'
                  }}</small>
                </button>
              </div>
            </div>

            <div class="points-log-head">
              <span>最近流水</span>
              <el-button
                link
                size="small"
                :loading="pointLogsLoading"
                @click="loadPointLogs"
                >刷新</el-button
              >
            </div>
            <div v-if="pointLogs.length" class="points-log-list">
              <div
                v-for="log in pointLogs"
                :key="log.id"
                class="points-log-item"
              >
                <div class="points-log-main">
                  <span class="points-log-desc">{{
                    log.description || sceneText(log.scene)
                  }}</span>
                  <span class="points-log-time">{{
                    formatTime(log.createdAt)
                  }}</span>
                </div>
                <strong
                  :class="[
                    'points-log-amount',
                    log.amount > 0 ? 'is-plus' : 'is-minus',
                  ]"
                >
                  {{ log.amount > 0 ? '+' : '' }}{{ log.amount }}
                </strong>
              </div>
            </div>
            <el-empty v-else :image-size="70" description="暂无积分流水" />
          </div>
        </el-popover>
        <el-dropdown @command="handleCommand" trigger="click">
          <div class="user-avatar">
            <div class="avatar-shell">
              <el-avatar :size="38" class="avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
            </div>
            <div class="user-meta">
              <span class="user-greeting">欢迎回来</span>
              <span class="username">{{ props.username || '管理员' }}</span>
            </div>
            <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon>
                个人中心
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </el-header>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  HomeFilled,
  User,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  SwitchButton,
  Coin,
  Calendar as CalendarIcon,
} from '@element-plus/icons-vue';
import {
  getSignInCalendar,
  getPointLogs,
  getPointsProfile,
  makeupSignIn,
  signIn,
  type SignInCalendarDay,
  type PointLogItem,
} from '@/api/points';

const props = withDefaults(
  defineProps<{
    currentRouteName?: string;
    username?: string;
  }>(),
  {
    currentRouteName: '',
    username: '',
  },
);

const emit = defineEmits<{
  (e: 'command', command: 'profile' | 'logout'): void;
}>();

const displayRouteName = computed(() => props.currentRouteName || '控制台');
const signingIn = ref(false);
const calendarLoading = ref(false);
const pointLogsLoading = ref(false);
const pointLogs = ref<PointLogItem[]>([]);
const calendarMonth = ref(new Date().toISOString().slice(0, 7));
const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
const pointsProfile = reactive({
  points: 0,
  makeupSignInChances: 0,
  signedInToday: false,
  currentStreak: 0,
  todaySignInPoints: 2,
  costs: {
    drawGeneration: 2,
    aiChat: 1,
  },
});
const calendar = reactive({
  month: calendarMonth.value,
  days: [] as SignInCalendarDay[],
});
const calendarLeadingBlanks = computed(() => {
  if (!calendar.days.length) return 0;
  const firstDay = new Date(`${calendar.month}-01T00:00:00`).getDay();
  return firstDay === 0 ? 6 : firstDay - 1;
});

const handleCommand = (command: string | number | object) => {
  if (command === 'profile' || command === 'logout') {
    emit('command', command);
  }
};

const syncLocalUserPoints = (points: number) => {
  const raw = localStorage.getItem('userInfo');
  if (!raw) return;
  try {
    const user = JSON.parse(raw);
    user.points = points;
    localStorage.setItem('userInfo', JSON.stringify(user));
  } catch {}
};

const loadPointsProfile = async () => {
  try {
    const profile = await getPointsProfile();
    pointsProfile.points = profile.points ?? 0;
    pointsProfile.makeupSignInChances = profile.makeupSignInChances ?? 0;
    pointsProfile.signedInToday = !!profile.signedInToday;
    pointsProfile.currentStreak = profile.currentStreak ?? 0;
    pointsProfile.todaySignInPoints = profile.todaySignInPoints ?? 2;
    pointsProfile.costs.drawGeneration = profile.costs?.drawGeneration ?? 2;
    pointsProfile.costs.aiChat = profile.costs?.aiChat ?? 1;
    syncLocalUserPoints(pointsProfile.points);
  } catch {}
};

const loadPointLogs = async () => {
  pointLogsLoading.value = true;
  try {
    const res = await getPointLogs({ page: 1, pageSize: 6 });
    pointLogs.value = res?.list || [];
  } catch {
    pointLogs.value = [];
  } finally {
    pointLogsLoading.value = false;
  }
};

const loadCalendar = async () => {
  calendarLoading.value = true;
  try {
    const res = await getSignInCalendar({ month: calendarMonth.value });
    calendar.month = res.month;
    calendar.days = res.days || [];
    pointsProfile.points = res.points ?? pointsProfile.points;
    pointsProfile.makeupSignInChances =
      res.makeupSignInChances ?? pointsProfile.makeupSignInChances;
    pointsProfile.currentStreak = res.currentStreak ?? 0;
    syncLocalUserPoints(pointsProfile.points);
  } catch {
    calendar.days = [];
  } finally {
    calendarLoading.value = false;
  }
};

const handleSignIn = async () => {
  if (pointsProfile.signedInToday) return;
  signingIn.value = true;
  try {
    const res = await signIn();
    pointsProfile.points = res.points;
    pointsProfile.signedInToday = true;
    pointsProfile.currentStreak =
      res.currentStreak ?? pointsProfile.currentStreak;
    pointsProfile.makeupSignInChances =
      res.makeupSignInChances ?? pointsProfile.makeupSignInChances;
    syncLocalUserPoints(res.points);
    ElMessage.success(
      res.awardedMakeupChance
        ? `签到成功，获得 ${res.earned} 积分和 1 次补签机会`
        : res.alreadySignedIn
          ? '今日已签到'
          : `签到成功，获得 ${res.earned} 积分`,
    );
    loadPointLogs();
    loadCalendar();
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '签到失败');
  } finally {
    signingIn.value = false;
  }
};

const handleMakeupSignIn = async (date: string) => {
  try {
    const res = await makeupSignIn(date);
    pointsProfile.points = res.points;
    pointsProfile.makeupSignInChances = res.makeupSignInChances;
    pointsProfile.currentStreak =
      res.currentStreak ?? pointsProfile.currentStreak;
    syncLocalUserPoints(res.points);
    ElMessage.success(`补签成功，获得 ${res.earned} 积分`);
    loadCalendar();
    loadPointLogs();
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '补签失败');
  }
};

const handlePointsPopoverShow = () => {
  loadPointsProfile();
  loadCalendar();
  loadPointLogs();
};

const changeCalendarMonth = (offset: number) => {
  const [year = new Date().getFullYear(), month = new Date().getMonth() + 1] =
    calendarMonth.value.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1 + offset, 1));
  calendarMonth.value = next.toISOString().slice(0, 7);
  loadCalendar();
};

const canMakeup = (day: SignInCalendarDay) => {
  return day.isPast && !day.signedIn && pointsProfile.makeupSignInChances > 0;
};

const calendarDayTitle = (day: SignInCalendarDay) => {
  if (day.signedIn) return day.isMakeup ? '已补签' : '已签到';
  if (canMakeup(day)) return '点击补签';
  if (day.isFuture) return '未来日期';
  return '未签到';
};

const sceneText = (scene: string) => {
  const map: Record<string, string> = {
    daily_sign_in: '每日签到',
    makeup_sign_in: '补签',
    draw_generation: 'AI 生图',
    draw_generation_refund: 'AI 生图失败退回',
    ai_chat: 'AI 聊天',
    ai_chat_refund: 'AI 聊天失败退回',
  };
  return map[scene] || scene;
};

const formatTime = (value: string) => {
  if (!value) return '';
  return new Date(value).toLocaleString('zh-CN');
};

onMounted(() => {
  loadPointsProfile();
});
</script>

<style scoped>
.navbar {
  padding: 18px 20px 0;
  height: auto !important;
  background: transparent;
}

.navbar-content {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 18px;
  border-radius: 28px;
  border: 1px solid rgba(122, 160, 211, 0.16);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.92),
    rgba(245, 249, 255, 0.96)
  );
  box-shadow:
    0 18px 38px rgba(95, 124, 170, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.94);
}

.navbar-left {
  flex: 1;
  min-width: 0;
}

.navbar-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.navbar-kicker {
  color: #8ca0bc;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.breadcrumb-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.breadcrumb {
  min-width: 0;
  font-size: 14px;
}

.breadcrumb :deep(.el-breadcrumb__item) {
  display: flex;
  align-items: center;
}

.breadcrumb :deep(.el-breadcrumb__inner) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #6c84a8;
  font-weight: 600;
}

.breadcrumb :deep(.el-breadcrumb__inner.is-link),
.breadcrumb :deep(.el-breadcrumb__inner a) {
  color: #41638f;
}

.breadcrumb :deep(.el-breadcrumb__separator) {
  color: #a6b7cf;
}

.breadcrumb :deep(.el-icon) {
  margin-right: 0;
}

.page-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: linear-gradient(
    135deg,
    rgba(47, 145, 255, 0.12),
    rgba(124, 77, 255, 0.12)
  );
  color: #2f69d0;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.route-chip {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(122, 160, 211, 0.14);
  box-shadow: 0 10px 22px rgba(91, 119, 164, 0.08);
}

.route-chip-label {
  color: #8ca0bc;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.route-chip-value {
  color: #294063;
  font-size: 14px;
  font-weight: 700;
}

.points-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 52px;
  padding: 8px 12px;
  border: 1px solid rgba(122, 160, 211, 0.16);
  border-radius: 20px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.94),
    rgba(244, 248, 255, 0.98)
  );
  box-shadow: 0 12px 24px rgba(95, 124, 170, 0.1);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.points-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(95, 148, 226, 0.24);
  box-shadow: 0 16px 28px rgba(95, 124, 170, 0.14);
}

.points-chip-icon {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  color: #1f6ed4;
  background: rgba(47, 145, 255, 0.12);
}

.points-chip-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.points-chip-label {
  color: #8ca0bc;
  font-size: 11px;
  font-weight: 700;
}

.points-chip-value {
  color: #294063;
  font-size: 16px;
  line-height: 1;
}

.points-popover {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.points-popover-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.points-title {
  color: #263a5f;
  font-size: 16px;
  font-weight: 700;
}

.points-subtitle {
  margin-top: 4px;
  color: #8a9ab5;
  font-size: 12px;
}

.points-balance-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.points-balance-card,
.points-rule-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(122, 160, 211, 0.14);
  background: #f7faff;
}

.points-balance-card span,
.points-rule-card span {
  color: #8a9ab5;
  font-size: 12px;
}

.points-balance-card strong,
.points-rule-card strong {
  color: #263a5f;
  font-size: 18px;
}

.points-log-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #52657f;
  font-size: 13px;
  font-weight: 700;
}

.calendar-panel {
  padding: 10px;
  border-radius: 16px;
  border: 1px solid rgba(122, 160, 211, 0.14);
  background: #f8fbff;
}

.calendar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.calendar-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #263a5f;
  font-size: 14px;
  font-weight: 700;
}

.calendar-weekdays,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}

.calendar-weekdays {
  margin-bottom: 6px;
}

.calendar-weekdays span {
  color: #8a9ab5;
  font-size: 12px;
  text-align: center;
}

.calendar-empty {
  min-height: 38px;
}

.calendar-day {
  position: relative;
  min-height: 38px;
  border: 1px solid rgba(122, 160, 211, 0.12);
  border-radius: 12px;
  color: #52657f;
  background: #fff;
  cursor: default;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;
}

.calendar-day span {
  display: block;
  font-size: 13px;
  font-weight: 700;
}

.calendar-day small {
  display: block;
  margin-top: 1px;
  font-size: 10px;
  line-height: 1;
}

.calendar-day.is-signed {
  color: #176b45;
  border-color: rgba(32, 161, 98, 0.28);
  background: rgba(32, 161, 98, 0.1);
}

.calendar-day.is-makeup {
  color: #8a5a00;
  border-color: rgba(230, 162, 60, 0.35);
  background: rgba(230, 162, 60, 0.12);
}

.calendar-day.is-today {
  border-color: rgba(47, 145, 255, 0.45);
  box-shadow: inset 0 0 0 1px rgba(47, 145, 255, 0.18);
}

.calendar-day.can-makeup {
  color: #1f6ed4;
  cursor: pointer;
  border-style: dashed;
  background: rgba(47, 145, 255, 0.06);
}

.calendar-day.can-makeup:hover {
  transform: translateY(-1px);
  border-color: rgba(47, 145, 255, 0.42);
  background: rgba(47, 145, 255, 0.12);
}

.points-log-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.points-log-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 10px;
  border-radius: 12px;
  background: #f8fbff;
}

.points-log-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.points-log-desc {
  color: #303b50;
  font-size: 13px;
  font-weight: 600;
}

.points-log-time {
  color: #9aa8ba;
  font-size: 12px;
}

.points-log-amount {
  font-size: 14px;
  white-space: nowrap;
}

.points-log-amount.is-plus {
  color: #20a162;
}

.points-log-amount.is-minus {
  color: #d93050;
}

.user-avatar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px 8px 8px;
  border-radius: 22px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
  border: 1px solid rgba(122, 160, 211, 0.16);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.92),
    rgba(243, 248, 255, 0.98)
  );
  box-shadow:
    0 12px 24px rgba(95, 124, 170, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.96);
}

.user-avatar:hover {
  transform: translateY(-1px);
  border-color: rgba(95, 148, 226, 0.24);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98),
    rgba(238, 245, 255, 1)
  );
  box-shadow:
    0 16px 28px rgba(95, 124, 170, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.98);
}

.avatar-shell {
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: linear-gradient(
    135deg,
    rgba(47, 145, 255, 0.14),
    rgba(124, 77, 255, 0.18)
  );
}

.avatar {
  background: linear-gradient(135deg, #2f91ff 0%, #7c4dff 100%);
  box-shadow: 0 12px 22px rgba(66, 121, 255, 0.28);
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-greeting {
  color: #8ca0bc;
  font-size: 11px;
  font-weight: 700;
}

.username {
  font-size: 14px;
  color: #243755;
  font-weight: 700;
  white-space: nowrap;
}

.dropdown-icon {
  font-size: 12px;
  color: #8ca0bc;
  transition: transform 0.3s;
}

.user-avatar:hover .dropdown-icon {
  transform: rotate(180deg);
}

@media (max-width: 900px) {
  .navbar-content,
  .breadcrumb-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .navbar-right {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 640px) {
  .navbar {
    padding: 14px 14px 0;
  }

  .navbar-content {
    padding: 14px;
    border-radius: 22px;
  }

  .route-chip {
    display: none;
  }

  .user-meta {
    max-width: 120px;
  }

  .username {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
