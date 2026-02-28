import type { NavPoint, RiskAdjustedMetrics, BenchmarkComparison } from '../types';
import { DEFAULT_BENCHMARKS } from '../types';

/**
 * 基准与风险调整收益计算器
 * 提供夏普比率、卡玛比率、基准对比等计算
 */
export class BenchmarkCalculator {
  /**
   * 计算夏普比率
   * 公式：夏普 = (组合年化收益 - 无风险利率) / 组合年化波动率
   * 
   * @param annualizedReturn - 年化收益率（百分比，如 10 表示 10%）
   * @param volatility - 年化波动率（百分比，如 15 表示 15%）
   * @param riskFreeRate - 无风险利率（百分比，默认 2%）
   * @returns 夏普比率
   */
  static calculateSharpeRatio(
    annualizedReturn: number,
    volatility: number,
    riskFreeRate: number = 0.02
  ): number {
    // 波动率不能为零或负数
    if (volatility <= 0) {
      return 0;
    }

    // 将百分比转换为小数进行计算
    const returnDecimal = annualizedReturn / 100;
    const volatilityDecimal = volatility / 100;
    const riskFreeDecimal = riskFreeRate; // 已经是小数形式

    // 夏普比率 = (年化收益 - 无风险利率) / 波动率
    const sharpeRatio = (returnDecimal - riskFreeDecimal) / volatilityDecimal;
    
    return this.roundToDecimal(sharpeRatio, 4);
  }
  
  /**
   * 计算卡玛比率 (P1)
   * 公式：卡玛 = 年化收益 / |最大回撤|
   * 
   * @param annualizedReturn - 年化收益率（百分比）
   * @param maxDrawdown - 最大回撤（百分比，正数表示回撤幅度）
   * @returns 卡玛比率
   */
  static calculateCalmarRatio(
    annualizedReturn: number,
    maxDrawdown: number
  ): number {
    // 最大回撤必须为正数
    if (maxDrawdown <= 0) {
      return 0;
    }

    // 两者都是百分比，相除时单位抵消
    const calmarRatio = annualizedReturn / maxDrawdown;
    
    return this.roundToDecimal(calmarRatio, 4);
  }
  
  /**
   * 计算基准对比
   * 对比组合与基准的收益差异
   * 
   * @param portfolioNav - 组合净值曲线
   * @param benchmarkNav - 基准净值曲线
   * @param benchmarkCode - 基准代码
   * @returns 基准对比结果
   */
  static calculateBenchmarkComparison(
    portfolioNav: NavPoint[],
    benchmarkNav: NavPoint[],
    benchmarkCode: string
  ): BenchmarkComparison {
    // 验证输入数据
    if (!portfolioNav || portfolioNav.length < 2 || !benchmarkNav || benchmarkNav.length < 2) {
      const benchmarkInfo = this.getBenchmarkInfo(benchmarkCode);
      return {
        benchmarkCode,
        benchmarkName: benchmarkInfo?.name || benchmarkCode,
        benchmarkReturn: 0,
        excessReturn: 0,
        beta: undefined,
        alpha: undefined
      };
    }

    // 计算组合收益率
    const portfolioReturn = this.calculateTotalReturn(portfolioNav);
    
    // 计算基准收益率
    const benchmarkReturn = this.calculateTotalReturn(benchmarkNav);
    
    // 计算超额收益 = 组合收益 - 基准收益
    const excessReturn = this.roundToDecimal(portfolioReturn - benchmarkReturn, 4);
    
    // 获取基准名称
    const benchmarkInfo = this.getBenchmarkInfo(benchmarkCode);

    return {
      benchmarkCode,
      benchmarkName: benchmarkInfo?.name || benchmarkCode,
      benchmarkReturn: this.roundToDecimal(benchmarkReturn, 4),
      excessReturn,
      beta: undefined, // P1: 需要更多数据计算
      alpha: undefined // P1: 需要更多数据计算
    };
  }
  
  /**
   * 获取默认基准列表
   * @returns 默认基准数组
   */
  static getDefaultBenchmarks() {
    return DEFAULT_BENCHMARKS;
  }

  /**
   * 计算所有风险调整收益指标
   * 
   * @param annualizedReturn - 年化收益率（百分比）
   * @param volatility - 年化波动率（百分比）
   * @param maxDrawdown - 最大回撤（百分比）
   * @param riskFreeRate - 无风险利率（默认 2%）
   * @returns 风险调整收益指标
   */
  static calculateAllMetrics(
    annualizedReturn: number,
    volatility: number,
    maxDrawdown: number,
    riskFreeRate: number = 0.02
  ): RiskAdjustedMetrics {
    return {
      sharpeRatio: this.calculateSharpeRatio(annualizedReturn, volatility, riskFreeRate),
      calmarRatio: maxDrawdown > 0 ? this.calculateCalmarRatio(annualizedReturn, maxDrawdown) : undefined
    };
  }

  /**
   * 根据代码获取基准信息
   * @param code - 基准代码
   * @returns 基准信息或 undefined
   */
  private static getBenchmarkInfo(code: string) {
    return DEFAULT_BENCHMARKS.find(b => b.code === code);
  }

  /**
   * 计算累计收益率
   * 公式：(期末净值/期初净值 - 1) × 100
   * 
   * @param navCurve - 净值曲线数据
   * @returns 累计收益率（百分比）
   */
  private static calculateTotalReturn(navCurve: NavPoint[]): number {
    const startValue = navCurve[0].value;
    const endValue = navCurve[navCurve.length - 1].value;

    if (startValue <= 0) {
      return 0;
    }

    return ((endValue / startValue) - 1) * 100;
  }

  /**
   * 四舍五入到指定小数位
   * 
   * @param value - 原始值
   * @param decimals - 小数位数
   * @returns 四舍五入后的值
   */
  private static roundToDecimal(value: number, decimals: number): number {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  }
}
