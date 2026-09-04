# Task 3 独立审查

**VERDICT: FAIL**

## 阻断项

1. **HIGH — `page-ddas` 状态机不符合约定。** [DdasMicroscope.tsx:18](../../../src/experiences/DdasMicroscope.tsx#L18) 只恢复 `ddas`，而 [25-34](../../../src/experiences/DdasMicroscope.tsx#L25) 的两条页面路径也只写入 `ddas`；`random` 与 `cluster` 从未写入、也无法由深链恢复。Task brief 要求覆盖并上报 `random|cluster|ddas`，因此状态历史和复现都不完整。
2. **HIGH — Figure 3 的页面级/元素级切换不可逆，且三种输入不等价。** [90-95](../../../src/experiences/DdasMicroscope.tsx#L90) 进入元素级后没有指针/触控的“返回页面级”控制；只有键盘 Enter 会在 [56](../../../src/experiences/DdasMicroscope.tsx#L56) 隐式回到页面级。移动端又在 CSS 中隐藏完整控制组 [experience-data.css:19](../../../src/styles/experience-data.css#L19)，只保留“进入簇/放大公式”，无法查看文本或表格元素。未满足可逆切换和 pointer、keyboard、mobile 等价路径。
3. **MEDIUM — 512 维 ViT-base 事实在同一主画面重复。** [DdasMicroscope.tsx:67](../../../src/experiences/DdasMicroscope.tsx#L67) 与 [99](../../../src/experiences/DdasMicroscope.tsx#L99) 各出现一次，违反 brief/spec 的“显示一次”文案约束；约 60M 和 K/权重未披露的表述本身正确。

## 已核实

- 两种体验的主形态清晰不同（反事实双栏 vs. 显微镜画布）；Figure 3 保持单一 `figure-3-canvas`，簇/元素覆盖按条件渲染，不保留隐藏内容空高。
- 6 秒自动预览仅调用本地 `setPreviewComplete` [DataCounterfactual.tsx:15](../../../src/experiences/DataCounterfactual.tsx#L15)，不写状态、不完成；用户选择才写状态，`+2.71` 仅归因完整数据工程与训练流程 [77-78](../../../src/experiences/DataCounterfactual.tsx#L77)。reduced-motion 直接静态终态，桌面控制目标至少 44px、移动主按钮 52px。
- 图像来自注册的本地媒体；Figure S7 的禁用论断、DDAS 的 K 与采样权重未披露均有明确边界。注意簇缩略图直接使用 `<img>` [DdasMicroscope.tsx:83](../../../src/experiences/DdasMicroscope.tsx#L83)，未获得 `PaperMedia` 的本地图片失败占位，建议随修复一并包裹/补全。

## 新鲜验证

- `npm test -- src/experiences/DataCounterfactual.test.tsx src/experiences/DdasMicroscope.test.tsx`: 2 files / 5 tests passed。
- `npm test`: 6 files / 12 tests passed；`npm run build`: passed；`node ..\\PaperSkill\\paper-skill\\scripts\\validate-output.js .`: PASS（6 chapters、11 active modules）。
