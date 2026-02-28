#!/bin/bash

# 基金组合分析平台 - 环境启动脚本
# 作者: Initializer Agent
# 日期: 2026-02-28

echo "=========================================="
echo "基金组合分析平台 - 开发环境启动"
echo "=========================================="

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "错误: Node.js 未安装"
    exit 1
fi

echo "✓ Node.js 版本: $(node --version)"
echo "✓ npm 版本: $(npm --version)"

# 进入项目目录
cd "$(dirname "$0")" || exit 1

# 检查node_modules
if [ ! -d "node_modules" ]; then
    echo "→ 安装依赖..."
    npm install
fi

echo "→ 启动开发服务器..."
echo "=========================================="
npm run dev
