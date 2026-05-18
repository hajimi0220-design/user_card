<template>
  <div class="log-tab">

    <!-- 小总结 -->
    <section class="log-sec">
      <div class="log-title">📝 近期记录
        <span class="log-count">{{ smallCount }} / 20</span>
        <div class="count-bar"><div class="count-fill" :style="{ width: (smallCount / 20 * 100) + '%' }" /></div>
      </div>
      <div v-if="smallCount === 0" class="empty">暂无记录</div>
      <div v-for="(v, k) in sortedSmall" :key="k" class="log-card small-card">
        <div class="log-card-head">
          <span class="log-key">{{ k }}</span>
          <span class="log-loc">📍 {{ v.地点 }}</span>
          <span class="log-time">{{ v.时间 }}</span>
        </div>
        <div class="log-event">{{ v.事件 }}</div>
        <div class="log-change">{{ v.各人物状态变化 }}</div>
        <div v-if="v.情感进展 && v.情感进展 !== '无'" class="log-emotion">💗 {{ v.情感进展 }}</div>
      </div>
    </section>

    <!-- 大总结 -->
    <section class="log-sec">
      <div class="log-title">📚 阶段总结
        <span class="log-count">{{ bigCount }} / 5</span>
        <div class="count-bar big"><div class="count-fill big-fill" :style="{ width: (bigCount / 5 * 100) + '%' }" /></div>
      </div>
      <div v-if="bigCount === 0" class="empty">暂无阶段总结</div>
      <div v-for="(v, k) in sortedBig" :key="k" class="log-card big-card">
        <div class="log-card-head">
          <span class="log-key big-key">{{ k }}</span>
          <span class="log-loc">{{ v.时间跨度 }}</span>
        </div>
        <div class="log-event">{{ v.主线事件 }}</div>
        <div class="log-npc-progress">
          <div v-for="line in v.各NPC关系进展?.split('\n').filter(Boolean)" :key="line" class="npc-prog-line">
            {{ line }}
          </div>
        </div>
        <div v-if="v.已解锁背景?.length" class="log-unlocked">
          🔓 {{ v.已解锁背景.join(' · ') }}
        </div>
        <div v-if="v.重要转折" class="log-turning">⚡ {{ v.重要转折 }}</div>
      </div>
    </section>

    <!-- 历史档案 -->
    <section class="log-sec">
      <div class="log-title">🏛 历史档案</div>
      <div v-if="historyCount === 0" class="empty">历史尚未开始书写</div>
      <div v-for="(v, k) in d._总结系统?.历史档案 ?? {}" :key="k" class="log-card history-card">
        <div class="history-head">
          <span class="history-key">{{ k }}</span>
          <span class="history-title">{{ v.章节标题 }}</span>
          <span class="history-span">{{ v.时间跨度 }}</span>
        </div>
        <div class="history-body">{{ v.故事梗概 }}</div>
        <div v-if="v.关系里程碑?.length" class="history-milestones">
          <span v-for="m in v.关系里程碑" :key="m" class="milestone">{{ m }}</span>
        </div>
        <div v-if="v.世界观变化" class="history-worldview">🌍 {{ v.世界观变化 }}</div>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import type { z } from 'zod/v4';
import type { Schema } from '../../schema';

const props = defineProps<{ d: z.infer<typeof Schema> }>();
const d = computed(() => props.d);

const sortedSmall = computed(() =>
  Object.fromEntries(
    Object.entries(d.value._总结系统?.小总结 ?? {}).sort(([a], [b]) => b.localeCompare(a))
  )
);
const sortedBig = computed(() =>
  Object.fromEntries(
    Object.entries(d.value._总结系统?.大总结 ?? {}).sort(([a], [b]) => b.localeCompare(a))
  )
);

const smallCount = computed(() => Object.keys(d.value._总结系统?.小总结 ?? {}).length);
const bigCount = computed(() => Object.keys(d.value._总结系统?.大总结 ?? {}).length);
const historyCount = computed(() => Object.keys(d.value._总结系统?.历史档案 ?? {}).length);
</script>

<style lang="scss" scoped>
.log-tab { display: flex; flex-direction: column; gap: 10px; }

.log-sec {
  background: rgba(255,255,255,0.75);
  border-radius: 12px; padding: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.log-title {
  font-size: 12px; font-weight: 700; color: #7c3aed;
  display: flex; align-items: center; gap: 6px; margin-bottom: 8px;
}
.log-count { font-size: 10px; color: #aaa; font-weight: 400; }
.count-bar {
  flex: 1; height: 3px; background: #ede9fe; border-radius: 2px; overflow: hidden;
  &.big { background: #fef3c7; }
}
.count-fill { height: 100%; background: #7c3aed; border-radius: 2px; transition: width 0.4s; }
.big-fill { background: #f59e0b; }

.empty { font-size: 11px; color: #ccc; text-align: center; padding: 8px 0; }

.log-card {
  border-radius: 8px; padding: 8px; margin-bottom: 6px;
  &:last-child { margin-bottom: 0; }
  &.small-card { background: #faf5ff; border-left: 3px solid #a78bfa; }
  &.big-card { background: #fffbeb; border-left: 3px solid #f59e0b; }
  &.history-card { background: #f0fdf4; border-left: 3px solid #10b981; }
}
.log-card-head { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; flex-wrap: wrap; }
.log-key { font-size: 10px; color: #a78bfa; font-weight: 700; }
.big-key { color: #f59e0b; }
.log-loc { font-size: 10px; color: #888; flex: 1; }
.log-time { font-size: 10px; color: #bbb; }
.log-event { font-size: 12px; color: #333; line-height: 1.5; margin-bottom: 3px; }
.log-change { font-size: 10px; color: #888; }
.log-emotion { font-size: 10px; color: #ec4899; margin-top: 2px; }
.log-npc-progress { margin: 4px 0; }
.npc-prog-line { font-size: 10px; color: #666; line-height: 1.6; }
.log-unlocked { font-size: 10px; color: #059669; margin-top: 3px; }
.log-turning { font-size: 11px; color: #d97706; font-weight: 600; margin-top: 3px; }

.history-head { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; flex-wrap: wrap; }
.history-key { font-size: 10px; color: #10b981; font-weight: 700; }
.history-title { font-size: 13px; font-weight: 700; color: #065f46; flex: 1; }
.history-span { font-size: 10px; color: #aaa; }
.history-body { font-size: 12px; color: #444; line-height: 1.7; margin-bottom: 6px; }
.history-milestones { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 4px; }
.milestone { font-size: 10px; background: #d1fae5; color: #065f46; padding: 2px 7px; border-radius: 10px; }
.history-worldview { font-size: 11px; color: #6b7280; font-style: italic; }
</style>
