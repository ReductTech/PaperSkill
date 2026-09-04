import React, { useCallback, useEffect, useRef, useState } from "react";
import { observeCanvas, setupCanvas } from "../lib/canvasKit";
import type { WidgetProps } from "./registry";
import { C } from "./studio-kit";

const W = 1040, H = 610;
const base = C as unknown as Record<string, string>;
const P = {
  field: base.field || "#f5f8f0",
  desk: base.desk || "#b8c9a7",
  contour: base.contour || "#76906a",
  blue: base.blue || "#27446e",
  green: base.green || "#228d5c",
  red: base.red || "#c43f52",
  orange: base.orange || "#d97706",
  purple: base.purple || "#7c3aed",
  text: base.text || "#21324a",
  muted: base.muted || "#68778f",
  border: base.border || "#d7deea",
  white: "#fff",
};

type Metric =
  | "realunify"
  | "geneval"
  | "cotraining"
  | "reconstruction"
  | "boundaries";
type Feedback = { text: string; cls: "" | "good" | "bad"; color?: string };
const metrics: { id: Metric; label: string }[] = [
  { id: "realunify", label: "RealUnify" },
  { id: "geneval", label: "GenEval" },
  { id: "cotraining", label: "联合中训" },
  { id: "reconstruction", label: "重建" },
  { id: "boundaries", label: "边界" },
];
const boundaries = [
  "困难编辑：仍落后顶尖专门编辑器，尤其是内容保持。",
  "重建：相同 PSNR 不等于相同 SSIM，更不等于字面“无损”。",
  "网格伪影：现象已观察；独立 patch 是作者假设的可能原因。",
  "VLA：Figure 14 只是代表性动作推理可视化。",
  "世界模型：Figure 15 是视觉结果预测样例，没有全面定量评测。",
];
function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  color = P.text,
  size = 14,
  align: CanvasTextAlign = "left",
) {
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(value, x, y);
}
function scale(value: number, min: number, max: number, width: number) {
  return Math.max(0, Math.min(width, (value - min) / (max - min) * width));
}

export const EvidenceRace: React.FC<WidgetProps> = (
  { chapterId, moduleId },
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [metric, setMetric] = useState<Metric>("realunify");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [focusRow, setFocusRow] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>({
    text: "准备就绪：先核对 RealUnify、对象与“越高越好”，再开始比较。",
    cls: "",
  });

  useEffect(() => {
    if (!running) return;
    const timer = globalThis.setInterval(
      () => setProgress((p) => Math.min(1, p + 0.04)),
      60,
    );
    return () => globalThis.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (running && progress >= 1) setRunning(false);
  }, [running, progress]);

  const chooseMetric = (next: Metric) => {
    setMetric(next);
    setRunning(false);
    setProgress(0);
    setFocusRow(0);
    const label = metrics.find((m) => m.id === next)?.label || next;
    setFeedback(
      next === "boundaries"
        ? {
          text: "这些是限制、作者假设或初步定性证据，不应进入定量赛跑。",
          cls: "",
          color: P.orange,
        }
        : {
          text: `准备就绪：先核对 ${label}、对象与“越高越好”，再开始比较。`,
          cls: "",
        },
    );
  };
  const start = () => {
    if (metric === "boundaries") {
      setRunning(false);
      setProgress(0);
      setFeedback({
        text: "这些是限制、作者假设或初步定性证据，不应进入定量赛跑。",
        cls: "",
        color: P.orange,
      });
      return;
    }
    setProgress(0);
    setRunning(true);
    setFeedback({
      text: `正在按 ${
        metrics.find((m) => m.id === metric)?.label
      } 的单一协议比较。`,
      cls: "",
    });
  };
  useEffect(() => {
    if (progress < 1) return;
    if (metric === "realunify") {
      setFeedback({
        text:
          "同一 step-wise RealUnify 协议：52.4 高于 42.9；8B-SFT 同时报 55.7 UEG 与 47.5 GEU。",
        cls: "good",
      });
    }
    if (metric === "geneval") {
      setFeedback({
        text:
          "同一 GenEval Overall：0.91 略高于 0.90；差值很小，不扩写成全面领先。",
        cls: "good",
      });
    }
    if (metric === "cotraining") {
      setFeedback({
        text:
          "同一 8B-MoT 前后对照：四项均持平或上升，支持该设置下未观察到明显能力坍塌。",
        cls: "good",
      });
    }
    if (metric === "reconstruction") {
      setFeedback({
        text:
          "PSNR 同为 31.56，但 SSIM 为 0.85 对 0.93；下采样率 32× 对 8×，不能称为完全等价或字面无损。",
        cls: "",
        color: P.orange,
      });
    }
  }, [progress, metric]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = P.field;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = P.desk;
    ctx.fillRect(0, 558, W, 52);
    text(ctx, "经核验的同协议比较", 34, 34, P.text, 19);
    metrics.forEach((m, i) => {
      const x = 34 + i * 194;
      ctx.fillStyle = m.id === metric ? P.blue : P.white;
      ctx.fillRect(x, 52, 176, 42);
      ctx.strokeStyle = m.id === metric ? P.blue : P.border;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, 52, 176, 42);
      text(
        ctx,
        m.label,
        x + 88,
        79,
        m.id === metric ? P.white : P.muted,
        13,
        "center",
      );
    });
    ctx.fillStyle = P.white;
    ctx.fillRect(34, 116, 686, 420);
    ctx.strokeStyle = P.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(34, 116, 686, 420);
    ctx.fillStyle = P.white;
    ctx.fillRect(744, 116, 262, 176);
    ctx.strokeRect(744, 116, 262, 176);
    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(744, 312, 262, 224);
    ctx.strokeStyle = P.orange;
    ctx.strokeRect(744, 312, 262, 224);

    if (metric === "boundaries") {
      text(ctx, "不进入定量赛跑", 58, 150, P.orange, 17);
      boundaries.forEach((item, i) => {
        const y = 176 + i * 66;
        ctx.fillStyle = i < 3 ? "#fff7ed" : "#faf5ff";
        ctx.fillRect(58, y, 638, 50);
        ctx.strokeStyle = i < 3 ? P.orange : P.purple;
        ctx.strokeRect(58, y, 638, 50);
        text(ctx, item, 72, y + 30, i < 3 ? P.orange : P.purple, 12);
      });
      text(ctx, "协议卡", 766, 146, P.orange, 16);
      text(ctx, "无统一数值轴", 766, 178, P.text, 13);
      text(ctx, "限制 / 假设 / 定性案例", 766, 204, P.muted, 12);
    } else if (metric === "realunify") {
      text(ctx, "RealUnify · Overall · 0–60 · 越高越好", 58, 150, P.blue, 16);
      const rows = [{
        name: "SenseNova-U1-8B-SFT",
        value: 52.4,
        color: P.green,
      }, { name: "BAGEL", value: 42.9, color: P.blue }];
      rows.forEach((r, i) => {
        const y = 202 + i * 110;
        text(ctx, r.name, 58, y, P.text, 13);
        ctx.fillStyle = "#edf1f6";
        ctx.fillRect(58, y + 18, 610, 34);
        ctx.fillStyle = r.color;
        ctx.fillRect(58, y + 18, scale(r.value, 0, 60, 610) * progress, 34);
        text(ctx, String(r.value), 682, y + 45, r.color, 15, "right");
        if (i === focusRow) {
          ctx.strokeStyle = P.orange;
          ctx.lineWidth = 3;
          ctx.strokeRect(52, y - 22, 640, 82);
        }
      });
      text(ctx, "同一 step-wise 协议", 58, 458, P.muted, 13);
      text(ctx, "协议卡", 766, 146, P.blue, 16);
      ["UEG 55.7", "GEU 47.5", "Overall 52.4", "GEU：一次交错过程"].forEach((
        v,
        i,
      ) => text(ctx, v, 766, 180 + i * 25, i === 2 ? P.green : P.text, 12));
    } else if (metric === "geneval") {
      text(ctx, "GenEval · Overall · 0–1 · 越高越好", 58, 150, P.blue, 16);
      const rows = [{ name: "SenseNova-U1 8B", value: .91, color: P.green }, {
        name: "NEO-unify 8B",
        value: .90,
        color: P.blue,
      }];
      rows.forEach((r, i) => {
        const y = 202 + i * 110;
        text(ctx, r.name, 58, y, P.text, 13);
        ctx.fillStyle = "#edf1f6";
        ctx.fillRect(58, y + 18, 610, 34);
        ctx.fillStyle = r.color;
        ctx.fillRect(58, y + 18, scale(r.value, 0, 1, 610) * progress, 34);
        text(ctx, r.value.toFixed(2), 682, y + 45, r.color, 15, "right");
        if (i === focusRow) {
          ctx.strokeStyle = P.orange;
          ctx.lineWidth = 3;
          ctx.strokeRect(52, y - 22, 640, 82);
        }
      });
      text(ctx, "完整 0–1 轴，避免放大 0.01 差值", 58, 458, P.orange, 13);
      text(ctx, "协议卡", 766, 146, P.blue, 16);
      ["对象与关系遵循", "Overall", "同表同协议", "差值：0.01"].forEach((
        v,
        i,
      ) => text(ctx, v, 766, 180 + i * 25, i === 3 ? P.orange : P.text, 12));
    } else if (metric === "cotraining") {
      text(ctx, "8B-MoT · 联合中训前后 · 每行 0–100", 58, 150, P.blue, 16);
      const rows = [["多模态", 72.1, 73.2], ["文本", 77.7, 77.8], [
        "DPG",
        84.7,
        86.5,
      ], ["GEdit", 69.1, 69.9]] as const;
      rows.forEach((r, i) => {
        const y = 188 + i * 74;
        text(ctx, r[0], 58, y, P.text, 13);
        ctx.fillStyle = "#edf1f6";
        ctx.fillRect(148, y - 15, 510, 24);
        ctx.fillStyle = P.green;
        ctx.fillRect(148, y - 15, scale(r[2], 0, 100, 510) * progress, 24);
        const beforeX = 148 + scale(r[1], 0, 100, 510) * progress;
        ctx.strokeStyle = P.blue;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(beforeX, y - 20);
        ctx.lineTo(beforeX, y + 14);
        ctx.stroke();
        text(ctx, `${r[1]} → ${r[2]}`, 682, y + 4, P.green, 13, "right");
        if (i === focusRow) {
          ctx.strokeStyle = P.orange;
          ctx.lineWidth = 3;
          ctx.strokeRect(50, y - 31, 642, 50);
        }
      });
      text(
        ctx,
        "GEdit 已归一到 0–100；任务间不互相排名",
        58,
        510,
        P.orange,
        12,
      );
      text(ctx, "协议卡", 766, 146, P.blue, 16);
      [
        "同一 8B 设置",
        "mid-training 前 → 后",
        "四项持平或上升",
        "不是跨模型结论",
      ].forEach((v, i) =>
        text(ctx, v, 766, 180 + i * 25, i === 3 ? P.orange : P.text, 12)
      );
    } else {
      text(ctx, "MS-COCO 2017 · 512 · 两个独立指标轴", 58, 150, P.blue, 16);
      const rows = [
        { name: "PSNR", min: 30, max: 32, a: 31.56, b: 31.56, digits: 2 },
        { name: "SSIM", min: .8, max: .95, a: .85, b: .93, digits: 2 },
      ];
      rows.forEach((r, i) => {
        const y = 202 + i * 144;
        text(ctx, `${r.name} · ${r.min}–${r.max}`, 58, y, P.text, 14);
        ctx.fillStyle = "#edf1f6";
        ctx.fillRect(58, y + 18, 610, 24);
        ctx.fillStyle = P.green;
        ctx.fillRect(58, y + 18, scale(r.a, r.min, r.max, 610) * progress, 10);
        ctx.fillStyle = P.blue;
        ctx.fillRect(58, y + 32, scale(r.b, r.min, r.max, 610) * progress, 10);
        text(
          ctx,
          `NEO-unify ${r.a.toFixed(r.digits)} · FLUX ${r.b.toFixed(r.digits)}`,
          682,
          y + 66,
          i === 0 ? P.orange : P.text,
          13,
          "right",
        );
        if (i === focusRow) {
          ctx.strokeStyle = P.orange;
          ctx.lineWidth = 3;
          ctx.strokeRect(52, y - 23, 640, 96);
        }
      });
      text(ctx, "PSNR 与 SSIM 不合成总分", 58, 500, P.orange, 13);
      text(ctx, "协议卡", 766, 146, P.blue, 16);
      [
        "NEO-unify 2B：32×",
        "FLUX.1-dev VAE：8×",
        "NEO-unify：90K 步",
        "不是同成本协议",
      ].forEach((v, i) =>
        text(ctx, v, 766, 180 + i * 25, i === 3 ? P.orange : P.text, 12)
      );
    }
    text(ctx, "始终可见的证据边界", 766, 342, P.orange, 15);
    ["编辑仍有差距", "网格原因只是作者假设", "VLA / 世界模型仅为定性"].forEach((
      v,
      i,
    ) =>
      text(ctx, `• ${v}`, 766, 378 + i * 30, i === 2 ? P.purple : P.orange, 12)
    );
    text(ctx, "不要跨协议生成“综合冠军”。", 766, 492, P.red, 12);
    text(
      ctx,
      progress >= 1 ? "已按当前协议完成核验" : "先选协议，再启动本赛道",
      34,
      582,
      progress >= 1 ? P.green : P.muted,
      13,
    );
  }, [metric, progress, focusRow]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    const paint = () => {
      draw(ctx);
      canvas.classList.add("is-ready");
    };
    const disconnect = observeCanvas(canvas, paint, () => {});
    return disconnect;
  }, [draw]);

  const rowCount = metric === "cotraining"
    ? 4
    : metric === "boundaries"
    ? 5
    : 2;
  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) * W / r.width;
    const y = (e.clientY - r.top) * H / r.height;
    if (y >= 52 && y <= 94) {
      const i = Math.max(0, Math.min(4, Math.floor((x - 34) / 194)));
      chooseMetric(metrics[i].id);
      return;
    }
    if (x >= 34 && x <= 720 && y >= 116 && y <= 536) {
      if (metric === "cotraining") {
        setFocusRow(Math.max(0, Math.min(3, Math.floor((y - 157) / 74))));
      } else if (metric === "boundaries") {
        setFocusRow(Math.max(0, Math.min(4, Math.floor((y - 176) / 66))));
      } else setFocusRow(y < 304 ? 0 : 1);
    }
  };
  const metricIndex = metrics.findIndex((m) => m.id === metric);
  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        onClick={onCanvasClick}
        aria-label={`证据比较，当前协议 ${metrics[metricIndex].label}，第 ${
          focusRow + 1
        } 行`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            chooseMetric(
              metrics[(metricIndex + 1) % metrics.length].id,
            );
          }
          if (e.key === "ArrowLeft") {
            chooseMetric(
              metrics[(metricIndex - 1 + metrics.length) % metrics.length].id,
            );
          }
          if (e.key === "Home") chooseMetric(metrics[0].id);
          if (e.key === "End") chooseMetric(metrics[metrics.length - 1].id);
          if (e.key === "ArrowDown") setFocusRow((focusRow + 1) % rowCount);
          if (e.key === "ArrowUp") {
            setFocusRow((focusRow - 1 + rowCount) % rowCount);
          }
          if (e.key === "Enter" || e.key === " ") start();
          if (e.key.toLowerCase() === "r") start();
          if (e.key === "Escape") {
            setRunning(false);
            setProgress(0);
          }
        }}
      />
      <div className="ctrl" role="tablist" aria-label="证据协议">
        {metrics.map((m) => (
          <button
            type="button"
            key={m.id}
            role="tab"
            aria-selected={metric === m.id}
            className={metric === m.id ? "chip active" : "chip"}
            onClick={() => chooseMetric(m.id)}
          >
            {m.label}
          </button>
        ))}
        <button type="button" onClick={start} disabled={running}>
          {metric === "boundaries"
            ? "打开限制卡"
            : running
            ? "比较中…"
            : progress > 0
            ? "重新比较"
            : "开始比较"}
        </button>
      </div>
      <div
        className={`feedback ${feedback.cls}`}
        style={feedback.color
          ? { borderColor: feedback.color, color: feedback.color }
          : undefined}
        aria-live="polite"
      >
        {feedback.text}
      </div>
      <div className="note">
        边界始终保留：困难编辑与内容保持仍落后顶尖专用模型；网格伪影的独立 patch
        原因只是作者假设；VLA 与世界模型是初步定性案例，不是完备基准结论。
      </div>
    </div>
  );
};

export default EvidenceRace;
