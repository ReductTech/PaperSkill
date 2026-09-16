import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

type SceneState = {
  value: number;
  mode: string;
  step: number;
  started: boolean;
  progress: number;
  x: number;
  sel: number;
};

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', trail: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', axis: '#d7deea',
};

const keyOf = (chapterId: string, moduleId: string) => chapterId + ':' + moduleId;
const isAna = (moduleId: string) => moduleId === 'ana';
const isHero = (chapterId: string) => chapterId === 'hero';

function dims(chapterId: string, moduleId: string): [number, number] {
  if (isAna(moduleId) || isHero(chapterId)) return [560, 140];
  return [1080, 280];
}

function interactionOf(key: string): 'slider' | 'chips' | 'step' | 'race' | 'drag' | 'hotspot' | 'none' {
  if (key.endsWith(':ana') || key.startsWith('hero:')) return 'none';
  if (key === 'chap-1:1.1' || key === 'chap-4:4.1' || key === 'chap-7:7.1') return 'slider';
  if (key === 'chap-2:2.1') return 'drag';
  if (key === 'chap-3:3.1') return 'step';
  if (key === 'chap-5:5.1' || key === 'chap-9:9.1') return 'chips';
  if (key === 'chap-6:6.1' || key === 'chap-7:7.2') return 'step';
  if (key === 'chap-8:8.1') return 'hotspot';
  if (key === 'chap-10:10.1') return 'race';
  return 'none';
}

function initState(key: string): SceneState {
  const s: SceneState = { value: 0.5, mode: '', step: 0, started: false, progress: 0, x: 0.5, sel: 0 };
  if (key === 'chap-1:1.1') s.value = 0.35;
  if (key === 'chap-4:4.1') s.value = 0.55;
  if (key === 'chap-7:7.1') s.value = 0.3;
  if (key === 'chap-5:5.1') s.mode = 'linear';
  if (key === 'chap-9:9.1') s.mode = 'route';
  if (key === 'chap-3:3.1') { s.step = 0; s.started = false; }
  if (key === 'chap-6:6.1') s.step = 0;
  if (key === 'chap-7:7.2') s.step = 0;
  if (key === 'chap-8:8.1') s.sel = 0;
  return s;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawForest(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, noisy: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  // distant tree silhouettes
  ctx.fillStyle = C.light;
  for (let i = 0; i < 6; i++) {
    const x = w * (0.12 + i * 0.16) + Math.sin(t * 0.001 + i) * 6;
    const th = h * (0.35 + (i % 3) * 0.12);
    ctx.beginPath();
    ctx.moveTo(x - 26, h - 40);
    ctx.lineTo(x, h - 40 - th);
    ctx.lineTo(x + 26, h - 40);
    ctx.closePath();
    ctx.fill();
  }
  // ground
  ctx.fillStyle = C.dark;
  ctx.fillRect(0, h - 36, w, 36);
  ctx.fillStyle = C.light;
  ctx.fillRect(0, h - 42, w, 8);
  // noise wind streaks
  if (noisy > 0) {
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.35 + noisy * 0.55;
    for (let i = 0; i < 5; i++) {
      const y = 16 + i * 20 + Math.sin(t * 0.01 + i) * 8;
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(w - 10, y + Math.sin(i) * 8 - noisy * 24);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

function drawBird(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, color: string) {
  const bob = Math.sin(t * 0.008) * 4;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 18, y - 4 + bob);
  ctx.quadraticCurveTo(x, y - 16 + bob, x + 18, y - 4 + bob);
  ctx.quadraticCurveTo(x, y + 6 + bob, x - 18, y - 4 + bob);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y + bob, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawHiker(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, color: string) {
  const bob = Math.abs(Math.sin(t * 0.004)) * 4;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y - 26 + bob, 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 17 + bob);
  ctx.lineTo(x, y + 16 + bob);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 12, y + 4 + bob);
  ctx.lineTo(x + 12, y + 4 + bob);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y + 16 + bob);
  ctx.lineTo(x - 12, y + 34);
  ctx.lineTo(x + 12, y + 34);
  ctx.closePath();
  ctx.stroke();
}

function drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.ink) {
  ctx.fillStyle = color;
  ctx.font = '18px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillText(text, x, y);
}

function drawBars(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, values: number[], colors: string[], labels: string[]) {
  const n = values.length;
  const gap = 10;
  const bw = (w - gap * (n - 1)) / n;
  values.forEach((v, i) => {
    const bh = clamp(v, 0, 1) * h;
    ctx.fillStyle = colors[i] || C.blue;
    roundRect(ctx, x + i * (bw + gap), y + h - bh, bw, bh, 4);
    ctx.fill();
    drawLabel(ctx, labels[i], x + i * (bw + gap), y + h + 22, C.muted);
    drawLabel(ctx, v.toFixed(2), x + i * (bw + gap), y + h - bh - 8, C.ink);
  });
}

function drawWave(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, noise: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  const mid = y + h / 2;
  for (let i = 0; i <= 60; i++) {
    const px = x + (w * i) / 60;
    const amp = (1 - noise) * (h * 0.42) + noise * (h * 0.16);
    const py = mid + Math.sin(i * 0.6) * amp * 0.6 + (noise > 0.5 ? Math.sin(i * 1.7) * 12 : 0);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function drawScene(ctx: CanvasRenderingContext2D, w: number, h: number, key: string, s: SceneState, t: number) {
  const chapterId = key.split(':')[0];
  const moduleId = key.split(':')[1];

  if (isHero(chapterId)) {
    drawForest(ctx, w, h, t, moduleId === 'old' ? 0.85 : 0.08);
    drawHiker(ctx, w * 0.42, h * 0.62, t, C.blue);
    drawBird(ctx, w * 0.74, h * 0.34, t, moduleId === 'old' ? C.red : C.green);
    drawLabel(ctx, moduleId === 'old' ? '模糊' : '清晰', w * 0.7, h * 0.78, moduleId === 'old' ? C.red : C.green);
    return;
  }

  if (isAna(moduleId)) {
    const n = Number(chapterId.split('-')[1]);
    const noisy = [1, 3, 5, 6].includes(n) ? 0.7 : [4, 7].includes(n) ? 0.35 : 0.15;
    drawForest(ctx, w, h, t, noisy);
    drawHiker(ctx, w * (0.28 + (n % 3) * 0.04), h * 0.62, t, C.blue);
    drawBird(ctx, w * 0.76, h * 0.32, t, n === 10 ? C.orange : C.green);
    if (n === 2 || n === 4 || n === 8) drawLabel(ctx, '望远镜·编码器', w * 0.5, h * 0.28, C.blue);
    if (n === 6 || n === 7) drawLabel(ctx, '图鉴·LLM', w * 0.5, h * 0.82, C.orange);
    if (n === 9) drawLabel(ctx, '耳塞·LoRA', w * 0.5, h * 0.82, C.purple);
    if (n === 10) drawLabel(ctx, '终点', w * 0.76, h * 0.82, C.orange);
    return;
  }

  if (key === 'chap-1:1.1') {
    drawForest(ctx, w * 0.52, h, t, s.value);
    drawHiker(ctx, w * 0.3, h * 0.62, t, C.blue);
    drawBird(ctx, w * 0.45, h * 0.3, t, s.value > 0.62 ? C.red : C.green);
    ctx.strokeStyle = C.axis; ctx.strokeRect(w * 0.54, h * 0.12, w * 0.42, h * 0.76);
    drawWave(ctx, w * 0.56, h * 0.22, w * 0.38, h * 0.34, s.value, s.value > 0.62 ? C.red : C.blue);
    drawLabel(ctx, 'WER', w * 0.56, h * 0.74, C.ink);
    drawBars(ctx, w * 0.56, h * 0.74, w * 0.38, h * 0.18, [clamp(s.value, 0, 1)], [s.value > 0.62 ? C.red : C.blue], ['误识']);
    return;
  }

  if (key === 'chap-2:2.1') {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const px = s.x * (w - 120) + 60;
    ctx.strokeStyle = C.axis; ctx.strokeRect(40, 40, w - 80, h - 150);
    const bands = ['噪声','远场','遮挡','回声','录音','失真','丢包'];
    const colors = [C.red, C.dark, C.trail, C.purple, C.light, C.orange, C.blue];
    bands.forEach((b, i) => {
      const bw = (w - 80) / 7;
      ctx.fillStyle = colors[i];
      ctx.globalAlpha = 0.24;
      ctx.fillRect(40 + i * bw, 40, bw, h - 150);
      ctx.globalAlpha = 1;
      drawLabel(ctx, b, 46 + i * bw, h - 96, C.muted);
    });
    ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const xx = 40 + (w - 80) * i / 80;
      const yy = h - 110 - Math.sin(i * 0.5) * 34 - (i > 10 && i < 30 ? 12 : 0) - (i > 50 ? 18 : 0);
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    ctx.strokeStyle = C.orange; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, 40); ctx.lineTo(px, h - 110); ctx.stroke();
    drawLabel(ctx, '探针', px - 20, 30, C.orange);
    return;
  }

  if (key === 'chap-3:3.1') {
    const show = s.started;
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const panels = ['孤立失真', '复合场景'];
    for (let p = 0; p < 2; p++) {
      const x0 = 40 + p * (w / 2);
      ctx.strokeStyle = C.axis; ctx.strokeRect(x0, 40, w / 2 - 70, h - 120);
      drawWave(ctx, x0 + 12, 60, w / 2 - 94, h * 0.42, p === 0 ? 0.45 : 0.78, p === 0 ? C.blue : C.red);
      drawLabel(ctx, panels[p], x0 + 12, h - 52, C.muted);
      if (show) {
        drawBars(ctx, x0 + 12, h - 78, w / 2 - 94, 40, [p === 0 ? 0.55 : 0.88], [p === 0 ? C.blue : C.red], [p === 0 ? 'WER 低' : 'WER 高']);
      }
    }
    if (s.step === 0 && !show) drawLabel(ctx, '按下开始', w / 2 - 40, h / 2, C.muted);
    return;
  }

  if (key === 'chap-4:4.1') {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    drawLabel(ctx, '编辑相似度', 40, 60, C.ink);
    ctx.strokeStyle = C.axis; ctx.strokeRect(40, 80, w - 80, 60);
    ctx.fillStyle = s.value >= 0.5 ? C.green : C.red;
    ctx.fillRect(40, 80, (w - 80) * s.value, 60);
    drawLabel(ctx, s.value.toFixed(2), w * 0.5, 128, C.ink);
    drawBars(ctx, 40, 170, w - 80, 80, [s.value, 1 - s.value], [s.value >= 0.5 ? C.green : C.red, C.blue], ['细化奖励', 'WER 惩罚']);
    return;
  }

  if (key === 'chap-5:5.1') {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const modes = ['sqrtf', 'sqrtb', 'gauss', 'linear'];
    const idx = Math.max(0, modes.indexOf(s.mode));
    const hist = [0.12, 0.32, 0.78, 0.96, 0.96, 0.78, 0.32, 0.12];
    const shifted = modes[idx] === 'sqrtf' ? hist : modes[idx] === 'sqrtb' ? [...hist].reverse() : modes[idx] === 'gauss' ? [0.18,0.55,0.9,0.9,0.55,0.18,0.08,0.05] : [0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5];
    drawBars(ctx, 40, 60, w - 80, h - 140, shifted, Array(8).fill(idx === 3 ? C.green : C.blue), ['0','1','2','3','4','5','6','7']);
    drawLabel(ctx, idx === 3 ? '线性：最平衡' : '分布', 40, 40, C.ink);
    return;
  }

  if (key === 'chap-6:6.1') {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const stages = ['WER<30', 'WER<50', 'WER<70'];
    const active = Math.min(s.step, 2);
    const cols = [C.blue, C.blue, C.orange, C.green];
    [0,1,2].forEach((i) => {
      const x0 = 40 + i * ((w - 80) / 3);
      ctx.fillStyle = i <= active ? cols[i] : C.light;
      roundRect(ctx, x0, 70, (w - 80) / 3 - 16, 90, 8); ctx.fill();
      drawLabel(ctx, stages[i], x0 + 10, 120, C.ink);
    });
    drawLabel(ctx, s.step === 3 ? '联合微调' : (s.step === 2 ? 'LLM 语义重建' : '编码器/对齐器声学'), 40, 210, C.ink);
    return;
  }

  if (key === 'chap-7:7.1') {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const below = s.value < 0.3;
    ctx.strokeStyle = C.axis; ctx.strokeRect(40, 40, w - 80, 100);
    ctx.fillStyle = C.blue; ctx.fillRect(40, 40, (w - 80) * 0.3, 100);
    ctx.strokeStyle = C.orange; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(40 + (w - 80) * s.value, 40); ctx.lineTo(40 + (w - 80) * s.value, 140); ctx.stroke();
    drawBars(ctx, 40, 180, w - 80, 70, below ? [0.75, 0.25] : [0.25, 0.75], [C.green, C.purple], ['词级细化', '句级重构']);
    drawLabel(ctx, 'τ=' + s.value.toFixed(2), 40 + (w - 80) * s.value - 30, 32, C.orange);
    return;
  }

  if (key === 'chap-7:7.2') {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const names = ['Rwer 锚点', '+抗重复', '+词级细化', '+句级重构', '门控融合'];
    const vals = [0.82, 0.86, 0.9, 0.93, 0.95];
    const n = Math.min(s.step, 4);
    for (let i = 0; i <= n; i++) {
      drawBars(ctx, 40 + i * 190, 80, 150, 120, [vals[i]], [i === 4 ? C.green : C.blue], [names[i]]);
    }
    drawLabel(ctx, s.step === 4 ? '完整奖励' : '逐步叠加', 40, 60, C.ink);
    return;
  }

  if (key === 'chap-8:8.1') {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const comps = ['编码器','对齐器','LLM','路由'];
    const cx = [0.13, 0.33, 0.53, 0.73].map(v => v * w);
    comps.forEach((name, i) => {
      const active = s.sel === i;
      ctx.fillStyle = active ? C.blue : C.light;
      roundRect(ctx, cx[i] - 58, 108, 116, 66, 10); ctx.fill();
      ctx.strokeStyle = active ? C.orange : C.axis; ctx.lineWidth = active ? 3 : 1;
      ctx.stroke();
      drawLabel(ctx, name, cx[i] - 30, 146, C.ink);
    });
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = s.sel === i || s.sel === i + 1 ? C.green : C.axis;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx[i] + 58, 141); ctx.lineTo(cx[i + 1] - 58, 141); ctx.stroke();
    }
    const rx = cx[3];
    ctx.strokeStyle = C.green; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(rx + 58, 130); ctx.lineTo(w - 40, 70); ctx.stroke();
    ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(rx + 58, 152); ctx.lineTo(w - 40, 200); ctx.stroke();
    ctx.fillStyle = C.light; roundRect(ctx, w - 150, 44, 120, 52, 8); ctx.fill(); ctx.strokeStyle = C.axis; ctx.stroke();
    drawLabel(ctx, '原骨干', w - 140, 74, C.green);
    drawLabel(ctx, '干净', w - 140, 88, C.muted);
    ctx.fillStyle = C.light; roundRect(ctx, w - 150, 174, 120, 52, 8); ctx.fill(); ctx.strokeStyle = C.axis; ctx.stroke();
    drawLabel(ctx, '鲁棒分支', w - 140, 204, C.blue);
    drawLabel(ctx, '退化', w - 140, 218, C.muted);
    const details = ['从波形提取声学特征','把特征压缩为 token 序列','用语言先验重建转录文本','末端二分类：分流到原骨干或鲁棒分支'];
    drawLabel(ctx, details[s.sel], 40, 250, C.ink);
    return;
  }

  if (key === 'chap-9:9.1') {
    drawForest(ctx, w * 0.5, h, t, s.mode === 'route' ? 0.5 : 0.1);
    drawHiker(ctx, w * 0.24, h * 0.62, t, C.blue);
    drawBird(ctx, w * 0.44, h * 0.3, t, s.mode === 'route' ? C.green : C.blue);
    ctx.strokeStyle = C.axis; ctx.strokeRect(w * 0.54, h * 0.12, w * 0.42, h * 0.76);
    const bars = s.mode === 'route' ? [0.9, 0.9] : [0.5, 0.92];
    drawBars(ctx, w * 0.56, h * 0.3, w * 0.38, h * 0.4, bars, [C.blue, C.green], ['干净域','鲁棒域']);
    drawLabel(ctx, '示意（非精确值）', w * 0.56, h * 0.22, C.muted);
    drawLabel(ctx, s.mode === 'route' ? '路由：干净≈基线，鲁棒保持' : '始终鲁棒：干净受损', w * 0.56, h * 0.86, C.ink);
    return;
  }

  if (key === 'chap-10:10.1') {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const base = s.started ? s.progress : 0;
    const models = [['Qwen3-ASR', 7.93], ['Whisper-L-v3', 10.72], ['Mega-ASR', 6.70]];
    const max = 12;
    const cols = [C.blue, C.red, C.green];
    models.forEach((m, i) => {
      const v = Number(m[1]);
      const target = 1 - v / max;
      const bh = base * target * (h - 140);
      const x = 40 + i * ((w - 80) / 3);
      ctx.fillStyle = cols[i];
      ctx.fillRect(x, h - 120 - bh, (w - 80) / 3 - 16, bh);
      drawLabel(ctx, m[0] + '  ' + v.toFixed(2) + '%', x, h - 90, C.ink);
    });
    drawLabel(ctx, 'WER（%）↓ 越低越好', 40, 40, C.muted);
    drawLabel(ctx, 'CHiME-4 · VOiCES · NOIZEUS 平均', 40, 62, C.muted);
    return;
  }

  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
}

function feedbackOf(key: string, s: SceneState): { text: string; cls: string } {
  if (key === 'chap-1:1.1') {
    if (s.value < 0.35) return { text: '环境较安静，识别基本可靠，但还不够真实。', cls: 'good' };
    if (s.value < 0.65) return { text: '噪声上升，开始出现词级替换错误。', cls: '' };
    return { text: '声学证据被淹没，模型开始漏读或编造整句。', cls: 'bad' };
  }
  if (key === 'chap-2:2.1') {
    return { text: '探针位置改变，频谱中不同频段对应不同失真痕迹。', cls: '' };
  }
  if (key === 'chap-3:3.1') {
    if (!s.started) return { text: '按下“开始”，同时观察两个面板的识别结果。', cls: '' };
    if (s.step === 0) return { text: '单一噪声时错误较小，复合场景错误明显升高。', cls: 'bad' };
    return { text: '复合失真暴露了旧方法的短板，这正是需要新数据的原因。', cls: '' };
  }
  if (key === 'chap-4:4.1') {
    if (s.value >= 0.5) return { text: '相似度≥0.50，属于软错误：听混但没编造。', cls: 'good' };
    return { text: '相似度<0.50，属于硬错误：接近幻觉，惩罚更重。', cls: 'bad' };
  }
  if (key === 'chap-5:5.1') {
    if (s.mode === 'linear') return { text: '线性分布提供最平衡的难度剖面，被选为数据集默认。', cls: 'good' };
    return { text: '该分布让训练样本过度集中在某个难度区间。', cls: '' };
  }
  if (key === 'chap-6:6.1') {
    const msgs = ['第一阶段：先学 WER<30% 的可靠声学感知。', '第二阶段：扩大到 WER<50%，证据开始残缺。', '第三阶段：WER<70%，需要语义重建能力。', '联合微调：编码器、对齐器与 LLM 端到端对齐。'];
    return { text: msgs[Math.min(s.step, 3)], cls: s.step === 3 ? 'good' : '' };
  }
  if (key === 'chap-7:7.1') {
    return s.value < 0.3
      ? { text: '低于 τ：以词级细化为主，适合轻微错误。', cls: 'good' }
      : { text: '达到 τ：切换为句级重构主导，适合幻觉与漏读。', cls: '' };
  }
  if (key === 'chap-7:7.2') {
    const msgs = ['先有 WER 奖励，把奖励锚定评价指标。', '抗重复门控清零退化的重复输出。', '词级细化区分软硬替换错误。', '句级重构保留语义主干。', '门控融合按 WER 动态分配权重，形成完整奖励。'];
    return { text: msgs[Math.min(s.step, 4)], cls: s.step === 4 ? 'good' : '' };
  }
  if (key === 'chap-8:8.1') {
    const details = ['编码器：从波形提取声学特征。', '对齐器：把特征压缩为 token 序列。', 'LLM：在证据残缺时用语言先验重建文本。', '路由：末端二分类，把干净语音送回原骨干，把退化语音交给鲁棒分支。'];
    return { text: details[s.sel], cls: '' };
  }
  if (key === 'chap-9:9.1') {
    if (s.mode === 'route') return { text: '路由：干净域与基线几乎持平（WER 差异 <1.00%），并保留鲁棒域强鲁棒性。', cls: 'good' };
    return { text: '始终鲁棒：鲁棒域强，但干净域明显受损，整体不如路由方案。', cls: 'bad' };
  }
  if (key === 'chap-10:10.1') {
    if (!s.started) return { text: '按下“开始对比”，让三个模型从同一基线出发。', cls: '' };
    if (s.progress < 1) return { text: '正在复现结果……', cls: '' };
    return { text: 'Mega-ASR 平均 WER 6.70，在复合场景领先更多。', cls: 'good' };
  }
  return { text: '', cls: '' };
}

export const MegaAsrScene: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const key = keyOf(chapterId, moduleId);
  const [s, setS] = useState<SceneState>(() => initState(key));
  const stateRef = useRef<SceneState>(s);
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [feedback, setFeedback] = useState(() => feedbackOf(key, initState(key)));
  const [dw, dh] = dims(chapterId, moduleId);
  const interaction = interactionOf(key);

  const commit = (next: SceneState) => {
    stateRef.current = next;
    setS(next);
    setFeedback(feedbackOf(key, next));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, dw, dh);
    } catch {
      return;
    }
    const startTime = performance.now();
    const render = () => {
      drawScene(ctx, dw, dh, key, stateRef.current, performance.now() - startTime);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => {
      stop();
      disconnect();
    };
  }, [key, dw, dh]);

  const updateValue = (v: number) => commit({ ...stateRef.current, value: v });
  const updateMode = (mode: string) => commit({ ...stateRef.current, mode });
  const updateSel = (sel: number) => commit({ ...stateRef.current, sel });

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    if (key === 'chap-2:2.1') commit({ ...stateRef.current, x });
    if (key === 'chap-8:8.1') {
      const regions = [0.13, 0.33, 0.53, 0.73];
      let best = 0;
      regions.forEach((rx, i) => { if (Math.abs(x - rx) < Math.abs(x - regions[best])) best = i; });
      updateSel(best);
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={dw}
        height={dh}
        style={{ cursor: interaction === 'drag' || interaction === 'hotspot' ? 'pointer' : 'default', touchAction: 'none' }}
        onPointerDown={interaction === 'drag' || interaction === 'hotspot' ? onPointer : undefined}
      />

      {interaction === 'slider' && (
        <div className="ctrl">
          <label>
            {key === 'chap-1:1.1' ? '风噪强度' : key === 'chap-4:4.1' ? '编辑相似度' : '门控阈值 τ'}
            <span className="val">{key === 'chap-7:7.1' ? s.value.toFixed(2) : s.value.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={key === 'chap-7:7.1' ? 0.1 : 0}
            max={key === 'chap-7:7.1' ? 0.6 : 1}
            step={0.01}
            value={s.value}
            onChange={(e) => updateValue(Number(e.target.value))}
          />
        </div>
      )}

      {interaction === 'chips' && (
        <div className="ctrl chips">
          {(key === 'chap-5:5.1'
            ? [['sqrtf', 'Sqrt-Forward'], ['sqrtb', 'Sqrt-Backward'], ['gauss', 'Gaussian-Mid'], ['linear', 'Linear']]
            : [['route', '环境路由'], ['always', '始终鲁棒']]
          ).map(([val, label]) => (
            <button key={val} className={`chip ${s.mode === val ? 'on' : ''}`} onClick={() => updateMode(val)}>
              {label}
            </button>
          ))}
        </div>
      )}

      {interaction === 'step' && (
        <div className="ctrl">
          <button onClick={() => commit({ ...stateRef.current, step: Math.max(0, s.step - 1), started: key === 'chap-3:3.1' ? s.started : true })}>上一步</button>
          <span className="val">{(key === 'chap-3:3.1' ? (s.step + 1) : s.step + 1)} / {(key === 'chap-3:3.1' ? 2 : key === 'chap-6:6.1' ? 4 : 5)}</span>
          <button
            onClick={() => {
              const max = key === 'chap-3:3.1' ? 1 : key === 'chap-6:6.1' ? 3 : 4;
              commit({ ...stateRef.current, step: Math.min(max, s.step + 1), started: true });
            }}
            disabled={key === 'chap-3:3.1' ? s.step >= 1 : key === 'chap-6:6.1' ? s.step >= 3 : s.step >= 4}
          >
            {key === 'chap-3:3.1' ? '开始' : '下一步'}
          </button>
        </div>
      )}

      {interaction === 'race' && (
        <div className="ctrl">
          <button
            onClick={() => {
              if (s.started) return;
              commit({ ...stateRef.current, started: true, progress: 0 });
              let p = 0;
              const id = window.setInterval(() => {
                p = Math.min(1, p + 0.035);
                const cur = stateRef.current;
                commit({ ...cur, progress: p });
                if (p >= 1) window.clearInterval(id);
              }, 50);
            }}
          >
            开始对比
          </button>
        </div>
      )}

      {interaction !== 'none' && <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>}
    </div>
  );
};

export default MegaAsrScene;
