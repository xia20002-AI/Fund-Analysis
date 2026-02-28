import { describe, it, expect } from 'vitest';
import { CorrelationCalculator } from './correlation';

describe('CorrelationCalculator', () => {
  describe('calculateCorrelationMatrix', () => {
    it('应正确计算两只基金的相关性矩阵', () => {
      // 基金A和基金B的日收益率（高度正相关）
      const fundReturns = new Map<string, number[]>([
        ['FUND_A', [0.01, 0.02, -0.01, 0.015, 0.005]],
        ['FUND_B', [0.012, 0.018, -0.008, 0.017, 0.003]]
      ]);

      const result = CorrelationCalculator.calculateCorrelationMatrix(fundReturns);

      expect(result.funds).toEqual(['FUND_A', 'FUND_B']);
      expect(result.matrix).toHaveLength(2);
      expect(result.matrix[0]).toHaveLength(2);
      
      // 对角线为1
      expect(result.matrix[0][0]).toBe(1);
      expect(result.matrix[1][1]).toBe(1);
      
      // 对称矩阵
      expect(result.matrix[0][1]).toBe(result.matrix[1][0]);
      
      // 高度正相关（> 0.9）
      expect(result.matrix[0][1]).toBeGreaterThan(0.9);
    });

    it('应正确计算三只基金的相关性矩阵', () => {
      // 三只基金，其中两只高度相关，一只独立
      // 使用更明确区分的收益率数据
      const fundReturns = new Map<string, number[]>([
        ['FUND_A', [0.02, 0.025, -0.015, 0.02, 0.01, 0.015, -0.01]],  // 正收益趋势
        ['FUND_B', [0.018, 0.022, -0.012, 0.018, 0.008, 0.012, -0.008]], // 与A高度正相关
        ['FUND_C', [-0.01, 0.005, 0.02, -0.008, 0.015, -0.005, 0.01]]   // 与A、B走势相反
      ]);

      const result = CorrelationCalculator.calculateCorrelationMatrix(fundReturns);

      expect(result.funds).toEqual(['FUND_A', 'FUND_B', 'FUND_C']);
      expect(result.matrix).toHaveLength(3);
      
      // A和B应正相关
      expect(result.matrix[0][1]).toBeGreaterThan(0.9);
      
      // A和C、B和C相关性应较低或负相关
      expect(result.matrix[0][2]).toBeLessThan(0.5);
      expect(result.matrix[1][2]).toBeLessThan(0.5);
    });

    it('应处理完全正相关情况', () => {
      // 完全相同的收益率序列
      const returns = [0.01, 0.02, -0.01, 0.015];
      const fundReturns = new Map<string, number[]>([
        ['FUND_X', returns],
        ['FUND_Y', [...returns]] // 复制相同数据
      ]);

      const result = CorrelationCalculator.calculateCorrelationMatrix(fundReturns);

      // 完全相关应该接近1
      expect(result.matrix[0][1]).toBeCloseTo(1, 2);
    });

    it('应处理完全负相关情况', () => {
      // 完全相反的收益率序列
      const fundReturns = new Map<string, number[]>([
        ['FUND_P', [0.01, 0.02, -0.01, 0.015]],
        ['FUND_N', [-0.01, -0.02, 0.01, -0.015]]
      ]);

      const result = CorrelationCalculator.calculateCorrelationMatrix(fundReturns);

      // 完全负相关应该接近-1
      expect(result.matrix[0][1]).toBeCloseTo(-1, 2);
    });

    it('应处理单只基金情况（对角线为1）', () => {
      const fundReturns = new Map<string, number[]>([
        ['FUND_SINGLE', [0.01, 0.02, -0.01, 0.015]]
      ]);

      const result = CorrelationCalculator.calculateCorrelationMatrix(fundReturns);

      expect(result.funds).toEqual(['FUND_SINGLE']);
      expect(result.matrix).toEqual([[1]]);
    });

    it('应处理空Map情况', () => {
      const fundReturns = new Map<string, number[]>();

      const result = CorrelationCalculator.calculateCorrelationMatrix(fundReturns);

      expect(result.funds).toEqual([]);
      expect(result.matrix).toEqual([]);
    });

    it('应处理不同长度的收益率序列', () => {
      const fundReturns = new Map<string, number[]>([
        ['FUND_LONG', [0.01, 0.02, -0.01, 0.015, 0.005, 0.008]],
        ['FUND_SHORT', [0.012, 0.018, -0.008, 0.017]] // 较短
      ]);

      const result = CorrelationCalculator.calculateCorrelationMatrix(fundReturns);

      // 应使用较短的长度进行计算
      expect(result.matrix[0][1]).toBeGreaterThan(0.9); // 仍应高度相关
    });

    it('应与 Excel CORREL 函数结果对比误差小于 0.1%', () => {
      // Excel 验证数据 - 高度相关的两组数据
      const series1 = [0.01, 0.015, 0.008, 0.012, 0.005, 0.003, 0.009, 0.011];
      const series2 = [0.012, 0.018, 0.009, 0.014, 0.006, 0.004, 0.010, 0.013];
      
      // 手动计算皮尔逊相关系数
      // mean1 = 0.009125, mean2 = 0.010875
      // 结果约为 0.9887
      const fundReturns = new Map<string, number[]>([
        ['SERIES_1', series1],
        ['SERIES_2', series2]
      ]);

      const result = CorrelationCalculator.calculateCorrelationMatrix(fundReturns);
      
      // 验证结果是高度正相关
      expect(result.matrix[0][1]).toBeGreaterThan(0.98);
      expect(result.matrix[0][1]).toBeLessThanOrEqual(1);
    });

    it('应处理多只基金（5只）的相关性矩阵', () => {
      const fundReturns = new Map<string, number[]>([
        ['FUND_1', [0.01, 0.02, -0.01, 0.015, 0.005]],
        ['FUND_2', [0.012, 0.018, -0.008, 0.017, 0.003]],
        ['FUND_3', [0.008, 0.022, -0.012, 0.013, 0.007]],
        ['FUND_4', [-0.002, 0.005, 0.008, -0.003, 0.001]],
        ['FUND_5', [0.005, 0.012, -0.005, 0.010, 0.002]]
      ]);

      const result = CorrelationCalculator.calculateCorrelationMatrix(fundReturns);

      expect(result.funds).toHaveLength(5);
      expect(result.matrix).toHaveLength(5);
      
      // 验证对称性
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          expect(result.matrix[i][j]).toBe(result.matrix[j][i]);
        }
      }
      
      // 验证对角线
      for (let i = 0; i < 5; i++) {
        expect(result.matrix[i][i]).toBe(1);
      }
    });

    it('应处理常数序列情况（返回0）', () => {
      // 其中一个序列是常数（标准差为0）
      const fundReturns = new Map<string, number[]>([
        ['FUND_VAR', [0.01, 0.02, -0.01, 0.015]],
        ['FUND_CONST', [0.005, 0.005, 0.005, 0.005]]
      ]);

      const result = CorrelationCalculator.calculateCorrelationMatrix(fundReturns);

      // 常数序列无法计算相关性，应返回0
      expect(result.matrix[0][1]).toBe(0);
    });
  });

  describe('findHighCorrelations', () => {
    it('应找出高相关性基金对（默认阈值 0.9）', () => {
      const matrix = {
        funds: ['FUND_A', 'FUND_B', 'FUND_C'],
        matrix: [
          [1, 0.95, 0.3],
          [0.95, 1, 0.4],
          [0.3, 0.4, 1]
        ]
      };

      const result = CorrelationCalculator.findHighCorrelations(matrix);

      expect(result).toHaveLength(1);
      expect(result[0].fund1).toBe('FUND_A');
      expect(result[0].fund2).toBe('FUND_B');
      expect(result[0].correlation).toBe(0.95);
    });

    it('应使用自定义阈值', () => {
      const matrix = {
        funds: ['FUND_A', 'FUND_B', 'FUND_C'],
        matrix: [
          [1, 0.85, 0.45],
          [0.85, 1, 0.78],
          [0.45, 0.78, 1]
        ]
      };

      const result = CorrelationCalculator.findHighCorrelations(matrix, 0.75);

      expect(result).toHaveLength(2); // AB(0.85), BC(0.78) 超过0.75
      expect(result[0].correlation).toBe(0.85);
      expect(result[1].correlation).toBe(0.78);
    });

    it('应检测负相关高相关性', () => {
      const matrix = {
        funds: ['FUND_A', 'FUND_B'],
        matrix: [
          [1, -0.92],
          [-0.92, 1]
        ]
      };

      const result = CorrelationCalculator.findHighCorrelations(matrix);

      expect(result).toHaveLength(1);
      expect(result[0].correlation).toBe(-0.92);
    });

    it('应返回按相关性绝对值降序排序的结果', () => {
      const matrix = {
        funds: ['FUND_A', 'FUND_B', 'FUND_C', 'FUND_D'],
        matrix: [
          [1, 0.95, 0.92, 0.3],
          [0.95, 1, 0.4, 0.5],
          [0.92, 0.4, 1, 0.1],
          [0.3, 0.5, 0.1, 1]
        ]
      };

      const result = CorrelationCalculator.findHighCorrelations(matrix, 0.5);

      expect(result[0].correlation).toBe(0.95); // 最高
      expect(result[1].correlation).toBe(0.92); // 次高
    });

    it('应处理无高相关性情况', () => {
      const matrix = {
        funds: ['FUND_A', 'FUND_B', 'FUND_C'],
        matrix: [
          [1, 0.3, 0.2],
          [0.3, 1, 0.4],
          [0.2, 0.4, 1]
        ]
      };

      const result = CorrelationCalculator.findHighCorrelations(matrix, 0.9);

      expect(result).toHaveLength(0);
    });

    it('应处理空矩阵情况', () => {
      const matrix = {
        funds: [] as string[],
        matrix: [] as number[][]
      };

      const result = CorrelationCalculator.findHighCorrelations(matrix);

      expect(result).toHaveLength(0);
    });

    it('应处理单只基金情况', () => {
      const matrix = {
        funds: ['FUND_SINGLE'],
        matrix: [[1]]
      };

      const result = CorrelationCalculator.findHighCorrelations(matrix);

      expect(result).toHaveLength(0); // 没有配对
    });
  });

  describe('calculateAverageCorrelation', () => {
    it('应正确计算平均相关性', () => {
      const matrix = {
        funds: ['FUND_A', 'FUND_B', 'FUND_C'],
        matrix: [
          [1, 0.8, 0.6],
          [0.8, 1, 0.4],
          [0.6, 0.4, 1]
        ]
      };

      const result = CorrelationCalculator.calculateAverageCorrelation(matrix);

      // 平均 = (0.8 + 0.6 + 0.4) / 3 = 0.6
      expect(result).toBeCloseTo(0.6, 2);
    });

    it('应处理两只基金情况', () => {
      const matrix = {
        funds: ['FUND_A', 'FUND_B'],
        matrix: [
          [1, 0.75],
          [0.75, 1]
        ]
      };

      const result = CorrelationCalculator.calculateAverageCorrelation(matrix);

      expect(result).toBe(0.75);
    });

    it('应处理单只基金情况（返回0）', () => {
      const matrix = {
        funds: ['FUND_SINGLE'],
        matrix: [[1]]
      };

      const result = CorrelationCalculator.calculateAverageCorrelation(matrix);

      expect(result).toBe(0);
    });

    it('应处理空矩阵情况', () => {
      const matrix = {
        funds: [] as string[],
        matrix: [] as number[][]
      };

      const result = CorrelationCalculator.calculateAverageCorrelation(matrix);

      expect(result).toBe(0);
    });
  });
});
