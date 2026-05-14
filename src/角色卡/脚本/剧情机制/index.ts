import { Schema } from '../../schema';

// ══════════════════════════════════════════════════════════════
// 剧情机制脚本
//
// 1. 好感度等级与态度自动同步
// 2. 背景章节解锁判断与注入
// 3. 滚动总结：小总结≥20→汇总大总结；大总结≥5→汇总历史档案
// ══════════════════════════════════════════════════════════════

const NPC列表 = ['苏梦璃', '柳清梦', '林雨涵', '墨瑾萱'] as const;

const 好感度等级阈值 = [0, 20, 50, 90, 140, 200, 270, 350, 440, 540];
const 态度列表 = [
  '陌生疏离', '礼貌客气', '普通友好', '有些在意',
  '明显亲近', '心存好感', '暗生情愫', '深陷其中', '全心依恋', '矢志不渝',
];

const 章节顺序 = [
  '秘密_家庭背景', '秘密_过往经历', '秘密_内心伤痛', '秘密_真实目的', '秘密_最深禁忌',
] as const;

const 小总结阈值 = 20;
const 大总结阈值 = 5;

// ── 好感度等级与态度同步 ──────────────────────────────────────
function 同步好感度等级(npc_data: any) {
  const exp = _.get(npc_data, '好感度经验', 0);
  const lv = _.clamp(_.findLastIndex(好感度等级阈值, t => exp >= t) + 1, 1, 10);
  _.set(npc_data, '好感度等级', lv);
  _.set(npc_data, '当前态度', 态度列表[lv - 1]);
}

// ── 背景章节解锁判断 ──────────────────────────────────────────
function 应该解锁(章节key: string, npc_data: any): boolean {
  const 等级 = _.get(npc_data, '好感度等级', 1);
  const 信任 = _.get(npc_data, '信任度', 0);
  const 关系 = _.get(npc_data, '关系阶段', '陌生人');
  const 已暴露性癖 = _.get(npc_data, 'NSFW.是否已暴露最隐秘性癖', false);
  switch (章节key) {
    case '秘密_家庭背景': return 等级 >= 4;
    case '秘密_过往经历': return 等级 >= 5 && 信任 >= 55;
    case '秘密_内心伤痛': return 等级 >= 6 && 信任 >= 65;
    case '秘密_真实目的': return 等级 >= 8 && 信任 >= 80 && ['暧昧', '恋人', '挚爱'].includes(关系);
    case '秘密_最深禁忌': return 等级 >= 9 && 信任 >= 90 && 已暴露性癖;
    default: return false;
  }
}

function 处理章节解锁(npc_data: any) {
  for (const 章节key of 章节顺序) {
    if (_.get(npc_data, `背景档案.${章节key}.已解锁`, false)) continue;
    if (应该解锁(章节key, npc_data)) {
      _.set(npc_data, `背景档案.${章节key}.已解锁`, true);
      _.set(npc_data, `背景档案.${章节key}.本回合刚解锁`, true);
    }
  }
}

function 构建NPC状态注入(stat_data: any): string {
  const 主角坐标 = _.get(stat_data, '主角.坐标', { x: 15, y: 15 });
  const 地点列表 = _.get(stat_data, '_城市地图.地点列表', {});
  const 距离阈值 = 25;

  const 片段: string[] = [];

  for (const npc名 of NPC列表) {
    const npc = _.get(stat_data, npc名);
    if (!npc) continue;

    const 地点ID = _.get(npc, '当前地点ID', '');
    const npc坐标 = _.get(地点列表, `${地点ID}.坐标`, null);
    const 距离 = npc坐标
      ? Math.abs(主角坐标.x - npc坐标.x) + Math.abs(主角坐标.y - npc坐标.y)
      : 999;
    const 同场景 = 距离 <= 距离阈值;

    const 行: string[] = [`【${npc名} · 当前状态】`];
    行.push(`位置：${_.get(地点列表, `${地点ID}.名称`, 地点ID)} | 距主角：${距离 <= 999 ? 距离 + '格' : '未知'}`);
    行.push(`好感Lv${_.get(npc, '好感度等级', 1)} · ${_.get(npc, '当前态度', '')} · ${_.get(npc, '关系阶段', '')} · 信任${_.get(npc, '信任度', 0)}`);
    行.push(`情绪：${_.get(npc, '当前情绪', '平静')}`);

    if (同场景) {
      const os = _.get(npc, '内心OS');
      if (os) {
        行.push(`内心OS：真实想法="${_.get(os, '对主角的真实想法', '')}" | 欲望="${_.get(os, '此刻的欲望', '')}"`);
      }
      const cg = _.get(npc, 'CG外观');
      if (cg) {
        行.push(`外观：${_.get(cg, '当前服装', '')} · ${_.get(cg, '当前表情', '')} · ${_.get(cg, '当前姿态', '')}`);
      }
      const 档案 = _.get(npc, '背景档案', {});
      const 已解锁章节 = 章节顺序.filter(k => _.get(档案, `${k}.已解锁`, false));
      if (已解锁章节.length) {
        行.push(`已解锁背景：${已解锁章节.map(k => `[${k}] ${_.get(档案, `${k}.详细内容`, '').slice(0, 30)}…`).join(' / ')}`);
      }
      // NSFW：按该 NPC 自身的情欲温度判断是否注入
      const nsfw = _.get(npc, 'NSFW');
      if (nsfw && _.get(nsfw, '当前情欲温度', 0) > 0) {
        行.push(`NSFW：情欲${_.get(nsfw, '当前情欲温度', 0)} · 湿润${_.get(nsfw, '当前湿润程度', 0)} · 欲求${_.get(nsfw, '当前欲求程度', 0)} · 身体状态="${_.get(nsfw, '当前身体状态', '正常')}"`);
        if (_.get(nsfw, '是否已暴露最隐秘性癖', false)) {
          行.push(`隐秘性癖：${_.get(nsfw, '最隐秘性癖', '')}（触发：${_.get(nsfw, '最隐秘性癖触发条件', '')}）`);
        }
      }
    }

    片段.push(行.join('\n'));
  }

  if (!片段.length) return '';
  return ['【NPC 当前状态快照（仅供参考，禁止直接引用括号内元数据）】', ...片段].join('\n\n');
}

function 检测汇总信号(variables: Mvu.MvuData) {
  const 小总结数 = (_.get(variables, 'stat_data._总结系统.小总结', []) as any[]).length;
  const 大总结数 = (_.get(variables, 'stat_data._总结系统.大总结', []) as any[]).length;

  if (小总结数 >= 小总结阈值) {
    _.set(variables, 'stat_data._总结系统._汇总信号.需要汇总小总结', true);
  }
  if (大总结数 >= 大总结阈值) {
    _.set(variables, 'stat_data._总结系统._汇总信号.需要汇总大总结', true);
  }
}

function 构建汇总注入(stat_data: any): string | null {
  const 需要小 = _.get(stat_data, '_总结系统._汇总信号.需要汇总小总结', false);
  const 需要大 = _.get(stat_data, '_总结系统._汇总信号.需要汇总大总结', false);
  if (!需要小 && !需要大) return null;

  const 片段: string[] = [];

  if (需要小) {
    const 小总结 = _.get(stat_data, '_总结系统.小总结', []) as any[];
    const 条目列表 = [...小总结]
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(v => `[${v.key}] ${v.时间} @ ${v.地点} | ${v.事件} | ${v.情感进展}`)
      .join('\n');

    片段.push([
      '【汇总任务：小总结→大总结】',
      '以下是需要汇总的所有小总结：',
      条目列表,
      '',
      '你必须在本回合的 JSONPatch 中完成以下操作（不要生成正文剧情）：',
      '1. 用 insert + "-" 追加一条大总结到 _总结系统/大总结，内容包含：key/时间跨度/主线事件/各NPC关系进展/已解锁背景/重要转折',
      '2. 逐条 remove 上方列出的每一条小总结（按数组索引）',
      '3. 不要修改 _总结系统._汇总信号（由脚本清除）',
    ].join('\n'));
  }

  if (需要大) {
    const 大总结 = _.get(stat_data, '_总结系统.大总结', []) as any[];
    const 历史档案数 = (_.get(stat_data, '_总结系统.历史档案', []) as any[]).length;
    const 新key = `H_${String(历史档案数 + 1).padStart(3, '0')}`;
    const 条目列表 = [...大总结]
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(v => `[${v.key}] ${v.时间跨度} | ${v.主线事件} | 转折：${v.重要转折}`)
      .join('\n');

    片段.push([
      '【汇总任务：大总结→历史档案】',
      '以下是需要汇总的所有大总结：',
      条目列表,
      '',
      `你必须在本回合的 JSONPatch 中完成以下操作（不要生成正文剧情）：`,
      `1. 用 insert + "-" 追加一条历史档案到 _总结系统/历史档案，key 为 "${新key}"，内容包含：key/章节标题/时间跨度/故事梗概/关系里程碑/世界观变化`,
      '2. 逐条 remove 上方列出的每一条大总结（按数组索引）',
      '3. 不要修改 _总结系统._汇总信号（由脚本清除）',
    ].join('\n'));
  }

  return 片段.join('\n\n────────\n\n');
}

function 清理叙事正文(text: string) {
  return text
    .replace(/<sms\b[^>]*>[\s\S]*?<\/sms>/gi, '')
    .replace(/<call\b[^>]*\/>/gi, '')
    .replace(/<call\b[^>]*>[\s\S]*?<\/call>/gi, '')
    .replace(/<npc_scene\b[^>]*>[\s\S]*?<\/npc_scene>/gi, '')
    .replace(/<thinking\b[^>]*>[\s\S]*?(?:<\/thinking>|$)/gi, '')
    .replace(/<context\b[^>]*>[\s\S]*?(?:<\/context>|$)/gi, '')
    .replace(/<lenitxt\b[^>]*>[\s\S]*?(?:<\/lenitxt>|$)/gi, '')
    .replace(/<state\b[^>]*>[\s\S]*?(?:<\/state>|$)/gi, '')
    .replace(/<wine\b[^>]*>[\s\S]*?(?:<\/wine>|$)/gi, '')
    .trim();
}

function 提取叙事正文(raw: string) {
  const storyMatch = /<story\b[^>]*>([\s\S]*?)(?:<\/story>|$)/i.exec(raw);
  return 清理叙事正文(storyMatch ? storyMatch[1] : raw);
}

// ══════════════════════════════════════════════════════════════
// 主逻辑
// ══════════════════════════════════════════════════════════════
$(async () => {
  await waitGlobalInitialized('Mvu');

  // ── 变量更新结束：同步等级 + 解锁章节 + 检测汇总信号 ──────
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (variables: Mvu.MvuData) => {
    for (const npc名 of NPC列表) {
      const npc_data = _.get(variables, `stat_data.${npc名}`);
      if (!npc_data) continue;
      同步好感度等级(npc_data);
      处理章节解锁(npc_data);
    }
    检测汇总信号(variables);
  });

  // ── AI 生成前：注入背景解锁提示 + 汇总指令 ───────────────
  eventOn(tavern_events.GENERATION_AFTER_COMMANDS, async () => {
    const variables = Mvu.getMvuData({ type: 'message', message_id: 'latest' });
    const stat_data = _.get(variables, 'stat_data');
    if (!stat_data) return;

    const 注入片段: string[] = [];

    // NPC 状态快照注入（距离过滤 + NSFW 过滤）
    const npc状态 = 构建NPC状态注入(stat_data);
    if (npc状态) 注入片段.push(npc状态);

    // 背景解锁注入
    for (const npc名 of NPC列表) {
      const 档案 = _.get(stat_data, `${npc名}.背景档案`);
      if (!档案) continue;
      for (const 章节key of 章节顺序) {
        const 章节 = _.get(档案, 章节key);
        if (!章节?.本回合刚解锁) continue;
        注入片段.push([
          `【本回合背景解锁 · ${npc名}】`,
          `章节主题：${章节.章节主题}`,
          `背景内容：${章节.详细内容}`,
          `本回合任务：必须让 <user> 通过合理自然的方式获知此信息。`,
          `表达方式优先级：① 物件/场景暴露 ② 第三方无意提及 ③ ${npc名} 失言/情绪失控 ④ 主动倾诉（仅限高关系阶段）`,
          `禁止：直接平铺直叙；低关系阶段无理由坦白。`,
        ].join('\n'));
      }
    }

    // 汇总指令注入
    const 汇总内容 = 构建汇总注入(stat_data);
    if (汇总内容) 注入片段.push(汇总内容);

    // 输出格式要求注入（每次生成都注入）
    注入片段.push([
      '【输出格式要求 · 严格遵守】',
      '',
      '第一步：思维链（必须最先输出，用户不可见）',
      '<thinking>',
      '分析当前局势、NPC心理、剧情走向、数值变化预判。',
      '</thinking>',
      '',
      '第二步：状态摘要（用户不可见）',
      '<context>当前关键状态快照，供自身参考</context>',
      '',
      '第三步：正文（必须输出）',
      '<story>',
      '叙事正文，第三人称，描写场景/动作/对话。',
      '若本回合涉及NPC主动发短信，在story内追加：',
      '  <sms from="NPC名" dir="received">短信内容</sms>',
      '若本回合涉及NPC来电，在story内追加：',
      '  <call from="NPC名" action="incoming"/>',
      '若本回合有NPC在其他场景的独立活动，在story内追加：',
      '  <npc_scene from="NPC名">该NPC的独立活动描写</npc_scene>',
      '</story>',
      '',
      '第四步：摘要（用户不可见）',
      '<lenitxt>本回合50字内事件摘要</lenitxt>',
      '',
      '第五步：数值更新（有变化时必须输出，用户不可见）',
      '<state>{"NPC名":{"字段":"值"},"主角":{"字段":值}}</state>',
      '',
      '可选：小剧场/番外',
      '<wine>小剧场或番外内容（用户不可见，仅供参考）</wine>',
      '',
      '规则：',
      '- 严格按顺序输出，不得在标签外输出任何内容',
      '- thinking必须在最开始，闭合标签</thinking>必须单独换行',
      '- sms/call标签只能出现在story内部',
    ].join('\n'));

    if (注入片段.length === 0) return;

    injectPrompts([{
      id: 'character_card_mechanics',
      position: 'in_chat',
      depth: 0,
      role: 'system',
      content: 注入片段.join('\n\n────────\n\n'),
      should_scan: false,
    }], { once: true });
  });

  // ── AI 回复完成：解析标签 + 写消息队列 + 清除标记 ──────────
  eventOn(tavern_events.MESSAGE_RECEIVED, async (message_id: number) => {
    const chat = getChatMessages(message_id);
    const raw = chat[0]?.message ?? '';

    // 解析标签
    const queue: any[] = [];
    const smsRe = /<sms\s+from="([^"]+)"(?:\s+dir="([^"]+)")?>([\s\S]*?)<\/sms>/g;
    const callRe = /<call\s+from="([^"]+)"(?:\s+action="([^"]+)")?[^/]*\/>/g;
    const npcSceneRe = /<npc_scene\s+from="([^"]+)">([\s\S]*?)<\/npc_scene>/g;
    const storyRe = /<story\b[^>]*>([\s\S]*?)(?:<\/story>|$)/i;
    const stateRe = /<state>([\s\S]*?)<\/state>/;

    let m: RegExpExecArray | null;
    const storyMatch = storyRe.exec(raw);
    const storyContent = storyMatch ? storyMatch[1] : raw;

    while ((m = smsRe.exec(storyContent)) !== null)
      queue.push({ type: 'sms', from: m[1], dir: m[2] ?? 'received', content: m[3].trim() });
    while ((m = callRe.exec(storyContent)) !== null)
      queue.push({ type: 'call', from: m[1], dir: m[2] ?? 'received', content: '' });

    const npcScenes: { npc: string; text: string }[] = [];
    while ((m = npcSceneRe.exec(storyContent)) !== null)
      npcScenes.push({ npc: m[1], text: m[2].trim() });

    const stateMatch = stateRe.exec(raw);

    // 有标签时删除 AI 回复楼层（隐藏原始标签内容）
    if (storyMatch || queue.length > 0 || stateMatch || npcScenes.length > 0) {
      await deleteChatMessages([message_id], { refresh: 'none' });
    }

    // 读 chat 级别变量（不依赖特定楼层，iframe 始终可读）
    const variables = Mvu.getMvuData({ type: 'chat' });
    if (!_.has(variables, 'stat_data')) {
      _.set(variables, 'stat_data', Schema.parse({}));
    }
    const stat_data = _.get(variables, 'stat_data');

    let dirty = false;

    // 写消息队列 + 叙事内容
    if (queue.length > 0) {
      _.set(stat_data, '_消息队列', queue);
      dirty = true;
    }
    if (storyMatch) {
      const narrativeOnly = 提取叙事正文(raw);
      _.set(stat_data, '_叙事内容', narrativeOnly);
      const hist: any[] = _.get(stat_data, '_叙事历史', []);
      hist.push({ id: message_id, text: narrativeOnly, ts: Date.now() });
      if (hist.length > 50) hist.shift();
      _.set(stat_data, '_叙事历史', hist);
      dirty = true;
    }

    // 写 NPC 场景
    if (npcScenes.length > 0) {
      _.set(stat_data, '_叙事NPC场景', npcScenes);
      dirty = true;
    }

    // 持久化短信/电话到 _短信历史
    for (const item of queue) {
      if (item.type === 'sms') {
        const hist: any[] = _.get(stat_data, `_短信历史.${item.from}`, []);
        hist.push({ dir: item.dir, content: item.content, ts: Date.now() });
        _.set(stat_data, `_短信历史.${item.from}`, hist);
        dirty = true;
      }
    }

    // 合并 <state> 补丁
    if (stateMatch) {
      try {
        const patch = JSON.parse(stateMatch[1]);
        _.merge(stat_data, patch);
        dirty = true;
      } catch { /* ignore malformed JSON */ }
    }

    // 清除背景解锁标记
    for (const npc名 of NPC列表) {
      for (const 章节key of 章节顺序) {
        const path = `${npc名}.背景档案.${章节key}.本回合刚解锁`;
        if (_.get(stat_data, path) === true) { _.set(stat_data, path, false); dirty = true; }
      }
      const path2 = `${npc名}.NSFW.本回合刚暴露最隐秘性癖`;
      if (_.get(stat_data, path2) === true) { _.set(stat_data, path2, false); dirty = true; }
    }

    // 清除汇总信号（AI 已在本回合执行汇总）
    const 小信号path = '_总结系统._汇总信号.需要汇总小总结';
    const 大信号path = '_总结系统._汇总信号.需要汇总大总结';
    if (_.get(stat_data, 小信号path) === true) {
      const 剩余小总结数 = (_.get(stat_data, '_总结系统.小总结', []) as any[]).length;
      if (剩余小总结数 < 小总结阈值) { _.set(stat_data, 小信号path, false); dirty = true; }
    }
    if (_.get(stat_data, 大信号path) === true) {
      const 剩余大总结数 = (_.get(stat_data, '_总结系统.大总结', []) as any[]).length;
      if (剩余大总结数 < 大总结阈值) { _.set(stat_data, 大信号path, false); dirty = true; }
    }

    if (dirty) {
      await Mvu.replaceMvuData(variables, { type: 'chat' });
    }
  });
});
