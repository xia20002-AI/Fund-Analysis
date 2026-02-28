import { NavPoint, RiskMetrics, DrawdownPoint } from '../types';

/**
 * 风险指标计算器
 * 提供最大回撤、波动率等风险指标计算
 */
export class RiskCalculator {
  /**
   * 计算最大回撤及起止时间
   * 算法：遍历每个点作为高点，找到之后最低点，计算回撤
   * 
   * @param navCurve - 净值曲线数据
   * @returns 最大回撤信息
   */
  static calculateMaxDrawdown(navCurve: NavPoint[]): {
    maxDrawdown: number;
    startDate: string;
    endDate: string;
  } {
    if (!navCurve || navCurve.length < 2) {
      return {
        maxDrawdown: 0,
        startDate: '',
        endDate: ''
      };
    }

    let maxDrawdown = 0;
    let maxDrawdownStartDate = '';
    let maxDrawdownEndDate = '';
    let peakValue = navCurve[0].value;
    let peakDate = navCurve[0].date;

    for (const point of navCurve) {
      if (point.value > peakValue) {
        // 发现新的高点，更新峰值
        peakValue = point.value;
        peakDate = point.date;
      } else {
        // 计算从峰值到当前点的回撤
        const drawdown = (peakValue - point.value) / peakValue;
        
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
          maxDrawdownStartDate = peakDate;
          maxDrawdownEndDate = point.date;
        }
      }
    }

    return {
      maxDrawdown: this.roundToDecimal(maxDrawdown * 100, 4), // 转换为百分比
      startDate: maxDrawdownStartDate,
      endDate: maxDrawdownEndDate
    };
  }

  /**
   * 计算回撤曲线（用于图表展示）
   * 每个点的回撤率（相对于前期高点）
   * 
   * @param navCurve - 净值曲线数据
   * @returns 回撤曲线点数组
   */
  static calculateDrawdownCurve(navCurve: NavPoint[]): DrawdownPoint[] {
    if (!navCurve || navCurve.length === 0) {
      return [];
    }

    const drawdownPoints: DrawdownPoint[] = [];
    let peakValue = navCurve[0].value;
    let maxDrawdown = 0;

    // 先计算最大回撤，用于标记
    for (const point of navCurve) {
      if (point.value > peakValue) {
        peakValue = point.value;
      } else {
        const drawdown = (peakValue - point.value) / peakValue;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    }

    // 重置峰值，重新计算并标记最大回撤点
    peakValue = navCurve[0].value;

    for (const point of navCurve) {
      if (point.value > peakValue) {
        peakValue = point.value;
        drawdownPoints.push({
          date: point.date,
          drawdown: 0,
          isMaxDrawdown: false
        });
      } else {
        const drawdown = (peakValue - point.value) / peakValue;
        drawdownPoints.push({
          date: point.date,
          drawdown: this.roundToDecimal(-drawdown * 100, 4), // 负值表示回撤
          isMaxDrawdown: Math.abs(drawdown - maxDrawdown) < 0.0001
        });
      }
    }

    return drawdownPoints;
  }

  /**
   * 计算年化波动率（标准差）
   * 年化 = 日标准差 × √252
   * 
   * @param dailyReturns - 每日收益率数组（小数形式）
   * @returns 年化波动率（百分比）
   */
  static calculateVolatility(dailyReturns: number[]): number {
    if (!dailyReturns || dailyReturns.length < 2) {
      return 0;
    }

    const stdDev = this.calculateStdDev(dailyReturns);
    // 年化波动率 = 日标准差 × √252（假设一年252个交易日）
    const annualizedVolatility = stdDev * Math.sqrt(252) * 100;
    
    return this.roundToDecimal(annualizedVolatility, 4);
  }

  /**
   * 计算下行波动率（P1）
   * 只计算下跌时的波动
   * 
   * @param dailyReturns - 每日收益率数组（小数形式）
   * @returns 年化下行波动率（百分比）
   */
  static calculateDownsideVolatility(dailyReturns: number[]): number {
    if (!dailyReturns || dailyReturns.length < 2) {
      return 0;
    }

    // 筛选出负收益（下跌）的收益率
    const downsideReturns = dailyReturns.filter(r => r < 0);
    
    if (downsideReturns.length < 2) {
      return 0;
    }

    const downsideStdDev = this.calculateStdDev(downsideReturns);
    // 年化下行波动率
    const annualizedDownsideVolatility = downsideStdDev * Math.sqrt(252) * 100;
    
    return this.roundToDecimal(annualizedDownsideVolatility, 4);
  }

  /**
   * 计算所有风险指标
   * 
   * @param navCurve - 净值曲线数据
   * @param dailyReturns - 每日收益率数组（可选，不传则自动计算）
   * @returns 风险指标对象
   */
  static calculateAllMetrics(
    navCurve: NavPoint[],
    dailyReturns?: number[]
  ): RiskMetrics {
    const maxDrawdownResult = this.calculateMaxDrawdown(navCurve);
    const drawdownCurve = this.calculateDrawdownCurve(navCurve);
    
    // 如果没有提供日收益率，需要从navCurve计算
    const returns = dailyReturns || this.calculateDailyReturns(navCurve);
    
    return {
      maxDrawdown: maxDrawdownResult.maxDrawdown,
      maxDrawdownStart: maxDrawdownResult.startDate,
      maxDrawdownEnd: maxDrawdownResult.endDate,
      volatility: this.calculateVolatility(returns),
      downsideVolatility: this.calculateDownsideVolatility(returns)
    };
  }

  /**
   * 计算标准差
   * 
   * @param returns - 收益率数组
   * @returns 标准差
   */
  private static calculateStdDev(returns: number[]): number {
    if (!returns || returns.length < 2) {
      return 0;
    }

    // 计算平均值
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    
    // 计算方差
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
    
    // 标准差 = 方差的平方根
    return Math.sqrt(variance);
  }

  /**
   * 计算每日收益率序列
   * 辅助方法，当外部未提供日收益率时使用
   * 
   * @param navCurve - 净值曲线数据
   * @returns 每日收益率数组
   */
  private static calculateDailyReturns(navCurve: NavPoint[]): number[] {
    if (!navCurve || navCurve.length < 2) {
      return [];
    }

    const dailyReturns: number[] = [];

    for (let i = 1; i < navCurve.length; i++) {
      const prevValue = navCurve[i - 1].value;
      const currValue = navCurve[i].value;

      if (prevValue > 0) {
        const dailyReturn = (currValue / prevValue) - 1;
        dailyReturns.push(dailyReturn);
      } else {
        dailyReturns.push(0);
      }
    }

    return dailyReturns;
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
