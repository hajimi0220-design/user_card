<template>
  <div class="story-tab">
    <!-- 通用正文 -->
    <div class="narrative-box">
      <div v-if="isGenerating && isThinking" class="thinking-bar">
        <i class="fas fa-circle-notch fa-spin" />
        <span>思考中…</span>
      </div>
      <p v-if="displayNarrative" class="narrative-text">{{ displayNarrative }}<span v-if="isGenerating && !isThinking" class="cursor-blink" /></p>
      <p v-else class="narrative-empty">（等待生成…）</p>
    </div>

    <!-- NPC 特殊场景折叠栏 -->
    <template v-if="npcScenes.length">
      <details v-for="scene in npcScenes" :key="scene.npc" class="npc-scene">
        <summary class="scene-summary">
          <i class="fas fa-eye-slash" />
          {{ scene.npc }} 的独立活动
        </summary>
        <p class="scene-text">{{ scene.text }}</p>
      </details>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { z } from 'zod/v4';
import type { Schema } from '../../schema';

const props = defineProps<{
  d: z.infer<typeof Schema>;
  isGenerating: boolean;
  streamingRaw: string;
  lastRaw: string;
  lastNarrative: string;
}>();

const isThinking = computed(() =>
  props.isGenerating && !!props.streamingRaw && !/<story\b/i.test(props.streamingRaw)
);

function normalizeTags(text: string) {
  return String(text ?? '').replace(/＜/g, '<').replace(/＞/g, '>');
}

function cleanupNarrative(text: string) {
  return normalizeTags(text)
    .replace(/```(?:\w+)?/g, '')
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

const historyNarrative = computed(() => {
  const history = (props.d as any)._叙事历史;
  if (!Array.isArray(history)) return '';
  const latest = history[history.length - 1]?.text;
  return typeof latest === 'string' ? latest.trim() : '';
});

const savedNarrative = computed(() =>
  (props.d as any)._叙事内容 || props.lastNarrative || historyNarrative.value || extractNarrative(props.lastRaw) || ''
);

const displayNarrative = computed(() => {
  if (props.isGenerating && props.streamingRaw) {
    return extractNarrative(props.streamingRaw) || savedNarrative.value;
  }
  return savedNarrative.value;
});

const npcScenes = computed(() => (props.d as any)._叙事NPC场景 ?? []);
</script>

<style lang="scss" scoped>
.story-tab { display: flex; flex-direction: column; gap: 10px; }

.narrative-box {
  padding: 14px;
  background: rgba(255,255,255,0.03);
  border-left: 3px solid #a78bfa;
  border-radius: 0 10px 10px 0;
  min-height: 60px;
}
.thinking-bar {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: #7c6f96; margin-bottom: 8px;
  i { color: #a78bfa; }
}
.narrative-text { font-size: 13px; line-height: 1.9; color: #d4cce8; white-space: pre-wrap; }
.narrative-empty { font-size: 12px; color: #4a3f60; }
.cursor-blink {
  display: inline-block; width: 2px; height: 13px;
  background: #a78bfa; margin-left: 2px; vertical-align: middle;
  animation: blink 1s step-end infinite;
}
@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }

.npc-scene {
  border-radius: 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  overflow: hidden;
}
.scene-summary {
  padding: 10px 14px; font-size: 12px; font-weight: 600;
  color: #7c6f96; cursor: pointer; list-style: none;
  display: flex; align-items: center; gap: 7px;
  &::-webkit-details-marker { display: none; }
  i { font-size: 11px; color: #6b5f80; }
  &:hover { color: #a78bfa; }
}
.scene-text {
  padding: 0 14px 12px;
  font-size: 12px; line-height: 1.8; color: #9d8fb0; white-space: pre-wrap;
}
</style>
