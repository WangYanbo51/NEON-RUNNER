# NEON RUNNER · 霓虹跑酷

3D 第三人称无尽跑酷，地铁跑酷玩法复刻，霓虹赛博朋克风格。Vite 8 + Three.js，所有美术资源由代码程序化生成，不依赖任何图片/模型文件。

---

## 一、环境要求

| 项目 | 要求 | 你机器上的实际情况 |
| --- | --- | --- |
| Node.js | ≥ 22.12 | v26.13.1 ✅ |
| npm | ≥ 10 | 11.20.0 ✅ |
| 浏览器 | 支持 WebGL2（Chrome / Edge 均可） | Edge ✅ |

Node.js 安装位置：`D:\Program Files\nodejs`（非默认 C 盘路径，正常）。

打开一个 **PowerShell** 或 **CMD** 窗口，验证一下：

```bash
node -v
npm -v
```

能分别输出版本号就说明环境没问题。**如果提示「不是内部或外部命令」**，说明 Node 目录没进 PATH，把 `D:\Program Files\nodejs` 加到系统环境变量 Path 里，然后重开终端。

---

## 二、跑起来（三步）

```bash
cd C:\Users\WYB51\WorkBuddy\2026-11-18-14-02-00\neon-runner
npm install
npm run dev
```

终端出现下面这样的输出就成功了：

```
  VITE v8.3.8  ready in 353 ms

  ➜  Local:   http://127.0.0.1:5183/
```

用浏览器打开 **http://127.0.0.1:5183/** ，点「开始奔跑」即可。

> **关于 `npm install`**：这个工程的依赖（three + vite）已经装好了，`node_modules` 就在目录里。
> 平时直接 `npm run dev` 就行，**只有**在你换了机器、删了 `node_modules`、或者改了 `package.json` 依赖时才需要重新 `npm install`。

停止服务：在运行 `npm run dev` 的终端里按 `Ctrl + C`。

---

## 三、操作方式

| 操作 | 键盘 | 说明 |
| --- | --- | --- |
| 左移一轨 | `←` 或 `A` | 三条轨道间切换 |
| 右移一轨 | `→` 或 `D` | |
| 跳跃 | `↑` 或 `W` 或 `空格` | 越过低矮栏杆 |
| 滑铲 | `↓` 或 `S` | 从门框横梁下滑过；空中按则是快速下坠 |
| 开始 / 重开 | `空格` 或 `Enter` | 结算界面需等 0.5 秒后才能重开，防误触 |
| 静音切换 | `M` | |
| 手机端 | 上/下/左/右滑动 | 轻点屏幕 = 跳跃 |

**怎么躲**：低矮栏杆跳过去，门框横梁滑铲过去，货箱和列车只能换轨道躲。金币只会出现在安全的轨道上，跟着金币走基本不会撞。

---

## 四、打包发布

```bash
npm run build      # 产物输出到 dist/ 目录
npm run preview    # 本地预览打包结果
```

`npm run preview` 默认地址是 http://127.0.0.1:4173 （以终端实际输出为准）。

`dist/` 是纯静态文件，丢到任意静态服务器（Nginx、GitHub Pages、Vercel、对象存储）就能上线。**注意：不能直接双击 `dist/index.html` 打开**，因为用了 ES Module，`file://` 协议会被浏览器拦截，必须通过 HTTP 服务访问。

---

## 五、出问题怎么排查

**1. `npm run dev` 报端口被占用**
正常现象，Vite 会自动往后找空闲端口。看终端打印的 `Local:` 那一行地址即可，不一定还是 5183。

**2. 打开页面一片黑**
按 `F12` 打开控制台看报错。常见原因：
- WebGL 被禁用 → 地址栏访问 `edge://gpu` 确认硬件加速开启
- 显卡驱动过旧 → 更新驱动，或在浏览器设置里开启「使用图形加速」

**3. 画面卡顿、帧率低**
打开 `src/game/scene.js`，找到这两行，把 `1.8` 改成 `1`：

```js
this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
this.composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
```

**4. 没有声音**
浏览器策略要求音频必须在用户交互后才能播放。点「开始奔跑」按钮时才会解锁音频，这是正常的，不是 bug。另外检查是不是按到了 `M` 静音。

**5. `npm install` 很慢**
先确认 npm 源是否指向国内镜像：

```bash
npm config get registry
```

如果不是 `https://registry.npmmirror.com`，执行：

```bash
npm config set registry https://registry.npmmirror.com
```

---

## 六、目录结构

```
neon-runner/
├── index.html              页面骨架 + HUD + 开始/结算弹层
├── vite.config.js          端口 5183、构建配置
├── package.json
├── src/
│   ├── main.js             游戏状态机（ready / playing / over）与主循环
│   ├── style.css           霓虹 UI 样式、扫描线、暗角
│   └── game/
│       ├── constants.js    所有可调数值：速度、重力、跳跃、轨道坐标
│       ├── scene.js        3D 世界：网格地面、霓虹轨道、程序化城市、泛光后期
│       ├── player.js       角色模型、奔跑动画、跳跃/滑铲姿态、碰撞盒
│       ├── spawner.js      障碍与金币的生成、回收池、碰撞判定
│       ├── input.js        键盘 + 触屏滑动输入
│       ├── audio.js        WebAudio 合成的音效（无音频文件）
│       └── hud.js          分数/金币/速度/距离的 DOM 更新
└── dist/                   打包产物
```

---

## 七、想自己调参数

绝大多数手感相关的数值都在 `src/game/constants.js`，改完保存浏览器会自动热更新：

| 常量 | 当前值 | 作用 |
| --- | --- | --- |
| `SPEED_START` | 17 | 起始速度（m/s） |
| `SPEED_MAX` | 47 | 速度上限 |
| `SPEED_ACCEL` | 0.42 | 每秒加速度，调大更难 |
| `JUMP_VELOCITY` | 12.4 | 跳跃初速度，调大跳更高 |
| `GRAVITY` | 34 | 重力，调大下落更快 |
| `SLIDE_DURATION` | 0.62 | 滑铲持续时间（秒） |
| `LANES` | `[-2.25, 0, 2.25]` | 三条轨道的横向坐标 |

想改难度曲线，看 `spawner.js` 里的 `computeGap()`——障碍投放间隔是按「跑过的距离」算的（当前为速度 × 1.18~1.68），所以反应时间恒定在 1.2~1.7 秒。

---

## 八、调试参数

地址栏加参数可以直接跳过一些流程，方便调试：

| 参数 | 作用 |
| --- | --- |
| `?autostart=1` | 跳过开始页直接开局，例如 `http://127.0.0.1:5183/?autostart=1` |
| `?fixeddt=1` | 固定步长 1/60 秒，适合录屏或做帧级比对，正常游玩不要开 |

打开浏览器控制台，还有一个 `__runner` 对象可以直接操作游戏内部：

```js
__runner.state          // 'ready' | 'playing' | 'over'
__runner.stats          // { score, coins, distance, speed }
__runner.player         // 角色对象，可读 lane / y / grounded / sliding
__runner.spawner        // 生成器，可手动 addObstacle('train', 0, -30) 造场景
__runner.startGame()    // 直接开局
```

---

## 当前版本已实现 / 未实现

**已实现**：三轨切换、跳跃、滑铲、金币收集、四类障碍（低栏杆 / 门框 / 货箱 / 列车）、速度递增、镜头跟随与 FOV 拉伸、撞击结算、最高分本地存储、键鼠与触屏操作、程序化音效。

**未实现**：道具系统（磁铁 / 喷气背包 / 滑板）、多角色解锁、每日任务、可跳上列车车顶、移动列车。
