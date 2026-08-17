### Task 7: Compact Bilibili Footer and Research/Copy Reduction

**Files:**
- Create: `src/components/FurtherLearning.test.tsx`
- Modify: `src/components/FurtherLearning.tsx`
- Modify: `src/data/further-learning.ts`
- Modify: `src/styles/further-learning.css`
- Modify: `src/App.tsx`
- Modify: `src/styles/paper.css`

**Interfaces:**
- Consumes: the three `external-video` entries from `MEDIA_ASSETS` and all primary/foundation resources.
- Produces: an optional footer-only player with one global consent prompt and no progress model.

- [ ] **Step 1: Write failing footer-video tests**

Assert:

```tsx
expect(screen.getAllByRole('button', { name: /鎾斁/ })).toHaveLength(3);
expect(document.querySelector('iframe')).toBeNull();
expect(screen.queryByText(/瑙傜湅鍓峾瑙傜湅涓瓅鐪嬪畬鍚巪瀹屾垚杩涘害|閲嶆柊鑷/)).not.toBeInTheDocument();
await user.click(screen.getAllByRole('button', { name: /鎾斁/ })[0]);
expect(screen.getByRole('dialog', { name: '杩炴帴绗笁鏂硅棰? })).toBeVisible();
await user.click(screen.getByRole('button', { name: '缁х画鎾斁' }));
expect(screen.getByTitle(/Bilibili/)).toBeVisible();
await user.keyboard('{Escape}');
expect(document.querySelector('iframe')).toBeNull();
```

Spy on localStorage and assert the video footer never writes video progress.

- [ ] **Step 2: Run footer tests and confirm failure**

Run: `npm test -- src/components/FurtherLearning.test.tsx`  
Expected: FAIL because the current component still renders the three-stage task flow.

- [ ] **Step 3: Simplify the video data model**

Remove `VideoLearningTask`, `videoTask`, `embedHref`, self-check options, correct answers, retry feedback, and related-chapter links. Add exact optional fields:

```ts
videoAssetId?: MediaAssetId;
videoWhy?: string;
watchFor?: readonly [string, string];
```

Keep all three video entries, original-page links, provider, source boundary, and the primary/foundation resource sections. Resolve the iframe URL from `getMediaAsset(videoAssetId).src`; do not duplicate embed URLs in `further-learning.ts`.

- [ ] **Step 4: Implement the compact footer**

Render three compact video cards only under the final supplemental section. The first playback request in the current page session opens one consent dialog; after consent, later cards may open directly. Never persist consent or progress. Keep a close button, Esc, focus return, iframe destruction, original-page fallback, and at most two observation bullets.

- [ ] **Step 5: Compress research directions without deleting content**

Replace six large detail cards with a compact two-row index. Each item keeps its title and one sentence; opening one item reveals the existing explanation. Keep 鈥滅爺绌惰€呰瑙掆€?visually distinct from paper facts.

- [ ] **Step 6: Verify Task 7**

Run:

```powershell
npm test -- src/components/FurtherLearning.test.tsx src/App.test.tsx
npm run build
```

Expected: tests PASS and build exits 0. Append the Task 7 checkpoint.

---

