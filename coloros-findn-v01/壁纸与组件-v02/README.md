# Find N 桌面时钟组件

时钟组件 v0.8.6 提供深海动态全宽、深海与浅海静态全宽，以及两种 2×2 样式。动态版的蓝鲸娘在礁石后探头，静态版可作为日常替代。天气从 ColorOS 原生天气获取，可在组件应用里打开原生天气入口。时间下方仍显示日期。

在 Windows PowerShell 7 中使用 Node.js、FFmpeg 和与图标包相同版本的 Android 构建工具。

```powershell
& '.\coloros-findn-v01\壁纸与组件-v02\构建时钟组件.ps1' -ToolRoot 'C:\android-kit'
```

安装输出 `bigfish-findn-clock-v086.apk`，从「大肥鱼时钟」应用或桌面的组件列表添加。已有时钟组件安装需要沿用原签名覆盖升级。[动态时钟实拍](<验收/动态时钟/Find N 动态时钟真机预览.png>)
