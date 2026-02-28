import React from 'react';
import { usePortfolioStore } from '../stores/portfolioStore';
import { NavChart } from '../components/charts/NavChart';
import { DrawdownChart } from '../components/charts/DrawdownChart';
import { CorrelationHeatmap } from '../components/charts/CorrelationHeatmap';
import { MetricsDashboard } from '../components/metrics/MetricsDashboard';

export const ResultPanel: React.FC = () => {
  const { analysisResult, isAnalyzing } = usePortfolioStore();
  
  if (isAnalyzing) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">正在分析...</p>
        </div>
      </div>
    );
  }
  
  if (!analysisResult) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <p className="text-gray-400">请配置组合并点击"开始分析"</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* 指标仪表盘 */}
      <section>
        <h3 className="text-lg font-semibold mb-4">风险收益指标</h3>
        <MetricsDashboard result={analysisResult} />
      </section>
      
      {/* 净值曲线 */}
      <section>
        <h3 className="text-lg font-semibold mb-4">净值走势</h3>
        <NavChart 
          portfolioNav={analysisResult.navCurve}
          height={400}
        />
      </section>
      
      {/* 回撤图 */}
      <section>
        <h3 className="text-lg font-semibold mb-4">动态回撤</h3>
        <DrawdownChart 
          drawdownData={analysisResult.drawdownCurve}
          maxDrawdownStart={analysisResult.riskMetrics.maxDrawdownStart}
          maxDrawdownEnd={analysisResult.riskMetrics.maxDrawdownEnd}
          height={300}
        />
      </section>
      
      {/* 相关性热力图 */}
      {analysisResult.correlation && (
        <section>
          <h3 className="text-lg font-semibold mb-4">相关性矩阵</h3>
          <CorrelationHeatmap matrix={analysisResult.correlation} height={350} />
        </section>
      )}
    </div>
  );
};
