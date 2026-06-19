# 珍本策展室（Curated Rare Room）设计规范 2.0

## 设计目标
把当前「印刷学术期刊」基调升级为「珍本室 + 画廊」的混合质感：权威、温暖、精选、有层次感。解决当前页面"灰蒙蒙"、卡片太平、导航拥挤的问题。

## 色彩系统

| Token | 色值 | 用途 |
|---|---|---|
| `paper` | `#f7f4ed` | 主背景，比当前 `#f8f6f1` 更暖 |
| `paper-raised` | `#ffffff` | 卡片、浮层 |
| `ink` | `#1f1a14` | 主标题、正文（加深，解决灰蒙蒙） |
| `ink-soft` | `#4a4238` | 次要文字 |
| `ink-mute` | `#8a8070` | 禁用、元信息（比现在更暖、可读） |
| `rule` | `#e0d8c8` | 分割线、边框 |
| `accent` | `#7a5c3c` | 主强调色（深黄铜/古铜） |
| `accent-light` | `#b8976b` | hover、高亮 |
| `moss` | `#4a5d45` | 主按钮、链接、学科标签 |
| `moss-soft` | `#7a9178` | moss 的 hover/轻量版本 |
| `ochre` | `#a67c52` | 次级标签、标记 |
| `ochre-soft` | `#c9a67e` | ochre hover |

## 字体系统
保持不变：
- Display: Cormorant Garamond 600
- Serif body: EB Garamond / Noto Serif SC
- Mono metadata: JetBrains Mono

## 全局质感
1. **纸张纹理**：在 body 背景上叠加极淡的噪点/纹理
   ```css
   background-color: var(--paper);
   background-image: url("data:image/svg+xml,..."); /* 噪点纹理 */
   ```
2. **提升对比度**：正文颜色从 `#3c3c3c` 调整为 `#4a4238`，标题 `#1f1a14`
3. **阴影**：卡片使用极淡的暖灰色阴影，不是冷灰色
   ```css
   box-shadow: 0 1px 2px rgba(31, 26, 20, 0.04), 0 2px 8px rgba(31, 26, 20, 0.06);
   ```
4. **圆角**：统一使用 `2px`，保持克制
5. **边框**：默认 `1px solid var(--rule)`，hover 时过渡到 `var(--ink-mute)` 或 `var(--moss)`

## 组件规范

### ResourceCard
- 左侧添加 3px 学科色带
- 白色底 `#fff`，细边框，极淡阴影
- hover：上浮 2px，阴影加深，边框颜色加深
- 标题：Cormorant Garamond 1.5rem，hover 变 moss
- 作者/年份/venue：JetBrains Mono 13px，颜色 ink-soft
- 标签：赭石描边胶囊，hover 填充赭石浅色背景
- 底部操作区：type 标签 + download/source/details 链接
- 收藏按钮：hover 金色圆环扩散（可选）

### DisciplineCard
- 每个学科有固定颜色（映射表）
- 编号 01-06 用 JetBrains Mono 11px
- 展开后下方资源卡片间距 32px
- "N RESOURCES" 标签不要边框，改用浅灰背景 pill
- Chevron 旋转动画更顺滑

### SiteHeader
- 右侧按钮组简化：搜索框保留，语言切换改为纯文字小按钮，登录合并为用户图标
- 导航 active 状态：底部 1.5px moss 下划线，而不是仅变色
- 添加 skip-to-content 链接（可访问性）
- 移动端：汉堡菜单，搜索框在展开菜单中

### SiteFooter
- 三栏布局：About / Browse / Connect
- 使用小写大写字母（small caps）标题
- 底部一行版权，顶部 1px rule

## 动效
- 卡片 hover：translateY(-2px)，阴影加深，200ms ease-out
- 页面切换：opacity + translateY(4px)，300ms
- 收藏：图标切换 + 金色圆环扩散
- 主题切换：background/color 400ms ease-in-out
- 减少运动偏好：所有过渡减半或关闭

## 可访问性
- 所有图标按钮必须有 aria-label
- 导航有 aria-current="page"
- 表单有关联 label
- 焦点环 1.5px moss，offset 3px
- 颜色对比度 ≥ WCAG AA
