export interface IStorage {
  // 组合配置存储
  savePortfolio(id: string, config: PortfolioConfig): Promise<void>;
  getPortfolio(id: string): Promise<PortfolioConfig | null>;
  getAllPortfolios(): Promise<Map<string, PortfolioConfig>>;
  deletePortfolio(id: string): Promise<void>;

  // 基金数据缓存
  cacheFundNav(fundCode: string, data: NavData[]): Promise<void>;
  getCachedFundNav(fundCode: string): Promise<NavData[] | null>;

  // 存储空间检查
  getStorageInfo(): Promise<{ used: number; limit: number }>;
}

export interface PortfolioConfig {
  id: string;
  name: string;
  funds: Array<{
    code: string;
    name: string;
    weight: number;
  }>;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface NavData {
  fundCode: string;
  date: string;
  nav: number;
  accNav: number;
}
