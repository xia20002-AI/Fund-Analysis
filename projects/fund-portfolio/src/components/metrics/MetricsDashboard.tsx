import React from 'react';
import { MetricCard } from './MetricCard';
import { AnalysisResult } from '../../core/types';

interface MetricsDashboardProps {
  result: AnalysisResult;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ result }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <MetricCard
        title="年化收益"
        value={result.returnMetrics.annualizedReturn}
        type="return"
        description="几何平均年化收益率"
      />
      <MetricCard
        title="最大回撤"
        value={result.riskMetrics.maxDrawdown}
        type="risk"
        description={`${result.riskMetrics.maxDrawdownStart} 至 ${result.riskMetrics.maxDrawdownEnd}`}
      />
      <MetricCard
        title="夏普比率"
        value={result.riskAdjusted.sharpeRatio}
        unit=""
        type="ratio"
        description="(年化收益 - 无风险利率) / 波动率"
      />
      <MetricCard
        title="年化波动率"
        value={result.riskMetrics.volatility}
        type="volatility"
        description="日收益率标准差 × √252"
      />
    </div>
  );
};
