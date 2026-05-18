<template>
  <div class="npc-tab">
    <!-- 名片列表 -->
    <template v-if="!selected">
      <div v-for="npc in NPC_LIST" :key="npc.key" class="npc-card" :style="cardStyle(npc)" @click="selected = npc.key">
        <!-- 名片背景图床接口：替换 npc.cardBg 对应的 URL 即可 -->
        <div class="card-bg" :style="npc.cardBg ? { backgroundImage: `url(${npc.cardBg})` } : {}" />
        <div class="card-body">
          <div class="card-avatar">
            <div class="lv-badge">Lv{{ npcData(npc.key).好感度等级 }}</div>
          </div>
          <div class="card-info">
            <div class="card-name" :style="{ color: npc.nameColor }">{{ npc.name }}</div>
            <div class="card-sub">{{ npc.title }}</div>
            <div class="card-relation">
              <span class="relation-tag" :style="{ background: npc.accent + '33', color: npc.accent }">
                {{ npcData(npc.key).关系阶段 }}
              </span>
              <span class="card-location">📍 {{ npcData(npc.key).当前地点ID }}</span>
            </div>
            <div class="attitude-bar">
              <div class="attitude-fill" :style="{ width: (npcData(npc.key).好感度经验 / 540 * 100) + '%', background: npc.accent }" />
            </div>
          </div>
          <!-- 手机按钮 -->
          <div class="phone-btns" @click.stop>
            <button class="phone-btn call" :style="{ background: npc.accent }" @click="emit('action', npc.key, 'call')">
              <i class="fas fa-phone" />
            </button>
            <button class="phone-btn sms" :style="{ background: npc.accent + 'cc' }" @click="emit('action', npc.key, 'sms')">
              <i class="fas fa-comment" />
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- 详细界面 -->
    <NpcDetail v-else :npc-key="selected" :d="d" :config="NPC_LIST.find(n => n.key === selected)!" @back="selected = null" />
  </div>
</template>

<script setup lang="ts">
import type { z } from 'zod/v4';
import type { Schema } from '../../schema';
import NpcDetail from './NpcDetail.vue';

const props = defineProps<{ d: z.infer<typeof Schema> }>();
const d = computed(() => props.d);
const emit = defineEmits<{ (e: 'action', npc: string, type: 'call' | 'sms'): void }>();

const selected = ref<string | null>(null);

// ── NPC 配置（名片背景图床接口在此） ─────────────────────────
// cardBg: 名片背景图 URL，留空使用渐变
// detailBg: 详细界面背景图 URL，留空使用渐变
export interface NpcConfig {
  key: '苏梦璃' | '柳清梦' | '林雨涵' | '墨瑾萱';
  name: string;
  title: string;
  accent: string;
  nameColor: string;
  gradient: string;
  cardBg: string;   // ← 名片背景图床接口
  detailBg: string; // ← 详细界面背景图床接口
}

const NPC_LIST: NpcConfig[] = [
  {
    key: '苏梦璃',
    name: '苏梦璃',
    title: '网络主播 · 梦璃',
    accent: '#ff6b9d',
    nameColor: '#ff4d8d',
    gradient: 'linear-gradient(135deg, #fff0f6 0%, #ffe4f0 100%)',
    cardBg: '',   // ← 苏梦璃名片背景图 URL
    detailBg: '', // ← 苏梦璃详细界面背景图 URL
  },
  {
    key: '柳清梦',
    name: '柳清梦',
    title: '清梦阁 · 古董鉴定师',
    accent: '#6ee7b7',
    nameColor: '#059669',
    gradient: 'linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%)',
    cardBg: '',
    detailBg: '',
  },
  {
    key: '林雨涵',
    name: '林雨涵',
    title: '黑客 · 雨夜',
    accent: '#818cf8',
    nameColor: '#4f46e5',
    gradient: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
    cardBg: '',
    detailBg: '',
  },
  {
    key: '墨瑾萱',
    name: '墨瑾萱',
    title: '墨家二小姐 · 大四',
    accent: '#fbbf24',
    nameColor: '#d97706',
    gradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    cardBg: '',
    detailBg: '',
  },
];

const npcData = (key: string) => (d.value as any)[key] ?? {};
const cardStyle = (npc: NpcConfig) => npc.cardBg ? {} : { background: npc.gradient };
</script>

<style lang="scss" scoped>
.npc-tab { display: flex; flex-direction: column; gap: 10px; }

.npc-card {
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 3px 12px rgba(0,0,0,0.08);
  cursor: pointer;
  position: relative;
  transition: transform 0.15s;
  &:active { transform: scale(0.98); }
}
.card-bg {
  position: absolute; inset: 0;
  background-size: cover; background-position: center;
  opacity: 0.35;
}
.card-body {
  position: relative;
  display: flex; align-items: center; gap: 10px;
  padding: 12px;
}
.card-avatar {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: rgba(255,255,255,0.6);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.lv-badge {
  font-size: 11px; font-weight: 700; color: #555;
}
.card-info { flex: 1; min-width: 0; }
.card-name { font-size: 15px; font-weight: 700; }
.card-sub { font-size: 11px; color: #888; margin: 1px 0 4px; }
.card-relation { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.relation-tag { font-size: 10px; padding: 1px 6px; border-radius: 10px; font-weight: 600; }
.card-location { font-size: 10px; color: #aaa; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.attitude-bar {
  height: 3px; background: rgba(0,0,0,0.08); border-radius: 2px; overflow: hidden;
}
.attitude-fill { height: 100%; border-radius: 2px; transition: width 0.4s; }

.phone-btns { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
.phone-btn {
  width: 32px; height: 32px; border-radius: 50%; border: none;
  color: #fff; font-size: 13px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: opacity 0.15s;
  &:active { opacity: 0.7; }
}
</style>
