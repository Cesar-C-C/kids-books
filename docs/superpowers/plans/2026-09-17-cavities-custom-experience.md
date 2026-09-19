# cavities: 故事、牙齿城与刷牙路线实施记录

日期：2026-09-19。此记录校准 2026-09-17 原计划，以已完成代码为准。

- 内容与元数据：`books/cavities/book.js`，保留 14 段双语 PAGES 兼容数据。
- 展示：`books/cavities/index.html`、`cavities-experience.js`、`cavities-experience.css`，使用自然滚动与章节锚点。
- 模型：复用 `cavities.js` 的纯函数，不加载共享翻页阅读器。
- 素材：复用正式 WebP；近视白板采用底图、动态图示、人物前景三层。
- 朗读：两个 reader 的 AUDIO_VER=6。更新正文与录音保持一致，书末家长说明默认折叠且不混入叙事朗读。
- 音频交付详情：`docs/health-story-narration-update.md`；生成输入、MP3 哈希与浏览器证据在 `workbench/health-narration-update/` 的四份 JSON。

## 验收命令

```text
node tests/qa_custom_health_layout.cjs
node tests/qa_custom_health_browser.cjs
node tests/qa_health_narration.cjs
node qa_books.js
node qa_runtime.js
python qa_pwa.py
python tools/qa_offline_manifest.py
```

正式站点验收可设置 HEALTH_QA_BASE_URL，再执行两项浏览器测试。人工听感及发音尚未人工验收。

原计划中 content.js、新绘图、独立自定义音频 ID、tests/qa_cavities_custom.cjs 等尚未落实的草案已被上述实现替代，不应当作剩余任务重做。
