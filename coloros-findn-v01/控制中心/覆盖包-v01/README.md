# Find N 控制中心 · 深海图标覆盖

适用国行 OPPO Find N（PEUM00），已验收固件为 `PEUM00_14.0.0.2701(CN01)`，使用 Magisk 30.7。2.3 图标覆盖含 75 个入口和 74 款独立图形。系统按功能、地区和应用状态决定候选开关是否出现。[深海图稿与预览](<../深海图稿-v01/README.md>)

构建需要 Node.js、JDK 17、Android SDK Platform 34 和 Build Tools 35.0.0。准备同固件的 `SystemUI.apk`，将有映射的设置和应用 APK 按包名放在其同级目录的 `tiles/` 下，包名见 [资源映射](<资源映射.mjs>)。

```powershell
& '.\coloros-findn-v01\控制中心\覆盖包-v01\构建覆盖包.ps1' `
    -ToolRoot 'C:\android-kit' -StockRoot 'C:\findn-stock-resources'
```

在 Magisk 里安装输出的 `bigfish-findn-qs-deep-v01.zip` 并重启。恢复时停用「BigFish Find N Quick Settings」模块并重启。
