<template>
  <div class="games-page">
    <div class="page-header games-header">
      <div class="page-title-block">
        <div class="page-kicker">Game Lab</div>
        <h2>小游戏</h2>
        <p class="page-description">
          先放纯前端小游戏，不依赖后端接口；当前内置扫雷、数独、推箱子和记忆翻牌，后面可以继续接排行榜和积分。
        </p>
      </div>
      <div class="header-stats">
        <div class="stat-card">
          <span class="stat-label">推荐</span>
          <strong>{{ gameIdeas.length }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">已上线</span>
          <strong>4</strong>
        </div>
      </div>
    </div>

    <section class="recommend-section">
      <div class="section-title-row">
        <div>
          <h3>推荐先做这些</h3>
          <p>都适合纯前端实现，体量小、体验直观，后续也能接排行榜和积分。</p>
        </div>
      </div>

      <div class="idea-grid">
        <article v-for="idea in gameIdeas" :key="idea.name" class="idea-card">
          <div class="idea-icon">
            <el-icon><component :is="idea.icon" /></el-icon>
          </div>
          <div class="idea-content">
            <div class="idea-top">
              <h4>{{ idea.name }}</h4>
              <el-tag size="small" :type="idea.tagType">{{ idea.level }}</el-tag>
            </div>
            <p>{{ idea.desc }}</p>
            <div class="idea-meta">
              <span>{{ idea.duration }}</span>
              <span>{{ idea.reason }}</span>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="play-section">
      <el-tabs v-model="activeGame" class="game-tabs">
        <el-tab-pane label="数独" name="sudoku">
          <div class="play-panel">
            <div class="play-header">
              <div>
                <span class="play-badge">Playable</span>
                <h3>数独</h3>
                <p>选择数字后点空格填入，每行、每列、每个 3x3 宫都不能重复。</p>
              </div>
              <div class="play-actions">
                <el-select v-model="sudokuDifficulty" class="difficulty-select" @change="startSudoku">
                  <el-option label="简单" value="easy" />
                  <el-option label="标准" value="normal" />
                  <el-option label="困难" value="hard" />
                </el-select>
                <el-button :icon="CircleClose" @click="clearSudokuCell">清空格</el-button>
                <el-button type="primary" :icon="Refresh" @click="startSudoku">重开</el-button>
              </div>
            </div>

            <div class="rule-strip">
              <div><strong>目标</strong><span>把 1-9 填满整个棋盘。</span></div>
              <div><strong>限制</strong><span>每行、每列、每个 3x3 宫数字不能重复。</span></div>
              <div><strong>操作</strong><span>先点右侧数字，再点空格填入；蓝色初始数字不能改。</span></div>
            </div>

            <div class="score-row">
              <div class="score-item">
                <span>已填</span>
                <strong>{{ sudokuFilledCount }}/81</strong>
              </div>
              <div class="score-item">
                <span>错误</span>
                <strong>{{ sudokuErrorCount }}</strong>
              </div>
              <div class="score-item">
                <span>状态</span>
                <strong>{{ sudokuComplete ? '完成' : '进行中' }}</strong>
              </div>
            </div>

            <div class="sudoku-layout">
              <div class="sudoku-board">
                <button
                  v-for="cell in sudokuCells"
                  :key="cell.uid"
                  type="button"
                  class="sudoku-cell"
                  :class="{
                    given: cell.given,
                    selected: selectedSudokuCellKey === cell.uid,
                    error: sudokuErrors.has(cell.uid),
                    complete: sudokuComplete,
                  }"
                  @click="selectSudokuCell(cell.uid)"
                >
                  {{ cell.value || '' }}
                </button>
              </div>

              <div class="sudoku-pad">
                <button
                  v-for="num in sudokuNumbers"
                  :key="num"
                  type="button"
                  class="sudoku-number"
                  :class="{ active: selectedSudokuNumber === num }"
                  @click="selectSudokuNumber(num)"
                >
                  {{ num }}
                </button>
              </div>
            </div>

            <el-alert
              v-if="sudokuComplete"
              class="finish-alert"
              type="success"
              :closable="false"
              show-icon
              title="数独完成，全部数字正确。"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="推箱子" name="sokoban">
          <div class="play-panel">
            <div class="play-header">
              <div>
                <span class="play-badge">Playable</span>
                <h3>推箱子</h3>
                <p>把所有箱子推到目标点，支持方向键和下方方向按钮。</p>
              </div>
              <div class="play-actions">
                <el-select v-model="sokobanLevelIndex" class="difficulty-select" @change="startSokoban">
                  <el-option
                    v-for="(level, index) in sokobanLevels"
                    :key="level.name"
                    :label="level.name"
                    :value="index"
                  />
                </el-select>
                <el-button type="primary" :icon="Refresh" @click="startSokoban">重开</el-button>
              </div>
            </div>

            <div class="rule-strip">
              <div><strong>目标</strong><span>把所有“箱”推到绿色“点”上。</span></div>
              <div><strong>限制</strong><span>箱子只能推不能拉，墙不能穿过。</span></div>
              <div><strong>操作</strong><span>方向键或下方按钮移动“人”，顶住箱子即可推动。</span></div>
            </div>

            <div class="level-list">
              <button
                v-for="(level, index) in sokobanLevels"
                :key="level.name"
                type="button"
                class="level-button"
                :class="{ active: sokobanLevelIndex === index }"
                @click="selectSokobanLevel(index)"
              >
                {{ index + 1 }}
              </button>
            </div>

            <div class="score-row">
              <div class="score-item">
                <span>步数</span>
                <strong>{{ sokobanMoves }}</strong>
              </div>
              <div class="score-item">
                <span>箱子</span>
                <strong>{{ sokobanPlacedBoxes }}/{{ sokobanTargets.size }}</strong>
              </div>
              <div class="score-item">
                <span>状态</span>
                <strong>{{ sokobanComplete ? '完成' : '推理中' }}</strong>
              </div>
            </div>

            <div class="sokoban-layout">
              <div
                class="sokoban-board"
                :style="{ gridTemplateColumns: `repeat(${sokobanCols}, minmax(0, 1fr))` }"
              >
                <div
                  v-for="cell in sokobanCells"
                  :key="cell.uid"
                  class="sokoban-cell"
                  :class="{
                    wall: cell.wall,
                    target: cell.target,
                    box: cell.box,
                    player: cell.player,
                    placed: cell.box && cell.target,
                  }"
                >
                  <svg v-if="cell.wall" class="sokoban-icon sokoban-icon-wall" viewBox="0 0 48 48" aria-hidden="true">
                    <rect x="5" y="8" width="38" height="32" rx="4" fill="rgba(255,255,255,0.1)" />
                    <path d="M7 18h34M7 29h34M18 8v10M31 18v11M18 29v11" stroke="rgba(255,255,255,0.5)" stroke-width="3" stroke-linecap="round" />
                    <path d="M10 36h28" stroke="rgba(0,0,0,0.2)" stroke-width="3" stroke-linecap="round" />
                  </svg>
                  <svg v-else-if="cell.player" class="sokoban-icon sokoban-icon-player" viewBox="0 0 48 48" aria-hidden="true">
                    <circle cx="24" cy="15" r="8" fill="#fff8d9" />
                    <path d="M14 38c1.5-9 5.2-14 10-14s8.5 5 10 14" fill="#ffffff" opacity="0.95" />
                    <path d="M13 19c2-8 6-12 11-12s9 4 11 12c-6 2.3-16 2.3-22 0Z" fill="#1f5fbf" />
                    <path d="M16 32h16" stroke="#2f91ff" stroke-width="4" stroke-linecap="round" />
                  </svg>
                  <svg v-else-if="cell.box" class="sokoban-icon sokoban-icon-box" viewBox="0 0 48 48" aria-hidden="true">
                    <rect x="9" y="10" width="30" height="30" rx="5" fill="#fff4d8" />
                    <path d="M9 20h30M20 10v30M9 40l30-30M9 10l30 30" stroke="#b86b22" stroke-width="3.2" stroke-linecap="round" />
                    <path d="M13 14h22v22H13z" fill="none" stroke="rgba(80,38,10,0.22)" stroke-width="2" />
                  </svg>
                  <svg v-else-if="cell.target" class="sokoban-icon sokoban-icon-target" viewBox="0 0 48 48" aria-hidden="true">
                    <circle cx="24" cy="24" r="15" fill="rgba(45,207,159,0.2)" stroke="#18a77f" stroke-width="4" />
                    <circle cx="24" cy="24" r="8" fill="none" stroke="#18a77f" stroke-width="3" opacity="0.72" />
                    <circle cx="24" cy="24" r="3.5" fill="#18a77f" />
                  </svg>
                </div>
              </div>

              <div class="sokoban-controls">
                <button type="button" class="sokoban-move move-up" @click="moveSokoban('up')">上</button>
                <button type="button" class="sokoban-move move-left" @click="moveSokoban('left')">左</button>
                <button type="button" class="sokoban-move move-right" @click="moveSokoban('right')">右</button>
                <button type="button" class="sokoban-move move-down" @click="moveSokoban('down')">下</button>
              </div>
            </div>

            <el-alert
              v-if="sokobanComplete"
              class="finish-alert"
              type="success"
              :closable="false"
              show-icon
              :title="`推箱子完成：${sokobanMoves} 步`"
            />
            <div v-if="sokobanComplete" class="level-complete-actions">
              <el-button
                v-if="hasNextSokobanLevel"
                type="primary"
                @click="goNextSokobanLevel"
              >
                下一关
              </el-button>
              <span v-if="hasNextSokobanLevel">即将自动进入第 {{ sokobanLevelIndex + 2 }} 关</span>
              <span v-else>已完成全部推箱子关卡</span>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="扫雷" name="minesweeper">
          <div class="play-panel">
            <div class="play-header">
              <div>
                <span class="play-badge">Playable</span>
                <h3>扫雷</h3>
                <p>首次点击后布雷，左键开格，右键插旗；手机上可以开启标记模式。</p>
              </div>
              <div class="play-actions">
                <el-select v-model="mineDifficulty" class="difficulty-select" @change="startMineGame">
                  <el-option label="初级 9x9" value="beginner" />
                  <el-option label="标准 12x12" value="standard" />
                  <el-option label="挑战 16x16" value="expert" />
                </el-select>
                <el-button type="primary" :icon="Refresh" @click="startMineGame">重开</el-button>
              </div>
            </div>

            <div class="rule-strip">
              <div><strong>目标</strong><span>找出所有安全格，不踩到隐藏的雷。</span></div>
              <div><strong>数字</strong><span>翻开的数字表示周围 8 格里有几颗雷。</span></div>
              <div><strong>操作</strong><span>左键开格，右键插旗；手机用棋盘右侧“标记”切换插旗。</span></div>
            </div>

            <div class="score-row">
              <div class="score-item">
                <span>剩余雷数</span>
                <strong>{{ minesLeft }}</strong>
              </div>
              <div class="score-item">
                <span>用时</span>
                <strong>{{ mineElapsedSeconds }}s</strong>
              </div>
              <div class="score-item">
                <span>进度</span>
                <strong>{{ revealedMineCells }}/{{ safeMineCells }}</strong>
              </div>
            </div>

            <div class="mine-play-area">
              <div
                class="mine-board"
                :style="{ gridTemplateColumns: `repeat(${mineConfig.cols}, minmax(0, 1fr))` }"
              >
                <button
                  v-for="cell in mineCells"
                  :key="cell.uid"
                  type="button"
                  class="mine-cell"
                  :class="[
                    `mine-cell-${cell.adjacent}`,
                    {
                      revealed: cell.revealed,
                      flagged: cell.flagged,
                      exploded: cell.exploded,
                      mine: cell.revealed && cell.mine,
                    },
                  ]"
                  :disabled="mineStatus === 'won' || mineStatus === 'lost'"
                  @click="openMineCell(cell.row, cell.col)"
                  @contextmenu.prevent="toggleMineFlag(cell.row, cell.col)"
                >
                  <el-icon v-if="cell.revealed && cell.mine"><WarningFilled /></el-icon>
                  <span v-else-if="cell.revealed && cell.adjacent">{{ cell.adjacent }}</span>
                  <el-icon v-else-if="cell.flagged"><Flag /></el-icon>
                </button>
              </div>

              <button
                type="button"
                class="mine-flag-toggle"
                :class="{ active: flagMode }"
                @click="flagMode = !flagMode"
              >
                <el-icon><Flag /></el-icon>
                <span>标记</span>
              </button>
            </div>

            <el-alert
              v-if="mineStatus === 'won'"
              class="finish-alert"
              type="success"
              :closable="false"
              show-icon
              :title="`扫雷成功：用时 ${mineElapsedSeconds} 秒`"
            />
            <el-alert
              v-else-if="mineStatus === 'lost'"
              class="finish-alert"
              type="error"
              :closable="false"
              show-icon
              title="踩到雷了，重新开一局。"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="记忆翻牌" name="memory">
          <div class="play-panel">
            <div class="play-header">
              <div>
                <span class="play-badge">Playable</span>
                <h3>记忆翻牌</h3>
                <p>翻开两张卡片，配对成功会保留；全部配对完成即通关。</p>
              </div>
              <div class="play-actions">
                <el-select v-model="difficulty" class="difficulty-select" @change="startGame">
                  <el-option label="简单 4 组" value="easy" />
                  <el-option label="标准 6 组" value="normal" />
                  <el-option label="挑战 8 组" value="hard" />
                </el-select>
                <el-button type="primary" :icon="Refresh" @click="startGame">重开</el-button>
              </div>
            </div>

            <div class="rule-strip">
              <div><strong>目标</strong><span>记住卡片位置，把所有相同字母配成对。</span></div>
              <div><strong>操作</strong><span>每次翻两张，配对成功会保留，失败会自动盖回去。</span></div>
              <div><strong>计分</strong><span>步数越少越好，用时仅作为参考。</span></div>
            </div>

            <div class="score-row">
              <div class="score-item">
                <span>步数</span>
                <strong>{{ moves }}</strong>
              </div>
              <div class="score-item">
                <span>用时</span>
                <strong>{{ elapsedSeconds }}s</strong>
              </div>
              <div class="score-item">
                <span>进度</span>
                <strong>{{ matchedPairs }}/{{ pairCount }}</strong>
              </div>
            </div>

            <div class="memory-board" :class="`memory-board-${difficulty}`">
              <button
                v-for="card in cards"
                :key="card.uid"
                type="button"
                class="memory-card"
                :class="{ flipped: card.flipped || card.matched, matched: card.matched }"
                :disabled="card.flipped || card.matched || lockBoard"
                @click="flipCard(card.uid)"
              >
                <span class="card-front">{{ card.value }}</span>
                <span class="card-back">
                  <el-icon><StarFilled /></el-icon>
                </span>
              </button>
            </div>

            <el-alert
              v-if="finished"
              class="finish-alert"
              type="success"
              :closable="false"
              show-icon
              :title="`通关完成：${moves} 步，用时 ${elapsedSeconds} 秒`"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  Aim,
  CircleClose,
  Cpu,
  Flag,
  Grid,
  MagicStick,
  Pointer,
  Promotion,
  Refresh,
  StarFilled,
  Timer,
  Trophy,
  WarningFilled,
} from '@element-plus/icons-vue'

type Difficulty = 'easy' | 'normal' | 'hard'
type GameKey = 'sudoku' | 'sokoban' | 'minesweeper' | 'memory'
type MineDifficulty = 'beginner' | 'standard' | 'expert'
type MineStatus = 'ready' | 'playing' | 'won' | 'lost'
type SudokuDifficulty = 'easy' | 'normal' | 'hard'
type SokobanDirection = 'up' | 'down' | 'left' | 'right'

interface MemoryCard {
  uid: string
  value: string
  flipped: boolean
  matched: boolean
}

interface MineCell {
  uid: string
  row: number
  col: number
  mine: boolean
  adjacent: number
  revealed: boolean
  flagged: boolean
  exploded: boolean
}

interface SudokuCell {
  uid: string
  row: number
  col: number
  value: number | null
  given: boolean
}

interface SokobanLevel {
  name: string
  map: string[]
}

interface SokobanCell {
  uid: string
  row: number
  col: number
  wall: boolean
  target: boolean
  box: boolean
  player: boolean
}

const gameIdeas = [
  {
    name: '数独',
    level: '已上线',
    tagType: 'success',
    desc: '9x9 数字推理，支持难度、错误检查和完成判断。',
    duration: '5-12 分钟',
    reason: '经典耐玩',
    icon: Grid,
  },
  {
    name: '推箱子',
    level: '已上线',
    tagType: 'success',
    desc: '规划路径把箱子推到目标点，适合做关卡包。',
    duration: '2-8 分钟',
    reason: '空间推理',
    icon: Trophy,
  },
  {
    name: '记忆翻牌',
    level: '已上线',
    tagType: 'success',
    desc: '点击翻牌找相同图案，适合先做成排行榜和每日挑战。',
    duration: '1-3 分钟',
    reason: '规则简单',
    icon: Grid,
  },
  {
    name: '2048',
    level: '推荐',
    tagType: 'warning',
    desc: '键盘或滑动合并数字，纯前端逻辑完整，留存感比较强。',
    duration: '3-8 分钟',
    reason: '可反复玩',
    icon: Trophy,
  },
  {
    name: '贪吃蛇',
    level: '推荐',
    tagType: 'warning',
    desc: 'Canvas 或 CSS 网格都能做，适合加速度、障碍和皮肤。',
    duration: '2-5 分钟',
    reason: '动作反馈强',
    icon: Aim,
  },
  {
    name: '扫雷',
    level: '已上线',
    tagType: 'success',
    desc: '随机布雷、递归展开、旗帜标记都在前端完成。',
    duration: '5-10 分钟',
    reason: '策略性好',
    icon: Pointer,
  },
  {
    name: '反应测速',
    level: '轻量',
    tagType: 'success',
    desc: '等待信号后点击，统计反应时间，适合做每日最好成绩。',
    duration: '30 秒',
    reason: '实现快',
    icon: Timer,
  },
  {
    name: '打字挑战',
    level: '轻量',
    tagType: 'success',
    desc: '随机句子限时输入，统计速度和准确率，可以复用文章/词库。',
    duration: '1 分钟',
    reason: '数据好展示',
    icon: MagicStick,
  },
  {
    name: 'AI 猜词',
    level: '后续',
    tagType: 'info',
    desc: '先纯前端词库版，之后可以接 AI 生成题目和提示。',
    duration: '2-4 分钟',
    reason: '可接 AI',
    icon: Cpu,
  },
  {
    name: '每日抽卡',
    level: '后续',
    tagType: 'info',
    desc: '纯前端先做动画和概率，之后再接积分消耗和记录。',
    duration: '10 秒',
    reason: '适合活动',
    icon: Promotion,
  },
] as const

const activeGame = ref<GameKey>('sudoku')
const symbols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const difficulty = ref<Difficulty>('normal')
const cards = ref<MemoryCard[]>([])
const moves = ref(0)
const elapsedSeconds = ref(0)
const started = ref(false)
const finished = ref(false)
const lockBoard = ref(false)
const openedIds = ref<string[]>([])
let timer: number | undefined

const mineDifficulty = ref<MineDifficulty>('beginner')
const mineBoard = ref<MineCell[][]>([])
const mineStatus = ref<MineStatus>('ready')
const mineElapsedSeconds = ref(0)
const mineGenerated = ref(false)
const flagMode = ref(false)
let mineTimer: number | undefined
let sokobanNextTimer: number | undefined

const sudokuDifficulty = ref<SudokuDifficulty>('easy')
const sudokuCells = ref<SudokuCell[]>([])
const selectedSudokuCellKey = ref('')
const selectedSudokuNumber = ref(1)
const sudokuNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9]

const sokobanLevelIndex = ref(0)
const sokobanRows = ref<string[]>([])
const sokobanWalls = ref(new Set<string>())
const sokobanTargets = ref(new Set<string>())
const sokobanBoxes = ref(new Set<string>())
const sokobanPlayer = ref({ row: 0, col: 0 })
const sokobanMoves = ref(0)

const sudokuPuzzles: Record<SudokuDifficulty, { puzzle: string; solution: string }> = {
  easy: {
    puzzle: '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
    solution: '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
  },
  normal: {
    puzzle: '003020600900305001001806400008102900700000008006708200002609500800203009005010300',
    solution: '483921657967345821251876493548132976729564138136798245372689514814253769695417382',
  },
  hard: {
    puzzle: '000000907000420180000705026100904000050000040000507009920108000034059000507000000',
    solution: '462831957795426183381795426173984265659312748248567319926178534834259671517243892',
  },
}

const sokobanLevels: SokobanLevel[] = [
  {
    name: '第 1 关 单箱绕墙',
    map: [
      '#########',
      '#     . #',
      '#       #',
      '#       #',
      '#    #  #',
      '# $     #',
      '# @     #',
      '#########',
    ],
  },
  {
    name: '第 2 关 单箱换位',
    map: [
      '#########',
      '#     @ #',
      '#     $ #',
      '#       #',
      '#  #  . #',
      '#       #',
      '#       #',
      '#########',
    ],
  },
  {
    name: '第 3 关 侧推入点',
    map: [
      '#########',
      '#  .    #',
      '#       #',
      '#   #   #',
      '#       #',
      '# @$    #',
      '#       #',
      '#########',
    ],
  },
  {
    name: '第 4 关 窄口转向',
    map: [
      '#########',
      '#       #',
      '#       #',
      '#       #',
      '#    #  #',
      '#   $ . #',
      '#   @   #',
      '#########',
    ],
  },
  {
    name: '第 5 关 双箱分流',
    map: [
      '#########',
      '# .     #',
      '#@$     #',
      '#   $   #',
      '#   .   #',
      '#  #    #',
      '#       #',
      '#########',
    ],
  },
  {
    name: '第 6 关 双箱隔墙',
    map: [
      '#########',
      '# .     #',
      '#   @   #',
      '#   $   #',
      '#  # #  #',
      '# # . $ #',
      '#       #',
      '#########',
    ],
  },
  {
    name: '第 7 关 双箱顺序',
    map: [
      '#########',
      '#       #',
      '# . *@$ #',
      '#     # #',
      '#  #    #',
      '# #     #',
      '#       #',
      '#########',
    ],
  },
  {
    name: '第 8 关 双箱长路',
    map: [
      '###########',
      '#         #',
      '#       . #',
      '#  #      #',
      '# .@$     #',
      '#      ## #',
      '#   $     #',
      '#         #',
      '###########',
    ],
  },
  {
    name: '第 9 关 双箱卡位',
    map: [
      '###########',
      '#         #',
      '#     *   #',
      '#         #',
      '#   . #   #',
      '#    #    #',
      '#   #@$   #',
      '#         #',
      '###########',
    ],
  },
  {
    name: '第 10 关 双箱错层',
    map: [
      '###########',
      '#     .   #',
      '#   .     #',
      '#         #',
      '#         #',
      '# # $#    #',
      '#      #$ #',
      '#       @ #',
      '###########',
    ],
  },
  {
    name: '第 11 关 三箱入门',
    map: [
      '###########',
      '#         #',
      '#@*   . . #',
      '#         #',
      '# $ $     #',
      '#       # #',
      '#  #  #   #',
      '#         #',
      '###########',
    ],
  },
  {
    name: '第 12 关 三箱换序',
    map: [
      '###########',
      '#         #',
      '#   *@    #',
      '#      #  #',
      '#       $ #',
      '# #       #',
      '#   . * # #',
      '#         #',
      '###########',
    ],
  },
  {
    name: '第 13 关 三箱窄门',
    map: [
      '###########',
      '#  *@$ .  #',
      '#   $     #',
      '# ##      #',
      '#         #',
      '#      ## #',
      '# .   #   #',
      '#         #',
      '###########',
    ],
  },
  {
    name: '第 14 关 三箱分区',
    map: [
      '###########',
      '#         #',
      '#@*     . #',
      '#  #  #   #',
      '# .       #',
      '#      #  #',
      '# # $ $#  #',
      '#         #',
      '###########',
    ],
  },
  {
    name: '第 15 关 三箱回旋',
    map: [
      '###########',
      '#         #',
      '# $     $@#',
      '# ##   #  #',
      '# . $   . #',
      '# #     # #',
      '#     .   #',
      '#         #',
      '###########',
    ],
  },
  {
    name: '第 16 关 三箱远点',
    map: [
      '###########',
      '#         #',
      '# . . $   #',
      '#      #  #',
      '#  #  ##  #',
      '#    #    #',
      '# $ $   . #',
      '# @       #',
      '###########',
    ],
  },
  {
    name: '第 17 关 三箱终点',
    map: [
      '#############',
      '#           #',
      '#           #',
      '# #   # .   #',
      '#           #',
      '#      $    #',
      '#         # #',
      '#   $@* #.# #',
      '#           #',
      '#############',
    ],
  },
  {
    name: '第 18 关 四箱入门',
    map: [
      '#############',
      '#           #',
      '#    @    $ #',
      '#    $ #    #',
      '#      #    #',
      '# *#   .    #',
      '#  #  # .   #',
      '#  *        #',
      '#           #',
      '#############',
    ],
  },
  {
    name: '第 19 关 四箱错位',
    map: [
      '#############',
      '#   $ .     #',
      '# $         #',
      '#   ##      #',
      '#   #       #',
      '#    #$   $ #',
      '#   . @     #',
      '#     . # . #',
      '#           #',
      '#############',
    ],
  },
  {
    name: '第 20 关 四箱绕柱',
    map: [
      '#############',
      '#  .        #',
      '#   * .     #',
      '#  # # $    #',
      '#     #@$   #',
      '#      #    #',
      '#     #     #',
      '# . $       #',
      '#           #',
      '#############',
    ],
  },
  {
    name: '第 21 关 四箱连锁',
    map: [
      '#############',
      '#       . . #',
      '#      .    #',
      '#   # $ # $ #',
      '#  $        #',
      '# #@$ .     #',
      '#  #      # #',
      '#           #',
      '#           #',
      '#############',
    ],
  },
  {
    name: '第 22 关 四箱长廊',
    map: [
      '#############',
      '#         . #',
      '# $ .       #',
      '#  ##  $ #  #',
      '# #       $@#',
      '#   # $     #',
      '#   #     . #',
      '#   #    .  #',
      '#           #',
      '#############',
    ],
  },
  {
    name: '第 23 关 四箱夹道',
    map: [
      '#############',
      '#           #',
      '#   *   $@$ #',
      '#           #',
      '# .   # .   #',
      '#     ##    #',
      '#    #    # #',
      '#   #  * #  #',
      '#           #',
      '#############',
    ],
  },
  {
    name: '第 24 关 四箱终点',
    map: [
      '#############',
      '# .     $   #',
      '#           #',
      '#      #    #',
      '#    # # #  #',
      '#  .$@# . $ #',
      '#    #   #  #',
      '#   .$      #',
      '#           #',
      '#############',
    ],
  },
  {
    name: '第 25 关 五箱入门',
    map: [
      '###############',
      '#             #',
      '#    $   . .  #',
      '#  ##   #   # #',
      '#    .        #',
      '#   *     .   #',
      '#   #      $  #',
      '#         #@$ #',
      '#       #  $  #',
      '#             #',
      '###############',
    ],
  },
  {
    name: '第 26 关 五箱分区',
    map: [
      '###############',
      '#             #',
      '#   .   $     #',
      '#   #         #',
      '#   #  ## *   #',
      '#        #    #',
      '#   *   . ##  #',
      '#             #',
      '# $     $@.   #',
      '#             #',
      '###############',
    ],
  },
  {
    name: '第 27 关 五箱穿插',
    map: [
      '###############',
      '#       @     #',
      '#   .   $     #',
      '#     #       #',
      '#   $ #     . #',
      '#    ##       #',
      '#     $ . $ $ #',
      '#     #  #    #',
      '#     .   . # #',
      '#             #',
      '###############',
    ],
  },
  {
    name: '第 28 关 五箱回廊',
    map: [
      '###############',
      '#             #',
      '#     .       #',
      '#     #       #',
      '#       . #   #',
      '#  # #   #    #',
      '# $   $  #. # #',
      '#             #',
      '# $     . *@$ #',
      '#             #',
      '###############',
    ],
  },
  {
    name: '第 29 关 五箱压缩',
    map: [
      '###############',
      '#        @$ . #',
      '#     $ . $   #',
      '#      #   #  #',
      '#   . #     # #',
      '#      #      #',
      '# . $     . # #',
      '#             #',
      '#       # $   #',
      '#             #',
      '###############',
    ],
  },
  {
    name: '第 30 关 五箱终局',
    map: [
      '###############',
      '#             #',
      '#      $@     #',
      '#     #       #',
      '#   .$  $# #. #',
      '#   #         #',
      '#  # . .    $ #',
      '#             #',
      '# #  $ .#     #',
      '#             #',
      '###############',
    ],
  },
  {
    name: '第 31 关 智商 120+ 1',
    map: [
      '###############',
      '#             #',
      '# #$ $#    $  #',
      '#      #   #  #',
      '#   .  #  #   #',
      '#   #.      $ #',
      '#             #',
      '#  .          #',
      '# #  #    . . #',
      '#@$  .#       #',
      '#   $ #   #   #',
      '#             #',
      '###############',
    ],
  },
  {
    name: '第 32 关 智商 120+ 2',
    map: [
      '###############',
      '#             #',
      '# #  .    $ # #',
      '# ##          #',
      '#     .#@  $  #',
      '#       $#    #',
      '# $ #  $   #  #',
      '#     .  . #  #',
      '#     # #   . #',
      '# $#.         #',
      '#    #.   $   #',
      '#             #',
      '###############',
    ],
  },
  {
    name: '第 33 关 智商 120+ 3',
    map: [
      '###############',
      '#             #',
      '#     #   . # #',
      '#  # ###      #',
      '#  .   . #  @ #',
      '# . .    #  $ #',
      '#    #$ $     #',
      '#        . #  #',
      '#       # . # #',
      '# $ $ $       #',
      '#    # #   $  #',
      '#             #',
      '###############',
    ],
  },
  {
    name: '第 34 关 智商 120+ 4',
    map: [
      '###############',
      '#             #',
      '#  #  #       #',
      '#   .#  ##    #',
      '#    #.@$   # #',
      '#    ## $. .  #',
      '#     # . # $ #',
      '#        . $  #',
      '#       . #.# #',
      '# $    $      #',
      '# $  $#     # #',
      '#             #',
      '###############',
    ],
  },
  {
    name: '第 35 关 智商 120+ 5',
    map: [
      '###############',
      '#             #',
      '#  #  # $   . #',
      '#  #       .  #',
      '#  #  ##  $ # #',
      '#    #    .   #',
      '#  $#  .#     #',
      '#     .       #',
      '# . .$@$  # $ #',
      '#  #     #  $ #',
      '# #  .  ##  $ #',
      '#             #',
      '###############',
    ],
  },
]

const pairCountMap: Record<Difficulty, number> = {
  easy: 4,
  normal: 6,
  hard: 8,
}

const mineConfigMap: Record<MineDifficulty, { rows: number; cols: number; mines: number }> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  standard: { rows: 12, cols: 12, mines: 22 },
  expert: { rows: 16, cols: 16, mines: 40 },
}

const pairCount = computed(() => pairCountMap[difficulty.value])
const matchedPairs = computed(() => cards.value.filter((card) => card.matched).length / 2)
const mineConfig = computed(() => mineConfigMap[mineDifficulty.value])
const mineCells = computed(() => mineBoard.value.flat())
const flaggedMineCells = computed(() => mineCells.value.filter((cell) => cell.flagged).length)
const revealedMineCells = computed(() => mineCells.value.filter((cell) => cell.revealed && !cell.mine).length)
const safeMineCells = computed(() => mineConfig.value.rows * mineConfig.value.cols - mineConfig.value.mines)
const minesLeft = computed(() => mineConfig.value.mines - flaggedMineCells.value)
const sudokuFilledCount = computed(() => sudokuCells.value.filter((cell) => cell.value).length)
const sudokuErrors = computed(() => {
  const puzzle = sudokuPuzzles[sudokuDifficulty.value]
  return new Set(
    sudokuCells.value
      .filter((cell) => cell.value && String(cell.value) !== puzzle.solution[cell.row * 9 + cell.col])
      .map((cell) => cell.uid),
  )
})
const sudokuErrorCount = computed(() => sudokuErrors.value.size)
const sudokuComplete = computed(() => sudokuFilledCount.value === 81 && sudokuErrorCount.value === 0)
const sokobanCols = computed(() => Math.max(...sokobanRows.value.map((row) => row.length), 0))
const sokobanPlacedBoxes = computed(() => {
  let count = 0
  sokobanBoxes.value.forEach((key) => {
    if (sokobanTargets.value.has(key)) count += 1
  })
  return count
})
const sokobanComplete = computed(() => sokobanTargets.value.size > 0 && sokobanPlacedBoxes.value === sokobanTargets.value.size)
const hasNextSokobanLevel = computed(() => sokobanLevelIndex.value < sokobanLevels.length - 1)
const sokobanCells = computed(() => {
  const cells: SokobanCell[] = []
  for (let row = 0; row < sokobanRows.value.length; row += 1) {
    for (let col = 0; col < sokobanCols.value; col += 1) {
      const key = positionKey(row, col)
      cells.push({
        uid: key,
        row,
        col,
        wall: sokobanWalls.value.has(key),
        target: sokobanTargets.value.has(key),
        box: sokobanBoxes.value.has(key),
        player: sokobanPlayer.value.row === row && sokobanPlayer.value.col === col,
      })
    }
  }
  return cells
})

const shuffle = <T,>(list: T[]) => {
  const next = [...list]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const current = next[index]!
    next[index] = next[randomIndex]!
    next[randomIndex] = current
  }
  return next
}

const stopTimer = () => {
  if (timer) {
    window.clearInterval(timer)
    timer = undefined
  }
}

const stopMineTimer = () => {
  if (mineTimer) {
    window.clearInterval(mineTimer)
    mineTimer = undefined
  }
}

const clearSokobanNextTimer = () => {
  if (sokobanNextTimer) {
    window.clearTimeout(sokobanNextTimer)
    sokobanNextTimer = undefined
  }
}

const startTimer = () => {
  if (started.value) return
  started.value = true
  timer = window.setInterval(() => {
    elapsedSeconds.value += 1
  }, 1000)
}

const startMineTimer = () => {
  if (mineStatus.value === 'playing') return
  mineStatus.value = 'playing'
  mineTimer = window.setInterval(() => {
    mineElapsedSeconds.value += 1
  }, 1000)
}

const startGame = () => {
  stopTimer()
  moves.value = 0
  elapsedSeconds.value = 0
  started.value = false
  finished.value = false
  lockBoard.value = false
  openedIds.value = []

  const values = symbols.slice(0, pairCount.value)
  cards.value = shuffle([...values, ...values]).map((value, index) => ({
    uid: `${value}-${index}-${Date.now()}`,
    value,
    flipped: false,
    matched: false,
  }))
}

const flipCard = (uid: string) => {
  if (lockBoard.value || finished.value) return
  const card = cards.value.find((item) => item.uid === uid)
  if (!card || card.flipped || card.matched) return

  startTimer()
  card.flipped = true
  openedIds.value.push(uid)

  if (openedIds.value.length < 2) return

  moves.value += 1
  const [firstId, secondId] = openedIds.value
  const first = cards.value.find((item) => item.uid === firstId)
  const second = cards.value.find((item) => item.uid === secondId)

  if (!first || !second) {
    openedIds.value = []
    return
  }

  if (first.value === second.value) {
    first.matched = true
    second.matched = true
    openedIds.value = []
    checkFinished()
    return
  }

  lockBoard.value = true
  window.setTimeout(() => {
    first.flipped = false
    second.flipped = false
    openedIds.value = []
    lockBoard.value = false
  }, 680)
}

const checkFinished = () => {
  if (!cards.value.length || cards.value.some((card) => !card.matched)) return
  finished.value = true
  stopTimer()
}

const startSudoku = () => {
  const puzzle = sudokuPuzzles[sudokuDifficulty.value]
  selectedSudokuCellKey.value = ''
  selectedSudokuNumber.value = 1
  sudokuCells.value = puzzle.puzzle.split('').map((char, index) => {
    const value = Number(char)
    return {
      uid: `sudoku-${index}`,
      row: Math.floor(index / 9),
      col: index % 9,
      value: value > 0 ? value : null,
      given: value > 0,
    }
  })
}

const selectSudokuCell = (uid: string) => {
  const cell = sudokuCells.value.find((item) => item.uid === uid)
  if (!cell) return
  selectedSudokuCellKey.value = uid
  if (!cell.given) {
    cell.value = selectedSudokuNumber.value
  }
}

const selectSudokuNumber = (num: number) => {
  selectedSudokuNumber.value = num
  const cell = sudokuCells.value.find((item) => item.uid === selectedSudokuCellKey.value)
  if (cell && !cell.given) {
    cell.value = num
  }
}

const clearSudokuCell = () => {
  const cell = sudokuCells.value.find((item) => item.uid === selectedSudokuCellKey.value)
  if (cell && !cell.given) {
    cell.value = null
  }
}

const positionKey = (row: number, col: number) => `${row}-${col}`

const startSokoban = () => {
  clearSokobanNextTimer()
  const level = sokobanLevels[sokobanLevelIndex.value] || sokobanLevels[0]!
  sokobanRows.value = level.map
  sokobanWalls.value = new Set()
  sokobanTargets.value = new Set()
  sokobanBoxes.value = new Set()
  sokobanPlayer.value = { row: 0, col: 0 }
  sokobanMoves.value = 0

  level.map.forEach((line, row) => {
    Array.from(line).forEach((tile, col) => {
      const key = positionKey(row, col)
      if (tile === '#') sokobanWalls.value.add(key)
      if (tile === '.' || tile === '*' || tile === '+') sokobanTargets.value.add(key)
      if (tile === '$' || tile === '*') sokobanBoxes.value.add(key)
      if (tile === '@' || tile === '+') sokobanPlayer.value = { row, col }
    })
  })
}

const selectSokobanLevel = (index: number) => {
  sokobanLevelIndex.value = index
  startSokoban()
}

const goNextSokobanLevel = () => {
  if (!hasNextSokobanLevel.value) return
  clearSokobanNextTimer()
  sokobanLevelIndex.value += 1
  startSokoban()
}

const getSokobanDelta = (direction: SokobanDirection) => {
  const map: Record<SokobanDirection, { row: number; col: number }> = {
    up: { row: -1, col: 0 },
    down: { row: 1, col: 0 },
    left: { row: 0, col: -1 },
    right: { row: 0, col: 1 },
  }
  return map[direction]
}

const isSokobanBlocked = (row: number, col: number) => sokobanWalls.value.has(positionKey(row, col))

const moveSokoban = (direction: SokobanDirection) => {
  if (sokobanComplete.value) return
  const delta = getSokobanDelta(direction)
  const next = {
    row: sokobanPlayer.value.row + delta.row,
    col: sokobanPlayer.value.col + delta.col,
  }
  const nextKey = positionKey(next.row, next.col)
  if (isSokobanBlocked(next.row, next.col)) return

  if (sokobanBoxes.value.has(nextKey)) {
    const boxNext = {
      row: next.row + delta.row,
      col: next.col + delta.col,
    }
    const boxNextKey = positionKey(boxNext.row, boxNext.col)
    if (isSokobanBlocked(boxNext.row, boxNext.col) || sokobanBoxes.value.has(boxNextKey)) return
    const nextBoxes = new Set(sokobanBoxes.value)
    nextBoxes.delete(nextKey)
    nextBoxes.add(boxNextKey)
    sokobanBoxes.value = nextBoxes
  }

  sokobanPlayer.value = next
  sokobanMoves.value += 1
}

const handleSokobanKeydown = (event: KeyboardEvent) => {
  if (activeGame.value !== 'sokoban') return
  const keyMap: Record<string, SokobanDirection> = {
    ArrowUp: 'up',
    w: 'up',
    W: 'up',
    ArrowDown: 'down',
    s: 'down',
    S: 'down',
    ArrowLeft: 'left',
    a: 'left',
    A: 'left',
    ArrowRight: 'right',
    d: 'right',
    D: 'right',
  }
  const direction = keyMap[event.key]
  if (!direction) return
  event.preventDefault()
  moveSokoban(direction)
}

watch(sokobanComplete, (completed) => {
  clearSokobanNextTimer()
  if (!completed || !hasNextSokobanLevel.value) return
  sokobanNextTimer = window.setTimeout(() => {
    goNextSokobanLevel()
  }, 1200)
})

const createMineCell = (row: number, col: number): MineCell => ({
  uid: `${row}-${col}-${Date.now()}`,
  row,
  col,
  mine: false,
  adjacent: 0,
  revealed: false,
  flagged: false,
  exploded: false,
})

const startMineGame = () => {
  stopMineTimer()
  mineElapsedSeconds.value = 0
  mineStatus.value = 'ready'
  mineGenerated.value = false
  flagMode.value = false
  mineBoard.value = Array.from({ length: mineConfig.value.rows }, (_, row) =>
    Array.from({ length: mineConfig.value.cols }, (_item, col) => createMineCell(row, col)),
  )
}

const getMineCell = (row: number, col: number) => mineBoard.value[row]?.[col]

const getMineNeighbors = (row: number, col: number) => {
  const neighbors: MineCell[] = []
  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
      if (rowOffset === 0 && colOffset === 0) continue
      const cell = getMineCell(row + rowOffset, col + colOffset)
      if (cell) neighbors.push(cell)
    }
  }
  return neighbors
}

const generateMines = (safeRow: number, safeCol: number) => {
  const safeKeys = new Set(
    getMineNeighbors(safeRow, safeCol)
      .map((cell) => `${cell.row}-${cell.col}`)
      .concat(`${safeRow}-${safeCol}`),
  )
  const candidates = mineCells.value.filter((cell) => !safeKeys.has(`${cell.row}-${cell.col}`))
  const mineTargets = shuffle(candidates).slice(0, mineConfig.value.mines)

  mineTargets.forEach((cell) => {
    cell.mine = true
  })
  mineCells.value.forEach((cell) => {
    cell.adjacent = cell.mine ? 0 : getMineNeighbors(cell.row, cell.col).filter((item) => item.mine).length
  })
  mineGenerated.value = true
}

const revealAllMines = () => {
  mineCells.value.forEach((cell) => {
    if (cell.mine) cell.revealed = true
  })
}

const revealMineArea = (startCell: MineCell) => {
  const queue = [startCell]
  const visited = new Set<string>()

  while (queue.length) {
    const cell = queue.shift()
    if (!cell || visited.has(cell.uid) || cell.flagged || cell.mine) continue
    visited.add(cell.uid)
    cell.revealed = true

    if (cell.adjacent > 0) continue
    getMineNeighbors(cell.row, cell.col).forEach((neighbor) => {
      if (!neighbor.revealed && !neighbor.flagged && !neighbor.mine) {
        queue.push(neighbor)
      }
    })
  }
}

const checkMineWin = () => {
  if (revealedMineCells.value < safeMineCells.value) return
  mineStatus.value = 'won'
  stopMineTimer()
  mineCells.value.forEach((cell) => {
    if (cell.mine) cell.flagged = true
  })
}

const toggleMineFlag = (row: number, col: number) => {
  if (mineStatus.value === 'won' || mineStatus.value === 'lost') return
  const cell = getMineCell(row, col)
  if (!cell || cell.revealed) return
  cell.flagged = !cell.flagged
}

const openMineCell = (row: number, col: number) => {
  if (mineStatus.value === 'won' || mineStatus.value === 'lost') return
  const cell = getMineCell(row, col)
  if (!cell || cell.revealed) return

  if (flagMode.value) {
    toggleMineFlag(row, col)
    return
  }
  if (cell.flagged) return
  if (!mineGenerated.value) generateMines(row, col)

  startMineTimer()

  if (cell.mine) {
    cell.exploded = true
    cell.revealed = true
    mineStatus.value = 'lost'
    stopMineTimer()
    revealAllMines()
    return
  }

  revealMineArea(cell)
  checkMineWin()
}

onMounted(() => {
  startSudoku()
  startSokoban()
  startGame()
  startMineGame()
  window.addEventListener('keydown', handleSokobanKeydown)
})
onBeforeUnmount(() => {
  stopTimer()
  stopMineTimer()
  clearSokobanNextTimer()
  window.removeEventListener('keydown', handleSokobanKeydown)
})
</script>

<style scoped>
.games-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100%;
}

.games-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 28px;
  border-radius: 24px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(244, 248, 255, 0.94));
  border: 1px solid rgba(122, 160, 211, 0.16);
  box-shadow: 0 18px 42px rgba(95, 124, 170, 0.12);
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

.games-header h2 {
  margin: 0;
  color: #243755;
  font-size: 30px;
  font-weight: 700;
}

.page-description {
  margin: 10px 0 0;
  color: #7d90af;
  font-size: 14px;
  line-height: 1.7;
}

.header-stats {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.stat-card {
  width: 112px;
  min-height: 86px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 16px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(122, 160, 211, 0.14);
}

.stat-label {
  color: #8ca0bc;
  font-size: 12px;
}

.stat-card strong {
  margin-top: 8px;
  color: #243755;
  font-size: 28px;
  line-height: 1;
}

.recommend-section,
.play-panel {
  padding: 22px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(122, 160, 211, 0.14);
  box-shadow: 0 12px 28px rgba(95, 124, 170, 0.1);
}

.section-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-title-row h3,
.play-header h3 {
  margin: 0;
  color: #243755;
  font-size: 18px;
}

.section-title-row p,
.play-header p {
  margin: 6px 0 0;
  color: #7d90af;
  font-size: 13px;
  line-height: 1.6;
}

.game-tabs :deep(.el-tabs__header) {
  margin: 0 0 14px;
}

.game-tabs :deep(.el-tabs__nav-wrap::after) {
  background: rgba(122, 160, 211, 0.16);
}

.game-tabs :deep(.el-tabs__item) {
  height: 42px;
  color: #6f83a3;
  font-weight: 700;
}

.game-tabs :deep(.el-tabs__item.is-active) {
  color: #2f69d0;
}

.idea-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.idea-card {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(122, 160, 211, 0.12);
}

.idea-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  color: #2f69d0;
  background: rgba(47, 145, 255, 0.1);
  font-size: 20px;
}

.idea-content {
  min-width: 0;
}

.idea-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.idea-top h4 {
  margin: 0;
  color: #243755;
  font-size: 15px;
}

.idea-content p {
  margin: 8px 0 10px;
  color: #5d7395;
  font-size: 13px;
  line-height: 1.6;
}

.idea-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: #8ca0bc;
  font-size: 12px;
}

.play-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.play-badge {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  margin-bottom: 10px;
  border-radius: 999px;
  background: rgba(45, 207, 159, 0.1);
  color: #159a78;
  font-size: 12px;
  font-weight: 700;
}

.play-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.difficulty-select {
  width: 132px;
}

.rule-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 16px 0 0;
}

.rule-strip div {
  min-width: 0;
  padding: 12px 14px;
  border-radius: 14px;
  background: #f7faff;
  border: 1px solid rgba(122, 160, 211, 0.12);
}

.rule-strip strong {
  display: block;
  margin-bottom: 6px;
  color: #243755;
  font-size: 13px;
}

.rule-strip span {
  display: block;
  color: #6f83a3;
  font-size: 12px;
  line-height: 1.55;
}

.level-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
  gap: 8px;
  max-width: 650px;
  margin-top: 14px;
}

.level-button {
  height: 34px;
  border: 1px solid rgba(122, 160, 211, 0.18);
  border-radius: 10px;
  background: linear-gradient(180deg, #ffffff 0%, #f5f8fd 100%);
  color: #5f789c;
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
  box-shadow: 0 6px 14px rgba(95, 124, 170, 0.08);
}

.level-button.active {
  border-color: transparent;
  background: linear-gradient(135deg, #2f91ff 0%, #7c4dff 100%);
  color: #fff;
  box-shadow: 0 10px 20px rgba(66, 121, 255, 0.24);
}

.score-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 18px 0;
}

.score-item {
  padding: 14px 16px;
  border-radius: 14px;
  background: #f7faff;
  border: 1px solid rgba(122, 160, 211, 0.12);
}

.score-item span {
  display: block;
  color: #8ca0bc;
  font-size: 12px;
}

.score-item strong {
  display: block;
  margin-top: 6px;
  color: #243755;
  font-size: 24px;
  line-height: 1;
}

.sudoku-layout {
  display: grid;
  grid-template-columns: minmax(0, 420px) 132px;
  align-items: start;
  gap: 16px;
  max-width: 580px;
}

.sudoku-board {
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  gap: 0;
  padding: 10px;
  border-radius: 16px;
  background: #edf3fb;
  border: 1px solid rgba(122, 160, 211, 0.16);
}

.sudoku-cell {
  aspect-ratio: 1;
  min-width: 0;
  border: 1px solid rgba(122, 160, 211, 0.22);
  background: #fff;
  color: #2f69d0;
  cursor: pointer;
  font-size: 19px;
  font-weight: 800;
  line-height: 1;
  transition:
    background 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}

.sudoku-cell:nth-child(3n) {
  border-right-color: rgba(36, 55, 85, 0.34);
}

.sudoku-cell:nth-child(n + 19):nth-child(-n + 27),
.sudoku-cell:nth-child(n + 46):nth-child(-n + 54) {
  border-bottom-color: rgba(36, 55, 85, 0.34);
}

.sudoku-cell.given {
  background: #f4f7fc;
  color: #243755;
}

.sudoku-cell.selected {
  background: rgba(47, 145, 255, 0.12);
  box-shadow: inset 0 0 0 2px rgba(47, 145, 255, 0.34);
}

.sudoku-cell.error {
  background: rgba(255, 111, 145, 0.1);
  color: #e65b83;
}

.sudoku-cell.complete {
  color: #159a78;
}

.sudoku-pad {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.sudoku-number {
  aspect-ratio: 1;
  border: 1px solid rgba(122, 160, 211, 0.18);
  border-radius: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #f5f8fd 100%);
  color: #5f789c;
  cursor: pointer;
  font-size: 18px;
  font-weight: 800;
  box-shadow: 0 8px 18px rgba(95, 124, 170, 0.1);
}

.sudoku-number.active {
  border-color: transparent;
  background: linear-gradient(135deg, #2f91ff 0%, #2dcf9f 100%);
  color: #fff;
}

.sokoban-layout {
  display: grid;
  grid-template-columns: minmax(0, 620px) 132px;
  align-items: center;
  gap: 16px;
  max-width: 790px;
}

.sokoban-board {
  display: grid;
  gap: 4px;
  width: 100%;
  padding: 10px;
  border-radius: 16px;
  background: #edf3fb;
  border: 1px solid rgba(122, 160, 211, 0.16);
}

.sokoban-cell {
  aspect-ratio: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(122, 160, 211, 0.12);
  border-radius: 8px;
  background: #fff;
  color: #6f83a3;
  overflow: hidden;
  font-size: clamp(10px, 1.4vw, 13px);
  font-weight: 800;
  line-height: 1;
}

.sokoban-cell span {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  white-space: nowrap;
}

.sokoban-icon {
  width: 76%;
  height: 76%;
  display: block;
  overflow: visible;
  filter: drop-shadow(0 2px 2px rgba(36, 55, 85, 0.16));
}

.sokoban-icon-wall {
  width: 88%;
  height: 88%;
  filter: none;
}

.sokoban-icon-target {
  width: 70%;
  height: 70%;
  filter: drop-shadow(0 2px 3px rgba(21, 154, 120, 0.18));
}

.sokoban-icon-box {
  width: 82%;
  height: 82%;
}

.sokoban-icon-player {
  width: 78%;
  height: 78%;
}

.sokoban-cell.wall {
  background: linear-gradient(135deg, #5f789c 0%, #30435f 100%);
  border-color: transparent;
}

.sokoban-cell.target {
  background: rgba(45, 207, 159, 0.1);
  color: #159a78;
}

.sokoban-cell.box {
  background: linear-gradient(135deg, #ffb454 0%, #ff8d6b 100%);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 8px 18px rgba(255, 180, 84, 0.2);
}

.sokoban-cell.player {
  background: linear-gradient(135deg, #2f91ff 0%, #7c4dff 100%);
  color: #fff;
  border-color: transparent;
}

.sokoban-cell.placed {
  background: linear-gradient(135deg, #2dcf9f 0%, #2f91ff 100%);
}

.sokoban-controls {
  display: grid;
  grid-template-columns: repeat(3, 42px);
  grid-template-areas:
    '. up .'
    'left . right'
    '. down .';
  gap: 8px;
  justify-content: center;
}

.sokoban-move {
  width: 42px;
  height: 42px;
  border: 1px solid rgba(122, 160, 211, 0.18);
  border-radius: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #f5f8fd 100%);
  color: #5f789c;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  box-shadow: 0 8px 18px rgba(95, 124, 170, 0.1);
}

.move-up {
  grid-area: up;
}

.move-left {
  grid-area: left;
}

.move-right {
  grid-area: right;
}

.move-down {
  grid-area: down;
}

.mine-play-area {
  display: grid;
  grid-template-columns: minmax(0, 680px) auto;
  align-items: center;
  gap: 12px;
  max-width: 760px;
}

.mine-board {
  display: grid;
  gap: 6px;
  width: 100%;
  padding: 12px;
  border-radius: 16px;
  background: #edf3fb;
  border: 1px solid rgba(122, 160, 211, 0.16);
}

.mine-flag-toggle {
  width: 58px;
  min-height: 92px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid rgba(122, 160, 211, 0.18);
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f5f8fd 100%);
  color: #6f83a3;
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
  box-shadow: 0 10px 22px rgba(95, 124, 170, 0.1);
  transition:
    transform 0.16s ease,
    background 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}

.mine-flag-toggle:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(95, 124, 170, 0.14);
}

.mine-flag-toggle.active {
  border-color: transparent;
  background: linear-gradient(135deg, #ffb454 0%, #ff8d6b 100%);
  color: #fff;
  box-shadow: 0 14px 28px rgba(255, 180, 84, 0.24);
}

.mine-flag-toggle .el-icon {
  font-size: 20px;
}

.mine-cell {
  aspect-ratio: 1;
  min-width: 0;
  min-height: 28px;
  border: 1px solid rgba(122, 160, 211, 0.2);
  border-radius: 8px;
  background: linear-gradient(180deg, #ffffff 0%, #f5f8fd 100%);
  color: #5f789c;
  cursor: pointer;
  font-size: 15px;
  font-weight: 800;
  line-height: 1;
  box-shadow:
    0 4px 10px rgba(95, 124, 170, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transition:
    transform 0.16s ease,
    background 0.16s ease,
    box-shadow 0.16s ease,
    border-color 0.16s ease;
}

.mine-cell:hover:not(:disabled):not(.revealed) {
  transform: translateY(-1px);
  border-color: rgba(47, 145, 255, 0.28);
  box-shadow:
    0 7px 14px rgba(95, 124, 170, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.96);
}

.mine-cell.revealed {
  background: #f8fbff;
  border-color: rgba(122, 160, 211, 0.1);
  box-shadow: inset 0 1px 3px rgba(95, 124, 170, 0.08);
  cursor: default;
}

.mine-cell.flagged {
  color: #d9822b;
  background: linear-gradient(180deg, #fff8ed 0%, #fff1dc 100%);
}

.mine-cell.mine {
  color: #8f9ab0;
}

.mine-cell.exploded {
  color: #fff;
  background: linear-gradient(135deg, #ff6f91 0%, #ff8d6b 100%);
  border-color: transparent;
}

.mine-cell-1 {
  color: #2f69d0;
}

.mine-cell-2 {
  color: #159a78;
}

.mine-cell-3 {
  color: #e65b83;
}

.mine-cell-4,
.mine-cell-5,
.mine-cell-6,
.mine-cell-7,
.mine-cell-8 {
  color: #7c4dff;
}

.memory-board {
  display: grid;
  gap: 12px;
  max-width: 720px;
}

.memory-board-easy {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.memory-board-normal,
.memory-board-hard {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.memory-card {
  position: relative;
  aspect-ratio: 1;
  min-height: 86px;
  border: 1px solid rgba(122, 160, 211, 0.18);
  border-radius: 16px;
  background: transparent;
  cursor: pointer;
  transform-style: preserve-3d;
  transition: transform 0.24s ease, box-shadow 0.24s ease;
  box-shadow: 0 10px 22px rgba(95, 124, 170, 0.1);
}

.memory-card:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 26px rgba(95, 124, 170, 0.14);
}

.memory-card.flipped,
.memory-card.matched {
  transform: rotateY(180deg);
}

.memory-card.matched {
  border-color: rgba(45, 207, 159, 0.34);
}

.card-front,
.card-back {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
  backface-visibility: hidden;
}

.card-front {
  background: linear-gradient(135deg, #2f91ff 0%, #2dcf9f 100%);
  color: #fff;
  font-size: 34px;
  font-weight: 800;
  transform: rotateY(180deg);
}

.card-back {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(240, 246, 255, 0.98));
  color: #7c4dff;
  font-size: 26px;
}

.finish-alert {
  margin-top: 16px;
}

.level-complete-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  color: #159a78;
  font-size: 13px;
  font-weight: 700;
}

@media (max-width: 900px) {
  .games-header,
  .play-header {
    flex-direction: column;
  }

  .header-stats,
  .play-actions {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .games-header,
  .recommend-section,
  .play-panel {
    padding: 18px;
  }

  .header-stats,
  .score-row,
  .rule-strip {
    grid-template-columns: 1fr;
    display: grid;
  }

  .stat-card {
    width: 100%;
  }

  .sudoku-layout,
  .sokoban-layout {
    grid-template-columns: minmax(0, 1fr);
    max-width: 100%;
  }

  .sokoban-layout {
    overflow-x: auto;
  }

  .sudoku-board,
  .sokoban-board {
    padding: 8px;
  }

  .sokoban-board {
    min-width: 480px;
  }

  .sudoku-cell {
    font-size: 15px;
  }

  .sudoku-pad {
    grid-template-columns: repeat(9, minmax(0, 1fr));
  }

  .sudoku-number {
    border-radius: 8px;
    font-size: 14px;
  }

  .sokoban-controls {
    grid-template-columns: repeat(3, 48px);
  }

  .sokoban-move {
    width: 48px;
    height: 42px;
  }

  .memory-board,
  .memory-board-easy,
  .memory-board-normal,
  .memory-board-hard {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .mine-board {
    gap: 4px;
    padding: 8px;
  }

  .mine-play-area {
    grid-template-columns: minmax(0, 1fr);
    max-width: 100%;
  }

  .mine-flag-toggle {
    width: 100%;
    min-height: 44px;
    flex-direction: row;
    border-radius: 12px;
  }

  .mine-cell {
    border-radius: 6px;
    font-size: 12px;
  }

  .memory-card {
    min-height: 74px;
  }
}
</style>
