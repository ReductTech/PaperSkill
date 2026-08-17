### Task 5: TrainingTimeline and MgamMatchingPuzzle

**Files:**
- Create: `src/experiences/TrainingTimeline.test.tsx`
- Create: `src/experiences/TrainingTimeline.tsx`
- Create: `src/experiences/MgamMatchingPuzzle.test.tsx`
- Create: `src/experiences/MgamMatchingPuzzle.tsx`
- Create: `src/styles/experience-training.css`

**Interfaces:**
- Consumes: `ChapterExperienceProps`, `usePlaybackTimeline`, `PaperMedia`, centralized facts.
- Produces: stable states for `stage-training`, `grpo-lab`, `mgam-lab`, and `results-boundary`.

- [ ] **Step 1: Write failing training-player tests**

Verify play/pause, scrub, stage facts, and the Stage 3 task switch:

```tsx
await user.click(screen.getByRole('button', { name: '鎾斁璁粌杩囩▼' }));
act(() => vi.advanceTimersByTime(8100));
expect(screen.getByText('3.9M')).toBeVisible();
expect(screen.getByText('Replay')).toBeVisible();
fireEvent.change(screen.getByRole('slider', { name: '璁粌鏃堕棿杞? }), { target: { value: '75' } });
expect(screen.getAllByTestId('rollout-dot')).toHaveLength(16);
await user.click(screen.getByRole('button', { name: '琛ㄦ牸鎸囨爣' }));
expect(onStateChange).toHaveBeenCalledWith({ moduleId: 'grpo-lab', state: 'metric-teds' });
```

- [ ] **Step 2: Run training tests and confirm failure**

Run: `npm test -- src/experiences/TrainingTimeline.test.tsx`  
Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement `TrainingTimeline`**

Use a 24-second timeline with boundaries `[0, 8000, 16000, 24000]`. Stage 1 shows `65.5M`; Stage 2 shows `3.9M` and `鍏朵腑192K Hard` with a Replay loop; Stage 3 shows the paper-supported high-quality set and exactly 16 rollout dots. Task buttons map text鈫扙dit Distance, formula鈫扖DM, table鈫扵EDS, layout鈫扞oU. Use stable keyed candidates so reordering animates rather than remounts. Reaching Stage 3 does not complete until the user views one task-specific ranking.

- [ ] **Step 4: Write failing MGAM puzzle tests**

Verify a distinct held-out sample, locked GT, prediction-only merges, and evidence reveal:

```tsx
expect(screen.getByText('HELD-OUT TEST')).toBeVisible();
expect(screen.getByText('TEST-296')).toBeVisible();
await user.click(screen.getByRole('button', { name: '鍚堝苟棰勬祴鍧?1 鍜?2' }));
expect(onStateChange).toHaveBeenCalledWith({ moduleId: 'mgam-lab', state: 'partition-2' });
await user.click(screen.getByRole('button', { name: '鍚堝苟棰勬祴鍧?2 鍜?3' }));
expect(screen.getByText('鍚堢悊鍖归厤')).toBeVisible();
expect(screen.getByText('94.08')).toBeVisible();
expect(screen.getByText('+2.07')).toBeVisible();
```

Also assert that the page says the real Markdown comparison is not an original MGAM example.

- [ ] **Step 5: Run MGAM tests and confirm failure**

Run: `npm test -- src/experiences/MgamMatchingPuzzle.test.tsx`  
Expected: FAIL because the component does not exist.

- [ ] **Step 6: Implement `MgamMatchingPuzzle`**

Render GT as immutable and prediction separators as buttons. Groups transition `partition-3 鈫?partition-2 鈫?partition-1`; matching lines and qualitative score update on every merge. After the correct grouping, reveal the endpoint waterfall `92.98 鈫?94.29 鈫?95.25 鈫?95.69`, the rounded increments note, Base `96.12` not first, Hard `94.08`, v2 second place `92.01`, and lead `2.07`. Keep the appendix `92.48/1.60` discrepancy in the folded evidence, not the primary chart.

- [ ] **Step 7: Add player and puzzle styles**

Training uses a cinematic horizontal track with dense occupied first frame and no hidden rollout layout slot before Stage 3. MGAM uses tactile separators, block convergence, recomputed connection lines, and a single-use waterfall reveal. Mobile layouts stack without changing the interaction semantics.

- [ ] **Step 8: Verify Task 5**

Run:

```powershell
npm test -- src/experiences/TrainingTimeline.test.tsx src/experiences/MgamMatchingPuzzle.test.tsx
npm run build
```

Expected: tests PASS and build exits 0. Append the Task 5 checkpoint.

---

