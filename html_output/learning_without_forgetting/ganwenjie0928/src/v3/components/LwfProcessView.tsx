import { useId } from "react";
import { lwfProcess } from "../data/process";

const nodeRevealAt: Record<string, number> = {
  xn: 0, teacher: 1, yo: 2, student: 3, "old-branch": 3, "new-branch": 3,
  "new-label": 7, "loss-old": 6, "loss-new": 7, objective: 9, optimizer: 9, "updated-student": 9,
};

const edgeRevealAt: Record<string, number> = {
  "xn-teacher": 1, "teacher-yo": 2, "xn-student": 3,
  "student-old": 3, "student-new": 3, "old-output-loss": 6, "yo-old-loss": 6,
  "new-output-loss": 7, "label-new-loss": 7, "loss-old-objective": 9,
  "loss-new-objective": 9, "old-loss-head-gradient": 8, "old-head-shared-gradient": 8,
  "new-loss-head-gradient": 8, "new-head-shared-gradient": 8,
  "objective-optimizer": 9, "optimizer-updated-student": 9,
};

const nodeRevealDelay: Record<string, number> = {
  "old-branch": 120, "new-branch": 240, "loss-new": 140,
  optimizer: 130, "updated-student": 260,
};

const edgeRevealDelay: Record<string, number> = {
  "student-old": 150, "student-new": 300,
  "old-output-loss": 180, "new-output-loss": 180,
  "old-head-shared-gradient": 170, "new-loss-head-gradient": 340, "new-head-shared-gradient": 510,
  "loss-new-objective": 150, "objective-optimizer": 300, "optimizer-updated-student": 450,
};

const nodes = [
  { id: "xn", x: 22, y: 92, w: 108, h: 58, title: "Xₙ", sub: "当前任务输入", type: "input" },
  { id: "teacher", x: 196, y: 38, w: 170, h: 84, title: "Teacher", sub: "旧模型 · θₛ + θₒ", type: "teacher", badge: "FROZEN" },
  { id: "yo", x: 445, y: 48, w: 108, h: 62, title: "Yₒ", sub: "旧响应目标", type: "output" },
  { id: "student", x: 198, y: 230, w: 172, h: 96, title: "Student", sub: "共享 θₛ", type: "student", badge: "TRAINABLE" },
  { id: "old-branch", x: 418, y: 208, w: 116, h: 62, title: "θₒ → Ŷₒ", sub: "旧任务 head", type: "parameter" },
  { id: "new-branch", x: 418, y: 318, w: 116, h: 62, title: "θₙ → Ŷₙ", sub: "新任务 head", type: "new-parameter" },
  { id: "loss-old", x: 666, y: 205, w: 112, h: 64, title: "L_old", sub: "响应保持", type: "loss" },
  { id: "loss-new", x: 666, y: 318, w: 112, h: 64, title: "L_new", sub: "新任务监督", type: "loss" },
  { id: "new-label", x: 435, y: 446, w: 118, h: 58, title: "Yₙ", sub: "新任务标签", type: "input" },
  { id: "objective", x: 642, y: 468, w: 160, h: 68, title: "联合目标", sub: "λₒL_old + L_new + R", type: "objective" },
  { id: "optimizer", x: 366, y: 638, w: 140, h: 62, title: "Optimizer Step", sub: "应用梯度", type: "optimizer" },
  { id: "updated-student", x: 104, y: 638, w: 166, h: 62, title: "Student′", sub: "参数已更新", type: "updated" },
];

const edges = [
  { id: "xn-teacher", d: "M130 110 C158 110 167 80 196 80" },
  { id: "teacher-yo", d: "M366 80 C398 80 412 79 445 79" },
  { id: "xn-student", d: "M130 126 C156 164 164 264 198 264" },
  { id: "student-old", d: "M370 252 C388 252 398 238 418 238" },
  { id: "student-new", d: "M370 292 C391 310 396 349 418 349" },
  { id: "old-output-loss", d: "M534 239 C584 239 614 237 666 237" },
  { id: "yo-old-loss", d: "M500 110 C579 143 603 197 666 222" },
  { id: "new-output-loss", d: "M534 349 C584 349 614 350 666 350" },
  { id: "label-new-loss", d: "M553 475 C601 465 628 402 680 382" },
  { id: "loss-old-objective", d: "M680 269 C660 312 636 408 678 468" },
  { id: "loss-new-objective", d: "M722 382 C732 415 759 438 766 468" },
  { id: "old-loss-head-gradient", d: "M666 215 C613 191 587 195 534 220", kind: "gradient" },
  { id: "old-head-shared-gradient", d: "M418 250 C396 280 393 282 370 278", kind: "gradient" },
  { id: "new-loss-head-gradient", d: "M666 370 C612 394 588 376 534 357", kind: "gradient" },
  { id: "new-head-shared-gradient", d: "M418 336 C397 319 391 302 370 287", kind: "gradient" },
  { id: "objective-optimizer", d: "M642 527 C584 580 541 624 506 653" },
  { id: "optimizer-updated-student", d: "M366 669 C331 669 307 669 270 669" },
];

export function LwfProcessView({ activeStepId }: {
  activeStepId: string | null;
}) {
  const markerPrefix = `lwf-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const activeStep = lwfProcess.steps.find((step) => step.id === activeStepId) ?? lwfProcess.steps[0];
  const stepIndex = Math.max(0, lwfProcess.steps.findIndex((step) => step.id === activeStep.id));
  const activeNodes = new Set(activeStep.activeNodes ?? []);
  const activeEdges = new Set(activeStep.activeEdges ?? []);
  const nodeClass = (id: string) => `${stepIndex >= nodeRevealAt[id] ? "is-revealed" : ""} ${activeNodes.has(id) ? "is-active" : ""} ${id === "updated-student" && activeStep.id === "cycle-update" ? "is-updated" : ""}`;

  return <div className="v3-process-visual" aria-label="LwF 持续系统图">
    <header className="v3-process-visual-header"><div><p className="v3-eyebrow">PERSISTENT SYSTEM</p><span>STEP {String(stepIndex + 1).padStart(2, "0")} / 10</span></div><strong>{activeStep.title}</strong></header>
    <svg className="v3-process-svg" viewBox="0 0 824 724" role="img" aria-labelledby={`${markerPrefix}-title ${markerPrefix}-desc`} preserveAspectRatio="xMidYMid meet">
      <title id={`${markerPrefix}-title`}>LwF Teacher 与 Student 的训练计算图</title>
      <desc id={`${markerPrefix}-desc`}>当前任务输入同时进入冻结 Teacher 与扩展 Student。Teacher 生成 Yₒ，Student 通过共享参数和两个任务 head 产生 Ŷₒ 与 Ŷₙ。两项损失汇入联合目标，再反向传播并由优化器更新 Student。</desc>
      <path className={`v3-teacher-outline ${stepIndex >= nodeRevealAt.teacher ? "is-revealed" : ""}`} d="M184 25 H572 V132 H184 Z" />
      <text className={`v3-svg-zone-label v3-svg-teacher-label ${stepIndex >= nodeRevealAt.teacher ? "is-revealed" : ""}`} x="198" y="24">FROZEN TEACHER</text>
      <path className={`v3-student-outline ${stepIndex >= nodeRevealAt.student ? "is-revealed" : ""}`} d="M184 190 H570 V397 H184 Z" />
      <text className={`v3-svg-zone-label v3-svg-student-label ${stepIndex >= nodeRevealAt.student ? "is-revealed" : ""}`} x="198" y="190">EXPANDED STUDENT</text>
      <defs>
      {edges.map((edge) => {
        const isGradient = edge.kind === "gradient";
        const revealed = stepIndex >= edgeRevealAt[edge.id];
        const active = activeEdges.has(edge.id);
        const delay = edgeRevealDelay[edge.id] ?? 0;
        return <marker key={edge.id} id={`${markerPrefix}-${edge.id}`} className={`v3-process-marker ${isGradient ? "is-gradient" : ""} ${revealed ? "is-revealed" : ""} ${active ? "is-active" : ""}`} style={{ transitionDelay: revealed ? `${delay}ms` : "0ms" }} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker>;
      })}
      </defs>
      {edges.map((edge) => {
        const active = activeEdges.has(edge.id);
        const isGradient = edge.kind === "gradient";
        const revealed = stepIndex >= edgeRevealAt[edge.id];
        const delay = edgeRevealDelay[edge.id] ?? 0;
        return <path key={edge.id} className={`v3-process-edge ${isGradient ? "is-gradient" : ""} ${revealed ? "is-revealed" : ""} ${active ? "is-active" : ""}`} style={{ transitionDelay: `${delay}ms`, animationDelay: `${delay}ms` }} data-edge-id={edge.id} d={edge.d} pathLength={1} markerEnd={`url(#${markerPrefix}-${edge.id})`} />;
      })}
      {nodes.map((node) => {
        const revealed = stepIndex >= nodeRevealAt[node.id];
        const active = activeNodes.has(node.id);
        const delay = nodeRevealDelay[node.id] ?? 0;
        return <g key={node.id} className={`v3-process-node v3-process-node--${node.type} ${revealed ? "is-revealed" : ""} ${active ? "is-active" : ""} ${node.id === "updated-student" && activeStep.id === "cycle-update" ? "is-updated" : ""}`} style={{ transitionDelay: revealed ? `${delay}ms` : "0ms" }} data-process-node={node.id}>
          <rect x={node.x} y={node.y} width={node.w} height={node.h} rx="12" />
          {node.badge ? <text className="v3-node-badge" x={node.x + node.w / 2} y={node.y + 15}>{node.badge}</text> : null}
          <text className={`v3-node-title ${node.badge ? "has-badge" : ""}`} x={node.x + node.w / 2} y={node.y + (node.badge ? 41 : 27)}>{node.title}</text>
          <text className="v3-node-sub" x={node.x + node.w / 2} y={node.y + (node.badge ? 61 : 47)}>{node.sub}</text>
        </g>;
      })}
      <text className={`v3-gradient-caption ${stepIndex >= 8 ? "is-revealed" : ""}`} x="28" y="563">虚线反向路径：梯度经 θₒ / θₙ 回到共享 θₛ</text>
    </svg>
    <div className="v3-process-mobile" aria-label="当前训练步骤的 LwF 计算路径">
      <div className={`v3-mobile-flow-node v3-mobile-input ${nodeClass("xn")}`} data-process-node="xn"><strong>Xₙ</strong><small>当前任务输入</small></div>
      <div className={`v3-mobile-flow-row ${activeEdges.has("xn-teacher") || activeEdges.has("teacher-yo") ? "is-active" : ""}`} data-edge-id="xn-teacher teacher-yo"><div className={`v3-mobile-flow-node v3-mobile-teacher ${nodeClass("teacher")}`} data-process-node="teacher"><strong>Teacher</strong><small>旧模型 · FROZEN</small></div><span aria-hidden="true">→</span><div className={`v3-mobile-flow-node v3-mobile-output ${nodeClass("yo")}`} data-process-node="yo"><strong>Yₒ</strong><small>旧响应目标</small></div></div>
      <div className={`v3-mobile-student ${nodeClass("student")}`} data-process-node="student"><strong>Student · θₛ</strong><small>共享表示</small></div>
      <div className="v3-mobile-branches">
        <div className={`v3-mobile-branch ${nodeClass("old-branch")}`} data-process-node="old-branch"><span>θₒ → Ŷₒ</span><i>→</i><strong className={nodeClass("loss-old")} data-process-node="loss-old">L_old</strong></div>
        <div className={`v3-mobile-branch is-new ${nodeClass("new-branch")}`} data-process-node="new-branch"><span>θₙ → Ŷₙ</span><i>→</i><strong className={nodeClass("loss-new")} data-process-node="loss-new">L_new</strong></div>
      </div>
      <div className={`v3-mobile-label-row ${activeEdges.has("label-new-loss") ? "is-active" : ""}`} data-process-node="new-label" data-edge-id="label-new-loss"><span>Yₙ · 新标签</span><i>→</i><span>L_new</span></div>
      <div className={`v3-mobile-objective ${nodeClass("objective")}`} data-process-node="objective"><strong>L = λₒ L_old + L_new + R</strong><small>联合目标</small></div>
      <div className={`v3-mobile-gradient-flow ${activeEdges.has("old-loss-head-gradient") || activeEdges.has("new-loss-head-gradient") ? "is-active" : ""}`} data-edge-id="old-loss-head-gradient new-loss-head-gradient">L_old → θₒ → θₛ <span>·</span> L_new → θₙ → θₛ</div>
      <div className={`v3-mobile-update-row ${nodeClass("optimizer")}`}><div className="v3-mobile-flow-node" data-process-node="optimizer"><strong>Optimizer Step</strong><small>应用梯度</small></div><i>→</i><div className={`v3-mobile-flow-node v3-mobile-updated ${nodeClass("updated-student")}`} data-process-node="updated-student"><strong>Student′</strong><small>参数已更新</small></div></div>
    </div>
    <footer className="v3-process-legend"><span><i className="is-forward" />前向 / 目标</span><span><i className="is-gradient" />反向梯度</span><span><i className="is-frozen" />Teacher 固定</span></footer>
  </div>;
}
