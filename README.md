# 销售数据洞察 Pro (Sales Data Insight Pro)

这是一个现代化数据可视化仪表盘项目，提供 **React (Web)** 和 **Python (Streamlit)** 两个版本。项目支持数据自动分类处理，并集成了 Google Gemini AI 进行智能业务分析。

## 🌟 版本选择

### 1. Web 版本 (React + Vite)
适用于需要部署为静态网站、注重交互体验和 Glassmorphism 设计风格的场景。
*   **入口**: `index.html` / `App.tsx`
*   **技术栈**: React 18, TypeScript, TailwindCSS, Recharts

### 2. Python 版本 (Streamlit)
适用于数据科学家、快速原型开发或纯 Python 环境部署。
*   **入口**: `app.py`
*   **技术栈**: Streamlit, Pandas, Plotly, Google GenAI SDK

---

## 🚀 快速开始 (Web 版本)

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 配置 API Key
在 `.env` 文件中设置 `VITE_API_KEY=your_key` 以启用 AI 功能。

---

## 🐍 快速开始 (Python 版本)

如果您更喜欢使用 Python 运行此应用，请按照以下步骤操作：

### 1. 环境准备
确保已安装 Python 3.8+。

### 2. 安装 Python 依赖
在终端中运行：
```bash
pip install -r requirements.txt
```

### 3. 配置 API Key
设置环境变量 `API_KEY`，或者在项目根目录创建 `.streamlit/secrets.toml` 文件：
```toml
API_KEY = "your_google_gemini_api_key"
```

### 4. 启动应用
```bash
streamlit run app.py
```

浏览器将自动打开应用的 Streamlit 版本。

---

## ✨ 功能对比

| 功能 | Web (React) | Python (Streamlit) |
| :--- | :--- | :--- |
| **界面风格** | 高度定制 (Tailwind/Glass) | 标准 Streamlit 风格 |
| **交互性** | 极高 (即时响应，无刷新) | 中等 (交互触发脚本重跑) |
| **数据处理** | 前端 TypeScript 处理 | 后端 Pandas 处理 (更强) |
| **图表库** | Recharts | Plotly |
| **部署** | 静态托管 (Vercel/Netlify) | 容器服务 / Streamlit Cloud |

## 📂 项目结构

```
├── app.py                  # [NEW] Python Streamlit 应用程序入口
├── requirements.txt        # [NEW] Python 依赖列表
├── index.html              # Web 入口
├── src/                    # Web 源码目录
│   ├── App.tsx             # React 主应用
│   ├── services/           # 服务层
│   └── ...
└── ...
```
