import React, { useEffect, useRef, useState } from 'react';
import { clamp, lerp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  crossEdges,
  frameworks,
  groupLabels,
  retentionCases,
  type FrameworkGroup,
} from './ecosystemData';

const C = {
  bg: '#f4f7f3',
  blue: '#285f8f',
  green: '#21865f',
  red: '#c44955',
  orange: '#d97706',
  purple: '#7256a8',
  teal: '#147d82',
  text: '#203047',
  muted: '#68778f',
  border: '#d7deea',
  paleBlue: '#eaf2f8',
  paleGreen: '#eaf5ef',
  paleRed: '#fbeced',
  white: '#ffffff',
};

type MetricMode = 'stars' | 'contributors' | 'prs';
type LensMode = 'awareness' | 'adoption' | 'retention';

interface UiState {
  mode: string;
  step: number;
  rate: number;
  newAccount: boolean;
  emptyProfile: boolean;
  selected: string;
  started: boolean;
  day: number;
  motionStart: number;
}

const now = () => (typeof performance === 'undefined' ? 0 : performance.now());

function initialState(moduleId: string): UiState {
  const defaults: Record<string, Partial<UiState>> = {
    '1.1': { mode: 'cycle', step: 0, started: true },
    '1.3': { mode: 'stars' },
    '2.1': { mode: 'ranking', started: true },
    '2.2': { rate: 20 },
    '3.2': { step: 0 },
    '4.1': { selected: 'langchain', started: false },
    '4.2': { started: false },
    '5.1': { selected: 'langchain', started: false },
    '6.1': { selected: 'autogpt', started: false, day: 30 },
  };
  return {
    mode: 'stars',
    step: 0,
    rate: 20,
    newAccount: false,
    emptyProfile: false,
    selected: 'langchain',
    started: false,
    day: 0,
    motionStart: now(),
    ...defaults[moduleId],
  };
}

function ease(value: number) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function progress(time: number, start: number, duration: number, delay = 0) {
  return ease((time - start - delay) / duration);
}

function clear(ctx: CanvasRenderingContext2D, w: number, h: number, fill = C.bg) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
}

function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  color = C.text,
  size = 14,
  weight = 500,
  align: CanvasTextAlign = 'left',
) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y);
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  fill: string,
  stroke = C.border,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawHero(ctx: CanvasRenderingContext2D, side: string, _time: number, w: number, h: number) {
  clear(ctx, w, h, C.white);
  if (side === 'old') {
    text(ctx, 'Star 快照', 20, 28, C.red, 15, 800);
    const rows = [
      { name: 'AutoGPT', value: 182405 },
      { name: 'LangFlow', value: 146655 },
      { name: 'LangChain', value: 130000 },
    ];
    rows.forEach((row, index) => {
      const y = 52 + index * 36;
      text(ctx, row.name, 20, y + 15, C.text, 12, 700);
      ctx.fillStyle = '#edf0f3';
      ctx.fillRect(104, y, 210, 18);
      ctx.fillStyle = index === 0 ? C.orange : C.blue;
      ctx.fillRect(104, y, 210 * (row.value / 182405), 18);
    });
    return;
  }

  text(ctx, '三层证据', 20, 28, C.green, 15, 800);
  const layers = [
    { title: '关注度', question: '谁被看见', color: C.orange },
    { title: '采用深度', question: '谁在建设', color: C.blue },
    { title: '留存', question: '谁会回来', color: C.green },
  ];
  layers.forEach((layer, index) => {
    const x = 20 + index * 110;
    roundedRect(ctx, x, 50, 98, 88, 6, C.white, layer.color);
    ctx.fillStyle = layer.color;
    ctx.fillRect(x, 50, 98, 5);
    text(ctx, layer.title, x + 49, 88, layer.color, 14, 800, 'center');
    text(ctx, layer.question, x + 49, 116, C.muted, 11, 600, 'center');
  });
}

function drawQuestion(ctx: CanvasRenderingContext2D, chapterId: string, time: number, w: number, h: number) {
  clear(ctx, w, h, C.white);
  const chapter = Number((chapterId.match(/\d+/) || ['1'])[0]);
  const copy: Record<number, { q: string; evidence: string; answer: string }> = {
    1: { q: '框架如何选择？', evidence: '发布时间与技术侧重', answer: '先明确评价问题' },
    2: { q: 'Star 第一最好？', evidence: '排名与增长峰值', answer: '热度不等于采用' },
    3: { q: '还要看什么？', evidence: '三层分析框架', answer: '分层回答' },
    4: { q: '高关注高参与？', evidence: '散点与密度重排', answer: '排名会反转' },
    5: { q: '谁连接生态？', evidence: '跨组织贡献网络', answer: '识别基础层' },
    6: { q: '谁会持续回来？', evidence: '360 天留存曲线', answer: '结合队列解释' },
  };
  const active = copy[chapter] || copy[1];
  const steps = [
    { label: '问题', value: active.q, color: C.orange },
    { label: '证据', value: active.evidence, color: C.blue },
    { label: '回答', value: active.answer, color: C.green },
  ];
  steps.forEach((step, index) => {
    const x = 10 + index * 78;
    const pulse = 0.65 + 0.35 * Math.sin(time / 600 - index * 0.8);
    roundedRect(ctx, x, 24, 68, 82, 6, C.white, step.color);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = step.color;
    ctx.fillRect(x, 24, 68, 5);
    ctx.globalAlpha = 1;
    text(ctx, step.label, x + 34, 54, step.color, 12, 800, 'center');
    const parts = step.value.length > 7 ? [step.value.slice(0, 7), step.value.slice(7)] : [step.value];
    parts.forEach((part, line) => text(ctx, part, x + 34, 79 + line * 17, C.text, 10, 600, 'center'));
  });
}

const timelineFrameworks = [...frameworks].sort((a, b) => a.created.localeCompare(b.created) || a.name.localeCompare(b.name));
const frameworkGroupOrder: FrameworkGroup[] = ['general', 'multi', 'visual', 'code', 'official'];
const frameworkGroupColors: Record<FrameworkGroup, string> = {
  general: C.blue,
  multi: C.orange,
  visual: C.green,
  code: C.purple,
  official: C.teal,
};

function dateValue(created: string) {
  const [year, month] = created.split('.').map(Number);
  return year + (month - 1) / 12;
}

function drawTimeline(ctx: CanvasRenderingContext2D, state: UiState, time: number, w: number, h: number) {
  clear(ctx, w, h, C.white);
  text(ctx, '开源 Agent 框架发布时间线', 28, 34, C.blue, 18, 800);
  text(ctx, '2022.10 至 2025.04 · 按论文表 1', w - 28, 34, C.muted, 12, 700, 'right');
  const elapsed = time - state.motionStart;
  const cycleIndex = Math.floor(Math.max(0, elapsed - 500) / 1300);
  const activeGroup = state.mode === 'cycle'
    ? cycleIndex >= 0 && cycleIndex < frameworkGroupOrder.length
      ? frameworkGroupOrder[cycleIndex]
      : null
    : frameworkGroupOrder.includes(state.mode as FrameworkGroup)
      ? state.mode as FrameworkGroup
      : null;
  const cycleFinished = state.mode === 'cycle' && cycleIndex >= frameworkGroupOrder.length;
  const status = activeGroup ? `当前标注：${groupLabels[activeGroup]}` : cycleFinished ? '五类框架已完成标注' : '按功能类型依次标注';
  text(ctx, status, 28, 62, activeGroup ? frameworkGroupColors[activeGroup] : C.green, 13, 800);
  const axisY = 210;
  const x0 = 54;
  const x1 = w - 40;
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0, axisY);
  ctx.lineTo(x1, axisY);
  ctx.stroke();
  [2023, 2024, 2025].forEach((year) => {
    const x = lerp(x0, x1, (year - 2022.75) / (2025.35 - 2022.75));
    ctx.strokeStyle = '#b9c4d2';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, axisY - 9);
    ctx.lineTo(x, axisY + 9);
    ctx.stroke();
    text(ctx, String(year), x, axisY + 28, C.muted, 11, 700, 'center');
  });

  timelineFrameworks.forEach((framework, index) => {
    const x = lerp(x0, x1, (dateValue(framework.created) - 2022.75) / (2025.35 - 2022.75));
    const lane = index % 3;
    const labelY = 94 + lane * 36;
    const color = frameworkGroupColors[framework.group];
    const emphasized = !activeGroup || framework.group === activeGroup;
    ctx.globalAlpha = emphasized ? 1 : 0.18;
    ctx.strokeStyle = color;
    ctx.lineWidth = activeGroup && framework.group === activeGroup ? 2.5 : 1;
    ctx.beginPath();
    ctx.moveTo(x, axisY);
    ctx.lineTo(x, labelY + 8);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, axisY, activeGroup && framework.group === activeGroup ? 10 : 7, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, framework.short, x, labelY, emphasized ? C.text : C.muted, 10, activeGroup && framework.group === activeGroup ? 900 : 700, 'center');
    ctx.globalAlpha = 1;
  });
  text(ctx, '15 / 15', w - 28, h - 18, C.green, 13, 800, 'right');
}

function drawMetricBlindspots(ctx: CanvasRenderingContext2D, state: UiState, w: number, h: number) {
  clear(ctx, w, h);
  const modes: { id: MetricMode; title: string; signal: string; missing: string[]; impact: string[]; color: string }[] = [
    { id: 'stars', title: 'GitHub stars', signal: '传播与可见度', missing: ['不能证明生产采用', '会受爆发事件影响'], impact: ['短期热度可能被误读为', '长期采用'], color: C.blue },
    { id: 'contributors', title: '贡献者总数', signal: '代码参与规模', missing: ['不区分一次修复', '与长期维护'], impact: ['人数相同不代表', '社区韧性相同'], color: C.blue },
    { id: 'prs', title: 'Pull requests', signal: '协作活动数量', missing: ['机器人与自动更新', '可能放大量级'], impact: ['高 PR 数可能并非', '更多人工协作'], color: C.blue },
  ];
  const margin = 18;
  const gap = 12;
  const cardY = 18;
  const cardHeight = h - cardY * 2;
  const cardWidth = (w - margin * 2 - gap * 2) / 3;
  modes.forEach((mode, index) => {
    const x = margin + index * (cardWidth + gap);
    const active = state.mode === mode.id;
    roundedRect(ctx, x, cardY, cardWidth, cardHeight, 7, active ? C.white : '#f4f7f5', active ? mode.color : C.border);
    ctx.fillStyle = active ? mode.color : C.border;
    ctx.fillRect(x, cardY, cardWidth, 6);
    text(ctx, mode.title, x + 18, 53, active ? mode.color : C.text, 16, 800);
    text(ctx, '能说明', x + 18, 83, C.muted, 11, 700);
    text(ctx, mode.signal, x + 18, 107, C.green, 14, 800);

    ctx.strokeStyle = '#dfe6ec';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 18, 124);
    ctx.lineTo(x + cardWidth - 18, 124);
    ctx.stroke();

    text(ctx, '会漏掉', x + 18, 146, C.muted, 11, 700);
    mode.missing.forEach((line, lineIndex) => text(ctx, line, x + 18, 169 + lineIndex * 20, C.red, 12, 700));

    ctx.beginPath();
    ctx.moveTo(x + 18, 209);
    ctx.lineTo(x + cardWidth - 18, 209);
    ctx.stroke();

    text(ctx, '影响 / 统计偏差', x + 18, 232, C.muted, 11, 700);
    mode.impact.forEach((line, lineIndex) => text(ctx, line, x + 18, 255 + lineIndex * 20, mode.color, 12, 800));
  });
}

const starRanking = [...frameworks].sort((a, b) => b.stars - a.stars).slice(0, 6);
const autoGptMonthlyStars = [
  5000, 111967, 9000, 5000, 3500, 2800, 2400, 2200, 2000, 1800,
  1800, 1700, 1600, 1500, 1400, 1300, 1900, 1400, 1300, 1200, 1100, 1600,
  1500, 1300, 1200, 2200, 1500, 1300, 1200, 1100, 1000, 900, 900, 900,
  1400, 1300, 1238,
];

function drawStarStory(ctx: CanvasRenderingContext2D, state: UiState, time: number, w: number, h: number) {
  clear(ctx, w, h, C.white);
  if (state.mode === 'ranking') {
    text(ctx, '最终 Star 快照', 30, 34, C.orange, 18, 800);
    text(ctx, '截至 2026-03-10', w - 30, 34, C.muted, 12, 700, 'right');
    starRanking.forEach((record, index) => {
      const y = 62 + index * 51;
      text(ctx, `${index + 1}`, 30, y + 17, C.muted, 12, 800);
      text(ctx, record.short, 58, y + 17, C.text, 13, 700);
      ctx.fillStyle = '#edf0f3';
      ctx.fillRect(160, y, 430, 22);
      ctx.fillStyle = index === 0 ? C.orange : C.blue;
      ctx.fillRect(160, y, 430 * (record.stars / starRanking[0].stars), 22);
      text(ctx, record.stars.toLocaleString(), 610, y + 17, index === 0 ? C.orange : C.blue, 12, 800);
    });
    roundedRect(ctx, 30, h - 62, w - 60, 36, 6, C.paleRed, C.red);
    text(ctx, '问题：AutoGPT 排名第一，是否就足以支持框架选择？', 48, h - 38, C.red, 14, 800);
    return;
  }

  text(ctx, 'AutoGPT 月度新增 Star', 30, 34, C.orange, 18, 800);
  text(ctx, '依据 Appendix A 月度变化趋势重绘', w - 30, 34, C.muted, 11, 700, 'right');
  const x0 = 72;
  const xEnd = 710;
  const yTop = 62;
  const y0 = 300;
  const maxMonthly = 120000;
  const yOf = (value: number) => lerp(y0, yTop, value / maxMonthly);
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, yTop);
  ctx.lineTo(x0, y0);
  ctx.lineTo(xEnd, y0);
  ctx.stroke();
  [0, 50000, 100000].forEach((value) => {
    const y = yOf(value);
    text(ctx, value === 0 ? '0' : `${value / 1000}k`, x0 - 12, y + 4, C.muted, 11, 600, 'right');
    if (value > 0) {
      ctx.strokeStyle = '#e7ebef';
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(xEnd, y);
      ctx.stroke();
    }
  });
  text(ctx, '2023.03', x0, y0 + 24, C.muted, 11, 700, 'center');
  const aprilX = lerp(x0, xEnd, 1 / (autoGptMonthlyStars.length - 1));
  text(ctx, '2024.01', lerp(x0, xEnd, 10 / 36), y0 + 24, C.muted, 11, 700, 'center');
  text(ctx, '2025.01', lerp(x0, xEnd, 22 / 36), y0 + 24, C.muted, 11, 700, 'center');
  text(ctx, '2026.03', xEnd, y0 + 24, C.muted, 11, 700, 'center');
  ctx.fillStyle = 'rgba(217,119,6,0.10)';
  ctx.fillRect(aprilX - 8, yTop, 24, y0 - yTop);

  const p = progress(time, state.motionStart, 3400);
  const lastFloat = p * (autoGptMonthlyStars.length - 1);
  const lastIndex = Math.floor(lastFloat);
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  autoGptMonthlyStars.forEach((value, index) => {
    if (index > lastIndex) return;
    const x = lerp(x0, xEnd, index / (autoGptMonthlyStars.length - 1));
    const y = yOf(value);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  if (lastIndex < autoGptMonthlyStars.length - 1) {
    const fromValue = autoGptMonthlyStars[lastIndex];
    const toValue = autoGptMonthlyStars[lastIndex + 1];
    const local = lastFloat - lastIndex;
    ctx.lineTo(
      lerp(x0, xEnd, (lastIndex + local) / (autoGptMonthlyStars.length - 1)),
      yOf(lerp(fromValue, toValue, local)),
    );
  }
  ctx.stroke();
  if (p > 0.04) {
    const aprilY = yOf(111967);
    ctx.fillStyle = C.orange;
    ctx.beginPath();
    ctx.arc(aprilX, aprilY, 7, 0, Math.PI * 2);
    ctx.fill();
    roundedRect(ctx, 118, 72, 270, 68, 6, C.white, C.orange);
    text(ctx, '2023 年 4 月', 136, 99, C.orange, 14, 800);
    text(ctx, '单月新增 111,967 Stars', 136, 124, C.text, 15, 800);
  }

  const reasonOpacity = progress(time, state.motionStart, 500, 3600);
  if (reasonOpacity > 0) {
    ctx.globalAlpha = reasonOpacity;
    roundedRect(ctx, 72, 350, 638, 92, 7, '#fff8eb', C.orange);
    ctx.fillStyle = C.orange;
    ctx.fillRect(72, 350, 6, 92);
    text(ctx, '作者对 2023 年 4 月爆发原因的推测', 94, 378, C.orange, 14, 800);
    text(ctx, '社交媒体广泛传播的演示宣称 AutoGPT 能自主研究、编写代码和规划旅行，', 94, 404, C.text, 12, 600);
    text(ctx, '由此推动病毒式关注。论文将其视为可能解释，而不是已验证的因果关系。', 94, 426, C.text, 12, 600);
    ctx.globalAlpha = 1;
  }
  text(ctx, '除 2023.04 外不标注附录未逐月列出的精确数值', w - 28, h - 12, C.muted, 10, 600, 'right');
}

function drawAnomalySignals(ctx: CanvasRenderingContext2D, _state: UiState, w: number, h: number) {
  clear(ctx, w, h, C.white);
  text(ctx, '异常信号有哪些？', 30, 34, C.blue, 18, 800);
  const signals = [
    { index: '01', title: '新账号', detail: 'Star 发生时，账号年龄 ≤ 7 天' },
    { index: '02', title: '空资料', detail: '姓名、简介等 5 项资料均为空' },
    { index: '03', title: '集中爆发', detail: '同一仓库每小时 Star ≥ 50' },
  ];
  signals.forEach((signal, index) => {
    const x = 30 + index * 238;
    const color = index === 0 ? C.blue : index === 1 ? C.purple : C.orange;
    roundedRect(ctx, x, 52, 220, 88, 7, C.white, color);
    text(ctx, signal.index, x + 16, 77, color, 11, 800);
    text(ctx, signal.title, x + 16, 102, C.text, 16, 800);
    text(ctx, signal.detail, x + 16, 126, C.muted, 11, 600);
  });
  roundedRect(ctx, 30, 154, w - 60, 38, 6, C.paleBlue, C.blue);
  text(ctx, '判定规则：同一个 Star 至少触发以上两项信号，才会被标记为异常。', 48, 179, C.blue, 13, 800);

  text(ctx, '论文报告的异常 Star 比例', 30, 224, C.text, 16, 800);
  text(ctx, 'Figure 5', w - 30, 224, C.muted, 11, 700, 'right');
  const bars = [
    { name: 'LangFlow', value: 27.7, color: C.purple },
    { name: 'AutoGPT', value: 16.8, color: C.orange },
    { name: 'OpenAI Agents', value: 5.9, color: C.blue },
  ];
  bars.forEach((bar, index) => {
    const y = 244 + index * 43;
    text(ctx, bar.name, 30, y + 17, C.text, 13, 700);
    ctx.fillStyle = C.white;
    ctx.fillRect(160, y, 440, 22);
    ctx.strokeStyle = C.border;
    ctx.strokeRect(160, y, 440, 22);
    ctx.fillStyle = bar.color;
    ctx.fillRect(160, y, (bar.value / 30) * 440, 22);
    text(ctx, `${bar.value}%`, 640, y + 17, bar.color, 13, 800);
  });
  roundedRect(ctx, 30, h - 55, w - 60, 36, 6, '#fff8eb', '#efbd61');
  text(ctx, '说明：异常信号不等于造假，也可能来自真实的病毒式传播或合法新用户。', 48, h - 32, C.muted, 11, 700);
}

function drawStudyScope(ctx: CanvasRenderingContext2D, w: number, h: number) {
  clear(ctx, w, h);
  const records = [
    { label: '研究对象', value: '15 个仓库', note: '2022.10 至 2025.04 创建' },
    { label: '关注与协作', value: '808,042 stars', note: '73,997 pull requests' },
    { label: '代码活动', value: '86,241 commits', note: '只保留 PR 与 commit 作者' },
    { label: '用户与贡献者', value: '987,330 profiles', note: '12,594 名人类代码贡献者' },
  ];
  records.forEach((record, index) => {
    const x = 30 + index * ((w - 60) / 4);
    const width = (w - 94) / 4;
    roundedRect(ctx, x, 66, width, 152, 7, C.white, C.blue);
    text(ctx, `${index + 1}`.padStart(2, '0'), x + 16, 94, C.blue, 12, 800);
    text(ctx, record.label, x + 16, 126, C.blue, 13, 700);
    text(ctx, record.value, x + 16, 160, C.text, 16, 800);
    const parts = record.note.split('，');
    parts.forEach((line, lineIndex) => text(ctx, line, x + 16, 190 + lineIndex * 18, C.muted, 11, 500));
  });
  text(ctx, '公开 GitHub 历史截至 2026 年 3 月', 30, h - 28, C.muted, 13, 700);
}

function drawLayerLens(ctx: CanvasRenderingContext2D, state: UiState, time: number, w: number, h: number) {
  clear(ctx, w, h, C.white);
  const lenses: { id: LensMode; title: string; question: string; evidence: string[]; color: string }[] = [
    { id: 'awareness', title: '关注度', question: '谁被看见？', evidence: ['Star 轨迹', '异常信号'], color: C.orange },
    { id: 'adoption', title: '采用深度', question: '谁在建设、连接？', evidence: ['贡献者与密度', '跨生态网络'], color: C.blue },
    { id: 'retention', title: '贡献者留存', question: '谁愿意回来？', evidence: ['早期贡献者', 'Day 30 至 360'], color: C.green },
  ];
  text(ctx, '从单一指标展开为三层证据', 30, 34, C.blue, 18, 800);
  lenses.forEach((lens, index) => {
    const x = 38 + index * 240;
    const p = state.started ? progress(time, state.motionStart, 480, index * 260) : index === 0 ? 1 : 0;
    const active = state.mode === lens.id;
    ctx.globalAlpha = 0.18 + 0.82 * p;
    roundedRect(ctx, x, 58 + (1 - p) * 18, 204, 158, 7, C.white, active ? lens.color : C.border);
    ctx.fillStyle = lens.color;
    ctx.fillRect(x, 58 + (1 - p) * 18, 204 * p, 6);
    text(ctx, lens.title, x + 18, 94, active ? lens.color : C.text, 17, 800);
    text(ctx, lens.question, x + 18, 128, C.text, 14, 700);
    lens.evidence.forEach((line, lineIndex) => text(ctx, line, x + 18, 164 + lineIndex * 23, C.muted, 12, 600));
    ctx.globalAlpha = 1;
  });
  text(ctx, '三个层次回答不同问题，不合成为单一总分', 38, h - 24, C.muted, 12, 700);
}

function logScale(value: number, min: number, max: number, start: number, end: number) {
  const ratio = (Math.log10(value) - Math.log10(min)) / (Math.log10(max) - Math.log10(min));
  return lerp(start, end, clamp(ratio, 0, 1));
}

function scatterPoint(stars: number, contributors: number) {
  return { x: logScale(stars, 3000, 250000, 92, 708), y: logScale(contributors, 50, 7000, 390, 58) };
}

type ScatterQuadrant = 'leaders' | 'momentum' | 'nascent' | 'quiet';

interface ScatterInterpretation {
  quadrant: ScatterQuadrant;
  text: string;
  inference: string;
}

const scatterQuadrants: Record<ScatterQuadrant, { label: string; color: string; summary: string }> = {
  leaders: { label: '市场领导者', color: C.blue, summary: '知名度与贡献者规模均高，但仍需继续比较贡献者转化效率。' },
  momentum: { label: '动能陷阱', color: C.red, summary: '知名度高于中位数，贡献者规模却偏低，关注尚未充分转化为建设参与。' },
  nascent: { label: '新兴进入者', color: C.muted, summary: '知名度与贡献者规模仍处早期，需要继续观察社区参与能否增长。' },
  quiet: { label: '低调耕耘者', color: C.green, summary: '知名度低于中位数，但已形成相对更深的贡献者参与。' },
};

const scatterInterpretations: Record<string, ScatterInterpretation> = {
  langchain: {
    quadrant: 'leaders',
    text: 'LangChain 位于“市场领导者”象限的核心：它同时拥有数据集中最大的贡献者基础和很高的 Star 数量，关注度与社区参与度都处于领先位置。',
    inference: '这可能说明 LangChain 已将广泛知名度转化为大规模代码共建，形成了较深的开源采用基础。',
  },
  autogpt: {
    quadrant: 'leaders',
    text: 'AutoGPT 拥有最高的 Star 数量，但相对于其知名度，贡献者基础明显小于 LangChain。它虽然仍在“市场领导者”象限，却体现出关注度与贡献者转化并不对称。',
    inference: '这可能说明其病毒式关注并未按相同比例转化为持续的代码参与。',
  },
  langflow: {
    quadrant: 'leaders',
    text: 'LangFlow 积累了大量 Star，但贡献者数量接近象限边界，说明相对于其知名度，社区参与的转化能力较弱。',
    inference: '这可能说明大量关注集中在工具使用层面，尚未形成与知名度相称的代码共建规模。',
  },
  langgraph: {
    quadrant: 'momentum',
    text: 'LangGraph 几乎落在两条中位线的交点上，但贡献者数量略低于中位数，因此在 Figure 8 中被归入“动能陷阱”。它的 Star 数量和贡献者深度都处于中间位置。',
    inference: '这可能反映它更多承担 LangChain 生态中的互补组件角色，而非独立形成大型贡献者社区。',
  },
  autogen: {
    quadrant: 'leaders',
    text: 'AutoGen 的 Star 与贡献者数量均高于数据集中位数，因此落在“市场领导者”区域；但它更靠近贡献者边界，参与深度仍明显低于 LangChain。',
    inference: '这可能说明其社区已具规模，但知名度转化为贡献参与的效率仍较为温和。',
  },
  crewai: {
    quadrant: 'leaders',
    text: 'CrewAI 的 Star 与贡献者数量均略高于中位线，位于“市场领导者”象限靠近中心的位置。这说明它已形成可见参与，但尚未达到头部框架的贡献者规模。',
    inference: '这可能说明 CrewAI 已建立初步建设者社区，但参与深度仍有继续增长的空间。',
  },
  metagpt: {
    quadrant: 'momentum',
    text: 'MetaGPT 是“动能陷阱”最明显的例子：它拥有 65,424 个 Star，但贡献者基数小得不成比例，贡献者密度仅为 3.9，是数据集中最低值。',
    inference: '这可能说明外部关注更多停留在浏览或使用层面，尚未转化为同等规模的代码共建。',
  },
  'semantic-kernel': {
    quadrant: 'leaders',
    text: 'Semantic Kernel 位于“市场领导者”象限靠近两条中位线的位置：绝对知名度与贡献者规模刚刚越过边界。它的贡献者密度为 22.5，也接近全体中位数 22.1。',
    inference: '这可能说明其关注度与贡献参与保持相对均衡，但社区转化表现并未显著高于整体水平。',
  },
  'agent-framework': {
    quadrant: 'nascent',
    text: 'Agent Framework 虽然是数据集中 Star 最少的项目，但相对于其知名度，拥有一批参与度很高的贡献者，表现出新项目较强的早期参与信号。',
    inference: '这可能说明项目仍处早期，却已吸引一批集中且活跃的工程贡献者。',
  },
  agentscope: {
    quadrant: 'nascent',
    text: 'AgentScope 已有更多时间积累发展势头，但在“新兴进入者”象限中显示出最薄弱的贡献者深度，关注度尚未转化为广泛参与。',
    inference: '这可能说明它在把有限知名度进一步转化为社区共建方面仍面临困难。',
  },
  mastra: {
    quadrant: 'nascent',
    text: 'Mastra 与 OpenAI Agents 在图中的位置相近，两者的 Star 数量和贡献者人数相当，仍处于把早期知名度转化为更广泛参与的阶段。',
    inference: '这可能说明 Mastra 的采用仍处扩展期，能否形成更广泛社区还需要后续观察。',
  },
  'openai-agents': {
    quadrant: 'nascent',
    text: 'OpenAI Agents 虽出自 OpenAI，但贡献者基数仍然有限。论文用这一位置说明，机构背景并不会自动推动社区参与。',
    inference: '这可能说明品牌背书能够带来关注，却不能自动形成分布广泛的开源贡献者社区。',
  },
  smolagents: {
    quadrant: 'nascent',
    text: 'smolagents 的 Star 数量已接近数据集中位数，但贡献者深度仍低于中位线，知名度尚未完全转化为广泛参与。',
    inference: '这可能说明项目已获得一定使用兴趣，但建设者社区仍处于积累阶段。',
  },
  'pydantic-ai': {
    quadrant: 'quiet',
    text: 'Pydantic-AI 的 Star 数低于中位数，但贡献者数量接近边界。论文还观察到它吸引了更多经验丰富且具有公司背景的贡献者，指向更强的生产导向参与。',
    inference: '这可能说明它虽不显眼，却对重视类型安全与生产可靠性的资深实践者更具吸引力。',
  },
  'google-adk': {
    quadrant: 'quiet',
    text: 'Google ADK 的知名度低于中位数，但贡献者数量接近边界。由于项目较年轻，这更可能表示社区处于早期增长阶段，而非已经形成稳定的强参与模式。',
    inference: '这可能说明项目已吸引一批工程导向的早期贡献者，但其社区稳定性仍需时间验证。',
  },
};

const scatterLabelOffsets: Record<string, { dx: number; dy: number; align: CanvasTextAlign; label?: string }> = {
  langchain: { dx: -10, dy: 17, align: 'right' },
  autogpt: { dx: -13, dy: -14, align: 'right' },
  langflow: { dx: 12, dy: 20, align: 'left' },
  langgraph: { dx: 24, dy: 18, align: 'left' },
  autogen: { dx: 12, dy: -16, align: 'left' },
  crewai: { dx: 20, dy: 36, align: 'left' },
  metagpt: { dx: 13, dy: 20, align: 'left' },
  'semantic-kernel': { dx: 28, dy: -19, align: 'left' },
  'agent-framework': { dx: 12, dy: 22, align: 'left', label: 'Agent Framework' },
  agentscope: { dx: 12, dy: 20, align: 'left' },
  mastra: { dx: -16, dy: 30, align: 'right' },
  'openai-agents': { dx: -24, dy: 47, align: 'right' },
  smolagents: { dx: 24, dy: 42, align: 'left' },
  'pydantic-ai': { dx: -18, dy: -18, align: 'right' },
  'google-adk': { dx: -24, dy: 19, align: 'right' },
};

function drawScatterLabel(
  ctx: CanvasRenderingContext2D,
  label: string,
  point: { x: number; y: number },
  offset: { dx: number; dy: number; align: CanvasTextAlign },
  color: string,
) {
  const x = point.x + offset.dx;
  const y = point.y + offset.dy;
  if (Math.abs(offset.dx) > 18 || Math.abs(offset.dy) > 24) {
    ctx.strokeStyle = '#aebdca';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(x, y - 4);
    ctx.stroke();
  }
  ctx.save();
  ctx.font = '700 10px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = offset.align;
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.96)';
  ctx.strokeText(label, x, y);
  ctx.fillStyle = color;
  ctx.fillText(label, x, y);
  ctx.restore();
}

function drawScatter(ctx: CanvasRenderingContext2D, state: UiState, w: number, h: number) {
  clear(ctx, w, h, C.white);
  const medianX = scatterPoint(26295, 618).x;
  const medianY = scatterPoint(26295, 618).y;
  ctx.fillStyle = C.paleGreen;
  ctx.fillRect(92, 58, medianX - 92, medianY - 58);
  ctx.fillStyle = C.paleBlue;
  ctx.fillRect(medianX, 58, 708 - medianX, medianY - 58);
  ctx.fillStyle = C.paleRed;
  ctx.fillRect(medianX, medianY, 708 - medianX, 390 - medianY);
  ctx.fillStyle = '#f4f5f4';
  ctx.fillRect(92, medianY, medianX - 92, 390 - medianY);
  ctx.strokeStyle = C.border;
  ctx.beginPath();
  ctx.moveTo(92, 390);
  ctx.lineTo(708, 390);
  ctx.moveTo(92, 390);
  ctx.lineTo(92, 58);
  ctx.stroke();
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(medianX, 58);
  ctx.lineTo(medianX, 390);
  ctx.moveTo(92, medianY);
  ctx.lineTo(708, medianY);
  ctx.stroke();
  ctx.setLineDash([]);
  text(ctx, '低调耕耘者', 108, 82, C.green, 12, 800);
  text(ctx, '市场领导者', 690, 82, C.blue, 12, 800, 'right');
  text(ctx, '新兴进入者', 108, 378, C.muted, 12, 800);
  text(ctx, '动能陷阱', 690, 378, C.red, 12, 800, 'right');
  text(ctx, 'GitHub stars（对数）', 400, 433, C.muted, 13, 700, 'center');
  ctx.save();
  ctx.translate(27, 224);
  ctx.rotate(-Math.PI / 2);
  text(ctx, '代码贡献者（对数）', 0, 0, C.muted, 13, 700, 'center');
  ctx.restore();

  frameworks.forEach((framework) => {
    const point = scatterPoint(framework.stars, framework.contributors);
    const selected = framework.id === state.selected;
    const detail = scatterInterpretations[framework.id];
    const color = scatterQuadrants[detail.quadrant].color;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, selected ? 8 : 6, 0, Math.PI * 2);
    ctx.fill();
    if (selected) {
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 13, 0, Math.PI * 2);
      ctx.stroke();
    }
    const offset = scatterLabelOffsets[framework.id];
    drawScatterLabel(ctx, offset.label || framework.name, point, offset, selected ? C.orange : C.text);
  });
}

const rankingIds = ['autogpt', 'langflow', 'langchain', 'pydantic-ai', 'google-adk', 'metagpt'];
const rankingRecords = rankingIds.map((id) => frameworks.find((item) => item.id === id)!).filter(Boolean);
const byStars = [...rankingRecords].sort((a, b) => b.stars - a.stars);
const byDensity = [...rankingRecords].sort((a, b) => b.density - a.density);

function drawDensityRanking(ctx: CanvasRenderingContext2D, state: UiState, w: number, h: number) {
  clear(ctx, w, h, C.white);
  const drawPanel = (
    records: typeof rankingRecords,
    x: number,
    title: string,
    unit: string,
    valueFor: (record: (typeof rankingRecords)[number]) => number,
    labelFor: (record: (typeof rankingRecords)[number]) => string,
    colorFor: (record: (typeof rankingRecords)[number]) => string,
  ) => {
    text(ctx, title, x, 38, title.startsWith('Star') ? C.orange : C.green, 17, 800);
    text(ctx, unit, x + 326, 38, C.muted, 10, 700, 'right');
    const maximum = Math.max(...records.map(valueFor));
    records.forEach((record, index) => {
      const y = 66 + index * 47;
      const color = colorFor(record);
      text(ctx, record.short, x, y + 17, C.text, 11, 800);
      ctx.fillStyle = '#edf0f3';
      ctx.fillRect(x + 88, y, 178, 22);
      ctx.fillStyle = color;
      ctx.fillRect(x + 88, y, 178 * (valueFor(record) / maximum), 22);
      text(ctx, labelFor(record), x + 326, y + 16, color, 11, 800, 'right');
    });
  };

  drawPanel(
    byStars,
    22,
    'Star 排名',
    '累计 Star',
    (record) => record.stars,
    (record) => record.stars.toLocaleString(),
    () => C.orange,
  );

  if (state.started) {
    ctx.strokeStyle = C.border;
    ctx.beginPath();
    ctx.moveTo(380, 24);
    ctx.lineTo(380, 350);
    ctx.stroke();
    drawPanel(
      byDensity,
      408,
      '贡献者密度排名',
      'contributors / 1000 stars',
      (record) => record.density,
      (record) => record.density.toFixed(1),
      (record) => record.density >= 30 ? C.green : record.density < 10 ? C.red : C.blue,
    );
    roundedRect(ctx, 22, h - 48, w - 44, 30, 5, C.paleGreen, C.green);
    text(ctx, '同一批框架在两种评价口径下呈现出明显不同的排名', 40, h - 28, C.green, 12, 800);
  } else {
    ctx.strokeStyle = '#e3e8ee';
    ctx.beginPath();
    ctx.moveTo(380, 24);
    ctx.lineTo(380, 350);
    ctx.stroke();
  }
}

const networkPositions: Record<string, { x: number; y: number }> = {
  langchain: { x: 380, y: 214 }, 'pydantic-ai': { x: 105, y: 72 }, langflow: { x: 650, y: 70 },
  autogen: { x: 625, y: 208 }, autogpt: { x: 650, y: 346 }, crewai: { x: 485, y: 386 },
  'semantic-kernel': { x: 286, y: 390 }, 'google-adk': { x: 92, y: 342 }, smolagents: { x: 90, y: 205 },
  'openai-agents': { x: 250, y: 58 }, langgraph: { x: 514, y: 62 }, metagpt: { x: 708, y: 275 },
  mastra: { x: 350, y: 58 }, agentscope: { x: 180, y: 278 },
};

function drawNetwork(ctx: CanvasRenderingContext2D, state: UiState, w: number, h: number) {
  clear(ctx, w, h, C.white);
  const ordered = [...crossEdges].sort((a, b) => b.count - a.count);
  const incident = ordered.filter((edge) => edge.a === state.selected || edge.b === state.selected);
  const focused = incident;
  ordered.forEach((edge) => {
    const a = networkPositions[edge.a];
    const b = networkPositions[edge.b];
    if (!a || !b) return;
    const active = focused.includes(edge);
    ctx.strokeStyle = active ? (state.selected === 'langchain' ? C.green : C.blue) : '#dfe5eb';
    ctx.lineWidth = active ? 1.6 + edge.count / 14 : 0.8;
    ctx.globalAlpha = active ? 0.95 : 0.38;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  Object.entries(networkPositions).forEach(([id, point]) => {
    const framework = frameworks.find((item) => item.id === id);
    if (!framework) return;
    const active = id === state.selected;
    const connected = focused.some((edge) => (edge.a === state.selected && edge.b === id) || (edge.b === state.selected && edge.a === id));
    ctx.fillStyle = active ? C.orange : connected ? C.blue : '#aebdca';
    ctx.beginPath();
    ctx.arc(point.x, point.y, active ? 14 : connected ? 9 : 6, 0, Math.PI * 2);
    ctx.fill();
    if (active) {
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 19, 0, Math.PI * 2);
      ctx.stroke();
    }
    text(ctx, framework.short, point.x, point.y + (point.y < 100 ? -18 : 25), active ? C.orange : C.text, 11, active ? 800 : 600, 'center');
  });
  const active = frameworks.find((framework) => framework.id === state.selected) || frameworks[0];
  roundedRect(ctx, 230, h - 78, 500, 54, 6, C.white, state.selected === 'langchain' ? C.green : C.blue);
  text(ctx, state.selected === 'langchain' ? '正文口径：Top 20 中 11 组主要连接 · 覆盖 82.5%' : `${active.name}：Top 20 中 ${incident.length} 条相关连接`, 250, h - 52, C.text, 13, 800);
  const strongest = incident[0];
  const peerId = strongest ? (strongest.a === state.selected ? strongest.b : strongest.a) : '';
  const peer = frameworks.find((framework) => framework.id === peerId);
  text(ctx, strongest && peer ? `最强组合：${peer.name}（${strongest.count} 名共同贡献者）` : '该节点未进入 Top 20 组合', 250, h - 33, C.muted, 12, 600);
}

function drawImageCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement | null, w: number, h: number, alpha = 1) {
  if (!image || !image.complete || image.naturalWidth === 0) {
    text(ctx, '论文原图加载中', w / 2, h / 2, C.muted, 15, 700, 'center');
    return;
  }
  const scale = Math.min(w / image.naturalWidth, h / image.naturalHeight);
  const dw = image.naturalWidth * scale;
  const dh = image.naturalHeight * scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(image, (w - dw) / 2, (h - dh) / 2, dw, dh);
  ctx.restore();
}

function retentionLayout(w: number, h: number) {
  const sourceWidth = 880;
  const sourceHeight = 575;
  const cropTop = 18;
  const top = 40;
  const scale = Math.min((w - 24) / sourceWidth, (h - 94) / (sourceHeight - cropTop));
  const drawWidth = sourceWidth * scale;
  const drawHeight = (sourceHeight - cropTop) * scale;
  const left = (w - drawWidth) / 2;
  return {
    cropTop,
    drawWidth,
    drawHeight,
    left,
    top,
    plotLeft: left + 69 * scale,
    plotRight: left + 699 * scale,
    plotTop: top + (68 - cropTop) * scale,
    plotBottom: top + (550 - cropTop) * scale,
  };
}

function drawRetention(ctx: CanvasRenderingContext2D, state: UiState, image: HTMLImageElement | null, w: number, h: number) {
  clear(ctx, w, h, C.white);
  const day = clamp(state.day, 0, 360);
  const layout = retentionLayout(w, h);
  text(ctx, 'Figure 10. Cumulative Retention Curves for Early Contributors', w / 2, 24, C.text, 13, 700, 'center');
  if (image && image.complete && image.naturalWidth > 0) {
    ctx.drawImage(
      image,
      0,
      layout.cropTop,
      image.naturalWidth,
      image.naturalHeight - layout.cropTop,
      layout.left,
      layout.top,
      layout.drawWidth,
      layout.drawHeight,
    );
  } else {
    text(ctx, '论文原图加载中', w / 2, h / 2, C.muted, 15, 700, 'center');
  }
  const revealX = lerp(layout.plotLeft, layout.plotRight, day / 360);
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(revealX, layout.plotTop);
  ctx.lineTo(revealX, layout.plotBottom);
  ctx.stroke();
  const labelX = clamp(revealX, 48, w - 48);
  roundedRect(ctx, labelX - 42, h - 48, 84, 28, 5, C.white, C.orange);
  text(ctx, `Day ${Math.round(day)}`, labelX, h - 29, C.orange, 12, 800, 'center');
}

function drawModule(ctx: CanvasRenderingContext2D, moduleId: string, state: UiState, time: number, image: HTMLImageElement | null, w: number, h: number) {
  if (moduleId === '1.1') return drawTimeline(ctx, state, time, w, h);
  if (moduleId === '1.3') return drawMetricBlindspots(ctx, state, w, h);
  if (moduleId === '2.1') return drawStarStory(ctx, state, time, w, h);
  if (moduleId === '2.2') return drawAnomalySignals(ctx, state, w, h);
  if (moduleId === '3.2') return drawStudyScope(ctx, w, h);
  if (moduleId === '4.1') return drawScatter(ctx, state, w, h);
  if (moduleId === '4.2') return drawDensityRanking(ctx, state, w, h);
  if (moduleId === '5.1') return drawNetwork(ctx, state, w, h);
  if (moduleId === '6.1') return drawRetention(ctx, state, image, w, h);
  clear(ctx, w, h);
  text(ctx, '暂无可视化', w / 2, h / 2, C.muted, 15, 700, 'center');
}

function feedbackFor(moduleId: string, state: UiState) {
  if (moduleId === '1.1') return { text: '时间线显示，这些框架并非同类产品的重复发布：早期框架侧重通用应用与自主循环，随后扩展到多智能体协作、状态图和低代码编排，近年的框架进一步强调类型安全、工程可靠性与厂商集成。因此，比较框架前需要先明确它解决的工程问题。', cls: 'good' };
  if (moduleId === '2.1') return state.mode === 'ranking'
    ? { text: '最终快照中 AutoGPT 排名第一', cls: 'plain' }
    : { text: '月度曲线显示注意力高度集中在 2023 年 4 月；作者将其与社交媒体演示的病毒式传播联系起来。', cls: 'bad' };
  if (moduleId === '2.2') return {
    text: '累计 Star 数据中可能存在不能真实反映关注度的异常活动，因此不能把 Star 总量直接等同于真实采用。',
    cls: 'bad',
  };
  if (moduleId === '4.2') return state.started
    ? { text: '左右对照显示：Pydantic-AI、LangChain、Google ADK 的贡献者转化更突出，而高 Star 不一定对应高密度。', cls: 'good' }
    : { text: '左图展示累计 Star 所代表的知名度规模。', cls: '' };
  return { text: '', cls: '' };
}

function moduleHeight(moduleId: string) {
  if (moduleId === '1.1') return 280;
  if (moduleId === '1.3') return 300;
  if (moduleId === '2.1') return 470;
  if (moduleId === '2.2') return 420;
  if (moduleId === '4.1') return 455;
  if (moduleId === '4.2') return 420;
  if (moduleId === '5.1') return 540;
  if (moduleId === '6.1') return 560;
  return 290;
}

export const EcosystemWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [state, setState] = useState<UiState>(() => initialState(moduleId));
  const stateRef = useRef(state);
  stateRef.current = state;

  const isQuestion = moduleId === 'ana';
  const isHero = chapterId === 'hero';
  const W = isQuestion ? 244 : isHero ? 360 : 760;
  const H = isQuestion ? 130 : isHero ? 180 : moduleHeight(moduleId);

  useEffect(() => {
    imageRef.current = null;
    if (moduleId !== '6.1') return;
    const image = new Image();
    image.src = '/images/figure-10-retention.png';
    image.onload = () => { imageRef.current = image; };
    return () => { image.onload = null; };
  }, [moduleId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const tick = (time: number) => {
      if (isQuestion) drawQuestion(ctx, chapterId, time, W, H);
      else if (isHero) drawHero(ctx, moduleId, time, W, H);
      else drawModule(ctx, moduleId, stateRef.current, time, imageRef.current, W, H);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => { if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [H, W, chapterId, isHero, isQuestion, moduleId]);

  const update = (patch: Partial<UiState>) => setState((previous) => ({ ...previous, ...patch }));
  const restart = (patch: Partial<UiState> = {}) => update({ ...patch, started: true, motionStart: now() });

  const handleCanvasPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * W;
    const y = ((event.clientY - rect.top) / rect.height) * H;
    if (moduleId === '1.3' && y >= 18 && y <= H - 18) {
      const margin = 18;
      const gap = 12;
      const cardWidth = (W - margin * 2 - gap * 2) / 3;
      const modes: MetricMode[] = ['stars', 'contributors', 'prs'];
      const selectedIndex = modes.findIndex((_, index) => {
        const left = margin + index * (cardWidth + gap);
        return x >= left && x <= left + cardWidth;
      });
      if (selectedIndex >= 0) update({ mode: modes[selectedIndex] });
    }
    if (moduleId === '4.1') {
      let best: { id: string; distance: number } | null = null;
      for (const framework of frameworks) {
        const point = scatterPoint(framework.stars, framework.contributors);
        const distance = Math.hypot(point.x - x, point.y - y);
        if (distance <= 18 && (!best || distance < best.distance)) best = { id: framework.id, distance };
      }
      if (best) update({ selected: best.id });
    }
    if (moduleId === '5.1') {
      let best: { id: string; distance: number } | null = null;
      for (const [id, point] of Object.entries(networkPositions)) {
        const distance = Math.hypot(point.x - x, point.y - y);
        if (distance <= 24 && (!best || distance < best.distance)) best = { id, distance };
      }
      if (best) update({ selected: best.id, started: false });
    }
    if (moduleId === '6.1') {
      const layout = retentionLayout(W, H);
      update({ started: false, day: Math.round(clamp(((x - layout.plotLeft) / (layout.plotRight - layout.plotLeft)) * 360, 0, 360)) });
    }
  };

  if (isQuestion || isHero) return <canvas ref={canvasRef} width={W} height={H} />;

  const chip = (id: string, label: string, key: 'mode' | 'selected' = 'mode', animate = false) => {
    const active = state[key] === id;
    return (
      <button className={`chip ${active ? 'on' : ''}`} aria-pressed={active} onClick={() => animate ? restart({ [key]: id }) : update({ [key]: id })}>
        {label}
      </button>
    );
  };

  const feedback = feedbackFor(moduleId, state);
  const pointerModule = moduleId === '1.3' || moduleId === '4.1' || moduleId === '5.1' || moduleId === '6.1';
  const scatterActive = frameworks.find((item) => item.id === state.selected) || frameworks[0];
  const scatterDetail = scatterInterpretations[scatterActive.id];
  const scatterQuadrant = scatterDetail ? scatterQuadrants[scatterDetail.quadrant] : scatterQuadrants.leaders;
  const retentionActive = retentionCases.find((item) => item.id === state.selected) || retentionCases[0];
  const starStoryDescription = state.mode === 'ranking'
    ? '图中按照截至 2026 年 3 月 10 日的累计 Star 排名。AutoGPT 以 182,405 个 Star 位居第一，其次是 LangFlow 和 LangChain。这张最终快照只呈现谁获得了更多关注，无法说明关注是在长期积累还是短期爆发中形成。'
    : '横轴表示 2023 年 3 月至 2026 年 3 月，纵轴表示每月新增 Star。AutoGPT 在 2023 年 4 月单月新增 111,967 个 Star，随后迅速回落并长期处于低位，说明它的累计领先主要由早期爆发塑造，而非持续稳定的关注增长。';

  return (
    <div>
      {moduleId === '2.1' ? <p className="module-desc story-description">{starStoryDescription}</p> : null}
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={handleCanvasPointer}
        onPointerMove={(event) => moduleId === '6.1' && event.buttons === 1 && handleCanvasPointer(event)}
        style={pointerModule ? { cursor: moduleId === '6.1' ? 'ew-resize' : 'pointer' } : undefined}
      />

      {moduleId === '2.1' ? (
        <div className="ctrl story-controls">
          <button className={`chip ${state.mode === 'ranking' ? 'on' : ''}`} onClick={() => restart({ mode: 'ranking' })}>Star 排行榜</button>
          <button className={`chip ${state.mode === 'trajectory' ? 'on' : ''}`} onClick={() => restart({ mode: 'trajectory' })}>查看月度变化</button>
        </div>
      ) : null}

      {moduleId === '4.1' ? (
        <article className={`scatter-detail quadrant-${scatterDetail.quadrant}`}>
          <div className="scatter-detail-head">
            <div>
              <span style={{ color: scatterQuadrant.color }}>{scatterQuadrant.label}</span>
              <h5>{scatterActive.name}</h5>
            </div>
            <div className="scatter-detail-metrics">
              <b>{scatterActive.stars.toLocaleString()} Star</b>
              <b>{scatterActive.contributors.toLocaleString()} 位贡献者</b>
              <b>密度 {scatterActive.density}</b>
            </div>
          </div>
          <div className="scatter-detail-body">
            <div>
              <b>位置解读</b>
              <p>{scatterDetail.text}</p>
              <div className="scatter-inference"><b>可能说明</b><span>{scatterDetail.inference}</span></div>
            </div>
            <div><b>象限含义</b><p>{scatterQuadrant.summary}</p></div>
          </div>
        </article>
      ) : null}

      {moduleId === '4.2' ? (
        <div className="ctrl">
          <button className={`chip ${state.started ? 'on' : ''}`} aria-pressed={state.started} onClick={() => update({ started: !state.started })}>
            {state.started ? '隐藏贡献者密度排名' : '展示贡献者密度排名'}
          </button>
        </div>
      ) : null}

      {moduleId === '6.1' ? (
        <>
          <article className="retention-detail" style={{ borderLeftColor: retentionActive.color }}>
            <div className="retention-detail-head">
              <div><span style={{ color: retentionActive.color }}>{retentionActive.label}</span><b>{retentionActive.headline}</b></div>
              <div><strong>早期队列 {retentionActive.cohort} 人</strong><strong>母组织关联 {retentionActive.parentAffiliation}</strong></div>
            </div>
            <p>{retentionActive.interpretation}</p>
          </article>
          <div className="retention-window-callout">
            <b>新人留存的关键窗口</b>
            <span>整体曲线显示，大部分流失发生在首次贡献后的前 90 天，因此这一阶段对新人留存尤为关键。</span>
          </div>
        </>
      ) : null}

      {moduleId !== '1.3' && moduleId !== '3.2' && moduleId !== '4.1' && moduleId !== '5.1' && moduleId !== '6.1' ? <div className={`feedback ${feedback.cls}`}>{feedback.text}</div> : null}
    </div>
  );
};

export default EcosystemWidget;
