import { useState } from 'react';
import { easeInOutCubic, lerp, phaseProgress } from '../animation/easing';
import { useTimeline } from '../animation/useTimeline';
import { ChipRow, Feedback, LabCanvas, LabShell } from './shared/LabChrome';
import { C, arrow, box, label } from './shared/canvasDrawing';
import type { PaperWidgetProps } from './library-scenes';

type Tenant = 'Finance' | 'Engineering' | 'Legal';

export function IngestionStampLab(_props: PaperWidgetProps) {
  const timeline = useTimeline(1_200);
  const [tenant, setTenant] = useState<Tenant>('Finance');
  const [started, setStarted] = useState(false);
  const stampProgress = easeInOutCubic(phaseProgress(timeline.progress, 0, 0.28));
  const splitProgress = easeInOutCubic(phaseProgress(timeline.progress, 0.28, 0.65));

  const selectTenant = (next: string) => {
    setTenant(next as Tenant);
    setStarted(false);
    timeline.seek(0);
  };
  const start = () => {
    setStarted(true);
    timeline.replay();
  };

  return (
    <LabShell>
      <ChipRow
        labelText="可信租户身份"
        options={['Finance', 'Engineering', 'Legal'].map((value) => ({ value, label: value }))}
        value={tenant}
        onChange={selectTenant}
      />
      <div className="step-ctrl">
        <button type="button" className="tiny" onClick={start}>{started ? '重新演示' : '写入并切分'}</button>
        <span className="step-label">owner = <b>{tenant}</b></span>
      </div>
      <LabCanvas
        height={250}
        labelText="文档先写入可信所有权，再切分并把同一所有权传播到每个 chunk"
        onOutOfView={timeline.pause}
        draw={(ctx) => {
          box(ctx, 24, 61, 136, 124, C.white, started ? C.blue : C.line, 3);
          label(ctx, '原始文档', 92, 86, C.ink, 13);
          label(ctx, '正文内容', 92, 111, C.muted, 10);
          const stampWidth = lerp(116, 104, stampProgress);
          const stampHeight = lerp(42, 30, stampProgress);
          box(ctx, 92 - stampWidth / 2, 135 - stampHeight / 2, stampWidth, stampHeight, started ? '#eef3fb' : '#f6f8fc', started ? C.blue : C.line, 2);
          label(ctx, started ? `owner: ${tenant}` : 'owner: 未写入', 92, 135, started ? C.blue : C.red, stampProgress > 0.6 ? 10 : 11);
          if (started && stampProgress > 0.75) label(ctx, '不可变元数据', 92, 166, C.green, 9);

          arrow(ctx, 169, 123, 230, 123, splitProgress > 0 ? C.blue : C.line, 3);
          box(ctx, 236, 87, 74, 72, C.white, splitProgress > 0 ? C.blue : C.line, 3);
          label(ctx, '切分', 273, 111, C.ink, 12);
          label(ctx, splitProgress > 0 ? '继承身份' : '等待', 273, 137, splitProgress > 0 ? C.green : C.muted, 10);

          const targets = [
            { x: 344, y: 55 }, { x: 442, y: 55 },
            { x: 344, y: 139 }, { x: 442, y: 139 },
          ];
          targets.forEach((target, index) => {
            const x = lerp(273, target.x, splitProgress);
            const y = lerp(123, target.y, splitProgress);
            const ownerWave = phaseProgress(timeline.progress, 0.65 + index * 0.055, 0.79 + index * 0.055);
            box(ctx, x, y, 84, 62, '#f8fafc', ownerWave >= 1 ? C.green : splitProgress > 0 ? C.blue : C.line, ownerWave >= 1 ? 3 : 2);
            label(ctx, `chunk ${index + 1}`, x + 42, y + 20, C.ink, 10);
            ctx.globalAlpha = ownerWave;
            label(ctx, tenant, x + 42, y + 43, C.blue, 10);
            ctx.globalAlpha = 1;
          });
          label(ctx, timeline.progress < 0.28 ? '① 在切分前绑定可信身份' : timeline.progress < 0.65 ? '② 文档切分为 chunk' : '③ 同一 owner 沿波纹写入每个 chunk', 280, 229, started ? C.blue : C.muted, 11);
        }}
      />
      <Feedback tone={timeline.status === 'complete' ? 'good' : started ? 'info' : 'bad'}>
        {timeline.status === 'complete'
          ? `四个 chunk 均继承同一可信 owner=${tenant}；后续 ABAC 不依赖可伪造的查询文本。`
          : started
            ? '身份先绑定到原始文档，再随切分传播；动画中的波纹表示元数据继承顺序。'
            : '未绑定 owner 的 chunk 无法进入可靠的授权判断。'}
      </Feedback>
    </LabShell>
  );
}
