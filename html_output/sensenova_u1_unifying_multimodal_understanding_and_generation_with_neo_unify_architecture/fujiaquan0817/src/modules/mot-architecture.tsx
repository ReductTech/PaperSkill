import React, { useCallback, useEffect, useRef, useState } from "react";
import { observeCanvas, setupCanvas } from "../lib/canvasKit";
import type { WidgetProps } from "./registry";
import { C } from "./studio-kit";

const W = 1040, H = 700;

type Variant = "8B" | "A3B";
type TokenType = "understanding" | "noise";
type NodeId =
  | "input"
  | "projection-norm"
  | "shared-attention"
  | "ffn"
  | "output"
  | "mask-gate";
type Probe =
  | "none"
  | "text-causal"
  | "image-bidir"
  | "noise-to-clean"
  | "clean-to-noise";
type Feedback = { text: string; cls: "" | "good" | "bad" };

const nodes: { id: NodeId; label: string; x: number; w: number }[] = [
  { id: "input", label: "输入 token", x: 42, w: 124 },
  { id: "projection-norm", label: "专属投影 + Norm", x: 206, w: 174 },
  { id: "shared-attention", label: "共享自注意力", x: 424, w: 170 },
  { id: "ffn", label: "专属 FFN", x: 638, w: 142 },
  { id: "output", label: "解码头", x: 814, w: 120 },
  { id: "mask-gate", label: "掩码门", x: 424, w: 170 },
];

// Section 3.2, "Native Mixture-of-Transformers" (p.8), clause by clause.
// The arrows in these labels are ATTEND edges (A 读取 B), matching the paper's own
// "X attend to Y" phrasing. Note this is the opposite direction from an information-flow
// arrow: "噪声 读取 干净" is the same fact as information moving 干净 → 噪声. The hero
// diagram draws the flow convention, so both spell out which one they mean.
const probeItems: {
  id: Exclude<Probe, "none">;
  label: string;
  legal: boolean;
}[] = [
  { id: "text-causal", label: "文本 读取 已有前缀", legal: true },
  { id: "image-bidir", label: "同一图像块双向读取", legal: true },
  { id: "noise-to-clean", label: "噪声 读取 干净上下文", legal: true },
  { id: "clean-to-noise", label: "干净 读取 噪声", legal: false },
];

// Macro pipeline, in the paper's own order: Section 3.1 patch encoding -> Section 3.2
// backbone (Pre-Buffer then Post-LLM for 8B) -> Section 3.1 patch decoding.
// Drawn as a reference strip because the paper's fidelity claim lives in the STAGES,
// not just in one transformer block; the interactive detail sits in the zoom band below.
const MACRO_X = [36, 232, 428, 624, 820];
const MACRO_W = 182;

// Zoom-band geometry.
const LANE_UND = 196;
const LANE_GEN = 376;
const ATTN = { x: 424, y: 276, w: 170, h: 78 };
const GATE = { x: 424, y: 466, w: 170, h: 124 };
const SPEC = { x: 824, y: 466, w: 180, h: 132 };

function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  color: string = C.text,
  size = 14,
  align: CanvasTextAlign = "left",
) {
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(value, x, y);
}

function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  selected: boolean,
  color: string = C.contour,
  detail?: string,
) {
  ctx.fillStyle = C.white;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = selected ? C.control : color;
  ctx.lineWidth = selected ? 4 : 2;
  ctx.strokeRect(x, y, w, h);
  const tone = selected ? C.control : C.text;
  if (detail) {
    text(ctx, title, x + w / 2, y + h / 2 - 3, tone, 13, "center");
    text(ctx, detail, x + w / 2, y + h / 2 + 16, C.muted, 10.5, "center");
  } else {
    text(ctx, title, x + w / 2, y + h / 2 + 5, tone, 13, "center");
  }
}

export const MotArchitecture: React.FC<WidgetProps> = (
  { chapterId, moduleId },
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [variant, setVariant] = useState<Variant>("8B");
  const [tokenType, setTokenType] = useState<TokenType>("understanding");
  const [activeNode, setActiveNode] = useState<NodeId>("shared-attention");
  const [probe, setProbe] = useState<Probe>("none");
  const [feedback, setFeedback] = useState<Feedback>({
    text:
      "已选：共享自注意力。共享的是单一序列上的注意力运算，不是 QKV 权重——投影、归一化与 FFN 按 token 类型完全解耦。",
    cls: "",
  });

  const chooseVariant = (v: Variant) => {
    setVariant(v);
    setProbe("none");
    setFeedback(
      v === "A3B"
        ? {
          text:
            "A3B 视图：无 Pre-Buffer，改用流内 MoE——理解流 128 专家共 30.0B，生成流 32 专家共 8.2B，每 token 各激活 8 个，推理约 3B 激活参数。",
          cls: "",
        }
        : {
          text:
            "8B 视图：浅层 Pre-Buffer 先把原生像素与词映射到统一表示，Post-LLM 层保留预训练 LLM 的语言与推理能力；两条流都是稠密 8.2B 的对称并行配置。",
          cls: "",
        },
    );
  };
  const chooseToken = (v: TokenType) => {
    setTokenType(v);
    setActiveNode("input");
    setProbe("none");
    setFeedback({
      text: v === "understanding"
        ? "理解流输入：干净图像与文本 token，图像内容由 <img> 与 </img> 界定；点击节点追踪完整路线。"
        : "生成流输入：噪声条件下的图像 token，噪声尺度经 NSEmb 加到时间步条件上；点击节点追踪完整路线。",
      cls: "",
    });
  };
  const chooseNode = (id: NodeId) => {
    setActiveNode(id);
    const und = tokenType === "understanding";
    const detail: Record<NodeId, string> = {
      "input": und
        ? "干净图像与文本进入理解流。图像先过两层卷积（步幅 16 与 2）+ GELU + 2D 正弦位置编码，每 token 对应 32×32 patch；文本沿用底层语言模型原有分词器，未作修改。"
        : "噪声图像进入生成流。同一套 patch 编码层处理图像与噪声；时间步嵌入与噪声尺度嵌入相加后作为条件信号。",
      "projection-norm": und
        ? "理解流专属投影与归一化。Native RoPE 作用在 Query / Key 投影及其对应归一化上，由理解主干初始化，不增加参数。"
        : "生成流专属投影与归一化，与理解流完全解耦，按 token 类型在每一层动态路由。",
      "shared-attention":
        "共享的是单一序列上的自注意力运算：所有模态在同一序列中表示，感知与合成在每一层原生交互。QKV 投影本身仍是各流专属的。",
      "ffn": und
        ? "理解流专属 FFN。论文的措辞是两条流“完全参数解耦”，FFN 不跨流共享。"
        : "生成流专属 FFN，与理解流参数完全分离。",
      "output": und
        ? "理解流用线性投影头映射到词表做文本预测。"
        : "生成流用多层感知机（MLP）头直接预测像素 patch，绕开深扩散头与 VAE 解码器——这正是论文“舍弃深解码头”的落点。",
      "mask-gate":
        "掩码门决定可见性（下列箭头一律读作“谁读取谁”）：文本只读前缀，同一图像块内双向，噪声可读干净上下文，干净 token 不得读取噪声。等价地说，信息只能从干净流向噪声。",
    };
    setFeedback({ text: detail[id], cls: "" });
  };
  const chooseProbe = (id: Probe) => {
    setProbe(id);
    setActiveNode("mask-gate");
    if (id === "clean-to-noise") {
      setFeedback({
        text:
          "已阻断：论文规定干净 token 不得读取任何噪声 token，避免生成侧信息回流并污染理解表示。",
        cls: "bad",
      });
    } else if (id === "noise-to-clean") {
      setFeedback({
        text:
          "合法路径：每个图像块内的噪声 token 双向互看，并可完整访问干净输入，再在生成流专属参数中继续计算。",
        cls: "good",
      });
    } else {
      setFeedback({
        text: id === "text-causal"
          ? "合法路径：文本 token 只因果地读取此前的 token。"
          : "合法路径：同一图像块内的图像 token 双向互看，同时仍因果地以全部前置上下文为条件。",
        cls: "good",
      });
    }
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.field;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.desk;
    ctx.fillRect(0, 648, W, 52);
    text(ctx, "原生 Transformer 混合体（MoT）", 36, 34, C.text, 19);
    text(
      ctx,
      tokenType === "understanding"
        ? "当前：理解 token（上轨）"
        : "当前：噪声 token（下轨）",
      36,
      58,
      C.current,
      14,
    );

    // ---- Macro pipeline strip: Section 3.1 -> 3.2 -> 3.1 ----------------------
    text(ctx, "宏观流程（§3.1 接口 → §3.2 主干 → §3.1 解码）", 36, 80, C.muted, 12);
    const dense = variant === "8B";
    const macro: { title: string; detail: string; tone: string; dim?: boolean }[] = [
      { title: "原生像素 / 词", detail: "无 VE，无 VAE", tone: C.text },
      { title: "patch 编码层", detail: "2×conv 步幅 16,2 · GELU", tone: C.success },
      dense
        ? { title: "Pre-Buffer", detail: "浅层 · 映射为统一表示", tone: C.success }
        : { title: "无 Pre-Buffer", detail: "A3B 直接进入主干", tone: C.muted, dim: true },
      {
        title: dense ? "Post-LLM · MoT" : "MoT + 流内 MoE",
        detail: dense ? "42 层 · 保留 LLM 能力" : "48 层 · 每流 top-8",
        tone: C.current,
      },
      { title: "解码头", detail: "线性 → 词表 / MLP → 像素", tone: C.success },
    ];
    macro.forEach((m, i) => {
      const x = MACRO_X[i];
      ctx.fillStyle = m.dim ? C.field : C.white;
      ctx.fillRect(x, 90, MACRO_W, 50);
      ctx.strokeStyle = m.dim ? C.border : m.tone;
      ctx.lineWidth = 2;
      if (m.dim) ctx.setLineDash([6, 5]);
      ctx.strokeRect(x, 90, MACRO_W, 50);
      ctx.setLineDash([]);
      text(ctx, m.title, x + MACRO_W / 2, 110, m.dim ? C.muted : m.tone, 12.5, "center");
      text(ctx, m.detail, x + MACRO_W / 2, 128, C.muted, 10.5, "center");
      if (i < macro.length - 1) {
        ctx.strokeStyle = C.contour;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + MACRO_W, 115);
        ctx.lineTo(MACRO_X[i + 1], 115);
        ctx.stroke();
      }
    });

    // ---- Zoom band: one transformer block, two streams -----------------------
    text(ctx, "放大一层 Transformer 块：共享上下文 / 专属计算", 36, 170, C.muted, 12);
    const y = tokenType === "understanding" ? LANE_UND : LANE_GEN;
    const otherY = tokenType === "understanding" ? LANE_GEN : LANE_UND;
    text(ctx, "理解流 · 实线", 38, 188, C.text, 12);
    text(ctx, "生成流 · 点线", 38, 368, C.text, 12);
    ctx.strokeStyle = C.contour;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(62, LANE_UND + 30);
    ctx.lineTo(918, LANE_UND + 30);
    ctx.stroke();
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(62, LANE_GEN + 30);
    ctx.lineTo(918, LANE_GEN + 30);
    ctx.stroke();
    ctx.setLineDash([]);

    // Active route: stream-specific blocks, but a common attention node.
    const attnCy = ATTN.y + ATTN.h / 2;
    ctx.strokeStyle = probe === "clean-to-noise"
      ? C.failure
      : probe !== "none"
      ? C.success
      : C.current;
    ctx.lineWidth = 3;
    const pathY = y + 30;
    ctx.beginPath();
    ctx.moveTo(104, pathY);
    ctx.lineTo(293, pathY);
    ctx.lineTo(509, attnCy);
    ctx.lineTo(709, pathY);
    ctx.lineTo(874, pathY);
    ctx.stroke();
    // Inactive route remains visible.
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(104, otherY + 30);
    ctx.lineTo(293, otherY + 30);
    ctx.lineTo(509, attnCy);
    ctx.lineTo(709, otherY + 30);
    ctx.lineTo(874, otherY + 30);
    ctx.stroke();

    const und = tokenType === "understanding";
    box(
      ctx,
      42,
      y,
      124,
      60,
      und ? "干净图像 / 文本" : "噪声图像",
      activeNode === "input",
      C.current,
      und ? "<img> … </img>" : "时间 + 噪声尺度条件",
    );
    box(
      ctx,
      206,
      y,
      174,
      60,
      und ? "理解专属投影 + Norm" : "生成专属投影 + Norm",
      activeNode === "projection-norm",
      C.current,
      "Native RoPE 作用于 Q / K",
    );
    box(
      ctx,
      ATTN.x,
      ATTN.y,
      ATTN.w,
      ATTN.h,
      "共享自注意力",
      activeNode === "shared-attention",
      C.current,
      "单一序列 · 逐层交互",
    );
    box(
      ctx,
      638,
      y,
      142,
      60,
      und ? "理解专属 FFN" : "生成专属 FFN",
      activeNode === "ffn",
      C.current,
      "完全参数解耦",
    );
    box(
      ctx,
      814,
      y,
      120,
      60,
      und ? "线性投影头" : "MLP 头",
      activeNode === "output",
      C.current,
      und ? "→ 词表" : "→ 像素 patch",
    );
    // The other stream's decoupled blocks stay visible but muted.
    box(
      ctx,
      206,
      otherY,
      174,
      60,
      und ? "生成专属投影 + Norm" : "理解专属投影 + Norm",
      false,
      C.border,
    );
    box(
      ctx,
      638,
      otherY,
      142,
      60,
      und ? "生成专属 FFN" : "理解专属 FFN",
      false,
      C.border,
    );
    box(
      ctx,
      814,
      otherY,
      120,
      60,
      und ? "MLP 头" : "线性投影头",
      false,
      C.border,
      und ? "→ 像素 patch" : "→ 词表",
    );
    box(
      ctx,
      42,
      otherY,
      124,
      60,
      und ? "噪声图像" : "干净图像 / 文本",
      false,
      C.border,
    );

    // ---- Mask gate ------------------------------------------------------------
    box(
      ctx,
      GATE.x,
      GATE.y,
      GATE.w,
      GATE.h,
      "",
      activeNode === "mask-gate",
      probe === "clean-to-noise"
        ? C.failure
        : probe !== "none"
        ? C.success
        : C.contour,
    );
    text(ctx, "掩码门", GATE.x + GATE.w / 2, GATE.y + 20, C.text, 13, "center");
    probeItems.forEach((item, i) => {
      const yy = 508 + i * 22;
      const selected = probe === item.id;
      ctx.fillStyle = selected
        ? (item.legal ? C.success : C.failure)
        : C.border;
      ctx.fillRect(442, yy - 11, 12, 12);
      text(
        ctx,
        `${item.legal ? "✓" : "×"} ${item.label}`,
        464,
        yy,
        selected ? (item.legal ? C.success : C.failure) : C.muted,
        12,
      );
    });
    if (probe === "clean-to-noise") {
      ctx.strokeStyle = C.failure;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(398, 442);
      ctx.lineTo(620, 608);
      ctx.stroke();
    }

    // ---- Table 1 spec card ----------------------------------------------------
    ctx.fillStyle = C.white;
    ctx.fillRect(SPEC.x, SPEC.y, SPEC.w, SPEC.h);
    ctx.strokeStyle = variant === "A3B" ? C.control : C.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(SPEC.x, SPEC.y, SPEC.w, SPEC.h);
    text(
      ctx,
      variant === "8B" ? "8B 稠密版 · 表 1" : "A3B · MoE · 表 1",
      SPEC.x + 16,
      SPEC.y + 26,
      variant === "A3B" ? C.control : C.current,
      14,
    );
    const spec = variant === "8B"
      ? ["Pre-Buffer ✓ · 42 层", "Q/KV 32/8 · hidden 4096", "experts 1 / 1", "参数 8.2B / 8.2B"]
      : ["Pre-Buffer ✗ · 48 层", "Q/KV 32/4 · hidden 2048", "experts 128 / 32（A8）", "总参数 30.0B / 8.2B"];
    spec.forEach((v, i) =>
      text(
        ctx,
        v,
        SPEC.x + 16,
        SPEC.y + 54 + i * 20,
        variant === "A3B" && i === 2 ? C.aux : C.text,
        11.5,
      )
    );
    text(
      ctx,
      variant === "A3B"
        ? "约 3B 是每 token 激活量，不是总量"
        : "Head T/H/W = 64/32/32 · 两流对称并行",
      36,
      672,
      variant === "A3B" ? C.control : C.muted,
      13,
    );
  }, [variant, tokenType, activeNode, probe]);

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

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * W / rect.width;
    const y = (e.clientY - rect.top) * H / rect.height;
    if (
      y >= GATE.y && y <= GATE.y + GATE.h &&
      x >= GATE.x && x <= GATE.x + GATE.w
    ) {
      const i = Math.max(0, Math.min(3, Math.floor((y - 497) / 22)));
      chooseProbe(probeItems[i].id);
      return;
    }
    const streamY = tokenType === "understanding" ? LANE_UND : LANE_GEN;
    const candidates = nodes.filter((n) => n.id !== "mask-gate");
    const hit = candidates.find((n) =>
      x >= n.x && x <= n.x + n.w &&
      (n.id === "shared-attention"
        ? y >= ATTN.y && y <= ATTN.y + ATTN.h
        : y >= streamY && y <= streamY + 60)
    );
    if (hit) chooseNode(hit.id);
  };

  const nodeIndex = nodes.findIndex((n) => n.id === activeNode);
  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        onClick={onCanvasClick}
        aria-label={`MoT 架构，${variant}，${
          tokenType === "understanding" ? "理解 token" : "噪声 token"
        }，当前节点 ${activeNode}`}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            chooseNode(nodes[(nodeIndex + 1) % nodes.length].id);
          }
          if (e.key === "ArrowUp") {
            chooseNode(nodes[(nodeIndex - 1 + nodes.length) % nodes.length].id);
          }
          if (e.key === "1") chooseVariant("8B");
          if (e.key === "2") chooseVariant("A3B");
          if (e.key.toLowerCase() === "u") chooseToken("understanding");
          if (e.key.toLowerCase() === "g") chooseToken("noise");
        }}
      />
      <div className="ctrl" role="group" aria-label="MoT 架构选择">
        <button
          type="button"
          className={variant === "8B" ? "chip active" : "chip"}
          onClick={() => chooseVariant("8B")}
          aria-pressed={variant === "8B"}
        >
          8B 稠密
        </button>
        <button
          type="button"
          className={variant === "A3B" ? "chip active" : "chip"}
          onClick={() => chooseVariant("A3B")}
          aria-pressed={variant === "A3B"}
        >
          A3B · MoE
        </button>
        <button
          type="button"
          className={tokenType === "understanding" ? "chip active" : "chip"}
          onClick={() => chooseToken("understanding")}
          aria-pressed={tokenType === "understanding"}
        >
          理解 token
        </button>
        <button
          type="button"
          className={tokenType === "noise" ? "chip active" : "chip"}
          onClick={() => chooseToken("noise")}
          aria-pressed={tokenType === "noise"}
        >
          噪声 token
        </button>
      </div>
      <div className="ctrl" role="group" aria-label="选择架构节点">
        {nodes.map((n) => (
          <button
            type="button"
            key={n.id}
            className={activeNode === n.id ? "chip active" : "chip"}
            onClick={() => chooseNode(n.id)}
            aria-pressed={activeNode === n.id}
          >
            {n.label}
          </button>
        ))}
      </div>
      <div className="ctrl" role="group" aria-label="探测注意力边">
        {probeItems.map((item) => (
          <button
            type="button"
            key={item.id}
            className={probe === item.id ? "chip active" : "chip"}
            onClick={() => chooseProbe(item.id)}
            aria-pressed={probe === item.id}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`} aria-live="polite">
        {feedback.text}
      </div>
      <blockquote className="paper-quote">
        “所有模态都位于同一序列并共享自注意力；两条流的投影、归一化与前馈块完全解耦，并在每层按 token 类型动态路由。”
        <cite>论文依据（中文释义）：SenseNova-U1, §3.2 Native Mixture-of-Transformers, p.8</cite>
      </blockquote>
      <div className="note" aria-live="polite">
        {variant === "8B"
          ? "表 1（8B-MoT）：patch 32×32；Pre-Buffer ✓；42 层；Q/KV 32/8；Head T/H/W 64/32/32；hidden 4096；理解/生成 experts 1/1；参数 8.2B/8.2B。§3.2 说明浅层 Pre-Buffer 把原生像素与词映射为统一表示，Post-LLM 层保留预训练 LLM 的语言与推理能力，两条流为对称并行的稠密网络。"
          : "表 1（A3B-MoT）：patch 32×32；Pre-Buffer ✗；48 层；Q/KV 32/4；Head T/H/W 64/32/32；hidden 2048；理解流 128 专家 30.0B，生成流 32 专家 8.2B，每 token 各 top-8 激活，推理约 3B 激活参数。A3B 以流内 MoE 替代 Pre-Buffer 实现扩展。"}
      </div>
      <div className="note">
        证据边界：§3.1–3.2、Table 1 与 Figure 4。共享自注意力不等于共享 QKV 投影；MoT 双流路由与 A3B 的流内 MoE 是两层机制；生成侧仍保留 MLP 头，理解侧仍保留线性头。
      </div>
    </div>
  );
};

export default MotArchitecture;
