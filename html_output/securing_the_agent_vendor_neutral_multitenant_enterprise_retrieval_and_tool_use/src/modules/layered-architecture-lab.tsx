import { lerp } from '../animation/easing';
import { TimelineControls } from '../animation/TimelineControls';
import { useTimeline } from '../animation/useTimeline';
import { Feedback, LabCanvas, LabShell } from './shared/LabChrome';
import { C, arrow, box, dot, label, roundedRect } from './shared/canvasDrawing';
import {
  ARCHITECTURE_GEOMETRY,
  ARCHITECTURE_PHASES,
  deriveArchitectureScene,
  type ArchitectureScene,
  type Point,
  type TenantCard,
} from './layered-architecture-scene';
import type { PaperWidgetProps } from './library-scenes';

const FINAL_FEEDBACK = '检索门控提供数据安全保证；服务端编排保证门控、工具授权和租户状态都不可被客户端绕过。';

function drawDashedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  stroke: string,
  dash: number[] = [7, 5],
) {
  ctx.save();
  ctx.setLineDash(dash);
  roundedRect(ctx, x, y, width, height, 7);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawQuadraticPath(
  ctx: CanvasRenderingContext2D,
  from: Point,
  control: Point,
  to: Point,
  color: string,
  width = 2,
  dashed = false,
) {
  ctx.save();
  if (dashed) ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.quadraticCurveTo(control.x, control.y, to.x, to.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}

function drawCross(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size = 7) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - size, y - size);
  ctx.lineTo(x + size, y + size);
  ctx.moveTo(x + size, y - size);
  ctx.lineTo(x - size, y + size);
  ctx.stroke();
}

function drawToken(
  ctx: CanvasRenderingContext2D,
  point: Point,
  value: string,
  fill: string,
  radius = 7,
) {
  dot(ctx, point.x, point.y, radius, fill);
  label(ctx, value, point.x, point.y, C.white, value.length > 1 ? 6.5 : 8);
}

function drawDocumentCard(
  ctx: CanvasRenderingContext2D,
  point: Point,
  tenant: TenantCard,
  tagProgress: number,
) {
  const color = tenant === 'finance' ? C.green : C.red;
  box(ctx, point.x - 27, point.y - 10, 54, 20, C.white, color, 1.5);
  dot(ctx, point.x - 18, point.y, 3.5, color, color, 1);
  label(ctx, tenant === 'finance' ? 'Finance' : 'Legal', point.x + 4, point.y, color, 8);
  if (tagProgress > 0.02) {
    ctx.save();
    ctx.globalAlpha = tagProgress;
    label(ctx, 'owner', point.x + 22, point.y - 14, C.muted, 6.5, 'right');
    ctx.restore();
  }
}

function drawEnvelope(ctx: CanvasRenderingContext2D, fillProgress: number) {
  const stroke = fillProgress > 0 ? C.green : C.line;
  box(ctx, 350, 112, 84, 82, fillProgress > 0 ? '#f1faf4' : C.white, stroke, fillProgress >= 1 ? 3 : 2);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(352, 118);
  ctx.lineTo(392, 146);
  ctx.lineTo(432, 118);
  ctx.stroke();
  label(ctx, '授权上下文', 392, 104, stroke, 9);
  if (fillProgress > 0) {
    ctx.save();
    ctx.globalAlpha = fillProgress;
    box(ctx, 365, 158, 54, 20, C.white, C.green, 1.5);
    dot(ctx, 376, 168, 3.5, C.green, C.green, 1);
    label(ctx, 'Finance', 396, 168, C.green, 8);
    ctx.restore();
  }
}

function drawFixedArchitecture(ctx: CanvasRenderingContext2D, scene: ArchitectureScene) {
  const geometry = ARCHITECTURE_GEOMETRY;
  label(ctx, '论文 Figure 1 + Figure 2 + Table 1', 280, 14, C.muted, 9.5);

  drawDashedRect(
    ctx,
    geometry.boundary.x,
    geometry.boundary.y,
    geometry.boundary.width,
    geometry.boundary.height,
    C.red,
  );
  label(ctx, '可信服务端边界 · Server-side orchestration', 542, 38, C.red, 8.5, 'right');

  label(ctx, '① 离线数据', 74, 42, C.blue, 8, 'left');
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(72, 112);
  ctx.lineTo(316, 112);
  ctx.stroke();
  box(
    ctx,
    geometry.ingestionNode.x,
    geometry.ingestionNode.y,
    geometry.ingestionNode.width,
    geometry.ingestionNode.height,
    '#eef5fb',
    C.blue,
    1.5,
  );
  label(ctx, '策略感知摄取', 164, 53, C.blue, 8);
  box(ctx, 218, 36, 90, 74, '#f7f9fc', C.blue, 1.5);
  label(ctx, 'Tagged corpus', 263, 48, C.blue, 8);

  label(ctx, '② 在线数据路径', 178, 110, C.purple, 8, 'left');
  box(ctx, 178, 120, 72, 64, '#f6f2ff', C.purple, 2);
  label(ctx, '资源级 ABAC', 214, 132, C.purple, 8.2);
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(178, 144);
  ctx.lineTo(250, 144);
  ctx.moveTo(178, 166);
  ctx.lineTo(250, 166);
  ctx.stroke();

  box(ctx, 264, 120, 72, 64, '#f6f2ff', C.purple, 2);
  label(ctx, 'chunk 过滤', 300, 132, C.purple, 8.2);
  ctx.beginPath();
  ctx.moveTo(264, 144);
  ctx.lineTo(336, 144);
  ctx.moveTo(264, 166);
  ctx.lineTo(336, 166);
  ctx.stroke();

  box(ctx, 272, 192, 64, 24, '#fff2f3', C.red, 1.5);
  label(ctx, 'Legal', 284, 204, C.red, 8);
  label(ctx, 'DENY', 322, 204, C.red, 8);
  drawEnvelope(ctx, scene.context.fillProgress);
  box(ctx, 462, 120, 76, 64, '#fff8df', C.orange, scene.context.inferenceReady ? 3 : 2);
  label(ctx, 'Shared', 500, 142, C.orange, 9);
  label(ctx, 'Inference', 500, 164, C.ink, 8.5);

  label(ctx, '③ 服务端控制路径', 344, 208, C.green, 8, 'left');
  box(ctx, 4, 294, 48, 58, C.white, C.blue, 2);
  label(ctx, 'Finance', 28, 311, C.blue, 8);
  label(ctx, '客户端', 28, 331, C.blue, 8);
  box(ctx, 82, 298, 80, 40, '#f4f8fb', C.blue, 1.5);
  label(ctx, '输入安全', 122, 308, C.blue, 8.5);
  label(ctx, '服务端接管', 122, 329, C.muted, 7.5);

  box(ctx, 332, 220, 104, 56, '#f1faf4', C.green, 2);
  label(ctx, '逐次工具授权', 384, 233, C.green, 8.5);
  label(ctx, '用户 + tenant', 384, 264, C.muted, 8);
  box(ctx, 464, 220, 72, 56, scene.tool.active ? '#fff5e8' : C.white, scene.tool.active ? C.orange : C.line, 2);
  label(ctx, '企业工具', 500, 234, scene.tool.active ? C.orange : C.muted, 8.5);
  label(ctx, scene.tool.active ? '执行中' : '未执行', 500, 264, scene.tool.active ? C.orange : C.muted, 8);

  drawDashedRect(ctx, 332, 284, 204, 54, C.green, [4, 3]);
  box(ctx, 340, 292, 82, 38, C.white, C.red, 1.5);
  label(ctx, 'Legal 状态', 381, 302, C.red, 8.2);
  label(ctx, '隔离', 381, 321, C.muted, 8);
  box(ctx, 438, 292, 90, 38, scene.state.financeStored ? '#eef9f2' : C.white, C.green, 1.5);
  label(ctx, 'Finance 状态', 483, 302, C.green, 8.2);
  label(ctx, scene.state.financeStored ? '已写入' : '等待', 483, 321, C.muted, 8);

  box(ctx, 210, 344, 100, 32, '#f4f8fb', C.blue, 1.5);
  label(ctx, '输出安全', 260, 353, C.blue, 8.2);
  label(ctx, 'response check', 260, 367, C.muted, 7.5);

  arrow(ctx, 263, 110, 214, 118, C.line, 1.5);
  arrow(ctx, 250, 155, 262, 155, C.line, 1.5);
  arrow(ctx, 336, 155, 348, 155, C.line, 1.5);
  arrow(ctx, 434, 152, 460, 152, C.line, 1.5);
  arrow(ctx, 436, 248, 462, 248, C.line, 1.5);
  drawQuadraticPath(ctx, geometry.modelToolPort, { x: 430, y: 218 }, geometry.toolAuthorizationPort, C.line, 1.5);
  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(geometry.modelResponsePort.x, geometry.modelResponsePort.y);
  ctx.lineTo(geometry.responseCorridor.x, geometry.responseCorridor.y);
  ctx.lineTo(geometry.outputSafetyRightPort.x, geometry.outputSafetyRightPort.y);
  ctx.lineTo(geometry.outputSafetyLeftPort.x, geometry.outputSafetyLeftPort.y);
  ctx.lineTo(geometry.responseBoundaryPort.x, geometry.responseBoundaryPort.y);
  ctx.stroke();
  ctx.restore();
}

function drawIngestion(ctx: CanvasRenderingContext2D, scene: ArchitectureScene) {
  drawDocumentCard(ctx, scene.ingestion.financeDocument, 'finance', scene.ingestion.tagProgress);
  drawDocumentCard(ctx, scene.ingestion.legalDocument, 'legal', scene.ingestion.tagProgress);
}

function drawRetrieval(ctx: CanvasRenderingContext2D, scene: ArchitectureScene) {
  if (scene.query.visible) {
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(52, 320);
    ctx.lineTo(162, 320);
    ctx.lineTo(178, 144);
    ctx.stroke();
    drawToken(ctx, scene.query.legitimate, 'Q', C.blue);
  }

  if (scene.query.bypassVisible) {
    drawQuadraticPath(ctx, ARCHITECTURE_GEOMETRY.bypassOrigin, { x: 60, y: 280 }, ARCHITECTURE_GEOMETRY.bypassStop, C.red, 2.5, true);
    drawToken(ctx, scene.query.bypass, '!', C.red, 6);
    if (scene.query.bypassBlocked) {
      drawCross(ctx, ARCHITECTURE_GEOMETRY.bypassStop.x + 6, ARCHITECTURE_GEOMETRY.bypassStop.y, C.red, 6);
      label(ctx, '无直连推理路径', 72, 280, C.red, 8.2, 'left');
    }
  }

  if (scene.progress >= 0.27) {
    drawToken(ctx, scene.retrieval.financeChunk, 'F', C.green, 6.5);
    drawToken(ctx, scene.retrieval.legalChunk, 'L', C.red, 6.5);
  }

  if (scene.retrieval.resourceAuthorization === 'checking') {
    label(ctx, 'CHECK', 214, 194, C.orange, 8);
  } else if (scene.retrieval.resourceAuthorization === 'permit') {
    label(ctx, 'PERMIT', 214, 194, C.green, 8);
  }
}

function drawContext(ctx: CanvasRenderingContext2D, scene: ArchitectureScene) {
  if (scene.progress >= 0.45) {
    const financeCardX = lerp(350, 392, scene.context.fillProgress);
    box(ctx, financeCardX - 23, 158, 46, 19, C.white, C.green, 1.5);
    label(ctx, 'Finance', financeCardX, 168, C.green, 8);
  }
  if (scene.progress >= 0.5) {
    drawToken(ctx, scene.context.envelope, 'CTX', C.green, 7.5);
  }
}

function drawControlLoop(ctx: CanvasRenderingContext2D, scene: ArchitectureScene) {
  if (scene.tool.callVisible) {
    drawToken(ctx, scene.tool.call, 'φ', scene.tool.authorization === 'permit' ? C.green : C.purple, 6.5);
  }

  if (scene.tool.authorization === 'checking') {
    label(ctx, 'CHECK', 384, 249, C.orange, 8);
  } else if (scene.tool.authorization === 'permit') {
    label(ctx, 'PERMIT', 384, 249, C.green, 8);
  }

  if (scene.progress >= 0.7) {
    drawToken(ctx, scene.tool.result, 'T', C.orange, 6.5);
  }
  if (scene.tool.active) {
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 1.5;
    for (let index = 0; index < 3; index += 1) {
      ctx.beginPath();
      ctx.arc(500, 248, 20 + index * 4, -0.5, 0.5);
      ctx.stroke();
    }
  }

  if (scene.progress >= 0.75) {
    drawToken(ctx, scene.state.financeWrite, 'S', C.green, 6.5);
  }
}

function drawResponse(ctx: CanvasRenderingContext2D, scene: ArchitectureScene) {
  if (scene.response.visible) drawToken(ctx, scene.response.token, 'R', C.blue, 6.5);
}

export function LayeredArchitectureLab(_props: PaperWidgetProps) {
  const timeline = useTimeline(7_000, 0.5);
  const scene = deriveArchitectureScene(timeline.progress);
  const completed = scene.phase === 'response' && scene.response.returned;

  return (
    <LabShell>
      <div className="layered-architecture-canvas">
        <LabCanvas
          height={412}
          labelText={`论文 Figure 1、Figure 2 与 Table 1 的安全请求闭环。${scene.detail}`}
          onOutOfView={timeline.pause}
          draw={(ctx) => {
            drawFixedArchitecture(ctx, scene);
            drawIngestion(ctx, scene);
            drawRetrieval(ctx, scene);
            drawContext(ctx, scene);
            drawControlLoop(ctx, scene);
            drawResponse(ctx, scene);
            label(ctx, scene.detail, 280, 400, scene.phase === 'takeover' ? C.red : C.ink, 9.2);
          }}
        />
      </div>
      <TimelineControls timeline={timeline} phases={ARCHITECTURE_PHASES} label="安全请求闭环" />
      <Feedback tone={completed ? 'good' : 'info'}>
        {completed ? FINAL_FEEDBACK : scene.detail}
      </Feedback>
    </LabShell>
  );
}
