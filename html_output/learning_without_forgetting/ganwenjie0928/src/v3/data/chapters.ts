export type LwfChapterId = "00" | "01" | "02" | "03" | "04" | "05" | "06" | "07";
export type LwfChapter = { id: LwfChapterId; slug: string; title: string; status: "ready" | "planned" };

export const LWF_CHAPTERS: readonly LwfChapter[] = [
  { id: "00", slug: "problem", title: "问题设定", status: "ready" },
  { id: "01", slug: "architecture", title: "模型结构", status: "ready" },
  { id: "02", slug: "key-move", title: "关键做法", status: "ready" },
  { id: "03", slug: "training-cycle", title: "一次训练", status: "ready" },
  { id: "04", slug: "mechanism-boundary", title: "机制与边界", status: "ready" },
  { id: "05", slug: "sequential", title: "连续任务", status: "ready" },
  { id: "06", slug: "evidence", title: "论文证据", status: "ready" },
  { id: "07", slug: "replay", title: "完整回放", status: "ready" },
];

const readyChapterCount = LWF_CHAPTERS.filter((chapter) => chapter.status === "ready").length;

// Export readiness follows the real chapter manifest rather than a separate flag.
export const LWF_UPSTREAM_MAPPING = {
  chapterCount: LWF_CHAPTERS.length,
  readyChapterCount,
  upstreamReady: readyChapterCount === LWF_CHAPTERS.length,
} as const;

export function getLwfChapter(id: string): LwfChapter | undefined {
  return LWF_CHAPTERS.find((chapter) => chapter.id === id);
}
