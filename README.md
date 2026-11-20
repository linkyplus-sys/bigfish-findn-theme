# 大肥鱼 · 深海蓝釉

为国行 OPPO Find N（PEUM00）制作的个人主题。以蓝鲸娘和深海蓝釉为主视觉，保留桌面静态壁纸与动态锁屏的衔接。

主要验收固件为 ColorOS `PEUM00_14.0.0.2701(CN01)`。首发版包含以下七项。

| 模块 | 内容 |
| --- | --- |
| 图标包 | 深海 v0.40、浅海 v0.38。覆盖 1,041 个应用包、2,841 个启动入口。[图标在线预览](icon-gallery/README.md) |
| 时钟组件 | v0.8.6，含深海动态全宽、静态全宽和 2×2，可读取原生天气。[时钟组件](<coloros-findn-v01/壁纸与组件-v02/README.md>) |
| 锁屏视频 | 外屏 1440 × 2560、内屏 1440 × 1344，均为静音 MP4。[锁屏视频与构建](<coloros-findn-v01/锁屏视频-v01/README.md>) |
| 壁纸 | 深海蓝釉 v04，包含内外屏桌面 PNG。[壁纸](<coloros-findn-v01/深海桌面-v04/README.md>) |
| AOD | 蓝鲸娘 v06，右手完整随躯干摆动。含手机 GIF、静帧和制作源码。[AOD](<coloros-findn-v01/AOD原画重制-v06/README.md>) |
| 输入法 | 百度输入法定制版 V2.2 玻璃键帽、浪纹和原创按键音的本机复现流程。[输入法](<coloros-findn-v01/输入法深海-v01/README.md>) |
| 控制中心图标 | 深海 SVG 图稿，以及适用已验收 Find N 固件的 Root 覆盖模块源码。[图稿](<coloros-findn-v01/控制中心/深海图稿-v01/README.md>) · [覆盖包](<coloros-findn-v01/控制中心/覆盖包-v01/README.md>) |

## 直接安装图标包

只想更换桌面图标，下载任意一个 APK，安装后在 ColorOS 桌面应用即可。这个流程无需 Root、ADB 或其他主题模块。

| 版本 | 下载 |
| --- | --- |
| 深海蓝釉 v0.40 | [下载深海 APK](https://github.com/linkyplus-sys/bigfish-findn-theme/releases/download/findn-icons-v0.40/bigfish-findn-deep-v0.40.apk) |
| 浅海 v0.38 | [下载浅海 APK](https://github.com/linkyplus-sys/bigfish-findn-theme/releases/download/findn-icons-v0.40/bigfish-findn-shallow-v0.38.apk) |

1. 在手机上打开下载的 APK 并安装。两套可以同时安装，桌面一次应用一套。
2. 长按桌面空白处，进入「图标」，选择「大肥鱼深海」或「大肥鱼浅海」并应用。

国行 OPPO Find N 的 ColorOS 14 原生桌面已实测。其他 OPPO 机型或 ColorOS 版本需支持选择第三方图标包。若能选中图标包，但部分应用仍显示原图标，先核对该应用的**包名和启动 Activity**。不同机型、系统版本或应用版本可能需要更新对应映射，再重新构建。常用应用的映射在 [入口映射.json](<coloros-findn-v01/入口映射.json>)，扩容应用的映射在 [扩容目录](<coloros-findn-v01/扩容/>)。

[Release 与文件校验值](https://github.com/linkyplus-sys/bigfish-findn-theme/releases/tag/findn-icons-v0.40)

![Find N 外屏动态锁屏与深海桌面](<coloros-findn-v01/锁屏视频-v01/验收/外屏新版-锁屏与解锁.png>)

## 图标在线预览

[![深海蓝釉常用应用图标](icon-gallery/daily-01.png)](icon-gallery/README.md)

[查看全部 1,041 款应用图标](icon-gallery/README.md)

## 构建图标包

在 Windows PowerShell 7 中运行。工具目录包含 JDK 17、Android SDK Platform 34 和 Build Tools 35.0.0，使用 `-ToolRoot` 指定本地 SDK 工具目录。

```powershell
& '.\coloros-findn-v01\扩容\构建1040款验收包.ps1' -Modes dark -ToolRoot 'C:\android-kit'
```

省略 `-Modes dark` 会同时构建浅海。输出在 `coloros-findn-v01/.build/1040-覆盖验收/`。首次构建会生成本地测试签名。已有安装需要沿用原签名才能覆盖升级。

## 许可

自有代码与已标注许可的原创素材允许非商业二创和分享。请保留署名和来源，素材改作须注明改动。[许可与署名](LICENSE.md) · [发布说明](<发布说明.md>)
