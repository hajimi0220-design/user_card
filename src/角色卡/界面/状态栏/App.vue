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
        <button class="history-btn" :class="{ active: showSettings }" @click="showSettings = !showSettings" title="外观设置">
          <i class="fas fa-palette" />
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
      <TabStory
        v-if="tab === 'story'"
        :d="d"
        :is-generating="isGenerating"
        :streaming-raw="streamingRaw"
        :last-raw="lastRaw"
        :last-narrative="lastNarrative"
      />
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
      <pre class="debug-pre">{{ debugRaw || '（等待生成…）' }}</pre>
    </div>

    <!-- 外观设置面板 -->
    <div v-if="showSettings" class="settings-panel" @click.self="showSettings = false">
      <div class="settings-inner">
        <div class="settings-header">
          <span>外观设置</span>
          <div class="settings-actions">
            <button class="settings-small-btn" @click="resetTheme">恢复默认</button>
            <button class="h-close" @click="showSettings = false"><i class="fas fa-times" /></button>
          </div>
        </div>

        <div class="settings-body">
          <label class="settings-row">
            <span>背景图片 URL</span>
            <input v-model="themeDraft.appBackgroundImage" placeholder="留空则使用背景色/渐变" @input="saveThemeDraft" />
          </label>
          <label class="settings-row">
            <span>本地字体文件名</span>
            <input v-model="themeDraft.fontFileName" placeholder="例如：my-font.ttf" @input="saveThemeDraft" />
          </label>
          <label class="settings-row">
            <span>字体名称</span>
            <input v-model="themeDraft.fontFamily" placeholder="例如：UserCardFont" @input="saveThemeDraft" />
          </label>

          <div class="settings-grid">
            <label v-for="item in colorSettings" :key="item.key" class="color-row">
              <span>{{ item.label }}</span>
              <input v-model="themeDraft[item.key]" type="color" @input="saveThemeDraft" />
            </label>
          </div>
        </div>
      </div>
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
            <div class="h-content" :class="{ expanded: expanded.has(i) }">{{ stripHiddenComments(msg.text) }}</div>
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

type ThemeConfig = {
  fontFileName: string;
  fontFamily: string;
  appBackgroundColor: string;
  appBackgroundImage: string;
  panelBackgroundColor: string;
  storyBackgroundColor: string;
  storyTextColor: string;
  accentColor: string;
  mutedTextColor: string;
  borderColor: string;
  inputBackgroundColor: string;
  markdownBoldColor: string;
  markdownItalicColor: string;
  markdownCodeColor: string;
  markdownCodeBackground: string;
  quoteDoubleColor: string;
  quoteSingleColor: string;
  quoteBracketColor: string;
  quoteChineseColor: string;
};

declare global {
  interface Window {
    USER_CARD_THEME_CONFIG?: Partial<ThemeConfig>;
  }
}

const DEFAULT_THEME: ThemeConfig = {
  fontFileName: '',
  fontFamily: 'Noto Sans SC',
  appBackgroundColor: '#0f0c1a',
  appBackgroundImage: '',
  panelBackgroundColor: '#1a1028',
  storyBackgroundColor: '#171222',
  storyTextColor: '#d4cce8',
  accentColor: '#a78bfa',
  mutedTextColor: '#7c6f96',
  borderColor: '#2c223a',
  inputBackgroundColor: '#251d32',
  markdownBoldColor: '#f9a8d4',
  markdownItalicColor: '#93c5fd',
  markdownCodeColor: '#86efac',
  markdownCodeBackground: '#10151d',
  quoteDoubleColor: '#fbbf24',
  quoteSingleColor: '#5eead4',
  quoteBracketColor: '#c4b5fd',
  quoteChineseColor: '#fb7185',
};

const THEME_STORAGE_KEY = 'user_card.themeSettings';
const themeDraft = reactive<ThemeConfig>({ ...DEFAULT_THEME });
const showSettings = ref(false);
const colorSettings: { key: keyof ThemeConfig; label: string }[] = [
  { key: 'appBackgroundColor', label: '整体背景' },
  { key: 'panelBackgroundColor', label: '面板背景' },
  { key: 'storyBackgroundColor', label: '正文背景' },
  { key: 'storyTextColor', label: '正文文字' },
  { key: 'accentColor', label: '强调色' },
  { key: 'mutedTextColor', label: '弱文字' },
  { key: 'borderColor', label: '边框' },
  { key: 'inputBackgroundColor', label: '输入框背景' },
  { key: 'markdownBoldColor', label: '加粗文字' },
  { key: 'markdownItalicColor', label: '斜体文字' },
  { key: 'markdownCodeColor', label: '代码文字' },
  { key: 'markdownCodeBackground', label: '代码背景' },
  { key: 'quoteDoubleColor', label: '双引号内容' },
  { key: 'quoteSingleColor', label: '单引号内容' },
  { key: 'quoteBracketColor', label: '括号内容' },
  { key: 'quoteChineseColor', label: '中文引号内容' },
];

const bgStyle = computed(() => {
  const fontFamily = themeDraft.fontFileName ? 'UserCardLocalFont' : themeDraft.fontFamily;
  const style: Record<string, string> = {
    '--uc-font-family': `'${fontFamily}', '${themeDraft.fontFamily}', 'PingFang SC', 'Microsoft YaHei', sans-serif`,
    '--uc-bg': themeDraft.appBackgroundColor,
    '--uc-panel-bg': themeDraft.panelBackgroundColor,
    '--uc-story-bg': themeDraft.storyBackgroundColor,
    '--uc-text': themeDraft.storyTextColor,
    '--uc-accent': themeDraft.accentColor,
    '--uc-muted': themeDraft.mutedTextColor,
    '--uc-border': themeDraft.borderColor,
    '--uc-input-bg': themeDraft.inputBackgroundColor,
    '--uc-md-bold': themeDraft.markdownBoldColor,
    '--uc-md-italic': themeDraft.markdownItalicColor,
    '--uc-md-code': themeDraft.markdownCodeColor,
    '--uc-md-code-bg': themeDraft.markdownCodeBackground,
    '--uc-quote-double': themeDraft.quoteDoubleColor,
    '--uc-quote-single': themeDraft.quoteSingleColor,
    '--uc-quote-bracket': themeDraft.quoteBracketColor,
    '--uc-quote-chinese': themeDraft.quoteChineseColor,
  };
  if (themeDraft.appBackgroundImage.trim()) {
    style.backgroundImage = `url(${themeDraft.appBackgroundImage.trim()})`;
    style.backgroundSize = 'cover';
    style.backgroundPosition = 'center';
  }
  return style;
});

function readSavedTheme() {
  try {
    return JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) ?? '{}') as Partial<ThemeConfig>;
  } catch {
    return {};
  }
}

function applyTheme(partial: Partial<ThemeConfig>) {
  Object.assign(themeDraft, DEFAULT_THEME, partial);
  installLocalFont();
}

function saveThemeDraft() {
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeDraft));
  installLocalFont();
}

function resetTheme() {
  localStorage.removeItem(THEME_STORAGE_KEY);
  applyTheme(window.USER_CARD_THEME_CONFIG ?? {});
}

function installLocalFont() {
  const old = document.getElementById('user-card-local-font');
  old?.remove();
  const fileName = themeDraft.fontFileName.trim();
  if (!fileName) return;
  const style = document.createElement('style');
  style.id = 'user-card-local-font';
  style.textContent = `@font-face{font-family:'UserCardLocalFont';src:url('./${fileName}') format('truetype');font-display:swap;}`;
  document.head.appendChild(style);
}

function loadExternalThemeConfig() {
  return new Promise<void>(resolve => {
    const script = document.createElement('script');
    script.src = `./theme-config.js?v=${Date.now()}`;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

applyTheme(readSavedTheme());
void loadExternalThemeConfig().then(() => {
  applyTheme({ ...(window.USER_CARD_THEME_CONFIG ?? {}), ...readSavedTheme() });
});

// ── 流式生成 ──────────────────────────────────────────────────
const inputText = ref('');
const isGenerating = ref(false);
const streamingRaw = ref('');
const lastRaw = ref('');
const activeGenerationId = ref<string | null>(null);
const finishedGenerationIds = new Set<string>();
const NARRATIVE_CACHE_PREFIX = 'user_card.lastNarrative';
const lastNarrative = ref(loadCachedNarrative());
const showDebug = ref(false);

// thinking 阶段：已开始生成但还没出现 <story> 标签
const isThinking = computed(() =>
  isGenerating.value && !!streamingRaw.value && !/<story\b/i.test(streamingRaw.value)
);
const debugRaw = computed(() => stripHiddenComments(streamingRaw.value || lastRaw.value));

function stripHiddenComments(text: string) {
  return String(text ?? '').replace(/<!--[\s\S]*?-->/g, '');
}

function cleanupNarrative(text: string) {
  return normalizeTags(text)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<sms\b[^>]*>[\s\S]*?<\/sms>/gi, '')
    .replace(/<call\b[^>]*\/>/gi, '')
    .replace(/<call\b[^>]*>[\s\S]*?<\/call>/gi, '')
    .replace(/<npc_scene\b[^>]*>[\s\S]*?<\/npc_scene>/gi, '')
    .replace(/<thinking\b[^>]*>[\s\S]*?(?:<\/thinking>|$)/gi, '')
    .replace(/<context\b[^>]*>[\s\S]*?(?:<\/context>|$)/gi, '')
    .replace(/<lenitxt\b[^>]*>[\s\S]*?(?:<\/lenitxt>|$)/gi, '')
    .replace(/<state\b[^>]*>[\s\S]*?(?:<\/state>|$)/gi, '')
    .replace(/<wine\b[^>]*>[\s\S]*?(?:<\/wine>|$)/gi, '')
    .replace(/<UpdateVariable\b[^>]*>[\s\S]*?(?:<\/UpdateVariable>|$)/gi, '')
    .replace(/<Analysis\b[^>]*>[\s\S]*?(?:<\/Analysis>|$)/gi, '')
    .replace(/<JSONPatch\b[^>]*>[\s\S]*?(?:<\/JSONPatch>|$)/gi, '')
    .trim();
}

function extractNarrative(raw: string) {
  const normalized = normalizeTags(raw);
  const storyMatch = /<story\b[^>]*>([\s\S]*?)(?:<\/story>|$)/i.exec(normalized);
  return cleanupNarrative(storyMatch ? storyMatch[1] : normalized);
}

function normalizeTags(text: string) {
  return String(text ?? '').replace(/＜/g, '<').replace(/＞/g, '>');
}

function narrativeCacheKey() {
  const currentMessageId = typeof getCurrentMessageId === 'function' ? getCurrentMessageId() : null;
  if (currentMessageId !== undefined && currentMessageId !== null) {
    return `${NARRATIVE_CACHE_PREFIX}:message:${currentMessageId}`;
  }
  let chatId = 'unknown';
  try {
    chatId = SillyTavern.getCurrentChatId?.() || chatId;
  } catch { /* ignore unavailable SillyTavern context */ }
  return `${NARRATIVE_CACHE_PREFIX}:${chatId}`;
}

function loadCachedNarrative() {
  try {
    return localStorage.getItem(narrativeCacheKey()) ?? '';
  } catch {
    return '';
  }
}

function rememberNarrative(text: string) {
  const narrative = text.trim();
  if (!narrative) return;
  lastNarrative.value = narrative;
  try {
    localStorage.setItem(narrativeCacheKey(), narrative);
  } catch { /* ignore storage quota/private mode errors */ }
}

function appendNarrativeHistory(stat_data: any, narrativeOnly: string, id = Date.now()) {
  const hist: any[] = _.get(stat_data, '_叙事历史', []);
  if (hist[hist.length - 1]?.text === narrativeOnly) return;
  hist.push({ id, text: narrativeOnly, ts: Date.now() });
  if (hist.length > 50) hist.shift();
  _.set(stat_data, '_叙事历史', hist);
}

async function persistNarrative(narrativeOnly: string) {
  const variables = Mvu.getMvuData({ type: 'chat' });
  if (!_.has(variables, 'stat_data')) _.set(variables, 'stat_data', {});
  const stat_data = _.get(variables, 'stat_data');
  _.set(stat_data, '_叙事内容', narrativeOnly);
  appendNarrativeHistory(stat_data, narrativeOnly);
  await Mvu.replaceMvuData(variables, { type: 'chat' });
}

function shouldHandleGeneration(generationId?: string) {
  return !activeGenerationId.value || !generationId || generationId === activeGenerationId.value;
}

async function finishGeneration(rawText: string, generationId?: string) {
  if (!shouldHandleGeneration(generationId)) return;

  isGenerating.value = false;
  const raw = rawText || streamingRaw.value || lastRaw.value;
  lastRaw.value = raw;
  streamingRaw.value = '';

  if (!raw.trim()) return;

  const narrativeOnly = extractNarrative(raw);
  if (!narrativeOnly) return;

  rememberNarrative(narrativeOnly);
  if (generationId && finishedGenerationIds.has(generationId)) return;

  await persistNarrative(narrativeOnly);
  if (generationId) finishedGenerationIds.add(generationId);
  if (generationId && activeGenerationId.value === generationId) {
    activeGenerationId.value = null;
  }
}

watch(
  () => (d.value as any)._叙事内容,
  value => {
    if (typeof value === 'string' && value.trim()) {
      rememberNarrative(value);
    }
  },
  { immediate: true },
);

watch(
  () => (d.value as any)._叙事历史,
  value => {
    const latest = Array.isArray(value) ? value[value.length - 1]?.text : '';
    if (typeof latest === 'string' && latest.trim()) {
      rememberNarrative(latest);
    }
  },
  { deep: true, immediate: true },
);

onMounted(() => {
  eventOn(iframe_events.GENERATION_STARTED, (generationId: string) => {
    if (!shouldHandleGeneration(generationId)) return;
    isGenerating.value = true;
    streamingRaw.value = '';
  });
  eventOn(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, (text: string, generationId: string) => {
    if (!shouldHandleGeneration(generationId)) return;
    streamingRaw.value = text;
    const narrativeOnly = extractNarrative(text);
    if (narrativeOnly) rememberNarrative(narrativeOnly);
  });
  eventOn(iframe_events.GENERATION_ENDED, (text: string, generationId: string) => {
    void finishGeneration(text, generationId);
  });
});

async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || isGenerating.value) return;
  inputText.value = '';
  const generationId = `user-card-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  activeGenerationId.value = generationId;
  isGenerating.value = true;
  streamingRaw.value = '';
  try {
    const result = await generate({ generation_id: generationId, user_input: text, should_stream: true, max_chat_history: 0 });
    const raw = typeof result === 'string' ? result : result.content ?? '';
    await finishGeneration(raw, generationId);
  } catch (error) {
    isGenerating.value = false;
    if (activeGenerationId.value === generationId) activeGenerationId.value = null;
    console.error(error);
  }
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
  background: var(--uc-bg, #0f0c1a);
  font-family: var(--uc-font-family, 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif);
  border-radius: 20px;
  overflow: hidden;
  color: var(--uc-text, #e8e0f0);
  display: flex;
  flex-direction: column;
  position: relative;
}

.status-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px 8px;
  background: color-mix(in srgb, var(--uc-panel-bg, #1a1028) 82%, transparent);
  border-bottom: 1px solid var(--uc-border, rgba(255,255,255,0.06));
  gap: 6px;
}
.status-left, .status-right { display: flex; gap: 5px; align-items: center; }
.status-center { flex: 1; display: flex; justify-content: center; }

.date-chip, .week-chip, .weather-chip {
  font-size: 10px; padding: 2px 7px; border-radius: 20px;
  background: color-mix(in srgb, var(--uc-panel-bg, #1a1028) 72%, white 12%);
  color: var(--uc-muted, #b8a8d0); letter-spacing: 0.3px;
}
.time-badge {
  font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px;
  background: color-mix(in srgb, var(--uc-accent, #a78bfa) 22%, transparent);
  border: 1px solid color-mix(in srgb, var(--uc-accent, #a78bfa) 45%, transparent);
  color: var(--uc-accent, #d8b4fe); letter-spacing: 0.5px;
}
.history-btn {
  width: 24px; height: 24px; border-radius: 50%; border: none;
  background: color-mix(in srgb, var(--uc-panel-bg, #1a1028) 70%, white 10%);
  color: var(--uc-muted, #6b5f80); font-size: 11px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
  &.active, &:hover { background: color-mix(in srgb, var(--uc-accent, #a78bfa) 22%, transparent); color: var(--uc-accent, #a78bfa); }
}

/* ── thinking 转圈 ── */
.thinking-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 14px;
  font-size: 12px; color: var(--uc-muted, #7c6f96);
  background: color-mix(in srgb, var(--uc-accent, #a78bfa) 8%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--uc-accent, #a78bfa) 16%, transparent);
}
.thinking-spin { color: var(--uc-accent, #a78bfa); font-size: 13px; }

.tab-bar {
  display: flex; padding: 0 8px; gap: 4px; margin-top: 8px;
  background: color-mix(in srgb, var(--uc-panel-bg, #1a1028) 86%, black 12%);
  border-bottom: 1px solid var(--uc-border, rgba(255,255,255,0.05));
}
.tab-btn {
  flex: 1; display: flex; align-items: center; justify-content: center;
  gap: 5px; padding: 9px 4px; border: none; background: transparent;
  color: var(--uc-muted, #6b5f80); font-size: 12px; font-weight: 500; cursor: pointer;
  transition: all 0.2s; border-bottom: 2px solid transparent;
  i { font-size: 11px; }
  &.active { color: var(--uc-accent, #c084fc); border-bottom-color: var(--uc-accent, #c084fc); background: color-mix(in srgb, var(--uc-accent, #c084fc) 10%, transparent); }
}

.tab-content { flex: 1; overflow-y: auto; min-height: 0; padding: 12px; }

/* ── 输入框 ── */
.input-bar {
  display: flex; gap: 8px; padding: 10px 12px 12px;
  border-top: 1px solid var(--uc-border, rgba(255,255,255,0.07));
  background: color-mix(in srgb, var(--uc-panel-bg, #1a1028) 88%, black 12%);
}
.input-field {
  flex: 1; background: var(--uc-input-bg, rgba(255,255,255,0.07)); border: 1px solid var(--uc-border, rgba(255,255,255,0.1));
  border-radius: 20px; padding: 9px 14px; color: var(--uc-text, #e8e0f0); font-size: 13px; outline: none;
  font-family: inherit;
  &::placeholder { color: var(--uc-muted, #4a4060); }
  &:focus { border-color: var(--uc-accent, #a78bfa); }
  &:disabled { opacity: 0.5; }
}
.send-btn {
  width: 38px; height: 38px; border-radius: 50%; border: none; flex-shrink: 0;
  background: linear-gradient(135deg, color-mix(in srgb, var(--uc-accent, #a78bfa) 72%, #000), var(--uc-accent, #a78bfa));
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
  background: var(--uc-panel-bg, #1a1028);
  border-top: 1px solid var(--uc-border, rgba(255,255,255,0.1));
  border-radius: 20px 20px 0 0;
  display: flex; flex-direction: column; overflow: hidden;
}
.history-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  font-size: 13px; font-weight: 700; color: var(--uc-accent, #c084fc);
  border-bottom: 1px solid var(--uc-border, rgba(255,255,255,0.07));
  flex-shrink: 0;
}
.h-count { font-size: 10px; color: var(--uc-muted, #6b5f80); font-weight: 400; margin-left: 4px; }
.h-close {
  background: none; border: none; color: var(--uc-muted, #6b5f80); font-size: 14px; cursor: pointer;
}
.h-loading, .h-empty {
  padding: 24px; text-align: center; font-size: 12px; color: var(--uc-muted, #4a3f60);
}
.h-list { overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 6px; }
.h-item {
  border-radius: 10px; padding: 10px 12px;
  &.user { background: rgba(99,102,241,0.08); border-left: 2px solid rgba(99,102,241,0.4); }
  &.assistant { background: color-mix(in srgb, var(--uc-accent, #a78bfa) 10%, transparent); border-left: 2px solid color-mix(in srgb, var(--uc-accent, #a78bfa) 55%, transparent); }
  &.hidden { opacity: 0.6; }
}
.h-item-head {
  display: flex; align-items: center; gap: 6px; margin-bottom: 5px;
}
.h-role { font-size: 10px; font-weight: 700; color: #7c6f96; }
.h-id { font-size: 10px; color: var(--uc-muted, #4a3f60); flex: 1; }
.h-hidden-tag {
  font-size: 9px; padding: 1px 5px; border-radius: 6px;
  background: rgba(251,191,36,0.15); color: #fbbf24; border: 1px solid rgba(251,191,36,0.3);
}
.h-expand {
  background: none; border: none; color: #4a3f60; font-size: 10px; cursor: pointer; padding: 2px 4px;
  &:hover { color: var(--uc-accent, #a78bfa); }
}
.h-rollback {
  font-size: 10px; padding: 2px 8px; border-radius: 10px; border: none;
  background: rgba(239,68,68,0.15); color: #f87171; cursor: pointer;
  display: flex; align-items: center; gap: 4px;
  &:hover { background: rgba(239,68,68,0.25); }
}
.h-content {
  font-size: 12px; color: var(--uc-text, #9d8fb0); line-height: 1.6; white-space: pre-wrap;
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

/* ── 外观设置 ── */
.settings-panel {
  position: absolute; inset: 0; z-index: 260;
  background: rgba(0,0,0,0.62); backdrop-filter: blur(4px);
  display: flex; flex-direction: column;
}
.settings-inner {
  margin: auto 0 0;
  max-height: 82%;
  background: var(--uc-panel-bg, #1a1028);
  border-top: 1px solid var(--uc-border, rgba(255,255,255,0.1));
  border-radius: 20px 20px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.settings-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  color: var(--uc-accent, #c084fc);
  font-size: 13px; font-weight: 700;
  border-bottom: 1px solid var(--uc-border, rgba(255,255,255,0.07));
}
.settings-actions { display: flex; align-items: center; gap: 8px; }
.settings-small-btn {
  border: 1px solid var(--uc-border, rgba(255,255,255,0.1));
  background: color-mix(in srgb, var(--uc-accent, #a78bfa) 12%, transparent);
  color: var(--uc-accent, #a78bfa);
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 11px;
  cursor: pointer;
}
.settings-body {
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.settings-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 11px;
  color: var(--uc-muted, #7c6f96);
}
.settings-row input {
  width: 100%;
  border: 1px solid var(--uc-border, rgba(255,255,255,0.1));
  border-radius: 8px;
  background: var(--uc-input-bg, #251d32);
  color: var(--uc-text, #e8e0f0);
  padding: 7px 9px;
  font-size: 12px;
  outline: none;
  font-family: inherit;
}
.settings-row input:focus { border-color: var(--uc-accent, #a78bfa); }
.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.color-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  border: 1px solid var(--uc-border, rgba(255,255,255,0.08));
  border-radius: 8px;
  padding: 8px;
  color: var(--uc-muted, #7c6f96);
  font-size: 11px;
}
.color-row span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.color-row input {
  width: 34px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}
</style>
