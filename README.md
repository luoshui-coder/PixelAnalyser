# 图像智译 - 理解每幅图像的故事

图像智译是一个基于 Next.js 和智谱 AI 的 GLM-4V 模型的网站应用，专注于批量图像处理和智能对话。该应用旨在为用户提供高效的图像理解和多模态对话功能，支持用户与多张图片进行智能交互。

## 功能特点

- **图片上传**
  - 支持用户批量上传本地电脑中的多张图片
  - 提供直观的用户界面，方便用户选择和上传图片
  - 显示上传进度和成功状态

- **图像处理和对话**
  - 集成智谱 AI 的 GLM-4V 模型，用于图像处理和对话
  - 支持用户与上传的单张或多张图片进行多轮对话
  - 提供多种预设提示词，帮助用户开始对话或执行特定任务

- **提示词管理**
  - 预设多个提示词选项，对应不同的对话任务和图像分析需求
  - 提供按钮式界面，让用户可以方便地选择不同的提示词
  - 支持自定义和编辑提示词

- **聊天记录导出**
  - 支持将聊天记录导出为 TXT 或 Markdown 格式

- **动态背景**
  - 使用 Canvas 实现渐变动画背景，提升用户体验

## 技术栈

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Radix UI 组件库

## 快速开始

1. 克隆仓库：

   ```bash
   git clone https://github.com/luoshui-coder/PixelAnalyser.git
   ```

2. 进入项目目录：

   ```bash
   cd PixelAnalyser
   ```

3. 安装依赖：

   ```bash
   npm install
   ```

4. 运行开发服务器：

   ```bash
   npm run dev
   ```

5. 在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 构建和部署

1. 构建生产版本：

   ```bash
   npm run build
   ```

2. 启动生产服务器：

   ```bash
   npm start
   ```

## API 配置

本应用使用智谱 AI 的 API。首次使用时，您需要设置 API 密钥和基础 URL：

- **API 基础 URL**：<https://open.bigmodel.cn/api/paas/v4>
- **API 密钥**：您需要从智谱 AI 获取有效的 API 密钥

初次设置后，这些信息将保存在本地存储中，以便后续使用。

## 贡献

欢迎提交 Pull Requests 来改进这个项目。对于重大更改，请先开 issue 讨论您想要改变的内容。

## 许可证

© Copyright 2024. luoshui.life All rights reserved.
