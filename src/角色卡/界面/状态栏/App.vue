<template>
  <div class="app-root" :style="bgStyle">
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <div class="status-left">
        <span class="date-chip">{{ d.世界.当前日期 }}</span>
        <span class="week-chip">{{ d.世界.当前星期 }}</span>
      </div>
      <div class="status-center">
        <span class="time-badge">{{ timeIcon }} {{ d.世界.当前时间段 }}</span>
      </div>
      <div class="status-right">
        <span class="weather-chip">{{ d.世界.天气 }} {{ d.世界.气温 }}</span>
        <button class="history-btn" :class="{ active: showHistory }" @click="toggleHistory" title="历史楼层">
          <i class="fas fa-history" />
        </button>
        <button class="history-btn" :class="{ active: showDebug }" @click="showDebug = !showDebug" title="调试">
          <i class="fas fa-bug" />
        </button>
      </div>
    </div>

    <!-- thinking 转圈（生成中且未到story时显示在状态栏下方） -->
    <div v-if="isThinking" class="thinking-bar">
      <i class="fas fa-circle-notch fa-spin thinking-spin" />
      <span>思考中…</span>
    </div>

    <!-- 标签栏 -->
    <div class="tab-bar">
      <button v-for="t in tabs" :key="t.key" class="tab-btn" :class="{ active: tab === t.key }" @click="tab = t.key">
        <i :class="t.icon" />
        <span>{{ t.label }}</span>
      </button>
    </div>

    <!-- 内容区 -->
    <div class="tab-content">
      <TabStory v-if="tab === 'story'" :d="d" :is-generating="isGenerating" :streaming-raw="streamingRaw" />
      <TabHero  v-if="tab === 'hero'"  :d="d" />
      <TabNpc   v-if="tab === 'npc'"   :d="d" />
      <TabLog   v-if="tab === 'log'"   :d="d" />
    </div>

    <!-- 输入框 -->
    <div class="input-bar">
      <input
        v-model="inputText"
        class="input-field"
        placeholder="输入消息…"
        :disabled="isGenerating"
        @keydown.enter.exact.prevent="sendMessage"
      />
      <button class="send-btn" :disabled="isGenerating || !inputText.trim()" @click="sendMessage">
        <i v-if="isGenerating" class="fas fa-circle-notch fa-spin" />
        <i v-else class="fas fa-paper-plane" />
      </button>
    </div>

    <!-- 调试面板 -->
    <div v-if="showDebug" class="debug-panel">
      <div class="debug-header">
        <span>流式原文</span>
        <button class="h-close" @click="showDebug = false"><i class="fas fa-times" /></button>
      </div>
      <pre class="debug-pre">{{ streamingRaw || lastRaw || '（等待生成…）' }}</pre>
    </div>

    <!-- 历史楼层面板 -->
    <div v-if="showHistory" class="history-panel" @click.self="showHistory = false">
      <div class="history-inner">
        <div class="history-header">
          <span>叙事历史 <span class="h-count">{{ historyMessages.length }} 条</span></span>
          <button class="h-close" @click="showHistory = false"><i class="fas fa-times" /></button>
        </div>
        <div v-if="!historyMessages.length" class="h-empty">暂无历史记录</div>
        <div v-else class="h-list">
          <div v-for="(msg, i) in historyMessages" :key="msg.id" class="h-item assistant">
            <div class="h-item-head">
              <span class="h-id">#{{ historyMessages.length - i }}</span>
              <button class="h-expand" @click="toggleExpand(i)">
                <i :class="expanded.has(i) ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" />
              </button>
              <button class="h-rollback" @click="rollbackTo(historyMessages.length - 1 - i)">
                <i class="fas fa-undo" /> 回溯
              </button>
            </div>
            <div class="h-content" :class="{ expanded: expanded.has(i) }">{{ msg.text }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from './store';
import TabHero  from './TabHero.vue';
import TabNpc   from './TabNpc.vue';
import TabLog   from './TabLog.vue';
import TabStory from './TabStory.vue';

const store = useDataStore();
const d = computed(() => store.data);

const tab = ref<'story' | 'hero' | 'npc' | 'log'>('story');
const tabs = [
  { key: 'story', label: '正文',   icon: 'fas fa-book-open' },
  { key: 'hero',  label: '主角',   icon: 'fas fa-user' },
  { key: 'npc',   label: '联系人', icon: 'fas fa-address-book' },
  { key: 'log',   label: '记录',   icon: 'fas fa-scroll' },
] as const;

const TIME_ICONS: Record<string, string> = {
  清晨: '🌅', 上午: '☀️', 下午: '🌤', 傍晚: '🌆', 夜晚: '🌙', 深夜: '🌃',
};
const timeIcon = computed(() => TIME_ICONS[d.value.世界.当前时间段] ?? '🕐');

const BG_IMAGE_URL = '';
const bgStyle = computed(() => BG_IMAGE_URL
  ? { backgroundImage: `url(${BG_IMAGE_URL})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  : {}
);

// ── 流式生成 ──────────────────────────────────────────────────
const inputText = ref('');
const isGenerating = ref(false);
const streamingRaw = ref('');
const lastRaw = ref('');
const showDebug = ref(false);

// thinking 阶段：已开始生成但还没出现 <story> 标签
const isThinking = computed(() =>
  isGenerating.value && !!streamingRaw.value && !streamingRaw.value.includes('<story>')
);

onMounted(() => {
  eventOn(iframe_events.GENERATION_STARTED, () => {
    isGenerating.value = true;
    streamingRaw.value = '';
  });
  eventOn(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, (text: string) => {
    streamingRaw.value = text;
  });
  eventOn(iframe_events.GENERATION_ENDED, async () => {
    isGenerating.value = false;
    lastRaw.value = streamingRaw.value;
    const raw = streamingRaw.value;
    streamingRaw.value = '';

    const storyMatch = /<story>([\s\S]*?)<\/story>/.exec(raw);
    if (!storyMatch) return;
    const narrativeOnly = storyMatch[1]
      .replace(/<sms[^>]*>[\s\S]*?<\/sms>/g, '')
      .replace(/<call[^/]*\/>/g, '')
      .replace(/<npc_scene[^>]*>[\s\S]*?<\/npc_scene>/g, '')
      .trim();

    const variables = Mvu.getMvuData({ type: 'chat' });
    if (!_.has(variables, 'stat_data')) _.set(variables, 'stat_data', {});
    const stat_data = _.get(variables, 'stat_data');
    _.set(stat_data, '_叙事内容', narrativeOnly);
    const hist: any[] = _.get(stat_data, '_叙事历史', []);
    hist.push({ id: Date.now(), text: narrativeOnly, ts: Date.now() });
    if (hist.length > 50) hist.shift();
    _.set(stat_data, '_叙事历史', hist);
    await Mvu.replaceMvuData(variables, { type: 'chat' });
  });
});

async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || isGenerating.value) return;
  inputText.value = '';
  await generate({ user_input: text, should_stream: true, max_chat_history: 0 });
}

// ── 历史楼层 ──────────────────────────────────────────────────
const showHistory = ref(false);
const expanded = ref(new Set<number>());

const historyMessages = computed(() =>
  [...((d.value as any)._叙事历史 ?? [])].reverse()
);

function toggleHistory() { showHistory.value = !showHistory.value; }

function toggleExpand(i: number) {
  const s = new Set(expanded.value);
  s.has(i) ? s.delete(i) : s.add(i);
  expanded.value = s;
}

async function rollbackTo(idx: number) {
  if (!confirm(`回溯到第 ${idx + 1} 条记录？之后的记录将被清除。`)) return;
  showHistory.value = false;
  const hist: any[] = (d.value as any)._叙事历史 ?? [];
  const kept = hist.slice(0, idx + 1);
  const vars = Mvu.getMvuData({ type: 'chat' });
  _.set(vars, 'stat_data._叙事历史', kept);
  _.set(vars, 'stat_data._叙事内容', kept[kept.length - 1]?.text ?? '');
  await Mvu.replaceMvuData(vars, { type: 'chat' });
}
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.app-root {
  width: 100%;
  height: 600px;
  background: linear-gradient(160deg, #0f0c1a 0%, #1a1028 50%, #0d1520 100%);
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  border-radius: 20px;
  overflow: hidden;
  color: #e8e0f0;
  display: flex;
  flex-direction: column;
  position: relative;
}

.status-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px 8px;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  gap: 6px;
}
.status-left, .status-right { display: flex; gap: 5px; align-items: center; }
.status-center { flex: 1; display: flex; justify-content: center; }

.date-chip, .week-chip, .weather-chip {
  font-size: 10px; padding: 2px 7px; border-radius: 20px;
  background: rgba(255,255,255,0.07); color: #b8a8d0; letter-spacing: 0.3px;
}
.time-badge {
  font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px;
  background: linear-gradient(90deg, rgba(168,85,247,0.25), rgba(99,102,241,0.25));
  border: 1px solid rgba(168,85,247,0.3); color: #d8b4fe; letter-spacing: 0.5px;
}
.history-btn {
  width: 24px; height: 24px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.07); color: #6b5f80; font-size: 11px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
  &.active, &:hover { background: rgba(167,139,250,0.2); color: #a78bfa; }
}

/* ── thinking 转圈 ── */
.thinking-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 14px;
  font-size: 12px; color: #7c6f96;
  background: rgba(167,139,250,0.05);
  border-bottom: 1px solid rgba(167,139,250,0.1);
}
.thinking-spin { color: #a78bfa; font-size: 13px; }

.tab-bar {
  display: flex; padding: 0 8px; gap: 4px; margin-top: 8px;
  background: rgba(0,0,0,0.2);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.tab-btn {
  flex: 1; display: flex; align-items: center; justify-content: center;
  gap: 5px; padding: 9px 4px; border: none; background: transparent;
  color: #6b5f80; font-size: 12px; font-weight: 500; cursor: pointer;
  transition: all 0.2s; border-bottom: 2px solid transparent;
  i { font-size: 11px; }
  &.active { color: #c084fc; border-bottom-color: #c084fc; background: rgba(192,132,252,0.06); }
}

.tab-content { flex: 1; overflow-y: auto; min-height: 0; padding: 12px; }

/* ── 输入框 ── */
.input-bar {
  display: flex; gap: 8px; padding: 10px 12px 12px;
  border-top: 1px solid rgba(255,255,255,0.07);
  background: rgba(0,0,0,0.2);
}
.input-field {
  flex: 1; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px; padding: 9px 14px; color: #e8e0f0; font-size: 13px; outline: none;
  font-family: inherit;
  &::placeholder { color: #4a4060; }
  &:focus { border-color: rgba(168,85,247,0.5); }
  &:disabled { opacity: 0.5; }
}
.send-btn {
  width: 38px; height: 38px; border-radius: 50%; border: none; flex-shrink: 0;
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  color: #fff; font-size: 13px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: opacity 0.15s;
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

/* ── 历史楼层面板 ── */
.history-panel {
  position: absolute; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; flex-direction: column;
}
.history-inner {
  margin: auto 0 0;
  max-height: 75%;
  background: linear-gradient(160deg, #1a1028, #0f0c1a);
  border-top: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px 20px 0 0;
  display: flex; flex-direction: column; overflow: hidden;
}
.history-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  font-size: 13px; font-weight: 700; color: #c084fc;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  flex-shrink: 0;
}
.h-count { font-size: 10px; color: #6b5f80; font-weight: 400; margin-left: 4px; }
.h-close {
  background: none; border: none; color: #6b5f80; font-size: 14px; cursor: pointer;
}
.h-loading, .h-empty {
  padding: 24px; text-align: center; font-size: 12px; color: #4a3f60;
}
.h-list { overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 6px; }
.h-item {
  border-radius: 10px; padding: 10px 12px;
  &.user { background: rgba(99,102,241,0.08); border-left: 2px solid rgba(99,102,241,0.4); }
  &.assistant { background: rgba(167,139,250,0.08); border-left: 2px solid rgba(167,139,250,0.4); }
  &.hidden { opacity: 0.6; }
}
.h-item-head {
  display: flex; align-items: center; gap: 6px; margin-bottom: 5px;
}
.h-role { font-size: 10px; font-weight: 700; color: #7c6f96; }
.h-id { font-size: 10px; color: #4a3f60; flex: 1; }
.h-hidden-tag {
  font-size: 9px; padding: 1px 5px; border-radius: 6px;
  background: rgba(251,191,36,0.15); color: #fbbf24; border: 1px solid rgba(251,191,36,0.3);
}
.h-expand {
  background: none; border: none; color: #4a3f60; font-size: 10px; cursor: pointer; padding: 2px 4px;
  &:hover { color: #a78bfa; }
}
.h-rollback {
  font-size: 10px; padding: 2px 8px; border-radius: 10px; border: none;
  background: rgba(239,68,68,0.15); color: #f87171; cursor: pointer;
  display: flex; align-items: center; gap: 4px;
  &:hover { background: rgba(239,68,68,0.25); }
}
.h-content {
  font-size: 12px; color: #9d8fb0; line-height: 1.6; white-space: pre-wrap;
  max-height: 72px; overflow: hidden;
  display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical;
  &.expanded { max-height: none; display: block; -webkit-line-clamp: unset; }
}

/* ── 调试面板 ── */
.debug-panel {
  position: absolute; inset: 0; z-index: 300;
  background: #0a0a0f; display: flex; flex-direction: column;
}
.debug-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; font-size: 12px; font-weight: 700; color: #34d399;
  border-bottom: 1px solid rgba(52,211,153,0.2); flex-shrink: 0;
}
.debug-pre {
  flex: 1; overflow-y: auto; padding: 10px 12px;
  font-size: 11px; line-height: 1.6; color: #9d8fb0;
  white-space: pre-wrap; word-break: break-all;
  font-family: 'Courier New', monospace;
}
</style>
