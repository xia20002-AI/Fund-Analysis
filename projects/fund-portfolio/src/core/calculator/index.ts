import { PortfolioConfig, NavData, NavPoint } from '../types';

/**
 * 组合净值计算器
 * 支持多基金加权合并计算
 */
export class PortfolioCalculator {
  /**
   * 计算组合净值曲线
   * 核心算法：按日期合并各基金净值，按权重加权平均
   * 
   * @param config - 组合配置
   * @param navDataMap - 基金净值数据映射 Map<fundCode, NavData[]>
   * @returns 组合净值曲线点数组
   */
  static calculatePortfolioNav(
    config: PortfolioConfig,
    navDataMap: Map<string, NavData[]>
  ): NavPoint[] {
    // 1. 数据预处理：填充每只基金的缺失数据
    const filledDataMap = new Map<string, NavData[]>();
    for (const fund of config.funds) {
      const rawData = navDataMap.get(fund.code);
      if (!rawData || rawData.length === 0) {
        throw new Error(`基金 ${fund.code} (${fund.name}) 没有净值数据`);
      }
      filledDataMap.set(fund.code, this.fillMissingData(rawData));
    }

    // 2. 获取所有基金的日期交集（所有基金都有数据的天）
    const commonDates = this.getCommonDates(filledDataMap, config);
    if (commonDates.length === 0) {
      throw new Error('所选基金没有共同的交易日');
    }

    // 3. 对每一天计算加权净值
    const navPoints: NavPoint[] = [];
    let firstDayValue = 0;

    for (let i = 0; i < commonDates.length; i++) {
      const date = commonDates[i];
      const portfolioValue = this.calculateDailyNav(date, config, filledDataMap);
      
      if (i === 0) {
        firstDayValue = portfolioValue;
      }

      // 计算累计收益率：(当日净值 / 首日净值 - 1) × 100
      const cumulativeReturn = firstDayValue > 0 
        ? ((portfolioValue / firstDayValue) - 1) * 100 
        : 0;

      navPoints.push({
        date,
        value: this.roundToDecimal(portfolioValue, 6),
        return: this.roundToDecimal(cumulativeReturn, 4)
      });
    }

    return navPoints;
  }

  /**
   * 获取共同日期范围
   * 处理基金成立时间不同的情况：取最晚成立日为起始日
   */
  private static getCommonDates(
    filledDataMap: Map<string, NavData[]>,
    config: PortfolioConfig
  ): string[] {
    // 获取每只基金的所有日期
    const dateSets: Set<string>[] = [];
    for (const fund of config.funds) {
      const data = filledDataMap.get(fund.code);
      if (data) {
        const dates = new Set(data.map(d => d.date));
        dateSets.push(dates);
      }
    }

    if (dateSets.length === 0) return [];

    // 找出所有基金的日期交集
    let commonDates = dateSets[0];
    for (let i = 1; i < dateSets.length; i++) {
      commonDates = new Set([...commonDates].filter(d => dateSets[i].has(d)));
    }

    // 转换为数组并排序
    return Array.from(commonDates).sort();
  }

  /**
   * 处理缺失数据
   * 如果某天某基金没有数据，使用前一天的净值
   * 
   * @param navData - 原始净值数据
   * @returns 填充后的净值数据
   */
  private static fillMissingData(navData: NavData[]): NavData[] {
    if (navData.length === 0) return [];

    // 按日期排序
    const sorted = [...navData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const result: NavData[] = [];
    const firstDate = new Date(sorted[0].date);
    const lastDate = new Date(sorted[sorted.length - 1].date);
    
    let dataIndex = 0;
    let lastNav = sorted[0].nav;
    const fundCode = sorted[0].fundCode;
    const accNav = sorted[0].accNav;

    // 遍历日期范围，填充缺失数据
    for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
      const dateStr = this.formatDate(d);
      
      // 检查当天是否有数据
      if (dataIndex < sorted.length && sorted[dataIndex].date === dateStr) {
        // 有数据，使用实际数据
        result.push(sorted[dataIndex]);
        lastNav = sorted[dataIndex].nav;
        dataIndex++;
      } else {
        // 无数据（节假日等），使用前一天净值
        result.push({
          fundCode,
          date: dateStr,
          nav: lastNav,
          accNav
        });
      }
    }

    return result;
  }

  /**
   * 计算单日组合净值
   * 
   * @param date - 日期
   * @param config - 组合配置
   * @param navDataMap - 填充后的净值数据映射
   * @returns 当日组合净值
   */
  private static calculateDailyNav(
    date: string,
    config: PortfolioConfig,
    navDataMap: Map<string, NavData[]>
  ): number {
    let portfolioValue = 0;

    for (const fund of config.funds) {
      const fundData = navDataMap.get(fund.code);
      if (!fundData) continue;

      // 查找当天的净值数据
      const dayData = fundData.find(d => d.date === date);
      if (dayData) {
        // 加权公式：portfolio_value = Σ(fund_nav * fund_weight)
        portfolioValue += dayData.nav * fund.weight;
      }
    }

    return portfolioValue;
  }

  /**
   * 格式化日期为 YYYY-MM-DD
   */
  private static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 四舍五入到指定小数位
   */
  private static roundToDecimal(value: number, decimals: number): number {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  }

  /**
   * 计算等权重
   * 当用户选择等权重模式时，为每只基金分配相同权重
   * 
   * @param fundCount - 基金数量
   * @returns 每只基金的权重
   */
  static calculateEqualWeight(fundCount: number): number {
    if (fundCount <= 0) return 0;
    return this.roundToDecimal(1 / fundCount, 4);
  }

  /**
   * 验证权重总和
   * 
   * @param funds - 基金配置数组
   * @returns 是否有效
   */
  static validateWeights(funds: { weight: number }[]): boolean {
    const totalWeight = funds.reduce((sum, f) => sum + f.weight, 0);
    return Math.abs(totalWeight - 1) < 0.0001; // 允许 0.01% 误差
  }

  /**
   * 归一化权重
   * 当权重总和不等于1时，按比例调整
   * 
   * @param funds - 基金配置数组
   * @returns 归一化后的基金配置
   */
  static normalizeWeights<T extends { weight: number }>(funds: T[]): T[] {
    const totalWeight = funds.reduce((sum, f) => sum + f.weight, 0);
    if (totalWeight === 0) return funds;

    const scale = 1 / totalWeight;
    return funds.map(f => ({
      ...f,
      weight: this.roundToDecimal(f.weight * scale, 4)
    }));
  }
}
