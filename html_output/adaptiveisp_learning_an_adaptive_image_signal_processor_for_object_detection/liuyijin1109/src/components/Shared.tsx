import { createContext, useContext, useId, useRef, useState, type ReactNode } from "react";
import { ZoomIn } from "lucide-react";
import { siteAsset } from "../content";
export type Done = { onDone: () => void };
const ModuleNumberContext = createContext<{
  chapter: number;
  numberFor: (id: string) => number;
} | null>(null);

export function ChapterModuleNumbers({ chapter, children }: { chapter: number; children: ReactNode }) {
  const numbers = useRef(new Map<string, number>());
  const numberFor = (id: string) => {
    if (!numbers.current.has(id)) numbers.current.set(id, numbers.current.size + 1);
    return numbers.current.get(id)!;
  };
  return (
    <ModuleNumberContext.Provider value={{ chapter, numberFor }}>
      {children}
    </ModuleNumberContext.Provider>
  );
}
export function Panel({
  title,
  kind = "教学示意",
  children,
}: {
  title: string;
  kind?: string;
  children: ReactNode;
}) {
  const numbering = useContext(ModuleNumberContext);
  const id = useId();
  const moduleNumber = numbering ? `${numbering.chapter}.${numbering.numberFor(id)}` : "";
  return (
    <div className="interactive-panel module">
      <div className="interactive-head module-head">
        {moduleNumber && <span className="num">{moduleNumber}</span>}
        <h4>{title}</h4>
        <span className={kind === "论文报告" ? "paper-label" : "demo-note"}>
          {kind}
        </span>
      </div>
      <div className="module-body">{children}</div>
    </div>
  );
}
export function Tabs({
  items,
  active,
  set,
  label = "切换视图",
}: {
  items: readonly string[];
  active: number;
  set: (n: number) => void;
  label?: string;
}) {
  return (
    <div className="tab-row chip-row" role="group" aria-label={label}>
      {items.map((x, i) => (
        <button
          key={x}
          aria-pressed={active === i}
          className={active === i ? "chip selected" : "chip"}
          onClick={() => set(i)}
        >
          {x}
        </button>
      ))}
    </div>
  );
}
export function Callout({
  title,
  children,
  orange = false,
}: {
  title: string;
  children: ReactNode;
  orange?: boolean;
}) {
  return orange ? (
    <div className="analogy-card">
      <div className="analogy-body">
        <div className="analogy-title">{title}</div>
        <div className="analogy-text">{children}</div>
      </div>
    </div>
  ) : (
    <div className="insight-bar show">
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}
export function Figure({
  n,
  caption,
}: {
  n: number;
  caption: string;
}) {
  return (
    <figure className="paper-figure">
      <a
        href={siteAsset(`paper/figure-${n}.png`)}
        target="_blank"
        rel="noreferrer"
        aria-label={`放大论文原图 Figure ${n}`}
      >
        <img
          src={siteAsset(`paper/figure-${n}.png`)}
          alt={`论文原图 Figure ${n}：${caption}`}
          loading="lazy"
        />
        <span className="zoom-hint">
          <ZoomIn size={15} />
          查看原图
        </span>
      </a>
      <figcaption>
        <b>论文原图 · Figure {n}</b> {caption}
      </figcaption>
    </figure>
  );
}
export function Flow({
  items,
  current = -1,
}: {
  items: readonly string[];
  current?: number;
}) {
  return (
    <div className="pipeline" aria-label="流程">
      {items.map((x, i) => (
        <div
          key={`${x}-${i}`}
          className={i === current ? "now" : i < current ? "past" : ""}
        >
          <span>{String(i + 1).padStart(2, "0")}</span>
          <b>{x}</b>
        </div>
      ))}
    </div>
  );
}
export function Explore({
  title,
  items,
  onDone,
  required = items.length,
}: {
  title: string;
  items: readonly { name: string; text: string; detail?: string }[];
  required?: number;
} & Done) {
  const [active, setActive] = useState(0);
  const [seen, setSeen] = useState<number[]>([]);
  return (
    <Panel title={title} kind="引导阅读">
      <Tabs
        items={items.map((x) => x.name)}
        active={active}
        set={(i) => {
          setActive(i);
          const s = [...new Set([...seen, i])];
          setSeen(s);
          if (s.length >= required) onDone();
        }}
      />
      <div className="reading-detail" aria-live="polite">
        <span className="eyebrow">
          {String(active + 1).padStart(2, "0")} / {items.length}
        </span>
        <h3>{items[active].name}</h3>
        <p>{items[active].text}</p>
        {items[active].detail && (
          <p className="subtle">{items[active].detail}</p>
        )}
      </div>
      <p className="activity-hint">
        建议点击阅读 {required} 项 · 已读 {seen.length} / {required}
      </p>
    </Panel>
  );
}
