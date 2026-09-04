### Task 2: Shared Paper Media and Playback Primitives

**Files:**
- Create: `src/components/PaperMedia.test.tsx`
- Create: `src/components/PaperMedia.tsx`
- Create: `src/hooks/usePlaybackTimeline.test.tsx`
- Create: `src/hooks/usePlaybackTimeline.ts`
- Create: `src/styles/experience-foundation.css`
- Modify: `src/components/PaperFigureCard.tsx`
- Modify: `src/styles/paper-figures.css`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: `MediaAssetId`, `MediaCrop`, `getMediaAsset` from Task 1.
- Produces: `PaperMedia`, `PaperFigureViewer`, `usePlaybackTimeline(options)`.

- [ ] **Step 1: Write failing `PaperMedia` behavior tests**

Cover these exact behaviors:

```tsx
render(<PaperMedia assetId="omni-layout" cropId="doubleColumn" label="璁烘枃鍘熷浘鑺傞€? />);
expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringContaining('real-case-layout-diversity.png'));
expect(screen.getByText('璁烘枃鍘熷浘鑺傞€?)).toBeVisible();
fireEvent.error(screen.getByRole('img'));
expect(screen.getByRole('status')).toHaveTextContent('鍥剧墖鏆傛椂鏃犳硶鏄剧ず');
```

Also test that the full-view button opens a portal dialog, Esc closes it, and focus returns to the trigger.

- [ ] **Step 2: Run the media component test and confirm failure**

Run: `npm test -- src/components/PaperMedia.test.tsx`  
Expected: FAIL because `PaperMedia` and `PaperFigureViewer` do not exist.

- [ ] **Step 3: Refactor the controlled figure viewer**

Extract from `PaperFigureCard.tsx`:

```ts
export interface PaperFigureViewerProps {
  open: boolean;
  src: string;
  alt: string;
  title: string;
  width?: number;
  height?: number;
  hotspots?: readonly PaperFigureHotspot[];
  initialHotspotId?: string;
  onClose: () => void;
}
```

Keep the existing portal-to-`document.body`, focus trap, Esc handling, body scroll lock, centered desktop dialog, and mobile bottom sheet. Keep `PaperFigureCard` working by rendering this controlled viewer internally.

- [ ] **Step 4: Implement `PaperMedia`**

`PaperMedia` accepts:

```ts
interface PaperMediaProps {
  assetId: MediaAssetId;
  cropId?: string;
  label: '璁烘枃鍘熷浘鑺傞€? | '鍩轰簬璁烘枃閲嶇粯' | '鏁欏绀烘剰';
  caption?: string;
  hotspots?: readonly PaperFigureHotspot[];
  className?: string;
}
```

Render a stable aspect-ratio crop using CSS custom properties derived from the registry; keep the original `<img>` local. Provide a source link and an accessible full-view button. On image error, keep the caption/source and render a text fallback rather than collapsing the layout.

- [ ] **Step 5: Write failing playback-hook tests**

Use fake timers to verify:

```ts
const timeline = renderHook(() => usePlaybackTimeline({ durationMs: 24000, beatMs: [0, 8000, 16000, 24000] }));
act(() => timeline.result.current.play());
act(() => vi.advanceTimersByTime(8100));
expect(timeline.result.current.activeBeat).toBe(1);
act(() => timeline.result.current.seek(0.75));
expect(timeline.result.current.currentMs).toBe(18000);
act(() => document.dispatchEvent(new Event('visibilitychange')));
expect(timeline.result.current.playing).toBe(false);
```

- [ ] **Step 6: Run the hook test and confirm failure**

Run: `npm test -- src/hooks/usePlaybackTimeline.test.tsx`  
Expected: FAIL because the hook does not exist.

- [ ] **Step 7: Implement `usePlaybackTimeline`**

Export and use exactly:

```ts
interface PlaybackTimelineOptions {
  durationMs: number;
  beatMs: readonly number[];
  initialMs?: number;
}

interface PlaybackTimelineState {
  currentMs: number;
  progress: number;
  activeBeat: number;
  playing: boolean;
  reducedMotion: boolean;
  play(): void;
  pause(): void;
  toggle(): void;
  seek(progress: number): void;
  step(delta: -1 | 1): void;
  replay(): void;
}

export declare function usePlaybackTimeline(options: PlaybackTimelineOptions): PlaybackTimelineState;
```

Use `requestAnimationFrame`, clamp all times, pause on `document.hidden`, and cancel the frame on unmount. Under reduced motion, never autoplay; `seek` and `step` still work immediately.

- [ ] **Step 8: Add foundation styles and verify**

Add source-label, paper-crop, viewer-trigger, visible focus, 44px control, error fallback, and reduced-motion rules to `experience-foundation.css`; import it in `main.tsx` after `paper-figures.css`.

Run:

```powershell
npm test -- src/components/PaperMedia.test.tsx src/hooks/usePlaybackTimeline.test.tsx
npm run build
```

Expected: all Task 2 tests PASS and build exits 0. Append a Task 2 checkpoint line to the progress ledger.

---

