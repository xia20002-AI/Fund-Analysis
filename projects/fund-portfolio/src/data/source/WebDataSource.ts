import type { IFundDataSource, FundSearchResult } from './interface';
import type { FundInfo, NavData } from '../../core/types';
import { DataSourceError, DEFAULT_CACHE_CONFIG } from './interface';
import { IndexedDBStorage } from '../storage/IndexedDBStorage';

// 自建 API 代理（避免浏览器跨域问题）
const API_BASE = '/api/fund';

/**
 * Web 数据源实现
 * 通过 HTTP API 获取基金数据，支持本地缓存
 */
export class WebDataSource implements IFundDataSource {
  private storage: IndexedDBStorage;
  private fetchTimeout: number;

  constructor(options?: { fetchTimeout?: number }) {
    this.storage = new IndexedDBStorage();
    this.fetchTimeout = options?.fetchTimeout ?? 30000; // 默认30秒超时
  }

  /**
   * 搜索基金
   * 支持代码精确匹配（6位数字）和名称模糊匹配
   */
  async searchFunds(keyword: string): Promise<FundInfo[]> {
    if (!keyword || keyword.trim().length === 0) {
      return [];
    }

    const trimmedKeyword = keyword.trim();
    const isCodeSearch = /^\d{6}$/.test(trimmedKeyword);

    try {
      const response = await this.fetchJson<{
        success: boolean;
        data?: { funds: FundSearchResult[]; total: number };
        error?: string;
      }>(
        `${API_BASE}/search?keyword=${encodeURIComponent(trimmedKeyword)}`
      );

      if (!response.success || !response.data) {
        throw new DataSourceError(
          response.error || '搜索基金失败',
          'API_ERROR'
        );
      }

      let results = response.data.funds;

      // 如果是代码搜索（6位数字），精确匹配
      if (isCodeSearch) {
        results = results.filter((f) => f.code === trimmedKeyword);
      }

      // 转换为 FundInfo 格式
      return results.map((fund) => ({
        code: fund.code,
        name: fund.name,
        type: fund.type,
      }));
    } catch (error) {
      if (error instanceof DataSourceError) {
        throw error;
      }
      throw new DataSourceError(
        `搜索基金失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'NETWORK_ERROR',
        undefined,
        error
      );
    }
  }

  /**
   * 获取基金净值历史数据
   * 优先从缓存读取，缓存未命中或过期则调用API
   */
  async getFundNav(
    fundCode: string,
    startDate: string,
    endDate: string
  ): Promise<NavData[]> {
    if (!fundCode || !startDate || !endDate) {
      throw new DataSourceError(
        '参数不完整: 需要提供 fundCode, startDate, endDate',
        'API_ERROR'
      );
    }

    // 1. 先尝试从缓存获取
    if (DEFAULT_CACHE_CONFIG.enabled) {
      const cachedData = await this.getCachedNavData(fundCode, startDate, endDate);
      if (cachedData) {
        return cachedData;
      }
    }

    // 2. 缓存未命中，调用API
    try {
      const response = await this.fetchJson<{
        success: boolean;
        data?: {
          code: string;
          name: string;
          navList: Array<{
            date: string;
            nav: number;
            accNav: number;
          }>;
        };
        error?: string;
      }>(
        `${API_BASE}/nav?code=${encodeURIComponent(fundCode)}&start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`
      );

      if (!response.success || !response.data) {
        throw new DataSourceError(
          response.error || `获取基金 ${fundCode} 净值数据失败`,
          'API_ERROR'
        );
      }

      // 3. 数据格式转换并按日期升序排列
      const navData: NavData[] = response.data.navList
        .map((item) => ({
          fundCode: response.data!.code,
          date: item.date,
          nav: item.nav,
          accNav: item.accNav,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // 4. 存入缓存
      await this.storage.cacheFundNav(fundCode, navData);

      return navData;
    } catch (error) {
      if (error instanceof DataSourceError) {
        throw error;
      }
      throw new DataSourceError(
        `获取基金净值失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'NETWORK_ERROR',
        undefined,
        error
      );
    }
  }

  /**
   * 获取基准指数数据
   * 实现逻辑与 getFundNav 类似
   */
  async getBenchmarkData(
    indexCode: string,
    startDate: string,
    endDate: string
  ): Promise<NavData[]> {
    if (!indexCode || !startDate || !endDate) {
      throw new DataSourceError(
        '参数不完整: 需要提供 indexCode, startDate, endDate',
        'API_ERROR'
      );
    }

    // 基准数据也使用缓存，缓存key加上 benchmark: 前缀（预留，当前未使用）
    // const cacheKey = `benchmark:${indexCode}`;

    // 1. 尝试从缓存获取
    if (DEFAULT_CACHE_CONFIG.enabled) {
      const cachedData = await this.getCachedBenchmarkData(indexCode, startDate, endDate);
      if (cachedData) {
        return cachedData;
      }
    }

    // 2. 缓存未命中，调用API
    try {
      const response = await this.fetchJson<{
        success: boolean;
        data?: {
          code: string;
          name: string;
          navList: Array<{
            date: string;
            nav: number;
            accNav: number;
          }>;
        };
        error?: string;
      }>(
        `${API_BASE}/benchmark?code=${encodeURIComponent(indexCode)}&start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`
      );

      if (!response.success || !response.data) {
        throw new DataSourceError(
          response.error || `获取基准 ${indexCode} 数据失败`,
          'API_ERROR'
        );
      }

      // 3. 数据格式转换并按日期升序排列
      const navData: NavData[] = response.data.navList
        .map((item) => ({
          fundCode: response.data!.code,
          date: item.date,
          nav: item.nav,
          accNav: item.accNav,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // 存入缓存（使用特殊key区分）
      // 缓存逻辑待实现，当前直接返回数据
      // const cacheEntry = { data: navData, cachedAt: new Date().toISOString() };

      return navData;
    } catch (error) {
      if (error instanceof DataSourceError) {
        throw error;
      }
      throw new DataSourceError(
        `获取基准数据失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'NETWORK_ERROR',
        undefined,
        error
      );
    }
  }

  /**
   * 私有方法：从缓存获取基金净值数据
   * 检查缓存是否存在且在有效期内
   */
  private async getCachedNavData(
    fundCode: string,
    startDate: string,
    endDate: string
  ): Promise<NavData[] | null> {
    try {
      const cached = await this.storage.getCachedFundNav(fundCode);
      if (!cached || cached.length === 0) {
        return null;
      }

      // 检查缓存是否过期
      // 注意：这里我们简化处理，假设缓存数据是完整的
      // 实际生产环境应该检查缓存数据的日期范围是否覆盖请求范围

      // 过滤出请求日期范围内的数据
      const filtered = cached.filter(
        (item) => item.date >= startDate && item.date <= endDate
      );

      // 如果过滤后的数据为空，说明缓存数据不覆盖请求范围，返回null重新获取
      if (filtered.length === 0) {
        return null;
      }

      return filtered;
    } catch {
      // 缓存读取失败，返回null让调用方重新获取
      return null;
    }
  }

  /**
   * 私有方法：从缓存获取基准数据
   */
  private async getCachedBenchmarkData(
    indexCode: string,
    startDate: string,
    endDate: string
  ): Promise<NavData[] | null> {
    // 基准数据使用特殊前缀存储
    try {
      const cached = await this.storage.getCachedFundNav(`benchmark:${indexCode}`);
      if (!cached || cached.length === 0) {
        return null;
      }

      const filtered = cached.filter(
        (item) => item.date >= startDate && item.date <= endDate
      );

      if (filtered.length === 0) {
        return null;
      }

      return filtered;
    } catch {
      return null;
    }
  }

  /**
   * 私有方法：fetch 封装，统一错误处理
   * 处理网络错误、HTTP错误、JSON解析错误、超时
   */
  private async fetchJson<T>(url: string): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.fetchTimeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);

      // 检查 HTTP 状态码
      if (!response.ok) {
        throw new DataSourceError(
          `HTTP 错误: ${response.status} ${response.statusText}`,
          'HTTP_ERROR',
          response.status
        );
      }

      // 解析 JSON
      let data: T;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new DataSourceError(
          'JSON 解析错误: 响应格式无效',
          'PARSE_ERROR',
          undefined,
          parseError
        );
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      // 处理 AbortError（超时）
      if (error instanceof Error && error.name === 'AbortError') {
        throw new DataSourceError(
          `请求超时 (${this.fetchTimeout}ms)`,
          'TIMEOUT_ERROR'
        );
      }

      // 处理网络错误
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new DataSourceError(
          '网络错误: 无法连接到服务器',
          'NETWORK_ERROR',
          undefined,
          error
        );
      }

      // 如果是已封装的 DataSourceError，直接抛出
      if (error instanceof DataSourceError) {
        throw error;
      }

      // 其他错误
      throw new DataSourceError(
        `请求失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'NETWORK_ERROR',
        undefined,
        error
      );
    }
  }
}
