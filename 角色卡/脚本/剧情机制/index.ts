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

// ── 滚动总结：检测阈值并设置汇总信号 ────────────────────────
function 检测汇总信号(variables: Mvu.MvuData) {
  const 小总结数 = Object.keys(_.get(variables, 'stat_data._总结系统.小总结', {})).length;
  const 大总结数 = Object.keys(_.get(variables, 'stat_data._总结系统.大总结', {})).length;

  if (小总结数 >= 小总结阈值) {
    _.set(variables, 'stat_data._总结系统._汇总信号.需要汇总小总结', true);
  }
  if (大总结数 >= 大总结阈值) {
    _.set(variables, 'stat_data._总结系统._汇总信号.需要汇总大总结', true);
  }
}

// ── 汇总信号注入提示词 ────────────────────────────────────────
function 构建汇总注入(stat_data: any): string | null {
  const 需要小 = _.get(stat_data, '_总结系统._汇总信号.需要汇总小总结', false);
  const 需要大 = _.get(stat_data, '_总结系统._汇总信号.需要汇总大总结', false);
  if (!需要小 && !需要大) return null;

  const 片段: string[] = [];

  if (需要小) {
    const 小总结 = _.get(stat_data, '_总结系统.小总结', {});
    const 条目列表 = Object.entries(小总结)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]: [string, any]) =>
        `[${k}] ${v.时间} @ ${v.地点} | ${v.事件} | ${v.情感进展}`,
      )
      .join('\n');

    片段.push([
      '【汇总任务：小总结→大总结】',
      '以下是需要汇总的所有小总结：',
      条目列表,
      '',
      '你必须在本回合的 JSONPatch 中完成以下操作（不要生成正文剧情）：',
      '1. insert 一条大总结，key 格式 "S_当前日期"，内容包含：时间跨度/主线事件/各NPC关系进展/已解锁背景/重要转折',
      '2. remove 上方列出的每一条小总结（逐条 remove）',
      '3. 不要修改 _总结系统._汇总信号（由脚本清除）',
    ].join('\n'));
  }

  if (需要大) {
    const 大总结 = _.get(stat_data, '_总结系统.大总结', {});
    const 历史档案数 = Object.keys(_.get(stat_data, '_总结系统.历史档案', {})).length;
    const 新key = `H_${String(历史档案数 + 1).padStart(3, '0')}`;
    const 条目列表 = Object.entries(大总结)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]: [string, any]) =>
        `[${k}] ${v.时间跨度} | ${v.主线事件} | 转折：${v.重要转折}`,
      )
      .join('\n');

    片段.push([
      '【汇总任务：大总结→历史档案】',
      '以下是需要汇总的所有大总结：',
      条目列表,
      '',
      `你必须在本回合的 JSONPatch 中完成以下操作（不要生成正文剧情）：`,
      `1. insert 一条历史档案，key 为 "${新key}"，内容包含：章节标题/时间跨度/故事梗概/关系里程碑/世界观变化`,
      '2. remove 上方列出的每一条大总结（逐条 remove）',
      '3. 不要修改 _总结系统._汇总信号（由脚本清除）',
    ].join('\n'));
  }

  return 片段.join('\n\n────────\n\n');
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

  // ── AI 回复完成：清除一次性标记 + 清除汇总信号 ───────────
  eventOn(tavern_events.MESSAGE_RECEIVED, async (message_id: number) => {
    const variables = Mvu.getMvuData({ type: 'message', message_id });
    const stat_data = _.get(variables, 'stat_data');
    if (!stat_data) return;

    let dirty = false;

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
      // 验证 AI 确实清空了小总结（条数已减少）才清除信号
      const 剩余小总结数 = Object.keys(_.get(stat_data, '_总结系统.小总结', {})).length;
      if (剩余小总结数 < 小总结阈值) { _.set(stat_data, 小信号path, false); dirty = true; }
    }
    if (_.get(stat_data, 大信号path) === true) {
      const 剩余大总结数 = Object.keys(_.get(stat_data, '_总结系统.大总结', {})).length;
      if (剩余大总结数 < 大总结阈值) { _.set(stat_data, 大信号path, false); dirty = true; }
    }

    if (dirty) {
      await Mvu.replaceMvuData(variables, { type: 'message', message_id });
    }
  });
});
