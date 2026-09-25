import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, drawLegend, drawSceneLabel, INK, LINE, MUTED, OK } from './woodKit';
import type { WidgetProps } from './registry';

// Module 9.1 (1080x280) —— benchmark 导览：先看尺子，再看分数。
// 8 个 chips，一个 benchmark 一个；画布上用三条共享的归一化轴画出当前基准的
// 动作维度 / 示教条数 / 单次评估步数（OK 高亮 + 裸数字），并把其余 7 个基准
// 画成同一轴上的 LINE 参考刻度，右侧三分之一是固定布局的属性面板。
// 画布上的每一个数字都是论文报告过的值：仿真部分是 Table 3（p7），真机部分
// 是第 6–7 节；论文没有给出可比数值的项不画数字，只画一个「—」。

const W = 1080;
const H = 280;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

const AX0 = 152;
const AX1 = 686;
const ROW_Y = [92, 152, 212];

const PX = 720;
const PY = 40;
const PW = 336;
const PH = 192;

type BenchId =
  | 'robomimic'
  | 'pusht'
  | 'blockpush'
  | 'kitchen'
  | 'realpusht'
  | 'sauce'
  | 'mug'
  | 'bimanual';

type MetricKey = 'dim' | 'demos' | 'steps';

/** 一个基准在某一项上的取值；lo === hi 表示只有一个数，lo < hi 表示它本身是一个区间。 */
interface Cell {
  lo: number;
  hi: number;
}

interface BenchDef {
  chip: string;
  name: string;
  scene: string;
  input: string;
  precision: string;
  dim: Cell | null;
  demos: Cell | null;
  steps: Cell | null;
  feedback: string;
}

const METRICS: { key: MetricKey; title: string }[] = [
  { key: 'dim', title: '动作维度' },
  { key: 'demos', title: '示教条数' },
  { key: 'steps', title: '单次评估步数' },
];

const ORDER: BenchId[] = [
  'robomimic',
  'pusht',
  'blockpush',
  'kitchen',
  'realpusht',
  'sauce',
  'mug',
  'bimanual',
];

const BENCHES: Record<BenchId, BenchDef> = {
  robomimic: {
    chip: 'Robomimic',
    name: '离线模仿学习',
    scene: '仿真',
    input: '状态与图像',
    precision: '部分',
    dim: { lo: 7, hi: 14 },
    demos: { lo: 200, hi: 300 },
    steps: { lo: 400, hi: 700 },
    feedback:
      'Robomimic 是一个大规模离线模仿学习基准，5 个任务、9 个变体，同时报告状态输入和图像输入的结果。图上的区间正是它的任务差异：动作维度 7 到 14 维（只有 Transport 是 14）、示教 200 到 300 条（ph 200 条、mh 300 条）、单次评估 400 到 700 步（Lift 与 Can 与 Square 是 400 步）。',
  },
  pusht: {
    chip: 'Push-T',
    name: '推 T 形块',
    scene: '仿真',
    input: '图像或关键点',
    precision: '高精度',
    dim: { lo: 2, hi: 2 },
    demos: { lo: 200, hi: 200 },
    steps: { lo: 300, hi: 300 },
    feedback:
      'Push-T 要求把 T 形块推到固定目标区，接触丰富；它的指标是目标区域覆盖率 IoU，不是成功率。它的动作维度只有 2 维，示教 200 条、单次评估 300 步——和 Robomimic 的 7 维不是同一套口径。',
  },
  blockpush: {
    chip: 'Block Push',
    name: '双块推入',
    scene: '仿真',
    input: '仅状态',
    precision: '常规',
    dim: { lo: 2, hi: 2 },
    demos: { lo: 0, hi: 0 },
    steps: { lo: 350, hi: 350 },
    feedback:
      'Block Push 要求把两个方块按任意顺序推入两个方格，专门用来测长程多模态。示教条数一栏是 0 而不是漏记：它的示教来自能读真值状态的脚本 oracle，表里自然没有人类示教；动作维度 2 维，单次评估 350 步。',
  },
  kitchen: {
    chip: 'Kitchen',
    name: '厨房多任务',
    scene: '仿真',
    input: '仅状态',
    precision: '常规',
    dim: { lo: 9, hi: 9 },
    demos: { lo: 656, hi: 656 },
    steps: { lo: 280, hi: 280 },
    feedback:
      'Kitchen 有 7 个物体、566 条人类示教，每条按任意顺序完成 4 个子任务。Table 3 的示教条数一栏记的是 656 条，图上按 Table 3 画；动作维度 9 维，单次评估 280 步。',
  },
  realpusht: {
    chip: '真机 Push-T',
    name: '真机推 T',
    scene: '真机',
    input: '图像',
    precision: '高精度',
    dim: null,
    demos: { lo: 136, hi: 136 },
    steps: { lo: 600, hi: 600 },
    feedback:
      '真机 Push-T 是多阶段任务，成功率按末态 IoU 是否超过示教数据集里的最小 IoU 判定——注意是最后一步的 IoU，不是全程最大值。它用 136 条示教、600 步预算；论文的真机部分没有单列它的动作维度，所以这一行不画数值。',
  },
  sauce: {
    chip: '倒酱与涂抹',
    name: '倒酱与涂抹',
    scene: '真机',
    input: '图像',
    precision: '常规',
    dim: { lo: 6, hi: 6 },
    demos: { lo: 50, hi: 50 },
    steps: { lo: 600, hi: 600 },
    feedback:
      '倒酱汁与涂抹在 Franka 上各采了 50 条示教、其中 90% 用于训练，单次评估 600 步。倒酱汁按倒出的酱汁与中心圆的 IoU 计分、涂抹按覆盖率计分，两者都是把相机图像投影到桌面算出来的，而且对象是非刚体，动作空间是 6 自由度。',
  },
  mug: {
    chip: '翻杯子',
    name: '翻杯子',
    scene: '真机',
    input: '图像',
    precision: '常规',
    dim: { lo: 7, hi: 7 },
    demos: { lo: 250, hi: 250 },
    steps: { lo: 600, hi: 600 },
    feedback:
      '翻杯子要把随机摆放的杯子重新定向到杯口朝下、把手朝左，250 条示教、600 步预算、动作维度 7 维。它的示教集高度多模态——抓取与推倒两种做法、正手与反手两种握法都有——而且旋转逼近运动学极限。',
  },
  bimanual: {
    chip: '双臂任务',
    name: '双臂任务',
    scene: '真机',
    input: '图像×4',
    precision: '常规',
    dim: null,
    demos: { lo: 162, hi: 284 },
    steps: null,
    feedback:
      '三个双臂任务共用一台 Franka：打蛋器 210 条示教、铺垫子 162 条、叠衬衫 284 条，各评估 20 次。示教条数因此是一个区间；它的动作空间是两个末端位姿加两个夹爪宽度，不是单臂那条 7 维的口径，所以动作维度与步数这两行不画数值。',
  },
};

const SCALE: Record<MetricKey, { min: number; max: number }> = (() => {
  const acc: Record<MetricKey, { min: number; max: number }> = {
    dim: { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
    demos: { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
    steps: { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
  };
  for (const id of ORDER) {
    const def = BENCHES[id];
    for (const m of METRICS) {
      const c = def[m.key];
      if (!c) continue;
      acc[m.key].min = Math.min(acc[m.key].min, c.lo);
      acc[m.key].max = Math.max(acc[m.key].max, c.hi);
    }
  }
  return acc;
})();

const xOf = (key: MetricKey, v: number): number => {
  const sc = SCALE[key];
  return AX0 + ((v - sc.min) / (sc.max - sc.min || 1)) * (AX1 - AX0);
};

export const MBench: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{ sel: BenchId }>({ sel: 'robomimic' });
  const [sel, setSel] = useState<BenchId>('robomimic');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { sel: BenchId }) => {
      const def = BENCHES[s.sel];
      clearScene(ctx, W, H);

      for (let r = 0; r < METRICS.length; r += 1) {
        const key = METRICS[r].key;
        const y = ROW_Y[r];
        const sc = SCALE[key];

        // 行名（轴标题）
        ctx.font = '13px ' + FONT;
        ctx.textAlign = 'right';
        ctx.fillStyle = MUTED;
        ctx.fillText(METRICS[r].title, AX0 - 16, y + 5);

        // 轴线与两端的刻度值
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(AX0 + 0.5, y + 0.5);
        ctx.lineTo(AX1 + 0.5, y + 0.5);
        ctx.moveTo(AX0 + 0.5, y - 4.5);
        ctx.lineTo(AX0 + 0.5, y + 4.5);
        ctx.moveTo(AX1 + 0.5, y - 4.5);
        ctx.lineTo(AX1 + 0.5, y + 4.5);
        ctx.stroke();
        ctx.font = '11px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillStyle = MUTED;
        ctx.fillText(String(sc.min), AX0, y + 18);
        ctx.fillText(String(sc.max), AX1, y + 18);

        // 其余 7 个基准：同一根轴上的淡色参考刻度
        ctx.strokeStyle = LINE;
        ctx.fillStyle = LINE;
        for (const id of ORDER) {
          if (id === s.sel) continue;
          const c = BENCHES[id][key];
          if (!c) continue;
          const xl = xOf(key, c.lo);
          const xh = xOf(key, c.hi);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(xl, y);
          ctx.lineTo(xh, y);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(xl, y, 3.5, 0, Math.PI * 2);
          ctx.fill();
          if (xh - xl > 1) {
            ctx.beginPath();
            ctx.arc(xh, y, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 当前基准：OK 高亮 + 裸数字
        const c = def[key];
        ctx.font = '13px ' + FONT;
        ctx.textAlign = 'center';
        if (!c) {
          ctx.fillStyle = MUTED;
          ctx.fillText('—', AX0, y - 11);
          continue;
        }
        const xl = xOf(key, c.lo);
        const xh = xOf(key, c.hi);
        ctx.strokeStyle = OK;
        ctx.fillStyle = OK;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(xl, y);
        ctx.lineTo(xh, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(xl, y, 5.5, 0, Math.PI * 2);
        ctx.fill();
        if (xh - xl > 1) {
          ctx.beginPath();
          ctx.arc(xh, y, 5.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillText(c.lo === c.hi ? String(c.lo) : c.lo + '–' + c.hi, (xl + xh) / 2, y - 12);
      }

      // 右侧固定属性面板：只放短 token，布局不随选择变化
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(PX, PY, PW, PH);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(PX + 0.75, PY + 0.75, PW - 1.5, PH - 1.5);
      const TOKEN_KEYS = ['场景', '输入', '精度'];
      const TOKEN_VALUES = [def.scene, def.input, def.precision];
      for (let i = 0; i < TOKEN_KEYS.length; i += 1) {
        const ty = PY + 44 + i * 56;
        ctx.font = '13px ' + FONT;
        ctx.textAlign = 'left';
        ctx.fillStyle = MUTED;
        ctx.fillText(TOKEN_KEYS[i], PX + 26, ty);
        ctx.font = '17px ' + FONT;
        ctx.fillStyle = INK;
        ctx.fillText(TOKEN_VALUES[i], PX + 26, ty + 30);
        if (i < TOKEN_KEYS.length - 1) {
          ctx.strokeStyle = LINE;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(PX + 26, ty + 44.5);
          ctx.lineTo(PX + PW - 26, ty + 44.5);
          ctx.stroke();
        }
      }

      drawSceneLabel(ctx, def.name, 24, 32, OK);
      drawLegend(
        ctx,
        [
          { color: OK, text: '当前基准' },
          { color: LINE, text: '其他基准' },
        ],
        300,
        28
      );
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (id: BenchId) => {
    stateRef.current.sel = id;
    setSel(id);
  };

  // 这里没有对错之分：每个 benchmark 都是合法选择，所以反馈条保持中性配色。
  const fbCls: '' | 'good' | 'bad' = '';

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {ORDER.map((id) => (
          <button
            key={id}
            className={'chip' + (sel === id ? ' selected' : '')}
            onClick={() => pick(id)}
          >
            {BENCHES[id].chip}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <label>
          数值来源 <span className="val">Table 3（p7）</span>
        </label>
        <label>
          真机数值 <span className="val">第 6–7 节</span>
        </label>
        <label>
          未报告的不画 <span className="val">—</span>
        </label>
      </div>
      <div className={'feedback ' + fbCls}>{BENCHES[sel].feedback}</div>
    </div>
  );
};

export default MBench;
