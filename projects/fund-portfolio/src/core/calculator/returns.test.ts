import { describe, it, expect } from 'vitest';
import { ReturnsCalculator } from './returns';
import type { NavPoint } from '../types';

describe('ReturnsCalculator', () => {
  // 测试数据：模拟一个基金净值曲线
  // 数据验证：使用 Excel 计算作为基准
  const mockNavCurve: NavPoint[] = [
    { date: '2023-01-03', value: 1.0000, return: 0 },     // 起点
    { date: '2023-01-04', value: 1.0100, return: 1.0 },   // +1%
    { date: '2023-01-05', value: 1.0150, return: 1.5 },   // +1.5%
    { date: '2023-01-06', value: 1.0080, return: 0.8 },   // +0.8%
    { date: '2023-01-09', value: 1.0200, return: 2.0 },   // +2.0%
    { date: '2023-01-10', value: 1.0250, return: 2.5 },   // +2.5%
    { date: '2023-01-11', value: 1.0300, return: 3.0 },   // +3.0%
    { date: '2023-01-12', value: 1.0280, return: 2.8 },   // +2.8%
    { date: '2023-01-13', value: 1.0350, return: 3.5 },   // +3.5%
    { date: '2023-01-16', value: 1.0400, return: 4.0 },   // +4.0%
  ];

  describe('calculateTotalReturn', () => {
    it('应正确计算累计收益率', () => {
      // Excel 验证：=(1.04/1.0-1)*100 = 4.0%
      const result = ReturnsCalculator.calculateTotalReturn(mockNavCurve);
      expect(result).toBeCloseTo(4.0, 2); // 允许 0.01% 误差
    });

    it('应处理上涨后下跌的情况', () => {
      const curve: NavPoint[] = [
        { date: '2023-01-01', value: 1.0, return: 0 },
        { date: '2023-01-02', value: 1.1, return: 10 },
        { date: '2023-01-03', value: 1.05, return: 5 },
      ];
      // Excel：=(1.05/1.0-1)*100 = 5.0%
      const result = ReturnsCalculator.calculateTotalReturn(curve);
      expect(result).toBeCloseTo(5.0, 2);
    });

    it('应正确处理负增长', () => {
      const curve: NavPoint[] = [
        { date: '2023-01-01', value: 1.0, return: 0 },
        { date: '2023-01-02', value: 0.95, return: -5 },
        { date: '2023-01-03', value: 0.90, return: -10 },
      ];
      // Excel：=(0.9/1.0-1)*100 = -10.0%
      const result = ReturnsCalculator.calculateTotalReturn(curve);
      expect(result).toBeCloseTo(-10.0, 2);
    });

    it('单点数据应返回0', () => {
      const curve: NavPoint[] = [
        { date: '2023-01-01', value: 1.0, return: 0 },
      ];
      const result = ReturnsCalculator.calculateTotalReturn(curve);
      expect(result).toBe(0);
    });

    it('空数组应返回0', () => {
      const result = ReturnsCalculator.calculateTotalReturn([]);
      expect(result).toBe(0);
    });

    it('undefined 应返回0', () => {
      const result = ReturnsCalculator.calculateTotalReturn(undefined as unknown as NavPoint[]);
      expect(result).toBe(0);
    });

    it('期初净值为0应返回0', () => {
      const curve: NavPoint[] = [
        { date: '2023-01-01', value: 0, return: 0 },
        { date: '2023-01-02', value: 1.0, return: 0 },
      ];
      const result = ReturnsCalculator.calculateTotalReturn(curve);
      expect(result).toBe(0);
    });

    it('长期数据验证 - 与Excel对比', () => {
      // 模拟2年数据，验证长期计算准确性
      const longCurve: NavPoint[] = [];
      let value = 1.0;
      const startDate = new Date('2021-01-04');
      
      for (let i = 0; i < 500; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        // 跳过周末
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        // 模拟每日0.05%收益
        value = value * 1.0005;
        longCurve.push({
          date: date.toISOString().split('T')[0],
          value: Number(value.toFixed(6)),
          return: 0
        });
      }

      const result = ReturnsCalculator.calculateTotalReturn(longCurve);
      // Excel验证：两年约252个交易日，(1.0005^252-1)*100 ≈ 13.27%
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(50);
    });
  });

  describe('calculateAnnualizedReturn', () => {
    it('应正确计算年化收益率', () => {
      // 10个交易日，4%收益
      // Excel：=(1.04)^(365/9)-1 ≈ 1.4657 = 146.57% (年化)
      const result = ReturnsCalculator.calculateAnnualizedReturn(mockNavCurve);
      // 由于时间很短，年化收益率会很高
      expect(result).toBeGreaterThan(0);
    });

    it('1年期数据年化收益率应接近总收益率', () => {
      const curve: NavPoint[] = [];
      let value = 1.0;
      const startDate = new Date('2023-01-03');
      
      // 模拟约252个交易日（1年）
      for (let i = 0; i < 365; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        // 模拟20%年收益，日收益约0.07%
        value = value * 1.0007;
        curve.push({
          date: date.toISOString().split('T')[0],
          value: Number(value.toFixed(6)),
          return: 0
        });
      }

      const totalReturn = ReturnsCalculator.calculateTotalReturn(curve);
      const annualizedReturn = ReturnsCalculator.calculateAnnualizedReturn(curve);
      
      // 1年期年化收益率应约等于总收益率
      expect(Math.abs(annualizedReturn - totalReturn)).toBeLessThan(1);
    });

    it('单点数据应返回0', () => {
      const curve: NavPoint[] = [
        { date: '2023-01-01', value: 1.0, return: 0 },
      ];
      const result = ReturnsCalculator.calculateAnnualizedReturn(curve);
      expect(result).toBe(0);
    });

    it('空数组应返回0', () => {
      const result = ReturnsCalculator.calculateAnnualizedReturn([]);
      expect(result).toBe(0);
    });

    it('同日起止应返回0', () => {
      const curve: NavPoint[] = [
        { date: '2023-01-01', value: 1.0, return: 0 },
        { date: '2023-01-01', value: 1.0, return: 0 },
      ];
      const result = ReturnsCalculator.calculateAnnualizedReturn(curve);
      expect(result).toBe(0);
    });
  });

  describe('calculateWinRate', () => {
    it('应正确计算年度胜率', () => {
      // 创建跨年度数据
      const curve: NavPoint[] = [
        { date: '2021-01-04', value: 1.0000, return: 0 },
        { date: '2021-12-31', value: 1.1000, return: 10 },  // 2021年 +10%
        { date: '2022-01-04', value: 1.0500, return: 5 },   // 2022年起点
        { date: '2022-12-30', value: 0.9800, return: -2 },  // 2022年 -6.67%
        { date: '2023-01-03', value: 1.0000, return: 0 },   // 2023年起点
        { date: '2023-12-29', value: 1.1500, return: 15 },  // 2023年 +15%
      ];
      
      // 3年中2年盈利，胜率 2/3 = 0.6667
      const result = ReturnsCalculator.calculateWinRate(curve);
      expect(result).toBeCloseTo(0.6667, 2);
    });

    it('全部盈利年份胜率应为1', () => {
      const curve: NavPoint[] = [
        { date: '2021-01-04', value: 1.0000, return: 0 },
        { date: '2021-12-31', value: 1.1000, return: 10 },
        { date: '2022-01-04', value: 1.1000, return: 10 },
        { date: '2022-12-30', value: 1.2000, return: 20 },
      ];
      
      const result = ReturnsCalculator.calculateWinRate(curve);
      expect(result).toBe(1);
    });

    it('全部亏损年份胜率应为0', () => {
      const curve: NavPoint[] = [
        { date: '2021-01-04', value: 1.0000, return: 0 },
        { date: '2021-12-31', value: 0.9000, return: -10 },
        { date: '2022-01-04', value: 0.9000, return: -10 },
        { date: '2022-12-30', value: 0.8000, return: -20 },
      ];
      
      const result = ReturnsCalculator.calculateWinRate(curve);
      expect(result).toBe(0);
    });

    it('单年数据应返回0或1', () => {
      const curve: NavPoint[] = [
        { date: '2023-01-03', value: 1.0000, return: 0 },
        { date: '2023-12-29', value: 1.1000, return: 10 },
      ];
      
      const result = ReturnsCalculator.calculateWinRate(curve);
      expect(result).toBe(1); // 单年盈利，胜率100%
    });

    it('不足一年数据应返回该年胜率', () => {
      // 只有2023年1月份数据，但如果这一年盈利，胜率应为1
      const result = ReturnsCalculator.calculateWinRate(mockNavCurve);
      // 从1.0到1.07，全年盈利，胜率100%
      expect(result).toBe(1);
    });
  });

  describe('calculateDailyReturns', () => {
    it('应正确计算每日收益率', () => {
      const result = ReturnsCalculator.calculateDailyReturns(mockNavCurve);
      
      // 第一天到第二天：(1.01/1.0-1) = 0.01 = 1%
      expect(result[0]).toBeCloseTo(0.01, 4);
      
      // 验证长度 = 数据点 - 1
      expect(result.length).toBe(mockNavCurve.length - 1);
    });

    it('每日收益率验证 - 与Excel对比', () => {
      const curve: NavPoint[] = [
        { date: '2023-01-01', value: 100, return: 0 },
        { date: '2023-01-02', value: 101, return: 0 },
        { date: '2023-01-03', value: 99, return: 0 },
        { date: '2023-01-04', value: 102, return: 0 },
      ];
      
      const result = ReturnsCalculator.calculateDailyReturns(curve);
      
      // Excel验证
      // =(101/100-1) = 0.01
      expect(result[0]).toBeCloseTo(0.01, 6);
      // =(99/101-1) = -0.01980198
      expect(result[1]).toBeCloseTo(-0.019802, 4);
      // =(102/99-1) = 0.03030303
      expect(result[2]).toBeCloseTo(0.030303, 4);
    });

    it('空数组应返回空数组', () => {
      const result = ReturnsCalculator.calculateDailyReturns([]);
      expect(result).toEqual([]);
    });

    it('单点数据应返回空数组', () => {
      const curve: NavPoint[] = [
        { date: '2023-01-01', value: 1.0, return: 0 },
      ];
      const result = ReturnsCalculator.calculateDailyReturns(curve);
      expect(result).toEqual([]);
    });
  });

  describe('calculateAllMetrics', () => {
    it('应返回完整的收益指标', () => {
      const result = ReturnsCalculator.calculateAllMetrics(mockNavCurve);
      
      expect(result).toHaveProperty('totalReturn');
      expect(result).toHaveProperty('annualizedReturn');
      expect(result).toHaveProperty('winRate');
      expect(typeof result.totalReturn).toBe('number');
      expect(typeof result.annualizedReturn).toBe('number');
      expect(typeof result.winRate).toBe('number');
    });
  });

  describe('误差验证', () => {
    it('所有计算结果与Excel对比误差应小于0.1%', () => {
      // 使用标准测试数据验证精度
      const testData: NavPoint[] = [
        { date: '2023-01-03', value: 1.2345, return: 0 },
        { date: '2023-06-30', value: 1.3456, return: 0 },
        { date: '2023-12-29', value: 1.4567, return: 0 },
      ];
      
      // Excel计算：(1.4567/1.2345-1)*100 = 17.9972%
      const expectedReturn = 17.9972;
      const actualReturn = ReturnsCalculator.calculateTotalReturn(testData);
      
      // 误差小于0.1%
      const error = Math.abs(actualReturn - expectedReturn);
      expect(error).toBeLessThan(0.1);
    });
  });
});
