# LexChain 律链

LexChain 是一个面向劳动纠纷的形式化法律推理演示工具，使用 O/F/P 道义逻辑、T/F/U 三值判定和可废止规则输出可审计的推理链。

## GitHub Pages

公开页面：`https://nininininini979-tech.github.io/lexchain/`

Pages 版本直接加载 `docs/rules/labor-rules.json`，在浏览器中运行确定性规则引擎。自然语言输入使用浏览器端关键词抽取作为静态降级，页面会明确提示并允许在事实面板中修正；本地 `server.js` 版本仍支持 DeepSeek/Ollama 事实抽取。

## 本地运行

```bash
node server.js
```

启动后访问 `http://127.0.0.1:8787/`。GitHub Pages 仅托管静态文件，不会暴露或读取本地 API Key。

> 本工具输出仅供法律风险分析参考，不构成正式法律意见。
