// ==================== 基础类型 ====================

/** 基金信息 */
export interface FundInfo {
  code: string;        // 6位基金代码
  name: string;        // 基金名称
  type: FundType;      // 基金类型
}

/** 基金类型 */
export type FundType = 
  | 'stock'      // 股票型
  | 'bond'       // 债券型
  | 'hybrid'     // 混合型
  | 'index'      // 指数型
  | 'qdii'       // QDII
  | 'money';     // 货币型

/** 基金净值数据 */
export interface NavData {
  fundCode: string;    // 基金代码
  date: string;        // 日期 (YYYY-MM-DD)
  nav: number;         // 单位净值
  accNav: number;      // 累计净值
}

// ==================== 组合配置 ====================

/** 组合中的基金配置 */
export interface FundConfig {
  code: string;
  name: string;
  weight: number;      // 权重 0-1
}

/** 组合配置 */
export interface PortfolioConfig {
  id: string;
  name: string;
  funds: FundConfig[];
  startDate: string;   // 分析起始日
  endDate: string;     // 分析结束日
}

/** 权重模式 */
export type WeightMode = 'equal' | 'market' | 'custom';

// ==================== 分析结果 ====================

/** 组合净值点 */
export interface NavPoint {
  date: string;
  value: number;       // 组合净值
  return: number;      // 累计收益率
}

/** 收益指标 */
export interface ReturnMetrics {
  totalReturn: number;      // 累计收益率
  annualizedReturn: number; // 年化收益率
  winRate?: number;         // 年度胜率 (P1)
}

/** 风险指标 */
export interface RiskMetrics {
  maxDrawdown: number;          // 最大回撤
  maxDrawdownStart: string;     // 最大回撤起始日
  maxDrawdownEnd: string;       // 最大回撤结束日
  volatility: number;           // 年化波动率
  downsideVolatility?: number;  // 下行波动率 (P1)
}

/** 风险调整收益 */
export interface RiskAdjustedMetrics {
  sharpeRatio: number;   // 夏普比率
  calmarRatio?: number;  // 卡玛比率 (P1)
}

/** 基准对比 */
export interface BenchmarkComparison {
  benchmarkCode: string;
  benchmarkName: string;
  benchmarkReturn: number;
  excessReturn: number;
  beta?: number;
  alpha?: number;
}

/** 相关性数据 */
export interface CorrelationMatrix {
  funds: string[];
  matrix: number[][];  // 相关性矩阵 0-1
}

/** 回撤点 */
export interface DrawdownPoint {
  date: string;
  drawdown: number;  // 回撤率 (负数)
  isMaxDrawdown: boolean;
}

/** 完整分析结果 */
export interface AnalysisResult {
  portfolio: PortfolioConfig;
  navCurve: NavPoint[];
  drawdownCurve: DrawdownPoint[];
  returnMetrics: ReturnMetrics;
  riskMetrics: RiskMetrics;
  riskAdjusted: RiskAdjustedMetrics;
  benchmark: BenchmarkComparison;
  correlation?: CorrelationMatrix;
}

// ==================== 基准类型 ====================

export interface BenchmarkInfo {
  code: string;
  name: string;
  type: 'stock' | 'bond' | 'composite' | 'commodity';
}

export const DEFAULT_BENCHMARKS: BenchmarkInfo[] = [
  { code: '000300', name: '沪深300', type: 'stock' },
  { code: 'H11001', name: '中证全债', type: 'bond' }
];

// ==================== 时间范围 ====================

export type QuickTimeRange = '1y' | '3y' | '5y' | 'ytd';

export interface TimeRange {
  startDate: string;
  endDate: string;
}
