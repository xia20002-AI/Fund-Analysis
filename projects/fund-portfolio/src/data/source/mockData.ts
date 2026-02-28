import type { FundInfo, NavData, FundType } from '../../core/types';

/**
 * Mock 基金数据
 * 用于离线开发和测试
 */
export const MOCK_FUNDS: FundInfo[] = [
  { code: '000001', name: '华夏成长混合', type: 'hybrid' },
  { code: '000011', name: '华夏大盘精选混合', type: 'hybrid' },
  { code: '000300', name: '沪深300指数', type: 'index' },
  { code: '110022', name: '易方达消费行业股票', type: 'stock' },
  { code: '161725', name: '招商中证白酒指数', type: 'index' },
  { code: '005827', name: '易方达蓝筹精选混合', type: 'hybrid' },
  { code: '003096', name: '中欧医疗健康混合A', type: 'hybrid' },
  { code: '260108', name: '景顺长城新兴成长混合', type: 'hybrid' },
  { code: '163406', name: '兴全合润混合', type: 'hybrid' },
  { code: '001938', name: '中欧时代先锋股票A', type: 'stock' },
  { code: '000991', name: '工银战略转型股票', type: 'stock' },
  { code: '002939', name: '广发创新升级混合', type: 'hybrid' },
  { code: '110003', name: '易方达上证50指数A', type: 'index' },
  { code: '050002', name: '博时沪深300指数A', type: 'index' },
  { code: '040046', name: '华安纳斯达克100指数', type: 'qdii' },
  { code: '519915', name: '富国消费主题混合', type: 'hybrid' },
  { code: '000171', name: '易方达裕丰回报债券', type: 'bond' },
  { code: '110017', name: '易方达增强回报债券A', type: 'bond' },
  { code: '000198', name: '天弘余额宝货币', type: 'money' },
  { code: '003474', name: '南方天天利货币A', type: 'money' },
];

/**
 * Mock 基准指数
 */
export const MOCK_BENCHMARKS: FundInfo[] = [
  { code: '000300', name: '沪深300指数', type: 'index' },
  { code: 'H11001', name: '中证全债指数', type: 'index' },
  { code: '000905', name: '中证500指数', type: 'index' },
  { code: '000016', name: '上证50指数', type: 'index' },
  { code: '399006', name: '创业板指数', type: 'index' },
];

/**
 * 根据关键词搜索 Mock 基金
 * 支持代码精确匹配和名称模糊匹配
 */
export function searchMockFunds(keyword: string): FundInfo[] {
  if (!keyword || keyword.trim().length === 0) {
    return [];
  }

  const trimmedKeyword = keyword.trim().toLowerCase();
  const isCodeSearch = /^\d{6}$/.test(trimmedKeyword);

  if (isCodeSearch) {
    // 代码精确匹配
    return MOCK_FUNDS.filter((f) => f.code === trimmedKeyword);
  }

  // 名称模糊匹配
  return MOCK_FUNDS.filter(
    (f) =>
      f.name.toLowerCase().includes(trimmedKeyword) ||
      f.code.includes(trimmedKeyword)
  );
}

/**
 * 生成 Mock 净值数据
 * 生成随机但有趋势的净值数据
 */
export function generateMockNavData(
  fundCode: string,
  startDate: string,
  endDate: string
): NavData[] {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return [];
  }

  const results: NavData[] = [];
  let currentNav = getInitialNav(fundCode);
  let currentAccNav = currentNav;

  // 根据基金类型设置不同的波动率
  const volatility = getVolatilityByFundCode(fundCode);
  const trend = getTrendByFundCode(fundCode);

  const current = new Date(start);
  while (current <= end) {
    // 跳过周末
    const dayOfWeek = current.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      current.setDate(current.getDate() + 1);
      continue;
    }

    // 生成日收益率（包含随机波动和趋势）
    const dailyReturn = generateDailyReturn(volatility, trend);

    // 更新净值
    currentNav = currentNav * (1 + dailyReturn);
    currentAccNav = currentAccNav * (1 + dailyReturn);

    results.push({
      fundCode,
      date: formatDate(current),
      nav: round(currentNav, 4),
      accNav: round(currentAccNav, 4),
    });

    current.setDate(current.getDate() + 1);
  }

  return results;
}

/**
 * 生成 Mock 基准指数数据
 */
export function generateMockBenchmarkData(
  indexCode: string,
  startDate: string,
  endDate: string
): NavData[] {
  // 基准指数使用不同的初始值和趋势
  const indexParams: Record<string, { initial: number; volatility: number; trend: number }> = {
    '000300': { initial: 4000, volatility: 0.015, trend: 0.0001 },
    'H11001': { initial: 200, volatility: 0.003, trend: 0.00005 },
    '000905': { initial: 6000, volatility: 0.018, trend: 0.00008 },
    '000016': { initial: 3000, volatility: 0.012, trend: 0.0001 },
    '399006': { initial: 2500, volatility: 0.02, trend: 0.00012 },
  };

  const params = indexParams[indexCode] || { initial: 3000, volatility: 0.015, trend: 0.0001 };

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return [];
  }

  const results: NavData[] = [];
  let currentNav = params.initial;
  let currentAccNav = currentNav;

  const current = new Date(start);
  while (current <= end) {
    // 跳过周末
    const dayOfWeek = current.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      current.setDate(current.getDate() + 1);
      continue;
    }

    const dailyReturn = generateDailyReturn(params.volatility, params.trend);
    currentNav = currentNav * (1 + dailyReturn);
    currentAccNav = currentAccNav * (1 + dailyReturn);

    results.push({
      fundCode: indexCode,
      date: formatDate(current),
      nav: round(currentNav, 4),
      accNav: round(currentAccNav, 4),
    });

    current.setDate(current.getDate() + 1);
  }

  return results;
}

/**
 * 根据基金代码获取初始净值
 * 使用代码的数字特征生成稳定的初始值
 */
function getInitialNav(fundCode: string): number {
  // 使用基金代码的后5位数字生成1.0-5.0之间的初始净值
  const codeNum = parseInt(fundCode.slice(-5), 10);
  const baseValue = 1 + (codeNum % 400) / 100;
  return round(baseValue, 4);
}

/**
 * 根据基金代码获取波动率
 */
function getVolatilityByFundCode(fundCode: string): number {
  // 查找基金类型
  const fund = MOCK_FUNDS.find((f) => f.code === fundCode);
  const type = fund?.type;

  // 根据类型设置波动率
  const volatilityMap: Record<FundType, number> = {
    stock: 0.02,   // 股票型：高波动
    hybrid: 0.015, // 混合型：中等波动
    index: 0.018,  // 指数型：中高波动
    qdii: 0.022,   // QDII：高波动
    bond: 0.005,   // 债券型：低波动
    money: 0.001,  // 货币型：极低波动
  };

  return type ? volatilityMap[type] : 0.015;
}

/**
 * 根据基金代码获取趋势
 */
function getTrendByFundCode(fundCode: string): number {
  // 查找基金类型
  const fund = MOCK_FUNDS.find((f) => f.code === fundCode);
  const type = fund?.type;

  // 根据类型设置年化收益率趋势（日收益率）
  // 年化8%约等于日收益率0.03%
  const trendMap: Record<FundType, number> = {
    stock: 0.0003,   // 股票型：年化约8%
    hybrid: 0.00025, // 混合型：年化约6.5%
    index: 0.0003,   // 指数型：年化约8%
    qdii: 0.00025,   // QDII：年化约6.5%
    bond: 0.0001,    // 债券型：年化约3%
    money: 0.00005,  // 货币型：年化约1.5%
  };

  return type ? trendMap[type] : 0.0002;
}

/**
 * 生成日收益率
 * 使用正态分布模拟
 */
function generateDailyReturn(volatility: number, trend: number): number {
  // Box-Muller 变换生成正态分布随机数
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

  // 日收益率 = 趋势 + 波动 * 随机数
  return trend + volatility * z;
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 四舍五入到指定小数位
 */
function round(value: number, decimals: number): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}
