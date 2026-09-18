import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// mod-comp-obs — 组件可观测性（第二章 2.1）
// A 区：七类正交组件如何解耦（点击文件卡 → 右侧解释面板）；
// B 区：种子 H₀ 刻意极简（chip 切换 极简/预装 对比，体现归因污染）；
// 画布下方 DOM 三张优势卡。静态，无循环动画。

const W = 1080;
const H = 500;

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
};

// ---------- A 区：七类组件 ----------
const COMPS = [
  { name: '系统提示词', desc: '行为总则与策略写在这一层——风格与策略类失败在此修复。' },
  { name: '工具描述', desc: '模型选择工具的依据——选错工具、漏用工具时修改此层。' },
  { name: '工具实现', desc: '直接控制工具行为——需要执行期强制（如守卫、超时）时修改此层。' },
  { name: '中间件', desc: '挂在智能体循环上的钩子，在执行层拦截与改写——跨步行为问题在此修复。' },
  { name: '技能', desc: '沉淀可复用流程——同类任务反复从头摸索时，在此层补一条技能。' },
  { name: '子智能体配置', desc: '定义分工与上下文隔离——主循环被子任务拖住时调整此层。' },
  { name: '长期记忆', desc: '跨任务的经验仓库——同样的坑反复踩时，把教训写入此层。' },
];

const WS = { x: 30, y: 64, w: 500, h: 240 };
const CARD = { w: 225, h: 42, xs: [46, 287], ys: [100, 150, 200, 250] };
const PANEL = { x: 560, y: 64, w: 490, h: 240 };

// ---------- B 区：种子 H₀ ----------
const SLOT = { y: 368, w: 130, h: 52, gap: 15 };
const SLOT_LABELS = ['提示词', '工具描述', '工具实现', '中间件', '技能', '子智能体', '记忆'];
const SEED_FILLED = 2; // 仅"工具实现"= 单个 shell 执行工具

export const ModCompObs: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ sel: 0, preloaded: false });
  const [preloaded, setPreloaded] = useState(false);

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

    const render = (now: number) => {
      if (!mountTs) mountTs = now;
      const enter = now - mountTs;
      const aIn = (order: number) => clamp((enter - order * 150) / 300, 0, 1);
      const st = stateRef.current;

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // ===== A 区：如何解耦 =====
      ctx.save();
      ctx.globalAlpha = aIn(0);
      ctx.fillStyle = C.muted;
      ctx.font = 'bold 12px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('如何解耦：七类正交组件各为独立文件、固定挂载点，类别间无交叉依赖', 30, 24);
      ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText('——加中间件不动提示词，加技能不碰工具。点击文件卡查看各类职责。', 30, 46);

      // workspace 面板
      ctx.beginPath();
      ctx.roundRect(WS.x, WS.y, WS.w, WS.h, 10);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = C.border;
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.font = 'bold 12px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText('一个 workspace · 固定挂载点', WS.x + 16, WS.y + 22);

      COMPS.forEach((comp, i) => {
        const cx = CARD.xs[i % 2];
        const cy = CARD.ys[Math.floor(i / 2)];
        const selected = st.sel === i;
        ctx.beginPath();
        ctx.roundRect(cx, cy, CARD.w, CARD.h, 8);
        ctx.fillStyle = selected ? lerpColor(C.blue, '#ffffff', 0.86) : C.bg;
        ctx.fill();
        ctx.lineWidth = selected ? 3 : 1.5;
        ctx.strokeStyle = selected ? C.blue : C.border;
        ctx.stroke();
        // 文档小图标
        ctx.strokeStyle = selected ? C.blue : C.steel;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(cx + 12, cy + 10, 14, 20, 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 16, cy + 16);
        ctx.lineTo(cx + 22, cy + 16);
        ctx.moveTo(cx + 16, cy + 21);
        ctx.lineTo(cx + 22, cy + 21);
        ctx.stroke();
        ctx.fillStyle = C.text;
        ctx.font = 'bold 12.5px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(comp.name, cx + 36, cy + 26);
      });
      // 第 7 张卡右侧的留白处放注记
      ctx.fillStyle = C.muted;
      ctx.font = '11px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText('每类一个文件', CARD.xs[1], CARD.ys[3] + 17);
      ctx.fillText('编辑互不外溢', CARD.xs[1], CARD.ys[3] + 34);

      // 右侧解释面板
      {
        const comp = COMPS[st.sel];
        ctx.beginPath();
        ctx.roundRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 10);
        ctx.fillStyle = C.panel;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = C.border;
        ctx.stroke();
        ctx.fillStyle = C.blue;
        ctx.font = 'bold 15px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(comp.name, PANEL.x + 20, PANEL.y + 30);
        ctx.fillStyle = C.text;
        ctx.font = '13px "Segoe UI", "PingFang SC", sans-serif';
        // 手动两行
        const desc = comp.desc;
        const splitAt = desc.indexOf('——');
        if (splitAt > 0) {
          ctx.fillText(desc.slice(0, splitAt), PANEL.x + 20, PANEL.y + 56);
          ctx.fillText(desc.slice(splitAt), PANEL.x + 20, PANEL.y + 78);
        } else {
          ctx.fillText(desc, PANEL.x + 20, PANEL.y + 56);
        }
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PANEL.x + 16, PANEL.y + 100);
        ctx.lineTo(PANEL.x + PANEL.w - 16, PANEL.y + 100);
        ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
        ctx.fillText('松散耦合：新增或修改本类组件，不需要改动其他类别。', PANEL.x + 20, PANEL.y + 124);
        ctx.fillText('失败映射：这一类的失败模式，都定位到这一个文件。', PANEL.x + 20, PANEL.y + 146);
        ctx.fillStyle = C.green;
        ctx.font = 'bold 12px "Segoe UI", "PingFang SC", sans-serif';
        ctx.fillText('一次逻辑编辑 = 一次 git commit → 文件级 diff 与回滚。', PANEL.x + 20, PANEL.y + 176);
      }
      ctx.restore();

      // A/B 分隔线
      ctx.save();
      ctx.globalAlpha = aIn(1) * 0.7;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, 322);
      ctx.lineTo(1050, 322);
      ctx.stroke();
      ctx.restore();

      // ===== B 区：种子 H₀ =====
      ctx.save();
      ctx.globalAlpha = aIn(1);
      ctx.fillStyle = C.muted;
      ctx.font = 'bold 12px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('种子 harness H₀：刻意极简', 30, 344);

      SLOT_LABELS.forEach((label, i) => {
        const sx = 40 + i * (SLOT.w + SLOT.gap);
        const filled = st.preloaded || i === SEED_FILLED;
        ctx.beginPath();
        ctx.roundRect(sx, SLOT.y, SLOT.w, SLOT.h, 8);
        if (filled) {
          const color = st.preloaded ? C.red : C.green;
          ctx.fillStyle = lerpColor(color, '#ffffff', 0.88);
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = color;
          ctx.setLineDash([]);
        } else {
          ctx.fillStyle = C.panel;
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = C.border;
          ctx.setLineDash([5, 4]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = filled ? C.text : C.muted;
        ctx.font = `${filled ? 'bold ' : ''}12px "Segoe UI", "PingFang SC", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(label, sx + SLOT.w / 2, SLOT.y + 24);
        ctx.font = '10.5px "Segoe UI", "PingFang SC", sans-serif';
        if (i === SEED_FILLED) {
          ctx.fillStyle = C.green;
          ctx.fillText('单个 shell 执行工具', sx + SLOT.w / 2, SLOT.y + 41);
        } else if (!filled) {
          ctx.fillStyle = C.muted;
          ctx.fillText('留空', sx + SLOT.w / 2, SLOT.y + 41);
        } else {
          ctx.fillStyle = C.red;
          ctx.fillText('预装', sx + SLOT.w / 2, SLOT.y + 41);
        }
      });

      // 状态结论文
      ctx.textAlign = 'center';
      ctx.font = 'bold 13.5px "Segoe UI", "PingFang SC", sans-serif';
      if (st.preloaded) {
        ctx.fillStyle = C.red;
        ctx.fillText('增益无法归因——分不清提升来自演化循环还是种子本身。', W / 2, 456);
      } else {
        ctx.fillStyle = C.green;
        ctx.fillText('其余六类全部留空：AHE 添加的每个组件，都必须凭实测试运行赢得位置。', W / 2, 456);
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

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    for (let i = 0; i < COMPS.length; i++) {
      const cx = CARD.xs[i % 2];
      const cy = CARD.ys[Math.floor(i / 2)];
      if (x >= cx && x <= cx + CARD.w && y >= cy && y <= cy + CARD.h) {
        stateRef.current.sel = i;
        return;
      }
    }
  };

  const toggleSeed = (p: boolean) => {
    stateRef.current.preloaded = p;
    setPreloaded(p);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'pointer' }}
        onClick={onCanvasClick}
      />
      <div className="ctrl">
        <div className="chip-row" style={{ marginBottom: 0 }}>
          <button
            type="button"
            className={`chip${!preloaded ? ' selected' : ''}`}
            onClick={() => toggleSeed(false)}
          >
            极简 H₀（论文采用）
          </button>
          <button
            type="button"
            className={`chip${preloaded ? ' selected' : ''}`}
            onClick={() => toggleSeed(true)}
          >
            预装组件的 H₀（反例）
          </button>
        </div>
      </div>
      <div className="mod-adv-row">
        <div className="mod-adv-card">
          <div className="mod-adv-title">失败模式 → 单一组件类</div>
          <div className="mod-adv-desc">每类失败都定位到一个文件，pass@1 变化不再散落在数百行提示词散文里。</div>
        </div>
        <div className="mod-adv-card">
          <div className="mod-adv-title">编辑即 commit</div>
          <div className="mod-adv-desc">一次逻辑编辑 = 一次 git 提交，文件级 diff 与回滚粒度免费获得。</div>
        </div>
        <div className="mod-adv-card">
          <div className="mod-adv-title">动作空间干净</div>
          <div className="mod-adv-desc">演化智能体面对七个明确挂载点，知道「能改什么、改在哪」。</div>
        </div>
      </div>
    </div>
  );
};

export default ModCompObs;
