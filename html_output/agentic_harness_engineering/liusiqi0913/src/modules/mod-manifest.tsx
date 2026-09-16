import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §7 module mod-manifest (P4 chips): 点击清单条目 A/B/C，查看预测修复集与下一轮实际结果，
// 用 chip 判定「保留 / 回滚」。1080x280。左侧为结构化变更清单卡（JSON 风格字段）。
const W = 1080;
const H = 280;

const BG = '#f4f6f8';
const PANEL = '#ffffff';
const TEXT = '#21324a';
const MUTED = '#68778f';
const STEEL = '#475569';
const GREEN = '#228d5c';
const RED = '#c43f52';
const BLUE = '#27446e';
const ORANGE = '#f07e47';
const PURPLE = '#7c3aed';
const BORDER = '#d7deea';

type EntryId = 'A' | 'B' | 'C';
type Verdict = 'keep' | 'rollback';

interface ManifestEntry {
  id: EntryId;
  evidence: string;
  root: string;
  fix: string;
  predicted: number[];
  risk: number[];
  tp: number[]; // 预测且修好（绿）
  fp: number[]; // 预测但未修好（橙）
  reg: number[]; // 未预见回归（紫）
  correct: Verdict;
}

const ENTRIES: ManifestEntry[] = [
  {
    id: 'A',
    evidence: '3 个任务同型失败',
    root: '工具缺输入校验',
    fix: '为工具补输入校验',
    predicted: [1, 2, 3, 4],
    risk: [9],
    tp: [1, 2, 3],
    fp: [4],
    reg: [],
    correct: 'keep',
  },
  {
    id: 'B',
    evidence: '2 个任务超时',
    root: '疑为提示词过长',
    fix: '精简系统提示词',
    predicted: [5, 6, 7],
    risk: [],
    tp: [],
    fp: [5, 6, 7],
    reg: [],
    correct: 'rollback',
  },
  {
    id: 'C',
    evidence: '2 个任务断言失败',
    root: '交付物被清理',
    fix: '锁定交付物目录',
    predicted: [8, 9],
    risk: [],
    tp: [8, 9],
    fp: [],
    reg: [11, 12],
    correct: 'keep',
  },
];

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const ModManifest: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ entry: EntryId; verdict: Verdict | null }>({
    entry: 'A',
    verdict: null,
  });
  const rafRef = useRef<number | null>(null);
  const [entry, setEntry] = useState<EntryId>('A');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [feedback, setFeedback] = useState({
    text: '先看清单条目的预测，再看右侧任务格的实际结果，然后判定：这份编辑该保留还是回滚？',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const cellColor = (e: ManifestEntry, task: number): string => {
      if (e.tp.includes(task)) return GREEN;
      if (e.fp.includes(task)) return ORANGE;
      if (e.reg.includes(task)) return PURPLE;
      return BORDER; // 无关 / 未变
    };

    const render = (now: number) => {
      const s = stateRef.current;
      const e = ENTRIES.find((en) => en.id === s.entry)!;
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // ---------- left: structured manifest card (JSON-like) ----------
      const card = { x: 26, y: 22, w: 396, h: 216 };
      ctx.fillStyle = PANEL;
      roundRect(ctx, card.x, card.y, card.w, card.h, 8);
      ctx.fill();
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 2;
      ctx.stroke();

      // header: file name
      ctx.fillStyle = TEXT;
      ctx.font = 'bold 14px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(`变更清单 ${e.id}`, card.x + 16, card.y + 24);
      ctx.fillStyle = MUTED;
      ctx.font = '11px "Consolas", "Courier New", monospace';
      ctx.textAlign = 'right';
      ctx.fillText('manifest.json', card.x + card.w - 14, card.y + 24);
      ctx.textAlign = 'left';

      // JSON-like field lines
      const mono = '12px "Consolas", "Courier New", monospace';
      let ly = card.y + 50;
      const lh = 22;
      const kx = card.x + 16; // key x
      const vx = card.x + 178; // value x
      const field = (key: string, val: string, valColor: string) => {
        ctx.font = mono;
        ctx.fillStyle = STEEL;
        ctx.fillText(`"${key}":`, kx, ly);
        ctx.fillStyle = valColor;
        ctx.fillText(val, vx, ly);
        ly += lh;
      };

      ctx.font = mono;
      ctx.fillStyle = MUTED;
      ctx.fillText('{', kx, ly);
      ly += lh;
      field('evidence', `"${e.evidence}"`, TEXT);
      field('root_cause', `"${e.root}"`, TEXT);
      field('fix', `"${e.fix}"`, TEXT);
      // predicted_fixes: blue task numbers
      ctx.font = mono;
      ctx.fillStyle = STEEL;
      ctx.fillText('"predicted_fixes":', kx, ly);
      ctx.fillStyle = BLUE;
      ctx.fillText(`[${e.predicted.join(', ')}]`, vx, ly);
      ly += lh;
      // predicted_regressions: orange task numbers (or empty)
      ctx.fillStyle = STEEL;
      ctx.fillText('"predicted_regressions":', kx, ly);
      ctx.fillStyle = e.risk.length ? ORANGE : MUTED;
      ctx.fillText(e.risk.length ? `[${e.risk.join(', ')}]` : '[]', vx, ly);
      ly += lh;
      ctx.fillStyle = MUTED;
      ctx.fillText('}', kx, ly);

      // verdict badge on the card (flat tag, bottom-right)
      if (s.verdict) {
        const good = s.verdict === 'keep';
        const bx = card.x + card.w - 96;
        const by = card.y + card.h - 38;
        ctx.fillStyle = good ? 'rgba(34,141,92,0.12)' : 'rgba(196,63,82,0.12)';
        roundRect(ctx, bx, by, 80, 26, 6);
        ctx.fill();
        ctx.strokeStyle = good ? GREEN : RED;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = good ? GREEN : RED;
        ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(good ? '保留' : '回滚', bx + 40, by + 18);
        ctx.textAlign = 'left';
      }

      // ---------- right: task grid ----------
      ctx.fillStyle = TEXT;
      ctx.font = 'bold 14px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('任务格（下一轮实际结果）', 470, 44);

      const gridX = 470;
      const gridY = 58;
      const cw = 132;
      const ch = 50;
      const gap = 10;
      for (let task = 1; task <= 12; task++) {
        const col = (task - 1) % 4;
        const row = Math.floor((task - 1) / 4);
        const x = gridX + col * (cw + gap);
        const y = gridY + row * (ch + gap);
        const color = cellColor(e, task);
        const isGrey = color === BORDER;
        ctx.fillStyle = isGrey ? 'rgba(215,222,234,0.5)' : color + '26';
        roundRect(ctx, x, y, cw, ch, 6);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = isGrey ? 1.5 : 2.5;
        ctx.stroke();
        ctx.fillStyle = isGrey ? MUTED : color;
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(task), x + cw / 2, y + ch / 2 + 4);
        // predicted marker: small blue corner tick
        if (e.predicted.includes(task)) {
          ctx.strokeStyle = BLUE;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 6, y + 6);
          ctx.lineTo(x + 16, y + 6);
          ctx.moveTo(x + 6, y + 6);
          ctx.lineTo(x + 6, y + 16);
          ctx.stroke();
        }
      }
      ctx.textAlign = 'left';

      // verdict result border around the grid
      if (s.verdict) {
        const good = s.verdict === e.correct;
        const pulse = 0.75 + 0.25 * Math.sin(now / 220);
        ctx.strokeStyle = good ? GREEN : RED;
        ctx.globalAlpha = pulse;
        ctx.lineWidth = 4;
        roundRect(ctx, gridX - 10, gridY - 10, 4 * cw + 3 * gap + 20, 3 * ch + 2 * gap + 20, 10);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // legend (4 entries)
      const legend: Array<[string, string]> = [
        ['预测且修好', GREEN],
        ['预测但未修好', ORANGE],
        ['未预测却回退', PURPLE],
        ['无关', BORDER],
      ];
      let lx = 470;
      const lyy = 250;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      legend.forEach(([name, color]) => {
        ctx.fillStyle = color === BORDER ? 'rgba(215,222,234,0.9)' : color;
        roundRect(ctx, lx, lyy - 10, 12, 12, 3);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = TEXT;
        ctx.fillText(name, lx + 18, lyy + 1);
        lx += 18 + name.length * 12 + 26;
      });
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

  const pickEntry = (id: EntryId) => {
    stateRef.current.entry = id;
    stateRef.current.verdict = null;
    setEntry(id);
    setVerdict(null);
    setFeedback({
      text: '先看清单条目的预测，再看右侧任务格的实际结果，然后判定：这份编辑该保留还是回滚？',
      cls: '',
    });
  };

  const judge = (v: Verdict) => {
    const e = ENTRIES.find((en) => en.id === stateRef.current.entry)!;
    stateRef.current.verdict = v;
    setVerdict(v);
    const good = v === e.correct;
    if (e.id === 'C' && v === 'keep') {
      setFeedback({
        text: '论文实测：修复预测约为随机 5 倍准（P=33.7%/R=51.4% vs 随机 6.5%/10.6%），但回归预测仅约 2 倍（P=11.8%/R=11.1%）——9 轮 43 条回归预测仅 5 条命中',
        cls: '',
      });
    } else if (good && v === 'keep') {
      setFeedback({
        text: '预测兑现——编辑保留，成为下一轮的新基座',
        cls: 'good',
      });
    } else if (good && v === 'rollback') {
      setFeedback({
        text: '预测落空——按文件粒度回滚，这次修改当作没发生过',
        cls: 'bad',
      });
    } else if (e.id === 'A') {
      setFeedback({
        text: '再看一眼任务格：预测修好的 4 个任务有 3 个变绿，预测基本兑现——应当保留。',
        cls: 'bad',
      });
    } else if (e.id === 'B') {
      setFeedback({
        text: '预测的 3 个任务一个都没修好——预测落空了，应当按文件粒度回滚。',
        cls: 'bad',
      });
    } else {
      setFeedback({
        text: '预测其实兑现了（任务 8、9 都变绿），应当保留——但注意两颗紫格：回归没被预见，这正是清单的盲区。',
        cls: 'bad',
      });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl" style={{ gap: 8, flexWrap: 'wrap' }}>
        <span style={{ color: '#68778f', fontSize: 13 }}>清单条目</span>
        {ENTRIES.map((e) => (
          <button
            key={e.id}
            type="button"
            className={`chip${entry === e.id ? ' on' : ''}`}
            onClick={() => pickEntry(e.id)}
          >
            条目 {e.id}
          </button>
        ))}
        <span style={{ width: 12 }} />
        <span style={{ color: '#68778f', fontSize: 13 }}>判定</span>
        <button
          type="button"
          className={`chip${verdict === 'keep' ? ' on' : ''}`}
          onClick={() => judge('keep')}
        >
          保留
        </button>
        <button
          type="button"
          className={`chip${verdict === 'rollback' ? ' on' : ''}`}
          onClick={() => judge('rollback')}
        >
          回滚
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ModManifest;
