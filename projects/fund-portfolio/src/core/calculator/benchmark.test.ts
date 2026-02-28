import { describe, it, expect } from 'vitest';
import { BenchmarkCalculator } from './benchmark';
import type { NavPoint } from '../types';

describe('BenchmarkCalculator', () => {
  describe('calculateSharpeRatio', () => {
    it('应正确计算夏普比率（基础情况）', () => {
      // 年化收益 10%，波动率 15%，无风险利率 2%
      // 夏普 = (0.10 - 0.02) / 0.15 = 0.5333
      const result = BenchmarkCalculator.calculateSharpeRatio(10, 15, 0.02);
      expect(result).toBeCloseTo(0.5333, 2);
    });

    it('应正确计算夏普比率（使用默认无风险利率 2%）', () => {
      // 年化收益 8%，波动率 12%，默认无风险利率 2%
      // 夏普 = (0.08 - 0.02) / 0.12 = 0.50
      const result = BenchmarkCalculator.calculateSharpeRatio(8, 12);
      expect(result).toBeCloseTo(0.5, 2);
    });

    it('应处理负收益情况', () => {
      // 年化收益 -5%，波动率 10%
      // 夏普 = (-0.05 - 0.02) / 0.10 = -0.70
      const result = BenchmarkCalculator.calculateSharpeRatio(-5, 10, 0.02);
      expect(result).toBeCloseTo(-0.7, 2);
    });

    it('应处理零波动率情况（返回0）', () => {
      const result = BenchmarkCalculator.calculateSharpeRatio(10, 0, 0.02);
      expect(result).toBe(0);
    });

    it('应处理负波动率情况（返回0）', () => {
      const result = BenchmarkCalculator.calculateSharpeRatio(10, -5, 0.02);
      expect(result).toBe(0);
    });

    it('应与 Excel 计算结果对比误差小于 0.1%', () => {
      // Excel 验证数据：年化收益 15.5%，波动率 18.3%，无风险利率 2.5%
      // Excel 结果: (0.155 - 0.025) / 0.183 = 0.7103825
      const result = BenchmarkCalculator.calculateSharpeRatio(15.5, 18.3, 0.025);
      const expected = 0.7104;
      const error = Math.abs((result - expected) / expected);
      expect(error).toBeLessThan(0.001); // 0.1% 误差
    });

    it('应计算高夏普比率', () => {
      // 优秀组合：收益 20%，波动率 10%
      // 夏普 = (0.20 - 0.02) / 0.10 = 1.8
      const result = BenchmarkCalculator.calculateSharpeRatio(20, 10, 0.02);
      expect(result).toBeCloseTo(1.8, 2);
    });
  });

  describe('calculateCalmarRatio', () => {
    it('应正确计算卡玛比率', () => {
      // 年化收益 10%，最大回撤 15%
      // 卡玛 = 10 / 15 = 0.6667
      const result = BenchmarkCalculator.calculateCalmarRatio(10, 15);
      expect(result).toBeCloseTo(0.6667, 2);
    });

    it('应处理零回撤情况（返回0）', () => {
      const result = BenchmarkCalculator.calculateCalmarRatio(10, 0);
      expect(result).toBe(0);
    });

    it('应处理负回撤情况（返回0）', () => {
      const result = BenchmarkCalculator.calculateCalmarRatio(10, -5);
      expect(result).toBe(0);
    });

    it('应与 Excel 计算结果对比误差小于 0.1%', () => {
      // Excel 验证数据：年化收益 12.8%，最大回撤 8.5%
      // Excel 结果: 12.8 / 8.5 = 1.505882
      const result = BenchmarkCalculator.calculateCalmarRatio(12.8, 8.5);
      const expected = 1.5059;
      const error = Math.abs((result - expected) / expected);
      expect(error).toBeLessThan(0.001);
    });
  });

  describe('calculateBenchmarkComparison', () => {
    it('应正确计算基准对比（组合跑赢基准）', () => {
      // 组合净值：从1涨到1.2（收益20%）
      const portfolioNav: NavPoint[] = [
        { date: '2024-01-01', value: 1, return: 0 },
        { date: '2024-06-01', value: 1.1, return: 10 },
        { date: '2024-12-31', value: 1.2, return: 20 }
      ];

      // 基准净值：从1涨到1.1（收益10%）
      const benchmarkNav: NavPoint[] = [
        { date: '2024-01-01', value: 1, return: 0 },
        { date: '2024-06-01', value: 1.05, return: 5 },
        { date: '2024-12-31', value: 1.1, return: 10 }
      ];

      const result = BenchmarkCalculator.calculateBenchmarkComparison(
        portfolioNav, benchmarkNav, '000300'
      );

      expect(result.benchmarkCode).toBe('000300');
      expect(result.benchmarkName).toBe('沪深300');
      expect(result.benchmarkReturn).toBeCloseTo(10, 2);
      expect(result.excessReturn).toBeCloseTo(10, 2); // 20% - 10% = 10%
    });

    it('应正确计算基准对比（组合跑输基准）', () => {
      // 组合净值：从1涨到1.05（收益5%）
      const portfolioNav: NavPoint[] = [
        { date: '2024-01-01', value: 1, return: 0 },
        { date: '2024-12-31', value: 1.05, return: 5 }
      ];

      // 基准净值：从1涨到1.15（收益15%）
      const benchmarkNav: NavPoint[] = [
        { date: '2024-01-01', value: 1, return: 0 },
        { date: '2024-12-31', value: 1.15, return: 15 }
      ];

      const result = BenchmarkCalculator.calculateBenchmarkComparison(
        portfolioNav, benchmarkNav, 'H11001'
      );

      expect(result.benchmarkCode).toBe('H11001');
      expect(result.benchmarkName).toBe('中证全债');
      expect(result.benchmarkReturn).toBeCloseTo(15, 2);
      expect(result.excessReturn).toBeCloseTo(-10, 2); // 5% - 15% = -10%
    });

    it('应处理空数组情况', () => {
      const result = BenchmarkCalculator.calculateBenchmarkComparison(
        [], [], '000300'
      );

      expect(result.benchmarkCode).toBe('000300');
      expect(result.benchmarkReturn).toBe(0);
      expect(result.excessReturn).toBe(0);
    });

    it('应处理单点数据情况', () => {
      const portfolioNav: NavPoint[] = [
        { date: '2024-01-01', value: 1, return: 0 }
      ];

      const result = BenchmarkCalculator.calculateBenchmarkComparison(
        portfolioNav, portfolioNav, '000300'
      );

      expect(result.benchmarkReturn).toBe(0);
      expect(result.excessReturn).toBe(0);
    });

    it('应处理未知基准代码', () => {
      const portfolioNav: NavPoint[] = [
        { date: '2024-01-01', value: 1, return: 0 },
        { date: '2024-12-31', value: 1.1, return: 10 }
      ];

      const result = BenchmarkCalculator.calculateBenchmarkComparison(
        portfolioNav, portfolioNav, 'UNKNOWN'
      );

      expect(result.benchmarkCode).toBe('UNKNOWN');
      expect(result.benchmarkName).toBe('UNKNOWN');
    });

    it('应与 Excel 计算结果对比误差小于 0.1%', () => {
      // Excel 验证数据
      const portfolioNav: NavPoint[] = [
        { date: '2024-01-01', value: 1.0000, return: 0 },
        { date: '2024-03-01', value: 1.0250, return: 2.5 },
        { date: '2024-06-01', value: 1.0550, return: 5.5 },
        { date: '2024-09-01', value: 1.0820, return: 8.2 },
        { date: '2024-12-31', value: 1.1250, return: 12.5 }
      ];

      const benchmarkNav: NavPoint[] = [
        { date: '2024-01-01', value: 1.0000, return: 0 },
        { date: '2024-03-01', value: 1.0150, return: 1.5 },
        { date: '2024-06-01', value: 1.0320, return: 3.2 },
        { date: '2024-09-01', value: 1.0480, return: 4.8 },
        { date: '2024-12-31', value: 1.0680, return: 6.8 }
      ];

      const result = BenchmarkCalculator.calculateBenchmarkComparison(
        portfolioNav, benchmarkNav, '000300'
      );

      // Excel 计算：组合收益 12.5%，基准收益 6.8%，超额 5.7%
      expect(result.benchmarkReturn).toBeCloseTo(6.8, 2);
      expect(result.excessReturn).toBeCloseTo(5.7, 2);
    });
  });

  describe('getDefaultBenchmarks', () => {
    it('应返回默认基准列表', () => {
      const benchmarks = BenchmarkCalculator.getDefaultBenchmarks();
      
      expect(benchmarks).toHaveLength(2);
      expect(benchmarks[0].code).toBe('000300');
      expect(benchmarks[0].name).toBe('沪深300');
      expect(benchmarks[1].code).toBe('H11001');
      expect(benchmarks[1].name).toBe('中证全债');
    });
  });

  describe('calculateAllMetrics', () => {
    it('应计算所有风险调整收益指标', () => {
      const result = BenchmarkCalculator.calculateAllMetrics(10, 15, 12, 0.02);
      
      // 夏普 = (0.10 - 0.02) / 0.15 = 0.5333
      expect(result.sharpeRatio).toBeCloseTo(0.5333, 2);
      
      // 卡玛 = 10 / 12 = 0.8333
      expect(result.calmarRatio).toBeCloseTo(0.8333, 2);
    });

    it('当最大回撤为0时不应包含卡玛比率', () => {
      const result = BenchmarkCalculator.calculateAllMetrics(10, 15, 0, 0.02);
      
      expect(result.sharpeRatio).toBeGreaterThan(0);
      expect(result.calmarRatio).toBeUndefined();
    });

    it('应使用默认无风险利率', () => {
      const result = BenchmarkCalculator.calculateAllMetrics(8, 12, 10);
      
      // 夏普 = (0.08 - 0.02) / 0.12 = 0.5
      expect(result.sharpeRatio).toBeCloseTo(0.5, 2);
    });
  });
});
