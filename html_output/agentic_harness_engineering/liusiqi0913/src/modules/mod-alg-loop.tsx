import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// mod-alg-loop — Algorithm 1：AHE 外层循环（第二章 2.4，伪代码步进器）
// 左列中文伪代码（当前行高亮）+ 右侧六阶段环图（当前阶段高亮 + 产物芯片）
// + 底部说明条；「下一步」手动逐行推进，t≥2 演示归因裁决。无自动播放、无循环动画。

const W = 1080;
const H = 600;

const C = {
  bg: '#f4f6f8',
  panel: '#ffffff',
  border: '#d7deea',
  text: '#21324a',
  muted: '#68778f',
  steel: '#475569',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
};

// 伪代码行（高亮索引 → 行号）
const CODE_LINES = [
  '输入：H₀ · M · D · k · N',
  'H_best ← H₀',
  'for t = 1 … N',
  '  ① T_t ← 试运行(M, H_{t-1}, D, k)',
  '  ② T_t ← 清洗(T_t)',
  '  ③ t≥2：归因(C_{t-1},T_{t-1},T_t)+回滚',
  '  ④ R_t ← 分层蒸馏(T_t)',
  '  ⑤ (H_t, C_t) ← 编辑 + 写清单',
  '  ⑥ 提交(H_t, C_t, 标签 t)',
  '  若 pass@1 更高：H_best ← H_t',
  'return H_best（N 轮后）',
];

// 步序列：init → ①..⑥ → hbest →（t+1）①...
const STEPS = ['init', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'hb'] as const;
type Step = (typeof STEPS)[number];
const STEP_LINE: Record<Step, number> = { init: 1, p1: 3, p2: 4, p3: 5, p4: 6, p5: 7, p6: 8, hb: 9 };

// 环图节点（①②③ 上排，⑥⑤④ 下排，顺时针）
const RING: { step: Step; label: string; x: number; y: number }[] = [
  { step: 'p1', label: '① 试运行', x: 480, y: 70 },
  { step: 'p2', label: '② 清洗', x: 690, y: 70 },
  { step: 'p3', label: '③ 归因+回滚', x: 900, y: 70 },
  { step: 'p4', label: '④ 分层蒸馏', x: 900, y: 300 },
  { step: 'p5', label: '⑤ 编辑+写清单', x: 690, y: 300 },
  { step: 'p6', label: '⑥ 提交', x: 480, y: 300 },
];
const NODE = { w: 140, h: 54 };
const ARTIFACT: Record<string, string> = {
  p1: 'T_t 原始轨迹',
  p2: 'T_t 清洗后',
  p3: 'V_t 裁决',
  p4: 'R_t 证据语料',
  p5: 'H_t + C_t',
  p6: 'git 标签 t',
};

const EXPLAIN: Record<Step, string[]> = {
  init: [
    '初始化：H_best ← H₀（种子起点 69.7%）。',
    '侧注：one-shot 探索智能体与第 1 轮并行，播种少量可复用技能——之后无特殊保护，可被保留、改进或删除。',
  ],
  p1: [
    '① 试运行：用当前 harness 对基准每任务跑 k=2 次。',
    'k=2 让每个任务携带通过率信号——稳定 pass@1，部分通过的任务锚定对比诊断。',
  ],
  p2: ['② 清洗：去除 base64、去重工具输出。', '给后续蒸馏减负，同时保留可导航的消息文件。'],
  p3: [
    '③ 归因 + 回滚：上轮清单的预测集 ∩ 本轮实际 delta → 逐条裁决。',
    '归因先于蒸馏：裁决落入证据语料，旧清单成为契约而非辩白；未兑现编辑按文件粒度回滚。',
  ],
  p4: [
    '④ 分层蒸馏：Agent Debugger 把 ~10M token 轨迹压成 ~10K 证据语料。',
    '基准总览 → 单任务报告 → 原始轨迹，渐进式披露。',
  ],
  p5: [
    '⑤ 演化编辑：只写工作区，并写下新清单。',
    '清单附失败证据、根因、针对性修复、预测修复集 + 风险集。',
  ],
  p6: ['⑥ 提交：git 打标签固定本轮。', '文件级 diff 与回滚由此免费获得。'],
  hb: [
    'H_best 更新：仅当本轮 pass@1 更高才替换。',
    'N 轮后 return H_best——交付实测最佳（69.7% → 77.0%），而非最后一轮。',
  ],
};

export const ModAlgLoop: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ t: 1, pos: 0 }); // pos = STEPS 下标
  const [t, setT] = useState(1);
  const [pos, setPos] = useState(0);

  const applyPos = (nt: number, npos: number) => {
    stateRef.current.t = nt;
    stateRef.current.pos = npos;
    setT(nt);
    setPos(npos);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let mountTs = 0;

    const arrowHead = (x: number, y: number, angle: number, size: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - size * Math.cos(angle - 0.42), y - size * Math.sin(angle - 0.42));
      ctx.lineTo(x - size * Math.cos(angle + 0.42), y - size * Math.sin(angle + 0.42));
      ctx.closePath();
      ctx.fill();
    };

    const render = (now: number) => {
      if (!mountTs) mountTs = now;
      const enter = now - mountTs;
      const aIn = (order: number) => clamp((enter - order * 150) / 300, 0, 1);
      const st = stateRef.current;
      const step = STEPS[st.pos];

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // ===== 左列：伪代码面板 =====
      ctx.save();
      ctx.globalAlpha = aIn(0);
      ctx.beginPath();
      ctx.roundRect(30, 40, 410, 440, 10);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = C.border;
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.font = 'bold 13px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Algorithm 1 · AHE 外层循环', 48, 66);

      const curLine = STEP_LINE[step];
      CODE_LINES.forEach((line, i) => {
        const ly = 100 + i * 33;
        if (i === curLine) {
          ctx.beginPath();
          ctx.roundRect(42, ly - 17, 386, 26, 6);
          ctx.fillStyle = lerpColor(C.blue, '#ffffff', 0.84);
          ctx.fill();
        }
        ctx.fillStyle = i === curLine ? C.blue : i === 2 || i === 10 ? C.muted : C.text;
        ctx.font = `${i === curLine ? 'bold ' : ''}12.5px "Consolas", "Segoe UI", "PingFang SC", monospace`;
        ctx.fillText(line, 52, ly);
      });
      // 行号小标注：for 与 return 行的补充
      ctx.fillStyle = C.muted;
      ctx.font = '10.5px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText('每轮六个阶段，先兑现旧契约，再签新契约', 52, 100 + 11 * 33);
      ctx.restore();

      // ===== 右侧：六阶段环图 =====
      ctx.save();
      ctx.globalAlpha = aIn(1);
      // 环边箭头
      ctx.strokeStyle = C.steel;
      ctx.lineWidth = 1.8;
      const edge = (x1: number, y1: number, x2: number, y2: number, angle: number) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        arrowHead(x2, y2, angle, 6, C.steel);
      };
      edge(624, 97, 686, 97, 0); // ①→②
      edge(834, 97, 896, 97, 0); // ②→③
      edge(970, 128, 970, 292, Math.PI / 2); // ③→④
      edge(896, 327, 834, 327, Math.PI); // ④→⑤
      edge(686, 327, 624, 327, Math.PI); // ⑤→⑥
      edge(550, 292, 550, 128, -Math.PI / 2); // ⑥→①

      // 中心卡：第 t 轮 + H_best
      ctx.beginPath();
      ctx.roundRect(615, 160, 290, 110, 10);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = step === 'hb' ? C.green : C.border;
      ctx.stroke();
      ctx.fillStyle = C.text;
      ctx.font = 'bold 16px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`第 ${st.t} 轮`, 760, 194);
      ctx.fillStyle = step === 'hb' ? C.green : C.muted;
      ctx.font = `${step === 'hb' ? 'bold ' : ''}12px "Segoe UI", "PingFang SC", sans-serif`;
      ctx.fillText(
        step === 'hb' ? '比较 pass@1：更高 → H_best ← H_t' : 'H_best：实测最佳工作区',
        760,
        220
      );
      ctx.fillStyle = C.muted;
      ctx.font = '10.5px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText('N 轮后 return H_best（69.7% → 77.0%）', 760, 244);

      // 阶段节点 + 产物芯片
      RING.forEach((n) => {
        const isActive = step === n.step;
        const isDone = st.pos > STEPS.indexOf(n.step) && st.pos <= STEPS.indexOf('hb');
        const color = n.step === 'p3' && st.t >= 2 ? C.orange : C.blue;
        ctx.beginPath();
        ctx.roundRect(n.x, n.y, NODE.w, NODE.h, 10);
        ctx.fillStyle = isActive ? lerpColor(color, '#ffffff', 0.8) : isDone ? lerpColor(C.green, '#ffffff', 0.9) : C.panel;
        ctx.fill();
        ctx.lineWidth = isActive ? 3 : 1.8;
        ctx.strokeStyle = isActive ? color : isDone ? C.green : C.border;
        ctx.stroke();
        ctx.fillStyle = isActive || isDone ? C.text : C.muted;
        ctx.font = `${isActive ? 'bold ' : ''}13px "Segoe UI", "PingFang SC", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x + NODE.w / 2, n.y + 31);
        // 产物芯片（阶段完成后出现）
        if (isDone) {
          const cy = n.y < 200 ? n.y + NODE.h + 8 : n.y - 26;
          ctx.beginPath();
          ctx.roundRect(n.x + 8, cy, NODE.w - 16, 20, 10);
          ctx.fillStyle = lerpColor(C.green, '#ffffff', 0.75);
          ctx.fill();
          ctx.fillStyle = C.text;
          ctx.font = '10.5px "Segoe UI", "PingFang SC", sans-serif';
          ctx.fillText(ARTIFACT[n.step], n.x + NODE.w / 2, cy + 14);
        }
      });

      // ③ t=1 跳过提示 / t≥2 裁决演示
      if (step === 'p3' && st.t === 1) {
        ctx.fillStyle = C.muted;
        ctx.font = 'bold 11.5px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('t=1 跳过：V_t = ∅', 970, 142);
      }
      if (st.t >= 2 && st.pos >= STEPS.indexOf('p3')) {
        // 两条示意清单条目
        const vx = 900;
        ctx.beginPath();
        ctx.roundRect(vx - 10, 132, 160, 24, 6);
        ctx.fillStyle = lerpColor(C.green, '#ffffff', 0.82);
        ctx.fill();
        ctx.fillStyle = C.green;
        ctx.font = '10.5px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('兑现 → 保留（示意）', vx + 70, 148);
        ctx.beginPath();
        ctx.roundRect(vx - 10, 162, 160, 24, 6);
        ctx.fillStyle = lerpColor(C.red, '#ffffff', 0.85);
        ctx.fill();
        ctx.fillStyle = C.red;
        ctx.fillText('未兑现 → 回滚（示意）', vx + 70, 178);
      }
      ctx.restore();

      // ===== 底部说明条 =====
      ctx.save();
      ctx.globalAlpha = aIn(2);
      ctx.beginPath();
      ctx.roundRect(30, 496, 1020, 76, 8);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = C.border;
      ctx.stroke();
      const lines = step === 'p3' && st.t === 1
        ? ['③ t=1 跳过：没有上一轮清单，V_t = ∅。', '从 t=2 起，这里先兑现旧契约，再签新契约。']
        : EXPLAIN[step];
      ctx.fillStyle = C.text;
      ctx.font = '13px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(lines[0], 52, 528);
      if (lines[1]) {
        ctx.fillStyle = C.muted;
        ctx.fillText(lines[1], 52, 554);
      }
      ctx.restore();
    };

    const tick = (now: number) => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const nextStep = () => {
    const { t, pos } = stateRef.current;
    if (pos >= STEPS.length - 1) {
      applyPos(t + 1, 1); // 下一轮从 ① 开始
    } else {
      applyPos(t, pos + 1);
    }
  };

  const replay = () => {
    applyPos(1, 0);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'default' }}
      />
      <div className="ctrl">
        <div className="step-ctrl">
          <button type="button" className="tiny" onClick={nextStep}>
            下一步
          </button>
          <button type="button" className="tiny ghost" onClick={replay}>
            重新推演
          </button>
        </div>
      </div>
      <div className="feedback">
        当前：第 {t} 轮 ·{' '}
        {pos === 0
          ? '初始化'
          : pos >= STEPS.length - 1
            ? 'H_best 判定（再点进入下一轮）'
            : `阶段 ${STEPS[pos].slice(1)} / 6`}
      </div>
    </div>
  );
};

export default ModAlgLoop;
