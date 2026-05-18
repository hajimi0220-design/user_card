<template>
  <div class="hero-tab">
    <!-- 基础信息 -->
    <section class="card">
      <div class="card-title">📍 状态</div>
      <div class="grid2">
        <item label="位置" :val="d.主角.当前地点ID" />
        <item label="情绪" :val="d.主角.当前情绪" />
        <item label="精神" :val="d.主角.精神状态" type="bar" color="#a78bfa" />
        <item label="精力" :val="d.主角.精力" type="bar" color="#34d399" />
        <item label="饥饿" :val="d.主角.饥饿度" type="bar" color="#fb923c" />
        <item label="社交" :val="d.主角.社交需求" type="bar" color="#60a5fa" />
      </div>
    </section>

    <!-- CG外观 -->
    <section class="card">
      <div class="card-title">👗 外观</div>
      <div class="cg-grid">
        <cg-row label="服装" :val="d.主角.CG外观.当前服装" />
        <cg-row label="表情" :val="d.主角.CG外观.当前表情" />
        <cg-row label="姿态" :val="d.主角.CG外观.当前姿态" />
        <cg-row label="场景" :val="d.主角.CG外观.当前场景背景" />
        <cg-row v-if="d.主角.CG外观.特殊状态标注" label="特殊" :val="d.主角.CG外观.特殊状态标注" highlight />
      </div>
    </section>

    <!-- 职业 -->
    <section class="card">
      <div class="card-title">💼 职业</div>
      <div class="grid2">
        <item label="职业" :val="d.主角.职业.当前职业" />
        <item label="称谓" :val="d.主角.职业.职位称谓" />
        <item label="等级" :val="`Lv${d.主角.职业.职业等级}`" />
        <item label="经验" :val="d.主角.职业.职业经验" type="bar" color="#f472b6" :max="500" />
        <item label="压力" :val="d.主角.职业.工作压力" type="bar" color="#f87171" />
        <item label="今日上班" :val="d.主角.职业.今日是否上班 ? '✅' : '❌'" />
      </div>
      <div v-if="Object.keys(d.主角.职业.专业技能).length" class="skills">
        <div v-for="(v, k) in d.主角.职业.专业技能" :key="k" class="skill-row">
          <span class="skill-name">{{ k }}</span>
          <div class="skill-bar-bg"><div class="skill-bar-fill" :style="{ width: v + '%', background: skillColor(v) }" /></div>
          <span class="skill-val">{{ v }}</span>
        </div>
      </div>
    </section>

    <!-- 经济 -->
    <section class="card">
      <div class="card-title">💰 经济</div>
      <div class="grid2">
        <item label="现金" :val="`¥${d.主角.经济.现金.toLocaleString()}`" />
        <item label="存款" :val="`¥${d.主角.经济.银行存款.toLocaleString()}`" />
        <item label="月收入" :val="`¥${d.主角.经济.月固定收入.toLocaleString()}`" />
        <item label="月支出" :val="`¥${d.主角.经济.月固定支出.toLocaleString()}`" />
        <item label="负债" :val="`¥${d.主角.经济.负债.toLocaleString()}`" />
        <item label="信用" :val="d.主角.经济.信用等级" />
        <item label="阶层" :val="d.主角.经济.经济阶层" />
      </div>
      <div class="month-bar">
        <span class="month-label">本月收支</span>
        <span class="income">+¥{{ d.主角.经济.本月已收入.toLocaleString() }}</span>
        <span class="expense">-¥{{ d.主角.经济.本月已支出.toLocaleString() }}</span>
        <span class="balance" :class="{ pos: balance >= 0, neg: balance < 0 }">
          净 {{ balance >= 0 ? '+' : '' }}¥{{ balance.toLocaleString() }}
        </span>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { z } from 'zod/v4';
import type { Schema } from '../../schema';

const props = defineProps<{ d: z.infer<typeof Schema> }>();
const d = computed(() => props.d);
const balance = computed(() => d.value.主角.经济.本月已收入 - d.value.主角.经济.本月已支出);
const skillColor = (v: number) => v >= 80 ? '#a78bfa' : v >= 50 ? '#60a5fa' : '#94a3b8';
</script>

<!-- 子组件：item -->
<script lang="ts">
import { defineComponent, h, computed } from 'vue';
export const item = defineComponent({
  props: { label: String, val: [String, Number], type: String, color: String, max: { type: Number, default: 100 } },
  setup(p) {
    return () => h('div', { class: 'stat-item' }, [
      h('span', { class: 'stat-label' }, p.label),
      p.type === 'bar'
        ? h('div', { class: 'stat-bar-wrap' }, [
            h('div', { class: 'stat-bar', style: { width: Math.min(100, (Number(p.val) / p.max) * 100) + '%', background: p.color } }),
            h('span', { class: 'stat-bar-val' }, String(p.val)),
          ])
        : h('span', { class: 'stat-val' }, String(p.val ?? '—')),
    ]);
  },
});

export const cgRow = defineComponent({
  props: { label: String, val: String, highlight: Boolean },
  setup(p) {
    return () => h('div', { class: ['cg-row', p.highlight && 'cg-highlight'] }, [
      h('span', { class: 'cg-label' }, p.label),
      h('span', { class: 'cg-val' }, p.val || '—'),
    ]);
  },
});
</script>

<style lang="scss" scoped>
.hero-tab { display: flex; flex-direction: column; gap: 10px; }

.card {
  background: rgba(255,255,255,0.8);
  border-radius: 12px;
  padding: 10px 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.card-title { font-size: 12px; font-weight: 700; color: #ff6b9d; margin-bottom: 8px; letter-spacing: 0.5px; }

.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }

.stat-item { display: flex; flex-direction: column; gap: 2px; }
.stat-label { font-size: 10px; color: #aaa; }
.stat-val { font-size: 13px; font-weight: 600; color: #333; }
.stat-bar-wrap { display: flex; align-items: center; gap: 4px; }
.stat-bar { height: 6px; border-radius: 3px; min-width: 2px; transition: width 0.3s; }
.stat-bar-val { font-size: 11px; color: #666; }

.cg-grid { display: flex; flex-direction: column; gap: 4px; }
.cg-row { display: flex; gap: 6px; font-size: 12px; }
.cg-label { color: #aaa; min-width: 28px; flex-shrink: 0; }
.cg-val { color: #444; }
.cg-highlight .cg-val { color: #f43f5e; font-weight: 600; }

.skills { margin-top: 8px; display: flex; flex-direction: column; gap: 4px; }
.skill-row { display: flex; align-items: center; gap: 6px; }
.skill-name { font-size: 11px; color: #666; min-width: 32px; }
.skill-bar-bg { flex: 1; height: 5px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
.skill-bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
.skill-val { font-size: 11px; color: #888; min-width: 24px; text-align: right; }

.month-bar {
  display: flex; align-items: center; gap: 8px; margin-top: 8px;
  padding: 6px 8px; background: #f8f8ff; border-radius: 8px; font-size: 12px;
}
.month-label { color: #aaa; flex: 1; }
.income { color: #10b981; font-weight: 600; }
.expense { color: #f43f5e; font-weight: 600; }
.balance { font-weight: 700; &.pos { color: #10b981; } &.neg { color: #f43f5e; } }
</style>
