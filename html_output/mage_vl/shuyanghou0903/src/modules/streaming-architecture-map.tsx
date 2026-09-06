import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { MATCH_BEATS, drawLabSurface } from './match-story';
import { LabPlayback, StageRail } from './lab-controls';
import { useAutoplayOnce } from './use-autoplay-once';
import {
  MVL,
  drawCommentator,
  drawHeatCells,
  drawMic,
  drawPitch,
  drawSceneLabel,
  roundRect,
  useCanvasSurface,
} from './football-analogy';

type Path = 'perception' | 'decision' | 'generation';
type NodeId = 'video' | 'vit' | 'epfe' | 'memory' | 'gate' | 'output' | 'local' | 'qwen';
type Point = [number, number];

const PATH_META: Record<Path, { label: string; color: string; note: string }> = {
  perception: { label: '感知更新', color: MVL.blue, note: '每个新片段都会更新感知记忆' },
  decision: { label: '门控决策', color: MVL.purple, note: 'Gate 读取当前状态，判断是否触发' },
  generation: { label: '局部生成', color: MVL.green, note: '只有 SPEAK 后，最近 N 段才进入 Qwen' },
};

const NODES: Record<NodeId, { label: string; sub: string; text: string; tone: Path }> = {
  video: { label: '视频片段', sub: '稀疏视觉证据', tone: 'perception', text: '最新视频段先经过 codec-native patch selection，形成当前视觉输入。' },
  vit: { label: 'Mage-ViT', sub: '视觉编码', tone: 'perception', text: 'Mage-ViT 编码保留下来的视觉 token，并继续携带原时空坐标。' },
  epfe: { label: 'EPFE', sub: '当前状态 + 上轮记忆', tone: 'perception', text: 'EPFE 把当前片段与上一轮感知记忆融合，产生新的流式状态。' },
  memory: { label: 'M_per', sub: '递归感知记忆', tone: 'perception', text: 'M_per 保存视频流的递归摘要，供下一轮 EPFE 和 Cognition Gate 使用；它不直接送入语言解码器。' },
  gate: { label: 'Cognition Gate', sub: '现在要不要说？', tone: 'decision', text: 'Cognition Gate 读取当前流式状态，决定继续 SILENT 还是转入 SPEAK。' },
  output: { label: 'SILENT / SPEAK', sub: '门控判定', tone: 'decision', text: 'SILENT 时继续观察；只有 SPEAK 才允许下方语言生成路径工作。' },
  local: { label: 'Local N-window', sub: '最近 N=3 段', tone: 'generation', text: '触发 SPEAK 后，语言模型只接收最近 3 段（本例 6–8）的局部窗口。' },
  qwen: { label: 'Qwen Decoder', sub: '生成回答', tone: 'generation', text: 'Qwen 在 SPEAK 后读取 Local N-window 并生成回答，而不是读取完整的 M_per 历史。' },
};

const POS: Record<NodeId, [number, number, number, number]> = {
  video: [28, 74, 202, 112],
  vit: [268, 94, 108, 58],
  epfe: [416, 94, 112, 58],
  gate: [572, 94, 126, 58],
  output: [738, 94, 116, 58],
  memory: [410, 194, 124, 64],
  local: [568, 292, 132, 62],
  qwen: [730, 292, 124, 62],
};

const NODE_ORDER = Object.keys(NODES) as NodeId[];

function port(id: NodeId, side: 'left' | 'right' | 'top' | 'bottom'): Point {
  const [x, y, width, height] = POS[id];
  if (side === 'left') return [x, y + height / 2];
  if (side === 'right') return [x + width, y + height / 2];
  if (side === 'top') return [x + width / 2, y];
  return [x + width / 2, y + height];
}

function drawPath(ctx: CanvasRenderingContext2D, points: Point[], color: string, active: boolean, dashed = false) {
  const stroke = active ? color : '#d9e1ec';
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.fillStyle = stroke;
  ctx.lineWidth = active ? 3 : 1.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.beginPath();
  points.forEach(([x, y], index) => index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
  ctx.stroke();
  ctx.setLineDash([]);
  const [x2, y2] = points[points.length - 1];
  const [x1, y1] = points[points.length - 2];
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 8 * Math.cos(angle - Math.PI / 6), y2 - 8 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 8 * Math.cos(angle + Math.PI / 6), y2 - 8 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawNode(ctx: CanvasRenderingContext2D, id: NodeId, selected: boolean, active: boolean, disabled = false) {
  const [x, y, width, height] = POS[id];
  const color = PATH_META[NODES[id].tone].color;
  ctx.save();
  roundRect(ctx, x, y, width, height, 9);
  ctx.fillStyle = disabled ? '#f5f7fa' : active ? `${color}14` : MVL.white;
  ctx.fill();
  ctx.strokeStyle = disabled ? '#dfe4ed' : selected ? color : active ? `${color}aa` : MVL.line;
  ctx.lineWidth = selected ? 2.5 : active ? 2 : 1;
  ctx.stroke();
  ctx.globalAlpha = disabled ? .46 : 1;
  ctx.fillStyle = active ? color : '#65738b';
  ctx.beginPath();
  ctx.arc(x + 14, y + 15, active ? 5 : 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = MVL.ink;
  ctx.font = '800 13px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(NODES[id].label, x + width / 2, y + 28);
  ctx.fillStyle = MVL.muted;
  ctx.font = '11px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.fillText(NODES[id].sub, x + width / 2, y + 45);
  ctx.restore();
}

function drawMemoryPulse(ctx: CanvasRenderingContext2D, progress: number, active: boolean) {
  const [x, y, , height] = POS.memory;
  const cx = x + 16;
  const cy = y + height / 2;
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(124,58,237,.16)';
  ctx.beginPath();
  ctx.arc(cx, cy, 10, -Math.PI / 2, Math.PI * 1.5);
  ctx.stroke();
  ctx.strokeStyle = active ? MVL.purple : 'rgba(124,58,237,.55)';
  ctx.beginPath();
  ctx.arc(cx, cy, 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
  ctx.stroke();
  ctx.restore();
}

export const StreamingArchitectureMap: React.FC<WidgetProps> = () => {
  const autoplay = useAutoplayOnce(24000);
  const [pinnedNode, setPinnedNode] = useState<NodeId | null>(null);
  const [pinnedPath, setPinnedPath] = useState<Path | null>(null);
  const scaled = Math.min(MATCH_BEATS.length - .001, autoplay.progress * MATCH_BEATS.length);
  const segment = Math.min(MATCH_BEATS.length - 1, Math.floor(scaled));
  const phase = scaled - segment;
  const beat = MATCH_BEATS[segment];
  const speak = segment === MATCH_BEATS.length - 1 && phase >= .72;
  const activeNode: NodeId = phase < .18 ? 'video'
    : phase < .34 ? 'vit'
      : phase < .52 ? 'epfe'
        : phase < .68 ? 'memory'
          : phase < .78 ? 'gate'
            : !speak ? 'output'
              : phase < .86 ? 'local'
                : phase < .94 ? 'qwen' : 'output';
  const stage = activeNode === 'video' ? 0 : activeNode === 'vit' ? 1 : ['epfe', 'memory'].includes(activeNode) ? 2 : ['gate', 'output'].includes(activeNode) && !speak ? 3 : 4;
  const autoPath: Path = stage === 3 ? 'decision' : stage === 4 ? 'generation' : 'perception';
  const path = pinnedPath ?? autoPath;
  const selectedNode = pinnedNode ?? activeNode;

  const ref = useCanvasSurface(880, 390, (ctx) => {
    drawLabSurface(ctx, 880, 390);
    drawSceneLabel(ctx, `视频段 ${segment + 1}/8 · ${beat.label}`, 28, 32, MVL.blue);
    drawSceneLabel(ctx, speak ? 'Gate：SPEAK' : 'Gate：SILENT', 760, 32, speak ? MVL.green : MVL.purple);

    const perceptionActive = path === 'perception';
    const decisionActive = path === 'decision';
    const generationActive = path === 'generation' && speak;

    drawPath(ctx, [port('video', 'right'), port('vit', 'left')], MVL.blue, perceptionActive && activeNode !== 'video');
    drawPath(ctx, [port('vit', 'right'), port('epfe', 'left')], MVL.blue, perceptionActive && ['epfe', 'memory', 'gate', 'output', 'local', 'qwen'].includes(activeNode));
    drawPath(ctx, [port('epfe', 'bottom'), port('memory', 'top')], MVL.blue, perceptionActive && ['memory', 'gate', 'output', 'local', 'qwen'].includes(activeNode));
    drawPath(ctx, [port('memory', 'right'), [550, 226], [550, 176], [486, 176], [486, 152]], MVL.purple, decisionActive, true);
    drawPath(ctx, [port('epfe', 'right'), port('gate', 'left')], MVL.purple, decisionActive && ['gate', 'output', 'local', 'qwen'].includes(activeNode));
    drawPath(ctx, [port('gate', 'right'), port('output', 'left')], MVL.purple, decisionActive && ['output', 'local', 'qwen'].includes(activeNode));
    drawPath(ctx, [port('output', 'bottom'), [796, 256], [634, 256], port('local', 'top')], MVL.green, generationActive);
    drawPath(ctx, [[250, 270], [540, 270], [540, 323], port('local', 'left')], MVL.green, generationActive);
    drawPath(ctx, [port('local', 'right'), port('qwen', 'left')], MVL.green, generationActive);

    const pitch = { x: 34, y: 84, width: 188, height: 94 };
    drawPitch(ctx, pitch.x, pitch.y, pitch.width, pitch.height, true);
    drawHeatCells(ctx, beat.importance, pitch, '34,141,92', .58);
    drawCommentator(ctx, pitch.x + beat.runner.x * pitch.width, pitch.y + beat.runner.y * pitch.height, 'scan', .44);
    ctx.fillStyle = MVL.white;
    ctx.strokeStyle = MVL.ink;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(pitch.x + beat.ball.x * pitch.width, pitch.y + beat.ball.y * pitch.height, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    NODE_ORDER.filter((id) => id !== 'video').forEach((id) => {
      drawNode(ctx, id, id === selectedNode, id === activeNode, NODES[id].tone === 'generation' && !speak);
    });
    drawMemoryPulse(ctx, (segment + Math.min(1, phase)) / MATCH_BEATS.length, activeNode === 'memory');

    ctx.fillStyle = MVL.muted;
    ctx.font = '700 12.5px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText('最近视频段', 34, 220);
    MATCH_BEATS.forEach((_item, index) => {
      const x = 34 + index * 27;
      const inWindow = speak && index >= MATCH_BEATS.length - 3;
      ctx.fillStyle = index <= segment ? (index === segment ? MVL.blue : '#a7b5c9') : '#e4e9f1';
      roundRect(ctx, x, 234, 20, 28, 4);
      ctx.fill();
      if (inWindow) {
        ctx.strokeStyle = MVL.green;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.fillStyle = index <= segment ? MVL.white : MVL.muted;
      ctx.font = '800 10.5px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(index + 1), x + 10, 252);
    });
    ctx.textAlign = 'left';
    drawSceneLabel(ctx, speak ? '最近 3 段进入 Local N-window' : 'SILENT：生成路径关闭', 34, 302, speak ? MVL.green : MVL.muted);
    ctx.fillStyle = MVL.muted;
    ctx.font = '700 11.5px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText('M_per 保存递归摘要，但不直接送进 Qwen', 34, 330);

    ctx.save();
    if (!speak) ctx.globalAlpha = .55;
    drawCommentator(ctx, 822, 226, speak ? 'speak' : 'scan', .55);
    drawMic(ctx, 846, 203, speak);
    ctx.restore();
    ctx.fillStyle = speak ? MVL.green : MVL.purple;
    ctx.font = '800 12.5px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(speak ? '现在开口' : '继续观察', 822, 266);
    ctx.textAlign = 'left';
  }, [segment, phase, activeNode, speak, path, selectedNode]);

  const nodeAtPointer = (clientX: number, clientY: number) => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    if (x >= POS.video[0] && x <= POS.video[0] + POS.video[2] && y >= POS.video[1] && y <= POS.video[1] + POS.video[3]) return 'video';
    return NODE_ORDER.find((id) => {
      const [left, top, width, height] = POS[id];
      return x >= left && x <= left + width && y >= top && y <= top + height;
    });
  };

  return (
    <div className="mvl-widget mvl-lab mvl-stream-lab" ref={autoplay.hostRef}>
      <StageRail labels={['视频片段', 'Mage-ViT', 'EPFE / M_per', 'Cognition Gate', 'Local Window / Qwen']} active={stage} tone="stream" />
      <div className="mvl-architecture-toolbar">
        <span className="mvl-control-label">高亮路径</span>
        <div className="mvl-path-tabs" role="group" aria-label="高亮信息路径">
          {(Object.keys(PATH_META) as Path[]).map((id) => (
            <button
              key={id}
              className={`mvl-path-tab tone-${id} ${path === id ? 'active' : ''}`}
              aria-pressed={path === id}
              onClick={() => setPinnedPath((prev) => (prev === id ? null : id))}
            >
              {PATH_META[id].label}
            </button>
          ))}
        </div>
        <span className={`mvl-path-note tone-${path}`}><i />{pinnedPath ? '已固定 · ' : '跟随播放 · '}{PATH_META[path].note}</span>
      </div>
      <div className="mvl-lab-canvas-wrap">
        <canvas
          ref={ref}
          className="mvl-lab-canvas mvl-direct-canvas mvl-architecture-canvas"
          width={880}
          height={390}
          role="application"
          tabIndex={0}
          aria-label={`Mage-VL 流式系统：第 ${segment + 1} 个视频段，当前节点 ${NODES[activeNode].label}，状态 ${speak ? 'SPEAK' : 'SILENT'}`}
          onClick={(event) => {
            const selected = nodeAtPointer(event.clientX, event.clientY);
            if (selected) setPinnedNode((current) => current === selected ? null : selected);
          }}
          onPointerMove={(event) => { event.currentTarget.style.cursor = nodeAtPointer(event.clientX, event.clientY) ? 'pointer' : 'default'; }}
          onPointerLeave={(event) => { event.currentTarget.style.cursor = 'default'; }}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            event.preventDefault();
            const current = NODE_ORDER.indexOf(selectedNode);
            const offset = event.key === 'ArrowRight' ? 1 : -1;
            setPinnedNode(NODE_ORDER[(current + offset + NODE_ORDER.length) % NODE_ORDER.length]);
          }}
        >连续视频片段更新感知记忆，Cognition Gate 决定 SILENT 或 SPEAK，Local N-window 与 Qwen 只在 SPEAK 后工作。</canvas>
      </div>
      <LabPlayback
        progress={autoplay.progress}
        playing={autoplay.playing}
        label={`流式时间 · 视频段 ${segment + 1}/8`}
        onToggle={autoplay.toggle}
        onReplay={() => { setPinnedPath(null); setPinnedNode(null); autoplay.replay(); }}
        onScrub={autoplay.setProgress}
      />
      <div className={`mvl-architecture-detail tone-${NODES[selectedNode].tone}`} aria-live="polite">
        <div className="mvl-architecture-detail-title"><span>{NODES[selectedNode].label}</span><small>{pinnedNode ? '已固定 · 再点一次恢复跟随' : NODES[selectedNode].sub}</small></div>
        <p>{NODES[selectedNode].text}</p>
      </div>
      <div className={`mvl-lab-narration ${speak ? 'good' : ''}`} aria-live="polite">
        <b>{speak ? 'SPEAK：门控允许生成' : 'SILENT：只更新感知状态'}</b>
        <span>{speak ? 'Local N-window 打开，Qwen 开始生成回答。' : `${beat.narration} 生成路径保持关闭。`}</span>
      </div>
    </div>
  );
};
