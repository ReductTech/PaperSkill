import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, bar, clearScene, drawDesk, drawLabel, fillRR, startLoop, strokeRR } from './journalKit';

const W = 560;
const H = 380;
type Representation = 'natural' | 'encoded';

function scores(retained: number, representation: Representation) {
  const t = retained / 100;
  return {
    completeness: 0.15 + 0.85 * t,
    conciseness: 1 - 0.75 * Math.max(0, (t - 0.45) / 0.55),
    naturalness: representation === 'natural' ? 0.9 : 0.35,
  };
}

export const ModTradeoff: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ retained: number; representation: Representation }>({
    retained: 60,
    representation: 'natural',
  });
  const [retained, setRetained] = useState(60);
  const [representation, setRepresentation] = useState<Representation>('natural');
  const current = scores(retained, representation);
  const feasible = current.completeness >= 0.6 && current.conciseness >= 0.6 && current.naturalness >= 0.65;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx) => {
      const state = stateRef.current;
      const value = scores(state.retained, state.representation);
      clearScene(ctx, W, H);
      drawDesk(ctx, W, H);

      const definitions = [
        {
          title: '完整性 Completeness',
          text1: '当前决策所需信息',
          text2: '必须显式存在',
          color: C.blue,
        },
        {
          title: '简洁性 Conciseness',
          text1: '删除无关与冗余',
          text2: '聚焦决策信号',
          color: C.green,
        },
        {
          title: '自然性 Naturalness',
          text1: '表示应语义可读',
          text2: '它是次要约束',
          color: C.purple,
        },
      ];
      definitions.forEach((item, i) => {
        const x = 18 + i * 180;
        fillRR(ctx, x, 18, 164, 82, 8, '#fffef8');
        strokeRR(ctx, x, 18, 164, 82, 8, item.color, 2);
        drawLabel(ctx, item.title, x + 12, 44, item.color, 12);
        drawLabel(ctx, item.text1, x + 12, 68, C.text, 11);
        drawLabel(ctx, item.text2, x + 12, 87, C.muted, 11);
      });

      drawLabel(ctx, '结构性矛盾：保留更多潜在相关细节', 28, 132, C.text, 13);
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(48, 166);
      ctx.lineTo(512, 166);
      ctx.stroke();
      ctx.fillStyle = feasible ? C.green : C.red;
      ctx.beginPath();
      ctx.arc(48 + (464 * state.retained) / 100, 166, 10, 0, Math.PI * 2);
      ctx.fill();
      drawLabel(ctx, '压缩更多：简洁↑ / 完整风险↑', 28, 194, C.muted, 11);
      drawLabel(ctx, '加入更多：完整↑ / 简洁↓', 354, 194, C.muted, 11);

      const rows = [
        { label: '完整性', value: value.completeness, color: C.blue },
        { label: '简洁性', value: value.conciseness, color: C.green },
        { label: '自然性约束', value: value.naturalness, color: C.purple },
      ];
      rows.forEach((row, i) => {
        const y = 226 + i * 42;
        drawLabel(ctx, row.label, 28, y + 14, row.color, 12);
        bar(ctx, 132, y, 320, 18, row.value, row.color);
        drawLabel(ctx, `${Math.round(row.value * 100)}%`, 468, y + 14, row.color, 12);
      });

      fillRR(ctx, 28, 348, 504, 24, 5, feasible ? '#dcfce7' : '#fee2e2');
      drawLabel(
        ctx,
        feasible
          ? '可行表示：决策信息足够、冗余受控，并且模型可以自然解读'
          : value.completeness < 0.6
            ? '失败：压缩提高了简洁性，但遗漏了当前决策所需信息'
            : value.conciseness < 0.6
              ? '失败：内容更完整，但低价值信息正在稀释决策信号'
              : '失败：表示过度编码，虽然短，但模型未必能可靠解读',
        42,
        365,
        feasible ? C.green : C.red,
        11
      );
    });
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          保留潜在相关细节 <span className="val">{retained}%</span>
        </label>
        <input
          type="range"
          min={10}
          max={100}
          value={retained}
          onChange={(event) => {
            const value = Number(event.target.value);
            stateRef.current.retained = value;
            setRetained(value);
          }}
        />
      </div>
      <div className="chip-row">
        <button
          className={`chip ${representation === 'natural' ? 'selected' : ''}`}
          onClick={() => {
            stateRef.current.representation = 'natural';
            setRepresentation('natural');
          }}
        >
          自然语言表示
        </button>
        <button
          className={`chip ${representation === 'encoded' ? 'selected' : ''}`}
          onClick={() => {
            stateRef.current.representation = 'encoded';
            setRepresentation('encoded');
          }}
        >
          过度人工编码
        </button>
      </div>
      <div className={`feedback ${feasible ? 'good' : 'bad'}`}>
        {feasible
          ? '这一区间同时满足完整性与简洁性；自然性保证该压缩表示仍能被模型可靠使用。'
          : current.completeness < 0.6
            ? '摘要越短不代表质量越高：关键约束缺失时，简洁性不能补偿完整性失败。'
            : current.conciseness < 0.6
              ? '即使窗口无限，加入更多潜在相关内容仍会削弱简洁性，因此矛盾是结构性的。'
              : '自然性不是与前两者并列的主要矛盾，而是限制哪些压缩表示真正可用。'}
      </div>
    </div>
  );
};
