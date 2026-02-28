# 基金组合分析平台

一个基于 React + TypeScript 的基金投资组合分析工具，支持组合构建、风险收益分析和可视化报告。

## ✨ 功能特性

- 🔍 **基金搜索**: 支持代码/名称模糊搜索，6位数字代码精确匹配
- 📊 **组合配置**: 等权重/自定义权重模式，权重自动校验
- 📈 **风险收益分析**: 
  - 累计收益率、年化收益率
  - 最大回撤、波动率
  - 夏普比率、卡玛比率
  - 基准对比（沪深300/中证全债）
- 📉 **可视化图表**:
  - 净值曲线图（支持基准叠加）
  - 动态回撤瀑布图
  - 相关性热力图
  - 四宫格风险指标卡
- 💾 **数据持久化**: 本地存储组合配置，刷新自动恢复
- 📱 **响应式设计**: 适配桌面和移动端

## 🛠️ 技术栈

- **前端框架**: React 19 + TypeScript 5
- **构建工具**: Vite 7
- **UI 组件**: shadcn/ui + Tailwind CSS 4
- **状态管理**: Zustand + persist 中间件
- **图表库**: ECharts 5
- **测试**: Vitest
- **存储**: IndexedDB (localForage)

## 📁 项目结构

```
src/
├── components/          # UI 组件
│   ├── portfolio/      # 组合配置组件
│   │   ├── FundSearch.tsx      # 基金搜索
│   │   ├── FundList.tsx        # 已选基金列表
│   │   ├── WeightConfig.tsx    # 权重配置
│   │   ├── TimeRangeSelector.tsx # 时间选择
│   │   └── ConfigPanel.tsx     # 配置面板整合
│   ├── charts/         # 图表组件
│   │   ├── NavChart.tsx        # 净值曲线
│   │   ├── DrawdownChart.tsx   # 回撤图
│   │   └── CorrelationHeatmap.tsx # 相关性热力图
│   └── metrics/        # 指标组件
│       ├── MetricCard.tsx      # 指标卡片
│       └── MetricsDashboard.tsx # 指标仪表盘
├── core/               # 核心计算引擎
│   ├── types/          # TypeScript 类型定义
│   └── calculator/     # 计算模块
│       ├── index.ts            # 组合净值计算
│       ├── returns.ts          # 收益率计算
│       ├── risk.ts             # 风险指标计算
│       ├── benchmark.ts        # 基准对比计算
│       └── correlation.ts      # 相关性矩阵计算
├── data/               # 数据层
│   ├── storage/        # 存储抽象
│   │   └── IndexedDBStorage.ts
│   └── source/         # 数据源
│       ├── WebDataSource.ts    # Web API 数据源
│       └── mockData.ts         # Mock 数据
├── hooks/              # 自定义 Hooks
│   ├── useAnalysis.ts          # 分析流程 Hook
│   └── useErrorHandler.ts      # 错误处理 Hook
├── stores/             # 状态管理
│   └── portfolioStore.ts       # 组合状态管理
├── sections/           # 页面区块
│   └── ResultPanel.tsx         # 结果展示面板
└── App.tsx             # 主应用

```

## 🚀 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm test

# 构建生产版本
npm run build
```

## 📊 核心算法

### 组合净值计算
```
组合净值 = Σ(基金净值 × 基金权重)
累计收益率 = (当日净值/首日净值 - 1) × 100%
```

### 风险指标
- **最大回撤**: 从高点到低点的最大跌幅
- **年化波动率**: 日收益率标准差 × √252
- **夏普比率**: (年化收益 - 无风险利率) / 波动率

### 相关性矩阵
皮尔逊相关系数，范围 0-1，>0.9 提示高相关性

## 📝 决策记录

| 决策 | 选择 | 原因 |
|------|------|------|
| 图表库 | ECharts | 金融图表专业，支持热力图 |
| 状态管理 | Zustand | 轻量级，persist 中间件支持本地存储 |
| 存储方案 | IndexedDB | 容量大，支持结构化数据 |
| 计算引擎 | 纯 TypeScript | 无平台依赖，可跨端复用 |

## ✅ 测试

- **单元测试**: 112 个测试用例全部通过
- **构建测试**: TypeScript 编译无错误
- **端到端测试**: 完整用户流程验证

## 🚧 已知问题

- JS bundle 大小 1.38MB，建议后续进行代码分割优化
- P1 功能（移动端适配、新手引导、月度收益热力图）待实现

## 📄 许可证

MIT

---

**开发周期**: 2025年2月  
**开发团队**: AI Agent 协作开发
