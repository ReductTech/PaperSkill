import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawDeck,
  drawLabel,
  drawLegend,
  drawLevelMeter,
  drawSignalPath,
  useCanvas,
  clamp,
} from '../lib/consoleKit';

// §5 module — 图片因果掩码（image-causal masking）
// 行 = 14 个文本 token，列 = 插在第 2、6、11 个 token 之后的三张图。
// 一个主导操作：点击某个文本 token 或某张图的热点移动选择；
// 芯片在「只看最近一张」与「允许看全部」两种规则间切换。

const W = 1080;
const H = 280;
const TOKENS = 14;
const IMAGES = [2, 6, 11];

const TOKEN_X0 = 60;
const TOKEN_X1 = 1020;
const TOKEN_Y = 70;
const TOKEN_STEP = (TOKEN_X1 - TOKEN_X0) / (TOKENS - 1);

const MX0 = 40;
const MY0 = 150;
const MW = 480;
const MH = 96;
const ROW_H = MH / TOKENS;
const COL_W = MW / 3;

const tokenX = (i: number): number => TOKEN_X0 + (i - 1) * TOKEN_STEP;
/** 图片插在第 p 个 token 之后，画在两个 token 中间。 */
const imageX = (p: number): number => TOKEN_X0 + (p - 0.5) * TOKEN_STEP;
const colCenterX = (c: number): number => MX0 + c * COL_W + COL_W / 2;
const rowCenterY = (r: number): number => MY0 + (r - 1) * ROW_H + ROW_H / 2;

/** 论文的 φ：该位置之前最近一张图的索引（没有图片时为 0）。 */
const lastImageFor = (sel: number): number => IMAGES.filter((i) => i < sel).pop() ?? 0;

/**
 * 该文本位置可以交叉注意的图。latest 规则严格使用 φ（只保留最近一张）；
 * all 对照规则把当前这一位置之前的图都算进来，因此额外允许的图会用紫色标出。
 */
const visibleFor = (r: number, rule: 'latest' | 'all'): number[] =>
  IMAGES.filter((i) => (rule === 'latest' ? i === lastImageFor(r) : i <= r));

type Rule = 'latest' | 'all';
type ModState = { sel: number; rule: Rule };
type ModUi = { sel: number; rule: Rule };

function feedbackFor(sel: number, rule: Rule): { text: string; cls: string } {
  const lastImage = lastImageFor(sel);
  if (rule === 'all') {
    return {
      text: '允许看全部之前的图：可见范围更大，但论文的消融显示这种方案更差，而且扩展到更多图片时更昂贵。',
      cls: 'bad',
    };
  }
  if (lastImage === 0) {
    return {
      text: '这个位置的文字还没有出现过图片，因此不交叉注意任何视觉 token。',
      cls: '',
    };
  }
  return {
    text: `第 ${sel} 个 token 只注意第 ${lastImage} 张图；更早的图仍能通过自注意力间接影响结果。`,
    cls: '',
  };
}

export const Ch5Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef<ModState>({ sel: 6, rule: 'latest' });
  const [ui, setUi] = useState<ModUi>({ sel: 6, rule: 'latest' });

  const applySel = (next: number): void => {
    const v = Math.round(clamp(next, 1, TOKENS));
    stateRef.current.sel = v;
    setUi((u) => ({ ...u, sel: v }));
  };
  const applyRule = (rule: Rule): void => {
    stateRef.current.rule = rule;
    setUi((u) => ({ ...u, rule }));
  };

  const { ref, ready } = useCanvas<ModState>(
    (ctx, _time, s) => {
      clearScene(ctx, W, H);
      const sel = s.sel;
      const rule = s.rule;
      const lastImage = lastImageFor(sel);
      const visible = visibleFor(sel, rule);

      // ---- 文本 token 条 ----
      ctx.beginPath();
      ctx.moveTo(TOKEN_X0 - 16, TOKEN_Y);
      ctx.lineTo(TOKEN_X1 + 16, TOKEN_Y);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = COLORS.axis;
      ctx.stroke();

      for (let i = 1; i <= TOKENS; i += 1) {
        const isSel = i === sel;
        ctx.beginPath();
        ctx.arc(tokenX(i), TOKEN_Y, isSel ? 8 : 5, 0, Math.PI * 2);
        ctx.fillStyle = isSel ? COLORS.fader : COLORS.route;
        ctx.fill();
        if (isSel) {
          ctx.beginPath();
          ctx.arc(tokenX(i), TOKEN_Y, 15, 0, Math.PI * 2);
          ctx.lineWidth = 3;
          ctx.strokeStyle = COLORS.fader;
          ctx.stroke();
        }
      }

      // 图片方块（用唱盘表示一帧视觉输入）
      IMAGES.forEach((p, c) => {
        const isVisible = visible.indexOf(p) >= 0;
        const isLatest = p === lastImage;
        drawDeck(ctx, imageX(p), TOKEN_Y, 16, {
          spin: 0,
          frozen: false,
          accent: isLatest ? COLORS.route : isVisible ? COLORS.aux : COLORS.fader,
        });
        if (isVisible) {
          ctx.beginPath();
          ctx.arc(imageX(p), TOKEN_Y, 21, 0, Math.PI * 2);
          ctx.lineWidth = 3;
          ctx.strokeStyle = isLatest ? COLORS.route : COLORS.aux;
          ctx.stroke();
        }
        // 引导线：图片 -> 矩阵中它对应的列
        drawSignalPath(
          ctx,
          [
            [imageX(p), TOKEN_Y + 22],
            [colCenterX(c), MY0 - 12],
          ],
          { active: isLatest, dashed: true }
        );
      });

      // 选中 token 到矩阵行的引导线
      drawSignalPath(
        ctx,
        [
          [tokenX(sel), TOKEN_Y + 22],
          [tokenX(sel), MY0 - 2],
        ],
        { active: true, dashed: true }
      );

      // ---- 注意力可见矩阵 ----
      ctx.beginPath();
      ctx.rect(MX0 - 4, MY0 + (sel - 1) * ROW_H - 1, MW + 8, ROW_H + 2);
      ctx.fillStyle = COLORS.fader;
      ctx.globalAlpha = 0.22;
      ctx.fill();
      ctx.globalAlpha = 1;

      for (let r = 1; r <= TOKENS; r += 1) {
        const rowVisible = visibleFor(r, rule);
        for (let c = 0; c < 3; c += 1) {
          const p = IMAGES[c];
          const vis = rowVisible.indexOf(p) >= 0;
          const isLatest = vis && p === lastImageFor(r);
          const x = MX0 + c * COL_W;
          const y = MY0 + (r - 1) * ROW_H;
          ctx.beginPath();
          ctx.rect(x + 1, y + 1, COL_W - 2, ROW_H - 2);
          if (vis) {
            ctx.fillStyle = isLatest ? COLORS.route : COLORS.aux;
            ctx.globalAlpha = isLatest ? 0.34 : 0.26;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.lineWidth = 2;
            ctx.strokeStyle = isLatest ? COLORS.route : COLORS.aux;
          } else {
            ctx.fillStyle = COLORS.axis;
            ctx.globalAlpha = 0.28;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = COLORS.axis;
          }
          ctx.stroke();
        }
      }

      // 选中行的橙色描边（位置 + 颜色两个线索）
      ctx.beginPath();
      ctx.rect(MX0 - 4, MY0 + (sel - 1) * ROW_H - 1, MW + 8, ROW_H + 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = COLORS.fader;
      ctx.stroke();

      // 列标题：三张图所在的 token 位置
      IMAGES.forEach((p, c) => {
        drawLabel(ctx, String(p), colCenterX(c), MY0 - 16, {
          color: COLORS.muted,
          size: 13,
          align: 'center',
        });
      });

      // ---- 可见图数 ----
      const count = visible.length;
      drawLevelMeter(ctx, 620, 176, 360, 30, count / 3, { direction: 'up' });
      if (rule === 'all') {
        ctx.beginPath();
        ctx.rect(620, 176, 360, 30);
        ctx.lineWidth = 3;
        ctx.strokeStyle = COLORS.bad;
        ctx.stroke();
      }
      drawLabel(ctx, `${count}/3`, 1030, 200, { color: COLORS.ink, size: 15, align: 'right' });

      // ---- 标签与图例 ----
      drawLabel(ctx, '文本 token', MX0, 30, { color: COLORS.ink, size: 15 });
      drawLabel(ctx, '可见矩阵', MX0, 128, { color: COLORS.ink, size: 15 });
      drawLegend(ctx, MX0, 268, [
        { color: COLORS.route, text: '最近一张' },
        { color: COLORS.aux, text: '额外允许' },
        { color: COLORS.fader, text: '选中' },
      ]);
    },
    W,
    H,
    stateRef
  );

  // 热点命中检测：按 CSS 缩放比例换算回内在坐标
  const onCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>): void => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * W) / rect.width;
    const y = ((event.clientY - rect.top) * H) / rect.height;

    // 图片热点：选中紧跟在它后面的那个文本位置
    for (const p of IMAGES) {
      if (Math.abs(x - imageX(p)) <= 22 && Math.abs(y - TOKEN_Y) <= 24) {
        applySel(Math.min(p + 1, TOKENS));
        return;
      }
    }
    // 文本 token 热点
    if (y >= 36 && y <= 106) {
      applySel(Math.round((x - TOKEN_X0) / TOKEN_STEP) + 1);
      return;
    }
    // 矩阵行热点
    if (x >= MX0 && x <= MX0 + MW && y >= MY0 && y <= MY0 + MH) {
      applySel(Math.floor((y - MY0) / ROW_H) + 1);
    }
  };

  const fb = feedbackFor(ui.sel, ui.rule);
  const visibleCount = visibleFor(ui.sel, ui.rule).length;

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        onClick={onCanvasClick}
        aria-label={ready ? '注意力可见矩阵，点击文本 token 或图片热点' : '加载中'}
      />
      <div className="ctrl">
        <div className="chip-row">
          <button
            type="button"
            className={`chip${ui.rule === 'latest' ? ' selected' : ''}`}
            onClick={() => applyRule('latest')}
          >
            只看最近一张
          </button>
          <button
            type="button"
            className={`chip${ui.rule === 'all' ? ' selected' : ''}`}
            onClick={() => applyRule('all')}
          >
            允许看全部
          </button>
        </div>
        <span className="step-label">
          选中 token <b>{ui.sel}</b>
        </span>
        <span className="step-label">
          最近一张图 <b>{lastImageFor(ui.sel)}</b>
        </span>
        <span className="step-label">
          可见图 <b>{visibleCount}</b>
        </span>
        <button
          type="button"
          className="tiny ghost"
          onClick={() => applySel(ui.sel - 1)}
          disabled={ui.sel <= 1}
        >
          上一个 token
        </button>
        <button
          type="button"
          className="tiny ghost"
          onClick={() => applySel(ui.sel + 1)}
          disabled={ui.sel >= TOKENS}
        >
          下一个 token
        </button>
        {IMAGES.map((p) => (
          <button
            key={p}
            type="button"
            className="tiny ghost"
            onClick={() => applySel(Math.min(p + 1, TOKENS))}
          >
            第 {p} 张图
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch5Mod1;
