# MHA 猎人操作图鉴

《怪物猎人 荒野》与《怪物猎人 世界 / 冰原》的 PC 键鼠 + 手柄默认键位交互图鉴。单页应用，无需构建、无需联网，双击即用。

## 在线查看

推送到 GitHub 后开启 Pages（见下文），即可通过链接直接访问；也可下载仓库后双击 `index.html` 本地打开。

## 功能

- **键鼠 / DualSense 双视图**：中央为可点击的 87 键键盘、7 键鼠标与手柄示意图，两侧为功能列表。
- **点击连线**：点击任意按键或功能行，拉出连线并互相高亮；组合键中的所有按键同步点亮。
- **战斗 / 系统分层**：战斗含通用动作与 14 种武器招式；系统含界面菜单、道具快捷栏、地图导航、移动坐骑、联机记录五类。
- **两作对照表**：页面底部将荒野与世界的键鼠、PlayStation 手柄、Xbox 手柄分为独立列，逐行对齐；支持全量搜索与「存疑清单」过滤。
- **输入语义标签**：组合键（同时按下）、连招（依次输入）、长按（持续输入）使用不同视觉标记。

## 文件结构

```
index.html          入口页（自动跳转到图鉴）
mh-controls.html    图鉴主页（数据与骨架）
mh-interface.css    视觉与三栏布局
mh-interface.js     数据整理与交互逻辑
serve.ps1           可选：本地预览静态服务（PowerShell）
```

## 本地运行

双击 `index.html` 或 `mh-controls.html` 即可。若浏览器对本地文件有限制，可在目录下执行：

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1
```

然后访问 `http://127.0.0.1:8860/mh-controls.html`。

## 数据说明

- 键鼠部分以《怪物猎人 荒野》游戏内「键鼠设置」截图（2025）与《怪物猎人 世界：冰原》Iceborne Type 1 资料为准，并逐条核对游戏内默认表。
- 武器招式栏由既有武器资料按各版本键位映射推导，页面中统一标注「映射推导 · 待核对」，未在游戏内逐招验证。
- 「存疑清单」集中列出待核对与未分配键位；未收录不等于游戏中没有绑定。
- 页面仅做查询展示，不会修改任何游戏设置。

## 资料来源

- [游侠网 · 荒野操作按键说明](https://gl.ali213.net/html/2025-2/1616997.html)
- [Shacknews · MHW 冰原 PC 键位](https://www.shacknews.com/article/106612/pc-keyboard-controls-and-key-bindings-monster-hunter-world)
- [3DM · MHW 键鼠与手柄对照](https://www.3dmgame.com/gl/3745289.html)
- [游民星空 · 荒野铳枪招式按键](https://www.gamersky.com/handbook/202504/1910985_2.shtml)
- 图标取自 [Simple Icons](https://simpleicons.org/)（CC0）；PlayStation、Xbox 等商标归各自权利人所有，本仓库为非官方操作参考。

## 许可

代码可自由使用与修改；游戏相关名称与素材版权归 Capcom 所有。
