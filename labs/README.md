# 3D 实验室

与 `books/` 绘本并列的独立栏目。入口为 `labs/index.html`，无需构建，可通过静态 HTTP 服务、GitHub Pages 项目子路径或本地文件打开。目录页只加载轻量登记表，进入具体主题后才加载 Three.js。

## 结构

```text
labs/
  index.html          实验室目录
  catalog.js          主题元数据与开放状态，目录的唯一登记入口
  directory.js/css    目录卡片及响应式样式
  shared/
    lab.css           实验室页面共用样式
    navigation.js     目录、书架和同主题绘本的导航
    speech.js         英文朗读与停止、取消、错误提示
    vendor/           Three.js 0.160.1 与 MIT 许可证
  airplane/
    index.html        飞机学习页面
    app.js            飞机模型、拆解、选择、相机和挑战交互
    parts.js          10 类部件的英文介绍与中文释义
    preview.png      由实际模型生成的目录预览图
```

现已开放飞机；火箭（`rocket`）和高铁（`hsr`）仅为筹备中条目，没有虚假的可访问页面，也没有承诺上线日期。

## 增加新主题

1. 选定稳定 ID（小写字母、数字和连字符，例如 `rocket`），创建 `labs/<id>/`。
2. 使用飞机页面作为交互参考，编写该主题的模型与部件数据。形状、拆解方向和问题属于各主题，不要把新主题塞进飞机模型的条件分支。通用功能可继续提取到 `shared/`。
3. 页面用 `../shared/lab.css`、`../shared/vendor/three.min.js`、`../shared/speech.js`。参考飞机的 `LabSpeech.create(button, status)` 接口实现朗读。页面离开或选择其他部件时取消上一段语音。
4. 加入 `<nav class="lab-navigation" data-lab-id="<id>" aria-label="实验室导航"></nav>`，按顺序加载 `../catalog.js`、`../shared/navigation.js`。公共导航由 `bookId` 决定是否提供同主题绘本链接。
5. 用实际渲染截图制作 `preview.png`，不使用与实现不符的示意封面。
6. 更新 `catalog.js`：`id`、`title`、`englishTitle`、`description`、`icon`、`age`、`features`；可选 `bookId` 指向已存在的 `books/<bookId>/`。草稿状态用 `status: 'planned', href: null, image: null`。
7. 页面完成且测试通过后改为 `status: 'ready', href: '<id>/index.html', image: '<id>/preview.png'`。目录会自动更新；无需改目录 HTML。新增绘本到实验室的入口时，在对应绘本页面加相对链接。
8. 运行 `node qa_labs.cjs`；安装开发验证依赖 `npm install --no-save --package-lock=false playwright` 并准备浏览器，然后运行 `node qa_labs_browser.cjs`。脚本默认用 Chrome，也可以通过 `LAB_BROWSER=chromium` 使用 Playwright 自带 Chromium；可用 `LAB_BROWSER_PATH` 指向浏览器可执行文件。

## 验证与发布

`qa_labs.cjs` 检查登记表、状态、路径、相关绘本及共享脚本。GitHub Actions 会在相关 PR 和 main 更新时执行。`qa_labs_browser.cjs` 从真实目录启动临时 HTTP 服务，并以 `/kids-books/` 子路径检查导航、模型、10 个部件、拆解复原、缩放、答题、手机排版与朗读调用；输出保存在不提交的 `.qa-labs/`。

浏览器语音依赖系统中可用的英语语音，部分语音需要网络。自动测试验证调用和错误处理，不等于实际听音验收。模型为儿童教学示意，拆解仅表示部件关系。

推送主题分支、通过检查并合入 `main` 后，仓库现有 GitHub Pages 从根目录自动发布。正式发布后检查 `/kids-books/`、`/kids-books/labs/` 和具体实验室路由。

Three.js 的 MIT 许可证位于 `shared/vendor/THREE-LICENSE.txt`。本地单文件打包、临时服务、本机路径和截图测试输出不进入线上目录。
