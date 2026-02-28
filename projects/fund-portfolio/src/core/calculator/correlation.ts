import { CorrelationMatrix } from '../types';

/**
 * 相关性计算器
 * 提供基金间相关性矩阵计算
 */
export class CorrelationCalculator {
  /**
   * 计算基金间相关性矩阵
   * 使用皮尔逊相关系数
   * 
   * @param fundReturns - 基金日收益率映射 Map<fundCode, dailyReturns[]>
   * @returns 相关性矩阵
   */
  static calculateCorrelationMatrix(
    fundReturns: Map<string, number[]>
  ): CorrelationMatrix {
    // 获取所有基金代码并排序（确保矩阵顺序一致）
    const funds = Array.from(fundReturns.keys()).sort();
    const n = funds.length;

    // 初始化 n×n 矩阵
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    // 构建对称矩阵
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        if (i === j) {
          // 对角线为1（基金与自身完全相关）
          matrix[i][j] = 1;
        } else {
          // 计算两个基金收益率序列的相关系数
          const returns1 = fundReturns.get(funds[i])!;
          const returns2 = fundReturns.get(funds[j])!;
          
          const correlation = this.calculateCorrelation(returns1, returns2);
          
          // 对称矩阵：matrix[i][j] = matrix[j][i]
          matrix[i][j] = correlation;
          matrix[j][i] = correlation;
        }
      }
    }

    return {
      funds,
      matrix
    };
  }
  
  /**
   * 计算两个序列的皮尔逊相关系数
   * 公式：r = Σ((xi - x̄)(yi - ȳ)) / √(Σ(xi-x̄)² × Σ(yi-ȳ)²)
   * 
   * @param x - 第一个序列
   * @param y - 第二个序列
   * @returns 相关系数 (-1 到 1)
   */
  private static calculateCorrelation(x: number[], y: number[]): number {
    // 验证数据
    if (!x || !y || x.length === 0 || y.length === 0) {
      return 0;
    }

    // 使用较短的长度，或要求长度相同
    const length = Math.min(x.length, y.length);
    
    if (length < 2) {
      return 0;
    }

    // 截取相同长度的数据
    const xSlice = x.slice(0, length);
    const ySlice = y.slice(0, length);

    // 计算平均值
    const meanX = xSlice.reduce((sum, val) => sum + val, 0) / length;
    const meanY = ySlice.reduce((sum, val) => sum + val, 0) / length;

    // 计算协方差和方差
    let covariance = 0;
    let varianceX = 0;
    let varianceY = 0;

    for (let i = 0; i < length; i++) {
      const diffX = xSlice[i] - meanX;
      const diffY = ySlice[i] - meanY;
      
      covariance += diffX * diffY;
      varianceX += diffX * diffX;
      varianceY += diffY * diffY;
    }

    // 检查方差是否为零（常数序列）
    if (varianceX === 0 || varianceY === 0) {
      return 0;
    }

    // 计算皮尔逊相关系数
    const correlation = covariance / Math.sqrt(varianceX * varianceY);

    // 四舍五入到4位小数，并限制在 [-1, 1] 范围内
    const roundedCorrelation = this.roundToDecimal(correlation, 4);
    return Math.max(-1, Math.min(1, roundedCorrelation));
  }
  
  /**
   * 找出高相关性基金对
   * 用于提示持仓重复（相关性过高可能意味着风险集中）
   * 
   * @param matrix - 相关性矩阵
   * @param threshold - 相关性阈值（默认 0.9）
   * @returns 高相关性基金对数组
   */
  static findHighCorrelations(
    matrix: CorrelationMatrix,
    threshold: number = 0.9
  ): Array<{ fund1: string; fund2: string; correlation: number }> {
    const result: Array<{ fund1: string; fund2: string; correlation: number }> = [];
    const { funds, matrix: corrMatrix } = matrix;
    const n = funds.length;

    // 只检查上三角矩阵（避免重复）
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const correlation = corrMatrix[i][j];
        
        // 取绝对值比较（正相关和负相关都可能值得关注）
        if (Math.abs(correlation) >= threshold) {
          result.push({
            fund1: funds[i],
            fund2: funds[j],
            correlation: this.roundToDecimal(correlation, 4)
          });
        }
      }
    }

    // 按相关性绝对值降序排序
    return result.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }

  /**
   * 计算平均相关性
   * 用于评估组合整体分散程度
   * 
   * @param matrix - 相关性矩阵
   * @returns 平均相关系数
   */
  static calculateAverageCorrelation(matrix: CorrelationMatrix): number {
    const { matrix: corrMatrix } = matrix;
    const n = corrMatrix.length;

    if (n <= 1) {
      return 0;
    }

    let sum = 0;
    let count = 0;

    // 只计算非对角线元素
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        sum += corrMatrix[i][j];
        count++;
      }
    }

    return count > 0 ? this.roundToDecimal(sum / count, 4) : 0;
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
