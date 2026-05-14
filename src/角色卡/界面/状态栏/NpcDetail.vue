<template>
  <div class="detail-root" :style="detailBgStyle">
    <div class="detail-header" :style="{ background: `linear-gradient(135deg, ${cfg.accent}22, transparent)`, borderBottom: `1px solid ${cfg.accent}33` }">
      <button class="back-btn" @click="emit('back')"><i class="fas fa-chevron-left" /></button>
      <div class="header-info">
        <span class="detail-name" :style="{ color: cfg.nameColor }">{{ cfg.name }}</span>
        <span class="detail-title">{{ cfg.title }}</span>
      </div>
    </div>

    <div class="affection-bar">
      <div class="aff-row">
        <span class="aff-lv" :style="{ color: cfg.accent }">Lv{{ npc.好感度等级 }}</span>
        <span class="aff-attitude">{{ npc.当前态度 }}</span>
        <span class="aff-exp">{{ npc.好感度经验 }} / {{ nextThreshold }} exp</span>
      </div>
      <div class="aff-track">
        <div class="aff-fill" :style="{ width: affPct + '%', background: `linear-gradient(90deg, ${cfg.accent}88, ${cfg.accent})` }" />
      </div>
      <div class="aff-meta">
        <span><i class="fas fa-shield-alt" /> {{ npc.信任度 }}</span>
        <span><i class="fas fa-link" /> {{ npc.关系阶段 }}</span>
        <span><i class="fas fa-smile" /> {{ npc.当前情绪 }}</span>
      </div>
    </div>

    <div class="sections">
      <section class="sec" :style="{ borderColor: cfg.accent + '44' }">
        <div class="sec-title" :style="{ color: cfg.accent }"><i class="fas fa-eye" /> 当前状态</div>
        <div class="cg-grid">
          <cg-item label="服装" :val="npc.CG外观?.当前服装" />
          <cg-item label="表情" :val="npc.CG外观?.当前表情" />
          <cg-item label="姿态" :val="npc.CG外观?.当前姿态" />
          <cg-item label="场景" :val="npc.CG外观?.当前场景背景" />
          <cg-item v-if="npc.CG外观?.特殊状态标注" label="特殊" :val="npc.CG外观?.特殊状态标注" highlight />
        </div>
      </section>

      <section v-if="npc.好感度等级 >= 2" class="sec" :style="{ borderColor: cfg.accent + '44' }">
        <div class="sec-title" :style="{ color: cfg.accent }"><i class="fas fa-brain" /> 内心OS</div>
        <div class="os-grid">
          <os-item label="真实想法" :val="npc.内心OS?.对主角的真实想法" />
          <os-item label="最在意" :val="npc.内心OS?.当前最在意的事" />
          <os-item label="不说出口" :val="npc.内心OS?.不会说出口的话" />
          <os-item label="此刻欲望" :val="npc.内心OS?.此刻的欲望" />
        </div>
      </section>
      <section v-else class="sec locked">
        <div class="sec-title gray"><i class="fas fa-lock" /> 内心OS <span class="lock-hint">好感度 Lv2 解锁</span></div>
      </section>

      <section class="sec" :style="{ borderColor: cfg.accent + '44' }">
        <div class="sec-title" :style="{ color: cfg.accent }"><i class="fas fa-book-open" /> 背景档案</div>
        <div class="bg-public">
          <div class="bg-label">公开信息</div>
          <div class="bg-text">{{ npc.背景档案?.公开档案 }}</div>
        </div>
        <div v-for="chap in CHAPTERS" :key="chap.key" class="bg-chapter">
          <template v-if="npc.背景档案?.[chap.key]?.已解锁">
            <div class="chap-title unlocked" :style="{ color: cfg.accent }">
              <i class="fas fa-unlock-alt" /> {{ npc.背景档案[chap.key].章节主题 }}
            </div>
            <div class="chap-text">{{ npc.背景档案[chap.key].详细内容 }}</div>
          </template>
          <template v-else>
            <div class="chap-title locked">
              <i class="fas fa-lock" /> {{ chap.label }}
              <span class="lock-hint">{{ npc.背景档案?.[chap.key]?.解锁条件描述 }}</span>
            </div>
          </template>
        </div>
      </section>

      <section class="sec nsfw-sec">
        <div class="sec-title nsfw-title"><i class="fas fa-fire" /> 亲密数据</div>
        <div class="nsfw-grid">
          <nsfw-bar label="身体敏感" :val="npc.NSFW?.身体敏感度" color="#f43f5e" />
          <nsfw-bar label="乳头敏感" :val="npc.NSFW?.乳头敏感度" color="#fb7185" />
          <nsfw-bar label="阴蒂敏感" :val="npc.NSFW?.阴蒂敏感度" color="#f472b6" />
          <nsfw-bar label="欲求程度" :val="npc.NSFW?.当前欲求程度" color="#e879f9" />
          <nsfw-bar label="湿润程度" :val="npc.NSFW?.当前湿润程度" color="#c084fc" />
          <nsfw-bar label="情欲温度" :val="npc.NSFW?.当前情欲温度" color="#a78bfa" />
        </div>
        <div class="nsfw-flags">
          <flag-tag label="处女" :val="npc.NSFW?.处女状态" />
          <flag-tag label="初吻给主角" :val="npc.NSFW?.初吻是否给主角" />
          <flag-tag label="初夜给主角" :val="npc.NSFW?.初夜是否给主角" />
          <span class="nsfw-count">与主角 {{ npc.NSFW?.与主角已发生关系次数 ?? 0 }} 次</span>
        </div>
        <div class="nsfw-text-row"><div class="nsfw-label">身体状态</div><div class="nsfw-val">{{ npc.NSFW?.当前身体状态 || '正常' }}</div></div>
        <div v-if="npc.NSFW?.欲求触发原因" class="nsfw-text-row"><div class="nsfw-label">诱因</div><div class="nsfw-val">{{ npc.NSFW.欲求触发原因 }}</div></div>
        <div class="nsfw-text-row"><div class="nsfw-label">公开癖好</div><div class="nsfw-val small">{{ npc.NSFW?.公开癖好 }}</div></div>
        <div v-if="npc.NSFW?.是否已暴露最隐秘性癖" class="nsfw-text-row revealed">
          <div class="nsfw-label">最隐秘性癖</div><div class="nsfw-val small">{{ npc.NSFW?.最隐秘性癖 }}</div>
        </div>
        <div v-else class="nsfw-text-row"><div class="nsfw-label">最隐秘性癖</div><div class="nsfw-val gray"><i class="fas fa-lock" /> 尚未暴露</div></div>
        <div v-if="Object.keys(npc.NSFW?.经历记录 ?? {}).length" class="nsfw-records">
          <div class="nsfw-label">经历记录</div>
          <div v-for="(v, k) in npc.NSFW?.经历记录" :key="k" class="record-row">
            <span class="record-key">{{ k }}</span><span class="record-val">{{ v }}</span>
          </div>
        </div>
      </section>

      <section class="sec" :style="{ borderColor: cfg.accent + '44' }">
        <div class="sec-title" :style="{ color: cfg.accent }"><i class="fas fa-tags" /> 印象 & 记忆</div>
        <div class="tags">
          <span v-for="(v, k) in npc.对主角的印象标签" :key="k" class="tag" :class="{ neg: !v }"
            :style="v ? { background: cfg.accent + '22', color: cfg.accent, border: `1px solid ${cfg.accent}44` } : {}">
            {{ k }}
          </span>
        </div>
        <div v-if="Object.keys(npc.重要共同记忆 ?? {}).length" class="memories">
          <div v-for="(v, k) in npc.重要共同记忆" :key="k" class="memory-row">
            <span class="memory-key">{{ k }}</span><span class="memory-val">{{ v }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h } from 'vue';
import type { z } from 'zod/v4';
import type { Schema } from '../../schema';
import type { NpcConfig } from './TabNpc.vue';

const props = defineProps<{ npcKey: string; d: z.infer<typeof Schema>; config: NpcConfig }>();
const emit = defineEmits<{ (e: 'back'): void }>();

const cfg = computed(() => props.config);
const npc = computed(() => (props.d as any)[props.npcKey] ?? {});

const THRESHOLDS = [0, 20, 50, 90, 140, 200, 270, 350, 440, 540, Infinity];
const nextThreshold = computed(() => THRESHOLDS[(npc.value.好感度等级 ?? 1)] ?? 540);
const prevThreshold = computed(() => THRESHOLDS[(npc.value.好感度等级 ?? 1) - 1] ?? 0);
const affPct = computed(() => {
  const exp = npc.value.好感度经验 ?? 0;
  const prev = prevThreshold.value;
  const next = nextThreshold.value === Infinity ? prev + 100 : nextThreshold.value;
  return Math.min(100, ((exp - prev) / (next - prev)) * 100);
});

const CHAPTERS = [
  { key: '秘密_家庭背景', label: '家庭背景' },
  { key: '秘密_过往经历', label: '过往经历' },
  { key: '秘密_内心伤痛', label: '内心伤痛' },
  { key: '秘密_真实目的', label: '真实目的' },
  { key: '秘密_最深禁忌', label: '最深禁忌' },
];

const detailBgStyle = computed(() => cfg.value.detailBg
  ? { backgroundImage: `url(${cfg.value.detailBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  : { background: cfg.value.gradient }
);

const cgItem = defineComponent({
  props: { label: String, val: String, highlight: Boolean },
  setup(p) {
    return () => h('div', { class: ['cg-item', p.highlight && 'cg-hl'] }, [
      h('span', { class: 'ci-label' }, p.label),
      h('span', { class: 'ci-val' }, p.val || '—'),
    ]);
  },
});
const osItem = defineComponent({
  props: { label: String, val: String },
  setup(p) {
    return () => h('div', { class: 'os-item' }, [
      h('span', { class: 'os-label' }, p.label),
      h('span', { class: 'os-val' }, p.val || '…'),
    ]);
  },
});
const nsfwBar = defineComponent({
  props: { label: String, val: Number, color: String },
  setup(p) {
    return () => h('div', { class: 'nsfw-bar-row' }, [
      h('span', { class: 'nb-label' }, p.label),
      h('div', { class: 'nb-track' }, [h('div', { class: 'nb-fill', style: { width: (p.val ?? 0) + '%', background: p.color } })]),
      h('span', { class: 'nb-val' }, String(p.val ?? 0)),
    ]);
  },
});
const flagTag = defineComponent({
  props: { label: String, val: Boolean },
  setup(p) {
    return () => h('span', { class: ['flag', p.val ? 'flag-on' : 'flag-off'] }, p.label);
  },
});
</script>

<style lang="scss" scoped>
.detail-root { border-radius: 14px; overflow: hidden; }

.detail-header {
  display: flex; align-items: center; gap: 10px; padding: 11px 13px;
}
.back-btn {
  background: rgba(255,255,255,0.08); border: none; border-radius: 50%;
  width: 30px; height: 30px; cursor: pointer; font-size: 12px; color: #9d8fb0;
  flex-shrink: 0;
}
.header-info { display: flex; flex-direction: column; gap: 1px; }
.detail-name { font-size: 16px; font-weight: 700; }
.detail-title { font-size: 10px; color: #6b5f80; }

.affection-bar { padding: 10px 13px; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05); }
.aff-row { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
.aff-lv { font-size: 15px; font-weight: 800; }
.aff-attitude { font-size: 12px; color: #9d8fb0; flex: 1; }
.aff-exp { font-size: 10px; color: #4a3f60; }
.aff-track { height: 4px; background: rgba(255,255,255,0.07); border-radius: 2px; overflow: hidden; margin-bottom: 5px; }
.aff-fill { height: 100%; border-radius: 2px; transition: width 0.5s; }
.aff-meta { display: flex; gap: 12px; font-size: 10px; color: #6b5f80; i { margin-right: 3px; } }

.sections { padding: 8px; display: flex; flex-direction: column; gap: 7px; }

.sec {
  background: rgba(255,255,255,0.03);
  border-radius: 12px; border-left: 2px solid;
  padding: 10px 11px;
  &.locked { opacity: 0.5; }
  &.nsfw-sec { border-color: #f43f5e55; }
}
.sec-title {
  font-size: 11px; font-weight: 700; margin-bottom: 8px; letter-spacing: 0.5px;
  i { margin-right: 5px; }
  &.gray { color: #4a3f60; }
  &.nsfw-title { color: #f43f5e; }
}
.lock-hint { font-size: 10px; color: #4a3f60; font-weight: 400; margin-left: 6px; }

.cg-grid { display: flex; flex-direction: column; gap: 4px; }
.cg-item { display: flex; gap: 8px; font-size: 12px; }
.ci-label { color: #4a3f60; min-width: 28px; flex-shrink: 0; }
.ci-val { color: #c4b8d8; }
.cg-hl .ci-val { color: #f472b6; font-weight: 600; }

.os-grid { display: flex; flex-direction: column; gap: 5px; }
.os-item { display: flex; gap: 8px; font-size: 12px; }
.os-label { color: #4a3f60; min-width: 44px; flex-shrink: 0; }
.os-val { color: #c4b8d8; font-style: italic; line-height: 1.5; }

.bg-public { margin-bottom: 8px; }
.bg-label { font-size: 10px; color: #4a3f60; margin-bottom: 3px; }
.bg-text { font-size: 12px; color: #9d8fb0; line-height: 1.6; }
.bg-chapter { margin-top: 6px; }
.chap-title { font-size: 11px; font-weight: 600; margin-bottom: 2px; &.locked { color: #4a3f60; } i { margin-right: 4px; } }
.chap-text { font-size: 12px; color: #9d8fb0; line-height: 1.6; }

.nsfw-grid { display: flex; flex-direction: column; gap: 5px; margin-bottom: 8px; }
.nsfw-bar-row { display: flex; align-items: center; gap: 6px; }
.nb-label { font-size: 10px; color: #6b5f80; min-width: 44px; }
.nb-track { flex: 1; height: 4px; background: rgba(255,255,255,0.07); border-radius: 2px; overflow: hidden; }
.nb-fill { height: 100%; border-radius: 2px; transition: width 0.4s; }
.nb-val { font-size: 10px; color: #4a3f60; min-width: 20px; text-align: right; }

.nsfw-flags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 7px; align-items: center; }
.flag { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
.flag-on { background: rgba(244,63,94,0.2); color: #f43f5e; border: 1px solid rgba(244,63,94,0.3); }
.flag-off { background: rgba(255,255,255,0.05); color: #4a3f60; }
.nsfw-count { font-size: 10px; color: #4a3f60; margin-left: auto; }

.nsfw-text-row { display: flex; gap: 8px; margin-top: 5px; font-size: 12px; }
.nsfw-label { color: #4a3f60; min-width: 52px; flex-shrink: 0; }
.nsfw-val { color: #9d8fb0; &.small { font-size: 11px; line-height: 1.5; } &.gray { color: #4a3f60; } }
.revealed .nsfw-val { color: #f43f5e; }
.nsfw-records { margin-top: 7px; }
.record-row { display: flex; gap: 6px; font-size: 11px; margin-top: 3px; }
.record-key { color: #f472b6; font-weight: 600; min-width: 60px; flex-shrink: 0; }
.record-val { color: #9d8fb0; }

.tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 7px; }
.tag { font-size: 10px; padding: 2px 9px; border-radius: 10px; font-weight: 600; &.neg { background: rgba(239,68,68,0.15); color: #f87171; } }
.memories { display: flex; flex-direction: column; gap: 4px; }
.memory-row { display: flex; gap: 8px; font-size: 11px; }
.memory-key { font-weight: 600; color: #6b5f80; min-width: 60px; flex-shrink: 0; }
.memory-val { color: #4a3f60; font-style: italic; }
</style>
