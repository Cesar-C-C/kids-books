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

现已开放飞机（10 类部件）、火箭（9 类）、高铁（10 类）和校车（10 类）。所有主题都支持旋转、拆解复原、双语部件说明、英文点读和五题挑战。

三个新主题使用共用页面与交互引擎：`shared/page.js` 生成页面，`shared/explorer.js` 提供相机、模型选取、拆解、标签、学习卡与挑战。主题 `parts.js` 定义 `LAB_CONFIG` 和 `LAB_PARTS`；`model.js` 定义 `buildLabModel`。既有飞机使用其原有独立实现。

## 增加新主题

1. 选定稳定 ID（小写字母、数字和连字符，例如 `rocket`），创建 `labs/<id>/`。
2. 复制 `rocket/index.html` 的共享脚本入口作为页面参考，编写该主题的 `parts.js` 和 `model.js`。形状、拆解方向和问题属于各主题，不要把新主题塞进其他模型的条件分支。
3. 页面用 `../shared/lab.css`、`../shared/vendor/three.min.js`、`../shared/speech.js`。参考飞机的 `LabSpeech.create(button, status)` 接口实现朗读。页面离开或选择其他部件时取消上一段语音。
4. 加入 `<nav class="lab-navigation" data-lab-id="<id>" aria-label="实验室导航"></nav>`，按顺序加载 `../catalog.js`、`../shared/navigation.js`。公共导航由 `bookId` 决定是否提供同主题绘本链接。
5. 用实际渲染截图制作 `preview.png`，不使用与实现不符的示意封面。
6. 更新 `catalog.js`：`id`、`title`、`englishTitle`、`description`、`icon`、`age`、`features`；可选 `bookId` 指向已存在的 `books/<bookId>/`。草稿状态用 `status: 'planned', href: null, image: null`。
7. 页面完成且测试通过后改为 `status: 'ready', href: '<id>/index.html', image: '<id>/preview.png'`。目录会自动更新；无需改目录 HTML。新增绘本到实验室的入口时，在对应绘本页面加相对链接。
8. 运行 `node qa_labs.cjs`；安装开发验证依赖 `npm install --no-save --package-lock=false playwright` 并准备浏览器，然后运行 `node qa_labs_browser.cjs`。脚本默认用 Chrome，也可以通过 `LAB_BROWSER=chromium` 使用 Playwright 自带 Chromium；可用 `LAB_BROWSER_PATH` 指向浏览器可执行文件。

### 共享模型接口

`LAB_CONFIG` 包含 `id`、`title`、`modelName`、`englishName`、`brand`、`brandZh`、`icon`、`subtitle`、`eyebrow`、`camera`、`floorY`、`modelNote` 和 `sources`。相机提供 `yaw`、`pitch`、`distance`、`explodeDistance` 以及目标坐标 `target`。`sources` 是 `{label,url}` 数组。

`LAB_PARTS` 每项包含 `id,name,zhName,category,color,en,zh,tip,question`。每个问题要有唯一答案，部件 ID 必须和模型一致；共享挑战目前要求至少 5 类部件。

`buildLabModel({T,addPart,mesh,mat,sphere,box,panel,model,scene})` 创建几何。`addPart(id,basePosition,explodeOffset,localLabelAnchor)` 返回部件组；同一类部件可有多个组（例如左右整流罩）。使用 `mesh` 等辅助函数加入可选择网格，附属细节应随所属组移动。固定环境如高铁轨道直接加入 `scene`，不能登记成可拆车辆部件。保持 Y 向上；注意部件在整机与拆解时都须处于有效相机范围。

测试：`node qa_models.cjs` 不需要浏览器，直接构建三个模型并校验数据、几何坐标和部件覆盖；`node qa_more_labs_browser.cjs` 检查新增主题的真实浏览器交互。设置 `UPDATE_LAB_PREVIEW=1` 可从真实模型刷新预览图；不设置时测试不会改模型资源。`LAB_BASE_URL` 可指定已发布的网站根地址（以 `/` 结尾）做线上验收。

## 验证与发布

`qa_labs.cjs` 检查登记表、状态、路径、相关绘本及共享脚本。GitHub Actions 会在相关 PR 和 main 更新时执行。`qa_labs_browser.cjs` 从真实目录启动临时 HTTP 服务，并以 `/kids-books/` 子路径检查导航、模型、10 个部件、拆解复原、缩放、答题、手机排版与朗读调用；输出保存在不提交的 `.qa-labs/`。

浏览器语音依赖系统中可用的英语语音，部分语音需要网络。自动测试验证调用和错误处理，不等于实际听音验收。模型为儿童教学示意，拆解仅表示部件关系。

推送主题分支、通过检查并合入 `main` 后，仓库现有 GitHub Pages 从根目录自动发布。正式发布后检查 `/kids-books/`、`/kids-books/labs/` 和具体实验室路由。

Three.js 的 MIT 许可证位于 `shared/vendor/THREE-LICENSE.txt`。本地单文件打包、临时服务、本机路径和截图测试输出不进入线上目录。
