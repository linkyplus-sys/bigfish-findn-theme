# 蓝鲸娘 AOD v06

蓝鲸娘保持原画配色和全程睁眼，身体和头发缓缓摆动。v06 补全了画面左侧的右手，手腕和指尖搭在围裙边。双臂随躯干整体摆动。

[Find N 手机 GIF](./交付/蓝鲸娘AOD-v06-FindN.gif)为 320 × 320、20 fps、120 帧，6 秒循环。[动画预览](./交付/蓝鲸娘AOD-v06-预览.mp4) · [静帧](./交付/蓝鲸娘AOD-v06-静帧.png)

在支持 GIF 导入的 Find N 息屏设置中，从「图文组合」选择手机 GIF。v06 已核对导出帧内手腕和指尖的位置。

## 重建动图

在本目录使用 PowerShell、Node.js 和 FFmpeg 运行以下命令。

```powershell
node ./制作原画微动.mjs (Get-Command ffmpeg.exe).Source
./导出AOD.ps1
```
