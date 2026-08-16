import { clamp01, easeInOutCubic, lerp, phaseProgress } from '../animation/easing';
import { useTimeline } from '../animation/useTimeline';
import { LabCanvas } from './shared/LabChrome';
import { C, box, dot, label } from './shared/canvasDrawing';

export interface PaperWidgetProps {
  chapterId: string;
  moduleId: string;
}

export type HeroPanel = 'old' | 'new';
export type HeroPhase = 'query' | 'rank' | 'scope' | 'select' | 'context';

export interface HeroSceneModel {
  progress: number;
  phase: HeroPhase;
  panel: HeroPanel;
  counterfactualTopTenant: 'Legal';
  authorizedTenants: readonly ['Finance'] | readonly [];
  selectedTenant: 'Legal' | 'Finance' | null;
  contextTenant: 'Legal' | 'Finance' | null;
  legalExcluded: boolean;
  legalX: number;
  financeX: number;
  footer: string;
}

export function deriveHeroScene(progress: number, panel: HeroPanel): HeroSceneModel {
  const p = clamp01(progress);
  const phase: HeroPhase = p < 0.2
    ? 'query'
    : p < 0.42
      ? 'rank'
      : p < 0.66
        ? 'scope'
        : p < 0.84
          ? 'select'
          : 'context';
  const scopeReached = p >= 0.42;
  const selectionReached = p >= 0.66;
  const routeProgress = easeInOutCubic(phaseProgress(p, 0.66, 0.84));
  const rankProgress = easeInOutCubic(phaseProgress(p, 0, 0.42));
  const scopeProgress = easeInOutCubic(phaseProgress(p, 0.42, 0.66));
  const legalRankX = lerp(58, 229, rankProgress);
  const financeScopeX = lerp(250, 352, scopeProgress);
  const contextTenant = p >= 0.84 ? (panel === 'new' ? 'Finance' : 'Legal') : null;
  const footer = panel === 'new'
    ? '安全结果示意；后过滤与谓词下推见 §3'
    : contextTenant === 'Legal'
      ? '只看相似度：Legal 越权进入上下文'
      : '没有授权集合，排名结果会直接继续';

  return {
    progress: p,
    phase,
    panel,
    counterfactualTopTenant: 'Legal',
    authorizedTenants: panel === 'new' && scopeReached ? ['Finance'] as const : [],
    selectedTenant: selectionReached ? (panel === 'new' ? 'Finance' : 'Legal') : null,
    contextTenant,
    legalExcluded: panel === 'new' && scopeReached,
    legalX: panel === 'old' && selectionReached ? lerp(229, 492, routeProgress) : legalRankX,
    financeX: panel === 'new' && selectionReached ? lerp(352, 492, routeProgress) : financeScopeX,
    footer,
  };
}

const analogyCopy: Record<string, { title: string; left: string; right: string; accent: string }> = {
  'chap-1': { title: '目录排名', left: '最像', right: '可借？', accent: C.red },
  'chap-2': { title: '集合交集', left: '相关', right: '允许', accent: C.green },
  'chap-3': { title: '两层验卡', left: '资源门', right: 'chunk 门', accent: C.purple },
  'chap-4': { title: '共享端点', left: '隔离信封', right: '一个模型', accent: C.blue },
  'chap-5': { title: '工具与状态', left: '检索安全', right: '仍需控制', accent: C.purple },
  'chap-6': { title: '完整地图', left: '数据路径', right: '控制路径', accent: C.blue },
  'chap-7': { title: '证据矩阵', left: '安全/质量', right: '代价', accent: C.green },
};

export function deriveAnalogyScene(chapterId: string) {
  return analogyCopy[chapterId] ?? analogyCopy['chap-1'];
}

function HeroScene({ panel }: { panel: HeroPanel }) {
  const timeline = useTimeline(4_500);
  const model = deriveHeroScene(timeline.progress, panel);
  return (
    <LabCanvas
      width={560}
      height={155}
      labelText={panel === 'new'
        ? '本文方法展示相关集合与授权集合的安全交集，Legal 不进入上下文'
        : '传统方法只按相似度选择 Legal 并形成越权上下文'}
      // Hero panels share one clock. A panel can be below the fold on mobile,
      // so an individual IntersectionObserver must not pause the group timeline.
      draw={(ctx) => {
        const phaseLabels: Record<HeroPhase, string> = {
          query: '① 同一 Finance 查询',
          rank: '② 相似度排序：Legal #1',
          scope: '③ 明确授权范围',
          select: '④ 从安全结果中选择',
          context: '⑤ 模型上下文',
        };
        label(ctx, phaseLabels[model.phase], 280, 16, panel === 'new' ? C.green : C.red, 12);
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(58, 80);
        ctx.lineTo(500, 80);
        ctx.stroke();

        box(ctx, 18, 49, 82, 62, C.white, C.blue, 2);
        label(ctx, 'Finance', 59, 69, C.blue, 11);
        label(ctx, 'query', 59, 91, C.muted, 10);
        box(ctx, 177, 38, 105, 84, C.white, C.orange, 2);
        label(ctx, '向量排名', 229, 52, C.orange, 10);
        label(ctx, '#1 Legal', 229, 76, C.red, 11);
        label(ctx, '#2 Finance', 229, 99, C.green, 11);
        box(ctx, 306, 46, 92, 68, C.white, panel === 'new' ? C.purple : C.red, 2);
        label(ctx, panel === 'new' ? '授权集合' : '选择规则', 352, 63, panel === 'new' ? C.purple : C.red, 10);
        label(
          ctx,
          model.phase === 'query' || model.phase === 'rank'
            ? '等待'
            : panel === 'new'
              ? '仅 Finance'
              : '只看排名',
          352,
          88,
          panel === 'new' ? C.green : C.red,
          11,
        );

        const contextStroke = model.contextTenant === 'Finance' ? C.green : model.contextTenant === 'Legal' ? C.red : C.line;
        box(ctx, 444, 46, 98, 68, model.contextTenant ? C.white : '#f6f8fc', contextStroke, 3);
        label(ctx, '模型上下文', 493, 63, C.ink, 10);
        label(ctx, model.contextTenant ?? '等待', 493, 89, contextStroke, 13);
        if (model.progress > 0.03) {
          if (model.legalExcluded) {
            ctx.save();
            ctx.globalAlpha = 0.48;
            ctx.setLineDash([4, 3]);
            ctx.strokeStyle = C.red;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(model.legalX, 80, 11, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
          dot(ctx, model.legalX, 80, 10, C.red);
          label(ctx, 'L', model.legalX, 80, C.white, 9);
        }
        if (panel === 'new' && model.progress >= 0.3) {
          dot(ctx, model.financeX, 101, 10, C.green);
          label(ctx, 'F', model.financeX, 101, C.white, 9);
        }
        if (model.legalExcluded) {
          ctx.strokeStyle = C.red;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(272, 68);
          ctx.lineTo(286, 91);
          ctx.moveTo(286, 68);
          ctx.lineTo(272, 91);
          ctx.stroke();
        }
        label(ctx, model.footer, 280, 139, panel === 'new' ? C.green : C.red, 11);
      }}
    />
  );
}

function AnalogyScene({ chapterId }: { chapterId: string }) {
  const scene = deriveAnalogyScene(chapterId);
  return (
    <LabCanvas
      width={244}
      height={130}
      labelText={`${scene.title}生活类比`}
      draw={(ctx) => {
        label(ctx, scene.title, 122, 18, scene.accent, 13);
        box(ctx, 14, 35, 96, 65, C.white, C.blue, 3);
        label(ctx, scene.left, 62, 67, C.blue, 13);
        ctx.strokeStyle = scene.accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(116, 68);
        ctx.lineTo(150, 68);
        ctx.stroke();
        box(ctx, 156, 34, 72, 68, C.white, scene.accent, 3);
        label(ctx, scene.right, 192, 68, scene.accent, 12);
      }}
    />
  );
}

export function LibraryScenes({ chapterId, moduleId }: PaperWidgetProps) {
  if (chapterId === 'hero') return <HeroScene panel={moduleId === 'new' ? 'new' : 'old'} />;
  return <AnalogyScene chapterId={chapterId} />;
}
