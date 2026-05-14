<template>
  <div class="npc-tab">
    <!-- 名片列表 -->
    <template v-if="!selected">
      <div v-for="npc in NPC_LIST" :key="npc.key" class="npc-card" :style="cardStyle(npc)" @click="selected = npc.key">
        <div class="card-bg" :style="npc.cardBg ? { backgroundImage: `url(${npc.cardBg})` } : {}" />
        <div class="card-body">
          <div class="card-avatar" :style="{ background: npc.accent + '33', border: `2px solid ${npc.accent}66` }">
            <span class="lv-badge" :style="{ color: npc.accent }">Lv{{ npcData(npc.key).好感度等级 }}</span>
          </div>
          <div class="card-info">
            <div class="card-name" :style="{ color: npc.nameColor }">{{ npc.name }}</div>
            <div class="card-sub">{{ npc.title }}</div>
            <!-- 模块行 -->
            <div class="card-chips">
              <span class="chip relation-chip" :style="{ background: npc.accent + '22', color: npc.accent, border: `1px solid ${npc.accent}44` }">
                <i class="fas fa-heart" /> {{ npcData(npc.key).关系阶段 }}
              </span>
              <span class="chip mood-chip">
                <i class="fas fa-face-smile" /> {{ npcData(npc.key).当前情绪 || '平静' }}
              </span>
              <span class="chip loc-chip">
                <i class="fas fa-map-marker-alt" /> {{ locationName(npc.key) }}
              </span>
            </div>
            <!-- 好感度进度条 -->
            <div class="aff-row">
              <span class="aff-label" :style="{ color: npc.accent }">好感度</span>
              <div class="attitude-bar">
                <div class="attitude-fill" :style="{ width: affPct(npc.key) + '%', background: `linear-gradient(90deg, ${npc.accent}66, ${npc.accent})` }" />
              </div>
              <span class="aff-val">{{ npcData(npc.key).好感度经验 }}</span>
            </div>
            <!-- 信任度 -->
            <div class="trust-row">
              <span class="trust-label">信任</span>
              <div class="trust-bar">
                <div class="trust-fill" :style="{ width: (npcData(npc.key).信任度 ?? 0) + '%', background: npc.accent + '99' }" />
              </div>
              <span class="trust-val">{{ npcData(npc.key).信任度 ?? 0 }}</span>
            </div>
          </div>
          <!-- 手机按钮 -->
          <div class="phone-btns" @click.stop>
            <div class="btn-wrap">
              <button
                class="phone-btn call"
                :style="{ background: npcData(npc.key).手机?.已获得号码 ? npc.accent : '#2a2040' }"
                :title="npcData(npc.key).手机?.已获得号码 ? '拨打电话' : '尚未获得号码'"
                @click="openCall(npc)"
              >
                <i class="fas fa-phone" />
              </button>
              <span v-if="callBadge[npc.key]" class="badge">{{ callBadge[npc.key] }}</span>
            </div>
            <div class="btn-wrap">
              <button
                class="phone-btn sms"
                :style="{ background: npcData(npc.key).手机?.已获得号码 ? npc.accent + 'bb' : '#3a3050' }"
                :title="npcData(npc.key).手机?.已获得号码 ? '发送短信' : '尚未获得号码'"
                @click="openSms(npc)"
              >
                <i class="fas fa-comment-dots" />
              </button>
              <span v-if="smsBadge[npc.key]" class="badge">{{ smsBadge[npc.key] }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 详细界面 -->
    <NpcDetail v-else-if="selected" :npc-key="selected" :d="d" :config="NPC_LIST.find(n => n.key === selected)!" @back="selected = null" />

    <!-- 电话弹窗 -->
    <div v-if="phoneModal" class="modal-overlay" @click.self="phoneModal = null">
        <div class="call-modal" :style="{ '--accent': phoneModal.accent }">
          <div class="call-header">
            <div class="call-avatar" :style="{ background: phoneModal.accent + '33', border: `2px solid ${phoneModal.accent}` }">
              <i class="fas fa-user" :style="{ color: phoneModal.accent }" />
            </div>
            <div class="call-name" :style="{ color: phoneModal.nameColor }">{{ phoneModal.name }}</div>
            <div class="call-sub">{{ phoneModal.title }}</div>
            <div v-if="!npcData(phoneModal.key).手机?.已获得号码" class="call-locked">
              <i class="fas fa-lock" /> 尚未获得联系方式
            </div>
          </div>
          <div class="call-options">
            <button v-for="opt in CALL_OPTIONS" :key="opt.label" class="call-opt" @click="sendCallOption(opt.text(phoneModal.name))">
              <i :class="opt.icon" />
              <span>{{ opt.label }}</span>
              <i class="fas fa-arrow-right opt-arrow" />
            </button>
          </div>
          <button class="call-close" @click="phoneModal = null"><i class="fas fa-times" /></button>
        </div>
      </div>

    <!-- 短信弹窗 -->
    <div v-if="smsModal" class="modal-overlay" @click.self="smsModal = null">
        <div class="sms-phone" :style="{ '--accent': smsModal.accent }">
          <!-- 手机顶部 -->
          <div class="phone-top">
            <div class="phone-notch" />
            <div class="phone-status">
              <span>{{ d.世界.当前时间段 }}</span>
              <span><i class="fas fa-signal" /> <i class="fas fa-battery-three-quarters" /></span>
            </div>
          </div>
          <!-- 聊天头部 -->
          <div class="sms-header" :style="{ background: `linear-gradient(135deg, ${smsModal.accent}33, ${smsModal.accent}11)` }">
            <button class="sms-back" @click="smsModal = null"><i class="fas fa-chevron-left" /></button>
            <div class="sms-avatar" :style="{ background: smsModal.accent + '44', border: `2px solid ${smsModal.accent}` }">
              <i class="fas fa-user" :style="{ color: smsModal.accent }" />
            </div>
            <div>
              <div class="sms-name" :style="{ color: smsModal.nameColor }">{{ smsModal.name }}</div>
              <div class="sms-status">{{ npcData(smsModal.key).手机?.已获得号码 ? npcData(smsModal.key).手机.号码 : '未知号码' }}</div>
            </div>
          </div>
          <!-- 消息区：历史记录 -->
          <div class="sms-messages" ref="smsScrollEl">
            <template v-if="smsHistory[smsModal.key]?.length">
              <div
                v-for="(msg, i) in smsHistory[smsModal.key]"
                :key="i"
                :class="['sms-bubble', msg.dir]"
                :style="msg.dir === 'received'
                  ? { background: smsModal.accent + '22', borderColor: smsModal.accent + '44' }
                  : { background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' }"
              >
                <span>{{ msg.content }}</span>
              </div>
            </template>
            <div v-else class="sms-empty">暂无消息</div>
          </div>
          <!-- 快捷短信 -->
          <div class="sms-quick">
            <button v-for="q in SMS_QUICK" :key="q.label" class="quick-btn" :style="{ borderColor: smsModal.accent + '55', color: smsModal.accent }" @click="smsInput = q.text(smsModal.name)">
              {{ q.label }}
            </button>
          </div>
          <!-- 输入框 -->
          <div class="sms-input-row">
            <input v-model="smsInput" class="sms-input" placeholder="输入短信内容…" @keydown.enter="sendSms" />
            <button class="sms-send" :style="{ background: smsModal.accent }" @click="sendSms">
              <i class="fas fa-paper-plane" />
            </button>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import type { z } from 'zod/v4';
import type { Schema } from '../../schema';
import NpcDetail from './NpcDetail.vue';

const props = defineProps<{ d: z.infer<typeof Schema> }>();
const d = computed(() => props.d);

const selected = ref<string | null>(null);
const phoneModal = ref<NpcConfig | null>(null);
const smsModal = ref<NpcConfig | null>(null);
const smsInput = ref('');

// 未读徽标
const callBadge = ref<Record<string, number>>({});
const smsBadge = ref<Record<string, number>>({});

// 短信历史从 store 读取（持久化）
const smsHistory = computed(() => (d.value as any)._短信历史 ?? {});

export interface NpcConfig {
  key: '苏梦璃' | '柳清梦' | '林雨涵' | '墨瑾萱';
  name: string;
  title: string;
  accent: string;
  nameColor: string;
  gradient: string;
  cardBg: string;
  detailBg: string;
}

const NPC_LIST: NpcConfig[] = [
  { key: '苏梦璃', name: '苏梦璃', title: '网络主播 · 梦璃', accent: '#f472b6', nameColor: '#f9a8d4', gradient: 'linear-gradient(135deg, #1a0d1a 0%, #2d1030 100%)', cardBg: '', detailBg: '' },
  { key: '柳清梦', name: '柳清梦', title: '清梦阁 · 古董鉴定师', accent: '#34d399', nameColor: '#6ee7b7', gradient: 'linear-gradient(135deg, #0d1a14 0%, #0f2d1e 100%)', cardBg: '', detailBg: '' },
  { key: '林雨涵', name: '林雨涵', title: '黑客 · 雨夜', accent: '#818cf8', nameColor: '#a5b4fc', gradient: 'linear-gradient(135deg, #0d0f1a 0%, #131530 100%)', cardBg: '', detailBg: '' },
  { key: '墨瑾萱', name: '墨瑾萱', title: '墨家二小姐 · 大四', accent: '#fbbf24', nameColor: '#fde68a', gradient: 'linear-gradient(135deg, #1a1500 0%, #2d2200 100%)', cardBg: '', detailBg: '' },
];

const THRESHOLDS = [0, 20, 50, 90, 140, 200, 270, 350, 440, 540, Infinity];
const npcData = (key: string) => (d.value as any)[key] ?? {};
const cardStyle = (npc: NpcConfig) => npc.cardBg ? {} : { background: npc.gradient };
const affPct = (key: string) => {
  const npc = npcData(key);
  const lv = npc.好感度等级 ?? 1;
  const exp = npc.好感度经验 ?? 0;
  const prev = THRESHOLDS[lv - 1] ?? 0;
  const next = THRESHOLDS[lv] === Infinity ? prev + 100 : THRESHOLDS[lv] ?? 100;
  return Math.min(100, ((exp - prev) / (next - prev)) * 100);
};
const locationName = (key: string) => {
  const id = npcData(key).当前地点ID;
  return (d.value as any)._城市地图?.地点列表?.[id]?.名称 ?? id ?? '未知';
};

const CALL_OPTIONS = [
  { label: '约会', icon: 'fas fa-heart', text: (n: string) => `我给${n}打电话，邀请她出来约会。` },
  { label: '问安', icon: 'fas fa-sun', text: (n: string) => `我给${n}打电话，关心地问她今天过得怎么样。` },
  { label: '邀请见面', icon: 'fas fa-map-marker-alt', text: (n: string) => `我给${n}打电话，邀请她来我这里。` },
  { label: '倾诉心事', icon: 'fas fa-comment-alt', text: (n: string) => `我给${n}打电话，想和她聊聊最近的烦恼。` },
  { label: '表白', icon: 'fas fa-star', text: (n: string) => `我鼓起勇气给${n}打电话，想向她表达我的心意。` },
  { label: '深夜通话', icon: 'fas fa-moon', text: (n: string) => `深夜，我给${n}打电话，只是想听听她的声音。` },
];

const SMS_QUICK = [
  { label: '在吗？', text: (n: string) => `（发短信给${n}）在吗？` },
  { label: '想你了', text: (n: string) => `（发短信给${n}）最近有点想你。` },
  { label: '今晚有空吗', text: (n: string) => `（发短信给${n}）今晚有空吗，想见你。` },
  { label: '晚安', text: (n: string) => `（发短信给${n}）晚安。` },
];

function openCall(npc: NpcConfig) {
  callBadge.value[npc.key] = 0;
  if (npcData(npc.key).手机?.已获得号码) phoneModal.value = npc;
}
function openSms(npc: NpcConfig) {
  if (npcData(npc.key).手机?.已获得号码) {
    smsBadge.value[npc.key] = 0;
    smsInput.value = '';
    smsModal.value = npc;
  }
}
async function sendSms() {
  if (!smsInput.value.trim() || !smsModal.value) return;
  const npcName = smsModal.value.name;
  const npcKey = smsModal.value.key;
  const text = `（给${npcName}发短信）${smsInput.value.trim()}`;
  // 持久化发送记录
  const vars = Mvu.getMvuData({ type: 'chat' });
  const hist = _.get(vars, `stat_data._短信历史.${npcKey}`, []);
  hist.push({ dir: 'sent', content: smsInput.value.trim(), ts: Date.now() });
  _.set(vars, `stat_data._短信历史.${npcKey}`, hist);
  await Mvu.replaceMvuData(vars, { type: 'chat' });
  smsInput.value = '';
  smsModal.value = null;
  await generate({ user_input: text, should_stream: true, max_chat_history: 0 });
}

async function sendCallOption(text: string) {
  phoneModal.value = null;
  await generate({ user_input: text, should_stream: true, max_chat_history: 0 });
}

// 监听消息队列，累加红点（历史已由脚本持久化到 _短信历史）
watch(() => (d.value as any)._消息队列, (queue: any[]) => {
  if (!queue?.length) return;
  for (const item of queue) {
    const npc = NPC_LIST.find(n => n.key === item.from);
    if (!npc) continue;
    if (item.type === 'sms') {
      smsBadge.value[npc.key] = (smsBadge.value[npc.key] ?? 0) + 1;
      if (smsModal.value?.key === npc.key) smsBadge.value[npc.key] = 0;
    } else if (item.type === 'call') {
      callBadge.value[npc.key] = (callBadge.value[npc.key] ?? 0) + 1;
      phoneModal.value = npc;
    }
  }
}, { deep: true });

</script>

<style lang="scss" scoped>
.npc-tab { display: flex; flex-direction: column; gap: 10px; position: relative; }

.npc-card {
  border-radius: 18px; overflow: hidden;
  box-shadow: 0 6px 24px rgba(0,0,0,0.5);
  cursor: pointer; position: relative;
  transition: transform 0.15s, box-shadow 0.15s;
  border: 1px solid rgba(255,255,255,0.07);
  &:active { transform: scale(0.98); }
  &:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.6); transform: translateY(-1px); }
}
.card-bg { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: 0.15; }
.card-body { position: relative; display: flex; align-items: flex-start; gap: 12px; padding: 16px; }
.card-avatar {
  width: 58px; height: 58px; border-radius: 16px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.lv-badge { font-size: 13px; font-weight: 800; letter-spacing: -0.5px; }
.card-info { flex: 1; min-width: 0; }
.card-name { font-size: 16px; font-weight: 700; margin-bottom: 2px; }
.card-sub { font-size: 11px; color: #6b5f80; margin-bottom: 8px; }

.card-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 9px; }
.chip {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 20px;
  i { font-size: 9px; }
}
.mood-chip { background: rgba(255,255,255,0.06); color: #9d8fb0; border: 1px solid rgba(255,255,255,0.08); }
.loc-chip { background: rgba(255,255,255,0.04); color: #6b5f80; border: 1px solid rgba(255,255,255,0.06); }

.aff-row, .trust-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.aff-label, .trust-label { font-size: 10px; font-weight: 600; min-width: 28px; flex-shrink: 0; }
.trust-label { color: #6b5f80; }
.attitude-bar, .trust-bar { flex: 1; height: 5px; background: rgba(255,255,255,0.07); border-radius: 3px; overflow: hidden; }
.trust-bar { height: 3px; }
.attitude-fill, .trust-fill { height: 100%; border-radius: 3px; transition: width 0.5s; }
.aff-val, .trust-val { font-size: 10px; color: #4a3f60; min-width: 24px; text-align: right; }

.phone-btns { display: flex; flex-direction: column; gap: 7px; flex-shrink: 0; padding-top: 2px; }
.btn-wrap { position: relative; display: inline-flex; }
.badge {
  position: absolute; top: -5px; right: -5px;
  min-width: 16px; height: 16px; border-radius: 8px;
  background: #ef4444; color: #fff; font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; padding: 0 3px;
  pointer-events: none;
}
.phone-btn {
  width: 36px; height: 36px; border-radius: 12px; border: none;
  color: #fff; font-size: 14px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.15s, opacity 0.15s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  &:active { transform: scale(0.88); }
}

/* ── 弹窗通用 ── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 99999;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
}

/* ── 电话弹窗 ── */
.call-modal {
  width: 300px; border-radius: 24px;
  background: linear-gradient(160deg, #1a1028, #0f0c1a);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
  overflow: hidden; position: relative;
}
.call-header {
  display: flex; flex-direction: column; align-items: center;
  padding: 28px 20px 16px; gap: 4px;
  background: linear-gradient(180deg, var(--accent, #a78bfa)11, transparent);
}
.call-avatar {
  width: 64px; height: 64px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; margin-bottom: 8px;
}
.call-name { font-size: 18px; font-weight: 700; }
.call-sub { font-size: 11px; color: #6b5f80; }
.call-locked { font-size: 11px; color: #f87171; margin-top: 4px; i { margin-right: 4px; } }
.call-options { padding: 8px 16px 16px; display: flex; flex-direction: column; gap: 4px; }
.call-opt {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-radius: 12px; border: none;
  background: rgba(255,255,255,0.05); color: #c4b8d8;
  font-size: 13px; cursor: pointer; text-align: left;
  transition: background 0.15s;
  i:first-child { color: var(--accent, #a78bfa); width: 16px; }
  span { flex: 1; }
  &:hover { background: rgba(255,255,255,0.09); }
}
.opt-arrow { font-size: 10px; color: #4a3f60; }
.call-close {
  position: absolute; top: 12px; right: 12px;
  width: 28px; height: 28px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.08); color: #6b5f80; cursor: pointer; font-size: 12px;
}

/* ── 短信手机UI ── */
.sms-phone {
  width: 320px; border-radius: 36px;
  background: #0a0a0f;
  border: 2px solid rgba(255,255,255,0.12);
  box-shadow: 0 24px 80px rgba(0,0,0,0.8);
  overflow: hidden; display: flex; flex-direction: column;
  height: 520px;
}
.phone-top {
  background: #0a0a0f; padding: 8px 16px 0;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.phone-notch {
  width: 80px; height: 6px; background: #1a1a2e; border-radius: 3px;
}
.phone-status {
  width: 100%; display: flex; justify-content: space-between;
  font-size: 10px; color: #4a4060; padding: 2px 4px;
  i { margin: 0 2px; }
}
.sms-header {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.06);
}
.sms-back { background: none; border: none; color: var(--accent, #a78bfa); font-size: 16px; cursor: pointer; padding: 4px; }
.sms-avatar {
  width: 38px; height: 38px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;
}
.sms-name { font-size: 14px; font-weight: 700; }
.sms-status { font-size: 10px; color: #4a4060; }
.sms-messages {
  flex: 1; padding: 14px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;
  min-height: 80px;
  &::-webkit-scrollbar { width: 2px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
}
.sms-bubble {
  max-width: 80%; padding: 9px 13px; border-radius: 18px; font-size: 12px; line-height: 1.5;
  border: 1px solid;
  &.received { align-self: flex-start; color: #c4b8d8; border-radius: 4px 18px 18px 18px; }
  &.sent { align-self: flex-end; color: #e8e0f0; border-radius: 18px 4px 18px 18px; }
}
.sms-empty { font-size: 11px; color: #4a4060; text-align: center; padding: 20px 0; }
.sms-quick {
  display: flex; flex-wrap: wrap; gap: 5px; padding: 8px 12px;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.quick-btn {
  font-size: 11px; padding: 4px 10px; border-radius: 14px;
  background: transparent; border: 1px solid; cursor: pointer;
  transition: background 0.15s;
  &:hover { background: rgba(255,255,255,0.06); }
}
.sms-input-row {
  display: flex; gap: 8px; padding: 10px 12px 16px;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.sms-input {
  flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px; padding: 8px 14px; color: #e8e0f0; font-size: 13px; outline: none;
  &::placeholder { color: #4a4060; }
  &:focus { border-color: var(--accent, #a78bfa); }
}
.sms-send {
  width: 38px; height: 38px; border-radius: 50%; border: none;
  color: #fff; font-size: 13px; cursor: pointer; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  transition: opacity 0.15s;
  &:active { opacity: 0.7; }
}
</style>
