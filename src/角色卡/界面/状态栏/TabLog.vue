<template>
  <div class="log-tab">
    <section class="log-sec">
      <div class="log-title">
        <i class="fas fa-clock-rotate-left" /> 近期记录
        <span class="log-count">{{ smallCount }} / 20</span>
        <div class="count-bar"><div class="count-fill" :style="{ width: (smallCount / 20 * 100) + '%' }" /></div>
      </div>
      <div v-if="smallCount === 0" class="empty">暂无记录</div>
      <div v-for="(v, k) in sortedSmall" :key="k" class="log-card small-card">
        <div class="log-card-head">
          <span class="log-key">{{ k }}</span>
          <span class="log-loc"><i class="fas fa-map-marker-alt" /> {{ v.地点 }}</span>
          <span class="log-time">{{ v.时间 }}</span>
        </div>
        <div class="log-event">{{ v.事件 }}</div>
        <div class="log-change">{{ v.各人物状态变化 }}</div>
        <div v-if="v.情感进展 && v.情感进展 !== '无'" class="log-emotion"><i class="fas fa-heart" /> {{ v.情感进展 }}</div>
      </div>
    </section>

    <section class="log-sec">
      <div class="log-title">
        <i class="fas fa-book" /> 阶段总结
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
          <div v-for="line in v.各NPC关系进展?.split('\n').filter(Boolean)" :key="line" class="npc-prog-line">{{ line }}</div>
        </div>
        <div v-if="v.已解锁背景?.length" class="log-unlocked"><i class="fas fa-unlock-alt" /> {{ v.已解锁背景.join(' · ') }}</div>
        <div v-if="v.重要转折" class="log-turning"><i class="fas fa-bolt" /> {{ v.重要转折 }}</div>
      </div>
    </section>

    <section class="log-sec">
      <div class="log-title"><i class="fas fa-landmark" /> 历史档案</div>
      <div v-if="historyCount === 0" class="empty">历史尚未开始书写</div>
      <div v-for="(v, k) in d._总结系统?.历史档案 ?? {}" :key="k" class="log-card history-card">
        <div class="history-head">
          <span class="log-key history-key">{{ k }}</span>
          <span class="history-title">{{ v.章节标题 }}</span>
          <span class="log-time">{{ v.时间跨度 }}</span>
        </div>
        <div class="log-event">{{ v.故事梗概 }}</div>
        <div v-if="v.关系里程碑?.length" class="history-milestones">
          <span v-for="m in v.关系里程碑" :key="m" class="milestone">{{ m }}</span>
        </div>
        <div v-if="v.世界观变化" class="log-turning"><i class="fas fa-globe" /> {{ v.世界观变化 }}</div>
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
  Object.fromEntries(Object.entries(d.value._总结系统?.小总结 ?? {}).sort(([a], [b]) => b.localeCompare(a)))
);
const sortedBig = computed(() =>
  Object.fromEntries(Object.entries(d.value._总结系统?.大总结 ?? {}).sort(([a], [b]) => b.localeCompare(a)))
);
const smallCount = computed(() => Object.keys(d.value._总结系统?.小总结 ?? {}).length);
const bigCount = computed(() => Object.keys(d.value._总结系统?.大总结 ?? {}).length);
const historyCount = computed(() => Object.keys(d.value._总结系统?.历史档案 ?? {}).length);
</script>

<style lang="scss" scoped>
.log-tab { display: flex; flex-direction: column; gap: 8px; }

.log-sec {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px; padding: 11px;
}
.log-title {
  font-size: 11px; font-weight: 700; color: #a78bfa;
  display: flex; align-items: center; gap: 6px; margin-bottom: 9px;
  letter-spacing: 0.5px; text-transform: uppercase;
  i { margin-right: 2px; }
}
.log-count { font-size: 10px; color: #4a3f60; font-weight: 400; }
.count-bar { flex: 1; height: 3px; background: rgba(167,139,250,0.15); border-radius: 2px; overflow: hidden; &.big { background: rgba(251,191,36,0.15); } }
.count-fill { height: 100%; background: #a78bfa; border-radius: 2px; transition: width 0.4s; }
.big-fill { background: #fbbf24; }

.empty { font-size: 11px; color: #4a3f60; text-align: center; padding: 8px 0; }

.log-card {
  border-radius: 10px; padding: 9px 10px; margin-bottom: 6px;
  &:last-child { margin-bottom: 0; }
  &.small-card { background: rgba(167,139,250,0.08); border-left: 2px solid #a78bfa55; }
  &.big-card { background: rgba(251,191,36,0.08); border-left: 2px solid #fbbf2455; }
  &.history-card { background: rgba(52,211,153,0.08); border-left: 2px solid #34d39955; }
}
.log-card-head { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; flex-wrap: wrap; }
.log-key { font-size: 10px; color: #a78bfa; font-weight: 700; }
.big-key { color: #fbbf24; }
.history-key { color: #34d399; }
.log-loc { font-size: 10px; color: #6b5f80; flex: 1; i { margin-right: 2px; } }
.log-time { font-size: 10px; color: #4a3f60; }
.log-event { font-size: 12px; color: #c4b8d8; line-height: 1.5; margin-bottom: 3px; }
.log-change { font-size: 10px; color: #6b5f80; }
.log-emotion { font-size: 10px; color: #f472b6; margin-top: 3px; i { margin-right: 3px; } }
.log-npc-progress { margin: 4px 0; }
.npc-prog-line { font-size: 10px; color: #6b5f80; line-height: 1.6; }
.log-unlocked { font-size: 10px; color: #34d399; margin-top: 3px; i { margin-right: 3px; } }
.log-turning { font-size: 11px; color: #fbbf24; font-weight: 600; margin-top: 3px; i { margin-right: 3px; } }

.history-head { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; flex-wrap: wrap; }
.history-title { font-size: 13px; font-weight: 700; color: #e8e0f0; flex: 1; }
.history-milestones { display: flex; flex-wrap: wrap; gap: 4px; margin: 5px 0; }
.milestone { font-size: 10px; background: rgba(52,211,153,0.15); color: #34d399; padding: 2px 8px; border-radius: 10px; border: 1px solid rgba(52,211,153,0.25); }
</style>
