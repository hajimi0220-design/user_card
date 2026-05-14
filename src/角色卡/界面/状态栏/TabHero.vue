<template>
  <div class="hero-tab">

    <!-- 状态 -->
    <section class="card">
      <div class="card-title"><i class="fas fa-heart-pulse" /> 状态</div>
      <div class="info-row">
        <div class="info-chip">
          <i class="fas fa-location-dot" style="color:#60a5fa" />
          <span class="info-text">{{ locationName }}</span>
        </div>
        <div class="info-chip">
          <i class="fas fa-face-smile" style="color:#f472b6" />
          <span class="info-text">{{ d.主角.当前情绪 }}</span>
        </div>
      </div>
      <div class="stat-grid">
        <div class="stat-bar-item" v-for="s in statusBars" :key="s.label">
          <div class="stat-bar-head">
            <i :class="s.icon" :style="{ color: s.color }" />
            <span class="stat-bar-label">{{ s.label }}</span>
            <span class="stat-bar-val" :style="{ color: s.color }">{{ s.val }}</span>
          </div>
          <div class="stat-bar-track">
            <div class="stat-bar-fill" :style="{ width: s.val + '%', background: `linear-gradient(90deg, ${s.color}88, ${s.color})` }" />
          </div>
        </div>
      </div>
    </section>

    <!-- 外观 -->
    <section class="card">
      <div class="card-title"><i class="fas fa-shirt" /> 外观</div>
      <div class="appear-grid">
        <div class="appear-item" v-for="a in appearItems" :key="a.label">
          <span class="appear-label">{{ a.label }}</span>
          <span class="appear-val">{{ a.val || '—' }}</span>
        </div>
        <div v-if="d.主角.CG外观.当前场景背景" class="appear-item appear-full">
          <span class="appear-label">场景</span>
          <span class="appear-val">{{ d.主角.CG外观.当前场景背景 }}</span>
        </div>
        <div v-if="d.主角.CG外观.特殊状态标注" class="appear-item appear-full appear-accent">
          <span class="appear-label">特殊</span>
          <span class="appear-val">{{ d.主角.CG外观.特殊状态标注 }}</span>
        </div>
      </div>
    </section>

    <!-- 职业 -->
    <section class="card">
      <div class="card-title"><i class="fas fa-briefcase" /> 职业</div>
      <div class="job-header">
        <div class="job-badge">Lv{{ d.主角.职业.职业等级 }}</div>
        <div class="job-info">
          <span class="job-name">{{ d.主角.职业.当前职业 }}</span>
          <span class="job-title">{{ d.主角.职业.职位称谓 }}</span>
        </div>
        <div class="job-status" :class="d.主角.职业.今日是否上班 ? 'on' : 'off'">
          <i :class="d.主角.职业.今日是否上班 ? 'fas fa-check' : 'fas fa-xmark'" />
          {{ d.主角.职业.今日是否上班 ? '已上班' : '未上班' }}
        </div>
      </div>
      <div class="stat-bar-item" style="margin-top:10px">
        <div class="stat-bar-head">
          <i class="fas fa-bolt" style="color:#f472b6" />
          <span class="stat-bar-label">经验</span>
          <span class="stat-bar-val" style="color:#f472b6">{{ d.主角.职业.职业经验 }}/500</span>
        </div>
        <div class="stat-bar-track">
          <div class="stat-bar-fill" :style="{ width: Math.min(100, d.主角.职业.职业经验 / 5) + '%', background: 'linear-gradient(90deg,#f472b688,#f472b6)' }" />
        </div>
      </div>
      <div class="stat-bar-item" style="margin-top:6px">
        <div class="stat-bar-head">
          <i class="fas fa-fire" style="color:#f87171" />
          <span class="stat-bar-label">压力</span>
          <span class="stat-bar-val" style="color:#f87171">{{ d.主角.职业.工作压力 }}</span>
        </div>
        <div class="stat-bar-track">
          <div class="stat-bar-fill" :style="{ width: d.主角.职业.工作压力 + '%', background: 'linear-gradient(90deg,#f8717188,#f87171)' }" />
        </div>
      </div>
      <div v-if="Object.keys(d.主角.职业.专业技能).length" class="skills">
        <div v-for="(v, k) in d.主角.职业.专业技能" :key="k" class="skill-row">
          <span class="skill-name">{{ k }}</span>
          <div class="skill-track"><div class="skill-fill" :style="{ width: v + '%', background: skillColor(v) }" /></div>
          <span class="skill-val">{{ v }}</span>
        </div>
      </div>
    </section>

    <!-- 经济 -->
    <section class="card">
      <div class="card-title"><i class="fas fa-coins" /> 经济</div>
      <div class="money-grid">
        <div class="money-card" v-for="m in moneyCards" :key="m.label" :style="{ '--mc': m.color }">
          <i :class="m.icon" class="money-icon" />
          <span class="money-label">{{ m.label }}</span>
          <span class="money-val">{{ m.val }}</span>
        </div>
      </div>
      <div class="cashflow">
        <div class="cf-item">
          <span class="cf-label">月收入</span>
          <span class="cf-val income">+¥{{ d.主角.经济.月固定收入.toLocaleString() }}</span>
        </div>
        <div class="cf-divider" />
        <div class="cf-item">
          <span class="cf-label">月支出</span>
          <span class="cf-val expense">-¥{{ d.主角.经济.月固定支出.toLocaleString() }}</span>
        </div>
        <div class="cf-divider" />
        <div class="cf-item">
          <span class="cf-label">本月净</span>
          <span class="cf-val" :class="balance >= 0 ? 'income' : 'expense'">
            {{ balance >= 0 ? '+' : '' }}¥{{ balance.toLocaleString() }}
          </span>
        </div>
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

const locationName = computed(() => {
  const id = d.value.主角.当前地点ID;
  return (d.value as any)._城市地图?.地点列表?.[id]?.名称 ?? id;
});

const statusBars = computed(() => [
  { label: '精神', val: d.value.主角.精神状态, color: '#a78bfa', icon: 'fas fa-brain' },
  { label: '精力', val: d.value.主角.精力,     color: '#34d399', icon: 'fas fa-battery-half' },
  { label: '饥饿', val: d.value.主角.饥饿度,   color: '#fb923c', icon: 'fas fa-bowl-rice' },
  { label: '社交', val: d.value.主角.社交需求, color: '#60a5fa', icon: 'fas fa-users' },
]);

const appearItems = computed(() => [
  { label: '服装', val: d.value.主角.CG外观.当前服装 },
  { label: '表情', val: d.value.主角.CG外观.当前表情 },
  { label: '姿态', val: d.value.主角.CG外观.当前姿态 },
]);

const moneyCards = computed(() => [
  { label: '现金', val: `¥${d.value.主角.经济.现金.toLocaleString()}`,         color: '#34d399', icon: 'fas fa-wallet' },
  { label: '存款', val: `¥${d.value.主角.经济.银行存款.toLocaleString()}`,     color: '#60a5fa', icon: 'fas fa-piggy-bank' },
  { label: '负债', val: `¥${d.value.主角.经济.负债.toLocaleString()}`,         color: '#f87171', icon: 'fas fa-credit-card' },
  { label: '信用', val: d.value.主角.经济.信用等级,                            color: '#fbbf24', icon: 'fas fa-shield-halved' },
]);
</script>

<style lang="scss" scoped>
.hero-tab { display: flex; flex-direction: column; gap: 10px; }

.card {
  background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 16px;
  padding: 14px 16px;
}
.card-title {
  font-size: 11px; font-weight: 700; color: #c084fc;
  letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 12px;
  i { margin-right: 6px; }
}

/* ── info chips ── */
.info-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.info-chip {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px; padding: 5px 12px;
  i { font-size: 12px; }
}
.info-text { font-size: 12px; font-weight: 600; color: #f0eaff; }

/* ── stat bars ── */
.stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.stat-bar-item { display: flex; flex-direction: column; gap: 5px; }
.stat-bar-head { display: flex; align-items: center; gap: 5px; }
.stat-bar-head i { font-size: 11px; width: 14px; text-align: center; }
.stat-bar-label { font-size: 11px; color: #9d8fb0; flex: 1; }
.stat-bar-val { font-size: 12px; font-weight: 700; min-width: 24px; text-align: right; }
.stat-bar-track {
  height: 6px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden;
}
.stat-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s cubic-bezier(.4,0,.2,1); }

/* ── appearance ── */
.appear-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
.appear-item {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px; padding: 7px 10px;
  display: flex; flex-direction: column; gap: 3px;
  &.appear-full { grid-column: 1 / -1; }
  &.appear-accent { border-color: rgba(244,114,182,0.35); background: rgba(244,114,182,0.07); }
  &.appear-accent .appear-val { color: #f472b6; font-weight: 600; }
}
.appear-label { font-size: 9px; color: #6b5f80; letter-spacing: 0.5px; text-transform: uppercase; }
.appear-val { font-size: 12px; color: #e8e0f0; line-height: 1.4; }

/* ── job ── */
.job-header { display: flex; align-items: center; gap: 10px; }
.job-badge {
  width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800; color: #fff;
  box-shadow: 0 4px 12px rgba(167,139,250,0.4);
}
.job-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.job-name { font-size: 14px; font-weight: 700; color: #f0eaff; }
.job-title { font-size: 11px; color: #7c6f96; }
.job-status {
  font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px;
  display: flex; align-items: center; gap: 4px;
  &.on { background: rgba(52,211,153,0.15); color: #34d399; border: 1px solid rgba(52,211,153,0.3); }
  &.off { background: rgba(248,113,113,0.12); color: #f87171; border: 1px solid rgba(248,113,113,0.25); }
}

/* ── skills ── */
.skills { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
.skill-row { display: flex; align-items: center; gap: 8px; }
.skill-name { font-size: 11px; color: #9d8fb0; min-width: 32px; }
.skill-track { flex: 1; height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; }
.skill-fill { height: 100%; border-radius: 2px; transition: width 0.5s; }
.skill-val { font-size: 11px; color: #c4b8d8; min-width: 22px; text-align: right; }

/* ── money ── */
.money-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 10px; }
.money-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid color-mix(in srgb, var(--mc) 25%, transparent);
  border-radius: 12px; padding: 10px 12px;
  display: flex; flex-direction: column; gap: 4px;
}
.money-icon { font-size: 14px; color: var(--mc); }
.money-label { font-size: 9px; color: #7c6f96; letter-spacing: 0.5px; text-transform: uppercase; }
.money-val { font-size: 14px; font-weight: 700; color: #f0eaff; }

.cashflow {
  display: flex; align-items: center;
  background: rgba(255,255,255,0.04); border-radius: 10px; padding: 8px 12px;
}
.cf-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; }
.cf-label { font-size: 9px; color: #6b5f80; letter-spacing: 0.4px; }
.cf-val { font-size: 13px; font-weight: 700; }
.cf-divider { width: 1px; height: 28px; background: rgba(255,255,255,0.08); }
.income { color: #34d399; }
.expense { color: #f87171; }
</style>
