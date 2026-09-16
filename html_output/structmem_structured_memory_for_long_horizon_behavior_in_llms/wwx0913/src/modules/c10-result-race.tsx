import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import {
  COL,
  clearScene,
  drawAxisBox,
  fillRound,
  roundRect,
  drawStamp,
  label,
  legend,
} from './sceneKit';
import type { WidgetProps } from './registry';

// 模块 10.1：结果竞赛。一个共享按钮从同一条 0 基线放 12 根结果柱，chip 切换指标。
// 方法名与全部数字只出现在 Canvas 下方的 DOM 排名板；Canvas 内只有柱子、冠军奖杯、
// 2 个指标短标签与 1 个 3 项图例。

const W = 1080;
const H = 280;
const X0 = 40;
const PANEL_W = 1000;
const PANEL_Y = 40;
const PANEL_H = 200;
const BASE_Y = 240;
const MAX_H = 190;
const SLOT_W = PANEL_W / 12;
const BAR_W = 48;

const STAGGER = 90; // ms，错峰间隔
const GROW = 700; // ms，单柱缓出增长时长
const TOTAL = STAGGER * 11 + GROW;

const MAX_ACC = 80;
const MAX_TOKEN = 35.825;

type Metric = 'accuracy' | 'cost';
type Phase = 'idle' | 'racing' | 'done';

interface Row {
  name: string;
  acc: number;
  tokenM: number;
  calls: number;
  hasCost: boolean;
}

// Table 1：按综合正确率降序固定；acc 全部为 Table 1 读数（↑），
// tokenM / calls 为同一张表的构建开销读数（↓）；hasCost=false 表示论文未报告构建开销
// （OpenAI / FullContext 不产生构建开销，Zep / Memobase 未公开细节），绝不补零。
const ROWS: Row[] = [
  { name: 'StructMem', acc: 76.82, tokenM: 1.937, calls: 1056, hasCost: true },
  { name: 'Memobase', acc: 75.78, tokenM: 0, calls: 0, hasCost: false },
  { name: 'Zep', acc: 75.14, tokenM: 0, calls: 0, hasCost: false },
  { name: 'FullContext', acc: 73.83, tokenM: 0, calls: 0, hasCost: false },
  { name: 'OpenAI', acc: 71.82, tokenM: 0, calls: 0, hasCost: false },
  { name: 'LightRAG', acc: 68.83, tokenM: 11.931, calls: 13576, hasCost: true },
  { name: 'Mem0g', acc: 68.44, tokenM: 35.825, calls: 53514, hasCost: true },
  { name: 'Mem0', acc: 66.88, tokenM: 12.196, calls: 9181, hasCost: true },
  { name: 'A-Mem', acc: 64.16, tokenM: 0, calls: 0, hasCost: false },
  { name: 'MiniRAG', acc: 63.51, tokenM: 10.103, calls: 2508, hasCost: true },
  { name: 'MemoryOS', acc: 58.25, tokenM: 0, calls: 0, hasCost: false },
  { name: 'LangMem', acc: 58.1, tokenM: 0, calls: 0, hasCost: false },
];

const slotX = (i: number): number => X0 + SLOT_W * i + (SLOT_W - BAR_W) / 2;

/** 当前指标下的已验证最优（正确率取最大，构建 token 取有数据者中的最小）。 */
function leaderIndex(metric: Metric): number {
  let best = 0;
  ROWS.forEach((r: Row, i: number) => {
    const cur = ROWS[best];
    if (metric === 'accuracy') {
      if (r.acc > cur.acc) best = i;
    } else if (r.hasCost && (!cur.hasCost || r.tokenM < cur.tokenM)) {
      best = i;
    }
  });
  return best;
}

interface Feedback {
  text: string;
  cls: '' | 'good' | 'bad';
}

function feedbackFor(metric: Metric, phase: Phase): Feedback {
  if (metric === 'cost' && phase !== 'done') {
    return {
      text: '已切到构建开销：方向改为越低越好，OpenAI 与 FullContext 不产生构建开销、Zep 与 Memobase 未公开构建细节，因此这 4 个槽位只留空位不填数。',
      cls: '',
    };
  }
  if (phase === 'idle') {
    return {
      text: '按下「开始对比」，让 12 个系统从同一条 0 基线出发，在同一坐标轴上一起长大。',
      cls: '',
    };
  }
  if (phase === 'racing') {
    return {
      text: '对比进行中：所有方法共享同一条 0 基线、同一个主轴与同一套评测协议，谁也没有先跑。',
      cls: '',
    };
  }
  if (metric === 'accuracy') {
    return {
      text: '综合正确率（↑ 越高越好）：StructMem 76.82 为表内最高，Memobase 75.78、Zep 75.14 紧随其后，且三者共享同一主干与同一裁判。',
      cls: 'good',
    };
  }
  return {
    text: '构建开销（↓ 越低越好）：StructMem 构建 token 1.937M、调用 1056 次，为表内最低；但运行时间不是最低——MiniRAG 用 2566 s 比 StructMem 的 22854 s 更快，Zep 与 Memobase 未公开构建细节。',
    cls: '',
  };
}

interface RaceState {
  phase: Phase;
  metric: Metric;
  t0: number;
  progress: number;
  barGrow: number[];
}

// ① Table 2 消融（同一协议，↑ 多跳 / 开放域 / 单跳 / 时序）
const ABLATION: { l: string; v: string }[] = [
  { l: '扁平 · 多跳', v: '66.31' },
  { l: '扁平 · 开放域', v: '46.88' },
  { l: '扁平 · 单跳', v: '78.83' },
  { l: '扁平 · 时序', v: '78.50' },
  { l: '图记忆 · 多跳', v: '66.67' },
  { l: '图记忆 · 开放域', v: '48.96' },
  { l: '图记忆 · 单跳', v: '80.50' },
  { l: '图记忆 · 时序', v: '76.64' },
  { l: '去掉跨事件合并 · 多跳', v: '66.31' },
  { l: '去掉跨事件合并 · 开放域', v: '46.88' },
  { l: '去掉跨事件合并 · 单跳', v: '80.86' },
  { l: '去掉跨事件合并 · 时序', v: '79.44' },
  { l: 'StructMem · 多跳', v: '68.77' },
  { l: 'StructMem · 开放域', v: '46.88' },
  { l: 'StructMem · 单跳', v: '81.09' },
  { l: 'StructMem · 时序', v: '81.62' },
];

// ② 保真：事件级抽取幻觉率与跨事件链接错误率（GPT 裁判）
const FIDELITY: { l: string; v: string }[] = [
  { l: '事件级抽取幻觉率', v: '2.36%' },
  { l: '跨事件链接错误率 · 带约束（GPT 裁判）', v: '0.61%' },
  { l: '跨事件链接错误率 · 无约束（GPT 裁判）', v: '7.45%' },
];

// ③ 裁判稳健性
const JUDGE: { l: string; v: string }[] = [
  { l: '三裁判 Fleiss’ κ', v: '0.8341' },
  { l: '三裁判 Pearson r', v: '> 0.81' },
];

// ④ Table 8 案例（单例，非统计结论）
const CASE: { l: string; v: string }[] = [
  { l: '扁平记忆回答', v: '没一起去过' },
  { l: '图记忆回答', v: '2023 年 6 月' },
  { l: 'StructMem 回答', v: '2022 年 8 月' },
  { l: '参考答案', v: '2022' },
];

// 两个相关机制面板（只读）
const MECHANISM: { l: string; v: string }[] = [
  { l: '扁平检索平台化', v: '60 条' },
  { l: 'K = 0 回到平台（Fig 3(d) 读图值）', v: '约 75.71' },
];

export const C10ResultRace: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<RaceState>({
    phase: 'idle',
    metric: 'accuracy',
    t0: 0,
    progress: 0,
    barGrow: ROWS.map(() => 0),
  });
  const [metric, setMetric] = useState<Metric>('accuracy');
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const render = (t: number) => {
      const s = stateRef.current;
      const cur = s.metric;

      if (s.phase === 'racing') {
        const elapsed = t - s.t0;
        s.progress = clamp(elapsed / TOTAL, 0, 1);
        const next: number[] = [];
        for (let i = 0; i < ROWS.length; i += 1) {
          const local = (elapsed - i * STAGGER) / GROW;
          next.push(local <= 0 ? 0 : easeOutCubic(clamp(local, 0, 1)));
        }
        s.barGrow = next;
        if (s.progress >= 1) {
          s.phase = 'done';
          setPhase('done');
        }
      }

      const max = cur === 'accuracy' ? MAX_ACC : MAX_TOKEN;
      const champ = leaderIndex(cur);

      clearScene(ctx, W, H, true);
      drawAxisBox(ctx, X0, PANEL_Y, PANEL_W, PANEL_H);

      // 12 根柱子共享的同一条 0 基线
      ctx.fillStyle = COL.route;
      ctx.fillRect(X0, BASE_Y - 1, PANEL_W, 2);

      for (let i = 0; i < ROWS.length; i += 1) {
        const row = ROWS[i];
        const hasData = cur === 'accuracy' || row.hasCost;
        const bx = slotX(i);
        if (!hasData) {
          // 论文未报告构建开销：只留 #d7deea 空槽，不放任何数字
          roundRect(ctx, bx, BASE_Y - MAX_H, BAR_W, MAX_H, 4);
          ctx.strokeStyle = COL.axis;
          ctx.lineWidth = 1;
          ctx.stroke();
          continue;
        }
        const v = cur === 'accuracy' ? row.acc : row.tokenM;
        const h = s.barGrow[i] * (v / max) * MAX_H;
        if (h < 2) {
          ctx.fillStyle = COL.axis;
          ctx.fillRect(bx, BASE_Y - 2, BAR_W, 2);
          continue;
        }
        fillRound(ctx, bx, BASE_Y - h, BAR_W, h, 4, i === champ ? COL.green : COL.blue);
      }

      // 奖杯只出现在 done 状态的正确率指标下（开销模式不出奖杯）
      if (s.phase === 'done' && cur === 'accuracy') {
        const topY = BASE_Y - (ROWS[champ].acc / MAX_ACC) * MAX_H;
        const cx = slotX(champ) + BAR_W / 2;
        roundRect(ctx, cx - 13, topY - 20, 8, 9, 3);
        ctx.strokeStyle = COL.green;
        ctx.lineWidth = 1;
        ctx.stroke();
        roundRect(ctx, cx + 5, topY - 20, 8, 9, 3);
        ctx.stroke();
        drawStamp(ctx, cx, topY - 15, 9, COL.green, true);
        fillRound(ctx, cx - 2, topY - 8, 4, 6, 1, COL.green);
        fillRound(ctx, cx - 9, topY - 3, 18, 3, 1, COL.green);
      }

      label(ctx, '综合正确率', 48, 28, cur === 'accuracy' ? COL.orange : COL.muted);
      label(ctx, '构建开销', 200, 28, cur === 'cost' ? COL.orange : COL.muted);
      // 唯一图例（3 项），叠在柱顶之上方的空白带里，不与任何柱子重叠
      legend(
        ctx,
        [
          { c: COL.green, t: '冠军' },
          { c: COL.blue, t: '对照' },
          { c: COL.axis, t: '无数据' },
        ],
        700,
        26
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(performance.now());
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const startRace = () => {
    const s = stateRef.current;
    s.barGrow = ROWS.map(() => 0);
    s.progress = 0;
    s.t0 = performance.now();
    s.phase = 'racing';
    setPhase('racing');
  };

  const pickMetric = (m: Metric) => {
    stateRef.current.metric = m;
    setMetric(m);
  };

  const feedback = feedbackFor(metric, phase);
  const champName = ROWS[leaderIndex(metric)].name;

  const board =
    phase === 'idle'
      ? ROWS
      : metric === 'accuracy'
      ? [...ROWS].sort((a: Row, b: Row) => b.acc - a.acc)
      : [...ROWS].sort((a: Row, b: Row) => {
          if (a.hasCost !== b.hasCost) return a.hasCost ? -1 : 1;
          if (!a.hasCost) return 0;
          return a.tokenM - b.tokenM;
        });

  const boardNote =
    metric === 'accuracy'
      ? '方法排名板 · 综合正确率（↑ 越高越好；当前指标下已验证最优的方法以「最高」标注）。'
      : '方法排名板 · 构建 token / 调用次数（↓ 越低越好；论文未报告构建开销的方法显示「未公开」，不补零、不比较）。';

  const valueOf = (r: Row): string => {
    if (phase === 'idle') return '—';
    if (metric === 'accuracy') return r.acc.toFixed(2);
    return r.hasCost ? `${r.tokenM.toFixed(3)}M / ${r.calls}` : '未公开';
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className="tiny" type="button" onClick={startRace}>
          {phase === 'done' ? '重新对比' : '开始对比'}
        </button>
        <button
          className={`chip ${metric === 'accuracy' ? 'selected' : ''}`}
          type="button"
          onClick={() => pickMetric('accuracy')}
        >
          综合正确率
        </button>
        <button
          className={`chip ${metric === 'cost' ? 'selected' : ''}`}
          type="button"
          onClick={() => pickMetric('cost')}
        >
          构建 token / 调用次数
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>

      <p>{boardNote}</p>
      <div className="metrics">
        {board.map((r: Row) => (
          <div className="metric" key={r.name}>
            <div className="l">
              {r.name}
              {phase !== 'idle' && r.name === champName ? ' · 最高' : ''}
            </div>
            <div className="v">{valueOf(r)}</div>
          </div>
        ))}
      </div>

      <p>
        ① 消融（Table 2，同一协议，↑ 多跳 / 开放域 / 单跳 /
        时序）：加图记忆会在时序题上退步（76.64 低于扁平记忆的 78.50）；StructMem 在四类任务上都优于扁平记忆，
        但不能升级为“每一类都最高”——开放域四者同为 46.88。
      </p>
      <div className="metrics">
        {ABLATION.map((m: { l: string; v: string }) => (
          <div className="metric" key={m.l}>
            <div className="l">{m.l}</div>
            <div className="v">{m.v}</div>
          </div>
        ))}
      </div>

      <p>
        ② 保真（Table 6 / Table 7）：事件级抽取的平均幻觉率为 2.36%（三裁判、给定源对话段）；跨事件链接错误率在
        带约束的合成下为 0.61%、无约束时为 7.45%，两者都取自 <b>GPT 裁判</b>——不同裁判（Qwen / DeepSeek）
        的数值不可混用，带约束的合成是默认设置。
      </p>
      <div className="metrics">
        {FIDELITY.map((m: { l: string; v: string }) => (
          <div className="metric" key={m.l}>
            <div className="l">{m.l}</div>
            <div className="v">{m.v}</div>
          </div>
        ))}
      </div>

      <p>
        ③ 裁判稳健性（Tables 4–5）：三裁判之间的 Fleiss’ κ = 0.8341、Pearson r &gt; 0.81，说明机器裁判标签本身稳定；
        但机器裁判不等于人工评测，它只保证同一协议内的排序可比。
      </p>
      <div className="metrics">
        {JUDGE.map((m: { l: string; v: string }) => (
          <div className="metric" key={m.l}>
            <div className="l">{m.l}</div>
            <div className="v">{m.v}</div>
          </div>
        ))}
      </div>

      <p>
        ④ 案例与局限（Table 8、p.6 Limitations）：同一个问题下，扁平记忆答“没一起去过”、图记忆答
        “2023 年 6 月”，只有 StructMem 的合成记忆给出“2022 年 8 月”并命中参考的 2022——这是<b>单个示例</b>，
        不是统计结论。论文自述两点局限：抽取质量<b>强依赖提示设计</b>，以及缺少<b>冲突消解与记忆更新/衰减</b>机制。
      </p>
      <div className="metrics">
        {CASE.map((m: { l: string; v: string }) => (
          <div className="metric" key={m.l}>
            <div className="l">{m.l}</div>
            <div className="v">{m.v}</div>
          </div>
        ))}
      </div>

      <p>
        两个相关机制（只读）：扁平检索在约 60 条达到峰值后进入平台，继续加条目不再提升；语义种子数 K = 0 时性能
        回到扁平检索平台（Figure 3(d) 读图值约 75.71），K &gt; 0 后随跨事件合成上升。
      </p>
      <div className="metrics">
        {MECHANISM.map((m: { l: string; v: string }) => (
          <div className="metric" key={m.l}>
            <div className="l">{m.l}</div>
            <div className="v">{m.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default C10ResultRace;
