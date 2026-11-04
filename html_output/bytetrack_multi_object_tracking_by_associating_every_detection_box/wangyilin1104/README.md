# ByteTrack：从检测框到连续轨迹

ByteTrack 中文交互式论文导读。使用同一个公交站遮挡街景，比较高分框关联与两阶段关联，并沿着轨迹历史接到下一次的预测主题。

## 本地运行

```sh
npm ci
npm run dev
npm run build
```

- 逐帧街景、框坐标和分数是本项目生成的教学示意。模拟使用简单匀速外推、IoU 门槛和小规模一对一分配。
- 完整 ByteTrack 使用 Kalman Filter，原实现还包含新轨迹确认等细节。网页的示意阈值和模拟结果不可当作论文复现实验。
- 实测数字来自论文表 4，MOT17 测试集、私有检测器协议。
- 场景图形由项目内 SVG 绘制。来源为 [ByteTrack 论文](https://arxiv.org/abs/2110.06864)及[官方实现](https://github.com/ifzhang/ByteTrack)。
