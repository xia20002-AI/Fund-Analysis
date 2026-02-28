import { useCallback } from 'react';
import type { PortfolioConfig, AnalysisResult, NavData, NavPoint } from '../core/types';
import { PortfolioCalculator } from '../core/calculator';
import { ReturnsCalculator } from '../core/calculator/returns';
import { RiskCalculator } from '../core/calculator/risk';
import { BenchmarkCalculator } from '../core/calculator/benchmark';
import { CorrelationCalculator } from '../core/calculator/correlation';
import { WebDataSource } from '../data/source';
import { usePortfolioStore } from '../stores/portfolioStore';
import { useErrorHandler } from './useErrorHandler';

export const useAnalysis = () => {
  const { setAnalysisResult, setIsAnalyzing } = usePortfolioStore();
  const { handleError } = useErrorHandler();
  const dataSource = new WebDataSource();
  
  const runAnalysis = useCallback(async (config: PortfolioConfig) => {
    setIsAnalyzing(true);
    
    try {
      // 1. 获取所有基金净值数据
      const navDataMap = new Map<string, NavData[]>();
      for (const fund of config.funds) {
        const navData = await dataSource.getFundNav(
          fund.code,
          config.startDate,
          config.endDate
        );
        navDataMap.set(fund.code, navData);
      }
      
      // 2. 计算组合净值曲线
      const navCurve = PortfolioCalculator.calculatePortfolioNav(
        config,
        navDataMap
      );
      
      // 3. 计算收益率指标
      const returnMetrics = ReturnsCalculator.calculateAllMetrics(navCurve);
      
      // 4. 计算风险指标
      const riskMetrics = RiskCalculator.calculateAllMetrics(navCurve);
      
      // 5. 计算回撤曲线
      const drawdownCurve = RiskCalculator.calculateDrawdownCurve(navCurve);
      
      // 6. 计算夏普比率
      const sharpeRatio = BenchmarkCalculator.calculateSharpeRatio(
        returnMetrics.annualizedReturn,
        riskMetrics.volatility
      );
      
      // 7. 计算相关性矩阵 - 提取每只基金的日收益率序列
      const fundReturns = new Map<string, number[]>();
      for (const fund of config.funds) {
        const fundNavData = navDataMap.get(fund.code);
        if (fundNavData) {
          // 构建该基金的 NavPoint 数组以计算日收益率
          const fundNavPoints: NavPoint[] = fundNavData.map((nav, index) => ({
            date: nav.date,
            value: nav.nav,
            return: index === 0 ? 0 : (nav.nav / fundNavData[index - 1].nav - 1) * 100
          }));
          const dailyReturns = ReturnsCalculator.calculateDailyReturns(fundNavPoints);
          fundReturns.set(fund.code, dailyReturns);
        }
      }
      
      const correlation = fundReturns.size >= 2 
        ? CorrelationCalculator.calculateCorrelationMatrix(fundReturns)
        : undefined;
      
      // 组装结果
      const result: AnalysisResult = {
        portfolio: config,
        navCurve,
        drawdownCurve,
        returnMetrics,
        riskMetrics,
        riskAdjusted: { 
          sharpeRatio,
          calmarRatio: riskMetrics.maxDrawdown > 0 
            ? BenchmarkCalculator.calculateCalmarRatio(
                returnMetrics.annualizedReturn,
                riskMetrics.maxDrawdown
              )
            : undefined
        },
        benchmark: {
          benchmarkCode: '000300',
          benchmarkName: '沪深300',
          benchmarkReturn: 0,
          excessReturn: 0
        },
        correlation,
      };
      
      setAnalysisResult(result);
    } catch (error) {
      handleError(error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [setAnalysisResult, setIsAnalyzing, handleError]);
  
  return { runAnalysis };
};
