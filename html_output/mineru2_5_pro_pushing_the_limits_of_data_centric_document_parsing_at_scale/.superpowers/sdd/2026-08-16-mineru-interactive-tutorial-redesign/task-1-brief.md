### Task 1: Test Harness, Shared Contracts, and Media Registry

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/types.ts`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/data/media.test.ts`
- Create: `src/data/media.ts`
- Create: `docs/superpowers/progress/2026-08-16-mineru-interactive-tutorial-redesign.md`

**Interfaces:**
- Produces: `MediaAsset`, `MediaCrop`, `ExperienceStateChange`, `ChapterExperienceProps`, `MEDIA_ASSETS`, `getMediaAsset(id)`.
- Consumes: existing `ModuleDef` and the six local PNG files under `public/images`.

- [ ] **Step 1: Install the test-only dependencies and scripts**

Run:

```powershell
npm install --save-dev vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

Add to `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Add deterministic jsdom setup**

Create `vitest.config.ts` with `environment: 'jsdom'`, `setupFiles: ['./src/test/setup.ts']`, `css: true`, and test globs under `src/**/*.test.{ts,tsx}`. In `src/test/setup.ts`, import `@testing-library/jest-dom/vitest`, run Testing Library cleanup after each test, and define controllable mocks for `matchMedia`, `IntersectionObserver`, `ResizeObserver`, `requestAnimationFrame`, `scrollIntoView`, and `document.fonts.ready`.

- [ ] **Step 3: Write the failing media contract test**

Create `src/data/media.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { MEDIA_ASSETS, getMediaAsset } from './media';

describe('MEDIA_ASSETS', () => {
  it('keeps core imagery local and every paper crop traceable', () => {
    for (const asset of Object.values(MEDIA_ASSETS)) {
      if (asset.kind !== 'external-video') expect(asset.src).not.toMatch(/^https?:/);
      if (asset.kind === 'paper-page' || asset.kind === 'paper-figure') {
        expect(asset.source?.url).toMatch(/^https:\/\//);
        expect(asset.source?.licenseReview).toMatch(/^(pending|verified)$/);
        expect(asset.allowedClaim.length).toBeGreaterThan(20);
      }
    }
  });

  it('declares every crop used by the six chapter experiences', () => {
    expect(getMediaAsset('omni-layout').crops).toMatchObject({
      doubleColumn: expect.any(Object),
      tripleColumn: expect.any(Object),
      complexLayout: expect.any(Object),
    });
    expect(getMediaAsset('omni-table').crops).toMatchObject({
      rotated: expect.any(Object),
      formula: expect.any(Object),
      mergedCells: expect.any(Object),
    });
  });
});
```

- [ ] **Step 4: Run the test and verify the missing-module failure**

Run: `npm test -- src/data/media.test.ts`  
Expected: FAIL because `src/data/media.ts` does not exist.

- [ ] **Step 5: Add exact shared types**

Append to `src/types.ts`:

```ts
export interface MediaCrop {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface MediaAsset {
  id: string;
  kind: 'paper-figure' | 'paper-page' | 'teaching-art' | 'external-video';
  src: string;
  width?: number;
  height?: number;
  alt: string;
  role: 'problem-example' | 'mechanism-diagram' | 'result-evidence';
  source?: {
    title: string;
    url: string;
    page?: number;
    figure?: string;
    licenseReview: 'pending' | 'verified';
  };
  allowedClaim: string;
  forbiddenClaims?: string[];
  crops?: Record<string, MediaCrop>;
}

export interface ExperienceStateChange {
  moduleId: string;
  state: string;
}

export interface ChapterExperienceProps {
  stepId: string;
  modules: readonly ModuleDef[];
  restoredModuleState?: ExperienceStateChange;
  onInteract: (moduleId: string) => void;
  onStateChange: (change: ExperienceStateChange) => void;
  onComplete: () => void;
}
```

- [ ] **Step 6: Implement the typed media registry**

Create `src/data/media.ts` with these stable asset IDs, dimensions, and sources:

| ID | Kind | Local or embed source | Size | Source URL |
|---|---|---|---|---|
| `document-concept` | `teaching-art` | `images/document-parsing-concept.png` | 1536脳1024 | none; label as teaching art |
| `mineru-data-engine` | `paper-figure` | `images/paper-figure-2-data-engine.png` | 2004脳886 | `https://arxiv.org/html/2604.04771v2#S3.F2` |
| `mineru-ddas` | `paper-figure` | `images/paper-figure-3-ddas.png` | 2027脳934 | `https://arxiv.org/html/2604.04771v2#S3.F3` |
| `omni-output` | `paper-page` | `images/real-case-output-comparison.png` | 1045脳540 | `https://arxiv.org/pdf/2412.07626#page=16` |
| `omni-layout` | `paper-page` | `images/real-case-layout-diversity.png` | 1040脳555 | `https://arxiv.org/pdf/2412.07626#page=19` |
| `omni-table` | `paper-page` | `images/real-case-table-structure.png` | 1040脳640 | `https://arxiv.org/pdf/2412.07626#page=20` |
| `bili-mineru-open-talk` | `external-video` | `https://player.bilibili.com/player.html?bvid=BV15rHSeyEk2&p=1&autoplay=0&danmaku=0&poster=1` | omitted | `https://www.bilibili.com/video/BV15rHSeyEk2/` |
| `bili-mineru-data-talk` | `external-video` | `https://player.bilibili.com/player.html?bvid=BV1uf421q7gp&p=1&autoplay=0&danmaku=0&poster=1` | omitted | `https://www.bilibili.com/video/BV1uf421q7gp/` |
| `bili-mineru25-deploy` | `external-video` | `https://player.bilibili.com/player.html?bvid=BV1UVnkzKEnk&p=1&autoplay=0&danmaku=0&poster=1` | omitted | `https://www.bilibili.com/video/BV1UVnkzKEnk/` |

Do not discover or substitute different videos. Use these exact crop percentages:

```ts
const MEDIA_CROPS = {
  'mineru-data-engine': {
    ddas: { x: 0.5, y: 37, width: 61.5, height: 31, label: 'DDAS' },
    cmcv: { x: 0.5, y: 69, width: 61.5, height: 30, label: 'CMCV' },
    judgeRefine: { x: 63, y: 0.5, width: 36.5, height: 67, label: 'Judge-and-Refine' },
    trainingRoutes: { x: 0.5, y: 0.5, width: 61.5, height: 35, label: '璁粌鍘诲悜' },
  },
  'mineru-ddas': {
    pageLevel: { x: 0.5, y: 0.5, width: 99, height: 48, label: '椤电骇閲囨牱' },
    elementLevel: { x: 0.5, y: 51, width: 62, height: 48, label: '鍏冪礌绾ч噰鏍? },
    jointSample: { x: 64, y: 51, width: 35.5, height: 48, label: '鑱斿悎骞宠　缁撴灉' },
  },
  'omni-output': {
    originalPdf: { x: 2.5, y: 4, width: 31, height: 84, label: '鍘熷 PDF' },
    outputA: { x: 34.4, y: 5, width: 31.3, height: 84, label: '杈撳嚭 A' },
    outputB: { x: 66.4, y: 5, width: 31.2, height: 84, label: '杈撳嚭 B' },
  },
  'omni-layout': {
    doubleColumn: { x: 2.2, y: 6, width: 31.2, height: 82, label: '鍙屾爮璁烘枃' },
    tripleColumn: { x: 34.1, y: 6, width: 31.2, height: 82, label: '涓夋爮鏂囨。' },
    complexLayout: { x: 66.1, y: 6, width: 31.2, height: 82, label: '澶嶆潅鐗堝紡' },
  },
  'omni-table': {
    rotated: { x: 2.2, y: 7, width: 31, height: 80, label: '鏃嬭浆琛ㄦ牸' },
    formula: { x: 34.2, y: 7, width: 31, height: 80, label: '鍏紡琛ㄦ牸' },
    mergedCells: { x: 66, y: 7, width: 31.4, height: 80, label: '鍚堝苟鍗曞厓鏍? },
  },
} as const;
```

Build `MEDIA_ASSETS` from this data using the table's stable paths and dimensions. Paper assets use `licenseReview: 'pending'` until a human publication review changes it. The three OmniDocBench assets use the forbidden claims `涓嶆槸 MinerU2.5-Pro 璁粌鏍锋湰` and `涓嶈兘榛樿瑙嗕负 296 椤?Hard`; the third-party video uses `涓嶈兘浣滀负璁烘枃鎬ц兘璇佹嵁`. Implement:

```ts
export type MediaAssetId = keyof typeof MEDIA_ASSETS;
export function getMediaAsset(id: MediaAssetId): MediaAsset {
  return MEDIA_ASSETS[id];
}
```

- [ ] **Step 7: Run tests and build**

Run:

```powershell
npm test -- src/data/media.test.ts
npm run build
```

Expected: all media tests PASS and build exits 0.

- [ ] **Step 8: Record the non-Git checkpoint**

Create the progress file with:

```markdown
# MinerU2.5-Pro Redesign Progress

- Task 1 complete: test harness, shared contracts, and media registry. Tests: `npm test -- src/data/media.test.ts`; build: `npm run build`.
```

---

