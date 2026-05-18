<template>
  <div class="app-root" :style="bgStyle">
    <!-- 顶部世界信息栏 -->
    <div class="world-bar">
      <span class="world-item">📅 {{ d.世界.当前日期 }} {{ d.世界.当前星期 }}</span>
      <span class="world-item">🕐 {{ d.世界.当前时间段 }}</span>
      <span class="world-item">🌤 {{ d.世界.天气 }} {{ d.世界.气温 }}</span>
    </div>

    <!-- 标签栏 -->
    <div class="tab-bar">
      <button v-for="t in tabs" :key="t.key" class="tab-btn" :class="{ active: tab === t.key }" @click="tab = t.key">
        {{ t.label }}
      </button>
    </div>

    <!-- 内容区 -->
    <div class="tab-content">
      <TabHero v-if="tab === 'hero'" :d="d" />
      <TabNpc  v-if="tab === 'npc'"  :d="d" />
      <TabLog  v-if="tab === 'log'"  :d="d" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from './store';
import TabHero from './TabHero.vue';
import TabNpc  from './TabNpc.vue';
import TabLog  from './TabLog.vue';

const store = useDataStore();
const d = computed(() => store.data);

const tab = ref<'hero' | 'npc' | 'log'>('npc');
const tabs = [
  { key: 'hero', label: '主角' },
  { key: 'npc',  label: 'NPC' },
  { key: 'log',  label: '记录' },
] as const;

// ── 整体背景图床接口 ──────────────────────────────────────────
// 替换下方 URL 即可更换整体背景图片
// 留空则使用渐变背景
const BG_IMAGE_URL = '';
const bgStyle = computed(() => BG_IMAGE_URL
  ? { backgroundImage: `url(${BG_IMAGE_URL})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  : {}
);
</script>

<style lang="scss">
* { box-sizing: border-box; margin: 0; padding: 0; }

.app-root {
  width: 100%;
  min-height: 100px;
  background: linear-gradient(135deg, #fff9f0 0%, #ffeef8 50%, #eef4ff 100%);
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  border-radius: 16px;
  overflow: hidden;
}

.world-bar {
  display: flex;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255,180,200,0.3);
  flex-wrap: wrap;
}
.world-item {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.tab-bar {
  display: flex;
  padding: 8px 12px 0;
  gap: 6px;
  background: rgba(255,255,255,0.5);
}
.tab-btn {
  padding: 6px 20px;
  border: none;
  border-radius: 20px 20px 0 0;
  background: rgba(255,255,255,0.4);
  color: #999;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &.active {
    background: #fff;
    color: #ff6b9d;
    box-shadow: 0 -2px 8px rgba(255,107,157,0.15);
  }
}

.tab-content {
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(4px);
  padding: 12px;
}
</style>
