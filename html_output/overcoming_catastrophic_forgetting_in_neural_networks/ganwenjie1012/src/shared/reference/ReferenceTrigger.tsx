import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { FocusEvent, MouseEvent, PointerEvent, ReactNode } from "react";
import { usePopoverPosition } from "../foundation/overlay/Popover";
import type { CanonicalReferenceId } from "../../contracts/ids";
import { referenceRegistry } from "../../data/referenceRegistry";
import { useReferenceApi } from "./ReferenceProvider";
import type { ReferenceHoverCopy } from "./types";

const KIND_LABELS: Record<string, string> = {
  term: "术语", symbol: "符号", formula: "公式", dataset: "数据集", environment: "环境",
  method: "方法", phase: "阶段", evidence: "证据", confusion: "易混概念", implementation: "实现", advanced: "进阶",
};
const SOURCE_LABELS: Record<string, string> = {
  PAPER_FACT: "论文事实", PAPER_RESULT: "论文结果", AUTHOR_INTERPRETATION: "作者解释",
  GENERAL_BACKGROUND: "通用背景", MECHANISM_INTERPRETATION: "机制解释", IMPLEMENTATION_MAPPING: "实现对应",
  TEACHING_EXAMPLE: "教学示例", LIMITATION: "局限",
};

export function ReferenceTrigger({ id, children, className = "", onActivate }: {
  id: CanonicalReferenceId;
  children: ReactNode;
  className?: string;
  onActivate?: () => void;
}) {
  const api = useReferenceApi();
  const item = referenceRegistry[id];
  const hoverCopy: ReferenceHoverCopy | undefined = item?.hoverCopy;
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const close = useCallback(() => { setOpen(false); setPinned(false); }, []);
  const position = usePopoverPosition(triggerRef, panelRef, open, close);
  const previewId = useId();
  useEffect(() => () => { if (timerRef.current !== undefined) window.clearTimeout(timerRef.current); }, []);

  const cancelClose = () => {
    if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
    timerRef.current = undefined;
  };
  const scheduleClose = () => {
    cancelClose();
    timerRef.current = window.setTimeout(() => {
      if (!pinned && document.activeElement !== triggerRef.current && !panelRef.current?.contains(document.activeElement)) setOpen(false);
    }, 160);
  };
  const onBlur = (event: FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && (triggerRef.current?.contains(next) || panelRef.current?.contains(next))) return;
    scheduleClose();
  };
  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onActivate?.();
    if (open && pinned) { setPinned(false); setOpen(false); }
    else { cancelClose(); setPinned(true); setOpen(true); }
  };

  if (!item) return <>{children}</>;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`ewc-reference-trigger ${className}`.trim()}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={previewId}
        onKeyDown={(event) => { if (event.key === "Escape") { cancelClose(); close(); event.stopPropagation(); } }}
        onPointerEnter={(_event: PointerEvent<HTMLButtonElement>) => { cancelClose(); setOpen(true); }}
        onPointerLeave={scheduleClose}
        onFocus={() => { cancelClose(); setOpen(true); }}
        onBlur={onBlur}
        onClick={onClick}
      >{children}</button>
      {open ? (
        <div
          ref={panelRef}
          id={previewId}
          className="ewc-reference-preview"
          onKeyDown={(event) => { if (event.key === "Escape") { cancelClose(); triggerRef.current?.focus(); close(); event.stopPropagation(); } }}
          role="dialog"
          aria-label={`${hoverCopy?.title ?? "参考条目"}速览`}
          style={{ top: position.top, left: position.left, visibility: position.ready ? "visible" : "hidden" }}
          onPointerEnter={cancelClose}
          onPointerLeave={scheduleClose}
          onBlur={onBlur}
        >
          <div className="ewc-reference-preview__eyebrow">{KIND_LABELS[item.kind] ?? "参考条目"} · {SOURCE_LABELS[item.sourceCategory ?? ""] ?? "教学参考"}</div>
          <h3>{hoverCopy?.title}</h3>
          <p>{hoverCopy?.summary}</p>
          {hoverCopy?.role ? <p className="ewc-reference-preview__role"><strong>作用</strong> {hoverCopy.role}</p> : null}
          {hoverCopy?.confusion ? <p className="ewc-reference-preview__boundary"><strong>注意</strong> {hoverCopy.confusion}</p> : null}
          <button className="ewc-text-action" type="button" onClick={() => api.openReference({ referenceId: id })}>打开参考资料 →</button>
        </div>
      ) : null}
    </>
  );
}
