import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, bar, clearScene, drawDesk, drawFlow, drawLabel, fillRR, startLoop, strokeRR } from './journalKit';

const W = 560;
const H = 360;
type View = 'commit' | 'table5' | 'table6' | 'table7';
const STEPS = [
  { title: '候选经验', sub: '工具反馈中发现潜在复用价值', color: C.orange },
  { title: '执行验证', sub: '排除猜测、失败分支和一次性状态', color: C.blue },
  { title: '分类提交', sub: '稳定事实→L2；可复用流程→L3', color: C.green },
  { title: '更新 L1', sub: '只记录新知识类别的存在与入口', color: C.purple },
];

export const ModMemoryCommit: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ view: View; step: number }>({ view: 'commit', step: 0 });
  const [view, setView] = useState<View>('commit');
  const [step, setStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx, now) => {
      const state = stateRef.current;
      clearScene(ctx, W, H);
      drawDesk(ctx, W, H);

      if (state.view === 'commit') {
        drawLabel(ctx, '触发式长期提交：只有验证信息才能晋升', 24, 34, C.text, 15);
        STEPS.forEach((item, i) => {
          const x = 16 + i * 136;
          const on = i === state.step;
          const done = i < state.step;
          fillRR(ctx, x, 76, 116, 86, 9, on ? item.color : '#fffef8');
          strokeRR(ctx, x, 76, 116, 86, 9, done ? C.green : on ? C.orange : C.axis, on ? 3 : 1.5);
          drawLabel(ctx, item.title, x + 14, 107, on ? '#fff' : done ? C.green : C.text, 12);
          drawLabel(ctx, i === 0 ? 'raw/L4' : i === 1 ? 'verify' : i === 2 ? 'L2/L3' : 'L1 index', x + 14, 136, on ? '#eef6ff' : C.muted, 10);
          if (i < 3) drawFlow(ctx, { x: x + 116, y: 119 }, { x: x + 136, y: 119 }, now, done ? C.green : C.axis, done ? 3 : 1.8, 4);
        });
        fillRR(ctx, 36, 208, 488, 82, 9, '#fffef8');
        strokeRR(ctx, 36, 208, 488, 82, 9, STEPS[state.step].color, 2.5);
        drawLabel(ctx, STEPS[state.step].title, 56, 238, STEPS[state.step].color, 13);
        drawLabel(ctx, STEPS[state.step].sub, 56, 265, C.muted, 11);
        drawLabel(ctx, '不变量：L1 只在出现真正新类别时增长，深层内容扩张不会线性放大常驻提示。', 56, 318, C.blue, 11);
      } else if (state.view === 'table5') {
        drawLabel(ctx, 'Table 5 · SOP-Bench dangerous_goods · GPT-5.4', 24, 34, C.text, 14);
        const rows = [
          { label: 'No Memory', token: 0, tsr: 13.87, color: C.red },
          { label: 'Full Memory', token: 575, tsr: 52.44, color: C.blue },
          { label: 'Redundant', token: 288, tsr: 66.48, color: C.orange },
          { label: 'Condensed', token: 165, tsr: 66.48, color: C.green },
        ];
        rows.forEach((row, i) => {
          const y = 70 + i * 58;
          drawLabel(ctx, row.label, 24, y + 13, row.color, 11);
          bar(ctx, 130, y, 170, 14, row.token / 575, C.blue);
          drawLabel(ctx, `${row.token} tok`, 306, y + 12, C.muted, 10);
          bar(ctx, 368, y, 140, 14, row.tsr / 70, row.color);
          drawLabel(ctx, `${row.tsr}%`, 512, y + 12, row.color, 10);
        });
        drawLabel(ctx, '165-token 浓缩记忆与 288-token 冗余记忆同为 66.48% TSR；背景套话没有增加行为价值。', 34, 324, C.green, 11);
      } else if (state.view === 'table6') {
        drawLabel(ctx, 'Table 6 · LoCoMo 首个子集（移除 Category 5）· GPT-5.4', 24, 34, C.text, 14);
        const rows = [
          { label: 'Multi-Hop', f1: 43.33, bleu: 39.96 },
          { label: 'Temporal', f1: 52.23, bleu: 51.11 },
          { label: 'Open-Domain', f1: 20.41, bleu: 15.31 },
          { label: 'Single-Hop', f1: 45.69, bleu: 40.66 },
        ];
        drawLabel(ctx, 'GA', 196, 66, C.green, 12);
        drawLabel(ctx, 'F1', 300, 66, C.blue, 11);
        drawLabel(ctx, 'BLEU-1', 430, 66, C.purple, 11);
        rows.forEach((row, i) => {
          const y = 88 + i * 54;
          drawLabel(ctx, row.label, 26, y + 13, C.text, 11);
          bar(ctx, 160, y, 180, 14, row.f1 / 60, C.blue);
          drawLabel(ctx, row.f1.toFixed(2), 348, y + 12, C.blue, 10);
          bar(ctx, 400, y, 100, 14, row.bleu / 60, C.purple);
          drawLabel(ctx, row.bleu.toFixed(2), 506, y + 12, C.purple, 10);
        });
        drawLabel(ctx, '论文报告 GA 在四类任务的 F1 与 BLEU-1 均为表中最高，且不使用额外向量数据库。', 44, 324, C.green, 11);
      } else {
        drawLabel(ctx, 'Table 7 · 安装同一组 20 个技能并高强度使用后，以 “Hello” 测 Full prompt', 24, 34, C.text, 13);
        const rows = [
          { label: 'OpenClaw', value: 43321, color: C.red },
          { label: 'CodeX', value: 23932, color: C.orange },
          { label: 'Claude Code', value: 22821, color: C.blue },
          { label: 'GA', value: 2298, color: C.green },
        ];
        rows.forEach((row, i) => {
          const y = 78 + i * 56;
          drawLabel(ctx, row.label, 28, y + 14, row.color, 12);
          bar(ctx, 140, y, 330, 18, row.value / 43321, row.color);
          drawLabel(ctx, row.value.toLocaleString(), 482, y + 14, row.color, 11);
        });
        drawLabel(ctx, '分层检索把空闲技能隔离在活动提示之外：GA Full prompt 为 2,298 token。', 62, 324, C.green, 11);
      }
    });
  }, []);

  const setActiveView = (next: View) => {
    stateRef.current.view = next;
    setView(next);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${view === 'commit' ? 'selected' : ''}`} onClick={() => setActiveView('commit')}>写入流程</button>
        <button className={`chip ${view === 'table5' ? 'selected' : ''}`} onClick={() => setActiveView('table5')}>浓缩消融</button>
        <button className={`chip ${view === 'table6' ? 'selected' : ''}`} onClick={() => setActiveView('table6')}>事实记忆</button>
        <button className={`chip ${view === 'table7' ? 'selected' : ''}`} onClick={() => setActiveView('table7')}>上下文防爆</button>
      </div>
      {view === 'commit' ? (
        <div className="ctrl">
          <button className="chip" onClick={() => { const value = Math.max(0, stateRef.current.step - 1); stateRef.current.step = value; setStep(value); }}>上一步</button>
          <button className="chip selected" disabled={step === STEPS.length - 1} onClick={() => { const value = Math.min(3, stateRef.current.step + 1); stateRef.current.step = value; setStep(value); }}>下一步</button>
          <span className="val">{step + 1} / 4</span>
        </div>
      ) : null}
      <div className={`feedback ${view !== 'commit' || step >= 2 ? 'good' : ''}`}>
        {view === 'commit'
          ? step === 0
            ? '候选信息仍只属于原始轨迹，不能自动污染长期记忆。'
            : step === 1
              ? '“No Execution, No Memory”：成功工具执行是晋升事实或流程的验证门槛。'
              : step === 2
                ? '按语义分流：稳定事实进入 L2，可复用操作过程进入 L3。'
                : 'L1 只增加新类别的极短入口；正文继续留在深层文件。'
          : view === 'table5'
            ? '消融显示：有用的不是更长记忆，而是只保留会改变行为的高密度规则。'
            : view === 'table6'
              ? '该结果支持分层组织能够服务长期事实回忆与多跳推理，但只在论文给定 LoCoMo 设置内成立。'
              : 'Table 7 直接测量长期技能扩张后的常驻提示规模，说明按需检索能防止记忆线性灌入。'}
      </div>
    </div>
  );
};
