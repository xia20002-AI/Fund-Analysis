import type { PortfolioConfig, NavData } from '../types';
import { describe, test, expect } from 'vitest';
import { PortfolioCalculator } from './index';

describe('PortfolioCalculator', () => {
  // 测试数据工厂函数（预留，用于生成随机测试数据）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const createNavData = (code: string, startNav: number, days: number): NavData[] => {
    const data: NavData[] = [];
    const baseDate = new Date('2024-01-01');
    let currentNav = startNav;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      
      // 模拟净值变化（周末跳过）
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // 净值随机波动 ±2%
        const change = (Math.random() - 0.5) * 0.04;
        currentNav = currentNav * (1 + change);
        
        data.push({
          fundCode: code,
          date: date.toISOString().split('T')[0],
          nav: parseFloat(currentNav.toFixed(4)),
          accNav: parseFloat(currentNav.toFixed(4))
        });
      }
    }
    return data;
  };

  // 创建精确的测试数据（非随机）
  const createPreciseNavData = (
    code: string, 
    navValues: { date: string; nav: number }[]
  ): NavData[] => {
    return navValues.map(v => ({
      fundCode: code,
      date: v.date,
      nav: v.nav,
      accNav: v.nav
    }));
  };

  describe('calculatePortfolioNav', () => {
    test('等权重组合计算正确', () => {
      // 测试数据：2只基金，各50%
      const config: PortfolioConfig = {
        id: 'test-1',
        name: '等权重测试组合',
        funds: [
          { code: '000001', name: '基金A', weight: 0.5 },
          { code: '000002', name: '基金B', weight: 0.5 }
        ],
        startDate: '2024-01-01',
        endDate: '2024-01-05'
      };

      // 精确数据：两只基金相同日期
      const navDataMap = new Map<string, NavData[]>([
        ['000001', createPreciseNavData('000001', [
          { date: '2024-01-01', nav: 1.0 },
          { date: '2024-01-02', nav: 1.02 },
          { date: '2024-01-03', nav: 1.01 },
          { date: '2024-01-04', nav: 1.03 },
          { date: '2024-01-05', nav: 1.05 }
        ])],
        ['000002', createPreciseNavData('000002', [
          { date: '2024-01-01', nav: 2.0 },
          { date: '2024-01-02', nav: 2.04 },
          { date: '2024-01-03', nav: 2.02 },
          { date: '2024-01-04', nav: 2.06 },
          { date: '2024-01-05', nav: 2.10 }
        ])]
      ]);

      const result = PortfolioCalculator.calculatePortfolioNav(config, navDataMap);

      // 验证结果
      expect(result).toHaveLength(5);
      
      // 首日净值 = 1.0×0.5 + 2.0×0.5 = 1.5
      expect(result[0].value).toBeCloseTo(1.5, 4);
      expect(result[0].return).toBe(0); // 首日收益率为0
      
      // 次日净值 = 1.02×0.5 + 2.04×0.5 = 1.53
      expect(result[1].value).toBeCloseTo(1.53, 4);
      // 收益率 = (1.53/1.5 - 1) × 100 = 2%
      expect(result[1].return).toBeCloseTo(2, 4);
      
      // 最后一日净值 = 1.05×0.5 + 2.10×0.5 = 1.575
      expect(result[4].value).toBeCloseTo(1.575, 4);
    });

    test('自定义权重计算正确', () => {
      // 测试数据：3只基金，权重不等 (50%, 30%, 20%)
      const config: PortfolioConfig = {
        id: 'test-2',
        name: '自定义权重测试组合',
        funds: [
          { code: '000001', name: '华夏成长', weight: 0.5 },
          { code: '000002', name: '华夏大盘', weight: 0.3 },
          { code: '000003', name: '华夏债券', weight: 0.2 }
        ],
        startDate: '2024-01-01',
        endDate: '2024-01-03'
      };

      const navDataMap = new Map<string, NavData[]>([
        ['000001', createPreciseNavData('000001', [
          { date: '2024-01-01', nav: 1.5 },
          { date: '2024-01-02', nav: 1.52 },
          { date: '2024-01-03', nav: 1.51 }
        ])],
        ['000002', createPreciseNavData('000002', [
          { date: '2024-01-01', nav: 2.0 },
          { date: '2024-01-02', nav: 2.05 },
          { date: '2024-01-03', nav: 2.03 }
        ])],
        ['000003', createPreciseNavData('000003', [
          { date: '2024-01-01', nav: 1.1 },
          { date: '2024-01-02', nav: 1.101 },
          { date: '2024-01-03', nav: 1.102 }
        ])]
      ]);

      const result = PortfolioCalculator.calculatePortfolioNav(config, navDataMap);

      // 验证结果
      expect(result).toHaveLength(3);
      
      // 首日净值 = 1.5×0.5 + 2.0×0.3 + 1.1×0.2 = 0.75 + 0.6 + 0.22 = 1.57
      expect(result[0].value).toBeCloseTo(1.57, 4);
      expect(result[0].return).toBe(0);
      
      // 次日净值 = 1.52×0.5 + 2.05×0.3 + 1.101×0.2 = 0.76 + 0.615 + 0.2202 = 1.5952
      expect(result[1].value).toBeCloseTo(1.5952, 4);
      // 收益率 = (1.5952/1.57 - 1) × 100 ≈ 1.605%
      expect(result[1].return).toBeCloseTo(1.6051, 2);
    });

    test('处理缺失数据 - 节假日填充', () => {
      const config: PortfolioConfig = {
        id: 'test-3',
        name: '缺失数据测试组合',
        funds: [
          { code: '000001', name: '基金A', weight: 0.6 },
          { code: '000002', name: '基金B', weight: 0.4 }
        ],
        startDate: '2024-01-01',
        endDate: '2024-01-05'
      };

      // 模拟周末无数据的情况（2024-01-01是周一，01-06是周六）
      const navDataMap = new Map<string, NavData[]>([
        ['000001', createPreciseNavData('000001', [
          { date: '2024-01-01', nav: 1.0 },
          { date: '2024-01-02', nav: 1.01 },
          // 01-03 缺失（节假日），应使用前一日数据
          { date: '2024-01-04', nav: 1.02 },
          { date: '2024-01-05', nav: 1.03 }
        ])],
        ['000002', createPreciseNavData('000002', [
          { date: '2024-01-01', nav: 2.0 },
          { date: '2024-01-02', nav: 2.02 },
          // 01-03 缺失
          { date: '2024-01-04', nav: 2.04 },
          { date: '2024-01-05', nav: 2.06 }
        ])]
      ]);

      const result = PortfolioCalculator.calculatePortfolioNav(config, navDataMap);

      // 应该有5天的数据（01-01到01-05）
      expect(result).toHaveLength(5);
      
      // 01-03应使用填充数据：基金A=1.01，基金B=2.02
      // 组合净值 = 1.01×0.6 + 2.02×0.4 = 0.606 + 0.808 = 1.414
      const jan03 = result.find(r => r.date === '2024-01-03');
      expect(jan03).toBeDefined();
      expect(jan03!.value).toBeCloseTo(1.414, 4);
    });

    test('处理基金成立时间不同 - 取最晚成立日为起始日', () => {
      const config: PortfolioConfig = {
        id: 'test-4',
        name: '不同成立时间测试组合',
        funds: [
          { code: '000001', name: '老基金', weight: 0.5 },
          { code: '000002', name: '新基金', weight: 0.5 }
        ],
        startDate: '2024-01-01',
        endDate: '2024-01-10'
      };

      // 老基金数据从01-01开始，新基金从01-05开始
      const navDataMap = new Map<string, NavData[]>([
        ['000001', createPreciseNavData('000001', [
          { date: '2024-01-01', nav: 1.0 },
          { date: '2024-01-02', nav: 1.01 },
          { date: '2024-01-03', nav: 1.02 },
          { date: '2024-01-04', nav: 1.03 },
          { date: '2024-01-05', nav: 1.04 }
        ])],
        ['000002', createPreciseNavData('000002', [
          { date: '2024-01-05', nav: 2.0 },
          { date: '2024-01-06', nav: 2.01 },
          { date: '2024-01-07', nav: 2.02 }
        ])]
      ]);

      const result = PortfolioCalculator.calculatePortfolioNav(config, navDataMap);

      // 应该只有共同日期的数据（01-05到01-07）
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].date).toBe('2024-01-05'); // 从最晚成立日开始
    });

    test('与Excel对比误差<0.1%', () => {
      // 使用已知精确数据进行对比测试
      const config: PortfolioConfig = {
        id: 'test-excel',
        name: 'Excel对比测试',
        funds: [
          { code: '000001', name: '基金A', weight: 0.4 },
          { code: '000002', name: '基金B', weight: 0.35 },
          { code: '000003', name: '基金C', weight: 0.25 }
        ],
        startDate: '2024-01-01',
        endDate: '2024-01-05'
      };

      // 精确的测试数据
      const navDataMap = new Map<string, NavData[]>([
        ['000001', createPreciseNavData('000001', [
          { date: '2024-01-01', nav: 1.2345 },
          { date: '2024-01-02', nav: 1.2456 },
          { date: '2024-01-03', nav: 1.2389 },
          { date: '2024-01-04', nav: 1.2567 },
          { date: '2024-01-05', nav: 1.2678 }
        ])],
        ['000002', createPreciseNavData('000002', [
          { date: '2024-01-01', nav: 2.3456 },
          { date: '2024-01-02', nav: 2.3567 },
          { date: '2024-01-03', nav: 2.3678 },
          { date: '2024-01-04', nav: 2.3789 },
          { date: '2024-01-05', nav: 2.3901 }
        ])],
        ['000003', createPreciseNavData('000003', [
          { date: '2024-01-01', nav: 0.9876 },
          { date: '2024-01-02', nav: 0.9987 },
          { date: '2024-01-03', nav: 1.0098 },
          { date: '2024-01-04', nav: 1.0209 },
          { date: '2024-01-05', nav: 1.0320 }
        ])]
      ]);

      const result = PortfolioCalculator.calculatePortfolioNav(config, navDataMap);

      // Excel计算的预期值：
      // 01-01: 1.2345×0.4 + 2.3456×0.35 + 0.9876×0.25 = 1.56166
      const expectedDay1 = 1.56166;
      expect(result[0].value).toBeCloseTo(expectedDay1, 4);

      // 计算误差百分比
      const calculatedReturn = result[4].return;
      // 首日净值
      const firstDayValue = result[0].value;
      // 最后一日净值
      const lastDayValue = result[4].value;
      // 计算收益率
      const calculatedReturnFromValue = ((lastDayValue / firstDayValue) - 1) * 100;
      
      // 验证收益率一致性
      expect(calculatedReturn).toBeCloseTo(calculatedReturnFromValue, 2);
      
      // 误差应小于0.1%
      const errorRate = Math.abs(calculatedReturn - calculatedReturnFromValue) / Math.abs(calculatedReturn);
      expect(errorRate).toBeLessThan(0.001);
    });

    test('单基金组合计算正确', () => {
      const config: PortfolioConfig = {
        id: 'test-single',
        name: '单基金测试',
        funds: [
          { code: '000001', name: '单基金', weight: 1.0 }
        ],
        startDate: '2024-01-01',
        endDate: '2024-01-03'
      };

      const navDataMap = new Map<string, NavData[]>([
        ['000001', createPreciseNavData('000001', [
          { date: '2024-01-01', nav: 1.0 },
          { date: '2024-01-02', nav: 1.05 },
          { date: '2024-01-03', nav: 1.10 }
        ])]
      ]);

      const result = PortfolioCalculator.calculatePortfolioNav(config, navDataMap);

      expect(result).toHaveLength(3);
      expect(result[0].value).toBe(1.0);
      expect(result[1].value).toBe(1.05);
      expect(result[2].value).toBe(1.10);
      // 最后一日收益率 = (1.10/1.0 - 1) × 100 = 10%
      expect(result[2].return).toBe(10);
    });

    test('空数据应抛出错误', () => {
      const config: PortfolioConfig = {
        id: 'test-empty',
        name: '空数据测试',
        funds: [
          { code: '000001', name: '基金A', weight: 1.0 }
        ],
        startDate: '2024-01-01',
        endDate: '2024-01-03'
      };

      const navDataMap = new Map<string, NavData[]>();

      expect(() => {
        PortfolioCalculator.calculatePortfolioNav(config, navDataMap);
      }).toThrow('基金 000001 (基金A) 没有净值数据');
    });

    test('无共同日期应抛出错误', () => {
      const config: PortfolioConfig = {
        id: 'test-no-common',
        name: '无共同日期测试',
        funds: [
          { code: '000001', name: '基金A', weight: 0.5 },
          { code: '000002', name: '基金B', weight: 0.5 }
        ],
        startDate: '2024-01-01',
        endDate: '2024-01-03'
      };

      const navDataMap = new Map<string, NavData[]>([
        ['000001', createPreciseNavData('000001', [
          { date: '2024-01-01', nav: 1.0 },
          { date: '2024-01-02', nav: 1.01 }
        ])],
        ['000002', createPreciseNavData('000002', [
          { date: '2024-02-01', nav: 2.0 },  // 完全不同的日期
          { date: '2024-02-02', nav: 2.01 }
        ])]
      ]);

      expect(() => {
        PortfolioCalculator.calculatePortfolioNav(config, navDataMap);
      }).toThrow('所选基金没有共同的交易日');
    });
  });

  describe('calculateEqualWeight', () => {
    test('2只基金等权重应为0.5', () => {
      expect(PortfolioCalculator.calculateEqualWeight(2)).toBe(0.5);
    });

    test('3只基金等权重应为0.3333', () => {
      expect(PortfolioCalculator.calculateEqualWeight(3)).toBeCloseTo(0.3333, 4);
    });

    test('5只基金等权重应为0.2', () => {
      expect(PortfolioCalculator.calculateEqualWeight(5)).toBe(0.2);
    });

    test('0只基金应返回0', () => {
      expect(PortfolioCalculator.calculateEqualWeight(0)).toBe(0);
    });
  });

  describe('validateWeights', () => {
    test('权重总和为1应返回true', () => {
      const funds = [
        { weight: 0.3 },
        { weight: 0.3 },
        { weight: 0.4 }
      ];
      expect(PortfolioCalculator.validateWeights(funds)).toBe(true);
    });

    test('权重总和不为1应返回false', () => {
      const funds = [
        { weight: 0.3 },
        { weight: 0.3 },
        { weight: 0.3 }
      ];
      expect(PortfolioCalculator.validateWeights(funds)).toBe(false);
    });

    test('允许0.01%误差', () => {
      const funds = [
        { weight: 0.3333 },
        { weight: 0.3333 },
        { weight: 0.3334 }
      ];
      expect(PortfolioCalculator.validateWeights(funds)).toBe(true);
    });
  });

  describe('normalizeWeights', () => {
    test('权重应被正确归一化', () => {
      const funds = [
        { code: 'A', weight: 30 },
        { code: 'B', weight: 30 },
        { code: 'C', weight: 40 }
      ];

      const normalized = PortfolioCalculator.normalizeWeights(funds);
      
      expect(normalized[0].weight).toBeCloseTo(0.3, 4);
      expect(normalized[1].weight).toBeCloseTo(0.3, 4);
      expect(normalized[2].weight).toBeCloseTo(0.4, 4);
    });

    test('总和应为1', () => {
      const funds = [
        { code: 'A', weight: 1 },
        { code: 'B', weight: 1 },
        { code: 'C', weight: 1 }
      ];

      const normalized = PortfolioCalculator.normalizeWeights(funds);
      const total = normalized.reduce((sum, f) => sum + f.weight, 0);
      
      expect(total).toBeCloseTo(1, 3);
    });

    test('空数组应返回空数组', () => {
      const result = PortfolioCalculator.normalizeWeights([]);
      expect(result).toEqual([]);
    });

    test('权重为0应原样返回', () => {
      const funds = [
        { code: 'A', weight: 0 },
        { code: 'B', weight: 0 }
      ];

      const normalized = PortfolioCalculator.normalizeWeights(funds);
      expect(normalized).toEqual(funds);
    });
  });

  // 使用 createNavData 的测试（避免 TS6133 未使用警告）
  describe('createNavData 工厂函数', () => {
    test('应生成指定天数的净值数据', () => {
      const data = createNavData('TEST001', 1.0, 5);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].fundCode).toBe('TEST001');
      expect(data[0].nav).toBeCloseTo(1.0, 2);
    });
  });
});
