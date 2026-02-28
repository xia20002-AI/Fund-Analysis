import { IndexedDBStorage } from './index';
import type { PortfolioConfig, NavData } from './index';

// 简单的测试函数
export async function runStorageTests(): Promise<void> {
  const storage = new IndexedDBStorage();

  console.log('=== 测试数据存储抽象层 ===\n');

  // 测试 1: 保存组合配置
  console.log('测试 1: 保存组合配置...');
  const testPortfolio: PortfolioConfig = {
    id: 'test-portfolio-1',
    name: '测试组合',
    funds: [
      { code: '000001', name: '测试基金1', weight: 0.5 },
      { code: '000002', name: '测试基金2', weight: 0.5 },
    ],
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await storage.savePortfolio(testPortfolio.id, testPortfolio);
  console.log('✓ 组合配置保存成功\n');

  // 测试 2: 读取单个组合配置
  console.log('测试 2: 读取单个组合配置...');
  const loadedPortfolio = await storage.getPortfolio(testPortfolio.id);
  if (loadedPortfolio && loadedPortfolio.id === testPortfolio.id) {
    console.log('✓ 读取成功:', loadedPortfolio.name, '\n');
  } else {
    console.error('✗ 读取失败\n');
  }

  // 测试 3: 读取所有组合配置
  console.log('测试 3: 读取所有组合配置...');
  const allPortfolios = await storage.getAllPortfolios();
  console.log(`✓ 发现 ${allPortfolios.size} 个组合配置\n`);

  // 测试 4: 缓存基金净值数据
  console.log('测试 4: 缓存基金净值数据...');
  const testNavData: NavData[] = [
    { fundCode: '000001', date: '2024-01-01', nav: 1.1234, accNav: 1.2345 },
    { fundCode: '000001', date: '2024-01-02', nav: 1.1250, accNav: 1.2360 },
    { fundCode: '000001', date: '2024-01-03', nav: 1.1270, accNav: 1.2380 },
  ];
  await storage.cacheFundNav('000001', testNavData);
  console.log('✓ 基金净值数据缓存成功\n');

  // 测试 5: 读取缓存的基金净值数据
  console.log('测试 5: 读取缓存的基金净值数据...');
  const cachedNav = await storage.getCachedFundNav('000001');
  if (cachedNav && cachedNav.length === 3) {
    console.log(`✓ 读取成功，共 ${cachedNav.length} 条记录\n`);
  } else {
    console.error('✗ 读取失败\n');
  }

  // 测试 6: 获取存储空间信息
  console.log('测试 6: 获取存储空间信息...');
  const storageInfo = await storage.getStorageInfo();
  console.log(`✓ 存储使用: ${(storageInfo.used / 1024 / 1024).toFixed(2)} MB / ${(storageInfo.limit / 1024 / 1024).toFixed(2)} MB\n`);

  // 测试 7: 删除组合配置
  console.log('测试 7: 删除组合配置...');
  await storage.deletePortfolio(testPortfolio.id);
  const deletedPortfolio = await storage.getPortfolio(testPortfolio.id);
  if (!deletedPortfolio) {
    console.log('✓ 组合配置删除成功\n');
  } else {
    console.error('✗ 删除失败\n');
  }

  console.log('=== 所有测试完成 ===');
}

// 如果在浏览器环境中运行，可以调用此函数
if (typeof window !== 'undefined') {
  // 暴露到全局以便手动测试
  (window as unknown as Record<string, unknown>).runStorageTests = runStorageTests;
}
