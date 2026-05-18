<template>
  <div class="detail-root" :style="detailBgStyle">
    <!-- 顶部返回栏 -->
    <div class="detail-header" :style="{ background: cfg.gradient }">
      <button class="back-btn" @click="emit('back')"><i class="fas fa-chevron-left" /></button>
      <span class="detail-name" :style="{ color: cfg.nameColor }">{{ cfg.name }}</span>
      <span class="detail-title">{{ cfg.title }}</span>
    </div>

    <!-- 好感度进度 -->
    <div class="affection-bar" :style="{ background: cfg.gradient }">
      <div class="aff-row">
        <span class="aff-lv" :style="{ color: cfg.accent }">Lv{{ npc.好感度等级 }}</span>
        <span class="aff-attitude">{{ npc.当前态度 }}</span>
        <span class="aff-exp">{{ npc.好感度经验 }} / {{ nextThreshold }} exp</span>
      </div>
      <div class="aff-track">
        <div class="aff-fill" :style="{ width: affPct + '%', background: cfg.accent }" />
      </div>
      <div class="aff-meta">
        <span>信任度 {{ npc.信任度 }}</span>
        <span>关系 {{ npc.关系阶段 }}</span>
        <span>情绪 {{ npc.当前情绪 }}</span>
      </div>
    </div>

    <!-- 分区内容 -->
    <div class="sections">

      <!-- CG 动态（初始可见） -->
      <section class="sec" :style="{ borderColor: cfg.accent + '66' }">
        <div class="sec-title" :style="{ color: cfg.accent }">🎨 当前状态</div>
        <div class="cg-grid">
          <cg-item label="服装" :val="npc.CG外观?.当前服装" />
          <cg-item label="表情" :val="npc.CG外观?.当前表情" />
          <cg-item label="姿态" :val="npc.CG外观?.当前姿态" />
          <cg-item label="场景" :val="npc.CG外观?.当前场景背景" />
          <cg-item v-if="npc.CG外观?.特殊状态标注" label="特殊" :val="npc.CG外观?.特殊状态标注" highlight />
        </div>
      </section>

      <!-- 内心OS（好感度等级≥2可见） -->
      <section v-if="npc.好感度等级 >= 2" class="sec" :style="{ borderColor: cfg.accent + '66' }">
        <div class="sec-title" :style="{ color: cfg.accent }">💭 内心OS</div>
        <div class="os-grid">
          <os-item label="真实想法" :val="npc.内心OS?.对主角的真实想法" />
          <os-item label="最在意" :val="npc.内心OS?.当前最在意的事" />
          <os-item label="不说出口" :val="npc.内心OS?.不会说出口的话" />
          <os-item label="此刻欲望" :val="npc.内心OS?.此刻的欲望" />
        </div>
      </section>
      <section v-else class="sec locked" :style="{ borderColor: '#ccc' }">
        <div class="sec-title gray">💭 内心OS <span class="lock-hint">好感度 Lv2 解锁</span></div>
      </section>

      <!-- 背景档案（分阶段解锁） -->
      <section class="sec" :style="{ borderColor: cfg.accent + '66' }">
        <div class="sec-title" :style="{ color: cfg.accent }">📖 背景档案</div>
        <div class="bg-public">
          <div class="bg-label">公开信息</div>
          <div class="bg-text">{{ npc.背景档案?.公开档案 }}</div>
        </div>
        <div v-for="chap in CHAPTERS" :key="chap.key" class="bg-chapter">
          <template v-if="npc.背景档案?.[chap.key]?.已解锁">
            <div class="chap-title unlocked" :style="{ color: cfg.accent }">
              🔓 {{ npc.背景档案[chap.key].章节主题 }}
            </div>
            <div class="chap-text">{{ npc.背景档案[chap.key].详细内容 }}</div>
          </template>
          <template v-else>
            <div class="chap-title locked">
              🔒 {{ chap.label }}
              <span class="lock-hint">{{ npc.背景档案?.[chap.key]?.解锁条件描述 }}</span>
            </div>
          </template>
        </div>
      </section>

      <!-- NSFW（常驻可见） -->
      <section class="sec nsfw-sec" :style="{ borderColor: '#f43f5e66' }">
        <div class="sec-title nsfw-title">🔞 亲密数据</div>
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
        <div class="nsfw-text-row">
          <div class="nsfw-label">身体状态</div>
          <div class="nsfw-val">{{ npc.NSFW?.当前身体状态 || '正常' }}</div>
        </div>
        <div v-if="npc.NSFW?.欲求触发原因" class="nsfw-text-row">
          <div class="nsfw-label">诱因</div>
          <div class="nsfw-val">{{ npc.NSFW.欲求触发原因 }}</div>
        </div>
        <div class="nsfw-text-row">
          <div class="nsfw-label">公开癖好</div>
          <div class="nsfw-val small">{{ npc.NSFW?.公开癖好 }}</div>
        </div>
        <div v-if="npc.NSFW?.是否已暴露最隐秘性癖" class="nsfw-text-row revealed">
          <div class="nsfw-label">最隐秘性癖</div>
          <div class="nsfw-val small">{{ npc.NSFW?.最隐秘性癖 }}</div>
        </div>
        <div v-else class="nsfw-text-row locked-row">
          <div class="nsfw-label">最隐秘性癖</div>
          <div class="nsfw-val gray">🔒 尚未暴露</div>
        </div>
        <!-- 经历记录 -->
        <div v-if="Object.keys(npc.NSFW?.经历记录 ?? {}).length" class="nsfw-records">
          <div class="nsfw-label">经历记录</div>
          <div v-for="(v, k) in npc.NSFW?.经历记录" :key="k" class="record-row">
            <span class="record-key">{{ k }}</span>
            <span class="record-val">{{ v }}</span>
          </div>
        </div>
      </section>

      <!-- 印象标签 & 共同记忆 -->
      <section class="sec" :style="{ borderColor: cfg.accent + '66' }">
        <div class="sec-title" :style="{ color: cfg.accent }">🏷 印象 & 记忆</div>
        <div class="tags">
          <span v-for="(v, k) in npc.对主角的印象标签" :key="k"
            class="tag" :class="{ neg: !v }"
            :style="v ? { background: cfg.accent + '22', color: cfg.accent } : {}">
            {{ k }}
          </span>
        </div>
        <div v-if="Object.keys(npc.重要共同记忆 ?? {}).length" class="memories">
          <div v-for="(v, k) in npc.重要共同记忆" :key="k" class="memory-row">
            <span class="memory-key">{{ k }}</span>
            <span class="memory-val">{{ v }}</span>
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

const props = defineProps<{
  npcKey: string;
  d: z.infer<typeof Schema>;
  config: NpcConfig;
}>();
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

// 详细界面背景图床接口：来自 NpcConfig.detailBg
const detailBgStyle = computed(() => cfg.value.detailBg
  ? { backgroundImage: `url(${cfg.value.detailBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  : { background: cfg.value.gradient }
);

// ── 子组件 ────────────────────────────────────────────────────
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
      h('div', { class: 'nb-track' }, [
        h('div', { class: 'nb-fill', style: { width: (p.val ?? 0) + '%', background: p.color } }),
      ]),
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
.detail-root {
  border-radius: 12px; overflow: hidden;
  min-height: 200px;
}

.detail-header {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px;
}
.back-btn {
  background: rgba(255,255,255,0.6); border: none; border-radius: 50%;
  width: 28px; height: 28px; cursor: pointer; font-size: 12px; color: #555;
}
.detail-name { font-size: 16px; font-weight: 700; }
.detail-title { font-size: 11px; color: #888; margin-left: 4px; }

.affection-bar {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.aff-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.aff-lv { font-size: 14px; font-weight: 700; }
.aff-attitude { font-size: 12px; color: #555; flex: 1; }
.aff-exp { font-size: 10px; color: #aaa; }
.aff-track { height: 4px; background: rgba(0,0,0,0.08); border-radius: 2px; overflow: hidden; margin-bottom: 4px; }
.aff-fill { height: 100%; border-radius: 2px; transition: width 0.4s; }
.aff-meta { display: flex; gap: 10px; font-size: 10px; color: #888; }

.sections { padding: 8px; display: flex; flex-direction: column; gap: 8px; }

.sec {
  background: rgba(255,255,255,0.75);
  border-radius: 10px; border-left: 3px solid;
  padding: 10px;
  &.locked { opacity: 0.6; }
  &.nsfw-sec { border-color: #f43f5e66; }
}
.sec-title {
  font-size: 12px; font-weight: 700; margin-bottom: 8px;
  &.gray { color: #aaa; }
  &.nsfw-title { color: #f43f5e; }
}
.lock-hint { font-size: 10px; color: #bbb; font-weight: 400; margin-left: 6px; }

.cg-grid { display: flex; flex-direction: column; gap: 3px; }
.cg-item { display: flex; gap: 6px; font-size: 12px; }
.ci-label { color: #aaa; min-width: 28px; flex-shrink: 0; }
.ci-val { color: #444; }
.cg-hl .ci-val { color: #f43f5e; font-weight: 600; }

.os-grid { display: flex; flex-direction: column; gap: 4px; }
.os-item { display: flex; gap: 6px; font-size: 12px; }
.os-label { color: #aaa; min-width: 44px; flex-shrink: 0; }
.os-val { color: #333; font-style: italic; }

.bg-public { margin-bottom: 8px; }
.bg-label { font-size: 10px; color: #aaa; margin-bottom: 2px; }
.bg-text { font-size: 12px; color: #444; line-height: 1.6; }
.bg-chapter { margin-top: 6px; }
.chap-title {
  font-size: 11px; font-weight: 600; margin-bottom: 2px;
  &.locked { color: #bbb; }
  &.unlocked {}
}
.chap-text { font-size: 12px; color: #555; line-height: 1.6; }

.nsfw-grid { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
.nsfw-bar-row { display: flex; align-items: center; gap: 6px; }
.nb-label { font-size: 10px; color: #888; min-width: 44px; }
.nb-track { flex: 1; height: 5px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
.nb-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
.nb-val { font-size: 10px; color: #aaa; min-width: 20px; text-align: right; }

.nsfw-flags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; align-items: center; }
.flag { font-size: 10px; padding: 2px 7px; border-radius: 10px; font-weight: 600; }
.flag-on { background: #fce7f3; color: #db2777; }
.flag-off { background: #f3f4f6; color: #9ca3af; }
.nsfw-count { font-size: 10px; color: #aaa; margin-left: auto; }

.nsfw-text-row { display: flex; gap: 6px; margin-top: 5px; font-size: 12px; }
.nsfw-label { color: #aaa; min-width: 52px; flex-shrink: 0; }
.nsfw-val { color: #444; &.small { font-size: 11px; line-height: 1.5; } &.gray { color: #bbb; } }
.revealed .nsfw-val { color: #f43f5e; }
.locked-row .nsfw-val { color: #bbb; }

.nsfw-records { margin-top: 6px; }
.record-row { display: flex; gap: 6px; font-size: 11px; margin-top: 3px; }
.record-key { color: #f472b6; font-weight: 600; min-width: 60px; flex-shrink: 0; }
.record-val { color: #555; }

.tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
.tag { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 600; &.neg { background: #fee2e2; color: #ef4444; } }

.memories { display: flex; flex-direction: column; gap: 3px; }
.memory-row { display: flex; gap: 6px; font-size: 11px; }
.memory-key { font-weight: 600; color: #666; min-width: 60px; flex-shrink: 0; }
.memory-val { color: #888; font-style: italic; }
</style>
