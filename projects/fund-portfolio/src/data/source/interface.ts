import type { FundInfo, NavData, FundType } from '../../core/types';

/**
 * 基金数据源接口
 * 用于从API获取基金搜索、净值历史等数据
 */
export interface IFundDataSource {
  /**
   * 搜索基金（代码/名称模糊匹配）
   * @param keyword 搜索关键词
   * @returns 匹配的基金列表
   */
  searchFunds(keyword: string): Promise<FundInfo[]>;

  /**
   * 获取基金净值历史数据
   * @param fundCode 基金代码
   * @param startDate 开始日期 (YYYY-MM-DD)
   * @param endDate 结束日期 (YYYY-MM-DD)
   * @returns 净值数据数组
   */
  getFundNav(
    fundCode: string,
    startDate: string,
    endDate: string
  ): Promise<NavData[]>;

  /**
   * 获取基准指数数据
   * @param indexCode 指数代码
   * @param startDate 开始日期 (YYYY-MM-DD)
   * @param endDate 结束日期 (YYYY-MM-DD)
   * @returns 指数数据数组
   */
  getBenchmarkData(
    indexCode: string,
    startDate: string,
    endDate: string
  ): Promise<NavData[]>;
}

/**
 * 基金搜索结果
 */
export interface FundSearchResult {
  /** 基金代码 */
  code: string;
  /** 基金名称 */
  name: string;
  /** 基金类型 */
  type: FundType;
  /** 拼音首字母，用于搜索 */
  pinyin?: string;
}

/**
 * API 响应格式
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 搜索API响应数据
 */
export interface SearchApiData {
  funds: FundSearchResult[];
  total: number;
}

/**
 * 净值API响应数据
 */
export interface NavApiData {
  code: string;
  name: string;
  navList: Array<{
    date: string;
    nav: number;
    accNav: number;
  }>;
}

/**
 * 数据源错误类型
 */
export class DataSourceError extends Error {
  readonly code: 'NETWORK_ERROR' | 'HTTP_ERROR' | 'PARSE_ERROR' | 'API_ERROR' | 'TIMEOUT_ERROR';
  readonly statusCode?: number;
  readonly originalError?: unknown;

  constructor(
    message: string,
    code: 'NETWORK_ERROR' | 'HTTP_ERROR' | 'PARSE_ERROR' | 'API_ERROR' | 'TIMEOUT_ERROR',
    statusCode?: number,
    originalError?: unknown
  ) {
    super(message);
    this.name = 'DataSourceError';
    this.code = code;
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

/**
 * 缓存配置
 */
export interface CacheConfig {
  /** 缓存有效期（毫秒） */
  ttl: number;
  /** 是否启用缓存 */
  enabled: boolean;
}

/** 默认缓存配置：1天 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 24 * 60 * 60 * 1000, // 24小时
  enabled: true,
};
