import localforage from 'localforage';
import { IStorage, PortfolioConfig, NavData } from './interface';

export class IndexedDBStorage implements IStorage {
  private portfolioStore: LocalForage;
  private navStore: LocalForage;

  constructor() {
    this.portfolioStore = localforage.createInstance({
      name: 'FundPortfolio',
      storeName: 'portfolios',
    });
    this.navStore = localforage.createInstance({
      name: 'FundPortfolio',
      storeName: 'navData',
    });
  }

  // 组合配置存储方法
  async savePortfolio(id: string, config: PortfolioConfig): Promise<void> {
    const updatedConfig = {
      ...config,
      updatedAt: new Date().toISOString(),
    };
    await this.portfolioStore.setItem(id, updatedConfig);
  }

  async getPortfolio(id: string): Promise<PortfolioConfig | null> {
    const config = await this.portfolioStore.getItem<PortfolioConfig>(id);
    return config ?? null;
  }

  async getAllPortfolios(): Promise<Map<string, PortfolioConfig>> {
    const portfolios = new Map<string, PortfolioConfig>();
    await this.portfolioStore.iterate<PortfolioConfig, void>((value, key) => {
      portfolios.set(key, value);
    });
    return portfolios;
  }

  async deletePortfolio(id: string): Promise<void> {
    await this.portfolioStore.removeItem(id);
  }

  // 基金数据缓存方法
  async cacheFundNav(fundCode: string, data: NavData[]): Promise<void> {
    const cacheEntry = {
      data,
      cachedAt: new Date().toISOString(),
    };
    await this.navStore.setItem(fundCode, cacheEntry);
  }

  async getCachedFundNav(fundCode: string): Promise<NavData[] | null> {
    const cacheEntry = await this.navStore.getItem<{ data: NavData[]; cachedAt: string }>(fundCode);
    if (!cacheEntry) {
      return null;
    }
    return cacheEntry.data ?? null;
  }

  // 存储空间检查
  async getStorageInfo(): Promise<{ used: number; limit: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage ?? 0,
        limit: estimate.quota ?? 0,
      };
    }
    // Fallback: 无法获取估计值时返回 0
    return { used: 0, limit: 0 };
  }
}
