### Task 4: CmcvRoutingChallenge and RenderForensics

**Files:**
- Create: `src/experiences/CmcvRoutingChallenge.test.tsx`
- Create: `src/experiences/CmcvRoutingChallenge.tsx`
- Create: `src/experiences/RenderForensics.test.tsx`
- Create: `src/experiences/RenderForensics.tsx`
- Create: `src/styles/experience-labeling.css`

**Interfaces:**
- Consumes: `ChapterExperienceProps`, `PaperMedia`.
- Produces: stable states for `cmcv-router`, `cmcv-trust`, and `render-verify`.

- [ ] **Step 1: Write failing CMCV challenge tests**

Use the Medium example: target output differs while the two external outputs agree. Verify both drag/drop and button alternatives:

```tsx
await user.click(screen.getByRole('button', { name: '閫佸叆 Medium' }));
expect(screen.getByText('涓や釜澶栭儴妯″瀷涓€鑷?)).toBeVisible();
expect(screen.getByText('鍙潬澶栭儴绛旀')).toBeVisible();
expect(onStateChange).toHaveBeenCalledWith({ moduleId: 'cmcv-router', state: 'medium' });
await user.click(screen.getByRole('button', { name: '鎻ず鍏辫瘑杈圭晫' }));
expect(screen.getByText(/鍏辫瘑涓嶇瓑浜庣湡鍊?)).toBeVisible();
expect(onStateChange).toHaveBeenCalledWith({ moduleId: 'cmcv-trust', state: 'consensus:correct' });
```

- [ ] **Step 2: Run CMCV tests and confirm failure**

Run: `npm test -- src/experiences/CmcvRoutingChallenge.test.tsx`  
Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement `CmcvRoutingChallenge`**

Use the OmniDocBench original-page crop only as an input anchor. Keep all A/B/C outputs synthetic and labeled. Display stable agreement/disagreement paths, animate the sample token into the chosen lane, then show route, label source, and training destination beside that lane. An incorrect answer explains the exact pairwise relation without shaking the entire layout. Completion occurs after one route attempt, correct or incorrect.

- [ ] **Step 4: Write failing render-forensics tests**

Verify the slider updates the visual state, the hotspot appears after the threshold, and repair synchronizes source/render state:

```tsx
fireEvent.change(screen.getByRole('slider', { name: '缁撴瀯涓庡師鍥惧姣旇繘搴? }), { target: { value: '72' } });
expect(screen.getByRole('button', { name: '淇鍚堝苟鍗曞厓鏍奸敊浣? })).toBeVisible();
await user.click(screen.getByRole('button', { name: '淇鍚堝苟鍗曞厓鏍奸敊浣? }));
expect(onStateChange).toHaveBeenCalledWith({ moduleId: 'render-verify', state: 'repaired' });
expect(onComplete).toHaveBeenCalledTimes(1);
```

- [ ] **Step 5: Run render tests and confirm failure**

Run: `npm test -- src/experiences/RenderForensics.test.tsx`  
Expected: FAIL because the component does not exist.

- [ ] **Step 6: Implement `RenderForensics`**

Use the formula/merged-cell paper crop as the visual target. The single range input controls a CSS split and maps to `compare-p0`, `compare-p50`, or `compare-p100`; a threshold reveals one keyboard-accessible hotspot. Repair changes source lines, alignment, and diff overlay in the same frame. Keep the expert fallback as one boundary sentence and label all generated code/errors as teaching demonstrations.

- [ ] **Step 7: Add distinct routing and forensic styles**

CMCV uses lanes and a movable token; Render uses layered paper imagery, a vertical split handle, and a localized heatmap. Do not reuse the data-experience card arrangement. Under reduced motion, lanes and diff states update instantly.

- [ ] **Step 8: Verify Task 4**

Run:

```powershell
npm test -- src/experiences/CmcvRoutingChallenge.test.tsx src/experiences/RenderForensics.test.tsx
npm run build
```

Expected: tests PASS and build exits 0. Append the Task 4 checkpoint.

---

