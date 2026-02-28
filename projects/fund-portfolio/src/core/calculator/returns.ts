import { NavPoint, ReturnMetrics } from '../types';

/**
 * 收益率计算器
 * 提供累计收益率、年化收益率等收益指标计算
 */
export class ReturnsCalculator {
  /**
   * 计算累计收益率
   * 公式：(期末净值/期初净值 - 1) × 100
   * 
   * @param navCurve - 净值曲线数据
   * @returns 累计收益率（百分比）
   */
  static calculateTotalReturn(navCurve: NavPoint[]): number {
    if (!navCurve || navCurve.length < 2) {
      return 0;
    }

    const startValue = navCurve[0].value;
    const endValue = navCurve[navCurve.length - 1].value;

    if (startValue <= 0) {
      return 0;
    }

    const totalReturn = ((endValue / startValue) - 1) * 100;
    return this.roundToDecimal(totalReturn, 4);
  }

  /**
   * 计算年化收益率（几何平均）
   * 公式：(期末/期初)^(365/天数) - 1
   * 
   * @param navCurve - 净值曲线数据
   * @returns 年化收益率（百分比）
   */
  static calculateAnnualizedReturn(navCurve: NavPoint[]): number {
    if (!navCurve || navCurve.length < 2) {
      return 0;
    }

    const startValue = navCurve[0].value;
    const endValue = navCurve[navCurve.length - 1].value;
    const startDate = new Date(navCurve[0].date);
    const endDate = new Date(navCurve[navCurve.length - 1].date);

    if (startValue <= 0) {
      return 0;
    }

    // 计算天数差
    const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 0) {
      return 0;
    }

    // 年化收益率 = (期末/期初)^(365/天数) - 1
    const annualizedReturn = (Math.pow(endValue / startValue, 365 / daysDiff) - 1) * 100;
    return this.roundToDecimal(annualizedReturn, 4);
  }

  /**
   * 计算年度胜率（P1）
   * 盈利年份占比
   * 
   * @param navCurve - 净值曲线数据
   * @returns 年度胜率（0-1）
   */
  static calculateWinRate(navCurve: NavPoint[]): number {
    if (!navCurve || navCurve.length < 2) {
      return 0;
    }

    // 按年份分组，计算每年的收益率
    const yearReturns = this.calculateYearlyReturns(navCurve);
    
    if (yearReturns.length === 0) {
      return 0;
    }

    // 统计盈利年份数
    const profitableYears = yearReturns.filter(ret => ret > 0).length;
    const winRate = profitableYears / yearReturns.length;
    
    return this.roundToDecimal(winRate, 4);
  }

  /**
   * 计算每日收益率序列
   * 公式：(当日净值/前日净值 - 1)
   * 
   * @param navCurve - 净值曲线数据
   * @returns 每日收益率数组（小数形式）
   */
  static calculateDailyReturns(navCurve: NavPoint[]): number[] {
    if (!navCurve || navCurve.length < 2) {
      return [];
    }

    const dailyReturns: number[] = [];

    for (let i = 1; i < navCurve.length; i++) {
      const prevValue = navCurve[i - 1].value;
      const currValue = navCurve[i].value;

      if (prevValue > 0) {
        const dailyReturn = (currValue / prevValue) - 1;
        dailyReturns.push(this.roundToDecimal(dailyReturn, 6));
      } else {
        dailyReturns.push(0);
      }
    }

    return dailyReturns;
  }

  /**
   * 计算所有收益指标
   * 
   * @param navCurve - 净值曲线数据
   * @returns 收益指标对象
   */
  static calculateAllMetrics(navCurve: NavPoint[]): ReturnMetrics {
    return {
      totalReturn: this.calculateTotalReturn(navCurve),
      annualizedReturn: this.calculateAnnualizedReturn(navCurve),
      winRate: this.calculateWinRate(navCurve)
    };
  }

  /**
   * 按年份计算年度收益率
   * 
   * @param navCurve - 净值曲线数据
   * @returns 每年收益率数组（百分比）
   */
  private static calculateYearlyReturns(navCurve: NavPoint[]): number[] {
    // 按年份分组
    const yearGroups = new Map<number, NavPoint[]>();

    for (const point of navCurve) {
      const year = new Date(point.date).getFullYear();
      if (!yearGroups.has(year)) {
        yearGroups.set(year, []);
      }
      yearGroups.get(year)!.push(point);
    }

    const yearlyReturns: number[] = [];

    // 计算每年的收益率
    for (const [, points] of yearGroups) {
      if (points.length >= 2) {
        // 按日期排序
        const sorted = points.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        const yearStart = sorted[0].value;
        const yearEnd = sorted[sorted.length - 1].value;

        if (yearStart > 0) {
          const yearReturn = ((yearEnd / yearStart) - 1) * 100;
          yearlyReturns.push(yearReturn);
        }
      }
    }

    return yearlyReturns;
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
