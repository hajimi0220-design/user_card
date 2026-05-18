<template>
  <div class="story-tab">
    <!-- 通用正文 -->
    <div class="narrative-box">
      <div v-if="isGenerating && isThinking" class="thinking-bar">
        <i class="fas fa-circle-notch fa-spin" />
        <span>思考中…</span>
      </div>
      <div v-if="displayNarrative" class="narrative-text" v-html="displayNarrativeHtml" />
      <span v-if="displayNarrative && isGenerating && !isThinking" class="cursor-blink" />
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

function escapeHtml(text: string) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function applyInlineMarkdown(text: string) {
  const tokens: string[] = [];
  let html = escapeHtml(text);

  html = html.replace(/`([^`\n]+?)`/g, (_m, code) => {
    const token = `\u0000CODE${tokens.length}\u0000`;
    tokens.push(`<code>${code}</code>`);
    return token;
  });

  html = html
    .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__([\s\S]+?)__/g, '<strong>$1</strong>')
    .replace(/(^|[^\*])\*([^\*\n]+?)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^_])_([^_\n]+?)_/g, '$1<em>$2</em>')
    .replace(/&quot;([^&\n]+?)&quot;/g, '<span class="quote-double">"$1"</span>')
    .replace(/&#39;([^&\n]+?)&#39;/g, '<span class="quote-single">\'$1\'</span>')
    .replace(/“([^”\n]+?)”/g, '<span class="quote-chinese">“$1”</span>')
    .replace(/‘([^’\n]+?)’/g, '<span class="quote-chinese">‘$1’</span>')
    .replace(/「([^」\n]+?)」/g, '<span class="quote-chinese">「$1」</span>')
    .replace(/『([^』\n]+?)』/g, '<span class="quote-chinese">『$1』</span>')
    .replace(/（([^）\n]+?)）/g, '<span class="quote-bracket">（$1）</span>')
    .replace(/\(([^()\n]+?)\)/g, '<span class="quote-bracket">($1)</span>')
    .replace(/【([^】\n]+?)】/g, '<span class="quote-bracket">【$1】</span>')
    .replace(/\[([^\]\n]+?)\]/g, '<span class="quote-bracket">[$1]</span>');

  for (const [index, tokenHtml] of tokens.entries()) {
    html = html.replace(`\u0000CODE${index}\u0000`, tokenHtml);
  }
  return html;
}

function renderMarkdown(text: string) {
  const normalized = normalizeTags(text).replace(/<!--[\s\S]*?-->/g, '').replace(/\r\n?/g, '\n');
  const blocks: string[] = [];
  const lines = normalized.split('\n');
  let paragraph: string[] = [];
  let list: string[] = [];
  let inCode = false;
  let codeLang = '';
  let codeLines: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(`<p>${applyInlineMarkdown(paragraph.join('\n'))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    blocks.push(`<ul>${list.map(item => `<li>${applyInlineMarkdown(item)}</li>`).join('')}</ul>`);
    list = [];
  };

  for (const line of lines) {
    const fence = /^```([\w-]*)\s*$/.exec(line);
    if (fence) {
      if (inCode) {
        blocks.push(`<pre><code${codeLang ? ` class="language-${escapeHtml(codeLang)}"` : ''}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        inCode = false;
        codeLang = '';
        codeLines = [];
      } else {
        flushParagraph();
        flushList();
        inCode = true;
        codeLang = fence[1] ?? '';
      }
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length + 2;
      blocks.push(`<h${level}>${applyInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    const quote = /^>\s?(.+)$/.exec(line);
    if (quote) {
      flushParagraph();
      flushList();
      blocks.push(`<blockquote>${applyInlineMarkdown(quote[1])}</blockquote>`);
      continue;
    }
    const bullet = /^\s*[-*]\s+(.+)$/.exec(line);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1]);
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  if (inCode) {
    blocks.push(`<pre><code${codeLang ? ` class="language-${escapeHtml(codeLang)}"` : ''}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  }

  return blocks.join('');
}

const displayNarrativeHtml = computed(() => renderMarkdown(displayNarrative.value));
const npcScenes = computed(() => (props.d as any)._叙事NPC场景 ?? []);
</script>

<style lang="scss" scoped>
.story-tab { display: flex; flex-direction: column; gap: 10px; }

.narrative-box {
  padding: 14px;
  background: var(--uc-story-bg, rgba(255,255,255,0.03));
  border-left: 3px solid var(--uc-accent, #a78bfa);
  border-radius: 0 10px 10px 0;
  min-height: 60px;
}
.thinking-bar {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: var(--uc-muted, #7c6f96); margin-bottom: 8px;
  i { color: var(--uc-accent, #a78bfa); }
}
.narrative-text {
  font-size: 13px;
  line-height: 1.9;
  color: var(--uc-text, #d4cce8);
  word-break: break-word;
  :deep(p) { margin: 0 0 0.75em; white-space: pre-wrap; }
  :deep(p:last-child) { margin-bottom: 0; }
  :deep(strong) { color: var(--uc-md-bold, #f9a8d4); font-weight: 700; }
  :deep(em) { color: var(--uc-md-italic, #93c5fd); font-style: italic; }
  :deep(code) {
    color: var(--uc-md-code, #86efac);
    background: var(--uc-md-code-bg, #10151d);
    border: 1px solid var(--uc-border, rgba(255,255,255,0.08));
    border-radius: 4px;
    padding: 1px 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.94em;
  }
  :deep(pre) {
    margin: 8px 0;
    padding: 10px 12px;
    overflow-x: auto;
    border-radius: 8px;
    background: var(--uc-md-code-bg, #10151d);
    border: 1px solid var(--uc-border, rgba(255,255,255,0.08));
  }
  :deep(pre code) {
    padding: 0;
    border: none;
    background: transparent;
    white-space: pre;
    display: block;
  }
  :deep(blockquote) {
    margin: 6px 0;
    padding: 4px 0 4px 10px;
    border-left: 2px solid var(--uc-accent, #a78bfa);
    color: color-mix(in srgb, var(--uc-text, #d4cce8) 78%, white 10%);
  }
  :deep(ul) { margin: 6px 0 8px 18px; }
  :deep(h3), :deep(h4), :deep(h5) {
    margin: 10px 0 6px;
    color: var(--uc-accent, #a78bfa);
    font-size: 1.05em;
  }
  :deep(.quote-double) { color: var(--uc-quote-double, #fbbf24); }
  :deep(.quote-single) { color: var(--uc-quote-single, #5eead4); }
  :deep(.quote-bracket) { color: var(--uc-quote-bracket, #c4b5fd); }
  :deep(.quote-chinese) { color: var(--uc-quote-chinese, #fb7185); }
}
.narrative-empty { font-size: 12px; color: var(--uc-muted, #4a3f60); }
.cursor-blink {
  display: inline-block; width: 2px; height: 13px;
  background: var(--uc-accent, #a78bfa); margin-left: 2px; vertical-align: middle;
  animation: blink 1s step-end infinite;
}
@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }

.npc-scene {
  border-radius: 10px;
  background: var(--uc-story-bg, rgba(255,255,255,0.03));
  border: 1px solid var(--uc-border, rgba(255,255,255,0.07));
  overflow: hidden;
}
.scene-summary {
  padding: 10px 14px; font-size: 12px; font-weight: 600;
  color: var(--uc-muted, #7c6f96); cursor: pointer; list-style: none;
  display: flex; align-items: center; gap: 7px;
  &::-webkit-details-marker { display: none; }
  i { font-size: 11px; color: var(--uc-muted, #6b5f80); }
  &:hover { color: var(--uc-accent, #a78bfa); }
}
.scene-text {
  padding: 0 14px 12px;
  font-size: 12px; line-height: 1.8; color: var(--uc-text, #9d8fb0); white-space: pre-wrap;
}
</style>
